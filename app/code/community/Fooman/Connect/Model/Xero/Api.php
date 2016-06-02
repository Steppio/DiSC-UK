<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_Xero_Api
{

    const URL_ROOT = 'https://api.xero.com';
    const API_VERSION = 'version/2';

    //Entry points for Fooman Connect: Xero
    const BASE_URL = '/api.xro/2.0/';
    const ORGANISATION_PATH = 'Organisation';
    const INVOICE_PATH = "Invoice";
    const INVOICES_PATH = "Invoices";
    const CREDITNOTES_PATH = "CreditNotes";
    const PAYMENTS_PATH = "Payments";
    const CONTACTS_PATH = "Contacts";
    const TRACKING_PATH = "TrackingCategories";
    const ACCOUNTS_PATH = "Accounts";
    const TAXRATES_PATH = "TaxRates";
    const ITEMS = "Items";
    const XERO_INVOICE_LINK = "https://go.xero.com/AccountsReceivable/View.aspx?InvoiceID=";
    const XERO_CREDITNOTE_LINK= 'https://go.xero.com/AccountsReceivable/ViewCreditNote.aspx?creditNoteID=';

    protected $_clients = array();
    protected $_storeId = Mage_Catalog_Model_Abstract::DEFAULT_STORE_ID;

    public function setStoreId($storeId)
    {
        $this->_storeId = $storeId;
        return $this;
    }

    public function getStoreId()
    {
        return $this->_storeId;
    }

    /**
     * Get configuration settings to work with Xero's Oauth
     *
     * @param   $storeId
     *
     * @return array
     * @throws Exception
     */
    public function getConfiguration($storeId)
    {
        try {
            $rsaPrivateKey = new Zend_Crypt_Rsa_Key_Private(
                Mage::helper('core')->decrypt(
                    Mage::getStoreConfig('foomanconnect/settings/privatekey', $storeId)
                ),
                Mage::helper('core')->decrypt(
                    Mage::getStoreConfig('foomanconnect/settings/privatekeypassword', $storeId)
                )
            );
        } catch (Exception $e) {
            Mage::throwException('Private Key error: ' . $e->getMessage() . openssl_error_string());
        }
        return array(
            'useragent' => 'Fooman Magento',
            'siteUrl' => self::URL_ROOT,
            'signatureMethod' => 'RSA-SHA1',
            'consumerKey' => Mage::helper('core')->decrypt(
                Mage::getStoreConfig('foomanconnect/settings/consumerkey', $storeId)
            ),
            'consumerSecret' => Mage::helper('core')->decrypt(
                Mage::getStoreConfig('foomanconnect/settings/consumersecret', $storeId)
            ),
            'requestTokenUrl' => self::URL_ROOT . '/oauth/RequestToken',
            'accessTokenUrl' => self::URL_ROOT . '/oauth/AccessToken',
            'authorizeUrl' => self::URL_ROOT . '/oauth/Authorize',
            'rsaPrivateKey' => $rsaPrivateKey
        );
    }

    /**
     * @param int $storeId
     *
     * @return Zend_Oauth_Client
     */
    public function getClientForStore($storeId = null)
    {
        if (null === $storeId) {
            $storeId = $this->getStoreId();
        }

        if (!isset($this->_clients[$storeId])) {
            try {
                $configuration = $this->getConfiguration($storeId);
                $xeroAccessToken = new Zend_Oauth_Token_Access();
                $xeroAccessToken->setToken($configuration['consumerKey']);
                $xeroAccessToken->setTokenSecret($configuration['consumerSecret']);
                $httpclient = $xeroAccessToken
                    ->getHttpClient($configuration)
                    ->setHeaders('Accept', 'application/json');
                $httpclient->setAdapter(new Zend_Http_Client_Adapter_Curl());
                $this->_clients[$storeId] = $httpclient;
            } catch (Exception $e) {
                Mage::throwException($e->getMessage());
            }
        }
        return $this->_clients[$storeId];
    }

    /**
     *
     * construct complete URL from given entrypoint
     *
     * @param string $endpoint
     *
     * @return string
     */
    public function getApiUrl($endpoint = '')
    {
        return self::URL_ROOT . self::BASE_URL . $endpoint;
    }

    public function sendData($entryPoint, $method = Zend_Http_Client::GET, $data = false)
    {
        $client = $this->getClientForStore()->resetParameters();
        if ($data && ($method == Zend_Http_Client::POST || $method == Zend_Http_Client::PUT)) {
            $client->setParameterPost('xml', $data);
        }
        //turn off acceptance of gzipped content as some servers might not be able to unzip
        //$client->setHeaders('Accept-encoding', 'identity');
        $client->setUri($this->getApiUrl($entryPoint));
        $response = $client->request($method);
        return $this->handleResponse($response);
    }

    public function getInvoice($xeroInvoiceId)
    {
        $result = $this->sendData(self::INVOICES_PATH.'/'.$xeroInvoiceId);
        return $result;
    }

    public function getPaymentsForInvoice($xeroInvoiceId)
    {
        $invoice = $this->getInvoice($xeroInvoiceId);
        $returnArray = array();

        if ($invoice) {
            if (isset($invoice['Invoices'][0]['Payments'])) {
                foreach ($invoice['Invoices'][0]['Payments'] as $payment) {
                    $returnArray['payments'][] = array(
                        'date'   => strtotime($payment['Date']),
                        'amount' => $payment['Amount']
                    );
                }
            }
            $returnArray['amountDue'] = Mage::app()->getStore()->formatPrice(($invoice['Invoices'][0]['AmountDue']));
        }
        return $returnArray;
    }

    public function getAccounts()
    {
        $result = $this->sendData(self::ACCOUNTS_PATH);
        if (isset ($result['Accounts'])) {
            return $result['Accounts'];
        }
    }

    public function getOrganisations()
    {
        $result = $this->sendData(self::ORGANISATION_PATH);
        if (isset ($result['Organisations'])) {
            return $result['Organisations'];
        }
    }

    public function getOrganisation()
    {
        $result = $this->getOrganisations();
        if (isset ($result['Organisation'])) {
            return $result['Organisation'];
        }
        //return value contradicts Xero documentation - should be $result['Organisation']
        if (isset ($result['0'])) {
            return $result['0'];
        }
    }

    public function getTrackingCategories()
    {
        $result = $this->sendData(self::TRACKING_PATH);
        if (isset ($result['TrackingCategories'])) {
            return $result['TrackingCategories'];
        }
    }

    public function getTaxRates()
    {
        $result = $this->sendData(self::TAXRATES_PATH);
        if (isset ($result['TaxRates'])) {
            return $result['TaxRates'];
        }
    }

    /**
     * error checking of response returned by server
     *
     * @param Zend_Http_Response $response
     *
     * @throws Mage_Core_Exception|Fooman_Connect_Exception
     * @return array
     */
    public function handleResponse($response = null)
    {
        if ($response === null) {
            Mage::throwException("Empty Response. Please check your settings.");
        }
        if (!$response instanceof Zend_Http_Response) {
            Mage::throwException("Wrong Response. Please check your settings.");
        }
        $responseBody = $response->getBody();
        if (!$responseBody) {
            Mage::throwException("Please use a valid ApiKey and Save Config");
        }
        if (strpos($responseBody, 'oauth_problem') === 0) {
            Mage::throwException(Mage::helper('foomanconnect')->__('Oauth error: %s', $responseBody));
        }
        try {
            $result = json_decode($responseBody, true);
        } catch (Exception $e) {
            Mage::helper('foomanconnect')->debug($responseBody);
            Mage::helper('foomanconnect')->debug($e->getMessage());
            Mage::throwException("Result is not a valid response.");
        }

        if (isset($result['ErrorNumber'])) {
            Mage::helper('foomanconnect')->debug($result);
            $collectedErrors = $this->_getErrorsFromResult($result);
            $exception = new Fooman_Connect_Exception($result['Message']);
            if ($collectedErrors) {
                $exception->setXeroErrors($collectedErrors);
            }
            throw $exception;
        }
        return $result;
    }

    protected function _getErrorsFromResult($result)
    {
        $res = array();
        $res[] = $result['Message'];
        if (isset($result['Elements'])) {
            foreach ($result['Elements'] as $elements) {
                if (isset($elements['ValidationErrors'])) {
                    foreach ($elements['ValidationErrors'] as $error) {
                        $res[] = $error['Message'];
                    }
                }
            }
        }
        return $res;
    }
}

<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Adminhtml_Xero_AuthController extends Mage_Adminhtml_Controller_Action
{

    /**
     * @return boolean
     */
    protected function _isAllowed()
    {
        return Mage::getSingleton('admin/session')->isAllowed('system/config/foomanconnect');
    }

    protected $_session;

    protected function _construct()
    {
        $this->setUsedModuleName('Fooman_Connect');
    }

    public function createKeysAction()
    {

        if (!Mage::getStoreConfig('foomanconnect/settings/privatekey')) {
            try {
                $dn = array(
                    'private_key_bits' => 2048
                );
                $privKeyRessource = openssl_pkey_new($dn);
                if (!$privKeyRessource) {
                    Mage::throwException(
                        Mage::helper('foomanconnect')->__(
                            'Couldn\'t create private key - please check your server\'s and php\'s openssl configuration: %s',
                            openssl_error_string()
                        )
                    );
                }
                openssl_pkey_export($privKeyRessource, $privatekey);
                if (empty($privatekey)) {
                    Mage::throwException(
                        Mage::helper('foomanconnect')->__(
                            'Couldn\'t create private key - please check your server\'s and php\'s openssl configuration: %s',
                            openssl_error_string()
                        )
                    );
                }
                $privatekey = Mage::helper('core')->encrypt($privatekey);
                Mage::helper('foomanconnect/config')->setMageStoreConfig('privatekey', $privatekey);
            } catch (Exception $e) {
                Mage::getSingleton('adminhtml/session')->addError('Error ' . $e->getMessage());
            }
        }

        //go back to the Fooman Connect > Xero page
        $this->_redirect('adminhtml/xero_order');
    }

    public function downloadPublicKeyAction()
    {

        $privateKey = Mage::getStoreConfig('foomanconnect/settings/privatekey');
        if (!$privateKey) {
            Mage::getSingleton('adminhtml/session')->addError(
                Mage::helper('foomanconnect')->__('A Private Key is required before generating a Public Key.')
                . Mage::helper('foomanconnect')->__(
                    'You can create a Private Key by clicking <a href="%s">here</a>.',
                    Mage::helper('adminhtml')->getUrl('adminhtml/xero_auth/createKeys')
                )
            );
        } else {
            $privateKeyResource = openssl_pkey_get_private(Mage::helper('core')->decrypt($privateKey));

            $dn = array(
                "countryName"            => Mage::getStoreConfig('general/country/default'),
                "stateOrProvinceName"    => Mage::getStoreConfig('general/country/default'),
                "organizationName"       => Mage::app()->getStore()->getName(),
                "organizationalUnitName" => "Magento Xero Integration by Fooman",
                "commonName"             => str_replace(
                    array('https://', 'http://'), '', Mage::getStoreConfig('web/unsecure/base_url')
                ),
                "emailAddress"           => Mage::getSingleton('admin/session')->getUser()->getEmail()
            );
            $csrResource = openssl_csr_new($dn, $privateKeyResource);
            $cert = openssl_csr_sign($csrResource, null, $privateKeyResource, 3650);
            openssl_x509_export($cert, $publicKey);
            return $this->_prepareDownloadResponse('publickey.cer', $publicKey, 'application/x-x509-ca-cert');
        }

        //go back to the Fooman Connect > Xero page
        $this->_redirect('adminhtml/xero_order');
    }
}

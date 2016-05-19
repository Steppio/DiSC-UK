<?php
/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/osl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * @category    Yoma
 * @package     Yoma_Realex
 * @copyright   Copyright (c) 2014 YOMA LIMITED (http://www.yoma.co.uk)
 * @license     http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */
class Yoma_Realex_Model_Payment_Redirect_EditPayer extends Yoma_Realex_Model_Payment_Redirect{

    protected $_code = 'redirect';
    protected $_allowedMethods = array('editPayer');
    protected $_method = 'editPayer';
    protected $_action = 'editPayer';
    protected $_mpiData = array();

    /**
     * Start transaction with payment gateway
     *
     * @return $this|mixed
     * @throws Exception
     */
    protected function _pay(){

        $this->_method = $this->_method;
        $this->_action = $this->_action;
        $this->_setMessage($this->_method);
        $this->_setResponse($this->_method);

        $this->_prepareEditPayer();

        $this->_send(
            $this->_getServiceUrl(),
            $this->_message->prepareMessage()
        );

        $this->_response->isValid();
        $this->_response->processResult();

        return $this;

    }

    /**
     * Prepare transaction request edit payer
     *
     * @return $this
     */
    protected function _prepareEditPayer() {

        $token = $this->_service->getToken();

        if(!$token->getId()){
            throw new Exception($this->__('Token not valid'));
        }

        $customer = mage::getModel('customer/customer')->load($token->getCustomerId());

        if(!$customer->getId()){
            throw new Exception($this->__('Customer not valid'));
        }

        $address = $customer->getPrimaryBillingAddress();
        if (!$address->getId()){
            throw new Exception($this->__('Customer Address not valid'));
        }

        $request = array(
            'attributes' => array(
                'timestamp' => $this->_getHelper()->getTimestamp(),
                'type'      => 'payer-edit'
            ),
            'merchantid' => array('value' => $this->_getHelper()->getConfigData('realex', 'vendor')),
            'orderid' => array('value' => $this->_getHelper()->getEditPayerReference($customer->getId()) . '-payer')
        );

        $payer = array(
            'attributes' => array(
                'ref' => $customer->getRealexPayerRef(),
                'type'=> $this->_getHelper()->getConfigData('realvault','payer_type')
            ),
            'firstname' => array('value' => $customer->getFirstname()),
            'surname' => array('value' => $customer->getLastname()),
            'email' => array('value' => $customer->getEmail())
        );

        $payerAddress = array(

            'line1' => array('value' => $address->getStreet(1)),
            'line2' => array('value' => $address->getStreet(2)),
            'line3' => array('value' => $address->getStreet(3)),
            'city' => array('value' => $address->getCity()),
            'county'=> array('value' => $address->getRegion()),
            'postcode' => array('value' => $address->getPostcode()),
            'country' => array(
                'attributes' => array(
                    'code' => $address->getCountryId()
                ),
                'value' => Mage::app()->getLocale()->getCountryTranslation($address->getCountryId())
            )
        );

        $payer['address'] = $payerAddress;
        $request['payer'] = $payer;

        $sha1hash = array(
            $request['attributes']['timestamp'] ,
            $request['merchantid']['value'],
            $request['orderid']['value'],
            '',
            '',
            $request['payer']['attributes']['ref'],
        );

        $request['sha1hash'] = array('value' => $this->_getHelper()->generateSha1Hash($this->_getHelper()->getConfigData('realex','secret'),$sha1hash));

        $this->_message->setData(array('request'=>$request));
        return $this;
    }
}
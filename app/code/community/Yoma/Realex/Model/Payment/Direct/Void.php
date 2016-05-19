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
class Yoma_Realex_Model_Payment_Direct_Void extends Yoma_Realex_Model_Payment_Direct{

    protected $_code = 'direct';
    protected $_method = 'void';
    protected $_action = 'void';
    protected $_allowedMethods = array('void');


    /**
     * Create reference for current transaction.
     *
     * @param Varien_Object $payment
     * @return String
     */
    public function getTransactionReference($payment){

        return $payment->getParentTransactionId() . '-void';
    }

    /**
     * Start transaction with payment gateway
     *
     * @return $this|mixed
     * @throws Exception
     */
    protected function _pay(){

        $this->_setMessage($this->_method);
        $this->_setResponse($this->_method);

        $this->_prepareVoid();

        $this->_send(
            $this->_getServiceUrl(),
            $this->_message->prepareMessage()
        );

        $this->_response->isValid();
        $this->_response->processResult();

        $this->addPaymentInfo(array(
            'Result' => $this->_response->getResult(),
            'Auth Code' => $this->_response->getAuthcode(),
            'Message' => $this->_response->getMessage(),
           'Transaction Reference' => $this->_response->getOrderid(),
            )
        );

    }

    /**
     * Prepare transaction request void
     *
     * @return $this
     */
    protected function _prepareVoid(){

        $payment = $this->_service->getPayment();
        $helper = $this->_getHelper();

        $request = array(
            'attributes' => array(
                'timestamp' => $helper->getTimestamp(),
                'type' => 'void'
            ),
            'merchantid' => array('value' => $helper->getConfigData('realex','vendor')),
            'account' => array('value' => $this->_getSubAccount($payment)),
            'orderid' => array('value' => $payment->getParentTransactionId()),
            'pasref' => array('value' => $this->_getTransactionData($payment,'pasref')),
            'authcode' => array('value' => $this->_getTransactionData($payment,'authcode'))
        );

        $sha1hash = array(
            $request['attributes']['timestamp'] ,
            $request['merchantid']['value'],
            $request['orderid']['value'],
            '',
            '',
            ''
        );

        $request['sha1hash'] = array('value' => $helper->generateSha1Hash($helper->getConfigData('realex','secret'),$sha1hash));

        $request['comments'] = $this->_addComments();

        $this->_message->setData(array('request'=>$request));
        return $this;
    }

    /**
     * @param string $serviceCode
     * @return string
     */
    protected function _getServiceUrl($serviceCode = null){
        return $this->_getHelper()->getConfigData($this->_service->getCode(),'live_url');
    }

}
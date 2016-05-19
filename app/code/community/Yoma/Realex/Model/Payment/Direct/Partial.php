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
class Yoma_Realex_Model_Payment_Direct_Partial extends Yoma_Realex_Model_Payment_Direct{

    protected $_code = 'direct';
    protected $_allowedMethods = array('partial');
    protected $_method = 'partial';
    protected $_action = 'partial';
    protected $_mpiData = array();
    protected $_useToken = null;
    protected $_captureType = 'partial';
    protected $_customer = NULL;

    /**
     * Create reference for current transaction.
     *
     * @param Varien_Object $payment
     * @return String
     */
    public function getTransactionReference($payment){

        return $payment->getParentTransactionId() . '-partial';
    }


    /**
     * Start transaction with payment gateway
     *
     * @return $this|mixed
     * @throws Exception
     */
    protected function _pay(){

        $this->_capture();
        return $this;

    }


    /**
     * Capture payment on gateway
     *
     * @param string $method
     * @throws Exception
     */
    protected function _capture($method = 'partial'){

        $this->_method = $this->_captureType;
        $this->_action = $this->_captureType;
        $this->_setMessage($this->_method);
        $this->_setResponse($this->_method);

        $this->_preparePartial();

        $this->_send(
            $this->_getServiceUrl(),
            $this->_message->prepareMessage()
        );

        $this->_response->isValid();

        Mage::dispatchEvent(
            'realex_before_process_response',
            array('method'=>$this->_method,'response'=>$this->_response->getData())
        );

        $this->_response->processResult();

        $this->addPaymentInfo(array(
            'Result' => $this->_response->getResult(),
            'Auth Code' => $this->_response->getAuthcode(),
            'Message' => $this->_response->getMessage(),
            'Transaction Reference' => $this->_response->getOrderid(),
            'CVN Result' => $this->_response->getCvnresult(),
            'AVS Address Result' => $this->_response->getAvsaddressresponse(),
            'AVS Postcode Result' => $this->_response->getAvspostcoderesponse(),
            'TSS Result' => $this->_response->getTssResult(),
            'Card Owner' => $this->_service->getCardOwner()
        ));

    }

    /**
     * Retrieve method code
     *
     * @param string $serviceCode
     * @return mixed
     */
    protected function _getServiceUrl($serviceCode = null){

        if(!isset($serviceCode)){
            $serviceCode = $this->_service->getCode();
        }

        return $this->_getHelper()->getConfigData($serviceCode,'live_url');
    }

}
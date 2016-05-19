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
class Yoma_Realex_Model_Api_Payment extends Mage_Payment_Model_Method_Cc {

    protected $_isGateway = true;
    protected $_canOrder = false;
    protected $_canAuthorize = false;
    protected $_canCapture = false;
    protected $_canCapturePartial = false;
    protected $_canRefund = false;
    protected $_canRefundInvoicePartial = false;
    protected $_canVoid = false;
    protected $_canUseInternal = false;
    protected $_canUseCheckout = true;
    protected $_canUseForMultishipping = false;
    protected $_isInitializeNeeded = false;
    protected $_canFetchTransactionInfo = false;
    protected $_canReviewPayment = true;
    protected $_canCreateBillingAgreement = false;
    protected $_canManageRecurringProfiles = false;
    protected $_canCancelInvoice = false;
    protected $_canSaveCc = false;
    protected $_isCcTypeRequired = false;
    protected $_canCallbackAccessSession = false;

    /**
     * Fields that should be replaced in debug with '***'
     *
     * @var array
     */
    protected $_debugReplacePrivateDataKeys = array(
        'sha1hash', 'SHA1HASH','md5hash','MD5HASH','refundhash'
       // 'sha1hash', 'SHA1HASH', 'card_number', 'card_cvn_number','md5hash','MD5HASH'
    );

    protected $_redirectUrl = NULL;

    /**
     * Set redirect url
     *
     * @param $url
     */
    public function setRedirectUrl($url) {

        $this->_redirectUrl = $url;
    }

    /**
     * Cancel payment method calls service method
     *
     * @param Varien_Object $payment
     * @param float $amount
     *
     */
    public function cancel(Varien_Object $payment) {

        parent::void($payment);
        $this->getService()->void($payment);

        return $this;
    }

    /**
     * Retrieve current service model
     *
     * @return Yoma_Realex_Model_Service_Absract
     *
     */
    public function getService() {
        if (is_null($this->_service)) {
            $this->_service = $this->_getService();
            $this->_service->setMethodInstance($this);
        }

        return $this->_service;
    }

    /**
     * Authorize payment method calls service method
     *
     * @param Varien_Object $payment
     * @param float $amount
     *
     */
    public function authorize(Varien_Object $payment, $amount) {
        parent::authorize($payment, $amount);
        $this->getService()->authorize($payment, $amount);

        return $this;
    }

    /**
     * Capture payment method calls service method
     *
     * @param Varien_Object $payment
     * @param float $amount
     *
     */
    public function capture(Varien_Object $payment, $amount) {
        parent::capture($payment, $amount);
        $this->getService()->capture($payment, $amount);

        return $this;
    }

    /**
     * Refund payment method calls service method
     *
     * @param Varien_Object $payment
     * @param float $amount
     *
     */
    public function refund(Varien_Object $payment, $amount) {
        parent::refund($payment, $amount);
        $this->getService()->refund($payment, $amount);

        return $this;
    }

    /**
     * Void payment method calls service method
     *
     * @param Varien_Object $payment
     *
     */
    public function void(Varien_Object $payment) {
        parent::void($payment);
        $this->getService()->void($payment);

        return $this;
    }

    /**
     * Assign card data
     *
     * @param mixed $data
     * @return $this|Mage_Payment_Model_Info
     */
    public function assignData($data) {
        if (!($data instanceof Varien_Object)) {
            $data = new Varien_Object($data);
        }
        $info = $this->getInfoInstance();

        // Check to see if we need to tokenize card
        $info->setRemembertoken((!is_null($data->getRemembertoken()) ? 1 : 0));

        // if set save token cvv to session
        if (!is_null($data->getTokenCvv())) {
            $this->getRealexSession()->setTokenCvv($data->getTokenCvv());
        }

        $info->setCcType($data->getCcType())
            ->setCcOwner($data->getCcOwner())
            ->setCcLast4(substr($data->getCcNumber(), -4))
            ->setCcNumber($data->getCcNumber())
            ->setCcCid($data->getCcCid())
            ->setCcExpMonth($data->getCcExpMonth())
            ->setCcExpYear($data->getCcExpYear())
            ->setCcSsIssue($data->getCcSsIssue())
            ->setCcSsStartMonth($data->getCcSsStartMonth())
            ->setCcSsStartYear($data->getCcSsStartYear())
            ->setRealexTokenCcId($data->getRealexTokenCcId());

        return $this;
    }

    public function getRealexSession() {

        return Mage::getSingleton('realex/session');
    }

    /**
     * Retrieve if Card Type Required
     *
     * @return boolean
     */
    public function getIsCcTypeRequired() {
        return $this->_isCcTypeRequired;
    }

    /**
     * Retrieve redirect url
     *
     * @return string
     */
    public function getOrderPlaceRedirectUrl() {
        // retrieve url from session
        $url = Mage::getSingleton('customer/session')->getRedirectUrl();
        Mage::getSingleton('customer/session')->setRedirectUrl(false);

        return $url;

    }

    /**
     * Add value to payment info array
     *
     * @param mixed $key
     * @param string $value
     * @return Yoma_Realex_Model_Api_Payment
     */
    public function addPaymentInfo($key, $value = '') {
        if (is_array($key)) {
            $this->_paymentInfo = array_merge($this->_paymentInfo, $key);
        } else {
            $this->_paymentInfo[$key] = $value;
        }

        return $this;
    }

    /**
     * Format date
     *
     * @param string $format
     * @return string
     */
    public function getDate($format = 'Y-m-d H:i:s') {
        return Mage::getModel('core/date')->date($format);
    }

    /**
     * Retrieve email address of logged in customer
     *
     * @return null
     */
    public function getCustomerLoggedEmail() {

        $s = Mage::getSingleton('customer/session');
        if ($s->getCustomerId()) {
            return $s->getCustomer()->getEmail();
        }

        return NULL;
    }

    /**
     * Set method code
     *
     * @param string $code
     * @return Yoma_Realex_Model_Api_Payment
     */
    public function setMcode($code) {

        $this->_code = $code;

        return $this;
    }

    /**
     * Retrieve client IP Address
     *
     * @return string
     */
    public function getClientIp() {

        return Mage::helper('core/http')->getRemoteAddr();
    }

    /**
     * Check if checkout multi shipping and current step overview
     *
     * @return bool
     */
    public function isMsOnOverview() {

        return ($this->_getQuote()->getIsMultiShipping() && $this->getMsActiveStep() == 'multishipping_overview');
    }

    /**
     * Retrieve Quote from session
     *
     * @return Mage_Sales_Model_Quote
     */
    protected function _getQuote() {

        return Mage::getSingleton('checkout/type_onepage')->getQuote();
    }

    /**
     * Retieve active multiShipping checkout step
     *
     * @return mixed
     */
    public function getMsActiveStep() {

        return Mage::getSingleton('checkout/type_multishipping_state')->getActiveStep();
    }

    /**
     * Get config payment action url
     * Used to universalize payment actions when processing payment place
     *
     * @return string
     */
    public function getConfigPaymentAction() {
        $transport = new varien_object();
        $transport->setPaymentAction($this->getConfigData('payment_action'));
        Mage::dispatchEvent('realex_config_payment_action', array('payment' => $this, 'transport' => $transport));

        return $transport->getPaymentAction();

    }

    public function getQuote() {

        return $this->_getQuote();
    }

    public function getDebugFlag() {
        return true;
    }

    /**
     * Log data to file
     *
     * @param mixed $debugData
     */
    protected function _debug($debugData) {
        // $logFile = 'payment_' . $this->getCode() . '.log';
        // // if live filter data
        // if ($this->_getHelper()->getConfigData($this->getCode(), 'mode') == 'live') {
        //     $debugData = $this->_filterDebugData($debugData);
        // }
        // var_dump($debugData);
        // die();

        // Realex_Log::log($debugData, NULL, $logFile);
    }

    /**
     * Obfuscate data
     *
     * @param array $debugData
     * @return array
     */
    protected function _filterDebugData($debugData) {

        if (is_array($debugData) && is_array($this->_debugReplacePrivateDataKeys)) {
            foreach ($debugData as $key => $value) {
                if (in_array($key, $this->_debugReplacePrivateDataKeys)) {
                    $temp = NULL;
                    for ($i = 0; $i < strlen($debugData[$key]); $i++) {
                        $temp .= '*';
                    }
                    $debugData[$key] = $temp;
                } else {
                    if (is_array($debugData[$key])) {
                        $debugData[$key] = $this->_filterDebugData($debugData[$key]);
                    }
                }
            }
        }

        return $debugData;
    }

    /**
     * Set current response object
     *
     * @param Yoma_Realex_Model_Response_Abstract $response
     * @return $this|Yoma_Realex_Model_Response_Abstract
     */
    protected function _setResponse($response) {
        $this->_response = $response;

        return $this;
    }

    /**
     * Retrieve response object
     *
     * @return Yoma_Realex_Model_Response_Abstract
     */
    protected function _getResponse() {
        return $this->_response;
    }

    /**
     * @return false|Mage_Core_Model_Abstract
     */
    protected function _getCoreUrl() {
        return Mage::getModel('core/url');
    }

    /**
     * @return Mage_Core_Helper_Abstract
     */
    protected function _getCoreHelper() {

        return Mage::helper('core');
    }

    /**
     * @return Mage_Core_Helper_Abstract
     */
    protected function realexHelper() {

        return Mage::helper('realex');
    }

    /**
     * @param Varien_Object $payment
     * @return $this
     */
    protected function _setPayment(Varien_Object $payment) {
        $this->_payment = $payment;

        return $this;
    }

    protected function _getPayment() {
        return $this->_payment;
    }

    /**
     * @param Varien_Object $order
     * @return $this
     */
    protected function _setOrder(Varien_Object $order) {
        $this->_order = $order;

        return $this;
    }

    protected function _getOrder() {
        return $this->_order;
    }

    /**
     * @param Yoma_Realex_Model_Transaction $transaction
     * @return $this
     */
    protected function _setTransaction(Yoma_Realex_Model_Transaction $transaction) {
        $this->_transaction = $transaction;

        return $this;
    }

    protected function _getTransaction() {
        return $this->_transaction;
    }

    protected function _setTransactionReference($transactionReference) {
        $this->_transactionReference = $transactionReference;
        Mage::register('transaction_reference', $transactionReference);

        return $this;
    }

    protected function _getTransactionReference() {
        if ($this->_transactionReference == '') {
            throw new Exception('Transaction reference not set.');
        }

        return $this->_transactionReference;
    }
}
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
class Yoma_Realex_Model_Service_Abstract {

    protected $_methodInstance = NULL;
    protected $_payment = NULL;
    protected $_order = NULL;
    protected $_transaction = NULL;
    protected $_transactionReference = NULL;
    protected $_transactionType = NULL;
    protected $_response = NULL;
    protected $_type = NULL;
    protected $_serviceCode = NULL;
    protected $_method = NULL;
    protected $_md = NULL;
    protected $_cardData = NULL;
    protected $_token = NULL;

    /**
     * @return array
     */
    public function getCardData() {

        return $this->_cardData;
    }

    public function setCardData($cardData) {

        $this->_cardData = $cardData;
    }


    public function getMd($key = '') {

        if (!isset($this->_md)) {
            return false;
        }
        if (isset($this->_md[$key])) {
            return $this->_md[$key];
        }

        return false;
    }

    public function setMd($md) {

        $this->_md = $md;
    }

    public function getMethod() {

        return $this->_method;
    }

    public function setMethod() {

        $this->_method = NULL;
        $this->_setMethod();
    }

    /**
     * @return false|Mage_Core_Model_Abstract|null
     */
    protected function _setMethod() {

        if ($this->_method == NULL) {
            // construct method name from payment model type and method
            $method = $this->_adapter . '_' . $this->getTransactionType();
            // pass reference to self
            $this->_method = Mage::getModel('realex/payment_' . $method, $this);
        }

        return $this->_method;
    }

    public function getHelper() {

        return $this->_getHelper();
    }

    /**
     * Retrieve payment method instance code
     *
     * @return string
     */
    public function getCode() {

        return $this->getMethodInstance()->getCode();
    }

    /**
     * @return Mage_Payment_Model_Method_Abstract
     */
    public function getMethodInstance() {

        return $this->_methodInstance;
    }

    /**
     * @param Mage_Payment_Model_Method_Abstract $methodInstance
     * @return $this
     * @throws Exception
     */
    public function setMethodInstance(Mage_Payment_Model_Method_Abstract $methodInstance) {

        if (!$methodInstance instanceof Mage_Payment_Model_Method_Abstract) {
            throw new Exception('Invalid method instance');
        }

        $this->_methodInstance = $methodInstance;

        return $this;
    }

    public function run() {

        $this->_pay();
    }

    /**
     * Call current action on method model
     */
    protected function _pay() {

        $action = $this->getTransactionType();
        $this->_method->$action();
    }

    /**
     * @param bool $convert
     * @return string
     */
    public function getTransactionType($convert = false) {
        if ($convert) {
            // if $convert true then change transaction name for display only
            return mage::helper('realex')->conversion($this->_transactionType);
        }

        return $this->_transactionType;
    }

    /**
     * @param $transactionType
     * @return $this
     */
    public function setTransactionType($transactionType) {

        $this->_transactionType = $transactionType;

        return $this;
    }

    /**
     * Capture payment.
     *
     * @param Varien_Object $payment
     * @param float $amount
     * @return Yoma_Realex_Model_Service_Abstract
     */
    public function capture(Varien_Object $payment, $amount) {

        $this->_addTransactionParent($payment);

        // if existing transaction assume authorize taken place so settle
        if ($payment->hasParentTransactionData()) {
            $this->setTransactionType('partial');

            return $this->_partialCapture($payment, $amount);
        } else {

            $transactionType = 'capture';
            $this->setTransactionType($transactionType);

            return $this->_authorizeAndCapture($payment, $amount);
        }
    }

    /**
     * Add transaction data to payment.
     *
     * @param Varien_Object $payment
     * @return Yoma_Realex_Model_Service_Abstract
     */
    protected function _addTransactionParent(Varien_Object $payment) {

        if ($parentId = $payment->getParentTransactionId()) {
            $parent     = $payment->getTransaction($parentId);
            $parentData = $parent->getAdditionalInformation();
            $payment->setParentTransactionData(
                Mage_Sales_Model_Order_Payment_Transaction::RAW_DETAILS,
                $parentData[Mage_Sales_Model_Order_Payment_Transaction::RAW_DETAILS]
            );
        }

        return $this;
    }

    /**
     * Settle payment.
     *
     * @param Varien_Object $payment
     * @param float $amount
     * @return Yoma_Realex_Model_Service_Abstract
     */
    public function _partialCapture(Varien_Object $payment, $amount) {

        $this->_addTransactionParent($payment);

        $this->_setPayment($payment);
        $this->_setOrder($payment->getOrder());

        $this->setTransactionType('partial');
        $payment->setData('payment_amount', $amount);
        // load method to perform transaction
        $this->_setMethod();

        $transactionReference = $this->_method->getTransactionReference($payment);
        $this->_setTransactionReference($transactionReference);
        if ($transactionReference == "") {
            throw new Exception('Unable to create transaction.');
        }
        try {
            // call method action
            $this->_pay();
        } catch (Exception $e) {
            Realex_Log::logException($e);
            throw $e;
        }
        // add transaction data to payment
        $payment
            ->setIsTransactionClosed(false)
            ->setShouldCloseParentTransaction(false)
            ->setTransactionId($this->_getTransactionReference())
            ->setTransactionAdditionalInfo(
                Mage_Sales_Model_Order_Payment_Transaction::RAW_DETAILS,
                $this->_method->getTransactionData(true)
            );

        // add payment info for display
        Mage::getModel('realex/paymentInfo')->saveSectionData(
            $payment->getId(),
            $this->getTransactionType(true),
            $this->_method->getPaymentInfo()
        );

        return $this;
    }

    /**
     * @return string
     * @throws Exception
     */
    protected function _getTransactionReference() {

        if ($this->_transactionReference == '') {
            throw new Exception('Transaction reference not set.');
        }

        return $this->_transactionReference;
    }

    public function getTransactionReference() {

        return $this->_getTransactionReference();
    }

    /**
     * Set the transaction reference.
     *
     * @param string $transactionReference
     * @return Yoma_Realex_Model_Service_Abstract
     */
    protected function _setTransactionReference($transactionReference) {

        $this->_transactionReference = $transactionReference;
        if (Mage::registry('transaction_reference')) {
            Mage::unregister('name-of-registry-key');
            Mage::register('transaction_reference', $transactionReference);
        }

        return $this;
    }

    /**
     * Capture payment on gateway.
     *
     * @param Varien_Object $payment
     * @param float $amount
     * @return Yoma_Realex_Model_Service_Abstract
     */
    protected function _authorizeAndCapture(Varien_Object $payment, $amount) {

        $this->_setPayment($payment);
        $this->_setOrder($payment->getOrder());
        $payment->setData('payment_amount', $amount);

        $this->_setMethod();

        $transactionReference = $this->_method->getTransactionReference($payment);
        $this->_setTransactionReference($transactionReference);
        if ($transactionReference == "") {
            throw new Exception('Unable to create transaction.');
        }
        try {

            $this->_pay();

        } catch (Yoma_Realex_Model_Exception_DenyPayment $e) {

            // catch 101, 102, 103 errors
            $payment->setIsTransactionPending(true);
            $this->saveDeniedTransaction($e->getMessage());
            //set redirect url for checkout
            $url = $this->_method->getCallDenyUrl();
            Mage::getSingleton('customer/session')->setRedirectUrl($url);

        } catch (Exception $e) {

            Realex_Log::logException($e);
            throw new Mage_Payment_Model_Info_Exception($e->getMessage());
        }

        $payment
            ->setIsTransactionClosed(false)
            ->setShouldCloseParentTransaction(false)
            ->setTransactionId($this->_getTransactionReference())
            ->setTransactionAdditionalInfo(
                Mage_Sales_Model_Order_Payment_Transaction::RAW_DETAILS,
                $this->_method->getTransactionData(true)
            );

        Mage::getModel('realex/paymentInfo')->saveSectionData(
            $payment->getId(),
            $this->getTransactionType(true),
            $this->_method->getPaymentInfo()
        );

        return $this;
    }

    /**
     * update current transaction before redirect
     *
     * @param string $errorMessage
     * @return $this
     */
    public function saveDeniedTransaction($errorMessage = false) {

        $serviceCode          = $this->getMethodInstance()->getCode();
        $transactionReference = $this->getTransactionReference();
        // check if we have a transaction
        $transaction = Mage::getModel('realex/transaction')->loadByServiceTransactionReference($serviceCode, $transactionReference, false);
        // update transaction data
        if ($transaction) {
            $transaction
                ->addData(array(
                    'service_code'           => $this->getMethodInstance()->getCode(),
                    'transaction_reference'  => $this->getTransactionReference(),
                    'payment_id'             => $this->_getPayment()->getId(),
                    'order_id'               => $this->_getOrder()->getId(),
                    'transaction_type'       => $this->getTransactionType(),
                    'additional_information' => $this->_method->getRegisterTransactionData(),
                    'payment_amount'         => $this->_getPayment()->getData('payment_amount'),
                    'remembertoken'          => $this->_getPayment()->getData('remembertoken'),
                ));

            if ($errorMessage) {
                $transaction->setErrorMessage($errorMessage);
            }

            $transaction->save();

            $this->_setTransaction($transaction);

        } else {
            // create new transaction
            $this->saveTransaction();
        }

        return $this;
    }

    protected function _getPayment() {
        return $this->_payment;
    }

    public function getPayment() {
        return $this->_getPayment();
    }

    protected function _setPayment(Varien_Object $payment) {
        $this->_payment = $payment;

        return $this;
    }

    protected function _getOrder() {
        return $this->_order;
    }

    public function getOrder() {
        return $this->_getOrder();
    }

    protected function _setOrder(Varien_Object $order) {
        $this->_order = $order;

        return $this;
    }

    public function saveTransaction() {
        return $this->_saveTransaction();
    }

    /**
     * Save transaction data
     *
     * @param string $errorMessage
     * @return $this|Yoma_Realex_Model_Service_Abstract
     */
    protected function _saveTransaction($errorMessage = false)
    {
        $transaction = Mage::getModel('realex/transaction')
            ->setData(array(
                'service_code' => $this->getMethodInstance()->getCode(),
                'transaction_reference' => $this->getTransactionReference(),
                'payment_id' => $this->_getPayment()->getId(),
                'order_id' => $this->_getOrder()->getId(),
                'transaction_type' => $this->getTransactionType(),
                'additional_information' => $this->_method->getRegisterTransactionData(),
                'payment_amount' => $this->_getPayment()->getData('payment_amount'),
                'remembertoken' => $this->_getPayment()->getData('remembertoken'),
            ));

        if($errorMessage){
            $transaction->setErrorMessage($errorMessage);
        }

        $transaction->save();

        $this->_setTransaction($transaction);

        return $this;
    }

    /**
     * Authorize payment on gateway.
     *
     * @param Varien_Object $payment
     * @param float $amount
     * @return Yoma_Realex_Model_Service_Abstract
     */
    public function authorize($payment, $amount) {

        $this->_addTransactionParent($payment);

        $this->_setPayment($payment);
        $this->_setOrder($payment->getOrder());

        $this->setTransactionType('authorize');
        $payment->setData('payment_amount', $amount);

        $this->_setMethod();

        $transactionReference = $this->_method->getTransactionReference($payment);
        $this->_setTransactionReference($transactionReference);
        if ($transactionReference == "") {
            throw new Exception('Unable to create transaction.');
        }
        try {

            $this->_pay();

        } catch (Yoma_Realex_Model_Exception_DenyPayment $e) {

            $payment->setIsTransactionPending(true);
            $this->saveDeniedTransaction($e->getMessage());
            $url = $this->_method->getCallDenyUrl();
            Mage::getSingleton('customer/session')->setRedirectUrl($url);

        } catch (Exception $e) {

            Realex_Log::logException($e);
            throw new Mage_Payment_Model_Info_Exception($e->getMessage());
        }

        $payment
            ->setIsTransactionClosed(false)
            ->setShouldCloseParentTransaction(false)
            ->setTransactionId($this->_getTransactionReference())
            ->setTransactionAdditionalInfo(
                Mage_Sales_Model_Order_Payment_Transaction::RAW_DETAILS,
                $this->_method->getTransactionData(true)
            );

        Mage::getModel('realex/paymentInfo')->saveSectionData(
            $payment->getId(),
            $this->getTransactionType(true),
            $this->_method->getPaymentInfo()
        );

        return $this;
    }

    /**
     * Refund payment on gateway.
     *
     * @param Varien_Object $payment
     * @param float $amount
     * @return Yoma_Realex_Model_Service_Abstract
     */
    public function refund(Varien_Object $payment, $amount) {

        $this->_addTransactionParent($payment);
        $payment->setData('payment_amount', $amount);

        $this->_setPayment($payment);
        $this->_setOrder($payment->getOrder());
        $this->setTransactionType('refund');

        $this->_setMethod();

        $transactionReference = $this->_method->getTransactionReference($payment);
        $transactionReference = $this->_incrementTransactionId($payment, $transactionReference);
        $this->_setTransactionReference($transactionReference);
        if ($transactionReference == '') {
            throw new Exception('Unable to retrieve transaction reference from adapter.');
        }

        try {
            $this->_pay();
        } catch (Exception $e) {
            Realex_Log::logException($e);
            throw new Mage_Payment_Model_Info_Exception($e->getMessage());
        }

        $payment
            ->setIsTransactionClosed(true)
            ->setShouldCloseParentTransaction(true)
            ->setTransactionId($this->_getTransactionReference())
            ->setTransactionAdditionalInfo(
                Mage_Sales_Model_Order_Payment_Transaction::RAW_DETAILS,
                $this->_method->getTransactionData(true)
            );
        Mage::getModel('realex/paymentInfo')->saveSectionData(
            $payment->getId(),
            $this->getTransactionType(true),
            $this->_method->getPaymentInfo()
        );

        return $this;
    }

    /**
     * increment transaction id
     *
     * @param Mage_Sales_Model_Order_Payment $payment
     * @param string $transactionId
     * @return string
     */
    protected function _incrementTransactionId(Mage_Sales_Model_Order_Payment $payment, $transactionId) {

        if (!$payment->getTransaction($transactionId)) {
            return $transactionId;
        }
        $_parts = explode('-', $transactionId);
        if (preg_match('/^\-*\d+$/', (string)end($_parts)) === 1) {

            $lastNumber = array_pop($_parts);
            $_parts[]   = $lastNumber + 1;
        } else {
            $_parts[] = '1';
        }
        $transactionId = implode('-', $_parts);

        return $this->_incrementTransactionId($payment, $transactionId);
    }

    /**
     * Void payment on gateway.
     *
     * @param Varien_Object $payment
     * @param float $amount
     * @return Yoma_Realex_Model_Service_Abstract
     */
    public function void(Varien_Object $payment) {

        $this->_addTransactionParent($payment);

        $this->setTransactionType('void');

        $this->_setPayment($payment);
        $this->_setOrder($payment->getOrder());

        $this->_setMethod();

        $transactionReference = $this->_method->getTransactionReference($payment);
        $transactionReference = $this->_incrementTransactionId($payment, $transactionReference);
        $this->_setTransactionReference($transactionReference);
        if ($transactionReference == '') {
            throw new Exception('Unable to retrieve transaction reference from adapter.');
        }

        try {
            $this->_pay();
        } catch (Exception $e) {
            Realex_Log::logException($e);
            $this->_getAdminSession()->addError($this->_gethelper()->__($e->getMessage()));
            throw $e;
        }

        $payment
            ->setIsTransactionClosed(true)
            ->setShouldCloseParentTransaction(true)
            ->setTransactionId($this->_getTransactionReference())
            ->setTransactionAdditionalInfo(
                Mage_Sales_Model_Order_Payment_Transaction::RAW_DETAILS,
                $this->_method->getTransactionData(true)
            );
        Mage::getModel('realex/paymentInfo')->saveSectionData(
            $payment->getId(),
            $this->getTransactionType(true),
            $this->_method->getPaymentInfo()
        );

        return $this;
    }

    protected function _getAdminSession() {
        return Mage::getSingleton('adminhtml/session');
    }

    /**
     * Prepare payment deny from callback
     *
     * @throws Exception
     */
    public function callDeny() {

        // initialise model variables
        $this->_init();

        $errorMessage = 'The transaction was declined.';

        $transaction = $this->_getTransaction();
        if (empty($transaction)) {
            throw new Exception($this->_getHelper()
                ->__("Unable to load Transaction '{$this->getTransactionReference()}'"));
        }
        // set error message
        if ($transaction->getId() && (string)$transaction->getErrorMessage() == '') {

            Mage::getModel('realex/transaction')
                ->load($transaction->getId())
                ->setErrorMessage($errorMessage)
                ->save();
        } elseif ($transaction->getId()) {
            $errorMessage = (string)$transaction->getErrorMessage();
        }

        // update the transaction data
        $this->_updateTransactionAfterDeny();

        // deny the payment
        $this->_denyPayment();

        throw new Exception($errorMessage);
    }

    /**
     * Process callback from gateway
     *
     * @throws Exception
     */
    public function callBack(){

        try {

            $this->_init();
            $this->_method->processCallback();
            $this->_updateTransactionAfterCallback();
            $this->_acceptPayment();
            Mage::getModel('realex/paymentInfo')->saveSectionData(
                $this->_getPayment()->getId(),
                $this->getTransactionType(true),
                $this->_method->getPaymentInfo()
            );
            Mage::dispatchEvent('realex_accept_payment_after', array('order'=> $this->_getPayment()->getOrder()));
            return true;

        } catch (Yoma_Realex_Model_Exception_DenyPayment $e) {

            $this->_processFailure($e,'payment_deny');
            $this->_updateTransactionAfterCallback();
            $this->_denyPayment();

            Mage::getModel('realex/paymentInfo')->saveSectionData(
                $this->_getPayment()->getId(),
                $this->getTransactionType(true),
                $this->_method->getPaymentInfo()
            );

            Mage::logException($e);
            throw new Exception($e->getMessage());

        }catch (Yoma_Realex_Model_Exception_Payment $e){

            $this->_processFailure($e,'error');

            //update the transaction data
            $this->_updateTransactionAfterCallback();

            Mage::getModel('realex/paymentInfo')->saveSectionData(
                $this->_getPayment()->getId(),
                $this->getTransactionType(true),
                $this->_method->getPaymentInfo()
            );

            Mage::logException($e);
            throw new Exception($e->getMessage());
        }
    }

    /**
     * Initialize models after callback
     *
     * @return $this
     * @throws Exception
     */
    protected function _init(){

        $this->setTransactionType(Mage::app()->getRequest()->getParam('type'));
        $this->_setTransactionReference(Mage::app()->getRequest()->getParam('reference'));

        $this->_setMethod()->setResponse(
            $this->getTransactionType(),
            Mage::app()->getRequest()->getPost()
        );

        $transaction = Mage::getModel('realex/transaction')
            ->loadByServiceTransactionReference($this->_serviceCode,$this->getTransactionReference());

        $this->_setTransaction($transaction);

        if ($transaction->getTransactionType() != $this->getTransactionType()) {
            throw new Exception($this->_getHelper()
                ->__("Transaction type '{$this->getTransactionType()}' does not match expected '{$transaction->getTransactionType()}'."));
        }

        $order = Mage::getModel('sales/order')->load($transaction->getOrderId());
        $this->_setOrder($order);
        if (!$order->getId()) {
            throw new Exception($this->_getHelper()
                ->__("Unable to load order for Transaction '{$this->getTransactionReference()}'"));
        }

        $payment = Mage::getModel('sales/order_payment')->load($transaction->getPaymentId());
        $payment->setOrder($order);
        $this->_setPayment($payment);
        if (!$payment->getId()) {
            throw new Exception($this->_getHelper()
                ->__("Unable to load payment for Transaction '{$this->getTransactionReference()}'"));
        }

        $this->setMethodInstance($payment->getMethodInstance());

        if ($order->getStatus() !== Mage_Sales_Model_Order::STATE_PAYMENT_REVIEW) {
            $comment = $order->addStatusHistoryComment($this->_getHelper()
                ->__('Realex Callback Occurred.'));
            $comment->save();

            throw new Exception($this->_getHelper()
                ->__("Incorrect Order Status"));
        }

        return $this;
    }

    /**
     * Update transaction after callback
     *
     * @return $this|Yoma_Realex_Model_Service_Abstract
     */
    protected function _updateTransactionAfterCallback()
    {
        if($this->_getPayment()){
            $transaction = $this->_getPayment()->getTransaction(
                $this->getTransactionReference()
            );
        }
        if($transaction) {
            $transaction
                ->setIsClosed(false)
                ->setShouldCloseParentTransaction(false)
                ->setAdditionalInformation(
                    Mage_Sales_Model_Order_Payment_Transaction::RAW_DETAILS,
                    $this->_method->getTransactionData(true)
                );

            $transaction->save();
        }
        return $this;
    }

    /**
     * Close transaction after deny
     *
     * @return $this
     */
    protected function _updateTransactionAfterDeny() {
        if ($this->_getPayment()) {
            $transaction = $this->_getPayment()->getTransaction(
                $this->getTransactionReference()
            );
        }
        if ($transaction) {
            $transaction
                ->setIsClosed(true)
                ->setShouldCloseParentTransaction(true);
            $transaction->save();
        }

        return $this;
    }

    /**
     * Deny payment
     *
     * @return $this
     * @throws Exception
     */
    protected function _denyPayment() {

        $payment = $this->_getPayment()
            ->setData('payment_deny', true);

        if (method_exists($payment, 'deny')) {
            $payment->deny();
        } else {
            $this->registerPaymentReviewAction($payment, 'payment_deny');
        }

        $this->_getOrder()->save();

        return $this;
    }

    /**
     * Update transaction for orders in payment review
     *
     * @param Mage_Sales_Model_Order_Payment $payment
     * @param string $action
     * @return $this
     * @throws Exception
     */
    public function registerPaymentReviewAction($payment, $action) {
        $order = $payment->getOrder();

        $transactionId = $payment->getLastTransId();
        $invoice       = $this->_getInvoiceForTransactionId($order, $transactionId);

        $result  = NULL;
        $message = NULL;

        switch ($action) {
            case 'payment_accept':
                if ($payment->getMethodInstance()->setStore($order->getStoreId())->acceptPayment($payment)) {
                    $result  = true;
                    $message = Mage::helper('realex')->__('Approved the payment online.');
                } else {
                    $result  = -1;
                    $message = Mage::helper('realex')->__('There is no need to approve this payment.');
                }
                break;

            case 'payment_deny':
                if ($payment->getMethodInstance()->setStore($order->getStoreId())->denyPayment($payment)) {
                    $result  = false;
                    $message = Mage::helper('realex')->__('Denied the payment online.');
                } else {
                    $result  = -1;
                    $message = Mage::helper('realex')->__('There is no need to deny this payment.');
                }
                break;

            default:
                throw new Exception('Not implemented.');
                break;
        }

        $message = $payment->_prependMessage($message);

        if ($transactionId) {
            $message .= ' ' . Mage::helper('realex')
                    ->__('Transaction ID: "%s".', $transactionId);
        }

        if (-1 === $result) {
            $order->addStatusHistoryComment($message);
        } elseif (true === $result) {
            if ($invoice) {
                $invoice->pay();
                $payment->_updateTotals(array('base_amount_paid_online' => $invoice->getBaseGrandTotal()));
                $order->addRelatedObject($invoice);
            }
            if ($order->getState() == Mage_Sales_Model_Order::STATE_HOLDED) {
                $this->_unhold($order, $message);
            } else {
                $order->setState(Mage_Sales_Model_Order::STATE_PROCESSING, true, $message);
            }
        } elseif (false === $result) {
            if ($invoice) {
                $invoice->cancel();
                $order->addRelatedObject($invoice);
            }
            $order->setState(Mage_Sales_Model_Order::STATE_PROCESSING);
            $order->registerCancellation($message, false);
        }

        return $this;
    }

    /**
     * Check order for existing invoice
     *
     * @param Mage_Sales_Model_Order $order
     * @param string $transactionId
     * @return bool
     */
    protected function _getInvoiceForTransactionId($order, $transactionId) {
        foreach ($order->getInvoiceCollection() as $invoice) {
            if ($invoice->getTransactionId() == $transactionId) {
                $invoice->load($invoice->getId());

                return $invoice;
            }
        }
        foreach ($order->getInvoiceCollection() as $invoice) {
            if ($invoice->getState() == Mage_Sales_Model_Order_Invoice::STATE_OPEN
                && $invoice->load($invoice->getId())
            ) {
                $invoice->setTransactionId($transactionId);

                return $invoice;
            }
        }

        return false;
    }

    public function getTransaction() {
        return $this->_getTransaction();
    }

    protected function _getTransaction() {
        return $this->_transaction;
    }

    protected function _setTransaction(Yoma_Realex_Model_Transaction $transaction) {
        $this->_transaction = $transaction;

        return $this;
    }

    public function debugData($debugData) {

        $this->getMethodInstance()->debugData($debugData);
    }

    public function getToken() {

        return $this->_token;
    }

    public function setToken($token) {

        $this->_token = $token;
    }

    /**
     * Accept payment
     *
     * @return $this
     * @throws Exception
     */
    protected function _acceptPayment() {
        $payment = $this->_getPayment()
            ->setData('payment_accept', true);

        if (method_exists($payment, 'accept')) {
            $payment->accept();
        } else {
            $this->registerPaymentReviewAction($payment, 'payment_accept');
        }

        $order = $payment->getOrder()
            ->save()->sendNewOrderEmail();


        $orderStatus = $payment->getMethodInstance()->getConfigData('order_status');
        if ($orderStatus != '' && $orderStatus != $order->getStatus()) {

            $order->setStatus($orderStatus);
            $comment = $order->addStatusHistoryComment($this->_getHelper()
                ->__("Order status updated."));
            $comment->save();

            $order->save();
        }

        return $this;
    }

    /**
     * Add message to payment
     *
     * @param mixed $messagePrependTo
     * @param Mage_Sales_Model_Payment $payment
     * @return string
     */
    protected function _prependMessage($messagePrependTo, $payment) {
        $preparedMessage = $payment->getPreparedMessage();
        if ($preparedMessage) {
            if (is_string($preparedMessage)) {
                return $preparedMessage . ' ' . $messagePrependTo;
            } elseif (is_object($preparedMessage)
                && ($preparedMessage instanceof Mage_Sales_Model_Order_Status_History)
            ) {
                $comment = $preparedMessage->getComment() . ' ' . $messagePrependTo;
                $preparedMessage->setComment($comment);

                return $comment;
            }
        }

        return $messagePrependTo;
    }

    protected function _formatAmount($amount, $asFloat = false) {
        $amount = Mage::app()->getStore()->roundPrice($amount);

        return !$asFloat ? (string)$amount : $amount;
    }

    /**
     * To be removed
     *
     * @param $payment
     * @param $reference
     * @param array $data
     * @param bool $close
     * @param bool $closeParent
     */
    protected function _processFailure(Exception $e, $type) {

        $errorMessage = $e->getMessage();

        $transaction = $this->_getTransaction();
        if (empty($transaction)) {
            throw new Exception($this->_getHelper()
                ->__("Unable to load Transaction '{$this->getTransactionReference()}'"));
        }
        if ($transaction->getId() && (string)$transaction->getErrorMessage() == '') {

            Mage::getModel('realex/transaction')
                ->load($transaction->getId())
                ->setErrorMessage($errorMessage)
                ->save();
        }

        return $this;
    }

    /**
     * To be removed
     *
     * @param $payment
     * @param $reference
     * @param array $data
     * @param bool $close
     * @param bool $closeParent
     */
    protected function _updatePaymentTransaction($payment, $reference, $data = array(), $close = false, $closeParent = false) {
        $payment
            ->setIsTransactionClosed($close)
            ->setShouldCloseParentTransaction($closeParent)
            ->setTransactionId($reference)
            ->setTransactionAdditionalInfo(
                Mage_Sales_Model_Order_Payment_Transaction::RAW_DETAILS,
                $data
            );
    }

    protected function _registerTransaction() {

        $this->_saveTransaction();
    }

    protected function _processResponse() {

        $this->_getResponse()->processResult();
        return $this;
    }

    protected function _getResponse() {

        return $this->_getType()->getResponse();
    }

    protected function _setResponse($response) {

        $this->_response = $response;
        return $this;
    }

    /**
     * @return Mage_Core_Model_Abstract
     */
    protected function _getSession() {
        return Mage::getSingleton('checkout/session');
    }

    public function getCardOwner(){

        $payment = $this->_getPayment();
        return  $payment->getData('cc_owner');
    }

}
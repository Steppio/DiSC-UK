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
class Yoma_Realex_Model_Redirect extends Yoma_Realex_Model_Api_Payment{

    /**
     * Constant payment method code
     */
    const PAYMENT_METHOD_CODE = 'realexredirect';

    /**
     * Magento payment code.
     *
     * @var string $_code
     */
    protected $_code = self::PAYMENT_METHOD_CODE;

    protected $_formBlockType = 'realex/form_redirect';
    protected $_infoBlockType = 'realex/info_redirect';

    protected $_isGateway = true;
    protected $_canAuthorize = true;
    protected $_canCapture = true;
    protected $_canCapturePartial = false;
    protected $_canReviewPayment = true;
    protected $_canRefund = true;
    protected $_canRefundInvoicePartial = true;
    protected $_canUseInternal = false;
    protected $_canUseForMultishipping = false;
    protected $_isCcTypeRequired = false;
    protected $_canVoid                     = true;
    protected $_canOrder                    = false;
    protected $_canUseCheckout              = true;
    protected $_isInitializeNeeded          = false;
    protected $_canFetchTransactionInfo     = false;
    protected $_canCreateBillingAgreement   = false;
    protected $_canManageRecurringProfiles  = false;
    protected $_canCancelInvoice            = false;
    protected $_canSaveCc                   = false;

    protected $_canCallbackAccessSession    = false;


    protected function _getService()
    {
        $info = $this->getInfoInstance();
        if($info->getRealexTokenCcId()){
            return Mage::getModel('realex/service_token');
        }
        return Mage::getModel('realex/service_redirect');
    }

    protected function _registerTransaction(){

        $this->_saveTransaction();

        $this->_getPayment()->setIsTransactionPending(true);

    }

    /**
     * Accept payment
     *
     * @TODO refactor to payment api
     * @param Mage_Payment_Model_Info $payment
     * @return bool
     * @throws Exception
     * @throws Mage_Core_Exception
     */
    public function acceptPayment(Mage_Payment_Model_Info $payment)
    {
        if (method_exists(get_parent_class(), 'acceptPayment')) {
            parent::acceptPayment($payment);
        } else {
            if (is_null($this->_canReviewPayment) || !$this->_canReviewPayment) {
                Mage::throwException(Mage::helper('realex')
                    ->__('The payment review action is unavailable.'));
            }
        }

        if (true !== $payment->getData('payment_accept')) {
            Mage::throwException('Online payments cannot be accepted manually.');
        }

        $requiredState = 'payment_review';

        if ($payment->getOrder()->getStatus() !== $requiredState) {
            $comment = $payment->getOrder()->addStatusHistoryComment('An attempt was made to accept this payment.');
            $comment->save();

            throw new Exception('Only orders with status Payment Review can be accepted');
        }

        return true;
    }

    /**
     * Deny payment
     *
     * @TODO refactor to payment api
     * @param Mage_Payment_Model_Info $payment
     * @return bool
     * @throws Exception
     * @throws Mage_Core_Exception
     */
    public function denyPayment(Mage_Payment_Model_Info $payment)
    {
        if (method_exists(get_parent_class(), 'denyPayment')) {
            parent::denyPayment($payment);
        } else {
            if (is_null($this->_canReviewPayment) || !$this->_canReviewPayment) {
                Mage::throwException(Mage::helper('realex')
                    ->__('The payment review action is unavailable.'));
            }
        }


        $requiredState = 'payment_review';

        if ($payment->getOrder()->getStatus() !== $requiredState) {
            $comment = $payment->getOrder()->addStatusHistoryComment('Warning: An attempt was made to deny this payment.');
            $comment->save();

            throw new Exception("Only orders with status '{$requiredState}' can be denied online.");
        }

        return true;
    }

    public function isAvailable($quote = null) {
        return Mage_Payment_Model_Method_Abstract::isAvailable($quote);
    }


    /**
     * @return Mage_Core_Helper_Abstract|Mage_Payment_Helper_Data
     */
    protected function _getHelper()
    {
        return Mage::helper('realex/redirect');
    }

    /**
     * Check if can void payment
     *
     * @TODO refactor
     * @param Varien_Object $payment
     * @return bool
     */
    public function canVoid(Varien_Object $payment)
    {
        $order = $this->getInfoInstance()->getOrder();

        if($order->getInvoiceCollection()->count()){
            $date = false;
            foreach($order->getInvoiceCollection() as $invoice){
                if(strtotime($date) < strtotime($invoice->getCreatedAt())){
                    $date = $invoice->getCreatedAt();
                }
            }

            if(strtotime($date) < strtotime('tomorrow')){
                return true;
            }

            return false;
        }

        if($order->getStatusHistoryCollection()->count() == 2){

            $statusHistory = $order->getStatusHistoryCollection();

            $requiredState = 0;
            $requiredStates = array('canceled','payment_review');

            foreach($statusHistory as $status){
                if(in_array($status->getStatus(),$requiredStates)){
                    $requiredState ++;
                }
            }
            if($requiredState == 2){
                return false;
            }
        }

        return $this->_canVoid;
    }

    /**
     * Validate payment
     *
     * @return $this|Mage_Payment_Model_Abstract
     * @throws Mage_Core_Exception
     */
    public function validate()
    {

        $paymentInfo = $this->getInfoInstance();
        if ($paymentInfo instanceof Mage_Sales_Model_Order_Payment) {
            $billingCountry = $paymentInfo->getOrder()->getBillingAddress()->getCountryId();
        } else {
            $billingCountry = $paymentInfo->getQuote()->getBillingAddress()->getCountryId();
        }
        if (!$this->canUseForCountry($billingCountry)) {
            Mage::throwException(Mage::helper('payment')->__('Selected payment type is not allowed for billing country.'));
        }
        return $this;
    }

}

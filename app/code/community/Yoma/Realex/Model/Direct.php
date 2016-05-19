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
class Yoma_Realex_Model_Direct extends Yoma_Realex_Model_Api_Payment{

    /**
     * Constant payment method code
     */
    const PAYMENT_METHOD_CODE = 'realexdirect';

    /**
     * Magento payment code.
     *
     * @var string $_code
     */
    protected $_code = self::PAYMENT_METHOD_CODE;
    protected $_infoBlockType = 'realex/info_direct';
    protected $_formBlockType = 'realex/form_direct';

    protected $_isGateway = true;
    protected $_canAuthorize = true;
    protected $_canCapture = true;
    protected $_canCapturePartial = false;
    protected $_canReviewPayment = true;
    protected $_canRefund = true;
    protected $_canRefundInvoicePartial = true;
    protected $_canUseInternal = false;
    protected $_canUseForMultishipping = true;
    protected $_isCcTypeRequired = true;
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

    protected $_realexCustomCcNumberRegex = array(
        'YOMA_DINERS_CLUB' => false,
        'YOMA_MAESTRO' => false,
    );

    protected $_realexCustomCsvRegex = array(
        'YOMA_DINERS_CLUB' => '/^([0-9]{3}|[0-9]{4})?$/',
        'YOMA_MAESTRO'=> '/^([0-9]{3})?$/',
    );

    /**
     * @TOD0 check if issue with OSC
     */
    protected function _getService()
    {
        $info = $this->getInfoInstance();
        if($info->getRealexTokenCcId()){
            return Mage::getModel('realex/service_token');
        }
        return Mage::getModel('realex/service_direct');
    }

    /**
     * @TOD0 check validity
     */
    protected function _registerTransaction(){

        $this->_saveTransaction();

        $this->_getPayment()->setIsTransactionPending(true);

    }

    /**
     * Validate card info
     *
     * @return $this|Mage_Payment_Model_Abstract
     * @throws Mage_Core_Exception
     */
    public function validate()
    {
        $info = $this->getInfoInstance();

        if($info->getRealexTokenCcId()){
            return $this;
        }

        if (!array_key_exists($info->getCcType(), $this->_realexCustomCcNumberRegex)) {
            return parent::validate();
        }

        $ccNumber = preg_replace('/[\-\s]+/', '', $info->getCcNumber());
        $info->setCcNumber($ccNumber);

        $ccTypeRegExp = $this->_realexCustomCcNumberRegex[$info->getCcType()];
        if ($ccTypeRegExp && (!$ccNumber || !preg_match($ccTypeRegExp, $ccNumber))) {
            Mage::throwException($this->_getHelper()->__('Credit card number mismatch with credit card type.'));
        }


        if ($this->hasVerification() && array_key_exists($info->getCcType(), $this->_realexCustomCsvRegex)) {
            $verifcationRegEx = $this->_realexCustomCsvRegex[$info->getCcType()];
            if (!$info->getCcCid() || !preg_match($verifcationRegEx, $info->getCcCid())) {
                Mage::throwException($this->_getHelper()->__('Please enter a valid credit card verification number.'));
            }
        }

        if (!$this->_validateExpDate($info->getCcExpYear(), $info->getCcExpMonth())) {
            Mage::throwException($this->_getHelper()->__('Incorrect credit card expiration date.'));
        }

        return $this;
    }

    /**
     * Accept payment
     *
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

    /**
     * Retrieve if available for quote
     *
     * @param null $quote
     * @return bool
     */
    public function isAvailable($quote = null) {
        return Mage_Payment_Model_Method_Abstract::isAvailable($quote);
    }

    /**
     * Assign data to payment model
     *
     * @param mixed array $data
     * @return $this|Mage_Payment_Model_Info
     */
    public function assignData($data)
    {
        if (!($data instanceof Varien_Object)) {
            $data = new Varien_Object($data);
        }
        $info = $this->getInfoInstance();

        $info->setRemembertoken((!is_null($data->getRemembertoken()) ? 1 : 0));

        if(!is_null($data->getTokenCvv())){
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
        ;
        return $this;
    }

    /**
     * @return Mage_Core_Helper_Abstract|Mage_Payment_Helper_Data
     */
    protected function _getHelper()
    {
        return Mage::helper('realex/direct');
    }

    /**
     * Check if can void payment
     *
     * @param Varien_Object $payment
     * @return bool
     */
    public function canVoid(Varien_Object $payment)
    {

        $order = $this->getInfoInstance()->getOrder();
        // if invoiced and invoice not created today return false
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

        // if order has been payment review then cancelled return false
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

}

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
class Yoma_Realex_Model_Token extends Yoma_Realex_Model_Direct{

    const PAYMENT_METHOD_CODE = 'realvault';

    protected $_isCcTypeRequired = false;
    protected $_canUseCheckout = false;
    protected $_canUseForMultishipping = false;
    protected $_code = self::PAYMENT_METHOD_CODE;
    protected $_infoBlockType = 'realex/info_token';
    protected $_formBlockType = 'realex/form_token';

    /**
     * @TODO refactor as no longer required
     *
     * @param Mage_Sales_Model_Quote $quote
     * @param int|null $checksBitMask
     * @return bool
     */
    public function isApplicableToQuote($quote, $checksBitMask)
    {

        if ($checksBitMask & self::CHECK_USE_FOR_COUNTRY) {
            if (!$this->canUseForCountry($quote->getBillingAddress()->getCountry())) {
                return false;
            }
        }
        if ($checksBitMask & self::CHECK_USE_FOR_CURRENCY) {
            if (!$this->canUseForCurrency($quote->getStore()->getBaseCurrencyCode())) {
                return false;
            }
        }
        if ($checksBitMask & self::CHECK_USE_CHECKOUT) {
            return true;
        }
        if ($checksBitMask & self::CHECK_USE_FOR_MULTISHIPPING) {
            if (!$this->canUseForMultishipping()) {
                return true;
            }
        }
        if ($checksBitMask & self::CHECK_USE_INTERNAL) {
            if (!$this->canUseInternal()) {
                return false;
            }
        }
        if ($checksBitMask & self::CHECK_ORDER_TOTAL_MIN_MAX) {
            $total = $quote->getBaseGrandTotal();
            $minTotal = $this->getConfigData('min_order_total');
            $maxTotal = $this->getConfigData('max_order_total');
            if (!empty($minTotal) && $total < $minTotal || !empty($maxTotal) && $total > $maxTotal) {
                return false;
            }
        }
        if ($checksBitMask & self::CHECK_RECURRING_PROFILES) {
            if (!$this->canManageRecurringProfiles() && $quote->hasRecurringItems()) {
                return false;
            }
        }
        if ($checksBitMask & self::CHECK_ZERO_TOTAL) {
            $total = $quote->getBaseSubtotal() + $quote->getShippingAddress()->getBaseShippingAmount();
            if ($total < 0.0001 && $this->getCode() != 'free'
                && !($this->canManageRecurringProfiles() && $quote->hasRecurringItems())
            ) {
                return false;
            }
        }
        return true;
    }

    /**
     * Can be used in regular checkout
     *
     * @return bool
     */
    public function canUseCheckout()
    {
        if($this->_getHelper()->isCheckoutLoggedIn() && $this->getAvailableTokenCards()){
            return true;
        }

        return $this->_canUseCheckout;
    }

    /**
     * Can be used in multishipping checkout
     *
     * @return bool
     */
    public function canUseForMultishipping(){

        if($this->_getHelper()->isCheckoutLoggedIn() && $this->getAvailableTokenCards()){
            return true;
        }

        return $this->_canUseForMultishipping;
    }

    /**
     * Check if token
     *
     * @param null string $methodCode
     * @return bool
     */
    public function getAvailableTokenCards($methodCode = null)
    {
        $cards = Mage::getModel("realex/tokencard")->getCollection()
            ->addActiveCardsByCustomerFilter(Mage::getSingleton('customer/session')->getCustomer())
            ->load();
        if(!$cards){
            return false;
        }
        if($cards->getSize() > 0){
            return true;
        }

        return false;
    }

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
            ->setRealexTokenCcId($data->getRealexTokenCcId())
        ;
        return $this;
    }
}

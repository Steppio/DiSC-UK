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
class Yoma_Realex_Block_Form_Redirect extends Mage_Payment_Block_Form_Cc {

    protected function _construct()
    {
        parent::_construct();
        $this->setTemplate('realex/payment/form/redirect.phtml');
    }

    public function getQuote()
    {
        return Mage::getSingleton('checkout/session')->getQuote();
    }

    public function isCcTypeRequired()
    {
        return $this->getMethod()->getIsCcTypeRequired();
    }

    public function getCcAvailableTypes()
    {
        $types = Mage::getSingleton('payment/config')->getCcTypes();
        if ($method = $this->getMethod()) {
            $path = 'realex/' . $method->getCode() . '/cctypes';
            $availableTypes = Mage::getStoreConfig($path,Mage::app()->getStore());
            if ($availableTypes) {
                $availableTypes = explode(',', $availableTypes);
                foreach ($types as $code => $name) {
                    if (!in_array($code, $availableTypes)) {
                        unset($types[$code]);
                    }
                }
            }
        }
        return $types;
    }

    protected function _toHtml()
    {
        Mage::dispatchEvent('payment_form_block_to_html_before', array(
            'block' => $this
        ));

        return parent::_toHtml();
    }

    /**
     * Return save card status
     *  @return int 
     */
    public function storeCardOption(){
        $value = Mage::getStoreConfig('payment/realvault/store_card', Mage::app()->getStore());
        if($value) {
            return '1';
        }

        return '0';
    }


    public function useRealVault(){
        if($desc = Mage::getStoreConfig('payment/realvault/active', Mage::app()->getStore())) {
            return $desc;
        }
    }

    /**
     * Return always store label 
     * @return string
     */
    public function storeLabel() {
        return Mage::getStoreConfig('payment/realvault/store_label', Mage::app()->getStore());
    }

    /**
     * Return description for realex payment method
     * @return string
     */
    public function payOptionDesc() {
        if($desc = Mage::getStoreConfig('payment/realvault/option_description', Mage::app()->getStore())) {
            return $desc;
        }
    }


    public function canUseToken() {
        $ret = Mage::getStoreConfig('payment/realvault/active', Mage::app()->getStore());
        $ret = $ret && (Mage::getModel('checkout/type_onepage')->getCheckoutMethod() != 'guest');
        return $ret;
    }

    public function alwaysSave(){
        return !Mage::getStoreConfig('payment/realvault/store_card', Mage::app()->getStore());
    }

    public function getTokenCards($methodCode = null) {

        $cards = Mage::getModel("realex/tokencard")->getCollection()
            ->addActiveCardsByCustomerFilter(Mage::getSingleton('customer/session')->getCustomer())
            ->load();
        return $cards;
    }

    public function canAddToken($tokens){

        return mage::helper('realex')->canAddCard($tokens->getSize());
    }



}
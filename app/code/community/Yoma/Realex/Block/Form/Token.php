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
class Yoma_Realex_Block_Form_Token extends Mage_Payment_Block_Form_Cc {

    protected function _construct()
    {
        parent::_construct();
        $this->setTemplate('realex/payment/form/token.phtml');
    }

    public function getPaymentMethodCode(){
        return 'realvault';
    }

    public function getAvailableTokenCards($methodCode = null)
    {
        $cards = Mage::getModel("realex/tokencard")->getCollection()
            ->addActiveCardsByCustomerFilter(Mage::getSingleton('customer/session')->getCustomer())
            ->load();
        return $cards;
    }

    public function canUseToken() {
        $ret = Mage::getStoreConfig('payment/realvault/active', Mage::app()->getStore());
        $ret = $ret && (Mage::getModel('checkout/type_onepage')->getCheckoutMethod() != 'guest');

        return $ret;
    }

    public function canUseTokens(){
        if (!Mage::getStoreConfig('payment/realvault/active', Mage::app()->getStore())) {
            return false;
        }

        return true;
    }

    public function alwaysSave(){

        return !Mage::getStoreConfig('payment/realvault/store_card', Mage::app()->getStore());

    }

    public function canAddToken($tokens) {

        return mage::helper('realex')->canAddCard($tokens->getSize());
    }

    public function requireTokenCvv(){
        return Mage::getStoreConfig('payment/realvault/require_cvv', Mage::app()->getStore());
    }

    public function getMagentoCardType($token){

        $cards = mage::getModel('realex/realex_source_cards');

        return $cards->getMagentoCardType($token->getCardType());
    }

}
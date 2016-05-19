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
class Yoma_Realex_Block_Customer_Account_Cards extends Mage_Core_Block_Template {
	protected $_cards = null;


	public function getCustomerCards() {

		if($customer = Mage::getSingleton('customer/session')->getCustomer()) {
	        $cards = Mage::getModel("realex/tokencard")->getCollection()->addCustomerFilter($customer);
	        return $cards;
    	}
    	return;
	}

    public function canDeleteCards(){
        return mage::helper('realex')->getConfigData('realvault','allow_delete');
    }

    public function getCcTypeName($ccType,$method = false)
    {
        $types = Mage::getSingleton('payment/config')->getCcTypes();
        if (isset($types[$ccType])) {
            if($method == 'redirect' && $ccType == 'MC'){
                return "MasterCard / Maestro";
            }
            return $types[$ccType];
        }
        return (empty($ccType)) ? Mage::helper('payment')->__('N/A') : $ccType;
    }


}
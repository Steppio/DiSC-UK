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
class Yoma_Realex_Block_Onepage_Success extends Mage_Checkout_Block_Onepage_Success
{

    /**
     * Check if token saved
     *
     *
     * @param int $orderId
     * @return bool|mixed
     * @throws Exception
     */
    public function getRememberToken($orderId){

        $tokenSaved = false;

        $order = Mage::getModel('sales/order')->loadByIncrementId($orderId);
        if (!$order->getId()) {
            return false;
        }

        $payment = $order->getPayment();
        if (!$payment->getId()) {
            return false;
        }

        if (!in_array($payment->getMethod(),array('realexdirect','realexredirect'))) {
            return false;
        }

        // if token param then redirect else check session
        if($this->getRequest()->getParam('token')){
            $tokenSaved = $this->getRequest()->getParam( 'token' );
        }else{
            $tokenSaved = Mage::getSingleton('customer/session')->getTokenSaved();
            Mage::getSingleton('customer/session')->unsTokenSaved();
            Mage::getSingleton('realex/session')->unsTokenSaved();
        }

        if($tokenSaved){
            return true;
        }
        return false;
    }

}
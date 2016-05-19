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
class Yoma_Realex_Model_Observer_Cron {

    public function orderCleanup() {

        $paymentMethods = array('realexdirect','realexredirect','realvault');

        if (!Mage::getStoreConfig('payment/cleanup/cleanup_active')) {
            return;
        }

        $hours = Mage::getStoreConfig('payment/cleanup/cleanup_timeframe');

        if (!Mage::helper('realex')->isInt($hours) || $hours < 1) {
            Mage::throwException(
                'A value must be provided for the age, in hours, of orders to cancel.'
            );
        }

        $reviewState = 'payment_review';

        $lastUpdated  = date('Y-m-d H:i:s', strtotime("-{$hours} hours"));
        $orderCollection = Mage::getModel('sales/order')->getCollection()
            ->addAttributeToFilter('state', $reviewState)
            ->addAttributeToFilter('updated_at', array('lt' => $lastUpdated))
            ->addAttributeToSort('entity_id', 'ASC');

        foreach ($orderCollection as $_order) {
            try {
                $_order = Mage::getModel('sales/order')->load($_order->getId());
                if ($_order->getState() != $reviewState) {
                    continue;
                }

                $_payment = $_order->getPayment();

                if(!in_array($_payment->getMethod(),$paymentMethods)){
                    continue;
                }

                $_payment->setData('payment_deny',true);

                if (method_exists($_payment, 'deny')) {
                    $_payment->deny();
                }

                $_order->save();

                $_comment = $_order->addStatusHistoryComment(
                    Mage::helper('realex')->__(
                        "Order cancelled as not converted within {$hours} hours."
                    )
                );
                $_comment->save();
            } catch (Exception $e) {
                Mage::logException($e);
            }
        }
    }
}
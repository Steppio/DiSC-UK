<?php
/**
 * Plumrocket Inc.
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the End-user License Agreement
 * that is available through the world-wide-web at this URL:
 * http://wiki.plumrocket.net/wiki/EULA
 * If you are unable to obtain it through the world-wide-web, please 
 * send an email to support@plumrocket.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file
 *
 * @package     Plumrocket_Auto_Invoice
 * @copyright   Copyright (c) 2013 Plumrocket Inc. (http://www.plumrocket.com)
 * @license     http://wiki.plumrocket.net/wiki/EULA  End-user License Agreement
 */
?>
<?php

class Plumrocket_AutoInvoice_Model_Observer
{

	public function salesOrderSaveCommitAfter(Varien_Event_Observer $observer)
	{
		
		if (!Mage::helper('autoinvoice')->moduleEnabled()){
			return $this;
		}
		
		$order = $observer->getEvent()->getOrder();
		if ( ($order->getState() == Mage_Sales_Model_Order::STATE_NEW || $order->getState() == Mage_Sales_Model_Order::STATE_PROCESSING)  && !$order->getIsProcessedByMCornerOrdersObserver()  ) 
		{	
			$orders = Mage::getModel('sales/order_invoice')->getCollection()->addAttributeToFilter('order_id', array('eq'=>$order->getId()));
			$orders->getSelect()->limit(1);
			if ((int)$orders->count() !== 0) {
				return $this;
			}

            try {
                if(!$order->canInvoice()) {
                    $order->addStatusHistoryComment('Auto Invoice: Order cannot be invoiced.', false);
                    $order->save();
                }

                $invoice = Mage::getModel('sales/service_order', $order)->prepareInvoice();
                $invoice->setRequestedCaptureCase(Mage_Sales_Model_Order_Invoice::CAPTURE_OFFLINE);

				$incrementId = Mage::getModel('sales/order_invoice')->getCollection()
					->addFieldToFilter('store_id', Mage::app()->getStore()->getId())
					->setOrder('increment_id','DESC')
					 ->setPageSize(1)
					 ->setCurPage(1)
					 ->getFirstItem()
					 ->getIncrementId();

				$invoice->setIncrementId($incrementId + 1);
				$invoice->sendEmail('true','');
				$invoice->setIncrementId(null);

               
				
                $invoice->register();
                $invoice->getOrder()->setCustomerNoteNotify(false);
                $invoice->getOrder()->setIsInProcess(true); 
                
                $order->addStatusHistoryComment('Auto Invoice: Order invoiced.', false);
                $transaction = Mage::getModel('core/resource_transaction')
                    ->addObject($invoice)
                    ->addObject($invoice->getOrder());
                $transaction->save();
                
            } catch (Exception $e) {
                $order->addStatusHistoryComment('Auto Invoice: Unexpected error: '.$e->getMessage(), false);
                $order->save();
            }
        }
		return $this;
	}
	

		
}

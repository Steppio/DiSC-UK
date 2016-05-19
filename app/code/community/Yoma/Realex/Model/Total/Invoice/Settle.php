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
class Yoma_Realex_Model_Total_Invoice_Settle extends Mage_Sales_Model_Order_Invoice_Total_Abstract
{

    /**
     * @param Mage_Sales_Model_Order_Invoice $invoice
     * @return $this|Mage_Sales_Model_Order_Invoice_Total_Abstract
     */
    public function collect(Mage_Sales_Model_Order_Invoice $invoice)
    {
        $data = mage::app()->getRequest()->getPost('invoice');
        if (isset($data['settle_positive'])) {
            $this->setSettlePositive($invoice, $data['settle_positive']);
        }else{

        }

        return $this;
    }

    /**
     * Allow positive amount on invoice
     *
     * @param Mage_Sales_Model_Order_Invoice $invoice
     * @param string $amount
     * @return $this
     */
    public function setSettlePositive($invoice, $amount){

        $amount = $invoice->getOrder()->getStore()->roundPrice($amount);
        $invoice->setData('base_settle_positive', $amount);
        //$invoice->setBaseGrandTotal($invoice->getBaseGrandTotal() + $amount);
        $invoice->setBaseGrandTotal($amount);

        $storeRate = $invoice->getOrder()->getStoreToOrderRate();

        $amount = $invoice->getOrder()->getStore()->roundPrice($amount*$storeRate);
        $invoice->setData('settle_positive', $amount);
        //$invoice->setGrandTotal($invoice->getGrandTotal() + $amount);
        $invoice->setGrandTotal($amount);

        $invoice->getOrder()->addStatusHistoryComment(
            Mage::helper('sales')->__('Settle for %s added to invoice.',Mage::helper('core')->formatPrice($invoice->getGrandTotal())))
            ->setIsVisibleOnFront(false)
            ->setIsCustomerNotified(false);

        return $this;
    }

    /**
     * @param Mage_Sales_Model_Order_Invoice $invoice
     * @return $this
     */
    public function fetch(Mage_Sales_Model_Order_Invoice $invoice)
    {

        $invoice->addTotal(array(
            'code'  => 'settle_positive',
            'title' => $this->helper('realex')->__('Settle Amount'),
            'value' => $invoice->getSettleAmount()
        ));

        return $this;
    }

}
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
class Yoma_Realex_Model_Total_Creditmemo_Rebate extends Mage_Sales_Model_Order_Creditmemo_Total_Abstract
{

    /**
     * @param Mage_Sales_Model_Order_Creditmemo $creditmemo
     * @return $this|Mage_Sales_Model_Order_Creditmemo_Total_Abstract
     */
    public function collect(Mage_Sales_Model_Order_Creditmemo $creditmemo)
    {
        $data = mage::app()->getRequest()->getPost('creditmemo');
        if (isset($data['rebate_positive'])) {
            $this->setRebatePositive($creditmemo, $data['rebate_positive']);
        }else{

        }

        return $this;
    }

    /**
     * Allow positive amount on rebate
     *
     * @param Mage_Sales_Model_Order_Creditmemo $creditmemo
     * @param string $amount
     * @return $this
     */
    public function setRebatePositive($creditmemo, $amount){

        $amount = trim($amount);
        if (substr($amount, -1) == '%') {
            $amount = (float) substr($amount, 0, -1);
            $amount = $creditmemo->getGrandTotal() * $amount / 100;
        }
        $amount = $creditmemo->getOrder()->getStore()->roundPrice($amount);
        $creditmemo->setData('base_rebate_positive', $amount);
        $creditmemo->setBaseGrandTotal($creditmemo->getBaseGrandTotal() + $amount);

        $storeRate = $creditmemo->getOrder()->getStoreToOrderRate();

        $amount = $creditmemo->getOrder()->getStore()->roundPrice($amount*$storeRate);
        $creditmemo->setData('rebate_positive', $amount);
        $creditmemo->setGrandTotal($creditmemo->getGrandTotal() + $amount);

        $creditmemo->getOrder()->addStatusHistoryComment(
            Mage::helper('realex')->__('Rebate adjustment of: %s added to creditmemo', Mage::helper('core')->formatPrice($amount, true)))
            ->setIsVisibleOnFront(false)
            ->setIsCustomerNotified(false);

        return $this;
    }

}
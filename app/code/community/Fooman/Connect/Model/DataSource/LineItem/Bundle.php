<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_DataSource_LineItem_Bundle
    extends Fooman_Connect_Model_DataSource_OrderItem_Bundle
    implements Fooman_Connect_Model_DataSource_LineItem_Interface
{

    /**
     * @var Mage_Sales_Model_Order_Item
     */
    protected $_orderItem = null;

    protected function _construct()
    {
        if (!$this->getItem() instanceof Mage_Sales_Model_Order_Invoice_Item
            && !$this->getItem() instanceof Mage_Sales_Model_Order_Creditmemo_Item
        ) {
            throw new Fooman_Connect_Model_DataSource_Exception(
                'Expected Mage_Sales_Model_Order_XXX_Item as data source input.'
            );
        }
    }

    /**
     * @return Mage_Sales_Model_Order_Item
     */
    public function getOrderItem()
    {
        if (null === $this->_orderItem) {
            //Magento unexpected behaviour
            //quote_item_id exists instead of order_item_id
            $orderItemId = $this->getItem()->getOrderItemId()
                ? $this->getItem()->getOrderItemId()
                : $this->getItem()->getQuoteItemId();
            $this->_orderItem = Mage::getModel('sales/order_item')->load($orderItemId);
        }
        return $this->_orderItem;
    }

    public function getQty()
    {
        return $this->getItem()->getQty();
    }

    protected function _getBundleChildren()
    {
        if ($this->getItem() instanceof Mage_Sales_Model_Order_Creditmemo_Item) {
            $collection = Mage::getResourceModel('sales/order_creditmemo_item_collection');
        } else {
            $collection = Mage::getResourceModel('sales/order_invoice_item_collection');
        }
        //parent_item_id relation is not maintained for invoices,creditmemos
        $collection->getSelect()->joinLeft(array('soi'=>$collection->getTable('sales/order_item')), 'soi.item_id = main_table.order_item_id');
        $collection->addFieldToFilter('parent_item_id', $this->getOrderItem()->getId());

        return $collection;
    }

    protected function _getNoneFixedPriceChildItem($item, $parentData, $base = false)
    {
        $magentoItemId = $item->getId();
        $dataSource = Mage::getModel(
            'foomanconnect/dataSource_lineItem_simple', array('item' => $item)
        );

        $data = $dataSource->getItemData($base);
        if (empty($data[$magentoItemId]['taxPercent'])) {
            $data[$magentoItemId]['taxPercent'] = $parentData['taxPercent'];
        }
        if (empty($data[$magentoItemId]['discountRate'])) {
            $data[$magentoItemId]['discountRate'] = $parentData['discountRate'];
        }

        return $data;
    }

}

<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Class Fooman_Connect_Model_DataSource_LineItem
 * @method Mage_Sales_Model_Order_Invoice_Item|Mage_Sales_Model_Order_Creditmemo_Item getItem()
 */
class  Fooman_Connect_Model_DataSource_LineItem
    extends Fooman_Connect_Model_DataSource_OrderItem_Bundle
    implements Fooman_Connect_Model_DataSource_LineItem_Interface
{

    protected $_product = null;

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

    public function getItemData($base = false)
    {
        if ($this->getOrderItem()->getParentItemId()) {
            return array();
        }
        switch ($this->getOrderItem()->getProductType()) {
            case 'bundle':
                $dataSource = Mage::getModel(
                    'foomanconnect/dataSource_lineItem_bundle', array(
                        'item'               => $this->getItem(),
                        'base_to_order_rate' => $this->getBaseToOrderRate()
                    )
                );
                break;
            default:
                $dataSource = Mage::getModel(
                    'foomanconnect/dataSource_lineItem_simple', array('item' => $this->getItem())
                );
        }
        return $dataSource->getItemData($base);
    }

    /**
     * @var Mage_Sales_Model_Order_Item
     */
    protected $_orderItem = null;

    /**
     * @return Mage_Sales_Model_Order_Item
     */
    public function getOrderItem()
    {
        if (null === $this->_orderItem) {
            //Magento unexpected behaviour
            //quote_item_id exists instead of order_item_id
            $orderItemId      = $this->getItem()->getOrderItemId()
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
}

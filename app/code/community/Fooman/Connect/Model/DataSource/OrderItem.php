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
 * Class Fooman_Connect_Model_DataSource_OrderItem
 * @method Mage_Sales_Model_Order_Item getItem()
 */
class Fooman_Connect_Model_DataSource_OrderItem extends Fooman_Connect_Model_DataSource_OrderItem_Abstract
{

    protected $_product = null;

    public function getOrderItem()
    {
        return $this->getItem();
    }

    public function getItemData($base = false)
    {
        switch ($this->getItem()->getProductType()) {
            case 'bundle':
                $dataSource = Mage::getModel(
                    'foomanconnect/dataSource_orderItem_bundle', array(
                        'item'               => $this->getItem(),
                        'base_to_order_rate' => $this->getBaseToOrderRate()
                    )
                );
                break;
            default:
                $dataSource = Mage::getModel(
                    'foomanconnect/dataSource_orderItem_simple', array('item' => $this->getItem())
                );
        }
        return $dataSource->getItemData($base);
    }
}

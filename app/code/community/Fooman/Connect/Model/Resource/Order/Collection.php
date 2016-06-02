<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_Resource_Order_Collection extends Fooman_Connect_Model_Resource_Collection_Abstract
{
    protected function _construct()
    {
        $this->_init('foomanconnect/order');
    }

    /**
     * @param $storeId
     *
     * @return Fooman_Connect_Model_Resource_Order_Collection $this
     */
    public function getUnexportedOrders($storeId)
    {
        $statusToExport = Mage::getStoreConfig('foomanconnect/order/exportwithstatus', $storeId);

        $this->addFieldToSelect('order_id');
        $this->addFieldToFilter(
            'main_table.xero_export_status', array(Fooman_Connect_Model_Status::NOT_EXPORTED, array('null' => true))
        );
        $this->addFieldToFilter(
            'status', array('in' => explode(',', $statusToExport))
        );
        $this->addFieldToFilter('store_id', $storeId);

        return $this;
    }

    public function getUnmigratedOrders()
    {
        $this->addFieldToFilter(
            'order_id', array(array('null' => true))
        );
        $this->addFieldToFilter(
            '_order_table.xero_export_status', array(array('notnull' => true))
        );

        return $this;
    }

    public function addConfigDateFilter($storeId)
    {
        $date = Mage::helper('foomanconnect')->getOrderStartDate($storeId);
        if (false !== $date) {
            $this->addFieldToFilter('_order_table.created_at', array('gteq' => $date));
        }
        return $this;
    }

    protected function _initSelect()
    {
        parent::_initSelect();
        $this->getSelect()->joinRight(
            array('_order_table' => $this->getTable('sales/order')),
            'main_table.order_id=_order_table.entity_id'
        );
        return $this;
    }

    public function getRawSize()
    {
        $select = clone $this->getSelect();
        $select->reset();
        $select->from($this->getMainTable(),'COUNT(*)');
        return $this->getConnection()->fetchOne($select);
    }
}

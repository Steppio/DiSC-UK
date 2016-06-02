<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_Resource_Invoice_Collection extends Fooman_Connect_Model_Resource_Collection_Abstract
{
    protected function _construct()
    {
        $this->_init('foomanconnect/invoice');
    }

    /**
     * @param $storeId
     *
     * @return Fooman_Connect_Model_Resource_Order_Collection $this
     */
    public function getUnexportedOrders($storeId)
    {
        $statusToExport = Mage::getStoreConfig('foomanconnect/order/exportwithstatusinvoices', $storeId);

        $this->addFieldToSelect('invoice_id');
        $this->addFieldToFilter(
            'xero_export_status', array(Fooman_Connect_Model_Status::NOT_EXPORTED, array('null' => true))
        );
        $this->addFieldToFilter(
            'state', array('in' => explode(',', $statusToExport))
        );
        $this->addFieldToFilter('store_id', $storeId);

        return $this;
    }

    public function addConfigDateFilter($storeId)
    {
        $date = Mage::helper('foomanconnect')->getOrderStartDate($storeId);
        if (false !== $date) {
            $this->addFieldToFilter('_invoice_table.created_at', array('gteq' => $date));
        }
        return $this;
    }

    protected function _initSelect()
    {
        parent::_initSelect();
        $this->getSelect()->joinRight(
            array('_invoice_table' => $this->getTable('sales/invoice')),
            'main_table.invoice_id=_invoice_table.entity_id'
        );
        return $this;
    }
}

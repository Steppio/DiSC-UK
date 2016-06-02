<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_Resource_Creditmemo_Collection extends Fooman_Connect_Model_Resource_Collection_Abstract
{
    protected function _construct()
    {
        $this->_init('foomanconnect/creditmemo');
    }

    /**
     * @param $storeId
     *
     * @return Fooman_Connect_Model_Resource_Creditmemo_Collection $this
     */
    public function getUnexportedCreditmemos($storeId)
    {
        $this->addFieldToSelect('creditmemo_id');
        $this->addFieldToFilter(
            'main_table.xero_export_status', array(Fooman_Connect_Model_Status::NOT_EXPORTED, array('null' => true))
        );
        $this->addFieldToFilter('store_id', $storeId);

        return $this;
    }

    public function getUnmigratedCreditmemos()
    {
        $this->addFieldToFilter(
            'creditmemo_id', array(array('null' => true))
        );
        $this->addFieldToFilter(
            '_creditmemo_table.xero_export_status', array(array('notnull' => true))
        );

        return $this;
    }

    public function addConfigDateFilter($storeId)
    {
        $date = Mage::helper('foomanconnect')->getCreditMemoStartDate($storeId);
        if (false !== $date) {
            $this->addFieldToFilter('_creditmemo_table.created_at', array('gteq' => $date));
        }
        return $this;
    }

    protected function _initSelect()
    {
        parent::_initSelect();
        $this->getSelect()->joinRight(
            array('_creditmemo_table' => $this->getTable('sales/creditmemo')),
            'main_table.creditmemo_id=_creditmemo_table.entity_id'
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

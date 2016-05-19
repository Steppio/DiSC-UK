<?php

class Tatva_Slider_Model_Mysql4_Slider_Collection extends Mage_Core_Model_Mysql4_Collection_Abstract
{
    public function _construct()
    {
        parent::_construct();
        $this->_init('slider/slider');
    }

    public function orderBySort(){
    	$this->getSelect()->order('sortorder');
    	return $this;
    }

    /**
     * Add Filter by store
     *
     * @param int|Mage_Core_Model_Store $store Store to be filtered
     * @return Tatva_Slider_Model_Mysql4_Slider_Collection Self
     */
    public function addStoreFilter($store)
    {
        if ($store instanceof Mage_Core_Model_Store) {
            $store = array (
                 $store->getId()
            );
        }

        $this->getSelect()->join(
            array('store_table' => $this->getTable('slider_store')),
            'main_table.slider_id = store_table.slider_id',
            array ()
        )->where('store_table.store_id in (?)', array (
            0,
            $store
        ))->group('main_table.slider_id');

        return $this;
    }          

    /**
     * After load processing - adds store information to the datasets
     *
     */
    protected function _afterLoad()
    {
        if ($this->_previewFlag) {
            $items = $this->getColumnValues('slider_id');
            if (count($items)) {
                $select = $this->getConnection()->select()->from(
                    $this->getTable('slider_store')
                )->where(
                    $this->getTable('slider_store') . '.slider_id IN (?)',
                    $items
                );
                if ($result = $this->getConnection()->fetchPairs($select)) {
                    foreach ($this as $item) {
                        if (!isset($result[$item->getData('slider_id')])) {
                            continue;
                        }
                        if ($result[$item->getData('slider_id')] == 0) {
                            $stores = Mage::app()->getStores(false, true);
                            $storeId = current($stores)->getId();
                            $storeCode = key($stores);
                        }
                        else {
                            $storeId = $result[$item->getData('slider_id')];
                            $storeCode = Mage::app()->getStore($storeId)->getCode();
                        }
                        $item->setData('_first_store_id', $storeId);
                        $item->setData('store_code', $storeCode);
                    }
                }
            }
        }

        parent::_afterLoad();
    }
}
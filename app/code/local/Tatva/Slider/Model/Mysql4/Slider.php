<?php

class Tatva_Slider_Model_Mysql4_Slider extends Mage_Core_Model_Mysql4_Abstract
{
    public function _construct()
    {    
        // Note that the slider_id refers to the key field in your database table.
        $this->_init('slider/slider', 'slider_id');
    }

    /**
     * Retrieve select object for load object data
     *
     * @param string $field
     * @param mixed $value
     * @return Zend_Db_Select
     */
    protected function _getLoadSelect($field, $value, $object) {

		$select = parent::_getLoadSelect($field, $value, $object);

		if ($object->getStoreId()) {
			$select->join(
				array('nns' => $this->getTable('slider_store')),
				$this->getMainTable() . '.item_id = `nns`.slider_id'
			)->where('status=1 AND `nns`.store_id in (0, ?) ',
			$object->getStoreId())->order('created_time DESC')->limit(1);
		}

		return $select;
	}

    /**
	 * Assign page to store views
	 *
	 * @param Mage_Core_Model_Abstract $object
	 */
	protected function _afterSave(Mage_Core_Model_Abstract $object)
	{
		$condition = $this->_getWriteAdapter()->quoteInto('slider_id = ?', $object->getId());

		// process slider item to store relation
		$this->_getWriteAdapter()->delete($this->getTable('slider_store'), $condition);
		foreach ((array) $object->getData('stores') as $store) {
			$storeArray = array ();
			$storeArray['slider_id'] = $object->getId();
			$storeArray['store_id'] = $store;
			$this->_getWriteAdapter()->insert(
				$this->getTable('slider_store'), $storeArray
			);
		}

		return parent::_afterSave($object);
	}

    /**
	 * Do store and category processing after loading
	 *
	 * @param Mage_Core_Model_Abstract $object Current slider item
	 */
	protected function _afterLoad(Mage_Core_Model_Abstract $object)
	{
	    // process slider item to store relation
		$select = $this->_getReadAdapter()->select()->from(
			$this->getTable('slider_store')
		)->where('slider_id = ?', $object->getId());

		if ($data = $this->_getReadAdapter()->fetchAll($select)) {
			$storesArray = array ();
			foreach ($data as $row) {
				$storesArray[] = $row['store_id'];
			}
			$object->setData('store_id', $storesArray);
		}

		return parent::_afterLoad($object);
	}

    
}
<?php
/**
 * CommerceLab Co.
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the CommerceLab License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://commerce-lab.com/LICENSE.txt
 *
 * @category   CommerceLab
* @package    CommerceLab_GreatNews
 * @copyright  Copyright (c) 2012 CommerceLab Co. (http://commerce-lab.com)
 * @license    http://commerce-lab.com/LICENSE.txt
 */

class CommerceLab_GreatNews_Model_Mysql4_Category extends Mage_Core_Model_Mysql4_Abstract
{
    public function _construct()
    {
        $this->_init('clnews/category', 'category_id');
    }

    protected function _beforeSave(Mage_Core_Model_Abstract $object)
    {
        $urlKey = trim($object->getData('url_key'));
        if ($urlKey=='') {
            $urlKey = $object->getData('title');
        }
        $object->setData('url_key', Mage::helper('clnews')->formatUrlKey($urlKey));
        return parent::_beforeSave($object);
    }

    protected function _afterSave(Mage_Core_Model_Abstract $object)
    {
        $condition = $this->_getWriteAdapter()->quoteInto('category_id = ?', $object->getId());
        $this->_getWriteAdapter()->delete($this->getTable('category_store'), $condition);

        if (!$object->getData('stores')) {
            $storeArray = array();
            $storeArray['category_id'] = $object->getId();
            $storeArray['store_id'] = Mage::app()->getStore(true)->getId();
            $this->_getWriteAdapter()->insert($this->getTable('category_store'), $storeArray);
        }
        else {
            foreach ((array)$object->getData('stores') as $store) {
                $storeArray = array();
                $storeArray['category_id'] = $object->getId();
                $storeArray['store_id'] = $store;
                $this->_getWriteAdapter()->insert($this->getTable('category_store'), $storeArray);
            }
        }

        // add path for the category
        if (!$object->getData('path')) {
            $select = $this->_getReadAdapter()->select()
                ->from($this->getTable('category'))
                ->where('category_id = ?', $object->getParentId());

            if ($data = $this->_getReadAdapter()->fetchAll($select)) {
                $path = $data[0]['path'].'/'.$object->getId();
                $this->_getWriteAdapter()->update($this->getTable('category'), array('path' => $path), 'category_id = '.$object->getId());
            } else {
                $this->_getWriteAdapter()->update($this->getTable('category'), array('path' => $object->getId()), 'category_id = '.$object->getId());
            }
        }
        return parent::_afterSave($object);
    }

    protected function _afterLoad(Mage_Core_Model_Abstract $object) {
        $select = $this->_getReadAdapter()->select()
            ->from($this->getTable('category_store'))
            ->where('category_id = ?', $object->getId());

        if ($data = $this->_getReadAdapter()->fetchAll($select)) {
            $storesArray = array();
            foreach ($data as $row) {
                $storesArray[] = $row['store_id'];
            }
            $object->setData('store_id', $storesArray);
        }

        // add full category url path
        /*
        $_ids = str_replace('/', ',', $object->getPath());
        if ($_ids) {
            $select = $this->_getReadAdapter()->select()
                ->from($this->getTable('category'))
                ->where('category_id IN ('.$_ids.')');
            $fullCategoryUrlPath = array();
            if ($data = $this->_getReadAdapter()->fetchAll($select)) {
                $fullCategoryUrlPath[] = $data['url_key'];
            }
            $object->setData('full_url_path', implode('/', $fullCategoryUrlPath));
        }*/

        return parent::_afterLoad($object);
    }
/*
    protected function _getLoadSelect($field, $value, $object)
    {
        $select = parent::_getLoadSelect($field, $value, $object);

        if ($object->getStoreId()) {
            $select->join(array('cps' => $this->getTable('cat_store')), $this->getMainTable().'.cat_id = `cps`.cat_id')
                    ->where('`cps`.store_id in (0, ?) ', $object->getStoreId())
                    ->order('store_id DESC')
                    ->limit(1);
        }
        return $select;
    }
    */
}

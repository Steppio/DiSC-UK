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

class CommerceLab_GreatNews_Model_Mysql4_News_Collection extends Mage_Core_Model_Mysql4_Collection_Abstract
{
    public function _construct()
    {
        parent::_construct();
        $this->_init('clnews/news');
    }

    public function addEnableFilter($status)
    {
        $this->getSelect()
            ->where('status = ?', $status);
        return $this;
    }

    public function addCategoryFilter($categoryId, $inAdmin = false)
    {
        if ($inAdmin) {
            $this->getSelect()->join(
            array('news_category_table' => $this->getTable('news_category')),
                'main_table.news_id = news_category_table.news_id',
                array()
            )->join(
            array('category_table' => $this->getTable('category')),
                        'news_category_table.category_id = category_table.category_id',
            array('category_name' => 'category_table.title')
            )
            ->where('news_category_table.category_id = "'.$categoryId.'"');
        } else {
            $this->getSelect()->join(
            array('news_category_table' => $this->getTable('news_category')),
                        'main_table.news_id = news_category_table.news_id',
            array()
            )->join(
            array('category_table' => $this->getTable('category')),
                        'news_category_table.category_id = category_table.category_id',
            array()
            )->join(
            array('category_store_table' => $this->getTable('category_store')),
                        'category_table.category_id = category_store_table.category_id',
            array()
            )
            ->where('category_table.url_key = "'.$categoryId.'"')
            ->where('category_store_table.store_id in (?)', array(0, Mage::app()->getStore()->getId()))
            ;
        }
        return $this;
    }

    public function addStoreFilter($store, $inAdmin = false)
    {
        $stores = array($store);
        //if(!$inAdmin) {
            $stores[] = 0;
        //} 
        $this->getSelect()->join(
            array('news_store_table' => $this->getTable('news_store')),
            'main_table.news_id = news_store_table.news_id',
            array()
        )
        ->where('news_store_table.store_id in (?)', $stores);
        $this->getSelect()->distinct();
        return $this;
    }

    public function getSelectCountSql()
    {
        $countSelect = parent::getSelectCountSql();

        $countSelect->reset(Zend_Db_Select::GROUP);
        $countSelect->from('', 'COUNT(DISTINCT main_table.news_id)');
        $countSelect->resetJoinLeft();

        return $countSelect;
    }
    
    protected function _afterLoad()
    {
        foreach($this as $item) {
            $stores = $this->lookupStoreIds($item->getId());
            $item->setData('store_id', $stores);

            $categories = $this->lookupCategory($item->getId());
            $item->setData('categories', $categories);
        }
        return parent::_afterLoad();
    }

    public function lookupStoreIds($objectId)
    {
        $adapter = Mage::getSingleton('core/resource')->getConnection('core_read');
    
        $tableName = Mage::getSingleton('core/resource')->getTableName('clnews_news_store');
        $select  = $adapter->select()
        ->from($tableName, 'store_id')
        ->where('news_id = ?',(int)$objectId);

        return $adapter->fetchCol($select);
    }

    public function lookupCategory($objectId)
    {
        $adapter = Mage::getSingleton('core/resource')->getConnection('core_read');

        $tableName = Mage::getSingleton('core/resource')->getTableName('clnews_news_category');
        $select  = $adapter->select()
        ->from($tableName, 'category_id')
        ->where('news_id = ?',(int)$objectId);

        return $adapter->fetchCol($select);
    }
}

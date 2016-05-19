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

class CommerceLab_GreatNews_Block_Abstract extends Mage_Core_Block_Template
{
    protected $_pagesCount = null;
    protected $_currentPage = null;
    protected $_viewMode = null;
    protected $_itemsOnPage = 10;
    protected $_itemsLimit;
    protected $_pages;
    protected $_latestItemsCount = 2;
    protected $_newsSortParameter;
    protected $_newsSortOrder;
    protected $_moduleName = 'clnews';

    protected function _construct()
    {
        $this->_currentPage = $this->getRequest()->getParam('page');
        if (!$this->_currentPage) {
            $this->_currentPage=1;
        }

        $this->_viewMode = $this->getRequest()->getParam('mode')?$this->getRequest()->getParam('mode'):$this->getData('mode');
        if (!$this->_viewMode) {
            $this->_viewMode = Mage::getStoreConfig('clnews/news_display/default_view_mode');
        }
        
        $itemsPerPage = (int)Mage::getStoreConfig('clnews/news_display/itemsperpage');
        if ($itemsPerPage > 0 /*&& (Mage::app()->getRequest()->getModuleName()==Mage::helper('clnews')->getRoute())*/) {
            $this->_itemsOnPage = $itemsPerPage;
        }

        $itemsLimit = (int)$this->getData('itemslimit');
        if ($itemsLimit==null) {
            $itemsLimit = (int)Mage::getStoreConfig('clnews/news_display/itemslimit');
        }
        if ($itemsLimit > 0) {
            $this->_itemsLimit = $itemsLimit;
        } else {
            $this->_itemsLimit = null;
        }

        $latestItemsCount = (int)Mage::getStoreConfig('clnews/news_display/latestitemscount');
        if ($latestItemsCount > 0) {
            $this->_latestItemsCount = $latestItemsCount;
        }

        $this->_newsSortParameter = Mage::getStoreConfig('clnews/news_display/sortnewsparameter');
        if (!$this->_newsSortParameter) {
            $this->_newsSortParameter = 'news_time';
        }
        $this->_newsSortOrder = Mage::getStoreConfig('clnews/news_display/sortnewsparameterorder');
        if (!$this->_newsSortOrder) {
            $this->_newsSortOrder = 'desc';
        }
    }

    public function getCategoryKey()
    {
        $category = $this->getData('category');
        if ($category==null) {
            $category = $this->getRequest()->getParam('category');
        }
        if (!preg_match('/^[0-9A-Za-z\-\_]+$/i', $category)) {return null;}
        return $category;
    }

    public function getCategory()
    {
        $category = $this->getData('category');
        if ($category==null) {
            $category = $this->getRequest()->getParam('category');
        }
        if (!preg_match('/^[0-9A-Za-z\-\_]+$/i', $category)) {
            return null;
        }
        return $category;
    }

    public function getNewsDates() {

        $collection = Mage::getModel('clnews/news')->getCollection();
    
        return $collection;
    
    }

    public function getNewsItems()
    {
        $collection = Mage::getModel('clnews/news')->getCollection();

        $category = $this->getCategoryKey()?$this->getCategoryKey():$this->getData('category');
        if($this->getData('itemslimit')) {
            $this->_itemsLimit = $this->getData('itemslimit');
        }
        if ($category!=null) {
            $catCollection = Mage::getModel('clnews/category')->getCollection()
                ->addStoreFilter(Mage::app()->getStore()->getId());
            if(substr($category,0,1)=='!') {
                $categories = explode(',', substr($category,1,strlen($category)-1));
                $catCollection->addFieldToFilter('url_key', array('in' => $categories));
            } else {
                $categories = explode(',', $category);
                $catCollection->addFieldToFilter('url_key', array('in' => $categories));
            }
            $categoryIds = array();
            foreach($catCollection as $catItem) {
                $categoryIds[] = $catItem->getCategoryId();
            }
            if (count($categoryIds)) {
                $categoryIdsString = implode(',', $categoryIds);
                $tableName = Mage::getSingleton('core/resource')->getTableName('clnews_news_category');
                $collection->getSelect()->joinLeft($tableName, 'main_table.news_id = ' . $tableName . '.news_id','category_id');
                if(substr($category,0,1)=='!') {
                    $collection->getSelect()->where($tableName . '.category_id NOT IN ('.$categoryIdsString.') OR '.$tableName . '.category_id IS NULL');
                } else {
                    $_where = $tableName . '.category_id IN ('.$categoryIdsString.')';
                    if (Mage::getStoreConfig('clnews/news_display/category_anchor')) {
                        $categoryTableName = Mage::getSingleton('core/resource')->getTableName('clnews_category');
                        $collection->getSelect()->joinLeft($categoryTableName, $tableName.'.category_id = ' . $categoryTableName . '.category_id', $categoryTableName . '.path');
                        foreach($categoryIds as $categoryId) {
                            $_where.= " OR (INSTR(".$categoryTableName .".path,'".$categoryId."/')  > 0)";
                        }
                    }
                    $collection->getSelect()->where($_where);
                }
            }
        } else {
            $collection->addStoreFilter(Mage::app()->getStore()->getId());
        }

        if ($tag = $this->getRequest()->getParam('tag')) {
            $collection = Mage::getModel('clnews/news')->getCollection()->setOrder($this->_newsSortParameter, $this->_newsSortOrder);
            if (count(Mage::app()->getStores()) > 1) {
                $tableName = Mage::getSingleton('core/resource')->getTableName('clnews_news_store');
                $collection->getSelect()->join($tableName, 'main_table.news_id = ' . $tableName . '.news_id','store_id');
                $collection->getSelect()->where($tableName . '.store_id = '.Mage::app()->getStore()->getId().' OR '. $tableName . '.store_id = 0');
            }
            $tag = urldecode($tag);
            $collection->getSelect()->where("tags LIKE '%". $tag . "%'");
        }

        $collection
            ->addEnableFilter(1)
            ->addFieldToFilter('publicate_from_time', array('or' => array(
                0 => array('date' => true, 'to' => date('Y-m-d H:i:s')),
                1 => array('is' => new Zend_Db_Expr('null'))),
                ), 'left')
            ->addFieldToFilter('publicate_to_time', array('or' => array(
                0 => array('date' => true, 'from' => date('Y-m-d H:i:s')),
                1 => array('is' => new Zend_Db_Expr('null'))),
                ), 'left')
            ->setOrder($this->_newsSortParameter, $this->_newsSortOrder);
        if ($this->_itemsLimit!=null && $this->_itemsLimit<$collection->getSize()) {
            $this->_pagesCount = ceil($this->_itemsLimit/$this->_itemsOnPage);
        } else {
            $this->_pagesCount = ceil($collection->getSize()/$this->_itemsOnPage);
        }
        for ($i=1; $i<=$this->_pagesCount;$i++) {
            $this->_pages[] = $i;
        }
        $this->setLastPageNum($this->_pagesCount);

        $offset = $this->_itemsOnPage*($this->_currentPage-1);
        if ($this->_itemsLimit!=null) {
            $_itemsCurrentPage = $this->_itemsLimit - $offset;
            if ($_itemsCurrentPage > $this->_itemsOnPage) {
                $_itemsCurrentPage = $this->_itemsOnPage;
            }
            $collection->getSelect()->limit($_itemsCurrentPage, $offset);
        } else {
            $collection->getSelect()->limit($this->_itemsOnPage, $offset);
        }

        foreach ($collection as $item) {
            $comments = Mage::getModel('clnews/comment')->getCollection()
                ->addNewsFilter($item->getNewsId())
                ->addApproveFilter(CommerceLab_GreatNews_Helper_Data::APPROVED_STATUS);
            $item->setCommentsCount(count($comments));
        }
        return $collection;
    }

    public function getLatestNewsItems()
    {
        $collection = Mage::getModel('clnews/news')->getCollection()
            ->addStoreFilter(Mage::app()->getStore()->getId());
        $collection->setPageSize($this->_latestItemsCount);
        $collection
            ->addEnableFilter(1)
            ->addFieldToFilter('publicate_from_time', array('or' => array(
                0 => array('date' => true, 'to' => date('Y-m-d H:i:s')),
                1 => array('is' => new Zend_Db_Expr('null'))),
                ), 'left')
            ->addFieldToFilter('publicate_to_time', array('or' => array(
                0 => array('date' => true, 'from' => date('Y-m-d H:i:s')),
                1 => array('is' => new Zend_Db_Expr('null'))),
                ), 'left')
            ->setOrder($this->_newsSortParameter, $this->_newsSortOrder);
        return $collection;
    }

    public function getCategories()
    {
        $collection = Mage::getModel('clnews/category')->getCollection()
            ->addStoreFilter(Mage::app()->getStore()->getId())
            ->setOrder('sort_id', 'asc');
        return $collection;
    }

    public function getTopLink()
    {
        $route = Mage::helper('clnews')->getRoute();
        $title = Mage::helper('clnews')->__(Mage::getStoreConfig('clnews/news_general/title'));
        if ($this->getParentBlock() && $this->getParentBlock()!=null) {
            $this->getParentBlock()->addLink($title, $route, $title, true, array(), 15, null, 'class="top-link-news"');
        }
    }

    public function getItemUrl($itemId) {
        return $this->getUrl(Mage::helper('clnews')->getRoute().'/newsitem/view', array('id' => $itemId));
    }

    public function isFirstPage()
    {
        if ($this->_currentPage==1) {
            return true;
        }
        return false;
    }

    public function isLastPage()
    {
        if ($this->_currentPage==$this->_pagesCount) {
            return true;
        }
        return false;
    }

    public function isPageCurrent($page)
    {
        if ($page==$this->_currentPage) {
            return true;
        }
        return false;
    }

    public function getPageUrl($page)
    {
        if (Mage::app()->getRequest()->getModuleName()==Mage::helper('clnews')->getRoute()) {
            if ($category = $this->getCategoryKey()) {
                return $this->getUrl('*', array('category' => $category, 'page' => $page));
            } else {
                return $this->getUrl('*', array('page' => $page));
            }
        } else {
            if (strstr( Mage::helper("core/url")->getCurrentUrl(), '?')) {
                $sign = '&';
            } else {
                $sign = '?';
            }
            if (strstr( Mage::helper("core/url")->getCurrentUrl(),'page=' )) {
                return preg_replace('(page=[0-9]+)', 'page='.$page, Mage::helper("core/url")->getCurrentUrl());
            } else {
                return Mage::helper("core/url")->getCurrentUrl().$sign.'page='.$page;
            }
        }
    }

    public function getNextPageUrl()
    {
        $page = $this->_currentPage+1;
        return $this->getPageUrl($page);
    }

    public function getPreviousPageUrl()
    {
        $page = $this->_currentPage-1;
        return $this->getPageUrl($page);
    }

    public function getPages()
    {
        return $this->_pages;
    }

    public function getCurrentCategory()
    {
        if ($this->getCategoryKey()) {
            $categories = Mage::getModel('clnews/category')
                ->getCollection()
                ->addFieldToFilter('url_key', $this->getCategoryKey())
                ->setPageSize(1);
            $category = $categories->getFirstItem();
            return $category;
        }
        return null;
    }

    public function getCategoryByNews($id)
    {
        $_category = $this->getCurrentCategory();
        if ($_category!= NULL) {
            return $_category;
        }
        $data = Mage::getModel('clnews/category')->getCategoryByNewsId($id);
        $data = new Varien_Object($data);
        $collection = Mage::getModel('clnews/category')->getCollection()
        ->addStoreFilter(Mage::app()->getStore()->getId());
        if ($data->getData('0/category_id')!= NULL) {
            $collection->getSelect()->where('main_table.category_id =' . $data->getData('0/category_id'));
            $category = $collection->getFirstItem();
            return $category;
        } else {
            $category = $collection->getFirstItem();
            return $category->setData('title','');
        }
    }

    public function setTemplate($template, $infoName='')
    {
        if ($infoName) {
            $info = explode('_', $infoName);
            if (!isset($info[0]) || !isset($info[1])) {
                return '';
            }

            $infoName = $info[0];
            $infoPosition = $info[1];

            if ($infoName=='menu') {
                $showCategoriesIn = Mage::getStoreConfig('clnews/news_display/show_categories_in');
                if (($showCategoriesIn!='left') && ($infoPosition=='left')) {
                    return '';
                }
                if (($showCategoriesIn!='right') && ($infoPosition=='right')) {
                    return '';
                }
            }

            if ($infoName=='latestnews') {
                $showLatestNewsIn = Mage::getStoreConfig('clnews/news_display/show_latest_news_in');
                if (($showLatestNewsIn!='left') && ($infoPosition=='left')) {
                    return '';
                }
                if (($showLatestNewsIn!='right') && ($infoPosition=='right')) {
                    return '';
                }
            }
        }

        $this->_template = $template;
        return $this;
    }
}

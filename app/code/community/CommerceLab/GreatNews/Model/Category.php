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

class CommerceLab_GreatNews_Model_Category extends Mage_Core_Model_Abstract
{
    protected function _construct(){
        parent::_construct();
        $this->_init('clnews/category');
    }

    public function getUrl()
    {
        return Mage::getUrl(Mage::helper('clnews')->getRoute()).$this->getUrlKey().Mage::helper('clnews')->getNewsitemUrlSuffix();
    }

    public function getCategoryByNewsId($id)
    {
        $db = Mage::getSingleton('core/resource')->getConnection('core_read');
        $select = $db->select()
             ->from(array(Mage::getSingleton('core/resource')->getTableName('clnews_news_category')),
                    array('category_id'))
             ->where('news_id = ?', $id);
        $stmt = $db->query($select);
        $result = $stmt->fetchAll();
        return $result;
    }

    public function getAllParents()
    {
        $path = explode('/', $this->getPath());
        if (count($path)) {
            unset($path[count($path)-1]);
        }
        if (count($path)) {
            $_collection = Mage::getModel('clnews/category')->getCollection()
            ->addFieldToFilter('category_id', $path);
            return $_collection;
        }
        return array();
    }
}

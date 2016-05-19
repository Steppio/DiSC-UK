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

class CommerceLab_GreatNews_Model_News extends Mage_Core_Model_Abstract
{
    public function _construct(){
        parent::_construct();
        $this->_init('clnews/news');
    }

    public function getUrl($category = '', $storeId = null) {
        if ($storeId) {
            $baseUrl = Mage::getUrl(Mage::helper('clnews')->getRoute($storeId), array('_store' => $storeId, '_nosid' => true));
        } else {
            $baseUrl = Mage::getUrl(Mage::helper('clnews')->getRoute());
        } 
        if ($category) {
            $url = $baseUrl.$category.'/'.$this->getUrlKey().Mage::helper('clnews')->getNewsitemUrlSuffix();
        } else {
            $url = $baseUrl.$this->getUrlKey().Mage::helper('clnews')->getNewsitemUrlSuffix();
        }
        return $url;
    }

    /**
     * Reset all model data
     *
     * @return CommerceLab_GreatNews_Model_News
     */
    public function reset()
    {
        $this->setData(array());
        $this->setOrigData();
        $this->_attributes = null;
        return $this;
    }
}

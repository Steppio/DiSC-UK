<?php

class Tatva_Slider_Model_Slider extends Mage_Core_Model_Abstract
{
    public function _construct()
    {
        parent::_construct();
        $this->_init('slider/slider');
    }

    public function getcustomersliderdata()
    {
       $collection = $this->getCollection()
            ->addFieldToFilter('status',1)
            ->orderBySort()
            ->addStoreFilter(Mage :: app()->getStore());
       if(Mage::getStoreConfig('slider/slider/maxlimit'))
       {
           $collection->setPageSize(Mage::getStoreConfig('slider/slider/maxlimit'));
       }

       return $collection;
    }
}
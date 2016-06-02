<?php

class Fooman_Connect_Model_Resource_Collection_Abstract extends Mage_Core_Model_Mysql4_Collection_Abstract
{

    /**
     * Varien_Data_Collection can't correctly combine null key items with
     * non-null key items as the array key could clash with real id value
     *
     * @param Varien_Object $item
     *
     * @return mixed
     */
    protected function _getItemId(Varien_Object $item)
    {
        $value = parent::_getItemId($item);
        if ($value) {
            return $value;
        } else {
            return $item->getEntityId();
        }
    }
}

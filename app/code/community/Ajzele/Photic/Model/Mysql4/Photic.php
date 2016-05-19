<?php

class Ajzele_Photic_Model_Mysql4_Photic extends Mage_Core_Model_Mysql4_Abstract
{
    protected function _construct()
    {
        $this->_init('photic/photic', 'mapper_id');
    }
}
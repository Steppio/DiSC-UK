<?php
 
class AffinityCloud_Acbanners_Model_Mysql4_Acbanners_Collection extends Mage_Core_Model_Mysql4_Collection_Abstract {
    public function _construct()
    {
        // parent::__construct();
        $this->_init('acbanners/acbanners');
    }
}
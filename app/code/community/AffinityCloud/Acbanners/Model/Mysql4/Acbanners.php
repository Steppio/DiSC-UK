<?php
 
class AffinityCloud_Acbanners_Model_Mysql4_Acbanners extends Mage_Core_Model_Mysql4_Abstract {
    public function _construct()
    {   
        $this->_init('acbanners/acbanners', 'id');
    }
}
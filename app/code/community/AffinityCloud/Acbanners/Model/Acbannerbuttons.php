<?php
 
class AffinityCloud_Acbanners_Model_Acbannerbuttons extends Mage_Core_Model_Abstract {
    public function _construct()
    {
        parent::_construct();
        
        $this->_init('acbanners/acbannerbuttons');
    }
}
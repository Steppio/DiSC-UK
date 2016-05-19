<?php
 
class AffinityCloud_Acbanners_Block_Adminhtml_Acbanners extends Mage_Adminhtml_Block_Widget_Grid_Container {
    public function __construct()
    {
        $this->_controller = 'adminhtml_acbanners';
        $this->_blockGroup = 'acbanners';
        $this->_headerText = Mage::helper('acbanners')->__('Manage Banners');
        $this->_addButtonLabel = Mage::helper('acbanners')->__('Add Banner');
        
        parent::__construct();
    }
}
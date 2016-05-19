<?php
 
class AffinityCloud_Acbanners_Block_Adminhtml_Acsidebanners extends Mage_Adminhtml_Block_Widget_Grid_Container {
    public function __construct()
    {
        $this->_controller = 'adminhtml_acsidebanners';
        $this->_blockGroup = 'acbanners';
        $this->_headerText = Mage::helper('acbanners')->__('Manage Side Banners');
        $this->_addButtonLabel = Mage::helper('acbanners')->__('Add Side Banner');
        
        parent::__construct();
    }
}
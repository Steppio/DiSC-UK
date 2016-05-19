<?php
 
class AffinityCloud_Acbanners_Block_Adminhtml_Acsidebanners_Edit extends Mage_Adminhtml_Block_Widget_Form_Container {
    public function __construct()
    {
        parent::__construct();
               
        $this->_objectId = 'id';
        $this->_blockGroup = 'acbanners';
        $this->_controller = 'adminhtml_acsidebanners';
 
        $this->_updateButton('save', 'label', Mage::helper('acbanners')->__('Save Banner'));
        $this->_updateButton('delete', 'label', Mage::helper('acbanners')->__('Delete Banner'));
    }
 
    public function getHeaderText()
    {
        if(Mage::registry('acbanners_data') && Mage::registry('acbanners_data')->getId()) {
            return Mage::helper('acbanners')->__("Edit Banner '%s'", $this->htmlEscape(Mage::registry('acbanners_data')->getTitle()));
        } else {
            return Mage::helper('acbanners')->__('Add Banner');
        }
    }
}
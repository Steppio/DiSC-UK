<?php

class Tatva_Slider_Block_Adminhtml_Slider_Edit extends Mage_Adminhtml_Block_Widget_Form_Container
{
    public function __construct()
    {
        parent::__construct();
                 
        $this->_objectId = 'id';
        $this->_blockGroup = 'slider';
        $this->_controller = 'adminhtml_slider';
        
        $this->_updateButton('save', 'label', Mage::helper('slider')->__('Save Slide'));
        $this->_updateButton('delete', 'label', Mage::helper('slider')->__('Delete Slide'));
		
        $this->_addButton('saveandcontinue', array(
            'label'     => Mage::helper('adminhtml')->__('Save And Continue Edit'),
            'onclick'   => 'saveAndContinueEdit()',
            'class'     => 'save',
        ), -100);

        $this->_formScripts[] = "
            function toggleEditor() {
                if (tinyMCE.getInstanceById('slider_content') == null) {
                    tinyMCE.execCommand('mceAddControl', false, 'slider_content');
                } else {
                    tinyMCE.execCommand('mceRemoveControl', false, 'slider_content');
                }
            }

            function saveAndContinueEdit(){
                editForm.submit($('edit_form').action+'back/edit/');
            }
        ";
    }  

    public function getHeaderText()
    {
        if( Mage::registry('slider_data') && Mage::registry('slider_data')->getId() ) {
            return Mage::helper('slider')->__("Edit Slide '%s'", $this->htmlEscape(Mage::registry('slider_data')->getTitle()));
        } else {
            return Mage::helper('slider')->__('Add Slide');
        }
    }
}
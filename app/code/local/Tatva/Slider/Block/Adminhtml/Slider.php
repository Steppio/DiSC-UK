<?php
class Tatva_Slider_Block_Adminhtml_Slider extends Mage_Adminhtml_Block_Widget_Grid_Container
{
  public function __construct()
  {
    $this->_controller = 'adminhtml_slider';
    $this->_blockGroup = 'slider';
    $this->_headerText = Mage::helper('slider')->__('Slider Manager');
    $this->_addButtonLabel = Mage::helper('slider')->__('Add Slide');
    parent::__construct();
  }
}
<?php

class Tatva_Slider_Block_Adminhtml_Slider_Edit_Tabs extends Mage_Adminhtml_Block_Widget_Tabs
{

  public function __construct()
  {
      parent::__construct();
      $this->setId('slider_tabs');
      $this->setDestElementId('edit_form');
      $this->setTitle(Mage::helper('slider')->__('Slide Information'));
  }

  protected function _prepareLayout()
  {
      $return = parent::_prepareLayout();

      $this->addTab(
          'main_section',
          array(
              'label' => Mage::helper('slider')->__('Slide Information'),
              'title' => Mage::helper('slider')->__('Slide Information'),
              'content' => $this->getLayout()->createBlock('slider/adminhtml_slider_edit_tab_form')->toHtml(),
              'active' => true,
          )
      );

      return $return;
  }
}
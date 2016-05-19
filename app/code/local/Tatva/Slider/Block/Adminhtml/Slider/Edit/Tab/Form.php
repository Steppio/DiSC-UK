<?php

class Tatva_Slider_Block_Adminhtml_Slider_Edit_Tab_Form extends Mage_Adminhtml_Block_Widget_Form
{
  protected function _prepareLayout()
  {
      parent::_prepareLayout();
      if(Mage::getSingleton('cms/wysiwyg_config')->isEnabled())
      {
          $this->getLayout()->getBlock('head')->setCanLoadTinyMce(true);
      }
  }

  protected function _prepareForm()
  {
      $form = new Varien_Data_Form();
      $form->setHtmlIdPrefix('slider_');
      $this->setForm($form);
      $fieldset = $form->addFieldset('slider_form', array('legend'=>Mage::helper('slider')->__('Slide information')));

      $slider = Mage::getModel('slider/slider')->load( $this->getRequest()->getParam('id') );
      $after_html = '';
      if( $slider->getFilename() )
      {
          $path = Mage::getBaseUrl('media')."customerslider/original/".$slider->getFilename();
          $after_html = '<a onclick="imagePreview(slider); return false;" href="'.$path.'">
                  <img height="22" width="22" class="small-image-preview v-middle" alt="'.$slider->getFilename().'" title="'.$slider->getFilename().'" id="slider" src="'.$path.'"/>
                  </a>';
      }
     
      $fieldset->addField('title', 'text', array(
          'label'     => Mage::helper('slider')->__('Title'),
          'class'     => 'required-entry',
          'required'  => true,
          'name'      => 'title',
      ));
	  
	   $fieldset->addField('slider_url', 'text', array(
          'label'     => Mage::helper('slider')->__('Url'),
          'name'      => 'slider_url',
		  'note'      => Mage::helper('slider')->__('Example: http://www.google.com'),
      ));

      $fieldset->addField('filename', 'file', array(
          'label'     => Mage::helper('slider')->__('File'),
          'name'      => 'filename',
          'after_element_html' => $after_html,
          'class'     => (($slider->getfilename()) ? '' : 'required-entry'),
          'required'  => (($slider->getfilename()) ? false : true),
          'note'      => Mage::helper('slider')->__('Upload upto 5 MB'),
	  ));

      /**
       * Check is single store mode
       */
      if (!Mage::app()->isSingleStoreMode()) {
          $fieldset->addField('store_id', 'multiselect',
                  array (
                          'name' => 'stores[]',
                          'label' => Mage::helper('cms')->__('Store view'),
                          'title' => Mage::helper('cms')->__('Store view'),
                          'required' => true,
                          'values' => Mage::getSingleton('adminhtml/system_store')->getStoreValuesForForm(false, true) ));
      }
      else {
          $fieldset->addField('store_id', 'hidden', array (
                  'name' => 'stores[]',
                  'value' => Mage::app()->getStore(true)->getId() ));
          $fieldset->setStoreId(Mage::app()->getStore(true)->getId());
      }

      $fieldset->addField('status', 'select', array(
          'label'     => Mage::helper('slider')->__('Status'),
          'name'      => 'status',
          'values'    => array(
              array(
                  'value'     => 1,
                  'label'     => Mage::helper('slider')->__('Enabled'),
              ),

              array(
                  'value'     => 2,
                  'label'     => Mage::helper('slider')->__('Disabled'),
              ),
          ),
      ));
     
      $fieldset->addField('sortorder', 'text', array(
          'label'     => Mage::helper('slider')->__('Sort Order'),
          'class'     => 'required-entry validate-digits',
          'required'  => true,
          'name'      => 'sortorder',
      ));

      $fieldset->addField('content', 'editor', array(
          'name'      => 'content',
          'label'     => Mage::helper('slider')->__('Content'),
          'title'     => Mage::helper('slider')->__('Content'),
          'style' => 'height:25em;width:600px',
          //'config'    => Mage::getSingleton('cms/wysiwyg_config')->getConfig(),
          'wysiwyg'   => true,
          'required'  => false,
      ));

      if ( Mage::getSingleton('adminhtml/session')->getsliderData() )
      {
          $form->setValues(Mage::getSingleton('adminhtml/session')->getsliderData());
          Mage::getSingleton('adminhtml/session')->setsliderData(null);
      } elseif ( Mage::registry('slider_data') ) {
          $form->setValues(Mage::registry('slider_data')->getData());
      }

      return parent::_prepareForm();
  }
}
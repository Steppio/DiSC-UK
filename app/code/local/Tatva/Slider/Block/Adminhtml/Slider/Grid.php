<?php

class Tatva_Slider_Block_Adminhtml_Slider_Grid extends Mage_Adminhtml_Block_Widget_Grid
{
  public function __construct()
  {
      parent::__construct();
      $this->setId('sliderGrid');
      $this->setDefaultSort('slider_id');
      $this->setDefaultDir('ASC');
      $this->setSaveParametersInSession(true);
  }

  protected function _prepareCollection()
  {
      $collection = Mage::getModel('slider/slider')->getCollection();
      $this->setCollection($collection);
      return parent::_prepareCollection();
  }

  protected function _prepareColumns()
  {
      $this->addColumn('slider_id', array(
          'header'    => Mage::helper('slider')->__('ID'),
          'align'     =>'right',
          'width'     => '80px',
          'index'     => 'slider_id',
          'type'  => 'number',
      ));

      $this->addColumn('title', array(
          'header'    => Mage::helper('slider')->__('Title'),
          'align'     =>'left',
          'index'     => 'title',
      ));

      if (!Mage::app()->isSingleStoreMode())
      {
          $this->addColumn('store_id',
                  array (
                          'header' => Mage::helper('cms')->__('Store view'),
                          'index' => 'store_id',
                          'type' => 'store',
                          'store_all' => true,
                          'store_view' => true,
                          'sortable' => false,
                          'filter_condition_callback' => array (
                                  $this,
                                  '_filterStoreCondition' ) ));
      }

      $this->addColumn('content', array(
			'header'    => Mage::helper('slider')->__('Slide Content'),
			'width'     => '550px',
			'index'     => 'content',
      ));

      $this->addColumn('status', array(
          'header'    => Mage::helper('slider')->__('Status'),
          'align'     => 'left',
          'width'     => '120px',
          'index'     => 'status',
          'type'      => 'options',
          'options'   => array(
              1 => 'Enabled',
              2 => 'Disabled',
          ),
      ));
	  
      $this->addColumn('action',
          array(
              'header'    =>  Mage::helper('slider')->__('Action'),
              'width'     => '100',
              'type'      => 'action',
              'getter'    => 'getId',
              'actions'   => array(
                  array(
                      'caption'   => Mage::helper('slider')->__('Edit'),
                      'url'       => array('base'=> '*/*/edit'),
                      'field'     => 'id'
                  )
              ),
              'filter'    => false,
              'sortable'  => false,
              'index'     => 'stores',
              'is_system' => true,
      ));
		
	  $this->addExportType('*/*/exportCsv', Mage::helper('slider')->__('CSV'));
	  $this->addExportType('*/*/exportXml', Mage::helper('slider')->__('XML'));
	  
      return parent::_prepareColumns();
  }

    protected function _prepareMassaction()
    {
        $this->setMassactionIdField('slider_id');
        $this->getMassactionBlock()->setFormFieldName('slider');

        $this->getMassactionBlock()->addItem('delete', array(
             'label'    => Mage::helper('slider')->__('Delete'),
             'url'      => $this->getUrl('*/*/massDelete'),
             'confirm'  => Mage::helper('slider')->__('Are you sure?')
        ));

        return $this;
    }

  public function getRowUrl($row)
  {
      return $this->getUrl('*/*/edit', array('id' => $row->getId()));
  }

  /**
     * Helper function to do after load modifications
     *
     */
    protected function _afterLoadCollection()
    {
        $this->getCollection()->walk('afterLoad');
        parent::_afterLoadCollection();
    }

  /**
     * Helper function to add store filter condition
     *
     * @param Mage_Core_Model_Mysql4_Collection_Abstract $collection Data collection
     * @param Mage_Adminhtml_Block_Widget_Grid_Column $column Column information to be filtered
     */
    protected function _filterStoreCondition($collection, $column)
    {
        if (!$value = $column->getFilter()->getValue()) {
            return;
        }

        $this->getCollection()->addStoreFilter($value);
    }

}
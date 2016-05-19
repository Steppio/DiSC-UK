<?php
 
class AffinityCloud_Acbanners_Block_Adminhtml_Acbannerbuttons_Grid extends Mage_Adminhtml_Block_Widget_Grid {
    public function __construct()
    {
        parent::__construct();

        $this->setId('acbannerbuttonsGrid');
        
        // This is the primary key of the database
        $this->setDefaultSort('id');
        $this->setDefaultDir('ASC');
        $this->setSaveParametersInSession(true);
        $this->setUseAjax(true);
    }
 
    protected function _prepareCollection()
    {
        $collection = Mage::getModel('acbanners/acbannerbuttons')->getCollection();
        $this->setCollection($collection);

        return parent::_prepareCollection();
    }
 
    protected function _prepareColumns()
    {
        $this->addColumn('id', [
            'header' => Mage::helper('acbanners')->__('Banner ID'),
            'align' =>'right',
            'width' => '50px',
            'index' => 'id'
        ]);
 
        $this->addColumn('image', [
            'header' => Mage::helper('acbanners')->__('Banner'),
            'align' =>'left',
            'filter' => false,
            'index' => 'image',
            'renderer' => 'acbanners/adminhtml_acbannerbuttons_grid_renderer_image',
            'width' => '200px'
        ]);
 
        $this->addColumn('title', [
            'header' => Mage::helper('acbanners')->__('Title'),
            'align' =>'left',
            'index' => 'title'
        ]);
 
        $this->addColumn('url', [
            'header' => Mage::helper('acbanners')->__('Banner URL'),
            'align' =>'left',
            'index' => 'url'
        ]);
 
        $this->addColumn('url', [
            'header' => Mage::helper('acbanners')->__('Colour'),
            'align' =>'left',
            'index' => 'colour'
        ]);
 
        $this->addColumn('created_time', [
            'header' => Mage::helper('acbanners')->__('Creation Time'),
            'align' => 'left',
            'width' => '120px',
            'type' => 'date',
            'default' => '--',
            'index' => 'created_time'
        ]);
 
        $this->addColumn('update_time', [
            'header' => Mage::helper('acbanners')->__('Update Time'),
            'align' => 'left',
            'width' => '120px',
            'type' => 'date',
            'default' => '--',
            'index' => 'update_time'
        ]);
 
        $this->addColumn('status', [
            'header' => Mage::helper('acbanners')->__('Status'),
            'align' => 'left',
            'width' => '80px',
            'index' => 'status',
            'type' => 'options',
            'options' => [
                1 => 'Active',
                0 => 'Inactive'
            ]
        ]);
 
        return parent::_prepareColumns();
    }
 
    public function getRowUrl($row)
    {
        return $this->getUrl('*/*/edit', ['id' => $row->getId()]);
    }
 
    public function getGridUrl()
    {
      return $this->getUrl('*/*/grid', ['_current'=>true]);
    }
 
 
}
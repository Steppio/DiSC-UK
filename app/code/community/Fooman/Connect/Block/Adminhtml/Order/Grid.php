<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Block_Adminhtml_Order_Grid extends Fooman_Connect_Block_Adminhtml_Common_Grid
{

    protected function _prepareCollection()
    {
        $collection = Mage::getModel('foomanconnect/order')->getCollection();

        $tableName = Mage::getSingleton("core/resource")->getTableName('sales/order_address');
        $collection->getSelect()->joinLeft(
            array(
                'order_address' => $tableName
            ),
            "`order_address`.`parent_id` = `_order_table`.`entity_id` AND `order_address`.`address_type`='billing'",
            array('company')
        );

        $this->setCollection($collection);
        return parent::_prepareCollection();
    }

    protected function _prepareColumns()
    {
        $this->addColumn(
            'real_order_id', array(
                'header' => Mage::helper('sales')->__('Order #'),
                'width'  => '80px',
                'type'   => 'text',
                'index'  => 'increment_id',
            )
        );

        $this->addColumn(
            'xero_export_status', array(
                'header'                    => Mage::helper('foomanconnect')->__('Xero Status'),
                'width'                     => '80px',
                'type'                      => 'options',
                'renderer'                  => 'foomanconnect/adminhtml_common_renderer_exportstatus',
                'options'                   => $this->getExportStatusOptions(),
                'index'                     => 'xero_export_status',
                'filter_condition_callback' => array($this, '_filterXeroStatus')
            )
        );

        $this->addColumn(
            'status', array(
                'header'  => Mage::helper('sales')->__('Status'),
                'index'   => 'status',
                'type'    => 'options',
                'width'   => '70px',
                'options' => Mage::getSingleton('sales/order_config')->getStatuses(),
            )
        );

        if (!Mage::app()->isSingleStoreMode()) {
            $this->addColumn(
                'store_id', array(
                    'header'          => Mage::helper('sales')->__('Purchased from (store)'),
                    'index'           => 'store_id',
                    'type'            => 'store',
                    'store_view'      => true,
                    'display_deleted' => true,
                )
            );
        }

        $this->addColumn(
            'created_at', array(
                'header' => Mage::helper('sales')->__('Date'),
                'index'  => 'created_at',
                'type'   => 'datetime',
                'width'  => '150px',
            )
        );

        $this->addColumn(
            'company', array(
                'header' => Mage::helper('customer')->__('Company'),
                'index'  => 'company',
                'type'   => 'text'
            )
        );

        $this->addColumn(
            'customer_lastname', array(
                'header' => Mage::helper('sales')->__('Customer Lastname'),
                'index'  => 'customer_lastname',
                'type'   => 'text'
            )
        );

        $this->addColumn(
            'grand_total', array(
                'header'   => Mage::helper('sales')->__('Grand Total'),
                'index'    => 'grand_total',
                'type'     => 'currency',
                'currency' => 'order_currency_code',
            )
        );
        $this->_addActionColumn('adminhtml/sales_order/view', 'order_id');
        return parent::_prepareColumns();
    }

    public function getExportStatusOptions()
    {
        return Fooman_Connect_Model_Status::getStatuses(true);
    }

    /**
     * @see getSalesOrderViewId() in order model. Main advantage: the url in column view can be opened vai CTRL+click in a new tab
     *      while the previous implementation with the getRowUrl can only be opened in the same window.
     *
     * @param $row
     *
     * @return bool|string
     */
    public function getRowUrl($row)
    {
        return false;
    }

    protected function _prepareMassaction()
    {
        $this->setMassactionIdField('entity_id');
        $this->getMassactionBlock()->setFormFieldName('order_ids');
        $this->getMassactionBlock()->setUseSelectAll(false);

        $this->getMassactionBlock()->addItem(
            'export_selected', array(
                'label' => Mage::helper('foomanconnect')->__('Export Selected'),
                'url'   => $this->getUrl('*/*/exportSelected'),
            )
        );

        $this->getMassactionBlock()->addItem(
            'set_as_exported_selected', array(
                'label' => Mage::helper('foomanconnect')->__('Never export selected'),
                'url'   => $this->getUrl('*/*/neverExportSelected'),
            )
        );
    }

}

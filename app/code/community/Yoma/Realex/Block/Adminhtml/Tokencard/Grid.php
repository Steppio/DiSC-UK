<?php
/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/osl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * @category    Yoma
 * @package     Yoma_Realex
 * @copyright   Copyright (c) 2014 YOMA LIMITED (http://www.yoma.co.uk)
 * @license     http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */
class Yoma_Realex_Block_Adminhtml_Tokencard_Grid extends Mage_Adminhtml_Block_Widget_Grid
{

    public function __construct()
    {
        parent::__construct();
        $this->setId("tokencardGrid");
        $this->setDefaultSort("id");
        $this->setDefaultDir("DESC");
        $this->setSaveParametersInSession(true);
    }

    public function getRowUrl($row)
    {
        return $this->getUrl("*/*/edit", array("id" => $row->getId()));
    }

    protected function _prepareCollection()
    {
        $collection = Mage::getModel("realex/tokencard")->getCollection();
        $fn = Mage::getModel('eav/entity_attribute')->loadByCode('1', 'firstname');
        $ln = Mage::getModel('eav/entity_attribute')->loadByCode('1', 'lastname');

        $collection->getSelect()
            ->join(array('ce1' => 'customer_entity_varchar'), 'ce1.entity_id=main_table.customer_id', array('firstname' => 'value'))
            ->where('ce1.attribute_id='.$fn->getAttributeId())
            ->join(array('ce2' => 'customer_entity_varchar'), 'ce2.entity_id=main_table.customer_id', array('lastname' => 'value'))
            ->where('ce2.attribute_id='.$ln->getAttributeId())
            ->columns(new Zend_Db_Expr("CONCAT(`ce1`.`value`, ' ',`ce2`.`value`) AS fullname"))
            ->columns(new Zend_Db_Expr("LEFT(`main_table`.`expiry_date`,2) as month"))
            ->columns(new Zend_Db_Expr("RIGHT(`main_table`.`expiry_date`,2) as year"))
        ;

        $this->setCollection($collection);
        return parent::_prepareCollection();
    }

    protected function _prepareColumns()
    {
        $this->addColumn("id", array(
        "header" => Mage::helper("realex")->__("ID"),
        "align" =>"right",
        "width" => "50px",
        "type" => "number",
        "index" => "id",
        ));

        $this->addColumn("customer_id", array(
            "header" => Mage::helper("realex")->__("Customer ID"),
            "align" =>"right",
            "width" => "50px",
            "type" => "number",
            "index" => "customer_id",
        ));

        $this->addColumn("fullname", array(
        "header" => Mage::helper("realex")->__("Customer Name"),
        'filter' => false,
        "index" => "fullname",
        ));

        $this->addColumn("token", array(
            "header" => Mage::helper("realex")->__("Token Ref"),
            "index" => "token",
        ));

        $this->addColumn("payer_ref", array(
            "header" => Mage::helper("realex")->__("Payer Ref"),
            "index" => "payer_ref",
        ));

        $this->addColumn("ch_name", array(
            "header" => Mage::helper("realex")->__("Card Holder Name"),
            "index" => "ch_name",
        ));

        $this->addColumn("card_type", array(
            "header" => Mage::helper("realex")->__("Card Type"),
            "index" => "card_type",
        ));

        $this->addColumn("last_four", array(
            "header" => Mage::helper("realex")->__("Last Four Digits"),
            "index" => "last_four",
        ));

        $this->addColumn("expiry_date", array(
            "header" => Mage::helper("realex")->__("Expiry Date"),
            "index" => "expiry_date",
        ));

        $this->addExportType('*/*/exportCsv', Mage::helper('sales')->__('CSV'));
        $this->addExportType('*/*/exportExcel', Mage::helper('sales')->__('Excel'));

        return parent::_prepareColumns();
    }

    protected function _prepareMassaction()
    {
        $this->setMassactionIdField('id');

        $this->getMassactionBlock()->setFormFieldName('ids');

        $this->getMassactionBlock()->setUseSelectAll(true);

        $this->getMassactionBlock()->addItem('remove_tokencard', array(
                 'label'=> Mage::helper('realex')->__('Delete Token Card'),
                 'url'  => $this->getUrl('realexAdmin/adminhtml_tokencard/massRemove'),
                 'confirm' => Mage::helper('realex')->__('Are you sure?')
            ));
        return $this;
    }

    protected function _setCollectionOrder($column)
    {
        $collection = $this->getCollection();
        if ($collection) {
            $columnIndex = $column->getFilterIndex() ?
                $column->getFilterIndex() : $column->getIndex();
            if($columnIndex == 'expiry_date'){
                $collection
                    ->setOrder('year', strtoupper($column->getDir()))
                    ->setOrder('month', strtoupper($column->getDir()));
            }else {
                $collection->setOrder($columnIndex, strtoupper($column->getDir()));
            }
        }
        return $this;
    }

}
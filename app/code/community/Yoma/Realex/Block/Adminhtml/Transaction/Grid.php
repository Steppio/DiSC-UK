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
class Yoma_Realex_Block_Adminhtml_Transaction_Grid extends Mage_Adminhtml_Block_Widget_Grid
{

    public function __construct()
    {
        parent::__construct();
        $this->setId("transactionGrid");
        $this->setDefaultSort("created_at");
        $this->setDefaultDir("DESC");
        $this->setSaveParametersInSession(true);
        $this->setUseAjax(true);
    }

    protected function _prepareCollection()
    {
        $collection = Mage::getModel("realex/transaction")->getCollection()->addErrorFilter();

        $this->setCollection($collection);
        return parent::_prepareCollection();
    }

    protected function _prepareColumns()
    {
        $this->addColumn("entity_id", array(
        "header" => Mage::helper("realex")->__("ID"),
        "align" =>"right",
        "width" => "50px",
        "type" => "number",
        "index" => "id",
        ));

        $this->addColumn("created_at", array(
            "header" => Mage::helper("realex")->__("Date"),
            "type" =>  "datetime",
            "index" => "created_at",
        ));

        $this->addColumn("service_code", array(
        "header" => Mage::helper("realex")->__("Method"),
        "index" => "service_code",
        ));

        $this->addColumn("transaction_reference", array(
            "header" => Mage::helper("realex")->__("Transaction Reference"),
            "index" => "transaction_reference",
        ));

        $this->addColumn("payment_id", array(
            "header" => Mage::helper("realex")->__("Payment"),
            "index" => "payment_id",
        ));

        $this->addColumn("order_id", array(
            "header" => Mage::helper("realex")->__("Order Increment Id"),
            "index" => "order_id",
        ));

        $this->addColumn("transaction_type", array(
            "header" => Mage::helper("realex")->__("Type"),
            "index" => "transaction_type",
        ));

        $this->addColumn("payment_amount", array(
            "header" => Mage::helper("realex")->__("Amount"),
            "index" => "payment_amount",
        ));

        $this->addColumn("error_message", array(
            "header" => Mage::helper("realex")->__("Error"),
            "index" => "error_message",
        ));

        $this->addExportType('*/*/exportCsv', Mage::helper('sales')->__('CSV'));
        $this->addExportType('*/*/exportExcel', Mage::helper('sales')->__('Excel'));

        return parent::_prepareColumns();
    }

    public function getGridUrl()
    {
        return $this->getUrl('*/*/grid', array('_current' => true));
    }

    /**
     * Retrieve row url
     *
     * @return string
     */
    public function getRowUrl($row)
    {
        return $this->getUrl('*/*/view', array('txn_id' => $row->getEntityId()));
    }

}
<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Class Fooman_Connect_Model_DataSource_Invoice
 * @method Mage_Sales_Model_Order_Invoice getInvoice()
 */
class Fooman_Connect_Model_DataSource_Invoice extends Fooman_Connect_Model_DataSource_Order
{

    protected function _construct()
    {
        if (!$this->getInvoice() instanceof Mage_Sales_Model_Order_Invoice) {
            throw new Fooman_Connect_Model_DataSource_Exception(
                'Expected Mage_Sales_Model_Order_Invoice as data source input.'
            );
        }
    }

    public function getSalesObject()
    {
        return $this->getInvoice();
    }

    public function getOrder()
    {
        return $this->getInvoice()->getOrder();
    }

    /**
     * @param array $input
     *
     * @return string
     */
    public function getXml(array $input = null)
    {
        if (null === $input) {
            $input = $this->getInvoiceData();
        }
        return Fooman_ConnectLicense_Model_DataSource_Converter_OrderXml::convert($input);
    }

    public function getInvoiceData()
    {
        if (!$this->getInvoice()->getId()) {
            throw new Fooman_Connect_Model_DataSource_Exception(
                'No Invoice'
            );
        }
        $base = Mage::getStoreConfig('foomanconnect/settings/xerotransfercurrency', $this->getSalesObject()->getStoreId())
            == Fooman_Connect_Model_System_CurrencyOptions::TRANSFER_BASE;
        $data = array();
        $data += $this->getOrderInfo($base);
        $data += $this->getSettings();
        $data += $this->getLineItems($base);
        $data += $this->getCustomerInfo();
        $data += $this->getBillingAddress();
        $data += $this->getTotals($base);
        $data = $this->applyFixes($data);
        ksort($data);
        return $this->_dispatchEvent('invoice',  $this->getSalesObject(), $data);
    }

    public function getLineItems($base = false)
    {
        $data = array();
        $versionUsed = Mage::getStoreConfig('foomanconnect/settings/xeroversion', $this->getSalesObject()->getStoreId());
        $taxRate = Fooman_Connect_Model_Xero_Defaults::getTaxrate($versionUsed, 0);
        foreach ($this->getSalesObject()->getAllItems() as $item) {
            $dataSource = Mage::getModel(
                'foomanconnect/dataSource_lineItem', array(
                    'item'               => $item,
                    'base_to_order_rate' => $this->getOrder()->getBaseToOrderRate()
                )
            );
            $itemData = $dataSource->getItemData($base);
            $data += $itemData;

            if ($itemData) {
                $taxRate = array_shift($itemData);
                if (isset($taxRate['taxType'])) {
                    $taxRate = $taxRate['taxType'];
                }
            }
        }

        $totals = Mage::getConfig()->getNode('global/pdf/totals');
        foreach ($totals->children() as $code => $total) {
            if (strlen((string)$total->source_field)) {
                $dataSource = $this->_getTotalDataSourceModel($code, $total, $taxRate);
                $itemData = $dataSource->getItemData($base);
                if ($itemData) {
                    $data += $itemData;
                }
            }
        }
        return array('invoiceLines' => $data);
    }

    protected function _getLinkToObject()
    {
        return Mage::helper('adminhtml')->getUrl(
            'adminhtml/sales_order_invoice/view/invoice_id/' . $this->getSalesObject()->getId(),
            array('_nosid' => true, '_nosecret' => true)
        );
    }
}

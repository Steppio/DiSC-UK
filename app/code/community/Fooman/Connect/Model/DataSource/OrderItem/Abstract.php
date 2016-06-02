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
 * Class Fooman_Connect_Model_DataSource_OrderItem_Abstract
 * @method Mage_Sales_Model_Order_Item getItem()
 */
class Fooman_Connect_Model_DataSource_OrderItem_Abstract extends Fooman_Connect_Model_DataSource_Abstract
{
    /**
     * @var array
     */
    protected $_taxRates = null;

    protected $_salesTaxItem = null;

    /**
     * @var Mage_Catalog_Model_Product
     */
    protected $_product = null;

    protected function _construct()
    {
        if (!$this->getItem() instanceof Mage_Sales_Model_Order_Item) {
            throw new Fooman_Connect_Model_DataSource_Exception(
                'Expected Mage_Sales_Model_Order_Item as data source input.'
            );
        }
    }

    /**
     * @return Mage_Sales_Model_Order_Item
     */
    public function getOrderItem()
    {
        return $this->getItem();
    }

    /**
     * @return Mage_Catalog_Model_Product
     */
    public function getProduct()
    {
        if (null === $this->_product && $this->getItem()->getProductId()) {
            $this->_product = Mage::getModel('catalog/product')
                ->setStoreId($this->getOrderItem()->getStoreId())
                ->load($this->getItem()->getProductId());
        }
        return $this->_product;
    }

    public function getItemData($base = false)
    {
        $data = array();
        $magentoItemId = $this->getItem()->getId();
        $data['sku'] = $this->getItem()->getSku();
        if (strlen($this->getItem()->getSku()) <= Fooman_Connect_Model_Item::ITEM_CODE_MAX_LENGTH) {
            $data['itemCode'] = $this->getItem()->getSku();
        }
        $data['qtyOrdered'] = $this->getQty();
        $data['name'] = $this->getItem()->getName();
        $data['taxAmount'] = $this->getAmount($this->getItem(), 'tax_amount', $base);
        if (null === $data['taxAmount']) {
            $data['taxAmount'] = 0;
        }
        $data['discountRate'] = $this->getDiscountPercent($base);
        $data['taxType'] = $this->_getItemTaxRate();
        $data['price'] = $this->getAmount($this->getOrderItem(), 'price', $base);
        $data['taxPercent'] = $this->getOrderItem()->getTaxPercent();
        $data['unitAmount'] = $this->getAmount($this->getOrderItem(), 'price_incl_tax', $base);
        //disconnect between price_incl_tax and price+tax $data['unitAmount'] =  $data['price'] + $data['taxAmount']/$data['qtyOrdered'];
        $data['lineTotalNoAdjust'] = $this->getAmount($this->getItem(), 'row_total_incl_tax', $base);
        $data['lineTotal'] = $this->getAmount($this->getItem(), 'row_total_incl_tax', $base);
        $data['xeroAccountCodeSale'] = $this->getXeroAccountCodeSale();

        $transport = new Varien_Object();
        $transport->setItemData($data);
        Mage::dispatchEvent(
            'foomanconnect_xero_lineitem',
            array(
                'item'       => $this->getItem(),
                'order_item' => $this->getOrderItem(),
                'transport'  => $transport
            )
        );

        return array($magentoItemId => $transport->getItemData());
    }

    public function getDiscountPercent($base)
    {
        if ($this->getOrderItem()->getDiscountPercent() != 0) {
            return $this->getOrderItem()->getDiscountPercent();
        }
        $discount = $this->getAmount($this->getItem(), 'discount_amount', $base);

        if ($this->getHiddenTaxAmount()) {
            $discount += $this->getAmount($this->getItem(), 'hidden_tax_amount', $base)
                * (1 + $this->getItem()->getTaxPercent() / 100);
        } elseif (Mage::getStoreConfig('tax/calculation/apply_after_discount', $this->getOrderItem()->getStoreId())
            == 1
        ) {
            $discount *= 1 + $this->getItem()->getTaxPercent() / 100;
        }

        $rowTotal = $this->getAmount($this->getItem(), 'row_total_incl_tax', $base);
        if (0 == $discount || 0 == $rowTotal) {
            return 0;
        }
        return round(100 * $discount / $rowTotal, 2);
    }

    public function getQty()
    {
        return $this->getItem()->getQtyOrdered();
    }

    public function getXeroAccountCodeSale()
    {
        if ($this->_getXeroAccountCodeFromTax($this->getOrderItem())) {
            return $this->_getXeroAccountCodeFromTax($this->getOrderItem());
        }
        if ($this->getProduct() && $this->getProduct()->getXeroSalesAccountCode()) {
            return $this->getProduct()->getXeroSalesAccountCode();
        }
        return Mage::getStoreConfig('foomanconnect/xeroaccount/codesale', $this->getOrderItem()->getStoreId());
    }


    /**
     * Retrieve taxcode as used in Xero for item in the following order:
     * 1. return Xero Rate as passed through from sales_convert_quote_item_to_order_item
     * 2. check against mapped tax rates via tax code
     * 3. check for Default Tax Rate with zero tax
     * 4. check if tax rate matches default as mentioned here: http://blog.xero.com/developer/api/types/
     * 5. download all rates from Xero and match based on tax rate
     * 6. last return empty to let Xero use its default for the account
     *
     * @return string
     */
    protected function _getItemTaxRate()
    {
        $item = $this->getOrderItem();
        $storeId = $item->getStoreId();

        if ($item->getXeroRate()) {
            if ($item->getXeroRate() != 'NONE') {
                $rates = explode(',', $item->getXeroRate());
                //only taking rates[0] at the moment until Xero supports multiple rates
                return $rates[0];
            }
        }
        if ((float)$item->getTaxAmount() == 0) {
            return Mage::getStoreConfig('foomanconnect/tax/xerodefaultzerotaxrate', $storeId);
        }

        $versionUsed = Mage::getStoreConfig('foomanconnect/settings/xeroversion', $storeId);
        $taxRate = $this->_getTaxRateFromItem($item);

        if (!$taxRate) {
            $taxRate = Fooman_Connect_Model_Xero_Defaults::getTaxrate($versionUsed, $item->getTaxPercent());
        }

        if (!$taxRate) {
            if (empty($this->_taxRates)) {
                $this->_taxRates = Mage::getModel('foomanconnect/system_taxOptions')->toOptionArray('options-only');
            }
            if (isset($this->_taxRates[sprintf("%01.4f", $item->getTaxPercent())])) {
                $taxRate = $this->_taxRates[sprintf("%01.4f", $item->getTaxPercent())];
            } else {
                $taxRate = '';
            }
        }
        return $taxRate;
    }

    /**
     * @param $item
     *
     * @return bool|string
     */
    protected function _getTaxRateFromItem($item)
    {
        if (!$this->_supportsIndividualTaxes()) {
            return false;
        }
        $salesOrderTaxItem = $this->_getSalesOrderTaxItem($item);
        return $salesOrderTaxItem->getXeroRate();
    }

    /**
     * @param $item
     *
     * @return bool|string
     */
    protected function _getXeroAccountCodeFromTax($item)
    {
        if (!$this->_supportsIndividualTaxes()) {
            return false;
        }
        $salesOrderTaxItem = $this->_getSalesOrderTaxItem($item);
        return $salesOrderTaxItem->getXeroSalesAccountCode();
    }

    /**
     * tax rates for individual line items has only been kept since 1.6
     *
     * @see sales_order_tax_item
     *
     * @return bool
     */
    protected function _supportsIndividualTaxes()
    {
        return file_exists(
            Mage::getConfig()->getModuleDir('', 'Mage_Tax')
            . DS . 'Model' . DS . 'Sales' . DS . 'Order' . DS . 'Tax' . DS . 'Item.php'
        );
    }

    /**
     * @param $item
     *
     * @return null
     * @throws Mage_Core_Exception
     */
    protected function _getSalesOrderTaxItem($item)
    {
        if (is_null($this->_salesTaxItem)) {
            $itemTaxCollection = Mage::getResourceModel('tax/sales_order_tax_item')
                ->getTaxItemsByItemId($item->getItemId());
            if (count($itemTaxCollection) > 1) {
                Mage::throwException('Xero can\'t accept multiple tax rates on a single item');
            }
            $firstItem = current($itemTaxCollection);

            $taxCollection = Mage::getModel('tax/calculation_rate')->getCollection();
            $taxCollection->getSelect()->joinLeft(
                array('sot' => $taxCollection->getTable('sales/order_tax')),
                'sot.code = main_table.code'
            );

            $taxCollection->addFieldToFilter('sot.tax_id', $firstItem['tax_id']);
            $this->_salesTaxItem = $taxCollection->getFirstItem();
        }
        return $this->_salesTaxItem;
    }
}

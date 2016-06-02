<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_DataSource_OrderItem_Bundle extends Fooman_Connect_Model_DataSource_OrderItem_Abstract
{

    public function getItemData($base = false)
    {
        $data = array();
        $magentoItemId = $this->getItem()->getId();

        $taxInclusive = Mage::getStoreConfigFlag(
            Mage_Tax_Model_Config::CONFIG_XML_PATH_PRICE_INCLUDES_TAX,
            $this->getOrderItem()->getStoreId()
        );
        $fixed = $this->_isFixedPriceBundle();

        if ($fixed) {
            $parentData = $this->_getFixedParentItem($taxInclusive, $base);
        } else {
            $parentData = $this->_getNoneFixedParentItem();
        }
        $data += array($magentoItemId=>$parentData);
        foreach ($this->_getBundleChildren() as $childItem) {
            if ($fixed) {
                $data += $this->_getFixedPriceChildItem(
                    $childItem, $parentData,
                    $taxInclusive, $base
                );
            } else {
                $data += $this->_getNoneFixedPriceChildItem(
                    $childItem, $parentData,
                    $base
                );
            }
        }

        $transport = new Varien_Object();
        $transport->setItemData($data);
        Mage::dispatchEvent(
            'foomanconnect_xero_bundlelineitem',
            array(
                'item'       => $this->getItem(),
                'order_item' => $this->getOrderItem(),
                'transport'  => $transport
            )
        );
        return $transport->getItemData();

    }

    protected function _getBundleChildren()
    {
        $collection = Mage::getResourceModel('sales/order_item_collection');
        $collection->addFieldToFilter('parent_item_id', $this->getItem()->getId());
        return $collection;
    }

    protected function _isFixedPriceBundle()
    {
        $fixedBundlePrice = false;
        $options = $this->getOrderItem()->getProductOptions();
        if ($options) {
            if (isset($options['product_calculations'])
                && $options['product_calculations'] == Mage_Catalog_Model_Product_Type_Abstract::CALCULATE_CHILD
            ) {
                $fixedBundlePrice = false;
            } else {
                $fixedBundlePrice = true;
            }
        }
        return $fixedBundlePrice;
    }

    protected function _getFixedParentItem($taxInclusive, $base = false)
    {
        $bundleprice = $this->_getBundlePrice($taxInclusive, $base);
        $data = $this->_getCommonItemData($this->getItem(), $base);

        $data['qtyOrdered'] = $this->getQty();
        $data['taxAmount'] = $this->getAmount($this->getItem(), 'tax_amount', $base);
        if (null === $data['taxAmount']) {
            $data['taxAmount'] = 0;
        }
        $data['discountRate'] = $this->getOrderItem()->getDiscountPercent();
        $data['taxType'] = $this->_getItemTaxRate();
        $data['price'] = $this->getAmount($this->getItem(), 'price', $base);
        $data['taxPercent'] = $this->getOrderItem()->getTaxPercent();
        $data['unitAmount'] = $this->getAmount($this->getItem(), 'price_incl_tax', $base) - $bundleprice;
        $data['lineTotalNoAdjust'] = $this->getAmount($this->getItem(), 'row_total_incl_tax', $base);
        $data['lineTotal'] = $this->getAmount($this->getItem(), 'row_total_incl_tax', $base);
        $data['xeroAccountCodeSale'] = $this->getXeroAccountCodeSale();
        return $data;
    }

    protected function _getNoneFixedParentItem()
    {
        $data = $this->_getCommonItemData($this->getItem());
        $data['qtyOrdered'] = $this->getQty();

        $data['taxAmount'] = 0;
        $data['discountRate'] = 0;
        $data['taxType'] = 'NONE';
        $data['price'] = 0;
        $data['taxPercent'] = 0;
        $data['unitAmount'] = 0;
        $data['lineTotalNoAdjust'] = 0;
        $data['lineTotal'] = 0;
        $data['xeroAccountCodeSale'] = $this->getXeroAccountCodeSale();
        return $data;
    }

    protected function _getFixedPriceChildItem($item, $parentData, $taxInclusive, $base = false)
    {

        $magentoItemId = $item->getId();
        $orderItem = $this->getOrderItemForItem($item);
        $productOptions = $orderItem->getProductOptions();

        $data = $this->_getCommonItemData($item, $base);
        $data['discountRate'] = $orderItem->getDiscountPercent() != '0.0000'
            ? $orderItem->getDiscountPercent()
            : $parentData['discountRate'];
        $data['taxPercent'] = $orderItem->getTaxPercent() != '0.0000'
            ? $orderItem->getTaxPercent()
            : $parentData['taxPercent'];
        $data['xeroAccountCodeSale'] = $this->getXeroAccountCodeSaleForItem($item, $parentData['xeroAccountCodeSale']);
        $data['taxType'] = $parentData['taxType'];

        $data['price'] = $this->getAmount($orderItem, 'price', $base);

        if (isset($productOptions['bundle_selection_attributes'])) {
            $bundleSelectionAttributes = unserialize($productOptions['bundle_selection_attributes']);
            $data['qtyOrdered'] = $parentData['qtyOrdered'] * $bundleSelectionAttributes['qty'];
            $data['unitAmount'] = round($bundleSelectionAttributes['price'] / $bundleSelectionAttributes['qty'], 2);
            if (!$taxInclusive) {
                $data['unitAmount'] = round($data['unitAmount'] * (1 + $data['taxPercent'] / 100), 2);
            }
            $data['lineTotal'] = $parentData['qtyOrdered']
                * $bundleSelectionAttributes['qty']
                * round($bundleSelectionAttributes['price'], 2);
        } else {
            $data['unitAmount'] = 0;
            $data['qtyOrdered'] = 1;
        }

        $data['taxAmount'] = $this->recalculatedTax($data);

        return array($magentoItemId => $data);
    }

    protected function _getNoneFixedPriceChildItem($item, $parentData, $base = false)
    {
        $magentoItemId = $item->getId();
        $dataSource = Mage::getModel(
            'foomanconnect/dataSource_orderItem_simple', array('item' => $item)
        );

        $data = $dataSource->getItemData($base);
        if (empty($data[$magentoItemId]['taxPercent'])) {
            $data[$magentoItemId]['taxPercent'] = $parentData['taxPercent'];
        }
        if (empty($data[$magentoItemId]['discountRate'])) {
            $data[$magentoItemId]['discountRate'] = $parentData['discountRate'];
        }

        return $data;
    }

    protected function _getCommonItemData($item, $base = false)
    {
        $data = array();
        $data['sku'] = $item->getSku();
        if (strlen($item->getSku()) <= Fooman_Connect_Model_Item::ITEM_CODE_MAX_LENGTH) {
            $data['itemCode'] = $item->getSku();
        }
        $data['name'] = $item->getName();
        $data['lineTotalNoAdjust'] = $this->getAmount($item, 'row_total_incl_tax', $base);
        return $data;
    }

    protected function _getBundlePrice($taxInclusive, $base = false)
    {
        $bundleItemsWithPrices = 0;
        $productOptions = $this->getOrderItem()->getProductOptions();
        if ($base) {
            if (isset($productOptions['bundle_options'])) {
                foreach ($productOptions['bundle_options'] as $bundleOption) {
                    foreach ($bundleOption['value'] as $bundleValue) {
                        $itemPrice = round(
                            $bundleValue['price'] * $this->getBaseToOrderRate(), 2
                        );
                        if (!$taxInclusive) {
                            $itemPrice = round($itemPrice * (1 + $this->getOrderItem()->getTaxPercent() / 100), 2);
                        }
                        $bundleItemsWithPrices += $itemPrice;
                    }
                }
            }
        } else {
            if (isset($productOptions['bundle_options'])) {
                foreach ($productOptions['bundle_options'] as $bundleOption) {
                    foreach ($bundleOption['value'] as $bundleValue) {
                        $itemPrice = round($bundleValue['price'], 2);
                        if (!$taxInclusive) {
                            $itemPrice = round($itemPrice * (1 + $this->getOrderItem()->getTaxPercent() / 100), 2);
                        }
                        $bundleItemsWithPrices += $itemPrice;
                    }
                }
            }
        }
        return $bundleItemsWithPrices;
    }

    public function getXeroAccountCodeSaleForItem($item, $parentXeroSalesAccountCode)
    {
        $product = Mage::getModel('catalog/product')->load($item->getProductId());
        if ($product && $product->getXeroSalesAccountCode()) {
            return $product->getXeroSalesAccountCode();
        }
        return $parentXeroSalesAccountCode;
    }

    public function getOrderItemForItem($item)
    {
        if ($item instanceof Mage_Sales_Model_Order_Item) {
            return $item;
        }
        //Magento unexpected behaviour
        //quote_item_id can exist instead of order_item_id
        $orderItemId      = $this->getItem()->getOrderItemId()
            ? $this->getItem()->getOrderItemId()
            : $this->getItem()->getQuoteItemId();
        $this->_orderItem = Mage::getModel('sales/order_item')->load($orderItemId);
        return Mage::getModel('sales/order_item')->load($item->getOrderItemId());
    }

    public function recalculatedTax($data)
    {
        //unitAmount is tax inclusive since derived from bundle_options
        $taxed = $data['unitAmount'] * $data['qtyOrdered'];
        $untaxed = $taxed / (1 + ($data['taxPercent'] / 100));
        return round($taxed - $untaxed, 2);
    }
}

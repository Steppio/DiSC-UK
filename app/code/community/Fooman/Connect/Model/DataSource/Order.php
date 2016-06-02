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
 * Class Fooman_Connect_Model_DataSource_Order
 * @method Mage_Sales_Model_Order getOrder()
 */
class Fooman_Connect_Model_DataSource_Order extends Fooman_Connect_Model_DataSource_Abstract
{
    protected $_actualDiscount = 0;
    protected $_actualSubtotal = 0;

    protected function _construct()
    {
        if (!$this->getOrder() instanceof Mage_Sales_Model_Order) {
            throw new Fooman_Connect_Model_DataSource_Exception(
                'Expected Mage_Sales_Model_Order as data source input.'
            );
        }
    }

    public function getSalesObject()
    {
        return $this->getOrder();
    }

    /**
     * @param array $input
     *
     * @return string
     */
    public function getXml(array $input = null)
    {
        if (null === $input) {
            $input = $this->getOrderData();
        }
        return Fooman_ConnectLicense_Model_DataSource_Converter_OrderXml::convert($input);
    }

    /**
     *
     * @return array
     * @throws Fooman_Connect_Model_DataSource_Exception
     */
    public function getOrderData()
    {
        if (!$this->getOrder()->getId()) {
            throw new Fooman_Connect_Model_DataSource_Exception(
                'No Order'
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
        return $this->_dispatchEvent('order', $this->getSalesObject(), $data);
    }

    /**
     * unfortunately Magento and Xero do not always agree on how to calculate
     * tax, rounding, bugs, etc
     *
     * adjust data based on chosen tax calculation mode
     * MAGE_CALC = take Magento's value directly - requires it to calculate exactly like Xero to not get rejected
     * XERO_CALC = let Xero recalculate
     * MIXED_CALC =  attempt to bridge the gap
     *
     * @param $data
     *
     * @return mixed
     */
    public function applyFixes($data)
    {
        $mode = Mage::getStoreConfig('foomanconnect/tax/xerooverridetax', $this->getSalesObject()->getStoreId());
        switch ($mode) {
            case Fooman_Connect_Model_System_TaxOverrideOptions::MAGE_CALC;
                if ($data['lineAmountTypes'] == 'Exclusive') {
                    foreach ($data['invoiceLines'] as $key => $line) {
                        $data['invoiceLines'][$key] = $this->removeTaxFromUnitAmount($line);
                    }
                }
                break;

            case Fooman_Connect_Model_System_TaxOverrideOptions::MIXED_CALC;
                foreach ($data['invoiceLines'] as $key => $line) {
                    $data['invoiceLines'][$key] = $this->runMixedCalcAdjustments($line, $data['lineAmountTypes']);
                }
                $data = $this->lineItemsAddUpToGrandTotal($data);
                break;

            case Fooman_Connect_Model_System_TaxOverrideOptions::XERO_CALC;
                foreach ($data['invoiceLines'] as $key => $line) {
                    $data['invoiceLines'][$key] = $this->runXeroCalcAdjustments($line, $data['lineAmountTypes']);
                }
                $data = $this->lineItemsAddUpToGrandTotal($data);
                break;

            case Fooman_Connect_Model_System_TaxOverrideOptions::XERO_REDUCED;
                $reducedLines = $this->runReduction($data['invoiceLines'], $data['lineAmountTypes']);
                unset($data['invoiceLines']);
                $data['invoiceLines'] = $reducedLines;
                $data = $this->lineItemsAddUpToGrandTotal($data);
                break;
        }
        return $data;
    }

    public function runReduction($lines, $taxInclusive)
    {
        $combined = array();
        foreach ($lines as $line) {
            $taxType = $line['taxType'];
            if ($taxInclusive == 'Exclusive') {
                $line = $this->removeTaxFromUnitAmount($line);
            }
            if (isset($combined[$taxType])) {
                $qtyOneLine = $this->reduceQtyForLine($line);
                $combined[$taxType]['unitAmount'] += $qtyOneLine['unitAmount'];
                //$combined[$taxType]['taxAmount'] += $qtyOneLine['taxAmount'];
                $combined[$taxType]['name'] .= ', '.$qtyOneLine['name'];
            } else {
                $combined[$taxType] = $this->reduceQtyForLine($line);
            }
        }
        return $combined;

    }

    public function runMixedCalcAdjustments($line, $taxInclusive)
    {
        //$this->fixUnitAmount($line);
        $line = $this->unitPricesAddUpToLineTotal($line, true);
        if ($taxInclusive == 'Exclusive') {
            $line = $this->removeTaxFromUnitAmount($line);
        }
        $line = $this->removeTaxAmount($line);
        $line = $this->removeLineTotalAmount($line);
        return $line;
    }

    public function runXeroCalcAdjustments($line, $taxInclusive)
    {
        //$this->fixUnitAmount($line);
        $line = $this->unitPricesAddUpToLineTotal($line, false);
        if ($taxInclusive == 'Exclusive') {
            $line = $this->removeTaxFromUnitAmount($line);
        }
        $line = $this->removeTaxAmount($line);
        $line = $this->removeLineTotalAmount($line);

        return $line;
    }

    /**
     * this one is generally not required but can be used in cases where
     * price_incl_tax and row_total_incl_tax are incorrect
     * uses price and tax percent to reconstruct unitAmount and lineTotal
     *
     * @param $line
     *
     * @return mixed
     */
    public function fixUnitAmount($line)
    {

        $priceDiff = ($line['price'] * (1 + ($line['taxPercent']) / 100)) - $line['unitAmount'];
        if (abs($priceDiff) > 0.05) {
            $line['unitAmount'] = round($line['price'] * (1 + ($line['taxPercent']) / 100), 2);
        }
        $line['lineTotal'] = $line['unitAmount'] * $line['qtyOrdered'];
        return $line;
    }

    /**
     * make sure that the individual line items combine to the grand total
     *
     * @param $data
     *
     * @return mixed
     */
    public function lineItemsAddUpToGrandTotal($data)
    {
        $actualDiscount = 0;
        $actualSubtotal = 0;
        $actualTax      = 0;
        foreach ($data['invoiceLines'] as $line) {
            $effectiveSubtotal = $this->getEffectiveLineTotal($line, $data['lineAmountTypes']);
            $actualSubtotal += $effectiveSubtotal;
            $actualTax += round(
                $effectiveSubtotal - round(($effectiveSubtotal / (1 + $line['taxPercent'] / 100)), 2), 2
            );
        }

        $rounding = $data['grandTotal'] - $actualSubtotal - $actualDiscount;
        if (abs(round($rounding, 2)) >= 0.01) {
            $data['invoiceLines']['rounding'] = $this->getRoundingEntry('Rounding', $rounding, $data['xeroAccountRounding']);
        }
        $data['taxAmount'] = $actualTax;
        return $data;
    }

    /**
     * Xero only supports 2 digit calculations, ensure the line total works
     *
     * @param $line
     * @param $fixLineTotal
     *
     * @return mixed
     */
    public function unitPricesAddUpToLineTotal($line, $fixLineTotal)
    {
        if (isset($line['unitAmount'])) {
            $lineTotalRecalc = $this->roundedAmount($line['qtyOrdered'] * round($line['unitAmount'], 2));
            if ($line['lineTotal'] != $lineTotalRecalc) {
                if ($fixLineTotal) {
                    $line['lineTotal'] = $lineTotalRecalc;
                } else {
                    $line['name']       = sprintf(
                        '%s x %s @ %s', $line['qtyOrdered'], $line['name'], $line['unitAmount']
                    );
                    $line['qtyOrdered'] = 1;
                    $line['unitAmount'] = $line['lineTotal'];
                }
            }
        }

        return $line;
    }

    /**
     * make sure we only use qty 1 for the invoice line
     * @param $line
     *
     * @return mixed
     */
    public function reduceQtyForLine($line)
    {
        $line = $this->factorOutDiscount($line);
        $line = $this->removeLineTotalAmount($line);
        if (isset($line['itemCode'])) {
            unset($line['itemCode']);
        }
        if (isset($line['sku'])) {
            unset($line['sku']);
        }
        unset($line['taxAmount']);
        $line['unitAmount'] = $line['unitAmount'] * $line['qtyOrdered'];
        $line['qtyOrdered'] = 1;
        return $line;
    }

    /**
     * adjust tax amount to be in line with Xero's calculation
     *
     * @param $line
     * @param $taxInclusive
     *
     * @return mixed
     */
    public function checkTaxAmounts($line, $taxInclusive)
    {
        $effectiveLineTotal = $this->getEffectiveLineTotal($line, $taxInclusive);
        $taxRecalculated    = $effectiveLineTotal - round($effectiveLineTotal / (1 + ($line['taxPercent']) / 100), 2);
        $taxDifference      = round($line['taxAmount'] - $taxRecalculated, 2);
        if ($taxDifference) {
            $line['taxAmount'] = $taxRecalculated;
        }
        return $line;
    }

    /**
     * unitAmount is tax inclusive, factor it out here (pre - discount)
     *
     * @param $line
     */
    public function removeTaxFromUnitAmount($line)
    {
        $line['unitAmount'] = round($line['unitAmount'] / (1 + ($line['taxPercent'] / 100)), 2);
        return $line;
    }

    /**
     * remove tax amount and line total from data to get Xero to calculate the amounts
     *
     * @param $line
     *
     * @return mixed
     */
    public function removeTaxAmount($line)
    {
        if (isset($line['taxAmount'])) {
            unset($line['taxAmount']);
        }
        return $line;
    }

    public function removeLineTotalAmount($line)
    {
        if (isset($line['unitAmount'])) {
            unset($line['lineTotal']);
        }
        return $line;
    }

    public function getCustomerInfo()
    {
        $data = array();
        //unfortunately using customer id will fail in Xero if the same customer uses a different billing name
        //on subsequent orders - likely related to Xero's inability to have the same customer name twice
        //$data['customerId'] = $this->getOrder()->getCustomerId();
        $data['customerFirstname'] = $this->getOrder()->getBillingAddress()->getFirstname();
        $data['customerLastname'] = $this->getOrder()->getBillingAddress()->getLastname();
        $data['customerEmail'] = $this->getOrder()->getCustomerEmail();

        if (Mage::getStoreConfigFlag('foomanconnect/settings/usecompany', $this->getOrder()->getStoreId())) {
            $company = $this->getOrder()->getBillingAddress()->getCompany();
            if (!empty($company)) {
                $data['firstName'] = $data['customerFirstname'];
                $data['lastName'] = $data['customerLastname'];
                $data['customerFirstname'] = $company;
                $data['customerLastname'] = '';
            }
        }
        if (empty($data['customerFirstname'])) {
            $data['customerFirstname'] = $this->getOrder()->getCustomerFirstname();
            $data['customerLastname'] = $this->getOrder()->getCustomerLastname();
        }

        $data['taxNumber'] = $this->_retrieveTaxNumber();
        return $data;
    }

    /**
     * get billing address info
     *
     * @return array
     * @throws Fooman_Connect_Model_DataSource_Exception
     */
    public function getBillingAddress()
    {
        $billingAddress = $this->getOrder()->getBillingAddress();
        $data           = array();

        if (!$billingAddress) {
            throw new Fooman_Connect_Model_DataSource_Exception(
                'Order has no billing address.'
            );
        }

        $data['billingStreet1']   = $billingAddress->getStreet(1);
        $data['billingStreet2']   = $billingAddress->getStreet(2);
        $data['billingCity']      = $billingAddress->getCity();
        $data['billingPostcode']  = $billingAddress->getPostcode();
        $data['billingCountry'] = $billingAddress->getCountryModel()->getName()
            ? $billingAddress->getCountryModel()->getName()
            : $billingAddress->getCountry();
        $data['billingRegion']    = $billingAddress->getRegion();
        $data['billingTelephone'] = $billingAddress->getTelephone();
        return $data;
    }

    public function getOrderInfo($base)
    {
        $data                        = array();
        $data['url']                 = $this->_getLinkToObject();
        $data['incrementId']         = $this->_getIncrementId();
        $data['reference']           = $this->_getReference();
        if ($base) {
            $data['currencyCode'] = $this->getOrder()->getStoreCurrencyCode();
        } else {
            $data['currencyCode'] = $this->getOrder()->getOrderCurrencyCode();
        }
        $data['createdAt']           = $this->getCreatedAtStore($this->getSalesObject());
        $data['shippingDescription'] = $this->getOrder()->getShippingDescription();
        $data['status'] = $this->getXeroStatus();
        return $data;
    }

    protected function _getIncrementId()
    {
        if (Mage::getStoreConfig('foomanconnect/settings/xeronumbering', $this->getOrder()->getStoreId())) {
            return '';
        } else {
            return $this->getSalesObject()->getIncrementId();
        }
    }

    public function getSettings()
    {
        $storeId                          = $this->getSalesObject()->getStoreId();
        $data                             = array();
        $data['shippingTaxTypeOverride']  = true;
        $data['xeroAccountCodeSale']      = Mage::getStoreConfig('foomanconnect/xeroaccount/codesale', $storeId);
        $data['xeroAccountCodeDiscounts'] = Mage::getStoreConfig('foomanconnect/xeroaccount/codediscounts', $storeId);
        $data['xeroAccountRounding']      = Mage::getStoreConfig('foomanconnect/xeroaccount/coderounding', $storeId);
        $data['xeroAccountCodeShipping']  = Mage::getStoreConfig('foomanconnect/xeroaccount/codeshipping', $storeId);
        $data['xeroAccountCodeSurcharge'] = Mage::getStoreConfig('foomanconnect/xeroaccount/codesurcharge', $storeId);
        if ($this->isTaxOverrideMode()) {
            $data['lineAmountTypes'] = 'Exclusive';
        } elseif (Mage::getStoreConfigFlag(Mage_Tax_Model_Config::CONFIG_XML_PATH_PRICE_INCLUDES_TAX, $storeId)) {
            $data['lineAmountTypes'] = 'Inclusive';
        } else {
            $data['lineAmountTypes'] = 'Exclusive';
        }

        $data += Mage::helper('foomanconnect/config')->getTrackingCategory(
            $storeId,
            $this->getOrder()->getCustomerGroupId()
        );
        return $data;
    }

    public function getTotals($base = false)
    {
        $data               = array();
        $data['taxAmount']  = $this->roundedAmount($this->getAmount($this->getSalesObject(), 'tax_amount', $base));
        $data['grandTotal'] = $this->roundedAmount($this->getAmount($this->getSalesObject(), 'grand_total', $base));

        return $data;
    }

    public function getLineItems($base = false)
    {
        $data = array();
        $taxRate = false;
        foreach ($this->getOrder()->getAllVisibleItems() as $item) {
            $dataSource = Mage::getModel(
                'foomanconnect/dataSource_orderItem', array(
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

    protected function _getTotalDataSourceModel($code, $total, $taxRate)
    {
        return Mage::getModel(
            'foomanconnect/dataSource_total',
            array(
                'sales_object' => $this->getSalesObject(),
                'code'         => $code,
                'total'        => $total,
                'item_tax_rate'=> $taxRate
            )
        );
    }

    /**
     * try to retrieve a tax number from various sources for this order
     * try order first, then billing address and lastly the customer account
     *
     * @return string|bool
     */
    protected function _retrieveTaxNumber()
    {
        if ($this->getOrder()->getCustomerTaxvat()) {
            return $this->getOrder()->getCustomerTaxvat();
        }

        $billingAddress = $this->getOrder()->getBillingAddress();
        if ($billingAddress) {
            $country = Mage::getStoreConfig(
                'foomanconnect/settings/xeroversion',
                $this->getOrder()->getStoreId()
            );
            if ($country == 'uk') {
                if ($billingAddress->getVatId()) {
                    return $billingAddress->getVatId();
                }
            }

            if ($billingAddress->getTaxId()) {
                return $billingAddress->getTaxId();
            }
        }

        if ($this->getOrder()->getCustomerId()) {
            $customer = Mage::getModel('customer/customer')->load($this->getOrder()->getCustomerId());
            if ($customer->getId()) {
                if ($customer->getTaxVat()) {
                    return $customer->getTaxVat();
                }
            }
        }
        return '';
    }

    protected function _getLinkToObject()
    {
        return Mage::helper('adminhtml')->getUrl(
            'adminhtml/sales_order/view/order_id/' . $this->getOrder()->getId(),
            array('_nosid' => true, '_nosecret' => true)
        );
    }

    protected function _getReference()
    {
        if (Mage::getStoreConfig('foomanconnect/settings/xeronumbering', $this->getOrder()->getStoreId())) {
            $reference = $this->getSalesObject()->getIncrementId();
        } else {
            $payment   = $this->getOrder()->getPayment();
            $reference = '';
            if ($payment) {
                switch ($payment->getMethod()) {
                    case 'purchaseorder':
                        $reference = $payment->getPoNumber();
                        break;
                    case 'sagepayserver':
                    case 'sagepaydirectpro':
                    case 'sagepaydirectpro_moto':
                    case 'sagepayform':
                    case 'sagepayrepeat':
                    case 'sagepayserver_moto':
                    case 'sagepaytoken':
                        $transaction = Mage::getModel('sagepaysuite2/sagepaysuite_transaction')
                            ->loadByParent($this->getOrder()->getId());
                        $reference = $transaction->getVpsTxId();
                        break;
                    default:
                        $reference = $payment->getLastTransId();
                        break;
                }
            }
        }

        $transport = new Varien_Object();
        $transport->setReference($reference);
        Mage::dispatchEvent(
            'foomanconnect_xero_order_reference',
            array(
                'sales_object' => $this->getSalesObject(),
                'transport'    => $transport
            )
        );
        return $transport->getReference();
    }

    public function getRoundingEntry($name, $roundingAmount, $roundingAcctCode)
    {
        $roundingAmount              = $this->roundedAmount($roundingAmount);
        $data['qtyOrdered']          = '1.0000';
        $data['sku']                 = '';
        $data['name']                = $name;
        $data['taxAmount']           = '0.0000';
        $data['taxType']             = 'NONE';
        $data['price']               = $roundingAmount;
        $data['unitAmount']          = $roundingAmount;
        $data['lineTotalNoAdjust']   = $roundingAmount;
        $data['lineTotal']           = $roundingAmount;
        $data['xeroAccountCodeSale'] = $roundingAcctCode;
        return $data;
    }

    public function getEffectiveLineTotal($line, $taxInclusive = 'Exclusive')
    {
        if (isset($line['unitAmount'])) {
            $effectiveLineTotal = $line['unitAmount'] * $line['qtyOrdered'];
        } else {
            $effectiveLineTotal = $line['lineTotal'];
        }

        //Quantity * Unit Amount * ((100 – DiscountRate)/100)
        /*@see http://developer.xero.com/documentation/api/invoices/#title2*/
        if (isset($line['discountRate'])) {
            $effectiveLineTotal = round($effectiveLineTotal * ((100 - $line['discountRate']) / 100), 2);
        }
        if (isset($line['unitAmount']) && $taxInclusive == 'Exclusive') {
            $effectiveLineTotal = $effectiveLineTotal * (1 + $line['taxPercent'] / 100);
        }
        return round($effectiveLineTotal, 2);
    }

    public function isTaxOverrideMode()
    {
        return Fooman_Connect_Model_System_TaxOverrideOptions::MAGE_CALC ==
        Mage::getStoreConfig('foomanconnect/tax/xerooverridetax', $this->getSalesObject()->getStoreId());
    }

    /**
     * Xero does not support discountRate on the CreditNote endpoint
     *
     * @param $line
     */
    public function factorOutDiscount($line)
    {
        if (false === isset($line['discountRate'])) {
            $line['discountRate'] = 0;
        }
        $line['unitAmount']   = $this->roundedAmount($line['unitAmount'] * ((100 - $line['discountRate']) / 100));
        $line['discountRate'] = 0;
        return $line;
    }

    public function getXeroStatus()
    {
        return Mage::getStoreConfig(
            'foomanconnect/order/xerostatus', $this->getSalesObject()->getStoreId()
        );
    }
}

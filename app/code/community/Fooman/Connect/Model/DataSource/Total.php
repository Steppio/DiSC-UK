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
 * Class Fooman_Connect_Model_DataSource_Total
 * @method Mage_Sales_Model_Abstract getSalesObject()
 * @method Mage_Core_Model_Config_Element getTotal()
 * @method string getCode()
 */
class Fooman_Connect_Model_DataSource_Total extends Fooman_Connect_Model_DataSource_Abstract
{

    protected $_product = null;
    protected $_order = null;

    protected $_toIgnore
        = array(
            'grand_total', 'subtotal', 'tax', 'discount', 'adjustment_positive', 'adjustment_negative'
        );

    protected function _getToIgnore()
    {
        return $this->_toIgnore;
    }

    protected function _construct()
    {
        if (!$this->getSalesObject() instanceof Mage_Sales_Model_Abstract) {
            throw new Fooman_Connect_Model_DataSource_Exception(
                'Expected Mage_Sales_Model_Abstract as data source input.'
            );
        }

        if (!$this->getTotal() instanceof Mage_Core_Model_Config_Element) {
            throw new Fooman_Connect_Model_DataSource_Exception(
                'Expected a config node as total input.'
            );
        }

        if (!(string)$this->getTotal()->source_field) {
            throw new Fooman_Connect_Model_DataSource_Exception(
                'Expected a non empty string as order total source field.'
            );
        }

        if (!$this->getCode()) {
            throw new Fooman_Connect_Model_DataSource_Exception(
                'Expected a non empty string as order total code.'
            );
        }
    }

    /**
     * @return Mage_Sales_Model_Order
     */
    public function getOrder()
    {
        if (null === $this->_order) {
            if ($this->getSalesObject() instanceof Mage_Sales_Model_Order) {
                $this->_order = $this->getSalesObject();
            } else {
                $this->_order = $this->getSalesObject()->getOrder();
            }
        }
        return $this->_order;
    }

    public function getItemData($base = false)
    {
        if (array_search($this->getCode(), $this->_getToIgnore()) !== false) {
            return false;
        }

        $method = 'get' . uc_words((string)$this->getTotal()->source_field, '');
        if (method_exists($this, $method)) {
            return $this->$method($base);
        } else {
            if ($this->getAmount($this->getSalesObject(), (string)$this->getTotal()->source_field, $base) == 0) {
                return false;
            }
            return $this->getTotalDefault($base);
        }
    }

    protected function _standardTotalId()
    {
        return $this->getCode();
    }

    protected function _standardTotalData()
    {
        $data        = array();
        $data['sku'] = $this->getCode();
        if (strlen($this->getCode()) <= Fooman_Connect_Model_Item::ITEM_CODE_MAX_LENGTH) {
            $data['itemCode'] = $this->getCode();
        }
        $data['qtyOrdered'] = '1.0000';
        $data['name']       = Mage::helper('core')->__((string)$this->getTotal()->title);
        $data['taxPercent'] = 0;
        return $data;
    }

    public function getShippingAmount($base)
    {
        if ($this->getAmount($this->getSalesObject(), (string)$this->getTotal()->source_field, $base) == 0) {
            return false;
        }
        $data         = $this->_standardTotalData();
        $data['name'] = $this->getOrder()->getShippingDescription();
        if (strlen($this->getOrder()->getShippingMethod()) <= Fooman_Connect_Model_Item::ITEM_CODE_MAX_LENGTH) {
            $data['itemCode'] = $this->getOrder()->getShippingMethod();
        }
        $data['taxAmount']           = $this->getAmount($this->getSalesObject(), 'shipping_tax_amount', $base);
        $data['taxType']             = $this->_getShippingTax();
        $data['price']               = $this->getAmount($this->getSalesObject(), (string)$this->getTotal()->source_field, $base);
        $data['unitAmount']          = $this->_getShippingAmount($base);
        $data['taxPercent']          = $this->_getShippingTaxPercent($data);
        $data['lineTotalNoAdjust']   = $data['price'];
        $data['lineTotal']           = $data['unitAmount'];
        $data['xeroAccountCodeSale'] = Mage::getStoreConfig(
            'foomanconnect/xeroaccount/codeshipping', $this->getSalesObject()->getStoreId()
        );
        return array($this->_standardTotalId() => $data);
    }

    protected function _getShippingTax()
    {
        $storeId            = $this->getSalesObject()->getStoreId();
        $shippingTaxType    = Mage::getStoreConfig('foomanconnect/tax/xeroshipping', $storeId);
        $shippingTaxPercent = Mage::getModel('foomanconnect/system_taxOptions')->toOptionArray($shippingTaxType, $storeId);
        if ((float)$this->getSalesObject()->getShippingAmount() > 0
            && (float)$this->getSalesObject()->getShippingTaxAmount() == 0
            && $shippingTaxPercent <> 0
        ) {
            if (Mage::getStoreConfigFlag('foomanconnect/xeroaccount/shippingisexpenseaccount', $storeId)) {
                $shippingTaxType = Mage::getStoreConfig('foomanconnect/tax/xeroexpensezerotaxrate', $storeId);
            } else {
                $shippingTaxType = Mage::getStoreConfig('foomanconnect/tax/xerodefaultzerotaxrate', $storeId);
            }
        }

        if (Fooman_Connect_Model_System_TaxOptions::USE_ITEM_TAX_TYPE == $shippingTaxType) {
            $shippingTaxType = $this->getItemTaxRate();
        }

        return $shippingTaxType;
    }

    /*
     * retrieve the shipping amount
     * favour shipping_incl_tax
     * as shipping_incl_tax != shipping_amount + shipping_tax_amount
     * however there are buggy implementations for shipping_incl_tax out there
     */
    public function _getShippingAmount($base)
    {
        if (floatval($this->getAmount($this->getSalesObject(), 'shipping_incl_tax', $base)) > 0.00) {
            return $this->getAmount($this->getSalesObject(), 'shipping_incl_tax', $base);
        } else {
            return $this->getAmount($this->getSalesObject(), 'shipping_amount', $base) +
            $this->getAmount($this->getSalesObject(), 'shipping_tax_amount', $base);
        }
    }

    public function _getShippingTaxPercent($data)
    {
        if ($data['taxAmount'] == 0) {
            return 0;
        }

        //Magento does not keep track of the shipping tax percentage directly
        $shippingTaxType = $data['taxType'];
        if (Fooman_Connect_Model_System_TaxOptions::USE_ITEM_TAX_TYPE == $shippingTaxType) {
            $shippingTaxType = $this->getItemTaxRate();
        }
        if (empty($shippingTaxType)) {
            throw new Fooman_Connect_Model_System_Exception(
                'No Shipping Tax Rate is defined under System > Configuration > Fooman Connect > Xero > Tax'
            );
        }
        return Mage::getModel('foomanconnect/system_taxOptions')->toOptionArray($shippingTaxType, $this->getSalesObject()->getStoreId());
    }

    public function getSurchargeAmount($base)
    {
        return $this->getFoomanSurchargeAmount($base);
    }

    public function getFoomanSurchargeAmount($base)
    {
        if ($this->getAmount($this->getSalesObject(), (string)$this->getTotal()->source_field, $base) == 0) {
            return false;
        }
        $data         = $this->_standardTotalData();
        $data['name'] = $this->getOrder()->getFoomanSurchargeDescription();
        $data['taxAmount']           = $this->getAmount($this->getSalesObject(), 'fooman_surcharge_tax_amount', $base);
        $data['taxType']             = $this->_getSurchargeTax();
        $data['price']               = $this->getAmount($this->getSalesObject(), (string)$this->getTotal()->source_field, $base);
        $data['unitAmount']          = $data['price'] + $data['taxAmount'];
        $data['taxPercent']          = $this->_getSurchargeTaxPercent($data);
        $data['lineTotalNoAdjust']   = $data['price'];
        $data['lineTotal']           = $data['unitAmount'];
        $data['xeroAccountCodeSale'] = Mage::getStoreConfig(
            'foomanconnect/xeroaccount/codesurcharge', $this->getSalesObject()->getStoreId()
        );
        return array($this->_standardTotalId() => $data);
    }

    protected function _getSurchargeTax()
    {
        $storeId = $this->getSalesObject()->getStoreId();
        $surchargeTaxType = Mage::getStoreConfig('foomanconnect/tax/xerosurcharge', $storeId);
        $surchargeTaxPercent = Mage::getModel('foomanconnect/system_taxOptions')->toOptionArray(
            $surchargeTaxType,
            $storeId
        );
        if ((float)$this->getSalesObject()->getFoomanSurchargeAmount() > 0
            && (float)$this->getSalesObject()->getFoomanSurchargeTaxAmount() == 0
            && $surchargeTaxPercent <> 0
        ) {
            $surchargeTaxType = Mage::getStoreConfig('foomanconnect/tax/xerosurchargezero', $storeId);
        }

        return $surchargeTaxType;
    }

    public function _getSurchargeTaxPercent($data)
    {
        if ($data['taxAmount'] == 0) {
            return 0;
        }

        //Magento does not keep track of the shipping tax percentage directly
        $surchargeTaxType = Mage::getStoreConfig('foomanconnect/tax/xerosurcharge', $this->getSalesObject()->getStoreId());
        return Mage::getModel('foomanconnect/system_taxOptions')->toOptionArray(
            $surchargeTaxType,
            $this->getSalesObject()->getStoreId()
        );
    }

    public function getTotalDefault($base)
    {
        $data                        = $this->_standardTotalData();
        $data['taxAmount']           = 0;
        $data['taxType']             = 'NONE';
        $data['price']               = $this->getAmount($this->getSalesObject(), (string)$this->getTotal()->source_field, $base);
        $data['unitAmount']          = $this->getAmount($this->getSalesObject(), (string)$this->getTotal()->source_field, $base);
        $data['lineTotalNoAdjust']   = $this->getAmount(
            $this->getSalesObject(), (string)$this->getTotal()->source_field, $base
        );
        $data['lineTotal']           = $this->getAmount(
            $this->getSalesObject(), (string)$this->getSalesObject()->source_field, $base
        );
        $data['xeroAccountCodeSale'] = '';
        return array($this->_standardTotalId() => $data);
    }

    public function getVaimoKlarnaFee($base)
    {
        $info =  $this->getOrder()->getPayment()->getMethodInstance()->getInfoInstance();
        if (!$info) {
            return 0;
        }

        $fee =  $info->getAdditionalInformation(Vaimo_Klarna_Helper_Data::KLARNA_INFO_FIELD_FEE);
        $tax = $info->getAdditionalInformation(Vaimo_Klarna_Helper_Data::KLARNA_INFO_FIELD_FEE_TAX);


        if ($fee == 0) {
            return false;
        }
        $data         = $this->_standardTotalData();
        $data['name'] = Mage::helper('klarna')->__('Invoice fee');
        $data['taxAmount']           = $tax;
        if ($tax > 0) {
            $data['taxType'] = Mage::getStoreConfig(
                'foomanconnect/tax/xeroshipping', $this->getSalesObject()->getStoreId()
            );
            $data['taxPercent'] = Mage::getModel('foomanconnect/system_taxOptions')->toOptionArray(
                $data['taxType'], $this->getSalesObject()->getStoreId()
            );
        } else {
            $data['taxType'] = Mage::getStoreConfig(
                'foomanconnect/tax/xerodefaultzerotaxrate', $this->getSalesObject()->getStoreId()
            );
            $data['taxPercent'] = 0;
        }
        $data['price'] = $fee;
        $data['unitAmount'] = $data['price'] + $data['taxAmount'];


        $data['lineTotalNoAdjust']   = $data['price'];
        $data['lineTotal']           = $data['unitAmount'];
        $data['xeroAccountCodeSale'] = Mage::getStoreConfig(
            'foomanconnect/xeroaccount/vaimoklarnafeeaccount', $this->getSalesObject()->getStoreId()
        );

        return array($this->_standardTotalId() => $data);
    }


    /*
    public function getMultifeesAmount($base)
    {
        if ($this->getAmount($this->getSalesObject(), (string)$this->getTotal()->source_field, $base) == 0) {
            return false;
        }
        $data         = $this->_standardTotalData();
        $data['name'] = 'Additional Fees';
        $data['taxAmount']           = 0;//getMultifeesTaxAmount
        $data['taxType']             = 'NONE';
        $data['price']               = $this->getAmount($this->getSalesObject(), (string)$this->getTotal()->source_field, $base);
        $data['unitAmount']          = $data['price'] + $data['taxAmount'];
        $data['taxPercent']          = 0;
        $data['lineTotalNoAdjust']   = $data['price'];
        $data['lineTotal']           = $data['unitAmount'];
        $data['xeroAccountCodeSale'] = '232';
        return array($this->_standardTotalId() => $data);
    }
    */

    //MageWorx Customer Credit
    public function getCustomerCreditAmount($base)
    {
        if ($this->getAmount($this->getSalesObject(), (string)$this->getTotal()->source_field, $base) == 0) {
            return false;
        }
        $data         = $this->_standardTotalData();
        $data['name'] = Mage::helper('customercredit')->__('Internal Credit');
        $data['taxAmount']           = 0;
        $data['taxType']             = 'NONE';
        $data['price']               = -1 * $this->getAmount($this->getSalesObject(), (string)$this->getTotal()->source_field, $base);
        $data['unitAmount']          = $data['price'] - $data['taxAmount'];
        $data['taxPercent']          = 0;
        $data['lineTotalNoAdjust']   = $data['price'];
        $data['lineTotal']           = $data['unitAmount'];
        $data['xeroAccountCodeSale'] = Mage::getStoreConfig(
            'foomanconnect/xeroaccount/codesale', $this->getSalesObject()->getStoreId()
        );
        return array($this->_standardTotalId() => $data);
    }

    //MW Rewards Points
    public function getRewardpointsDiscount($base)
    {
        if ($base) {
            $amount = $this->getSalesObject()->getMwRewardpointDiscount();
        } else {
            $amount = $this->getSalesObject()->getMwRewardpointDiscountShow();
        }
        if ($amount == 0) {
            return false;
        }
        $data = $this->_standardTotalData();
        $data['name'] = Mage::helper('rewardpoints')->__('Reward Points Discount');
        $data['taxAmount'] = 0;
        $data['taxType'] = 'NONE';
        $data['price'] = $amount;
        $data['unitAmount'] = $data['price'] - $data['taxAmount'];
        $data['taxPercent'] = 0;
        $data['lineTotalNoAdjust'] = $data['price'];
        $data['lineTotal'] = $data['unitAmount'];
        $data['xeroAccountCodeSale'] = Mage::getStoreConfig(
            'foomanconnect/xeroaccount/codemwrewardspointsdiscount', $this->getSalesObject()->getStoreId()
        );
        return array($this->_standardTotalId() => $data);
    }
}

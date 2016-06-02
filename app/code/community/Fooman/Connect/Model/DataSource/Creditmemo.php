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
 * Class Fooman_Connect_Model_DataSource_Creditmemo
 * @method Mage_Sales_Model_Order_Creditmemo getCreditmemo()
 */
class Fooman_Connect_Model_DataSource_Creditmemo extends Fooman_Connect_Model_DataSource_Invoice
{

    protected function _construct()
    {
        if (!$this->getCreditmemo() instanceof Mage_Sales_Model_Order_Creditmemo) {
            throw new Fooman_Connect_Model_DataSource_Exception(
                'Expected Mage_Sales_Model_Order_Creditmemo as data source input.'
            );
        }
    }

    public function getSalesObject()
    {
        return $this->getCreditmemo();
    }

    public function getOrder()
    {
        return $this->getCreditmemo()->getOrder();
    }

    /**
     * @param array $input
     *
     * @return string
     */
    public function getXml(array $input = null)
    {
        if (null === $input) {
            $input = $this->getCreditmemoData();
        }
        return Fooman_ConnectLicense_Model_DataSource_Converter_CreditmemoXml::convert($input);
    }

    public function getCreditmemoData()
    {
        if (!$this->getCreditmemo()->getId()) {
            throw new Fooman_Connect_Model_DataSource_Exception(
                'No Creditmemo'
            );
        }
        $base = Mage::getStoreConfig('foomanconnect/settings/xerotransfercurrency', $this->getSalesObject()->getStoreId())
            == Fooman_Connect_Model_System_CurrencyOptions::TRANSFER_BASE;
        $data = array();
        $data += $this->getOrderInfo($base);
        $data += $this->getSettings();
        //need to keep this inclusive until Xero also supports discounts on CreditNotes
        $data['lineAmountTypes'] = 'Inclusive';
        $data += $this->getLineItems($base);
        $data += $this->getCustomerInfo();
        $data += $this->getBillingAddress();
        $data += $this->getTotals($base);
        $data = $this->applyFixes($data);
        ksort($data);
        return $this->_dispatchEvent('creditmemo',  $this->getSalesObject(), $data);
    }

    protected function _getTotalDataSourceModel($code, $total, $taxRate)
    {
        return Mage::getModel(
            'foomanconnect/dataSource_creditmemoTotal',
            array(
                'sales_object' => $this->getSalesObject(),
                'code'         => $code,
                'total'        => $total,
                'item_tax_rate'=> $taxRate
            )
        );
    }

    protected function _getLinkToObject()
    {
        return Mage::helper('adminhtml')->getUrl(
            'adminhtml/sales_order_creditmemo/view/creditmemo_id/' . $this->getSalesObject()->getId(),
            array('_nosid' => true, '_nosecret' => true)
        );
    }

    protected function _getIncrementId()
    {
        if (Mage::getStoreConfig('foomanconnect/settings/xeronumbering', $this->getOrder()->getStoreId())) {
            return '';
        } else {
            $prefix = Mage::getStoreConfig('foomanconnect/creditmemo/xeroprefix', $this->getOrder()->getStoreId());
            return $prefix . $this->getSalesObject()->getIncrementId();
        }
    }

    protected function _getReference()
    {
        $reference = $this->getOrder()->getIncrementId();
        $transport = new Varien_Object();
        $transport->setReference($reference);
        Mage::dispatchEvent(
            'foomanconnect_xero_creditmemo_reference',
            array(
                'sales_object' => $this->getSalesObject(),
                'transport'    => $transport
            )
        );
        return $transport->getReference();
    }

    public function runMixedCalcAdjustments($line, $taxInclusive)
    {
        $line = $this->factorOutDiscount($line);
        return parent::runMixedCalcAdjustments($line, $taxInclusive);
    }

    public function runXeroCalcAdjustments($line, $taxInclusive)
    {
        $line = $this->factorOutDiscount($line);
        return parent::runXeroCalcAdjustments($line, $taxInclusive);
    }

    public function getXeroStatus()
    {
        return Mage::getStoreConfig(
            'foomanconnect/creditmemo/xerostatus', $this->getSalesObject()->getStoreId()
        );
    }

}

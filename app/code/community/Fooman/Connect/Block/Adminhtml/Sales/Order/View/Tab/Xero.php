<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */


class Fooman_Connect_Block_Adminhtml_Sales_Order_View_Tab_Xero
    extends Mage_Adminhtml_Block_Sales_Order_View_Tab_Info
{
    protected function _construct()
    {
        parent::_construct();
        $this->setTemplate('fooman/connect/order/view/tab/xero.phtml');
    }

    public function getOrder()
    {
        return Mage::registry('current_order');
    }

    public function getTabLabel()
    {
        return Mage::helper('foomanconnect')->__('Xero');
    }

    public function getTabTitle()
    {
        return Mage::helper('foomanconnect')->__('Fooman Connect > Xero');
    }

    public function getXeroOrderStatus()
    {
        $id = $this->getOrder()->getId();
        return Mage::getModel('foomanconnect/order')->load($id);
    }


    public function getXeroPayments()
    {
        return Mage::getModel('foomanconnect/xero_api')->getPaymentsForInvoice(
            $this->getXeroOrderStatus()->getXeroInvoiceId()
        );
    }

    public function getXeroUrl()
    {
        $xeroInvoiceId = $this->getXeroOrderStatus()->getXeroInvoiceId();
        return Fooman_Connect_Model_Xero_Api::XERO_INVOICE_LINK . $xeroInvoiceId;
    }

    public function displayPayments()
    {
        return Mage::getStoreConfig('foomanconnect/order/xeropayments');
    }

    public function isExported()
    {
        if (!$this->getXeroOrderStatus()) {
            return false;
        }
        return ($this->getXeroOrderStatus()->getXeroExportStatus()
            == Fooman_Connect_Model_Status::EXPORTED);
    }

    public function getXeroLastValidationErrors()
    {
        if (!$this->getXeroOrderStatus()) {
            return false;
        }
        $validationErrors = $this->getXeroOrderStatus()->getXeroLastValidationErrors();
        if ($validationErrors) {
            $validationErrorsArray = json_decode($validationErrors, true);
            if (!empty($validationErrorsArray)) {
                if (!is_array($validationErrorsArray)) {
                    return array($validationErrorsArray);
                }
                return $validationErrorsArray;
            }
        }
        return array();
    }

    public function shouldDisplay()
    {
        return Mage::getStoreConfig('foomanconnect/order/exportmode') === Fooman_Connect_Model_System_ExportMode::ORDER_MODE;
    }
}

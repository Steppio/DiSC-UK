<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */


class Fooman_Connect_Block_Adminhtml_Sales_Invoice_Xero extends Fooman_Connect_Block_Adminhtml_Sales_Order_View_Tab_Xero
{

    public function getInvoice()
    {
        return Mage::registry('current_invoice');
    }

    public function getXeroOrderStatus()
    {
        $id = $this->getInvoice()->getId();
        return Mage::getModel('foomanconnect/invoice')->load($id);
    }

    public function shouldDisplay()
    {
        return Mage::getStoreConfig('foomanconnect/order/exportmode') === Fooman_Connect_Model_System_ExportMode::INVOICE_MODE;
    }
}

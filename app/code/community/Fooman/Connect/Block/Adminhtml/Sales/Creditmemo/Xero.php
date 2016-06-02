<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */


class Fooman_Connect_Block_Adminhtml_Sales_Creditmemo_Xero extends Fooman_Connect_Block_Adminhtml_Sales_Order_View_Tab_Xero
{

    public function getCreditmemo()
    {
        return Mage::registry('current_creditmemo');
    }

    public function getXeroUrl()
    {
        $xeroCreditNoteId = $this->getXeroOrderStatus()->getXeroCreditNoteId();
        return Fooman_Connect_Model_Xero_Api::XERO_CREDITNOTE_LINK . $xeroCreditNoteId;
    }

    public function displayPayments()
    {
        return false;
    }

    public function getXeroOrderStatus()
    {
        $id = $this->getCreditmemo()->getId();
        return Mage::getModel('foomanconnect/creditmemo')->load($id);
    }

    public function shouldDisplay()
    {
        return true;
    }
}

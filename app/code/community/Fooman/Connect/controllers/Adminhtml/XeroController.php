<?php

class Fooman_Connect_Adminhtml_XeroController extends Mage_Adminhtml_Controller_Action
{

    protected function _construct()
    {
        $this->setUsedModuleName('Fooman_Connect');
    }

    public function indexAction()
    {
        $this->_redirect('adminhtml/xero_order');
    }

    public function creditmemoAction()
    {
        $this->_redirect('adminhtml/xero_creditmemo');
    }


}

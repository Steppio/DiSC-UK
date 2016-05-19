<?php
/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/osl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * @category    Yoma
 * @package     Yoma_Realex
 * @copyright   Copyright (c) 2014 YOMA LIMITED (http://www.yoma.co.uk)
 * @license     http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */
class Yoma_Realex_Adminhtml_TokencardController extends Mage_Adminhtml_Controller_Action
{
    protected function _initAction()
    {
        $this->loadLayout()->_setActiveMenu("realex/tokencard")
            ->_addBreadcrumb(Mage::helper("adminhtml")->__("Token Card  Manager"),Mage::helper("adminhtml")->__("Token Card Manager"));
        return $this;
    }

    public function indexAction()
    {
        $this->_title($this->__("Realex"));
        $this->_title($this->__("Manager Token Card"));

        $this->_initAction();
        $this->renderLayout();
    }

    /**
     * Edit token action
     */
    public function editAction()
    {
        $this->_title($this->__("Realex"));
        $this->_title($this->__("Token Card"));
        $this->_title($this->__("Edit Item"));

        $id = $this->getRequest()->getParam("id");
        $model = Mage::getModel("realex/tokencard")->load($id);
        if ($model->getId()) {
            Mage::register("tokencard_data", $model);
            $this->loadLayout();
            $this->_setActiveMenu("realex/tokencard");
            $this->_addBreadcrumb(Mage::helper("adminhtml")->__("Tokencard Manager"), Mage::helper("adminhtml")->__("Tokencard Manager"));
            $this->_addBreadcrumb(Mage::helper("adminhtml")->__("Tokencard Description"), Mage::helper("adminhtml")->__("Tokencard Description"));
            $this->getLayout()->getBlock("head")->setCanLoadExtJs(true);
            $this->_addContent($this->getLayout()->createBlock("realex/adminhtml_tokencard_edit"))->_addLeft($this->getLayout()->createBlock("realex/adminhtml_tokencard_edit_tabs"));
            $this->renderLayout();
        }
        else {
            Mage::getSingleton("adminhtml/session")->addError(Mage::helper("realex")->__("Item does not exist."));
            $this->_redirect("*/*/");
        }
    }

    /**
     * Save token
     */
    public function saveAction()
    {

        $post_data=$this->getRequest()->getPost();
        if ($post_data) {
            try {

                $card = Mage::getModel("realex/tokencard")->load($this->getRequest()->getParam("id"));
                Mage::dispatchEvent('realex_edit_token', array('token'=> $card, 'details'=>$post_data));

                Mage::getSingleton("adminhtml/session")->addSuccess(Mage::helper("adminhtml")->__("Tokencard was successfully saved"));
                Mage::getSingleton("adminhtml/session")->setTokencardData(false);

                if ($this->getRequest()->getParam("back")) {
                    $this->_redirect("*/*/edit", array("id" => $card->getId()));
                    return;
                }
                $this->_redirect("*/*/");
                return;
            }
            catch (Exception $e) {
                Mage::getSingleton("adminhtml/session")->addError($e->getMessage());
                Mage::getSingleton("adminhtml/session")->setTokencardData($this->getRequest()->getPost());
                $this->_redirect("*/*/edit", array("id" => $this->getRequest()->getParam("id")));
            return;
            }

        }
        $this->_redirect("*/*/");
    }

    /**
     * Delete token
     */
    public function deleteAction()
    {
        if( $this->getRequest()->getParam("id") > 0 ) {
            try {
                $model = Mage::getModel("realex/tokencard");
                $model->setId($this->getRequest()->getParam("id"))->delete();
                Mage::getSingleton("adminhtml/session")->addSuccess(Mage::helper("adminhtml")->__("Item was successfully deleted"));
                $this->_redirect("*/*/");
            }
            catch (Exception $e) {
                Mage::getSingleton("adminhtml/session")->addError($e->getMessage());
                $this->_redirect("*/*/edit", array("id" => $this->getRequest()->getParam("id")));
            }
        }
        $this->_redirect("*/*/");
    }


    public function massRemoveAction()
    {
        try {
            $ids = $this->getRequest()->getPost('ids', array());
            foreach ($ids as $id) {
                $card = Mage::getModel("realex/tokencard")->load($id);
                Mage::dispatchEvent('realex_delete_token', array('token'=> $card));
            }
            Mage::getSingleton("adminhtml/session")->addSuccess(Mage::helper("adminhtml")->__("Item(s) was successfully removed"));
        }
        catch (Exception $e) {
            Mage::getSingleton("adminhtml/session")->addError($e->getMessage());
        }
        $this->_redirect('*/*/');
    }

    /**
     * Export order grid to CSV format
     */
    public function exportCsvAction()
    {
        $fileName   = 'tokencard.csv';
        $grid       = $this->getLayout()->createBlock('realex/adminhtml_tokencard_grid');
        $this->_prepareDownloadResponse($fileName, $grid->getCsvFile());
    }
    /**
     *  Export order grid to Excel XML format
     */
    public function exportExcelAction()
    {
        $fileName   = 'tokencard.xml';
        $grid       = $this->getLayout()->createBlock('realex/adminhtml_tokencard_grid');
        $this->_prepareDownloadResponse($fileName, $grid->getExcelFile($fileName));
    }
}

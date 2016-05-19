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
class Yoma_Realex_Adminhtml_TransactionController extends Mage_Adminhtml_Controller_Action
{
    protected function _initAction()
    {
        $this->loadLayout()->_setActiveMenu("realex/transaction")
            ->_addBreadcrumb(Mage::helper("adminhtml")->__("Transactions"),Mage::helper("adminhtml")->__("Transactions"));
        return $this;
    }
    public function indexAction()
    {
        $this->_title($this->__("Realex"));
        $this->_title($this->__("Transactions"));

        $this->_initAction();
        $this->renderLayout();
    }

    public function viewAction()
    {
        $txn = $this->_initTransaction();
        if (!$txn) {
            return;
        }
        $this->_title($this->__('Realex'))
            ->_title($this->__('Transactions'))
            ->_title(sprintf("#%s", $txn->getEntityId()));

        $this->loadLayout()
            ->_setActiveMenu('realex/transaction')
            ->renderLayout();
    }

    /**
     * Initialize transaction
     *
     * @return Mage_Core_Model_Abstract
     */
    protected function _initTransaction()
    {
        $txn = Mage::getModel('realex/transaction')->load(
            $this->getRequest()->getParam('txn_id')
        );

        if (!$txn->getId()) {
            $this->_getSession()->addError($this->__('Wrong transaction ID specified.'));
            $this->_redirect('*/*/');
            $this->setFlag('', self::FLAG_NO_DISPATCH, true);
            return false;
        }
        $orderId = $this->getRequest()->getParam('order_id');
        if ($orderId) {
            $txn->setOrderUrl(
                $this->getUrl('*/sales_order/view', array('order_id' => $orderId))
            );
        }

        Mage::register('transaction_data', $txn);
        return $txn;
    }

    /**
     * Export order grid to CSV format
     */
    public function exportCsvAction()
    {
        $fileName   = 'transactions.csv';
        $grid       = $this->getLayout()->createBlock('realex/adminhtml_transaction_grid');
        $this->_prepareDownloadResponse($fileName, $grid->getCsvFile());
    }
    /**
     *  Export order grid to Excel XML format
     */
    public function exportExcelAction()
    {
        $fileName   = 'transactions.xml';
        $grid       = $this->getLayout()->createBlock('realex/adminhtml_transaction_grid');
        $this->_prepareDownloadResponse($fileName, $grid->getExcelFile($fileName));
    }

    public function gridAction()
    {
        $this->loadLayout();
        $this->getResponse()->setBody(
            $this->getLayout()->createBlock('realex/adminhtml_transaction_grid')->toHtml()
        );
    }
}

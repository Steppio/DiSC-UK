<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Adminhtml_Xero_OrderController extends Mage_Adminhtml_Controller_Action
{

    /**
     * @return boolean
     */
    protected function _isAllowed()
    {
        return Mage::getSingleton('admin/session')->isAllowed('foomanconnect/xero_order');
    }

    protected $_session;

    protected function _construct()
    {
        $this->setUsedModuleName('Fooman_Connect');
    }

    public function preDispatch()
    {
        parent::preDispatch();
        $this->_session = Mage::getSingleton('adminhtml/session');
    }

    public function indexAction()
    {
        if (!Mage::helper('foomanconnect/config')->isConfigured()) {
            $this->_session->addError(
                Mage::helper('foomanconnect')->__(
                    'Connection to Xero is not yet set up.'
                )
            );
            if (!Mage::getStoreConfig('foomanconnect/settings/privatekey')) {
                $this->_session->addNotice(
                    Mage::helper('foomanconnect')->__(
                        'You can create a Private Key by clicking <a href="%s">here</a>.',
                        Mage::helper('adminhtml')->getUrl('adminhtml/xero_auth/createKeys')
                    )
                );
            } else {
                $this->_session->addNotice(
                    Mage::helper('foomanconnect')->__(
                        'You can download the Public Key file for use in Xero by clicking <a href="%s">here</a>.',
                        Mage::helper('adminhtml')->getUrl('adminhtml/xero_auth/downloadPublicKey')
                    )
                );
            }
        }

        $this->loadLayout();
        $this->_setActiveMenu('foomanconnect/xero_order');

        if (Mage::getStoreConfig('foomanconnect/order/exportmode') == Fooman_Connect_Model_System_ExportMode::ORDER_MODE
        ) {
            $block = 'foomanconnect/adminhtml_order';
        } else {
            $block = 'foomanconnect/adminhtml_invoice';
        }
        if (!Mage::helper('foomanconnect/migration')->hasCompleted()) {
            $block = 'foomanconnect/adminhtml_migration_inProgress';
        }
        $this->_addContent(
            $this->getLayout()->createBlock($block, 'xero')
        );

        $this->renderLayout();
    }

    public function exportSelectedAction()
    {

        //Get order_ids from POST
        $orderIds = $this->getRequest()->getPost('order_ids');

        //loop through orders
        if (is_array($orderIds) && !empty($orderIds)) {
            sort($orderIds);
            $successes = 0;
            foreach ($orderIds as $orderId) {
                try {
                    Mage::getModel('foomanconnect/order')->exportByOrderId($orderId);
                    $successes++;
                } catch (Exception $e) {
                    $this->_getSession()->addError($e->getMessage());
                }
            }
        }

        if ($successes == 1) {
            $this->_getSession()->addSuccess(
                Mage::helper('foomanconnect')->__('Successfully exported %s order', $successes)
            );
        } elseif ($successes) {
            $this->_getSession()->addSuccess(
                Mage::helper('foomanconnect')->__('Successfully exported %s orders', $successes)
            );
        }

        //go back to the order overview page
        $this->_redirect('adminhtml/xero_order');
    }

    public function exportSelectedInvoicesAction()
    {

        //Get order_ids from POST
        $invoiceIds = $this->getRequest()->getPost('order_ids');

        //loop through orders
        if (is_array($invoiceIds) && !empty($invoiceIds)) {
            sort($invoiceIds);
            $successes = 0;
            foreach ($invoiceIds as $invoiceId) {
                try {
                    Mage::getModel('foomanconnect/invoice')->exportByInvoiceId($invoiceId);
                    $successes++;
                } catch (Exception $e) {
                    $this->_getSession()->addError($e->getMessage());
                }
            }
        }

        if ($successes == 1) {
            $this->_getSession()->addSuccess(
                Mage::helper('foomanconnect')->__('Successfully exported %s invoice', $successes)
            );
        } elseif ($successes) {
            $this->_getSession()->addSuccess(
                Mage::helper('foomanconnect')->__('Successfully exported %s invoices', $successes)
            );
        }

        //go back to the order overview page
        $this->_redirect('adminhtml/xero_order');
    }

    public function neverExportSelectedAction()
    {
        $errors = '';

        //Get order_ids from POST
        $orderIds = $this->getRequest()->getPost('order_ids');

        //loop through orders
        if (is_array($orderIds) && !empty($orderIds)) {
            sort($orderIds);
            foreach ($orderIds as $orderId) {

                $order = Mage::getModel('foomanconnect/order')
                    ->getCollection()
                    ->addFieldToFilter('entity_id', $orderId)
                    ->getFirstItem();
                $order->setOrderId($order->getEntityId());

                $orderIncrementId = $order->getIncrementId();
                if ($order->getXeroExportStatus() == Fooman_Connect_Model_Status::EXPORTED) {
                    //we have already exported it
                    $errors = empty($errors)
                        ? $orderIncrementId . ": " . Mage::helper('foomanconnect')->__('Has already been exported.')
                        : $errors . "<br/>" . $orderIncrementId . ": " . Mage::helper('foomanconnect')->__(
                            'Has already been exported.'
                        );
                } else {
                    try {
                        //let's set the status
                        $order->setXeroExportStatus(Fooman_Connect_Model_Status::WONT_EXPORT)
                            ->save();
                    } catch (Exception $e) {
                        $errors = empty($errors) ? $orderIncrementId . ": " . $e->getMessage()
                            : $errors . "<br/>" . $orderIncrementId . ": " . $e->getMessage();
                    }
                }

            }
        }
        //Add results to session
        if (!empty($errors)) {
            $this->_getSession()->addError($errors);
        } else {
            $this->_getSession()->addSuccess(
                Mage::helper('foomanconnect')->__('Successfully changed order export status.')
            );
        }
        //go back to the order overview page
        $this->_redirect('adminhtml/xero_order');
    }


    public function neverExportSelectedInvoicesAction()
    {
        $errors = '';

        //Get order_ids from POST
        $invoiceIds = $this->getRequest()->getPost('order_ids');

        //loop through orders
        if (is_array($invoiceIds) && !empty($invoiceIds)) {
            sort($invoiceIds);
            foreach ($invoiceIds as $invoiceId) {

                $invoice = Mage::getModel('foomanconnect/invoice')
                    ->getCollection()
                    ->addFieldToFilter('entity_id', $invoiceId)
                    ->getFirstItem();
                $invoice->setInvoiceId($invoice->getEntityId());

                $incrementId = $invoice->getIncrementId();
                if ($invoice->getXeroExportStatus() == Fooman_Connect_Model_Status::EXPORTED) {
                    //we have already exported it
                    $errors = empty($errors)
                        ? $incrementId . ": " . Mage::helper('foomanconnect')->__('Has already been exported.')
                        : $errors . "<br/>" . $incrementId . ": " . Mage::helper('foomanconnect')->__(
                            'Has already been exported.'
                        );
                } else {
                    try {
                        //let's set the status
                        $invoice->setXeroExportStatus(Fooman_Connect_Model_Status::WONT_EXPORT)
                            ->save();
                    } catch (Exception $e) {
                        $errors = empty($errors) ? $incrementId . ": " . $e->getMessage()
                            : $errors . "<br/>" . $incrementId . ": " . $e->getMessage();
                    }
                }

            }
        }
        //Add results to session
        if (!empty($errors)) {
            $this->_getSession()->addError($errors);
        } else {
            $this->_getSession()->addSuccess(
                Mage::helper('foomanconnect')->__('Successfully changed order export status.')
            );
        }
        //go back to the order overview page
        $this->_redirect('adminhtml/xero_order');
    }

    public function resetAllAction()
    {

        try {
            $installer = Mage::getResourceModel('foomanconnect/setup', 'foomanconnect_write');
            $installer->resetXeroInformation();
        } catch (Exception $e) {
            $this->_getSession()->addError($e->getMessage());
        }
        $this->_getSession()->addSuccess(Mage::helper('foomanconnect')->__('Successfully reset'));

        //go back to the order overview page
        $this->_redirect('adminhtml/xero_order');
    }


    public function gridAction()
    {
        $this->loadLayout();
        if (Mage::getStoreConfig('foomanconnect/order/exportmode') == Fooman_Connect_Model_System_ExportMode::ORDER_MODE
        ) {
            $block = 'foomanconnect/adminhtml_order_grid';
        } else {
            $block = 'foomanconnect/adminhtml_invoice_grid';
        }
        $this->getResponse()->setBody(
            $this->getLayout()->createBlock($block)->toHtml()
        );
    }

    public function exportItemsAction()
    {
        try {
            $stores = array_keys(Mage::app()->getStores());
            foreach ($stores as $storeId) {
                Mage::getModel('foomanconnect/item')->exportItems($storeId, true);
            }
        } catch (Exception $e) {
            $this->_getSession()->addError($e->getMessage());
        }
        $this->_getSession()->addSuccess(Mage::helper('foomanconnect')->__('Successfully Exported Items'));

        //go back to the order overview page
        $this->_redirect('adminhtml/xero_order');
    }

}

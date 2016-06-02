<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_Invoice extends Fooman_Connect_Model_Abstract
{

    protected function _construct()
    {
        $this->_init('foomanconnect/invoice');
    }

    /**
     * @param int $invoiceId
     *
     * @return array
     */
    public function exportByInvoiceId($invoiceId)
    {
        $invoice = Mage::getModel('sales/order_invoice')->load($invoiceId);
        return $this->exportOne($invoice);
    }

    /**
     * @param Mage_Sales_Model_Order_Invoice $invoice
     *
     * @return array
     */
    public function exportOne(Mage_Sales_Model_Order_Invoice $invoice)
    {
        $invoiceStatus = $this->load($invoice->getId(), 'invoice_id');
        if (!$invoiceStatus->getInvoiceId()) {
            $invoiceStatus->isObjectNew(true);
            $invoiceStatus->setInvoiceId((int)$invoice->getId());
        }
        if ($invoice->getBaseGrandTotal() == 0
            && !Mage::getStoreConfigFlag(
                'foomanconnect/order/exportzero', $invoice->getStoreId()
            )
        ) {
            $invoice->setXeroExportStatus(Fooman_Connect_Model_Status::WONT_EXPORT);
            $invoice->setXeroLastValidationErrors('');
            $invoice->save();
        } else {
            try {
                $invoiceData = array();
                $dataSource = Mage::getModel('foomanconnect/dataSource_invoice', array('invoice' => $invoice));
                $invoiceData = $dataSource->getInvoiceData();
                Mage::getModel('foomanconnect/item')->ensureItemsExist($invoiceData, $invoice->getStoreId());
                $result = $this->sendToXero($dataSource->getXml($invoiceData), $invoice->getStoreId());
                $invoiceStatus->setXeroInvoiceId($result['Invoices'][0]['InvoiceID']);
                $invoiceStatus->setXeroInvoiceNumber($result['Invoices'][0]['InvoiceNumber']);
                $invoiceStatus->setXeroExportStatus(Fooman_Connect_Model_Status::EXPORTED);
                $invoiceStatus->setXeroLastValidationErrors('');
                $invoiceStatus->save();
                return $result;
            } catch (Fooman_Connect_Exception $e) {
                $this->_handleError($invoiceStatus, $e, $e->getXeroErrors(), $invoice, $invoiceData);
            } catch (Exception $e) {
                $this->_handleError($invoiceStatus, $e, $e->getMessage(), $invoice, $invoiceData);
            }
        }
    }

    public function exportInvoices()
    {
        $stores = array_keys(Mage::app()->getStores());
        foreach ($stores as $storeId) {
            if (Mage::getStoreConfigFlag('foomanconnect/cron/xeroautomatic', $storeId)) {
                $collection = $this->getCollection()->getUnexportedOrders($storeId)->setPageSize(self::PROCESS_PER_RUN);
                $collection->getSelect()->order('created_at DESC');
                $collection->addConfigDateFilter($storeId);
                foreach ($collection as $invoice) {
                    /** @var $invoice Fooman_Connect_Model_Invoice */
                    try {
                        $this->exportByInvoiceId($invoice->getEntityId());
                    } catch (Exception $e) {
                        //don't stop cron execution
                        //exception has already been logged
                    }
                }
            }
        }
    }

    /**
     * @param $xml
     * @param $storeId
     *
     * @return array
     */
    public function sendToXero($xml, $storeId)
    {
        return $this->getApi()->setStoreId($storeId)->sendData(
            Fooman_Connect_Model_Xero_Api::INVOICES_PATH, Zend_Http_Client::POST, $xml
        );
    }

    /**
     * @return bool|string
     */
    public function getSalesEntityViewId()
    {
        return $this->_getSalesEntityViewId('invoice');
    }
}

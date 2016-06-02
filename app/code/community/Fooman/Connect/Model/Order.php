<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_Order extends Fooman_Connect_Model_Abstract
{

    protected function _construct()
    {
        $this->_init('foomanconnect/order');
    }

    /**
     * @param int $orderId
     *
     * @return array
     */
    public function exportByOrderId($orderId)
    {
        $order = Mage::getModel('sales/order')->load($orderId);
        return $this->exportOne($order);
    }

    /**
     * @param Mage_Sales_Model_Order $order
     *
     * @return array
     */
    public function exportOne(Mage_Sales_Model_Order $order)
    {
        /** @var Fooman_Connect_Model_Order $orderStatus */
        $orderStatus = $this->load($order->getId(), 'order_id');
        if (!$orderStatus->getOrderId()) {
            $orderStatus->isObjectNew(true);
            $orderStatus->setOrderId((int)$order->getId());
        }
        if ($order->getBaseGrandTotal() == 0
            && !Mage::getStoreConfigFlag(
                'foomanconnect/order/exportzero', $order->getStoreId()
            )
        ) {
            $orderStatus->setXeroExportStatus(Fooman_Connect_Model_Status::WONT_EXPORT);
            $orderStatus->setXeroLastValidationErrors('');
            $orderStatus->save();
        } else {
            try {
                $orderData = array();
                $dataSource = Mage::getModel('foomanconnect/dataSource_order', array('order' => $order));
                $orderData  = $dataSource->getOrderData();
                Mage::getModel('foomanconnect/item')->ensureItemsExist($orderData, $order->getStoreId());
                $result = $this->sendToXero($dataSource->getXml($orderData), $order->getStoreId());
                $orderStatus->setXeroInvoiceId($result['Invoices'][0]['InvoiceID']);
                $orderStatus->setXeroInvoiceNumber($result['Invoices'][0]['InvoiceNumber']);
                $orderStatus->setXeroExportStatus(Fooman_Connect_Model_Status::EXPORTED);
                $orderStatus->setXeroLastValidationErrors('');
                $orderStatus->save();
                return $result;
            } catch (Fooman_Connect_Exception $e) {
                $this->_handleError($orderStatus, $e, $e->getXeroErrors(), $order, $orderData);
            } catch (Exception $e) {
                $this->_handleError($orderStatus, $e, $e->getMessage(), $order, $orderData);
            }
        }
    }

    public function exportOrders()
    {
        $stores = array_keys(Mage::app()->getStores());
        foreach ($stores as $storeId) {
            if (Mage::getStoreConfigFlag('foomanconnect/cron/xeroautomatic', $storeId)) {
                /** @var Fooman_Connect_Model_Resource_Order_Collection $collection */
                $collection = $this->getCollection()->getUnexportedOrders($storeId)->setPageSize(self::PROCESS_PER_RUN);
                $collection->getSelect()->order('created_at DESC');
                $collection->addConfigDateFilter($storeId);
                foreach ($collection as $order) {
                    /** @var $order Fooman_Connect_Model_Order */
                    try {
                        $this->exportByOrderId($order->getEntityId());
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
        return $this->_getSalesEntityViewId('order');
    }
}

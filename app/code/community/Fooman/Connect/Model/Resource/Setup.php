<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_Resource_Setup extends Mage_Sales_Model_Mysql4_Setup
{

    const NUM_MIGRATE_AT_ONCE = 100;

    public function resetXeroInformation()
    {
        $this->getConnection()->truncate($this->getTable('foomanconnect/order'));
        $this->getConnection()->truncate($this->getTable('foomanconnect/invoice'));
        $this->getConnection()->truncate($this->getTable('foomanconnect/creditmemo'));
        $this->getConnection()->truncate($this->getTable('foomanconnect/item'));
        Mage::app()->getCache()->clean();
    }

    public function migrate()
    {
        $this->migrateOrders();
        $this->migrateCreditmemos();
    }

    public function migrateOrders()
    {
        if (!Mage::helper('foomanconnect/migration')->hasOrderMigrationCompleted()) {
            $collection = Mage::getModel('foomanconnect/order')
                ->getCollection()
                ->getUnmigratedOrders()
                ->setPageSize(self::NUM_MIGRATE_AT_ONCE);
            if (count($collection)) {
                foreach ($collection as $salesOrder) {
                    $this->migrateOrder($salesOrder);
                }
            } else {
                //Migration complete
                $this->deleteOldOrderColumns();
            }
        }
    }

    /**
     * @param Mage_Sales_Model_Order|Fooman_Connect_Model_Order $salesOrder
     */
    public function migrateOrder($salesOrder)
    {
        $order = Mage::getModel('foomanconnect/order')->load($salesOrder->getEntityId(), 'order_id');
        if (!$order->getId()) {
            $order->isObjectNew(true);
        }
        $order->setOrderId($salesOrder->getEntityId());
        $order->setXeroExportStatus($salesOrder->getXeroExportStatus());
        $order->setXeroInvoiceId($salesOrder->getXeroInvoiceId());
        $order->setXeroInvoiceNumber($salesOrder->getXeroInvoiceNumber());
        $order->setXeroLastValidationErrors(json_encode(unserialize($salesOrder->getXeroLastValidationErrors())));
        $order->save();
        $salesOrder = Mage::getModel('sales/order')->load($salesOrder->getEntityId());
        $salesOrder->setXeroExportStatus(null)->save();
    }

    /**
     * delete old order columns after migration is finished
     */
    public function deleteOldOrderColumns()
    {
        $this->getConnection()->dropColumn($this->getTable('sales/order'), 'xero_invoice_number');
        $this->getConnection()->dropColumn($this->getTable('sales/order'), 'xero_export_status');
        $this->getConnection()->dropColumn($this->getTable('sales/order'), 'xero_last_validation_errors');
        $this->getConnection()->dropColumn($this->getTable('sales/order'), 'xero_invoice_id');
        //refresh cache to let Magento know about the new structure
        Mage::app()->getCacheInstance()->flush();
    }

    public function migrateCreditmemos()
    {
        if (!Mage::helper('foomanconnect/migration')->hasCreditmemoMigrationCompleted()) {
            $collection = Mage::getModel('foomanconnect/creditmemo')
                ->getCollection()
                ->getUnmigratedCreditmemos()
                ->setPageSize(self::NUM_MIGRATE_AT_ONCE);
            if (count($collection)) {
                foreach ($collection as $salesOrder) {
                    $this->migrateCreditmemo($salesOrder);
                }
            } else {
                //Migration complete
                $this->deleteOldCreditmemoColumns();
            }
        }
    }

    /**
     * migrate single creditmemo
     *
     * @param Mage_Sales_Model_Order_Creditmemo|Fooman_Connect_Model_Creditmemo $salesOrder
     */
    public function migrateCreditmemo($salesOrder)
    {
        $creditmemo = Mage::getModel('foomanconnect/creditmemo')->load($salesOrder->getEntityId(), 'creditmemo_id');
        if (!$creditmemo->getId()) {
            $creditmemo->isObjectNew(true);
        }
        $creditmemo->setCreditmemoId($salesOrder->getEntityId());
        $creditmemo->setXeroExportStatus($salesOrder->getXeroExportStatus());
        $creditmemo->setXeroCreditnoteId($salesOrder->getXeroCreditnoteId());
        $creditmemo->setXeroCreditnoteNumber($salesOrder->getXeroCreditnoteNumber());
        $creditmemo->setXeroLastValidationErrors(json_encode(unserialize($salesOrder->getXeroLastValidationErrors())));
        $creditmemo->save();
        $salesOrder = Mage::getModel('sales/order_creditmemo')->load($salesOrder->getEntityId());
        $salesOrder->setXeroExportStatus(null)->save();
    }

    public function deleteOldCreditmemoColumns()
    {
        $this->getConnection()->dropColumn($this->getTable('sales/creditmemo'), 'xero_creditnote_number');
        $this->getConnection()->dropColumn($this->getTable('sales/creditmemo'), 'xero_export_status');
        $this->getConnection()->dropColumn($this->getTable('sales/creditmemo'), 'xero_last_validation_errors');
        $this->getConnection()->dropColumn($this->getTable('sales/creditmemo'), 'xero_creditnote_id');
        //refresh cache to let Magento know about the new structure
        Mage::app()->getCacheInstance()->flush();
    }

}

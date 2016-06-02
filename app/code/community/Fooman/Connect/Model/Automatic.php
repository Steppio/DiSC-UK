<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_Automatic
{
    public function cron()
    {
        $migrationHelper = Mage::helper('foomanconnect/migration');
        $migrationHelper->run();

        $cronEnabled  = Mage::getStoreConfigFlag('foomanconnect/cron/xeroautomatic');
        $configHelper = Mage::helper('foomanconnect/config');

        if ($migrationHelper->hasCompleted() && $cronEnabled && $configHelper->isConfigured()) {
            if (Mage::getStoreConfig('foomanconnect/order/exportmode') === Fooman_Connect_Model_System_ExportMode::ORDER_MODE) {
                Mage::getModel('foomanconnect/order')->exportOrders();
            } else {
                Mage::getModel('foomanconnect/invoice')->exportInvoices();
            }
            Mage::getModel('foomanconnect/creditmemo')->exportCreditmemos();
        }
    }
}

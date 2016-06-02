<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Helper_Migration extends Mage_Core_Helper_Abstract
{

    public function run()
    {
        if (!Mage::getStoreConfigFlag('foomanconnect/settings/migration_complete')) {
            if (!$this->hasCompleted()) {
                $installer = Mage::getResourceModel('foomanconnect/setup', 'core_write');
                $installer->migrate();
            } else {
                Mage::helper('foomanconnect/config')->setMageStoreConfig('migration_complete', true);
            }
        }
    }

    public function hasCompleted()
    {
        if (Mage::getStoreConfigFlag('foomanconnect/settings/migration_complete')) {
            return true;
        }
        $installer = Mage::getResourceModel('foomanconnect/setup', 'core_read');
        return $this->hasOrderMigrationCompleted($installer) && $this->hasCreditmemoMigrationCompleted($installer);
    }


    public function hasOrderMigrationCompleted($installer = null)
    {
        if (is_null($installer)) {
            $installer = Mage::getResourceModel('foomanconnect/setup', 'core_read');
        }
        return !(bool)$installer->getConnection()->tableColumnExists(
            $installer->getTable('sales/order'), 'xero_invoice_id'
        );
    }

    public function hasCreditmemoMigrationCompleted($installer = null)
    {
        if (is_null($installer)) {
            $installer = Mage::getResourceModel('foomanconnect/setup', 'core_read');
        }
        return !(bool)$installer->getConnection()->tableColumnExists(
            $installer->getTable('sales/creditmemo'), 'xero_creditnote_id'
        );
    }
}

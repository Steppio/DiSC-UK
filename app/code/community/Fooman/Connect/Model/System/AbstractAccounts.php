<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_System_AbstractAccounts extends Fooman_Connect_Model_System_Abstract
{
    const XERO_ACCOUNTS_REGISTRY_KEY = 'xero-accounts';

    public function getXeroAccounts()
    {
        if ($this->isConfigured() && Mage::getStoreConfig('foomanconnect/settings/xeroenabled')) {
            $storeId = $this->getCurrentStoreId();
            $result = Mage::registry($this->getRegistryKey($storeId));
            if (!$result) {
                $api = Mage::getModel('foomanconnect/xero_api');
                $api->setStoreId($storeId);
                $result = $api->getAccounts();
                Mage::register($this->getRegistryKey($storeId), $result);
            }
            return $result;
        } else {
            Mage::throwException('Please configure and enable the integration above and save config.');
        }
    }

    public function getRegistryKey($storeId)
    {
        return self::XERO_ACCOUNTS_REGISTRY_KEY. $storeId;
    }
}

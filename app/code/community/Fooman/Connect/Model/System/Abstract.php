<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_System_Abstract
{

    public function getSession()
    {
        return Mage::getSingleton('adminhtml/session');
    }

    public function isConfigured()
    {
        return Mage::helper('foomanconnect/config')->isConfigured();
    }

    public function getCurrentStoreId()
    {
        if (strlen($code = Mage::getSingleton('adminhtml/config_data')->getStore())) {
            $storeId = Mage::getModel('core/store')->load($code)->getId();
        } elseif (strlen($code = Mage::getSingleton('adminhtml/config_data')->getWebsite())) {
            $websiteId = Mage::getModel('core/website')->load($code)->getId();
            $storeId = Mage::app()->getWebsite($websiteId)->getDefaultStore()->getId();
        } else {
            $storeId = Mage_Catalog_Model_Abstract::DEFAULT_STORE_ID;
        }
        return $storeId;
    }
}

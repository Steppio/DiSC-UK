<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2013 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Helper_Config extends Mage_Core_Helper_Abstract
{
    const XML_PATH_CONNECT_SETTINGS = 'foomanconnect/settings/';


    /**
     * check if configuration parameters have been entered
     * minimum required Consumer Key, Consumer Secret and Private Key
     *
     * @return bool
     */
    public function isConfigured()
    {
        $consumerkey = Mage::helper('core')->decrypt(Mage::getStoreConfig('foomanconnect/settings/consumerkey'));
        $consumersecret = Mage::helper('core')->decrypt(
            Mage::getStoreConfig('foomanconnect/settings/consumersecret')
        );
        $privatekey = Mage::helper('core')->decrypt(Mage::getStoreConfig('foomanconnect/settings/privatekey'));
        return (!empty($consumerkey) && !empty($consumersecret) && !empty($privatekey));
    }


    public function getTrackingCategory($storeId, $customerGroupId = false)
    {
        $data = array();
        $data['xeroTrackingCategoryID'] = "";
        $data['xeroTrackingName'] = "";
        $data['xeroTrackingOption'] = "";

        $xeroTracking = Mage::getStoreConfig('foomanconnect/settings/xerotracking', $storeId);
        if (!empty($xeroTracking)) {
            $xeroTracking = explode('|', $xeroTracking);
            $data['xeroTrackingCategoryID'] = $xeroTracking[0];
            $data['xeroTrackingName'] = $xeroTracking[1];
            $data['xeroTrackingOption'] = $xeroTracking[2];
        }

        if (false !== $customerGroupId) {
            $trackingRule = Mage::getModel('foomanconnect/tracking_rule')->loadCustomerGroupRule($customerGroupId);
            if ($trackingRule->getId() && $trackingRule->getTrackingCategoryId()) {
                $data['xeroTrackingCategoryID'] = $trackingRule->getTrackingCategoryId();
                $data['xeroTrackingName'] = $trackingRule->getTrackingName();
                $data['xeroTrackingOption'] = $trackingRule->getTrackingOption();
            }
        }
        return $data;
    }

    /**
     * Save store config value for key
     *
     * @param string $key
     * @param string $value
     * @param int    $storeId
     *
     * @return \Mage_Core_Model_Store <type>
     */
    public function setMageStoreConfig ($key, $value, $storeId = Mage_Catalog_Model_Abstract::DEFAULT_STORE_ID)
    {
        $path = self::XML_PATH_CONNECT_SETTINGS . $key;

        //save to db
        try {
            $configModel = Mage::getModel('core/config_data');
            $collection = $configModel->getCollection()
                ->addFieldToFilter('path', $path)
                ->addFieldToFilter('scope_id', $storeId);
            if ($storeId != Mage_Catalog_Model_Abstract::DEFAULT_STORE_ID) {
                $collection->addFieldToFilter('scope', Mage_Adminhtml_Block_System_Config_Form::SCOPE_STORES);
            }

            if ($collection->load()->getSize() > 0) {
                //value already exists -> update
                foreach ($collection as $existingConfigData) {
                    $existingConfigData->setValue($value)->save();
                }
            } else {
                //new value
                $configModel
                    ->setPath($path)
                    ->setValue($value);
                if ($storeId != Mage_Catalog_Model_Abstract::DEFAULT_STORE_ID ) {
                    $configModel->setScopeId($storeId);
                    $configModel->setScope(Mage_Adminhtml_Block_System_Config_Form::SCOPE_STORES);
                }
                $configModel->save();
            }
        } catch (Exception $e) {
            Mage::logException($e);
        }
        Mage::app()->getConfig()->removeCache();
        //we also set it as a temporary item so we don't need to reload the config
        return Mage::app()->getStore($storeId)->load($storeId)->setConfig($path, $value);
    }

}

<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_System_TrackingOptions extends Fooman_Connect_Model_System_Abstract
{

    const XERO_TRACKING_REGISTRY_KEY = 'xero-tracking';

    public function toOptionArray($useDefaultLabel = false)
    {
        $returnArray = array();

        try {
            if ($useDefaultLabel) {
                $returnArray[] = array(
                    'value' => '0',
                    'label' => Mage::helper('foomanconnect')->__('Use Store Default')
                );
            } else {
                $returnArray[] = array(
                    'value' => '',
                    'label' => Mage::helper('foomanconnect')->__('None')
                );
            }

            $trackingCategories = $this->getXeroTracking();
            foreach ($trackingCategories as $category) {
                foreach ($category['Options'] as $option) {
                    $returnArray[] = array(
                        'value' => $category['TrackingCategoryID'] . '|' . $category['Name'] . '|' . $option['Name'],
                        'label' => '[' . $category['Name'] . '] ' . $option['Name']
                    );
                }
            }

        } catch (Exception $e) {
            //display the error message in the dropdown
            $returnArray[] = array('value' => '0', 'label' => $e->getMessage());
        }


        return $returnArray;
    }


    public function getXeroTracking()
    {
        if ($this->isConfigured() && Mage::getStoreConfig('foomanconnect/settings/xeroenabled')) {
            $result = Mage::registry(self::XERO_TRACKING_REGISTRY_KEY);
            if (!$result) {
                $result = Mage::getModel('foomanconnect/xero_api')->getTrackingCategories();
                Mage::register(self::XERO_TRACKING_REGISTRY_KEY, $result);
            }
            return $result;
        } else {
            Mage::throwException('Please configure and enable the integration above and save config.');
        }
    }

}

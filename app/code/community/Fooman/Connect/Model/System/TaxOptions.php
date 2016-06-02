<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_System_TaxOptions extends Fooman_Connect_Model_System_Abstract
{

    const XERO_TAX_RATES_REGISTRY_KEY = 'xero-tax-rates';
    const USE_ITEM_TAX_TYPE = 'fooman-use-items-tax-type';

    /**
     * $output = null return array of tax rates from xero for back-end select drop down
     * $output = 'XERO_TAX_RATE_IDENTIFIER' return effective tax rate percentage
     * $output not null return array of tax rates keyed by effective tax rates
     * Note the last is used during fallback when no tax rate is present, has the
     * potential to return the wrong one when using multiple rates within Xero with the same percentage
     *
     * @param      $output
     *
     * @param null $storeId
     *
     * @param bool $includeItemOption
     *
     * @return array | float
     */
    public function toOptionArray($output = null, $storeId = null, $includeItemOption = false)
    {
        $returnArray = array();
        if (null === $storeId) {
            $storeId = $this->getCurrentStoreId();
        }
        if ($this->isConfigured() && Mage::getStoreConfig('foomanconnect/settings/xeroenabled', $storeId)) {
            if (empty($output)) {
                $returnArray[] = array('value' => '', 'label' => '');
                if ($includeItemOption) {
                    $returnArray[] = array(
                        'value' => self::USE_ITEM_TAX_TYPE,
                        'label' => Mage::helper('foomanconnect')->__('Use Items\'s Tax Rate')
                    );
                }
            }

            $result = Mage::registry($this->getRegistryKey($storeId));
            if (!$result) {
                try {
                    $api = Mage::getModel('foomanconnect/xero_api');
                    $api->setStoreId($storeId);
                    $result = $api->getTaxRates();
                    Mage::register($this->getRegistryKey($storeId), $result);
                } catch (Exception $e) {
                    Mage::logException($e);
                    //display the error message in the dropdown
                    return array('value' => '', 'label' => $e->getMessage());
                }
            }

            //we have been successful
            foreach ($result as $taxRate) {
                if (empty($output)) {
                    $returnArray[] = array(
                        'value' => $taxRate['TaxType'], 'label' =>
                        substr($taxRate['Name'], 0, 30) . ' [' . $taxRate['EffectiveRate'] . '%]'
                    );
                } elseif ($output == $taxRate['TaxType']) {
                    return $taxRate['EffectiveRate'];
                } elseif ($taxRate['CanApplyToRevenue']) {
                    $returnArray[sprintf("%01.4f", $taxRate['EffectiveRate'])] = $taxRate['TaxType'];
                }
            }
        } else {
            $returnArray[] = array(
                'value' => '',
                'label' => Mage::helper('foomanconnect')->__(
                    'Please configure and enable the integration above and save config.'
                )
            );
        }
        return $returnArray;
    }

    public function getRegistryKey($storeId)
    {
        return self::XERO_TAX_RATES_REGISTRY_KEY. $storeId;
    }

    public function getTaxRatesForAllStores()
    {
        $resultArray = array();
        $stores = array_keys(Mage::app()->getStores());
        foreach ($stores as $storeId) {
            $storeTaxes = $this->toOptionArray(false, $storeId);
            array_shift($storeTaxes); //removes the empty entry from the beginning
            $resultArray = array_merge($resultArray, $storeTaxes);
        }

        return $resultArray;
    }

}

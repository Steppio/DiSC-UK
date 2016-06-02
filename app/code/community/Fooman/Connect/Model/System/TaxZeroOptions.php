<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_System_TaxZeroOptions extends Fooman_Connect_Model_System_Abstract
{

    /**
     * $output = null return array of tax rates from xero for back-end select drop down
     * $output = 'XERO_TAX_RATE_IDENTIFIER' return effective tax rate percentage
     * $output not null return array of tax rates keyed by effective tax rates
     * Note the last is used during fallback when no tax rate is present, has the
     * potential to return the wrong one when using multiple rates within Xero with the same percentage
     *
     * @return array | float
     */
    public function toOptionArray()
    {
        $returnArray = array();
        if ($this->isConfigured() && Mage::getStoreConfig('foomanconnect/settings/xeroenabled')) {
            $returnArray[] = array('value' => '', 'label' => '');

            $result = Mage::registry(Fooman_Connect_Model_System_TaxOptions::XERO_TAX_RATES_REGISTRY_KEY);
            if (!$result) {
                try {
                    $result = Mage::getModel('foomanconnect/xero_api')->getTaxRates();
                    Mage::register(Fooman_Connect_Model_System_TaxOptions::XERO_TAX_RATES_REGISTRY_KEY, $result);
                } catch (Exception $e) {
                    //display the error message in the dropdown
                    $returnArray[] = array('value' => '', 'label' => $e->getMessage());
                    return $returnArray;
                }
            }

            //we have been successful
            foreach ($result as $taxRate) {
                if ($taxRate['EffectiveRate'] == 0) {
                    $returnArray[] = array(
                        'value' => $taxRate['TaxType'], 'label' =>
                        substr($taxRate['Name'], 0, 30) . ' [' . $taxRate['EffectiveRate'] . '%]'
                    );
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

}

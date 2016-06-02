<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_System_TaxOverrideOptions
{

    const MAGE_CALC = 'mage';
    const XERO_CALC = 'xero';
    const MIXED_CALC = 'mixed';
    const XERO_REDUCED = 'reduced';

    public function toOptionArray()
    {
        $returnArray = array();
        $returnArray[] = array('value' => self::MAGE_CALC,
                               'label' => Mage::helper('foomanconnect')->__('Magento calculated'));
        $returnArray[] = array('value' => self::MIXED_CALC,
                               'label' => Mage::helper('foomanconnect')->__('Magento re-calculated'));
        $returnArray[] = array('value' => self::XERO_REDUCED,
                               'label' => Mage::helper('foomanconnect')->__('Magento merged'));
        $returnArray[] = array('value' => self::XERO_CALC,
                               'label' => Mage::helper('foomanconnect')->__('Xero re-calculated'));
        return $returnArray;
    }

}

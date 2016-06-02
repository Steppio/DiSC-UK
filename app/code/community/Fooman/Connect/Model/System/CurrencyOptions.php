<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_System_CurrencyOptions
{
    const TRANSFER_BASE = 'base';
    const TRANSFER_ORDER = 'order';

    public function toOptionArray()
    {
        $returnArray = array();
        $returnArray[] = array('value' => self::TRANSFER_BASE, 'label' => Mage::helper('foomanconnect')->__('Store Base Currency'));
        $returnArray[] = array('value' => self::TRANSFER_ORDER, 'label' => Mage::helper('foomanconnect')->__('Order Currency'));
        return $returnArray;
    }

}

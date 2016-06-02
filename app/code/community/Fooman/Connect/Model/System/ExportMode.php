<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_System_ExportMode
{

    const ORDER_MODE = 'order';
    const INVOICE_MODE = 'invoice';

    public function toOptionArray()
    {
        $returnArray = array();
        $returnArray[] = array(
            'value' => self::ORDER_MODE,
            'label' => Mage::helper('foomanconnect')->__('Magento Order to Xero Invoice')
        );
        $returnArray[] = array(
            'value' =>  self::INVOICE_MODE,
            'label' => Mage::helper('foomanconnect')->__('Magento Invoice to Xero Invoice')
        );
        return $returnArray;
    }

}

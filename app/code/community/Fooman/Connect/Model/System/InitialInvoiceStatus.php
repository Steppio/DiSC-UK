<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_System_InitialInvoiceStatus
{

    const DRAFT = 'DRAFT';
    const AUTHORISED = 'AUTHORISED';

    public function toOptionArray()
    {
        $returnArray = array();
        $returnArray[] = array('value' => self::DRAFT,
                               'label' => Mage::helper('foomanconnect')->__('Draft'));
        $returnArray[] = array('value' => self::AUTHORISED,
                               'label' => Mage::helper('foomanconnect')->__('Authorised'));

        return $returnArray;
    }

}

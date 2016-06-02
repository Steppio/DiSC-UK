<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_Status
{
    const NOT_EXPORTED = '0';
    const EXPORTED = '1';
    const ATTEMPTED_BUT_FAILED = '2';
    const WONT_EXPORT = '3';
    const QUEUED_EXPORT = '4';

    public static function getStatuses($includeNotExported = false)
    {
        $options = array();
        if ($includeNotExported) {
            $options[self::NOT_EXPORTED] = Mage::helper('foomanconnect')->__('Not exported');
            //$options[self::QUEUED_EXPORT] = Mage::helper('foomanconnect')->__('Queued for export');
        }
        $options[self::EXPORTED] = Mage::helper('foomanconnect')->__('Exported');
        $options[self::WONT_EXPORT] = Mage::helper('foomanconnect')->__('Export not needed');
        $options[self::ATTEMPTED_BUT_FAILED] = Mage::helper('foomanconnect')->__('Attempted but failed');
        return $options;
    }
}

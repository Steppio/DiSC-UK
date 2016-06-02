<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_System_XeroVersionsOptions
{

    public function toOptionArray()
    {
        $returnArray = array();
        foreach (Fooman_Connect_Model_Xero_Defaults::$taxRates as $version) {
            $returnArray[] = array('value' => $version['code'], 'label' => $version['name']);
        }
        return $returnArray;
    }

}

<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_System_InvoiceStatusOptions
{

    public function toOptionArray()
    {
        $returnArray = array();
        foreach (Mage_Sales_Model_Order_Invoice::getStates() as $status => $statusLabel) {
            $returnArray[] = array('value' => $status, 'label' => $statusLabel);
        }
        return $returnArray;
    }

}

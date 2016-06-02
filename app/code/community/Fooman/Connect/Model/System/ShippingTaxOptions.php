<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_System_ShippingTaxOptions extends Fooman_Connect_Model_System_TaxOptions
{

    public function toOptionArray($output = null, $storeId = null, $includeItemOption = true)
    {
        return parent::toOptionArray($output, $storeId, $includeItemOption);
    }

}

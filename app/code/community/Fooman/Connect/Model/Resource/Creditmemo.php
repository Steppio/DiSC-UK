<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_Resource_Creditmemo extends Mage_Sales_Model_Mysql4_Order_Abstract
{
    protected $_isPkAutoIncrement = false;
    protected $_useIsObjectNew = true;

    protected function _construct()
    {
        $this->_init('foomanconnect/creditmemo', 'creditmemo_id');
    }

}

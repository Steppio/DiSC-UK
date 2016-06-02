<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_Resource_Item_Collection extends Mage_Core_Model_Mysql4_Collection_Abstract
{
    protected function _construct()
    {
        $this->_init('foomanconnect/item');
    }

    public function getUnexportedItems()
    {
        $this->addFieldToFilter(
            'xero_export_status', array(Fooman_Connect_Model_Status::NOT_EXPORTED, array('null' => true))
        );
        return $this;
    }
}

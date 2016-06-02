<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_Tracking_Rule extends Mage_Core_Model_Abstract
{
    const TYPE_GROUP = 'group';
    const TYPE_CUSTOMER = 'customer';

    protected function _construct()
    {
        $this->_init('foomanconnect/tracking_rule');
    }

    public function loadCustomerGroupRule($groupId)
    {
        $collection = $this->getCollection();
        $collection->addFieldToFilter('source_id', $groupId);
        $collection->addFieldToFilter('type', self::TYPE_GROUP);
        $collection->setPageSize(1);

        return $collection->getFirstItem();
    }
}

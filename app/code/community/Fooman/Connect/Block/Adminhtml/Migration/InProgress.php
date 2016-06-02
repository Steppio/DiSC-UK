<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Block_Adminhtml_Migration_InProgress extends Mage_Core_Block_Template
{
    public function _toHtml()
    {
        return $this->__('Migration to newer version in Progress. %s%% complete', $this->_getCompletionPercentage());
    }

    protected function _getCompletionPercentage()
    {

        $ordersDone = Mage::getModel('foomanconnect/order')->getCollection()->getRawSize();
        $creditmemosDone = Mage::getModel('foomanconnect/creditmemo')->getCollection()->getRawSize();
        $ordersTotal = Mage::getModel('sales/order')->getCollection()->getSize();
        $creditmemosTotal = Mage::getModel('sales/order_creditmemo')->getCollection()->getSize();

        return round((($ordersDone + $creditmemosDone) / ($ordersTotal + $creditmemosTotal)) * 100, 2);
    }
}

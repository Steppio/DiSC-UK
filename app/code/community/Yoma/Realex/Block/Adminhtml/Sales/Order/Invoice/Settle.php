<?php
/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/osl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * @category    Yoma
 * @package     Yoma_Realex
 * @copyright   Copyright (c) 2014 YOMA LIMITED (http://www.yoma.co.uk)
 * @license     http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */
class Yoma_Realex_Block_Adminhtml_Sales_Order_Invoice_Settle extends Mage_Core_Block_Template
{

    protected $_source;

    /**
     * Initialize totals
     *
     * @return $this
     */
    public function initTotals()
    {
        $parent = $this->getParentBlock();
        $this->_source  = $parent->getSource();
        $total = new Varien_Object(array(
            'code'      => 'settle_positive',
            'block_name'=> $this->getNameInLayout()
        ));

        if($this->_canShow($parent->getOrder()->getPayment())) {
            $parent->addTotal($total);
        }
        return $this;
    }

    public function getSource()
    {
        return $this->_source;
    }

    public function getSettleAmount(){

        return $this->_source->getSettlePositive();
    }

    protected function _canShow($payment){

        if(in_array($payment->getMethod(),array('realexdirect','realexredirect','realvault'))){
            return true;
        }
        return false;
    }
}
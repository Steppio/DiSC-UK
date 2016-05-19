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
class Yoma_Realex_Model_Service_Direct extends Yoma_Realex_Model_Service_Abstract{

    /**
     * Payment method processor.
     *
     * @var Yoma_Realex_Model_Payment_Abstract $_method
     */
    protected $_adapter = 'direct';
    protected $_serviceCode = 'realexdirect';


    protected function _registerTransaction(){

        $this->_saveTransaction();
    }

    /**
     * @return Mage_Core_Helper_Abstract
     */
    protected function _getHelper()
    {
        return Mage::helper('realex/direct');
    }


    public function getAdapter(){

        return $this->_adapter;
    }

}
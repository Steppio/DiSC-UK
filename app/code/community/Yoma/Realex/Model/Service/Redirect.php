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
class Yoma_Realex_Model_Service_Redirect extends Yoma_Realex_Model_Service_Abstract{

    protected $_adapter = 'redirect';
    protected $_serviceCode = 'realexredirect';

    /**
     * @return Mage_Core_Helper_Abstract
     */
    protected function _getHelper()
    {
        return Mage::helper('realex/redirect');
    }

    /**
     * Set transaction state before call back
     */
    protected function _registerTransaction(){

        $this->_saveTransaction();
        $this->_getPayment()->setIsTransactionPending(true);
    }

    /**
     * Save transaction
     *
     * @return $this|Yoma_Realex_Model_Service_Abstract
     */
    protected function _saveTransaction($errorMessage = false)
    {
        $transaction = Mage::getModel('realex/transaction')
            ->setData(array(
                'service_code' => $this->getMethodInstance()->getCode(),
                'transaction_reference' => $this->getTransactionReference(),
                'payment_id' => $this->_getPayment()->getId(),
                'order_id' => $this->_getOrder()->getId(),
                'transaction_type' => $this->getTransactionType(),
                'additional_information' => $this->_method->getRegisterTransactionData(),
                'payment_amount' => $this->_getPayment()->getData('payment_amount'),
            ))
            ->save();

        $this->_setTransaction($transaction);

        return $this;
    }

    /**
     * @todo replace redundant code
     * @return $this
     */
    protected function _processResponse(){

        $this->_getResponse()->processResult();
        return $this;
    }

    /**
     *
     * * @todo replace redundant code
     * @return string
     */
    public function getAdapter(){
        return $this->_adapter;
    }
}
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
class Yoma_Realex_Model_Transaction extends Mage_Core_Model_Abstract
{

    protected $_obf = array('card_cvn','sha1hash','md5hash','SHA1HASH','MD5HASH');

    protected function _construct()
    {
        $this->_init('realex/transaction');
    }

    /**
     * Retrieve transaction by method and reference
     *
     * @param string $serviceCode
     * @param string $transactionReference
     * @param bool $error
     * @return $this|bool
     * @throws Exception
     */
    public function loadByServiceTransactionReference($serviceCode, $transactionReference, $error = true)
    {
        $collection = $this->getCollection()
            ->addFieldToFilter('service_code', $serviceCode)
            ->addFieldToFilter('transaction_reference', $transactionReference);
        
        if ($collection->count() !== 1) {
            if($error) {
                throw new Exception($this->_getHelper()
                    ->__("Unable to load transaction with reference '{$transactionReference}'"));
            }else{
                return false;
            }
        }
        
        $id = $collection->getFirstItem()->getId();
        $this->load($id);
        
        return $this;
    }

    /**
     * Retrieve transaction by order
     *
     * @param int $orderId
     * @return $this
     * @throws Exception
     */
    public function loadByOrder($orderId)
    {
        $collection = $this->getCollection()
            ->addFieldToFilter('order_id', $orderId);
        
        if ($collection->count() !== 1) {
            throw new Exception($this->_getHelper()
                ->__("Unable to load transaction for order ID '{$orderId}'"));
        }
        
        $id = $collection->getFirstItem()->getId();
        $this->load($id);
        
        return $this;
    }

    /**
     * Get transaction raw data
     *
     * @param string $key
     * @return mixed|null
     */
    public function getAdditionalInformation($key = null)
    {
        $transactionData = $this->getData('additional_information');
        
        if (is_null($key)) {
            return $transactionData;
        }
        
        return array_key_exists($key, $transactionData) ? $transactionData[$key] : null;
    }

    /**
     * Add transaction data
     *
     * @param string $key
     * @param null $value
     * @return $this
     */
    public function addAdditionalInformation($key, $value = null)
    {
        if (is_array($key)) {
            foreach ($key as $_key => $_value) {
                $this->addAdditionalInformation($_key, $_value);
            }
        }
        
        $additionalInformation = $this->getData('additional_information');
        $additionalInformation[$key] = $value;
        $this->setData('additional_information', $additionalInformation);
        
        return $this;
    }

    /**
     * Unset data
     *
     * @param $key
     * @return $this
     */
    public function unsAdditionalInformation($key)
    {
        $transactionData = $this->getData('additional_information');
        if (!array_key_exists($key, $transactionData)) {
            return $this;
        }
        
        unset($transactionData[$key]);
        $this->setData('additional_information', $transactionData);
        
        return $this;
    }

    protected function _beforeSave()
    {
        $additionalInformation = $this->getData('additional_information');
        if (is_array($additionalInformation)) {
            foreach($this->_obf as $key){
                if(array_key_exists($key,$additionalInformation)){
                    unset($additionalInformation[$key]);
                }
            }
            $this->setData('additional_information', serialize($additionalInformation));
        }
        
        $subscriptionData = $this->getData('subscription_data');
        if (is_array($subscriptionData)) {
            $this->setData('subscription_data', serialize($subscriptionData));
        }
        
        return parent::_beforeSave();
    }

    protected function _afterLoad()
    {
        $additionalInformation = $this->getData('additional_information');
        if ($additionalInformation != '') {
            $this->setData('additional_information', unserialize($additionalInformation));
        }
        
        $subscriptionData = $this->getData('subscription_data');
        if ($subscriptionData != '') {
            $this->setData('subscription_data', unserialize($subscriptionData));
        }
        
        return parent::_afterLoad();
    }

    protected function _getHelper(){
        return mage::helper('realex');
    }

    public function getOrderPaymentObject($shouldLoad = true)
    {
        if (null === $this->_paymentObject) {
            $payment = Mage::getModel('sales/order_payment')->load($this->getPaymentId());
            if ($payment->getId()) {
                $this->setOrderPaymentObject($payment);
            }
        }
        return $this->_paymentObject;
    }

    /**
     *Get order id
     *
     * @return mixed
     */
    public function getOrderId()
    {
        $orderId = $this->_getData('order_id');
        if ($orderId) {
            return $orderId;
        }
        if ($this->_paymentObject) {
            return $this->_paymentObject->getOrder()
                ? $this->_paymentObject->getOrder()->getId()
                : $this->_paymentObject->getParentId();
        }
    }

    /**
     * Get Order
     *
     * @return mixed|null
     */
    public function getOrder()
    {
        if ($this->_order === null) {
            $this->setOrder();
        }

        return $this->_order;
    }

    /*
     * Set order
     */
    public function setOrder($order = null)
    {
        if (null === $order || $order === true) {
            if (null !== $this->_paymentObject && $this->_paymentObject->getOrder()) {
                $this->_order = $this->_paymentObject->getOrder();
            } elseif ($this->getOrderId() && $order === null) {
                $this->_order = Mage::getModel('sales/order')->load($this->getOrderId());
            } else {
                $this->_order = false;
            }
        } elseif (!$this->getId() || ($this->getOrderId() == $order->getId())) {
            $this->_order = $order;
        } else {
            Mage::throwException(Mage::helper('realex')->__('Set order for existing transactions not allowed'));
        }

        return $this;
    }

}
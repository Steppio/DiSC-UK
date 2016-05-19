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
class Yoma_Realex_Model_Service_Token extends Yoma_Realex_Model_Service_Abstract
{

    protected $_adapter = 'token';
    protected $_serviceCode = 'realvault';

    /**
     * Fields that should be replaced in debug with '***'
     *
     * @var array
     */
    protected $_debugReplacePrivateDataKeys = array(
        'sha1hash', 'SHA1HASH','md5hash','MD5HASH','refundhash'
        // 'sha1hash', 'SHA1HASH', 'card_number', 'card_cvn_number','md5hash','MD5HASH'
    );

    public function getAdapter()
    {

        return $this->_adapter;
    }

    protected function _getHelper()
    {
        return Mage::helper('realex');
    }

    /**
     * Save transaction
     * @TODO refactor service code call to mirror abstract method
     *
     * @param bool $errorMessage
     * @return $this|Yoma_Realex_Model_Service_Abstract
     */
    protected function _saveTransaction($errorMessage = false)
    {
        $transaction = Mage::getModel('realex/transaction')
            ->setData(array(
                'service_code' => $this->_serviceCode,
                'transaction_reference' => $this->getTransactionReference(),
                'payment_id' => $this->_getPayment()->getId(),
                'order_id' => $this->_getOrder()->getId(),
                'transaction_type' => $this->getTransactionType(),
                'additional_information' => $this->_method->getRegisterTransactionData(),
                'payment_amount' => $this->_getPayment()->getData('payment_amount'),
                'remembertoken' => $this->_getPayment()->getData('remembertoken'),
            ));

        $transaction->save();

        $this->_setTransaction($transaction);

        return $this;
    }

    /**
     * @return string
     */
    public function getCode()
    {
        return 'realvault';
    }

    /**
     * @param mixed $debugData
     */
    public function debugData($debugData)
    {

        if ($this->getMethodInstance()) {
            $this->getMethodInstance()->debugData($debugData);
        } else {
            $logFile = 'payment_' . $this->getCode() . '.log';

            if ($this->_getHelper()->getConfigData($this->getCode(), 'mode') == 'live') {
                $debugData = $this->_filterData($debugData);
            }
            Realex_Log::log($debugData, NULL, $logFile);
        }

    }

    /**
     * @TODO refactor code call to mirror abstract method
     * @param mixed $debugData
     */
    protected function _filterData($debugData)
    {

        if (is_array($debugData) && is_array($this->_debugReplacePrivateDataKeys)) {
            foreach ($debugData as $key => $value) {
                if (in_array($key, $this->_debugReplacePrivateDataKeys)) {
                    $temp = null;
                    for ($i = 0; $i < strlen($debugData[$key]); $i++) {
                        $temp .= '*';
                    }
                    $debugData[$key] = $temp;
                } else {
                    if (is_array($debugData[$key])) {
                        $debugData[$key] = $this->_filterData($debugData[$key]);
                    }
                }
            }
        }
        return $debugData;
    }

    /**
     * @return bool
     */
    public function getDebugFlag()
    {
        return true;
    }

    /**
     *
     * @return string
     */
    protected function _processResponse()
    {

        $this->_getResponse()->processResult();
        return $this;

    }
}

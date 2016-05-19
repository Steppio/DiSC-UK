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
class Yoma_Realex_Model_PaymentInfo extends Mage_Core_Model_Abstract
{

    protected function _construct()
    {
        $this->_init('realex/paymentInfo');
    }

    public function saveSectionData($paymentId, $identifier, $data)
    {
        if (is_null($paymentId) || $identifier == '') {
            return $this;
        }

        if (is_array($data)) {
            foreach ($data as $_key => $_value) {
                if (is_null($_value) || !is_string($_value) || $_value == '') {
                    unset($data[$_key]);
                }
            }
            if (count($data) < 1) {
                return $this;
            }
        } elseif (trim($data) == '') {
            return $this;
        }

        if (is_array($data)) {
            $data = @serialize($data);
        } else {
            $data = trim($data);
        }

        $this->_getInstance()
            ->addData(array(
                'payment_id' => $paymentId,
                'field' => $identifier,
                'value' => $data,
            ))
            ->save();
        
        return $this;
    }
    

    public function getDataPairs($paymentId)
    {
        $data = array();
        
        if (is_null($paymentId)) {
            return $data;
        }
        
        $collection = $this->getCollection()
            ->addFieldToFilter('payment_id', $paymentId);
        
        foreach ($collection as $_paymentInfo) {
            $arrayData = @unserialize($_paymentInfo->getValue());
            if (is_array($arrayData)) {
                $data[$_paymentInfo->getField()] = $arrayData;
            } else {
                $data[$_paymentInfo->getField()] = $_paymentInfo->getValue();
            }
        }
        
        return $data;
    }

    protected function _getInstance()
    {
        return Mage::getModel('realex/paymentInfo');
    }
}
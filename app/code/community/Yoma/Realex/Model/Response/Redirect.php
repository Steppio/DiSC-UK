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
class Yoma_Realex_Model_Response_Redirect extends Yoma_Realex_Model_Response_Abstract{

    const REALVAULT_PAYER_SETUP            = '00';
    const REALVAULT_PAYMENT_SETUP            = '00';

    /**
     * Check if valid message
     *
     * @return $this
     * @throws Exception
     */
    public function isValid(){

            $hash = $this->_getHelper()->generateSha1Hash(
                $this->_getHelper()->getConfigData('realex','secret'),
                array(
                    $this->getTimestamp(),
                    $this->getMerchantId(),
                    $this->getOrderId(),
                    $this->getResult(),
                    $this->getMessage(),
                    $this->getPasref(),
                    $this->getAuthcode()
                )

            );


        if ($hash != $this->getSha1hash()) {
            throw new Exception(
                $this->_getHelper()->__('Payment Gateway Response Can Not be Validated.')
            );
        }

        return $this;
    }

    /**
     * @return Mage_Core_Helper_Abstract
     */
    protected function _getHelper()
    {
        return Mage::helper('realex/redirect');
    }

    /**
     * Check if new payer
     *
     * @return bool
     */
    public function isPayerSetup(){
        if($this->getPayerSetup() == self::REALVAULT_PAYER_SETUP){
            return true;
        }
        return false;
    }

    /**
     * Check if using real vault
     *
     * @return bool
     */
    public function useRealVault(){

        if($this->getRealwalletChosen()){
            return true;
        }
        return false;
    }

    /**
     * Check if token created
     *
     * @return bool
     */
    public function isPaymentSetup(){
        if($this->getPmtSetup() == self::REALVAULT_PAYMENT_SETUP){
            return true;
        }
        return false;
    }
}


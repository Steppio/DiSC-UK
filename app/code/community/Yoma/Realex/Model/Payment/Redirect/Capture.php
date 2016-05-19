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
class Yoma_Realex_Model_Payment_Redirect_Capture extends Yoma_Realex_Model_Payment_Redirect{

    protected $_code = 'redirect';
    protected $_allowedMethods = array('capture');
    protected $_method = 'capture';
    protected $_action = 'capture';
    protected $_mpiData = array();

    /**
     * Create reference for current transaction.
     *
     * @param Varien_Object $payment
     * @return String
     */
    public function getTransactionReference($payment){

        return $this->_getHelper()
            ->getTransactionReference($payment->getOrder());
    }

    /**
     * Process HPP Callback
     *
     * @return $this
     * @throws Exception
     */
    public function processCallback(){

        $this->_service->debugData(array('response'=>$this->_response->getData()));
        
        $this->_response->isValid();

        Mage::dispatchEvent(
            'realex_before_process_response',
            array('method'=>$this->_method,'response'=>$this->_response->getData())
        );

        $this->addPaymentInfo(array(
            'Result' => $this->_response->getResult(),
            'Auth Code' => $this->_response->getAuthcode(),
            'Message' => $this->_response->getMessage(),
            'Transaction Reference' => $this->_response->getOrderId(),
            'CVN Result' => $this->_response->getCvnresult(),
            'AVS Address Result' => $this->_response->getAvsaddressresult(),
            'AVS Postcode Result' => $this->_response->getAvspostcoderesult(),
            'TSS Result' => $this->_response->getTss(),
        ));

        $this->addExtraPaymentInfo($this->_response);

        $this->_response->processResult();

        // if use real vault see if we have token
        if($this->_response->useRealVault()){
            try {
                $customerId = $this->_service->getOrder()->getCustomerId();
                $this->_customer = mage::getModel('customer/customer')->load($customerId);
                $cards = mage::getModel('realex/realex_source_cards');

                $token = false;
                // if token save
                if ($this->_response->isPaymentSetup()) {

                    $token = Mage::getModel("realex/tokencard");
                    $token
                        ->setCustomerId($this->_customer->getId())
                        ->setToken($this->_response->getSavedPmtRef())
                        ->setStatus(1)
                        ->setCardType($cards->convertLegacyCardType($this->_response->getSavedPmtType())) //SAVED_PMT_TYPE
                        ->setMagentoCardType($cards->getMagentoCardType($this->_response->getSavedPmtType())) //SAVED_PMT_TYPE
                        ->setLastFour(substr($this->_response->getSavedPmtDigits(), -4)) //SAVED_PMT_DIGITS
                        ->setExpiryDate($this->_response->getSavedPmtExpdate()) // SAVED_PMT_EXPDATE
                        ->setChName($this->_response->getSavedPmtName())
                        ->setIsDefault(0)
                        ->setPayerRef($this->_response->getSavedPayerRef())
                        ->setPaymentMethod($this->_code)
                        ->save();

                    Mage::getSingleton('customer/session')->setTokenSaved(true);

                    $this->addPaymentInfo('Card Saved Successfully','Yes');
                }

                if ($this->_response->isPayerSetup()) {
                    $this->_customer->setRealexPayerRef($this->_response->getSavedPayerRef());
                    $this->_customer->save();
                    if($token) {
                        Mage::dispatchEvent('realex_edit_payer', array('token' => $token));
                    }
                }
            }catch (Exception $e){
                mage::logException($e);
            }
        }

        return $this;
    }

    /**
     * Start transaction with payment gateway
     *
     * @return $this|mixed
     * @throws Exception
     */
    protected function _pay(){

        $this->_setMethodRedirect(null);
        $this->getRealexSession()->setTokenSaved(false);
        $this->_service->saveTransaction();
        $this->_service->getPayment()->setIsTransactionPending(true);
        $this->_prepareTransactionPost();
        $this->_setMethodRedirect($this->_getRedirectUrl());
        return;

    }

}
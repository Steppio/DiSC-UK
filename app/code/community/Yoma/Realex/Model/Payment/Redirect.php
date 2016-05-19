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
abstract class Yoma_Realex_Model_Payment_Redirect extends Yoma_Realex_Model_Payment_Abstract{

    protected $_payerRef = null;
    protected $_customer = null;

    /**
     * Prepare transaction request hpp
     *
     * @return $this
     */
    protected function _prepareTransactionPost(){

        $data = array();

        $data['TIMESTAMP'] = $this->_getHelper()->getTimestamp();
        $data['MERCHANT_ID'] = $this->_getHelper()->getConfigData('realex','vendor');
        $data['ORDER_ID'] = $this->_service->getTransactionReference();
        $data['AMOUNT'] = $this->_getHelper()->formatAmount($this->_service->getPayment()->getPaymentAmount(),$this->_service->getOrder()->getOrderCurrencyCode());
        $data['CURRENCY'] = $this->_service->getOrder()->getBaseCurrencyCode();
        $loggedInOrRegistering = $this->_getHelper()->isLoggedInOrRegistering();
        $useRealVault = $this->_getHelper()->getConfigData('realvault','active');
        if($loggedInOrRegistering && $useRealVault && $this->_getHelper()->hppChoseRealVault($this->_service->getPayment()->getRemembertoken())){

            $customer = $this->_service->getOrder()->getCustomer();

            $payerExist = '1';
            if(isset($customer)){
                $customerId = $customer->getId();
            }else{
                $customerId = $this->_service->getOrder()->getCustomerId();
            }
            $this->_customer = mage::getModel('customer/customer')->load($customerId);

            $this->_payerRef = $this->_customer->getData('realex_payer_ref');

            if(!isset($this->_payerRef)){
                $this->_payerRef = $this->_getHelper()->createPayerRef($this->_customer);
                $payerExist = '0';
            }

            $data['PAYER_REF'] = $this->_payerRef;
            $data['PMT_REF'] = '';
            $data['SHA1HASH'] = $this->_getHelper()->generateSha1Hash($this->_getHelper()->getConfigData('realex','secret'),$data);
            $data['PAYER_EXIST'] = $payerExist;

            $data['OFFER_SAVE_CARD'] = '0';
            $data['CARD_STORAGE_ENABLE'] = '1';
        }else{
            $data['SHA1HASH'] = $this->_getHelper()->generateSha1Hash($this->_getHelper()->getConfigData('realex','secret'),$data);
        }

        $subAccount = trim($this->_getHelper()->getConfigData('realexredirect','sub_account'));

        $transport = new Varien_Object();
        $transport->setSubAccount($subAccount);

        Mage::dispatchEvent('realex_process_subaccount_after', array('payment'=> $this->_service->getPayment(),'transport'=>$transport));

        if($transport->getSubAccount() !== ''){
            $data['ACCOUNT']  = $transport->getSubAccount();
        }

        $data['AUTO_SETTLE_FLAG'] = ($this->_method == 'capture'?'1':'0');
        $data['RETURN_TSS'] = 1;
        $billing = $this->_service->getOrder()->getBillingAddress();
        $shipping = $this->_service->getOrder()->getShippingAddress();
        $customerEmail = $this->_getHelper()->getCustomerEmail();
        if ($this->_service->getOrder()->getIsVirtual()) {
            $data['SHIPPING_CODE']   = $this->_getHelper()->sanitizePostcode($this->_getHelper()->ss($billing->getPostcode(), 30));
            $data['SHIPPING_CO']    = $this->_getHelper()->ss($billing->getCountry(),50);
            $data['SHIPPING_CODE']   = $this->_getHelper()->getTssCode($billing);
        }
        else {
            $data['SHIPPING_CODE']   = $this->_getHelper()->sanitizePostcode($this->_getHelper()->ss($shipping->getPostcode(), 30));
            $data['SHIPPING_CO']    = $this->_getHelper()->ss($shipping->getCountry(),50);
            $data['SHIPPING_CODE']   = $this->_getHelper()->getTssCode($shipping);
        }
        $data['BILLING_CODE']   = $this->_getHelper()->sanitizePostcode($this->_getHelper()->ss($billing->getPostcode(), 30));
        $data['BILLING_CO']    = $this->_getHelper()->ss($billing->getCountry(),50);
        $data['BILLING_CODE']   = $this->_getHelper()->getTssCode($billing);
        $data['CUST_NUM']  = ($customerEmail == null ? $billing->getEmail() : $customerEmail);

        $data['MERCHANT_RESPONSE_URL'] = $this->getCallbackUrl();

        foreach($this->_addComments() as $key=>$value){
            $data[$key] = $value;
        }
        mage::getSingleton('realex/session')->setTransactionData($data);
        $this->_service->debugData(array('request'=>$data));

        return $this;

    }

    /**
     * Append comments to transaction message
     *
     * @return array
     */
    protected function _addComments(){

        $comments = array();

        $comments['COMMENT1'] = 'magento - ' . Mage::getVersion();
        $comments['COMMENT2'] =  'yoma ' . $this->_getHelper()->getVersion();

        return $comments;
    }

    /**
     * Get gateway response data
     *
     * @param bool $obf
     * @return array
     */
    public function getTransactionData($obf = false){

        if(!isset($this->_response)){
            $data =  mage::getSingleton('realex/session')->getTransactionData();
        }else{
            $data = $this->_response->getData();
        }

        //if true obscure data
        if($obf){
            foreach($this->_obf as $key){
                if(array_key_exists($key,$data)){
                    unset($data[$key]);
                }
            }
        }

        return $data;
    }

    /**
     * Retrieve transaction data from session
     *
     * @return array
     */
    public function getRegisterTransactionData() {

        return mage::getSingleton('realex/session')->getTransactionData();
    }

    /**
     * Add additional payment info
     *
     * @param Yoma_Realex_Model_Response_Abstract $response
     * @return $this|void
     */

    public function addExtraPaymentInfo(Yoma_Realex_Model_Response_Abstract $response){

        // if different payment method chosen
        if($value = $response->getPaymentmethod()){
            $this->addPaymentInfo('Payment Method Chosen',$value);
        }
        // if ddc chosen
        if($response->getDccchoice()){

            $this->addPaymentInfo('DCC Choice','Currency of card chosen');

            if($value = $response->getDccmerchantamount()){
                $this->addPaymentInfo('DCC Merchant Amount',$value);
            }
            if($value = $response->getDccmerchantcurrency()){
                $this->addPaymentInfo('DCC Merchant Currency',$value);
            }
            if($value = $response->getDcccardholderamount()){
                $this->addPaymentInfo('DCC Card Holder Amount',$value);
            }
            if($value = $response->getDcccardholdercurrency()){
                $this->addPaymentInfo('DCC Card Holder Currency',$value);
            }
        }

        // score data Currency of card chosen
        if($value = $response->getEci()){
            $this->addPaymentInfo('Electronic Commerce Indicator',$value);
        }

        return $this;

    }
}
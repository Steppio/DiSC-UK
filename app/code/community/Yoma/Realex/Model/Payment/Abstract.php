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
abstract class Yoma_Realex_Model_Payment_Abstract {

    protected $_service = null;
    protected $_function = '_pay';
    protected $_method = null;
    protected $_action = null;
    protected $_redirect = false;
    protected $_paymentInfo = array();
    protected $_obf = array('card_cvn','sha1hash','md5hash','SHA1HASH','MD5HASH');
    protected $_participatingCard = true;
    protected $_message = null;

    protected $_threedSecureCardTypes = array(
        'VISA',
        'MC',
        'AMEX',
    );

    /**
     * Set service
     *
     * @param Yoma_Realex_Model_Service_Abstracy$service
     */
    function __construct($service){

        $this->_service = $service;
    }

    /**
     * Retrive helper from service
     *
     * @return mixed
     */
    protected function _getHelper(){

        return $this->_service->getHelper();
    }

    /**
     * Magic method to implement method
     *
     * @param string $name
     * @param $args
     * @return mixed
     * @throws Exception
     */
    function __call($name, $args){

        // if function call allowed
        if(!in_array($name,$this->_allowedMethods)){

            throw new Exception('Payment Method Not Available');
        }
        return call_user_func_array(array($this, $this->_function),$args);
    }

    /**
     * Abstract method
     *
     * @return mixed
     */
    abstract protected function _Pay();

    /**
     * Call payment gateway
     *
     * @param string $endpoint
     * @param string $data
     * @throws Exception
     */
    protected function _send($endpoint, $data)
    {
        try {
            $client = new Zend_Http_Client($endpoint);
            $client->setMethod(Zend_Http_Client::POST);
            $client->setRawData(trim($data));
            $client->setEncType('text/xml');

            $this->_response->setResponse($client->request());
            $this->_service->debugData(array('request'=>$this->_getHelper()->xmlToArray(trim($data))));
            $this->_service->debugData(array('response'=>$this->_getHelper()->xmlToArray($client->getLastResponse()->getBody())));
        } catch(Exception $e){
            Realex_Log::logException($e);
            throw $e;
        } catch (Zend_Http_Client_Adapter_Exception $e){
            Realex_Log::logException($e);
            throw $e;
        }
    }

    /**
     * Set message for gateway call
     *
     * @param string $type
     * @param null $method
     * @return $this
     */
    protected function _setMessage($type,$method = null){

        // @TODO replace call to get adapter now redundant
        if($method == null){
            $model = $this->_service->getAdapter() . '_' . $type;
        }else{
            $model = $method . '_' . $type;
        }
        $this->_message = Mage::getModel('realex/message_' . $model);

        return $this;
    }

    /**
     * Set response for gateway call
     *
     * @param string $type
     * @param array $data
     * @param null $method
     * @return $this
     */
    protected function _setResponse($type, $data = null, $method = null){

        // @TODO replace call to get adapter now redundant
        if($method == null){
            $model = $this->_service->getAdapter() . '_' . $type;
        }else{
            $model = $method . '_' . $type;
        }

        $this->_response = Mage::getModel('realex/response_' . $model);
            // set response data
            if(is_array($data)){
                $this->_response->setData($this->flatten($data));
            }

        return $this;
    }

    /**
     * Retrieve response from gateway
     *
     * @param bool $obf
     * @return mixed
     */
    public function getTransactionData($obf = false){
        // unset sensitive data
        if($obf){
            $data = $this->_response->getData();

            foreach($this->_obf as $key){
                if(array_key_exists($key,$data)){
                    unset($data[$key]);
                }
            }

            return $data;
        }
        return $this->_response->getData();

    }

    /**
     * Retrieve data from session for transactional post
     *
     * @return mixed
     */
    public function getRegisterTransactionData(){

        return $this->_message->getTransactionData();
    }

    /**
     * Create url for gateway callback
     *
     * @return string
     */
    public function getCallbackUrl(){

        return Mage::getUrl(
            'realex' . '/'
            . $this->_code . '/'
            . $this->_action,
            array(
                '_forced_secure' => true,
                'type' => (isset($type)?$type:$this->_service->getTransactionType()),
                'reference' => $this->_service->getTransactionReference(),
            )
        );
    }

    /**
     * Create url for callback to dent method
     *
     * @return string
     */
    public function getCallDenyUrl(){

        return Mage::getUrl(
            'realex' . '/'
            . $this->_code . '/onepageFailureOrder',

            array(
                '_forced_secure' => true,
                'type' => (isset($type)?$type:$this->_service->getTransactionType()),
                'reference' => $this->_service->getTransactionReference(),
            )
        );
    }

    /**
     * Retrieve payment gateway redirect url
     *
     * @return string
     */
    protected function _getRedirectUrl(){

        // if using iframe
        if($this->_getHelper()->getConfigData($this->_service->getCode(), 'iframe')){
            // if using iframe on checkout page
            if($this->_getHelper()->getConfigData($this->_service->getCode(), 'iframe_display')){
                return Mage::getUrl('realex/' . $this->_code . '/form', array('_forced_secure' => true,));
            }
            return Mage::getUrl('realex/' . $this->_code . '/iframe', array('_forced_secure' => true,));
        }

        return Mage::getUrl('realex/' . $this->_code . '/form', array('_forced_secure' => true,));
    }

    /**
     * Set payment method redirect url
     *
     * @param string $url
     */
    protected function _setMethodRedirect($url){

        Mage::getSingleton('customer/session')->setRedirectUrl($url);
    }

    /**
     * Set response object
     *
     * @param string $type
     * @param array $data
     * @return $this
     */
    public function setResponse($type = null, $data = null){

        if(!isset($type)){
            $type = $this->_action;
        }
        $this->_setResponse($type, $data);
        return $this;
    }

    /**
     * Add payment info
     *
     * @param $mixed key
     * @param string $value
     * @return $this
     */
    public function addPaymentInfo($key, $value = '')
    {
        if (is_array($key)) {
            $this->_paymentInfo = array_merge($this->_paymentInfo, $key);
        } else {
            $this->_paymentInfo[$key] = $value;
        }

        return $this;
    }

    /**
     * Retrieve payment info
     *
     * @param bool $clear
     * @return array
     */
    public function getPaymentInfo($clear = true)
    {
        $paymentInfo = $this->_paymentInfo;
        // if set clear payment info
        if ($clear == true) {
            $this->_paymentInfo = array();
        }

        return $paymentInfo;
    }

    public function unsetPaymentInfo($keys){
        if(is_array($keys)){
            foreach($keys as $key){
                if(isset($this->_paymentInfo[$key])){
                    $this->unsetInfo($key);
                }
            }
        }
    }

    public function unsetInfo($key){
        unset($this->_paymentInfo[$key]);
    }

    /**
     * Flatten multidimensional array
     *
     * @param array $arr
     * @param string $prefix
     * @return array
     */
    public function flatten(array $arr, $prefix = '')
    {
        $out = array();
        foreach ($arr as $k => $v) {
            $key = (!strlen($prefix)) ? strtolower($k) : ($prefix=='@attributes'?strtolower($k):strtolower($prefix) . '_' . strtolower($k));
            if (is_array($v)) {
                $out += $this->flatten($v, $key);
            } else {
                $out[$key] = $v;
            }
        }
        return $out;
    }

    /**
     * Convert magento card type to realex card type
     *
     * @param string $type
     * @return string
     */

    protected function _getRealexCardType($type){

        $cards = Mage::getModel('realex/realex_source_cards');
        return $cards->getGatewayCardType($type);
    }

    /**
     *
     * @return Mage_Core_Model_Abstract
     */
    public function getRealexSession() {

        return Mage::getSingleton('realex/session');
    }

    /**
     * Retrieve existing payment transaction data
     *
     * @param Varien_Object $payment
     * @param mixed $key
     * @return mixed
     *
     */
    protected function _getTransactionData($payment,$key = null){

        $transaction  = $payment->getTransaction($payment->getParentTransactionId());

        while($transaction->getParentTxnId()){
            $transaction  = $payment->getTransaction($transaction->getParentTxnId());
        }

        $transactionData =  $transaction->getAdditionalInformation('raw_details_info');
        if($key && isset($transactionData[$key])){
            return $transactionData[$key];
        }

        return $transactionData;
    }

    /**
     * Check if 3dSecure required
     *
     * @param string $cardType
     * @param string $serviceCode
     * @return Varien_Object
     */
    protected function _requireThreedSecure($cardType,$serviceCode = null){

        $transport = new Varien_Object();
        // start with false
        $transport->setRequire3DSecure(false);

        if(!isset($serviceCode)){
            $serviceCode = $this->_service->getCode();
        }
        // check if card can use 3dSecure
        $cardInScheme = $this->_isThreedSecure(
            $cardType
        );

        // allow if 3dSecure card and onepage checkout and 3dSecure enabled for model
        if ($cardInScheme && !$this->_isAdminOrMultiShipping()  && $this->_getHelper()->getConfigData($serviceCode,'use_threed_secure')) {

            $transport->setRequire3DSecure(true);
            Mage::dispatchEvent('realex_process_threedsecure_after', array('payment'=> $this->_service->getPayment(),'transport'=>$transport));
        }

        return $transport;
    }

    /**
     * Check if multiShippingCheckout
     *
     * @return bool
     */
    protected function _isMultishippingCheckout() {

        return (bool) Mage::getSingleton('checkout/session')->getQuote()->getIsMultiShipping();
    }

    /**
     * Check if current transaction is from the Backend  admin
     *
     * @return bool
     */
    protected function _getIsAdminOrder() {
        return (bool) (Mage::getSingleton('admin/session')->isLoggedIn() &&
            Mage::getSingleton('adminhtml/session_quote')->getQuoteId());
    }

    /**
     * Check if admin order or multiShippingCheckout
     *
     * @return bool
     */
    protected function _isAdminOrMultiShipping(){

        return (bool)($this->_isMultishippingCheckout() || $this->_getIsAdminOrder());
    }

    /**
     * Unserialize and decrypt MD data
     *
     * @param string $encryptedData
     * @return array
     */
    protected function _recieveMdData($encryptedData)
    {
        $decryptedData = Mage::helper('core')->decrypt(base64_decode($encryptedData));
        $data = unserialize($decryptedData);

        return $data;
    }

    /**
     * Set mpi data
     *
     * @param string $key
     * @param string $value
     */
    protected function _setMpiData($key, $value){
        $this->_mpiData[$key] = array('value'=>$value);
    }

    /**
     * Clear mpi data
     */
    protected function _clearMpiData(){

        $this->_mpiData = array();
    }

    /**
     * Serialize and encrypt MD data
     *
     * @param string $encryptedData
     * @return array
     */
    protected function _prepareMdData($data)
    {
        if (!is_array($data) || empty($data)) {
            throw new Exception($this->_getHelper()->__('Invalid MD data provided.'));
        }

        $serializedData = serialize($data);
        $encryptedData = base64_encode(Mage::helper('core')->encrypt($serializedData));

        return $encryptedData;
    }

    /**
     * Populate MD Data
     *
     * @return array
     * @throws Exception
     */
    protected function _createMd(){

        return $this->_prepareMdData(array(
            'card_number' => $this->_service->getPayment()->getCcNumber(),
            'card_cvn' => $this->_service->getPayment()->getCcCid(),
            'xid' => $this->_response->getXid(),
            'transaction_reference' => $this->_service->getTransactionReference(),
            'token_cvv' => mage::getSingleton('realex/session')->getTokenCvv()
        ));
    }

    /**
     * Check if card 3dSecure
     *
     * @param string $cardType
     * @return bool
     */
    protected function _isThreedSecure($cardType ) {

        if (is_null($cardType)) {
            return true;
        }

        if (in_array($cardType, $this->_threedSecureCardTypes)) {
            return true;
        }

        return false;
    }
}
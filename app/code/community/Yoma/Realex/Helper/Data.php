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
class Yoma_Realex_Helper_Data extends Mage_Core_Helper_Abstract{

    const XML_PATH_CURRENCY_DECIMALS = 'yoma_realex/currency_decimals';
    const XML_PATH_OUT_MAPPING = 'yoma_realex/mapping/';
    const REGISTRY_KEY_CURRENT_TIMESTAMP = 'yoma_realex_current_timestamp';

    protected $_tokenCards = null;
    protected $_conversions = array('authorize'=>'Authorisation','partial'=>'Settle','capture'=>'Capture','refund'=>'Rebate');

    /**
     * Validate quote
     *
     * @return bool
     */
    public function validateQuote() {

        $quote = Mage::getSingleton('realex/api_payment')->getQuote();

        if (!$quote->isVirtual()) {
            $address = $quote->getShippingAddress();
            $addressValidation = $address->validate();
            if ($addressValidation !== true) {
                return false;
            }
            $method = $address->getShippingMethod();
            $rate = $address->getShippingRateByCode($method);
            if (!$quote->isVirtual() && (!$method || !$rate)) {
                return false;
            }
        }

        $addressValidation = $quote->getBillingAddress()->validate();
        if ($addressValidation !== true) {
            return false;
        }

        if (!($quote->getPayment()->getMethod())) {
            return false;
        }

        return true;
    }

    /**
     * Shorten String
     *
     * @param $string
     * @param $length
     * @return string
     */
    public function ss($string, $length) {
        return substr($string, 0, $length);
    }

    public function realexEmail($text){
        return preg_replace("/[\+]/", "", $text);
    }

    /**
     * Sanatize postcode
     *
     * @param $text
     * @return mixed
     */
    public function sanitizePostcode($text) {
        return preg_replace("/[^a-zA-Z0-9-\s]/", "", $text);
    }

    /**
     * Get decimal places of currency
     *
     * @param string $currencyCode
     * @return int
     * @throws Exception
     */
    public function getDecimalPlaces($currencyCode)
    {
        if (strlen($currencyCode) < 1) {
            throw new Exception(
                $this->__('Currency code must be provided to retrieve decimal places.')
            );
        }

        $currencyDecimals = Mage::getConfig()->getNode(self::XML_PATH_CURRENCY_DECIMALS);
        if (isset($currencyDecimals->$currencyCode)) {
            $decimalPlaces = $currencyDecimals->$currencyCode;
        } else {
            $decimalPlaces = $currencyDecimals->DEFAULT;
        }

        return (int)$decimalPlaces;
    }

    /**
     *Format amount by currency code
     *
     * @param string $amount
     * @param string $currencyCode
     * @param string $decimalCharacter
     * @return float|string
     * @throws Exception
     */
    public function formatAmount($amount, $currencyCode, $decimalCharacter = '')
    {
        $decimalPlaces = $this->getDecimalPlaces($currencyCode);

        if ($decimalCharacter == '') {
            $multiplier = pow(10, $decimalPlaces);
            $amount = $amount * $multiplier;
            $amount = round($amount);
        } else {
            $amount = number_format($amount, $decimalPlaces, $decimalCharacter, '');
        }

        return $amount;
    }

    /**
     * @TODO remove redundant routine
     * @param $code
     * @param $direction
     * @param $needle
     * @return string
     */
    public function getMapping($code,$direction,$needle){

        $path = self::XML_PATH_OUT_MAPPING . $code . '/' . $direction .'/' . $needle;

        return (string)Mage::getConfig()->getNode($path);
    }

    /**
     * Get config data
     *
     * @param string $code
     * @param string $field
     * @param null $storeId
     * @return mixed
     */
    public function getConfigData($code, $field, $storeId = null){

        if (null === $storeId) {
            $storeId = $this->getStore();
        }
        $path = 'payment/' . $code . '/' . $field;

        return Mage::getStoreConfig($path, $storeId);
    }

    /**
     * Get customer email
     *
     * @return null
     */
    public function getCustomerEmail() {
        $s = Mage::getSingleton('customer/session');
        if ($s->getCustomerId()) {
            return $s->getCustomer()->getEmail();
        }
        return null;
    }

    /**
     * Get current store
     *
     * @return mixed
     */
    public function getStore(){

        return Mage::app()->getStore()->getStoreId();
    }

    /**
     * Re populate cart
     *
     * @param Mage_Sales_Model_Order $order
     * @return $this
     * @throws Exception
     */
    public function reorder($order)
    {
        if (is_null($order)) {
            return $this;
        }

        $cart = Mage::getSingleton('checkout/cart');
        if ($cart->getItemsCount() > 0) {
            return $this;
        }

        if (!$order instanceof Mage_Sales_Model_Order) {
            $order = Mage::getModel('sales/order')->load($order);
        }
        if (!$order->getId()) {
            return $this;
        }

        foreach ($order->getItemsCollection() as $_item) {
            try {
                $cart->addOrderItem($_item);
            } catch (Exception $e) {

            }
        }

        $cart->save();

        return $this;
    }

    /**
     * Set session error message
     *
     * @param string $message
     * @return $this
     */
    public function setSessionErrorMessage($message)
    {
        $this->_getSession()->setErrorMessage($message);

        return $this;
    }

    /**
     * Generate transaction reference
     *
     * @param Varien_Object $order
     * @return mixed|string
     * @throws Exception
     */
    public function getTransactionReference(Varien_Object $order = null)
    {
        $transactionReference
            = Mage::registry('transaction_reference');

        if (!is_null($transactionReference)) {
            return $transactionReference;
        }

        if (!$order->getIncrementId()) {
            throw new Exception(
                $this->__('Order Not Set.')
            );
        }

        $transactionReference = $this->_generateGuid($order->getIncrementId());
        $this->setTransactionReference($transactionReference);

        return $transactionReference;
    }

    /**
     * Generate random string
     *
     * @param $prefix
     * @return string
     */
    protected function _generateGuid($prefix)
    {
        return $prefix . '-' . time() . '-' . mt_rand(111111,999999);
    }

   public function getCardReference($cardType){
        return strtolower($this->_generateGuid($cardType));
    }

    /**
     * Get customer payer reference
     *
     * @param $customerId
     * @return string
     */
    public function getEditPayerReference($customerId){
        return $this->_generateGuid($customerId);
    }

    /**
     *Set transaction reference
     *
     * @param $transactionReference
     * @return $this
     * @throws Exception
     */
    public function setTransactionReference($transactionReference)
    {
        $transactionReference
            = Mage::registry('transaction_reference');

        if (!is_null($transactionReference)) {
            throw new Exception(
                $this->__('transaction reference has already been set.')
            );
        }

        Mage::register(
            'transaction_reference',
            $transactionReference
        );

        return $this;
    }

    protected function _getSession()
    {
        return Mage::getSingleton('checkout/session');
    }

    /**
     * Get TSS code from address
     *
     * @param Mage_Customer_Model_Address_Abstract $address
     * @return string
     */
    public function getTssCode(Mage_Customer_Model_Address_Abstract $address = null)
    {
        if (!$address instanceof Mage_Customer_Model_Address_Abstract) {
            return '|';
        }

        $streetNumbers = '';
        for ($i = 1; $i <= 4; $i++) {
            $street = $address->getStreet($i);

            $streetNumbers = preg_replace("/[^0-9]/","",$street);

            if (strlen($streetNumbers) > 0) {
                break;
            }
        }

        $postcodeNumbers = preg_replace("/[^0-9]/","",$address->getPostcode());

        $result = substr($postcodeNumbers,0,5) . '|' . substr($streetNumbers,0,5);
        return $result;
    }

    /**
     * Get client ip address
     *
     * @return null
     */
    public function getClientIpAddress()
    {
        $ip = Mage::helper('core/http')->getRemoteAddr();

        if(!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)){
            return null;
        }

        return $ip;
    }

    /**
     * Check if logged or registering
     *
     * @return bool
     */
    public function isLoggedInOrRegistering()
    {
        if (Mage::helper('customer')->isLoggedIn()) {
            return true;
        }

        $checkoutMethod = Mage::getSingleton('checkout/session')->getQuote()->getCheckoutMethod();

        if (strcmp($checkoutMethod, Mage_Sales_Model_Quote::CHECKOUT_METHOD_LOGIN_IN) === 0) {
            return true;
        }

        if (strcmp($checkoutMethod, Mage_Checkout_Model_Type_Onepage::METHOD_REGISTER) === 0) {
            return true;
        }

        return false;
    }

    /**
     * Check if logged in checkout
     *
     * @return bool
     */
    public function isCheckoutLoggedIn()
    {
        if (Mage::helper('customer')->isLoggedIn()) {
            return true;
        }

        $checkoutMethod = Mage::getSingleton('checkout/session')->getQuote()->getCheckoutMethod();

        if (strcmp($checkoutMethod, Mage_Sales_Model_Quote::CHECKOUT_METHOD_LOGIN_IN) === 0) {
            return true;
        }

        return false;
    }

    /**
     * Convert to camel case
     *
     * @param $str
     * @param array $exclude
     * @return string
     */
    public function camelCase($str, $exclude = array())
    {
        // replace accents by equivalent non-accents
        $str = self::replaceAccents($str);
        // non-alpha and non-numeric characters become spaces
        $str = preg_replace('/[^a-z0-9' . implode("", $exclude) . ']+/i', ' ', $str);
        // uppercase the first character of each word
        $str = ucwords(trim($str));
        return lcfirst(str_replace(" ", "", $str));
    }

    /**
     * Replace accents in string
     *
     * @param $str
     * @return mixed
     */
    public function replaceAccents($str) {
        $search = explode(",",
            "ç,æ,œ,á,é,í,ó,ú,à,è,ì,ò,ù,ä,ë,ï,ö,ü,ÿ,â,ê,î,ô,û,å,ø,Ø,Å,Á,À,Â,Ä,È,É,Ê,Ë,Í,Î,Ï,Ì,Ò,Ó,Ô,Ö,Ú,Ù,Û,Ü,Ÿ,Ç,Æ,Œ");
        $replace = explode(",",
            "c,ae,oe,a,e,i,o,u,a,e,i,o,u,a,e,i,o,u,y,a,e,i,o,u,a,o,O,A,A,A,A,A,E,E,E,E,I,I,I,I,O,O,O,O,U,U,U,U,Y,C,AE,OE");
        return str_replace($search, $replace, $str);
    }

    /**
     * Calculate sub account
     *
     * @param Varien_Object $payment
     * @param $code
     * @return string
     */
    public function getSubAccount(Varien_Object $payment, $code)
    {
        $default = $this->getConfigData($code, 'sub_account');

        $processed =  Mage::getSingleton('realex/subAccountProcessor')->process(
            $default,
            unserialize($this->getConfigData($code, 'sub_account_rules')),
            array(
                'card_type' => $payment->getCcType(),
            ),
            $payment
        );

        if(trim($processed) != ''){
            return trim($processed);
        }

        return trim($default);
    }

    /**
     * Return card expiration date in a normal format: MM/YYYY
     * @return string
     */
    public function getCardDateFormatted($string) {
        $newString = $string;
        if (strlen($string) == 4) {
            $date = str_split($string, 2);
            $newString = $date[0] . '/' . '20' . $date[1];
        }
        return $newString;
    }

    /**
     * Get log dir
     *
     * @return string
     */
    public function getRealexLogDir() {
        return Mage::getBaseDir('log') . DS . 'realex';
    }

    /**
     * Convert xml to array
     *
     * @param $data
     * @return array
     */
    public function xmlToArray($data){
        if(is_array($data)){
            return $this->flatten($data);
        }
        try{
            $xml = simplexml_load_string($data);
            $json = json_encode($xml);
            return $this->flatten(json_decode($json, true));

        }catch(Exception $e){
            return $data;
        }
    }

    /**
     * Flatten array
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

    public function getSessionCustomerId() {
        return $this->getCustomerQuoteId();
    }

    /**
     * Get customer quote
     *
     * @return int|string
     */
    public function getCustomerQuoteId() {
        $id = null;

        if (Mage::getSingleton('adminhtml/session_quote')->getQuoteId()) { #Admin
            $id = Mage::getSingleton('adminhtml/session_quote')->getCustomerId();
        } else if (Mage::getSingleton('customer/session')->getCustomerId()) { #Logged in frontend
            $id = Mage::getSingleton('customer/session')->getCustomerId();
        } else { #Guest/Register
            $vdata = Mage::getSingleton('core/session')->getVisitorData();
            return (string) $vdata['session_id'];
        }

        return (int) $id;
    }

    /**
     * Get store code option
     *
     * @return string
     */
    public function storeCardOption(){
        $value = Mage::getStoreConfig('payment/realvault/store_card', Mage::app()->getStore());
        if($value) {
            return '1';
        }

        return '0';
    }

    /**
     * Get customer ref from session
     *
     * @return mixed
     */
    public function getPayerRef(){

        return mage::helper('realex')->getSessionCustomerId();
    }

    /**
     * Check if payer exist
     *
     * @return string
     */
    public function payerExist(){
        $payerId = $this->getPayerRef();
        $customer = Mage::getModel('customer/customer')->load($payerId);
        if(!$customer->getId()){
            $customer = $payerId;
        }

        $collection = mage::getModel('realex/tokencard')->getCollection()->addCustomerFilter($customer);

        if($collection->count() > 0){
            return '1';
        }
        return '0';
    }

    /**
     * Load customer cards
     *
     * @param null $methodCode
     * @return null|Varien_Object
     */
    public function loadCustomerCards($methodCode = null) {

        $this->_tokenCards = new Varien_Object;

        if (!$this->_tokenCards->getSize()) {

            $_id = $this->getCustomerQuoteId();

            if(is_numeric($_id)) {
                if($_id === 0) {
                    return $this->_tokenCards;
                }
            }
            $this->_tokenCards = Mage::getModel('realex/tokencard')->getCollection()
                ->setOrder('id', 'DESC')
                ->addCustomerFilter($_id);

            $this->_tokenCards->load();

        }

        return $this->_tokenCards;
    }

    /**
     * Get default token
     *
     * @return mixed
     */
    public function getDefaultToken() {
        return Mage::getModel('realex/tokencard')->getDefaultCard();
    }

    public function getCardNiceDate($string) {
        $newString = $string;

        if (strlen($string) == 4) {
            $date = str_split($string, 2);
            $newString = $date[0] . '/' . '20' . $date[1];
        }

        return $newString;
    }

    /**
     * Create payer ref
     *
     * @param Mage_Customer_Model_Customer $customer
     * @return string
     * @throws Mage_Core_Exception
     */
    public function createPayerRef($customer){

        $payerRef = $customer->getId();
        $payerRef .= '-' . preg_replace( "/[^a-z]/i", "_", $customer->getEmail());
        $payerRef .= '-' . preg_replace( "/[^a-z]/i", "", Mage::app()->getWebsite()->getCode());
        $payerRef .= '-' . preg_replace( "/[^a-z]/i", "", Mage::app()->getStore()->getCode());

        return $this->ss($payerRef,50);
    }

    /**
     * Get customer id from session
     *
     * @return mixed
     */
    public function getCustomerId(){
        return Mage::getSingleton('customer/session')->getId();
    }

    /**
     * Get token
     *
     * @param string $id
     * @return Mage_Core_Model_Abstract
     */
    public function getToken($id){
        return Mage::getModel('realex/tokencard')->load($id);
    }

    /**
     * Get customer ref
     *
     * @param string $id
     * @return bool
     */
    public function getCustomerPayerRef($id){

        $customer = Mage::getModel('customer/customer')->load($id);
        if(!$customer->getId()){
            return false;
        }

        return $customer->getRealexPayerRef();
    }

    /**
     * Get Token card
     *
     * @param $id
     * @return mixed
     */
    public function getTokenCardType($id){
        return Mage::getModel('realex/tokencard')->load($id)->getCardType();
    }

    /**
     * Check if token exist
     *
     * @param Mage_Customer_Model_Customer $customer
     * @param $payment
     * @param $ccnumber
     * @return bool
     */
    public function tokenExist($customer,$payment,$ccnumber){

        $cards = Mage::getModel('realex/realex_source_cards');
        $tokens = Mage::getModel('realex/tokencard')->getCollection()
            ->addDuplicateFilter(
                $customer->getId(),
                substr(($ccnumber?$ccnumber:$payment->getCcNumber()), -4),
                $cards->getGatewayCardType($payment->getCcType()),
                $this->getCreditCardDate($payment)
            )
            ->load();
        if($tokens->count() > 0){
            return true;
        }

        return false;
    }

    /**
     * Split credit card date
     *
     * @param Varien_Object $payment
     * @return string
     */
    public function getCreditCardDate(Varien_Object $payment)
    {
        $month = $payment->getCcExpMonth();
        $year = $payment->getCcExpYear();

        if (!$month || !$year) {
            return '';
        }

        $month = str_pad($month, 2, '0', STR_PAD_LEFT);
        $year = substr($year, -2, 2);

        return $month . $year;
    }

    /**
     * Genrate timestamp
     *
     * @return bool|mixed|string
     */
    public function getTimestamp()
    {
        $timestamp = Mage::registry(self::REGISTRY_KEY_CURRENT_TIMESTAMP);

        if (is_null($timestamp)) {
            $timestamp = date('YmdHis');
            Mage::register(self::REGISTRY_KEY_CURRENT_TIMESTAMP, $timestamp);
        }

        return $timestamp;
    }

    /**
     * Generate sha1hash
     *
     * @param string $secret
     * @param null $args
     * @return string
     */
    public function generateSha1Hash($secret, $args = null)
    {

        $secret = Mage::helper('core')->decrypt($secret);
        $hash = sha1(implode('.', $args));
        $hash = sha1("{$hash}.{$secret}");

        return $hash;
    }

    /**
     * Get number of cards
     *
     * @return int
     */
    public function getMaxSavedCards(){
        $default = 3;

        $maxCards = $this->getConfigData('realvault','max_saved');
        if(is_int((int)$maxCards)){
            return (int)$maxCards;
        }
        return $default;
    }

    /**
     * Check if can add card
     *
     * @param int $cardCount
     * @return bool
     */
    public function canAddCard($cardCount){
        if($cardCount < $this->getMaxSavedCards()){
            return true;
        }
        return false;
    }

    /**
     * Return token data as array
     *
     * @param int $cardId
     * @return array
     */
    public function getTokenAsArray($cardId) {

        $card = Mage::getModel('realex/tokencard')->load($cardId);

        $_rest = array();

        if ($card->getId()) {
            $_rest[Mage::helper('realex')->__('Credit Card Type')] = $card->getMagentoCardType();
            $_rest[Mage::helper('realex')->__('Credit Card Number')] = sprintf('xxxx-%s', $card->getLastFour());
        }

        return $_rest;
    }

    /**
     * Get token payment code
     *
     * @param string $cardId
     * @return bool
     */
    public function getTokenPaymentCode($cardId) {

        $card = Mage::getModel('realex/tokencard')->load($cardId);

        if ($card->getId()) {
            return $card->getPaymentCode();
        }

        return false;
    }

    /**
     * Check if admin controller
     *
     * @return bool
     */
    public function updateAdminCard() {

        $controllerName = Mage::app()->getRequest()->getControllerName();
        return ($controllerName == 'adminhtml_tokencard');

    }

    /**
     * Check if real vault on hpp enabled
     *
     * @param bool $storeCard
     * @return bool
     */
    public function hppChoseRealVault($storeCard = false){

        if($this->storeCardOption() && !$storeCard ){
            return false;
        }

        return true;

    }

    /**
     * Apply conversion to string
     *
     * @param string $string
     * @return mixed
     */
    public function conversion($string){

        if(array_key_exists(strtolower($string),$this->_conversions)){
            return $this->_conversions[strtolower($string)];
        }
        return $string;
    }

    /**
     * Get magento version
     *
     * @return string
     */
    public function getVersion()
    {
        return (string) Mage::getConfig()->getNode()->modules->Yoma_Realex->version;
    }

    public function isInt($value)
    {
        return preg_match('/^\-*\d+$/', (string)$value) === 1;
    }
} 
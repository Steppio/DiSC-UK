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
abstract class Yoma_Realex_Model_Payment_Token extends Yoma_Realex_Model_Payment_Abstract{

    protected $_participatingCard = true;

    /**
     * Get gateway url
     *
     * @param string $serviceCode
     * @return string
     */
    protected function _getServiceUrl($serviceCode = null){

        if(!isset($serviceCode)){
            $serviceCode = $this->_service->getCode();
        }

        if($this->_getHelper()->getConfigData($serviceCode,'use_threed_secure')){
            return $this->_getHelper()->getConfigData($serviceCode,'threed_url');
        }

        return $this->_getHelper()->getConfigData($serviceCode,'live_url');
    }

    /**
     * Prepare transaction request acl post
     *
     * @return $this
     */
    protected function _prepareAclPost(){

        $acl = array();

        $acl['post']['PaReq'] = $this->_response->getPareq();
        $acl['action'] = $this->_response->getUrl();
        $acl['post']['MD'] = $this->_createMd();
        $acl['post']['TermUrl'] = $this->getCallbackUrl();
        mage::getSingleton('realex/session')->setTransactionData($acl);
        $this->_service->debugData(array('request'=>$this->_getHelper()->xmlToArray($acl)));

        return $this;
    }

    /**
     * Prepare transaction request 3D register
     *
     * @return $this
     */
    protected function _prepareThreedRegister(){

        $payment = $this->_service->getPayment();
        $order = $this->_service->getOrder();
        $helper = $this->_getHelper();
        $cards = Mage::getModel('realex/realex_source_cards');
        $transactionReference = $this->_service->getTransactionReference();

        $request = array(
            'attributes' => array(
                'timestamp' => $helper->getTimestamp(),
                'type' => "realvault-3ds-verifyenrolled"
            ),
            'merchantid' => array('value' => $helper->getConfigData('realex','vendor')),
            'account' => array('value' => $helper->getSubAccount($payment,$this->_service->getCode())),
            'orderid' => array('value' => $transactionReference),
            'amount' => array(
                'value' => $helper->formatAmount($payment->getPaymentAmount(),$order->getOrderCurrencyCode()),
                'attributes' => array(
                    'currency' => $order->getOrderCurrencyCode(),
                )
            )
        );

        if(isset($this->_token)){
            $request['payerref'] = array('value' => $helper->getCustomerPayerRef($helper->getCustomerId()));
            $request['paymentmethod'] = array('value' => $this->_token->getToken());
        }

        $sha1hash = array(
            $request['attributes']['timestamp'] ,
            $request['merchantid']['value'],
            $request['orderid']['value'],
            $request['amount']['value'],
            $request['amount']['attributes']['currency'],
            $request['payerref']['value']
            //(isset($this->_token)?$request['payerref']['value']:'')
        );

        $request['sha1hash'] = array('value' => $helper->generateSha1Hash($helper->getConfigData('realex','secret'),$sha1hash));

        $this->_message->setData(array('request'=>$request));
        return $this;
    }

    /**
     * Prepare transaction request capture
     *
     * @return $this
     */
    protected function _prepareCapture(){

        $payment = $this->_service->getPayment();
        $order = $this->_service->getOrder();
        $helper = $this->_getHelper();
        $cards = Mage::getModel('realex/realex_source_cards');
        $transactionReference = $this->_service->getTransactionReference();

        $request = array(
            'attributes' => array(
                'timestamp' => $helper->getTimestamp(),
                'type' => "receipt-in"
            ),
            'merchantid' => array('value' => $helper->getConfigData('realex','vendor')),
            'account' => array('value' => $helper->getSubAccount($payment,$this->_service->getCode())),
            'orderid' => array('value' => $transactionReference),
            'amount' => array(
                'value' => $helper->formatAmount($payment->getPaymentAmount(),$order->getBaseCurrencyCode()),
                'attributes' => array(
                    'currency' => $order->getBaseCurrencyCode(),
                )
            )
        );

        $paymentData = array(
            'cvn' => array(
                'number' => array('value' => $this->getRealexSession()->getTokenCvv())
            )
        );
        $request['paymentdata'] = $paymentData;

        $request['payerref'] = array('value' => $helper->getCustomerPayerRef($order->getCustomer()->getId()));
        $request['paymentmethod'] = array('value' => $this->_token->getToken());

        $sha1hash = array(
            $request['attributes']['timestamp'] ,
            $request['merchantid']['value'],
            $request['orderid']['value'],
            $request['amount']['value'],
            $request['amount']['attributes']['currency'],
            $request['payerref']['value']
        );

        $request['sha1hash'] = array('value' => $helper->generateSha1Hash($helper->getConfigData('realex','secret'),$sha1hash));

        if(!empty($this->_mpiData)){

            $request['mpi'] = $this->_mpiData;
        }

        $billing = $order->getBillingAddress();
        if($order->getIsVirtual()){
            $shipping = $billing;
        }else{
            $shipping = $order->getShippingAddress();
        }

        $tssinfo = array(
            'custnum' => array('value' => $helper->getSessionCustomerId()),
            'custipaddress' => array('value' => $helper->getClientIpAddress()),
            'varref' => array('value' => $billing->getEmail())
        );

        $billingAddress  = array(
            'attributes' => array(
                'type' => 'billing'
            ),
            'code' => array('value' => $helper->getTssCode($billing)),
            'country' => array('value' => $billing->getCountry()),

        );

        $shippingAddress  = array(
            'attributes' => array(
                'type' => 'shipping'
            ),
            'code' => array('value' => $helper->getTssCode($shipping)),
            'country' => array('value' => $shipping->getCountry()),
        );

        $tssinfo['multiple']['address'][] = $billingAddress;
        $tssinfo['multiple']['address'][] = $shippingAddress;


        $request['tssinfo'] = $tssinfo;

        $request['autosettle'] = array(
            'attributes' =>
                array(
                    'flag' => ($this->_method == 'capture'?'1':'0')
                )
        );

        $request['comments'] = $this->_addComments();

        $this->_message->setData(array('request'=>$request));

        $this->getRealexSession()->setTokenCvv('');

        return $this;
    }

    /**
     * Prepare transaction request 3d capture
     *
     * @return $this
     */
    protected function _prepareThreedCapture($mdData){

        $transaction = $this->_service->getTransaction();
        $helper = $this->_getHelper();
        $order = $this->_service->getOrder();

        $request = array(
            'attributes' => array(
                'timestamp' => $helper->getTimestamp(),
                'type' => "receipt-in"
            ),
            'merchantid' => array('value' => $helper->getConfigData('realex','vendor')),
            'account' => array('value' => $transaction->getAdditionalInformation('account')),
            'orderid' => array('value' => $transaction->getAdditionalInformation('orderid')),
            'amount' => array(
                'value' => $transaction->getAdditionalInformation('payment_amount'),
                'attributes' => array(
                    'currency' => $transaction->getAdditionalInformation('currency'),
                )
            )
        );

        $paymentData = array(
            'cvn' => array(
                'number' => array('value' => $mdData['token_cvv'])
            )
        );
        $request['paymentdata'] = $paymentData;

        $request['payerref'] = array('value' => $helper->getCustomerPayerRef($this->_customer->getId()));
        $request['paymentmethod'] = array('value' => $this->_token->getToken());

        $sha1hash = array(
            $request['attributes']['timestamp'] ,
            $request['merchantid']['value'],
            $request['orderid']['value'],
            $request['amount']['value'],
            $request['amount']['attributes']['currency'],
            $request['payerref']['value']
        );

        $request['sha1hash'] = array('value' => $helper->generateSha1Hash($helper->getConfigData('realex','secret'),$sha1hash));

        $request['mpi'] = $this->_mpiData;

        $billing = $order->getBillingAddress();
        if($order->getIsVirtual()){
            $shipping = $billing;
        }else{
            $shipping = $order->getShippingAddress();
        }

        $tssinfo = array(
            'custnum' => array('value' => $helper->getSessionCustomerId()),
            'custipaddress' => array('value' => $helper->getClientIpAddress()),
            'varref' => array('value' => $billing->getEmail())
        );

        $billingAddress  = array(
            'attributes' => array(
                'type' => 'billing'
            ),
            'code' => array('value' => $helper->getTssCode($billing)),
            'country' => array('value' => $billing->getCountry()),

        );

        $shippingAddress  = array(
            'attributes' => array(
                'type' => 'shipping'
            ),
            'code' => array('value' => $helper->getTssCode($shipping)),
            'country' => array('value' => $shipping->getCountry()),
        );

        $tssinfo['multiple']['address'][] = $billingAddress;
        $tssinfo['multiple']['address'][] = $shippingAddress;


        $request['tssinfo'] = $tssinfo;

        $request['autosettle'] = array(
            'attributes' =>
                array(
                    'flag' => ($this->_method == 'capture'?'1':'0')
                )
        );

        $request['comments'] = $this->_addComments();

        $this->_message->setData(array('request'=>$request));

        return $this;
    }

    /**
     * Prepare transaction request 3d verify
     *
     * @return $this
     */
    protected function _prepareThreedVerify($pares, $mdData){

        $transaction = $this->_service->getTransaction();

        $helper = $this->_getHelper();


        $request = array(
            'attributes' => array(
                'timestamp' => $helper->getTimestamp(),
                'type' => '3ds-verifysig'
            ),
            'merchantid' => array('value' => $helper->getConfigData('realex','vendor')),
            'account' => array('value' => $transaction->getAdditionalInformation('account')),
            'orderid' => array('value' => $transaction->getAdditionalInformation('orderid')),
            'amount' => array(
                'value' => $transaction->getAdditionalInformation('payment_amount'),
                'attributes' => array(
                    'currency' => $transaction->getAdditionalInformation('currency'),
                )
            )
        );

        $sha1hash = array(
            $request['attributes']['timestamp'] ,
            $request['merchantid']['value'],
            $request['orderid']['value'],
            $request['amount']['value'],
            $request['amount']['attributes']['currency'],
            ''
        );

        $request['sha1hash'] = array('value' => $helper->generateSha1Hash($helper->getConfigData('realex','secret'),$sha1hash));
        $request['pares'] = array('value'=>$pares);

        $this->_message->setData(array('request'=>$request));

        return $this;
    }

    /**
     * Append comments to transaction message
     *
     * @return array
     */
    protected function _addComments(){

        $comments = array();

        $comment1 = array(
            'attributes' => array(
                'id' => 1,
            ),
            'value' => 'magento - ' . Mage::getVersion()
        );
        $comment2 = array(
            'attributes' => array(
                'id' => 2,
            ),
            'value' => 'yoma ' . $this->_getHelper()->getVersion()
        );

        $comments['multiple']['comment'][] = $comment1;
        $comments['multiple']['comment'][] = $comment2;

        return $comments;
    }

    /**
     * Retrieve token
     *
     * @return mixed
     */
    protected function _hasToken(){

        // if active and have id get token
        if( Mage::getStoreConfig('payment/realvault/active', Mage::app()->getStore()) && $this->_service->getPayment()->getRealexTokenCcId()){
            return $this->_getHelper()->getToken($this->_service->getPayment()->getRealexTokenCcId());
        }

        return NULL;
    }

    /**
     * @return Mage_Core_Helper_Abstract|mixed
     */
    protected function _getHelper(){

        return mage::helper('realex');
    }

}
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
abstract class Yoma_Realex_Model_Payment_Direct extends Yoma_Realex_Model_Payment_Abstract{

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

        $mdData = $this->_createMd();

        $acl = array();

        $acl['post']['PaReq'] = $this->_response->getPareq();
        $acl['action'] = $this->_response->getUrl();
        $acl['post']['MD'] = $mdData;
        $acl['post']['TermUrl'] = $this->getCallbackUrl();

        mage::getSingleton('realex/session')->setTransactionData($acl);

        $this->_service->debugData(array('request'=>$this->_getHelper()->xmlToArray($acl)));

        return $this;

    }

    /**
     * Prepare transaction request 3d register
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
                'type' => '3ds-verifyenrolled'
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


        $card = array(
            'number'=>array('value' => $payment->getCcNumber()),
            'expdate' =>array('value' => $helper->getCreditCardDate($payment)),
            'chname' => array('value' => $helper->getCreditCardName($payment)),
            'type' => array('value' => $cards->getGatewayCardType($payment->getCcType())),
        );

        if($payment->getCcSsIssue()){
            $card['issueno'] = array('value' => $payment->getCcSsIssue());
        }

        $cvn = array(
            'number'=>array('value' => $payment->getCcCid()),
            'presind' =>array('value' => ($payment->getCcCid()?'1':'2'))
        );

        $card['cvn'] = $cvn;

        $request['card'] = $card;


        $sha1hash = array(
            $request['attributes']['timestamp'] ,
            $request['merchantid']['value'],
            $request['orderid']['value'],
            $request['amount']['value'],
            $request['amount']['attributes']['currency'],
            $request['card']['number']['value']
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
                'type' => 'auth'
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

        $card = array(
            'number'=>array('value' => $payment->getCcNumber()),
            'expdate' =>array('value' => $helper->getCreditCardDate($payment)),
            'chname' => array('value' => $helper->getCreditCardName($payment)),
            'type' => array('value' => $cards->getGatewayCardType($payment->getCcType())),
        );

        if($payment->getCcSsIssue()){
            $card['issueno'] = array('value' => $payment->getCcSsIssue());
        }

        $cvn = array(
            'number'=>array('value' => $payment->getCcCid()),
            'presind' =>array('value' => ($payment->getCcCid()?'1':'2'))
        );

        $card['cvn'] = $cvn;

        $request['card'] = $card;

        $sha1hash = array(
            $request['attributes']['timestamp'] ,
            $request['merchantid']['value'],
            $request['orderid']['value'],
            $request['amount']['value'],
            $request['amount']['attributes']['currency'],
            $request['card']['number']['value']
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
     * Prepare transaction request settle
     *
     * @return $this
     */
    protected function _preparePartial(){

        $payment = $this->_service->getPayment();
        $order = $this->_service->getOrder();
        $helper = $this->_getHelper();

        $request = array(
            'attributes' => array(
                'timestamp' => $helper->getTimestamp(),
                'type' => 'settle'
            ),
            'merchantid' => array('value' => $helper->getConfigData('realex','vendor')),
            'account' => array('value' => $this->_getSubAccount($payment)),
            'orderid' => array('value' => $payment->getParentTransactionId()),
            'amount' => array(
                'value' => $helper->formatAmount($payment->getPaymentAmount(),$order->getBaseCurrencyCode()),
                'attributes' => array(
                    'currency' => $order->getOrderCurrencyCode(),
                )
            ),
            'pasref' => array('value' => $this->_getTransactionData($payment,'pasref')),
            'authcode' => array('value' => $this->_getTransactionData($payment,'authcode'))
        );

        $sha1hash = array(
            $request['attributes']['timestamp'] ,
            $request['merchantid']['value'],
            $request['orderid']['value'],
            $request['amount']['value'],
            $request['amount']['attributes']['currency'],
            '',
        );

        $request['sha1hash'] = array('value' => $helper->generateSha1Hash($helper->getConfigData('realex','secret'),$sha1hash));

        $request['comments'] = $this->_addComments();

        $this->_message->setData(array('request'=>$request));

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
                'type' => 'auth'
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

        $card = array(
            'number'=>array('value' => $mdData['card_number']),
            'expdate' =>array('value' => $transaction->getAdditionalInformation('card_expiry')),
            'chname' => array('value' => $transaction->getAdditionalInformation('card_name')),
            'type' => array('value' => $transaction->getAdditionalInformation('card_type')),
        );


        $cvn = array(
            'number'=>array('value' => $mdData['card_cvn']),
            'presind' =>array('value' => (isset($mdData['card_cvn'])  && !$mdData['card_cvn']=='' ? '1':'2'))
        );

        $card['cvn'] = $cvn;
        $request['card'] = $card;

        $sha1hash = array(
            $request['attributes']['timestamp'],
            $request['merchantid']['value'],
            $request['orderid']['value'],
            $request['amount']['value'],
            $request['amount']['attributes']['currency'],
            $request['card']['number']['value'],
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
     * @TODO refractor
     *
     * @return null
     */
    protected function _hasToken(){

        return NULL;
    }

    /**
     * Get original sub account
     *
     * @param Varien_Object$payment
     * @return string
     */
    protected function _getSubAccount($payment){

        $subAccount = $this->_getTransactionData($payment,'account');
        if(is_array($subAccount)) {
            $this->_getHelper()->getSubAccount($payment, $this->_service->getCode());
        }

        $payment->setOriginalSubAccount($subAccount);

        return $subAccount;
    }
}
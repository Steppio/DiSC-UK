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
class Yoma_Realex_Model_Payment_Direct_RegisterToken extends Yoma_Realex_Model_Payment_Direct{

    protected $_code = 'direct';
    protected $_allowedMethods = array('registerToken');
    protected $_method = 'registerToken';
    protected $_action = 'registerToken';
    protected $_payerRef = null;
    protected $_customer = null;

    /**
     * Start transaction with payment gateway
     *
     * @return $this|mixed
     * @throws Exception
     */
    protected function _pay(){

        $customer = $this->_service->getOrder()->getCustomer();
        $customerId = '';
        if(isset($customer)){
            $customerId = $customer->getId();
        }else{
            $customerId = $this->_service->getOrder()->getCustomerId();
        }
        $this->_customer = mage::getModel('customer/customer')->load($customerId);

        $this->_payerRef = $this->_customer->getData('realex_payer_ref');
        // if not existing payer create payer
        if(!isset($this->_payerRef)){
            $this->_method = 'payerNew';
            $this->_action = 'payerNew';
            $this->_setMessage($this->_method,'token');
            $this->_setResponse($this->_method,null,'token');

            $this->_preparePayerNew();

            $this->_send(
                $this->_getServiceUrl(),
                $this->_message->prepareMessage()
            );

            $this->_response->processResult();
            try{
                $this->_customer->setRealexPayerRef($this->_payerRef);
                $this->_customer->save();
            }catch(Exception $e){
                $this->getRealexSession()->setTokenSaved(false);
                Mage::getSingleton('customer/session')->setTokenSaved(false);
                throw $e;
            }catch(Yoma_Realex_Model_Exception_PayerNew $e){
                $this->getRealexSession()->setTokenSaved(false);
                Mage::getSingleton('customer/session')->setTokenSaved(false);
                throw $e;
                return $this;
            }

        }
        // if token not all ready exist create
        if(!$this->_getHelper()->tokenExist(
            $this->_customer,$this->_service->getPayment(),
            $this->_service->getMd('card_number'))){
            $this->_method = 'registerToken';
            $this->_action = 'registerToken';
            $this->_setMessage($this->_method,'token');
            $this->_setResponse($this->_method,null,'token');

            $this->_prepareRegisterToken();

            $this->_send(
                $this->_getServiceUrl(),
                $this->_message->prepareMessage()
            );

            $this->_response->processResult();

            $this->_saveToken();
            $this->getRealexSession()->setTokenSaved(true);
            Mage::getSingleton('customer/session')->setTokenSaved(true);
        }
        return $this;
    }

    /**
     * Prepare transaction request register token
     *
     * @return $this
     */
    protected function _prepareRegisterToken(){

        $payment = $this->_service->getPayment();
        $helper = $this->_getHelper();
        $cards = Mage::getModel('realex/realex_source_cards');
        $transactionReference = $this->_service->getTransactionReference();


        $request = array(
            'attributes' => array(
                'timestamp' => $helper->getTimestamp(),
                'type' => 'card-new'
            ),
            'merchantid' => array('value' => $helper->getConfigData('realex','vendor')),
            'orderid' => array('value' => $transactionReference . '-card')
        );

        $card = array(

            'ref' => array('value' => $helper->getCardReference($cards->getGatewayCardType($payment->getCcType()))),
            'payerref' => array('value' => $this->_payerRef),
            'number'=>array('value' => ($this->_service->getMd('card_number')?$this->_service->getMd('card_number'):$payment->getCcNumber())),
            'expdate' =>array('value' => $helper->getCreditCardDate($payment)),
            'chname' => array('value' => ($helper->ss($payment->getCcOwner(),100))),
            'type' => array('value' => $cards->getGatewayCardType($payment->getCcType())),
        );

        if($payment->getCcSsIssue()){
            $card['issueno'] = array('value' => $payment->getCcSsIssue());
        }

        $request['card'] = $card;

        $sha1hash = array(
            $request['attributes']['timestamp'] ,
            $request['merchantid']['value'],
            $request['orderid']['value'],
            '',
            '',
            $this->_payerRef,
            $request['card']['chname']['value'],
            $request['card']['number']['value']
        );

        $request['sha1hash'] = array('value' => $helper->generateSha1Hash($helper->getConfigData('realex','secret'),$sha1hash));

        $this->_message->setData(array('request'=>$request));
        return $this;


    }

    /**
     * Prepare transaction request payer new
     *
     * @return $this
     */
    protected function _preparePayerNew(){

        $order = $this->_service->getOrder();
        $helper = $this->_getHelper();
        $transactionReference = $this->_service->getTransactionReference();

        $address = $order->getBillingAddress();

        $request = array(
            'attributes' => array(
                'timestamp' => $helper->getTimestamp(),
                'type' => 'payer-new'
            ),
            'merchantid' => array('value' => $helper->getConfigData('realex','vendor')),
            'orderid' => array('value' => $transactionReference . '-payer')
        );

        $this->_payerRef = $helper->createPayerRef($this->_customer);
        $payer = array(
            'attributes' => array(
                'ref' => $this->_payerRef,
                'type'=> $helper->getConfigData('realvault','payer_type')
            ),
            'firstname' => array('value' => $helper->ss($this->_customer->getFirstname(),30)),
            'surname' => array('value' => $helper->ss($this->_customer->getLastname(),50)),
            'email' => array('value' => $helper->realexEmail($helper->ss($this->_customer->getEmail(),50)))
        );

        $payerAddress = array(

            'line1' => array('value' => $helper->ss($address->getStreet(1),50)),
            'line2' => array('value' => $helper->ss($address->getStreet(2),50)),
            'line3' => array('value' => $helper->ss($address->getStreet(3),50)),
            'city' => array('value' => $helper->ss($address->getCity(),20)),
            'county'=> array('value' => $address->getRegion()),
            'postcode' => array('value' => $helper->ss($address->getPostcode(),8)),
            'country' => array(
                'attributes' => array(
                    'code' => $address->getCountryId()
                ),
                'value' => Mage::app()->getLocale()->getCountryTranslation($address->getCountryId())
            )
        );

        $payer['address'] = $payerAddress;
        $request['payer'] = $payer;

        $sha1hash = array(
            $request['attributes']['timestamp'] ,
            $request['merchantid']['value'],
            $request['orderid']['value'],
            '',
            '',
            $this->_payerRef
        );

        $request['sha1hash'] = array('value' => $helper->generateSha1Hash($helper->getConfigData('realex','secret'),$sha1hash));

        $this->_message->setData(array('request'=>$request));
        return $this;
    }

    /**
     * Save Token
     */
    protected function _saveToken(){
        $tokenData = $this->_message->getTransactionData();
        $magentoCardType = $payment = $this->_service->getPayment()->getCcType();
        $token = Mage::getModel("realex/tokencard");

        $token
            ->setCustomerId($this->_customer->getId())
            ->setToken($tokenData['token_ref'])
            ->setStatus(1)
            ->setCardType($tokenData['card_type'])
            ->setMagentoCardType($magentoCardType)
            ->setLastFour(substr($tokenData['card_number'], -4))
            ->setExpiryDate($tokenData['card_expiry'])
            ->setChName($tokenData['card_name'])
            ->setIsDefault(0)
            ->setPayerRef($tokenData['payer_ref'])
            ->setPaymentMethod($this->_code)
        ->save();
    }

    /**
     * @param string $serviceCode
     * @return string
     */
    protected function _getServiceUrl($serviceCode = null){

        return $this->_getHelper()->getConfigData($this->_service->getCode(),'live_url');
    }

}
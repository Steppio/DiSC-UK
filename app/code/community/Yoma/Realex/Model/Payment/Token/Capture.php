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
class Yoma_Realex_Model_Payment_Token_Capture extends Yoma_Realex_Model_Payment_Token{

    protected $_code = 'token';
    protected $_allowedMethods = array('capture');
    protected $_method = 'capture';
    protected $_action = 'capture';
    protected $_mpiData = array();
    protected $_useToken = null;
    protected $_captureType = 'capture';
    protected $_customer = NULL;

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
     * Process 3dSecure Callback
     *
     * @return $this
     * @throws Exception
     */
    public function processCallback(){

        $this->addPaymentInfo('Customer returned from 3DSecure ACS URL', 'Complete');

        $this->_service->debugData(array('response'=>$this->_response->getData()));

        if (!$this->_response->getMd() || !$this->_response->getPares()) {
            throw new Exception(
                $this->_getHelper()->__('MD or PARES not provided in 3D Secure callback.')
            );
        }
        $pares = $this->_response->getPares();

        // decrypt the MD data from the 3D Secure response
        $mdData = $this->_recieveMdData($this->_response->getMd());


        // ensure the transaction reference in the response data matches Magento
        $callbackReference = $mdData['transaction_reference'];
        $savedReference = $this->_service->getTransaction()->getTransactionReference();
        if (strcmp($callbackReference, $savedReference) !== 0) {
            $message = $this->_getHelper()->__('Transaction reference mismatch.');

            throw new Exception(
                $message
            );
        }
        try{

            $transConfig = new varien_object();
            Mage::dispatchEvent('realex_process_callback', array('transaction'=>$this->_service->getTransaction(),'transport'=>$transConfig));

            $this->_token = $this->_hasToken();

            $customer = $this->_service->getOrder()->getCustomer();
            $customerId = '';
            if(isset($customer)){
                $customerId = $customer->getId();
            }else{
                $customerId = $this->_service->getOrder()->getCustomerId();
            }
            $this->_customer = mage::getModel('customer/customer')->load($customerId);

            $this->_method = 'threedSecureVerify';
            $this->_setMessage($this->_method);
            $this->_setResponse($this->_method);
            $this->_prepareThreedVerify($pares,$mdData);

            $this->addPaymentInfo('3DSecure Signature Verification', 'Started');

            $this->_send(
                $this->_getServiceUrl(),
                $this->_message->prepareMessage()
            );

            $this->addPaymentInfo('ECI Result', $this->_response->getThreedsecureEci());

            $eci = $this->_response->getEciFromThreedSecureVerifySignature(
                $this->_response->getResult(),
                $this->_response->getThreedsecureStatus(),
                ($this->_token?$this->_token->getCardType():$this->_service->getTransaction()->getAdditionalInformation('card_type')),
                $this->_threedSecureCardTypes,
                $this->_getHelper()->getConfigData('realvault','require_liability_shift'),
                $transConfig
                );

            $this->addPaymentInfo('ECI Result', $eci);
            $this->_setMpiData('eci',$eci);

        }catch(Yoma_Realex_Model_Exception_NoLiabilityShift $e){
            throw new Exception($e->getMessage());
        }

        $this->_setMpiData('cavv',$this->_response->getThreedsecureCavv());
        $this->_setMpiData('xid',$this->_response->getThreedsecureXid());
        $this->_threedCapture(
            $mdData
        );

        return $this;
    }

    /**
     * Call 3dCapture on payment gateway
     *
     * @param array $mdData
     * @param string $method
     * @throws Exception
     */
    protected function _threedCapture($mdData,$method = 'capture'){

        $this->_method = $this->_captureType;
        $this->_action = $this->_captureType;
        $this->_setMessage($this->_method);
        $this->_setResponse($this->_method);

        $this->_prepareThreedCapture($mdData);

        Mage::dispatchEvent(
            'realex_before_capture',
            array(
                'method'=>$this->_method,
                'message'=>$this->_message->getData(),
                'code'=>$this->_code,
                'url'=>$this->_getServiceUrl(),
            )
        );

        $this->addPaymentInfo('Payment ' . $this->_method, 'Started');
        $this->_send(
            $this->_getServiceUrl(),
            $this->_message->prepareMessage()
        );

        $this->_response->isValid();

        Mage::dispatchEvent(
            'realex_before_process_response',
            array(
                'method'=>$this->_method,
                'response'=>$this->_response->getData(),
                'code'=>$this->_code
            )
        );

        $this->addPaymentInfo(array(
            'Result' => $this->_response->getResult(),
            'Auth Code' => $this->_response->getAuthcode(),
            'Message' => $this->_response->getMessage(),
            'Transaction Reference' => $this->_response->getOrderid(),
            'CVN Result' => $this->_response->getCvnresult(),
            'AVS Address Result' => $this->_response->getAvsaddressresponse(),
            'AVS Postcode Result' => $this->_response->getAvspostcoderesponse(),
            'TSS Result' => $this->_response->getTssResult(),
        ));

        if($this->_method == 'authorize'){
            $this->unsetPaymentInfo(array('CVN Result','AVS Address Result','AVS Postcode Result'));
        }

        $this->_response->processResult();

    }

    /**
     * Start transaction with payment gateway
     *
     * @return $this|mixed
     * @throws Exception
     */
    protected function _pay(){

        $eci = null;
        $this->_setMethodRedirect(null);
        $this->getRealexSession()->setTokenSaved(false);
        $this->_token = $this->_hasToken();

        if($this->_token){
            $cardType = $this->_token->getCardType();
        }else{
            throw new Mage_Payment_Model_Info_Exception('Token Not Valid');
        }

        $transConfig = $this->_requireThreedSecure($cardType);

        if($transConfig->getRequire3DSecure()){

            $this->_method = 'threedSecure';
            $this->_action = 'threedSecureCapture';
            $this->_setMessage($this->_method);
            $this->_setResponse($this->_method);

            $this->_setMpiData('eci',
                $this->_response->getEciValue($cardType,false)
            );

            try{
                $this->addPaymentInfo('3DSecure Verify Cardholder Enrollment', 'Started');
                $this->_prepareThreedRegister();
                $this->_service->saveTransaction();
                $this->_send(
                    $this->_getServiceUrl(),
                    $this->_message->prepareMessage()
                );
                $this->_response->processResult();
                $this->_response->isValid();

                if($this->_response->getUrl() == ''){
                    $message = $this->_getHelper()->__('ThreedSecure-VerifyEnrolled Returned No Url');

                    throw new Exception($message);
                }
                $this->_service->getPayment()->setIsTransactionPending(true);
                $this->_prepareAclPost();
                $this->_setMethodRedirect($this->_getRedirectUrl());
                $this->addPaymentInfo('Customer redirected to 3DSecure ACS URL', 'Started');
                return;

            }catch(Yoma_Realex_Model_Exception_NoneParticipatingCard $e) {

                $this->_participatingCard = false;
                $this->_clearMpiData();
            }catch(Yoma_Realex_Model_Exception_NotEnrolled $e) {
                //nothing to do
            }
            if($this->_participatingCard) {

                try {
                    $eci = $this->_response->getEciFromThreedSecureSignature(
                        $this->_response->getResult(),
                        $this->_response->getEnrolled(),
                        $cardType,
                        $this->_getHelper()->getConfigData('realvault', 'require_liability_shift'),
                        $transConfig
                    );
                    $this->_setMpiData('eci', $eci);

                } catch (Yoma_Realex_Model_Exception_NoLiabilityShift $e) {
                    throw new Exception($e->getMessage());
                }

            }
        }

        $this->_capture();

        return $this;
    }

    /**
     * Capture payment on gateway
     *
     * @param string $method
     * @throws Exception
     */
    protected function _capture($method = 'capture'){

        $this->_method = $this->_captureType;
        $this->_action = $this->_captureType;
        $this->_setMessage($this->_method);
        $this->_setResponse($this->_method);

        $this->_prepareCapture();

        Mage::dispatchEvent(
            'realex_before_capture',
            array(
                'method'=>$this->_method,
                'message'=>$this->_message->getData(),
                'url'=>$this->_getServiceUrl()
            )
        );
        $this->addPaymentInfo('Payment ' . $this->_method, 'Started');
        $this->_send(
            $this->_getServiceUrl(),
            $this->_message->prepareMessage()
        );

        $this->_response->isValid();

        Mage::dispatchEvent(
            'realex_before_process_response',
            array('method'=>$this->_method,'response'=>$this->_response->getData())
        );

        $this->addPaymentInfo(array(
            'Result' => $this->_response->getResult(),
            'Auth Code' => $this->_response->getAuthcode(),
            'Message' => $this->_response->getMessage(),
            'Transaction Reference' => $this->_response->getOrderid(),
            'CVN Result' => $this->_response->getCvnresult(),
            'AVS Address Result' => $this->_response->getAvsaddressresponse(),
            'AVS Postcode Result' => $this->_response->getAvspostcoderesponse(),
            'TSS Result' => $this->_response->getTssResult(),
        ));

        if($this->_method == 'authorize'){
            $this->unsetPaymentInfo(array('CVN Result','AVS Address Result','AVS Postcode Result'));
        }

        $this->_response->processResult();

    }

}
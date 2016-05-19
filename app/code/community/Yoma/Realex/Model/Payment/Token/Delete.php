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
class Yoma_Realex_Model_Payment_Token_Delete extends Yoma_Realex_Model_Payment_Token{

    protected $_code = 'token';
    protected $_allowedMethods = array('delete');
    protected $_method = 'delete';
    protected $_action = 'delete';
    protected $_mpiData = array();


    /**
     * Start transaction with payment gateway
     *
     * @return $this|mixed
     * @throws Exception
     */
    protected function _pay(){

        $this->_method = $this->_method;
        $this->_action = $this->_action;
        $this->_setMessage($this->_method);
        $this->_setResponse($this->_method);

        $this->_prepareDelete();

        $this->_send(
            $this->_getServiceUrl(),
            $this->_message->prepareMessage()
        );

        $this->_response->isValid();
        $this->_response->processResult();

        $token = $this->_service->getToken();
        $token->delete();

        return $this;

    }

    /**
     * Prepare transaction request delete
     *
     * @return $this
     */
    protected function _prepareDelete() {

        $token = $this->_service->getToken();

        if(!$token->getId()){
            throw new Exception($this->__('Token not valid'));
        }

        $customer = mage::getModel('customer/customer')->load($token->getCustomerId());
        if(!$customer->getId()){
            throw new Exception($this->__('Customer not valid'));
        }

        $request = array(
            'attributes' => array(
                'timestamp' => $this->_getHelper()->getTimestamp(),
                'type'      => 'card-cancel-card'
            ),
            'merchantid' => array('value' => $this->_getHelper()->getConfigData('realex', 'vendor')),
        );

        $card = array(
            'ref'=>array('value' => $token->getToken()),
            'payerref' =>array('value' => $customer->getRealexPayerRef()),

        );

        $request['card'] = $card;

        $sha1hash = array(
            $request['attributes']['timestamp'] ,
            $request['merchantid']['value'],
            $request['card']['payerref']['value'],
            $request['card']['ref']['value'],
        );

        $request['sha1hash'] = array('value' => $this->_getHelper()->generateSha1Hash($this->_getHelper()->getConfigData('realex','secret'),$sha1hash));

        $request['comments'] = $this->_addComments();

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
            'value' => ($this->_getHelper()->updateAdminCard()?'Magento admin request':'Magento customer request')
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
}
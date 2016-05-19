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
class Yoma_Realex_Model_Payment_Redirect_Refund extends Yoma_Realex_Model_Payment_Direct_Refund{

    protected $_code = 'redirect';
    protected $_method = 'refund';
    protected $_action = 'refund';
    protected $_allowedMethods = array('refund');


    /**
     * Prepare transaction request refund
     *
     * @return $this
     */
    protected function _prepareRefund(){

        $payment = $this->_service->getPayment();
        $order = $this->_service->getOrder();
        $helper = $this->_getHelper();

        $transaction  = $payment->getTransaction($payment->getParentTransactionId());

        $request = array(
            'attributes' => array(
                'timestamp' => $helper->getTimestamp(),
                'type' => 'rebate'
            ),
            'merchantid' => array('value' => $helper->getConfigData('realex','vendor')),
            'orderid' => array('value' => $this->_getTransactionData($payment,'order_id')),
            'amount' => array(
                'value' => $helper->formatAmount($payment->getPaymentAmount(),$order->getBaseCurrencyCode()),
                'attributes' => array(
                    'currency' => $order->getBaseCurrencyCode(),
                ),
            ),
            'ccnumber' => array('value' => ''),
            'refundhash' => array('value' =>sha1($helper->getConfigData('realex','rebate_pass'))),
            'autosettle' => array(
                'attributes' =>
                    array(
                        'flag' => '1'
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
            ''
        );

        $request['sha1hash'] = array('value' => $helper->generateSha1Hash($helper->getConfigData('realex','secret'),$sha1hash));

        $request['comments'] = $this->_addComments();

        $this->_message->setData(array('request'=>$request));

        return $this;
    }

    /**
     * Get Gateway url
     *
     * @param string $serviceCode
     * @return string
     */
    protected function _getServiceUrl($serviceCode = null){

        return $this->_getHelper()->getConfigData('realexdirect','live_url');
    }

}
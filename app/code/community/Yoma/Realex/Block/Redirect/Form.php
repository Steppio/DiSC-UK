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
class Yoma_Realex_Block_Redirect_Form extends Mage_Core_Block_Template
{

    protected function _construct()
    {
        parent::_construct();

        $this->setTemplate('realex/payment/redirect/form.phtml');
    }

    /**
     * Get redirect url
     *
     * @return mixed
     */
    public function getRedirectUrl(){

        $mode = $this->_getHelper()->getConfigData('realexredirect','mode');
        if($mode == 'test'){
            $url = $this->_getHelper()->getConfigData('realexredirect','sandbox_url');
        }else{
            $url = $this->_getHelper()->getConfigData('realexredirect','live_url');
        }

        return $url;
    }

    /**
     * Return no direct error message
     *
     * @return string
     */
    public function getNoRedirectUrlMessage()
    {
        return 'Unable to redirect.';
    }

    /**
     * Return title text
     *
     * @return string
     */
    public function getTitle()
    {

        return 'Please wait while you are redirected...';
    }

    /**
     * Get transaction data
     *
     * @return mixed
     * @throws Exception
     */
    public function getMessageData(){

        $transaction = $this->_getTransaction();
        if (!$transaction) {
            throw new Exception($this->_getHelper()
                ->__("Unable to load transaction'"));
        }
        return $transaction;

    }

    protected function _toHtml()
    {
        return parent::_toHtml();

    }

    /**
     * Get transaction data from session
     *
     * @return mixed
     *
     */
    protected function _getTransaction(){
        return mage::getSingleton('realex/session')->getTransactionData();

    }

    protected function _getPayment($id){
        return Mage::getModel('sales/order_payment')->load($id);
    }

    protected function _getOrder($id){
        return Mage::getModel('sales/order')->load($id);
    }

    protected function _getHelper(){
        return mage::helper('realex/redirect');
    }
}

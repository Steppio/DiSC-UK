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
class Yoma_Realex_RedirectController extends Mage_Core_Controller_Front_Action {

    public function getServerModel() {

        return Mage :: getModel('realex/redirect');
    }

    /**
     * Call back capture
     */
    public function captureAction(){

        try {
            $this->_getService()->callBack();
            $url = mage::getUrl('checkout/onepage/success', array('token' => Mage::getSingleton('customer/session')->getTokenSaved()));
            $success = true;
            Mage::getSingleton('customer/session')->unsTokenSaved();
        }catch(Exception $e){
            Mage::logException($e);
			$url = mage::getUrl('checkout/onepage/failure');
            $success = false;
        }
        
        $this->getResponse()
            ->setBody($this->getLayout()
                ->createBlock('realex/redirect_result')
                ->setResult($success)
                ->setUrl($url)
                ->toHtml())
            ->sendResponse();
        exit;
    }

    /**
     * Call back authorize
     */
    public function authorizeAction(){

        try {
            $this->_getService()->callBack();
            $url = mage::getUrl('checkout/onepage/success', array('token' => Mage::getSingleton('customer/session')->getTokenSaved()));
            $success = true;
            Mage::getSingleton('customer/session')->unsTokenSaved();
        }catch(Exception $e){
            Mage::logException($e);
            $url = mage::getUrl('checkout/onepage/failure');
            $success = false;
        }

        $this->getResponse()
            ->setBody($this->getLayout()
                ->createBlock('realex/redirect_result')
                ->setResult($success)
                ->setUrl($url)
                ->toHtml())
            ->sendResponse();
        exit;
    }

    public function formAction(){

        $formPost = $this->getLayout()->createBlock('realex/redirect_form');

        $this->getResponse()
        	->clearHeaders()
			->setHeader('Content-Type', 'text/html')
			->setBody($formPost->toHtml());
    }

    public function iframeAction(){

        $this->loadLayout();
        $this->renderLayout();
    }

    public function getIframeContent(){

        $endpoint = 'https://hpp.sandbox.realexpayments.com/pay';
        $data = mage::getSingleton('realex/session')->getTransactionData();
        try {
            $client = new Zend_Http_Client($endpoint);
            $client->setMethod(Zend_Http_Client::POST);
            $client->setConfig(array('strictredirects' => true));
            $client->setParameterPost($data);
            $response = $client->request();
            return $response;
        } catch(Exception $e){
            throw $e;
        }
    }

    protected function _getHelper()
    {
        return Mage::helper('realex/redirect');
    }

    protected function _getService(){
        return mage::getModel('realex/service_redirect');
    }
    
        public function getOnepage()
    {
        return Mage::getSingleton('checkout/type_onepage');
    }
    
}

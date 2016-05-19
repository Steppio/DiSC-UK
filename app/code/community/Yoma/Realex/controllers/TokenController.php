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
class Yoma_Realex_TokenController extends Mage_Core_Controller_Front_Action {

    public function formAction(){

        $formPost = $this->getLayout()->createBlock('realex/direct_form');

        $this->getResponse()
            ->clearHeaders()
            ->setHeader('Content-Type', 'text/html')
            ->setBody($formPost->toHtml());
    }

    public function iframeAction(){

        $this->loadLayout();
        $this->renderLayout();
    }

    public function threedSecureCaptureAction(){

        try {
            $this->_getService()->callBack();
            $url = mage::getUrl('checkout/onepage/success');
            $success = true;
        }catch(Exception $e){
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

    protected function _getService(){
        return mage::getModel('realex/service_token');
    }

    public function onepageFailureOrderAction() {

        try{
            $this->_getService()->callDeny();
        }catch(Exception $e){

            Realex_Log::logException($e);
        }

        $url = mage::getUrl('checkout/onepage/failure');
        $this->getResponse()
            ->setBody($this->getLayout()
                ->createBlock('realex/redirect_result')
                ->setResult(false)
                ->setUrl($url)
                ->toHtml())
            ->sendResponse();
        exit;
    }
}
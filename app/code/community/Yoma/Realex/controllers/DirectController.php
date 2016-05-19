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
class Yoma_Realex_DirectController extends Mage_Core_Controller_Front_Action {

    /**
     * Form Action
     */
    public function formAction(){

        $formPost = $this->getLayout()->createBlock('realex/direct_form');

        $this->getResponse()
            ->clearHeaders()
            ->setHeader('Content-Type', 'text/html')
            ->setBody($formPost->toHtml());
    }

    /**
     * iFame Action
     */
    public function iframeAction(){

        $this->loadLayout();
        $this->renderLayout();
    }

    /**
     * 3d Secure callback
     */
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

    /*
     * get service
     */
    protected function _getService(){
        return mage::getModel('realex/service_direct');
    }

    /**
     * Order failure action
     */
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
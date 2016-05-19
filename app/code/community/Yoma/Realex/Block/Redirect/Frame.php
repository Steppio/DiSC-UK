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
class Yoma_Realex_Block_Redirect_Frame extends Mage_Core_Block_Template {

    protected function _construct()
    {
        parent::_construct();

        $this->setTemplate('realex/payment/redirect/frame.phtml');
    }

    protected function _toHtml()
    {
        return parent::_toHtml();

    }

    /**
     * Get redirect url
     *
     * @return string
     */
    public function getRedirectUrl(){

        return mage::getUrl('realex/redirect/form');
    }

    /**
     * Get fail url
     *
     * @return string
     */
    public function getFailUrl(){

        return mage::getUrl('checkout/onepage/failure');
    }

    /**
     * Get terminal url
     *
     * @return mixed
     */
    public function getTerminalUrl(){

        $mode = $this->_getHelper()->getConfigData('realexredirect','mode');
        if($mode == 1){
            $url = $this->_getHelper()->getConfigData('realexredirect','sandbox_url');
        }else{
            $url = $this->_getHelper()->getConfigData('realexredirect','live_url');
        }

        return $url;
    }

    protected function _getHelper(){
        return mage::helper('realex/redirect');
    }

    /**
     * Get iFrame size
     *
     * @return mixed
     */
    public function getIframeSize(){

        $size = $this->_getHelper()->getConfigData('realexredirect','iframe_size');

        return mage::getModel('realex/realex_source_iframeSize')->getDimensions($size);

    }

}
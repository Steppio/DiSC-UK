<?php
class Yoma_Realex_Block_Config extends Mage_Core_Block_Template
{
    protected function _construct()
    {
        parent::_construct();

        $this->setTemplate('realex/payment/config.phtml');
    }

    /**
     * Get config values
     *
     * @return array
     */
    public function getConfig(){

        $config = array();
        $config['realexdirect']['iframe'] = Mage::getStoreConfig('payment/realexdirect/iframe');
        $config['realexredirect']['iframe'] = Mage::getStoreConfig('payment/realexredirect/iframe');
        $config['realvault']['iframe'] = Mage::getStoreConfig('payment/realvault/iframe');
        $config['realexdirect']['display'] = Mage::getStoreConfig('payment/realexdirect/iframe_display');
        $config['realexredirect']['display'] = Mage::getStoreConfig('payment/realexredirect/iframe_display');
        $config['realexredirect']['inline'] = Mage::getStoreConfig('payment/realexredirect/iframe_inline');
        $config['realvault']['display'] = Mage::getStoreConfig('payment/realvault/iframe_display');
        $config['realexdirect']['secure'] = Mage::getStoreConfig('payment/realexdirect/use_threed_secure');
        $config['realexredirect']['secure'] = '1';
        $config['realvault']['secure'] = Mage::getStoreConfig('payment/realvault/use_threed_secure');
        $config['realexdirect']['deny'] = $this->_denyUrl('direct');
        $config['realexredirect']['deny'] = $this->_denyUrl('redirect');
        $config['realvault']['deny'] = $this->_denyUrl('token');
        $config['iframeSize'] = $this->_getIframeSize();
        $config['failUrl'] = mage::getUrl('checkout/onepage/failure');

        return $config;
    }

    /**
     * Get deny url
     *
     * @param string $code
     * @return string
     */
    protected function _denyUrl($code){
        return Mage::getUrl(
            'realex/' . $code . '/onepageFailureOrder',
            array(
                '_forced_secure' => true
            )
        );
    }

    protected function _toHtml()
    {
        return parent::_toHtml();

    }

    /**
     * Get iframe size
     *
     * @return mixed
     */
   protected function _getIframeSize(){

        $size = $this->_getHelper()->getConfigData('realexredirect','iframe_size');

        return mage::getModel('realex/realex_source_iframeSize')->getDimensions($size);

    }

    /**
     * @return Mage_Core_Helper_Abstract
     */
    protected function _getHelper(){
        return mage::helper('realex/redirect');
    }

}
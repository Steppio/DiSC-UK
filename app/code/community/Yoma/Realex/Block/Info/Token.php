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
class Yoma_Realex_Block_Info_Token extends Mage_Payment_Block_Info_Cc {

    /**
     * Retrieve token info
     *
     * @return mixed
     */
    protected function _getTokenInfo() {

        $data = mage::helper('realex')->getTokenAsArray($this->getInfo()->getRealexTokenCcId());
        $paymentMethod = mage::helper('realex')->getTokenPaymentCode($this->getInfo()->getRealexTokenCcId());

        if(isset($data['Credit Card Type'])  || isset($data['Card Type'])){
            if(isset($data['Credit Card Type'])) {
                $data['Credit Card Type'] = $this->getTokenCcTypeName($data['Credit Card Type'], $paymentMethod);
            }else{
                $data['Card Type'] = $this->getTokenCcTypeName($data['Card Type'], $paymentMethod);
            }
        }

        return $data;
    }

    /**
     * Prepare payment information
     *
     * @param Varien_Object $transport
     * @return Varien_Object
     */
    protected function _prepareSpecificInformation($transport = null)
    {
        if (null !== $this->_paymentSpecificInformation) {
            return $this->_paymentSpecificInformation;
        }
        $transport = parent::_prepareSpecificInformation($transport);

        return $transport->setData($this->_getTokenInfo());
    }

    /**
     * Get token name from cards
     *
     * @param string $ccType
     * @param bool $method
     * @return string
     */
    public function getTokenCcTypeName($ccType,$method = false)
    {
        $types = Mage::getSingleton('payment/config')->getCcTypes();
        if (isset($types[$ccType])) {
            if($method == 'redirect' && $ccType == 'MC'){
                return "MasterCard / Maestro";
            }
            return $types[$ccType];
        }
        return (empty($ccType)) ? Mage::helper('payment')->__('N/A') : $ccType;
    }
}
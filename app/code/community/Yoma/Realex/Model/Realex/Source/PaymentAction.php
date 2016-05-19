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
class Yoma_Realex_Model_Realex_Source_PaymentAction extends Mage_Payment_Model_Method_Abstract
{

    protected $_allowedActions = array(
        self::ACTION_AUTHORIZE,
        self::ACTION_AUTHORIZE_CAPTURE,
    );

    protected $_actions = array(
        self::ACTION_AUTHORIZE => 'Authorize Only',
        self::ACTION_AUTHORIZE_CAPTURE => 'Authorize and Capture',
    );

    /**
     * Return payment actions to option array
     *
     * @return array
     */
    public function toOptionArray()
    {
        $paymentActions = array();

        foreach ($this->_allowedActions as $_action) {
            if (!array_key_exists($_action, $this->_actions)) {
                continue;
            }

            $paymentActions[] = array(
                'value' => $_action,
                'label' => Mage::helper('realex')->__($this->_actions[$_action])
            );
        }

        return $paymentActions;
    }

    /**
     * Convert capture to authorize
     *
     * @param string $action
     * @return string
     */
    public function toAuthorize($action){

        if($action == self::ACTION_AUTHORIZE_CAPTURE){
            return self::ACTION_AUTHORIZE;
        }

        return $action;
    }

    /**
     * Return payment actions to array
     *
     * @return array
     */
    public function toArray(array $arrAttributes = Array())
    {
        return $this->_actions;
    }

    /**
     * Check if payment method available
     *
     * @return bool
     */
    public function isActionAllowed($action){
        if(in_array($action,$this->_allowedActions)){
            return true;
        }
        return false;
    }
}
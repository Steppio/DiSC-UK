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
class Yoma_Realex_Model_Response_Direct_Partial extends Yoma_Realex_Model_Response_Direct{

    /**
     * Process response
     *
     * @throws Exception
     * @throws Yoma_Realex_Model_Exception_DenyPayment
     */
    public function processResult(){
        switch ($this->getResult()) {
            case self::AUTH_RESULT_AUTHENTICATED:
                break;

            case self::AUTH_RESULT_DECLINED:
                throw new Yoma_Realex_Model_Exception_DenyPayment(
                    $this->_getHelper()->__('The transaction was declined.')
                );
                break;

            default:
                throw new Exception(
                    $this->_getHelper()->__('The payment was unsuccessful at this time. Please try again or contact us for more information.')
                );
                break;
        }
    }
} 
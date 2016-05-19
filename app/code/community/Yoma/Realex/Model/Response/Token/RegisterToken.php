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
class Yoma_Realex_Model_Response_Token_RegisterToken extends Yoma_Realex_Model_Response_Token{


    const REAL_VAULT_TOKEN_RESULT_STORED             = '00';

    public function processResult(){
        switch ($this->getResult()) {
            case self::REAL_VAULT_TOKEN_RESULT_STORED   :
                break;

            default:
                throw new Exception(
                    $this->_getHelper()->__('The Token was unsuccessful at this time. Please try again or contact us for more information.')
                );
                break;
        }
    }

    public function isValid(){

        $hash = $this->_getHelper()->generateSha1Hash(
            $this->_getHelper()->getConfigData('realex','secret'),
            array(
                $this->getTimestamp(),
                $this->getMerchantid(),
                $this->getOrderid(),
                $this->getResult(),
                $this->getMessage(),
                $this->getPasref(),
                $this->getAuthcode()
            )

        );

        if ($hash != $this->getSha1hash()) {
            throw new Yoma_Realex_Model_Exception_NotEnrolled(
                $this->_getHelper()->__('Payment Gateway Response Can Not be Validated.')
            );
        }

        return $this;
    }

}



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
class Yoma_Realex_Model_Response_Direct_ThreedSecure extends Yoma_Realex_Model_Response_Direct{

    /**
     * Process response
     *
     * @param mixed $threeDSecureProfile
     * @return bool
     * @throws Yoma_Realex_Model_Exception_NoneParticipatingCard
     * @throws Yoma_Realex_Model_Exception_NotEnrolled
     */
    public function processResult($threeDSecureProfile = null){

        if($this->getResult() == self::THREED_SECURE_VERIFY_ENROLLED_RESULT_ENROLLED
            && $this->getEnrolled() == self::THREED_SECURE_VERIFY_ENROLLED_TAG_ENROLLED){
            return true;
        }else{
            if($this->getResult() == self::THREED_SECURE_VERIFY_ENROLLED_RESULT_NON_PARTICIPATING){
                throw new Yoma_Realex_Model_Exception_NoneParticipatingCard (
                    $this->_getHelper()->__($this->getMessage())
                );
            }
            throw new Yoma_Realex_Model_Exception_NotEnrolled (
                $this->_getHelper()->__($this->getMessage())
            );
        }

        return true;
    }

    /**
     * Check if valid message
     *
     * @return $this
     * @throws Yoma_Realex_Model_Exception_NotEnrolled
     */
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



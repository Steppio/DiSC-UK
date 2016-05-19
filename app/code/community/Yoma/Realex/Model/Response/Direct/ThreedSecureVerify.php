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
class Yoma_Realex_Model_Response_Direct_ThreedSecureVerify extends Yoma_Realex_Model_Response_Direct{

    /**
     * Process response
     *
     * @throws Exception
     */
    public function processResult(){

        switch ($this->getResult()) {
            case self::AUTH_RESULT_AUTHENTICATED:
                break;
            default:
                throw new Exception(
                    $this->_getHelper()->__($this->getMessages())
                );
                break;
        }
    }

    /**
     * Retrieve eci from 3d secure signature
     *
     * @param string $result
     * @param string $status
     * @param string $cardType
     * @param array $enrolledCards
     * @param bool $requireLiabilityShift
     * @param mixed $profile
     * @return bool|string
     * @throws Yoma_Realex_Model_Exception_NoLiabilityShift
     */
    public function getEciFromThreedSecureVerifySignature($result, $status, $cardType, $enrolledCards,
                                                          $requireLiabilityShift = true, $profile = null)
    {

        if(!isset($profile)){
            $profile = new Varien_Object();
        }

        $profile->setRequireLiabilityShift($requireLiabilityShift);
        $profile->setResult($result);
        $profile->setStatus($status);

        // if the card type is not enrolled in 3D Secure, return false
        if (!is_null($cardType) && !in_array($cardType, $enrolledCards)) {
            return false;
        }

        // default liability shift to false, to be proven otherwise
        $profile->setLiabilityShift(false);

        // default 3D Secure authentication result to false, to be proven otherwise

        $profile->setThreedSecureAuthentication(false);

        // all results starting with 5 should be handled the same way
        if (substr($result, 0, 1) == '5') {
            $result = '5xx';
        }

        // determine whether this transaction would cause a liability shift
        switch ($result) {
            case self::THREED_SECURE_VERIFY_SIGNATURE_RESULT_VALIDATED:
                switch ($status) {
                    case self::THREED_SECURE_VERIFY_SIGNATURE_STATUS_AUTHENTICATED:
                        $profile->setLiabilityShift(true);
                        $profile->setThreedSecureAuthentication(true);
                        break;

                    case self::THREED_SECURE_VERIFY_SIGNATURE_STATUS_ACKNOWLEDGED:
                        $profile->setLiabilityShift(true);
                        $profile->setThreedSecureAuthentication(false);
                        break;

                    case self::THREED_SECURE_VERIFY_SIGNATURE_STATUS_NOT_AUTHENTICATED:
                        $profile->setLiabilityShift(false);
                        $profile->setThreedSecureAuthentication(false);
                        break;

                    default:
                    case self::THREED_SECURE_VERIFY_SIGNATURE_STATUS_UNAVAILABLE:
                        $profile->setLiabilityShift(false);
                        $profile->setThreedSecureAuthentication(false);
                        break;
                }
                break;

            default:
            case self::THREED_SECURE_VERIFY_SIGNATURE_RESULT_ENROLLED_INVALID_ACS_RESPONSE:
                throw new Yoma_Realex_Model_Exception_NoLiabilityShift($this->_getHelper()
                        ->__('The payment was unsuccessful at this time. Please try again or contact us for more information.')
                );
                break;
            case self::THREED_SECURE_VERIFY_SIGNATURE_RESULT_INVALID_ACS_RESPONSE:
                $profile->setLiabilityShift(false);
                $profile->setThreedSecureAuthentication(false);
                break;
        }

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
            $profile->setLiabilityShift(false);
            $profile->setThreedSecureAuthentication(false);
        }


        Mage::dispatchEvent('realex_process_threedsecure_verify_after', array('transport'=>$profile));

        // if there is no liability shift, and it is required by the client, throw exception
        if (!$profile->getLiabilityShift() && $profile->getRequireLiabilityShift()) {
            throw new Yoma_Realex_Model_Exception_NoLiabilityShift($this->_getHelper()
                    ->__('The payment was unsuccessful at this time. Please try again or contact us for more information.')
            );
        }

        // determine the eci value to use if the card is not enrolled in the 3D Secure scheme
        return $this->getEciValue($cardType, $profile->getLiabilityShift(), $profile->getThreedSecureAuthentication());
    }

}
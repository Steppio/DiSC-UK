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
class Yoma_Realex_Model_Response_Direct extends Yoma_Realex_Model_Response_Abstract{

    /**
     * Response results from 3D Secure Verify Enrolled
     */
    const THREED_SECURE_VERIFY_ENROLLED_RESULT_ENROLLED             = '00';
    const THREED_SECURE_VERIFY_ENROLLED_RESULT_NOT_ENROLLED         = '110';
    const THREED_SECURE_VERIFY_ENROLLED_RESULT_INVALID_RESPONSE     = '5xx';
    const THREED_SECURE_VERIFY_ENROLLED_RESULT_FATAL_ERROR          = '220';
    const THREED_SECURE_VERIFY_ENROLLED_RESULT_NON_PARTICIPATING     = '503';

    /**
     * Response tags from 3D Secure Verify Enrolled
     */
    const THREED_SECURE_VERIFY_ENROLLED_TAG_ENROLLED            = 'Y';
    const THREED_SECURE_VERIFY_ENROLLED_TAG_UNABLE_TO_VERIFY    = 'U';
    const THREED_SECURE_VERIFY_ENROLLED_TAG_NOT_ENROLLED        = 'N';

    /**
     * Response results from 3D Secure Verify Signature
     */
    const THREED_SECURE_VERIFY_SIGNATURE_RESULT_VALIDATED                       = '00';
    const THREED_SECURE_VERIFY_SIGNATURE_RESULT_ENROLLED_INVALID_ACS_RESPONSE   = '110';
    const THREED_SECURE_VERIFY_SIGNATURE_RESULT_INVALID_ACS_RESPONSE            = '5xx';

    /**
     * Response statuses from 3D Secure Verify Signature
     */
    const THREED_SECURE_VERIFY_SIGNATURE_STATUS_AUTHENTICATED       = 'Y';
    const THREED_SECURE_VERIFY_SIGNATURE_STATUS_NOT_AUTHENTICATED   = 'N';
    const THREED_SECURE_VERIFY_SIGNATURE_STATUS_ACKNOWLEDGED        = 'A';
    const THREED_SECURE_VERIFY_SIGNATURE_STATUS_UNAVAILABLE         = 'U';

    /**
     * ECI values to send to Realex
     */
    const THREED_SECURE_ECI_VISA_AUTHENTICATED                  = '5';
    const THREED_SECURE_ECI_VISA_WITH_LIABILITY_SHIFT           = '6';
    const THREED_SECURE_ECI_VISA_WITHOUT_LIABILITY_SHIFT        = '7';
    const THREED_SECURE_ECI_MASTERCARD_AUTHENTICATED            = '2';
    const THREED_SECURE_ECI_MASTERCARD_WITH_LIABILITY_SHIFT     = '1';
    const THREED_SECURE_ECI_MASTERCARD_WITHOUT_LIABILITY_SHIFT  = '0';


    /**
     * Check if valid message
     *
     * @return $this
     * @throws Exception
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
            throw new Exception(
                $this->_getHelper()->__('Payment Gateway Response Can Not be Validated.')
            );
        }

        return $this;
    }

    /**
     * @return Mage_Core_Helper_Abstract
     */
    protected function _getHelper()
    {
        return Mage::helper('realex/direct');
    }

    /**
     * Retrieve eci value
     *
     * @param string $cardType
     * @param boll $liabilityShift
     * @param bool $threedSecureAuthentication
     * @return bool|string
     */
    public function getEciValue($cardType, $liabilityShift, $threedSecureAuthentication = null)
    {
        $eci = false;

        switch ($cardType) {
            case 'VISA':
            case 'AMEX':
                if ($threedSecureAuthentication === true) {
                    $eci = self::THREED_SECURE_ECI_VISA_AUTHENTICATED;
                } else {
                    if ($liabilityShift === true) {
                        $eci = self::THREED_SECURE_ECI_VISA_WITH_LIABILITY_SHIFT;
                    } else {
                        $eci = self::THREED_SECURE_ECI_VISA_WITHOUT_LIABILITY_SHIFT;
                    }
                }
                break;

            case 'MC':
            case 'YOMA_MAESTRO':
            case 'SWITCH':
                if ($threedSecureAuthentication === true) {
                    $eci = self::THREED_SECURE_ECI_MASTERCARD_AUTHENTICATED;
                } else {
                    if ($liabilityShift === true) {
                        $eci = self::THREED_SECURE_ECI_MASTERCARD_WITH_LIABILITY_SHIFT;
                    } else {
                        $eci = self::THREED_SECURE_ECI_MASTERCARD_WITHOUT_LIABILITY_SHIFT;
                    }
                }
                break;

            default:
                $eci = false;
                break;
        }

        return $eci;
    }

    /**
     * Retrieve eci signature
     *
     * @param string $result
     * @param bool $enrolled
     * @param string $cardType
     * @param bool $requireLiabilityShift
     * @param null $profile
     * @return bool|string
     * @throws Yoma_Realex_Model_Exception_NoLiabilityShift
     */
    public function getEciFromThreedSecureSignature($result, $enrolled, $cardType, $requireLiabilityShift = true, $profile = null)
    {

        if(!isset($profile)){
            $profile = new Varien_Object();
        }

        $profile->setRequireLiabilityShift($requireLiabilityShift);
        $profile->setResult($result);
        $profile->setEnrolled($enrolled);

        if($result == self::THREED_SECURE_VERIFY_ENROLLED_RESULT_NOT_ENROLLED && $enrolled == self::THREED_SECURE_VERIFY_ENROLLED_TAG_NOT_ENROLLED){

            $profile->setLiabilityShift(true);
            $profile->setThreedSecureAuthentication(false);
        }else{

            $profile->setLiabilityShift(false);
            $profile->setThreedSecureAuthentication(false);
        }


        Mage::dispatchEvent('realex_process_threedsecure_eci_after', array('transport'=>$profile));

        // if there is no liability shift, and it is required by the client, throw exception
        if (!$profile->getLiabilityShift() && $profile->getRequireLiabilityShift()) {
            throw new Yoma_Realex_Model_Exception_NoLiabilityShift($this->_getHelper()
                    ->__('The payment was unsuccessful at this time. Please try again or contact us for more information.')
            );
        }

        return $this->getEciValue($cardType, $profile->getLiabilityShift(), $profile->getThreedSecureAuthentication());
    }
}
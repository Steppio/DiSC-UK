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
class Yoma_Realex_Model_Realex_Source_Cards extends Mage_Payment_Model_Source_Cctype
{

    protected $_supportedCcTypes = array(
        'AE' => 'AMEX',
        'VI' => 'VISA',
        'MC' => 'MC',
        //'SM' => 'SWITCH',
        'YOMA_DINERS_CLUB' => 'DINERS',
        'YOMA_MAESTRO' => 'MC'
    );

    protected $_legacyCcTypes = array(
        'SWITCH' => 'YOMA_MAESTRO'
    );

    /**
     * Get supported card types to option array
     *
     * @return array
     */
    public function toOptionArray()
    {
        $this->setAllowedTypes(array_keys($this->getSupportedCardTypes()));

        return parent::toOptionArray();
    }

    /**
     * Get supported card types
     *
     * @return array
     */
    public function getSupportedCardTypes()
    {
        return $this->_supportedCcTypes;
    }

    /**
     * Get redundant card types
     *
     * @return array
     */
    public function getLegacyCardTypes()
    {
        return $this->_legacyCcTypes;
    }

    /**
     * Convert magento card type to realex type
     *
     * @param  string $type
     * @param bool $error
     * @return mixed
     * @throws Exception
     */
    public function getGatewayCardType($type,$error = true)
    {
        $supportedCardTypes = $this->getSupportedCardTypes();

        if (!array_key_exists($type, $supportedCardTypes)) {
            // if true throw exception else return type
            if(!$error){
                return $type;
            }else {
                throw new Exception(
                    mage::helper('realex')->__("Gateway does not support card type '{$type}'.")
                );
            }
        }

        return $supportedCardTypes[$type];
    }

    /**
     * Retrieve magento card types
     *
     * @param string $type
     * @return mixed
     */
    public function getMagentoCardType($type)
    {
        $cardTypes = $this->getSupportedCardTypes();

        $legacyCardTypes = $this->getLegacyCardTypes();

        if (array_key_exists($type, $legacyCardTypes)) {

            return $legacyCardTypes[$type];
        }

        $result =  $type;

        while ($cardname = current($cardTypes)) {
            if ($cardname == $type) {
                $result =  key($cardTypes);
                break;
            }
            next($cardTypes);
        }

        return $result;

    }

    /**
     * Convert legacy card to realex card
     *
     * @param string $type
     * @return mixed
     * @throws Exception
     */
    public function convertLegacyCardType($type){

        $legacyCardTypes = $this->getLegacyCardTypes();

        if (array_key_exists($type, $legacyCardTypes)) {

            return $this->getGatewayCardType($legacyCardTypes[$type],false);
        }

        return $type;

    }



}
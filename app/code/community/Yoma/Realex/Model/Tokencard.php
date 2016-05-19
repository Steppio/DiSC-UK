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
class Yoma_Realex_Model_Tokencard extends Mage_Core_Model_Abstract {

	protected function _construct() {

        $this->_init('realex/tokencard');
    }


    /**
     * Set default token
     *
     * @return Mage_Core_Model_Abstract
     */
    protected function _beforeSave() {
        $card = $this->getCollection()
            ->addCustomerFilter(Mage::helper('realex')->getCustomerQuoteId())
            ->addFieldToFilter('is_default', (int) 1)
            ->load()->getFirstItem();

        if (!$card->getId()) {
            $this->setIsDefault(1);
        }

        return parent::_beforeSave();
    }

    /**
     * Get token by id
     *
     * @param null $card_id
     * @return Mage_Core_Model_Abstract
     */
    public function getCardById($card_id = null) {
        if((int) $card_id) {
            $card = Mage::getModel('realex/tokencard')->load($card_id);
            if($card->getCustomerId() == Mage::helper('realex')->getCustomerQuoteId()) {
                return $card;
            }
        }
        return;
    }

    /**
     * Get default card
     *
     * @return Varien_Object
     */
    public function getDefaultCard() {
        $card = $this->getCollection()
            ->addCustomerFilter(Mage::helper('realex')->getCustomerQuoteId())
            ->addFieldToFilter('is_default', (int) 1)
            ->load()->getFirstItem();

        if ($card->getId()) {
            return $card;
        }
        return new Varien_Object;
    }

    /**
     * Reset default card
     */
    public function resetCustomerDefault() {
        $card = $this->getCollection()
            ->addCustomerFilter(Mage::helper('realex')->getCustomerQuoteId())
            ->addFieldToFilter('is_default', (int) 1)
            ->load()->getFirstItem();

        if ($card->getId()) {
            $card->setIsDefault(0)
                ->save();
        }
    }

    /**
     * Set default token
     *
     * @param $value
     * @return $this
     */
    public function setIsDefault($value) {
        if ((int) $value == 1) {
            # Reset current default card
            Mage::getModel('realex/tokencard')->resetCustomerDefault();
        }

        $this->setData('is_default', $value);
        return $this;
    }

    public function getLabel($withImage = true) {
        //return Mage::helper('realex')->getCardLabel($this->getCardType(), $withImage);
        return $this->getCardType();
    }

    public function getCcNumber() {
        return '***********' . $this->getLastFour();
    }

    public function getExpireDate() {
        return Mage::helper('realex')->getCardNiceDate($this->getExpiryDate());
    }

    public function loadByToken($token) {
        $this->load($token, 'token');
        return $this;
    }

    public function checkCardDefault() {
        return $this->getIsDefault() ? true : false;
    }

    /**
     * return count of cards nearing expiry date (1 month)
     * @return int 
     */
    public function getCardsExpiring() {
        return $this->getCollection()
        ->addFieldToFilter('status', (int) 1)
        ->addFieldToFilter(
            new Zend_Db_Expr("str_to_date(expiry_date, '%m%y')"), 
            array('
                from' => date("Y-m-d H:i:s"),
                'to' => date("Y-m-d H:i:s", strtotime("+1 month"))
            )
        )->getSize();
    }

} 
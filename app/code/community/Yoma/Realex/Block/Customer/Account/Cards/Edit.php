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
class Yoma_Realex_Block_Customer_Account_Cards_Edit extends Mage_Core_Block_Template {

	protected $card;

    /*
     * Get customer card
     */
	public function getCustomerCard() {
		if($card_id = (int) $this->getRequest()->getParam('card')) {
            if($this->card = Mage::getModel("realex/tokencard")->getCardById($card_id)) {
            	return $this->card;
            }
        }
	}

    /**
     * Get month options
     *
     * @return string
     */
	public function getMonthOptions() {
		$current_month = substr($this->card->getExpiryDate(), 0, 2);
		$html = '';
		for ($i=1; $i <= 12; $i++) { 
			$month = $this->_formatMonth($i, 2);
			$html.= '<option value="'.$month.'" '.($month == $current_month ? 'selected="selected"' : '').'>'.$month.'</option>';
		}
		return $html;
	}

    /**
     * Get year options
     *
     * @return string
     */
	public function getYearOptions() {
		$present_year = date('Y')-1;
		$current_year = substr($this->card->getExpiryDate(), -2);
		$html = '';
		for ($i=0; $i <= 15; $i++) {
			$present_year += 1;
			$short_year = substr($present_year, -2);
			$html .= '<option value="'.$short_year.'" '.($current_year == $short_year ? 'selected="selected"' : '').'>'.$present_year.'</option>';
		}
		return $html;
	}

	public function _formatMonth($num,$numDigits) {
	   return sprintf("%0".$numDigits."d",$num);
	}

}
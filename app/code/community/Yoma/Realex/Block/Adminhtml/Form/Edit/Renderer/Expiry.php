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
class Yoma_Realex_Block_Adminhtml_Form_Edit_Renderer_Expiry extends Varien_Data_Form_Element_Abstract {
 
	/**
	* Retrieve Element HTML fragment
	*
	* @return string
	*/
	public function getElementHtml() {
		$html = '';
		if($this->getValue()) {
			$html .= '<select onchange="updateExpire(this)" name="expiry_month" id="expiry_month" style="width:138px;margin-right:2px;">';
				$html .= $this->_getMonthOptions();
			$html .= '</select>';
			$html .= '<select onchange="updateExpire(this)" name="expiry_year" id="expiry_year" style="width:138px;margin-left:2px;">';
				$html .= $this->_getYearOptions();
			$html .= '</select>';

			$html .= '<input type="hidden" name="expiry_date" id="expiry_date" value="'.$this->getValue().'"/>';
			$html .= $this->_scriptBlock();
		}
		return $html;
	}

	private function _getMonthOptions() {
		$current_month = substr($this->getValue(), 0, 2);
		$html = '';
		for ($i=1; $i <= 12; $i++) { 
			$month = $this->_formatMonth($i, 2);
			$html.= '<option value="'.$month.'" '.($month == $current_month ? 'selected="selected"' : '').'>'.date('M', mktime(0,0,0,$i,10)).'</option>';
		}
		return $html;
	}

	private function _getYearOptions() {
		$present_year = date('Y');
		$current_year = substr($this->getValue(), -2);
		$html = '';
		for ($i=0; $i <= 15; $i++) {
			$present_year += 1;
			$short_year = substr($present_year, -2);
			$html .= '<option value="'.$short_year.'" '.($current_year == $short_year ? 'selected="selected"' : '').'>'.$present_year.'</option>';
		}
		return $html;
	}

	private function _formatMonth($num,$numDigits) {
	   return sprintf("%0".$numDigits."d",$num);
	}

	private function _scriptBlock() {
		return '
		<script type="text/javascript">
		updateExpire = function (dropdown) {
			var month = $("expiry_month").getValue();
			var year = $("expiry_year").getValue();
			var date = month+year;
			$("expiry_date").value = date;
		}
		</script>';
	}
 
}
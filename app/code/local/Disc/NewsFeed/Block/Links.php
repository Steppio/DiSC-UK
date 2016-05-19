<?php
class Disc_NewsFeed_Block_Links extends Mage_Core_Block_Abstract implements Mage_Widget_Block_Interface {

	/**
	 * Produce links list rendered as html
	 *
	 * @return string
	 */

	protected function _toHtml() {
		$html = '';
		$link_options = self::getData('link_options');

		if(empty($link_options)) {
			return $html;
		}

		$arr_options = explode(',', $link_options);

		if(is_array($arr_options) && count($arr_options)) {
			foreach($arr_options as $option) {
				Switch ($option) {
					case 'print':
						$html .= '<div><a href="javascript: window.print();">Print</a></div>';;
					break;
					case 'email':
						$html .= '<div><a href="mailto:yourcompanyemail@domain.com&subject=Inquiry">Contact Us</a></div>';
					break;
				}
			}
		}

		return $html;
	}

}
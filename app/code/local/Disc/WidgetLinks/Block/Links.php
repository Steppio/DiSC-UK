<?php
class Disc_WidgetLinks_Block_Links extends Mage_Core_Block_Abstract implements Mage_Widget_Block_Interface {
/**
  * Produce links list rendered as html
  *
  * @return string
  */
  protected function _toHtml() {
    $html = '';
    $link_options = self::getData('link_options');

    if (empty($link_options)) {
      return $html;
    }
      
    // $arr_options = explode(',', $link_options);
      
    $html .= '<ul style="list-style: none;" class="date_ranges"><li><button href=".custom-contact-form" class="cta-inside-contact" id="' . $link_options . '">' . $link_options . '</button></li></ul>';

    // if (is_array($arr_options) && count($arr_options)) {
    //   foreach ($arr_options as $option) {
    //     Switch ($option) {
    //       case 'date':
    //         $html .= '<div><a href="javascript: window.print();">Print</a></div>';
    //       break;
    //     }
    //   }
    // }
     
    return $html;
  }
}
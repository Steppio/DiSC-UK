<?php
class Disc_WidgetLinks_Model_Options {
/**
  * Provide available options as a value/label array
  *
  * @return array
  */
  public function toOptionArray() {
    return array(
      array('value' => 'print', 'label' => 'Print Button')
    );
  }
}
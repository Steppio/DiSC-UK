<?php
/**
 * Ajzele
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 *
 * @category   Ajzele
 * @package    Ajzele_Photic
 * @copyright  Copyright (c) Branko Ajzele (http://ajzele.net)
 * @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */
class Ajzele_Photic_Model_Photic extends Mage_Core_Model_Abstract 
{
    protected function _construct()
    {
		$this->_init('photic/photic');
    }
	
	public function hello()
	{
		return 'Hello developer...';
	}
	
	public function getThumbRelPathByValueId($optionValueId = 0) {
		if($optionValueId > 0) {
			return 'Ollll '.$optionValueId;	
		}
	}
}
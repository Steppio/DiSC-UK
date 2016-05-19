<?php
/**
 * Plumrocket Inc.
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the End-user License Agreement
 * that is available through the world-wide-web at this URL:
 * http://wiki.plumrocket.net/wiki/EULA
 * If you are unable to obtain it through the world-wide-web, please 
 * send an email to support@plumrocket.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file
 *
 * @package     Plumrocket_Auto_Invoice
 * @copyright   Copyright (c) 2013 Plumrocket Inc. (http://www.plumrocket.com)
 * @license     http://wiki.plumrocket.net/wiki/EULA  End-user License Agreement
 */
?>
<?php

class Plumrocket_Autoinvoice_Block_System_Config_Version extends Mage_Adminhtml_Block_System_Config_Form_Field
{
	
	public function render(Varien_Data_Form_Element_Abstract $element)
    {
    	$version = Mage::getConfig()->getNode('modules/Plumrocket_AutoInvoice')->version;
		$wiki_url = Mage::getConfig()->getNode('modules/Plumrocket_AutoInvoice')->wiki;
		
        return $this->includeJs() . '<div style="padding:10px;background-color:#fff;border:1px solid #ddd;margin-bottom:7px;">
			Plumrocket Auto Invoice v' . $version . ' was developed by <a href="http://www.plumrocket.com" target="_blank">Plumrocket Inc</a>. 
			For manual & video tutorials please refer to <a href="' . $wiki_url . '" target="_blank">our online documentation<a/>.
		</div>';
    }
	
	private function includeJs()
	{
		$baseJsUrl = Mage::getBaseUrl(Mage_Core_Model_Store::URL_TYPE_JS);
		
		return '<script src="' . $baseJsUrl . 'tiny_mce/tiny_mce.js" type="text/javascript"></script>
		<script src="' . $baseJsUrl . 'mage/adminhtml/wysiwyg/tiny_mce/setup.js" type="text/javascript"></script>
		<script src="' . $baseJsUrl . 'mage/adminhtml/variables.js" type="text/javascript"></script>
		<script src="' . $baseJsUrl . 'mage/adminhtml/wysiwyg/widget.js" type="text/javascript"></script>
		<script type="text/javascript">
		var basePopupPath = "' . Mage::getBaseUrl(Mage_Core_Model_Store::URL_TYPE_WEB) . '";
		var basePopupSkinPath = "' . Mage::getBaseUrl(Mage_Core_Model_Store::URL_TYPE_SKIN) . '";
		</script>
		
		<link href="' . $baseJsUrl . 'prototype/windows/themes/default.css" type="text/css" rel="stylesheet" />
		<link href="' . $baseJsUrl . 'prototype/windows/themes/magento.css" type="text/css" rel="stylesheet" />';
	}		            
}

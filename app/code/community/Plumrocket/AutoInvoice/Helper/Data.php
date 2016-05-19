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

class Plumrocket_AutoInvoice_Helper_Data extends Mage_Core_Helper_Abstract
{
	private $_configPrefix = 'autoinvoice/';
	
	public function moduleEnabled(){
		return Mage::getStoreConfig($this->_configPrefix.'general/enabled');
	}
}
	 

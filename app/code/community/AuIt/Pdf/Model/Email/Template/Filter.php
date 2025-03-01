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
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magentocommerce.com for more information.
 *
 * @category    Mage
 * @package     Mage_Core
 * @copyright   Copyright (c) 2010 Magento Inc. (http://www.magentocommerce.com)
 * @license     http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */


/**
 * Core Email Template Filter Model
 *
 * @category   Mage
 * @package    Mage_Core
 * @author     Magento Core Team <core@magentocommerce.com>
 */
class AuIt_Pdf_Model_Email_Template_Filter extends Mage_Core_Model_Email_Template_Filter
{
	protected $_auitvariableline='';
	public function getAuitVariableLine()
	{
		return $this->_auitvariableline;
	}
	
	public function auitVariable($name,$default='')
	{
		return $this->_getVariable($name, $default);
	}
	public function getVariables()
	{
		return $this->_templateVars;
	}
	protected function _getVariable($value, $default='{no_value_defined}')
	{
		if ( strpos($value,'helper.')!==false )
			$this->_auitvariableline=$value;
		return parent::_getVariable($value, $default);
	}
}

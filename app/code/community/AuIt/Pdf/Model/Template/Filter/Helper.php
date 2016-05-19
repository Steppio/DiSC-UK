<?php
/**
 * AuIt
 *
 * @category   AuIt
 * @author     M Augsten
 * @copyright  Copyright (c) 2010 Ingenieurbüro (IT) Dipl.-Ing. Augsten (http://www.au-it.de)
 */
function AuIt_ErrorHandler($errno, $errstr, $errfile, $errline){
	return true;
}
class AuIt_Pdf_Model_Template_Filter_Helper  extends Varien_Object
{
	protected $_allowedFormats = array(
			Mage_Core_Model_Locale::FORMAT_TYPE_FULL,
			Mage_Core_Model_Locale::FORMAT_TYPE_LONG,
			Mage_Core_Model_Locale::FORMAT_TYPE_MEDIUM,
			Mage_Core_Model_Locale::FORMAT_TYPE_SHORT
	);
	const DATETIME_INTERNAL_FORMAT = 'yyyy-MM-dd HH:mm:ss';
	protected function _isConst($a)
	{
		if ( !$a )
			return true;
		$cl = $this->getProcessor()->getAuitVariableLine();
		if ( strpos($cl,"'".$a."'") !== false )
			return true;
		if ( strpos($cl,'"'.$a.'"') !== false )
			return true;
		return false;
	}
	function getValue($a,$noObject=true)
	{
		if ( !$this->getProcessor() )
			return $a;
		$cl = $this->getProcessor()->getAuitVariableLine();
		if ( !$noObject && $this->_isConst($a) )
		{
			// Konstante
			return $a;
		}
		if ( !is_null($a) )
		{
			$r = null;
			try{
				set_error_handler('AuIt_ErrorHandler');
				$r = $this->getProcessor()->filter('{{var '.$a.'}}');
				if ( $r === 'Object' )
				{
					$vars = $this->getProcessor()->getVariables();
					if ( isset($vars[$a]) ) {
						$r=$vars[$a];
					}
				}
				if ( is_object($r) || $r == '')
				{
					if ( $r instanceof Varien_Object )
					{
						if ( !$noObject )
							$r=null;
						else
							$r = implode(',', $r->debug());
					}
				}
				
			}catch ( Exception $e)
			{
				$r = null;
			}
			set_error_handler(Mage_Core_Model_App::DEFAULT_ERROR_HANDLER);
			
			if ( is_null($r)  ) // 03.03.15 Empty Value nicht zurück setzen
			{
				$r=$a;
			}
			//if ( !$r ) $r=$a;
			return $r;
		}
		return $a;
	}
	function eq($a=null,$b=null)
	{
		$a = $this->getValue($a,false);
		$b = $this->getValue($b,false);
		return ( !is_null($a) && !is_null($b)) ? ($a == $b): false;
	}
	function neq($a=null,$b=null)
	{
		$a = $this->getValue($a,false);
		$b = $this->getValue($b,false);
		return ( !is_null($a) && !is_null($b)) ? ($a != $b): false;
	}
	function lt($a=null,$b=null)
	{
		$a = $this->getValue($a,false);
		$b = $this->getValue($b,false);
		return ( !is_null($a) && !is_null($b)) ? ($a < $b): false;
	}
	function lteq($a=null,$b=null)
	{
		$a = $this->getValue($a,false);
		$b = $this->getValue($b,false);
		return ( !is_null($a) && !is_null($b)) ? ($a <= $b): false;
	}
	function gt($a=null,$b=null)
	{
		$a = $this->getValue($a,false);
		$b = $this->getValue($b,false);
		return ( !is_null($a) && !is_null($b)) ? ($a > $b): false;
	}
	function gteq($a=null,$b=null)
	{
		$a = $this->getValue($a,false);
		$b = $this->getValue($b,false);
		return ( !is_null($a) && !is_null($b)) ? ($a >= $b): false;
	}
	function nl2br($a=null)
	{
		return nl2br(trim($this->getValue($a)));
	}
	function tolower($a=null)
	{
		$a = $this->getValue($a);
		return strtolower($a);
	}
	function toupper($a=null)
	{
		$a = $this->getValue($a);
		return strtoupper($a);
	}
	
	function country($a=null,$b=null)
	{
		$r='';
		$a = $this->getValue($a);
		if ( $a )
			$r = Mage::app()->getLocale()->getCountryTranslation($a);
		if ( $b == 1 )
			$r=strtoupper($r);
		if ( $b == 2 )
			$r=strtolower($r);
		return $r;
	}
	function date($a=null,$b=0,$c='medium',$showtime=0)
	{
		if ( !is_numeric($b)  )
		{
			$b = (int)$this->getProcessor()->auitVariable($b);
		}
		$invoice = $this->getProcessor()->auitVariable('invoice');
		if ( $a == 'null' || $a == 'now')
		{
			$a = Mage::app()->getLocale()->date(Mage::getSingleton('core/date')->gmtTimestamp(), null, null);
		}
		else {
			$a = $this->getProcessor()->auitVariable($a);
		}
		if (!($a instanceof Zend_Date)) {
			$a = new Zend_Date($a, self::DATETIME_INTERNAL_FORMAT, null);
		}else {
			$a->setTimezone('GMT');
		}
    	$result = 'not a date';
    	if ($a instanceof Zend_Date) {

    		if (in_array($c, $this->_allowedFormats, true)) {
    			$result = Mage::helper('core')->formatDate($a.(" $b days"), $c, $showtime?true:false);
    		}else {
	    		$format = trim($c);
	    		$date = $a;
	    		if (is_null($date)) {
	    			$date = Mage::app()->getLocale()->date(Mage::getSingleton('core/date')->gmtTimestamp(), null, null);
	    		} else if (!$date instanceof Zend_Date) {
	    			$date = Mage::app()->getLocale()->date(strtotime($date), null, null);
	    		}
	    		$result = $date->toString($format);
    		}
    	}
		return $result;
	}
	function hasGiftMessage()
	{
		$order = $this->getProcessor()->auitVariable('order');
		if ( $order && is_object($order) && $order->getGiftMessageId() )
			return true;
		return false;
	}
	function hasComments()
	{
		$entity = $this->getProcessor()->auitVariable('entity');
		$_collection = null;
		if ( $entity && $entity instanceof Mage_Sales_Model_Order )
			$_collection = $entity->getStatusHistoryCollection();
		else if ( $entity )
			$_collection = $entity->getCommentsCollection();
		if ( $_collection && count($_collection) )
			return true;
		return false;
	}
	function hasVisibleComments()
	{
		$entity = $this->getProcessor()->auitVariable('entity');
		$_collection = null;
		if ( $entity && $entity instanceof Mage_Sales_Model_Order )
			$_collection = $entity->getStatusHistoryCollection();
		else if ( $entity )
			$_collection = $entity->getCommentsCollection();
		if ( $_collection && count($_collection) )
		{
			foreach ($_collection as $_comment)
				if ( $_comment->getIsVisibleOnFront() )
					return true;
		}
		return false;
	}
	function isCountryInEU($countryCode,$isString=false)
	{
		if ( !$isString )
		{
			$countryCode = trim($this->getValue($countryCode));
		}
		if ( !$countryCode ) // AUIT 19.03.2013 empty codes
		{
			return false;
		}
		$helper = Mage::helper('core');
		if ( method_exists($helper,'isCountryInEU') )
		{
			$order = $this->getProcessor()->auitVariable('order');
			$storeId = null;
			if ( $order ) {
				$storeId = $order->getStore()->getId();
			}
			$ret = $helper->isCountryInEU($countryCode,$storeId);
			return $ret;
		}
		return false;
	}
	function isCountryNotInEU($countryCode)
	{
		return !$this->isCountryInEU($countryCode);
	}
	function getVatID($country_id=null,$vat_id=null,$country_id2=null,$vat_id2=null,$taxvat=null)
	{
		$cid=false;
		$vid=false;
		if ( !is_null($country_id) )
		{
			$countryCode = trim($this->getValue($country_id));
			if ( $country_id != $countryCode && strlen ($countryCode) == 2 )
			{
				$cid=$country_id;
				$vid = $vat_id;
			}
		}
		if ( !$cid && !is_null($country_id2) )
		{
			$countryCode = trim($this->getValue($country_id2));
			if ( $country_id2 != $countryCode && strlen ($countryCode) == 2 )
			{
				$cid=$country_id2;
				$vid = $vat_id2;
			}
		}
		if ( $cid && $vid)
		{
			$vidCode = trim($this->getValue($vid));
			if ( $vidCode != $vid && $vidCode) // Variable not set
			{
				$countryCode = trim($this->getValue($cid));
				return strtoupper(trim($countryCode.$vidCode));
			}
		}
		if ( !is_null($taxvat) )
		{
			$vidCode = trim($this->getValue($taxvat));
			if ( $vidCode != $taxvat && $vidCode) // Variable not set
				return strtoupper(trim($vidCode));
		}
		return '';
	}
	
	function isEUVATTaxFree($tax_amount=null,$country_id=null,$vat_id=null,$country_id2=null,$vat_id2=null,$taxvat=null)
	{
		if ( !is_null($tax_amount) )
		{
			$vidCode = $this->getVatID($country_id,$vat_id,$country_id2,$vat_id2,$taxvat);
			if ( strlen($vidCode) > 2 )
			{
				$cid = substr($vidCode,0,2);
				if ( $cid == 'EL' ) $cid = 'GR';
				$ta = floatval($this->getValue($tax_amount));
				if ( (''.$ta != $tax_amount && $ta == 0)  )
				{
					if ( $this->isCountryInEU($cid,true) )
					{
						return 1;
					}
				}
			}
		}
		return 0;
	}
	function isWorldTaxFree($tax_amount=null,$country_id=null,$country_id2=null)
	{
		if ( is_null($tax_amount) )
			return 0;
		$tax_amount = floatval($this->getValue($tax_amount));
		if ( !$tax_amount )
		{
			$cid=false;
			// Check for emtpy conutryid 19.03.2013
			if ( !is_null($country_id) )
			{
				$countryCode = trim($this->getValue($country_id));
				if ( $country_id != $countryCode && strlen ($countryCode) == 2 )
					$cid=$country_id;
			}
			if ( !$cid && !is_null($country_id2) )
			{
				$countryCode = trim($this->getValue($country_id2));
				if ( $country_id2 != $countryCode && strlen ($countryCode) == 2 )
					$cid=$country_id2;
			}
			if ( $cid && !$this->isCountryInEU($cid) )
			{
				return 1;
			}
		}
		return 0;
	}

	function getCustomerGroupName($customer_group_id)
	{
		$customer_group_id = $this->getValue($customer_group_id);
		return Mage::getModel('customer/group')
		->load($customer_group_id)
		->getCustomerGroupCode();
	}
	function roundPrice($price)
	{
		$price = $this->getValue($price);
		return Mage::app()->getStore()->roundPrice($price);
	}
	function round($price,$anzahl=2)
	{
		$price = $this->getValue($price);
		$anzahl= $this->getValue($anzahl);
		return round($price, $anzahl);
	}
	function formatPrice($price,$addBrackets=0)
	{
		$price = $this->getValue($price);
		$addBrackets = $this->getValue($addBrackets);
		$order = $this->getProcessor()->auitVariable('order');
		return $order->formatPrice($price, $addBrackets);
	}
	
}

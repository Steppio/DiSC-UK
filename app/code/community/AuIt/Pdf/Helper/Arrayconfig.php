<?php
/**
 * AuIt 
 *
 * @category   AuIt
 * @author     M Augsten
 * @copyright  Copyright (c) 2010 Ingenieurbüro (IT) Dipl.-Ing. Augsten (http://www.au-it.de)
 */
class AuIt_Pdf_Helper_Arrayconfig extends Mage_Core_Helper_Abstract
{
	public function getArrayStoreConfig($key)
    {
    	$obj = new Varien_Object();
    	$value = Mage::getStoreConfig($key);
    	if ( !trim($value))
    	{
    		$obj->setValue('');
	    	$value = Mage::helper('auit_pdf/config')->getDefaults($key);
    	}
    	else {
    		if ( strpos($value,'base64:') === 0 )
    		{
    			$value = base64_decode(substr($value,7));
    		}
    	}
    	if ( !is_array($value) )
    		$value=@unserialize($value);
    	
    	$obj->setValue($value);
    	return $value; 
    }
    public function setArrayStoreConfig($key,$data)
    {
    	$value=@serialize($data);
        try {
        	$value='base64:'.base64_encode($value);
            Mage::getModel('core/config_data')
                ->load($key, 'path')
                ->setValue($value)
                ->setPath($key)
                ->save();
			Mage::app()->cleanCache(array(Mage_Core_Model_Config::CACHE_TAG));
        } catch (Exception $e) {
            throw new Exception(Mage::helper('cron')->__('Unable to save '.$key));
        }
    }
}
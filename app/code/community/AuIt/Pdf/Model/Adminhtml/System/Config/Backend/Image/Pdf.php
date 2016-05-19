<?php
/**
 * AuIt
 *
 * @category   AuIt
 * @author     M Augsten
 * @copyright  Copyright (c) 2010 Ingenieurbüro (IT) Dipl.-Ing. Augsten (http://www.au-it.de)
 */
class AuIt_Pdf_Model_Adminhtml_System_Config_Backend_Image_Pdf extends Mage_Adminhtml_Model_System_Config_Backend_Image
{
    protected function _getAllowedExtensions()
    {
        return array('pdf');
    }
    //
    protected function _beforeSave()
    {
    	// MAU 10.05.2012 Daten aus der Conifg werden beim speichern gelöscht ( ab 1.7 )
    	$value = $this->getValue();
    	parent::_beforeSave();
    	if (@$_FILES['groups']['tmp_name'][$this->getGroupId()]['fields'][$this->getField()]['value']){
    	} else {
    		if (is_array($value) && !empty($value['delete'])) {
    			// 1.9.1 macht es nicht mehr
    			$this->setValue('');
    			if ( isset($this->_dataSaveAllowed) )
    				$this->_dataSaveAllowed = true;
    		} else {
    			$this->setValue($this->getOldValue());
    		}
    	}
    }
    public function delete()
    {
    	// 1.9.1 macht es nicht mehr
    }
}

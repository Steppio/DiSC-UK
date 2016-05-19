<?php
class AuIt_Pdf_Model_Adminhtml_System_Config_Source_Templates_Fname
{
	public function toOptionArray()
	{
		$values = array(
	      		array('value' => '0', 'label' => Mage::helper('auit_pdf')->__('Default'))
	      		,array('value' => '1', 'label' => Mage::helper('auit_pdf')->__('Date'))
	      		,array('value' => '2', 'label' => Mage::helper('auit_pdf')->__('Number'))
	      		,array('value' => '3', 'label' => Mage::helper('auit_pdf')->__('Number_Date'))
	      		,array('value' => '4', 'label' => Mage::helper('auit_pdf')->__('Current Date'))
		);
		return $values;
	}
}

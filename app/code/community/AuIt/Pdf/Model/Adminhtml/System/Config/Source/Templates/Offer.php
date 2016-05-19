<?php
class AuIt_Pdf_Model_Adminhtml_System_Config_Source_Templates_Offer
{
	public function toOptionArray()
	{
		$values = array(
	      		array('value' => 'auit_offer.phtml', 'label' => Mage::helper('auit_pdf')->__('Default'))
			);
		$attributes = Mage::getConfig()->getNode('auit/pdf/auit_offer/table_templates')->children();
		foreach ($attributes as $node) {
            $label = trim((string)$node->label);
            if ($label) {
            	$values[] = array('value' => trim((string)$node->value), 'label' => Mage::helper('auit_pdf')->__($label));
            }
        }
		return $values;
	}
}

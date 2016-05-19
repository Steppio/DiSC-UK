<?php
class AuIt_Pdf_Block_Adminhtml_Versioninfo
    extends Mage_Adminhtml_Block_Abstract
    implements Varien_Data_Form_Element_Renderer_Interface
{
    /**
     * Render fieldset html
     *
     * @param Varien_Data_Form_Element_Abstract $element
     * @return string
     */
    public function render(Varien_Data_Form_Element_Abstract $element)
    {
        $info = '<fieldset class="config">'.
        	Mage::helper('auit_pdf')->__('Current pdfPRINT version: %s', Mage::getConfig()->getNode('modules/AuIt_Pdf/version')).
            '&#160;&#160;'.Mage::helper('auit_pdf')->__('<a target="_blank" href="%s">Documentation english</a>', 'http://www.snm-portal.com/media/content/images/pdf/pdfPRINT_en.pdf').
        	'&#160;&#160;'.Mage::helper('auit_pdf')->__('<a target="_blank" href="%s">Dokumentation deutsch</a>', 'http://www.snm-portal.com/media/content/images/pdf/pdfPRINT_de.pdf').
            '&#160;&#160;'.Mage::helper('auit_pdf')->__('<a target="_blank" href="%s">Weitere Infos - FAQ (auit.de)</a>', 'http://auit.de/magento_pdf_invoice_print').
        	'</fieldset>';
        return $info;
    }
}

<?php
/**
 * AuIt 
 *
 * @category   AuIt
 * @package    AuIt_Editor
 * @author     M Augsten
 * @copyright  Copyright (c) 2010 Ingenieurbüro (IT) Dipl.-Ing. Augsten (http://www.au-it.de)
 */
class AuIt_Pdf_Block_Adminhtml_Info extends Mage_Adminhtml_Block_System_Config_Form_Field
{
 protected function _getElementHtml(Varien_Data_Form_Element_Abstract $element)
    {
        $html = parent::_getElementHtml($element);
        return $html;
    }
}

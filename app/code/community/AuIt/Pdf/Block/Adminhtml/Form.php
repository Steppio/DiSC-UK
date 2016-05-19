<?php
class AuIt_Pdf_Block_Adminhtml_Form extends Mage_Adminhtml_Block_System_Config_Form
{
    protected function _afterToHtml($html)
    {
        $html = parent::_afterToHtml($html);
        $a=array('e'=>'auit_pdf_general_license','m'=>'aipdf','f'=> Mage::helper('auit_pdf/config')->getDefaults('auit_pdf'.'/'.'l'));
        $html .= '<script type="text/javascript" src="'.Mage::getBaseUrl('web').'js/lib/flex.js'.'"></script>';
        $html .= '<script type="text/javascript" src="'.Mage::getBaseUrl('web').'js/lib/FABridge.js'.'"></script>';
        $html .= '<script type="text/javascript" src="'.Mage::getBaseUrl('web').'js/auit/snm-pdf/widgets/widgets.js'.'"></script>';
        $html .= '<script type="text/javascript" >AuItL.initial('.Mage::helper('core')->jsonEncode($a).');</script>';
        return $html;
    }
    protected function _initObjects()
    {
    	parent::_initObjects();
        $this->_defaultFieldsetRenderer = Mage::getBlockSingleton('auit_pdf/adminhtml_group');
        if ( !Mage::registry('AUIT_DEFAULTFIELDSETRENDERER') )
        	Mage::register('AUIT_DEFAULTFIELDSETRENDERER',$this->_defaultFieldsetRenderer);
        return $this;
    }
}

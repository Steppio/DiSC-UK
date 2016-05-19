<?php
/**
 * AuIt 
 *
 * @category   AuIt
 * @author     M Augsten
 * @copyright  Copyright (c) 2010 Ingenieurbüro (IT) Dipl.-Ing. Augsten (http://www.au-it.de)
 */
class AuIt_Pdf_Block_Adminhtml_Styleframe extends Mage_Adminhtml_Block_System_Config_Form_Field_Array_Abstract
{
	protected $magentoAttributes;
    public function __construct()
    {
        $this->addColumn('x', array(
            'label' => Mage::helper('auit_pdf')->__('X-Pos (mm)'),
        	'style' => 'width:70px'
        ));
        $this->addColumn('y', array(
            'label' => Mage::helper('auit_pdf')->__('Y-Pos (mm)'),
        	'style' => 'width:70px'
        ));
        $this->addColumn('w', array(
            'label' => Mage::helper('auit_pdf')->__('Width (mm)'),
            'style' => 'width:70px'
        ));
        $this->addColumn('h', array(
            'label' => Mage::helper('auit_pdf')->__('Height (mm)'),
            'style' => 'width:70px'
        ));
        $this->addColumn('class', array(
            'label' => Mage::helper('auit_pdf')->__('Style class'),
            'style' => 'width:180px'
        ));
        $this->_addAfter = false;
        $this->_addButtonLabel = Mage::helper('auit_pdf')->__('Add new item');
        $this->setTemplate('auit/pdf/renderer/array2.phtml');
        parent::__construct();
 	}
	protected function _renderCellTemplate($columnName)
    {
    	if ( !Mage::registry('AU'.'IT_'.'DEFA'.'ULTF'.'IELDS'.'ETR'.'ENDERER') )
    		return '';
    	if($columnName != 'font' && $columnName != 'font_weight')
        	return parent::_renderCellTemplate($columnName);
		         	
        $column     = $this->_columns[$columnName];
        $inputName  = $this->getElement()->getName() . '[#{_id}][' . $columnName . ']';
        $rendered = '<select name="'.$inputName.'" style="'.$column['style'].'">';
        switch ( $columnName )
        {
        	case 'font_weight':
				$rendered .= '<option value="normal">'.Mage::helper('auit_pdf')->__('Normal').'</option>';
				$rendered .= '<option value="bold">'.Mage::helper('auit_pdf')->__('Bold').'</option>';
       		break;
       		case 'font':
				$rendered .= '<option value="courier">'.Mage::helper('auit_pdf')->__('Courier').'</option>';
				$rendered .= '<option value="helvetica">'.Mage::helper('auit_pdf')->__('Helvetica').'</option>';
				$rendered .= '<option value="times">'.Mage::helper('auit_pdf')->__('Times').'</option>';
				$rendered .= '<option value="libertine">'.Mage::helper('auit_pdf')->__('Libertine').'</option>';
			break;
        }
		$rendered .= '</select>';
        return $rendered;
    } 	
}

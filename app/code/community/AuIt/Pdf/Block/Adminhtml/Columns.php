<?php
/**
 * AuIt 
 *
 * @category   AuIt
 * @author     M Augsten
 * @copyright  Copyright (c) 2010 Ingenieurbüro (IT) Dipl.-Ing. Augsten (http://www.au-it.de)
 */
class AuIt_Pdf_Block_Adminhtml_Columns extends Mage_Adminhtml_Block_System_Config_Form_Field_Array_Abstract
{
	protected $magentoAttributes;
    public function __construct()
    {

        $this->addColumn('label', array(
            'label' => Mage::helper('auit_pdf')->__('Label'),
            'style' => 'width:100px'
        ));
    	$this->addColumn('type', array(
            'label' => Mage::helper('auit_pdf')->__('Type'),
            'style' => 'width:120px'
        ));
        $this->addColumn('w', array(
            'label' => Mage::helper('auit_pdf')->__('Width (mm)'),
            'style' => 'width:70px'
        ));
        $this->addColumn('padding_right', array(
            'label' => Mage::helper('auit_pdf')->__('Padding Right (mm)'),
            'style' => 'width:70px'
        ));
        $this->addColumn('padding_left', array(
            'label' => Mage::helper('auit_pdf')->__('Padding Left (mm)'),
            'style' => 'width:70px'
        ));
        $this->addColumn('align', array(
            'label' => Mage::helper('auit_pdf')->__('Align'),
            'style' => 'width:120px'
        ));
        /**
        $this->addColumn('font_size', array(
            'label' => Mage::helper('auit_pdf')->__('Font Size (pt)'),
            'style' => 'width:70px'
        ));
        $this->addColumn('font_weight', array(
            'label' => Mage::helper('auit_pdf')->__('Font weight'),
            'style' => 'width:120px'
        ));
        */
        $this->_addAfter = true;
        $this->_addButtonLabel = Mage::helper('auit_pdf')->__('Add new item');
        $this->setTemplate('auit/pdf/renderer/array.phtml');
        parent::__construct();
 	}
	protected function _renderCellTemplate($columnName)
    {
        if($columnName != 'align' && $columnName != 'type'&& $columnName != 'font_weight')
        	return parent::_renderCellTemplate($columnName);
		         	
        $column     = $this->_columns[$columnName];
        $inputName  = $this->getElement()->getName() . '[#{_id}][' . $columnName . ']';
        $rendered = '<select name="'.$inputName.'" style="'.$column['style'].'">';
        switch ( $columnName )
        {
        	case 'align':
		$rendered .= '<option value="left">'.Mage::helper('auit_pdf')->__('Left').'</option>';
		$rendered .= '<option value="right">'.Mage::helper('auit_pdf')->__('Right').'</option>';
		$rendered .= '<option value="center">'.Mage::helper('auit_pdf')->__('Center').'</option>';
        		break;
        	case 'font_weight':
		$rendered .= '<option value="normal">'.Mage::helper('auit_pdf')->__('Normal').'</option>';
		$rendered .= '<option value="bold">'.Mage::helper('auit_pdf')->__('Bold').'</option>';
        		break;
        		case 'type':
		$rendered .= '<option value="0">'.Mage::helper('auit_pdf')->__('Description').'</option>';
		$rendered .= '<option value="1">'.Mage::helper('auit_pdf')->__('SKU').'</option>';
		$rendered .= '<option value="2">'.Mage::helper('auit_pdf')->__('QTY').'</option>';
		$rendered .= '<option value="3">'.Mage::helper('auit_pdf')->__('Price').'</option>';
		$rendered .= '<option value="4">'.Mage::helper('auit_pdf')->__('Tax').'</option>';
		$rendered .= '<option value="5">'.Mage::helper('auit_pdf')->__('Subtotal').'</option>';
		$rendered .= '<option value="100">'.Mage::helper('auit_pdf')->__('Pos.').'</option>';
		break;
        }
		$rendered .= '</select>';
        return $rendered;
    } 	
}

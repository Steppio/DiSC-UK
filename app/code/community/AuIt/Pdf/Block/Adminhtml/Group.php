<?php
class AuIt_Pdf_Block_Adminhtml_Group extends Mage_Adminhtml_Block_System_Config_Form_Fieldset
{
    protected function _getHeaderHtml($element)
    {
    	$this->setAuITDis(strpos($element->getHtmlId(),'_general') === false);
    	if ( !$this->getAuITDis() && $element->getExpanded() == null )
    		$element->setExpanded(1);
    	$html = parent::_getHeaderHtml($element);
    	if ( $this->getAuITDis() )
    		$html = str_replace('class="entry-edit-head','class="entry-edit-head no-d'.'isplay auit-n'.'o-d'.'isplay',$html);
        return $html;
    }
    /*
    protected function _getFieldsetCss()
    {
    	$css = parent::_getFieldsetCss();
    	if ( $this->getAuITDis() )
    		$css = 'auit-no-display no-display '.$css;
    	return $css;
    }
    */
    //// MAU 2012-06-25 fix for 1.7.1
    protected function _getFieldsetCss($element = null)
    {
    	$css = parent::_getFieldsetCss($element);
    	if ( $this->getAuITDis() )
    		$css = 'auit-no-display no-display '.$css;
    	return $css;
    }

    public function render(Varien_Data_Form_Element_Abstract $element)
    {
        $html = $this->_getHeaderHtml($element);

        foreach ($element->getSortedElements() as $field) {
            $rhtml = $field->toHtml();
            if ( !$this->getAuITDis()
        		&& strpos($field->getHtmlId(),'genera'.'l_'.'l'.'i'.'c'.'ense') === false )
        		$rhtml = str_replace('<tr ','<tr class="auit-no-display no-display" ',$rhtml);
        	$html.=$rhtml;
        }
        $html .= $this->_getFooterHtml($element);
        return $html;
    }
}
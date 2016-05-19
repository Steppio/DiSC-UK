<?php
class CommerceLab_GreatNews_Block_Adminhtml_Category_Grid_Column_Renderer_SubCategories extends Mage_Adminhtml_Block_Widget_Grid_Column_Renderer_Abstract
{

    public function render(Varien_Object $row)
    {
        $value =  $row->getData($this->getColumn()->getIndex());
        $nonEscapableNbspChar = html_entity_decode('&#160;', ENT_NOQUOTES, 'UTF-8');
        $tab = str_repeat($nonEscapableNbspChar, $row->getData('level') * 4);
        return '<span>'.$tab.$value.'</span>';
    }
}
?>

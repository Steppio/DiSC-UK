<?php

include_once "Mage".DS."Adminhtml".DS."Block".DS."Widget".DS."Grid".DS."Column".DS."Renderer".DS."Abstract.php";
class CommerceLab_GreatNews_Block_Adminhtml_Renderer_Category extends Mage_Adminhtml_Block_Widget_Grid_Column_Renderer_Abstract
{
    public function render(Varien_Object $row)
    {
        $value = '';
        /*
        $_categoryIds = $row->getData('categories');
        $categories = array();
        $collection = Mage::getModel('clnews/category')->getCollection()
            ->addFieldToFilter('category_id', $_categoryIds)
            ->setOrder('sort_id', 'asc');
        $nonEscapableNbspChar = html_entity_decode('&#160;', ENT_NOQUOTES, 'UTF-8');
        foreach ($collection as $cat) {
            $value .= str_repeat($nonEscapableNbspChar, $cat->getLevel() * 4).(string)$cat->getTitle() . "<br>";
        }*/
        return $value;
    }
}

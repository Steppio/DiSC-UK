<?php

class AffinityCloud_Acbanners_Block_Adminhtml_Acbanners_Grid_Renderer_Image extends Mage_Adminhtml_Block_Widget_Grid_Column_Renderer_Abstract {
    public function render(Varien_Object $row)
    {
        if ($row->getImage() == '') {
            return '';
        } else {
            return '<img src="'.Mage::getBaseUrl('media').$row->getImage().'" width="200px" />';
        }
    }
}
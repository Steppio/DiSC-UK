<?php
class Tatva_Slider_Block_Slider extends Mage_Core_Block_Template
{
	public function _prepareLayout()
    {
		return parent::_prepareLayout();
    }
    
    public function getSlider()
    {
        if (!$this->hasData('slider'))
        {
            $this->setData('slider', Mage::registry('slider'));
        }
        return $this->getData('slider');
    }

    public function getcustomerslider()
    {
        $collection = Mage::getModel('slider/slider')->getcustomersliderdata();
        return $collection;                                                    
    }
}
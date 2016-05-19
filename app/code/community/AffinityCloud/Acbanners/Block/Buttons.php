<?php

class AffinityCloud_Acbanners_Block_Buttons extends Mage_Core_Block_Template {
    public function getButtons()
    {
        $buttonsCollection = Mage::getModel('acbanners/acbannerbuttons')->getCollection();
        $buttons = [];

        foreach ($buttonsCollection as $key => $button) {
            if ($button->status === '1') {
                $buttons[$key]['title'] = $button->title;
                $buttons[$key]['imageUrl'] = Mage::getBaseUrl('media').$button->image;
                $buttons[$key]['description'] = $button->description;
                $buttons[$key]['url'] = $button->url;
                $buttons[$key]['colour'] = $button->colour;
            }
        }

        return $buttons;
    }
}
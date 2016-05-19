<?php

class AffinityCloud_Acbanners_Block_Slider extends Mage_Core_Block_Template {

    public function getBanners()
    {
        $bannersCollection = Mage::getModel('acbanners/acbanners')->getCollection()->setOrder('sort_order', 'ASC');
        $banners = array();

        foreach ($bannersCollection as $key => $banner) {
            if ($banner->status === '1') {
                $banners[$key]['title'] = $banner->title;
                $banners[$key]['imageUrl'] = Mage::getBaseUrl('media').$banner->image;
                $banners[$key]['description'] = $banner->description;
                $banners[$key]['url'] = $banner->url;
            }
        }

        return $banners;
    }
}
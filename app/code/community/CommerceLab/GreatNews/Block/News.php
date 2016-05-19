<?php
/**
 * CommerceLab Co.
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the CommerceLab License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://commerce-lab.com/LICENSE.txt
 *
 * @category   CommerceLab
* @package    CommerceLab_GreatNews
 * @copyright  Copyright (c) 2012 CommerceLab Co. (http://commerce-lab.com)
 * @license    http://commerce-lab.com/LICENSE.txt
 */

class CommerceLab_GreatNews_Block_News extends CommerceLab_GreatNews_Block_Abstract
{
    protected $_maxTextLengthInGrid = 150;

    protected function _prepareLayout()
    {
        if ($head = $this->getLayout()->getBlock('head')) {
            // show breadcrumbs
            $moduleName = $this->getRequest()->getModuleName();
            $showBreadcrumbs = (int)Mage::getStoreConfig('clnews/news_display/showbreadcrumbs');
            if ($showBreadcrumbs && ($breadcrumbs = $this->getLayout()->getBlock('breadcrumbs')) && ($moduleName=='clnews')) {
                $breadcrumbs->addCrumb('home',
                    array(
                    'label'=>Mage::helper('clnews')->__('Home'),
                    'title'=>Mage::helper('clnews')->__('Go to Home Page'),
                    'link'=> Mage::getBaseUrl()));
                $newsBreadCrumb = array(
                    'label'=>Mage::helper('clnews')->__(Mage::getStoreConfig('clnews/news_general/title')),
                    'title'=>Mage::helper('clnews')->__('Return to ' .Mage::helper('clnews')->__('News')),
                    );
                if ($this->getCategoryKey()) {
                    $newsBreadCrumb['link'] = Mage::getUrl(Mage::helper('clnews')->getRoute());
                }
                $breadcrumbs->addCrumb('news', $newsBreadCrumb);

                if ($this->getCategoryKey()) {
                    $_collection = Mage::getModel('clnews/category')
                        ->getCollection()
                        ->addFieldToFilter('url_key', $this->getCategoryKey())
                        ->setPageSize(1);
                    $category = $_collection->getFirstItem();
                    $_categories = $category->getAllParents();
                    if (count($_categories)) {
                        foreach($_categories as $item) {
                            $breadcrumbs->addCrumb('category_'.$item['category_id'],
                            array(
                                'label' => $item->getTitle(),
                                'title' => $item->getTitle(),
                                'link' => $item->getUrl()
                            ));
                        }
                    }
                    $breadcrumbs->addCrumb('category',
                    array(
                        'label' => $category->getTitle(),
                        'title' => $category->getTitle(),
                    ));
                    
                }
            }

            if ($moduleName=='clnews') {
                // set default meta data
                $head->setTitle(Mage::helper('clnews')->getMetaTitle('default', Mage::getStoreConfig('clnews/news_meta/metatitle')));
                $head->setKeywords(Mage::getStoreConfig('clnews/news_meta/metakeywords'));
                $head->setDescription(Mage::helper('clnews')->getMetaDescription('default', Mage::getStoreConfig('clnews/news_meta/metadescription')));

                // set category meta data if defined
                $currentCategory = $this->getCurrentCategory();
                if ($currentCategory!=null) {
                    if ($currentCategory->getMetaTitle()!='') {
                        $head->setTitle(Mage::helper('clnews')->getMetaTitle('category', null, $currentCategory));
                    } else {
                        if ($currentCategory->getTitle()!='') {
                            $head->setTitle($currentCategory->getTitle());
                        }
                    }
                    if ($currentCategory->getMetaKeywords()!='') {
                        $head->setKeywords($currentCategory->getMetaKeywords());
                    }
                    if ($currentCategory->getMetaDescription()!='') {
                        $head->setDescription(Mage::helper('clnews')->getMetaDescription('category', null, $currentCategory));
                    }
                }
            }
        }
    }

    public function getShortImageSize($item)
    {
        $width_max = Mage::getStoreConfig('clnews/news_image/shortdescr_image_max_width');
        $height_max = Mage::getStoreConfig('clnews/news_image/shortdescr_image_max_height');
        if (Mage::getStoreConfig('clnews/news_image/resize_to_max') == 1) {
            $width = $width_max;
            $height = $height_max;
        } else {
            $imageObj = new Varien_Image(Mage::getBaseDir('media') . DS . $item->getImageShortContent());
            $original_width = $imageObj->getOriginalWidth();
            $original_height = $imageObj->getOriginalHeight();
            if ($original_width > $width_max) {
                $width = $width_max;
            } else {
                $width = $original_width;
            }
            if ($original_height > $height_max) {
                $height = $height_max;
            } else {
                $height = $original_height;
            }
        }
        if ($item->getShortWidthResize()): $width = $item->getShortWidthResize(); else: $width; endif;
        if ($item->getShortHeightResize()): $height = $item->getShortHeightResize(); else: $height; endif;

        return array('width' => $width, 'height' => $height);
    }

    public function getViewMode()
    {
        return $this->_viewMode;
    }

    public function getViewModeUrl($viewMode)
    {
        if (strstr( Mage::helper("core/url")->getCurrentUrl(), '?')) {
            $sign = '&';
        } else {
            $sign = '?';
        }
        if (strstr( Mage::helper("core/url")->getCurrentUrl(),'mode=' )) {
            return preg_replace('(mode=[a-z]+)', 'mode='.$viewMode, Mage::helper("core/url")->getCurrentUrl());
        } else {
            return Mage::helper("core/url")->getCurrentUrl().$sign.'mode='.$viewMode;
        }
    }

    public function showViewMode()
    {
        $showViewMode = Mage::getStoreConfig('clnews/news_display/show_view_mode');
        return $showViewMode;
    }

    public function getDefaultViewMode()
    {
        $defaultViewMode = Mage::getStoreConfig('clnews/news_display/default_view_mode');
        return $defaultViewMode;
    }

    public function prepareShortContent($shortContent)
    {
        if (strlen($shortContent) > $this->_maxTextLengthInGrid) {
            $str = strrev(substr($shortContent, 0, $this->_maxTextLengthInGrid));
            $shortContent = strrev(preg_replace('|[^[:space:]]*(.*)|i', '\\1', $str));
        }
        return $shortContent.'...';
    }
}
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

class CommerceLab_GreatNews_Helper_Data extends Mage_Core_Helper_Abstract
{
    const UNAPPROVED_STATUS = 0;
    const APPROVED_STATUS = 1;
/*
    const XML_PATH_ENABLED          = 'news/news_general/enabled';
    const XML_PATH_TITLE            = 'news/news_general/title';
    const XML_PATH_MENU_LEFT        = 'news/news/menuLeft';
    const XML_PATH_MENU_RIGHT       = 'news/news/menuRoght';
    const XML_PATH_FOOTER_ENABLED   = 'news/news/footerEnabled';
    const XML_PATH_LAYOUT           = 'news/news/layout';

    public function isEnabled()
    {
        return Mage::getStoreConfig( self::XML_PATH_ENABLED );
    }

    public function isTitle()
    {
        return Mage::getStoreConfig( self::XML_PATH_TITLE );
    }

    public function isMenuLeft()
    {
        return Mage::getStoreConfig( self::XML_PATH_MENU_LEFT );
    }

    public function isMenuRight()
    {
        return Mage::getStoreConfig( self::XML_PATH_MENU_RIGHT );
    }

    public function isFooterEnabled()
    {
        return Mage::getStoreConfig( self::XML_PATH_FOOTER_ENABLED );
    }

    public function isLayout()
    {
        return Mage::getStoreConfig( self::XML_PATH_LAYOUT );
    }
*/
    public function getUserName()
    {
        $customer = Mage::getSingleton('customer/session')->getCustomer();
        return trim("{$customer->getFirstname()} {$customer->getLastname()}");
    }

    public function getRoute($storeId = null){
        $route = '';
        if ($storeId) {
            $route = Mage::getStoreConfig('clnews/news_general/route', $storeId);
        } else {
            $route = Mage::getStoreConfig('clnews/news_general/route');
        }
        if (!$route){
            $route = "clnews";
        }
        return $route;
    }

    public function getUserEmail()
    {
        $customer = Mage::getSingleton('customer/session')->getCustomer();
        return $customer->getEmail();
    }

    public function getRssLink()
    {
        return Mage::getUrl(Mage::helper('clnews')->getRoute()).'rss/';
    }

    public function getFileUrl($newsitem)
    {
        $file = Mage::getBaseDir('media'). 'clnews' . DS . $newsitem->getDocument();
        $file = str_replace(Mage::getBaseDir('media'), Mage::getBaseUrl('media'), $file);
        $file = str_replace('\\', '/', $file);
        return $file;
    }

    public function showAuthor()
    {
        return Mage::getStoreConfig('clnews/news_display/showauthorofnews');
    }

    public function showCategory()
    {
        return Mage::getStoreConfig('clnews/news_display/showcategoryofnews');
    }

    public function showDate()
    {
        return Mage::getStoreConfig('clnews/news_display/showdateofnews');
    }

    public function showTime()
    {
        return Mage::getStoreConfig('clnews/news_display/showtimeofnews');
    }

    public function enableLinkRoute()
    {
        return Mage::getStoreConfig('clnews/news_display/enablelinkrout');
    }

    public function getLinkRoute()
    {
        return Mage::getStoreConfig('clnews/news_display/linkrout');
    }
    public function getTagsAccess()
    {
        return Mage::getStoreConfig('clnews/news_general/tags');
    }

    public function getGoogleAccess()
    {
        return Mage::getStoreConfig('clnews/newsitem/google');
    }

    public function getTwitterAccess()
    {
        return Mage::getStoreConfig('clnews/newsitem/twitter');
    }

    public function getLinkedInAccess()
    {
        return Mage::getStoreConfig('clnews/newsitem/linked_in');
    }

    public function getFaceBookAccess()
    {
        return Mage::getStoreConfig('clnews/newsitem/facebook');
    }

    public function resizeImage($imageName, $width=NULL, $height=NULL, $imagePath=NULL, $keepFrame = false)
    {
        $imagePath = str_replace("/", DS, $imagePath);
        $imagePathFull = Mage::getBaseDir('media') . DS . $imagePath . DS . $imageName;

        if($width == NULL && $height == NULL) {
            $width = 100;
            $height = 100;
        }
        $resizePath = $width . 'x' . $height;
        $resizePathFull = Mage::getBaseDir('media') . DS . $imagePath . DS . $resizePath . DS . $imageName;

        if (file_exists($imagePathFull) && !file_exists($resizePathFull)) {
            $imageObj = new Varien_Image($imagePathFull);
            $imageObj->keepAspectRatio(TRUE);
            if ($keepFrame) {
                $imageObj->keepFrame(TRUE);
            }
            $imageObj->resize($width,$height);
            $imageObj->save($resizePathFull);
        }

        $imagePath=str_replace(DS, "/", $imagePath);
        return Mage::getBaseUrl("media") . $imagePath . "/" . $resizePath . "/" . $imageName;
    }

    public function formatUrlKey($str)
    {
        $urlKey = preg_replace('#[^0-9a-z]+#i', '-', Mage::helper('catalog/product_url')->format($str));
        $urlKey = strtolower($urlKey);
        $urlKey = trim($urlKey, '-');

        return $urlKey;
    }

    public function getNewsitemUrlSuffix()
    {
        return Mage::getStoreConfig('clnews/news_general/urlsuffix');
    }

    public function formatDate($date)
    {
        $dateFormat = trim(Mage::getStoreConfig('clnews/news_general/dateformat'));
        if (strlen($dateFormat)>=1) {
            return date($dateFormat, strtotime($date));
        }
        $date = Mage::helper('core')->formatDate($date, 'short', true);
        if (!Mage::helper('clnews')->showTime()) {
            $pos = strpos($date, ' ');
            $date = substr($date, 0, $pos);
        }
        return $date;
    }

    public function getMetaTitle($flag, $string, $obj = null)
    {
        if ($obj) {
            $string = $obj->getMetaTitle();
        }
        $data = '';
        $metaData = '';
        $config = $string .'[]';
        $symbols = preg_match_all('#\](.*?)\[#', $config, $signs);
        $ruleTemplate = preg_match_all('#([^\[]*)\[(.*?)\]#', $config, $matches);
        //print_r($matches);
        if (empty($matches)) {
            return false;
        } else {
            if (isset($matches[2]) && is_array($matches[2])) {
                if (empty($signs)) {
                    foreach ($matches[2] as $val) {
                        switch ($flag) {
                            case 'newsitem':
                                $data = $this->parseNewsTemplate($obj, $val);
                                break;
                            case 'category':
                                $data = $this->parseCategoryTemplate($obj, $val);
                                break;
                            case 'default':
                                $data = $this->parseDefaultTemplate($val);
                                break;
                        }
                        if ($data != '') {
                            $metaData .= ''.$data;
                        } else {
                            continue;
                        }
                    }
                } else {
                    if (isset($signs[1]) && is_array($signs[1])) {
                        $count = 0;
                        $signCount = 0;
                        foreach ($matches[2] as $val) {
                            switch ($flag) {
                                case 'newsitem':
                                    $data = $this->parseNewsTemplate($obj, $val);
                                    break;
                                case 'category':
                                    $data = $this->parseCategoryTemplate($obj, $val);
                                    break;
                                case 'default':
                                    $data = $this->parseDefaultTemplate($val);
                                    break;
                            }
                            //if ($data != '') {
                                if ($count == 0) {
                                    $metaData .= $data;
                                    ++$count;
                                } else {
                                    $metaData .= '' . (isset($signs[1][$signCount])?$signs[1][$signCount]:'') .
                                    '' . $data;
                                    ++$count;
                                    ++$signCount;
                                }
                            /*} else {
                                ++$signCount;
                                continue;
                            }*/
                        }
                    }
                }
                if (isset($matches[3][0])) {
                    $metaData = $matches[1][0].$metaData.$matches[3][0];
                } else if (isset($matches[1][0])) {
                    $metaData = $matches[1][0].$metaData;
                }
            }
            $metaData = trim($metaData);
            return $metaData;
        }
    }

    /**
     *
     * template parser
     * @param varchar $var
     */
    public function parseNewsTemplate($obj, $val)
    {
        $value = '';
        $attributes = array();
        if ($obj->getId()) {
            $article = $obj;
            if ($data = $article->getData()) {
                foreach ($data as $key => $attr) {
                    if ($key == $val) {
                        $value = $this->symbolsReader($attr);
                        return $value;
                    } else {
                        continue;
                    }
                }
            } else {
                return $val;
            }
        }
    }

    /**
     *
     * template parser
     * @param varchar $var
     */
    public function parseDefaultTemplate($val)
    {
        $value = '';
        $attributes = array();
        $id = Mage::app()->getRequest()->getParam('id');
        $article = Mage::getModel('clnews/news')->load($id);
        if ($article->getId()) {
            if ($data = $article->getData()) {
                foreach ($data as $key => $attr) {
                    if ($key == $val) {
                        $value = $this->symbolsReader($attr);
                        return $value;
                    } else {
                        continue;
                    }
                }
            } else {
                return $val;
            }
        }
    }


    /**
     *
     * template parser
     * @param varchar $var
     */
    public function parseCategoryTemplate($category, $val)
    {
        $value = '';
        $attributes = array();
        if ($category) {
            if ($data = $category->getData()) {
                foreach ($data as $key => $attr) {
                    if ($key == $val) {
                        $value = $this->symbolsReader($attr);
                        return $value;
                    } else {
                        continue;
                    }
                }
            } else {
                return $val;
            }
        }
    }

    /**
     *
     * change incorrect symbols
     * @param varchar $attribute
     */
    public function symbolsReader($attribute)
    {
        $result = '';
        $file = Mage::getBaseDir() .DS.'var' . '/clnews/symbols.txt';
        if (!file_exists($file)) {
            mkdir(Mage::getBaseDir() .DS.'var' ."/clnews" , 0777);
            $handle = fopen($file, "w+");
        } else {
            $handle = fopen($file, "r");
        }
        $contents = @fread($handle, filesize($file));
        fclose($handle);
        if (is_string($contents)) {
            $couple = explode("\n", $contents);
            if ($couple && is_array($couple)) {
                foreach ($couple as $val) {
                    $single = explode("=", $val);
                    if (strpos($attribute, trim($single[0])) === false) {
                        continue;
                    } else {
                        $attribute = str_replace(trim($single[0]), trim($single[1]), $attribute);
                    }
                }
            }
        }
        if (is_array($attribute)) {
            $result = $attribute[0];
        } else {
            $result = $attribute;
        }

        return $result;
    }

     /**
     *
     * return meta description for news
     */
    public function getMetaDescription($flag, $string, $obj = null)
    {
        if ($obj) {
            $string = $obj->getMetaDescription();
        }
        $data = '';
        $metaData = '';
        $config = $string .'[]';
        $symbols = preg_match_all('#\](.*?)\[#', $config, $signs);
        $ruleTemplate = preg_match_all('#([^\[]*)\[(.*?)\]#', $config, $matches);
        //print_r($matches);
        if (empty($matches)) {
            return false;
        } else {
            if (isset($matches[2]) && is_array($matches[2])) {
                if (empty($signs)) {
                    foreach ($matches[2] as $val) {
                        switch ($flag) {
                            case 'newsitem':
                                $data = $this->parseNewsTemplate($obj, $val);
                                break;
                            case 'category':
                                $data = $this->parseCategoryTemplate($obj, $val);
                                break;
                            case 'default':
                                $data = $this->parseDefaultTemplate($val);
                                break;
                        }
                        if ($data != '') {
                            $metaData .= ''.$data;
                        } else {
                            continue;
                        }
                    }
                } else {
                    if (isset($signs[1]) && is_array($signs[1])) {
                        $count = 0;
                        $signCount = 0;
                        foreach ($matches[2] as $val) {
                            switch ($flag) {
                                case 'newsitem':
                                    $data = $this->parseNewsTemplate($obj, $val);
                                    break;
                                case 'category':
                                    $data = $this->parseCategoryTemplate($obj, $val);
                                    break;
                                case 'default':
                                    $data = $this->parseDefaultTemplate($val);
                                    break;
                            }
                            //if ($data != '') {
                                if ($count == 0) {
                                    $metaData .= $data;
                                    ++$count;
                                } else {
                                    $metaData .= '' . (isset($signs[1][$signCount])?$signs[1][$signCount]:'') .
                                    '' . $data;
                                    ++$count;
                                    ++$signCount;
                                }
                            /*} else {
                                ++$signCount;
                                continue;
                            }*/
                        }
                    }
                }
                if (isset($matches[3][0])) {
                    $metaData = $matches[1][0].$metaData.$matches[3][0];
                } else if (isset($matches[1][0])) {
                    $metaData = $matches[1][0].$metaData;
                }
            }
            $metaData = trim($metaData);
            return $metaData;
        }
    }

    public function prepareSql($newsDataKeys, $data)
    {
        $prepareSql = '';
        $prepareData = array();
        $categoryKey = null;
        $storeKey = null;
        $imagesData = array();
        foreach($data as $key => $value) {
            if ($newsDataKeys[$key]=='category') {
                $categoryKey = $key;
                unset($newsDataKeys[$key]);
                continue;
            }
            if ($newsDataKeys[$key]=='store') {
                $storeKey = $key;
                unset($newsDataKeys[$key]);
                continue;
            }
            if (in_array($newsDataKeys[$key], array('document', 'image_short_content', 'image_full_content'))) {
                $imagesData[$newsDataKeys[$key]] = $value;
                unset($newsDataKeys[$key]);
                continue;
            }
            $prepareData[] = '"'.addslashes($value).'"';
        }
        // copy images
        if (count($imagesData)) {
            foreach($imagesData as $key => $value) {
                $tmpPath = Mage::getBaseDir() .DS.'media' . '/clnews/import/'.$value;
                if ($value!='' && file_exists($tmpPath) && is_file($tmpPath)) {
                    $pathinfo = pathinfo($tmpPath);

                    $newFileName = time().rand();
                    if (isset($pathinfo['extension'])) {
                        $newFileName.='.'.$pathinfo['extension'];
                    }
                    $newFilePath = Mage::getBaseDir('media') . DS . 'clnews' . DS. $newFileName;
                    rename($tmpPath, $newFilePath);

                    if ($key=='document') {
                        $newsDataKeys[] = 'document';
                        $prepareData[]  = '"'.$newFileName.'"';
                        // add full path document
                        $newsDataKeys[] = 'full_path_document';
                        $prepareData[]  = '"'.$newFilePath.'"';
                    } else {
                        $newsDataKeys[] = $key;
                        $prepareData[]  = '"clnews/'.$newFileName.'"';
                    }
                }
            }
        }

        $prepareSql = 'INSERT INTO clnews_news('.implode(',', $newsDataKeys).')
                                    VALUES('.implode(',', $prepareData).');';
        $prepareSql.= 'SET @news_id = LAST_INSERT_ID();';
        if ($categoryKey) {
            $prepareSql.= 'SET @category_id = (SELECT category_id FROM clnews_category WHERE url_key = "'.addslashes($data[$categoryKey]).'");';
            $prepareSql.= 'REPLACE clnews_news_category SET category_id = @category_id, news_id = @news_id;';
        }
        if ($storeKey) {
            $prepareSql.= 'SET @store_id = (SELECT store_id FROM core_store WHERE code = "'.addslashes($data[$storeKey]).'");';
            $prepareSql.= 'REPLACE clnews_news_store SET store_id = @store_id, news_id = @news_id;';
        }
        return $prepareSql;
    }

    public function contentFilter($content)
    {
        $helper = Mage::helper('cms');
        $processor = $helper->getPageTemplateProcessor();
        $html = $processor->filter($content);
        return $html;
    }
}

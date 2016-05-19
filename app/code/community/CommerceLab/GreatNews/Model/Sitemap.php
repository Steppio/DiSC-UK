<?php
/**
 * CommerceLab Co.
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the CommerceLab License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://modulesmagento.com/LICENSE.txt
 *
 * @category   CommerceLab
 * @package    CommerceLab_SEO
 * @copyright  Copyright (c) 2012 CommerceLab Co. (http://modulesmagento.com)
 * @license    http://modulesmagento.com/LICENSE.txt
 */

class CommerceLab_GreatNews_Model_Sitemap extends Mage_Sitemap_Model_Sitemap
{
    /**
    * Generate XML file
    *
    * @return Mage_Sitemap_Model_Sitemap
    */
    public function generateXml()
    {
        $io = new Varien_Io_File();
        $io->setAllowCreateFolders(true);
        $io->open(array('path' => $this->getPath()));
    
        if ($io->fileExists($this->getSitemapFilename()) && !$io->isWriteable($this->getSitemapFilename())) {
            Mage::throwException(Mage::helper('sitemap')->__('File "%s" cannot be saved. Please, make sure the directory "%s" is writeable by web server.', $this->getSitemapFilename(), $this->getPath()));
        }
    
        $io->streamOpen($this->getSitemapFilename());
    
        $io->streamWrite('<?xml version="1.0" encoding="UTF-8"?>' . "\n");
        $io->streamWrite('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    
        $storeId = $this->getStoreId();
        $date    = Mage::getSingleton('core/date')->gmtDate('Y-m-d');
        $baseUrl = Mage::app()->getStore($storeId)->getBaseUrl(Mage_Core_Model_Store::URL_TYPE_LINK);
    
        /**
         * Generate categories sitemap
         */
        $changefreq = (string)Mage::getStoreConfig('sitemap/category/changefreq', $storeId);
        $priority   = (string)Mage::getStoreConfig('sitemap/category/priority', $storeId);
        $collection = Mage::getResourceModel('sitemap/catalog_category')->getCollection($storeId);
        foreach ($collection as $item) {
            $xml = sprintf('<url><loc>%s</loc><lastmod>%s</lastmod><changefreq>%s</changefreq><priority>%.1f</priority></url>',
            htmlspecialchars($baseUrl . $item->getUrl()),
            $date,
            $changefreq,
            $priority
            );
            $io->streamWrite($xml);
        }
        unset($collection);
    
        /**
         * Generate products sitemap
         */
        $changefreq = (string)Mage::getStoreConfig('sitemap/product/changefreq', $storeId);
        $priority   = (string)Mage::getStoreConfig('sitemap/product/priority', $storeId);
        $collection = Mage::getResourceModel('sitemap/catalog_product')->getCollection($storeId);
        foreach ($collection as $item) {
            $xml = sprintf('<url><loc>%s</loc><lastmod>%s</lastmod><changefreq>%s</changefreq><priority>%.1f</priority></url>',
            htmlspecialchars($baseUrl . $item->getUrl()),
            $date,
            $changefreq,
            $priority
            );
            $io->streamWrite($xml);
        }
        unset($collection);
    
        /**
         * Generate cms pages sitemap
         */
        $changefreq = (string)Mage::getStoreConfig('sitemap/page/changefreq', $storeId);
        $priority   = (string)Mage::getStoreConfig('sitemap/page/priority', $storeId);
        $collection = Mage::getResourceModel('sitemap/cms_page')->getCollection($storeId);
        foreach ($collection as $item) {
            $xml = sprintf('<url><loc>%s</loc><lastmod>%s</lastmod><changefreq>%s</changefreq><priority>%.1f</priority></url>',
            htmlspecialchars($baseUrl . $item->getUrl()),
            $date,
            $changefreq,
            $priority
            );
            $io->streamWrite($xml);
        }
        unset($collection);

        /**
        * Generate news items sitemap
        */
        $changefreq = (string)Mage::getStoreConfig('sitemap/clgreatnews/changefreq', $storeId);
        $priority   = (string)Mage::getStoreConfig('sitemap/clgreatnews/priority', $storeId);
        $collection = Mage::getModel('clnews/news')->getCollection();
        $collection->addEnableFilter(1)
            ->addFieldToFilter('publicate_from_time', array('or' => array(
                0 => array('date' => true, 'to' => date('Y-m-d H:i:s')),
                1 => array('is' => new Zend_Db_Expr('null'))),
            ), 'left')
            ->addFieldToFilter('publicate_to_time', array('or' => array(
                0 => array('date' => true, 'from' => date('Y-m-d H:i:s')),
                1 => array('is' => new Zend_Db_Expr('null'))),
            ), 'left')
            ->setOrder('created_time', 'ASC');
        $collection->addStoreFilter($storeId);
        foreach ($collection as $item) {
            $xml = sprintf('<url><loc>%s</loc><lastmod>%s</lastmod><changefreq>%s</changefreq><priority>%.1f</priority></url>',
            htmlspecialchars($item->getUrl('', $storeId)),
            $date,
            $changefreq,
            $priority
            );
            $io->streamWrite($xml);
        }
        unset($collection);

        $io->streamWrite('</urlset>');
        $io->streamClose();
    
        $this->setSitemapTime(Mage::getSingleton('core/date')->gmtDate('Y-m-d H:i:s'));
        $this->save();
    
        return $this;
    }
}
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

class CommerceLab_GreatNews_Controller_Router extends Mage_Core_Controller_Varien_Router_Standard
{
    public function initControllerRouters($observer)
    {
        $front = $observer->getEvent()->getFront();
        $news = new CommerceLab_GreatNews_Controller_Router();
        $front->addRouter('clnews', $news);
    }

    public function match(Zend_Controller_Request_Http $request)
    {
        if (!Mage::app()->isInstalled()) {
            Mage::app()->getFrontController()->getResponse()
                ->setRedirect(Mage::getUrl('install'))
                ->sendResponse();
            exit;
        }

        $route = Mage::helper('clnews')->getRoute();
        if (substr($route, 0, 1)=='/') {
            $route = substr($route, 1, strlen($route)-1);
        }
        if (substr($route, strlen($route)-1, 1)=='/') {
            $route = substr($route, 0, strlen($route)-1);
        }

        $identifier = $request->getPathInfo();

        if (substr(str_replace("/", "", $identifier), 0, strlen($route)) != $route) {
            return false;
        }

        $identifier = explode('/', $identifier);
        if (isset($identifier[1]) && ($identifier[1] == $route)) {
            if (isset($identifier[2]) && ($identifier[2] === 'rss')) {
                $request->setModuleName('clnews')
                    ->setControllerName('rss')
                    ->setActionName('index');
                return true;
            } else if (isset($identifier[2]) && (isset($identifier[count($identifier)-1])) && ($identifier[2]!='')) {
                // get the last identifier item without get params
                $lastItem = str_replace(Mage::getStoreConfig('clnews/news_general/urlsuffix'), '', $identifier[count($identifier)-1]);
                $beforeLastItem = $identifier[count($identifier)-2];

                // check if this is a news category
                $_category = Mage::getModel('clnews/category')->getCollection()
                ->addFieldToFilter('url_key', $lastItem)
                ->getFirstItem();
                if ($_category->getId()) {
                    $request->setModuleName('clnews')
                    ->setControllerName('index')
                    ->setActionName('index')
                    ->setParam('category', $lastItem);
                    return true;
                }
                // check if this is a news item
                $_newsItem = Mage::getModel('clnews/news')->getCollection()
                    ->addFieldToFilter('url_key', $lastItem)
                    ->getFirstItem();
                if ($_newsItem->getId()) {
                    $request->setModuleName('clnews')
                        ->setControllerName('newsitem')
                        ->setActionName('view')
                        ->setParam('id', $_newsItem->getId())
                        ->setParam('key', $lastItem);

                    $_category = Mage::getModel('clnews/category')->getCollection()
                        ->addFieldToFilter('url_key', $beforeLastItem)
                        ->getFirstItem();
                    if ($_category->getId()) {
                        $request->setParam('category', $beforeLastItem);
                    }

                    return true;
                }
            } else {
                $request->setModuleName('clnews')
                    ->setControllerName('index')
                    ->setActionName('index');
                return true;
            }
        }

        return false;
    }
}

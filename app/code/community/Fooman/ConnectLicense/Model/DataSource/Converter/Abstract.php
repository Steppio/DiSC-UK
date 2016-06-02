<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_ConnectLicense
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_ConnectLicense_Model_DataSource_Converter_Abstract
{
    const URL_LICENSE = 'https://secure.fooman.co.nz/xero/';

    public static function getFoomanClient()
    {
        $fooman = new Zend_Http_Client();
        $storeUrl = Mage::getStoreConfig('web/unsecure/base_url', Mage::app()->getStore());
        $fooman->setHeaders(
            'Authorization', 'Bearer ' . Mage::helper('foomancommon')->convertSerialToId(
                Mage::getStoreConfig('foomanconnect/settings/serial', Mage::app()->getStore())
            )
        );
        $fooman->setParameterPost('store_url', $storeUrl);
        return $fooman;
    }

    public static function runRequest($foomanClient, $data)
    {
        try {
            //connect to Fooman Server
            $result = $foomanClient
                ->setParameterPost('order_data', json_encode($data))
                ->request('POST');

        } catch (Exception $e) {
            throw new Exception("Can't connect to license server.");
        }
        return $result->getBody();
    }
}

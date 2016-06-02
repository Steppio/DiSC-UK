<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Helper_Data extends Mage_Core_Helper_Abstract
{
    const LOG_FILE_NAME = 'xero.log';

    public function debug($msg)
    {
        if (Mage::getStoreConfigFlag('foomanconnect/settings/xerologenabled')) {
            Mage::log($msg, Zend_Log::DEBUG, self::LOG_FILE_NAME);
        }
    }

    /**
     * Respects the time zone
     *
     * @param string $path
     * @param        $storeId
     * @param string $format
     *
     * @return bool|string
     */
    protected function _getDateFromConfig($path, $storeId, $format)
    {
        $return = Mage::getStoreConfig($path, $storeId);
        return true === empty($return)
            ? false
            : Mage::app()->getLocale()->date($return)->toString($format);
    }

    /**
     * @param        $storeId
     * @param string $format
     *
     * @return bool|string
     */
    public function getOrderStartDate($storeId, $format = 'y-MM-dd')
    {
        return $this->_getDateFromConfig('foomanconnect/order/startdate', $storeId, $format);
    }

    /**
     * @param        $storeId
     * @param string $format
     *
     * @return bool|string
     */
    public function getCreditMemoStartDate($storeId, $format = 'y-MM-dd')
    {
        return $this->_getDateFromConfig('foomanconnect/creditmemo/startdate', $storeId, $format);
    }
}

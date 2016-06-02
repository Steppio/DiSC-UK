<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_DataSource_Abstract extends Mage_Core_Model_Abstract
{
    /**
     * @param Varien_Object $object
     * @param string        $field
     * @param bool          $base
     *
     * @return mixed
     */
    protected function getAmount(Varien_Object $object, $field, $base = false)
    {
        if ($base) {
            $field = 'base_' . $field;
        }
        $amount = $object->getDataUsingMethod($field);
        if (null === $amount) {
            $amount = 0;
        }
        return $amount;
    }

    /**
     * @param Varien_Object $object
     *
     * @return string
     */
    public function getCreatedAtAsUTC(Varien_Object $object)
    {
        $datetime = new DateTime($object->getCreatedAt());
        return $datetime->format('Y-m-d');
    }

    /**
     * @param Varien_Object $object
     *
     * @return string
     */
    public function getCreatedAtStore(Varien_Object $object)
    {
        $datetime = new DateTime($object->getCreatedAt());

        $timezone = Mage::getStoreConfig('general/locale/timezone', $object->getStoreId());
        if ($timezone) {
            $storeTime = new DateTimeZone($timezone);
            $datetime->setTimezone($storeTime);
        }

        return $datetime->format('Y-m-d');
    }

    /**
     * @param float $amount
     *
     * @return string
     */
    public function roundedAmount($amount)
    {
        return sprintf("%01.4f", round($amount, 2));
    }

    /**
     * @param string $eventName
     * @param Mage_Core_Model_Abstract $eventObject
     * @param array  $data
     *
     * @return mixed
     */
    protected function _dispatchEvent($eventName, Mage_Core_Model_Abstract $eventObject, array $data)
    {
        $transport = new Varien_Object();
        $transport->setDataUsingMethod($eventName . '_data', $data);
        Mage::dispatchEvent(
            'fooman_connect_datasource_' . $eventName,
            array(
                'transport' => $transport,
                $eventName  => $eventObject
            )
        );
        return $transport->getDataUsingMethod($eventName . '_data');
    }
}

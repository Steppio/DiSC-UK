<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

abstract class Fooman_Connect_Model_Abstract extends Mage_Core_Model_Abstract
{
    const PROCESS_PER_RUN = 50;

    /**
     * @param $xml
     * @param $storeId
     *
     * @return mixed
     */
    abstract public function sendToXero($xml, $storeId);

    /**
     * @return Fooman_Connect_Model_Xero_Api
     */
    public function getApi()
    {
        return Mage::getSingleton('foomanconnect/xero_api');
    }

    /**
     * @param string $eventName
     * @param string $eventObject
     * @param array  $data
     *
     * @return mixed
     */
    protected function _dispatchEvent($eventName, $eventObject, array $data)
    {
        $eventData = new Varien_Object($data);
        Mage::dispatchEvent('fooman_connect_model_' . $eventName, array($eventObject => $eventData));
        return $eventData->getData();
    }

    /**
     * @param string $permissionName
     *
     * @return bool|int
     */
    protected function _getSalesEntityViewId($permissionName)
    {
        if (true === Mage::getSingleton('admin/session')->isAllowed('sales/' . $permissionName . '/actions/view')
            && $this->getEntityId() > 0
        ) {
            return (int)$this->getEntityId();
        }
        return false;
    }

    protected function _handleError($status, $exception, $message, $object, $data)
    {
        $status->setXeroExportStatus(Fooman_Connect_Model_Status::ATTEMPTED_BUT_FAILED);
        $status->setXeroLastValidationErrors(json_encode($message));
        $status->save();

        Mage::logException($exception);

        Mage::helper('foomanconnect')->debug('-------------------------');
        Mage::helper('foomanconnect')->debug($object->debug());
        Mage::helper('foomanconnect')->debug($data);
        if ($exception instanceof Fooman_Connect_Exception) {
            Mage::helper('foomanconnect')->debug($exception->getXeroErrors());
            if (is_array($exception->getXeroErrors())) {
                $message = '<br/>Errors received from Xero: ' . implode('<br/>', $exception->getXeroErrors());
            }
        }
        Mage::helper('foomanconnect')->debug('-------------------------');
        Mage::throwException(sprintf('%s: Export did not succeed %s', $object->getIncrementId(), $message));
    }

    /**
     * @param $xml
     * @param $storeId
     *
     * @return array
     */
    public function sendPaymentToXero($xml, $storeId)
    {
        return $this->getApi()->setStoreId($storeId)->sendData(
            Fooman_Connect_Model_Xero_Api::PAYMENTS_PATH, Zend_Http_Client::PUT, $xml
        );
    }
}

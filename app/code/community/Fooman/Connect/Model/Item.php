<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_Item extends Fooman_Connect_Model_Abstract
{
    const ITEM_CODE_MAX_LENGTH = 30;
    const NAME_MAX_LENGTH = 50;

    protected function _construct()
    {
        $this->_init('foomanconnect/item');
    }

    public function ensureItemsExist($data, $storeId)
    {
        $this->queueSkus($data, $storeId);
        $this->exportItems($storeId);
    }

    public function queueSkus($data, $storeId)
    {
        foreach ($data['invoiceLines'] as $line) {
            if (isset($line['itemCode'])) {
                $this->setData(array());
                $this->setStoreId($storeId);
                $this->setItemCode($line['itemCode']);
                //$this->setDescription($line['name']);
                $this->setName(substr($line['name'], 0, self::NAME_MAX_LENGTH));
                $this->save();
            }
        }
    }

    public function exportItems($storeId, $all = false)
    {
        $collection = $this->getCollection();
        if (!$all) {
            $collection->getUnexportedItems();
        }
        if (count($collection)) {
            $data = $collection->toArray();
            try {
                $result = $this->sendToXero(
                    Fooman_ConnectLicense_Model_DataSource_Converter_ItemsXml::convert($data['items']),
                    $storeId
                );
                foreach ($result['Items'] as $item) {
                    $this->setData(array());
                    $this->setItemCode($item['Code']);
                    $this->setName($item['Name']);
                    $this->setXeroItemId($item['ItemID']);
                    $this->setXeroExportStatus(Fooman_Connect_Model_Status::EXPORTED);
                    $this->save();
                }
            } catch (Exception $e) {
                Mage::logException($e);
            }
        }
    }

    /**
     * @param $xml
     * @param $storeId
     *
     * @return array
     */
    public function sendToXero($xml, $storeId)
    {
        return $this->getApi()->setStoreId($storeId)->sendData(
            Fooman_Connect_Model_Xero_Api::ITEMS, Zend_Http_Client::POST, $xml
        );
    }
}

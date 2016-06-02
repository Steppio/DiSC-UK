<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Class Fooman_Connect_Model_DataSource_CreditmemoTotal
 * @method Mage_Sales_Model_Abstract getSalesObject()
 * @method Mage_Core_Model_Config_Element getTotal()
 * @method string getCode()
 */
class Fooman_Connect_Model_DataSource_CreditmemoTotal extends Fooman_Connect_Model_DataSource_Total
{

    protected $_toIgnore
        = array(
            'grand_total', 'subtotal', 'tax', 'discount'
        );

    protected function _getToIgnore()
    {
        return $this->_toIgnore;
    }

    public function getAdjustmentNegative($base)
    {
        if ($this->getAmount($this->getSalesObject(), (string)$this->getTotal()->source_field, $base) == 0) {
            return false;
        }
        $data                        = $this->_standardTotalData();
        $data['taxAmount']           = 0;
        $data['taxType']             = 'NONE';
        $data['price']               = -1 * $this->getAmount($this->getSalesObject(), (string)$this->getTotal()->source_field, $base);
        $data['unitAmount']          = -1 * $this->getAmount($this->getSalesObject(), (string)$this->getTotal()->source_field, $base);
        $data['lineTotalNoAdjust']   = -1 * $this->getAmount(
            $this->getSalesObject(), (string)$this->getTotal()->source_field, $base
        );
        $data['lineTotal']           = -1 * $this->getAmount(
            $this->getSalesObject(), (string)$this->getTotal()->source_field, $base
        );
        $data['xeroAccountCodeSale'] = Mage::getStoreConfig(
            'foomanconnect/xeroaccount/coderefunds', $this->getSalesObject()->getStoreId()
        );
        return array($this->_standardTotalId() => $data);
    }
}

<?php
/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/osl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * @category    Yoma
 * @package     Yoma_Realex
 * @copyright   Copyright (c) 2014 YOMA LIMITED (http://www.yoma.co.uk)
 * @license     http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */
class Yoma_Realex_Block_Adminhtml_Transaction_Detail_Grid extends Mage_Adminhtml_Block_Widget_Grid
{
    /**
     * Initialize default sorting and html ID
     */
    protected function _construct()
    {
        $this->setId('transactionDetailsGrid');
        $this->setPagerVisibility(false);
        $this->setFilterVisibility(false);
    }

    /**
     * Prepare collection for grid
     *
     * @return Mage_Adminhtml_Block_Widget_Grid
     */
    protected function _prepareCollection()
    {
        $collection = new Varien_Data_Collection();
        foreach ($this->getTransactionAdditionalInfo() as $key => $value) {
            $data = new Varien_Object(array('key' => $key, 'value' => $value));
            $collection->addItem($data);
        }

        $this->setCollection($collection);
        return parent::_prepareCollection();
    }

    /**
     * Add columns to grid
     *
     * @return Mage_Adminhtml_Block_Widget_Grid
     */
    protected function _prepareColumns()
    {
        $this->addColumn('key', array(
            'header'    => Mage::helper('realex')->__('Key'),
            'index'     => 'key',
            'sortable'  => false,
            'type'      => 'text',
            'width'     => '50%'
        ));

        $this->addColumn('value', array(
            'header'    => Mage::helper('realex')->__('Value'),
            'index'     => 'value',
            'sortable'  => false,
            'type'      => 'text',
            'escape'    => true
        ));

        return parent::_prepareColumns();
    }

    /**
     * Retrieve Transaction addtitional info
     *
     * @return array
     */
    public function getTransactionAdditionalInfo()
    {
        $info = Mage::registry('transaction_data')->getAdditionalInformation();
        return (is_array($info)) ? $info : array();
    }
}

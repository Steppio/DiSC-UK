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
class Yoma_Realex_Block_Adminhtml_Transaction_Detail extends Mage_Adminhtml_Block_Widget_Container
{
    /**
     * Transaction model
     *
     * @var Mage_Sales_Model_Order_Payment_Transaction
     */
    protected $_txn;

    /**
     * Add control buttons
     *
     */
    public function __construct()
    {
        parent::__construct();

        $this->_txn = Mage::registry('transaction_data');

        $backUrl = ($this->_txn->getOrderUrl()) ? $this->_txn->getOrderUrl() : $this->getUrl('*/*/');
        $this->_addButton('back', array(
            'label'   => Mage::helper('sales')->__('Back'),
            'onclick' => "setLocation('{$backUrl}')",
            'class'   => 'back'
        ));

    }

    /**
     * Retrieve header text
     *
     * @return string
     */
    public function getHeaderText()
    {
        return Mage::helper('realex')->__("Transaction # %s | %s", $this->_txn->getEntityId(), $this->formatDate($this->_txn->getCreatedAt(), Mage_Core_Model_Locale::FORMAT_TYPE_MEDIUM, true));
    }

    protected function _toHtml()
    {
        $this->setTxnIdHtml($this->escapeHtml($this->_txn->getTransactionReference()));


        if($this->_txn->getOrder()) {
            $this->setOrderIncrementIdHtml($this->escapeHtml($this->_txn->getOrder()->getIncrementId()));
        }else{
            $this->setOrderIncrementIdHtml('');
        }

        $this->setTxnTypeHtml($this->escapeHtml($this->_txn->getTransactionType()));

        $this->setOrderIdUrlHtml(
            $this->escapeHtml($this->getUrl('adminhtml/sales_order/view', array('order_id' => $this->_txn->getOrderId())))
        );


        $createdAt = (strtotime($this->_txn->getCreatedAt()))
            ? $this->formatDate($this->_txn->getCreatedAt(), Mage_Core_Model_Locale::FORMAT_TYPE_MEDIUM, true)
            : $this->__('N/A');
        $this->setCreatedAtHtml($this->escapeHtml($createdAt));

        return parent::_toHtml();
    }
}

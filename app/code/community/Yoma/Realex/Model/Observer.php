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
class Yoma_Realex_Model_Observer{

    protected $_paymentMethods = array('realexdirect','realvault','realexredirect');

    /**
     * Append payment block to sales order
     *
     * @param Varien_Event_Observer $observer
     */
    public function appendPaymentBlock(Varien_Event_Observer $observer)
    {
        $block = $observer->getEvent()->getBlock();
        $payment = $observer->getEvent()->getPayment();

        $blockType = 'core/template';
        if ($layout = Mage::helper('payment')->getLayout()) {
            $paymentInfoBlock = $layout->createBlock($blockType);
        }
        else {
            $className = Mage::getConfig()->getBlockClassName($blockType);
            $paymentInfoBlock = new $className;
        }

        $paymentData = Mage::getModel('realex/paymentInfo')
            ->getDataPairs($payment->getId());

        if(Mage::getConfig()->getModuleConfig('Yoma_RealexExtended')->is('active', 'true')){
            $observer = mage::getModel('realexExtended/observer');
            if(isset($observer)){
                $paymentData = $observer->appendRuleInfoPaymentBlock($payment,$paymentData);
            }
        }

        $paymentInfoBlock
            ->setPayment($payment)
            ->setPaymentInfo($paymentData)
            ->setTemplate('realex/payment/info/payment-info.phtml');

        $block->append($paymentInfoBlock);
    }

    public function appendSettleAmount(Varien_Event_Observer $observer){

    }

    /**
     * Save failed transaction data
     *
     * @param Varien_Event_Observer $observer
     * @return $this
     */
    public function quoteSubmitFailure(Varien_Event_Observer $observer){

        $order = $observer->getOrder();
        $payment = $order->getPayment();
        if(in_array($payment->getMethod(),$this->_paymentMethods)){
            $info = $payment->getMethodInstance();
            if($info && $info->getService()){

                $service = $info->getService();

                $transactionData = $service->getMethod()->getTransactionData();
                $transaction = Mage::getModel('realex/transaction')
                    ->setData(array(
                        'service_code' => $service->getMethodInstance()->getCode(),
                        'transaction_reference' => $service->getTransactionReference(),
                        'payment_id' => $payment->getId(),
                        'order_id' => $order->getIncrementId(),
                        'transaction_type' => $service->getTransactionType(),
                        'additional_information' => $transactionData,
                        'payment_amount' => $payment->getData('payment_amount'),
                        'remembertoken' => $payment->getData('remembertoken'),
                        'error_message' => $transactionData['message'],
                    ));

                $transaction->save();

            }
        }

        return $this;
    }

    /**
     * Add canel to payment review
     *
     * @param Varien_Event_Observer $event
     * @return $this
     */
    public function orderViewBefore(Varien_Event_Observer $event){

        $block = $event->getBlock();

        if ($block instanceof Mage_Adminhtml_Block_Sales_Order_View) {

            $order = $block->getOrder();
            if ($this->_isAllowedAction('cancel') && $order->canCancel()) {
                return $this;
            }else{
                if(in_array($order->getPayment()->getMethod(),$this->_paymentMethods) && $this->_canNotVoidOrder($order)){
                    $lastUpdated = date('Y-m-d H:i:s', strtotime("-1 hours"));
                    if($order->getUpdatedAt() <= $lastUpdated){

                        $block->removeButton('accept_payment');
                        $block->removeButton('deny_payment');

                        $message = Mage::helper('realex')->__('Are you sure you want to do this?');
                        $block->addButton('order_cancel', array(
                            'label'     => Mage::helper('sales')->__('Cancel'),
                            'onclick'   => 'deleteConfirm(\''.$message.'\', \'' . $block->getReviewPaymentUrl('deny') . '\')',
                        ));
                    }
                }
            }

        }

        return $this;
    }

    /**
     * Check if allowed order action
     *
     * @param string $action
     * @return mixed
     */
    protected function _isAllowedAction($action)
    {
        return Mage::getSingleton('admin/session')->isAllowed('sales/order/actions/' . $action);
    }

    /**
     * Check if can void order
     *
     * @param Mage_Sales_Model_Order$order
     * @return bool
     */
    protected function _canNotVoidOrder($order)
    {
        if ($order->canUnhold() || $order->isPaymentReview()) {
            return true;
        }
        return false;
    }

}

<?php
class Yoma_RealexRewrite_Model_Sales_Order_Payment extends Mage_Sales_Model_Order_Payment{

    protected $_allowedMethods = array('realexdirect','realvault');

    /**
     * Lookup an authorization transaction using parent transaction id, if set
     * @return Mage_Sales_Model_Order_Payment_Transaction|false
     */
    public function getAuthorizationTransaction()
    {
        if(in_array($this->getMethodInstance()->getCode(),$this->_allowedMethods)) {

            if ($this->getParentTransactionId()) {
                $txn = $this->_lookupTransaction($this->getParentTransactionId());
            } else {
                $txn = false;
            }

            if (!$txn) {
                $txn = $this->_lookupTransaction(false, Mage_Sales_Model_Order_Payment_Transaction::TYPE_AUTH);
            }

            if (!$txn) {
                $txn = $this->_lookupTransaction(false, Mage_Sales_Model_Order_Payment_Transaction::TYPE_CAPTURE);
            }

            return $txn;

        }else{
            return parent::getAuthorizationTransaction();
        }
    }

}
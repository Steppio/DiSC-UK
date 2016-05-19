<?php
class Yoma_RealexRewrite_Model_Sales_Order_Payment_Transaction extends Mage_Sales_Model_Order_Payment_Transaction {

    protected $_allowedMethods = array('realexdirect','realvault');

    public function closeAuthorization($shouldSave = true, $dryRun = false) {
        try {
            $this->_verifyThisTransactionExists();
        } catch (Exception $e) {
            if ($dryRun) {
                return false;
            }
            throw $e;
        }
        $authTransaction = false;
        switch ($this->getTxnType()) {
            case self::TYPE_VOID:
                // break intentionally omitted
            case self::TYPE_CAPTURE:
                $authTransaction = $this->getParentTransaction();
                if(in_array($this->getOrderPaymentObject()->getMethodInstance()->getCode(),$this->_allowedMethods)) {
                    $authTransaction = $this->getParentTransaction();
                    if(!$authTransaction){
                        $authTransaction = $this;
                    }
                }
                break;
            case self::TYPE_AUTH:
                $authTransaction = $this;
                break;
            // case self::TYPE_PAYMENT?
        }
        if ($authTransaction) {
            if (!$dryRun) {
                $authTransaction->close($shouldSave);
            }
        }

        return $authTransaction;
    }
}
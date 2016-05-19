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
class Yoma_Realex_Model_Resource_Tokencard_Collection extends Mage_Core_Model_Mysql4_Collection_Abstract {

    protected function _construct() {
        $this->_init('realex/tokencard');
    }

    /**
     * Filter by customer
     *
     * @param mixed $customer
     * @return $this
     */
    public function addCustomerFilter($customer) {

        if (is_string($customer)) {
            $this->addFieldToFilter('customer_id', $customer);
        } else if ($customer instanceof Mage_Customer_Model_Customer) {
            $this->addFieldToFilter('customer_id', $customer->getId());
        } elseif (is_numeric($customer)) {
            $this->addFieldToFilter('customer_id', $customer);
        } elseif (is_array($customer)) {
            $this->addFieldToFilter('customer_id', $customer);
        }

        return $this;
    }

    /**
     * Filter duplicates
     *
     * @param mixed $customer
     * @param string $lastFour
     * @param string $type
     * @param string $expireDate
     * @return $this
     */
    public function addDuplicateFilter($customer,$lastFour,$type,$expireDate){
        $this->addCustomerFilter($customer);
        $this->addFieldToFilter('last_four', $lastFour);
        $this->addFieldToFilter('card_type', $type);
        $this->addFieldToFilter('expiry_date', $expireDate);

        return $this;
    }

    /**
     * Filter active cards
     *
     * @param mixed $customer
     * @return $this
     */
    public function addActiveCardsByCustomerFilter($customer){
        $this->addCustomerFilter($customer);
        $this->addFieldToFilter('status', 1);

        return $this;

    }

    /**
     * Filter expiring cards
     *
     * @return $this
     */
    public function addExpiringFilter(){

        $this->addFieldToFilter('status', (int) 1)
            ->addFieldToFilter(
                new Zend_Db_Expr("str_to_date(expiry_date, '%m%y')"),
                    array('
                        from' => date("Y-m-d H:i:s"),
                        'to' => date("Y-m-d H:i:s", strtotime("+1 month"))
                    )
            );

        return $this;
    }
}
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
class Yoma_Realex_Model_SubAccountProcessor
{

    protected $_calculationTypes = array(
        'card_type' => '_stringCompare',
    );
    
  /*
     *
     * @param string $subAccount Default sub account value (to be used as fallback if no matches).
     * @param array $rules Array of rules to attempt to match specific sub account values.
     * @param array $filters Array of filters to match against each of the available rules.
     * @return string 
     * @author Joseph McDermott <joseph.mcdermott@ampersandcommerce.com>
     */
    public function process($subAccount, $rules, $filters,$payment)
    {
        // loop through all provided rules trying to find a match
        foreach ($rules as $_rule) {
            // initialise matched filters with sub_account
            $filtersMatched = array('sub_account' => true);
            
            // loop through all required criteria
            foreach ($filters as $_filterKey => $_filterValue) {
                // skip any filters called sub_account
                if ($_filterKey == 'sub_account') {
                    continue 2;
                }
                
                // does the rule have this filter defined
                if (!array_key_exists($_filterKey, $_rule)) {
                    continue 2;
                }
                
                // does the rule have a sub_account defined (should always be true)
                if (!array_key_exists('sub_account', $_rule)) {
                    continue 2;
                }
                
                // is the field type valid
                if (!array_key_exists($_filterKey, $this->_calculationTypes)) {
                    continue 2;
                }
                
                // finally, call the calculation method to see if the filter value matches
                $calculationMethod = $this->_calculationTypes[$_filterKey];
                if (!$this->$calculationMethod($_rule[$_filterKey], $_filterValue)) {
                    continue 2;
                }
                
                // increment matches
                $filtersMatched[$_filterKey] = true;
            }
            
            // check we matched all rules with the provided filters
            if (count($_rule) == count($filtersMatched)) {
                // we have a perfect match and dont need to examine any further rules
                $subAccount = $_rule['sub_account'];
                break;
            }
        }

        $transport = new Varien_Object();
        $transport->setSubAccount($subAccount);

        Mage::dispatchEvent('realex_process_subaccount_after', array('payment'=> $payment,'transport'=>$transport));

        return $transport->getSubAccount();
    }
    
    /**
     * Determine whether the provided strings are the same.
     *
     * @param string $ruleValue
     * @param string $filterValue
     * @return bool 
     * @author Joseph McDermott <joseph.mcdermott@ampersandcommerce.com>
     */
    protected function _stringCompare($ruleValue, $filterValue)
    {
        return strcmp($ruleValue, $filterValue) === 0;
    }
}
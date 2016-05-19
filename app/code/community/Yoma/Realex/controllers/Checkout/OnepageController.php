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
require_once('Mage/Checkout/controllers/OnepageController.php');
class Yoma_Realex_Checkout_OnepageController extends Mage_Checkout_OnepageController
{
    /**
     * Overide onestep checkout failure action
     *
     */
    public function failureAction()
    {

        $lastOrderId = $this->getOnepage()->getCheckout()->getLastOrderId();
        if (!$lastOrderId) {
            return parent::failureAction();
        }
        // reorder last cart
        try {
            $transaction = Mage::getModel('realex/transaction')
                ->loadByOrder($lastOrderId);
        } catch (Exception $e) {
            return parent::failureAction();
        }
        
        $helper = Mage::helper('realex/data');

        $helper->reorder($lastOrderId);
        
        return parent::failureAction();
    }
}
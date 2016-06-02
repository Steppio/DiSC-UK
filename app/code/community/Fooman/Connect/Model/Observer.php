<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_Observer
{

    public function adminhtmlBlockHtmlBefore($observer)
    {

        if (Mage::helper('foomanconnect/config')->isConfigured()) {
            $block = $observer->getEvent()->getBlock();
            if ($block instanceof Mage_Adminhtml_Block_Tax_Rate_Form) {
                $this->_addXeroRateSelect($block);
            }

            if ($block instanceof Mage_Adminhtml_Block_Customer_Group_Edit_Form) {
                $this->_addTrackingSelect($block);
            }
        }
    }

    public function customerGroupSaveCommitAfter($observer)
    {
        $group = $observer->getEvent()->getObject();
        $tracking = Mage::getModel('foomanconnect/tracking_rule')->loadCustomerGroupRule($group->getId());
        $tracking->setType(Fooman_Connect_Model_Tracking_Rule::TYPE_GROUP);
        $tracking->setSourceId($group->getId());


        $newTracking = (string)Mage::app()->getRequest()->getParam('fooman_xero_tracking');
        if ($newTracking) {
            list($trackingCatId, $trackingName, $trackingOption) = explode('|', $newTracking);
            $tracking->setTrackingCategoryId($trackingCatId);
            $tracking->setTrackingName($trackingName);
            $tracking->setTrackingOption($trackingOption);
        } else {
            $tracking->setTrackingCategoryId('');
            $tracking->setTrackingName('');
            $tracking->setTrackingOption('');
        }

        $tracking->save();

    }

    /**
     * @param $block
     */
    protected function _addXeroRateSelect($block)
    {
        $form = $block->getForm();

        $fieldset = $form->getElement('foomanconnect_fieldset');
        if (!$fieldset) {
            $fieldset = $block->getForm()->addFieldset(
                'foomanconnect_fieldset', array('legend' => Mage::helper('foomanconnect')->__('Fooman Connect'))
            );
        }

        $taxRate = Mage::getSingleton('tax/calculation_rate');

        $fieldset->addField(
            'xero_rate', 'select',
            array(
                'name'     => "xero_rate",
                'label'    => Mage::helper('foomanconnect')->__('Xero Rate'),
                'title'    => Mage::helper('foomanconnect')->__('Xero Rate'),
                'value'    => $taxRate->getXeroRate(),
                'values'   => Mage::getModel('foomanconnect/system_taxOptions')->getTaxRatesForAllStores(),
                'required' => true,
                'class'    => 'required-entry'
            )
        );

        $fieldset->addField(
            'xero_sales_account_code', 'select',
            array(
                'name'     => "xero_sales_account_code",
                'label'    => Mage::helper('foomanconnect')->__('Xero Sales Account Code'),
                'title'    => Mage::helper('foomanconnect')->__('Xero Sales Account Code'),
                'value'    => $taxRate->getXeroSalesAccountCode(),
                'values'   => Mage::getModel('foomanconnect/system_salesProductAccountOptions')->getAllOptions(),
                'required' => false
            )
        );
    }

    /**
     * @param $block
     */
    protected function _addTrackingSelect($block)
    {

        $form = $block->getForm();

        $fieldset = $form->getElement('foomanconnect_fieldset');
        if (!$fieldset) {
            $fieldset = $block->getForm()->addFieldset(
                'foomanconnect_fieldset', array('legend' => Mage::helper('foomanconnect')->__('Fooman Connect'))
            );
        }

        $fieldset->addField(
            'customer_group_fooman_xero_tracking', 'select',
            array(
                'name'     => "fooman_xero_tracking",
                'label'    => Mage::helper('foomanconnect')->__('Xero Tracking Category'),
                'title'    => Mage::helper('foomanconnect')->__('Xero Tracking Category'),
                'value'    => $this->_getCurrentGroupTrackingValue(Mage::registry('current_group')->getId()),
                'values'   => Mage::getModel('foomanconnect/system_trackingOptions')->toOptionArray(true),
                'required' => false
            )
        );
    }

    protected function _getCurrentGroupTrackingValue($groupId)
    {
        $tracking = Mage::getModel('foomanconnect/tracking_rule')->loadCustomerGroupRule($groupId);
        if ($tracking) {
            return $tracking->getTrackingCategoryId() . '|' . $tracking->getTrackingName() . '|'
            . $tracking->getTrackingOption();
        } else {
            return '0';
        }
    }


}

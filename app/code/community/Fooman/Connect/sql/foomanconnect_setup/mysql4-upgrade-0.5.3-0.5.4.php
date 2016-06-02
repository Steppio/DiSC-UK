<?php
/** @var Fooman_Connect_Model_Resource_Setup $installer */
$installer = $this;

$installer->startSetup();

$installer->addAttribute('catalog_product', 'xero_sales_account_code', array(
    'group' => 'General',
    'input' => 'select',
    'visible_on_front' => 0,
    'label' => 'Xero Sales Account Code',
    'required' => 0,
    'source' => 'foomanconnect/system_salesProductAccountOptions')
);

$date = Mage::getSingleton('core/date')->gmtDate();
Mage::getModel('core/config_data')
        ->setPath(Fooman_Connect_Helper_Config::XML_PATH_CONNECT_SETTINGS . 'xerocreditmemostartdate')
        ->setValue($date)
        ->save();
$installer->endSetup();

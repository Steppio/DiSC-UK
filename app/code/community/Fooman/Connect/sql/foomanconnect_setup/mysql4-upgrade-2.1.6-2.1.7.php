<?php
/** @var Fooman_Connect_Model_Resource_Setup $installer */
$installer = $this;

$installer->startSetup();
$installer->updateAttribute('catalog_product', 'xero_sales_account_code', 'is_global', false);
$installer->endSetup();

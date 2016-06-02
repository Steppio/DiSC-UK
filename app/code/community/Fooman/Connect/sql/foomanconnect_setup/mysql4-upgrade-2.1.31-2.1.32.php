<?php

$installer = $this;

$installer->startSetup();

$installer->getConnection()->addColumn(
    $installer->getTable('tax_calculation_rate'), 'xero_sales_account_code', "varchar(255) after `xero_rate`"
);
$installer->endSetup();



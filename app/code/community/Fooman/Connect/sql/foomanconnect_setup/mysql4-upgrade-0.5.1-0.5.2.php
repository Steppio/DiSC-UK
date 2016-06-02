<?php

$installer = $this;

$installer->startSetup();
$installer->getConnection()->addColumn(
    $installer->getTable('sales_flat_order_item'), 'xero_rate', "varchar(255) after `tax_percent`"
);

$installer->run("
        UPDATE `{$this->getTable('sales/order_item')}`SET `xero_rate`= NULL
        WHERE `tax_amount` = '0' AND `xero_rate` IS NOT NULL");

$installer->endSetup();



<?php

$installer = $this;

$installer->startSetup();

$installer->getConnection()->addColumn(
    $installer->getTable('tax_calculation_rate'), 'xero_rate', "varchar(255) after `rate`"
);
$installer->endSetup();



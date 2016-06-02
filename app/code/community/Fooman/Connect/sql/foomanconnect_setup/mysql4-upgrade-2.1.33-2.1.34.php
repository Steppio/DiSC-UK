<?php
/* @var $installer Fooman_Connect_Model_Resource_Setup */
$installer = $this;

$installer->startSetup();

$installer->getConnection()->addColumn(
    $installer->getTable('foomanconnect/item'),
    'name',
    "varchar(50) COMMENT 'Name'"
);

$installer->endSetup();

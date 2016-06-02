<?php
/* @var $installer Fooman_Connect_Model_Resource_Setup */
$installer = $this;

$installer->startSetup();
$table = $installer->getConnection()
    ->newTable($installer->getTable('foomanconnect/item'))
    ->addColumn(
        'item_code',
        Varien_Db_Ddl_Table::TYPE_VARCHAR,
        30,
        array(
            'nullable' => false,
            'primary'  => true,
        ),
        'Item Code'
    )
    ->addColumn(
        'description',
        Varien_Db_Ddl_Table::TYPE_VARCHAR,
        255,
        array(
            'nullable' => true,
        ),
        'Description'
    )
    ->addColumn(
        'xero_item_id',
        Varien_Db_Ddl_Table::TYPE_VARCHAR,
        255,
        array(
            'nullable' => true,
        ),
        'Xero Item Id'
    )
    ->addColumn(
        'xero_export_status',
        Varien_Db_Ddl_Table::TYPE_SMALLINT,
        null,
        array(
            'nullable' => true,
            'default'  =>0
        ),
        'Xero Export Status'
    );

$installer->getConnection()->createTable($table);

//Varien_Db_Ddl_Table::TYPE_TEXT is not consistently available across versions
$installer->getConnection()->addColumn(
    $installer->getTable('foomanconnect/item'),
    'xero_last_validation_errors',
    "text COMMENT 'Xero Last Validation Errors'"
);

$installer->endSetup();

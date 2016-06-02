<?php
/* @var $installer Fooman_Connect_Model_Resource_Setup */
$installer = $this;

$installer->startSetup();
$table = $installer->getConnection()
    ->newTable($installer->getTable('foomanconnect/invoice'))
    ->addColumn(
        'invoice_id',
        Varien_Db_Ddl_Table::TYPE_INTEGER,
        10,
        array(
            'nullable'  => false,
            'primary'   => true,
            'unsigned'  => true
        ),
        'Invoice Id'
    )
    ->addColumn(
        'xero_invoice_id',
        Varien_Db_Ddl_Table::TYPE_VARCHAR,
        255,
        array(
            'nullable' => true,
        ),
        'Xero Invoice Id'
    )
    ->addColumn(
        'xero_invoice_number',
        Varien_Db_Ddl_Table::TYPE_VARCHAR,
        255,
        array(
            'nullable' => true,
        ),
        'Xero Invoice Number'
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
    )
    ->addForeignKey(
        'FK_FOOMANCONNECT_INVOICE_INVOICE_ID_SALES_FLAT_INVOICE_ENTITY_ID',
        'invoice_id',
        $installer->getTable('sales/invoice'),
        'entity_id',
        Varien_Db_Ddl_Table::ACTION_CASCADE,
        Varien_Db_Ddl_Table::ACTION_CASCADE
    );

$installer->getConnection()->createTable($table);

//Varien_Db_Ddl_Table::TYPE_TEXT is not consistently available across versions
$installer->getConnection()->addColumn(
    $installer->getTable('foomanconnect/invoice'), 'xero_last_validation_errors', 'text'
);

$installer->endSetup();

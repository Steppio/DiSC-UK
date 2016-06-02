<?php
/* @var $installer Fooman_Connect_Model_Resource_Setup */
$installer = $this;

$installer->startSetup();
$table = $installer->getConnection()
    ->newTable($installer->getTable('foomanconnect/creditmemo'))
    ->addColumn(
        'creditmemo_id',
        Varien_Db_Ddl_Table::TYPE_INTEGER,
        10,
        array(
            'nullable'  => false,
            'primary'   => true,
            'unsigned'  => true
        ),
        'Creditmemo Id'
    )
    ->addColumn(
        'xero_creditnote_id',
        Varien_Db_Ddl_Table::TYPE_VARCHAR,
        255,
        array(
            'nullable' => true,
        ),
        'Xero Credit Note Id'
    )
    ->addColumn(
        'xero_creditnote_number',
        Varien_Db_Ddl_Table::TYPE_VARCHAR,
        255,
        array(
            'nullable' => true,
        ),
        'Xero Credit Note Number'
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
        //getFkName is mage 1.6+
        //$installer->getFkName('foomanconnect/creditmemo', 'creditmemo_id', 'sales/creditmemo', 'entity_id'),
        'FK_0BCB942C08F38DF4DC2430D6B853B115',
        'creditmemo_id',
        $installer->getTable('sales/creditmemo'),
        'entity_id',
        Varien_Db_Ddl_Table::ACTION_CASCADE,
        Varien_Db_Ddl_Table::ACTION_CASCADE
    );

$installer->getConnection()->createTable($table);
//Varien_Db_Ddl_Table::TYPE_TEXT is not consistently available across versions
$installer->getConnection()->addColumn(
    $installer->getTable('foomanconnect/creditmemo'), 'xero_last_validation_errors', 'text'
);

$installer->endSetup();

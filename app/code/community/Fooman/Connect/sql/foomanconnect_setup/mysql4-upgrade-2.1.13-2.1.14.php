<?php
/* @var $installer Fooman_Connect_Model_Resource_Setup */
$installer = $this;

$installer->startSetup();
$table = $installer->getConnection()
    ->newTable($installer->getTable('foomanconnect/tracking_rule'))
    ->addColumn(
        'rule_id',
        Varien_Db_Ddl_Table::TYPE_INTEGER,
        10,
        array(
            'identity'  => true,
            'nullable'  => false,
            'primary'   => true,
            'unsigned'  => true
        ),
        'Rule Id'
    )
    ->addColumn(
        'type',
        Varien_Db_Ddl_Table::TYPE_VARCHAR,
        30,
        array(),
        'Rule Type'
    )
    ->addColumn(
        'source_id',
        Varien_Db_Ddl_Table::TYPE_INTEGER,
        10,
        array(
            'nullable'  => false,
            'unsigned'  => true
        ),
        'Source Id'
    )
    ->addColumn(
        'store_id',
        Varien_Db_Ddl_Table::TYPE_SMALLINT,
        null,
        array(
            'unsigned'  => true,
            'nullable'  => false
        ),
        'Store Id'
    )
    ->addColumn(
        'tracking_category_id',
        Varien_Db_Ddl_Table::TYPE_VARCHAR,
        255,
        array(
            'nullable' => true,
        ),
        'Tracking Category Id'
    )
    ->addColumn(
        'tracking_name',
        Varien_Db_Ddl_Table::TYPE_VARCHAR,
        255,
        array(
            'nullable' => true,
        ),
        'Tracking Name'
    )
    ->addColumn(
        'tracking_option',
        Varien_Db_Ddl_Table::TYPE_VARCHAR,
        255,
        array(
            'nullable' => true,
        ),
        'Tracking Option'
    )
    ->addColumn(
        'sort_order',
        Varien_Db_Ddl_Table::TYPE_INTEGER,
        null,
        array(
            'nullable' => true,
            'default'  =>0
        ),
        'Sort Order'
    )
    ->addForeignKey(
    //getFkName is mage 1.6+
    //$installer->getFkName('foomanconnect/tracking_rule', 'store_id', 'core/store', 'store_id'),
        'FK_FOOMANCONNECT_TRACKING_RULE_STORE_ID_CORE_STORE_STORE_ID',
        'store_id',
        $installer->getTable('core/store'),
        'store_id',
        Varien_Db_Ddl_Table::ACTION_CASCADE,
        Varien_Db_Ddl_Table::ACTION_CASCADE
    );

$installer->getConnection()->createTable($table);

$installer->endSetup();

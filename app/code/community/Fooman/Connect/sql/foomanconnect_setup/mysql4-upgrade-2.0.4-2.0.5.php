<?php
/* @var $installer Fooman_Connect_Model_Resource_Setup */
$installer = $this;

$installer->startSetup();
/*
not fully supported on older versions
$installer->getConnection()->addColumn(
    $installer->getTable('foomanconnect/item'),
    'store_id',
    Varien_Db_Ddl_Table::TYPE_SMALLINT, null, array(
        'unsigned' => true,
        'nullable' => false,
    ), 'Store Id'
);
$installer->getConnection()->addForeignKey(
    'FK_FOOMANCONNECT_ITEM_STORE_ID_CORE_STORE_STORE_ID',
    $installer->getTable('foomanconnect/item')
    'store_id',
    $installer->getTable('core/store'),
    'store_id',
    Varien_Db_Ddl_Table::ACTION_CASCADE,
    Varien_Db_Ddl_Table::ACTION_CASCADE
);
 */

$installer->getConnection()->addColumn(
    $installer->getTable('foomanconnect/item'),
    'store_id',
    "smallint(5) unsigned DEFAULT NULL COMMENT 'Store Id'"
);

$installer->run("
ALTER TABLE {$installer->getTable('foomanconnect/item')}
    ADD CONSTRAINT `FK_FOOMANCONNECT_ITEM_STORE_ID_CORE_STORE_STORE_ID` FOREIGN KEY (`store_id`)
    REFERENCES {$installer->getTable('core_store')} (`store_id`)
        ON UPDATE CASCADE
        ON DELETE CASCADE;
");
$installer->endSetup();

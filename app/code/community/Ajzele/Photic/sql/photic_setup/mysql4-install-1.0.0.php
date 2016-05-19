<?php

$installer = $this;
/* @var $installer Mage_Catalog_Model_Resource_Eav_Mysql4_Setup */

$installer->startSetup();

/**
 * Add some custom made attribute to the product
 */
$attributeCode = 'ajzele_photic3';
$productTypes = 'simple';

$installer->addAttribute('catalog_product', $attributeCode, array(
        'group'             => 'Images',
        'type'              => 'text',
        'backend'           => '',
        'frontend'          => '',
        'label'             => 'Ajzele | Photic',
        'input'             => 'textarea',
        'class'             => '',
        'source'            => '',
        'global'            => Mage_Catalog_Model_Resource_Eav_Attribute::SCOPE_GLOBAL,
        'visible'           => false,
        'required'          => false,
        'user_defined'      => true,
        'default'           => '',
        'searchable'        => false,
        'filterable'        => false,
        'comparable'        => false,
        'visible_on_front'  => false,
        'unique'            => false,
        'apply_to'          => '',
        'is_configurable'   => false
    ));

$fieldList = array(
    'price',
    'special_price',
    'special_from_date',
    'special_to_date',
    'minimal_price',
    'cost',
    'tier_price',
    'weight',
    'tax_class_id',
	$attributeCode,
);

foreach ($fieldList as $field) {
    $applyTo = split(',', $installer->getAttribute('catalog_product', $field, 'apply_to'));
    if (!in_array($productTypes, $applyTo)) {
        $applyTo[] = $productTypes;
        $installer->updateAttribute('catalog_product', $field, 'apply_to', join(',', $applyTo));
    }
}

$baseTableName = 'photic_mapper';

$sql = "
DROP TABLE IF EXISTS {$this->getTable($baseTableName)};
CREATE TABLE {$this->getTable($baseTableName)} (
  `mapper_id` int(11) NOT NULL AUTO_INCREMENT,
  `option_value_id` int(11) DEFAULT NULL,
  `image` text,
  `thumb_rel_path` text,
  `thumb_abs_path` text,
  PRIMARY KEY (`mapper_id`)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
";

$installer->run($sql);

$installer->endSetup();
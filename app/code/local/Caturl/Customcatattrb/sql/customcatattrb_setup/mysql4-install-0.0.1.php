<?php
$installer = $this;
$installer->startSetup();
$attribute  = array(
    'type' => 'text',
    'label'=> 'Alternative URL',
    'input' => 'textarea',
    'global' => Mage_Catalog_Model_Resource_Eav_Attribute::SCOPE_GLOBAL,
    'visible' => true,
    'required' => false,
    'user_defined' => true,
    'default' => "",
    'group' => "General Information"
);
$installer->addAttribute('catalog_category', 'alternative_url', $attribute);
$installer->endSetup();
?>
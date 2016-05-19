<?php
/**
 *  Webshopapps Shipping Module
 *
 * @category   Webshopapps
 * @package    Webshopapps_Productrate
 * @copyright  Copyright (c) 2012 Zowta Ltd (http://www.webshopapps.com)
 * @license    http://www.webshopapps.com/license/license.txt - Commercial license
 * @author     Karen Baker <sales@webshopapps.com>
*/
$installer = $this;

$installer->startSetup();

$installer->run("


select @entity_type_id:=entity_type_id from {$this->getTable('eav_entity_type')} where entity_type_code='catalog_product';


insert ignore into {$this->getTable('eav_attribute')} 
    set entity_type_id 	= @entity_type_id,
    	attribute_code 	= 'shipping_price',
    	backend_type	= 'decimal',
    	frontend_input	= 'price',
    	is_required	= 0,
    	is_user_defined	= 1,
    	frontend_label	= 'Shipping Price';
    	
select @attribute_id:=attribute_id from {$this->getTable('eav_attribute')} where frontend_label='Shipping Price';


insert ignore into {$this->getTable('catalog_eav_attribute')} 
    set attribute_id 	= @attribute_id,
    	used_in_product_listing	= 0,
    	is_filterable_in_search	= 0,
    	is_global	= 0;	
	

insert ignore into {$this->getTable('eav_attribute')}
    set entity_type_id 	= @entity_type_id,
    	attribute_code 	= 'shipping_is_percent',
    	backend_type	= 'int',
    	frontend_input	= 'boolean',
      	is_user_defined	= 1,
   		is_required	= 0,
    	frontend_label	= 'Calculate additional using percentages (default is price)';

select @attribute_id:=attribute_id from {$this->getTable('eav_attribute')} where attribute_code='shipping_is_percent';

insert ignore into {$this->getTable('catalog_eav_attribute')} 
    set attribute_id 	= @attribute_id,
    	used_in_product_listing	= 0,
    	is_filterable_in_search	= 0,
    	is_global	= 0;	

insert ignore into {$this->getTable('eav_attribute')}
    set entity_type_id 	= @entity_type_id,
    	attribute_code 	= 'shipping_addon',
    	backend_type	= 'varchar',
        is_user_defined	= 1,
    	frontend_input	= 'text',
    	is_required	= 0,
    	frontend_label	= 'Increment for subsequent Items (Price or Percentage)';

select @attribute_id:=attribute_id from {$this->getTable('eav_attribute')} where attribute_code='shipping_addon';

insert ignore into {$this->getTable('catalog_eav_attribute')} 
    set attribute_id 	= @attribute_id,
    	used_in_product_listing	= 0,
    	is_filterable_in_search	= 0,
    	is_global	= 0;	
	

");


$entityTypeId = $installer->getEntityTypeId('catalog_product');

$attributeSetArr = $installer->getConnection()->fetchAll("SELECT attribute_set_id FROM {$this->getTable('eav_attribute_set')} WHERE entity_type_id={$entityTypeId}");

$attributeId = array($installer->getAttributeId($entityTypeId,'shipping_price'),
					$installer->getAttributeId($entityTypeId,'shipping_is_percent'),
					$installer->getAttributeId($entityTypeId,'shipping_addon'));


foreach( $attributeSetArr as $attr)
{	
	$attributeSetId= $attr['attribute_set_id'];
	
	$installer->addAttributeGroup($entityTypeId,$attributeSetId,'Shipping','99');
	
	$attributeGroupId = $installer->getAttributeGroupId($entityTypeId,$attributeSetId,'Shipping');
	
	foreach($attributeId as $att){
	
	$installer->addAttributeToGroup($entityTypeId,$attributeSetId,$attributeGroupId,$att,'99');	
	}

};


$installer->endSetup();



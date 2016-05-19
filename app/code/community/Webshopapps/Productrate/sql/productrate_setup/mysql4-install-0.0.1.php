<?php

$installer = $this;

$installer->startSetup();

$installer->run("

select @entity_type_id:=entity_type_id from {$this->getTable('eav_entity_type')} where entity_type_code='catalog_product';
select @attribute_set_id:=attribute_set_id from {$this->getTable('eav_attribute_set')} where entity_type_id=@entity_type_id  and attribute_set_name='Default';


insert ignore into {$this->getTable('eav_attribute')} 
    set entity_type_id 	= @entity_type_id,
    	attribute_code 	= 'shipping_price',
    	backend_type	= 'decimal',
    	frontend_input	= 'price',
    	is_required	= 0,
    	is_user_defined	= 1,
    	frontend_label	= 'Shipping Price';
    	
select @attribute_id:=attribute_id from {$this->getTable('eav_attribute')} where frontend_label='Shipping Price';
    	

insert ignore into {$this->getTable('eav_attribute_group')} 
    set attribute_set_id 	= @attribute_set_id,
    	attribute_group_name	= 'Shipping',
    	sort_order		= 99;

select @attribute_group_id:=attribute_group_id from {$this->getTable('eav_attribute_group')} where attribute_group_name='Shipping' and attribute_set_id=@attribute_set_id;

insert ignore into {$this->getTable('catalog_eav_attribute')} 
    set attribute_id 	= @attribute_id,
    	used_in_product_listing	= 1,
    	is_filterable_in_search	= 1,
    	is_global	= 0;	
	

insert ignore into {$this->getTable('eav_entity_attribute')} 
    set entity_type_id 		= @entity_type_id,
    	attribute_set_id 	= @attribute_set_id,
    	attribute_group_id	= @attribute_group_id,
    	attribute_id		= @attribute_id;

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
    	used_in_product_listing	= 1,
    	is_filterable_in_search	= 1,
    	is_global	= 0;	


insert ignore into {$this->getTable('eav_entity_attribute')}
    set entity_type_id 		= @entity_type_id,
    	attribute_set_id 	= @attribute_set_id,
    	attribute_group_id	= @attribute_group_id,
    	attribute_id		= @attribute_id;

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
    	used_in_product_listing	= 1,
    	is_filterable_in_search	= 1,
    	is_global	= 0;	
	
replace into {$this->getTable('eav_entity_attribute')}
    set entity_type_id 		= @entity_type_id,
    	attribute_set_id 	= @attribute_set_id,
    	attribute_group_id	= @attribute_group_id,
    	attribute_id		= @attribute_id;


");

$installer->endSetup();



<?php

$installer = $this;

$installer->startSetup();

$installer->run("

-- DROP TABLE IF EXISTS {$this->getTable('slider')};
CREATE TABLE IF NOT EXISTS {$this->getTable('slider')} (
  `slider_id` int(11) unsigned NOT NULL auto_increment,
  `title` varchar(255) NOT NULL default '',
  `slider_url` varchar(255) NOT NULL default '', 
  `filename` varchar(255) NOT NULL default '',
  `sortorder` int(11) NOT NULL default '0',
  `status` smallint(6) NOT NULL default '0',
  `content` text NULL default '',
  `created_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`slider_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- DROP TABLE IF EXISTS `{$this->getTable('slider_store')}`;
CREATE TABLE `{$this->getTable('slider_store')}` (
  `slider_id` int(10) unsigned NOT NULL,
  `store_id` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`slider_id`,`store_id`),
  CONSTRAINT `FK_SLIDER_SLIDER_STORE_SLIDER` FOREIGN KEY (`slider_id`) REFERENCES `{$this->getTable('slider')}` (`slider_id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `FK_SLIDER_SLIDER_STORE_STORE` FOREIGN KEY (`store_id`) REFERENCES `{$this->getTable('core/store')}` (`store_id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='SLIDER items to Stores';


");

$installer->endSetup();
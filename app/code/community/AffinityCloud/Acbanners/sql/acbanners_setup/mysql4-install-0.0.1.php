<?php
 
$installer = $this;
 
$installer->startSetup();
 
$installer->run("
 
-- DROP TABLE IF EXISTS {$this->getTable('acbanners')};
CREATE TABLE {$this->getTable('acbanners')} (
  `id` int(11) unsigned NOT NULL auto_increment,
  `title` varchar(255) NOT NULL default '',
  `image` varchar(255) NOT NULL default '',
  `description` varchar(255) NOT NULL default '',
  `url` varchar(255) NOT NULL default '',
  `sort_order` int(10) NOT NULL default '0',
  `status` smallint(6) NOT NULL default '0',
  `created_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
 
-- DROP TABLE IF EXISTS {$this->getTable('acbannerbuttons')};
CREATE TABLE {$this->getTable('acbannerbuttons')} (
  `id` int(11) unsigned NOT NULL auto_increment,
  `title` varchar(255) NOT NULL default '',
  `image` varchar(255) NOT NULL default '',
  `description` varchar(255) NOT NULL default '',
  `url` varchar(255) NOT NULL default '',
  `colour` varchar(255) NOT NULL default '',
  `sort_order` int(10) NOT NULL default '0',
  `status` smallint(6) NOT NULL default '0',
  `created_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
 
-- DROP TABLE IF EXISTS {$this->getTable('acsidebanners')};
CREATE TABLE {$this->getTable('acsidebanners')} (
  `id` int(11) unsigned NOT NULL auto_increment,
  `title` varchar(255) NOT NULL default '',
  `image` varchar(255) NOT NULL default '',
  `description` varchar(255) NOT NULL default '',
  `url` varchar(255) NOT NULL default '',
  `sort_order` int(10) NOT NULL default '0',
  `status` smallint(6) NOT NULL default '0',
  `created_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
 
    ");
 
$installer->endSetup();
<?php
/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/osl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * @category    Yoma
 * @package     Yoma_Realex
 * @copyright   Copyright (c) 2014 YOMA LIMITED (http://www.yoma.co.uk)
 * @license     http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

$installer = $this;

$setup = new Mage_Catalog_Model_Resource_Eav_Mysql4_Setup('core_setup');

$connection = $setup->getConnection();

$installer->startSetup();

/* install create realex/transaction table */
$installer->run("
CREATE TABLE IF NOT EXISTS  `{$this->getTable('realex/transaction')}` (
  `entity_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `service_code` varchar(255) NOT NULL,
  `transaction_reference` varchar(255) NOT NULL,
  `payment_id` int(10) NOT NULL,
  `order_id` int(10) NOT NULL,
  `additional_information` text,
  `transaction_type` varchar(20) DEFAULT NULL,
  `payment_amount` decimal(12,4) DEFAULT NULL,
  `error_message` text,
  `remembertoken` int(11) DEFAULT NULL,
  PRIMARY KEY (`entity_id`),
  UNIQUE KEY `service_code` (`service_code`,`transaction_reference`),
  KEY `transaction_reference` (`transaction_reference`),
  KEY `payment_id` (`payment_id`),
  KEY `order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
");

/* install 1-2 create realex/paymentInfo table */
$installer->run("
CREATE TABLE IF NOT EXISTS `{$this->getTable('realex/paymentInfo')}` (
    `entity_id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL,
    `payment_id` VARCHAR(255) NOT NULL,
    `field` VARCHAR(255) NOT NULL,
    `value` TEXT NOT NULL,
    PRIMARY KEY (`entity_id`),
    INDEX (`payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
");

/* install 2-4 create realex/tokencard table */
$installer->run("
CREATE TABLE IF NOT EXISTS `{$this->getTable('realex/tokencard')}` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `customer_id` int(10) unsigned NOT NULL,
  `visitor_session_id` varchar(255),
  `token` varchar(38),
  `status` varchar(15),
  `card_type` varchar(255),
  `last_four` varchar(4),
  `expiry_date` varchar(4),
  `status_detail` varchar(255),
  `is_default` tinyint(1) unsigned NOT NULL default '0',
  `payer_ref` varchar(200),
  `ch_name` varchar(255),
  `magento_card_type` varchar(200),
  `payment_code` varchar(200),
  PRIMARY KEY  (`id`)
) ENGINE=MYISAM DEFAULT CHARSET=utf8;
");


/* install 4-5 create attributes to sales_flat_quote_payment */
try{
    $connection->addColumn($this->getTable('sales_flat_quote_payment'), 'realex_token_cc_id', 'int(11)');
    $setup->addAttribute('quote_payment', 'remembertoken', array());

}catch(Exception $ex){
    mage::logException($ex);
}

try{
    $connection->addColumn($this->getTable('sales_flat_quote_payment'), 'remembertoken', 'int(11)');
    $setup->addAttribute('quote_payment', 'realex_token_cc_id', array());

}catch(Exception $ex){
    mage::logException($ex);
}

try{
    $connection->addColumn($this->getTable('sales_flat_order_payment'), 'realex_token_cc_id', 'int(11)');
    $setup->addAttribute('order_payment', 'realex_token_cc_id', array());

}catch(Exception $ex){
    mage::logException($ex);
}

try{
    $connection->addColumn($this->getTable('sales_flat_order_payment'), 'remembertoken', 'int(11)');
    $setup->addAttribute('order_payment', 'remembertoken', array());

}catch(Exception $ex){
    mage::logException($ex);
}

try{
    $installer->run("
        ALTER TABLE sales_flat_invoice ADD COLUMN settle_positive DECIMAL(12,4) NULL;
    ");

    $installer->run("
      ALTER TABLE sales_flat_invoice ADD COLUMN base_settle_positive DECIMAL(12,4) NULL;
    ");

    $installer->run("
      ALTER TABLE sales_flat_creditmemo ADD COLUMN base_rebate_positive DECIMAL(12,4) NULL;
      ALTER TABLE sales_flat_creditmemo ADD COLUMN rebate_positive DECIMAL(12,4) NULL;
  ");

}catch(Exception $ex){
    mage::logException($ex);
}

try{
    $setup->addAttribute('customer', 'realex_payer_ref', array(
        'label'         => 'RealVault Payer Reference',
        'type'          => 'varchar',
        'input'         => 'text',
        'global' => 1,
        'visible' => 1,
        'required' => 0,
        'user_defined' => 0,
        'default' => '',
        'visible_on_front' => 0,
        'source' =>   NULL,
        'comment' => 'Realex RealVault Payer Reference',
        'position'      => 9999
    ));
}catch(Exception $ex){
    mage::logException($ex);
}

$installer->endSetup();
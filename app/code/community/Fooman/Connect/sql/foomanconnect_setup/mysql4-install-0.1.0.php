<?php

$installer = $this;

$installer->startSetup();

$date = Mage::getSingleton('core/date')->gmtDate();
Mage::getModel('core/config_data')
        ->setPath(Fooman_Connect_Helper_Config::XML_PATH_CONNECT_SETTINGS . 'xeroorderstartdate')
        ->setValue($date)
        ->save();
$installer->endSetup();



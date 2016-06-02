<?php
/** @var Fooman_Connect_Model_Resource_Setup $installer */
$installer = $this;

$installer->startSetup();
//migrate old config values to new paths
$oldToNewMap = array(
    'settings/xeroaccountcodesurcharge'=>'xeroaccount/codesurcharge',
    'settings/xeroaccountcoderefunds'=>'xeroaccount/coderefunds',
    'settings/xeroaccountcodediscounts'=>'xeroaccount/codediscounts',
    'settings/xeroaccountcodeshipping'=>'xeroaccount/codeshipping',
    'settings/xeroaccountcodesale'=>'xeroaccount/codesale',

    'settings/xerodefaultzerotaxrate'=>'tax/xerodefaultzerotaxrate',
    'settings/xeroshippingtax'=>'tax/xeroshipping',
    'settings/xerosurchargetax'=>'tax/xerosurcharge',

    'settings/xeroexportwithstatus'=>'order/exportwithstatus',
    'settings/xeroexportzero'=>'order/exportzero',
    'settings/xeroorderstartdate'=>'order/startdate',
    'settings/xeropayments'=>'order/xeropayments',

    'settings/xerocreditmemostartdate'=>'creditmemo/startdate',
    'settings/xerocreditnoteprefix'=>'creditmemo/xeroprefix',

    'settings/xeroautomatic'=>'cron/xeroautomatic'
);

$table = $this->getTable('core/config_data');
foreach ($oldToNewMap as $old => $new) {
    $installer->run(
        "UPDATE IGNORE $table
        SET `path`='foomanconnect/{$new}' WHERE `path`='foomanconnect/{$old}';"
    );
}

$installer->endSetup();

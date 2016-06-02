<?php
/*
 * @author     Kristof Ringleff
 * @package    Fooman_Surcharge
 * @copyright  Copyright (c) 2009 Fooman Limited (http://www.fooman.co.nz)
*/

class Fooman_Connect_Model_Selftester extends Fooman_Common_Model_Selftester
{

    public function _getVersions()
    {
        parent::_getVersions();
        $this->messages[]
            = "Connect DB version: " . Mage::getResourceModel('core/resource')->getDbVersion('foomanconnect_setup');
        $this->messages[]
            = "Connect Config version: " . (string)Mage::getConfig()->getModuleConfig('Fooman_Connect')->version;

        //Mage::getResourceModel('core/resource')->setDbVersion('foomanconnect_setup', "1.9.0");

    }

    public function _getDbFields()
    {
        $fields = array(
            //0.5.1
            array(
                'sql-column',
                'tax_calculation_rate',
                'xero_rate',
                "varchar(255) after `rate`"
            ),
            //0.5.2
            array(
                'sql-column',
                'sales_flat_order_item',
                'xero_rate',
                "varchar(255) after `tax_percent`"
            ),
            //0.5.3
            array(
                "eav", "catalog_product", "xero_sales_account_code", array(
                'label' => 'Xero Sales Account Code', 'required' => 0,
                'visible' => 0, 'input' => 'select',
                'is_global'=> false, //2.1.7
                'group'  => 'General', 'source' => 'foomanconnect/system_salesProductAccountOptions'
            )
            ),
            //2.0.1
            array(
                'table',
                'foomanconnect/order',
                array(
                    array(
                        'order_id',
                        Varien_Db_Ddl_Table::TYPE_INTEGER,
                        10,
                        array(
                            'nullable' => false,
                            'primary'  => true,
                            'unsigned' => true
                        ),
                        'Order Id',
                    ),
                    array(
                        'xero_invoice_id',
                        Varien_Db_Ddl_Table::TYPE_VARCHAR,
                        255,
                        array(
                            'nullable' => true,
                        ),
                        'Xero Invoice Id'
                    ),
                    array(
                        'xero_invoice_number',
                        Varien_Db_Ddl_Table::TYPE_VARCHAR,
                        255,
                        array(
                            'nullable' => true,
                        ),
                        'Xero Invoice Number'
                    ),
                    array(
                        'xero_export_status',
                        Varien_Db_Ddl_Table::TYPE_SMALLINT,
                        null,
                        array(
                            'nullable' => true,
                            'default'  => 0
                        ),
                        'Xero Export Status'
                    )
                )
            ),
            array(
                'sql-column',
                'foomanconnect/order',
                'xero_last_validation_errors',
                'text'
            ),
            //2.0.2
            array(
                'table',
                'foomanconnect/invoice',
                array(
                    array(
                        'invoice_id',
                        Varien_Db_Ddl_Table::TYPE_INTEGER,
                        10,
                        array(
                            'nullable' => false,
                            'primary'  => true,
                            'unsigned' => true
                        ),
                        'Invoice Id',
                    ),
                    array(
                        'xero_invoice_id',
                        Varien_Db_Ddl_Table::TYPE_VARCHAR,
                        255,
                        array(
                            'nullable' => true,
                        ),
                        'Xero Invoice Id'
                    ),
                    array(
                        'xero_invoice_number',
                        Varien_Db_Ddl_Table::TYPE_VARCHAR,
                        255,
                        array(
                            'nullable' => true,
                        ),
                        'Xero Invoice Number'
                    ),
                    array(
                        'xero_export_status',
                        Varien_Db_Ddl_Table::TYPE_SMALLINT,
                        null,
                        array(
                            'nullable' => true,
                            'default'  => 0
                        ),
                        'Xero Export Status'
                    )
                )
            ),
            array(
                'sql-column',
                'foomanconnect/invoice',
                'xero_last_validation_errors',
                'text'
            ),
            //2.0.3
            array(
                'table',
                'foomanconnect/creditmemo',
                array(
                    array(
                        'creditmemo_id',
                        Varien_Db_Ddl_Table::TYPE_INTEGER,
                        10,
                        array(
                            'nullable'  => false,
                            'primary'   => true,
                            'unsigned'  => true
                        ),
                        'Creditmemo Id'
                    ),
                    array(
                        'xero_creditnote_id',
                        Varien_Db_Ddl_Table::TYPE_VARCHAR,
                        255,
                        array(
                            'nullable' => true,
                        ),
                        'Xero Credit Note Id'
                    ),
                    array(
                        'xero_creditnote_number',
                        Varien_Db_Ddl_Table::TYPE_VARCHAR,
                        255,
                        array(
                            'nullable' => true,
                        ),
                        'Xero Credit Note Number'
                    ),
                    array(
                        'xero_export_status',
                        Varien_Db_Ddl_Table::TYPE_SMALLINT,
                        null,
                        array(
                            'nullable' => true,
                            'default'  =>0
                        ),
                        'Xero Export Status'
                    )
                )
            ),
            array(
                'sql-column',
                'foomanconnect/creditmemo',
                'xero_last_validation_errors',
                'text'
            ),
            //2.0.4
            array(
                'table',
                'foomanconnect/item',
                array(
                    array(
                        'item_code',
                        Varien_Db_Ddl_Table::TYPE_VARCHAR,
                        30,
                        array(
                            'nullable' => false,
                            'primary'  => true,
                        ),
                        'Item Code'
                    ),
                    array(
                        'description',
                        Varien_Db_Ddl_Table::TYPE_VARCHAR,
                        255,
                        array(
                            'nullable' => true,
                        ),
                        'Description'
                    ),
                    array(
                        'xero_item_id',
                        Varien_Db_Ddl_Table::TYPE_VARCHAR,
                        255,
                        array(
                            'nullable' => true,
                        ),
                        'Xero Item Id'
                    ),
                    array(
                        'xero_export_status',
                        Varien_Db_Ddl_Table::TYPE_SMALLINT,
                        null,
                        array(
                            'nullable' => true,
                            'default'  =>0
                        ),
                        'Xero Export Status'
                    )
                )
            ),
            array(
                'sql-column',
                'foomanconnect/item',
                'xero_last_validation_errors',
                'text COMMENT \'Xero Last Validation Errors\''
            ),
            //2.0.5
            array(
                'sql-column',
                'foomanconnect/item',
                'store_id',
                'smallint(5) unsigned DEFAULT NULL COMMENT \'Store Id\''
            ),
            //2.1.7 - see 0.5.3
            //2.1.14
            //2.0.4
            array(
                'table',
                'foomanconnect/tracking_rule',
                array(
                    array(
                        'rule_id',
                        Varien_Db_Ddl_Table::TYPE_INTEGER,
                        10,
                        array(
                            'identity'  => true,
                            'nullable'  => false,
                            'primary'   => true,
                            'unsigned'  => true
                        ),
                        'Rule Id'
                    ),
                    array(
                        'type',
                        Varien_Db_Ddl_Table::TYPE_VARCHAR,
                        30,
                        array(),
                        'Rule Type'
                    ),
                    array(
                        'source_id',
                        Varien_Db_Ddl_Table::TYPE_INTEGER,
                        10,
                        array(
                            'nullable'  => false,
                            'unsigned'  => true
                        ),
                        'Source Id'
                    ),
                    array(
                        'store_id',
                        Varien_Db_Ddl_Table::TYPE_SMALLINT,
                        null,
                        array(
                            'unsigned'  => true,
                            'nullable'  => false
                        ),
                        'Store Id'
                    ),
                    array(
                        'tracking_category_id',
                        Varien_Db_Ddl_Table::TYPE_VARCHAR,
                        255,
                        array(
                            'nullable' => true,
                        ),
                        'Tracking Category Id'
                    ),
                    array(
                        'tracking_name',
                        Varien_Db_Ddl_Table::TYPE_VARCHAR,
                        255,
                        array(
                            'nullable' => true,
                        ),
                        'Tracking Name'
                    ),
                    array(
                        'tracking_option',
                        Varien_Db_Ddl_Table::TYPE_VARCHAR,
                        255,
                        array(
                            'nullable' => true,
                        ),
                        'Tracking Option'
                    ),
                    array(
                        'sort_order',
                        Varien_Db_Ddl_Table::TYPE_INTEGER,
                        null,
                        array(
                            'nullable' => true,
                            'default'  =>0
                        ),
                        'Sort Order'
                    )
                )
            ),
            //2.1.32
            array(
                'sql-column',
                'tax_calculation_rate',
                'xero_sales_account_code',
                "varchar(255) after `xero_rate`"
            ),
        );

        //foreign keys that are primary can only be checked with Fooman Common 1.2.7+
        if (version_compare((string)Mage::getConfig()->getModuleConfig('Fooman_Common')->version, '1.2.7', '>=')) {
            $fields = array_merge(
                $fields, array(
                    array(
                        'constraint',
                        'FK_FOOMANCONNECT_ORDER_ORDER_ID_SALES_FLAT_ORDER_ENTITY_ID',
                        'foomanconnect/order',
                        'order_id',
                        'sales/order',
                        'entity_id',
                        Varien_Db_Ddl_Table::ACTION_CASCADE,
                        Varien_Db_Ddl_Table::ACTION_CASCADE,
                        false
                    ),
                    array(
                        'constraint',
                        'FK_FOOMANCONNECT_INVOICE_INVOICE_ID_SALES_FLAT_INVOICE_ENTITY_ID',
                        'foomanconnect/invoice',
                        'invoice_id',
                        'sales/invoice',
                        'entity_id',
                        Varien_Db_Ddl_Table::ACTION_CASCADE,
                        Varien_Db_Ddl_Table::ACTION_CASCADE,
                        false
                    ),
                    array(
                        'constraint',
                        'FK_0BCB942C08F38DF4DC2430D6B853B115',
                        'foomanconnect/creditmemo',
                        'creditmemo_id',
                        'sales/creditmemo',
                        'entity_id',
                        Varien_Db_Ddl_Table::ACTION_CASCADE,
                        Varien_Db_Ddl_Table::ACTION_CASCADE,
                        false
                    ),
                    array(
                        'constraint',
                        'FK_FOOMANCONNECT_ITEM_STORE_ID_CORE_STORE_STORE_ID',
                        'foomanconnect/item',
                        'store_id',
                        'core_store',
                        'store_id',
                        Varien_Db_Ddl_Table::ACTION_CASCADE,
                        Varien_Db_Ddl_Table::ACTION_CASCADE,
                        false
                    ),
                    array(
                        'constraint',
                        'FK_FOOMANCONNECT_TRACKING_RULE_STORE_ID_CORE_STORE_STORE_ID',
                        'foomanconnect/tracking_rule',
                        'store_id',
                        'core_store',
                        'store_id',
                        Varien_Db_Ddl_Table::ACTION_CASCADE,
                        Varien_Db_Ddl_Table::ACTION_CASCADE,
                        false
                    )
                )
            );
        }

        return $fields;
    }

    public function _needsCron()
    {
        return true;
    }

    public function _getSettings()
    {
        $conn = Mage::getSingleton('core/resource');
        $read = $conn->getConnection('core_read');
        return array(
            'core_config_data' => $read->fetchAll(
                "SELECT * FROM `{$conn->getTableName('core_config_data')}` WHERE path like '%foomanconnect%'"
            )
        );
    }

    public function _getFiles()
    {
        //REPLACE
        return array(
            'app/code/community/Fooman/Connect/sql/foomanconnect_setup/mysql4-upgrade-1.9.9-2.0.0.php',
            'app/code/community/Fooman/Connect/sql/foomanconnect_setup/mysql4-upgrade-0.5.0-0.5.1.php',
            'app/code/community/Fooman/Connect/sql/foomanconnect_setup/mysql4-upgrade-2.1.6-2.1.7.php',
            'app/code/community/Fooman/Connect/sql/foomanconnect_setup/mysql4-upgrade-0.5.1-0.5.2.php',
            'app/code/community/Fooman/Connect/sql/foomanconnect_setup/mysql4-upgrade-0.5.4-0.5.5.php',
            'app/code/community/Fooman/Connect/sql/foomanconnect_setup/mysql4-upgrade-2.0.4-2.0.5.php',
            'app/code/community/Fooman/Connect/sql/foomanconnect_setup/mysql4-upgrade-0.5.3-0.5.4.php',
            'app/code/community/Fooman/Connect/sql/foomanconnect_setup/mysql4-upgrade-2.0.3-2.0.4.php',
            'app/code/community/Fooman/Connect/sql/foomanconnect_setup/mysql4-install-0.1.0.php',
            'app/code/community/Fooman/Connect/sql/foomanconnect_setup/mysql4-upgrade-0.5.5-1.2.0.php',
            'app/code/community/Fooman/Connect/sql/foomanconnect_setup/mysql4-upgrade-2.0.1-2.0.2.php',
            'app/code/community/Fooman/Connect/sql/foomanconnect_setup/mysql4-upgrade-2.0.0-2.0.1.php',
            'app/code/community/Fooman/Connect/sql/foomanconnect_setup/mysql4-upgrade-2.0.2-2.0.3.php',
            'app/code/community/Fooman/Connect/Block/Adminhtml/Migration/InProgress.php',
            'app/code/community/Fooman/Connect/Block/Adminhtml/Order/Grid.php',
            'app/code/community/Fooman/Connect/Block/Adminhtml/Creditmemo/Grid.php',
            'app/code/community/Fooman/Connect/Block/Adminhtml/System/Date.php',
            'app/code/community/Fooman/Connect/Block/Adminhtml/Order.php',
            'app/code/community/Fooman/Connect/Block/Adminhtml/Sales/Order/View/Tab/Xero.php',
            'app/code/community/Fooman/Connect/Block/Adminhtml/Sales/Creditmemo/Xero.php',
            'app/code/community/Fooman/Connect/Block/Adminhtml/Sales/Invoice/Xero.php',
            'app/code/community/Fooman/Connect/Block/Adminhtml/Invoice/Grid.php',
            'app/code/community/Fooman/Connect/Block/Adminhtml/Creditmemo.php',
            'app/code/community/Fooman/Connect/Block/Adminhtml/Invoice.php',
            'app/code/community/Fooman/Connect/controllers/Adminhtml/Xero/AuthController.php',
            'app/code/community/Fooman/Connect/controllers/Adminhtml/Xero/CreditmemoController.php',
            'app/code/community/Fooman/Connect/controllers/Adminhtml/Xero/OrderController.php',
            'app/code/community/Fooman/Connect/controllers/Adminhtml/XeroController.php',
            'app/code/community/Fooman/Connect/etc/adminhtml.xml',
            'app/code/community/Fooman/Connect/etc/config.xml',
            'app/code/community/Fooman/Connect/etc/system.xml',
            'app/code/community/Fooman/Connect/Exception.php',
            'app/code/community/Fooman/Connect/Helper/Migration.php',
            'app/code/community/Fooman/Connect/Helper/Config.php',
            'app/code/community/Fooman/Connect/Helper/Data.php',
            'app/code/community/Fooman/Connect/Model/Automatic.php',
            'app/code/community/Fooman/Connect/Model/Mysql4/Item/Collection.php',
            'app/code/community/Fooman/Connect/Model/Mysql4/Order/Collection.php',
            'app/code/community/Fooman/Connect/Model/Mysql4/Creditmemo/Collection.php',
            'app/code/community/Fooman/Connect/Model/Mysql4/Order.php',
            'app/code/community/Fooman/Connect/Model/Mysql4/Setup.php',
            'app/code/community/Fooman/Connect/Model/Mysql4/Item.php',
            'app/code/community/Fooman/Connect/Model/Mysql4/Invoice/Collection.php',
            'app/code/community/Fooman/Connect/Model/Mysql4/Creditmemo.php',
            'app/code/community/Fooman/Connect/Model/Mysql4/Invoice.php',
            'app/code/community/Fooman/Connect/Model/Xero/Defaults.php',
            'app/code/community/Fooman/Connect/Model/Xero/Api.php',
            'app/code/community/Fooman/Connect/Model/Status.php',
            'app/code/community/Fooman/Connect/Model/DataSource/OrderItem.php',
            'app/code/community/Fooman/Connect/Model/DataSource/OrderItem/Simple.php',
            'app/code/community/Fooman/Connect/Model/DataSource/OrderItem/Bundle.php',
            'app/code/community/Fooman/Connect/Model/DataSource/OrderItem/Abstract.php',
            'app/code/community/Fooman/Connect/Model/DataSource/Exception.php',
            'app/code/community/Fooman/Connect/Model/DataSource/LineItem.php',
            'app/code/community/Fooman/Connect/Model/DataSource/Total.php',
            'app/code/community/Fooman/Connect/Model/DataSource/Order.php',
            'app/code/community/Fooman/Connect/Model/DataSource/LineItem/Simple.php',
            'app/code/community/Fooman/Connect/Model/DataSource/LineItem/Interface.php',
            'app/code/community/Fooman/Connect/Model/DataSource/LineItem/Bundle.php',
            'app/code/community/Fooman/Connect/Model/DataSource/Creditmemo.php',
            'app/code/community/Fooman/Connect/Model/DataSource/Invoice.php',
            'app/code/community/Fooman/Connect/Model/DataSource/CreditmemoTotal.php',
            'app/code/community/Fooman/Connect/Model/DataSource/Abstract.php',
            'app/code/community/Fooman/Connect/Model/System/SalesAccountOptions.php',
            'app/code/community/Fooman/Connect/Model/System/ShippingAccountOptions.php',
            'app/code/community/Fooman/Connect/Model/System/InvoiceStatusOptions.php',
            'app/code/community/Fooman/Connect/Model/System/TaxOptions.php',
            'app/code/community/Fooman/Connect/Model/System/TrackingOptions.php',
            'app/code/community/Fooman/Connect/Model/System/DiscountAccountOptions.php',
            'app/code/community/Fooman/Connect/Model/System/CurrencyOptions.php',
            'app/code/community/Fooman/Connect/Model/System/RoundingAccountOptions.php',
            'app/code/community/Fooman/Connect/Model/System/SalesProductAccountOptions.php',
            'app/code/community/Fooman/Connect/Model/System/OrderStatusOptions.php',
            'app/code/community/Fooman/Connect/Model/System/AbstractAccounts.php',
            'app/code/community/Fooman/Connect/Model/System/TaxZeroOptions.php',
            'app/code/community/Fooman/Connect/Model/System/XeroVersionsOptions.php',
            'app/code/community/Fooman/Connect/Model/System/ExportMode.php',
            'app/code/community/Fooman/Connect/Model/System/TaxOverrideOptions.php',
            'app/code/community/Fooman/Connect/Model/System/Abstract.php',
            'app/code/community/Fooman/Connect/Model/Order.php',
            'app/code/community/Fooman/Connect/Model/Item.php',
            'app/code/community/Fooman/Connect/Model/Resource/Item/Collection.php',
            'app/code/community/Fooman/Connect/Model/Resource/Order/Collection.php',
            'app/code/community/Fooman/Connect/Model/Resource/Creditmemo/Collection.php',
            'app/code/community/Fooman/Connect/Model/Resource/Collection/Abstract.php',
            'app/code/community/Fooman/Connect/Model/Resource/Order.php',
            'app/code/community/Fooman/Connect/Model/Resource/Setup.php',
            'app/code/community/Fooman/Connect/Model/Resource/Item.php',
            'app/code/community/Fooman/Connect/Model/Resource/Invoice/Collection.php',
            'app/code/community/Fooman/Connect/Model/Resource/Creditmemo.php',
            'app/code/community/Fooman/Connect/Model/Resource/Invoice.php',
            'app/code/community/Fooman/Connect/Model/Creditmemo.php',
            'app/code/community/Fooman/Connect/Model/Invoice.php',
            'app/code/community/Fooman/Connect/Model/Selftester.php',
            'app/code/community/Fooman/Connect/Model/Abstract.php',
            'app/code/community/Fooman/Connect/LICENSE.txt',
            'app/code/community/Fooman/ConnectLicense/etc/config.xml',
            'app/code/community/Fooman/ConnectLicense/Helper/Data.php',
            'app/code/community/Fooman/ConnectLicense/Model/DataSource/Converter/OrderXml.php',
            'app/code/community/Fooman/ConnectLicense/Model/DataSource/Converter/CreditmemoXml.php',
            'app/code/community/Fooman/ConnectLicense/Model/DataSource/Converter/ItemsXml.php',
            'app/code/community/Fooman/ConnectLicense/Model/DataSource/Converter/Abstract.php',
            'app/code/community/Fooman/ConnectLicense/LICENSE.txt',
            'app/etc/modules/Fooman_Connect.xml',
            'app/etc/modules/Fooman_ConnectLicense.xml',
            'app/design/adminhtml/default/default/layout/foomanconnect.xml'
        );
        //REPLACE_END
    }
}



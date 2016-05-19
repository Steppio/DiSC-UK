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
class Yoma_Realex_Helper_Redirect extends Yoma_Realex_Helper_Data{

    const REGISTRY_KEY_CURRENT_TIMESTAMP = 'yoma_realex_current_timestamp';

    /**
     * Generate sha1hash
     *
     * @param string $secret
     * @param null $args
     * @return string
     */
    public function generateSha1Hash($secret, $args = null)
    {
        $secret = Mage::helper('core')->decrypt($secret);
        $hash = sha1(implode('.', $args));
        $hash = sha1("{$hash}.{$secret}");

        return $hash;
    }

    /**
     * Create timestamp
     *
     * @return bool|mixed|string
     */
    public function getTimestamp()
    {
        $timestamp = Mage::registry(self::REGISTRY_KEY_CURRENT_TIMESTAMP);

        if (is_null($timestamp)) {
            $timestamp = date('YmdHis');
            Mage::register(self::REGISTRY_KEY_CURRENT_TIMESTAMP, $timestamp);
        }

        return $timestamp;
    }

    /**
     * Generate unique string
     *
     * @param $prefix
     * @return string
     */
    public function generateUniqueString($prefix)
    {
        return $prefix . '-' . time();
    }

    protected $_DataWhitelist = array(
        'amount',
        'auth_code',
        'auth_pasref',
        'auth_auth_code',
        'card_expiry',
        'card_name',
        'card_number',
        'card_type',
        'card_type',
        'currency',
        'multisettle',
        'pasref',
        'payer_reference',
        'payment_method_reference',
        'sub_account',
        'unique_order_id',
        'order_id',
        'auto_settle_flag',
        'cust_num',
        'authcode',
        'account',
    );

    /**
     * Filter data by list
     *
     * @param array $data
     * @param bool $customWhitelist
     * @return mixed
     *
     */
    public function filterData($data, $customWhitelist = false)
    {
        $whitelist = $this->_DataWhitelist;
        if ($customWhitelist != false) {
            $whitelist = $customWhitelist;
        }

        foreach ($data as $_key => $_value) {
            if (!in_array(strtolower($_key), $whitelist)) {
                unset($data[$_key]);
            }
        }

        return $data;
    }
} 
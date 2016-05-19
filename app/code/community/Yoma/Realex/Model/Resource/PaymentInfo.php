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
class Yoma_Realex_Model_Resource_PaymentInfo extends Mage_Core_Model_Mysql4_Abstract
{

    protected function _construct()
    {
        $this->_init('realex/paymentInfo', 'entity_id');
    }
    

    protected function _prepareDataForSave(Mage_Core_Model_Abstract $object)
    {
        $now = now();
        if (!$object->getId() || $object->isObjectNew()) {
            $object->setCreatedAt($now);
        }
        $object->setUpdatedAt($now);
        
        return parent::_prepareDataForSave($object);
    }
}
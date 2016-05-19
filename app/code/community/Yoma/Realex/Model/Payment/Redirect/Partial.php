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
class Yoma_Realex_Model_Payment_Redirect_Partial extends Yoma_Realex_Model_Payment_Direct_Partial{

    protected $_code = 'redirect';
    protected $_allowedMethods = array('partial');
    protected $_method = 'partial';
    protected $_action = 'partial';
    protected $_mpiData = array();
    protected $_useToken = null;
    protected $_captureType = 'partial';
    protected $_customer = NULL;

    /**
     * Get Gateway url
     *
     * @param string $serviceCode
     * @return string
     */
    protected function _getServiceUrl($serviceCode = null){

        return $this->_getHelper()->getConfigData('realexdirect','live_url');
    }

}
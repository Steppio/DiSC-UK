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
class Yoma_Realex_Model_Response_Abstract extends Mage_Core_Model_Abstract{

    const AUTH_RESULT_AUTHENTICATED = '00';
    const AUTH_RESULT_DECLINED = '101';
    const AUTH_RESULT_REFERRAL = '102';
    const AUTH_RESULT_LOST = '103';

    protected $_serviceResponse;

    /**
     * Set response data
     *
     * @param mixed $response
     * @return $this
     */
    public function setResponse($response){
        $this->_serviceResponse = $response;
        $this->_populateData();
        return $this;
    }

    /**
     * Return response message
     *
     * @return string
     */
    public function getMessages(){

        return $this->_serviceResponse->getMessage();
    }

    /**
     * Populate data from response
     *
     * @return $this
     */
    protected function _populateData(){

        $xml = $this->_serviceResponse->getBody();

        // convert xml response to array
        try {

            $response = new DOMDocument();
            $response->loadXML($xml);

            $xpath = new DOMXPath($response);
            // handle tss check rules
            $checks = $xpath->query('//tss/check');
            // convert to unique element check_ruleNumber
            foreach ($checks as $check) {
                $id = $check->getAttribute('id');
                $value = $check->nodeValue;
                $node = $response->createElement("check_" . $id,$value);
                $check->parentNode->replaceChild($node, $check);
            }
            $xml = $response->saveXML();

            /**$transform = new DOMDocument();
            $xlsFile = Mage::getBaseDir('lib') . DS . 'Realex' . DS . 'check.xsl';
            $transform->load($xlsFile);

            // process attributes to element
            $processor = new XSLTProcessor;
            $processor->importStyleSheet($transform); // attach the xsl rules

            $xmlDoc = $processor->transformToDoc($response);
            $xml = $xmlDoc->saveXML();
             * **/
        }catch (Exception $e){

        }

        $xml = simplexml_load_string($xml);
        // convert string to array
        $json = json_encode($xml);
        //flatten array
        $array = $this->flatten(json_decode($json, true));
        foreach($array as $key=>$value){
            $this->setData($key,$value);
        }

        return $this;

    }

    /**
     * Flatten Multi dimensional array
     *
     * @param array $arr
     * @param string $prefix
     * @return array
     */
    public function flatten(array $arr, $prefix = '')
    {
        $out = array();
        foreach ($arr as $k => $v) {
            $key = (!strlen($prefix)) ? strtolower($k) : ($prefix=='@attributes'?strtolower($k):strtolower($prefix) . '_' . strtolower($k));
            if (is_array($v)) {
                $out += $this->flatten($v, $key);
            } else {
                $out[$key] = $v;
            }
        }
        return $out;
    }

    /**
     * Convert ot lower case
     *
     * @param string $key
     * @return string
     */
    protected function _normalizeKeys($key){
        return strtolower($key);
    }
}
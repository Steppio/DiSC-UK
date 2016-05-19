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
class Yoma_Realex_Model_Message_Abstract  extends Mage_Core_Model_Abstract{

    protected $_node   = null;
    protected $_messageData;
    protected $_service;

    protected $_attributes = array(
        'currency' => 'amount',
        'timestamp' => 'request',
        'flag' =>'autosettle',
        'type' => 'request'
    );

    public function _construct(){
        $this->_node = new DOMDocument;
    }

    /**
     * Create new Dom Document
     *
     * @param string $xml
     */
    public function setNode($xml){
        $this->_node = new DOMDocument;
    }

    /**
     * Convert array to xml message
     *
     * @param array $data
     * @return null|string
     */
    public function prepareMessage($data = null){

        if(!$data){
            $data = $this->getData();
        }
        $this->_prepareMessage($data,$this->_node);
        $message = null;

        foreach($this->_node->childNodes as $node){
            $message .= $this->_node->saveXML($node);
        }

        $this->_messageData = $message;

        return $message;
    }

    /**
     * Return xml string
     *
     * @return string
     */
    public function getMessage(){
        return $this->_messageData;
    }

    /**
     * Construct xml from array
     *
     * @param array $data
     * @param DOMDocument $domnode
     */
    protected function _prepareMessage($data, $domnode){

        foreach($data as $key=>$value){
            if(in_array($key,array('value','attributes'))){
                if($key == 'value' ){
                    if(isset($data['value'])) {
                        $domnode->nodeValue = $data['value'];
                    }
                    unset($data[$key]);
                }else{
                    foreach($value as $attrib=>$v ){
                        $domnode->setAttribute($attrib, $v);
                    }
                    unset($data[$key]);
                }
            }else{
                if($key == 'multiple'){
                    foreach($value as $alias=>$element){
                        foreach($element as $newElement){
                            $node = $this->_node->createElement($alias);
                            $newnode = $domnode->appendChild($node);
                            $this->_prepareMessage( $newElement,$newnode);
                        }
                    }
                }else{
                    $node = $this->_node->createElement($key);
                    $newnode = $domnode->appendChild($node);
                    if(is_array($value)){
                        $this->_prepareMessage($value,$newnode);
                    }
                }
            }
        }

    }

}
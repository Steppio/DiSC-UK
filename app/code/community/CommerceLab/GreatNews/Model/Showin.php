<?php
/**
* CommerceLab Co.
*
* NOTICE OF LICENSE
*
* This source file is subject to the CommerceLab License Agreement
* that is bundled with this package in the file LICENSE.txt.
* It is also available through the world-wide-web at this URL:
* http://commerce-lab.com/LICENSE.txt
*
* @category   CommerceLab
* @package    CommerceLab_GreatNews
* @copyright  Copyright (c) 2012 CommerceLab Co. (http://commerce-lab.com)
* @license    http://commerce-lab.com/LICENSE.txt
*/

class CommerceLab_GreatNews_Model_Showin {
    protected $_options;

    public function toOptionArray()
    {
        if (!isset($this->_options)) {
            $this->_options[] = array(
               'value' => '',
               'label' => Mage::helper('clnews')->__('------')
            );
            $this->_options[] = array(
               'value' => 'left',
               'label' => Mage::helper('clnews')->__('Left Column')
            );
            $this->_options[] = array(
               'value' => 'right',
               'label' => Mage::helper('clnews')->__('Right Column')
            );
        }
        return $this->_options;
    }
}

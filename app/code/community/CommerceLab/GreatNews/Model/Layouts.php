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

class CommerceLab_GreatNews_Model_Layouts {
    protected $_layouts;

    public function toOptionArray()
    {
        if (!$this->_layouts) {
            $layouts = array();
            $node = Mage::getConfig()->getNode('global/cms/layouts') ? Mage::getConfig()->getNode('global/cms/layouts') : Mage::getConfig()->getNode('global/page/layouts');
            foreach ($node->children() as $layoutConfig) {
                $this->_layouts[] = array(
                   'value'=>(string)$layoutConfig->template,
                   'label'=>(string)$layoutConfig->label
                );
            }
        }
        return $this->_layouts;
    }
}

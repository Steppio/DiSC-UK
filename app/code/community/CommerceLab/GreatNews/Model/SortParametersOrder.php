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

class CommerceLab_GreatNews_Model_SortParametersOrder {
    protected $_order;

    public function toOptionArray()
    {
        if (!$this->_order) {
            $this->_order[] = array(
               'value'=> 'desc',
               'label'=> 'Descending'
            );
            $this->_order[] = array(
               'value'=> 'asc',
               'label'=> 'Ascending'
            );
        }
        return $this->_order;
    }
}

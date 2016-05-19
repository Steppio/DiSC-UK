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

class CommerceLab_GreatNews_Model_SortParameters {
    protected $_sortParameters;

    public function toOptionArray()
    {
        if (!$this->_sortParameters) {
            $this->_sortParameters[] = array(
               'value'=> 'news_time',
               'label'=> 'News Time'
            );
            $this->_sortParameters[] = array(
               'value'=> 'publicate_from_time',
               'label'=> 'Publish From'
            );
            $this->_sortParameters[] = array(
               'value'=> 'publicate_to_time',
               'label'=> 'Publish Until'
            );
            $this->_sortParameters[] = array(
               'value'=> 'created_time',
               'label'=> 'Created Time'
            );
            $this->_sortParameters[] = array(
               'value'=> 'update_time',
               'label'=> 'Updated Time'
            );
            $this->_sortParameters[] = array(
               'value'=> 'title',
               'label'=> 'Title'
            );
        }
        return $this->_sortParameters;
    }
}

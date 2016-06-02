<?php

/**
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
class Fooman_Connect_Block_Adminhtml_Common_Renderer_Action
    extends Mage_Adminhtml_Block_Widget_Grid_Column_Renderer_Action
{

    /**
     * Render single action as link html
     *
     * @param array                                    $action
     * @param Varien_Object|Fooman_Connect_Model_Order $row
     *
     * @return string
     */
    protected function _toLinkHtml($action, Varien_Object $row)
    {
        /** @var Fooman_Connect_Model_Abstract $row */
        if (false === $row->getSalesEntityViewId()) {
            return '&nbsp;';
        }

        return parent::_toLinkHtml($action, $row);
    }
}

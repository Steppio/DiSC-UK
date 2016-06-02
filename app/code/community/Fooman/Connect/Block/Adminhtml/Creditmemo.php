<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Block_Adminhtml_Creditmemo extends Mage_Adminhtml_Block_Widget_Grid_Container
{

    public function __construct()
    {
        if (Mage::getStoreConfig('foomanconnect/settings/xeroenablereset')) {
            $this->_addButton(
                'reset_xero', array(
                    'label'   => Mage::helper('foomanconnect')->__('Reset All'),
                    'onclick' => "location.href='" . $this->getUrl('*/*/resetAll') . "'",
                    'class'   => '',
                )
            );
        }

        $this->_controller = 'adminhtml_creditmemo';
        $this->_blockGroup = 'foomanconnect';
        $this->_headerText = Mage::helper('foomanconnect')->__('Fooman Connect: Xero - Credit Memos');

        parent::__construct();
        $this->_removeButton('add');
    }

}

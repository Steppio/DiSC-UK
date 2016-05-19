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
class Yoma_Realex_Block_Adminhtml_System_Config_Renderer_SubAccount_Abstract extends Mage_Adminhtml_Block_System_Config_Form_Field_Array_Abstract
{

    /**
     * Card field renderer
     *
     */
    protected $_cardRenderer;

    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Get select block for search field
     *
     */
    protected function _getCardRenderer()
    {
        if (!$this->_cardRenderer) {

            $this->_cardRenderer = $this->getLayout()
                ->createBlock('core/html_select')
                ->setIsRenderToJsTemplate(true);
        }
        return $this->_cardRenderer;
    }

    protected function _prepareToRender()
    {
        $this->_cardRenderer = null;

        $this->addColumn('sub_account', array(
            'label' => Mage::helper('realex')->__('Sub Account'),
            'style'    => 'width:120px;',
            'renderer' => false
        ));

        $this->addColumn('card_type', array(
            'label' => Mage::helper('realex')->__('Card Type'),
            'renderer' => NULL
        ));

        // Disables "Add after" button
        $this->_addAfter = false;
        $this->_addButtonLabel = Mage::helper('realex')->__('Add Sub Account');
    }

    protected function _renderCellTemplate($columnName)
    {

        $inputName  = $this->getElement()->getName() . '[#{_id}][' . $columnName . ']';

        if ($columnName=="card_type") {
            return $this->_getCardRenderer()
                ->setName($inputName)
                ->setTitle($columnName)
                ->setExtraParams('style="width:150px"')
                ->setOptions(
                    Mage::getSingleton('realex/realex_source_cards')->toOptionArray())
                ->toHtml();
        }

        return parent::_renderCellTemplate($columnName);
    }

    protected function _prepareArrayRow(Varien_Object $row)
    {
        $row->setData(
            'option_extra_attr_' . $this->_getCardRenderer()->calcOptionHash(
                $row->getData('card_type')),
            'selected="selected"'
        );
    }
}
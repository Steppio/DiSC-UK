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
class Yoma_Realex_Block_Adminhtml_Tokencard_Edit extends Mage_Adminhtml_Block_Widget_Form_Container
{
    public function __construct()
    {

        parent::__construct();
        $this->_objectId = "id";
        $this->_blockGroup = "realex";
        $this->_controller = "adminhtml_tokencard";
        $this->_updateButton("save", "label", Mage::helper("realex")->__("Save Item"));
        $this->_updateButton("delete", "label", Mage::helper("realex")->__("Delete Item"));

        $this->_addButton("saveandcontinue", array(
            "label"     => Mage::helper("realex")->__("Save And Continue Edit"),
            "onclick"   => "saveAndContinueEdit()",
            "class"     => "save",
        ), -100);


        $this->_formScripts[] = "
                function saveAndContinueEdit(){
                    editForm.submit($('edit_form').action+'back/edit/');
                }
            ";
    }

    public function getHeaderText()
    {
        if( Mage::registry("tokencard_data") && Mage::registry("tokencard_data")->getId() ){

            return Mage::helper("realex")->__("Edit Item '%s'", $this->htmlEscape(Mage::registry("tokencard_data")->getId()));
        }else{
            return Mage::helper("realex")->__("Add Item");
        }
    }
}
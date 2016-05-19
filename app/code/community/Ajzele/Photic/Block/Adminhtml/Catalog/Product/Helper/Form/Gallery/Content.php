<?php
/**
 * Ajzele
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 *
 * @category   Ajzele
 * @package    Ajzele_Photic
 * @copyright  Copyright (c) Branko Ajzele (http://ajzele.net)
 * @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */
class Ajzele_Photic_Block_Adminhtml_Catalog_Product_Helper_Form_Gallery_Content extends Mage_Adminhtml_Block_Catalog_Product_Helper_Form_Gallery_Content
{   	
    /**
     * This method has been overridden merely for the purpose of setting up a new view file 
     * to be used in place of the default theme folder.
     * 
     * @see app/code/core/Mage/Core/Block/Mage_Core_Block_Template#fetchView($fileName)
     */
    public function fetchView($fileName)
    {
        extract ($this->_viewVars);
        $do = $this->getDirectOutput();

        if (!$do) { ob_start(); }

        include getcwd().'/app/code/community/Ajzele/Photic/blocks/Adminhtml/catalog/product/helper/gallery.phtml';

        if (!$do) {$html = ob_get_clean(); } 
        else { $html = ''; }
        
        return $html;
    }   
}
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
class Ajzele_Photic_Block_Adminhtml_Catalog_Product_Attribute_Edit_Tab_Options extends Mage_Adminhtml_Block_Catalog_Product_Attribute_Edit_Tab_Options
{
	const OBSERVED_ATTRIBUTE = 'color';
	const THUMB_FILE_PARTIAL_ID = 'thumbfileid_';
	const THUMB_DELETE_PARTIAL_ID = 'thumbdeleteid_';  
    /**
     * This method has been overridden merely for the purpose of setting up a new view file 
     * to be used in place of the default theme folder. Only override in case of "color" attribute
     * 
     * @see app/code/core/Mage/Core/Block/Mage_Core_Block_Template#fetchView($fileName)
     */
    public function fetchView($fileName)
    {
	    if($this->getAttributeObject()->getAttributeCode() != self::OBSERVED_ATTRIBUTE) {
			return parent::fetchView($fileName);
		}
		else {
	        extract ($this->_viewVars);
	        $do = $this->getDirectOutput();
	
	        if (!$do) { ob_start(); }
	
	        include getcwd().'/app/code/community/Ajzele/Photic/blocks/Adminhtml/catalog/product/attribute/options.phtml';
	
	        if (!$do) {$html = ob_get_clean(); } 
	        else { $html = ''; }
	        
	        return $html;
		}
    }
    
    public function getThumbFilePartialId() {
    	return self::THUMB_FILE_PARTIAL_ID;
    }
    
    public function getThumbDeletePartialId() {
    	return self::THUMB_DELETE_PARTIAL_ID;
    }

    public function renderDeleteThumbControl() {
    	
    	
    	
    	$html = '<img src="" alt="N\/A" \/>&nbsp;&nbsp;<input type="checkbox" style="width:auto!important;" id="<?php echo $this->getThumbDeletePartialId() ?>{{id}}" name="<?php echo $this->getThumbDeletePartialId() ?>{{id}}" \/>&nbsp;<label>'.$this->__('Del.thumb').'<\/label>';
    	
    	//return $html; 
    }
    
}

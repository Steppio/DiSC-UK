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
class Ajzele_Photic_Model_Observer extends Mage_Core_Model_Abstract
{
	const COLOR2PHOTO_POST_FIELD = 'map2Color';
	const COLOR2PHOTO_ATTRIBUTE = 'ajzele_photic3';
	const COLOR2PHOTO_POST_THUMB_DELETE = 'thumbdeleteid_';
	
	private $allowedThumbExtensions = array('jpg','jpeg','gif','png');
	
    public function hookIntoCatalogProductNewAction($observer)
    {
        $product = $observer->getEvent()->getProduct();
        //echo 'Inside hookIntoCatalogProductNewAction observer...'; exit;
        //Implement the "catalog_product_new_action" hook
        return $this;    	
    }
    
    public function hookIntoCatalogProductEditAction($observer)
    {
        $product = $observer->getEvent()->getProduct();
        //echo '<pre>'; print_r($product->debug()); echo '</pre>';
        
        //echo 'Inside hookIntoCatalogProductEditAction observer...'; exit;
        //Implement the "catalog_product_edit_action" hook
        return $this;    	
    }    
    
    public function hookIntoCatalogProductPrepareSave($observer)
    {
		//echo '<pre>'; print_r($observer->getEvent()->getProduct()->debug()); echo '</pre>'; exit;
    	
    	$map2Color = array();
    	$product = $observer->getEvent()->getProduct();
    	
    	//Remove extra fields from $_POST['map2Color'] variable
    	if(isset($_POST[self::COLOR2PHOTO_POST_FIELD]) && !empty($_POST[self::COLOR2PHOTO_POST_FIELD])) {
    		$map2Color = $_POST[self::COLOR2PHOTO_POST_FIELD];
    		if(isset($map2Color['__value_id__'])) {
    			unset($map2Color['__value_id__']);
    			foreach($map2Color as $k => $v) {
    				if(empty($v)) {
						unset($map2Color[$k]);
    				}
    			}
    		}
    	}
    	
    	if(!empty($map2Color)) {
    		try {
	        	$observer->getEvent()->getProduct()->{self::COLOR2PHOTO_ATTRIBUTE} = serialize($map2Color);
	        }
	        catch (Exception $ex) {
	        	//Silent die...
	        }
    	}
	
        return $this;    	
    }

    public function hookIntoSalesOrderItemSaveAfter($observer)
    {
        //$event = $observer->getEvent();
        //echo 'Inside hookIntoSalesOrderItemSaveAfter observer...'; exit;
        //Implement the "sales_order_item_save_after" hook
        return $this;    	
    }

    public function hookIntoSalesOrderSaveBefore($observer)
    {
        //$event = $observer->getEvent();
        //echo 'Inside hookIntoSalesOrderSaveBefore observer...'; exit;
        //Implement the "sales_order_save_before" hook
        return $this;    	
    }     
    
    public function hookIntoSalesOrderSaveAfter($observer)
    {
        $product = $observer->getEvent()->getProduct();
        //echo 'Inside hookIntoSalesOrderSaveAfter observer...'; exit;
        //Implement the "sales_order_save_after" hook
        return $this;    	
    } 

    public function hookIntoCatalogProductDeleteBefore($observer)
    {
        $product = $observer->getEvent()->getProduct();
        //echo 'Inside hookIntoCatalogProductDeleteBefore observer...'; exit;
        //Implement the "catalog_product_delete_before" hook
        return $this;    	
    }    
    
    public function hookIntoCatalogruleBeforeApply($observer)
    {
        //$event = $observer->getEvent();
        //echo 'Inside hookIntoCatalogruleBeforeApply observer...'; exit;
        //Implement the "catalogrule_before_apply" hook
        return $this;    	
    }  

    public function hookIntoCatalogruleAfterApply($observer)
    {
        //$event = $observer->getEvent();
        //echo 'Inside hookIntoCatalogruleAfterApply observer...'; exit;
        //Implement the "catalogrule_after_apply" hook
        return $this;    	
    }    
    
    public function hookIntoCatalogProductSaveAfter($observer)
    {
        //echo 'Inside hookIntoCatalogProductSaveAfter observer...'; exit;
        //Implement the "catalog_product_save_after" hook
        return $this;    	
    }   
	
    public function hookIntoCatalogProductStatusUpdate($observer)
    {
        $product = $observer->getEvent()->getProduct();
        $event = $observer->getEvent();
        //echo 'Inside hookIntoCatalogProductStatusUpdate observer...'; exit;
        //Implement the "catalog_product_status_update" hook
        return $this;    	
    }

    public function hookIntoCatalogEntityAttributeSaveBefore($observer)
    {
    	//echo '<pre>'; print_r($_FILES); echo '</pre>'; exit;
    	
    	/**
    	 * 
    	 * $_FILES
    	 * 
			Array
			(
			    [thumbfileid_4] => Array
			        (
			            [name] => Penguins.jpg
			            [type] => image/jpeg
			            [tmp_name] => C:\Windows\Temp\php8D21.tmp
			            [error] => 0
			            [size] => 777835
			        )
			
			    [thumbfileid_5] => Array
			        (
			            [name] => Jellyfish.jpg
			            [type] => image/jpeg
			            [tmp_name] => C:\Windows\Temp\php8D50.tmp
			            [error] => 0
			            [size] => 775702
			        )
			
			    [thumbfileid_8] => Array
			        (
			            [name] => 
			            [type] => 
			            [tmp_name] => 
			            [error] => 4
			            [size] => 0
			        )
			
			    [thumbfileid_7] => Array
			        (
			            [name] => 
			            [type] => 
			            [tmp_name] => 
			            [error] => 4
			            [size] => 0
			        )
			
			)
    	 */
    	
    	$files = $_FILES;
    	$data = $_POST;
    	
    	foreach($data as $k => $v) {
    		if(strstr($k, self::COLOR2PHOTO_POST_THUMB_DELETE)) {
				$model = Mage::getModel('photic/photic');
				
				$resource = $model->getResource();
				$readConnection = $resource->getReadConnection();
				$existingOptionValueId = (int)$readConnection->fetchOne("SELECT mapper_id FROM ".$resource->getMainTable()." WHERE option_value_id = ?", array((int)str_replace(self::COLOR2PHOTO_POST_THUMB_DELETE, '', $k)));				
				
				$model->load($existingOptionValueId);
				$model->delete();
    		}
    	}    	
    	
    	if(!empty($files)) {
    					
    		$imageFileRelDestinationFolder = '/media/'.self::COLOR2PHOTO_ATTRIBUTE.'/';
    		$imageFileDestinationFolder = getcwd().$imageFileRelDestinationFolder;
    		$tempFileDestinationFolder = $imageFileDestinationFolder.'temp/';	
						
    		foreach($files as $k => $v) {
    			
    			//echo '<pre>'; print_r($v); echo '</pre>'; exit;
    			
    			if(strstr($k, Ajzele_Photic_Block_Adminhtml_Catalog_Product_Attribute_Edit_Tab_Options::THUMB_FILE_PARTIAL_ID)) {
    				if($v['size'] != '0') {
    					

    					
    					//Extract the option id value from input field name
    					$optionValueId = (int)str_replace(Ajzele_Photic_Block_Adminhtml_Catalog_Product_Attribute_Edit_Tab_Options::THUMB_FILE_PARTIAL_ID, '', $k);
    					//echo $optionValueId.'<br />';
    					
			    		$fileUploader = new Varien_File_Uploader($k);
						$fileUploader->setAllowedExtensions($this->allowedThumbExtensions);
			            $fileUploader->setAllowRenameFiles(true);
			            //$fileUploader->setFilesDispersion(true);
			            
						$fileSaveResult = $fileUploader->save($tempFileDestinationFolder);
						
						/**
						 * $result
							Array
							(
							    [name] => Jellyfish.jpg
							    [type] => image/jpeg
							    [tmp_name] => C:\Windows\Temp\php52BC.tmp
							    [error] => 0
							    [size] => 775702
							    [path] => C:\Server\apps\shop14rc1/media/ajzele_photic3temp
							    [file] => /j/e/jellyfish.jpg
							)
						 */
						
						if($fileSaveResult['error'] == '0') {
							$finalImageAbsSavePath = $imageFileDestinationFolder.$fileSaveResult['file'];
							$finalImageRelSavePath = $imageFileRelDestinationFolder.$fileSaveResult['file'];
							
							$image = new Varien_Image($fileSaveResult['path'].$fileSaveResult['file']);
							$image->constrainOnly(true);
							$image->keepAspectRatio(true);
							$image->keepFrame(false);
							$image->resize(20, 20);
							$image->save($finalImageAbsSavePath);

							$model = Mage::getModel('photic/photic');
							
							//Try to load the existing mapping entry...
							try {
								$resource = Mage::getModel('photic/photic')->getResource();
								$readConnection = $resource->getReadConnection();
								$existingOptionValueId = (int)$readConnection->fetchOne("SELECT mapper_id FROM ".$resource->getMainTable()." WHERE option_value_id = ?", array($optionValueId));

								$model->load($existingOptionValueId);
							}
							catch (Exception $ex) {
								//
							}
							
							$model->setImage(serialize($image));
							$model->setThumbAbsPath($finalImageAbsSavePath);
							$model->setThumbRelPath($finalImageRelSavePath);
							$model->setOptionValueId($optionValueId);
							$model->save();
						}
    				}
    			}
    		}
    	}
    	
    	
        //$event = $observer->getEvent();
        
        //Implement the "catalog_entity_attribute_save_after" hook
        return $this;    	
    }    
    
    public function hookIntoCatalogEntityAttributeSaveAfter($observer)
    {
        //$event = $observer->getEvent();
        
        //Implement the "catalog_entity_attribute_save_after" hook
        return $this;    	
    }
    
    public function hookIntoCatalogProductDeleteAfterDone($observer)
    {
        $product = $observer->getEvent()->getProduct();
        $event = $observer->getEvent();
        //echo 'Inside hookIntoCatalogProductDeleteAfterDone observer...'; exit;
        //Implement the "catalog_product_delete_after_done" hook
        return $this;    	
    }
    
    public function hookIntoCustomerLogin($observer)
    {
        $event = $observer->getEvent();
        //echo 'Inside hookIntoCustomerLogin observer...'; exit;
        //Implement the "customer_login" hook
        return $this;    	
    }       

    public function hookIntoCustomerLogout($observer)
    {
        $event = $observer->getEvent();
        //echo 'Inside hookIntoCustomerLogout observer...'; exit;
        //Implement the "customer_logout" hook
        return $this;    	
    }

    public function hookIntoSalesQuoteSaveAfter($observer)
    {
        $event = $observer->getEvent();
        //echo 'Inside hookIntoSalesQuoteSaveAfter observer...'; exit;
        //Implement the "sales_quote_save_after" hook
        return $this;    	
    }

    public function hookIntoCatalogProductCollectionLoadAfter($observer)
    {
        $event = $observer->getEvent();
        //echo 'Inside hookIntoCatalogProductCollectionLoadAfter observer...'; exit;
        //Implement the "catalog_product_collection_load_after" hook
        return $this;    	
    }
}
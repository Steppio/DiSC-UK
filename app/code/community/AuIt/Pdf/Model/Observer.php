<?php
/**
 * AuIt
 *
 * @category   AuIt
 * @package    AuIt_Editor
 * @author     M Augsten
 * @copyright  Copyright (c) 2008 Ingenieurbüro (IT) Dipl.-Ing. Augsten (http://www.au-it.de)
 */
class AuIt_Pdf_Model_Observer
{
	public function pdfinvoicesPredispatch(Varien_Event_Observer $observer)
    {
    	if ( $observer->getEvent()->getControllerAction()->getFullActionName() == 'adminhtml_sales_order_pdfinvoices')
    	{
    		$e = new Mage_Core_Controller_Varien_Exception();
    		//$e->prepareForward('pdfinvoices','order','auit_pdf');
    		$e->prepareForward('pdfinvoices','auitpdf_order');
    		throw $e;
    	}
    }
	public function pdfshipmentsPredispatch(Varien_Event_Observer $observer)
    {
    	if ( $observer->getEvent()->getControllerAction()->getFullActionName() == 'adminhtml_sales_order_pdfshipments')
    	{
    		$e = new Mage_Core_Controller_Varien_Exception();
    		//$e->prepareForward('pdfshipments','order','auit_pdf');
    		$e->prepareForward('pdfshipments','auitpdf_order');
    		throw $e;
    	}
    }
    public function pdfcreditmemosPredispatch(Varien_Event_Observer $observer)
    {
    	if ( $observer->getEvent()->getControllerAction()->getFullActionName() == 'adminhtml_sales_order_pdfcreditmemos')
    	{
    		$e = new Mage_Core_Controller_Varien_Exception();
    		//$e->prepareForward('pdfcreditmemos','order','auit_pdf');
    		$e->prepareForward('pdfcreditmemos','auitpdf_order');
    		
    		throw $e;
    	}
    }
    public function pdfdocsPredispatch(Varien_Event_Observer $observer)
    {
    	if ( $observer->getEvent()->getControllerAction()->getFullActionName() == 'adminhtml_sales_order_pdfdocs')
    	{
    		$e = new Mage_Core_Controller_Varien_Exception();
    		//$e->prepareForward('pdfdocs','order','auit_pdf');
    		$e->prepareForward('pdfdocs','auitpdf_order');
    		throw $e;
    	}
    }
    
    
    
	public function modelLoad(Varien_Event_Observer $observer)
    {
    	$object = $observer->getEvent()->getObject();
    	if ( $object instanceof Mage_Core_Model_Email_Template )
		{
			if ( Mage::getStoreConfigFlag('auit_pdf/general/attach_to_email') )
			{
				if ( !($object instanceof AuIt_Pdf_Model_Rewrite_Email_Template) )
				{
					if ( $object->getAuitAddAttachTemplate() != 10 )
					{
						$tmpId = $object->getTemplateId();
						$bfound = false;
						if ( $tmpId == Mage::getStoreConfig(Mage_Sales_Model_Order_Invoice::XML_PATH_EMAIL_TEMPLATE) ||
							$tmpId == Mage::getStoreConfig(Mage_Sales_Model_Order_Invoice::XML_PATH_EMAIL_GUEST_TEMPLATE) )
							$bfound = true;
						if ( !$bfound )
						{
							foreach ( Mage::app()->getStores() as $store )
							{
								if ( $tmpId == Mage::getStoreConfig(Mage_Sales_Model_Order_Invoice::XML_PATH_EMAIL_TEMPLATE,$store) ||
									$tmpId == Mage::getStoreConfig(Mage_Sales_Model_Order_Invoice::XML_PATH_EMAIL_GUEST_TEMPLATE,$store) )
								{
									$bfound = true;
									break;
								}
							}
						}
						if ( $bfound )
						{
							$block = '{{block type=\'core/template\' area=\'frontend\' template=\'auit/pdf/addpdf.phtml\' processor=$this shipment=$shipment order=$order}}';
							if ( strpos($object->getTemplateText(),'auit/pdf/addpdf') === false )
								$object->setTemplateText($object->getTemplateText().$block);
				  			$object->setAuitAddAttachTemplate(10);
						}
					}
				}
			}

			if ( Mage::getStoreConfigFlag('auit_pdf/general/attach_to_email_offer') )
			{
				if ( !($object instanceof AuIt_Pdf_Model_Rewrite_Email_Template) )
				{
					if ( $object->getAuitAddAttachTemplate() != 10 )
					{
						$tmpId = $object->getTemplateId();
						$bfound = false;
						if ( $tmpId == Mage::getStoreConfig(Mage_Sales_Model_Order::XML_PATH_EMAIL_TEMPLATE) ||
							$tmpId == Mage::getStoreConfig(Mage_Sales_Model_Order::XML_PATH_EMAIL_GUEST_TEMPLATE) )
							$bfound = true;
						if ( !$bfound )
						{
							foreach ( Mage::app()->getStores() as $store )
							{
								if ( $tmpId == Mage::getStoreConfig(Mage_Sales_Model_Order::XML_PATH_EMAIL_TEMPLATE,$store) ||
									$tmpId == Mage::getStoreConfig(Mage_Sales_Model_Order::XML_PATH_EMAIL_GUEST_TEMPLATE,$store) )
								{
									$bfound = true;
									break;
								}
							}
						}
						if ( $bfound )
						{
							$block = '{{block type=\'core/template\' area=\'frontend\' template=\'auit/pdf/addpdf_offer.phtml\' processor=$this shipment=$shipment order=$order}}';
							if ( strpos($object->getTemplateText(),'auit/pdf/addpdf') === false )
								$object->setTemplateText($object->getTemplateText().$block);
				  			$object->setAuitAddAttachTemplate(10);
						}
					}
				}
			}
			if ( Mage::getStoreConfigFlag('auit_pdf/general/attach_to_email_shipment') )
			{
				if ( !($object instanceof AuIt_Pdf_Model_Rewrite_Email_Template) )
				{
					if ( $object->getAuitAddAttachTemplate() != 10 )
					{
						$tmpId = $object->getTemplateId();
						$bfound = false;
						if ( $tmpId == Mage::getStoreConfig(Mage_Sales_Model_Order_Shipment::XML_PATH_EMAIL_TEMPLATE) ||
								$tmpId == Mage::getStoreConfig(Mage_Sales_Model_Order_Shipment::XML_PATH_EMAIL_GUEST_TEMPLATE) )
							$bfound = true;
						if ( !$bfound )
						{
							foreach ( Mage::app()->getStores() as $store )
							{
								if ( $tmpId == Mage::getStoreConfig(Mage_Sales_Model_Order_Shipment::XML_PATH_EMAIL_TEMPLATE,$store) ||
										$tmpId == Mage::getStoreConfig(Mage_Sales_Model_Order_Shipment::XML_PATH_EMAIL_GUEST_TEMPLATE,$store) )
								{
									$bfound = true;
									break;
								}
							}
						}
						if ( $bfound )
						{
							$block = '{{block type=\'core/template\' area=\'frontend\' template=\'auit/pdf/addpdf_shipment.phtml\' processor=$this shipment=$shipment order=$order}}';
							if ( strpos($object->getTemplateText(),'auit/pdf/addpdf') === false )
								$object->setTemplateText($object->getTemplateText().$block);
							$object->setAuitAddAttachTemplate(10);
						}
					}
				}
			}
			if ( Mage::getStoreConfigFlag('auit_pdf/general/attach_to_email_creditmemo') )
			{
				if ( !($object instanceof AuIt_Pdf_Model_Rewrite_Email_Template) )
				{
					if ( $object->getAuitAddAttachTemplate() != 10 )
					{
						$tmpId = $object->getTemplateId();
						$bfound = false;
						if ( $tmpId == Mage::getStoreConfig(Mage_Sales_Model_Order_Creditmemo::XML_PATH_EMAIL_TEMPLATE) ||
								$tmpId == Mage::getStoreConfig(Mage_Sales_Model_Order_Creditmemo::XML_PATH_EMAIL_GUEST_TEMPLATE) )
							$bfound = true;
						if ( !$bfound )
						{
							foreach ( Mage::app()->getStores() as $store )
							{
								if ( $tmpId == Mage::getStoreConfig(Mage_Sales_Model_Order_Creditmemo::XML_PATH_EMAIL_TEMPLATE,$store) ||
										$tmpId == Mage::getStoreConfig(Mage_Sales_Model_Order_Creditmemo::XML_PATH_EMAIL_GUEST_TEMPLATE,$store) )
								{
									$bfound = true;
									break;
								}
							}
						}
						if ( $bfound )
						{
							$block = '{{block type=\'core/template\' area=\'frontend\' template=\'auit/pdf/addpdf_creditmemo.phtml\' processor=$this shipment=$shipment order=$order}}';
							if ( strpos($object->getTemplateText(),'auit/pdf/addpdf') === false )
								$object->setTemplateText($object->getTemplateText().$block);
							$object->setAuitAddAttachTemplate(10);
						}
					}
				}
			}

		}
    }
	public function adminhtmlBefore(Varien_Event_Observer $observer)
    {
    	$block = $observer->getEvent()->getData('block');
    	
    	if ( $block instanceof Mage_Adminhtml_Block_Sales_Order_Grid )
    	{
    		$block->getMassactionBlock()->addItem('auit_pdfdocs_order_all', array(
    				'label'=> Mage::helper('auit_pdf')->__('Print Orders'),
    				'url'  => $block->getUrl('adminhtml/auitpdf_order/printall'),
    		));
    	}
    	else if (get_class($block) == 'BL_CustomGrid_Block_Rewrite_Mw_Ddate_Block_Adminhtml_Sales_Order_Grid')
    	{
    		$block->getMassactionBlock()->addItem('auit_pdfdocs_order_all', array(
    				'label'=> Mage::helper('auit_pdf')->__('SNM Print Orders'),
    				'url'  => $block->getUrl('adminhtml/auitpdf_order/printall'),
    		));
    	}
    	else if ( $block instanceof Mage_Adminhtml_Block_Sales_Order_View )
    	{
    		if ($block->getOrder()->getId()) {
    			
    			//$url = $block->getUrl('auit_pdf/order/print', array('order_id' => $block->getOrder()->getId()));
    			//$url = $block->getUrl('adminhtml/auitpdf_order/print', array('order_id' => $block->getOrder()->getId()));
    			
    			$url = $block->getUrl('adminhtml/auitpdf_order/print', array('order_id' => $block->getOrder()->getId()));
    			 
    			$block->addButton('print', array(
    					'label'     => Mage::helper('auit_pdf')->__('Print Order'),
    					'class'     => 'save',
    					'onclick'   => 'setLocation(\''.$url.'\')'
    			));
    		}
    	}
    }
}

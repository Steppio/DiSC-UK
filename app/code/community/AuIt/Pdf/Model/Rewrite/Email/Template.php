<?php
/*
class AuIt_Pdf_Model_Rewrite_Email_Template extends Aschroder_SMTPPro_Model_Email_Template
*/
class AuIt_Pdf_Model_Rewrite_Email_Template extends Mage_Core_Model_Email_Template
{
    public function getProcessedTemplate(array $variables = array())
    {
    	if ( isset($variables['order']) && is_object($variables['order']) && $variables['order'] instanceof Mage_Sales_Model_Order )
    	{
    		$order = $variables['order']; //24.01 Notice: Undefined index
    		$this->setProcessVariables($variables);
			if ( Mage::getStoreConfigFlag('auit_pdf/general/attach_to_email', $order->getStoreId()) )
			{
	    		$order = $variables['order'];
	    		$id = $this->getTemplateId();
	    		if ( $id == Mage::getStoreConfig(Mage_Sales_Model_Order_Invoice::XML_PATH_EMAIL_GUEST_TEMPLATE, $order->getStoreId() )
	    			||
	    			$id == Mage::getStoreConfig(Mage_Sales_Model_Order_Invoice::XML_PATH_EMAIL_TEMPLATE, $order->getStoreId())
	    			)
	    		{
					if (  $this->getAuitAddAttachTemplate() != 10 )
					{
						$block = '{{block type=\'core/template\' area=\'frontend\' template=\'auit/pdf/addpdf.phtml\' processor=$this shipment=$shipment order=$order}}';
						if ( strpos($this->getTemplateText(),'auit/pdf/addpdf') === false )
					  		$this->setTemplateText($this->getTemplateText().$block);
					  	$this->setAuitAddAttachTemplate(10);
					}
	    		}
	    	}
			if ( Mage::getStoreConfigFlag('auit_pdf/general/attach_to_email_offer', $order->getStoreId()) )
			{
	    		$order = $variables['order'];
	    		$id = $this->getTemplateId();
	    		if ( $id == Mage::getStoreConfig(Mage_Sales_Model_Order::XML_PATH_EMAIL_GUEST_TEMPLATE, $order->getStoreId() )
	    			||
	    			$id == Mage::getStoreConfig(Mage_Sales_Model_Order::XML_PATH_EMAIL_TEMPLATE, $order->getStoreId())
	    			)
	    		{
					if (  $this->getAuitAddAttachTemplate() != 10 )
					{
						$block = '{{block type=\'core/template\' area=\'frontend\' template=\'auit/pdf/addpdf_offer.phtml\' processor=$this shipment=$shipment order=$order}}';
						if ( strpos($this->getTemplateText(),'auit/pdf/addpdf') === false )
							$this->setTemplateText($this->getTemplateText().$block);
					  	$this->setAuitAddAttachTemplate(10);
					}
	    		}
	    	}
    		if ( Mage::getStoreConfigFlag('auit_pdf/general/attach_to_email_shipment', $order->getStoreId()) )
			{
	    		$order = $variables['order'];
	    		$id = $this->getTemplateId();
	    		if ( $id == Mage::getStoreConfig(Mage_Sales_Model_Order_Shipment::XML_PATH_EMAIL_GUEST_TEMPLATE, $order->getStoreId() )
	    			||
	    			$id == Mage::getStoreConfig(Mage_Sales_Model_Order_Shipment::XML_PATH_EMAIL_TEMPLATE, $order->getStoreId())
	    			)
	    		{

					if (  $this->getAuitAddAttachTemplate() != 10 )
					{
						$block = '{{block type=\'core/template\' area=\'frontend\' template=\'auit/pdf/addpdf_shipment.phtml\' processor=$this shipment=$shipment order=$order}}';
						if ( strpos($this->getTemplateText(),'auit/pdf/addpdf') === false )
							$this->setTemplateText($this->getTemplateText().$block);
					  	$this->setAuitAddAttachTemplate(10);
					}
	    		}
	    	}
    		if ( Mage::getStoreConfigFlag('auit_pdf/general/attach_to_email_creditmemo', $order->getStoreId()) )
			{
	    		$order = $variables['order'];
	    		$id = $this->getTemplateId();
	    		if ( $id == Mage::getStoreConfig(Mage_Sales_Model_Order_Creditmemo::XML_PATH_EMAIL_GUEST_TEMPLATE, $order->getStoreId() )
	    			||
	    			$id == Mage::getStoreConfig(Mage_Sales_Model_Order_Creditmemo::XML_PATH_EMAIL_TEMPLATE, $order->getStoreId())
	    			)
	    		{
					if (  $this->getAuitAddAttachTemplate() != 10 )
					{
						$block = '{{block type=\'core/template\' area=\'frontend\' template=\'auit/pdf/addpdf_creditmemo.phtml\' processor=$this shipment=$shipment order=$order}}';
						if ( strpos($this->getTemplateText(),'auit/pdf/addpdf') === false )
							$this->setTemplateText($this->getTemplateText().$block);
					  	$this->setAuitAddAttachTemplate(10);
					}
	    		}
	    	}
    	}
    	return parent::getProcessedTemplate($variables);
    }

    public function addAttachment($file, $filename){

    	$this->getMail()->createAttachment($file,Zend_Mime::TYPE_OCTETSTREAM,Zend_Mime::DISPOSITION_ATTACHMENT,Zend_Mime::ENCODING_BASE64, $filename);
    }

}

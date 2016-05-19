<?php
require_once 'snm/auit/pdf.php';
/*
if ( Mage::getVersion() < 1.5 )
{
	set_include_path(BP . DS . 'lib/snm/overloads' . PS . get_include_path());
}
*/
abstract class AuIt_Pdf_Model_Pdf_Base extends Mage_Sales_Model_Order_Pdf_Abstract
{
	abstract protected function getPdfType();
	protected $_emulatedDesignConfig = false;

	protected $_invoice=null;
	public 	  $bAddAppendix=true;
	protected $_processor;
	protected $_page=null;
	protected $_page_nr=0;
	protected $_page_max=0;

    protected $_tcpdf;
    protected $_margins;
    protected $_bsimulate;
    protected $_paymentInfo='';
    protected $_cfgPfad;
    protected $_streams;


    protected function _construct()
    {

    }
    protected function getConfigPfad()
    {
    	if ( !$this->_cfgPfad)
    		$this->_cfgPfad = 'auit_pdf/'.$this->getPdfType().'/';
    	return $this->_cfgPfad;
    }
    protected function getStoreConfig($pfad,$store=null)
    {
    	return Mage::getStoreConfig($this->getConfigPfad().$pfad,$store);
    }
    protected function getPdfTemplate($store = null)
    {
        $image = $this->getStoreConfig('template',$store);
        // 26.04.2012
        $mediaDir = rtrim(Mage::getBaseDir('media'), '\\/');
        if ($image and file_exists($mediaDir . '/snm-portal/sales/pdf/' . $image)) {
        	return $mediaDir . '/snm-portal/sales/pdf/' . $image;
        }
        return false;
    }
    protected function getPdfAppendix($store = null)
    {
    	if ( !$this->bAddAppendix)
    		return false;
        $image = $this->getStoreConfig('append',$store);
        // 26.04.2012
        $mediaDir = rtrim(Mage::getBaseDir('media'), '\\/');
        if ($image and file_exists($mediaDir . '/snm-portal/sales/pdf/' . $image)) {
            return $mediaDir . '/snm-portal/sales/pdf/' . $image;
        }
        return false;
    }
    protected function saveDesign()
    {
        $store = Mage::getDesign()->getStore();
        $storeId = is_object($store) ? $store->getId() : $store;
        $designConfig = new Varien_Object(array(
                'area' => Mage::getDesign()->getArea(),
        		//'theme' => Mage::getDesign()->getTheme(),
        		'package_name' => Mage::getDesign()->getPackageName(),
                'store' => $storeId,
        		'app_store'=>Mage::app()->getStore()->getId()
        		,'current_invoice'=>Mage::registry('current_invoice')
        		,'current_order'=>Mage::registry('current_order')
        		,'current_creditmemo'=>Mage::registry('current_creditmemo')
        		,'current_shipment'=>Mage::registry('current_shipment')
        		
        ));
    	return $designConfig;
    }
    protected function resetDesign($designConfig)
    {
    	$design = Mage::getDesign();
        if ( Mage::app()->getStore()->getId() != $designConfig->getAppStore() )
        {
        	Mage::app()->setCurrentStore(Mage::app()->getStore($designConfig->getAppStore()));
        }
        if ( $design->getArea() != $designConfig->getArea() )
        {
        	$design->setArea($designConfig->getArea());
        }
        $designStoreId = is_object($design->getStore()) ? $design->getStore()->getId() : $design->getStore();
        if ( $designStoreId != $designConfig->getStore() )
        {
        	$design->setStore($designConfig->getStore());
        }
        if ( $design->getPackageName() != $designConfig->getPackageName() )
        {
        	$design->setPackageName($designConfig->getPackageName());
        }
        foreach ( array('current_invoice','current_order','current_creditmemo','current_shipment') as $savobj )
        {
        	if ( $designConfig->getData($savobj) )
        	{
        		Mage::unregister($savobj);
        		Mage::register($savobj, $designConfig->getData($savobj));
        	}
        }
    }
	public function getPdf($invoices = array())
	{
        $designConfig = $this->saveDesign();
        if ( Mage::getDesign()->getArea() != 'frontend' )
        {
        	// Fix for Amasty/Orderattach Extension
        	Mage::getDesign()->setArea('frontend');
        }
        
        try {
	        $this->_beforeGetPdf();
	        $this->_initRenderer($this->getPdfType());
	        $this->_pdf = null;
			//$this->_pdf = new Zend_Pdf();
			$this->_streams = array();

	       	$this->drawInvoices($invoices);

			$this->_afterGetPdf();

			foreach ( $this->_streams as $stream )
			{
				if ( !$this->_pdf )
				{
					$this->_pdf = Zend_Pdf::parse($stream);
				}	
				else {
					$pdf = Zend_Pdf::parse($stream);
					foreach ($pdf->pages as $page)
				    	$this->_pdf->pages[] = clone($page);
				}
			}
			
			$firstInvoiceStore = null;
			foreach ($invoices as $invoice) {
				$firstInvoiceStore = $invoice->getOrder()->getStore();
				break;
			}
			if ( !$this->_pdf )
				$this->_pdf = new Zend_Pdf();
	        if ( $appendPdf = $this->getPdfAppendix($firstInvoiceStore) )
	        {
	        	$appendPdf = Zend_Pdf::load($appendPdf);
	        	foreach ( $appendPdf->pages as $page)
	        		$this->_pdf->pages[] = clone($page);
	        }
        }
        catch ( Exception $e )
        {
			$this->resetDesign($designConfig);
			throw $e;
        }
		$this->resetDesign($designConfig);
		if ( Mage::app()->getRequest()->getActionName() == 'print' )
		switch ( Mage::app()->getRequest()->getControllerName() )
		{
			case 'sales_order_invoice':
				Mage::helper('auit_pdf')->printPdfToFrontend('fname_to_email',$this->_pdf,$invoices);
				$response = Mage::app()->getResponse();
				$response->sendResponse();
				exit(0);
			break;
			case 'sales_order_shipment':
				Mage::helper('auit_pdf')->printPdfToFrontend('fname_to_email_shipment',$this->_pdf,$invoices);
				$response = Mage::app()->getResponse();
				$response->sendResponse();
				exit(0);
			break;
			case 'sales_order_creditmemo':
				Mage::helper('auit_pdf')->printPdfToFrontend('fname_to_email_creditmemo',$this->_pdf,$invoices);
				$response = Mage::app()->getResponse();
				$response->sendResponse();
				exit(0);
			break;
		}
        return $this->_pdf;
	}
	public function newPage(array $settings = array())
    {
    	$this->_tcpdf->AddPage();
    }
	public function PDFshowHeader(AuIt_Pdf $pdf)
	{
		//bMargin
		
		$this->_page_nr++;
		if ( !$this->_bsimulate )
			$pdf->showTemplatePage($this->_page_nr<= 1?1:2);
		$pdf->setAutoPB(false);
		if ( !$this->_bsimulate )
			$this->insertFreeItems($pdf);
		$pdf->setAutoPB(true);
		$this->setPageMargins($pdf,$this->_page_nr);
	}
    protected function _getProcessor()
    {
    	if ( !$this->_paymentInfo )
    		$this->_paymentInfo='';
    	if ( 1 || !$this->_processor )
    	{
	    	$invoice = $this->_invoice;
    		$order = $invoice->getOrder();
	    	//$store = $this->getStore();
	    	$processor = Mage::getModel('auit_pdf/email_template_filter');

	    	$tracksCollection = $order->getTracksCollection();
	    	$trackingInfo = '';
	        foreach($tracksCollection->getItems() as $track) {
	        		if ( empty($trackingInfo))
	        			$trackingInfo='<table class="trackinginfo">';
	        		$trackingInfo .= '<tr><td class="title">'.$track->getData('title').'</td>';
	        		$trackingInfo .= '<td class="number">'.$track->getData('number').'</td>';
	        		$trackingInfo .= '</tr>';
	        }
	        if ( !empty($trackingInfo))
				$trackingInfo.='</table>';


			$giftMsg = Mage::getModel('giftmessage/message');
			if ( $order->getGiftMessageId() )
			{
				$giftMsg->load($order->getGiftMessageId());
			}
			$data = array(	'order'=>$order,
						'customer'=>$this->getOrderCustomer($order),
						'helper'=> Mage::getModel('auit_pdf/template_filter_helper')->setProcessor($processor)->setInvoice($invoice),
						'billingaddress'=>$this->getBillingAddress($order),
						'shippingaddress'=>$this->getShippingAddress($order),
						'payment_info'=>$this->_paymentInfo,
						'tracking_info'=>$trackingInfo,
						'payment_method'=>$order->getPayment()->getMethod(),
						'invoice'=>$invoice,
						'entity'=>$invoice,
						'giftmessage'=>$giftMsg,
						'page_current'=>$this->_tcpdf->getRSCPage().$this->_tcpdf->getAliasNumPage(),
						'page_count'=>$this->_tcpdf->getAliasNbPages(),
						'order_date' => Mage::helper('core')->formatDate($order->getCreatedAtStoreDate(), 'medium', false),
						'invoice_date' => Mage::helper('core')->formatDate($invoice->getCreatedAtDate(), 'medium', false),
						'entity_date' => Mage::helper('core')->formatDate($invoice->getCreatedAtDate(), 'medium', false)
				);

			if ( $invoice instanceof Mage_Sales_Model_Order_Shipment )
			{
				$data['shipment'] =$invoice;
				$data['shipment_date'] =Mage::helper('core')->formatDate($invoice->getCreatedAtDate(), 'medium', false);
			}
			if ( $invoice instanceof Mage_Sales_Model_Order_Creditmemo )
			{
				$data['creditmemo'] =$invoice;
				$data['creditmemo_date'] =Mage::helper('core')->formatDate($invoice->getCreatedAtDate(), 'medium', false);
			}

			$processor->setVariables($data);
			$this->_processor=$processor;
    	}
		//$this->_processor->setVariables(array(	'payment_info'=>$this->_paymentInfo));
    	return $this->_processor;
    }

    protected function _formatText($address)
    {
        $return = array();
        $address = str_replace("\n"," ",$address);
        foreach (explode('|', $address) as $str) {
        	$return[] = trim($str);
        }
        return $return;
    }
    protected function getBillingAddress($order)
    {
    	if ( $order->getBillingAddress() )
    		return $order->getBillingAddress();
    	return new Varien_Object();
    }
    protected function getShippingAddress($order)
    {
    	if ( $order->getShippingAddress() )
    		return $order->getShippingAddress();
		return new Varien_Object();
    }
    protected function getOrderCustomer($order)
    {
    	if ( $order->getCustomer() )
    		return $order->getCustomer();
    	$customer =  Mage::getModel('customer/customer')->load($order->getCustomerId());
    	$order->setCustomer($customer);
    	return $customer;
    }
    protected function isBillingEqualShipping($order)
    {
    	$billingAdress = $order->getBillingAddress();
    	$shippingAdress = $order->getShippingAddress();
    	if ( !$shippingAdress || !$billingAdress)
    		return true;
    	foreach ( array('postcode','lastname','firstname','street','city','country_id') as $code )
    		if ( $billingAdress->getData($code) != $shippingAdress->getData($code) )
    			return false;
   		return true;
    }
    protected function insertBillingAddress($order)
    {
    	$renderer = Mage_Customer_Model_Address_Config::DEFAULT_ADDRESS_RENDERER;
    	$renderer = new AuIt_Pdf_Block_Customer_Address_Renderer_Default();
    	$renderer->setExtVariables($this->_processor->getVariables());
    	$type = new Varien_Object();
    	$code = $this->getStoreConfig('text_billingaddress');
    	$type->setCode('default')->setDefaultFormat($code);
    	$renderer = Mage::helper('customer/address')->getRenderer($renderer)->setType($type);
    	$type->setRenderer($renderer);

    	if ( $order->getBillingAddress() )
    		$this->drawLines($this->_formatText($renderer->render($order->getBillingAddress())),'billingaddress');
    }
    protected function insertShippingAddress($order)
    {
    	$code = $this->getStoreConfig('show_shippingaddress');
    	if ( $code != 1 || !$this->isBillingEqualShipping($order) )
    	{
	    	$renderer = Mage_Customer_Model_Address_Config::DEFAULT_ADDRESS_RENDERER;
	    	$renderer = new AuIt_Pdf_Block_Customer_Address_Renderer_Default();
	    	$renderer->setExtVariables($this->_processor->getVariables());
	    	$type = new Varien_Object();
	    	$code = $this->getStoreConfig('text_shippingaddress');
	    	$type->setCode('default')->setDefaultFormat($code);
	    	$renderer = Mage::helper('customer/address')->getRenderer($renderer)->setType($type);
	    	$type->setRenderer($renderer);
	    	if ( $order->getShippingAddress() )
	    	$this->drawLines($this->_formatText($renderer->render($order->getShippingAddress())),'shippingaddress');
    	}
    }
    protected function getBuildAfterTableText()
    {
    	$v = $this->getStoreConfig('text_after_table');

	    $v = $this->_processor->filter($v);
    	return $v;
    }
    protected function getBuildBeforeTableText()
    {
    	$v = $this->getStoreConfig('text_before_table');
	    $v = $this->_processor->filter($v);
    	return $v;
    }

    public function drawLines($lines,$blockName)
    {
    	$blockInfo  = Mage::helper('auit_pdf')->getStyleInfo($this->getConfigPfad().$blockName);
    	$pdf = $this->_tcpdf;
    	$txt = implode('<br />', $lines);
    	$html = '<div class="default">';
    	$html .= '<span class="'.$blockInfo->getClass().'">'. $txt.'</span></div>';
    	$pdf->setCellPaddings(0, 0, 0, 0);
		$pdf->writeHTMLCell($blockInfo->getW(), $blockInfo->getH(), $blockInfo->getX(), $blockInfo->getY(), $html);
    }
    public function drawBlock($pdf,$txt,$blockInfo)
    {
    	$html = '<div class="default">';
    	$html .= '<span class="'.$blockInfo->getClass().'">'. $txt.'</span></div>';
		$pdf->setCellPaddings(0, 0, 0, 0);
		$pdf->writeHTMLCell($blockInfo->getW(), $blockInfo->getH(), $blockInfo->getX(), $blockInfo->getY(), $html);
    }
    protected function insertFreeItems(AuIt_Pdf $pdf)
    {
    	$invoice = $this->_invoice;
    	//$store = $this->getStore();
    	if ( $this->_page_nr <= 1 )
    		$items = (array)Mage::helper('auit_pdf/arrayconfig')->getArrayStoreConfig($this->getConfigPfad().'free_page_1');
    	else
    		$items = (array)Mage::helper('auit_pdf/arrayconfig')->getArrayStoreConfig($this->getConfigPfad().'free_page_n');
    	foreach ( $items as $item )
    	{
    		$blockInfo  = Mage::helper('auit_pdf')->getStyleItem($item);
    		$v = $blockInfo->getValue();
    		if ( strpos($v,'{{') !== false )
    		{
	        	$v = $this->_processor->filter($v);
    		}

    		$this->drawBlock($pdf,$v,$blockInfo);
		}
    }
    public function getMargin($pangenr,$key)
    {
//    	if ( $this->_tcpdf )
//    		$pangenr = (int)@$this->_tcpdf->getPage();
    	if ( !$this->_margins )
    	{
    		foreach ( array('table_margins','table_margins2') as $mode)
    		{
		    	$margins = (array)Mage::helper('auit_pdf/arrayconfig')->getArrayStoreConfig($this->getConfigPfad().$mode);
		    	$margins = array_shift($margins);
		    	$defmargins = (array)Mage::helper('auit_pdf/config')->getDefaults($this->getConfigPfad().$mode);
		    	$defmargins = array_shift($defmargins);
		    	$this->_margins[$mode] = Mage::helper('auit_pdf')->setArrayDefault($margins,$defmargins);
    		}
    	}
        $mode = 'table_margins';
    	if ( $pangenr > 1 ){
    		$mode = 'table_margins2';
    	}
    	return $this->_margins[$mode][$key];
    }
    protected function setPageMargins($pdf,$_page_nr)
    {
    	$pdf->SetMargins($this->getMargin($_page_nr,'left'), $this->getMargin($_page_nr,'top1'), $this->getMargin($_page_nr,'right'));

    	$pdf->SetAutoPageBreak(true,$this->getMargin($_page_nr,'bottom'));
    	$pdf->SetY($this->getMargin($_page_nr,'top1'),true);//$this->_margins['top1'],true);
    }
    protected function drawInvoicesOld($invoices)
    {
    	$template = Mage::getModel('core/email_template');
    	$store = $currentStore = Mage::app()->getStore();
    	foreach ($invoices as $invoice) {
    		if ( $invoice instanceof Mage_Sales_Model_Order) { // Offer -> Invoice
    			$invoice->setOrder($invoice);
    		}
    		if ( $currentStore->getId() == 0 )
    			$store = $invoice->getOrder()->getStore();
    
    		$this->emulateInvoice($store,$template,$invoice);
    		Mage::app()->getLocale()->emulate($store->getId());
    
    		$this->_page_nr=0;
    
    		$this->_tcpdf = $pdf = new AuIt_Pdf($this);
    
    		$this->_getProcessor();
    		for ( $i=1 ; $i < 2; $i++ )
    		{
    			$this->_page_nr=0;
    			$this->_bsimulate = ($i == 0)?true:false;
    			$pdf->setGlobalCSS(Mage::helper('auit_pdf')->getCss());
    			if ( Mage::getStoreConfig('auit_pdf/style/list_ident') != '')
    				$pdf->setListIndentWidth(Mage::getStoreConfig('auit_pdf/style/list_ident'));
    			$this->_tcpdf->setTemplatePDF($this->getPdfTemplate());
    			$this->drawInvoice($invoice,false);
    			$this->newPage();
    			if ( !$this->_bsimulate )
    			{
    				$pdf->setAutoPB(false);
    				$this->insertBillingAddress($invoice->getOrder());
    				$this->insertShippingAddress($invoice->getOrder());
    				$pdf->setAutoPB(true);
    			}
    			$this->drawInvoice($invoice,true);
    			$this->_page_max = $this->_page_nr;
    			if ( !$this->_bsimulate )
    			{
    				$stream = $this->_tcpdf->Output('', 'S');
    				$this->_streams[]=$stream;
    			}
    		}
    		Mage::app()->getLocale()->revert();
    	}
    	$this->emulateInvoice($currentStore,$template,null);
    
    }
    
    protected function drawInvoices($invoices)
    {
    	$template = Mage::getModel('core/email_template');
    	$store = $currentStore = Mage::app()->getStore();
    	
        $this->_page_nr=0;
        $this->_tcpdf = $pdf = new AuIt_Pdf($this);

        $pdf->setGlobalCSS(Mage::helper('auit_pdf')->getCss());
        if ( Mage::getStoreConfig('auit_pdf/style/list_ident') != '')
        	$pdf->setListIndentWidth(Mage::getStoreConfig('auit_pdf/style/list_ident'));
        $this->_tcpdf->setTemplatePDF($this->getPdfTemplate());
        
    	foreach ($invoices as $invoice) {
			if ( $invoice instanceof Mage_Sales_Model_Order) { // Offer -> Invoice
				$invoice->setOrder($invoice);
			}
        	if ( $currentStore->getId() == 0 )
				$store = $invoice->getOrder()->getStore();

        	$this->emulateInvoice($store,$template,$invoice);
        	Mage::app()->getLocale()->emulate($store->getId());
        	$this->_page_nr=0;
			
			$this->_getProcessor();
        	for ( $i=1 ; $i < 2; $i++ )
        	{
        		$this->_page_nr=0;
//        		$this->_page_nr=0;
        		$this->_bsimulate = ($i == 0)?true:false;
				$this->drawInvoice($invoice,false);
				$this->newPage();
				if ( !$this->_bsimulate )
				{
					$pdf->setAutoPB(false);
						$this->insertBillingAddress($invoice->getOrder());
						$this->insertShippingAddress($invoice->getOrder());
					$pdf->setAutoPB(true);
				}
				
				$this->drawInvoice($invoice,true);
				$this->_page_max = $this->_page_nr;
				if ( !$this->_bsimulate )
				{
//			        $stream = $this->_tcpdf->Output('', 'S');
	//		        $this->_streams[]=$stream;
				}
				
        	}
        	Mage::app()->getLocale()->revert();
        }
        $this->emulateInvoice($currentStore,$template,null);
        
        $stream = $this->_tcpdf->Output('', 'S');
       
        $this->_streams[]=$stream;
        
	}
	protected function emulateInvoice($store,$template,$invoice)
	{

		/** 1.5
        $appEmulation = Mage::getSingleton('core/app_emulation');
        $initialEnvironmentInfo = $appEmulation->startEnvironmentEmulation($storeId);
		**/

		//Mage::app()->getLocale()->emulate($store->getId());

		$this->_invoice = $invoice;
		$this->setStore(null);
        if ( Mage::registry('current_invoice') )
        	Mage::unregister('current_invoice');
        if ( Mage::registry('current_order') )
        	Mage::unregister('current_order');
        if ( Mage::registry('current_creditmemo') )
        	Mage::unregister('current_creditmemo');
        if ( Mage::registry('current_shipment') )
        	Mage::unregister('current_shipment');
		if ( $invoice )
		{
			if ( $invoice instanceof Mage_Sales_Model_Order_Creditmemo )
			{
				Mage::register('current_creditmemo', $invoice);
			}else if ( $invoice instanceof Mage_Sales_Model_Order_Shipment )
			{
				Mage::register('current_shipment', $invoice);
			}
			Mage::register('current_invoice', $invoice);

			Mage::register('current_order', $invoice->getOrder());

    		$this->setStore($store);
		}
        $template->emulateDesign($store->getId());
        if ( Mage::app()->getStore()->getId() != $store->getId() )
        {
        	 Mage::app()->setCurrentStore($store);
        }
	}
	/*
    protected function emulateTemplateDesign($template,$storeId, $area='frontend')
    {
		if ( method_exists($template, 'emulateDesign') )
			$template->emulateDesign($store->getId());
		else { // 1.4.1
	        if ($storeId) {
	            // save current design settings
	            $this->_emulatedDesignConfig = clone $template->getDesignConfig();
	            if ($template->getDesignConfig()->getStore() != $storeId) {
	                $template->setDesignConfig(array('area' => $area, 'store' => $storeId));
	                $template->getProcessedTemplate();
	                //$template->_applyDesignConfig();
	            }
	        } else {
	            $this->_emulatedDesignConfig = false;
	        }
		}
    }
    */
    protected function drawInvoice($invoice,$boutput=true)
    {
    	$package = Mage::getDesign();

    	$layout = Mage::getModel('core/layout');
        /* @var $layout Mage_Core_Model_Layout */
		$layout->setArea($package->getArea());
    	$update = $layout->getUpdate();
		$update->addHandle('STORE_'.Mage::app()->getStore()->getCode());
		$update->addHandle('THEME_'.$package->getArea().'_'.$package->getPackageName().'_'.$package->getTheme('layout'));

		if ( Mage::getStoreConfigFlag('auit_pdf/general/trace_html_output') )
		{
			Mage::log('STORE_'.Mage::app()->getStore()->getCode(),null,'auit.log',true);
			Mage::log('THEME_'.$package->getArea().'_'.$package->getPackageName().'_'.$package->getTheme('layout'),null,'auit.log',true);
		}
		
		// MAU 6.12
		$block=null;
		if ( $invoice instanceof Mage_Sales_Model_Order_Shipment )
		{
			$update->addHandle('sales_order_printshipment');
		}
		else if ( $invoice instanceof Mage_Sales_Model_Order_Creditmemo )
		{
			$update->addHandle('sales_order_printcreditmemo');
		}
		else if ( $invoice instanceof Mage_Sales_Model_Order )
		{
			$update->addHandle('sales_order_print');
		}
		else {
			$update->addHandle('sales_order_printinvoice');
		}


    	$layout->getUpdate()->load();
        $layout->generateXml();
        $layout->generateBlocks();
        $layout->setDirectOutput(false);

		if ( $invoice instanceof Mage_Sales_Model_Order_Shipment )
		{
			$block = $layout->getBlock('sales.order.print.shipment');
		}
		else if ( $invoice instanceof Mage_Sales_Model_Order_Creditmemo )
		{
			$block = $layout->getBlock('sales.order.print.creditmemo');
		}
		else if ( $invoice instanceof Mage_Sales_Model_Order )
		{
			$block = $layout->getBlock('sales.order.print');
		}
		else {
			$block = $layout->getBlock('sales.order.print.invoice');
		}
		
		if ( !$block && Mage::getStoreConfigFlag('auit_pdf/general/trace_html_output') )
		{
			Mage::log('Cant\'t found block for : '.get_class($invoice),null,'auit.log',true);
		}
		
        if ( $block )
        {

        	// MAU 20.07.2011
        	$code = $this->getStoreConfig('text_billingaddress');
        	if ( $this->getPdfType() == 'invoice' && Mage::getStoreConfigFlag('auit_pdf/invoice/bundle_template') )
        	{
        		if ( $block instanceof Mage_Sales_Block_Items_Abstract )
        		{
        			$renderer = $block->getItemRenderer('bundle');
        			if ( $renderer ) {
        				$renderer->setTemplate('auit/pdf/invoice/items/renderer.phtml');
        			}
        		}
        	}
        	elseif ( $this->getPdfType() == 'creditmemo' && Mage::getStoreConfigFlag('auit_pdf/creditmemo/bundle_template') )
        	{
        		if ( $block instanceof Mage_Sales_Block_Items_Abstract )
        		{
        			$renderer = $block->getItemRenderer('bundle');
        			if ( $renderer ) {
        				$renderer->setTemplate('auit/pdf/creditmemo/items/renderer.phtml');
        			}
        		}
        	}elseif ( $this->getPdfType() == 'shipment' && Mage::getStoreConfigFlag('auit_pdf/shipment/bundle_template') )
        		{
        			if ( $block instanceof Mage_Sales_Block_Items_Abstract )
        			{
        				$renderer = $block->getItemRenderer('bundle');
        				if ( $renderer ) {
        					$renderer->setTemplate('auit/pdf/shipment/items/renderer.phtml');
        				}
        			}
        	}else {
	        	if ( ($this->getPdfType() != 'shipment'
	        		 &&
	        		 Mage::getStoreConfigFlag('auit_pdf/general/show_bundle_price_row_one'))
	        		 ||
	        		 ($this->getPdfType() == 'shipment'
	        		 &&
	        		 !Mage::getStoreConfigFlag('auit_pdf/general/show_bundle_qty_row_one'))
	        	)
	        	{
		        	if ( $block instanceof Mage_Sales_Block_Items_Abstract )
		        	{
		        		$renderer = $block->getItemRenderer('bundle');
		        		$block->addItemRender('bundle', 'auit_pdf/bundle_renderer', $renderer->getTemplate());
		        	}
	        	}
        	}
			$template = $this->getStoreConfig('table_template');
			if ( !$template )
				$template = $this->getPdfType().'.phtml';


        	$block->setTemplate('auit/pdf/print/'.$template);

        	$paymenInfoBlock = $block->getChild('payment_info');
        	if ( $paymenInfoBlock )
        	{
        	 	$paymenInfoBlock->setTemplate('auit/pdf/print/checkmo.phtml');
        	}
        	$this->_paymentInfo = 'no info';
        	if ( $paymenInfoBlock && $paymenInfoBlock->getTemplateFile() )
        	{
        		// fix for payment without paymentinfo (M2E pro)
        		$absTempFile = Mage::getDesign()->getTemplateFilename($paymenInfoBlock->getTemplate());
        		if ( strpos($absTempFile,$paymenInfoBlock->getTemplateFile()) === false )
        		{
        			$this->_paymentInfo = ''.$paymenInfoBlock->getPaymentMethod();
        		}
        		else {
        			$this->_paymentInfo = trim(str_replace(array("\n",'  '),'',$block->getPaymentInfoHtml()));
        		}
        	}
 			$paymentBlockHtml = '';
	        try {
            	$paymentBlock = Mage::helper('payment')->getInfoBlock($invoice->getOrder()->getPayment())
                	->setIsSecureMode(true);
            	$paymentBlock->getMethod()->setStore($invoice->getOrder()->getStore());
            	$paymentBlockHtml = $paymentBlock->toHtml();
	        } catch (Exception $exception) {
	        }
 			$this->_processor->setVariables(array(	'payment_info'=>$this->_paymentInfo,'payment_html'=>$paymentBlockHtml));
 			$block->setBuilBeforeTableText(trim($this->getBuildBeforeTableText()));
        	$block->setBuildAfterTableText(trim($this->getBuildAfterTableText()));

        	if ( $boutput )
        	{
	        	$html = $block->toHtml();
        		if ( Mage::getStoreConfigFlag('auit_pdf/general/trace_html_output') )
				{
					Mage::log('Output from block ('.get_class($block).') '.$html,null,'auit.log',true);
				}
	        	
	        	$html = '<div class="default">'.trim($html).'</div>';
	 			$pdf = $this->_tcpdf;
	        	/*
	 			$html = str_replace('<strong>','',$html);
	 			$html = str_replace('</strong>','',$html);
	        	*/
//				$pdf->SetY($this->getMargin('top1'),true);//$this->_margins['top1'],true);
				$this->setPageMargins($pdf,$this->_page_nr);
				$html = str_replace("\n",'',$html);
				$html = str_replace("\r",'',$html);
				$html = str_replace("<br /></div>",'</div>',$html);
				$html = str_replace("<br/></div>",'</div>',$html);
				$html = str_replace("<br/></td>",'</td>',$html);
				$html = str_replace("<br /></td>",'</td>',$html);
				/*
				$html = str_replace("<h3 ",'<span ',$html);
				$html = str_replace("</h3>",'</span>',$html);
*/
				if ( Mage::getStoreConfigFlag('auit_pdf/general/trace_html_output') )
				{
					Mage::log($html,null,'auit.log',true);
				}
				
				$pdf->writeHTML($html, true, false, false, false, '');
        	}
        }
    	return;
    }
    public function drawLineBlocks(Zend_Pdf_Page $page, array $draw, array $pageSettings = array())
    {
       return $page;
    }
}

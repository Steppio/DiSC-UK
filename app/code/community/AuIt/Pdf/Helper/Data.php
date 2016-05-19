<?php
/**
 * AuIt
 *
 * @category   AuIt
 * @author     M Augsten
 * @copyright  Copyright (c) 2010 Ingenieurbüro (IT) Dipl.-Ing. Augsten (http://www.au-it.de)
 */
class AuIt_Pdf_Helper_Data extends Mage_Core_Helper_Abstract
{
	protected $_styleInfos=array();
	public function getStyleInfo($blockName)
    {
		if ( !isset($this->_styleInfos[$blockName]) )
		{
	    	$items = (array)Mage::helper('auit_pdf/arrayconfig')->getArrayStoreConfig($blockName);
	    	$items = array_shift($items);
	    	$this->_styleInfos[$blockName] = $this->getStyleItem($items);
		}
		return $this->_styleInfos[$blockName];
    }
    public function getStyleItem($items)
    {
    	$blockInfo=array('x'=>10,'y'=>10,'w'=>60,'h'=>40,'class'=>'default');
    	$items = $this->setArrayDefault($items,$blockInfo);
    	return Mage::getModel('auit_pdf/pdf_style',$items);
    }
	public function setArrayDefault($x,$defaults)
	{

    	foreach ( $defaults as $key => $v)
    	{
    		if ( !isset($x[$key])|| trim($x[$key]) === '' )
    		{
    			$x[$key]=$v;
    		}
    	}
		return $x;
	}
    public function getCss()
    {
    	$css = Mage::getStoreConfig('auit_pdf/style/global');
    	return $css;
    }

    public function getPdfFName($label_key,$models)
    {
    	$prefix = Mage::getStoreConfig('auit_pdf/general/'.$label_key);
    	$fmode = Mage::getStoreConfig('auit_pdf/general/'.$label_key.'_name');
    	$pdf_filename = $prefix;
    	if ( $models )
    	foreach ( $models as $item){
    		$f='';
    		switch ($fmode)
    		{
    			case '1': //date
    				$f=Mage::getSingleton('core/date')->date('Y-m-d_H-i-s');
    				if ( $item->getCreatedAtStoreDate() )
    					$f = $item->getCreatedAtStoreDate()->toString('Y-MM-dd');
    				break;
    			case '2': //Number
    				if ( $item->getIncrementId() )
    					$f =$item->getIncrementId();
    				else
    					$f =$item->getId();
    				break;
    			case '3': //Number_Date
    				if ( $item->getIncrementId() )
    					$f =$item->getIncrementId();
    				else
    					$f =$item->getId();
    				if ( $item->getCreatedAtStoreDate() )
    					$f .= '_'.$item->getCreatedAtStoreDate()->toString('Y-MM-dd');
    				else
    					$f .= '_'.Mage::getSingleton('core/date')->date('Y-m-d_H-i-s');
    				break;
    			default:
    				$f=Mage::getSingleton('core/date')->date('Y-m-d_H-i-s');
    			break;
    		}
    		$pdf_filename .= $f;
    		break;
    	}
    	$pdf_filename .= '.pdf';
		return $pdf_filename;
    }
    public function printFrontendPdf($label_key,$modelName,$invoices)
    {
    	if ( $invoices )
    	{
    		$pdf = Mage::getModel($modelName)->getPdf($invoices);
    		if ( $pdf )
    		{
    			$fname = $this->getPdfFName($label_key,$invoices);
				$this->_prepareDownloadResponse($fname, $pdf->render(), 'application/pdf');
			}
    	}
    }
    public function printPdfToFrontend($label_key,$pdf,$invoices)
    {
    	if ( $invoices && $pdf )
    	{
   			$fname = $this->getPdfFName($label_key,$invoices);
			$this->_prepareDownloadResponse($fname, $pdf->render(), 'application/pdf');
    	}
    }
    public function pdfToResponse($fname, $pdf, $contentType ='application/pdf', $contentLength = null)
    {
    	return $this->_prepareDownloadResponse($fname, $pdf->render(), $contentType);
    }
    protected function _prepareDownloadResponse($fileName, $content, $contentType ='application/octet-stream', $contentLength = null)
    {
    	$c=10;
    	while ( $c )
    	{
    		$c--;
    		if ( ob_get_clean() === false )
    			break;
    	}
    	$response = Mage::app()->getResponse();
    	$response->clearAllHeaders()
    	->clearBody();
    	$response->setHttpResponseCode(200)
    	->setHeader('Pragma', 'public', true)
    	->setHeader('Cache-Control', 'must-revalidate, post-check=0, pre-check=0',true)
    	->setHeader('Content-type', $contentType, true)
    	->setHeader('Content-Length', is_null($contentLength) ? strlen($content) :$contentLength)
    	->setHeader('Content-Disposition', 'attachment; filename=' . $fileName)
    	->setHeader('Last-Modified', date('r'));
    	if (!is_null($content)) {
    		$response->setBody($content);
    	}
    	$response->sendResponse();
    	exit();
    	return $this;
    	/*    	
    	$response = Mage::app()->getResponse();
    	$response->clearAllHeaders()
    			->clearBody();
        $response->setHttpResponseCode(200)
            ->setHeader('Pragma', 'public', true)
            ->setHeader('Cache-Control', 'must-revalidate, post-check=0, pre-check=0',true)
            ->setHeader('Content-type', $contentType, true)
            ->setHeader('Content-Length', is_null($contentLength) ? strlen($content) :$contentLength)
            ->setHeader('Content-Disposition', 'attachment; filename=' . $fileName)
            ->setHeader('Last-Modified', date('r'));
          if (!is_null($content)) {
            $response->setBody($content);
	        }
        return $this;
        */
    }
    public function getLText()
    {
    	return $this->__('Plea'.'se c'.'hec'.'k y'.'our '.'lic'.'ense'.' k'.'ey!');
    }
    public function getText($text)
    {
    	return $this->__($text);
    }
    public function getOfferQtyOrdered($_items,$_item,$orderItemId)
    {
    	if ( $_item->getProductType() == 'bundle')
    	{
    		if ( !$orderItemId )
    			return '';
	        foreach ($_items as $_item)
	        {
	        	if ($_item->getId() == $orderItemId )
	        		return $_item->getQtyOrdered()*1;
	        }
    	}else if ($_item->getQtyOrdered() > 0)
			return $_item->getQtyOrdered()*1;
    	return '';
    }
    public function replaceInvoiceTotalsHtml($_invoice,$row,$cols)
    {
    	$row = str_replace('colspan="4"','colspan="'.($cols-1).'"',$row);
    	$row = trim(str_replace(array("\n",'  ','display:none'),'',$row));
    	$row = preg_replace('|(onclick="[^"]*")|','',$row);
    	$row = preg_replace('|(&[^a])|','&amp; ',$row);
    	$row = str_replace('<br /></td>','</td>',$row);

    	$prefix = Mage::getStoreConfig('auit_pdf/general/amount_prefix');
    	if ( $prefix ){
    		// FIX negative discount
    		$countTr = preg_match_all("|<tr[^>]*class=\"discount\"[^>]*>(.*)</tr[^>]*>|usiU",$row,$discountMatch, PREG_PATTERN_ORDER);
    		if ( $countTr && isset($discountMatch[0][0]) )
    		{
    			$org = $discountMatch[0][0];
    			$repl = str_replace('class="price">','class="price">'.$prefix,$org);
    			$row = str_replace($org,$repl,$row);
    		}
    	}
    	return $row;
    }
    public function showSKULine($_add,$sku)
    {
    	if ( $_add && trim(html_entity_decode($sku),' '.chr(160)) ){
    		return '<div class="sku"><span class="sku-label">'.$this->__('Sku').': </span>'.$sku.'</div>';
    	}
    		
   		return '';
	}
	public function addAttachments($section,$mail,$collection)
	{
		$store=null;
		if ( $collection )
		{
			foreach ( $collection as $entity )
			{
				if ( $entity instanceof Mage_Sales_Model_Order) { 
					$store = $entity->getStore();
				}else {
					$store = $entity->getOrder()->getStore();
				}
			}
		}
		for ( $i=1; $i <= 2; $i++ )
		{
			if ( Mage::getStoreConfigFlag("auit_pdf/{$section}/pdf_{$i}_enabled",$store) )
			{
				$pdf = Mage::getStoreConfig("auit_pdf/{$section}/pdf_{$i}",$store);
				$pdf_filename=trim(Mage::getStoreConfig("auit_pdf/{$section}/pdf_{$i}_filename",$store));
				
				if ( !$pdf_filename)
					$pdf_filename=$pdf;
				$ext = pathinfo($pdf_filename, PATHINFO_EXTENSION);
				if ( !$ext )
					$pdf_filename .= '.'.pathinfo($pdf, PATHINFO_EXTENSION);
				// 26.04.2012
				$mediaDir = rtrim(Mage::getBaseDir('media'), '\\/');
				$pdf = $mediaDir . '/snm-portal/sales/pdf/' . $pdf;
				if (file_exists($pdf)) {
					$mail->createAttachment(file_get_contents($pdf),Zend_Mime::TYPE_OCTETSTREAM,Zend_Mime::DISPOSITION_ATTACHMENT,Zend_Mime::ENCODING_BASE64, $pdf_filename);
					
				}
			} 
		}
	}
}
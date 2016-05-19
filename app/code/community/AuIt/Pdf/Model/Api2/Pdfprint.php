<?php
/**
 * AuIt 
 *
 * @category   AuIt
 * @author     M Augsten
 * @copyright  Copyright (c) 2010 Ingenieurbüro (IT) Dipl.-Ing. Augsten (http://www.au-it.de)
 */
class AuIt_Pdf_Model_Api2_Pdfprint extends Mage_Api2_Model_Resource
{
	protected function _retrieve()
	{
		$resultAsPdf = !is_null($this->getRequest()->getParam('aspdf'));
		$modes = array('order','invoice','shipment','creditmemo');
		$type = '';
		$id = 0;
		foreach ( $modes as $mode )
		{
			$id = $this->getRequest()->getParam($mode.'_id');
			if ( $id )
			{
				$type=$mode;
				break;
			}
		}
		$item 	= array();
		$pdf 	= null;
		$baseData = '';
		$fname 	= '';
		switch ( $type )
		{
			case 'order':
				if ($obj = Mage::getModel('sales/order')->load($id)) {
					if ( $obj->getId()) {
						$pdf = Mage::getModel('auit_pdf/offer')->getPdf(array($obj));
						$fname = Mage::helper('auit_pdf')->getPdfFName('fname_to_email_offer',array($obj));
					}
				}
				break;
			case 'invoice':
	
				if ($obj = Mage::getModel('sales/order_invoice')->loadByIncrementId($id)) {
					if ( $obj->getId()) {
						$pdf = Mage::getModel('sales/order_pdf_invoice')->getPdf(array($obj));
						$fname = Mage::helper('auit_pdf')->getPdfFName('fname_to_email',array($obj));
					}
				}
				break;
			case 'shipment':
				if ($obj = Mage::getModel('sales/order')->loadByIncrementId($id)) {
					if ( $obj->getId() ) {
						$pdf = Mage::getModel('sales/order_pdf_shipment')->getPdf(array($obj));
						$fname = Mage::helper('auit_pdf')->getPdfFName('fname_to_email_shipment',array($obj));
					}
				}
				break;
			case 'creditmemo':
				if ($obj = Mage::getModel('sales/order_creditmemo')->load($id,'increment_id')) {
					if ( $obj->getId() ) {
						$pdf = Mage::getModel('sales/order_pdf_creditmemo')->getPdf(array($obj));
						$fname = Mage::helper('auit_pdf')->getPdfFName('fname_to_email_creditmemo',array($obj));
					}
				}
				break;
		}
		if ( $pdf  && $resultAsPdf )
		{
			// @todo : Filter au ffname und data
			Mage::helper('auit_pdf')->pdfToResponse($fname, $pdf);
			Mage::app()->getResponse()->sendResponse();
			exit(0);
		}
		if ( $pdf )
			$baseData = base64_encode($pdf->render());
		return array('id'=>$id,
				'type'=>$type,
				'fname'=>$fname,
				'data64'=>''.$baseData.'');
	}
}

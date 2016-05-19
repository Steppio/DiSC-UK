<?php
class AuIt_Pdf_OrderController extends Mage_Adminhtml_Controller_Action
{
    protected function _isAllowed()
    {
    	return true;
    }

    public function printAction()
    {
        if ($id = $this->getRequest()->getParam('order_id')) {
            if ($order = Mage::getModel('sales/order')->load($id)) {
                $pdf = Mage::getModel('auit_pdf/offer')->getPdf(array($order));
                $fname = Mage::helper('auit_pdf')->getPdfFName('fname_to_email_offer',array($order));
                $this->_prepareDownloadResponse($fname, $pdf->render(), 'application/pdf');
            }
        }
        else {
            $this->_forward('noRoute');
        }
    }
    
    
    /**
     * Print all documents for selected orders
     */
    public function printallAction(){
    	$orderIds = $this->getRequest()->getPost('order_ids');
    	$flag = false;
    	
    	if (!empty($orderIds)) {
    		$orders=array();
    		foreach ($orderIds as $orderId) {
    			if ($order = Mage::getModel('sales/order')->load($orderId)) {
    				$orders[]=$order;
    			}
    		}
    		$flag = true;
    		$pdf = Mage::getModel('auit_pdf/offer')->getPdf($orders);
    		if ($flag) {
    			return $this->_prepareDownloadResponse(
    					'docs'.Mage::getSingleton('core/date')->date('Y-m-d_H-i-s').'.pdf',
    					$pdf->render(), 'application/pdf'
    			);
    		} else {
    			$this->_getSession()->addError($this->__('There are no printable documents related to selected orders.'));
    			
    		}
    	}
    	$this->_redirect('adminhtml/sales_order/index');
    }
    public function pdfinvoicesAction(){
    	$orderIds = $this->getRequest()->getPost('order_ids');
    	$flag = false;
    	if (!empty($orderIds)) {
    		$docs=array();
    		foreach ($orderIds as $orderId) {
    			$invoices = Mage::getResourceModel('sales/order_invoice_collection')
    			->setOrderFilter($orderId)
    			->load();
    			if ($invoices->getSize() > 0) {
    				$flag = true;
    				foreach ( $invoices as $invoice )
    					$docs[]=$invoice;
    			}
    		}
    		if ($flag) {
    			$pdf = Mage::getModel('auit_pdf/invoice')->getPdf($docs);
    			return $this->_prepareDownloadResponse(
    					'invoice'.Mage::getSingleton('core/date')->date('Y-m-d_H-i-s').'.pdf', $pdf->render(),
    					'application/pdf'
    			);
    		} else {
    			$this->_getSession()->addError($this->__('There are no printable documents related to selected orders.'));
    			
    		}
    	}
    	$this->_redirect('adminhtml/sales_order/index');
    }
    public function pdfshipmentsAction(){
    	$orderIds = $this->getRequest()->getPost('order_ids');
    	$flag = false;
    	if (!empty($orderIds)) {
    		$docs=array();
    		foreach ($orderIds as $orderId) {
    			$shipments = Mage::getResourceModel('sales/order_shipment_collection')
    			->setOrderFilter($orderId)
    			->load();
    			if ($shipments->getSize()) {
    				$flag = true;
    				foreach ( $shipments as $shipment )
    					$docs[]=$shipment;
    				/*
    				if (!isset($pdf)){
    					$pdf = Mage::getModel('sales/order_pdf_shipment')->getPdf($shipments);
    				} else {
    					$pages = Mage::getModel('sales/order_pdf_shipment')->getPdf($shipments);
    					$pdf->pages = array_merge ($pdf->pages, $pages->pages);
    				}
    				*/
    			}
    		}
    		if ($flag) {
    			$pdf = Mage::getModel('auit_pdf/shipment')->getPdf($docs);
    			return $this->_prepareDownloadResponse(
    					'packingslip'.Mage::getSingleton('core/date')->date('Y-m-d_H-i-s').'.pdf', $pdf->render(),
    					'application/pdf'
    			);
    		} else {
    			$this->_getSession()->addError($this->__('There are no printable documents related to selected orders.'));

    		}
    	}
		$this->_redirect('adminhtml/sales_order/index');
    }
    public function pdfcreditmemosAction(){
    	$orderIds = $this->getRequest()->getPost('order_ids');
    	$flag = false;
    	if (!empty($orderIds)) {
    		$docs=array();
    		foreach ($orderIds as $orderId) {
    			$creditmemos = Mage::getResourceModel('sales/order_creditmemo_collection')
    			->setOrderFilter($orderId)
    			->load();
    			if ($creditmemos->getSize()) {
    				$flag = true;
    				foreach ( $creditmemos as $creditmemo )
    					$docs[]=$creditmemo;
    				/*
    				if (!isset($pdf)){
    					$pdf = Mage::getModel('sales/order_pdf_creditmemo')->getPdf($creditmemos);
    				} else {
    					$pages = Mage::getModel('sales/order_pdf_creditmemo')->getPdf($creditmemos);
    					$pdf->pages = array_merge ($pdf->pages, $pages->pages);
    				}
    				*/
    			}
    		}
    		if ($flag) {
    			$pdf = Mage::getModel('auit_pdf/creditmemo')->getPdf($docs);
    			return $this->_prepareDownloadResponse(
    					'creditmemo'.Mage::getSingleton('core/date')->date('Y-m-d_H-i-s').'.pdf', $pdf->render(),
    					'application/pdf'
    			);
    		} else {
    			$this->_getSession()->addError($this->__('There are no printable documents related to selected orders.'));
    		}
    	}
    	$this->_redirect('adminhtml/sales_order/index');
    }
    public function pdfdocsAction(){
    	$orderIds = $this->getRequest()->getPost('order_ids');
    	$flag = false;
    	if (!empty($orderIds)) {
    		foreach ($orderIds as $orderId) {
    			$invoices = Mage::getResourceModel('sales/order_invoice_collection')
    			->setOrderFilter($orderId)
    			->load();
    			if ($invoices->getSize()){
    				$flag = true;
    				foreach ( $invoices as $invoice )
    					$docs[]=$invoice;
    				if (!isset($pdf)){
    					$pdf = Mage::getModel('auit_pdf/invoice')->getPdf($invoices);
    				} else {
    					$pages = Mage::getModel('auit_pdf/invoice')->getPdf($invoices);
   						//$pdf->pages = array_merge ($pdf->pages, $pages->pages);
    					foreach ( $pages->pages as $page)
				    		$pdf->pages[] = clone($page);
    				}
    			}
    
    			$shipments = Mage::getResourceModel('sales/order_shipment_collection')
    			->setOrderFilter($orderId)
    			->load();
    			if ($shipments->getSize()){
    				$flag = true;
    				if (!isset($pdf)){
    					$pdf = Mage::getModel('auit_pdf/shipment')->getPdf($shipments);
    				} else {
    					$pages = Mage::getModel('auit_pdf/shipment')->getPdf($shipments);
   						//$pdf->pages = array_merge ($pdf->pages, $pages->pages);
    					foreach ( $pages->pages as $page)
				    		$pdf->pages[] = clone($page);
    				}
    			}
    
    			$creditmemos = Mage::getResourceModel('sales/order_creditmemo_collection')
    			->setOrderFilter($orderId)
    			->load();
    			if ($creditmemos->getSize()) {
    				$flag = true;
    				if (!isset($pdf)){
    					$pdf = Mage::getModel('auit_pdf/creditmemo')->getPdf($creditmemos);
    				} else {
    					$pages = Mage::getModel('auit_pdf/creditmemo')->getPdf($creditmemos);
   						//$pdf->pages = array_merge ($pdf->pages, $pages->pages);
    					foreach ( $pages->pages as $page)
				    		$pdf->pages[] = clone($page);
    				}
    			}
    		}
    		if ($flag) {
    			return $this->_prepareDownloadResponse(
    					'docs'.Mage::getSingleton('core/date')->date('Y-m-d_H-i-s').'.pdf',
    					$pdf->render(), 'application/pdf'
    			);
    		} else {
    			$this->_getSession()->addError($this->__('There are no printable documents related to selected orders.'));
    		}
    	}
		$this->_redirect('adminhtml/sales_order/index');	
	}
}
<?php
class AuIt_Pdf_Block_Adminhtml_Sales_Order_View extends Mage_Adminhtml_Block_Sales_Order_View
{
	public function __construct()
    {
        parent::__construct();
        if ($this->getOrder()->getId()) {
            $this->_addButton('print', array(
                'label'     => Mage::helper('sales')->__('Print Offer'),
                'class'     => 'save',
                'onclick'   => 'setLocation(\''.$this->getPrintOfferUrl().'\')'
                )
            );
        }
    }
    public function getPrintOfferUrl()
    {
    	
        return $this->getUrl('adminhtml/auitpdf_order/print', array(
            'order_id' => $this->getOrder()->getId()
        ));
    }
    
}

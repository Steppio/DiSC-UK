<?php
 
class AffinityCloud_Acbanners_Block_Adminhtml_Acbanners_Edit_Tabs extends Mage_Adminhtml_Block_Widget_Tabs {
    public function __construct()
    {
        parent::__construct();

        $this->setId('acbanners_tabs');
        $this->setDestElementId('edit_form');
        $this->setTitle(Mage::helper('acbanners')->__('Banners'));
    }
 
    protected function _beforeToHtml()
    {
        $this->addTab('form_section', [
            'label' => Mage::helper('acbanners')->__('Banner Information'),
            'title' => Mage::helper('acbanners')->__('Banner Information'),
            'content' => $this->getLayout()->createBlock('acbanners/adminhtml_acbanners_edit_tab_form')->toHtml()
        ]);
       
        return parent::_beforeToHtml();
    }
}
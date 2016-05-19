<?php
 
class AffinityCloud_Acbanners_Block_Adminhtml_Acsidebanners_Edit_Tab_Form extends Mage_Adminhtml_Block_Widget_Form {
    protected function _prepareForm()
    {
        $form = new Varien_Data_Form();
        $this->setForm($form);
        $fieldset = $form->addFieldset('acsidebanners_form', ['legend' => Mage::helper('acbanners')->__('Banner Information')]);
       
        $fieldset->addField('title', 'text', [
            'label' => Mage::helper('acbanners')->__('Title'),
            'class' => 'required-entry',
            'required' => true,
            'name' => 'title'
        ]);
       
        $fieldset->addField('image', 'image', [
            'label' => Mage::helper('acbanners')->__('Image'),
            'class' => 'required-entry',
            'required' => true,
            'name' => 'image'
        ]);
       
        $fieldset->addField('description', 'text', [
            'label' => Mage::helper('acbanners')->__('Description'),
            'name' => 'description'
        ]);
       
        $fieldset->addField('url', 'text', [
            'label' => Mage::helper('acbanners')->__('Banner URL'),
            'name' => 'url'
        ]);
       
        $fieldset->addField('sort_order', 'text', [
            'label' => Mage::helper('acbanners')->__('Sort Order'),
            'class' => 'required-entry',
            'required' => true,
            'name' => 'sort_order'
        ]);

        $statusOptions = [
            0 => Mage::helper('acbanners')->__('Inactive'),
            1 => Mage::helper('acbanners')->__('Active')
        ];
 
        $fieldset->addField('status', 'select', [
            'label' => Mage::helper('acbanners')->__('Status'),
            'name' => 'status',
            'values' => $statusOptions,
            'value' => 1
        ]);
       
        if (Mage::getSingleton('adminhtml/session')->getACBannersData()) {
            $form->setValues(Mage::getSingleton('adminhtml/session')->getACBannersData());
            Mage::getSingleton('adminhtml/session')->setACBannersData(null);
        } elseif (Mage::registry('acbanners_data')) {
            $form->setValues(Mage::registry('acbanners_data')->getData());
        }

        return parent::_prepareForm();
    }
}
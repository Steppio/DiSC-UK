<?php
 
class AffinityCloud_Acbanners_Block_Adminhtml_Acbanners_Edit_Form extends Mage_Adminhtml_Block_Widget_Form {
    protected function _prepareForm()
    {
        $formParams = [
            'id' => 'edit_form',
            'action' => $this->getUrl('*/*/save', ['id' => $this->getRequest()->getParam('id')]),
            'method' => 'post',
            'enctype' => 'multipart/form-data'
        ];

        $form = new Varien_Data_Form($formParams);
 
        $form->setUseContainer(true);
        $this->setForm($form);

        return parent::_prepareForm();
    }
}
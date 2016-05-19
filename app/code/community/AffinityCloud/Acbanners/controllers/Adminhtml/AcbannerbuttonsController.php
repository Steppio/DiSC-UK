<?php
 
class AffinityCloud_Acbanners_Adminhtml_AcbannerbuttonsController extends Mage_Adminhtml_Controller_Action {
    protected function _initAction()
    {
        $this->loadLayout()
            ->_setActiveMenu('acbanners/items')
            ->_addBreadcrumb(Mage::helper('adminhtml')->__('Banners Manager'), Mage::helper('adminhtml')->__('Banner Manager'));
        
        return $this;
    }   
   
    public function indexAction()
    {
        $this->_initAction();       
        $this->_addContent($this->getLayout()->createBlock('acbanners/adminhtml_acbannerbuttons'));
        $this->renderLayout();
    }
 
    public function editAction()
    {
        $bannersId = $this->getRequest()->getParam('id');
        $bannersModel = Mage::getModel('acbanners/acbannerbuttons')->load($bannersId);
 
        if ($bannersModel->getId() || $bannersId == 0) {
            Mage::register('acbanners_data', $bannersModel);
 
            $this->loadLayout();

            $this->_setActiveMenu('acbanners/acbanners');
           
            $this->_addBreadcrumb(Mage::helper('adminhtml')->__('Banner Manager'), Mage::helper('adminhtml')->__('Banner Manager'));
           
            $this->getLayout()->getBlock('head')->setCanLoadExtJs(true);
           
            $this->_addContent($this->getLayout()->createBlock('acbanners/adminhtml_acbannerbuttons_edit'))->_addLeft($this->getLayout()->createBlock('acbanners/adminhtml_acbannerbuttons_edit_tabs'));
               
            $this->renderLayout();
        } else {
            Mage::getSingleton('adminhtml/session')->addError(Mage::helper('acbanners')->__('Banner does not exist'));

            $this->_redirect('*/*/');
        }
    }
   
    public function newAction()
    {
        $this->_forward('edit');
    }

    /**
     * Need to refactor and tidy up nested if statements. Also abstract code in to more modular methods
     * 
     * @return [type] [description]
     */
    public function saveAction()
    {
        $imageData = [];

        if ( ! empty($_FILES['image']['name'])) {
            try {
                $ext = substr($_FILES['image']['name'], strrpos($_FILES['image']['name'], '.') + 1);
                $fileName = 'banner-' . time() . '.' . $ext;
                $uploader = new Varien_File_Uploader('image');
                $uploader->setAllowedExtensions(['jpg', 'jpeg', 'gif', 'png']);

                $uploader->setAllowRenameFiles(true);
                $uploader->setFilesDispersion(false);

                $path = Mage::getBaseDir('media').DS.'acbannerbuttons';

                $uploader->save($path, $fileName);

                $imageData['image'] = 'acbannerbuttons/'.$fileName;
            } catch (Exception $e) {
                return $this->error($e);
            }
        }

        $data = $this->getRequest()->getPost();

        if ($data) {
            if ( ! empty($imageData['image'])) {
                $data['image'] = $imageData['image'];
            } else {
                if (isset($data['image']['delete']) && $data['image']['delete'] == 1) {
                    if ($data['image']['value'] != '') {
                        $_helper = Mage::helper('acbanners');
                        $this->removeFile(Mage::getBaseDir('media').DS.$_helper->updateDirSepereator($data['image']['value']));
                    }

                    $data['image'] = '';
                } else {
                    $data['image'] = $data['image']['value'];
                }
            }

            $bannersId = $this->getRequest()->getParam('id');
            $bannersModel = Mage::getModel('acbanners/acbannerbuttons')->load($bannersId);

            $bannersModel->setData($data)->setId($this->getRequest()->getParam('id'))
                ->setTitle($data['title'])
                ->setImage($data['image'])
                ->setDescription($data['description'])
                ->setUrl($data['url'])
                ->setColour($data['colour'])
                ->setStatus($data['status'])
                ->save();

            try {
                if ($bannersModel->getCreatedTime == NULL || $bannersModel->getUpdateTime() == NULL) {
                    $bannersModel->setCreatedTime(now())->setUpdateTime(now());
                } else {
                    $bannersModel->setUpdateTime(now());
                }

                $bannersModel->save();

                Mage::getSingleton('adminhtml/session')->addSuccess(Mage::helper('acbanners')->__('Banner was successfully saved'));
                Mage::getSingleton('adminhtml/session')->setFormData(false);

                if ($this->getRequest()->getParam('back')) {
                    $this->_redirect('*/*/edit', array('id' => $bannersModel->getId()));
                    
                    return;
                }

                $this->_redirect('*/*/');
                
                return;
            } catch (Exception $e) {
                return $this->error($e);
            }
        }

        Mage::getSingleton('adminhtml/session')->addError(Mage::helper('acbanners')->__('Unable to find banner to save'));
        
        $this->_redirect('*/*/');
    }

    protected function removeFile($file)
    {
        try {
            $io = new Varien_Io_File();

            if ( ! is_dir($file) && file_exists($file)) {
                $result = $io->rmdir($file, true);
            }
        } catch (Exception $e) {
            return $this->error($e);
        }
    }
   
    public function deleteAction()
    {
        if ( $this->getRequest()->getParam('id') > 0 ) {
            try {
                $bannersModel = Mage::getModel('acbanners/acbannerbuttons');
               
                $bannersModel->setId($this->getRequest()->getParam('id'))
                    ->delete();
                   
                Mage::getSingleton('adminhtml/session')->addSuccess(Mage::helper('adminhtml')->__('Banner was successfully deleted'));
                
                $this->_redirect('*/*/');
            } catch (Exception $e) {
                return $this->error($e);
            }
        }

        $this->_redirect('*/*/');
    }
    /**
     * Product grid for AJAX request.
     * Sort and filter result for example.
     */
    public function gridAction()
    {
        $this->loadLayout();
        $this->getResponse()->setBody($this->getLayout()->createBlock('acbanners/adminhtml_acbannerbuttons_grid')->toHtml());
    }

    public function error($e)
    {
        Mage::getSingleton('adminhtml/session')->addError($e->getMessage());
        Mage::getSingleton('adminhtml/session')->setACBannersData($this->getRequest()->getPost());

        $this->_redirect('*/*/edit', ['id' => $this->getRequest()->getParam('id')]);
        
        return;
    }
}
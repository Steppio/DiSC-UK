<?php

class Tatva_Slider_Adminhtml_SliderController extends Mage_Adminhtml_Controller_Action
{

	protected function _initAction() {
		$this->loadLayout()
			->_setActiveMenu('slider/items')
			->_addBreadcrumb(Mage::helper('adminhtml')->__('Slider Manager'), Mage::helper('adminhtml')->__('Slider Manager'));

		return $this;
	}

	public function indexAction() {
		$this->_initAction()
			->renderLayout();
	}

	public function editAction() {
		$id     = $this->getRequest()->getParam('id');
		$model  = Mage::getModel('slider/slider')->load($id);

		if ($model->getId() || $id == 0) {
			$data = Mage::getSingleton('adminhtml/session')->getFormData(true);
			if (!empty($data)) {
				$model->setData($data);
			}

			Mage::register('slider_data', $model);

			$this->loadLayout();
			$this->_setActiveMenu('slider/items');

			$this->_addBreadcrumb(Mage::helper('adminhtml')->__('Slider Manager'), Mage::helper('adminhtml')->__('Slider Manager'));
			$this->_addBreadcrumb(Mage::helper('adminhtml')->__('Slider News'), Mage::helper('adminhtml')->__('Slider News'));

			$this->getLayout()->getBlock('head')->setCanLoadExtJs(true);

			$this->_addContent($this->getLayout()->createBlock('slider/adminhtml_slider_edit'))
				->_addLeft($this->getLayout()->createBlock('slider/adminhtml_slider_edit_tabs'));

			$this->renderLayout();
		} else {
			Mage::getSingleton('adminhtml/session')->addError(Mage::helper('slider')->__('Slide does not exist'));
			$this->_redirect('*/*/');
		}
	}

	public function newAction() {
		$this->_forward('edit');
	}

	public function saveAction(){
        //5MB =5242880 bytes
      if($_FILES['filename']['size']>5242880){
            $data = $this->getRequest()->getPost();
            Mage::getSingleton('adminhtml/session')->addError(Mage::helper('slider')->__('File size exceeded'));
           Mage::getSingleton('adminhtml/session')->setFormData($data);
           $this->_redirect('*/*/edit', array('id' => $this->getRequest()->getParam('id')));
           return;
        }
      else{
			if ($data = $this->getRequest()->getPost()){
                $collection = Mage::getModel('slider/slider')->getCollection();
                $collection->addFieldToFilter('title',$data['title']);
                if($this->getRequest()->getParam('id')){
                    $collection->addFieldToFilter('slider_id',array('neq' => $this->getRequest()->getParam('id')));
                }

                if($collection->getData()){
                    Mage::getSingleton('adminhtml/session')->addError(Mage::helper('slider')->__('Slider with same title "%s" already exist.', $data['title']));
                    Mage::getSingleton('adminhtml/session')->setFormData($data);
                    $this->_redirect('*/*/edit', array('id' => $this->getRequest()->getParam('id')));
                    return;
                }

                  if(isset($_FILES['filename']['name']) && $_FILES['filename']['name'] != '')
					{
						if( $this->getRequest()->getParam('id') > 0 ){
							$model = Mage::getModel('slider/slider')->load($this->getRequest()->getParam('id'));
							  if($model->getfilename() != ""){
								  $imageUrl = Mage::getBaseDir('media').DS."customerslider".DS."original".DS.$model->getfilename();
								  $imageResized = Mage::getBaseDir('media').DS."customerslider".DS."thumbnail".DS.$model->getfilename();
								  $imageSliderResized = Mage::getBaseDir('media').DS."customerslider".DS."slider".DS.$model->getfilename();

								  if(file_exists($imageUrl)){
									  unlink($imageUrl);
									  unlink($imageResized);
									 unlink($imageSliderResized);	
									}
								}
						}
						try{
							$date = date('Ymdhis');
							$uploader = new Varien_File_Uploader('filename');
							  $uploader->setAllowedExtensions(array('jpg','jpeg','gif','png'));

							$uploader->setAllowRenameFiles(false);

							// Set the file upload mode
							// false -> get the file directly in the specified folder
							// true -> get the file in the product like folders (file.jpg will go in something like /media/f/i/file.jpg)
							$uploader->setFilesDispersion(false);

							  $filedet = pathinfo($_FILES['filename']['name']);

							// We set media as the upload dir
							$path = Mage::getBaseDir('media').DS.'customerslider'.DS.'original'.DS;
							  $uploader->save($path, $filedet['filename'].$date.'.'.$filedet['extension'] );
							  $original_image_path =  $path.$filedet['filename'].$date.'.'.$filedet['extension'];
							  list($original_image_width, $original_image_height, $type, $attr) = getimagesize($original_image_path);
							  // actual path of image
							  $imageUrl = Mage::getBaseDir('media').DS."customerslider".DS."original".DS.$filedet['filename'].$date.'.'.$filedet['extension'];
							  $file = $filedet['filename'].$date.'.'.$filedet['extension'];
							  // path of the resized image to be saved
							  // here, the resized image is saved in media/resized folder


							 $thumbnail_imageUrl = Mage::getBaseDir('media').DS."customerslider".DS."thumbnail".DS.$file;
							 $slider_imageUrl = Mage::getBaseDir('media').DS."customerslider".DS."slider".DS.$file;

							  // resize image only if the image file exists and the resized image file doesn't exist
							  // the image is resized proportionally with the width/height 135px
							  if(file_exists($imageUrl)){
								  $imageObj = new Varien_Image($imageUrl);
								  $imageObj->constrainOnly(TRUE);
								  $imageObj->keepAspectRatio(TRUE);
								  $imageObj->keepFrame(FALSE);
								  $imageObj->resize(100, 100);
								  $imageObj->save($thumbnail_imageUrl);

								  $resized_image_width = Mage::getStoreConfig('slider/slider/imagewidth');
								  $resized_image_height = Mage::getStoreConfig('slider/slider/imageheight');

								  $imageObjCustom = new Varien_Image($imageUrl);
								  if($original_image_width!=$resized_image_width || $original_image_height!=$resized_image_height){
										$imageObjCustom->constrainOnly(TRUE);
										$imageObjCustom->keepFrame(FALSE);
										$imageObjCustom->resize($resized_image_width, $resized_image_height);
										$imageObjCustom->save($slider_imageUrl);
									}
								  else{
										$imageObjCustom->save($slider_imageUrl);
									}


								}
                        }
							catch (Exception $e){
							}

						//this way the name is saved in DB
						$data['filename'] = $filedet['filename'].$date.'.'.$filedet['extension'];
      			    }
            }


    			$model = Mage::getModel('slider/slider');
    			$model->setData($data)
    				->setId($this->getRequest()->getParam('id'));

    			try{
    				if ($model->getCreatedTime == NULL || $model->getUpdateTime() == NULL) {
    					$model->setCreatedTime(now())
    						->setUpdateTime(now());
    				} else {
    					$model->setUpdateTime(now());
    				}
    				$model->save();
    				Mage::getSingleton('adminhtml/session')->addSuccess(Mage::helper('slider')->__('Slide was successfully saved'));
    				Mage::getSingleton('adminhtml/session')->setFormData(false);

    				if ($this->getRequest()->getParam('back')) {
    					$this->_redirect('*/*/edit', array('id' => $model->getId()));
    					return;
    				}
    				$this->_redirect('*/*/');
    				return;
                }
                catch (Exception $e)
                {
                    Mage::getSingleton('adminhtml/session')->addError($e->getMessage());
                    Mage::getSingleton('adminhtml/session')->setFormData($data);
                    $this->_redirect('*/*/edit', array('id' => $this->getRequest()->getParam('id')));
                    return;
                }
		 Mage::getSingleton('adminhtml/session')->addError(Mage::helper('slider')->__('Unable to find item to save'));
          $this->_redirect('*/*/');
		}
    }

	public function deleteAction()
    {
		if( $this->getRequest()->getParam('id') > 0 )
        {
			try
            {
				$model = Mage::getModel('slider/slider')->load($this->getRequest()->getParam('id'));
                if($model->getfilename() != "")
                {
                    $imageUrl = Mage::getBaseDir('media').DS."customerslider".DS."original".DS.$model->getfilename();

                    // path of the resized image to be saved
                    // here, the resized image is saved in media/resized folder
                    $imageSlider = Mage::getBaseDir('media').DS."customerslider".DS."slider".DS.$model->getfilename();
                    $imageResized = Mage::getBaseDir('media').DS."customerslider".DS."thumbnail".DS.$model->getfilename();

                    if(file_exists($imageUrl))
                    {
                        unlink($imageSlider);
                        unlink($imageUrl);
                        unlink($imageResized);
                    }
                }

				$model->setId($this->getRequest()->getParam('id'))
					->delete();

				Mage::getSingleton('adminhtml/session')->addSuccess(Mage::helper('adminhtml')->__('Slide was successfully deleted'));
				$this->_redirect('*/*/');
			}
            catch (Exception $e)
            {
				Mage::getSingleton('adminhtml/session')->addError($e->getMessage());
				$this->_redirect('*/*/edit', array('id' => $this->getRequest()->getParam('id')));
			}
		}
		$this->_redirect('*/*/');
	}

    public function massDeleteAction()
    {
        $sliderIds = $this->getRequest()->getParam('slider');
        if(!is_array($sliderIds)) {
			Mage::getSingleton('adminhtml/session')->addError(Mage::helper('adminhtml')->__('Please select item(s)'));
        } else {
            try {
                foreach ($sliderIds as $sliderId) {
                    $slider = Mage::getModel('slider/slider')->load($sliderId);
                    $slider->delete();
                    $imageUrl = Mage::getBaseDir('media').DS."customerslider".DS."original".DS.$slider->getfilename();

                    // path of the resized image to be saved
                    // here, the resized image is saved in media/resized folder
                    $imageSlider = Mage::getBaseDir('media').DS."customerslider".DS."slider".DS.$slider->getfilename();
                    $imageResized = Mage::getBaseDir('media').DS."customerslider".DS."thumbnail".DS.$slider->getfilename();

                    if(file_exists($imageUrl))
                    {
                        unlink($imageSlider);
                        unlink($imageUrl);
                        unlink($imageResized);
                    }
                }
                Mage::getSingleton('adminhtml/session')->addSuccess(
                    Mage::helper('adminhtml')->__(
                        'Total of %d record(s) were successfully deleted', count($sliderIds)
                    )
                );
            } catch (Exception $e) {
                Mage::getSingleton('adminhtml/session')->addError($e->getMessage());
            }
        }
        $this->_redirect('*/*/index');
    }

    public function exportCsvAction()
    {
        $fileName   = 'slider.csv';
        $content    = $this->getLayout()->createBlock('slider/adminhtml_slider_grid')
            ->getCsv();

        $this->_sendUploadResponse($fileName, $content);
    }

    public function exportXmlAction()
    {
        $fileName   = 'slider.xml';
        $content    = $this->getLayout()->createBlock('slider/adminhtml_slider_grid')
            ->getXml();

        $this->_sendUploadResponse($fileName, $content);
    }

    protected function _sendUploadResponse($fileName, $content, $contentType='application/octet-stream')
    {
        $response = $this->getResponse();
        $response->setHeader('HTTP/1.1 200 OK','');
        $response->setHeader('Pragma', 'public', true);
        $response->setHeader('Cache-Control', 'must-revalidate, post-check=0, pre-check=0', true);
        $response->setHeader('Content-Disposition', 'attachment; filename='.$fileName);
        $response->setHeader('Last-Modified', date('r'));
        $response->setHeader('Accept-Ranges', 'bytes');
        $response->setHeader('Content-Length', strlen($content));
        $response->setHeader('Content-type', $contentType);
        $response->setBody($content);
        $response->sendResponse();
        die;
    }
}
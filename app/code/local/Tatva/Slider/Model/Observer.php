<?php
class Tatva_Slider_Model_Observer extends Varien_Event_Observer
{
   public function __construct()
   {
   }
   public function saveCmsPageObserve($observer){
     $filePath=Mage::getBaseDir('media').DS."customerslider".DS."original".DS;
     $dir = opendir($filePath);
     while ($file = readdir($dir)){
		   if (eregi("\.png",$file) || eregi("\.jpg",$file) || eregi("\.gif",$file) ){
			  $string[] = $file;
			}
		}
     $resized_image_width = Mage::getStoreConfig('slider/slider/imagewidth');
     $resized_image_height = Mage::getStoreConfig('slider/slider/imageheight');
     $first_image =  Mage::getBaseDir('media').DS."customerslider".DS."slider".DS.$string[0];
     list($width, $height, $type, $attr) = getimagesize($first_image);
     if($width != $resized_image_width || $height != $resized_image_height){
			foreach($string as $value){
			 $imageUrl = Mage::getBaseDir('media').DS."customerslider".DS."original".DS.$value;
			 $thumbnail_imageUrl = Mage::getBaseDir('media').DS."customerslider".DS."thumbnail".DS.$value;
			 $slider_imageUrl = Mage::getBaseDir('media').DS."customerslider".DS."slider".DS.$value;
			 if($width != $resized_image_width || $height!=$resized_image_height ){
				   $imageObj = new Varien_Image($imageUrl);
					$imageObj->constrainOnly(TRUE);
					$imageObj->keepAspectRatio(TRUE);
					$imageObj->keepFrame(FALSE);
					$imageObj->resize(100, 100);
					$imageObj->save($thumbnail_imageUrl);

					$sliderimageObj = new Varien_Image($imageUrl);
					$sliderimageObj->constrainOnly(TRUE);
					$sliderimageObj->keepFrame(FALSE);
					$sliderimageObj->resize($resized_image_width, $resized_image_height);
					$sliderimageObj->save($slider_imageUrl);
				}
			}
		}
	}
}
?>
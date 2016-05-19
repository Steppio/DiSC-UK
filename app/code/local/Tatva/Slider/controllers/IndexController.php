<?php
class Tatva_Slider_IndexController extends Mage_Core_Controller_Front_Action
{
    public function indexAction()
    {  
		$this->loadLayout();
		$this->renderLayout();
    }
}
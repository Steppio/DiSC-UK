<?php
/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/osl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * @category    Yoma
 * @package     Yoma_Realex
 * @copyright   Copyright (c) 2014 YOMA LIMITED (http://www.yoma.co.uk)
 * @license     http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */
class Yoma_Realex_Adminhtml_LogController extends Mage_Adminhtml_Controller_Action
{

    protected function _initAction()
    {
        $this->loadLayout()
            ->_setActiveMenu('sales/realex/logs')
            ->_addBreadcrumb($this->__('Sales'), $this->__('Sales'))
            ->_addBreadcrumb($this->__('Logs'), $this->__('Logs'));
        return $this;
    }

    public function indexAction()
    {
        $this->_title($this->__('Sales'))->_title($this->__('Realex'))->_title($this->__('Logs'));
        $this->_initAction()->renderLayout();
    }

    /**
     * Download log file
     */
    public function downloadFileAction()
    {
        $fileName = $this->getRequest()->getParam('f');
        if(is_null($fileName)){
            return;
        }

        $file = Mage::helper('realex')->getRealexLogDir() . DS . $fileName;

        $this->_prepareDownloadResponse($fileName, file_get_contents($file), 'text/plain', filesize($file));
    }

    /**
     * Tail log
     *
     * @return Zend_Controller_Response_Abstract
     */
    public function tailAction()
    {
        $r = $this->getRequest();

        if(!$r->getParam('file')){
            $this->getResponse()->setBody('<html><head><title></title></head><body><pre>'. Mage::helper('realex')->__('Please choose a file.') .'</pre></body></html>');
            return;
        }

        $f = Mage::helper('realex')->getRealexLogDir() . DS . $r->getParam('file');

        $numberOfLines = 200;
        $handle = fopen($f, "r");
        $linecounter = $numberOfLines;
        $pos = -2;
        $beginning = false;
        $text = array();
        while ($linecounter > 0) {
            $t = " ";
            while ($t != "\n") {
                if(fseek($handle, $pos, SEEK_END) == -1) {
                    $beginning = true;
                    break;
                }
                $t = fgetc($handle);
                $pos --;
            }
            $linecounter --;
            if ($beginning) {
                rewind($handle);
            }
            $text[$numberOfLines-$linecounter-1] = fgets($handle);
            if ($beginning) break;
        }
        fclose ($handle);

        $dlFile = '<a href="' . Mage::helper('adminhtml')->getUrl('realexAdmin/adminhtml_log/downloadFile', array('f'=>$r->getParam('file'))) . '">' . $this->__('Download file') . '</a>';

        return $this->getResponse()->setBody('<html>
                                                <head>
                                                    <title></title>
                                                    <!--<meta http-equiv="refresh" content="10">-->
                                                </head>
                                                <body>
                                                    <pre>' . $dlFile ."\r\n\n". strip_tags(implode('',$text)).'</pre>
                                                </body>
                                            </html>');



    }

}
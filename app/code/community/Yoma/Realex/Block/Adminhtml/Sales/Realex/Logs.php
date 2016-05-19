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
class Yoma_Realex_Block_Adminhtml_Sales_Realex_Logs extends Mage_Core_Block_Template
{

    /**
     * Get tail url
     *
     * @param array $params
     * @return string
     */
    public function getTailUrl(array $params = array())
    {
        $params ['_secure'] = true;

        return $this->helper('adminhtml')->getUrl('realexAdmin/adminhtml_log/tail', $params);
    }

    /**
     * Get log path
     *
     * @return mixed
     */
    protected function _getLogPath()
    {
        return $this->helper('realex')->getRealexLogDir();
    }

    /**
     * Generate log select
     *
     * @return string
     */
    public function getLogFilesSelect()
    {

        $logPath = $this->_getLogPath();
        $logFiles = array();

        if( file_exists($logPath) ){
            foreach (new DirectoryIterator($logPath) as $fileInfo) {
                if($fileInfo->isDot()){
                    continue;
                }

                if(preg_match('/[(.log)(.logs)]$/', $fileInfo->getFilename())){
                    $logFiles [] = array('file' => $fileInfo->getPathname(), 'filename'=>$fileInfo->getFilename());
                }
            }
        }

        if(empty($logFiles)){
            return $this->__('No log files found');
        }

        $html = '<label for="rl-log-switcher">' . $this->__('Please, choose a file:') . '</label><select id="rl-log-switcher" name="rl-log-switcher"><option value=""></option>';

        foreach($logFiles as $l){
            $html .= '<option value="' . $this->getTailUrl(array('file'=>$l['filename'])) . '">' . $l['filename'] . '</option>';
        }

        $html .= '</select>';

        return $html;


    }

}
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
class Yoma_Realex_Model_Log {


    /**
     * Alias methods
     */
    public static function log($message, $level = null, $file = '') {
        self::write($message, $level, $file);
    }

    public static function logException(Exception $e) {
        self::writeException($e);
    }

    /**
     * Write exception to log
     *
     * @param Exception $e
     */
    public static function writeException(Exception $e) {
        self::write("\n" . $e->__toString(), Zend_Log::ERR, 'exceptions.log');
    }

    /**
     * Write log messages
     *
     * @param string $message Message to write
     * @param int $level Message severity level, @see Zend_Log
     * @param string $file Filename, ie: Errors.log
     */
    public static function write($message, $level = null, $file = '') {
        try {
            $logActive = Mage::getStoreConfig('payment/realex/logs');
            if (empty($file)) {
                $file = 'realex.log';
            }
        } catch (Exception $e) {
            $logActive = true;
        }

        if (!$logActive) {
            return;
        }

        $level = is_null($level) ? Zend_Log::DEBUG : $level;
        $file = empty($file) ? 'realex.log' : self::_renameLogsFiles($file);

        try {
            $logFile = Mage::getBaseDir('var') . DS . 'log' . DS . 'realex' . DS . $file;

            if (!is_dir(Mage::getBaseDir('var') . DS . 'log')) {
                mkdir(Mage::getBaseDir('var') . DS . 'log', 0777);
            }
            if (!is_dir(Mage::getBaseDir('var') . DS . 'log' . DS . 'realex')) {
                mkdir(Mage::getBaseDir('var') . DS . 'log' . DS . 'realex', 0777);
            }

            if (!file_exists($logFile)) {
                file_put_contents($logFile, '');
                chmod($logFile, 0777);
            }

            $format = Mage::getSingleton('core/date')->date('Y-m-d H:i:s.u') . ' (' . microtime(true) . ') ' . '%priorityName%: %message%' . PHP_EOL;

            $formatter = new Zend_Log_Formatter_Simple($format);
            $writerModel = (string) Mage::getConfig()->getNode('global/log/core/writer_model');
            if (!$writerModel) {
                $writer = new Zend_Log_Writer_Stream($logFile);
            } else {
                $writer = new $writerModel($logFile);
            }
            $writer->setFormatter($formatter);
            $logger = new Zend_Log($writer);

            if (is_array($message) || is_object($message)) {
                if(is_array($message)){
                    if(isset($message['request']['paymentdata_cvn_number'])){
                        $message['request']['paymentdata_cvn_number'] = '***';
                    }
                    if(isset($message['request']['paymentdata_card_cvn_number'])){
                        $message['request']['paymentdata_card_cvn_number'] = '***';
                    }
                    if(isset($message['request']['card_cvn_number'])){
                        $message['request']['card_cvn_number'] = '***';
                    }
                    if(isset($message['request']['card_number'])){
                        $message['request']['card_number'] = '************' . substr($message['request']['card_number'], -4);
                    }
                    if(isset($message['response']['md'])){
                        $message['response']['md'] = "***";
                    }
                    if(isset($message['request']['post_md'])){
                        $message['request']['post_md'] = '***';
                    }
                    if(isset($message['request']['card_expdate'])){
                        $message['request']['card_expdate'] = '****';
                    }
                    if(isset($message['response']['saved_pmt_digits'])){
                        $message['response']['saved_pmt_digits'] = '************' . substr($message['response']['saved_pmt_digits'], -4);
                    }
                    if(isset($message['response']['saved_pmt_expdate'])){
                        $message['response']['saved_pmt_expdate'] = "***";
                    }
                }
                $message = print_r($message, true);
            }

            $logger->log($message, $level);

        } catch (Exception $e) {

        }
    }

    /**
     * Rename log file to user friendly name
     *
     * @param $file
     * @return mixed
     */
    protected  static function _renameLogsFiles($file){


        $logNames = array(
            'realexredirect'=>'hpp',
            'realexdirect'=>'api'
        );

        foreach($logNames as $key=>$value){
            if(strpos($file,$key)){
                $file = str_replace($key,$value,$file);
                break;
            }
        }
        return $file;
    }

}
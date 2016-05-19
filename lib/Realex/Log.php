<?php
class Realex_Log
{

    public static function log($message, $level = null, $file = '')
    {
        Yoma_Realex_Model_Log::write($message, $level, $file);
    }

    public static function logException(Exception $e)
    {
        Yoma_Realex_Model_Log::writeException($e);
    }

}
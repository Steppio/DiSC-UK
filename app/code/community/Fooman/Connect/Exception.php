<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Exception extends Exception
{
    protected $_xeroErrors = false;

    /**
     * @param array $errors
     */
    public function setXeroErrors(array $errors)
    {
        $this->_xeroErrors = $errors;
    }

    /**
     * @return bool|array
     */
    public function getXeroErrors()
    {
        return $this->_xeroErrors;
    }

}

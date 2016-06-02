<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_ConnectLicense
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_ConnectLicense_Model_DataSource_Converter_ItemsXml
    extends Fooman_ConnectLicense_Model_DataSource_Converter_Abstract
{
    /**
     * @param array            $data
     *
     * @return string
     */
    public static function convert(array $data)
    {
        $client = parent::getFoomanClient();
        $client->setUri(self::URL_LICENSE . 'items.xml');
        return parent::runRequest($client, $data);
    }
}

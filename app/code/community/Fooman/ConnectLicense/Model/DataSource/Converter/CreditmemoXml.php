<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_ConnectLicense
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_ConnectLicense_Model_DataSource_Converter_CreditmemoXml
    extends Fooman_ConnectLicense_Model_DataSource_Converter_Abstract
{

    /**
     * @param array $orderItems
     *
     * @return string
     */
    public static function convert(array $orderItems)
    {
        $client = parent::getFoomanClient();
        $client->setUri(self::URL_LICENSE . 'creditmemo.xml');
        return parent::runRequest($client, $orderItems);
    }
}

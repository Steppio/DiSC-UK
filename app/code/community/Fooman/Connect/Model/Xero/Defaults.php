<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Model_Xero_Defaults
{
    const ROUNDING_ACCT = "860";

    public static $taxRates
        = array(
            'nz' => array(
                'code'     => 'nz',
                'name'     => 'New Zealand',
                'taxrates' => array(
                    'IN'  => array(
                        '12.5000'   => 'INPUT',
                        '15.0000'   => 'INPUT2',
                        'default'   => 'INPUT2',
                        '0.000'     => 'NONE'
                    ),
                    'OUT' => array(
                        '12.5000'   => 'OUTPUT',
                        '15.0000'   => 'OUTPUT2',
                        'default'   => 'OUTPUT2',
                        '0.0000'    => 'ZERORATED'
                    )
                )
            ),
            'uk' => array(
                'code'     => 'uk',
                'name'     => 'United Kingdom',
                'taxrates' => array(
                    'IN'  => array(
                        '20.0000'   => 'INPUT2',
                        '17.5000'   => 'INPUT',
                        '15.0000'   => 'SRINPUT',
                        '5.0000'    => 'RRINPUT',
                        'default'   => 'INPUT2',
                        '0.0000'    => 'NONE'
                    ),
                    'OUT' => array(
                        '20.0000'   => 'OUTPUT2',
                        '17.5000'   => 'OUTPUT',
                        '15.0000'   => 'SROUTPUT',
                        '5.0000'    => 'RROUTPUT',
                        'default'   => 'OUTPUT2',
                        '0.0000'    => 'ZERORATEDOUTPUT'
                    )
                )
            ),
            'global' => array(
                'code'     => 'global',
                'name'     => 'Global',
                'taxrates' => array(
                    'IN'  => array(
                        '0.0000'    => 'NONE',
                        'default'   => 'INPUT'
                    ),
                    'OUT' => array(
                        '0.0000'    => 'NONE',
                        'default'   => 'OUTPUT'
                    )
                )
            ),
            'us' => array(
                'code'     => 'global',
                'name'     => 'Global',
                'taxrates' => array(
                    'IN'  => array(
                        '0.0000'    => 'NONE',
                        '9.2500'    => 'INPUT',
                        'default'   => 'INPUT'
                    ),
                    'OUT' => array(
                        '0.0000'    => 'NONE',
                        '9.2500'    => 'OUTPUT',
                        'default'   => 'OUTPUT'
                    )
                )
            ),
            'aus' => array(
                'code'     => 'aus',
                'name'     => 'Australia',
                'taxrates' => array(
                    'IN'  => array(
                        '10.0000'   => 'INPUT',
                        'default'   => 'INPUT',
                        '0.0000'    => 'NONE'
                    ),
                    'OUT' => array(
                        '10.0000'   => 'OUTPUT',
                        'default'   => 'OUTPUT',
                        '0.0000'    => 'EXEMPTEXPORT'
                    )
                )
            )
        );

    /**
     * get the default tax rate for given Xero version
     *
     * @param        $version
     * @param string $direction
     *
     * @return mixed
     */
    public static function getDefaultTaxrate($version, $direction = 'OUT')
    {
        return self::$taxRates[$version]['taxrates'][$direction]['default'];
    }

    /**
     * lookup tax rate for given Xero version and tax percentage
     *
     * @param        $version
     * @param        $taxrate
     * @param string $direction
     *
     * @return bool
     */
    public static function getTaxrate($version, $taxrate, $direction = 'OUT')
    {
        $taxrate = sprintf('%01.4f', $taxrate);
        if (isset(self::$taxRates[$version]['taxrates'][$direction][$taxrate])) {
            return self::$taxRates[$version]['taxrates'][$direction][$taxrate];
        }
        return false;
    }
}

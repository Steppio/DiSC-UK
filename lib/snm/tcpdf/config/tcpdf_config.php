<?php
//============================================================+
// File name   : tcpdf_config.php
// Begin       : 2004-06-11
// Last Update : 2011-04-15
//
// Description : Configuration file for TCPDF.
//
// Author: Nicola Asuni
//
// (c) Copyright:
//               Nicola Asuni
//               Tecnick.com s.r.l.
//               Via Della Pace, 11
//               09044 Quartucciu (CA)
//               ITALY
//               www.tecnick.com
//               info@tecnick.com
//============================================================+

/**
 * Configuration file for TCPDF.
 * @author Nicola Asuni
 * @package com.tecnick.tcpdf
 * @version 4.9.005
 * @since 2004-10-27
 */

// If you define the constant K_TCPDF_EXTERNAL_CONFIG, the following settings will be ignored.

if (!defined('SNMK_TCPDF_EXTERNAL_CONFIG')) {
	if ((isset($_SERVER['DOCUMENT_ROOT'])) AND !(empty($_SERVER['DOCUMENT_ROOT']))) {
		$_SERVER['DOCUMENT_ROOT'] = realpath($_SERVER['DOCUMENT_ROOT']);
	}
	
	// DOCUMENT_ROOT fix for IIS Webserver
	if ((!isset($_SERVER['DOCUMENT_ROOT'])) OR (empty($_SERVER['DOCUMENT_ROOT']))) {
		if(isset($_SERVER['SCRIPT_FILENAME'])) {
			$_SERVER['DOCUMENT_ROOT'] = str_replace( '\\', '/', substr(realpath($_SERVER['SCRIPT_FILENAME']), 0, 0-strlen($_SERVER['PHP_SELF'])));
		} elseif(isset($_SERVER['PATH_TRANSLATED'])) {
			$_SERVER['DOCUMENT_ROOT'] = str_replace( '\\', '/', substr(str_replace('\\\\', '\\', $_SERVER['PATH_TRANSLATED']), 0, 0-strlen($_SERVER['PHP_SELF'])));
		} else {
			// define here your DOCUMENT_ROOT path if the previous fails (e.g. '/var/www')
			$_SERVER['DOCUMENT_ROOT'] = '/';
		}
	}

	// Automatic calculation for the following K_PATH_MAIN constant
	$k_path_main = str_replace( '\\', '/', realpath(substr(dirname(__FILE__), 0, 0-strlen('config'))));
	if (substr($k_path_main, -1) != '/') {
		$k_path_main .= '/';
	}

	/**
	 * Installation path (/var/www/tcpdf/).
	 * By default it is automatically calculated but you can also set it as a fixed string to improve performances.
	 */
	define ('SNMK_PATH_MAIN', $k_path_main);

	// Automatic calculation for the following K_PATH_URL constant
	$k_path_url = $k_path_main; // default value for console mode
	if (isset($_SERVER['HTTP_HOST']) AND (!empty($_SERVER['HTTP_HOST']))) {
		if(isset($_SERVER['HTTPS']) AND (!empty($_SERVER['HTTPS'])) AND strtolower($_SERVER['HTTPS'])!='off') {
			$k_path_url = 'https://';
		} else {
			$k_path_url = 'http://';
		}
		$k_path_url .= $_SERVER['HTTP_HOST'];
		$k_path_url .= str_replace( '\\', '/', substr(SNMK_PATH_MAIN, (strlen($_SERVER['DOCUMENT_ROOT']) - 1)));
	}

	/**
	 * URL path to tcpdf installation folder (http://localhost/tcpdf/).
	 * By default it is automatically calculated but you can also set it as a fixed string to improve performances.
	 */
	define ('SNMK_PATH_URL', $k_path_url);

	/**
	 * path for PDF fonts
	 * use K_PATH_MAIN.'fonts/old/' for old non-UTF8 fonts
	 */
	//define ('SNMK_PATH_FONTS', SNMK_PATH_MAIN.'fonts/');
	//MAU AUIT
	if (!defined('SNMK_PATH_FONTS') ) {
		define ('SNMK_PATH_FONTS', SNMK_PATH_MAIN.'fonts/');
	}
	
	/**
	 * cache directory for temporary files (full path)
	 */
	define ('SNMK_PATH_CACHE', SNMK_PATH_MAIN.'cache/');

	/**
	 * cache directory for temporary files (url path)
	 */
	define ('SNMK_PATH_URL_CACHE', SNMK_PATH_URL.'cache/');

	/**
	 *images directory
	 */
	define ('SNMK_PATH_IMAGES', SNMK_PATH_MAIN.'images/');

	/**
	 * blank image
	 */
	define ('SNMK_BLANK_IMAGE', SNMK_PATH_IMAGES.'_blank.png');

	/**
	 * page format
	 */
	define ('SNMPDF_PAGE_FORMAT', 'A4');

	/**
	 * page orientation (P=portrait, L=landscape)
	 */
	define ('SNMPDF_PAGE_ORIENTATION', 'P');

	/**
	 * document creator
	 */
	define ('SNMPDF_CREATOR', 'SNMTCPDF');

	/**
	 * document author
	 */
	define ('SNMPDF_AUTHOR', 'SNMTCPDF');

	/**
	 * header title
	 */
	define ('SNMPDF_HEADER_TITLE', 'SNMTCPDF Example');

	/**
	 * header description string
	 */
	define ('SNMPDF_HEADER_STRING', "by Nicola Asuni - Tecnick.com\nwww.tcpdf.org");

	/**
	 * image logo
	 */
	define ('SNMPDF_HEADER_LOGO', 'tcpdf_logo.jpg');

	/**
	 * header logo image width [mm]
	 */
	define ('SNMPDF_HEADER_LOGO_WIDTH', 30);

	/**
	 *  document unit of measure [pt=point, mm=millimeter, cm=centimeter, in=inch]
	 */
	define ('SNMPDF_UNIT', 'mm');

	/**
	 * header margin
	 */
	define ('SNMPDF_MARGIN_HEADER', 5);

	/**
	 * footer margin
	 */
	define ('SNMPDF_MARGIN_FOOTER', 10);

	/**
	 * top margin
	 */
	define ('SNMPDF_MARGIN_TOP', 27);

	/**
	 * bottom margin
	 */
	define ('SNMPDF_MARGIN_BOTTOM', 25);

	/**
	 * left margin
	 */
	define ('SNMPDF_MARGIN_LEFT', 15);

	/**
	 * right margin
	 */
	define ('SNMPDF_MARGIN_RIGHT', 15);

	/**
	 * default main font name
	 */
	define ('SNMPDF_FONT_NAME_MAIN', 'helvetica');

	/**
	 * default main font size
	 */
	define ('SNMPDF_FONT_SIZE_MAIN', 10);

	/**
	 * default data font name
	 */
	define ('SNMPDF_FONT_NAME_DATA', 'helvetica');

	/**
	 * default data font size
	 */
	define ('SNMPDF_FONT_SIZE_DATA', 8);

	/**
	 * default monospaced font name
	 */
	define ('SNMPDF_FONT_MONOSPACED', 'courier');

	/**
	 * ratio used to adjust the conversion of pixels to user units
	 */
	define ('SNMPDF_IMAGE_SCALE_RATIO', 1.25);

	/**
	 * magnification factor for titles
	 */
	define('SNMHEAD_MAGNIFICATION', 1.1);

	/**
	 * height of cell repect font height
	 */
	define('SNMK_CELL_HEIGHT_RATIO', 1.25);

	/**
	 * title magnification respect main font size
	 */
	define('SNMK_TITLE_MAGNIFICATION', 1.3);

	/**
	 * reduction factor for small font
	 */
	define('SNMK_SMALL_RATIO', 2/3);

	/**
	 * set to true to enable the special procedure used to avoid the overlappind of symbols on Thai language
	 */
	define('SNMK_THAI_TOPCHARS', true);

	/**
	 * if true allows to call TCPDF methods using HTML syntax
	 * IMPORTANT: For security reason, disable this feature if you are printing user HTML content.
	 */
	define('SNMK_TCPDF_CALLS_IN_HTML', true);
}

//============================================================+
// END OF FILE
//============================================================+

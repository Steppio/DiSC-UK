<?php
if (!defined('SNMK_PATH_FONTS') ) {
	define('SNMK_PATH_FONTS', Mage::getBaseDir('lib').'/snm/tcpdf/fonts/');
}

require_once(dirname(__FILE__).'/../tcpdf/config/lang/ger.php');
require_once(dirname(__FILE__).'/../tcpdf/tcpdf.php');
require_once(dirname(__FILE__).'/../fpdi/fpdi.php');

class AuIt_Pdf  extends SNMFPDI {
    static protected function pt2mm($v)
    {
		return $v * 0.3528;
	}
    static protected function mm2pt($v)
    {
		$v=(double)$v;
		$pt = $v / 0.3528;
		return $pt;
    }
    protected $_pdfTemplate;
    protected $_tplIdx;
    protected $_globalCSS='';
	protected $_styleInfos=array();
	protected $_caller;

	public function __construct($caller)
	{
		global $l;
		$this->_caller = $caller;
		$this->current_filename='';
		$this->setLanguageArray($l);
		$this->setPrintFooter(false);
		$this->SetDefaultMonospacedFont(SNMPDF_FONT_MONOSPACED);
		parent::__construct(SNMPDF_PAGE_ORIENTATION, SNMPDF_UNIT);

		if ( $caller && method_exists($caller,'getMargin'))
			$this->bMargin = $caller->getMargin($this->page,'bottom');
/*
		$vspaces = array(
				//'h1' => array(0 => array('h' => '', 'n' => 2), 1 => array('h' => 1.3, 'n' => 0))
				'h3' => array(0 => array('h' => '', 'n' => 0), 1 => array('h' => '', 'n' => 0)),
			//	'dl' => array(0 => array('h' => '', 'n' => 0), 1 => array('h' => '', 'n' => 1)),
				//'dt' => array(0 => array('h' => '', 'n' => 0), 1 => array('h' => '', 'n' => 1)),
				//'dd' => array(0 => array('h' => '', 'n' => 0), 1 => array('h' => '', 'n' => 1)),
				//'div' => array(0 => array('h' => '', 'n' => 0), 1 => array('h' => '', 'n' => 1))
				'dl' => array(0 => array('h' => '', 'n' => 0), 1 => array('h' => '', 'n' => 0)),
				);
		$vspaces = array();
		// H3 > dl >dt > dd
		$this->setHtmlVSpace($vspaces);
*/
	}
	public function AddPage($orientation='', $format='', $keepmargins=false, $tocpage=false) {
		if ( $this->current_filename )
		{
			$tplidx = $this->importPage(1);
			$size = $this->getTemplateSize($tplidx, 0, 0);
            $format = array($size['w'], $size['h']);
            $orientation = $format[0] > $format[1] ? 'L' : 'P';
		}
		parent::AddPage($orientation, $format, $keepmargins, $tocpage);
	}
	public function setAutoPB($b) {
		$this->AutoPageBreak=$b;
	}
	public function setTemplatePDF($template) {
		if ( $template )
		{
			$this->setSourceFile($template);
		}
	}
	public function showTemplatePage($page) {
		if ( $this->current_filename )
		{
			$tplIdx = $this->importPage($page);
	        if ( $tplIdx )
	        	$this->useTemplate($tplIdx);
		}
	}
	public function Header() {
		if ( $this->_caller && method_exists($this->_caller,'PDFshowHeader'))
			$this->_caller->PDFshowHeader($this);
	}
	public function setGlobalCSS($cssdata)
	{
		$css = array();
		$css = array_merge($css, $this->extractCSSproperties($cssdata));
		$csstagarray = '<cssarray>'.htmlentities(serialize($css)).'</cssarray>';
		$this->_globalCSS=$csstagarray;
	}
	public function getGlobalCSS()
	{
		return $this->_globalCSS;
	}
	public function writeHTMLCell($w, $h, $x, $y, $html='', $border=0, $ln=0, $fill=false, $reseth=true, $align='', $autopadding=true) {
		$rep = error_reporting();
		error_reporting(E_ERROR | E_PARSE);
		try {
			$result = parent::writeHTMLCell($w, $h, $x, $y, $html, $border, $ln, $fill, $reseth, $align, $autopadding);
		}catch ( Exception $e )
		{
			Mage::logException($e);
		}
		error_reporting($rep);
		return $result;
	}
	public function writeHTML($html, $ln=true, $fill=false, $reseth=false, $cell=false, $align='') {
		$rep = error_reporting();
		error_reporting(E_ERROR | E_PARSE);
		try {
			$result = parent::writeHTML($this->_globalCSS.$html, $ln, $fill, $reseth, $cell, $align);
		}catch ( Exception $e )
		{
			Mage::logException($e);
		}
		error_reporting($rep);
		return $result;
	}
	public function setPageOrientation($orientation, $autopagebreak='', $bottommargin='') {
		if ( $this->_caller && method_exists($this->_caller,'getMargin'))
			$this->bMargin = $this->_caller->getMargin($this->page,'bottom');
		return parent::setPageOrientation($orientation, $autopagebreak, $bottommargin);
	}
	public function SetAutoPageBreak($auto, $margin=0) {
		if ( $this->_caller && method_exists($this->_caller,'getMargin'))
		{
			$margin = $this->_caller->getMargin($this->page,'bottom');
		}
		return parent::SetAutoPageBreak($auto, $margin);
	}
}
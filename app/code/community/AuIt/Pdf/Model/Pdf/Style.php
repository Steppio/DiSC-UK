<?php
class AuIt_Pdf_Model_Pdf_Style extends Varien_Object
{
    static public function buildFont($fontFamily,$weight) 
    {
    	switch ( $fontFamily )
    	{
    		case 'times':
	    		switch ( $weight){
	    			case 'bold': $font = Zend_Pdf_Font::fontWithName(Zend_Pdf_Font::FONT_TIMES_BOLD);break;
	    			default:	 $font = Zend_Pdf_Font::fontWithName(Zend_Pdf_Font::FONT_TIMES);break;
	    		}
    			break;
    		case 'helvetica':
	    		switch ( $weight){
	    			case 'bold': $font = Zend_Pdf_Font::fontWithName(Zend_Pdf_Font::FONT_HELVETICA_BOLD);break;
	    			default:	 $font = Zend_Pdf_Font::fontWithName(Zend_Pdf_Font::FONT_HELVETICA);break;
	    		}
    			break;
    		case 'libertine':
	    		switch ( $weight){
	    			case 'bold': $font = Zend_Pdf_Font::fontWithPath(Zend_Pdf_Font::FONT_HELVETICA_BOLD);break;
	    			default:	 $font = Zend_Pdf_Font::fontWithPath(Zend_Pdf_Font::FONT_HELVETICA);break;
	    		}
    			break;
    		default:
	    		switch ( $weight){
	    			case 'bold': $font = Zend_Pdf_Font::fontWithName(Zend_Pdf_Font::FONT_COURIER_BOLD);break;
	    			default:	 $font = Zend_Pdf_Font::fontWithName(Zend_Pdf_Font::FONT_COURIER);break;
	    		}
    			break;
    	}
    	return $font;
    }
	public function getFont()
	{
		$font = $this->getData('font');
		// var_dump($font);
		die();
		if ( !is_object($font) )
		{
			$font = self::buildFont($font, $this->getData('font_weight'));
			$this->setData('font',$font);
		}
		return $font; 
	}	
}

<?php
/**
 * AuIt 
 *
 * @category   AuIt
 * @author     M Augsten
 * @copyright  Copyright (c) 2010 Ingenieurbüro (IT) Dipl.-Ing. Augsten (http://www.au-it.de)
 */
class AuIt_Pdf_Model_Invoice extends AuIt_Pdf_Model_Pdf_Base // AuIt_Pdf_Model_Pdf_Abstract
{
	protected function getPdfType()
	{
		return 'invoice';
	}
}

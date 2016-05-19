<?php
/**
 * AuIt 
 *
 * @category   AuIt
 * @author     M Augsten
 * @copyright  Copyright (c) 2010 Ingenieurbüro (IT) Dipl.-Ing. Augsten (http://www.au-it.de)
 */
class AuIt_Pdf_Model_Shipment extends AuIt_Pdf_Model_Pdf_Base 
{
	protected function getPdfType()
	{
		return 'shipment';
	}
}

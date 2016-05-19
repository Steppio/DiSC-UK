<?php
/**
 * AuIt 
 *
 * @category   AuIt
 * @author     M Augsten
 * @copyright  Copyright (c) 2010 Ingenieurbüro (IT) Dipl.-Ing. Augsten (http://www.au-it.de)
 */
class AuIt_Pdf_Model_Adminhtml_Arraytemplate extends Mage_Adminhtml_Model_System_Config_Backend_Serialized
{
	function masort(&$data, $sortby)
	{ 
	    static $sort_funcs = array();
	    if (empty($sort_funcs[$sortby])) {
	        $code = "\$c=0;";
	        foreach (split(',', $sortby) as $key) {
	            $code .= "if ( (\$c = strcasecmp(\$a['$key'],\$b['$key'])) != 0 ) return \$c;\n";
	        }
	        $code .= 'return $c;';
	        $sort_func = $sort_funcs[$sortby] = create_function('$a, $b', $code);
	    } else {
	        $sort_func = $sort_funcs[$sortby];
	    }
	    $sort_func = $sort_funcs[$sortby];
	    uasort($data, $sort_func);
	}
	protected function _getDefault()
    {
    	return Mage::helper('auit_pdf/config')->getDefaults($this->getPath());
    }
	protected function _afterLoad()
    {
    	$v = $this->getValue();
		if ( !is_array($v) && !is_string($v) )
			$v='';
    	if ( empty($v) )
    	{
    		$v = $this->_getDefault();
    	}
    	if (!is_array($v)) 
    	{
    		if ( strpos($v,'base64:') === 0 )
    		{
    			$v = base64_decode(substr($v,7));
    		}
    		$v=@unserialize($v);
        }
        $this->setValue($v);
    }
    protected function checkData(&$value)
    {
    }
    protected function _beforeSave()
    {
        $value = $this->getValue();
        if (is_array($value)) {
            unset($value['__empty']);
        }
        if (is_array($value)) {
        	$this->checkData($value);
	        $this->setValue('base64:'.base64_encode(serialize($value))); 
        }
       	//parent::_beforeSave();
    }
}

<?php
/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/osl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * @category    Yoma
 * @package     Yoma_Realex
 * @copyright   Copyright (c) 2014 YOMA LIMITED (http://www.yoma.co.uk)
 * @license     http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */
class Yoma_Realex_Model_Realex_Source_IframeSize
{

    const SIZE_STANDARD = 1;
    const SIZE_STANDARD_SECURE = 2;

    protected $_sizes = array(
        self::SIZE_STANDARD => 'Standard Card Processing',
        self::SIZE_STANDARD_SECURE => 'Standard Card Processing with 3DSecure',
    );

    protected $_dimensions = array(
        self::SIZE_STANDARD => array('600','620'),
        self::SIZE_STANDARD_SECURE => array('600','650'),
    );

    /**
     * Return sizes to option array
     *
     * @return array
     */
    public function toOptionArray()
    {
        $sizeOptions = array();

        foreach ($this->_sizes as $key=>$_size) {

            $sizeOptions[] = array(
                'value' => $key,
                'label' => Mage::helper('realex')->__($_size)
            );
        }

        return $sizeOptions;
    }

    /**
     * Return frame size
     *
     * @param string $size
     * @return mixed
     */
    public function getDimensions($size){

        if(in_array($size,$this->_dimensions)){
            return $this->_dimensions[$size];
        }

        return $this->_dimensions[self::SIZE_STANDARD];
    }
}

<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Block_Adminhtml_Common_Grid extends Mage_Adminhtml_Block_Widget_Grid
{

    public function __construct()
    {
        parent::__construct();
        $this->setId('foomanconnectGrid');
        $this->setDefaultSort('created_at');
        $this->setDefaultDir('DESC');
    }

    /**
     * @param string $baseUrl
     * @param string $field
     */
    protected function _addActionColumn($baseUrl, $field)
    {
        /**
         * the custom renderer is responsible for displaying the view link or not depending on the permission level
         */
        $this->addColumn(
            'action',
            array(
                'header'   => Mage::helper('sales')->__('Action'),
                'width'    => '50px',
                'type'     => 'action',
                'getter'   => 'getSalesEntityViewId',
                'renderer' => 'foomanconnect/adminhtml_common_renderer_action',
                'actions'  => array(
                    array(
                        'caption' => Mage::helper('sales')->__('View'),
                        'url'     => array(
                            'base' => $baseUrl,
                        ),
                        'field'   => $field
                    )
                ),
                'filter'   => false,
                'sortable' => false,
                'index'    => $field,
            )
        );
    }

    protected function _filterXeroStatus($collection, $column)
    {

        $eqZero = array("eq" => 0);
        $cond = $column->getFilter()->getCondition();
        if ($eqZero == $cond) {
            $cond = array(array("eq" => 0), array("null" => 1));
        }
        $collection->addFieldToFilter('xero_export_status', $cond);

    }

}

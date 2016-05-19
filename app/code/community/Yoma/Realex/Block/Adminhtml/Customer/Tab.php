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
class Yoma_Realex_Block_Adminhtml_Customer_Tab extends Yoma_Realex_Block_Adminhtml_Tokencard_Grid
    implements Mage_Adminhtml_Block_Widget_Tab_Interface {

    /**
     * Set the template for the block
     *
     */
    public function _construct()
    {
        parent::_construct();
        //$this->setTemplate('realex/customer/tab.phtml');
        //parent::__construct();
        $this->setFilterVisibility(FALSE);
        $this->setSaveParametersInSession(FALSE);
    }
    /**
     * Retrieve the label used for the tab relating to this block
     *
     * @return string
     */
    public function getTabLabel()
    {
        return $this->__('Saved Cards');
    }
    /**
     * Retrieve the title used by this tab
     *
     * @return string
     */
    public function getTabTitle()
    {
        return $this->__('View Saved Cards');
    }
    /**
     * Determines whether to display the tab
     * Add logic here to decide whether you want the tab to display
     *
     * @return bool
     */
    public function canShowTab()
    {
        $customer = Mage::registry('current_customer');
        return (bool)$customer->getId();
    }
    /**
     * Stops the tab being hidden
     *
     * @return bool
     */
    public function isHidden()
    {
        $hidden = false;

        $config = (string) Mage::getStoreConfig('payment/realvault/active');
        if($config == 'false') {
            $hidden = true;
        }

        return $hidden;
    }

    /**
     * Defines after which tab, this tab should be rendered
     *
     * @return string
     */
    public function getAfter() {

        return 'orders';
    }

    protected function _prepareCollection()
    {
        $collection = Mage::getModel('realex/tokencard')
            ->getCollection()
            ->addCustomerFilter(Mage::registry('current_customer'));
        $this->setCollection($collection);
        return Mage_Adminhtml_Block_Widget_Grid::_prepareCollection();
    }

    public function getRowUrl($row)
    {
        return $this->getUrl('realexAdmin/adminhtml_tokencard/edit', array('id' => $row->getId()));
    }


    public function getGridUrl()
    {
        return $this->getUrl('*/*/tab', array('_current' => true));
    }


    public function getExportTypes(){
        return false;
    }
}
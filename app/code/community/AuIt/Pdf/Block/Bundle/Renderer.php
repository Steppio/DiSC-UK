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
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magentocommerce.com for more information.
 *
 * @category    Mage
 * @package     Mage_Bundle
 * @copyright   Copyright (c) 2010 Magento Inc. (http://www.magentocommerce.com)
 * @license     http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

/**
 * Order item render block
 *
 * @category    Mage
 * @package     Mage_Bundle
 * @author      Magento Core Team <core@magentocommerce.com>
 */
class AuIt_Pdf_Block_Bundle_Renderer extends Mage_Bundle_Block_Sales_Order_Items_Renderer
{
    public function canShowPriceInfo($item)
    {
    	if ( !$item->getOrderItem()->getParentItem() )
            return true;
        return false;
    	
        if (($item->getOrderItem()->getParentItem() && $this->isChildCalculated())
                || (!$item->getOrderItem()->getParentItem() && !$this->isChildCalculated())) {
            return true;
        }
        return false;
    }
    public function isShipmentSeparately($item = null)
    {
    	return true;
    }
}

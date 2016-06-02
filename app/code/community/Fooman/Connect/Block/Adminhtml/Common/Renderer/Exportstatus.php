<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Block_Adminhtml_Common_Renderer_Exportstatus
    extends Mage_Adminhtml_Block_Widget_Grid_Column_Renderer_Abstract
{

    public function render(Varien_Object $row)
    {
        $currentStatus = $row->getXeroExportStatus();
        $statusses = Fooman_Connect_Model_Status::getStatuses(true);
        if (isset($statusses[$currentStatus])) {
            $label = $statusses[$currentStatus];
        } else {
            $label = $statusses[Fooman_Connect_Model_Status::NOT_EXPORTED];
        }
        return $label;
    }
}

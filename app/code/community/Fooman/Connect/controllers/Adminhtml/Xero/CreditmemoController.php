<?php

/*
 * @author     Kristof Ringleff
 * @package    Fooman_Connect
 * @copyright  Copyright (c) 2010 Fooman Limited (http://www.fooman.co.nz)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Fooman_Connect_Adminhtml_Xero_CreditmemoController extends Mage_Adminhtml_Controller_Action
{

    /**
     * @return boolean
     */
    protected function _isAllowed()
    {
        return Mage::getSingleton('admin/session')->isAllowed('foomanconnect/xero_creditmemo');
    }

    protected $_session;

    protected function _construct()
    {
        $this->setUsedModuleName('Fooman_Connect');
    }

    public function indexAction()
    {

        $this->loadLayout();
        $this->_setActiveMenu('foomanconnect/xero');

        $block = 'foomanconnect/adminhtml_creditmemo';
        if (!Mage::helper('foomanconnect/migration')->hasCompleted()) {
            $block = 'foomanconnect/adminhtml_migration_inProgress';
        }

        $this->_addContent(
            $this->getLayout()->createBlock($block, 'xero')
        );
        $this->renderLayout();
    }


    public function exportSelectedAction()
    {

        //Get ids from POST
        $creditmemoIds = $this->getRequest()->getPost('creditmemo_ids');

        //loop through orders
        if (is_array($creditmemoIds) && !empty($creditmemoIds)) {
            sort($creditmemoIds);
            $successes = 0;
            foreach ($creditmemoIds as $creditmemoId) {
                try {
                    Mage::getModel('foomanconnect/creditmemo')->exportByCreditmemoId($creditmemoId);
                    $successes++;
                } catch (Exception $e) {
                    $this->_getSession()->addError($e->getMessage());
                }
            }
        }

        if ($successes == 1) {
            $this->_getSession()->addSuccess(
                Mage::helper('foomanconnect')->__('Successfully exported %s credit memo', $successes)
            );
        } elseif ($successes) {
            $this->_getSession()->addSuccess(
                Mage::helper('foomanconnect')->__('Successfully exported %s credit memos', $successes)
            );
        }

        //go back to the order overview page
        $this->_redirect('adminhtml/xero_creditmemo');
    }

    public function neverExportSelectedAction()
    {
        $errors = '';

        //Get ids from POST
        $creditmemoIds = $this->getRequest()->getPost('creditmemo_ids');

        //loop through credit memos
        if (is_array($creditmemoIds) && !empty($creditmemoIds)) {
            sort($creditmemoIds);
            foreach ($creditmemoIds as $creditmemoId) {
                $creditmemo = Mage::getModel('foomanconnect/creditmemo')
                    ->getCollection()
                    ->addFieldToFilter('entity_id', $creditmemoId)
                    ->getFirstItem();
                $creditmemo->setCreditmemoId($creditmemo->getEntityId());

                $creditmemoIncrementId = $creditmemo->getIncrementId();
                if ($creditmemo->getXeroExportStatus() == Fooman_Connect_Model_Status::EXPORTED
                ) {
                    //we have already exported it
                    $errors = empty($errors)
                        ?
                        $creditmemoIncrementId . ": " . Mage::helper('foomanconnect')->__('Has already been exported.')
                        : $errors . "<br/>" . $creditmemoIncrementId . ": " . Mage::helper('foomanconnect')->__(
                            'Has already been exported.'
                        );
                } else {
                    try {
                        //let's set the status
                        $creditmemo->setXeroExportStatus(
                            Fooman_Connect_Model_Status::WONT_EXPORT
                        )->save();
                    } catch (Exception $e) {
                        $errors = empty($errors) ? $creditmemoIncrementId . ": " . $e->getMessage()
                            : $errors . "<br/>" . $creditmemoIncrementId . ": " . $e->getMessage();
                    }
                }

            }
        }
        //Add results to session
        if (!empty($errors)) {
            $this->_getSession()->addError($errors);
        } else {
            $this->_getSession()->addSuccess(
                Mage::helper('foomanconnect')->__('Successfully changed creditmemo export status.')
            );
        }
        //go back to the order overview page
        $this->_redirect('adminhtml/xero/creditmemo');
    }


    public function gridAction()
    {
        $this->loadLayout();
        $this->getResponse()->setBody(
            $this->getLayout()->createBlock('foomanconnect/adminhtml_creditmemo_grid')->toHtml()
        );
    }

}

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
class Yoma_Realex_CardsController extends Mage_Core_Controller_Front_Action {


	public function indexAction() {

        if (!$customer_id = Mage::helper('realex/direct')->getCustomerId()) {
            Mage::getSingleton('customer/session')->authenticate($customer_id);
            return;
        }

        $this->loadLayout();
        $this->_initLayoutMessages('catalog/session');
        $this->_initLayoutMessages('customer/session');

        if ($navigationBlock = $this->getLayout()->getBlock('customer_account_navigation')) {
            $navigationBlock->setActive('realex/cards');
        }


        if ($block = $this->getLayout()->getBlock('customer.account.link.back')) {
            $block->setRefererUrl($this->_getRefererUrl());
        }

        $this->getLayout()->getBlock('head')
        ->setTitle(Mage::helper('realex')->__('My Stored Cards'));
        $this->renderLayout();
    }

    /**
     * Set Default credit card
     * 
     */
    public function defaultAction() {

        if ($this->getRequest()->isXmlHttpRequest()) {
            $resp = array('st' => 'nok', 'text' => '');

            if (!Mage::getSingleton('customer/session')->authenticate($this)) {
                $resp ['text'] = $this->__('Please login, you session expired.');
                $this->getResponse()->setBody(Zend_Json::encode($resp));
                return;
            }

            if($card_id = (int) $this->getRequest()->getParam('card')) {
                $card = Mage::getModel("realex/tokencard")->getCardById($card_id);

                if ($card->getId()) {
                    if ($card->getCustomerId() != Mage::helper('realex/direct')->getCustomerId()) {
                        $resp ['text'] = $this->__('Invalid Card #');
                        $this->getResponse()->setBody(Zend_Json::encode($resp));
                        return;
                    } 

                    try {
                        Mage::getModel("realex/tokencard")->resetCustomerDefault();
                        $card->setIsDefault(1)->save();
                        $resp ['text'] = $this->__('Success!');
                        $resp ['st'] = 'ok';
                        $this->getResponse()->setBody(Zend_Json::encode($resp));
                        return;
                    } catch (Exception $e) {
                        $resp ['text'] = $this->__($e->getMessage());
                        $this->getResponse()->setBody(Zend_Json::encode($resp));
                        return;
                    }
                }
            } else {
                $resp ['text'] = $this->__('The requested Card does not exist.');
                $this->getResponse()->setBody(Zend_Json::encode($resp));
                return;
            }
        } else {

        }
    }

    /**
     * Remove a stored credit card
     * 
     */
    public function deleteAction() {
        if ($this->getRequest()->isXmlHttpRequest()) {
            $resp = array('st' => 'nok', 'text' => '');

            if (!Mage::getSingleton('customer/session')->authenticate($this)) {
                $resp ['text'] = $this->__('Please login, you session expired.');
                $this->getResponse()->setBody(Zend_Json::encode($resp));
                return;
            }

            if($card_id = (int) $this->getRequest()->getParam('card')) {
                $card = Mage::getModel("realex/tokencard")->getCardById($card_id);
                if ($card->getId()) {
                    if ($card->getCustomerId() != Mage::helper('realex/direct')->getCustomerId()) {
                        $resp ['text'] = $this->__('Invalid Card #');
                        $this->getResponse()->setBody(Zend_Json::encode($resp));
                        return;
                    }

                    try {
                        Mage::dispatchEvent('realex_delete_token', array('token'=> $card));
                        $resp ['text'] = $this->__('Success!');
                        $resp ['st'] = 'ok';
                        $this->getResponse()->setBody(Zend_Json::encode($resp));
                        return;
                    } catch (Exception $e) {
                        $resp ['text'] = $this->__($e->getMessage());
                        $this->getResponse()->setBody(Zend_Json::encode($resp));
                        return;
                    }

                } else {
                    $resp ['text'] = $this->__('The requested Card does not exist.');
                    $this->getResponse()->setBody(Zend_Json::encode($resp));
                    return;
                }

                $resp ['text'] = $this->__('The requested Card does not exist.');
                $this->getResponse()->setBody(Zend_Json::encode($resp));
                return;
            } else {

            }
        }
    }


    /**
     * Edit Stored Credit Card
     * 
     */
    public function editAction() {

        $url = Mage::getUrl('realexAdmin/cards/');
        if($card_id = (int) $this->getRequest()->getParam('card')) {
            if($card = Mage::getModel("realex/tokencard")->getCardById($card_id)) {

                if ($this->getRequest()->isPost()){
                    try {
                        $expire_month = (int) $this->getRequest()->getParam('card_month');
                        $expire_year = (int) $this->getRequest()->getParam('card_year');
                        $data['expiry_date'] = sprintf("%02d",$expire_month).sprintf("%02d",$expire_year);
                        $data['ch_name'] = strip_tags($this->getRequest()->getParam('card_name'));
                        Mage::dispatchEvent('realex_edit_token', array('token'=> $card, 'details'=>$data));
                        Mage::getSingleton('core/session')->addSuccess('Card updated successfully');
                    } catch (Exception $e) {
                        Mage::getSingleton('core/session')->addError('Card update unsuccessful');
                    }
                }

                $this->loadLayout();
                $this->_initLayoutMessages('catalog/session');
                $this->_initLayoutMessages('customer/session');

                if ($navigationBlock = $this->getLayout()->getBlock('customer_account_navigation')) {
                    $navigationBlock->setActive('realex/cards');
                }


                if ($block = $this->getLayout()->getBlock('customer.account.link.back')) {
                    $block->setRefererUrl($url);
                }

                $this->getLayout()
                ->getBlock('head')
                ->setTitle(Mage::helper('realex')->__('RealVault - Credit Cards'));
                $this->renderLayout();
            } else {

            }
        } else {

        }
    }

} 
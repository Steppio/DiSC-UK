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
class Yoma_Realex_Model_Observer_Tokencard {

    /**
     * Create token
     *
     * @param Varien_Event_Observer $observer
     * @return $this
     */
    public function saveCustomerCard(Varien_Event_Observer $observer) {

    	$service = $observer->getService();
        $transport = $observer->getTransport();
        try{
            $service->setTransactionType('registerToken');
            $service->setMethod();
            $service->setMd($observer->getData('md'));
            $service->run();

        }catch(Exception $e){
            mage::logException($e);
            $transport->setToken(false);
        }

        return $this;
    }

    /**
     * Delete Token
     *
     * @param Varien_Event_Observer $observer
     * @return $this
     */
    public function deleteCustomerCard(Varien_Event_Observer $observer) {

        try{
            $service = Mage::getModel('realex/service_token');
            $service->setTransactionType('delete');
            $service->setToken($observer->getToken());
            $service->setMethod();
            $service->run();

        }catch(Exception $e){
            mage::logException($e);
        }

        return $this;
    }

    /**
     * Edit Payer
     *
     * @param Varien_Event_Observer $observer
     * @return $this
     * @throws Exception
     */
    public function editPayer(Varien_Event_Observer $observer) {

        try{
            $service = Mage::getModel('realex/service_token');
            $service->setTransactionType('editPayer');
            $service->setToken($observer->getToken());
            $service->setMethod();
            $service->run();

        }catch(Exception $e){
            mage::logException($e);
            throw $e;
        }

        return $this;
    }

    /**
     * Edit Token
     *
     * @param Varien_Event_Observer $observer
     * @return $this
     * @throws Exception
     */
    public function editCustomerCard(Varien_Event_Observer $observer) {

        try{
            $service = Mage::getModel('realex/service_token');
            $service->setTransactionType('editToken');
            $service->setToken($observer->getToken());
            $service->setCardData($observer->getDetails());
            $service->setMethod();
            $service->run();

        }catch(Exception $e){
            mage::logException($e);
            throw $e;
        }

        return $this;
    }

    /**
     * Add magento admin alert for expiring cards
     *
     * @return $this
     */
    public function alertExpiredCards(){

        foreach($this->_cardsExpiring() as $card) {
            $inbox = mage::getModel('adminNotification/feed');
            $description = "<strong>Realex Payments:</strong> You have cards that are about to expire.";
            $inbox->addNotice($description, Mage::helper('adminhtml')->getUrl('realexAdmin/adminhtml_tokencard/edit', array('id' => $card->getId())));
        }
        return $this;
    }

    /**
     * Returnn expiring tokens
     *
     * @return mixed
     */
    private function _cardsExpiring() {
        return Mage::getModel("realex/tokencard")->getCollection()->addExpiringFilter();

    }

    /**
     * @TODO remove redundant function
     *
     * @param Varien_Event_Observer $observer
     */
    public function setPaymentMethod(Varien_Event_Observer $observer){

        if($observer->getInput()->getRealexTokenCcId()){
            $observer->getInput()->setMethod('realvault');
        }

    }

    /**
     * @TODO remove redundant function
     *
     * @param Varien_Event_Observer $observer
     */
    public function checkPaymentMethod(Varien_Event_Observer $observer){

        if($observer->getMethodInstance()->getCode() == 'realvault'){
            $observer->getResult()->setIsAvailable = true;
        }

    }

    /**
     * Delete tokens on customer delete
     *
     * @param Varien_Event_Observer $observer
     * @return $this
     */
    public function deleteCustomerCards(Varien_Event_Observer $observer){

        try{
            $service = Mage::getModel('realex/service_token');
            $service->setTransactionType('delete');

            $tokens = mage::getModel('realex/tokencard')
                ->getCollection()
                ->addCustomerFilter($observer->getCustomer())
            ->load();

            foreach($tokens as $token) {
                $service->setToken($token);
                $service->setMethod();
                $service->run();
            }

        }catch(Exception $e){
            mage::logException($e);
        }

        return $this;
    }
}
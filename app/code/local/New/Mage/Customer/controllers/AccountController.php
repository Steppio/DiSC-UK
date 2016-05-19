<?php
/**
 * Customer account controller
 */
require_once 'Mage/Customer/controllers/AccountController.php';

class New_Mage_AccountController extends Mage_Customer_AccountController {

    // /**
    //  * Action predispatch
    //  *
    //  * Check customer authentication for some actions
    //  */
    // public function preDispatch()
    // {
    //     // a brute-force protection here would be nice

    //     parent::preDispatch();

    //     if (!$this->getRequest()->isDispatched()) {
    //         return;
    //     }

    //     $action = $this->getRequest()->getActionName();
    //     $openActions = array(
    //         'create',
    //         'login',
    //         'logoutsuccess',
    //         'forgotpassword',
    //         'forgotpasswordpost',
    //         'resetpassword',
    //         'resetpasswordpost',
    //         'confirm',
    //         'confirmation',
    //         'registrationsuccess'
    //     );
    //     $pattern = '/^(' . implode('|', $openActions) . ')/i';

    //     if (!preg_match($pattern, $action)) {
    //         if (!$this->_getSession()->authenticate($this)) {
    //             $this->setFlag('', 'no-dispatch', true);
    //         }
    //     } else {
    //         $this->_getSession()->setNoReferer(true);
    //     }
    // }

    // /**
    //  * Success Registration
    //  *
    //  * @param Mage_Customer_Model_Customer $customer
    //  * @return Mage_Customer_AccountController
    //  */
    // protected function _successProcessRegistration(Mage_Customer_Model_Customer $customer)
    // {
    //     $session = $this->_getSession();
    //     if ($customer->isConfirmationRequired()) {
    //         /** @var $app Mage_Core_Model_App */
    //         $app = $this->_getApp();
    //         /** @var $store  Mage_Core_Model_Store*/
    //         $store = $app->getStore();
    //         $customer->sendNewAccountEmail(
    //             'confirmation',
    //             $session->getBeforeAuthUrl(),
    //             $store->getId()
    //         );
    //         $customerHelper = $this->_getHelper('customer');
    //         $session->addSuccess($this->__('Account confirmation is required. Please, check your email for the confirmation link. To resend the confirmation email please <a href="%s">click here</a>.',
    //             $customerHelper->getEmailConfirmationUrl($customer->getEmail())));
    //         $url = $this->_getUrl('*/*/registrationsuccess', array('_secure' => true));
    //     } else {
    //         $session->setCustomerAsLoggedIn($customer);
    //         $url = $this->_welcomeCustomer($customer);
    //     }
    //     $this->_redirectSuccess($url);
    //     return $this;
    // }

    // /**
    //  * CUSTOM FUNCTION: redirect user to custom page after registration
    //  *
    //  * @return redirect
    //  */
    // public function registrationSuccessAction()
    // {
    //     $this->loadLayout();
    //     $this->renderLayout();
    // }

}

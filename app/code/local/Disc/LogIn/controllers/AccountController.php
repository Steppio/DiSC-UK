<?php 
require_once 'Mage/Customer/controllers/AccountController.php';

class Disc_LogIn_AccountController extends Mage_Customer_AccountController
{
    public function _loginPostRedirect()
    {
        $session = $this->_getSession();

        if (!$session->getBeforeAuthUrl() || $session->getBeforeAuthUrl() == Mage::getBaseUrl()) {
            // Set default URL to redirect customer to
            // $session->setBeforeAuthUrl($this->_getHelper('customer')->getAccountUrl()); 

$url = Mage::getSingleton('core/session')->getLastUrl();
$session->setBeforeAuthUrl($this->_redirectUrl($url));

            // Redirect customer to the last page visited after logging in
            if ($session->isLoggedIn()) {
                if (!Mage::getStoreConfigFlag(
                    Mage_Customer_Helper_Data::XML_PATH_CUSTOMER_STARTUP_REDIRECT_TO_DASHBOARD
                )) {
                    $referer = $this->getRequest()->getParam(Mage_Customer_Helper_Data::REFERER_QUERY_PARAM_NAME);
                    if ($referer) {
                        // Rebuild referer URL to handle the case when SID was changed
                        $referer = $this->_getModel('core/url')
                            ->getRebuiltUrl( $this->_getHelper('core')->urlDecodeAndEscape($referer));
                        if ($this->_isUrlInternal($referer)) {
                            $session->setBeforeAuthUrl($referer);
                        }
                    }
                } else if ($session->getAfterAuthUrl()) {
                    $session->setBeforeAuthUrl($session->getAfterAuthUrl(true));
                }
            } else {
                $session->setBeforeAuthUrl( $this->_getHelper('customer')->getLoginUrl());
            }
        } else if ($session->getBeforeAuthUrl() ==  $this->_getHelper('customer')->getLogoutUrl()) {
            $session->setBeforeAuthUrl( $this->_getHelper('customer')->getDashboardUrl());
        } else {
            if (!$session->getAfterAuthUrl()) {
                $session->setAfterAuthUrl($session->getBeforeAuthUrl());
            }
            if ($session->isLoggedIn()) {
                $session->setBeforeAuthUrl($session->getAfterAuthUrl(true));
            }
        }
        $this->_redirectUrl($session->getBeforeAuthUrl(true));
    }



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
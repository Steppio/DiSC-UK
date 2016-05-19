<?php
/**
 *
 * DISCLAIMER
 *
 * Use at your own risk
 *
 * @author      Branko Ajzele, http://activecodeline.com
 * @category    Ajzele
 * @package     Ajzele_MailTransport
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */
class Ajzele_MailTransport_Model_Core_Email_Template extends Mage_Core_Model_Email_Template {
    const MODULE_SETTINGS_PATH = 'ajzele_mail_transport';

    /**
     * Send mail to recipient
     *
     * @param   string      $email		  E-mail
     * @param   string|null $name         receiver name
     * @param   array       $variables    template variables
     * @return  boolean
     **/
    public function send($email, $name = null, array $variables = array()) {
        if (!$this->isValidForSend()) {
            Mage::logException(new Exception('This letter cannot be sent.')); // translation is intentionally omitted
            return false;
        }

        if (is_null($name)) {
            $name = substr($email, 0, strpos($email, '@'));
        }

        $variables['email'] = $email;
        $variables['name'] = $name;

        ini_set('SMTP', Mage::getStoreConfig('system/smtp/host'));
        ini_set('smtp_port', Mage::getStoreConfig('system/smtp/port'));

        $mail = $this->getMail();

        $setReturnPath = Mage::getStoreConfig(self::XML_PATH_SENDING_SET_RETURN_PATH);
        switch ($setReturnPath) {
            case 1:
                $returnPathEmail = $this->getSenderEmail();
                break;
            case 2:
                $returnPathEmail = Mage::getStoreConfig(self::XML_PATH_SENDING_RETURN_PATH_EMAIL);
                break;
            default:
                $returnPathEmail = null;
                break;
        }

        if ($returnPathEmail !== null) {
            $mail->setReturnPath($returnPathEmail);
        }

        if (is_array($email)) {
            foreach ($email as $emailOne) {
                $mail->addTo($emailOne, $name);
            }
        } else {
            $mail->addTo($email, '=?utf-8?B?'.base64_encode($name).'?=');
        }

        $this->setUseAbsoluteLinks(true);
        $text = $this->getProcessedTemplate($variables, true);

        if($this->isPlain()) {
            $mail->setBodyText($text);
        } else {
            $mail->setBodyHTML($text);
        }

        $mail->setSubject('=?utf-8?B?'.base64_encode($this->getProcessedTemplateSubject($variables)).'?=');
        $mail->setFrom($this->getSenderEmail(), $this->getSenderName());

        try {
            $systemStoreConfig = Mage::getStoreConfig('system');

            $emailSmtpConf = array(
                    //'auth' => 'login',
                    'auth' => strtolower($systemStoreConfig[self::MODULE_SETTINGS_PATH]['auth']),
                    //'ssl' => 'tls',
                    'ssl' => strtolower($systemStoreConfig[self::MODULE_SETTINGS_PATH]['ssl']),
                    'username' => $systemStoreConfig[self::MODULE_SETTINGS_PATH]['username'],
                    'password' => $systemStoreConfig[self::MODULE_SETTINGS_PATH]['password']
            );
            
            $smtp = 'smtp.gmail.com';

            if($systemStoreConfig[self::MODULE_SETTINGS_PATH]['smtphost']) {
                $smtp = strtolower($systemStoreConfig[self::MODULE_SETTINGS_PATH]['smtphost']);
            }

            $transport = new Zend_Mail_Transport_Smtp($smtp, $emailSmtpConf);
            $mail->send($transport);
            $this->_mail = null;
        }
        catch (Exception $ex) {

            //Zend_Debug::dump($systemStoreConfig[self::MODULE_SETTINGS_PATH]);
            //Zend_Debug::dump($ex->getMessage()); exit;

            try {
                $mail->send(); /* Try regular email send if the one with $transport fails */
                $this->_mail = null;
            }
            catch (Exception $ex) {
                $this->_mail = null;

                //Zend_Debug::dump($systemStoreConfig[self::MODULE_SETTINGS_PATH]);
                //Zend_Debug::dump($ex->getMessage()); exit;

                Mage::logException($ex);
                return false;
            }
            Mage::logException($ex);
            return false;
        }
        return true;
    }
}
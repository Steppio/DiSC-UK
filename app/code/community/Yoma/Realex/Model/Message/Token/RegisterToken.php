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
class Yoma_Realex_Model_Message_Token_RegisterToken extends Yoma_Realex_Model_Message_Abstract{

    public function getTransactionData(){
        $request = $this->getRequest();

        $data = array(
            'orderid' => $request['orderid']['value'],
            'payer_ref' => $request['card']['payerref']['value'],
            'token_ref' => $request['card']['ref']['value'],
            'card_expiry' => $request['card']['expdate']['value'],
            'card_type' => $request['card']['type']['value'],
            'card_number' => $request['card']['number']['value'],
            'card_name' => $request['card']['chname']['value'],
        );


        return $data;
    }
}
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

document.observe("dom:loaded", function() {

    var settleAmount = $('settle-amount');
    if($('settle-check')) {
        $('settle-check').checked = false;
        $('settle-check').observe('click', function (e) {
            if (this.checked) {
                settleAmount.disabled = false;
                settleAmount.setStyle({
                    backgroundColor: 'white',
                    color: 'black'
                });
                return true;
            }
            settleAmount.disabled = true;
            settleAmount.setStyle({
                backgroundColor: '#AAAAAA',
                color: 'graytext'
            });

        });
    }

});

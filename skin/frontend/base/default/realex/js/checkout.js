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

cardOpt = function(radioelement) {
	var option = radioelement.value;
	$('realexdirect_card_type').value = option;
	if(option == 1){
		$('realexdirect_card_stored').show();
    	$('realexdirect_card_form').hide();
	} else if (option == 0) {
		$('realexdirect_card_stored').hide();
    	$('realexdirect_card_form').show();
	}
}

storeCard = function(checkboxelement) {
	var value = checkboxelement.checked ? 1 : 0;
    $('CARD_STORAGE_ENABLE').value = value;
}

storeCardDirect = function(radioelement) {
    $('realexdirect_CARD_STORAGE_ENABLE').value = radioelement.value;
}

switchToken = function(radio){

    $$('div.tokencvv').invoke('hide');
    $$('input.tokencvv').each(function(inp){
        inp.disabled = 'disabled';
        inp.setValue('');
    })

    $$('input.tokencctype').each(function(inp){
        inp.disabled = 'disabled';
    })
    var divcont = radio.next('div');

    if((typeof divcont) != 'undefined'){
        divcont.down().next('input').removeAttribute('disabled');
        divcont.down('input.tokencctype').removeAttribute('disabled');
        divcont.show();
    }

}

tokenRadioCheck = function(radioID, cvv){

    try{
        $(radioID).checked = true;
    }catch(noex){}

    $$('input.tokencvv').each(function(sl){
        if(sl.id != cvv.id){
            sl.disabled = true;
            sl.setValue('');
        }
    });

    $$('input.tokencctype').each(function(sl){
        if(sl.id != cvv.id){
            sl.disabled = true;
            sl.setValue('');
        }
    });
}

Validation.addAllThese([

    ['validate-realex-cvn', 'Please enter a valid credit card verification number.', function(v, elm) {
        try{

            var ccTypeContainer = $(elm.id.replace('token_cvv','cc_type'));

            if(ccTypeContainer === undefined)
            {
                return true;
            }
            var ccType = ccTypeContainer.value;

            switch (ccType) {
                case 'VISA' :
                case 'MC' :
                    re = new RegExp('^[0-9]{3}$');
                    break;
                case 'AMEX' :
                    re = new RegExp('^[0-9]{4}$');
                    break;
                case 'YOMA_MAESTRO':
                case 'SOLO':
                case 'SWITCH':
                    re = new RegExp('^([0-9]{1}|^[0-9]{2}|^[0-9]{3})?$');
                    break;
                default:
                    re = new RegExp('^([0-9]{3}|[0-9]{4})?$');
                    break;
            }

            if (v.match(re)) {
                return true;
            }
            return false;
        }catch(_error){return true;}
    }]
]);



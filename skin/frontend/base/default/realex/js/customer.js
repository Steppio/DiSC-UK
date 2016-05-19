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
setDefault = function (radioelement){
    new Ajax.Request(('default'), {
        method: 'get',
        parameters: {
            card:radioelement.value
            },
        onSuccess: function(transport) {
            var rsp = transport.responseText.evalJSON();
            if(rsp.st != 'ok'){
                alert(rsp.text);
            }
        },
        onLoading: function(){
        }
    })
}

// remove credit card
removeCard = function(elem) {
    var oncheckout = elem.hasClassName('oncheckout');
    new Ajax.Request(elem.href, {
        method: 'get',
        onSuccess: function(transport) {
            try {
                var rsp = transport.responseText.evalJSON();

                if(rsp.st != 'ok') {
                    new Effect.Opacity(elem.up(), { from: 0.3, to: 1.0, duration: 0.5 });
                    alert(rsp.text);
                }
                else {
                    if(false === oncheckout) {
                        elem.up().up().fade({
                            afterFinish:function(){
                                elem.up().up().remove();
                                updateEvenOdd();
                            }
                        });
                    }
                    else {
                        elem.up().fade({
                            afterFinish:function() {
                                var daiv = elem.up('div');
                                elem.up().remove();
                                //If no tokens, open new token dialog
                                var tokens = daiv.select("li.tokencard-radio input").length;
                                if(parseInt(tokens) === 0) {
                                    toggleNewCard(2);
                                    $$("a.usexist").first().up().remove();
                                }

                            }
                        });
                    }
                }
            }catch(er){
                alert(er);
            }
        },
        onLoading: function() {
            if(!oncheckout) {
                if($('iframeRegCard')) {
                    $('iframeRegCard').remove();
                }
                else if($('frmRegCard')) {
                    $('frmRegCard').remove();
                }
                $('sageTokenCardLoading').show();
            }
            else {
                new Effect.Opacity(elem.up(), { from: 1.0, to: 0.3, duration: 0.5 });
            }

        }
    })

}

evenOdd = function(row, index){
    var _class = ((index+1)%2 == 0 ? 'even' : 'odd');
    row.addClassName(_class);
}

updateEvenOdd = function(){
    var rows = $$('table#realex-card-tabl tbody tr');
    rows.invoke('removeClassName', 'odd').invoke('removeClassName', 'even');
    rows.each(
        function(row, index){
            evenOdd(row, index);
        });
}
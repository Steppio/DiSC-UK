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
var Realex = Class.create({
    initialize: function () {
        // This variable is used for storing fields values on change into JS object
        this.storedFields = $H({});
        // Binded element change observer method
    },
    // Creates form and appending it body element
    createForm: function () {
        $(document.body).insert('div');
    },
    showModel: function(redirect,failUrl,iframeSize,deny){

        this.closeUrl = failUrl;
        var close = this.onClose.bind(this);
        if((failUrl == redirect) || (deny == redirect)){
            close;
        }
        var iframe = document.createElement('iframe');
        iframe.src = redirect;
        iframe.id = 'iframeId';
        document.body.appendChild(iframe);

        var wm = new Control.Modal('iframeId',{
            className: 'modal',
            closeOnClick: true,
            width: iframeSize[0],
            height: iframeSize[1],
            fade: true,
            afterClose: close,
            position: 'center_once'
        });
        wm.open();
    },
    showInline: function(redirect,failUrl,iframeSize,deny){

        this.closeUrl = failUrl;
        if((failUrl == redirect) || (deny == redirect)){
            close;
        }
        var iframe = document.createElement('iframe');
        iframe.src = redirect;
        iframe.id = 'iframeId';
        iframe.width = iframeSize[0];
        iframe.height = iframeSize[1];
        $('checkoutSteps').appendChild(iframe);
    },
    onClose: function(){
       window.location=this.closeUrl;
    }


});
// Our class singleton
Realex.getInstance = function () {
    if (!this.instance) {
        this.instance = new this();
    }
    return this.instance;
};

var ReviewRegister = Class.create(Realex,{
    initialize: function () {
        // Registers wrapper on DOM tree load event.
        document.observe('dom:loaded', this.register.bind(this));
        // Registers wrapper on AJAX calls, since review object can be overridden in it
        Ajax.Responders.register(this);
    },
    register: function () {
        if (!window.review || review.overriddenOnSave) {
            // In case if review object is not yet available
            // or wrapper was already applied
            return this;
        }

        var method = window.payment.currentMethod;

        if(['realexredirect','realexdirect','realvault'].indexOf(method) < 0){
            return;
        }
        if(!realexConfig){
            return;
        }
        var config = realexConfig[window.payment.currentMethod];

        if(config == undefined){
            return
        }
        if(config.iframe !== '1' || config.display !== '1' || config.secure !== '1'){
            return;
        }

        review.overriddenOnSave = function (transport) {
            try{
                if (transport && transport.responseText) {
                    try {
                        response = eval('(' + transport.responseText + ')');
                    }
                    catch (e) {
                        response = {};
                    }
                    if (response.redirect) {
                        review.isSuccess = true;

                        //Change to inline if using Safari on iOS
                        if (/Constructor/.test(window.HTMLElement) && /iP(ad|hone|od)/i.test(navigator.userAgent)){
                            config.inline = 1;
                        }

                        if(config.inline == 1){
                            Realex.getInstance().showInline(response.redirect, realexConfig.failUrl, realexConfig.iframeSize, config.deny);
                        }else {
                            Realex.getInstance().showModel(response.redirect, realexConfig.failUrl, realexConfig.iframeSize, config.deny);
                        }
                        return;
                    }
                    if (response.goto_section) {
                        if(response.goto_section == 'payment') {
                            $$('input.tokencvv').each(function (sl) {
                                sl.setValue('');
                            });
                        }
                    }
                }

            }
            catch (e) { /* some error processing logic */ }
            // Invokation original order save method
            this.nextStep(transport);
        }
        // Replace original onSave with overridden one
        review.onSave = review.overriddenOnSave.bind(review);
    },
    // This one is invoked when AJAX request gets completed
    onComplete: function () {
        this.register.defer();
    }
});
// Invoke ReviewRegister class routines
var realex = new ReviewRegister();

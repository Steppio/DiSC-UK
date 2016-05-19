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
var Iframe = Class.create();
Iframe.prototype = {
    initialize: function(closeUrl, contentUrl, srcUrl, width, height){
        this.closeUrl = closeUrl;
        this.contentUrl = contentUrl;
        this.srcUrl = srcUrl;
        this.onShow = this.showForm.bindAsEventListener(this);
        this.onClose = this.closeForm.bindAsEventListener(this);
        this.width = typeof width !== 'undefined' ? width : 460;
        this.height = typeof height !== 'undefined' ? height: 600;
        this.message = false;
    },
    show: function(){
        //Event.observe(window, 'beforeunload', this.register.bind(this));
        Event.observe(window, 'message', this.callBack.bind(this));
        
        var request = new Ajax.Request(
            this.contentUrl,
            {
                method:'post',
                onSuccess: this.onShow,
                onFailure: this.onClose
            }
        );
    },
    showForm: function(transport){
        if (transport && transport.responseText) {
            result = transport.responseText.trim();
            if(result !== ''){
                try{
                    var iframe = document.createElement('iframe');

                    iframe.src = this.srcUrl
                    iframe.id = 'iframeId';
                    document.body.appendChild(iframe);
                    
                    if (iframe.contentWindow){
	        			iframe = iframe.contentWindow;
					}else{
	        			if (iframe.contentDocument && iframe.contentDocument.document){
	                		iframe = iframe.contentDocument.document;
	        			}else{
	                		iframe = iframe.contentDocument;
	        			}
					}

					iframe.document.open();
					iframe.document.write(result);
					iframe.document.close();
					
                    var wm = new Control.Modal('iframeId',{
                        className: 'modal',
                        closeOnClick: true,
                        width: this.width ,
                        height: this.height,
                        fade: true,
                        afterClose: this.onClose
                    });
                    wm.open();
                }catch (_error){
                    this.onClose;
                }
            }else{
                this.onClose;
            }
        }
    },
    closeForm: function(){
        window.location=this.closeUrl;
    },
    callBack: function(evt){
    	if ( evt.origin === this.srcUrl ){
    		this.message = true;
    	}
    }
    /*,
    register: function (evt) {
    	if(this.message === true){
    		return;
    	}
    	location.replace(this.closeUrl);
    	return '';
    	//alert('h');
    	//window.location=this.closeUrl;
    	//this.theTimer.delay(5);
    	//this.timeout = window.setTimeout(this.clearit, 500000);
    },
    cleanup: function(evt){
    	clearTimeout(this.timeout);
    },
    theTimer: function(url){
    	history.replaceState({}, '', url);
    	return false;
    }
    */
}
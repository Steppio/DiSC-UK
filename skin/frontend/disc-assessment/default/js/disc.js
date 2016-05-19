function imageDetector() {

    var availableWidth = window.screen.availWidth
        ,  imageSize = setImageSize(imageSize, availableWidth);

    jQuery('.image-resize-target').each(function() {

        getImageName = jQuery(this).attr('id');
        fullPath = window.location.protocol + '//' + window.location.host + '/' + 'media/wysiwyg/' + getImageName + '-' + imageSize + '.jpg';

        jQuery(this).css('background-image', 'url(' + fullPath + ')');

    });

}

function appendLinksForMobile() {

    jQuery('#header-account ul li:nth-child(1) a').addClass('level0');
    jQuery('#header-account ul li:nth-child(3) a').addClass('level0');

    jQuery('#nav .nav-primary').append(jQuery('#header-account ul li:nth-child(1)').addClass('level0'));
    jQuery('#nav .nav-primary').append(jQuery('#header-account ul li:nth-child(2)').addClass('level0'));

}

function setImageSize(imageSize, availableWidth) {

    if(availableWidth <= 767) {
        imageSize = 'small';
    }
    else if(availableWidth >= 768 && availableWidth <= 1024) {
        imageSize = 'medium';
    }
    else if(availableWidth >= 1024) {
        imageSize = 'big';
    }
    else {

    } 

    return imageSize;

};

function initialiseFrontSlider() {
    
    jQuery('.product-slider .slick-initialise').slick({
        slidesToShow: 6,
        slidesToScroll: 1,
        responsive: [
            {
              breakpoint: 1300,
              settings: {
                slidesToShow: 6,
                slidesToScroll: 1
              }
            },
            {
              breakpoint: 1024,
              settings: {
                slidesToShow: 3,
                slidesToScroll: 3
              }
            },
            {
              breakpoint: 768,
              settings: {
                slidesToShow: 1,
                slidesToScroll: 1
              }
            }
        ]
    });

    jQuery('.product-slider2 .slick-initialise').slick({
        slidesToShow: 4,
        slidesToScroll: 4,
        // autoplay: true,
        // autoplaySpeed: 2000,
        responsive: [
            {
              breakpoint: 1300,
              settings: {
                slidesToShow: 6,
                slidesToScroll: 1
              }
            },
            {
              breakpoint: 1024,
              settings: {
                slidesToShow: 3,
                slidesToScroll: 3
              }
            },
            {
              breakpoint: 768,
              settings: {
                slidesToShow: 1,
                slidesToScroll: 1
              }
            }
        ]
    });

}

function resizeMargins() {

    var equalSides = (jQuery(window).width() - 1300) / 2;

    var negateEqualSides = 0 - Math.abs(equalSides);

    jQuery('.rs-l').each(function() {
        jQuery(this).css('margin-left', negateEqualSides);
        jQuery(this).css('padding-left', equalSides);
    });

    jQuery('.rs-r').each(function() {
        jQuery(this).css('margin-right', negateEqualSides);
        jQuery(this).css('padding-right', equalSides);
    });

}

function createSelectFromList(selector) {

    jQuery(selector).each(function() {
        var list = $(this), container = jQuery(document.createElement('div')).addClass('select-style').insertBefore(jQuery(this).hide()),
        select = jQuery(document.createElement('select')).appendTo(container);

        defaultOption = jQuery(document.createElement('option'))
                .appendTo(select)
                .html('Find out more...');

        jQuery('>li a', this).each(function() {
            var target = jQuery(this).attr('target'),
            option = jQuery(document.createElement('option'))
                .appendTo(select)
                .val(this.href)
                .html(jQuery(this).html());
            select.change(function() { window.location = jQuery(this).find("option:selected").val(); });
        });
        list.remove();

        var arrow_container = jQuery(document.createElement('div')).addClass('select-style-image').appendTo(container),
            fa_chevron = jQuery(document.createElement('i')).addClass('fa fa-chevron-down').appendTo(arrow_container);
    });

}

function slideToMe( href , distance ) {

    jQuery('html, body').animate({
        scrollTop: jQuery( href ).offset().top - distance
    }, 500);

}

function addLinkToEpic() {

    jQuery('#header-account ul').append('<li><a target="_blank" href="https://admin.inscape-epic.com/login.aspx">Login To EPIC</a></li>');

}

jQuery( document ).ready(function() {


    if(jQuery('body').hasClass('product-epic-credits')) {

        var normalProductPrice = jQuery('#normalPricing').html();
        var currency = jQuery('#currencySymbol').html();
        var specialProductPrice = jQuery('.price-info .price-excluding-tax .price').html().trim();
        var $tierPrices = jQuery('#target-tier .tier-prices li');

        // console.log($tierPrices);

        if(specialProductPrice != normalProductPrice) {

            var specialPrice = true,
                value = jQuery('.price-info .price-excluding-tax .price').text().replace('£', '');

            jQuery('.price-info .price-box').css('display', 'block');

            var JVprice = jQuery(value.trim());

        }
        else {

            var $tierPricing = [];

            jQuery.each( $tierPrices, function( key, value ) {

                $tierPricing[key] = [];
                $tierPricing[key]['quantity'] = jQuery(value).find('.tier-product-amount').html().replace(/[^0-9.]/g, '');
                $tierPricing[key]['price'] = jQuery(value).find('.price').html().replace(/[^0-9.]/g, '');

            });

            jQuery('.qty-wrapper #qty').change(function(event) {

                jQuery('.epic-wrapper').css('display', 'block');

                quantity = parseInt(jQuery('.qty-wrapper #qty').val());

                if(specialPrice == true) {

                    price = JVprice.selector;

                }
                else {

                    for(var i = 0, l = $tierPricing.length; i < l; i++) {

                        if(quantity >= $tierPricing[$tierPricing.length -1]['quantity']) {

                            price = $tierPricing[$tierPricing.length -1]['price'];

                        }
                        else {

                            if(quantity >= $tierPricing[i]['quantity'] && quantity < $tierPricing[i + 1]['quantity']) {

                                price = $tierPricing[i]['price'];

                            }

                        }

                    }

                }

                console.log(price);

                amount = currency + (quantity * price).toFixed(2);

                jQuery('.epic-wrapper').css('display', 'block');
                jQuery('.epic-wrapper #qty').val(amount);



            });

        }

    }

    imageDetector();
    initialiseFrontSlider();
    addLinkToEpic();

    if(jQuery(window).width() < 1024) {

        appendLinksForMobile();

    }

    jQuery(window).scroll(function()
    {

        if( jQuery(window).scrollTop() > 50 )
        {
            jQuery('.navbar-default').addClass('alt-background');
        } 
        else 
        {
            jQuery('.navbar-default').removeClass('alt-background');
        }    

    });

    jQuery('[data-toggle="tooltip"]').tooltip();

    if(jQuery(window).width() > 1300) {

        resizeMargins();

        jQuery(window).on('resize', function() {

            resizeMargins();

        });

    }

    jQuery( ".disc-definition-block" ).hover(
      function() {
        jQuery(this).toggleClass('active');
        return false;
      }, function() {
        jQuery(this).removeClass('active');
      }
    );

    if(jQuery('body').hasClass('cms-page-view') && jQuery(window).width() < 768) {

        createSelectFromList('#sidebar-nav-menu .nav-2 ul.level0');

    }

    if(jQuery('body').hasClass('clnews-index-index')){

        createSelectFromList('#commercelab_categories_container #commercelab_categories_div');

    }

    if(jQuery('body').hasClass('catalog-category-view') && jQuery(window).width() < 768) {

        createSelectFromList('#sidebar-nav-menu .nav-3 ul.level0');

    }

    if(jQuery('body').hasClass('catalog-product-view') && jQuery(window).width() < 768) {

        createSelectFromList('#sidebar-nav .nav-3 ul.level0');

    }

    if(jQuery('body').hasClass('cms-page-view') && jQuery(window).width() < 768) {

        createSelectFromList('#sidebar-nav .nav-3 ul.level0');

    }

    jQuery('.billing-buttons-container .button').click(function(event) {

        jQuery("#s_method_productrate_productrate").prop("checked", true);

    }); 

    // console.log(jQuery('#checkout-shipping-method-load #s_method_productrate_productrate').length);

    // if(jQuery('#checkout-shipping-method-load #s_method_productrate_productrate').length > 0){

    // }


    jQuery('.cta-inside-contact').click(function(event) {

        var query = jQuery.attr(this, 'id'),
            href = jQuery.attr(this, 'href'),
            distance = 200;

        jQuery(href).addClass('contact-clicked');
        setTimeout(function () {
            jQuery(href).removeClass('contact-clicked');
        }, 6000);

        var newquery = query.replace(/\-/g, ' ');
        var newquery = newquery.replace(/\_/g, ' - ');

        jQuery(href + ' .select-style').css('display', 'none');

        jQuery(href + ' .query-field').css('display', 'block');

        jQuery(href + ' .query-field input').val(newquery);

        if(jQuery(window).width() < 768) {
            href = '.contact-form-mob ' + href;
            distance = 100;
        }

        slideToMe( href , distance );

        return false;

    });

    jQuery('.tabs-and-content .btn-primary').click(function(e) {
        jQuery('.collapse').css('display', 'none');

        jQuery('.training-systems .btn-primary').each(function(index, el) {
            jQuery(this).removeClass('active');
        });

        href = '#slideToMe';
        distance = 100;

        if(jQuery(window).width() < 768) {
            distance = 0;
        }

        slideToMe( href , distance );

        jQuery(this).addClass('active');
    });

    if(jQuery('.date_ranges').length > 0){
        // jQuery(this).find( "li button" ).each(function(index, el) {
        //     jQuery(this).addClass('cta-inside-contact');
        // });
        jQuery('.cta-inside-contact').each(function(index, el) {
            var setId = el.innerText.toLowerCase().replace(/\ /g, '_');
            jQuery(this).attr('href', '.custom-contact-form');
            jQuery(this).attr('id', setId);
        });
    }

    jQuery("p,h1,h2,h3,h4").each(function(){jQuery(this).html(jQuery(this).html().replace(/&reg;/gi, '<sup>&reg;</sup>').replace(/®/gi, '<sup>&reg;</sup>'));
});

});

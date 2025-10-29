// toastr.options.preventDuplicates = true;
// toastr.options.progressBar = true;
toastr.options.showMethod = 'slideDown';
toastr.options.closeButton = true;
toastr.options.positionClass = 'toast-bottom-right';
jQuery(document).ready(function($) {
  //Init
  dtr_remove_whitespace();
  
  /**
   * ajax form begin
   */
  $(document).on('submit', 'form[data-ajax-form]', async function(e) {
    //Form
    form = $(this);

    //Check if form is valid
    if(form[0].checkValidity() === false) return;
    e.preventDefault();

    // Check if the submit button is valid
    let submit_button = form.find('input[type="submit"]');
    if (submit_button.is(':disabled')) return;

    //Disable the submit button
    submit_button.prop('disabled', true);

    try {
      // Refresh reCAPTCHA token if needed
      if (form.data('recaptcha') == true) {
        await refresh_recaptcha_token();
      }

      // Get the form data
      let formData = form.serialize();
      
      // Add the form action for a WordPress AJAX request
      formData += '&action=' + form.data('ajax-form');

      // Send the AJAX request
      let response = await $.ajax({
        url: dtr_server_obj.ajax_url,
        type: form.attr('method'),
        data: formData,
        dataType: 'json'
      });

      toastr.clear();

      // Check for errors
      if (!response.success) {
        toastr.error(response.data.message);
        if(response.data.redirect_url) {
          setTimeout(function() {
            //Redirect to url
            window.location.href = response.data.redirect_url;
          }, 2000);
        }
        return;
      }
      
      toastr.success(response.data.message);

      // Add custom event to extend functionality
      form.trigger('dtr_form_success', { action: form.data('ajax-form'), response: response });

    } catch (error) {
      // Handle errors
      toastr.clear();
      toastr.error('An error occurred. Please try again.');
      console.log(error);
    } finally {
      // Re-enable the submit button
      submit_button.prop('disabled', false);
    }
  });

  // Add custom event to extend functionality
  $(document).on('dtr_form_success', 'form[data-ajax-form],[data-user-buy-ticket]', function(e, data) {
    switch(data.action) {
      case 'dtr_register':
      case 'dtr_login':
        if(
          $('#ticket-modal:visible').length >= 1 &&
          data.response.success
        ){
          $.ajax({
            url: dtr_server_obj.ajax_url,
            type: 'POST',
            data: {
              action: 'dtr_get_modal_content',
              modal: 'ticket-step-2',
              id: $('#ticket-modal').data('id'),
              dtr_global_ajax_nonce: dtr_server_obj.nonce
            },
            dataType: 'json',
            success: function(response) {
              if(response.success) {
                $('#ticket-modal [data-ajax-response]').html(response.data.content);
                $('#ticket-modal .registration-login').hide();
                $('#ticket-modal [data-ajax-response]').show();
                let current_step = $('#ticket-modal .progress-container .step.current');
                current_step.removeClass('current');
                current_step.next().addClass('current');
                $('header .account').html(`
                  <a href="${dtr_server_obj.site_url}/account">
                    <img src="${dtr_server_obj.stylesheet_directory}/assets/images/icons/account.svg" alt=""> 
                    <span>Account</span>
                  </a>
                `);
              } else {
                console.log(response);
                toastr.error(response.data.message);
              }
            }
          });
        } else if(
          data.response.success &
          typeof data.response.data.redirect_url !== 'undefined'
        ) {
          setTimeout(function() {
            //Redirect to url
            window.location.href = data.response.data.redirect_url;
          }, 500);
        }
      break;
      case 'dtr_user_buy_ticket':
        if(
          $('#ticket-modal:visible').length == 0 ||
          !data.response.success ||
          typeof data.response.data.redirect_url === 'undefined'
        ) return false;

        setTimeout(function() {
          //Redirect to url
          window.location.href = data.response.data.redirect_url;
        }, 2000);
      break;
      case 'dtr_reset_password':
        if(
          !data.response.success ||
          typeof data.response.data.redirect_url === 'undefined'
        ) return false;

        setTimeout(function() {
          //Redirect to url
          window.location.href = data.response.data.redirect_url;
        }, 2000);
      break;
    }
  });
  /**
   * ajax form end
   */

  /**
   * add ticket begin
   */
  $(document).on('click', '[data-user-buy-ticket]', function(e) {
    e.preventDefault();
    $t = $(this);

    // Check if the submit button is valid
    if ($t.is(':disabled')) return;

    //Disable the submit button
    $t.prop('disabled', true);

    $.ajax({
      url: dtr_server_obj.ajax_url,
      type: 'POST',
      data: {
        action: 'dtr_user_buy_ticket',
        id: $(this).data('id'),
        gender: $('[data-gender].active').data('gender'),
        dtr_global_ajax_nonce: dtr_server_obj.nonce
      },
      dataType: 'json',
      success: function(response) {
        toastr.clear();
        $t.prop('disabled', false);
        if(!response.success){
          toastr.error(response.data.message);
          if(response.data.redirect_url) {
            setTimeout(function() {
              //Redirect to url
              window.location.href = response.data.redirect_url;
            }, 2000);
          }
          return;
        }
        toastr.success(response.data.message);
        $t.trigger('dtr_form_success', {action: 'dtr_user_buy_ticket', response: response});
      },
      error: function(xhr, status, error) {
        // Display the error message
        // form.html('<p class="error">An error occurred. Please try again.</p>');
        toastr.clear();
        toastr.error('An error occurred. Please try again.');
        console.log(xhr, status, error);
      }
    })
  });
  /**
   * add ticket end
   */

  /**
   * burger menu begin
   */
  $(document).on('click', '[data-burger-menu]', function(e) {
    e.preventDefault();
    $(this).toggleClass('active');
    $('body').toggleClass('menu-open');
  });
  /**
   * burger menu end
   */
  
  /**
   * copy to clipboard start
   */
  $(document).on('click', '[data-copy-to-clipboard]', function(e) {
    e.preventDefault();
    let $t = $(this);
    var temp_input = document.createElement('textarea');
    temp_input.value = $t.data('copy-to-clipboard');
    document.body.appendChild(temp_input);
    temp_input.select();
    document.execCommand('copy');
    document.body.removeChild(temp_input);
    
    $t.find('span.text').text('Copied');
    setTimeout(function() {
      $t.find('span.text').text('Copy link');
    }, 2000);
  });

  /**
   * content switcher start
   */
  $(document).on('click', '[data-content-switcher]', function(e) {
    e.preventDefault();

    let $t = $(this);
    $('[data-content-switcher]').removeClass('active');
    $t.addClass('active');
    let data = $t.attr('data-content-switcher'); // Get raw attribute value

    try {
      data = JSON.parse(data); // Parse the JSON string into an object
    } catch (error) {
      console.error("Invalid JSON in data-content-switcher:", error);
      return;
    }

    // Hide elements from the "hide" array
    if(typeof data.hide === 'undefined') data.hide = [];
    data.hide.forEach(function(selector) {
      let element = null;
      if(selector.match(/\./)) {
        element = $(selector);
      } else {
        element = $('[data-content-display="' + selector + '"]');
      }
      element.hide();
    });

    // Show elements from the "display" array
    if(typeof data.display === 'undefined') data.display = [];
    data.display.forEach(function(selector) {
      let element = null;
      if(selector.match(/\./)) {
        element = $(selector);
      } else {
        element = $('[data-content-display="' + selector + '"]');
      }
      element.show();
    });

    //Lazy load images
    dtr_lazy_load_images();
  });
  /**
   * content switcher end
   */

  /**
   * Image switcher start
   */
  $(window).on("scroll", function () {
    let scrollY = $(window).scrollTop();

    $("[data-image-switcher]").each(function () {
      let coverOffset = $(this).offset().top;
      let fadeStart = coverOffset - 300;
      let fadeEnd = fadeStart;

      let opacity = 1 - ((scrollY - fadeStart) / (fadeEnd - fadeStart));

      if (scrollY >= fadeStart && scrollY <= fadeEnd) {
        $(this).find(".image-one").css("opacity", opacity);
        $(this).find(".image-two").css("opacity", 1 - opacity);
      } else if (scrollY > fadeEnd) {
        $(this).find(".image-one").css("opacity", 0);
        $(this).find(".image-two").css("opacity", 1);
      } else {
        $(this).find(".image-one").css("opacity", 1);
        $(this).find(".image-two").css("opacity", 0);
      }
    });
  });
  /**
   * Image switcher end
   */

  /**
   * lazy load start
   */
  dtr_lazy_load_images();
  $(window).on('scroll', function() {
    dtr_lazy_load_images();
  });
  /**
   * lazy load end
   */

  /**
   * load from hash begin
   */
  let hash = window.location.hash;
    
  // Match hash pattern: #event_modal_xxx
  let event_modal_match = hash.match(/^#event_modal_(\d+)$/);
  if (event_modal_match) {
    let event_id = event_modal_match[1];
    dtr_modal({
      id: event_id,
      modal: 'event',
    });
  }
  let register_login_match = hash.match(/^#register-login-modal$/);
  if (register_login_match) {
    dtr_modal({
      modal: 'register-login',
    });
  }
  //On hash change
  $(window).on('hashchange', function() {
    let hash = window.location.hash;
    if(hash === '') {
      //Close all modals
      dtr_modal({hide_modal: true});
      return false;
    }
    // Match hash pattern: #event_modal_xxx
    let event_modal_match = hash.match(/^#event_modal_(\d+)$/);
    if (event_modal_match) {
      let event_id = event_modal_match[1];
      //Check if modal is already open
      let event_modal = $('.modal #event-modal[data-id="' + event_id + '"]');
      if (event_modal.length > 0) return false;
      
      dtr_modal({
        id: event_id,
        modal: 'event',
      });
    }
    let register_login_match = hash.match(/^#register-login-modal$/);
    if (register_login_match) {
      //Check if modal is already open
      let register_login_modal = $('.modal #register-login-modal');
      if (register_login_modal.length > 0) return false;

      dtr_modal({
        modal: 'register-login',
      });
    }
  });
  /**
   * load from hash end
   */

  /**
   * modal begin
   */
  let modal_is_scrolling = false;

  $('.modal').on('scroll', function() {
    modal_is_scrolling = true;
  });

  $(document).on('mousedown', '[data-modal]', function() {
    modal_is_scrolling = false;
  });

  $(document).on('click', '[data-modal]', function(e) {
    e.preventDefault();
    if (!modal_is_scrolling) {
      dtr_modal($(this).data());
    }
  });

  $(document).on('click', '.modal', function(e) {
    if(
      $(e.target).hasClass('modal') ||
      $(e.target).hasClass('modal-container')
    ) {
      dtr_modal({hide_modal: true});
    }
  });

  $(document).on('click', '.close-modal', function(e) {
    e.preventDefault();
    dtr_modal({hide_modal: true});
  });
  /**
   * modal end
   */

  /**
   * social sharer start
   */
  $(document).on('click', '[data-toggle-social-share]', function(e) {
    e.preventDefault();

    $('#' + $(this).data('toggle-social-share')).toggleClass('active');
  });
  /**
   * social sharer end
   */

  /**
   * password toggle start
   */
  $(document).on("click", "[data-toggle-password]", function(e) {
    e.preventDefault();
    let password_field = $(this).prev();
    let image = $(this).find('img');
    if(password_field.attr("type") == "password") {
      password_field.attr("type", "text");
      image.attr('src', image.attr('src').replace('closed', 'open'));
    } else {
      password_field.attr("type", "password");
      image.attr('src', image.attr('src').replace('open', 'closed'));
    }
  });
  /**
   * password toggle end
   */
});

//Global functions
function dtr_remove_whitespace() {
  let $ = jQuery;
  $('.description p').each(function() {
    if ($(this).html().trim() === '&nbsp;') {
      $(this).remove();
    }
  });
}
function dtr_lazy_load_images(){
  let $ = jQuery;
  if($('.lazy-load').length > 0) {
    $('.lazy-load').each(function() {
      if(dtr_is_in_viewport($(this))) {
        $(this).addClass('lazy-loaded');
        $(this).attr('src', $(this).attr('data-src'));
      }
    });
  }
}
function dtr_is_in_viewport(element) {
  let $ = jQuery;
  let element_top = element.offset().top;
  let element_bottom = element_top + element.outerHeight();
  let viewport_top = Math.max($(window).scrollTop() - 200, 0);
  let viewport_bottom = viewport_top + $(window).height() + 400; // Increased by 200px above and below
  return element_bottom > viewport_top && element_top < viewport_bottom;
}

async function dtr_get_modal_content(args) {
  return new Promise((resolve, reject) => {
    let $ = jQuery;
    let data = args;

    if (typeof args.modal === 'undefined') return reject('Modal type not set');

    if(args.modal === 'event') {
      return resolve(`<div id="event-modal" class="modal-container" data-id="958">
  <div class="inner">
    <a href="#" class="close-modal">X</a>

    <div class="top-card">
      <div class="top">
        <img src="./assets/images/uploads/2025/03/northern-market-scaled.jpg" alt="Event Image">
        <img src="./assets/images/logo.svg" alt="" class="logo">
      </div>

      <div class="bottom">
        <div class="left">
          <h2>Comedy Night &amp; Singles Social (35-52) - Northern Market Presents All Jokes Aside! 🤩😂</h2>
          <!-- <h4><em>Date to Remember</em></h4> -->
        </div>
        <div class="right">
          <div class="date">Wed, 09 Jul 2025, 6:30pm</div>
          <div class="location">Northern Market, Leeds, LS1 3ED</div>
          <div class="price">Free</div>
        </div>
      </div>
    </div>
    <div class="bottom-card">
            <div class="hosts">
        <h4>Meet your host</h4>
        <div class="host-icons">
                        <div class="host">
                <img src="./assets/images/uploads/2025/02/Laura.webp" alt="Laura">
                <p>Laura</p>
                              </div>
                      </div>
      </div>
            <div class="description">
        <p>🎤 <strong>All Jokes Aside Comedy Night &amp; Social</strong> 🎤</p>
<p>Get ready for an evening of laughter, good company, and new connections at Northern Market, Leeds! Join us on Wednesday, 9th July for a fantastic Comedy Night &amp; Social with the hilarious All Jokes Aside Comedy Group.</p>
<p>Before the show, enjoy a relaxed pre-event social, the perfect chance to meet like-minded people in a friendly and fun atmosphere. Then, sit back and enjoy a night of fantastic comedy that’s guaranteed to have you in stitches!</p>
<p>📅 <strong>Date:</strong> 9th July<br>
🕡 <strong>Time:</strong> 6:30 PM – 10:30 PM<br>
📍 <strong>Venue:</strong> Northern Market, Leeds<br>
👤 <strong>Age Guide:</strong> 35-52 (This is an age guide – if you are just outside this bracket please email us)<br>
🎟️ <strong>Tickets:</strong> Free, booking is required—spaces are limited!<br>
🍻 <strong>Pre-event social</strong> – meet &amp; mingle before the comedy kicks off<br>
😂 <strong>Live stand-up</strong> – comedians from the All Jokes Aside group<br>
🎭 <strong>Great atmosphere</strong> – a night of fun, laughter &amp; socializing</p>
<p>Come solo (as most of our attendees do) or bring a friend 🤗- either way, it’s set to be an unforgettable night of comedy and connections!</p>
<p><strong>Secure your spot now and get ready to laugh the night away!</strong> 🎭🤣🍻</p>
      </div>
            <p style="text-align: center;margin-top: 20px;color: grey;">Ticket system not available in demo</p>
          </div>
  </div>
</div>`);
    } else if(args.modal === 'register-login') {
      return resolve(`<div id="register-login-modal" class="modal-container">
  <div class="inner">
    <a href="#" class="close-modal">X</a>

    <div class="logo">
      <img src="./assets/images/logo.svg" alt="DTR Logo">
    </div>
    
    <div class="registration-login-step" data-content-display="account-step-1">
      <div class="registration-intro">
        <h3>Join our <em>exclusive</em> community 🥰</h3>
        <button class="button" data-content-switcher="{&quot;display&quot;:[&quot;account-step-2&quot;, &quot;account-step-register&quot;], &quot;hide&quot;:[&quot;account-step-1&quot;, &quot;account-step-login&quot;]}">Create Account</button>
      </div>

      <div class="login-intro">
        <h3>I've already got an account 🥳</h3>
        <button class="button style-2" data-content-switcher="{&quot;display&quot;:[&quot;account-step-2&quot;, &quot;account-step-login&quot;], &quot;hide&quot;:[&quot;account-step-1&quot;, &quot;account-step-register&quot;]}"><span>Log in</span></button>
        <div class="bottom-gradient"></div>
      </div>
    </div>

    <div class="registration-login-step" data-content-display="account-step-2" style="display: none;">
      <div class="registration-intro">
        <h3>Create/Login to Account</h3>
        <p style="text-align: center;margin-bottom: 20px;color: grey;">Not available in demo</p>
      </div>
    </div>
    `);
    }
  });
}

function dtr_modal(args) {
  let $ = jQuery;
  
  if(typeof args !== 'undefined' && args.hide_modal) {
    $('body').removeClass('modal-visible');
    setTimeout(function() {
      $('#modal-content-ajax').html('');
    }, 650);
  } else {
    $('body').addClass('modal-visible');
    //Show loader
    $('.modal #modal-loader').show();
    $('#modal-content-ajax').hide();
  }

  setTimeout(function() {
    if (typeof args !== 'undefined' && args.modal) {
      dtr_get_modal_content(args).then(function(response) {
        $('.modal #modal-loader').hide();
        $('#modal-content-ajax').show();
        $('#modal-content-ajax').html(response);
        dtr_remove_whitespace();
      }).catch(function(response) {
        $('.modal #modal-loader').hide();
        $('#modal-content-ajax').show();
        $('#modal-content-ajax').html('<div class="error">Failed to load modal content.</div>');
        console.error(response);
      });
    }
  }, 500);

  if (!$('body').hasClass('modal-visible')) return false;
  $('.modal').animate({ scrollTop: 0 }, 'fast');
}

async function refresh_recaptcha_token(callback) {
  return new Promise(resolve => {
    grecaptcha.ready(() => {
      grecaptcha.execute(dtr_server_obj.recaptcha_site_key, { action: 'submit' }).then(token => {
        jQuery('input[name="g-recaptcha-response"]').val(token);
        resolve();
      });
    });
  });
}
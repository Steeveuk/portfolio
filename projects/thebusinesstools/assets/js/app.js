// toastr.options.preventDuplicates = true;
// toastr.options.progressBar = true;
toastr.options.showMethod = 'slideDown';
toastr.options.closeButton = true;
toastr.options.positionClass = 'toast-bottom-right';
jQuery(document).ready(function($) {
  /**
   * ajax form begin
   */
  $(document).on('submit', 'form[data-ajax-form]', async function(e) {
    form = $(this);
    if(form[0].checkValidity() === false) return;
    e.preventDefault();
    let submit_button = form.find('input[type="submit"],button[type="submit"]');
    if (submit_button.is(':disabled')) return;
    submit_button.prop('disabled', true);
    toastr.clear();
    // Dummy success message
    toastr.success('Form submitted successfully (dummy submission, functionality may not work as intended)');
    // Add custom event to extend functionality
    form.trigger('bizt_form_success', { action: form.data('ajax-form'), response: { success: true, data: { message: 'Dummy response', image: 'http://www.steeve.co.uk' } } });
    submit_button.prop('disabled', false);
  });

  // Add custom event to extend functionality
  $(document).on('bizt_form_success', 'form[data-ajax-form]', function(e, data) {
    switch(data.action) {
      case 'bizt_qrcode':
        $('#qr-code-image').fadeIn();
        $('[data-download-qr-code]').show();
      break;
    }
  });
  /**
   * ajax form end
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
    bizt_lazy_load_images();
  });
  /**
   * content switcher end
   */

  /**
   * lazy load start
   */
  bizt_lazy_load_images();
  $(window).on('scroll', function() {
    bizt_lazy_load_images();
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
    bizt_modal({
      id: event_id,
      modal: 'event',
    });
  }
  let register_login_match = hash.match(/^#register-login-modal$/);
  if (register_login_match) {
    bizt_modal({
      modal: 'register-login',
    });
  }
  //On hash change
  $(window).on('hashchange', function() {
    let hash = window.location.hash;
    if(hash === '') {
      //Close all modals
      bizt_modal({hide_modal: true});
      return false;
    }
    // Match hash pattern: #event_modal_xxx
    let event_modal_match = hash.match(/^#event_modal_(\d+)$/);
    if (event_modal_match) {
      let event_id = event_modal_match[1];
      //Check if modal is already open
      let event_modal = $('.modal #event-modal[data-id="' + event_id + '"]');
      if (event_modal.length > 0) return false;
      
      bizt_modal({
        id: event_id,
        modal: 'event',
      });
    }
    let register_login_match = hash.match(/^#register-login-modal$/);
    if (register_login_match) {
      //Check if modal is already open
      let register_login_modal = $('.modal #register-login-modal');
      if (register_login_modal.length > 0) return false;

      bizt_modal({
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
      bizt_modal($(this).data());
    }
  });

  $(document).on('click', '.modal', function(e) {
    if(
      $(e.target).hasClass('modal') ||
      $(e.target).hasClass('modal-container')
    ) {
      bizt_modal({hide_modal: true});
    }
  });

  $(document).on('click', '.close-modal', function(e) {
    e.preventDefault();
    bizt_modal({hide_modal: true});
  });
  /**
   * modal end
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

  $('body').on('click', '[data-download-qr-code]', function(e) {
    e.preventDefault();
    var img_src = $('#qr-code-image').attr('src');
    var link = document.createElement('a');
    link.href = img_src;
    link.download = 'qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  $('body').on('click', '.accordion-content a', function(e) {
    e.preventDefault();

    //Remove the active class from all tabs
    $('.accordion-content a').removeClass('active');
    
    //Toggle the active class
    $(this).toggleClass('active');
    
    //Hide the other tabs
    $('.accordion-content div').not($($(this).attr('href'))).slideUp();
    
    //Show the tab content
    $($(this).attr('href')).slideDown();
  });

  $('body').on('click', '.tool-card', function(e) {
    e.preventDefault();

    var target = $(this).attr('href');

    // Hide all tool sections
    $('.sec').not('#landing').hide();

    // Show the target section
    $(target).fadeIn(300);

    // Scroll smoothly to the target
    $('html, body').animate({
      scrollTop: $(target).offset().top - 80
    }, 600);
  });

  // Brand Name Generator logic
  $(document).on('submit', '.brand-name-form', function(e) {
    e.preventDefault();
    const form = $(this);
    const keywordsInput = form.find('#brand-name-keywords');
    const resultContainer = form.find('#brand-name-result');
    const resultsSection = form.find('#brand-name-results');
    const loadingSection = form.find('#brand-name-loading');
    const errorSection = form.find('#brand-name-error');

    // Hide all sections initially
    resultsSection.hide();
    loadingSection.hide();
    errorSection.hide();

    const keywords = keywordsInput.val().trim();
    if (!keywords) {
      errorSection.show();
      resultContainer.text('Please enter some keywords.');
      return;
    }

    loadingSection.show();
    // Simulate async brand name generation
    setTimeout(function() {
      loadingSection.hide();
      // Generate a brand name
      try {
        const brandName = generateBrandName(keywords);
        resultContainer.text(brandName);
        resultsSection.show();
      } catch (err) {
        errorSection.show();
        resultContainer.text('Error generating brand name. Please try again.');
      }
    }, 800);
  });

  // Brand name generator function
  function generateBrandName(keywords) {
    // Split keywords, trim, and filter empty
    const words = keywords.split(',').map(w => w.trim()).filter(Boolean);
    if (words.length === 0) throw new Error('No keywords');
    // Some fun suffixes/prefixes
    const prefixes = ['Super', 'Ultra', 'Go', 'Pro', 'Eco', 'Smart', 'Bright', 'Next', 'True', 'Prime', 'Blue', 'Green', 'Red', 'Quick', 'Easy', 'Fresh'];
    const suffixes = ['ly', 'ify', 'ster', 'genix', 'scape', 'verse', 'works', 'hub', 'zone', 'matic', 'io', 'ify', 'gen', 'ology', 'space', 'lab', 'nest', 'loop', 'core', 'pulse'];
    // Pick a random keyword
    const main = words[Math.floor(Math.random() * words.length)];
    // Optionally add a prefix or suffix, but always at least one
    let brand = main.charAt(0).toUpperCase() + main.slice(1);
    let addPrefix = Math.random() > 0.5;
    let addSuffix = Math.random() > 0.5;
    // Ensure at least one is true
    if (!addPrefix && !addSuffix) {
      if (Math.random() > 0.5) {
        addPrefix = true;
      } else {
        addSuffix = true;
      }
    }
    if (addPrefix) {
      brand = prefixes[Math.floor(Math.random() * prefixes.length)] + brand;
    }
    if (addSuffix) {
      brand = brand + suffixes[Math.floor(Math.random() * suffixes.length)];
    }
    return brand;
  }

  // Brand Colour Picker logic (brand palette version)
  function hexToHSL(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
    const r = parseInt(hex.substring(0,2), 16) / 255;
    const g = parseInt(hex.substring(2,4), 16) / 255;
    const b = parseInt(hex.substring(4,6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if(max === min){ h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max){
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
  }
  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = l - c/2;
    let r=0, g=0, b=0;
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return "#" + [r,g,b].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  function getBrandPalette(hex) {
    const base = hexToHSL(hex);
    // Primary: base
    // Secondary: hue +40
    // Tertiary: hue -40
    // Accent: same hue, higher sat or lighter
    // Neutral: same hue, low sat, mid lightness
    return [
      { name: 'Primary', hex: hex },
      { name: 'Secondary', hex: hslToHex((base.h+40)%360, base.s, base.l) },
      { name: 'Tertiary', hex: hslToHex((base.h+320)%360, base.s, base.l) },
      { name: 'Accent', hex: hslToHex(base.h, Math.min(100, base.s+30), Math.min(95, base.l+15)) },
      { name: 'Neutral', hex: hslToHex(base.h, 10, 60) }
    ];
  }
  function renderBrandPalette(hex) {
    const palette = getBrandPalette(hex);
    let html = '<div style="display: flex; flex-wrap: wrap; gap: 16px; margin-top: 16px; justify-content: center;">';
    palette.forEach(h => {
      html += `<div style="text-align:center;">
        <div style="width:48px;height:48px;border-radius:8px;background:${h.hex};border:1px solid #ccc;margin:auto;"></div>
        <div style="font-size:0.9em;margin-top:4px;">${h.name}</div>
        <div style="font-family:monospace;font-size:0.95em;">${h.hex}</div>
      </div>`;
    });
    html += '</div>';
    $('#colour-harmonies').html(html);
  }
  $(document).on('input change', '#main-colour-input', function() {
    const hex = $(this).val();
    $('#main-colour-hex').text(hex);
    renderBrandPalette(hex);
  });
  // On page load, render for default
  if ($('#main-colour-input').length) {
    renderBrandPalette($('#main-colour-input').val());
  }
});

//Global functions
function bizt_lazy_load_images(){
  let $ = jQuery;
  if($('.lazy-load').length > 0) {
    $('.lazy-load').each(function() {
      if(bizt_is_in_viewport($(this))) {
        $(this).addClass('lazy-loaded');
        $(this).attr('src', $(this).attr('data-src'));
      }
    });
  }
}
function bizt_is_in_viewport(element) {
  let $ = jQuery;
  let element_top = element.offset().top;
  let element_bottom = element_top + element.outerHeight();
  let viewport_top = Math.max($(window).scrollTop() - 200, 0);
  let viewport_bottom = viewport_top + $(window).height() + 400; // Increased by 200px above and below
  return element_bottom > viewport_top && element_top < viewport_bottom;
}

// Replace bizt_get_modal_content with dummy content
async function bizt_get_modal_content(args) {
  return new Promise((resolve) => {
    resolve({ success: true, data: { content: '<div>Dummy modal content</div>' } });
  });
}

function bizt_modal(args) {
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
      bizt_get_modal_content(args).then(function(response) {
        $('.modal #modal-loader').hide();
        $('#modal-content-ajax').show();
        $('#modal-content-ajax').html(response.data.content);
      }).catch(function(response) {
        $('.modal #modal-loader').hide();
        $('#modal-content-ajax').show();
        $('#modal-content-ajax').html(response.data.content);
        console.error(response.data.message);
      });
    }
  }, 500);

  if (!$('body').hasClass('modal-visible')) return false;
  $('.modal').animate({ scrollTop: 0 }, 'fast');
}

async function refresh_recaptcha_token(callback) {
  return new Promise(resolve => {
    grecaptcha.ready(() => {
      grecaptcha.execute(bizt_server_obj.recaptcha_site_key, { action: 'submit' }).then(token => {
        jQuery('input[name="g-recaptcha-response"]').val(token);
        resolve();
      });
    });
  });
}

function expand_card(el) {
  el.classList.add('expanded');
}

function close_card(event, btn) {
  event.stopPropagation(); // Prevent closing when clicking inside form
  const card = btn.closest('.card');
  card.classList.remove('expanded');
}
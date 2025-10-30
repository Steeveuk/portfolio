// Checking out my code, eh?
// Good on you :)!
// I would too if I was thinking about hiring someone.

//!!! jQuery Init
jQuery(document).ready(function ($) {
  //Init
  AOS.init();
  run_code_block_animation($("#code-segment-1"));
  run_code_block_animation($("#code-segment-2"));
  setup_hover_effects();
  setup_click_events();
  setup_scroll_spy();
  setup_modal_events();
  setup_iframe_source();
  setup_video_autoplay();
  setup_email_form();
});

//!!! Functions
function wrap_output_chars($container) {
  const $output = $container.find("[data-segment-output]");
  const text = $output.text();
  const wrapped = text
    .split("")
    .map((c) => (c === " " ? "&nbsp;" : c))
    .map((c) => `<span class="animated-char">${c}</span>`)
    .join("");
  $output.html(wrapped);
}

function open_modal(modal_id) {
  $(`${modal_id}, #modalOverlay`).addClass("active");
  scroll_to_element($(`${modal_id}`), -60, 600);
}

function close_modal() {
  $(".modal.active, #modalOverlay").removeClass("active");
  scroll_to_element($("#more-projects"), -60, 600);
}

function run_code_block_animation($container) {
  // On mobile, calculate and set the required height to avoid scrolling
  if (window.innerWidth < 500) {
    // Find the actual .code-box element
    const $codeBox = $container.find(".code-box");

    // Temporarily remove height constraints to measure natural content height
    $codeBox.css({
      height: "auto",
      overflow: "visible",
    });

    // Get the scrollHeight which includes all content
    const requiredHeight = $codeBox[0].scrollHeight;

    // Set the calculated height
    $codeBox.css({
      height: requiredHeight + "px",
      overflow: "visible",
    });
  }

  const $codeDisplay = $container.find(".code-content");
  const $outputText = $container.find("[data-segment-output]");
  const codeLines = $codeDisplay.html().split("\n");

  const fullHtml = codeLines.join("\n");
  const temp = $("<div>").html(fullHtml);
  const nodes = temp.contents();

  let nodeIndex = 0;
  let charIndex = 0;
  let currentSpan = null;

  $codeDisplay.empty();
  $outputText.css("opacity", 0);

  function type_next_char() {
    if (nodeIndex >= nodes.length) {
      $outputText.css("opacity", 1);
      wrap_output_chars($container);

      anime({
        targets: $container.find(".animated-char").toArray(),
        translateY: [
          { value: -30, duration: 300, easing: "easeOutQuad" },
          { value: 0, duration: 800, easing: "easeOutBounce" },
        ],
        rotate: [{ value: "360deg", duration: 900, easing: "linear" }],
        delay: anime.stagger(50),
        complete: () => {
          setTimeout(() => {
            $codeDisplay.fadeOut(800);
            $outputText.fadeOut(800, () => {
              $codeDisplay.show();
              $outputText.show();
              run_code_block_animation($container);
            });
          }, 3000);
        },
      });

      return;
    }

    const node = nodes[nodeIndex];

    if (node.nodeType === 3) {
      const text = node.nodeValue;
      if (charIndex < text.length) {
        $codeDisplay.append(document.createTextNode(text[charIndex++]));
        setTimeout(type_next_char, 20);
      } else {
        nodeIndex++;
        charIndex = 0;
        setTimeout(type_next_char, 20);
      }
    } else if (node.nodeType === 1) {
      if (!currentSpan) {
        currentSpan = $("<" + node.nodeName.toLowerCase() + ">").addClass(
          $(node).attr("class")
        );
        $codeDisplay.append(currentSpan);
      }
      const text = node.textContent;
      if (charIndex < text.length) {
        currentSpan.append(document.createTextNode(text[charIndex++]));
        setTimeout(type_next_char, 20);
      } else {
        nodeIndex++;
        charIndex = 0;
        currentSpan = null;
        setTimeout(type_next_char, 20);
      }
    }
  }

  type_next_char();
}

function scroll_to_element($el, offset = 0, duration = 600) {
  if (!$el || !$el.length) return;

  // Add class to disable AOS animation styles temporarily
  $el.addClass("aos-disable-animation");

  // Calculate position of fully visible element
  const target_position = $el.offset().top + offset;

  // Remove the disabling class to let AOS animate normally again
  $el.removeClass("aos-disable-animation");

  // Refresh AOS so it can detect element visibility and animate
  AOS.refresh();

  // Scroll there smoothly
  $("html, body").animate({ scrollTop: target_position }, duration);
}

function setup_scroll_spy() {
  const $nav_links = $("nav a[data-scroll-to]");
  const offset_tolerance = 100; // Adjust if you want the active to change earlier/later

  function on_scroll() {
    const scroll_pos = $(window).scrollTop();

    let current_section_id = null;

    // Loop through each linked section to find the current one in view
    $nav_links.each(function () {
      const target_id = $(this).data("scroll-to");
      const $target = $(target_id);

      if ($target.length) {
        const top = $target.offset().top - offset_tolerance;
        const bottom = top + $target.outerHeight();

        if (scroll_pos >= top && scroll_pos < bottom) {
          current_section_id = target_id;
          return false; // break the each loop
        }
      }
    });

    // Update active class
    if (current_section_id) {
      $nav_links.removeClass("active");
      $nav_links
        .filter(`[data-scroll-to="${current_section_id}"]`)
        .addClass("active");
    }
  }

  // Initial check on page load
  on_scroll();

  // Attach scroll handler
  $(window).on("scroll", on_scroll);
}

function setup_click_events() {
  $("body").on("click", "[data-scroll-to]", function (e) {
    e.preventDefault();
    const targetElement = document.querySelector(
      $(this).attr("data-scroll-to")
    );
    //Check if section position exists
    scroll_to_element($(targetElement), -70, 600);
  });
}

function setup_hover_effects() {
  const hoverArea = document.getElementById("hover-area");
  const hoverEffect = document.getElementById("hover-effect");

  hoverArea.addEventListener("mousemove", (e) => {
    const rect = hoverArea.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    hoverEffect.style.setProperty("--x", `${x}%`);
    hoverEffect.style.setProperty("--y", `${y}%`);
  });
}

function setup_video_autoplay() {
  $(".project").hover(
    function () {
      const video = $(this).find("video")[0];
      if (video && video.src && video.src.trim() !== "") {
        // Optionally, check if the video can be played
        const canPlay = video.canPlayType && video.canPlayType("video/mp4");
        if (canPlay) {
          video.play().catch(() => {}); // Ignore play errors
        }
      }
    },
    function () {
      const video = $(this).find("video")[0];
      if (video && video.src && video.src.trim() !== "") {
        video.pause();
      }
    }
  );
}

function setup_iframe_source() {
  // Check if iframe is in viewport AND its parent modal/container is visible
  const $iframes = $("iframe[data-src]");

  if ($iframes.length === 0) return;

  const iframeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const $iframe = $(entry.target);

          // Check if the iframe's parent modal/container is visible
          const $parentModal = $iframe.closest(
            ".modal, [data-modal], .popup, .dialog"
          );
          const isParentVisible =
            !$parentModal.length || $parentModal.is(":visible");

          if (
            isParentVisible &&
            $iframe.css("display") !== "none" &&
            $iframe.css("visibility") !== "hidden"
          ) {
            setTimeout(() => {
              $iframe.attr("src", $iframe.attr("data-src"));
              $iframe.removeAttr("data-src");
              iframeObserver.unobserve(entry.target); // Stop observing once loaded
            }, 200);
          }
        }
      });
    },
    {
      rootMargin: "0px", // Only load when actually in viewport (no preload for modals)
    }
  );

  $iframes.each(function () {
    iframeObserver.observe(this);
  });
}

function setup_modal_events() {
  let $ = jQuery;
  $("body").on("click", "[data-modal]", function (e) {
    e.preventDefault();
    open_modal($(this).attr("data-modal"));
  });
  $("#closeBtn, #modalOverlay").on("click", close_modal);
}

function setup_ajax_form() {
  $("form[data-ajax-form]").on("submit", function (e) {
    $t = $(this);
    e.preventDefault();

    // Get the submit button
    const $submitBtn = $t.find('button[type="submit"]');
    const originalText = $submitBtn.text();

    // Show loading state
    $submitBtn.prop("disabled", true).text("Sending...").addClass("loading");

    // Clear any previous messages
    $t.find(".ajax-response").html("");

    const formData = $(this).serialize();

    $.ajax({
      url: $t.attr("action"),
      type: $t.attr("method"),
      data: formData,
      dataType: "json",
      success: function (response) {
        console.log(response);
        if (response.success) {
          $t.find(".ajax-response").html(
            '<div class="success">' + response.message + "</div>"
          );
          // Clear the form on success
          $t.find("input, select, textarea").val("");
          // Change button to success state temporarily
          $submitBtn
            .text("Message Sent!")
            .removeClass("loading")
            .addClass("success");

          // Reset button after 3 seconds
          setTimeout(() => {
            $submitBtn
              .prop("disabled", false)
              .text(originalText)
              .removeClass("success");
          }, 3000);
        } else {
          $t.find(".ajax-response").html(
            '<div class="error">' + response.errors.join("<br>") + "</div>"
          );
          // Reset button immediately on error
          $submitBtn
            .prop("disabled", false)
            .text(originalText)
            .removeClass("loading");
        }
      },
      error: function (xhr, status, error) {
        console.error(xhr.responseText);

        // Show error message
        $t.find(".ajax-response").html(
          '<div class="error">An error occurred while sending your message. Please try again.</div>'
        );

        // Reset button on error
        $submitBtn
          .prop("disabled", false)
          .text(originalText)
          .removeClass("loading");
      },
    });
  });
}

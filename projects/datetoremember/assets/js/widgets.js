jQuery(document).ready(function($) {
  /**
   * carousel-slider begin
   */
  $('[data-carousel-slider]').each(function(){
    $(this).slick({
      infinite: true,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      dots: true,
      autoplay: true,
      autoplaySpeed: 3000,
      speed: 1000,
    }).on('afterChange', function(event, slick, currentSlide, nextSlide) {
      dtr_lazy_load_images();
    });
  });
  /**
   * carousel-slider end
   */
  
  /**
   * countdown-clock begin
   */
  $('.widget.countdown-clock').each(function() {
    //Init
    let $t = $(this);
    setInterval(update_countdown, 1000);
    update_countdown();

    //Functions
    function update_countdown() {
      $t.find('.countdown').each(function () {
        var $this = $(this);
        // Set end date to 7 days from today
        var today = new Date();
        var end_date = new Date(today.getTime() + (7 * 23 * 60 * 59 * 1000)).getTime();
        var now = get_london_timestamp();
        var time_left = end_date - now;

        if (time_left < 0) {
          $this.find('.value').text('00');
          return;
        }

        var days = Math.floor(time_left / (1000 * 60 * 60 * 24));
        var hours = Math.floor((time_left % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((time_left % (1000 * 60 * 60)) / (1000 * 60));

        $this.find('.days .value').text(days.toString().padStart(2, '0'));
        $this.find('.hours .value').text(hours.toString().padStart(2, '0'));
        $this.find('.minutes .value').text(minutes.toString().padStart(2, '0'));
      });
    }

    function get_london_timestamp() {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).formatToParts(new Date());

      let date_parts = {};
      for (const part of parts) {
        if (part.type !== 'literal') date_parts[part.type] = part.value;
      }

      return new Date(
        `${date_parts.year}-${date_parts.month}-${date_parts.day}T${date_parts.hour}:${date_parts.minute}:${date_parts.second}`
      ).getTime();
    }

  });
  /**
   * countdown-clock end
   */

  /**
   * scrolling-ticker begin
   */
  $('.widget.scrolling-ticker').each(function() {
    // Init
    let ticker = $(this).find('.ticker-container');
    let itemWidth = $(this).find('.ticker-item').outerWidth(true);
    let moveSpeed = $(this).data('speed');
    let isPaused = false;
    let remainingMove = itemWidth;

    ticker.css('left', '0');
    moveTicker();

    $(this).find('.ticker-viewport').hover(
        function() {
          isPaused = true;
          ticker.stop();
          var currentLeft = parseInt(ticker.css('left'), 10);
          remainingMove = itemWidth + currentLeft;
        },
        function() {
          isPaused = false;
          moveTicker(remainingMove);
        }
    );

    // Functions
    function moveTicker(distance = itemWidth) {
      ticker.animate({ left: '-=' + distance }, moveSpeed * (distance / itemWidth), 'linear', function() {
        ticker.append($(this).find('.ticker-item:first'));
        ticker.css('left', '0');
        if (!isPaused) moveTicker();
      });
    }
  });
  /**
   * scrolling-ticker end
   */
});
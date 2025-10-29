jQuery(document).ready(function($) {
  /**
   * component-name begin
   */
  //Events
  $('.component.card.accordion').on('click', '.tab button', function() {
    let accordion_component = $(this).closest('.component.card.accordion');
    let accordion_tab = $(this).closest('.tab');

    //Updated classes
    accordion_component.find('button.button-dtr-active-style').removeClass('button-dtr-active-style');
    accordion_component.find('.tab').removeClass('active');
    accordion_tab.addClass('active');
    $(this).addClass('button-dtr-active-style')

    //Check if tab is already open
    if(accordion_tab.find('.content').is(':visible')) return;

    //Close other tabs
    accordion_component.find('.tab .content').slideUp('slow', function() {
      //Open current tab
      accordion_tab.find('.content').slideDown();
    });
  });

  //Open the first tab for each accordion
  $('.component.card.accordion').each(function() {
    $(this).find('.tab button').first().trigger('click');
  });
  /**
   * component-name end
   */
});
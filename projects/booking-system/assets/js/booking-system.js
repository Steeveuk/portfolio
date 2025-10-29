// booking-system.js

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('booking-form');
  const booking_list = document.getElementById('booking-list');
  const success_message = document.getElementById('success-message');
  const calendar_output = document.getElementById('calendar-output');
  const calendar_div = document.getElementById('calendar');
  const time_picker_div = document.createElement('div');
  time_picker_div.id = 'time-picker';
  time_picker_div.className = 'time-picker';
  // Insert time picker after calendar
  calendar_div.parentNode.insertBefore(time_picker_div, calendar_div.nextSibling);
  let selected_date = null;
  let selected_time = '';
  const today = new Date();
  today.setHours(0,0,0,0);

  // --- Custom Calendar ---
  function render_calendar(month, year) {
    calendar_div.innerHTML = '';
    const calendar_header = document.createElement('div');
    calendar_header.className = 'calendar-header';
    calendar_header.style.display = 'flex';
    calendar_header.style.alignItems = 'center';
    calendar_header.style.justifyContent = 'center';
    calendar_header.style.marginBottom = '10px';

    // Previous month button
    const prev_btn = document.createElement('button');
    prev_btn.textContent = '<';
    prev_btn.className = 'calendar-nav';
    prev_btn.onclick = () => {
      calendar_month--;
      if (calendar_month < 0) {
        calendar_month = 11;
        calendar_year--;
      }
      render_calendar(calendar_month, calendar_year);
    };

    // Next month button
    const next_btn = document.createElement('button');
    next_btn.textContent = '>';
    next_btn.className = 'calendar-nav';
    next_btn.onclick = () => {
      calendar_month++;
      if (calendar_month > 11) {
        calendar_month = 0;
        calendar_year++;
      }
      render_calendar(calendar_month, calendar_year);
    };

    // Month dropdown (styled to match header)
    const month_select = document.createElement('select');
    month_select.className = 'calendar-month-select';
    month_select.style.fontWeight = '700';
    month_select.style.fontSize = '1.1rem';
    month_select.style.letterSpacing = '0.5px';
    const month_names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    month_names.forEach((name, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = name;
      if (idx === month) opt.selected = true;
      month_select.appendChild(opt);
    });
    month_select.addEventListener('change', function() {
      calendar_month = parseInt(this.value, 10);
      render_calendar(calendar_month, calendar_year);
    });

    // Year dropdown (styled to match header)
    const year_select = document.createElement('select');
    year_select.className = 'calendar-year-select';
    year_select.style.fontWeight = '700';
    year_select.style.fontSize = '1.1rem';
    year_select.style.letterSpacing = '0.5px';
    const current_year = new Date().getFullYear();
    for (let y = current_year; y <= current_year + 5; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === year) opt.selected = true;
      year_select.appendChild(opt);
    }
    year_select.addEventListener('change', function() {
      calendar_year = parseInt(this.value, 10);
      render_calendar(calendar_month, calendar_year);
    });

    // Center the dropdowns between the nav buttons
    calendar_header.appendChild(prev_btn);
    calendar_header.appendChild(month_select);
    calendar_header.appendChild(year_select);
    calendar_header.appendChild(next_btn);
    calendar_div.appendChild(calendar_header);

    const days_row = document.createElement('div');
    days_row.className = 'calendar-days-row';
    // Start week on Monday
    ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d => {
      const day = document.createElement('span');
      day.className = 'calendar-day-label';
      day.textContent = d;
      days_row.appendChild(day);
    });
    calendar_div.appendChild(days_row);

    // Calculate first day index (Monday=0, Sunday=6)
    let js_first_day = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon, ...
    let first_day = (js_first_day + 6) % 7; // 0=Mon, 6=Sun
    const days_in_month = new Date(year, month+1, 0).getDate();
    const calendar_grid = document.createElement('div');
    calendar_grid.className = 'calendar-grid';
    for(let i=0; i<first_day; i++) {
      const empty = document.createElement('span');
      empty.className = 'calendar-cell empty';
      calendar_grid.appendChild(empty);
    }
    for(let d=1; d<=days_in_month; d++) {
      const cell = document.createElement('span');
      cell.className = 'calendar-cell';
      const cell_date = new Date(year, month, d);
      cell.textContent = d;
      cell.tabIndex = 0;
      const admin_settings = get_admin_settings();
      const is_allowed_day = admin_settings.days.includes(cell_date.getDay());
      if(cell_date < today || !is_allowed_day) {
        cell.classList.add('disabled');
      } else {
        cell.onclick = () => select_date(cell_date);
        cell.onkeydown = (e) => { if(e.key==='Enter') select_date(cell_date); };
      }
      if(selected_date && cell_date.getTime() === selected_date.getTime()) {
        cell.classList.add('selected');
      }
      calendar_grid.appendChild(cell);
    }
    calendar_div.appendChild(calendar_grid);
  }
  function calendar_month_name(m) {
    return new Date(2000, m, 1).toLocaleString(undefined, {month:'long'});
  }
  let calendar_month = today.getMonth();
  let calendar_year = today.getFullYear();
  function change_month(delta) {
    calendar_month += delta;
    if(calendar_month < 0) { calendar_month = 11; calendar_year--; }
    if(calendar_month > 11) { calendar_month = 0; calendar_year++; }
    render_calendar(calendar_month, calendar_year);
  }
  function select_date(date) {
    selected_date = new Date(date.getTime());
    render_calendar(calendar_month, calendar_year);
    render_time_picker();
    update_calendar_output();
    set_min_time();
  }
  render_calendar(calendar_month, calendar_year);

  // --- Time logic ---
  function set_min_time() {
    // No need to restrict slots here; handled in render_time_picker
    update_calendar_output();
  }
  function is_today(date) {
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  }

  // --- Time Picker ---
  function render_time_picker() {
    time_picker_div.innerHTML = '';
    if (!selected_date) return;
    const now = new Date();
    let slots = [];
    let min_time = 0;
    const admin_settings = get_admin_settings();
    let start_hour = parseInt(admin_settings.start.split(':')[0], 10);
    let end_hour = parseInt(admin_settings.end.split(':')[0], 10);
    let start_min = parseInt(admin_settings.start.split(':')[1], 10);
    let end_min = parseInt(admin_settings.end.split(':')[1], 10);
    const interval = admin_settings.interval || 30;
    let start_total = start_hour * 60 + start_min;
    let end_total = end_hour * 60 + end_min;
    let now_total = now.getHours() * 60 + now.getMinutes();
    for (let t = start_total; t <= end_total; t += interval) {
      if (is_today(selected_date) && t < now_total) continue;
      let h = Math.floor(t / 60);
      let m = t % 60;
      let label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push(label);
    }
    if (slots.length === 0) {
      time_picker_div.innerHTML = '<span class="no-slots">No time slots left today</span>';
      selected_time = '';
      update_calendar_output();
      return;
    }
    slots.forEach(slot => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'time-slot-btn';
      btn.textContent = slot;
      if (slot === selected_time) btn.classList.add('selected');
      btn.onclick = () => {
        selected_time = slot;
        render_time_picker();
        update_calendar_output();
      };
      time_picker_div.appendChild(btn);
    });
  }

  // Update time picker when date changes
  function select_date(date) {
    selected_date = new Date(date.getTime());
    render_calendar(calendar_month, calendar_year);
    render_time_picker();
    update_calendar_output();
    set_min_time();
  }
  // Update time picker when today changes
  setInterval(() => {
    if (selected_date && is_today(selected_date)) render_time_picker();
  }, 60000);

  // --- Calendar output ---
  function update_calendar_output() {
    let text = '';
    if (selected_date && selected_time) {
      const date_str = selected_date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      text = `Selected: <strong>${date_str}</strong> at <strong>${selected_time}</strong>`;
    } else if (selected_date) {
      const date_str = selected_date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      text = `Selected: <strong>${date_str}</strong>`;
    } else {
      text = '';
    }
    calendar_output.innerHTML = text;
    if (text) {
      calendar_output.classList.add('visible');
    } else {
      calendar_output.classList.remove('visible');
    }
  }

  // Add error message element
  const error_div = document.createElement('div');
  error_div.id = 'calendar-error';
  error_div.className = 'calendar-error';
  error_div.style.display = 'none';
  calendar_div.parentNode.insertAdjacentElement('afterend', error_div);

  function show_error(msg) {
    error_div.textContent = msg;
    error_div.style.display = 'block';
  }
  function hide_error() {
    error_div.textContent = '';
    error_div.style.display = 'none';
  }

  // --- Booking logic ---
  function get_bookings() {
    return JSON.parse(localStorage.getItem('bookings') || '[]');
  }
  function save_bookings(bookings) {
    localStorage.setItem('bookings', JSON.stringify(bookings));
  }
  function render_bookings() {
    booking_list.innerHTML = '';
    const bookings = get_bookings();
    if (bookings.length === 0) {
      booking_list.innerHTML = '<div class="notice-info">No bookings yet.</div>';
      return;
    }
    bookings.forEach((booking, idx) => {
      const div = document.createElement('div');
      const date = new Date(booking.date);
      const formatted_date = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      div.className = 'booking-item';
      div.innerHTML = `
        <div class="booking-item-content">
          <strong>${booking.name}</strong> <span class="email">(${booking.email})</span><br>
          <span class="date">Date: ${formatted_date} at ${booking.time}</span><br>
          <span class="instructions">${booking.instructions ? 'Instructions: ' + booking.instructions : ''}</span>
        </div>
        <button class="remove-btn" data-idx="${idx}">Remove</button>
      `;
      booking_list.appendChild(div);
      setTimeout(() => div.classList.add('visible'), 50 + idx * 80);
    });
  }
  booking_list.addEventListener('click', function (e) {
    if (e.target.classList.contains('remove-btn')) {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      let bookings = get_bookings();
      bookings.splice(idx, 1);
      save_bookings(bookings);
      render_bookings();
    }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const instructions = form.instructions.value.trim();
    if (!selected_date && !selected_time) {
      show_error('Please select a date and time slot.');
      return;
    }
    if (!selected_date) {
      show_error('Please select a date.');
      return;
    }
    if (!selected_time) {
      show_error('Please select a time slot.');
      return;
    }
    hide_error();
    // Use local date string to avoid timezone issues
    const date_str = selected_date.getFullYear() + '-' +
      String(selected_date.getMonth() + 1).padStart(2, '0') + '-' +
      String(selected_date.getDate()).padStart(2, '0');
    const bookings = get_bookings();
    bookings.push({ name, email, date: date_str, time: selected_time, instructions });
    save_bookings(bookings);
    form.reset();
    selected_date = null;
    selected_time = '';
    render_calendar(calendar_month, calendar_year);
    render_time_picker();
    render_bookings();
    success_message.style.display = 'block';
    setTimeout(() => { success_message.style.display = 'none'; }, 1200);
    update_calendar_output();
  });
  render_bookings();

  // Hide error when user selects date or time
  function on_user_select() { hide_error(); }
  calendar_div.addEventListener('click', on_user_select);
  time_picker_div.addEventListener('click', on_user_select);

  // --- Admin Settings Logic ---
  const admin_form = document.getElementById('admin-settings-form');
  const days_checkboxes = document.querySelectorAll('#days-checkboxes input[type="checkbox"]');
  const start_time_input = document.getElementById('start-time');
  const end_time_input = document.getElementById('end-time');
  const interval_input = document.getElementById('time-interval');
  const admin_saved_msg = document.getElementById('admin-settings-saved');

  function get_admin_settings() {
    const settings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
    // Defaults: all days, 09:00–18:00, 30 min interval, sapphire theme
    return {
      days: Array.isArray(settings.days) ? settings.days : [0,1,2,3,4,5,6],
      start: settings.start || '09:00',
      end: settings.end || '18:00',
      interval: settings.interval ? parseInt(settings.interval, 10) : 30,
      theme: settings.theme || 'sapphire'
    };
  }

  function save_admin_settings(settings) {
    localStorage.setItem('adminSettings', JSON.stringify(settings));
  }

  function apply_calendar_theme(theme) {
    const calendar = document.getElementById('calendar');
    const booking_system = document.getElementById('booking-system');
    calendar.classList.remove('theme-sapphire', 'theme-ruby', 'theme-gold');
    calendar.classList.add('theme-' + theme);
    booking_system.classList.remove('theme-sapphire', 'theme-ruby', 'theme-gold');
    booking_system.classList.add('theme-' + theme);
  }

  function populate_admin_form() {
    const settings = get_admin_settings();
    days_checkboxes.forEach(cb => {
      cb.checked = settings.days.includes(Number(cb.value));
    });
    start_time_input.value = settings.start;
    end_time_input.value = settings.end;
    if (interval_input) interval_input.value = settings.interval;
    // Set theme radio
    const theme_radios = document.querySelectorAll('input[name="theme"]');
    theme_radios.forEach(radio => {
      radio.checked = (radio.value === settings.theme);
    });
  }

  function set_time_input_step() {
    const interval = interval_input ? parseInt(interval_input.value, 10) : 30;
    const step = interval * 60; // seconds
    if (start_time_input) start_time_input.step = step;
    if (end_time_input) end_time_input.step = step;
  }

  if (admin_form) {
    populate_admin_form();
    set_time_input_step();
    if (interval_input) {
      interval_input.addEventListener('change', function() {
        set_time_input_step();
      });
    }
    // Theme radio change event
    const theme_radios = document.querySelectorAll('input[name="theme"]');
    const theme_labels = document.querySelectorAll('#theme-options .theme-option-btn');
    theme_radios.forEach(radio => {
      radio.addEventListener('change', function() {
        const settings = get_admin_settings();
        settings.theme = this.value;
        save_admin_settings(settings);
        apply_calendar_theme(settings.theme);
        // Update button-like label selection
        theme_labels.forEach(label => {
          if (label.getAttribute('data-theme') === this.value) {
            label.classList.add('selected');
          } else {
            label.classList.remove('selected');
          }
        });
        render_calendar(calendar_month, calendar_year);
        render_time_picker();
      });
    });
    // On load, set selected class on correct label
    const current_theme = get_admin_settings().theme || 'sapphire';
    theme_labels.forEach(label => {
      if (label.getAttribute('data-theme') === current_theme) {
        label.classList.add('selected');
      } else {
        label.classList.remove('selected');
      }
    });
    admin_form.addEventListener('submit', function(e) {
      e.preventDefault();
      const days = Array.from(days_checkboxes).filter(cb => cb.checked).map(cb => Number(cb.value));
      const start = start_time_input.value;
      const end = end_time_input.value;
      const interval = interval_input ? parseInt(interval_input.value, 10) : 30;
      // Get selected theme
      const theme = document.querySelector('input[name="theme"]:checked').value;
      save_admin_settings({ days, start, end, interval, theme });
      apply_calendar_theme(theme);
      admin_saved_msg.style.display = 'inline';
      setTimeout(() => { admin_saved_msg.style.display = 'none'; }, 1200);
      render_calendar(calendar_month, calendar_year);
      render_time_picker();
    });
    // Re-render calendar live when a day checkbox is toggled
    days_checkboxes.forEach(cb => {
      cb.addEventListener('change', function() {
        // Preview the new days selection without saving
        const preview_days = Array.from(days_checkboxes).filter(c => c.checked).map(c => Number(c.value));
        // Temporarily override get_admin_settings for preview
        const orig_get_admin_settings = get_admin_settings;
        window.__preview_days = preview_days;
        window.get_admin_settings = function() {
          const settings = orig_get_admin_settings();
          settings.days = window.__preview_days;
          return settings;
        };
        render_calendar(calendar_month, calendar_year);
        render_time_picker();
        // Restore get_admin_settings after render
        delete window.get_admin_settings;
        delete window.__preview_days;
      });
    });
  }

  // Apply theme on page load
  const initial_theme = get_admin_settings().theme || 'sapphire';
  apply_calendar_theme(initial_theme);

  // --- Update Calendar to restrict days ---
  function render_calendar(month, year) {
    calendar_div.innerHTML = '';
    const calendar_header = document.createElement('div');
    calendar_header.className = 'calendar-header';
    calendar_header.style.display = 'flex';
    calendar_header.style.alignItems = 'center';
    calendar_header.style.justifyContent = 'center';
    calendar_header.style.marginBottom = '10px';

    // Previous month button
    const prev_btn = document.createElement('button');
    prev_btn.textContent = '<';
    prev_btn.className = 'calendar-nav';
    prev_btn.onclick = () => {
      calendar_month--;
      if (calendar_month < 0) {
        calendar_month = 11;
        calendar_year--;
      }
      render_calendar(calendar_month, calendar_year);
    };

    // Next month button
    const next_btn = document.createElement('button');
    next_btn.textContent = '>';
    next_btn.className = 'calendar-nav';
    next_btn.onclick = () => {
      calendar_month++;
      if (calendar_month > 11) {
        calendar_month = 0;
        calendar_year++;
      }
      render_calendar(calendar_month, calendar_year);
    };

    // Month dropdown (styled to match header)
    const month_select = document.createElement('select');
    month_select.className = 'calendar-month-select';
    month_select.style.fontWeight = '700';
    month_select.style.fontSize = '1.1rem';
    month_select.style.letterSpacing = '0.5px';
    const month_names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    month_names.forEach((name, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = name;
      if (idx === month) opt.selected = true;
      month_select.appendChild(opt);
    });
    month_select.addEventListener('change', function() {
      calendar_month = parseInt(this.value, 10);
      render_calendar(calendar_month, calendar_year);
    });

    // Year dropdown (styled to match header)
    const year_select = document.createElement('select');
    year_select.className = 'calendar-year-select';
    year_select.style.fontWeight = '700';
    year_select.style.fontSize = '1.1rem';
    year_select.style.letterSpacing = '0.5px';
    const current_year = new Date().getFullYear();
    for (let y = current_year; y <= current_year + 5; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === year) opt.selected = true;
      year_select.appendChild(opt);
    }
    year_select.addEventListener('change', function() {
      calendar_year = parseInt(this.value, 10);
      render_calendar(calendar_month, calendar_year);
    });

    // Center the dropdowns between the nav buttons
    calendar_header.appendChild(prev_btn);
    calendar_header.appendChild(month_select);
    calendar_header.appendChild(year_select);
    calendar_header.appendChild(next_btn);
    calendar_div.appendChild(calendar_header);

    const days_row = document.createElement('div');
    days_row.className = 'calendar-days-row';
    ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d => {
      const day = document.createElement('span');
      day.className = 'calendar-day-label';
      day.textContent = d;
      days_row.appendChild(day);
    });
    calendar_div.appendChild(days_row);

    const first_day = new Date(year, month, 1).getDay();
    const days_in_month = new Date(year, month+1, 0).getDate();
    const calendar_grid = document.createElement('div');
    calendar_grid.className = 'calendar-grid';
    const admin_settings = get_admin_settings();
    for(let i=0; i<first_day-1; i++) {
      const empty = document.createElement('span');
      empty.className = 'calendar-cell empty';
      calendar_grid.appendChild(empty);
    }
    for(let d=1; d<=days_in_month; d++) {
      const cell = document.createElement('span');
      cell.className = 'calendar-cell';
      const cell_date = new Date(year, month, d);
      cell.textContent = d;
      cell.tabIndex = 0;
      const is_allowed_day = admin_settings.days.includes(cell_date.getDay());
      if(cell_date < today || !is_allowed_day) {
        cell.classList.add('disabled');
      } else {
        cell.onclick = () => select_date(cell_date);
        cell.onkeydown = (e) => { if(e.key==='Enter') select_date(cell_date); };
      }
      if(selected_date && cell_date.getTime() === selected_date.getTime()) {
        cell.classList.add('selected');
      }
      calendar_grid.appendChild(cell);
    }
    calendar_div.appendChild(calendar_grid);
  }

  // --- Update Time Picker to restrict timeframes ---
  function render_time_picker() {
    time_picker_div.innerHTML = '';
    if (!selected_date) return;
    const now = new Date();
    let slots = [];
    let min_time = 0;
    const admin_settings = get_admin_settings();
    let start_hour = parseInt(admin_settings.start.split(':')[0], 10);
    let end_hour = parseInt(admin_settings.end.split(':')[0], 10);
    let start_min = parseInt(admin_settings.start.split(':')[1], 10);
    let end_min = parseInt(admin_settings.end.split(':')[1], 10);
    const interval = admin_settings.interval || 30;
    let start_total = start_hour * 60 + start_min;
    let end_total = end_hour * 60 + end_min;
    let now_total = now.getHours() * 60 + now.getMinutes();
    for (let t = start_total; t <= end_total; t += interval) {
      if (is_today(selected_date) && t < now_total) continue;
      let h = Math.floor(t / 60);
      let m = t % 60;
      let label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push(label);
    }
    if (slots.length === 0) {
      time_picker_div.innerHTML = '<span class="no-slots">No time slots left today</span>';
      selected_time = '';
      update_calendar_output();
      return;
    }
    slots.forEach(slot => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'time-slot-btn';
      btn.textContent = slot;
      if (slot === selected_time) btn.classList.add('selected');
      btn.onclick = () => {
        selected_time = slot;
        render_time_picker();
        update_calendar_output();
      };
      time_picker_div.appendChild(btn);
    });
  }

  // --- Admin Settings Slide Toggle ---
  const admin_settings_panel = document.getElementById('admin-settings-panel');
  const admin_settings_toggle = document.getElementById('admin-settings-toggle');
  // Restore toggle state from localStorage
  let admin_settings_open = localStorage.getItem('adminSettingsOpen');
  if (admin_settings_open === null) admin_settings_open = 'true';
  function set_admin_settings_open(open) {
    admin_settings_open = open ? 'true' : 'false';
    localStorage.setItem('adminSettingsOpen', admin_settings_open);
    if (open) {
      admin_settings_panel.classList.remove('closed');
      admin_settings_toggle.setAttribute('aria-pressed', 'true');
    } else {
      admin_settings_panel.classList.add('closed');
      admin_settings_toggle.setAttribute('aria-pressed', 'false');
    }
  }
  set_admin_settings_open(admin_settings_open === 'true');
  admin_settings_toggle.addEventListener('click', function() {
    set_admin_settings_open(!(admin_settings_open === 'true'));
  });
}); 
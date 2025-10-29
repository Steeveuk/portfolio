document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('form[data-reassignment-tool]');
  const selects = form.querySelectorAll('select');
  const submitBtn = form.querySelector('input[type="submit"]');
  const progressWrapper = document.querySelector('.progress-wrapper');
  // Enable submit if all selects have a value
  form.addEventListener('change', function() {
    let allSelected = true;
    selects.forEach(sel => {
      if (!sel.value) allSelected = false;
    });
    submitBtn.disabled = !allSelected;
  });
  // Show progress bar on submit (demo only)
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    progressWrapper.style.display = 'block';
    let amount = progressWrapper.querySelector('[data-progress-amount]');
    let total = progressWrapper.querySelector('[data-progress-total]');
    let bar = progressWrapper.querySelector('[data-progress-bar]');
    let count = 0;
    let max = 5;
    amount.textContent = count;
    total.textContent = max;
    bar.style.width = '0%';
    // Simulate progress
    let interval = setInterval(() => {
      count++;
      amount.textContent = count;
      bar.style.width = (count / max * 100) + '%';
      if (count >= max) {
        clearInterval(interval);
        setTimeout(() => {
          progressWrapper.style.display = 'none';
        }, 1000);
      }
    }, 400);
  });
}); 
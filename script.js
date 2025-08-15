document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('helloBtn');
  const msg = document.getElementById('helloMsg');
  if (btn && msg) {
    btn.addEventListener('click', () => {
      msg.textContent = 'Nice! Your JavaScript is working.';
      msg.classList.remove('muted');
    });
  }
});
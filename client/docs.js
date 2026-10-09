// Shows or hides the endpoint bock under a clicked header
const toggleEndpoint = (event) => {
  const header = event.target.closest('.collapsible');

  if (header) {
    const content = header.nextElementSibling;
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
    header.classList.toggle('open');
  }
};

//When the window loads, listen for clicks.
window.onload = () => {
  document.addEventListener('click', toggleEndpoint);
};
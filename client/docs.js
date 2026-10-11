// Shows or hides the endpoint under a clicked header
const toggleEndpoint = (event) => {
  const header = event.target.closest('.collapsible');

  if (header) {
    header.nextElementSibling.classList.toggle('is-hidden');
    header.classList.toggle('open');
  }
};

//When the window loads, listen for clicks.
window.onload = () => {
  document.addEventListener('click', toggleEndpoint);
};
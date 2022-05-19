function handleBackground(div) {
  const pic = div.querySelector('picture');
  const section = div.closest('.section');
  if (pic) {
    if (section) {
      section.classList.add('has-background');
      pic.classList.add('section-background');
      section.insertAdjacentElement('afterbegin', pic);
    }
  } else {
    const color = div.textContent;
    if (color && section) {
      section.style.backgroundColor = color;
    }
  }
}

function handleStyle(div) {
  const value = div.textContent.toLowerCase();
  const split = value.split(', ');
  const styles = split.map((style) => style.replaceAll(' ', '-'));
  const section = div.closest('.section');
  if (section) {
    section.classList.add(...styles);
  }
}

export default function init(el) {
  const keyDivs = el.querySelectorAll(':scope > div > div:first-child');
  keyDivs.forEach((div) => {
    const valueDiv = div.nextElementSibling;
    if (div.textContent === 'style') {
      handleStyle(valueDiv);
    }
    if (div.textContent === 'background') {
      handleBackground(valueDiv);
    }
  });
}

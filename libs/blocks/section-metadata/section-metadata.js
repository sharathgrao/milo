function handleBackground(div) {
  const pic = div.querySelector('picture');
  if (pic) {
    const section = div.closest('.section');
    if (section) {
      section.classList.add('has-background');
      pic.classList.add('section-background');
      section.insertAdjacentElement('afterbegin', pic);
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

/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/*
 * Marquee - v5.1
 */

function decorateButtons(el, isLarge) {
  const buttons = el.querySelectorAll('em a, strong a');
  buttons.forEach((button) => {
    const parent = button.parentElement;
    const buttonType = parent.nodeName === 'STRONG' ? 'blue' : 'outline';
    const buttonSize = isLarge ? 'button-xl' : 'button-l';
    button.classList.add('con-button', buttonType, buttonSize);
    parent.insertAdjacentElement('afterend', button);
    parent.remove();
  });
  if (buttons.length > 0) {
    const actionArea = buttons[0].closest('p');
    actionArea.classList.add('action-area');
    actionArea.nextElementSibling?.classList.add('supplemental-text', 'body-XL');
  }
  const link = el.querySelector('a:not([class]');
  if (link) {
    link.classList.add('con-link', 'body-m');
  }
}

function decorateText(el, isLarge) {
  const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const heading = headings[headings.length - 1];
  heading.className = isLarge ? 'heading-xxl' : 'heading-xl';
  heading.nextElementSibling.className = isLarge ? 'body-xl' : 'body-m';
  if (heading.previousElementSibling) {
    heading.previousElementSibling.className = isLarge ? 'detail-l' : 'detail-m';
  }
  const detailImg = el.querySelector('picture');
  if (detailImg) {
    detailImg.classList.add('detail-img');
    const imgPara = detailImg.closest('p');
    imgPara.parentElement.replaceChild(detailImg, imgPara);
  }
}

export default function init(el) {
  // default to dark
  if (!el.classList.contains('light') && !el.classList.contains('dark')) {
    el.classList.add('dark');
  }
  const children = el.querySelectorAll(':scope > div');
  const foreground = children[children.length - 1];
  if (children.length > 1) {
    children[0].classList.add('background');
  }
  foreground.classList.add('foreground', 'container');
  const text = foreground.querySelector('h1, h2, h3, h4, h5, h6').closest('div');
  text.classList.add('text');
  const image = foreground.querySelector(':scope > div:not([class])');
  image?.classList.add('image');
  const isLarge = el.closest('.marquee').classList.contains('large');
  decorateButtons(text, isLarge);
  decorateText(text, isLarge);
}

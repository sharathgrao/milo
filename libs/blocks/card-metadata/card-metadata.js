import getCaaSMetadata from './card-props.js';

const init = (el) => {
  if (window.milo?.cardMetadata) return;

  window.milo = window.milo || {};
  window.milo.cardMetadata = window.milo.cardMetadata || {};

  const pageMd = {};

  if (el) {
    el.childNodes.forEach((n) => {
      const key = n.children[0]?.textContent.toLowerCase();
      const val = n.children[1]?.textContent.toLowerCase();
      if (!key) return;

      pageMd[key] = val;
    });
  }

  window.milo.cardMetadata = getCaaSMetadata(pageMd);
};

const getCardMetadata = () => {
  if (!window.milo?.cardMetadata) {
    init(document.querySelector('.card-metadata'));
  }
  return window.milo.cardMetadata;
};

export { init as default, getCardMetadata };

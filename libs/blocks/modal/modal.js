import { createTag, getMetadata, makeRelative } from '../../utils/utils.js';

const CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
  <g transform="translate(-10500 3403)">
    <circle cx="10" cy="10" r="10" transform="translate(10500 -3403)" fill="#707070"/>
    <line y1="8" x2="8" transform="translate(10506 -3397)" fill="none" stroke="#fff" stroke-width="2"/>
    <line x1="8" y1="8" transform="translate(10506 -3397)" fill="none" stroke="#fff" stroke-width="2"/>
  </g>
</svg>`;

function getDetails(el) {
  const details = { id: window.location.hash.replace('#', '') };
  const a = el || document.querySelector(`a[data-modal-hash="${window.location.hash}"]`);
  if (a) {
    details.path = a.dataset.modalPath;
    return details;
  }
  const metaPath = getMetadata(`-${details.id}`);
  if (metaPath) {
    details.path = makeRelative(metaPath);
    return details;
  }
  return null;
}

function closeModals(modals) {
  const qModals = modals || Array.from(document.querySelectorAll('.dialog-modal'));
  if (qModals?.length) {
    const anchor = qModals.some((m) => m.classList.contains('anchor'));
    qModals.forEach((modal) => {
      if (modal.nextElementSibling?.classList.contains('modal-curtain')) {
        modal.nextElementSibling.remove();
      }
      modal.remove();
    });
    if (anchor) { window.history.pushState('', document.title, `${window.location.pathname}${window.location.search}`); }
  }
}

function handleCustomModal(custom, dialog) {
  dialog.id = custom.id;
  dialog.classList.add(custom.class);
  if (custom.closeEvent) {
    dialog.addEventListener(custom.closeEvent, () => {
      closeModals([dialog]);
    });
  }
  return custom.content;
}

async function handleAnchorModal(el, dialog) {
  const details = getDetails(el);
  if (!details) return null;

  dialog.id = details.id;
  dialog.classList.add('anchor');

  const linkBlock = document.createElement('a');
  linkBlock.href = details.path;

  const { default: getFragment } = await import('../fragment/fragment.js');
  await getFragment(linkBlock, dialog);

  return linkBlock;
}

export async function getModal(el, custom) {
  const curtain = createTag('div', { class: 'modal-curtain is-open' });
  const close = createTag('button', { class: 'dialog-close', 'aria-label': 'Close' }, CLOSE_ICON);
  const dialog = document.createElement('div');
  dialog.className = 'dialog-modal';

  const content = custom ? handleCustomModal(custom, dialog) : await handleAnchorModal(el, dialog);
  if (!content) return;

  close.addEventListener('click', (e) => {
    closeModals([dialog]);
    e.preventDefault();
  });

  curtain.addEventListener('click', (e) => {
    // on click outside of modal
    if (e.target === curtain) {
      closeModals([dialog]);
    }
  });

  dialog.addEventListener('keydown', (event) => {
    if (event.keyCode === 27) {
      closeModals([dialog]);
    }
  });

  dialog.append(close, content);
  document.body.append(dialog);
  dialog.insertAdjacentElement('afterend', curtain);
  close.focus({ focusVisible: true });

  return dialog;
}

export default function init(el) {
  const { modalHash } = el.dataset;
  if (window.location.hash === modalHash) {
    return getModal(el);
  }
  return null;
}

// First import will cause this side effect (on purpose)
window.addEventListener('hashchange', () => {
  if (!window.location.hash) {
    closeModals();
  } else {
    getModal();
  }
});

'use strict';

class SCView extends HTMLElement {
  get route () {
    return this.getAttribute('route') || null;
  }

  in(data) {
    return new Promise((resolve, reject) => {
      const onTransitionEnd = () => {
        this.removeEventListener('transitionend', onTransitionEnd);
        resolve();
      }

      this.classList.add('visible');
      this.addEventListener('transitionend', onTransitionEnd);
    });
  }

  out(data) {

    return new Promise((resolve, reject) => {
      const onTransitionEnd = () => {
        this.removeEventListener('transitionend', onTransitionEnd);
        resolve();
      }

      this.classList.remove('visible');
      this.addEventListener('transitionend', onTransitionEnd);
    });
  }

  update(data) {
    return Promise.resolve();
  }
}

document.registerElement('sc-view', SCView);
'use strict';

class SCRouter extends HTMLElement {
  constructor() {
    super();
    this._onChanged = this._onChanged.bind(this);
    this._routes = new Map();
  }
  
  _onChanged () {
    const path = window.location.pathname;
    const routes = Array.from(this._routes.keys());
    const route = routes.find(r => r.test(path));
    const data = route.exec(path);

    if (!route) {
      return;
    }

    // Store the new view.
    this._newView = this._routes.get(route);

    // We don't want to create more promises for the outgoing view animation,
    // because then we get a lot of hanging Promises, so we add a boolean gate
    // here to stop if there's already a transition running.
    if (this._isTransitioningBetweenViews) {
      return Promise.resolve();
    }
    this._isTransitioningBetweenViews = true;

    // Assume that there's no outgoing animation required.
    let outViewPromise = Promise.resolve();

    // If there is a current view...
    if (this._currentView) {
      // ...and it's the one we already have, just update it.
      if (this._currentView === this._newView) {
        // No transitions, so remove the boolean gate.
        this._isTransitioningBetweenViews = false;

        return this._currentView.update(data);
      }

      // Otherwise animate it out, and take the Promise made by the view as an
      // indicator that the view is done.
      outViewPromise = this._currentView.out(data);
    }

    // Whenever the outgoing animation is done (which may be immediately if
    // there isn't one), update the references to the current view, allow
    // outgoing animations to proceed.
    return outViewPromise
      .then(_ => {
        this._currentView = this._newView;
        this._isTransitioningBetweenViews = false;
        return this._newView.in(data);
      });
  }

  go (url) {
    window.history.pushState(null, null, url);
    return this._onChanged();
  }

  addRoute (route, view) {
    if (this._routes.has(route))
      return console.warn(`Route already exists: ${route}`);

    this._routes.set(route, view);
  }

  _addRoutes () {
    let views = Array.from(document.querySelectorAll('sc-view'));
    views.forEach(view => {
      if (!view.route)
        return;

      this.addRoute(new RegExp(view.route, 'i'), view);
    }, this);
  }

  _removeRoute (route) {
    this._routes.delete(route);
  }

  _clearRoutes () {
    this._routes.clear();
  }

  connectedCallback () {
    window.addEventListener('popstate', this._onChanged);
    this._clearRoutes();
    this._addRoutes();
    this._onChanged();
  }

  disconnectedCallback () {
    window.removeEventListener('popstate', this._onChanged);
  }
}


customElements.define('sc-router', SCRouter);
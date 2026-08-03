// Chat Widget Position & Visibility Control
// ─────────────────────────────────────────────────────────────────────────────
// Strategy:
// - Do NOT hide the entire chat-widget element (that kills the conversation panel too)
// - Instead, poll every 100ms until the shadow DOM launcher button is found
// - Hide ONLY that button via inline style
// - Also hide the tooltip/speech bubble siblings next to the launcher button
// - Expose window.openGHLChat() which re-enables pointer-events, clicks the button, then re-hides it
// - mascot GIF in packageDeals.jsx calls window.openGHLChat()
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  var _launcherBtn = null;
  var _hiddenSiblings = [];

  var HIDDEN_ROUTES = ['/login', '/dashboard'];

  function isHiddenRoute() {
    return HIDDEN_ROUTES.indexOf(window.location.pathname) !== -1;
  }

  function hideLauncherBtn(btn) {
    btn.style.setProperty('opacity', '0', 'important');
    btn.style.setProperty('pointer-events', 'none', 'important');
    btn.style.setProperty('position', 'fixed', 'important');
    btn.style.setProperty('bottom', '-9999px', 'important');
    btn.style.setProperty('right', '-9999px', 'important');
  }

  function hideChatWidget() {
    var chatEl = document.querySelector('chat-widget');
    if (chatEl) {
      chatEl.style.setProperty('display', 'none', 'important');
      chatEl.style.setProperty('visibility', 'hidden', 'important');
      chatEl.style.setProperty('opacity', '0', 'important');
      chatEl.style.setProperty('pointer-events', 'none', 'important');
    }
  }

  function showChatWidget() {
    var chatEl = document.querySelector('chat-widget');
    if (chatEl) {
      chatEl.style.removeProperty('display');
      chatEl.style.removeProperty('visibility');
      chatEl.style.removeProperty('opacity');
      chatEl.style.removeProperty('pointer-events');
    }
  }

  function updateChatVisibility() {
    if (isHiddenRoute()) {
      hideChatWidget();
    } else {
      showChatWidget();
    }
  }

  // Listen to SPA route changes via History API
  var _origPushState = history.pushState;
  var _origReplaceState = history.replaceState;
  history.pushState = function () {
    _origPushState.apply(this, arguments);
    updateChatVisibility();
  };
  history.replaceState = function () {
    _origReplaceState.apply(this, arguments);
    updateChatVisibility();
  };
  window.addEventListener('popstate', updateChatVisibility);

  function hideTooltipSiblings(btn) {
    var parent = btn.parentElement;
    if (!parent) return;

    var siblings = parent.children;
    for (var i = 0; i < siblings.length; i++) {
      if (siblings[i] !== btn) {
        siblings[i].style.setProperty('display', 'none', 'important');
        siblings[i].style.setProperty('visibility', 'hidden', 'important');
        siblings[i].style.setProperty('opacity', '0', 'important');
        _hiddenSiblings.push(siblings[i]);
      }
    }

    var grandParent = parent.parentElement;
    if (grandParent) {
      var uncles = grandParent.children;
      for (var j = 0; j < uncles.length; j++) {
        if (uncles[j] !== parent) {
          var rect = uncles[j].getBoundingClientRect();
          if (rect.width > 0 && rect.width < 500 && rect.height > 0 && rect.height < 200) {
            uncles[j].style.setProperty('display', 'none', 'important');
            uncles[j].style.setProperty('visibility', 'hidden', 'important');
            uncles[j].style.setProperty('opacity', '0', 'important');
            _hiddenSiblings.push(uncles[j]);
          }
        }
      }
    }
  }

  function findLauncherBtn(root) {
    var shadow = root.shadowRoot;
    var search = shadow || root;
    var candidates = search.querySelectorAll('button');
    for (var i = 0; i < candidates.length; i++) {
      var btn = candidates[i];
      var rect = btn.getBoundingClientRect();
      if (rect.width > 30 && rect.height > 30) return btn;
    }
    return null;
  }

  window.openGHLChat = function () {
    if (isHiddenRoute()) return;
    if (_launcherBtn) {
      _launcherBtn.style.setProperty('pointer-events', 'auto', 'important');
      _launcherBtn.click();
      setTimeout(function () {
        if (_launcherBtn) hideLauncherBtn(_launcherBtn);
      }, 50);
      return;
    }
    if (window.LeadConnector && window.LeadConnector.openChat) { window.LeadConnector.openChat(); return; }
    if (window.ChatWidget && window.ChatWidget.open) { window.ChatWidget.open(); return; }
  };

  var attempts = 0;
  var interval = setInterval(function () {
    attempts++;
    var chatEl = document.querySelector('chat-widget');
    if (chatEl) {
      if (isHiddenRoute()) {
        hideChatWidget();
        clearInterval(interval);
        return;
      }

      chatEl.style.setProperty('position', 'fixed', 'important');
      chatEl.style.setProperty('z-index', '2147483647', 'important');
      chatEl.style.setProperty('bottom', '-40px', 'important');
      chatEl.style.setProperty('right', '-20px', 'important');

      var btn = findLauncherBtn(chatEl);
      if (btn) {
        _launcherBtn = btn;
        hideLauncherBtn(btn);
        hideTooltipSiblings(btn);
        clearInterval(interval);
        return;
      }
    }
    if (attempts > 100) clearInterval(interval);
  }, 100);
})();

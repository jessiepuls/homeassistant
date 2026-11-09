// Local, view-scoped keyboard controls. No listeners survive leaving this card.
class MusicHotkeys extends HTMLElement {
  setConfig(config) {
    this.config = config;
    this.textContent = 'Space: play/pause · ←/→: previous/next · ↑/↓: volume';
    this.style.cssText = 'display:block;color:var(--secondary-text-color);font-size:12px;padding:0 4px;';
  }

  set hass(value) { this._hass = value; }
  getCardSize() { return 1; }

  connectedCallback() {
    this._handler ??= (event) => this.onKey(event);
    window.addEventListener('keydown', this._handler);
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this._handler);
  }

  async onKey(event) {
    const actions = {
      ' ': 'media_play_pause',
      ArrowLeft: 'media_previous_track',
      ArrowRight: 'media_next_track',
      ArrowUp: 'volume_set',
      ArrowDown: 'volume_set',
    };
    const action = actions[event.key];
    if (!action || !this._hass || event.defaultPrevented || event.repeat ||
        event.ctrlKey || event.metaKey || event.altKey || event.shiftKey ||
        document.visibilityState === 'hidden' ||
        window.location.pathname !== this.config.path) return;

    // composedPath reaches inputs inside HA's nested shadow roots. Also retain
    // native keyboard behavior for buttons, links, sliders, lists, and dialogs.
    const interactive = 'input,textarea,select,button,a[href],[role="button"],' +
      '[role="slider"],[role="textbox"],[role="combobox"],[role="listbox"],' +
      '[role="tab"],[role="dialog"],dialog,ha-dialog';
    const editing = (node) => node instanceof Element &&
      (node.isContentEditable || node.matches(interactive));
    if (event.composedPath().some(editing)) return;
    let focused = document.activeElement;
    while (focused) {
      if (editing(focused)) return;
      focused = focused.shadowRoot?.activeElement;
    }
    // A cached view or the dashboard editor must not process keyboard events.
    let parent = this;
    while (parent) {
      if (parent.lovelace?.editMode) return;
      const style = getComputedStyle(parent);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      parent = parent.parentElement || parent.getRootNode()?.host;
    }

    const selected = this._hass.states[this.config.destination_entity]?.state;
    const player = this.config.destinations[selected];
    const state = this._hass.states[player];
    if (!state || ['unknown', 'unavailable'].includes(state.state)) return;
    event.preventDefault();
    if (this._busy) return;
    this._busy = true;
    try {
      if (action !== 'volume_set') {
        await this._hass.callService('media_player', action, { entity_id: player });
      } else {
        const delta = event.key === 'ArrowUp' ? 0.03 : -0.03;
        const members = [...new Set([player, ...(state.attributes.group_members || [])])];
        await Promise.all(members.map(async (entity) => {
          const member = this._hass.states[entity];
          const volume = member?.attributes.volume_level;
          if (!member || ['unknown', 'unavailable'].includes(member.state) ||
              typeof volume !== 'number' || !Number.isFinite(volume)) return;
          await this._hass.callService('media_player', 'volume_set', {
            entity_id: entity,
            volume_level: Math.max(0, Math.min(1, volume + delta)),
          });
        }));
      }
    } catch (error) {
      console.error('Music keyboard control failed:', error);
      this.dispatchEvent(new CustomEvent('hass-notification', {
        bubbles: true, composed: true,
        detail: { message: 'Music keyboard control failed. Check speaker availability.' },
      }));
    } finally {
      this._busy = false;
    }
  }
}

if (!customElements.get('music-hotkeys')) customElements.define('music-hotkeys', MusicHotkeys);

// Resource-level navigation works even when the Music card is not mounted.
// Use physical digit codes because Option+digits produces symbols on macOS.
function dashboardTabShortcut(event) {
  const tabs = { Digit1: 'home', Digit2: 'porch', Digit3: 'music', Digit4: 'chicken-coop' };
  const tab = tabs[event.code];
  const prefix = '/lovelace-main-panel';
  const path = window.location.pathname;
  if (!tab || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
      event.repeat || event.defaultPrevented || document.visibilityState === 'hidden' ||
      !(path === prefix || path.startsWith(prefix + '/')) ||
      window.history.state?.dialog) return;

  const blocked = (node) => node instanceof Element &&
    (node.isContentEditable || node.matches(
      'input,textarea,select,[role="textbox"],[role="combobox"],[role="dialog"],dialog,ha-dialog'
    ) || node.lovelace?.editMode);
  if (event.composedPath().some(blocked)) return;
  let focused = document.activeElement;
  while (focused) {
    if (blocked(focused)) return;
    focused = focused.shadowRoot?.activeElement;
  }
  // Edit mode can be active while keyboard focus is on the page background.
  const editingDashboard = (root) => {
    for (const node of root.querySelectorAll('*')) {
      if (node.localName === 'hui-root' && node.lovelace?.editMode) return true;
      if (node.shadowRoot && editingDashboard(node.shadowRoot)) return true;
    }
    return false;
  };
  if (editingDashboard(document)) return;

  event.preventDefault();
  const destination = `${prefix}/${tab}`;
  if (path === destination) return;
  window.history.pushState({ from: path + window.location.search }, '', destination);
  window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
}

// Resource reloads must replace the listener instead of installing duplicates.
if (window.householdTabShortcut) window.removeEventListener('keydown', window.householdTabShortcut);
window.householdTabShortcut = dashboardTabShortcut;
window.addEventListener('keydown', dashboardTabShortcut);

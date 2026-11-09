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

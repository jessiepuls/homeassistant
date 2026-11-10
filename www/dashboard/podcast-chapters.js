// Chapter list for the playing podcast episode. Hidden when the episode has no chapters.
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const formatTime = (seconds) => {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
};

class PodcastChapters extends HTMLElement {
  setConfig(config) {
    if (!config.entity) throw new Error('entity is required');
    this.config = config;
    this._key = undefined;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
  }

  set hass(value) {
    this._hass = value;
    this.render();
  }

  getCardSize() { return this.episode ? 5 : 0; }

  connectedCallback() {
    this._timer ??= setInterval(() => this.highlight(), 1000);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    this._timer = undefined;
  }

  // The sensor lags a track change, so only trust it while the player still reports its episode.
  get episode() {
    const sensor = this._hass?.states[this.config.entity];
    const player = this._hass?.states[sensor?.attributes.player];
    const chapters = sensor?.attributes.chapters || [];
    if (!player || !chapters.length || player.attributes.media_content_id !== sensor.attributes.uri) return null;
    return { player, chapters, uri: sensor.attributes.uri };
  }

  position(player) {
    const { media_position: position, media_position_updated_at: updated } = player.attributes;
    if (typeof position !== 'number') return 0;
    if (player.state !== 'playing' || !updated) return position;
    return position + (Date.now() - new Date(updated).getTime()) / 1000;
  }

  render() {
    const episode = this.episode;
    const key = episode ? `${episode.uri}|${episode.chapters.length}` : '';
    if (key === this._key) {
      this.highlight();
      return;
    }
    this._key = key;
    this._active = undefined;
    this.style.display = episode ? 'block' : 'none';
    if (!episode) {
      this.shadowRoot.innerHTML = '';
      return;
    }
    const rows = episode.chapters.map((chapter, index) => `
      <button class="chapter" data-index="${index}">
        <span class="time">${formatTime(chapter.start)}</span>
        <span class="name">${escapeHtml(chapter.title || `Chapter ${index + 1}`)}</span>
      </button>`).join('');
    this.shadowRoot.innerHTML = `
      <style>
        ha-card { padding: 8px 0; }
        .title { padding: 4px 16px 8px; color: var(--secondary-text-color); font-size: 14px; font-weight: 500; }
        .list { position: relative; max-height: 312px; overflow-y: auto; }
        .chapter {
          display: flex; gap: 12px; width: 100%; padding: 10px 16px; border: 0; border-left: 3px solid transparent;
          background: none; color: var(--primary-text-color); font: inherit; font-size: 14px; text-align: left; cursor: pointer;
        }
        .chapter:hover { background: var(--secondary-background-color); }
        .chapter.active { border-left-color: var(--primary-color); color: var(--primary-color); font-weight: 500; }
        .time { flex: 0 0 auto; min-width: 56px; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
        .chapter.active .time { color: inherit; }
      </style>
      <ha-card>
        <div class="title">Chapters</div>
        <div class="list">${rows}</div>
      </ha-card>`;
    this.shadowRoot.querySelector('.list').addEventListener('click', (event) => {
      const button = event.target.closest('.chapter');
      if (button) this.seek(Number(button.dataset.index));
    });
    this.highlight();
  }

  highlight() {
    const episode = this.episode;
    if (!episode) return;
    const position = this.position(episode.player);
    let active = -1;
    episode.chapters.forEach((chapter, index) => { if (chapter.start <= position + 0.5) active = index; });
    if (active === this._active) return;
    this._active = active;
    const list = this.shadowRoot.querySelector('.list');
    list.querySelectorAll('.chapter.active').forEach((row) => row.classList.remove('active'));
    const row = list.querySelector(`.chapter[data-index="${active}"]`);
    if (!row) return;
    row.classList.add('active');
    const top = row.offsetTop;
    if (top < list.scrollTop || top + row.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = top - list.clientHeight / 3;
    }
  }

  async seek(index) {
    const episode = this.episode;
    if (!episode) return;
    try {
      await this._hass.callService('media_player', 'media_seek', {
        entity_id: episode.player.entity_id,
        seek_position: episode.chapters[index].start,
      });
    } catch (error) {
      console.error('Chapter seek failed:', error);
      this.dispatchEvent(new CustomEvent('hass-notification', {
        bubbles: true, composed: true,
        detail: { message: 'Could not jump to that chapter. Check speaker availability.' },
      }));
    }
  }
}

if (!customElements.get('podcast-chapters')) customElements.define('podcast-chapters', PodcastChapters);

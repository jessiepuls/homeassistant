// Shared HA player: full on room/listening views and compact on overview cards.
class DashboardMediaPlayer extends HTMLElement {
  setConfig(config) {
    if (!config.entity) throw new Error('entity is required');
    this.config = config;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.build();
    this.update();
  }
  set hass(hass) { this._hass = hass; this.update(); }
  connectedCallback() { this._timer ??= setInterval(() => this.update(), 1000); }
  disconnectedCallback() { clearInterval(this._timer); this._timer = undefined; }
  getCardSize() { return this.config?.compact ? 4 : 7; }
  get player() { return this._hass?.states[this.config?.entity]; }
  position(player = this.player) {
    if (!player) return 0;
    const a = player.attributes;
    let pos = Number(a.media_position) || 0;
    const updated = Date.parse(a.media_position_updated_at);
    if (player.state === 'playing' && Number.isFinite(updated)) {
      pos += Math.max(0, (Date.now() - updated) / 1000);
    }
    return Math.max(0, Math.min(pos, Number(a.media_duration) || pos));
  }
  get spokenAudio() {
    const a = this.player?.attributes || {};
    const type = String(a.media_content_type || '').toLowerCase();
    const contentId = String(a.media_content_id || '');
    if (/\:\/\/(?:audiobook|podcast_episode|podcast)\//.test(contentId)) return true;
    if (['music', 'track', 'song', 'album', 'radio'].includes(type)) return false;
    return ['audiobook', 'podcast', 'podcast_episode'].includes(type);
  }
  skip(direction) {
    return this.spokenAudio ? this.seek(this.position() + direction * 15)
      : this.call(direction < 0 ? 'media_previous_track' : 'media_next_track');
  }
  format(seconds) {
    const n = Math.max(0, Math.floor(seconds || 0));
    return n >= 3600 ? `${Math.floor(n / 3600)}:${String(Math.floor(n % 3600 / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
      : `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
  }
  build() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; height:100%; min-height:0; }
        * { box-sizing:border-box; }
        ha-card { height:100%; min-height:490px; padding:20px; display:flex; flex-direction:column; gap:16px;
          border-radius:var(--ha-card-border-radius,12px); overflow:hidden; }
        .art { flex:1 1 220px; min-height:100px; max-height:360px; display:flex; justify-content:center; overflow:hidden; }
        img { height:100%; width:100%; object-fit:contain; border-radius:8px; }
        .placeholder { align-self:center; --mdc-icon-size:70px; color:var(--secondary-text-color); }
        [hidden] { display:none !important; }
        .title { font-size:22px; font-weight:600; line-height:1.3; overflow-wrap:anywhere; }
        .subtitle { color:var(--secondary-text-color); margin-top:5px; font-size:14px; }
        .time { display:flex; justify-content:space-between; gap:12px; color:var(--secondary-text-color); font-size:12px; }
        input { width:100%; min-width:0; accent-color:var(--primary-color); cursor:pointer; margin:0; height:28px; }
        input:disabled { cursor:default; opacity:.45; }
        .transport { display:flex; justify-content:center; align-items:center; gap:24px; }
        button { font:inherit; color:var(--primary-text-color); cursor:pointer; background:none; border:0; min-width:48px; min-height:48px; border-radius:10px; }
        button:disabled { opacity:.4; cursor:default; }
        button:focus-visible,input:focus-visible { outline:2px solid var(--primary-color); outline-offset:3px; }
        .play { background:var(--primary-color); color:var(--text-primary-color,white); width:56px; height:56px; border-radius:50%; }
        .volume { display:flex; gap:14px; align-items:center; }
        .volume label { font-size:13px; color:var(--secondary-text-color); }
        .browse { border:1px solid var(--divider-color); width:100%; font-size:14px; margin-top:auto; }
        .error { color:var(--error-color); font-size:13px; }
        ha-card.compact {
          min-height:270px; height:100%; padding:10px; gap:6px;
          display:flex; flex-direction:column;
        }
        ha-card.compact .art { flex:1 1 80px; min-height:70px; max-height:240px; cursor:pointer; }
        ha-card.compact .meta, ha-card.compact .progress { min-width:0; }
        ha-card.compact .transport { gap:10px; }
        ha-card.compact .volume { gap:8px; }
        ha-card.compact .browse { min-height:36px; margin-top:0; }
        ha-card.compact .title { font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        ha-card.compact .subtitle { margin-top:2px; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        ha-card.compact input { height:18px; }
        ha-card.compact .time { font-size:10px; }
        ha-card.compact .transport button { min-width:34px; min-height:34px; }
        ha-card.compact .play { width:40px; height:40px; }
        ha-card.compact .volume label { font-size:11px; }
        @media(max-width:768px) { ha-card { min-height:480px; height:auto; } .art { flex:none; height:210px; } }
        @media(max-width:768px) {
          ha-card.compact { min-height:270px; height:270px; }
        }
      </style>
      <ha-card>
        <div class="art"><img alt="Cover artwork" hidden><ha-icon class="placeholder" icon="mdi:music"></ha-icon></div>
        <div class="meta"><div class="title"></div><div class="subtitle"></div></div>
        <div class="progress"><input class="seek" aria-label="Playback position" type="range" min="0" max="1" step="1"><div class="time"><span class="elapsed"></span><span class="remaining"></span></div></div>
        <div class="transport">
          <button class="back" aria-label="Back 15 seconds"><ha-icon icon="mdi:rewind-15"></ha-icon></button>
          <button class="play" aria-label="Play"><ha-icon icon="mdi:play"></ha-icon></button>
          <button class="forward" aria-label="Forward 15 seconds"><ha-icon icon="mdi:fast-forward-15"></ha-icon></button>
        </div>
        <div class="volume"><label for="volume">Volume</label><input id="volume" type="range" min="0" max="100" step="1" aria-label="Volume"></div>
        <button class="browse">Browse Listen ↗</button>
        <div class="error" role="status" hidden></div>
      </ha-card>`;
    const q = (s) => this.shadowRoot.querySelector(s);
    q('ha-card').classList.toggle('compact', this.config.compact === true);
    q('.browse').hidden = this.config.hide_browse === true;
    q('.play').onclick = () => this.call(this.player?.state === 'playing' ? 'media_pause' : 'media_play');
    q('.back').onclick = () => this.skip(-1);
    q('.forward').onclick = () => this.skip(1);
    q('.seek').oninput = () => { this._seeking = true; q('.elapsed').textContent = this.format(Number(q('.seek').value)); };
    q('.seek').onchange = () => { const value = Number(q('.seek').value); this._seeking = false; this.seek(value); };
    q('#volume').oninput = () => { this._volumeEditing = true; };
    q('#volume').onchange = () => { const value = Number(q('#volume').value) / 100; this._volumeEditing = false; this.volume(value); };
    for (const input of [q('.seek'), q('#volume')]) {
      input.onblur = input.onpointercancel = () => { this._seeking = false; this._volumeEditing = false; this.update(); };
    }
    q('.browse').onclick = () => this.openListen();
    if (this.config.compact && this.config.listen_path) {
      q('.art').setAttribute('role', 'button');
      q('.art').setAttribute('tabindex', '0');
      q('.art').setAttribute('aria-label', 'Open Listen');
      q('.art').onclick = () => this.openListen();
      q('.art').onkeydown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') this.openListen();
      };
    }
  }
  openListen() {
    history.pushState(null, '', this.config.listen_path || '/lovelace-main-panel/music');
    window.dispatchEvent(new Event('location-changed'));
  }
  update() {
    if (!this.shadowRoot || !this.config) return;
    const p = this.player, a = p?.attributes || {}, q = (s) => this.shadowRoot.querySelector(s);
    const available = !!p && !['unavailable', 'unknown'].includes(p.state);
    const features = Number(a.supported_features) || 0;
    const duration = Number(a.media_duration) || 0;
    const seekable = available && duration > 0 && !!(features & 2);
    q('.title').textContent = a.media_title || (available ? 'Nothing playing' : 'Player unavailable');
    q('.subtitle').textContent = [a.media_artist, a.media_album_name].filter(Boolean).join(' · ');
    const image = q('img'), picture = a.entity_picture;
    if (picture && image.getAttribute('src') !== picture) {
      image.src = picture; image.hidden = false; q('.placeholder').hidden = true;
      image.onerror = () => { image.hidden = true; q('.placeholder').hidden = false; };
    } else if (!picture) { image.removeAttribute('src'); image.hidden = true; q('.placeholder').hidden = false; }
    const pos = this.position();
    if (!this._seeking) { q('.seek').max = String(duration || 1); q('.seek').value = String(pos); q('.elapsed').textContent = duration ? this.format(pos) : ''; }
    q('.remaining').textContent = duration ? `${this.format(duration - pos)} remaining` : '';
    q('.seek').disabled = !seekable;
    const spoken = this.spokenAudio;
    q('.back').disabled = spoken ? !seekable : !available || !(features & 16);
    q('.forward').disabled = spoken ? !seekable : !available || !(features & 32);
    q('.back').setAttribute('aria-label', spoken ? 'Back 15 seconds' : 'Previous track');
    q('.forward').setAttribute('aria-label', spoken ? 'Forward 15 seconds' : 'Next track');
    q('.back ha-icon').setAttribute('icon', spoken ? 'mdi:rewind-15' : 'mdi:skip-previous');
    q('.forward ha-icon').setAttribute('icon', spoken ? 'mdi:fast-forward-15' : 'mdi:skip-next');
    const playing = p?.state === 'playing';
    q('.play').disabled = !available || !(features & (playing ? 1 : 16384));
    q('.play').setAttribute('aria-label', playing ? 'Pause' : 'Play');
    q('.play ha-icon').setAttribute('icon', playing ? 'mdi:pause' : 'mdi:play');
    q('#volume').disabled = !available || !(features & 4);
    if (!this._volumeEditing) q('#volume').value = String(Math.round((a.volume_level || 0) * 100));
  }
  async call(service, data = {}) {
    try {
      await this._hass.callService('media_player', service, { entity_id: this.config.entity, ...data });
      this.shadowRoot.querySelector('.error').hidden = true;
    } catch (error) { this.error(error); }
  }
  error(error) {
    const el = this.shadowRoot.querySelector('.error');
    el.textContent = 'Control failed. Check speaker availability and try again.'; el.hidden = false;
    console.error('Porch player:', error);
  }
  seek(seconds) {
    const duration = Number(this.player?.attributes.media_duration) || 0;
    if (duration > 0) return this.call('media_seek', { seek_position: Math.max(0, Math.min(seconds, duration)) });
  }
  async volume(value) {
    // Move grouped speakers by the same delta, preserving their relative levels.
    const p = this.player;
    if (!p) return;
    const members = p.attributes.group_members || [];
    const targets = [...new Set([this.config.entity, ...members])].filter(id => this._hass.states[id]);
    const delta = value - (p.attributes.volume_level || 0);
    try {
      await Promise.all(targets.map(id => this._hass.callService('media_player', 'volume_set', {
        entity_id: id,
        volume_level: Math.max(0, Math.min(1, (this._hass.states[id].attributes.volume_level || 0) + delta)),
      })));
      this.shadowRoot.querySelector('.error').hidden = true;
    } catch (error) { this.error(error); }
  }
}
if (!customElements.get('dashboard-media-player')) {
  customElements.define('dashboard-media-player', DashboardMediaPlayer);
}

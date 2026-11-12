# Setup and restore

See the [README](../README.md) for dashboard usage and the
[development guide](development.md) for applying configuration changes.

## Restoring an existing installation

Restore the full Home Assistant configuration volume. Git does not contain
integration credentials, device registrations, downloaded integrations/cards,
or most photos and styles. Keep backing up the full volume after setup.

Also restore the Music Assistant data volume (`music-assistant/data`). It holds
provider logins (Apple Music, Overcast, Audible), player configuration, the library, and
podcast progress. Without it, every provider has to be set up again.

## Starting a new installation

Use `.HA_VERSION` as the tested Home Assistant version. Copy the configuration
into HA’s configuration directory, then configure the integrations below and
replace the existing device references before enabling automations. Copying the
YAML does not connect devices or make its entity IDs match your installation.

### Music Assistant

1. Run Music Assistant and choose an address HA and dashboard browsers can reach.
   For a separate server, use its hostname or IP and configured port (normally
   8095). Open that address to confirm the server is accessible.
2. In Music Assistant, configure your music providers and players. Confirm you
   can browse music and play it on a speaker before connecting the dashboard.
3. In HA, open **Settings → Devices & services → Add integration**, select
   **Music Assistant**, and enter that server address when prompted.
4. For the Apple Music recommendation row and podcast episode lists, install
   [Music Assistant Queue Actions](https://github.com/droans/mass_queue), then add
   it in **Settings → Devices & services** using the same server address. Installing
   its files alone does not configure it. Search, playlists, albums, audiobooks, and the
   podcast row use the official integration; the recommendation row specifically
   requests Apple Music, and episode lists use Queue Actions because the official
   integration does not report played or resume state.
5. Map your players and integration IDs using the checklist below. Then open
   Listen and use **Refresh music** to populate the rows.

The native HA Sonos integration is not required for these music controls when
Sonos players are provided through Music Assistant.

#### Audiobooks (Audible)

Connect Audible in Music Assistant’s Music Sources settings. The dashboard’s
**Audiobooks** row uses the official HA integration and refreshes with the other
library rows. Books also appear in search. Selecting one calls the existing
speaker destination script with `media_type: audiobook` and radio mode disabled.

After changing this dashboard configuration, reload Scripts and Template entities
in HA, refresh the dashboard, and use **Refresh music**. Verify a book from the
Home Assistant dashboard on the selected speakers: play, pause, tap its cover to
resume, and check the position in the Audible app after stopping. Provider support
alone does not verify this end-to-end path. The chapter list currently applies to
podcasts only; audiobook seeking uses the player’s progress bar and skip buttons.

#### Podcasts (Overcast)

Podcasts come from Music Assistant’s Overcast provider (beta in 2.10.9). Add it
under **Settings → Providers** with your Overcast email and password.

- The Overcast account needs an email login. If the app was set up
  anonymously, add one under **Settings → Sync Profile** in the iOS app. Sign in
  with Apple and accounts with 2FA are not supported.
- Keep **Maximum number of episodes** at 0 to sync every episode.
- Sync is one-way. Subscriptions and progress come from Overcast; playback in
  Music Assistant is not sent back, and following or unfollowing in Music
  Assistant does not change Overcast.
- Overcast rate-limits its export, so Music Assistant fetches it at most every
  four hours. Progress from the phone can take that long to appear.

Chapters come from the Podcast Chapters integration in
`custom_components/podcast_chapters/`, enabled by `podcast_chapters:` in
`configuration.yaml`. Restart HA after adding it. Music Assistant only reads
chapters published in the feed, so this integration reads the ones embedded in
the episode MP3 (ID3 chapter frames). Shows without embedded chapters show no
Chapters list.

### Device and integration mapping

Find HA entity IDs in **Developer Tools → States**. Areas are managed in
**Settings → Areas, labels & zones**. Use the actual IDs rather than display names.

| Configuration | What to replace or configure |
|---|---|
| `configuration.yaml` | Destination names in `input_select.music_destination` |
| `scripts.yaml` | Both `destinations` maps, the destination selector, and the `queue_entities` player-ID map; choose group starting volumes here |
| `templates/music.yaml` | Music Assistant `config_entry_id` values, the Queue Actions ID in `config_entry_attr(...)` and the episode `send_command`, recommendation player, and provider filter |
| `dashboards/shared/music.yaml` | Destination buttons, playback states, player entities, and the hotkey card’s destination map |
| Other files in `dashboards/shared/` | Device entities, room photos, and player/group references |
| `automations.yaml`, `scripts.yaml`, `templates/chicken-alerts.yaml` | Device entities, area targets, notification actions, and schedules |
| `lights.yaml`, `groups.yaml`, `scenes.yaml` | Group members and scene targets |

For an integration’s config-entry ID, go to **Settings → Devices & services**,
open the integration entry’s menu, and use **Copy entry ID** where available.
The `config_entry_id` fields in music actions need the official Music Assistant
entry; the recommendation startup check and podcast episode lookup need the
separate Queue Actions entry.

The script’s `queue_entities` keys are Music Assistant player/queue identifiers,
not HA entity IDs. Match them to the `active_queue` attribute reported by your
Music Assistant player entities in **Developer Tools → States**.
Keep destination names consistent across the helper, scripts, and dashboard.
The keyboard module’s dashboard prefix must also match if you rename the dashboard.

### Other dependencies

Install and configure the integrations for the devices you keep:

- [Omlet Smart Coop](https://github.com/krozgrov/ha-omlet-integration) for coop doors and feeders.
- [Meross LAN](https://github.com/krahabb/meross_lan) for the outlet controls.
- The integrations providing your lights, fans, weather, and notification targets.

Install these frontend cards: Card Mod, Layout Card, Clock Weather Card,
Button Card, Mini Media Player, State Switch, and Config Template Card.
Check that their installed paths match `lovelace.resources` in `configuration.yaml`.

Restore or supply room photos and styles under `www/`, updating dashboard paths
as needed. The dashboard modules in `www/dashboard/` (including the shared media player)
and the State Bonding blueprint under `blueprints/automation/chrissalter/` are included in Git.

Keep credentials in HA’s integration settings or the untracked `secrets.yaml`.
Check the configuration, restart HA to load the integrations and dashboard, then
verify playback, controls, and notification targets before enabling automations.

# Home Assistant Config

Personal Home Assistant configuration.

## Dashboards

| Dashboard | Description |
|---|---|
| Main Panel | Primary home control panel — weather, Sonos, and room-by-room light/fan controls |
| Chicken Coop | Coop door & feeder controls, battery levels, feed history, and automation toggles |
| Three Season Porch | Porch-specific controls |

Dashboards are in YAML mode (`dashboards/`). Resources (HACS cards) are declared in `configuration.yaml` under `lovelace.resources`.

## HACS Cards Used

- `custom:layout-card` — responsive grid layouts
- `custom:clock-weather-card` — clock + weather forecast
- `custom:sonos-card` — Sonos speaker controls
- `custom:mini-graph-card` — feed level history graph
- `custom:button-card` — state-based icon/color buttons
- `custom:mini-media-player`
- `custom:atomic-calendar-revive`
- `custom:state-switch`
- `kiosk-mode`

## Key Files

| File | Purpose |
|---|---|
| `configuration.yaml` | Main config — Sonos hosts, Lovelace resources & dashboards |
| `automations.yaml` | All automations |
| `lights.yaml` | Light groups (living room, kitchen cabinets) |
| `groups.yaml` | Entity groups (outdoor lights) |
| `scripts.yaml` | Scripts |
| `scenes.yaml` | Scenes |
| `dashboards/` | Lovelace YAML dashboards |
| `custom_components/` | Custom integrations (Omlet Smart Coop) |

## Custom Integrations

- **Omlet Smart Coop** — controls the chicken coop door and feeder, exposes battery levels and last open/close timestamps

## Secrets

Sensitive values (IPs, API keys) are stored in `secrets.yaml` (not committed).

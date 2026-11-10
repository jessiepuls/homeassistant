# Development and maintenance

For people editing this configuration. For dashboard usage and initial setup,
see the [README](../README.md).

## Configuration files

| File | Purpose |
|---|---|
| `configuration.yaml` | Integrations, helpers, frontend resources, dashboard registration |
| `dashboards/main-panel.yaml` | Dashboard entry point and tab order |
| `dashboards/shared/` | Tab layouts, mobile Home controls, shared button templates |
| `templates/` | Music data/search results, podcast episodes and chapters, and chicken alert summary |
| `custom_components/podcast_chapters/` | Reads chapter markers embedded in podcast MP3s |
| `www/dashboard/` | Keyboard shortcuts and podcast chapter list modules |
| `automations.yaml` | Lighting and chicken coop automations |
| `scripts.yaml` | Bedtime, music destinations/playback, and heater controls |
| `lights.yaml`, `groups.yaml`, `scenes.yaml` | Light groups, entity groups, and scenes |

## Applying changes

After editing:

1. Check the configuration in **Developer Tools → YAML**.
2. Reload the affected component there, such as Scripts, Automations, or Template
   entities. Restart HA when a change requires it, including custom integration
   installation or dashboard registration changes.
3. For a shared dashboard layout change, update the entry-point timestamp with
   `touch dashboards/main-panel.yaml`, then refresh the dashboard. HA’s YAML
   dashboard cache checks the entry-point file, not included files.
4. For changes to a module in `www/dashboard/`, increment its `?v=` resource version in
   `configuration.yaml`. In **Developer Tools → Actions**, run
   **`lovelace.reload_resources`**, then hard-refresh the browser
   (**Cmd+Shift+R** on Mac). A browser refresh alone may leave old resources loaded.

## Automated checks

GitHub Actions runs YAML lint, the HA configuration check using `.HA_VERSION`,
and a secrets scan. These checks do not test live devices or dashboard rendering.
The State Bonding blueprint required by lighting automations is included under
`blueprints/automation/chrissalter/`.

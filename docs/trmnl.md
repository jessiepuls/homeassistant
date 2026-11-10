# Chicken status on TRMNL

This is a read-only screen. It displays feeder food levels, existing chicken alerts,
low batteries, door and feeder positions, run light, and water-heater status. Battery readings are shown alongside all four Omlet devices.
It never controls devices.

## Connect the display

1. In your TRMNL cloud account, create a **Private Plugin** with **Webhook** strategy.
   This requires Developer access (included with Clarity Kit).
2. Store its webhook URL in the untracked `secrets.yaml` as
   `chicken_trmnl_webhook_url`. Treat the URL as a credential.
3. In the plugin’s **Edit Markup** screen, paste the contents of
   [`trmnl/chicken-coop.liquid`](../trmnl/chicken-coop.liquid) into the **Full** layout
   and save. Add the plugin to the device’s playlist as a full-screen item.
4. Check HA configuration and restart HA on first installation to load
   `rest_command`. Templates and automations can subsequently be reloaded from
   Developer Tools → YAML. Run `rest_command.chicken_trmnl_push` to send a test.
5. Preview the plugin and let the device refresh. Its refresh interval is separate
   from HA’s sending interval; sending a webhook does not immediately wake the screen.

## Data and refresh

- HA sends every ten minutes and 45 seconds after startup. Avoid frequent manual
  sends: TRMNL’s standard webhook limit is twelve requests per hour.
- Food below 30% means **Refill**. Unknown or invalid levels show **Unknown**,
  not an empty feeder. Batteries at 20% or below appear in the issue list.
- Existing door-confirmation, device-fault, and prolonged-offline alerts are reused.
  The screen shows the first three issues and a count of additional issues.
- **HA sent** is the payload creation time, not the time Omlet measured the food.
  Omlet cloud data can lag. If HA or connectivity stops, the screen can retain old
  data; keep phone notifications enabled for urgent problems.

Entity mappings and thresholds are in `templates/chicken-trmnl.yaml`; transmission
is configured in `trmnl/rest-command.yaml` and the Chicken TRMNL display update
automation. Edit the Liquid file for presentation, then paste it into TRMNL again.

[TRMNL webhook documentation](https://docs.trmnl.com/go/private-plugins/webhooks)

If the screen shows missing data while HA has valid readings, check the plugin’s
**Your Variables** panel and refresh its preview. The v2 layout expects
`schema_version: 2` and a `devices` list. A successful webhook updates stored data;
an older rendered image can remain until TRMNL renders and the device refreshes.

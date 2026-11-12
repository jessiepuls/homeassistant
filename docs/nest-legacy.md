# Testing Nest room sensors

Nest Legacy adds room temperature sensors and active-sensor switches that the
official Google Nest integration does not expose. Keep the existing integration
while checking whether these readings and controls work reliably.

## Connect the account

Nest Legacy 0.8.2 was installed from its release archive into
`custom_components/nest_legacy/`. The files are untracked; include the configuration
volume in backups. This manual installation does not register update management
with HACS. The project is available in HACS for ongoing update management.

After restarting HA, open **Settings → Devices & services → Add integration →
Nest Legacy** and choose the account type.

For a Google account, follow the project’s
[authentication instructions](https://github.com/tronikos/nest_legacy#option-a-google-account).
Use a Firefox private window and the recommended Nest Token Extractor, or the
manual method. Enter the Issue Token and Cookies directly in HA’s setup form.
Close the extraction window without signing out after copying the credentials.
The project warns that credentials extracted from Chrome/Edge can expire quickly
because of device-bound sessions. Safari is supported by the manual method.

## Verify before automating

1. Compare each imported room temperature with the Nest app and assign room areas.
2. Confirm each room sensor has a **Control Thermostat** switch. Do not toggle one
   until ready to change which room controls heating.
3. Observe readings and authentication stability before adding control logic.
4. Decide the rooms, schedules, temperature bands, and upper-temperature limits.
   Nest should continue operating the HVAC equipment; HA selects the active sensor.

The integration uses an unofficial cloud API. Keep Nest’s own schedule as a
fallback and avoid competing sensor-selection schedules once HA control is enabled.

[Project and releases](https://github.com/tronikos/nest_legacy)

## Bedroom temperature schedule

Home Assistant selects the Bedroom sensor from 10 pm to 8 am in its configured
America/Chicago time zone. `script.bedtime` selects Bedroom immediately, until the
next 8 am. `script.wake_up` returns control to the thermostat's built-in Hallway
sensor until the next 10 pm (or another Bedtime run). Wake up is available on the
Bedroom photo panel and in the phone Home controls.

The temporary choice and expiry are stored in `input_select.bedroom_temperature_override`
and `input_datetime.bedroom_temperature_override_until`, which restore across
restarts. The automation reconciles at schedule boundaries, startup, sensor
reconnection, and every five minutes. It only sends a switch command if needed;
an unavailable Bedroom switch is skipped and retried later. Temperature setpoints
and HVAC mode are unchanged. Avoid enabling a competing Nest sensor schedule.

The Home panels show dedicated Living Room, Bedroom, and Hallway readings, plus
outdoor weather temperature; the phone layout also shows Porch. Kitchen and Dining
have no dedicated sensors and do not display a substituted room's temperature.

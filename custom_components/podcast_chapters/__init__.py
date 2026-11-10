"""Read chapter markers embedded in podcast episode MP3s (ID3 CHAP frames).

Music Assistant only reads podcast chapters published in the feed, so shows that
embed chapters in the audio file have none in Music Assistant.
"""

from __future__ import annotations

import asyncio
from collections import OrderedDict
import struct

import aiohttp
import voluptuous as vol

from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.typing import ConfigType

DOMAIN = "podcast_chapters"
CONFIG_SCHEMA = cv.empty_config_schema(DOMAIN)

MAX_TAG_BYTES = 4 * 1024 * 1024
CACHE_SIZE = 32
TIMEOUT = aiohttp.ClientTimeout(total=30)
TEXT_ENCODINGS = {0: "latin-1", 1: "utf-16", 2: "utf-16-be", 3: "utf-8"}


def _syncsafe(raw: bytes) -> int:
    return (raw[0] & 0x7F) << 21 | (raw[1] & 0x7F) << 14 | (raw[2] & 0x7F) << 7 | (raw[3] & 0x7F)


def _frames(data: bytes, version: int):
    pos = 0
    while pos + 10 <= len(data):
        frame_id = data[pos : pos + 4]
        if not frame_id.strip(b"\0"):
            return
        raw_size = data[pos + 4 : pos + 8]
        size = _syncsafe(raw_size) if version == 4 else struct.unpack(">I", raw_size)[0]
        yield frame_id, data[pos + 10 : pos + 10 + size]
        pos += 10 + size


def _text(body: bytes) -> str:
    encoding = TEXT_ENCODINGS.get(body[0], "latin-1")
    return body[1:].decode(encoding, "replace").strip("\0").strip()


def parse_chapters(tag: bytes) -> list[dict]:
    """Return chapters from a complete ID3v2 tag, sorted by start time."""
    version, flags = tag[3], tag[5]
    data = tag[10:]
    if flags & 0x80 and version == 3:
        data = data.replace(b"\xff\x00", b"\xff")
    if flags & 0x40:
        extended = _syncsafe(data[:4]) if version == 4 else struct.unpack(">I", data[:4])[0] + 4
        data = data[extended:]

    chapters = []
    for frame_id, body in _frames(data, version):
        if frame_id != b"CHAP":
            continue
        id_end = body.find(b"\0")
        if id_end < 0 or len(body) < id_end + 17:
            continue
        start_ms = struct.unpack(">I", body[id_end + 1 : id_end + 5])[0]
        title = next(
            (_text(sub) for sub_id, sub in _frames(body[id_end + 17 :], version) if sub_id == b"TIT2" and sub),
            "",
        )
        chapters.append({"start": start_ms / 1000, "title": title})
    return sorted(chapters, key=lambda chapter: chapter["start"])


async def _read_tag(session: aiohttp.ClientSession, url: str) -> bytes:
    async with session.get(url, headers={"Range": f"bytes=0-{MAX_TAG_BYTES - 1}"}, timeout=TIMEOUT) as resp:
        resp.raise_for_status()
        header = await resp.content.readexactly(10)
        if header[:3] != b"ID3":
            return b""
        size = _syncsafe(header[6:10])
        if size > MAX_TAG_BYTES:
            raise HomeAssistantError(f"ID3 tag is {size} bytes, over the {MAX_TAG_BYTES} byte limit")
        return header + await resp.content.readexactly(size)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register the chapter lookup action."""
    cache: OrderedDict[str, list[dict]] = OrderedDict()
    session = async_get_clientsession(hass)

    async def get_chapters(call: ServiceCall) -> ServiceResponse:
        url = call.data["url"]
        if url in cache:
            cache.move_to_end(url)
            return {"chapters": cache[url]}
        try:
            tag = await _read_tag(session, url)
        except (aiohttp.ClientError, asyncio.IncompleteReadError, TimeoutError) as err:
            raise HomeAssistantError(f"Could not read chapters: {err}") from err
        chapters = parse_chapters(tag) if tag else []
        cache[url] = chapters
        if len(cache) > CACHE_SIZE:
            cache.popitem(last=False)
        return {"chapters": chapters}

    hass.services.async_register(
        DOMAIN,
        "get",
        get_chapters,
        schema=vol.Schema({vol.Required("url"): cv.string}),
        supports_response=SupportsResponse.ONLY,
    )
    return True

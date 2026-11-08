"""Emergent Object Storage helper — init once, reuse globally."""
import os
import uuid
import logging
import requests

logger = logging.getLogger("merqon.storage")

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "merqon"

storage_key = None


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    logger.info("Object storage initialized")
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    try:
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data, timeout=120,
        )
        if resp.status_code == 404:
            init_storage(force=True)
            resp = requests.put(
                f"{STORAGE_URL}/objects/{path}",
                headers={"X-Storage-Key": storage_key, "Content-Type": content_type},
                data=data, timeout=120,
            )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise


def get_object(path: str) -> tuple:
    key = init_storage()
    try:
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key}, timeout=60,
        )
        if resp.status_code == 404:
            init_storage(force=True)
            resp = requests.get(
                f"{STORAGE_URL}/objects/{path}",
                headers={"X-Storage-Key": storage_key}, timeout=60,
            )
        resp.raise_for_status()
        return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
    except Exception as e:
        logger.error(f"Download failed: {e}")
        raise


def upload_image(data: bytes, filename: str, content_type: str) -> str:
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "png"
    path = f"{APP_NAME}/links/{uuid.uuid4()}.{ext}"
    put_object(path, data, content_type)
    return path

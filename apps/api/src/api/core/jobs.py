"""Run one heavy computation at a time: this CPU cannot usefully run several at once."""
import threading
from collections.abc import Iterator
from contextlib import contextmanager

from fastapi import HTTPException

_lock = threading.Lock()


@contextmanager
def exclusive(wait_seconds: float = 90) -> Iterator[None]:
    """Wait for any running job to finish, or tell the client the server is busy."""
    if not _lock.acquire(timeout=wait_seconds):
        raise HTTPException(status_code=503, detail="The server is busy with another job. Try again shortly.")
    try:
        yield
    finally:
        _lock.release()

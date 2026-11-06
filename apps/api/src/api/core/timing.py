import time
from collections.abc import Iterator
from contextlib import contextmanager


@contextmanager
def stopwatch() -> Iterator[list[float]]:
    """Yields a one-item list that holds the elapsed milliseconds once the block ends."""
    elapsed = [0.0]
    start = time.perf_counter()
    try:
        yield elapsed
    finally:
        elapsed[0] = (time.perf_counter() - start) * 1000

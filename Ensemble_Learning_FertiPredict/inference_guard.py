"""Bound expensive inference to one call per worker; never queue retries."""
from threading import Lock
from fastapi import HTTPException


class InferenceGuard:
    def __init__(self):
        self._lock = Lock()

    def run(self, operation, values):
        if not self._lock.acquire(blocking=False):
            raise HTTPException(status_code=503, detail="Model busy; retry shortly", headers={"Retry-After": "15"})
        try:
            return operation(values)
        finally:
            self._lock.release()

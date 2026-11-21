import unittest
from fastapi import HTTPException
from inference_guard import InferenceGuard

class GuardTests(unittest.TestCase):
    def test_busy_requests_are_rejected_without_running_model(self):
        guard = InferenceGuard()
        def outer(values):
            with self.assertRaises(HTTPException) as caught:
                guard.run(lambda _: self.fail("must not run concurrently"), {})
            self.assertEqual(caught.exception.status_code, 503)
            return "ok"
        self.assertEqual(guard.run(outer, {}), "ok")
        self.assertEqual(guard.run(lambda _: "available", {}), "available")

    def test_error_releases_slot(self):
        guard = InferenceGuard()
        def broken(_):
            raise ValueError("failed")
        with self.assertRaises(ValueError):
            guard.run(broken, {})
        self.assertEqual(guard.run(lambda _: 42, {}), 42)

if __name__ == "__main__":
    unittest.main()

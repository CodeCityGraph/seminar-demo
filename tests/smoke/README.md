Smoke test suite

Run these smoke tests with Playwright. They verify that the page and UI are loading, in-page links navigate correctly, form fields accept input and can be cleared, and no console errors occur.

Commands:

```bash
# run only smoke tests
npx playwright test tests/smoke --project=chromium
```

Notes:

- Tests mock network responses for `POST /submit` to avoid depending on a backend server.
- Playwright config will start a static server on port 3000; ensure no other process (like the Node backend) is listening on that port when running the tests.

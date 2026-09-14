# safemerge-fixture-1 — `roles` branch

The same club app as `main`, behind a sign-in, with two accounts:
`coach@fixture.test` and `parent@fixture.test`. It exists to exercise SafeMerge's
multi-role identities on a real sign-in.

`vite.config.ts` holds password hashes only. The passwords live in the SafeMerge
project's settings, so nothing in this repository can sign in on its own.

One Vite process serves the UI and its `/api/*` routes, as on `main`. There are no
committed tests on this branch.

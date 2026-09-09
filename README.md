# safemerge-fixture-1

A deliberately small application whose only job is to make SafeMerge's measured
audit produce a **known** answer.

One Vite process serves the UI and its own `/api/*` routes, so there is no
backend to stand up, no database and no login. That matters: the mutation proxy
can only see real HTTP traffic, and it only treats a response as data when the
path looks like an API and the browser labels the request a fetch.

## What each test should do

| test | API 500 | empty lists | wrong value |
| --- | --- | --- | --- |
| `row-content` — a name **and a shirt number** | caught | caught | **caught** |
| `heading` — a static `<h1>` | survives | survives | survives |
| `count` — exactly three rows | caught | caught | **survives** |

The two bold cells are the point. `row-content` catches wrong data only because
it asserts a *number* — SafeMerge's `wrong_value` mutation rewrites numbers
(`n → 7n+13`) and leaves strings alone whenever a response contains any number
at all. `count` misses it because rewriting values in an array does not change
its length.

`heading` survives everything and is still not vacuous: against a blank page it
fails, because there is no `<h1>Squad</h1>` on a blank page.

## Running it by hand

```bash
npm install
npx playwright install --with-deps chromium
npm run dev          # terminal 1
npm run test:e2e     # terminal 2
```

All three pass against the real app. That is the baseline SafeMerge measures
from — a test already failing is excluded rather than counted as a catch.

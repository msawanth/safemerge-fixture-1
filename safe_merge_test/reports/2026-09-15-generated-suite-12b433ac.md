<!-- Written by SafeMerge from run 12b433ac-66d7-4371-8099-3048285bed5e. It holds what a shared report link shows and nothing else: no credentials, staging or API addresses, logs, raw failure messages or test source. A later run writes a new file; this one is never rewritten. -->

# Generated suite report: safemerge-fixture-1

msawanth/safemerge-fixture-1 · finished 2026-09-15

SafeMerge wrote 3 spec files with 14 tests, and 14 passed in a sandbox against the application. Every one failed against a blank page, so each proves something real.

- Tests passed: 14 of 14
- Passed against a blank page: none of 14
- Assertion quality: 100/100
- Route coverage: 100%
- Pull request: prepared, not opened yet

## Tests, worst first

### a club administrator opens Finance and sees the season's total income adding up

`finance.spec.ts`. Passed in the sandbox.

### a club administrator moves between Finance and the squad and the figures survive a reload

`finance.spec.ts`. Passed in the sandbox.

### a parent is refused the club's finances

`finance.spec.ts`. Passed in the sandbox.

### a parent has no Add a player form, while the club administrator's add works

`finance.spec.ts`. Passed in the sandbox.

### a club administrator signs in and the squad is still there after a reload

`session.spec.ts`. Passed in the sandbox.

### a wrong password is refused, and the same club administrator then signs in and sees the squad

`session.spec.ts`. Passed in the sandbox.

### a parent signs out and is returned to the sign-in form

`session.spec.ts`. Passed in the sandbox.

### a parent sees the squad and attendance but no Finance link anywhere in the navigation

`session.spec.ts`. Passed in the sandbox.

### a club administrator adds a player through the Add a player form and the squad shows them

`squad.spec.ts`. Passed in the sandbox.

### the player a club administrator added is still in the squad after a reload

`squad.spec.ts`. Passed in the sandbox.

### a parent sees the player the club administrator just added, with its shirt number and goals

`squad.spec.ts`. Passed in the sandbox.

### a club administrator sees the seeded squad with its goal tallies and column headers

`squad.spec.ts`. Passed in the sandbox.

### a club administrator visits attendance and returns to the squad through the navigation

`squad.spec.ts`. Passed in the sandbox.

### a club administrator submitting an empty shirt number is told the player could not be added

`squad.spec.ts`. Passed in the sandbox.

## Spec files

- `squad.spec.ts` - assertion quality 100/100
- `finance.spec.ts` - assertion quality 100/100
- `session.spec.ts` - assertion quality 100/100

---

Produced by SafeMerge. The run, for members of this SafeMerge project: http://localhost:3000/runs/12b433ac-66d7-4371-8099-3048285bed5e/report

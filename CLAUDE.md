@AGENTS.md

# Working style

## Verification

- Run `tsc` and `eslint` before reporting work as done, and state what they
  said.
- Show a diff before applying changes that touch more than one file.
- Say what you did not verify. "Untested on device" is more useful than
  silence.

## Judgment

- If my approach has a bug, say so and explain the failure mode rather than
  implementing it as asked.
- Flag when a change makes an existing comment, README claim, or adjacent code
  wrong.
- Don't widen scope past what was asked without saying you did.
- Prefer the boring solution unless there's a stated reason for the clever one.

## Production posture, with exceptions

Design as if this ships: handle errors rather than swallowing them, think
through edge cases (empty states, offline, slow network, long text, missing
data), and don't leave dead code behind.

But this is active development, so these are fine and expected:

- `console.log` and debug output while working on something
- Placeholder and test data in screens that aren't built yet
- Debug colors and temporary styling to make layout visible

Flag them when they'd ship, don't strip them while I'm still working. If
something is meant to be temporary, say so in a comment so it's findable later.

# Theia

Vision board to action.

You start with a vision board — the life you're actually aiming at. Theia breaks
that down into goals, goals into habits, and habits into time on a calendar, so
the thing on the board turns into something you do this week. Then it zooms
back out: where you stand across every area of your life at a glance, so you
can see which ones you're feeding and which ones you've quietly dropped.

Goals, habits, and the calendar are the mechanism. The board is the point.

Sharing boards with friends is planned.

## Status

Early. The navigation shell is built — the floating tab bar, its collapse-on-
scroll behavior, and the five routes — and most screens are still placeholders.

## Running it

```bash
npm install
npx expo start
```

Then open the app on a device with Expo Go, in an
[iOS simulator](https://docs.expo.dev/workflow/ios-simulator/), in an
[Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/), or
in the browser with `npm run web`.

Other scripts: `npm run ios`, `npm run android`, `npm run lint`.

## Layout

```
app/                 Routes. File-based, so the tree is the navigation.
  _layout.tsx        Root layout.
  (tabs)/
    _layout.tsx      Tab navigator. Registers screens and their icons,
                     and wraps everything in TabBarScrollProvider.
    index.tsx        Goals
    habits.tsx       Habits
    calendar.tsx     Calendar
    you.tsx          You
    assistant.tsx    Assistant

components/
  TabBar.tsx         The floating bar: blurred pill, gesture-draggable
                     indicator, collapse animation, gradient AI button.
  TabBarScroll.tsx   The scroll side of that bar. Owns the collapse state,
                     the scroll handler screens attach to, the registry
                     used for scroll-to-top, and the ScreenScroll wrapper.
  TabIcon.tsx        Icon with the animated highlight lozenge.

assets/              Images. App icons live in assets/expo-image/.
global.css           The design tokens, in a Tailwind 4 @theme block.
app.json             Expo config.
```

## Styling

[NativeWind](https://www.nativewind.dev) v5 with Tailwind 4. There is no
`tailwind.config.js` — colors and radii are CSS custom properties in the
`@theme` block in `global.css`, which is what generates utilities like
`bg-glass` and `rounded-indicator`.

Two things to know before adding styles:

- **`className` only works on components imported from `react-native`.**
  NativeWind's babel pass rewrites those imports and nothing else, so
  `className` on `Animated.View`, `BlurView`, or `LinearGradient` is silently
  dropped. Wrap them with `styled()` from `nativewind` and render the
  component it returns — `styled()` does not register the original.
- **Opacity modifiers such as `bg-black/10` render as nothing.** Use an inline
  `rgba()` style, or add a token to `global.css`.

### Light only, for now

`app.json` sets `userInterfaceStyle` to `light`, which is deliberate. The
palette in `global.css` has only light tokens, and the tab bar's glass is a
white wash over a `tint="light"` blur, so honouring the system's dark
appearance today would just render the light bar against dark content.

Dark mode is deferred until the palette is settled. Picking it up means adding
dark values for the tokens, making the blur tint follow the scheme, and setting
`userInterfaceStyle` back to `automatic` — not before.

## Principles

Three commitments we're building under. They describe where the app is headed,
not everything it already does — treat them as the bar to clear, and say so if
a change falls short of one.

**Accessibility.** The app should be fully usable with VoiceOver and TalkBack,
respect the system font scale rather than pinning text sizes, meet WCAG AA
contrast, and never lean on color alone to carry state — anything shown in
color needs a second cue in shape, weight, or text. An accessibility statement
will be published before launch.

**Privacy.** Health and fitness data stays on the device wherever it can. What
reaches the backend is completion results — that a thing was done — never the
raw health data behind them. A privacy policy will be published before launch.

**Security.** No secrets in the repo. Supabase row-level security on every
table holding user data, so access is enforced in the database rather than
trusted from the client. Any third-party integration gets the narrowest scope that makes it
work.

### AI agent security

The assistant is an empty screen today. These are the rules it has to meet
before it does anything real, written down now because they are much harder to
retrofit than to build against.

**Tools are scoped and reversible.** The assistant gets explicit, narrow tools,
never raw database access. Destructive actions — deletes, bulk edits — ask the
user before they run. It starts read-only, and write tools get added one at a
time.

**User data stays in the user's scope.** Every tool call runs under the
authenticated user's permissions, enforced by row-level security. The assistant
cannot reach another user's goals, habits, or calendar even if it is asked to.

**Untrusted input is not instruction.** Goal titles, notes, shared boards, and
anything from a third party are content the assistant reads, never commands it
obeys. Once boards can be shared between users, prompt injection stops being
hypothetical — a board someone else wrote is untrusted input by definition.

**Health data does not go to the model.** The same line the privacy commitment
draws: completion results may inform the assistant, the raw health data behind
them does not.

**Nothing sensitive in prompts.** No keys, no tokens, no other users' data in
system prompts or context.

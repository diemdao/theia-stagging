# Theia

Vision board to action.

You start with a vision board — the life you're actually aiming at. Theia breaks
that down into goals, goals into habits, and habits into time on a calendar, so
the thing on the board turns into something you do this week. The overview pulls
back out again: a bird's-eye view of where you stand across the areas of your
life, so you can see which ones you're feeding and which ones you've quietly
dropped.

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
    overview.tsx     Overview
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

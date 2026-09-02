// Shared by TabBar and TabBarScroll. Kept in its own module because TabBar
// already imports from TabBarScroll, so putting these in either one would
// make the pair circular.

// The assistant button is the tallest thing in the bar - everything else is
// shorter and centred against it - so it sets the bar's height. Mirrors the
// `h-16 w-16` on that button in TabBar.
export const TAB_BAR_HEIGHT = 64;

// Breathing room between the last row of a screen's content and the bar.
export const TAB_BAR_GAP = 24;

// What a scrolling screen has to clear at the bottom. The safe-area inset is
// added on top of this at runtime rather than baked in: the bar sits above
// the inset (mb-safe), and the inset is per-device.
export const SCREEN_BOTTOM_PADDING = TAB_BAR_HEIGHT + TAB_BAR_GAP;

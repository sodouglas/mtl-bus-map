/**
 * Welcome tour slides. Optional GIFs live in public/welcome/ (served from site root).
 * Naming: `{id}-desktop.gif` / `{id}-mobile.gif` under public/welcome/ (see slide `id` fields).
 * If only one variant exists, set gifSrcDesktop or gifSrcMobile — the UI uses it for both breakpoints.
 */
export interface WelcomeSlide {
  id: string;
  title: string;
  /** Paragraphs separated by blank lines (\n\n). */
  body: string;
  gifSrcDesktop?: string;
  gifSrcMobile?: string;
}

export const WELCOME_DISMISSED_KEY = "routely-welcome-dismissed-v1";

export const WELCOME_SLIDES: WelcomeSlide[] = [
  {
    id: "welcome",
    title: "Welcome to Routely!",
    body: `This is a map for exploring transit around you — see which buses, metro, and streetcars go where.

Use it to sketch a trip or follow your curiosity: where lines run, and what might link two spots. (It is not live vehicle tracking, yet.)`,
    gifSrcDesktop: "welcome/welcome-desktop.gif",
  },
  {
    id: "places",
    title: "Start from a place",
    body: `Search for an address or neighborhood and pick a result to drop a marker on the map.

The circle around it is how far you are willing to walk to catch a line — widen or narrow it until it feels right. Nearby routes show up automatically.`,
    gifSrcDesktop: "welcome/places-desktop.gif",
  },
  {
    id: "endpoints",
    title: "Origin and destination",
    body: `Your first place is where you are starting from — it shows up blue on the map. Add a destination when you want ideas for the other end of the trip; that end shows up red.

With both set, routes that could work for the whole trip rise to the top, and the map nudges you toward nearby stops at each end. Clear either field anytime if you only care about one side.`,
    gifSrcDesktop: "welcome/endpoints-desktop.gif",
  },
  {
    id: "pin",
    title: "Point on the map instead",
    body: `Sometimes it is easier to tap exactly where you mean.

Drop a pin on the map to set your place — handy for corners, parks, or spots search does not quite know.`,
    gifSrcDesktop: "welcome/pin-desktop.gif",
  },
  {
    id: "explore",
    title: "Explore routes and stops",
    body: `Hover a line on the map to see which route it is. Click a line to focus on it and dim the others — click empty map to clear the focus.

Turn on stop markers to see where you would board along the line; hover stops for names when you need them.`,
    gifSrcDesktop: "welcome/explore-desktop.gif",
  },
  {
    id: "city",
    title: "Pick your city",
    body: `Use the agency buttons at the top of the panel to switch cities.

The whole map updates so you are looking at the right network for Montreal or Toronto.`,
    gifSrcDesktop: "welcome/city-desktop.gif",
  },
];

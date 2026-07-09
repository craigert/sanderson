// Static lore data powering the interactive universe map.
// seriesIds reference the seeded `series` table; bookTitles narrows a planet
// to specific books when a series spans multiple worlds (Standalone Cosmere).

export const UNIVERSES = {
  cosmere: {
    id: 'cosmere',
    label: 'The Cosmere',
    blurb: 'One universe, sixteen Shards of Adonalsium, countless worlds bound together by Investiture and the travelers who hop between them.',
  },
  other: {
    id: 'other',
    label: 'Beyond the Cosmere',
    blurb: 'Separate universes entirely — no Shards, no worldhoppers, but no less wonder.',
  },
};

export const PLANETS = [
  // ─── Cosmere ───────────────────────────────────────────
  {
    id: 'roshar',
    universe: 'cosmere',
    name: 'Roshar',
    system: 'The Rosharan System',
    tagline: 'A storm-scoured world of spren, oaths, and ancient betrayals',
    description:
      'Ravaged by the cyclical highstorms, life on Roshar has evolved shells and stone. Here the Knights Radiant once rode, spren walk between realms, and the war between Honor and Odium spans millennia.',
    x: 900, y: 430, r: 58,
    colors: { base: '#2e6fb3', mid: '#3f8fd4', glow: '#5fb0ff', accent: '#8fd0ff' },
    moons: [
      { name: 'Salas', color: '#8a5fc4', angle: -35, dist: 1.75, r: 7 },
      { name: 'Nomon', color: '#79c8e8', angle: 15, dist: 2.0, r: 9 },
      { name: 'Mishim', color: '#5fc48a', angle: 60, dist: 1.7, r: 6 },
    ],
    shards: [
      { name: 'Honor', note: 'The Stormfather carries his remnants' },
      { name: 'Cultivation', note: 'Hidden, patient, playing the long game' },
      { name: 'Odium', note: 'The enemy, bound by the Oathpact' },
    ],
    magic: [
      { name: 'Surgebinding', blurb: 'Ten Surges granted through bonds with spren — gravitation, adhesion, illumination and more.' },
      { name: 'Voidbinding', blurb: 'Odium\'s dark mirror of the Surges, fueled by Voidlight.' },
      { name: 'Fabrials', blurb: 'Devices that capture spren in gemstones to produce technological wonders.' },
    ],
    seriesIds: [1],
  },
  {
    id: 'scadrial',
    universe: 'cosmere',
    name: 'Scadrial',
    system: 'The Scadrian System',
    tagline: 'A world of ash and mist, remade by the powers of metal',
    description:
      'Twice reshaped by gods, Scadrial is home to the Metallic Arts. From the ashfalls of the Final Empire to the skyscrapers and six-shooters of Elendel, its people burn metal to fuel extraordinary power.',
    x: 470, y: 560, r: 48,
    colors: { base: '#8a4a2c', mid: '#b0603a', glow: '#e08050', accent: '#ffb080' },
    shards: [
      { name: 'Preservation', note: 'Gave of himself to imprison Ruin' },
      { name: 'Ruin', note: 'The end of all things, once trapped at the Well' },
      { name: 'Harmony', note: 'Sazed, holding both in uneasy balance' },
    ],
    magic: [
      { name: 'Allomancy', blurb: 'Ingest and burn metals to gain powers — steel pushes, pewter strengthens, atium sees the future.' },
      { name: 'Feruchemy', blurb: 'Store attributes in metalminds — health, strength, memories, even weight — to draw on later.' },
      { name: 'Hemalurgy', blurb: 'Steal powers and attributes by driving spikes through one body into another.' },
    ],
    seriesIds: [2, 3],
  },
  {
    id: 'sel',
    universe: 'cosmere',
    name: 'Sel',
    system: 'The Selish System',
    tagline: 'Where magic is written into the land itself',
    description:
      'On Sel, Investiture is bound to place and form — Aons drawn in the air, souls rewritten with stamps, bones warped by monks. The fall of Elantris broke its greatest magic overnight.',
    x: 380, y: 250, r: 44,
    colors: { base: '#8f8a3a', mid: '#b3ad4a', glow: '#e0d86a', accent: '#fff2a0' },
    shards: [
      { name: 'Devotion', note: 'Splintered by Odium; her power became the Dor' },
      { name: 'Dominion', note: 'Splintered alongside Devotion' },
    ],
    magic: [
      { name: 'AonDor', blurb: 'Elantrians draw Aons — glowing glyphs tied to the shape of the land — to work near-limitless effects.' },
      { name: 'Forgery', blurb: 'Rewrite an object\'s history with a soulstamp, convincing it to become something else.' },
      { name: 'Dakhor & ChayShan', blurb: 'Monastic arts that channel the Dor through bone and motion.' },
    ],
    seriesIds: [4],
  },
  {
    id: 'nalthis',
    universe: 'cosmere',
    name: 'Nalthis',
    system: 'The Nalthian System',
    tagline: 'A world painted in Breath and color',
    description:
      'Every person on Nalthis is born with a Breath — a fragment of Investiture that can be given away, hoarded, or used to Awaken objects to life. Its gods are the Returned, dead heroes granted a second chance.',
    x: 760, y: 730, r: 40,
    colors: { base: '#6a3a8f', mid: '#8a4ab3', glow: '#b06ae0', accent: '#e0a0ff' },
    shards: [
      { name: 'Endowment', note: 'Grants Breath to all, and Returns the worthy dead' },
    ],
    magic: [
      { name: 'Awakening', blurb: 'Spend Breaths to bring objects to life — ropes that grapple, cloaks that shield, swords that speak.' },
      { name: 'BioChroma', blurb: 'Accumulated Breath heightens the senses; enough of it grants agelessness and perfect pitch.' },
    ],
    seriesIds: [5],
  },
  {
    id: 'lumar',
    universe: 'cosmere',
    name: 'Lumar',
    system: 'The Lumar System',
    tagline: 'Twelve seas of spores beneath twelve moons',
    description:
      'Lumar\'s oceans are not water but aether spores that rain from its moons — emerald vines, crimson spikes, midnight shadows. Sailors cross them the way others cross the waves, and pray they stay dry.',
    x: 1180, y: 300, r: 34,
    colors: { base: '#2c8a5a', mid: '#3ab374', glow: '#5ae094', accent: '#a0ffc8' },
    // Lumar has twelve moons, each raining a different aether-spore sea; a few
    // are drawn to suggest the crowded sky.
    moons: [
      { name: 'Verdant Moon', color: '#5ae094', angle: -20, dist: 2.3, r: 5 },
      { name: 'Crimson Moon', color: '#e0685a', angle: 45, dist: 2.6, r: 5 },
      { name: 'Sapphire Moon', color: '#6ab0ff', angle: 130, dist: 2.2, r: 4 },
      { name: 'Sunlight Moon', color: '#ffd070', angle: 200, dist: 2.7, r: 5 },
      { name: 'Rose Moon', color: '#ff9ec0', angle: 265, dist: 2.35, r: 4 },
      { name: 'Zephyr Moon', color: '#a0ffc8', angle: 320, dist: 2.6, r: 4 },
    ],
    shards: [],
    magic: [
      { name: 'The Aethers', blurb: 'Ancient symbiotic spores that erupt on contact with water — each sea a different aether, each deadly in its own way.' },
    ],
    seriesIds: [10],
    bookTitles: ['Tress of the Emerald Sea'],
  },
  {
    id: 'komashi',
    universe: 'cosmere',
    name: 'Komashi',
    system: 'The Komashi System',
    tagline: 'Spirits of stone and cities wrapped in night',
    description:
      'A world split between sun-drenched Torio, where yoki-hijo summon spirits with sacred art, and the neon-dark city of Kilahito, where painters hold back living nightmares with ink and light.',
    x: 1230, y: 640, r: 32,
    colors: { base: '#b34a6a', mid: '#d46a8a', glow: '#ff8aaa', accent: '#ffc0d0' },
    shards: [
      { name: 'Virtuosity', note: 'Splintered herself here, leaving her Investiture behind' },
    ],
    magic: [
      { name: 'Hijo Binding', blurb: 'Spirits drawn by acts of dedicated artistry — stacked stones, perfect craft — and bound to serve.' },
      { name: 'Nightmare Painting', blurb: 'Manifested nightmares captured and neutralized by painting them into harmless shapes.' },
    ],
    seriesIds: [10],
    bookTitles: ['Yumi and the Nightmare Painter'],
  },
  {
    id: 'canticle',
    universe: 'cosmere',
    name: 'Canticle',
    system: 'The Canticle System',
    tagline: 'Outrun the sunrise or burn',
    description:
      'A tidally-broken world where the sunlit side melts stone. Civilization survives in mobile cities racing the dawn, mining sunhearts from the corpses of the light — and one exhausted worldhopper just crash-landed.',
    x: 980, y: 820, r: 30,
    colors: { base: '#b3702c', mid: '#d48a3a', glow: '#ffaa4a', accent: '#ffd090' },
    shards: [],
    magic: [
      { name: 'Sunhearts', blurb: 'Concentrated Investiture forged by the deadly sunrise, harvested to power cities and remake people.' },
    ],
    seriesIds: [10],
    bookTitles: ['The Sunlit Man'],
  },
  {
    id: 'yolen',
    universe: 'cosmere',
    name: 'Yolen',
    system: 'Location Unknown',
    tagline: 'Where it all began',
    description:
      'The lost homeworld of Hoid, of dragons, and of Adonalsium itself — the god whose Shattering created the sixteen Shards. Almost nothing is known of it. Almost no one has been back.',
    x: 700, y: 140, r: 22,
    colors: { base: '#5a6a7a', mid: '#7a8a9a', glow: '#a0b8cc', accent: '#d0e0f0' },
    shards: [],
    magic: [
      { name: 'Unknown', blurb: 'The site of the Shattering of Adonalsium. Its secrets remain untold... for now.' },
    ],
    seriesIds: [],
    lore: true,
  },
  {
    id: 'first-of-the-sun',
    universe: 'cosmere',
    name: 'First of the Sun',
    system: 'The Drominad System',
    tagline: 'Islands of deadly instinct, where the Aviar grant strange gifts',
    description:
      'An archipelago world of lush, lethal jungles whose predators hunt by sensing thought itself. Its people bond with Aviar — birds that grant talents like hiding one\'s mind or glimpsing moments of the future. Beyond the isles, out in the dark, the Emberdark stirs.',
    x: 200, y: 560, r: 32,
    colors: { base: '#1f8a6a', mid: '#2fb389', glow: '#5fe0b0', accent: '#ffd88a' },
    shards: [
      { name: 'Autonomy', note: 'Present as the avatar Patji, the deadly father-island' },
    ],
    magic: [
      { name: 'The Aviar', blurb: 'Bonded birds grant talents — hiding a person\'s mind from predators, or Sak\'s gift of seeing moments before death.' },
    ],
    seriesIds: [10],
    bookTitles: ['The Isles of the Emberdark', 'Sixth of the Dusk'],
  },
  {
    id: 'threnody',
    universe: 'cosmere',
    name: 'Threnody',
    system: 'The Threnody System',
    tagline: 'Light the wrong fire and the Shades will take you',
    description:
      'A haunted frontier world where the dead linger as Shades. Break the Simple Rules — kindle no flame, shed no blood, run not at night — and only silver stands between you and a cold death in the Forests of Hell.',
    x: 320, y: 830, r: 30,
    colors: { base: '#3a4a5a', mid: '#556878', glow: '#8fb0c8', accent: '#dfe8f0' },
    shards: [],
    magic: [
      { name: 'The Shades', blurb: 'The vengeful dead, held at bay by silver and by obedience to the Simple Rules. Investiture here wears the face of death.' },
    ],
    seriesIds: [10],
    bookTitles: ['Shadows for Silence in the Forests of Hell'],
  },
  {
    id: 'taldain',
    universe: 'cosmere',
    name: 'Taldain',
    system: 'The Taldain System',
    tagline: 'Under an unblinking white sun, the sand comes alive',
    description:
      'A tidally locked world split between the blazing Dayside and the frozen Darkside. On the white sands, Sand Masters raise ribbons of living sand with water and will — power that can master a battlefield or burn a person to ash.',
    x: 560, y: 160, r: 32,
    colors: { base: '#b8863a', mid: '#d4a24a', glow: '#ffd870', accent: '#fff2c0' },
    shards: [
      { name: 'Autonomy', note: 'Taldain is the home of the Shard Autonomy (Bavadin)' },
    ],
    magic: [
      { name: 'Sand Mastery', blurb: 'Command ribbons of white sand, fuelling the Investiture with water — overmaster it and it will drain you to death.' },
    ],
    seriesIds: [10],
    bookTitles: ['White Sand'],
  },

  // ─── Beyond the Cosmere ────────────────────────────────
  {
    id: 'detritus',
    universe: 'other',
    name: 'Detritus',
    system: 'The Cytoverse',
    tagline: 'Humanity\'s last cage among the stars',
    description:
      'A junk-shrouded planet wrapped in ancient defense platforms, where the remnants of humanity hide underground from the Krell — and one girl with a talking ship refuses to stay grounded.',
    x: 300, y: 1250, r: 46,
    colors: { base: '#3a6a8a', mid: '#4a86aa', glow: '#6ab0dd', accent: '#a0d8ff' },
    shards: [],
    magic: [
      { name: 'Cytonics', blurb: 'Psychic abilities of mind — faster-than-light communication, teleportation, and passage into the nowhere.' },
    ],
    seriesIds: [8],
  },
  {
    id: 'newcago',
    universe: 'other',
    name: 'Earth (Newcago)',
    system: 'The Reckonerverse',
    tagline: 'When the sky gave ordinary people terrible power',
    description:
      'After Calamity rose, Epics reshaped Earth into fiefdoms of steel and fear. In the transformed ruins of Chicago, a crew of ordinary humans hunts gods for a living.',
    x: 720, y: 1300, r: 44,
    colors: { base: '#6a6a72', mid: '#8a8a94', glow: '#b0b0c0', accent: '#e0e0ea' },
    shards: [],
    magic: [
      { name: 'Epic Powers', blurb: 'Calamity-granted abilities, each paired with a corrupting influence and a single exploitable weakness.' },
    ],
    seriesIds: [7],
  },
  {
    id: 'new-britannia',
    universe: 'other',
    name: 'Earth (New Britannia)',
    system: 'The Rithmatist\'s America',
    tagline: 'Chalk lines between life and death',
    description:
      'An alternate gearpunk United Isles where Rithmatists duel with living two-dimensional chalk drawings — and hold the line at Nebrask against the wild chalklings.',
    x: 1080, y: 1300, r: 40,
    colors: { base: '#7a5a3a', mid: '#9a744a', glow: '#c89a66', accent: '#f0d0a0 ' },
    shards: [],
    magic: [
      { name: 'Rithmatics', blurb: 'Geometric chalk constructs — Lines of Warding, Forbiddance, and Vigor — brought to life by chosen duelists.' },
    ],
    seriesIds: [6],
  },
  {
    id: 'randland',
    universe: 'other',
    name: 'The Wheel of Time',
    system: 'Robert Jordan\'s world, completed by Sanderson',
    tagline: 'The Wheel weaves as the Wheel wills',
    description:
      'Brandon Sanderson completed Robert Jordan\'s epic after his passing, writing the final three volumes of the Last Battle between the Dragon Reborn and the Dark One.',
    x: 1450, y: 1230, r: 48,
    colors: { base: '#3a7a5a', mid: '#4a9a6e', glow: '#66c890', accent: '#a0f0c8' },
    shards: [],
    magic: [
      { name: 'The One Power', blurb: 'Saidin and saidar, the male and female halves of the True Source, woven into the elements by channelers.' },
    ],
    seriesIds: [9],
  },
];

// Hidden waypoint, revealed only once the reader finds Hoid on the chart.
export const SECRET_WORLD = {
  id: 'seventeenth-shard',
  universe: 'cosmere',
  name: 'The Seventeenth Shard',
  system: 'A Waypoint Between Worlds',
  tagline: 'For those who know to look',
  description:
    'Not a world at all, but a fellowship — worldhoppers who slip between the sixteen Shards, trading secrets in the space where realms touch. Hoid walks among them, though he keeps his own counsel. You found him; now you know they are out there.',
  x: -360, y: -240, r: 26,
  colors: { base: '#c9a84a', mid: '#e0c060', glow: '#ffe89a', accent: '#fff4c0' },
  shards: [],
  magic: [
    { name: 'Worldhopping', blurb: 'Crossing the cosmere through Shadesmar and the perpendicularities where the Physical and Cognitive Realms draw near.' },
    { name: 'The Ways of the Traveler', blurb: 'Disguise, patience, and a story for every occasion. Hoid has worn a hundred names.' },
  ],
  seriesIds: [],
  secret: true,
};

// Worldhopper paths — the threads that stitch the Cosmere together.
export const CONNECTIONS = [
  { from: 'yolen', to: 'sel', label: 'Hoid, the eternal worldhopper', curve: -60 },
  { from: 'yolen', to: 'lumar', label: 'Riina the Sorceress — a dragon far from home', curve: -50 },
  { from: 'sel', to: 'roshar', label: 'Hoid\'s path to the Shattered Plains', curve: -80 },
  { from: 'scadrial', to: 'roshar', label: 'Thaidakar and the Ghostbloods', curve: 70 },
  { from: 'nalthis', to: 'roshar', label: 'Vasher and Nightblood', curve: 40 },
  { from: 'roshar', to: 'canticle', label: 'Sigzil, the Sunlit Man', curve: 50 },
  { from: 'roshar', to: 'komashi', label: 'Design, a wandering Cryptic', curve: -40 },
  { from: 'roshar', to: 'lumar', label: 'Hoid, cursed by the Sorceress', curve: 60 },
  { from: 'scadrial', to: 'first-of-the-sun', label: 'The Ghostbloods hunt the Aviar', curve: -90 },
  { from: 'scadrial', to: 'taldain', label: 'Autonomy\'s designs span worlds', curve: 80 },
];

export function planetsFor(universeId) {
  return PLANETS.filter(p => p.universe === universeId);
}

export function planetById(id) {
  return PLANETS.find(p => p.id === id);
}

// Books belonging to a planet: match by series, then narrow by title when
// a catch-all series (Standalone Cosmere) spans multiple worlds.
export function booksForPlanet(planet, allBooks) {
  let books = allBooks.filter(b => planet.seriesIds.includes(b.series_id));
  if (planet.bookTitles) {
    books = books.filter(b => planet.bookTitles.includes(b.title));
  }
  return books;
}

// The world a book takes place on (inverse of booksForPlanet).
export function planetForBook(book) {
  return PLANETS.find(p =>
    p.seriesIds.includes(book.series_id) &&
    (!p.bookTitles || p.bookTitles.includes(book.title))
  ) || null;
}

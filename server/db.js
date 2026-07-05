// NOTE: Delete catalog.db to re-seed the database with fresh data.
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'catalog.db');
let db;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH);
    db.run('PRAGMA foreign_keys = ON');
  }
  return db;
}

function initDb() {
  const db = getDb();
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS series (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cosmere INTEGER DEFAULT 1
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        series_id INTEGER,
        series_order REAL,
        published_year INTEGER,
        synopsis TEXT,
        cover_url TEXT,
        cosmere INTEGER DEFAULT 1,
        FOREIGN KEY (series_id) REFERENCES series(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        FOREIGN KEY (book_id) REFERENCES books(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS places (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT,
        FOREIGN KEY (book_id) REFERENCES books(id)
      )
    `);

    // Migration: add places.type on databases created before it existed
    db.all('PRAGMA table_info(places)', (err, cols) => {
      if (err || cols.some(c => c.name === 'type')) return;
      db.run('ALTER TABLE places ADD COLUMN type TEXT', (aerr) => {
        if (aerr) return;
        const stmt = db.prepare('UPDATE places SET type = ? WHERE name = ?');
        for (const [name, type] of Object.entries(PLACE_TYPES)) stmt.run(type, name);
        stmt.finalize();
        console.log('Migrated: added place types');
      });
    });

    // Seed series
    db.get('SELECT COUNT(*) as count FROM series', (err, row) => {
      if (!err && row.count === 0) {
        const series = [
          ['The Stormlight Archive', 1],
          ['Mistborn: Original Trilogy', 1],
          ['Mistborn: Wax & Wayne', 1],
          ['Elantris', 1],
          ['Warbreaker', 1],
          ['The Rithmatist', 0],
          ['The Reckoners', 0],
          ['Skyward', 0],
          ['The Wheel of Time', 0],
          ['Standalone Cosmere', 1],
          ['Other', 0],
        ];
        const stmt = db.prepare('INSERT INTO series (name, cosmere) VALUES (?, ?)');
        series.forEach(([name, cosmere]) => stmt.run(name, cosmere));
        stmt.finalize();
        console.log('Seeded initial series data');
      }
    });

    // Seed books
    db.get('SELECT COUNT(*) as count FROM books', (err, row) => {
      if (!err && row.count === 0) {
        db.serialize(() => {
        const books = [
          // [title, series_id, series_order, published_year, synopsis, cover_url, cosmere]
          [
            'Elantris',
            4, 1, 2005,
            'In the shadow of the once-glorious city of Elantris, Prince Raoden is cursed with the Shaod and cast into its crumbling ruins. As his betrothed Sarene navigates deadly politics in the capital and a zealous priest threatens to conquer the nation, Raoden struggles to restore hope among the damned and uncover the secret behind Elantris\'s fall.',
            null, 1
          ],
          [
            'Mistborn: The Final Empire',
            2, 1, 2006,
            'In a world of ash and darkness ruled by the immortal Lord Ruler, a gifted street thief named Vin joins a crew of Allomancers led by the charismatic Kelsier in an audacious plan to overthrow the empire. As Vin discovers her extraordinary powers and infiltrates noble society, she uncovers secrets that could reshape the world.',
            null, 1
          ],
          [
            'Mistborn: The Well of Ascension',
            2, 2, 2007,
            'With the Lord Ruler dead, Elend Venture struggles to hold the city of Luthadel together as three rival armies converge on its walls. Vin must navigate political intrigue, a mysterious shapeshifting threat, and the legend of the Well of Ascension before an ancient evil is unleashed upon the world.',
            null, 1
          ],
          [
            'Mistborn: The Hero of Ages',
            2, 3, 2008,
            'As the world crumbles under ashfalls and deadly mists, Vin and Elend race to find the hidden caches left by the Lord Ruler and unlock the secret to defeating Ruin, a god-like force of destruction. The fate of all life hinges on understanding the true nature of the ancient prophecies and the role of the Hero of Ages.',
            null, 1
          ],
          [
            'Warbreaker',
            5, 1, 2009,
            'Two princesses from the austere highland kingdom of Idris are drawn into the colorful and politically treacherous court of Hallandren, where gods rule and magic is fueled by color and breath. As war looms between the two nations, alliances shift and secrets about the true nature of the Returned gods come to light.',
            null, 1
          ],
          [
            'The Gathering Storm',
            9, 12, 2009,
            'Rand al\'Thor hardens himself against the madness of saidin as Tarmon Gai\'don approaches, while Egwene al\'Vere works from within the White Tower to reunify the fractured Aes Sedai. The forces of the Shadow gather strength as the world teeters on the brink of the Last Battle.',
            null, 0
          ],
          [
            'The Way of Kings',
            1, 1, 2010,
            'On the war-torn Shattered Plains, Kaladin fights for survival as a bridge slave while the scholarly Shallan seeks to steal a fabrial from the renowned Jasnah Kholin. As ancient truths about the Knights Radiant resurface, Dalinar Kholin receives apocalyptic visions that may hold the key to saving Roshar from the coming Desolation.',
            null, 1
          ],
          [
            'Towers of Midnight',
            9, 13, 2010,
            'Perrin Aybara confronts the Whitecloak army and his own inner demons while Mat Cauthon ventures into the deadly Tower of Ghenjei to rescue Moiraine. With the Last Battle imminent, the heroes race to forge alliances and prepare the world for Tarmon Gai\'don.',
            null, 0
          ],
          [
            'The Alloy of Law',
            3, 1, 2011,
            'Three hundred years after the events of the original trilogy, the gunslinging lawman Waxillium Ladrian returns to the city of Elendel to take up his noble house\'s affairs. When a series of kidnappings and robberies plague the city, Wax and his irreverent partner Wayne are drawn into a conspiracy that blends Allomancy and Feruchemy with six-shooters.',
            null, 1
          ],
          [
            'A Memory of Light',
            9, 14, 2013,
            'The Last Battle has arrived as Rand al\'Thor leads the forces of Light against the Dark One at Shayol Ghul. Every nation and every hero must commit everything to this final stand, where the fate of the Pattern and all of existence hangs in the balance.',
            null, 0
          ],
          [
            'The Rithmatist',
            6, 1, 2013,
            'In an alternate America where magic is performed through chalk drawings called Rithmatics, non-Rithmatist student Joel Saxon becomes entangled in a mystery when Rithmatic students begin disappearing from his academy. Working alongside the eccentric Professor Fitch, Joel must unravel a conspiracy that threatens to unleash wild chalk creations upon the world.',
            null, 0
          ],
          [
            'Steelheart',
            7, 1, 2013,
            'In a world where superpowered beings called Epics have seized control and rule as tyrants, young David Charleston joins the Reckoners, a rebel group dedicated to assassinating Epics. David is obsessed with bringing down Steelheart, the seemingly invincible Epic who rules over the steel-encased city of Newcago and murdered David\'s father.',
            null, 0
          ],
          [
            'Words of Radiance',
            1, 2, 2014,
            'Shallan Davar journeys to the Shattered Plains to become Jasnah\'s ward while harboring a secret mission from the Ghostbloods. As Kaladin struggles with his new role protecting Dalinar and ancient Parshendi secrets emerge, the true scope of the Voidbringer threat begins to reveal itself and new Knights Radiant arise.',
            null, 1
          ],
          [
            'Firefight',
            7, 2, 2015,
            'David and the Reckoners travel to the flooded city of Babylon Restored, formerly Manhattan, to confront the powerful Epic known as Regalia. As David gets closer to the enigmatic Epic Firefight, he begins to question everything he believes about Epics and discovers that the secret to their weakness may change the world.',
            null, 0
          ],
          [
            'Shadows of Self',
            3, 2, 2015,
            'A shapeshifting kandra is murdering prominent citizens of Elendel, stoking class tensions that threaten to erupt into revolution. Wax must hunt down the killer while confronting uncomfortable truths about the city\'s governance and his own painful past with the woman he once loved.',
            null, 1
          ],
          [
            'The Bands of Mourning',
            3, 3, 2016,
            'Wax, Wayne, and Marasi pursue rumors of the legendary Bands of Mourning, a mythical metal mind said to grant the powers of the Lord Ruler himself. Their quest takes them to the remote city of New Seran and beyond, uncovering a secret society and technology that could reshape the Basin.',
            null, 1
          ],
          [
            'Calamity',
            7, 3, 2016,
            'David and the Reckoners launch their most dangerous mission yet: a direct assault on Calamity, the glowing red star that appeared in the sky and gave Epics their powers. As David\'s own Epic abilities begin to manifest, he must find a way to confront the source of all Epics before it destroys the world.',
            null, 0
          ],
          [
            'Oathbringer',
            1, 3, 2017,
            'Dalinar Kholin must unite the nations of Roshar against the Voidbringer invasion while confronting the terrible memories of his blood-soaked past as the Blackthorn. As the enemy occupies the holy city of Kholinar and the Unmade spread corruption, the Knights Radiant struggle to reclaim their legacy and find a path to victory.',
            null, 1
          ],
          [
            'Skyward',
            8, 1, 2018,
            'On the planet Detritus, humanity lives underground to survive alien attacks, and only fighter pilots stand between them and extinction. Spensa Nightshade, daughter of a disgraced pilot branded a coward, fights for her chance to fly and prove her father\'s innocence while uncovering the truth about the alien threat.',
            null, 0
          ],
          [
            'Starsight',
            8, 2, 2019,
            'Spensa infiltrates an alien space station to learn the secrets of faster-than-light travel and the true nature of the enemy that has kept humanity trapped on Detritus. Disguised among alien species, she discovers that the galaxy-spanning conflict is far more complex than anyone on Detritus imagined.',
            null, 0
          ],
          [
            'Rhythm of War',
            1, 4, 2020,
            'As the war between humans and singers escalates, Navani Kholin delves into the science of fabrial technology while trapped in an occupied Urithiru. Kaladin battles his own depression while defending the tower\'s unconscious Radiants, and Shallan confronts the Ghostbloods and her fractured identities in a struggle for Roshar\'s future.',
            null, 1
          ],
          [
            'Cytonic',
            8, 3, 2021,
            'Spensa ventures into the nowhere, a mysterious dimension outside normal space, to hunt the ancient Delver entities threatening the galaxy. Lost among strange fragments of civilizations and accompanied by unlikely allies, she must master her cytonic powers and confront the true nature of the Delvers before she can find her way home.',
            null, 0
          ],
          [
            'The Lost Metal',
            3, 4, 2022,
            'Wax and Wayne face their greatest challenge as a terrorist group called the Set threatens to detonate a weapon capable of destroying Elendel. With Harmony\'s power constrained and the fate of Scadrial hanging in the balance, the crew must confront enemies both mortal and divine in a desperate race against annihilation.',
            null, 1
          ],
          [
            'Tress of the Emerald Sea',
            10, 1, 2023,
            'A simple girl named Tress sets out across the deadly spore seas to rescue her beloved Charlie from the terrible Sorceress. Narrated by the worldhopper Hoid, this fairy-tale adventure follows Tress as she discovers her cleverness and courage aboard a pirate ship sailing oceans of living aether spores.',
            null, 1
          ],
          [
            'Yumi and the Nightmare Painter',
            10, 2, 2023,
            'Yumi, a spiritually gifted girl who stacks stones to summon spirits, and Nikaro, a painter who uses light to trap nightmares, find their lives mysteriously swapped across two very different worlds. As they struggle to understand their connection, they uncover a devastating truth about the nature of their realities.',
            null, 1
          ],
          [
            'The Sunlit Man',
            10, 3, 2023,
            'The cosmere wanderer Nomad crash-lands on a tidally locked planet where civilization must constantly flee the deadly sunlight that sweeps across its surface. Running from a relentless pursuer with ties to his past, Nomad becomes entangled with the local people\'s fight for freedom against their oppressive rulers.',
            null, 1
          ],
          [
            'Defiant',
            8, 4, 2023,
            'Spensa returns to Detritus for a final showdown as the Superiority\'s forces close in on humanity\'s last refuge. With her cytonic abilities and the alliances she\'s forged across the galaxy, she must lead the fight to secure humanity\'s place among the stars once and for all.',
            null, 0
          ],
          [
            'Wind and Truth',
            1, 5, 2024,
            'The contest of champions between Dalinar and Odium reaches its climax as the fate of Roshar hangs on a single duel. Szeth confronts his tortured past and the corruption within Shinovar, Kaladin faces his greatest personal trial, and the truth behind the Desolations and the Oathpact is finally revealed.',
            null, 1
          ],
        ];

        const stmt = db.prepare(
          'INSERT INTO books (title, series_id, series_order, published_year, synopsis, cover_url, cosmere) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        books.forEach(b => stmt.run(b[0], b[1], b[2], b[3], b[4], b[5], b[6]));
        stmt.finalize();
        console.log('Seeded initial books data');

        // Seed characters and places (inside serialize so books are committed first)
        seedCharacters(db);
        }); // end inner serialize
      }
    });
  });
}

// Category for every seeded place, keyed by exact name. Used both when
// seeding a fresh database and when migrating an existing one.
const PLACE_TYPES = {
  'Elantris': 'city',
  'Kae': 'city',
  'Fjorden': 'region',
  'Luthadel': 'city',
  'Kredik Shaw': 'landmark',
  'The Pits of Hathsin': 'landmark',
  'The Well of Ascension': 'landmark',
  'Terris': 'region',
  'Fadrex City': 'city',
  'Urteau': 'city',
  'The Kandra Homeland': 'region',
  'Hallandren': 'region',
  'T\'Telir': 'city',
  'Idris': 'region',
  'The White Tower': 'landmark',
  'Dragonmount': 'landmark',
  'Ebou Dar': 'city',
  'The Shattered Plains': 'region',
  'Kharbranth': 'city',
  'Urithiru': 'city',
  'The Tower of Ghenjei': 'landmark',
  'The Wolf Dream (Tel\'aran\'rhiod)': 'realm',
  'Caemlyn': 'city',
  'Elendel': 'city',
  'The Roughs': 'region',
  'Shayol Ghul': 'landmark',
  'Merrilor': 'region',
  'Thakan\'dar': 'region',
  'Armedius Academy': 'landmark',
  'Nebrask': 'region',
  'Newcago': 'city',
  'The Steel Catacombs': 'landmark',
  'Babylon Restored (Manhattan)': 'city',
  'Babilar': 'region',
  'The Governor\'s Mansion': 'landmark',
  'New Seran': 'city',
  'The Sovereign\'s Temple': 'landmark',
  'Ildithia': 'city',
  'The Sky': 'realm',
  'Kholinar': 'city',
  'Thaylen City': 'city',
  'Detritus': 'world',
  'Alta Base': 'landmark',
  'Igneous Caverns': 'region',
  'Starsight Station': 'landmark',
  'Shadesmar': 'realm',
  'Emul': 'region',
  'Lasting Integrity': 'city',
  'The Nowhere': 'realm',
  'The Pirate Domains': 'region',
  'Bilming': 'city',
  'The Emerald Sea': 'region',
  'The Rock': 'region',
  'The Sorceress\'s Island': 'region',
  'Torio': 'region',
  'Kilahito': 'city',
  'Canticle': 'world',
  'Beacon': 'city',
  'Shinovar': 'region',
  'The Spiritual Realm': 'realm',
};

function seedCharacters(db) {
  // Characters: [book_id, name, description]
  // Book IDs are sequential based on insert order above (1-28)
  const characters = [
    // 1 - Elantris
    [1, 'Raoden', 'Crown prince of Arelon who is cursed by the Shaod and cast into the fallen city of Elantris.'],
    [1, 'Sarene', 'Princess of Teod and Raoden\'s betrothed who arrives to find him presumed dead and must navigate Arelish politics.'],
    [1, 'Hrathen', 'High-ranking Derethi gyorn tasked with converting Arelon to Shu-Dereth within ninety days or see it destroyed.'],
    [1, 'Galladon', 'A gruff Dula man and Raoden\'s first friend in Elantris who helps him restore order among the fallen.'],

    // 2 - Mistborn: The Final Empire
    [2, 'Vin', 'A street urchin who discovers she is a powerful Allomancer and becomes central to the rebellion against the Lord Ruler.'],
    [2, 'Kelsier', 'A charismatic Mistborn thief and revolutionary who leads a crew in an impossible heist to overthrow the Final Empire.'],
    [2, 'Elend Venture', 'An idealistic young nobleman who reads forbidden books and dreams of a more just society.'],
    [2, 'Sazed', 'A Terris Keeper who collects and preserves the world\'s lost religions using his Feruchemical abilities.'],
    [2, 'The Lord Ruler', 'The immortal god-emperor who has ruled the Final Empire with absolute power for a thousand years.'],

    // 3 - Mistborn: The Well of Ascension
    [3, 'Vin', 'Now a legendary figure among the skaa, Vin struggles to protect Elend and the fledgling kingdom of Luthadel.'],
    [3, 'Elend Venture', 'The young king of Luthadel who must learn to be a leader as three armies besiege his city.'],
    [3, 'Zane', 'A mysterious and unstable Mistborn who serves Straff Venture and becomes obsessed with Vin.'],
    [3, 'OreSeur', 'A kandra bound by contract to serve Vin, taking on the bones and identity of a fallen friend.'],
    [3, 'Sazed', 'A Keeper whose faith is shaken as he searches for the truth behind the prophecies of the Hero of Ages.'],

    // 4 - Mistborn: The Hero of Ages
    [4, 'Vin', 'Now bearing the power of Preservation, Vin faces the ultimate battle against the god Ruin to save the world.'],
    [4, 'Elend Venture', 'Emperor and now a powerful Mistborn, Elend leads desperate campaigns to save the remnants of civilization.'],
    [4, 'Sazed', 'A Keeper who has lost his faith but holds the key to understanding the true nature of the world\'s creation.'],
    [4, 'TenSoon', 'A kandra of the Third Generation who defies his people\'s contract to warn them of Ruin\'s influence.'],
    [4, 'Ruin', 'The god of entropy and destruction who has been freed from his prison and seeks to unmake the world.'],

    // 5 - Warbreaker
    [5, 'Siri', 'The youngest Idrian princess sent to marry the God King of Hallandren in her sister\'s place.'],
    [5, 'Vivenna', 'An Idrian princess trained from birth for a political marriage who instead becomes a covert agent in Hallandren.'],
    [5, 'Lightsong', 'A witty and irreverent Returned god in Hallandren who doubts his own divinity and investigates a murder.'],
    [5, 'Vasher', 'A mysterious and dangerous swordsman who carries the legendary sentient sword Nightblood.'],
    [5, 'Susebron', 'The God King of Hallandren who holds immense Biochromatic power but has been kept mute and controlled by his priests.'],

    // 6 - The Gathering Storm
    [6, 'Rand al\'Thor', 'The Dragon Reborn who grows increasingly cold and ruthless as madness and the weight of destiny consume him.'],
    [6, 'Egwene al\'Vere', 'The captive Amyrlin Seat who works to reunify the White Tower from within as a prisoner of Elaida\'s regime.'],
    [6, 'Cadsuane Melaidhrin', 'A legendary Aes Sedai who attempts to keep Rand connected to his humanity before the Last Battle.'],
    [6, 'Aviendha', 'A former Maiden of the Spear and Wise One apprentice navigating her relationship with Rand and her Aiel duties.'],

    // 7 - The Way of Kings
    [7, 'Kaladin', 'A former soldier turned bridge slave whose leadership and emerging Surgebinding abilities inspire those around him.'],
    [7, 'Shallan Davar', 'A young scholar with a desperate secret who seeks to become the ward of the renowned Jasnah Kholin.'],
    [7, 'Dalinar Kholin', 'A highprince and uncle to the king who receives mysterious visions urging him to unite the warring Alethi.'],
    [7, 'Szeth-son-son-Vallano', 'The Assassin in White, a Shin man bound by his Oathstone to kill as his masters command.'],
    [7, 'Jasnah Kholin', 'A brilliant and fearless scholar-princess who researches the ancient Voidbringers and the Knights Radiant.'],

    // 8 - Towers of Midnight
    [8, 'Perrin Aybara', 'A wolfbrother and leader who must accept his nature and confront both Whitecloaks and the threat in the Wolf Dream.'],
    [8, 'Mat Cauthon', 'A roguish gambler and general who leads a daring mission into the Tower of Ghenjei to rescue Moiraine.'],
    [8, 'Moiraine Damodred', 'An Aes Sedai long thought dead who is rescued from the realm of the Aelfinn and Eelfinn.'],
    [8, 'Galad Damodred', 'The Lord Captain Commander of the Children of the Light who struggles with rigid morality in complex times.'],

    // 9 - The Alloy of Law
    [9, 'Waxillium Ladrian', 'A Twinborn lawman from the Roughs who reluctantly returns to Elendel to lead his noble house.'],
    [9, 'Wayne', 'Wax\'s eccentric partner and a skilled Slider and master of disguise with a complicated moral code.'],
    [9, 'Marasi Colms', 'A young law student and Wax\'s distant relative who is fascinated by the science of criminal investigation.'],
    [9, 'Miles Hundredlives', 'A former lawman turned criminal who can heal from any wound using his gold Compounding abilities.'],

    // 10 - A Memory of Light
    [10, 'Rand al\'Thor', 'The Dragon Reborn who leads humanity\'s forces in the final confrontation with the Dark One at Shayol Ghul.'],
    [10, 'Egwene al\'Vere', 'The Amyrlin Seat who commands the Aes Sedai in the Last Battle and discovers a powerful new weave.'],
    [10, 'Mat Cauthon', 'The Prince of the Ravens who serves as the supreme general of the forces of Light.'],
    [10, 'Perrin Aybara', 'A wolfbrother who fights Slayer in the Wolf Dream to protect the dreaming armies of the Light.'],
    [10, 'Lan Mandragoran', 'The uncrowned King of Malkier who leads a desperate charge against the Shadow\'s armies at Tarwin\'s Gap.'],

    // 11 - The Rithmatist
    [11, 'Joel Saxon', 'A non-Rithmatist student at Armedius Academy who is fascinated by Rithmatics and becomes caught up in a mystery.'],
    [11, 'Melody', 'A struggling Rithmatist student who becomes Joel\'s partner in investigating the disappearances at the academy.'],
    [11, 'Professor Fitch', 'A kind but meek Rithmatics professor who is demoted after losing a challenge and mentors Joel.'],
    [11, 'Inspector Harding', 'The investigator assigned to the case of the missing Rithmatist students at Armedius Academy.'],

    // 12 - Steelheart
    [12, 'David Charleston', 'A young man driven by a vendetta against Steelheart, the Epic who killed his father, armed with extensive research on Epic weaknesses.'],
    [12, 'Prof (Jonathan Phaedrus)', 'The mysterious leader of the Reckoners who harbors a dangerous secret about his own nature.'],
    [12, 'Megan', 'A Reckoner operative whose true identity and loyalties become increasingly complicated as David grows closer to her.'],
    [12, 'Steelheart', 'An immensely powerful Epic who transformed Chicago into Newcago and rules it with an iron fist from his steel tower.'],

    // 13 - Words of Radiance
    [13, 'Shallan Davar', 'A young woman with a traumatic past who infiltrates the Ghostbloods while developing her Lightweaving abilities.'],
    [13, 'Kaladin', 'A Windrunner struggling with his duty to protect Dalinar\'s family, including the king he despises.'],
    [13, 'Dalinar Kholin', 'The highprince working to reform Alethi society and forge a coalition against the Parshendi threat.'],
    [13, 'Adolin Kholin', 'Dalinar\'s son and a skilled duelist who fights to win Shardblades for his father\'s army.'],
    [13, 'Eshonai', 'A Parshendi Shardbearer and explorer who discovers a new form that could save or doom her people.'],

    // 14 - Firefight
    [14, 'David Charleston', 'A young Reckoner who travels to Babylon Restored and begins questioning his black-and-white view of Epics.'],
    [14, 'Megan (Firefight)', 'An Epic with illusion powers whose relationship with David challenges everything the Reckoners believe about Epics.'],
    [14, 'Prof (Jonathan Phaedrus)', 'The Reckoners\' leader who faces increasing strain from his secret Epic abilities as they operate in Babylon Restored.'],
    [14, 'Regalia', 'A powerful water-controlling Epic who rules Babylon Restored and has a mysterious connection to Prof.'],

    // 15 - Shadows of Self
    [15, 'Waxillium Ladrian', 'A lawman and nobleman torn between duty and personal loss as he hunts a shapeshifting killer through Elendel.'],
    [15, 'Wayne', 'Wax\'s loyal partner whose humor masks deep guilt over the man he killed before becoming a lawman.'],
    [15, 'Bleeder (Paalm)', 'A rogue kandra with a personal connection to Wax who seeks to free Scadrial from Harmony\'s control.'],
    [15, 'Marasi Colms', 'A constable who investigates the political dimensions of the murders plaguing Elendel.'],

    // 16 - The Bands of Mourning
    [16, 'Waxillium Ladrian', 'A Twinborn nobleman and lawman who leads an expedition to find the legendary Bands of Mourning.'],
    [16, 'Wayne', 'Wax\'s partner whose quick thinking and disguise skills prove essential on their journey beyond the Basin.'],
    [16, 'Marasi Colms', 'A constable whose analytical mind helps unravel the mystery of the Set and the Bands of Mourning.'],
    [16, 'Steris Harms', 'Wax\'s fiancee whose meticulous planning and preparation prove invaluable despite her social awkwardness.'],

    // 17 - Calamity
    [17, 'David Charleston', 'A young man manifesting Epic powers who must find a way to defeat Calamity and save those he loves.'],
    [17, 'Prof (Jonathan Phaedrus)', 'The former Reckoner leader consumed by his Epic abilities who becomes one of the most dangerous Epics alive.'],
    [17, 'Megan', 'David\'s Epic partner whose dimension-shifting abilities are key to reaching and confronting Calamity.'],
    [17, 'Abraham', 'A Reckoner demolitions expert and loyal friend who stands with David against impossible odds.'],

    // 18 - Oathbringer
    [18, 'Dalinar Kholin', 'A highprince whose terrible past as the Blackthorn threatens to destroy the coalition he has built against Odium.'],
    [18, 'Shallan Davar', 'A Lightweaver fracturing into multiple personas as she infiltrates the cult of the Unmade in Kholinar.'],
    [18, 'Kaladin', 'A Windrunner who returns to occupied Kholinar on a desperate mission to save the city and its people.'],
    [18, 'Jasnah Kholin', 'A scholar-queen who returns from the dead to lead Alethkar and challenge Odium\'s forces with ruthless intellect.'],
    [18, 'Venli', 'A singer scholar whose ambitions helped summon the Everstorm and who now questions the path of her people.'],

    // 19 - Skyward
    [19, 'Spensa Nightshade', 'A fierce and determined young pilot who fights for her right to fly despite her father\'s cowardly reputation.'],
    [19, 'Jorgen Weight', 'A by-the-book flightleader from a prominent family who clashes with Spensa\'s rebellious nature.'],
    [19, 'M-Bot', 'An ancient alien ship with a quirky AI personality that Spensa discovers hidden in a cavern on Detritus.'],
    [19, 'Cobb', 'A grizzled veteran pilot and instructor who agrees to train Spensa despite the political risks.'],

    // 20 - Starsight
    [20, 'Spensa Nightshade', 'A cytonic pilot who goes undercover at an alien space station to learn the secrets of faster-than-light travel.'],
    [20, 'Vapor', 'A mysterious alien ally who helps Spensa navigate the dangerous politics of the Superiority.'],
    [20, 'Brade', 'A human cytonic working for the Superiority who serves as Spensa\'s rival and foil.'],
    [20, 'Winzik', 'A seemingly affable alien bureaucrat who conceals dangerous ambitions within the Superiority\'s government.'],

    // 21 - Rhythm of War
    [21, 'Navani Kholin', 'A scholar-queen trapped in occupied Urithiru who makes groundbreaking discoveries about the nature of Light and sound.'],
    [21, 'Kaladin', 'A Windrunner battling severe depression and trauma while defending unconscious Radiants in the occupied tower.'],
    [21, 'Shallan Davar', 'A Lightweaver confronting the Ghostbloods and Mraize while struggling to integrate her fractured identities.'],
    [21, 'Venli', 'A singer Radiant secretly bonded to a spren who works to free her people from Odium\'s control.'],
    [21, 'Raboniel', 'The Lady of Wishes, an ancient Fused scholar who occupies Urithiru and pursues the secret of anti-Light.'],

    // 22 - Cytonic
    [22, 'Spensa Nightshade', 'A cytonic pilot lost in the nowhere dimension who must find allies and master her powers to return home.'],
    [22, 'Doomslug', 'Spensa\'s alien companion whose cytonic abilities prove more important than anyone realized.'],
    [22, 'Chet', 'A mysterious guide in the nowhere who helps Spensa navigate the strange fragments of lost civilizations.'],

    // 23 - The Lost Metal
    [23, 'Waxillium Ladrian', 'A Twinborn lawman who must sacrifice everything to stop the Set from destroying Elendel with a devastating weapon.'],
    [23, 'Wayne', 'Wax\'s irreplaceable partner who faces his ultimate test of courage and selflessness in the fight against the Set.'],
    [23, 'Marasi Colms', 'A senator and investigator who uncovers the Set\'s connection to the malevolent god Autonomy.'],
    [23, 'Harmony (Sazed)', 'The god of Scadrial who is constrained by his dual nature of Ruin and Preservation, unable to act directly.'],

    // 24 - Tress of the Emerald Sea
    [24, 'Tress', 'A clever and resourceful window-washer from a small island who crosses deadly spore seas to save her beloved.'],
    [24, 'Hoid', 'The cosmere\'s most famous worldhopper who narrates the story and serves as the ship\'s cabin boy.'],
    [24, 'Captain Crow', 'The ruthless and cunning captain of the Crow\'s Song who exploits her crew through fear and manipulation.'],
    [24, 'Fort', 'A deaf crew member and Tress\'s loyal friend who communicates through written notes.'],
    [24, 'Charlie', 'Tress\'s beloved, a king\'s son who has been cursed and imprisoned by the Sorceress.'],

    // 25 - Yumi and the Nightmare Painter
    [25, 'Yumi', 'A yoki-hijo from a land of spirits who spends her days in ritual stone-stacking to summon beneficial spirits.'],
    [25, 'Nikaro (Painter)', 'A nightmare painter in the dark city of Kilahito who uses light to capture and neutralize nightmares.'],
    [25, 'Design', 'A cryptic spren who assists Hoid and provides commentary on the unfolding events.'],
    [25, 'Hoid', 'The cosmere worldhopper who narrates the tale and plays a crucial role in the story\'s resolution.'],

    // 26 - The Sunlit Man
    [26, 'Nomad (Sigzil)', 'A cosmere worldhopper fleeing a relentless pursuer who crash-lands on a planet where sunlight is deadly.'],
    [26, 'Elegy', 'A determined young woman from the Ember faction who helps Nomad and fights for her people\'s freedom.'],
    [26, 'The Cinder King', 'The tyrannical ruler of the planet who controls access to shelter from the deadly sunlight.'],
    [26, 'Auxiliary', 'Nomad\'s companion knight who can transform into a weapon and is running dangerously low on Investiture.'],

    // 27 - Defiant
    [27, 'Spensa Nightshade', 'A cytonic pilot who returns home to lead humanity\'s last stand against the Superiority\'s invasion.'],
    [27, 'Jorgen Weight', 'A flightleader and cytonic who has been leading Detritus\'s defense in Spensa\'s absence.'],
    [27, 'M-Bot', 'The AI companion who has evolved beyond his original programming and faces questions about his own nature.'],
    [27, 'Vapor', 'An alien ally whose knowledge of the Superiority proves vital in the final conflict.'],

    // 28 - Wind and Truth
    [28, 'Dalinar Kholin', 'A Bondsmith who faces Odium\'s champion in a contest that will determine the fate of Roshar.'],
    [28, 'Szeth-son-son-Vallano', 'A Skybreaker who returns to Shinovar to confront the leaders who declared him Truthless and uncovers deep corruption.'],
    [28, 'Kaladin', 'A Windrunner who faces his most personal trial yet and must find a new path forward beyond the battlefield.'],
    [28, 'Shallan Davar', 'A Lightweaver who works to finally integrate her identities and confront the truths of her past.'],
    [28, 'Sigzil', 'A former Windrunner and Bridge Four member who takes on the mantle of Herald in the struggle against Odium.'],
  ];

  const charStmt = db.prepare('INSERT INTO characters (book_id, name, description) VALUES (?, ?, ?)');
  characters.forEach(c => charStmt.run(c[0], c[1], c[2]));
  charStmt.finalize();
  console.log('Seeded initial characters data');

  // Seed places
  const places = [
    // 1 - Elantris
    [1, 'Elantris', 'The once-glorious city of the gods, now a crumbling ruin filled with cursed and broken inhabitants.'],
    [1, 'Kae', 'The capital city of Arelon, built in the shadow of Elantris and seat of political power.'],
    [1, 'Fjorden', 'The powerful eastern empire that seeks to conquer Arelon through religious conversion.'],

    // 2 - Mistborn: The Final Empire
    [2, 'Luthadel', 'The capital of the Final Empire, a sprawling city of ash-covered streets divided between noble keeps and skaa slums.'],
    [2, 'Kredik Shaw', 'The Hill of a Thousand Spires, the Lord Ruler\'s imposing palace at the heart of Luthadel.'],
    [2, 'The Pits of Hathsin', 'A brutal prison mine where the Lord Ruler sends his worst enemies to harvest atium.'],

    // 3 - Mistborn: The Well of Ascension
    [3, 'Luthadel', 'The newly freed capital now besieged by three armies and struggling to establish a new government.'],
    [3, 'The Well of Ascension', 'A legendary pool of concentrated divine power hidden beneath Luthadel that draws Vin to its depths.'],
    [3, 'Terris', 'The mountainous homeland of the Keepers and Feruchemists, targeted for destruction by the Lord Ruler.'],

    // 4 - Mistborn: The Hero of Ages
    [4, 'Fadrex City', 'A western dominance city that holds one of the Lord Ruler\'s supply caches and is controlled by a stubborn king.'],
    [4, 'Urteau', 'A canal city in the northern dominance where skaa revolutionaries have overthrown the nobility.'],
    [4, 'The Kandra Homeland', 'The underground cavern system where the kandra live and guard their sacred trust from the Lord Ruler.'],

    // 5 - Warbreaker
    [5, 'Hallandren', 'A vibrant tropical kingdom ruled by Returned gods, known for its color-rich culture and Biochromatic magic.'],
    [5, 'T\'Telir', 'The capital city of Hallandren and seat of the Court of Gods where the Returned hold power.'],
    [5, 'Idris', 'An austere highland kingdom that values restraint and muted colors, perpetually in tension with Hallandren.'],

    // 6 - The Gathering Storm
    [6, 'The White Tower', 'The headquarters of the Aes Sedai in Tar Valon, currently divided by internal strife under Elaida\'s rule.'],
    [6, 'Dragonmount', 'The volcanic mountain near Tar Valon where Rand al\'Thor has a pivotal moment of crisis and revelation.'],
    [6, 'Ebou Dar', 'A southern city occupied by the Seanchan empire where Mat Cauthon navigates dangerous politics.'],

    // 7 - The Way of Kings
    [7, 'The Shattered Plains', 'A vast expanse of plateaus separated by deep chasms where the Alethi wage war against the Parshendi.'],
    [7, 'Kharbranth', 'A city of scholars built into cliffs above the sea, home to the great Palanaeum library.'],
    [7, 'Urithiru', 'The legendary tower city of the Knights Radiant, long lost and sought by Dalinar through his visions.'],

    // 8 - Towers of Midnight
    [8, 'The Tower of Ghenjei', 'A featureless metal tower that serves as a gateway to the realm of the Aelfinn and Eelfinn.'],
    [8, 'The Wolf Dream (Tel\'aran\'rhiod)', 'The world of dreams where Perrin battles Slayer and learns to master his wolfbrother abilities.'],
    [8, 'Caemlyn', 'The capital of Andor, threatened by Shadowspawn armies using a Waygate inside the city.'],

    // 9 - The Alloy of Law
    [9, 'Elendel', 'The grand capital city of the Elendel Basin, built in the image of the old world with canals and modern industry.'],
    [9, 'The Roughs', 'The frontier regions beyond the Elendel Basin where Wax served as a lawman for twenty years.'],

    // 10 - A Memory of Light
    [10, 'Shayol Ghul', 'The mountain stronghold of the Dark One in the Blasted Lands where the final battle is waged.'],
    [10, 'Merrilor', 'The Field of Merrilor where the rulers of all nations gather for the last council before Tarmon Gai\'don.'],
    [10, 'Thakan\'dar', 'The valley beneath Shayol Ghul where Myrddraal blades are forged and the armies of Shadow gather.'],

    // 11 - The Rithmatist
    [11, 'Armedius Academy', 'A prestigious school where both Rithmatic and non-Rithmatic students study on the isle of New Britannia.'],
    [11, 'Nebrask', 'The wild island territory where Rithmatists serve mandatory terms defending against the wild chalk creatures.'],

    // 12 - Steelheart
    [12, 'Newcago', 'The steel-encased ruins of Chicago, transformed by Steelheart\'s powers and ruled by him as a personal kingdom.'],
    [12, 'The Steel Catacombs', 'The underground tunnels beneath Newcago where ordinary humans live and the Reckoners maintain their hidden base.'],

    // 13 - Words of Radiance
    [13, 'The Shattered Plains', 'The warfront where Alethi highprinces compete for gemhearts and where ancient secrets lie buried.'],
    [13, 'Urithiru', 'The rediscovered tower city of the Knights Radiant, reached through the ancient Oathgate network.'],
    [13, 'Shadesmar', 'The Cognitive Realm where spren live and the landscape mirrors the physical world in strange ways.'],

    // 14 - Firefight
    [14, 'Babylon Restored (Manhattan)', 'The flooded ruins of Manhattan transformed into a vibrant water-city by the Epic Regalia\'s powers.'],
    [14, 'Babilar', 'The colorful neighborhoods built atop the submerged skyscrapers of Manhattan by its resilient inhabitants.'],

    // 15 - Shadows of Self
    [15, 'Elendel', 'The Basin\'s capital city now roiling with class tensions between the workers and the elite.'],
    [15, 'The Governor\'s Mansion', 'The seat of political power in Elendel where the conspiracy behind the murders converges.'],

    // 16 - The Bands of Mourning
    [16, 'New Seran', 'A smaller city outside the Basin where Wax uncovers the Set\'s activities and their connections to the Bands.'],
    [16, 'The Sovereign\'s Temple', 'A hidden southern temple where the legendary Bands of Mourning are rumored to be stored.'],

    // 17 - Calamity
    [17, 'Ildithia', 'A city built on a moving platform of salt that slowly grinds across the landscape, formerly Atlanta.'],
    [17, 'The Sky', 'The mysterious realm in the upper atmosphere where Calamity orbits and the final confrontation takes place.'],

    // 18 - Oathbringer
    [18, 'Urithiru', 'The tower city serving as the coalition\'s headquarters, ancient and full of undiscovered secrets.'],
    [18, 'Kholinar', 'The capital of Alethkar, occupied by enemy forces and corrupted by the Unmade.'],
    [18, 'Thaylen City', 'A merchant city on the southern coast where the coalition makes its stand against Odium\'s forces.'],

    // 19 - Skyward
    [19, 'Detritus', 'A planet encased in layers of ancient space platforms where the remnants of humanity hide underground.'],
    [19, 'Alta Base', 'The military installation where Skyward Flight trains and launches missions against the Krell.'],
    [19, 'Igneous Caverns', 'The underground caves where human civilization has rebuilt after being driven from the surface.'],

    // 20 - Starsight
    [20, 'Starsight Station', 'A massive alien space station that serves as the diplomatic hub of the Superiority.'],
    [20, 'Detritus', 'Humanity\'s home planet still under siege while Spensa undertakes her undercover mission.'],

    // 21 - Rhythm of War
    [21, 'Urithiru', 'The tower city occupied by Fused forces where Navani conducts her research and Kaladin fights a guerrilla war.'],
    [21, 'Emul', 'A Rosharan nation where the coalition fights pitched battles against the singer armies.'],
    [21, 'Lasting Integrity', 'A spren city in Shadesmar where honorspren put humanity on trial for breaking their oaths.'],

    // 22 - Cytonic
    [22, 'The Nowhere', 'A strange dimension outside normal space filled with fragments of lost civilizations and hostile entities.'],
    [22, 'The Pirate Domains', 'Territories within the nowhere controlled by various factions surviving among reality fragments.'],

    // 23 - The Lost Metal
    [23, 'Elendel', 'The Basin capital threatened with destruction by the Set\'s devastating weapon.'],
    [23, 'Bilming', 'A coastal city outside the Basin where the Set has built their base of operations and weapon.'],

    // 24 - Tress of the Emerald Sea
    [24, 'The Emerald Sea', 'A vast ocean of verdant aether spores that sprout deadly vines when touched by water.'],
    [24, 'The Rock', 'Tress\'s tiny home island surrounded by the spore sea, ruled by a local duke.'],
    [24, 'The Sorceress\'s Island', 'The lair of the dreaded Sorceress at the center of the deadly Midnight Sea.'],

    // 25 - Yumi and the Nightmare Painter
    [25, 'Torio', 'A land of vibrant spirits and hot springs where yoki-hijo perform sacred rituals of stone-stacking.'],
    [25, 'Kilahito', 'A dark city perpetually shrouded in shadow where nightmare painters protect the populace from manifested nightmares.'],

    // 26 - The Sunlit Man
    [26, 'Canticle', 'A tidally locked planet where civilization must keep moving to stay ahead of the deadly sunlight.'],
    [26, 'Beacon', 'A mobile city on Canticle that moves along tracks to escape the advancing sunlight.'],

    // 27 - Defiant
    [27, 'Detritus', 'Humanity\'s planet-fortress now facing the full might of the Superiority\'s invasion force.'],
    [27, 'The Nowhere', 'The cytonic dimension that Spensa has learned to navigate and use as a strategic advantage.'],

    // 28 - Wind and Truth
    [28, 'Shinovar', 'The isolated western land of Roshar where Szeth confronts the corrupt leaders who branded him Truthless.'],
    [28, 'Urithiru', 'The tower city serving as the seat of the coalition and site of the contest of champions.'],
    [28, 'The Spiritual Realm', 'The realm of Connection and identity where the deepest truths of the cosmere are revealed.'],
  ];

  const placeStmt = db.prepare('INSERT INTO places (book_id, name, description, type) VALUES (?, ?, ?, ?)');
  places.forEach(p => placeStmt.run(p[0], p[1], p[2], PLACE_TYPES[p[1]] || null));
  placeStmt.finalize();
  console.log('Seeded initial places data');
}

// Promisify helpers for cleaner async usage
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => err ? reject(err) : resolve(row));
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function(err) {
      err ? reject(err) : resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

module.exports = { initDb, getDb, dbAll, dbGet, dbRun };

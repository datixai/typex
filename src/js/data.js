/* XTyping content: words, passages and the lesson path. All text is original. */
(function () {
  const WORDS = (
    'a as ask all add ads had has had lad sad dad fall fad lass glad flask salad hall ' +
    'the and for are but not you all any can her was one our out day get has him his how man new now old see two way who boy did its let put say she too use ' +
    'that with have this will your from they know want been good much some time very when come here just like long make many more only over such take than them well were ' +
    'about after again below could every first found great house large learn never other place right small sound spell still study their there these thing think three water where which world would write ' +
    'jade fake keg leg led red fed seed deed feed free tree three greed edge hedge ledge kid kids skid lid slid fig jig dig ride side slide hide fire tire wire dire ' +
    'sure rule true blue glue rude dude rust just trust dust fuse duke yes yet try dry fly sky shy say stay play gray tray ' +
    'work word world wood wool wolf two town tower power low slow flow glow show snow row tow ' +
    'quiet quick queen quite equal pique pop top stop shop drop crop paper proper happy apple people ' +
    'cat cut cup cap cook code cold cool cake clock catch class clean ' +
    'move love live give five vote very even never seven over cover river silver ' +
    'mix six fix box fox next text exit exam extra ' +
    'zoo zone zero size prize maze lazy crazy dozen ' +
    'big bag bed bee bus but bit best both bring brown build began ' +
    'need name nice note nine noon nose near none north ' +
    'office team plan goal skill speed focus learn lesson practice keyboard finger screen mouse email report meeting project ' +
    'today morning evening friend family people simple better faster steady calm smart bright future'
  ).split(/\s+/).filter((w, i, a) => w && a.indexOf(w) === i);

  const PASSAGES = [
    'Good typing starts with a calm posture. Sit back, keep your feet flat and let your wrists float just above the keys. Rest your fingers on the home row and look at the screen, not your hands. Speed will come later; first build clean and steady habits.',
    'The small town woke up slowly. A baker opened the shutters, the smell of fresh bread drifted down the street, and the first bus rolled past the park. By eight o\'clock the square was busy with people, bicycles and the soft noise of morning talk.',
    'A good meeting has a clear goal, a short list of points and a time limit. Share the plan before it starts, invite only the people who need to be there, and write the next steps down before anyone leaves the room. Short meetings respect everyone.',
    'Rivers carve their way through rock one drop at a time. Nothing about the water looks strong, yet over many years it shapes valleys and canyons. Practice works in the same way: a few focused minutes each day add up to a skill that feels natural.',
    'To send a clear email, start with a short subject that says what you need. Keep the first line direct, put details in small paragraphs and end with the action you expect. Read it once before you press send, and fix any typing mistakes.',
    'The night sky over the desert was full of stars. With no city lights nearby, the Milky Way stretched from one edge of the horizon to the other. The travellers sat around a small fire, drank sweet tea and told stories until the coals turned grey.',
    'Computers follow instructions exactly as they are written. A missing comma or a wrong letter can stop a whole program. That is why careful typing matters for people who write code, reports or data: accuracy saves time that would be spent hunting for errors.',
    'Healthy habits are easier to keep when they are small. Drink a glass of water when you wake up, take a short walk after lunch and stretch your hands between long typing sessions. Your body works better when you give it regular breaks.',
    'The library was quiet except for the turning of pages. Tall shelves held books about history, science, poetry and travel. A student in the corner was taking notes on a laptop, her fingers moving quickly and smoothly across the keys without a pause.',
    'Every expert was once a beginner who did not give up. The first week of touch typing can feel slow, because your fingers are learning new paths. Trust the process, keep your eyes on the screen and celebrate each small gain in speed and accuracy.',
    'Mountains change the weather around them. Warm air rises up the slopes, cools and turns into clouds, so one side of a range can be green and wet while the other side stays dry. Farmers in the valleys plan their crops around these patterns.',
    'A tidy desk helps a busy mind. Keep only what you need for the task in front of you: a keyboard, a mouse, a notebook and a cup of tea. Clear the rest away at the end of each day so the next morning starts fresh and focused.',
  ];

  const SENTENCES = [
    'Keep your eyes on the screen.', 'Practice a little every day.', 'Small steps lead to big results.', 'Rest your fingers on the home row.',
    'Accuracy first, then speed.', 'The quick brown fox jumps over the lazy dog.', 'Good posture makes typing easier.', 'Take a short break every hour.',
    'Each key has its own finger.', 'Typing is a skill anyone can learn.', 'Read the next word before you type it.', 'Stay relaxed and breathe slowly.',
  ];

  const CODE = [
    'const total = items.reduce((sum, x) => sum + x.price, 0);',
    'if (score >= 90) { grade = "A"; } else { grade = "B"; }',
    'for (let i = 0; i < list.length; i++) { print(list[i]); }',
    'def greet(name): return f"Hello, {name}!"',
    'SELECT name, email FROM users WHERE active = 1;',
    '<div class="card"><h2>Title</h2><p>Text</p></div>',
    'user.age = parseInt(input.value, 10) || 0;',
    'arr = [x * 2 for x in range(10) if x % 2 == 0]',
  ];

  const WEB = ['info@example.com', 'www.example.org', 'https://learn.example.com/start', 'team.lead@company.net', 'support@help.example', 'http://localhost:8080/home', 'my_name_2024@mail.com', 'docs.example.com/guide?page=2'];

  const NUMTEXT = [
    'The meeting is on 12/05 at 10:30 in room 204.', 'Order 4589 costs 1,250 and ships in 3 days.', 'Call 0300 555 0199 before 6 pm.',
    'We sold 375 units in March and 418 in April.', 'Flight 762 leaves at 07:45 from gate 19.', 'The budget grew by 15% to 92,000 this year.',
  ];

  // Lesson path. keys = new keys introduced, kind = generator type.
  const TRACKS = [
    {
      id: 'beginner', name: 'Beginner', desc: 'Learn every letter key, row by row.', color: '#34d399',
      lessons: [
        ['Home row: F and J', 'fj'], ['Home row: D and K', 'dk'], ['Home row: S and L', 'sl'], ['Home row: A and ;', 'a;'],
        ['Home row review', '', 'review'], ['G and H', 'gh'], ['E and I', 'ei'], ['R and U', 'ru'], ['T and Y', 'ty'],
        ['W and O', 'wo'], ['Q and P', 'qp'], ['Top row review', '', 'review'], ['C and comma', 'c,'], ['V and M', 'vm'],
        ['X and period', 'x.'], ['Z and slash', 'z/'], ['B and N', 'bn'], ['Bottom row review', '', 'review'],
        ['Shift keys: capitals', '', 'shift'], ['All letters: common words', '', 'words'],
      ],
    },
    {
      id: 'intermediate', name: 'Intermediate', desc: 'Numbers, punctuation and real sentences.', color: '#60a5fa',
      lessons: [
        ['Numbers 1 and 2', '12'], ['Numbers 3 and 4', '34'], ['Numbers 5 and 6', '56'], ['Numbers 7 and 8', '78'], ['Numbers 9 and 0', '90'],
        ['Number row review', '', 'numreview'], ['Apostrophe and quotes', '\'"'], ['Question and exclamation', '?!'], ['Hyphen and colon', '-:'],
        ['Popular words', '', 'words'], ['Short sentences', '', 'sentences'], ['Numbers in text', '', 'numtext'],
      ],
    },
    {
      id: 'advanced', name: 'Advanced', desc: 'Symbols, paragraphs, web and code.', color: '#f472b6',
      lessons: [
        ['@ # $', '@#$'], ['% ^ &', '%^&'], ['* ( )', '*()'], ['_ + =', '_+='], ['[ ] { }', '[]{}'], ['< > \\ |', '<>\\|'], ['~ and `', '~`'],
        ['Emails and web links', '', 'web'], ['Paragraph practice', '', 'paragraph'], ['Code typing', '', 'code'], ['Speed paragraph', '', 'paragraph'],
      ],
    },
    {
      id: 'numpad', name: 'Number Pad', desc: 'Ten-key typing for data entry.', color: '#fbbf24', numpad: true,
      lessons: [
        ['Numpad home: 4 5 6', '456'], ['Numpad top: 7 8 9', '789'], ['Numpad bottom: 1 2 3', '123'], ['Zero and decimal', '0.'],
        ['Operators + - * /', '+-*/'], ['Numpad review', '', 'npreview'],
      ],
    },
  ];

  function rnd(n) { return Math.floor(Math.random() * n); }
  function pick(a) { return a[rnd(a.length)]; }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function groups(chars, count, min = 2, max = 4) {
    const out = [];
    for (let i = 0; i < count; i++) {
      const len = min + rnd(max - min + 1);
      let g = '';
      for (let k = 0; k < len; k++) g += pick(chars);
      out.push(g);
    }
    return out.join(' ');
  }

  function wordsFrom(allowed, count) {
    const set = new Set(allowed);
    const pool = WORDS.filter((w) => [...w].every((c) => set.has(c)));
    const letters = [...allowed].filter((c) => /[a-z]/.test(c));
    const out = [];
    for (let i = 0; i < count; i++) {
      if (pool.length >= 6) out.push(pick(pool));
      else out.push(groups(letters, 1, 3, 5));
    }
    return out.join(' ');
  }

  function capitalWords(count) {
    return shuffle(WORDS).slice(0, count).map((w, i) => (i % 2 === 0 ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
  }

  function symbolMix(keys, count) {
    const out = [];
    for (let i = 0; i < count; i++) {
      const s = pick([...keys]);
      const w = pick(WORDS.filter((x) => x.length < 6));
      out.push(pick([s + w, w + s, s + s, w + s + w.slice(0, 2)]));
    }
    return out.join(' ');
  }

  // Build the screens of a lesson (each screen is one line block of text).
  function buildLesson(trackId, index) {
    const track = TRACKS.find((t) => t.id === trackId);
    const [title, keys, kind] = track.lessons[index];
    let known = '';
    if (trackId === 'beginner') {
      known = track.lessons.slice(0, index + 1).map((l) => l[1]).join('');
    }
    let screens = [];
    const k = [...keys];
    switch (kind) {
      case 'review': screens = [groups(known, 10, 2, 4), wordsFrom(known + ' ', 12), wordsFrom(known, 14)]; break;
      case 'shift': screens = [capitalWords(10), capitalWords(12), pick(SENTENCES) + ' ' + pick(SENTENCES)]; break;
      case 'words': screens = [shuffle(WORDS).slice(0, 12).join(' '), shuffle(WORDS).slice(0, 14).join(' '), shuffle(WORDS).slice(0, 14).join(' ')]; break;
      case 'sentences': screens = [0, 1, 2].map(() => shuffle(SENTENCES).slice(0, 2).join(' ')); break;
      case 'numtext': screens = shuffle(NUMTEXT).slice(0, 3); break;
      case 'numreview': screens = [groups('1234567890', 10, 2, 4), groups('1234567890', 10, 3, 5), NUMTEXT[rnd(NUMTEXT.length)]]; break;
      case 'web': screens = [0, 1, 2].map(() => shuffle(WEB).slice(0, 3).join(' ')); break;
      case 'code': screens = shuffle(CODE).slice(0, 3); break;
      case 'paragraph': screens = [pick(PASSAGES)]; break;
      case 'npreview': screens = [groups('0123456789', 12, 2, 4), groups('0123456789.+-*/', 12, 2, 4), groups('0123456789', 12, 3, 5)]; break;
      default:
        if (trackId === 'beginner') {
          screens = [groups(k, 10, 2, 4), groups(known, 10, 2, 4), wordsFrom(known, 12)];
        } else if (trackId === 'numpad') {
          const prior = track.lessons.slice(0, index + 1).map((l) => l[1]).join('');
          screens = [groups(k, 12, 2, 4), groups(prior, 12, 2, 4), groups(prior, 10, 3, 5)];
        } else if (/\d/.test(keys)) {
          screens = [groups(k, 10, 2, 4), wordsFrom('abcdefghijklmnopqrstuvwxyz', 6) + ' ' + groups(k, 6, 2, 3), groups('1234567890'.slice(0, '1234567890'.indexOf(k[1]) + 1), 10, 2, 4)];
        } else {
          screens = [groups(k, 10, 1, 3), symbolMix(keys, 10), symbolMix(keys, 12)];
        }
    }
    return { trackId, index, title, keys, kind: kind || 'keys', screens, numpad: !!track.numpad };
  }

  function testText(source, custom) {
    if (source === 'custom' && custom && custom.trim()) return custom.trim().replace(/\s+/g, ' ');
    if (source === 'words') return shuffle(WORDS).concat(shuffle(WORDS)).join(' ');
    if (source === 'code') return shuffle(CODE).join(' ');
    return shuffle(PASSAGES).join(' ');
  }

  window.XTData = { WORDS, PASSAGES, SENTENCES, TRACKS, buildLesson, testText, shuffle, pick };
})();

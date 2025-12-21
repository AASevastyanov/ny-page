// Расписание: Дверь 1 открыта сегодня, Двери 2-4 открываются в 12:00 местного времени в следующие дни.
// Режим доверия: используется время устройства.

const MS_DAY = 24 * 60 * 60 * 1000;
const MS_HOUR = 60 * 60 * 1000;

const LS = {
  start: "nym_startMidnight",
  solved: "nym_solved",
  frags: "nym_frags",
  introSeen: "nym_introSeen",
  heatPrev: "nym_heatPrev",

  day1: "nym_day1",
  day2: "nym_day2",
  day3: "nym_day3",
  day4: "nym_day4",
};

const state = {
  startMidnight: Number(localStorage.getItem(LS.start)) || 0,
  solved: JSON.parse(localStorage.getItem(LS.solved) || "{}"),
  frags: JSON.parse(localStorage.getItem(LS.frags) || "{}"),
  heatPrev: Number(localStorage.getItem(LS.heatPrev) || "NaN"),
};

function saveBase() {
  localStorage.setItem(LS.start, String(state.startMidnight));
  localStorage.setItem(LS.solved, JSON.stringify(state.solved));
  localStorage.setItem(LS.frags, JSON.stringify(state.frags));
  localStorage.setItem(LS.heatPrev, String(state.heatPrev));
}

function ensureStart() {
  if (!state.startMidnight) {
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
    state.startMidnight = midnight.getTime();
    saveBase();
  }
}

function unlockAt(day) {
  ensureStart();
  if (day <= 1) return 0;
  return state.startMidnight + 12 * MS_HOUR + (day - 1) * MS_DAY;
}

function openDay() {
  ensureStart();
  const now = Date.now();
  let d = 1;
  for (let day = 2; day <= 4; day++) {
    if (now >= unlockAt(day)) d = day;
  }
  return d;
}

function msToUnlock(day) {
  if (day <= 1) return 0;
  return Math.max(0, unlockAt(day) - Date.now());
}

function fmtMs(ms) {
  const s = Math.ceil(ms / 1000);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${hh}ч ${mm}м ${ss}с`;
}

function fmtDate(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}`;
}

// Views
const beginBtn = document.getElementById("beginBtn");
const skipIntroBtn = document.getElementById("skipIntroBtn");

const doorsRow = document.getElementById("doorsRow");
const fragsEl = document.getElementById("frags");

const hintsDlg = document.getElementById("hintsDlg");
const hintsBody = document.getElementById("hintsBody");
const closeHintsBtn = document.getElementById("closeHintsBtn");
const hintsBtn = document.getElementById("hintsBtn");
const resetBtn = document.getElementById("resetBtn");

const backToHubBtn = document.getElementById("backToHubBtn");
const doorHintsBtn = document.getElementById("doorHintsBtn");
const roomNameEl = document.getElementById("roomName");
const stepInfoEl = document.getElementById("stepInfo");
const panelTitleEl = document.getElementById("panelTitle");
const contentEl = document.getElementById("content");

const stepDots = Array.from(document.querySelectorAll(".stepDot"));


const musicBtn = document.getElementById("musicBtn");
const volSlider = document.getElementById("volSlider");
const bgm = document.getElementById("bgm");



// Положи свои mp3 в assets/music/ и пропиши имена тут
const PLAYLIST = [
  "assets/music/track1.mp3",
  "assets/music/track2.mp3",
  "assets/music/track3.mp3",
  "assets/music/track4.mp3",
  "assets/music/track5.mp3"
];

const VOL_KEY = "nym_volume";
let currentIndex = -1;

function clamp01(x) { return Math.max(0, Math.min(1, x)); }

function loadVolume() {
  const saved = localStorage.getItem(VOL_KEY);
  if (saved === null) return 0.30; // 30% по умолчанию
  const v = Number(saved);
  return Number.isFinite(v) ? clamp01(v) : 0.30;
}

function applyVolume(v01) {
  const v = clamp01(v01);
  if (bgm) bgm.volume = v;
  if (volSlider) volSlider.value = String(Math.round(v * 100));
  localStorage.setItem(VOL_KEY, String(v));
}

function pickRandomIndex() {
  if (PLAYLIST.length <= 1) return 0;
  let i = Math.floor(Math.random() * PLAYLIST.length);
  if (i === currentIndex) i = (i + 1) % PLAYLIST.length;
  return i;
}

function setPlayingUI(isPlaying) {
  if (!musicBtn) return;
  musicBtn.classList.toggle("playing", isPlaying);
  musicBtn.textContent = isPlaying ? "⏸" : "♪";
  musicBtn.title = isPlaying ? "Пауза" : "Включить случайную песню";
}

async function playRandom() {
  if (!bgm || PLAYLIST.length === 0) return;
  currentIndex = pickRandomIndex();
  bgm.src = PLAYLIST[currentIndex];
  try {
    await bgm.play();
    setPlayingUI(true);
  } catch (e) {
    setPlayingUI(false);
    console.error(e);
  }
}

function toggleMusic() {
  if (!bgm || PLAYLIST.length === 0) return;
  if (bgm.paused) playRandom();
  else { bgm.pause(); setPlayingUI(false); }
}

// init volume to 30% (or saved)
applyVolume(loadVolume());

if (volSlider) {
  volSlider.addEventListener("input", () => {
    applyVolume(Number(volSlider.value) / 100);
  });
}

if (musicBtn) {
  musicBtn.addEventListener("click", toggleMusic);
  setPlayingUI(false);
}

if (bgm) {
  bgm.addEventListener("ended", () => { playRandom(); });
  bgm.addEventListener("pause", () => { setPlayingUI(false); });
  bgm.addEventListener("play", () => { setPlayingUI(true); });
}


function setView(v) {
  document.body.dataset.view = v;
}

function setDoor(day) {
  document.body.dataset.door = String(day);
}

function setStep(step, total = 3) {
  document.body.dataset.step = String(step);
  document.body.dataset.stepTotal = String(total);

  stepDots.forEach((dot) => {
    const i = Number(dot.dataset.i);
    dot.classList.remove("on", "done", "off");

    if (i > total) {
      dot.classList.add("off");
      return;
    }

    if (i < step) dot.classList.add("done");
    if (i === step) dot.classList.add("on");
  });

  stepInfoEl.textContent = `${step}/${total}`;
}


function renderHud() {
  // на новой верстке в хедере остались только "Фрагменты"
  fragsEl.textContent = [1, 2, 3]
    .map((d) => (state.frags[d] ? state.frags[d] : "_"))
    .join(" ");
}

function giveFrag(day, fragDigit) {
  state.frags[day] = String(fragDigit);
  saveBase();
  renderHud();
}


function award(day, fragDigit) {
  state.solved[day] = true;
  if (fragDigit !== undefined) state.frags[day] = String(fragDigit);

  // сбрасываем "режим повтора", если он был включен
  const dayKeys = { 1: LS.day1, 2: LS.day2, 3: LS.day3, 4: LS.day4 };
  const mk = dayKeys[day];
  try {
    const obj = JSON.parse(localStorage.getItem(mk) || "{}");
    if (obj && obj.replay) {
      delete obj.replay;
      localStorage.setItem(mk, JSON.stringify(obj));
    }
  } catch {}

  saveBase();
  renderHud();
  renderDoors();
}

function resetAll() {
  if (!confirm("Сбросить весь прогресс?")) return;
  Object.values(LS).forEach((k) => localStorage.removeItem(k));
  location.reload();
}
function renderHints() {
  const od = openDay();
  const lines = [];

  lines.push(`<p><b>Расписание:</b> Дверь 1 открыта сегодня. Двери 2-4 открываются в 12:00.</p>`);
  lines.push(`<div class="hr"></div>`);

  if (od >= 1) lines.push(`<p><b>Дверь 1:</b> лишний предмет, фотопазл 4x4, викторина (нужно 8 из 10).</p>`);
  if (od >= 2) lines.push(`<p><b>Дверь 2:</b> загадки (4 из 5), отличия (5 штук), память (собери слово).</p>`);
  if (od >= 3) lines.push(`<p><b>Дверь 3:</b> найди 3 улики, 3 раунда виселицы, кто вор, пазл, квиз про парня (4 из 5).</p>`);
  if (od >= 4) lines.push(`<p><b>Дверь 4:</b> анаграмма, кодовый замок, финальная фраза.</p>`);

  lines.push(`<div class="hr"></div>`);

  return lines.join("");
}

function openHints() {
  hintsBody.innerHTML = renderHints();
  hintsDlg.showModal();
}

function closeHints() {
  hintsDlg.close();
}

closeHintsBtn.onclick = closeHints;
hintsBtn.onclick = openHints;
doorHintsBtn.onclick = openHints;
resetBtn.onclick = resetAll;

backToHubBtn.onclick = () => {
  setView("hub");
  setDoor(0);
  setStep(0);
};

beginBtn.onclick = () => {
  localStorage.setItem(LS.introSeen, "1");
  setView("hub");
};

skipIntroBtn.onclick = () => setView("hub");

// Doors
const doors = [
  {
    day: 1,
    name: "Уютная мастерская",
    desc: "Доска миссий: лишний предмет, фотопазл, викторина.",
    frag: "3",
    run: runDay1,
  },
  {
    day: 2,
    name: "Галерея снежинок",
    desc: "Загадки, найди отличия, кто что любит, найди слова, память с буквами.",
    frag: "7",
    run: runDay2,
  },
  {
    day: 3,
    name: "Комната тайного детектива",
    desc: "Найди 3 улики, виселица, мини-квиз про парня.",
    frag: "1",
    run: runDay3,
  },
  {
    day: 4,
    name: "Сейф финального подарка",
    desc: "Анаграмма, кодовый замок, финальная фраза.",
    frag: "OK",
    run: runDay4,
  },
];

function renderDoors() {
  const od = openDay();
  doorsRow.innerHTML = "";

  doors.forEach((d) => {
    const locked = d.day > od;

    const card = document.createElement("button");
    card.type = "button";
    card.className = "doorHit";
    card.dataset.d = String(d.day);
    card.disabled = locked;

    card.innerHTML = locked
      ? `
        <div class="doorStatus">
          <span class="badge locked">Закрыто</span>
          <span class="badge locked timer" data-day="${
            d.day
          }">Откроется через ${fmtMs(msToUnlock(d.day))}</span>
        </div>
      `
      : `
        <div class="doorStatus">
          <span class="badge open">Открыто</span>
        </div>
      `;

    card.onclick = () => {
      if (locked) return;
      setView("door");
      setDoor(d.day);
      roomNameEl.textContent = d.name;
      d.run();
    };

    doorsRow.appendChild(card);
  });
}

function updateDoorTimers() {
  const timers = document.querySelectorAll(".timer[data-day]");
  timers.forEach((el) => {
    const day = Number(el.dataset.day);
    el.textContent = `Откроется через ${fmtMs(msToUnlock(day))}`;
  });
}

// Tick
let lastOpenDay = -1;

function tick() {
  renderHud();

  const od = openDay();
  if (od !== lastOpenDay) {
    lastOpenDay = od;
    renderDoors();
  } else {
    updateDoorTimers();
  }
}
tick();
setInterval(tick, 1000);

// старт
if (localStorage.getItem(LS.introSeen) === "1") setView("hub");
else setView("intro");

// -----------------------------
// Дверь 1
// -----------------------------
function runDay1() {
  panelTitleEl.textContent = "Дверь 1 - Уютная мастерская";
  const memKey = LS.day1;
  const saved = JSON.parse(localStorage.getItem(memKey) || "{}");
  const step = saved.step || 1;

  const replay = !!saved.replay;

  if (state.solved[1] && !replay) {
    setStep(3);
    contentEl.innerHTML = `
      <div class="board">
        <h3 class="boardTitle">Уже пройдено</h3>
        <p class="small">Фрагмент дня: <b>${state.frags[1]}</b></p>
        <button class="btn ghost" id="redo1" type="button">Пройти уровень снова</button>
      </div>
    `;
    document.getElementById("redo1").onclick = () => {
      localStorage.setItem(memKey, JSON.stringify({ step: 1, replay: true }));
      runDay1();
    };
    return;
  }

  if (step === 1) d1_step1(memKey);
  if (step === 2) d1_step2(memKey);
  if (step === 3) d1_step3(memKey);
}

function d1_save(memKey, step, extra = {}) {
  const prev = JSON.parse(localStorage.getItem(memKey) || "{}");
  const next = { ...prev, ...extra, step };
  localStorage.setItem(memKey, JSON.stringify(next));
}

function d1_step1(memKey) {
  setStep(1);

  const options = [
    { icon: "🎁", text: "Подарок", ok: false },
    { icon: "🎄", text: "Елка", ok: false },
    { icon: "🧤", text: "Варежки", ok: false },
    { icon: "❄️", text: "Снег", ok: false },
    { icon: "⛄", text: "Снеговик", ok: false },
    { icon: "☀️", text: "Солнце", ok: true },
  ];

  contentEl.innerHTML = `
    <div class="board">
      <h3 class="boardTitle">Шаг 1 - Лишний предмет</h3>
      <p class="small">Выбери значок, который меньше всего подходит к зимнему празднику.</p>
      <div class="cardGrid" id="d1grid"></div>
      <p id="d1msg" class="small"></p>
    </div>
  `;

  const grid = document.getElementById("d1grid");
  const msg = document.getElementById("d1msg");

  options.forEach((o) => {
    const c = document.createElement("div");
    c.className = "choiceCard";
    c.innerHTML = `<div class="choiceIcon">${o.icon}</div><div class="choiceText">${o.text}</div>`;
    c.onclick = () => {
      if (o.ok) {
        msg.innerHTML = `<b style="color:var(--green)">Верно.</b> Солнце не относится к зимним символам праздника.`;
        setTimeout(() => {
          d1_save(memKey, 2);
          runDay1();
        }, 700);
      } else {
        msg.innerHTML = `<b style="color:var(--red)">Неа.</b> Подумай, что точно не про зиму.`;
      }
    };
    grid.appendChild(c);
  });
}

function d1_step2(memKey) {
  setStep(2);

  contentEl.innerHTML = `
    <div class="board">
      <h3 class="boardTitle">Шаг 2 - Фотопазл (4x4)</h3>
      <p class="small">Меняй местами кусочки: нажми на два тайла, чтобы поменять их.</b>.</p>

      <div class="canvasWrap">
        <canvas id="puz" width="480" height="480"></canvas>

        <div style="max-width:360px">
          <div class="row">
            <button class="btn" id="shuffle">Перемешать</button>
            <button class="btn" id="check">Проверить</button>
            <button class="btn ghost" id="skip">Я собрала, дальше</button>
          </div>
          <p id="pmsg" class="small"></p>
          <div class="hr"></div>
          <p class="small">Совет: начни с центра, потом углы и края.</p>
        </div>
      </div>
    </div>
  `;

  const canvas = document.getElementById("puz");
  const ctx = canvas.getContext("2d");
  const N = 4;
  const tile = canvas.width / N;

  const img = new Image();
  img.src = "assets/photo.jpg";

  let tiles = [...Array(N * N).keys()];
  let selected = null;
  tiles = shuffle(tiles);

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let pos = 0; pos < tiles.length; pos++) {
      const idx = tiles[pos];

      const sx = (idx % N) * (img.width / N);
      const sy = Math.floor(idx / N) * (img.height / N);
      const sw = img.width / N;
      const sh = img.height / N;

      const dx = (pos % N) * tile;
      const dy = Math.floor(pos / N) * tile;

      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, tile, tile);

      ctx.strokeStyle = "rgba(30,35,40,.15)";
      ctx.lineWidth = 2;
      ctx.strokeRect(dx + 0.5, dy + 0.5, tile, tile);

      if (selected === pos) {
        ctx.strokeStyle = "rgba(209,169,73,.95)";
        ctx.lineWidth = 5;
        ctx.strokeRect(dx + 2, dy + 2, tile - 4, tile - 4);
      }
    }
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function solved() {
    return tiles.every((v, i) => v === i);
  }

  function posFromXY(x, y) {
    const cx = Math.floor(x / tile);
    const cy = Math.floor(y / tile);
    return cy * N + cx;
  }

  canvas.addEventListener("click", (e) => {
    if (!img.complete) return;
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (canvas.width / r.width);
    const y = (e.clientY - r.top) * (canvas.height / r.height);

    const pos = posFromXY(x, y);
    if (pos < 0 || pos >= tiles.length) return;

    if (selected === null) selected = pos;
    else if (selected === pos) selected = null;
    else {
      [tiles[selected], tiles[pos]] = [tiles[pos], tiles[selected]];
      selected = null;
    }
    draw();
  });

  document.getElementById("shuffle").onclick = () => {
    tiles = shuffle(tiles);
    selected = null;
    draw();
  };

  document.getElementById("check").onclick = () => {
    const msg = document.getElementById("pmsg");
    if (solved()) {
      msg.innerHTML = `<b style="color:var(--green)">Красота.</b> Пазл собран.`;
      setTimeout(() => {
        d1_save(memKey, 3);
        runDay1();
      }, 700);
    } else {
      msg.innerHTML = `<b style="color:var(--red)">Еще нет.</b> Чуть-чуть осталось.`;
    }
  };

  document.getElementById("skip").onclick = () => {
    d1_save(memKey, 3);
    runDay1();
  };

  img.onload = () => draw();
  img.onerror = () => {
    document.getElementById(
      "pmsg"
    ).innerHTML = `<b style="color:var(--red)">Фото не найдено.</b> Положи картинку в <b>assets/photo.jpg</b>.`;
  };
}

function d1_step3(memKey) {
  setStep(3);

  const quiz = day1QuizData();
  contentEl.innerHTML = `
    <div class="board">
      <h3 class="boardTitle">Шаг 3 - Уютная викторина (10 вопросов)</h3>
      <p class="small">Нужно набрать минимум 8 из 10, чтобы получить фрагмент дня.</p>
      <form id="q1"></form>
      <div class="row">
        <button class="btn primary" id="q1btn" type="button">Проверить</button>
        <span id="q1msg" class="small"></span>
      </div>
    </div>
  `;

  const form = document.getElementById("q1");
  form.innerHTML = quiz
    .map(
      (q, i) => `
    <div class="quizQ">
      <div class="q">${i + 1}. ${q.q}</div>
      ${q.a
        .map(
          (a, j) => `
        <label><input type="radio" name="q${i}" value="${j}"> ${a}</label>
      `
        )
        .join("")}
    </div>
  `
    )
    .join("");

  document.getElementById("q1btn").onclick = () => {
    let score = 0;
    for (let i = 0; i < quiz.length; i++) {
      const v = document.querySelector(`input[name="q${i}"]:checked`);
      if (!v) {
        document.getElementById("q1msg").textContent = "Ответь на все вопросы.";
        return;
      }
      if (Number(v.value) === quiz[i].ok) score++;
    }
    const msg = document.getElementById("q1msg");
    if (score >= 8) {
      msg.innerHTML = `<b style="color:var(--green)">Пройдено.</b> ${score}/10. Фрагмент: <b>${doors[0].frag}</b>`;
      award(1, doors[0].frag);
    } else {
      msg.innerHTML = `<b style="color:var(--red)">Мало.</b> ${score}/10 (нужно 8).`;
    }
  };
}

function day1QuizData() {
  return [
    { q: "Какой напиток у меня больше всего про уютный зимний вечер?", a: ["Какао", "Чай с лимоном", "Газировка", "Кофе"], ok: 0 },
    { q: "Если на улице снегопад, я скорее:", a: ["Кайфую от атмосферы", "Сразу думаю о делах и пробках", "Ищу где потеплее и пережидаю", "Стараюсь не выходить без причины"], ok: 0 },
    { q: "Что я чаще всего покупаю в декабре первым делом?", a: ["Вкусняшки", "Новые носки", "Украшения для дома", "Подарочные пакеты"], ok: 2 },
    { q: "Мой стиль новогоднего украшения дома ближе к:", a: ["Минимализм - несколько красивых акцентов", "Только елка и пару шариков", "Максимум огней - гирлянды везде", "Украшаю по настроению, без системы"], ok: 2 },
    { q: "Что мне важнее в празднике?", a: ["Атмосфера", "Идеальные фотки", "Чтобы было максимально дорого", "Чтобы все прошло тихо и незаметно"], ok: 0 },
    { q: "Каток зимой для меня - это:", a: ["Настроение и веселье, даже если не идеально катаюсь", "Только если все друзья идут", "Мне интереснее смотреть, чем выходить на лед", "Скорее не мое, но могу попробовать"], ok: 0 },
    { q: "Мой подход к планам на Новый год:", a: ["Есть общий план, но без фанатизма", "Спонтанно - как пойдет", "Люблю четкий тайминг и список дел", "Предпочитаю, чтобы кто-то другой организовал"], ok: 0 },
    { q: "Подарки я больше люблю:", a: ["Сюрпризы", "Строго по списку", "Мне все равно", "Только если практично"], ok: 0 },
    { q: "Когда холодно, я чаще:", a: ["Сразу ищу где согреться", "Ворчу на мороз и ускоряюсь", "Терплю молча", "Делаю вид, что все нормально"], ok: 0 },
    { q: "Если нужно быстро создать новогоднюю атмосферу, я выберу:", a: ["Гирлянду", "Музыку", "Аромат/свечу", "Елочные игрушки"], ok: 0 },
  ];
}

// -----------------------------
// Дверь 2
// -----------------------------
function runDay2() {
  panelTitleEl.textContent = "Дверь 2 - Галерея снежинок";
  const memKey = LS.day2;
  const saved = JSON.parse(localStorage.getItem(memKey) || "{}");
  const step = saved.step || 1;

  const TOTAL = 5;
  const replay = !!saved.replay;

  if (state.solved[2] && !replay) {
    setStep(TOTAL, TOTAL);
    contentEl.innerHTML = `
      <div class="board">
        <h3 class="boardTitle">Уже пройдено</h3>
        <p class="small">Фрагмент дня: <b>${state.frags[2]}</b></p>
        <button class="btn ghost" id="redo2" type="button">Пройти уровень снова</button>
      </div>
    `;
    document.getElementById("redo2").onclick = () => {
      localStorage.setItem(memKey, JSON.stringify({ step: 1, replay: true }));
      runDay2();
    };
    return;
  }

  if (openDay() < 2) {
    setStep(1, TOTAL);
    contentEl.innerHTML = `<div class="board"><h3 class="boardTitle">Пока закрыто</h3><p class="small">Эта дверь откроется в 12:00.</p></div>`;
    return;
  }

  if (step === 1) d2_step1(memKey);
  if (step === 2) d2_step2(memKey);
  if (step === 3) d2_step3(memKey);
  if (step === 4) d2_step4(memKey);
  if (step === 5) d2_step5(memKey);
}


function d2_save(memKey, step, extra = {}) {
  const prev = JSON.parse(localStorage.getItem(memKey) || "{}");
  const next = { ...prev, ...extra, step };
  localStorage.setItem(memKey, JSON.stringify(next));
}

function d2_step1(memKey) {
  setStep(1, 5);


  const riddles = [
    {
      q: "На елке есть, но не игрушка. Светится, но не огонь. Что это?",
      a: "гирлянда",
    },
    {
      q: "Падает зимой, но не дождь. Белое, но не молоко. Что это?",
      a: "снег",
    },
    { q: "Сладкое, часто дарят в коробке. Что это?", a: "конфеты" },
    { q: "Приходит раз в год, все ждут. Что это?", a: "новый год" },
    { q: "Круглое, холодное, зимнее. Что это?", a: "снежок" },
  ];

  contentEl.innerHTML = `
    <div class="board">
      <h3 class="boardTitle">Шаг 1 - Разминка-загадки (5)</h3>
      <p class="small">Введи короткие ответы. Нужно минимум 4 из 5.</p>
      <div id="r2"></div>
      <div class="row">
        <button class="btn primary" id="r2btn">Проверить</button>
        <span id="r2msg" class="small"></span>
      </div>
    </div>
  `;

  const host = document.getElementById("r2");
  host.innerHTML = riddles
    .map(
      (x, i) => `
    <div class="quizQ">
      <div class="q">${i + 1}. ${x.q}</div>
      <input id="r2in${i}" placeholder="ответ" />
    </div>
  `
    )
    .join("");

  document.getElementById("r2btn").onclick = () => {
    let ok = 0;
    for (let i = 0; i < riddles.length; i++) {
      const v = (document.getElementById(`r2in${i}`).value || "")
        .trim()
        .toLowerCase();
      if (v === riddles[i].a) ok++;
    }
    const msg = document.getElementById("r2msg");
    if (ok >= 4) {
      msg.innerHTML = `<b style="color:var(--green)">Пройдено.</b> ${ok}/5`;
      setTimeout(() => {
        d2_save(memKey, 2);
        runDay2();
      }, 650);
    } else {
      msg.innerHTML = `<b style="color:var(--red)">Пока нет.</b> ${ok}/5 (нужно 4).`;
    }
  };
}

function d2_step2(memKey) {
  setStep(2, 5);


  const LEFT_IMG = "assets/diff-left.jpg";
  const RIGHT_IMG = "assets/diff-right.jpg";
  const NEED = 7;

  // Включи, чтобы по клику показывало координаты (ты по ним и выставишь hotspots)
  const DEBUG_COORDS = true;

  // ВАЖНО: hotspots теперь в координатах правого фото (naturalWidth/naturalHeight)
  const hotspots = [
    { x: 691, y: 487, r: 80 },
    { x: 436, y: 131, r: 80 },
    { x: 1436, y: 789, r: 60 },
    { x: 1141, y: 793, r: 60 },
    { x: 1237, y: 837, r: 60 },
    { x: 955, y: 834, r: 60 },
    { x: 1443, y: 114, r: 60 },
  ];

  const found = new Set();

  contentEl.innerHTML = `
    <div class="board">
      <h3 class="boardTitle">Шаг 2 - Найди отличия</h3>
      <p class="small">Нажимай на отличия на <b>правой</b> картинке. Нужно найти ${NEED}.</p>
      <div class="row">
        <span class="badge locked">Найдено: <b id="dfN">0</b>/${NEED}</span>
        <span id="dfMsg" class="small"></span>
      </div>

      <div class="diffRow">
        <div class="diffCard">
          <img id="dfLeftImg" src="${LEFT_IMG}" alt="Эталон">
          <div class="diffLabel">Эталон</div>
        </div>

        <div class="diffCard" id="dfRightCard">
          <img id="dfRightImg" src="${RIGHT_IMG}" alt="Ищи отличия">
          <div class="diffLabel">Ищи отличия</div>
          <div class="diffMarks" id="dfMarks"></div>
          <div class="diffOverlay" id="dfOverlay" aria-label="Поле клика"></div>
        </div>
      </div>

      <div class="row">
        <button class="btn primary" id="dfDone">Дальше</button>
      </div>
    </div>`;
  const dfN = document.getElementById("dfN");
  const dfMsg = document.getElementById("dfMsg");
  const rightImg = document.getElementById("dfRightImg");
  const overlay = document.getElementById("dfOverlay");
  const marks = document.getElementById("dfMarks");

  let BASE_W = 0;
  let BASE_H = 0;

  function ensureBaseSize() {
    if (rightImg.naturalWidth && rightImg.naturalHeight) {
      BASE_W = rightImg.naturalWidth;
      BASE_H = rightImg.naturalHeight;
    }
  }

  rightImg.addEventListener("load", ensureBaseSize);
  ensureBaseSize();

  function getImageXY(evt) {
    const rect = overlay.getBoundingClientRect();
    const x = (evt.clientX - rect.left) * (BASE_W / rect.width);
    const y = (evt.clientY - rect.top) * (BASE_H / rect.height);
    return { x, y, rect };
  }

  function addRing(h) {
    const ring = document.createElement("div");
    ring.className = "markRing";

    const leftPct = (h.x / BASE_W) * 100;
    const topPct = (h.y / BASE_H) * 100;
    const wPct = ((h.r * 2) / BASE_W) * 100;
    const hPct = ((h.r * 2) / BASE_H) * 100;

    ring.style.left = leftPct + "%";
    ring.style.top = topPct + "%";
    ring.style.width = wPct + "%";
    ring.style.height = hPct + "%";

    marks.appendChild(ring);
  }

  overlay.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    ensureBaseSize();
    if (!BASE_W || !BASE_H) return;

    const { x, y } = getImageXY(e);

    if (DEBUG_COORDS) {
      dfMsg.innerHTML = `<span class="small">Координаты: <b>${Math.round(x)}</b>, <b>${Math.round(y)}</b></span>`;
      console.log("DIFF CLICK:", Math.round(x), Math.round(y), "BASE:", BASE_W, BASE_H);
    }

    let hit = -1;
    for (let i = 0; i < hotspots.length; i++) {
      if (found.has(i)) continue;
      const h = hotspots[i];
      const dx = x - h.x;
      const dy = y - h.y;
      const R = (h.r ?? 18);
      if (dx * dx + dy * dy <= R * R) { hit = i; break; }
    }

    if (hit === -1) {
      dfMsg.innerHTML = `<b style="color:var(--red)">Мимо.</b>`;
      return;
      }

    found.add(hit);
    dfN.textContent = String(found.size);
    dfMsg.innerHTML = `<b style="color:var(--green)">Нашла.</b>`;

    addRing(hotspots[hit]);
  }, { passive: false });

  document.getElementById("dfDone").onclick = () => {
    if (found.size >= NEED) {
      setTimeout(() => {
        d2_save(memKey, 3);
        runDay2();
      }, 650);
    } else {
      dfMsg.innerHTML = `<b style="color:var(--red)">Надо все ${NEED}.</b>`;
    }
  };
}



function postcardScene(isRight) {
  const starFill = isRight ? "rgba(209,169,73,.95)" : "rgba(31,35,40,.18)";
  const ballFill = isRight ? "rgba(47,125,87,.70)" : "rgba(195,66,63,.70)";
  const garlandPath = isRight
    ? "M120 120 C 170 90, 230 90, 300 120"
    : "M120 120 C 170 80, 230 80, 300 120";
  const giftFill = isRight ? "rgba(195,66,63,.60)" : "rgba(106,167,216,.55)";
  const snowmanMouth = isRight
    ? `<rect x="285" y="240" width="30" height="4" rx="2" fill="rgba(31,35,40,.35)"/>`
    : `<circle cx="300" cy="240" r="3" fill="rgba(31,35,40,.35)"/>`;

  return `
    <polygon points="170,270 260,270 215,150" fill="rgba(47,125,87,.18)" stroke="rgba(47,125,87,.28)"/>
    <polygon points="180,268 250,268 215,185" fill="rgba(47,125,87,.22)" stroke="rgba(47,125,87,.28)"/>

    <path d="${garlandPath}" fill="none" stroke="rgba(209,169,73,.70)" stroke-width="3"/>
    <circle cx="220" cy="160" r="12" fill="${ballFill}"/>

    <polygon points="315,92 323,112 345,112 327,124 334,145 315,133 296,145 303,124 285,112 307,112" fill="${starFill}"/>

    <rect x="140" y="245" width="34" height="26" rx="6" fill="${giftFill}"/>
    <rect x="155" y="242" width="6" height="32" fill="rgba(209,169,73,.85)"/>

    <circle cx="300" cy="270" r="18" fill="rgba(255,255,255,.70)"/>
    <circle cx="300" cy="242" r="14" fill="rgba(255,255,255,.65)"/>
    <circle cx="295" cy="240" r="2" fill="rgba(31,35,40,.35)"/>
    <circle cx="305" cy="240" r="2" fill="rgba(31,35,40,.35)"/>
    ${snowmanMouth}
  `;
}


function d2_step3(memKey) {
  setStep(3, 5);

  // Поменяй пути под свои файлы:
  const girlPhoto = "assets/love/girl.png"; // фото девушки (слева)
  const mePhoto = "assets/love/me.png";     // твое фото (справа)

  // Картинки под словами: assets/love/<key>.png
  const items = [
    { key: "mandarin", label: "мандарин", who: "d" },
    { key: "choco", label: "шоколадки", who: "d" },
    { key: "burger", label: "бургер", who: "m" },
    { key: "grapes", label: "большой виноград", who: "d" },
    { key: "sprite", label: "спрайт", who: "m" },
    { key: "snow", label: "снег", who: "m" },
    { key: "candle", label: "свечка", who: "d" },
    { key: "mmdms", label: "mmdms", who: "d" },
    { key: "gifts", label: "находить подарки", who: "d" },
    { key: "goodmix", label: "goodmix", who: "m" },
  ];

  let idx = 0;
  const picks = [];
  const chips = [];

  contentEl.innerHTML = `
    <div class="board">
      <h3 class="boardTitle">Шаг 3 - Кто что любит (10 слов)</h3>
      <p class="small">Смотри на слово и картинку - кликни по мешку слева к Снегурочке или справа к Дед Морозу, куда это положить.</p>

      <div class="loveWrap">
        <div class="loveSide">
          <img class="lovePhoto" src="${girlPhoto}" alt="девушка">
          <div class="bagSlot" id="slotD" role="button" aria-label="мешок девушки">
            <div class="bagTitle">Снегурочка</div>
            <div class="bagChips" id="chipsD"></div>
          </div>
        </div>

        <div class="loveCenter">
          <div class="loveCard">
            <div class="loveTop">
              <img id="loveImg" class="loveItemImg" alt="">
            </div>
            <div class="loveWord" id="loveWord"></div>

            <div class="row">
              <span class="badge locked">Слова: <b id="loveCount">0</b>/10</span>
              <button class="btn ghost" id="undoLove" type="button">Отменить последний</button>
            </div>

            <div id="loveMsg" class="small"></div>
            <div class="hr"></div>

            <button class="btn" id="checkLove" type="button" style="display:none">Проверить</button>
            <button class="btn ghost" id="retryLove" type="button" style="display:none">Начать заново</button>
          </div>
        </div>

        <div class="loveSide">
          <img class="lovePhoto" src="${mePhoto}" alt="я">
          <div class="bagSlot" id="slotM" role="button" aria-label="мой мешок">
            <div class="bagTitle">Дед Мороз</div>
            <div class="bagChips" id="chipsM"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  const slotD = document.getElementById("slotD");
  const slotM = document.getElementById("slotM");
  const chipsD = document.getElementById("chipsD");
  const chipsM = document.getElementById("chipsM");
  const loveImg = document.getElementById("loveImg");
  const loveWord = document.getElementById("loveWord");
  const loveCount = document.getElementById("loveCount");
  const loveMsg = document.getElementById("loveMsg");
  const undoBtn = document.getElementById("undoLove");
  const checkBtn = document.getElementById("checkLove");
  const retryBtn = document.getElementById("retryLove");

  function curImgSrc(it) {
    return `assets/love/${it.key}.png`;
  }

  function renderCurrent() {
    const it = items[idx];
    loveImg.src = curImgSrc(it);
    loveImg.alt = it.label;
    loveWord.textContent = it.label;
    loveCount.textContent = String(idx);
    loveMsg.textContent = `Слово ${idx + 1} из ${items.length}`;
  }

  function addChip(side, label) {
    const el = document.createElement("span");
    el.className = "chip";
    el.textContent = label;
    if (side === "d") chipsD.appendChild(el);
    else chipsM.appendChild(el);
    chips.push({ side, el });
  }

  function place(side) {
    if (idx >= items.length) return;

    const it = items[idx];
    picks.push({ key: it.key, pick: side, correct: it.who, label: it.label });
    addChip(side, it.label);

    idx++;
    loveCount.textContent = String(idx);

    if (idx >= items.length) {
      loveMsg.innerHTML = `<b>Все слова разложены.</b> Нажми "Проверить".`;
      loveImg.style.display = "none";
      loveWord.style.display = "none";
      checkBtn.style.display = "inline-block";
      retryBtn.style.display = "inline-block";
      return;
    }

    renderCurrent();
  }

  function undo() {
    if (picks.length === 0) return;
    picks.pop();
    const lastChip = chips.pop();
    if (lastChip?.el) lastChip.el.remove();
    idx = Math.max(0, idx - 1);

    loveImg.style.display = "";
    loveWord.style.display = "";
    checkBtn.style.display = "none";
    retryBtn.style.display = "none";
    renderCurrent();
  }

  function check() {
    const wrong = picks.filter((p) => p.pick !== p.correct);
    if (wrong.length === 0) {
      loveMsg.innerHTML = `<b style="color:var(--green)">Идеально!</b> Переходим дальше.`;
      setTimeout(() => {
        d2_save(memKey, 4);
        runDay2();
      }, 650);
      return;
    }
    const list = wrong.map((w) => `- ${w.label}`).join("<br>");
    loveMsg.innerHTML = `<b style="color:var(--red)">Есть ошибки.</b><br>${list}<br><span class="small">Исправь через "Отменить последний" или начни заново.</span>`;
  }

  slotD.onclick = () => place("d");
  slotM.onclick = () => place("m");
  undoBtn.onclick = undo;
  checkBtn.onclick = check;
  retryBtn.onclick = () => d2_step3(memKey);

  renderCurrent();
}

function d2_step4(memKey) {
  setStep(4, 5);

  const SIZE = 10;
  const words = ["ЕЛКА", "СНЕГ", "ПОДАРОК", "САНКИ", "ЗВЕЗДА", "ГИРЛЯНДА"];
  const ABC = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЫЭЮЯ";

  const grid = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => ""));
  function putWord(w, r, c, dr, dc) {
    for (let i = 0; i < w.length; i++) grid[r + dr * i][c + dc * i] = w[i];
  }

  putWord("ГИРЛЯНДА", 0, 1, 0, 1);
  putWord("ПОДАРОК", 2, 0, 0, 1);
  putWord("СНЕГ", 1, 9, 1, 0);
  putWord("САНКИ", 4, 0, 1, 0);
  putWord("ЗВЕЗДА", 9, 4, 0, 1);
  putWord("ЕЛКА", 5, 2, 1, 0);

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!grid[r][c]) grid[r][c] = ABC[Math.floor(Math.random() * ABC.length)];
    }
  }

  contentEl.innerHTML = `
    <div class="board">
      <h3 class="boardTitle">Шаг 4 - Найди слова (10x10)</h3>
      <p class="small">Выделяй буквы кликом по порядку (слово должно идти по прямой). Найди 6 слов.</p>

      <div class="row">
        <span class="badge locked">Найдено: <b id="wsFound">0</b>/6</span>
        <button class="btn ghost" id="wsClear" type="button">Стереть выбор</button>
      </div>

      <div class="wsWrap">
        <div id="wsGrid" class="wsGrid"></div>
        <div class="wsSide">
          <div class="badge locked">Текущее: <b id="wsCur">_</b></div>
          <div class="hr"></div>
          <div id="wsList" class="wsList"></div>
          <div class="hr"></div>
          <div id="wsMsg" class="small"></div>
          <button class="btn" id="wsNext" type="button" style="display:none">Дальше</button>
        </div>
      </div>
    </div>
  `;

  const wsGrid = document.getElementById("wsGrid");
  const wsCur = document.getElementById("wsCur");
  const wsList = document.getElementById("wsList");
  const wsMsg = document.getElementById("wsMsg");
  const wsFound = document.getElementById("wsFound");
  const wsClear = document.getElementById("wsClear");
  const wsNext = document.getElementById("wsNext");

  const found = new Set();
  const foundCells = new Set();

  let sel = [];
  let dir = null;

  function key(r, c) { return `${r},${c}`; }

  function renderList() {
    wsList.innerHTML = words.map((w) => {
      const ok = found.has(w);
      return `<div class="wsWord ${ok ? "ok" : ""}">${ok ? "✅" : "⬜"} ${w}</div>`;
    }).join("");
    wsFound.textContent = String(found.size);
  }

  function selectionText() {
    return sel.map((p) => grid[p.r][p.c]).join("");
  }

  function isNeighbor(a, b) {
    const dr = b.r - a.r;
    const dc = b.c - a.c;
    if (dr === 0 && dc === 0) return null;
    if (Math.abs(dr) > 1 || Math.abs(dc) > 1) return null;
    return { dr, dc };
  }

  function renderGrid() {
    wsGrid.innerHTML = "";
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "wsCell";
        b.textContent = grid[r][c];

        const k = key(r, c);
        if (foundCells.has(k)) b.classList.add("found");
        if (sel.some((p) => p.r === r && p.c === c)) b.classList.add("sel");

        b.onclick = () => onCell(r, c);
        wsGrid.appendChild(b);
      }
    }
  }

  function onCell(r, c) {
    const k = key(r, c);
    if (foundCells.has(k)) return;

    if (sel.length && sel[sel.length - 1].r === r && sel[sel.length - 1].c === c) {
      sel.pop();
      if (sel.length < 2) dir = null;
      wsCur.textContent = selectionText() || "_";
      renderGrid();
      return;
    }

    if (sel.some((p) => p.r === r && p.c === c)) return;

    if (sel.length === 0) {
      sel.push({ r, c });
      dir = null;
    } else if (sel.length === 1) {
      const d = isNeighbor(sel[0], { r, c });
      if (!d) return;
      dir = d;
      sel.push({ r, c });
    } else {
      const last = sel[sel.length - 1];
      const wantR = last.r + dir.dr;
      const wantC = last.c + dir.dc;
      if (r !== wantR || c !== wantC) return;
      sel.push({ r, c });
    }

    const text = selectionText();
    wsCur.textContent = text || "_";
    renderGrid();

    if (words.includes(text) && !found.has(text)) {
      found.add(text);
      sel.forEach((p) => foundCells.add(key(p.r, p.c)));
      sel = [];
      dir = null;
      wsCur.textContent = "_";
      renderList();
      renderGrid();

      if (found.size === words.length) {
        giveFrag(2, doors[1].frag);
        wsMsg.innerHTML = `<b style="color:var(--green)">Готово!</b>`;
        wsNext.style.display = "inline-block";
      }
    }
  }

  wsClear.onclick = () => {
    sel = [];
    dir = null;
    wsCur.textContent = "_";
    renderGrid();
  };

  wsNext.onclick = () => {
    d2_save(memKey, 5);
    runDay2();
  };

  renderList();
  renderGrid();
}


function d2_step5(memKey) {
  setStep(5, 5);
  

  const targetWord = "НОВЫЙ";
  const pairs = [
    { sym: "❄️", letter: "Н" },
    { sym: "🍊", letter: "О" },
    { sym: "🍬", letter: "В" },
    { sym: "🎁", letter: "Ы" },
    { sym: "🔔", letter: "Й" },
    { sym: "🎄", letter: "" },
    { sym: "🧤", letter: "" },
    { sym: "⭐", letter: "" },
    { sym: "🕯️", letter: "" },
    { sym: "🦌", letter: "" }, 
    { sym: "🍪", letter: "" },
    { sym: "🎅", letter: "" },
  ];

  let deck = [];
  pairs.forEach((p, idx) => {
    deck.push({ pair: idx, sym: p.sym, letter: p.letter });
    deck.push({ pair: idx, sym: p.sym, letter: p.letter });
  });
  deck = deck.sort(() => Math.random() - 0.5);

  let open = [];
  let matchedPairs = new Set();
  let letters = "";

  contentEl.innerHTML = `
    <div class="board">
      <h3 class="boardTitle">Шаг 5 - Память (24 карточки)</h3>

      <p class="small">Собирай пары. Некоторые пары дают буквы. Угадай из букв слово и введи его.</p>

      <div class="row">
        <span class="badge locked">Буквы: <b id="letBar">${
          letters || "_"
        }</b></span>
        <span class="badge locked">Пары: <b id="pairBar">0</b>/12</span>
      </div>

      <div id="mem" class="memGrid"></div>

      <div class="hr"></div>

      <div class="row">
        <input id="finalWord" placeholder="введи слово" />
        <button class="btn primary" id="wordBtn">Открыть фрагмент</button>
        <span id="wordMsg" class="small"></span>
      </div>
    </div>
  `;

  const mem = document.getElementById("mem");
  const letBar = document.getElementById("letBar");
  const pairBar = document.getElementById("pairBar");
  const wordMsg = document.getElementById("wordMsg");

  deck.forEach((_, i) => {
    const div = document.createElement("div");
    div.className = "memCard";
    div.textContent = "🎀";
    div.onclick = () => flip(i, div);
    mem.appendChild(div);
  });

  function updateBars() {
    letBar.textContent = letters || "_";
    pairBar.textContent = String(matchedPairs.size);
  }

  function flip(i, el) {
    if (matchedPairs.has(deck[i].pair)) return;
    if (open.find((x) => x.i === i)) return;
    if (open.length === 2) return;

    el.classList.add("open");
    el.textContent = deck[i].sym;
    open.push({ i, el });

    if (open.length === 2) {
      const [a, b] = open;
      if (deck[a.i].pair === deck[b.i].pair) {
        matchedPairs.add(deck[a.i].pair);
        a.el.classList.add("matched");
        b.el.classList.add("matched");

        if (deck[a.i].letter) letters += deck[a.i].letter;

        open = [];
        updateBars();
      } else {
        setTimeout(() => {
          a.el.classList.remove("open");
          b.el.classList.remove("open");
          a.el.textContent = "🎀";
          b.el.textContent = "🎀";
          open = [];
        }, 650);
      }
    }
  }

  updateBars();

  document.getElementById("wordBtn").onclick = () => {
    const v = (document.getElementById("finalWord").value || "")
      .trim()
      .toUpperCase();
    if (matchedPairs.size < 10) {
      wordMsg.innerHTML = `<b style="color:var(--red)">Рано.</b> Собери еще пары.`;
      return;
    }
    if (v === targetWord) {
      wordMsg.innerHTML = `<b style="color:var(--green)">Открыто.</b> Фрагмент: <b>${doors[1].frag}</b>`;
      award(2, doors[1].frag);
    } else {
      wordMsg.innerHTML = `<b style="color:var(--red)">Не то слово.</b> Подсказка: оно про приближающийся год.`;
    }
  };
}

// -----------------------------
// Дверь 3
// -----------------------------
function runDay3() {
  panelTitleEl.textContent = "Дверь 3 - Комната тайного детектива";
  const memKey = LS.day3;
  const saved = JSON.parse(localStorage.getItem(memKey) || "{}");
  const step = saved.step || 1;

  const TOTAL = 5;
  const replay = !!saved.replay;

  if (state.solved[3] && !replay) {
    setStep(TOTAL, TOTAL);
    contentEl.innerHTML = `
      <div class="board">
        <h3 class="boardTitle">Уже пройдено</h3>
        <p class="small">Фрагмент дня: <b>${state.frags[3]}</b></p>
        <button class="btn ghost" id="redo3" type="button">Пройти уровень снова</button>
      </div>
    `;
    document.getElementById("redo3").onclick = () => {
      localStorage.setItem(memKey, JSON.stringify({ step: 1, replay: true }));
      runDay3();
    };
    return;
  }

  if (openDay() < 3) {
    setStep(1, TOTAL);
    contentEl.innerHTML = `<div class="board"><h3 class="boardTitle">Пока закрыто</h3><p class="small">Эта дверь откроется в 12:00.</p></div>`;
    return;
  }

  if (step === 1) d3_step1(memKey);
  if (step === 2) d3_step2(memKey);
  if (step === 3) d3_step3(memKey); // новая логика
  if (step === 4) d3_step4(memKey); // новый пазл 14x8
  if (step === 5) d3_step5(memKey); // бывший d3_step3 (квиз с фрагментом)
}

function d3_save(memKey, step, extra = {}) {
  const prev = JSON.parse(localStorage.getItem(memKey) || "{}");
  const next = { ...prev, ...extra, step };
  localStorage.setItem(memKey, JSON.stringify(next));
}

function d3_step1(memKey) {
  setStep(1,5);

  const found = new Set();

  contentEl.innerHTML = `
    <div class="board">
      <h3 class="boardTitle">Шаг 1 - Найди 3 улики</h3>
      <p class="small">Улики любят углы. Нажимай на спрятанные предметы.</p>

      <div class="quizQ" style="position:relative; min-height:240px; overflow:hidden;">
        <div class="q">Доска детектива</div>
        <p class="small">Заметки, ниточки и атмосфера расследования.</p>

        <button class="btn ghost" id="cl1" style="position:absolute; top:10px; right:14px; opacity:.70;">⭐</button>
        <button class="btn ghost" id="cl2" style="position:absolute; bottom:14px; left:16px; opacity:.70;">🔔</button>
        <button class="btn ghost" id="cl3" style="position:absolute; bottom:16px; right:18px; opacity:.70;">🍊</button>

        <div class="badge locked" style="position:absolute; top:12px; left:12px;">Найдено: <b id="clN">0</b>/3</div>
      </div>

      <div class="row">
        <button class="btn primary" id="clDone">Дальше</button>
        <span id="clMsg" class="small"></span>
      </div>
    </div>
  `;

  const clN = document.getElementById("clN");
  const clMsg = document.getElementById("clMsg");

  function mark(id) {
    found.add(id);
    clN.textContent = String(found.size);
    const b = document.getElementById(id);
    b.style.opacity = "1";
    clMsg.innerHTML = `<b style="color:var(--green)">Улика найдена.</b>`;
  }

  document.getElementById("cl1").onclick = () => mark("cl1");
  document.getElementById("cl2").onclick = () => mark("cl2");
  document.getElementById("cl3").onclick = () => mark("cl3");

  document.getElementById("clDone").onclick = () => {
    if (found.size >= 3) {
      setTimeout(() => {
        d3_save(memKey, 2);
        runDay3();
      }, 650);
    } else {
      clMsg.innerHTML = `<b style="color:var(--red)">Нужно все 3.</b>`;
    }
  };
}

function d3_step2(memKey) {
  setStep(2,5);

  const words = ["СНЕГ", "ЕЛКА", "ФЕЙЕРВЕРК"];
  let round = 0;
  let word = words[round];
  let tries = 6;
  let used = new Set();
  let mask = word.split("").map((_) => "_");
  

  contentEl.innerHTML = `
    <div class="board">
      <h3 class="boardTitle">Шаг 2 - Виселица (3 раунда)</h3>
      <p class="small">Добрый режим: без жесткого проигрыша, просто перезапуск если нужно.</p>

      <div class="quizQ">
        <div class="q">Раунд: <b id="hr">1</b>/3</div>
        <div style="font-weight:950; letter-spacing:6px; font-size:22px;" id="hm"></div>

        <div class="row">
          <input id="hin" maxlength="1" placeholder="буква" />
          <button class="btn primary" id="hbtn">Ок</button>
        </div>

        <p class="small">Попытки: <b id="ht"></b> | Буквы: <span id="hu"></span></p>
        <p id="hmsg" class="small"></p>
      </div>

      <div class="row">
        <button class="btn ghost" id="hretry">Перезапустить шаг</button>
      </div>
    </div>
  `;

  const hr = document.getElementById("hr");
  const hm = document.getElementById("hm");
  const ht = document.getElementById("ht");
  const hu = document.getElementById("hu");
  const hmsg = document.getElementById("hmsg");

  const hin = document.getElementById("hin");
const hbtn = document.getElementById("hbtn");

// Enter = Ок
hin.addEventListener("keydown", (e) => {
  if (e.key === "Enter") hbtn.click();
});

function isVowel(ch) {
  return "АЕЁИОУЫЭЮЯ".includes(ch);
}
function alphaBucket(ch) {
  const a = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
  const idx = a.indexOf(ch);
  if (idx === -1) return "буква необычная";
  if (idx < a.length * 0.34) return "буква ближе к началу алфавита";
  if (idx < a.length * 0.67) return "буква ближе к середине алфавита";
  return "буква ближе к концу алфавита";
}
function remainingUniqueLetters() {
  const uniq = Array.from(new Set(word.split("")));
  return uniq.filter(ch => !used.has(ch));
}
function maybeHint() {
  const rem = remainingUniqueLetters();
  if (tries === 1 && rem.length === 1 && !hintShown) {
    const last = rem[0];
    const v = isVowel(last) ? "гласная" : "согласная";
    hmsg.innerHTML = `<b style="color:var(--gold)">Подсказка:</b> последняя буква - <b>${v}</b>, и ${alphaBucket(last)}.`;
    hintShown = true;
  }
}


  function render() {
    hr.textContent = String(round + 1);
    hm.textContent = mask.join(" ");
    ht.textContent = String(tries);
    hu.textContent = Array.from(used).join(", ");
  }

  function nextRound() {
    round++;
    if (round >= words.length) {
      hmsg.innerHTML = `<b style="color:var(--green)">Все раунды пройдены.</b>`;
      setTimeout(() => {
        d3_save(memKey, 3);
        runDay3();
      }, 650);
      return;
    }
    word = words[round];
    tries = 6;
    used = new Set();
    mask = word.split("").map((_) => "_");
    hmsg.textContent = "";
    render();
  }

  hbtn.onclick = () => {
  const v = (hin.value || "").trim().toUpperCase();
  hin.value = "";
  hin.focus();
  if (!v) return;

  if (used.has(v)) {
    hmsg.textContent = "Эта буква уже была.";
    return;
  }
  used.add(v);

  if (word.includes(v)) {
    word.split("").forEach((c, i) => {
      if (c === v) mask[i] = c;
    });
    hmsg.innerHTML = `<b style="color:var(--green)">Есть.</b>`;
    if (!mask.includes("_")) {
      hmsg.innerHTML = `<b style="color:var(--green)">Слово угадано.</b> Следующий раунд.`;
      setTimeout(nextRound, 650);
    }
  } else {
    tries--;
    hmsg.innerHTML = `<b style="color:var(--red)">Неа.</b>`;
    if (tries <= 0) {
      hmsg.innerHTML = `<b style="color:var(--red)">Попытки закончились.</b> Перезапусти шаг и попробуй снова.`;
    }
  }

  maybeHint();
  render();
};


  document.getElementById("hretry").onclick = () => d3_step2(memKey);
  render();
}

function d3_step3(memKey) {
  setStep(3, 5);

  // Правила: вор солгал в обеих фразах, каждый невиновный сказал 1 правду и 1 ложь.
  // Решение по логике - вор: Олень.
  const suspects = [
    {
      id: "dm",
      name: "Дед Мороз",
      s1: "Вор - Снегурочка.",
      s2: "Вор - Дед Мороз, Олень или Снеговик."
    },
    {
      id: "sg",
      name: "Снегурочка",
      s1: "Вор - Дед Мороз или Снегурочка.",
      s2: "Вор - Дед Мороз, Олень или Снегурочка."
    },
    {
      id: "sv",
      name: "Снеговик",
      s1: "Вор - Дед Мороз, Снегурочка или Снеговик.",
      s2: "Вор - Олень или Снеговик."
    },
    {
      id: "deer",
      name: "Олень",
      s1: "Вор - Снеговик.",
      s2: "Вор - Дед Мороз или Снегурочка."
    },
  ];

  contentEl.innerHTML = `
    <div class="board">
      <h3 class="boardTitle">Шаг 3 - Кто украл подарок?</h3>
      <p class="small">
        Подарок исчез. Каждый сказал 2 фразы.
        <br><b>Правило:</b> вор солгал в обеих фразах, каждый невиновный сказал 1 правду и 1 ложь.
      </p>

      <div class="quizQ">
        ${suspects.map(p => `
          <div class="q" style="margin-top:10px">${p.name}</div>
          <div class="small">1) ${p.s1}</div>
          <div class="small">2) ${p.s2}</div>
        `).join("")}
      </div>

      <div class="hr"></div>

      <div class="q">Кто вор?</div>
      <div class="quizA" style="grid-template-columns: repeat(2, minmax(0, 1fr));">
        ${suspects.map(p => `
          <label class="opt">
            <input type="radio" name="thief" value="${p.id}">
            <span>${p.name}</span>
          </label>
        `).join("")}
      </div>

      <div class="row" style="margin-top:12px">
        <button class="btn primary" id="d3liarCheck" type="button">Проверить</button>
        <button class="btn ghost" id="d3liarHint" type="button">Подсказка</button>
        <span id="d3liarMsg" class="small"></span>
      </div>
    </div>
  `;

  const msg = document.getElementById("d3liarMsg");
  let hintsUsed = 0;

  document.getElementById("d3liarHint").onclick = () => {
    hintsUsed++;
    if (hintsUsed === 1) {
      msg.innerHTML = `Подсказка: у невиновных ровно <b>по одной</b> правде, значит у троих будет схема <b>1T+1F</b>, а у вора <b>0T+2F</b>.`;
      return;
    }
    msg.innerHTML = `Подсказка 2: попробуй предположить "вор - Снегурочка" и сразу проверь, сколько людей тогда вынуждены сказать <b>2 правды</b> или <b>2 лжи</b> - правило это запрещает.`;
  };

  document.getElementById("d3liarCheck").onclick = () => {
    const pick = document.querySelector('input[name="thief"]:checked')?.value;
    if (!pick) {
      msg.innerHTML = `<b style="color:var(--red)">Выбери подозреваемого.</b>`;
      return;
    }
    if (pick === "deer") {
      msg.innerHTML = `<b style="color:var(--green)">Верно.</b> Дальше - пазл.`;
      setTimeout(() => {
        d3_save(memKey, 4);
        runDay3();
      }, 650);
    } else {
      msg.innerHTML = `<b style="color:var(--red)">Не сходится с правилом.</b> Попробуй другой вариант.`;
    }
  };
}

function d3_step4(memKey) {
  setStep(4, 5);

  // Путь к твоей картинке (положишь сам)
  const IMG_SRC = "assets/day3-puzzle.jpg";

  const COLS = 10;
  const ROWS = 6;
  const TOTAL = COLS * ROWS;

  contentEl.innerHTML = `
    <div class="board">
      <h3 class="boardTitle">Шаг 4 - Пазл (10x6)</h3>
      <p class="small">Справа появляется деталь - перетащи на холст. На холсте детали тоже можно таскать. Все защелкивается по сетке.</p>

      <div class="row">
        <span class="badge locked">Поставлено: <b id="pz2Placed">0</b>/${TOTAL}</span>
        <button class="btn ghost" id="pz2Restart" type="button">Перезапуск</button>
        <button class="btn primary" id="pz2Check" type="button" style="display:none">Проверить</button>
        <span id="pz2Msg" class="small"></span>
      </div>

      <div class="pz2Wrap">
        <div id="pz2Board" class="pz2Board">
          <div class="pz2Grid"></div>
        </div>

        <div class="pz2Side">
          <div class="badge locked">Текущая деталь</div>
          <div class="pz2Slot" id="pz2Slot"></div>
          <div class="pz2Hint">Подсказка: удобнее попадать ближе к центру клетки.</div>
        </div>
      </div>
    </div>
  `;

  const board = document.getElementById("pz2Board");
  const slot = document.getElementById("pz2Slot");
  const placedEl = document.getElementById("pz2Placed");
  const msgEl = document.getElementById("pz2Msg");
  const btnRestart = document.getElementById("pz2Restart");
  const btnCheck = document.getElementById("pz2Check");

  const img = new Image();
  img.src = IMG_SRC;

  // вычислим пиксели после загрузки (board реальный размер зависит от экрана)
  let boardW = 0, boardH = 0, pieceW = 0, pieceH = 0;

  // Картинка будет "cover" обрезана под 5:3, мы делаем один общий dataURL и режем его CSS'ом
  let croppedDataUrl = null;

  // очередь деталей (случайный порядок)
  let queue = [];
  let qIndex = 0;

  // состояние размещения
  const occ = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null)); // occ[r][c]=pieceId
  const pieces = new Map(); // id -> {el, cr, cc, r, c} (cr/cc correct, r/c current or null)
  let placedCount = 0;

  function computeSizes() {
    const r = board.getBoundingClientRect();
    boardW = r.width;
    boardH = r.height;
    pieceW = boardW / COLS;
    pieceH = boardH / ROWS;
  }

  function makeCroppedDataUrl() {
    // рисуем img в offscreen canvas boardW x boardH с cover crop
    const cnv = document.createElement("canvas");
    cnv.width = Math.round(boardW);
    cnv.height = Math.round(boardH);
    const ctx = cnv.getContext("2d");

    const cW = cnv.width, cH = cnv.height;
    const iW = img.width, iH = img.height;
    const cR = cW / cH;
    const iR = iW / iH;

    let sx = 0, sy = 0, sW = iW, sH = iH;
    if (iR > cR) {
      sW = Math.floor(iH * cR);
      sx = Math.floor((iW - sW) / 2);
    } else {
      sH = Math.floor(iW / cR);
      sy = Math.floor((iH - sH) / 2);
    }

    ctx.drawImage(img, sx, sy, sW, sH, 0, 0, cW, cH);
    croppedDataUrl = cnv.toDataURL("image/jpeg", 0.92);
  }

  function reset() {
    pieces.clear();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) occ[r][c] = null;
    placedCount = 0;
    placedEl.textContent = "0";
    msgEl.textContent = "";
    btnCheck.style.display = "none";
    board.querySelectorAll(".pz2Piece").forEach((p) => p.remove());
    slot.innerHTML = "";

    queue = Array.from({ length: TOTAL }, (_, i) => i);
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }
    qIndex = 0;

    showNextPieceInSlot();
  }

  function pieceIdToRC(id) {
    const cr = Math.floor(id / COLS);
    const cc = id % COLS;
    return { cr, cc };
  }

  function createPieceEl(id) {
    const { cr, cc } = pieceIdToRC(id);
    const el = document.createElement("div");
    el.className = "pz2Piece";
    el.dataset.id = String(id);

    el.style.width = `${pieceW}px`;
    el.style.height = `${pieceH}px`;

    el.style.backgroundImage = `url("${croppedDataUrl}")`;
    el.style.backgroundSize = `${boardW}px ${boardH}px`;
    el.style.backgroundPosition = `${-cc * pieceW}px ${-cr * pieceH}px`;

    // позицию зададим позже
    return { el, cr, cc };
  }

  function snapToCell(el, r, c) {
    el.style.left = `${c * pieceW}px`;
    el.style.top = `${r * pieceH}px`;
  }

  function cellFromDrop(pageX, pageY) {
    const br = board.getBoundingClientRect();
    const cx = pageX - br.left;
    const cy = pageY - br.top;
    const c = Math.floor(cx / pieceW);
    const r = Math.floor(cy / pieceH);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
    return { r, c };
  }

  function makeDraggable(el) {
  let dragging = false;
  let offsetX = 0, offsetY = 0;
  let from = null; // {r,c} или null (если из слота)

  function cleanup(winMove, winUp, pointerId) {
    window.removeEventListener("pointermove", winMove);
    window.removeEventListener("pointerup", winUp);
    try { el.releasePointerCapture(pointerId); } catch {}
    el.classList.remove("dragging");
    el.style.zIndex = "1";
    if (board.style.overflow === "visible") {
      board.style.overflow = board.dataset.ovPrev || "";
      delete board.dataset.ovPrev;
    }
  }

  el.addEventListener("pointerdown", (e) => {
    e.preventDefault();

    computeSizes();
    dragging = true;
    el.classList.add("dragging");
    el.style.zIndex = "50";

    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    const id = Number(el.dataset.id);
    const st = pieces.get(id);
    from = (st && st.r != null) ? { r: st.r, c: st.c } : null;

    // если тянем из slot - сразу переносим на board и делаем overflow видимым
    if (from == null) {
      const br = board.getBoundingClientRect();
      board.dataset.ovPrev = board.style.overflow || "";
      board.style.overflow = "visible";

      el.style.position = "absolute";
      board.appendChild(el);

      const x = e.clientX - br.left - offsetX;
      const y = e.clientY - br.top - offsetY;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    }

    // pointer capture + глобальные слушатели (самое надежное)
    try { el.setPointerCapture(e.pointerId); } catch {}

    const winMove = (ev) => {
      if (!dragging) return;
      ev.preventDefault();

      const br = board.getBoundingClientRect();
      const x = ev.clientX - br.left - offsetX;
      const y = ev.clientY - br.top - offsetY;

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    };

    const winUp = (ev) => {
      if (!dragging) return;
      dragging = false;

      const id2 = Number(el.dataset.id);
      const st2 = pieces.get(id2);

      const cell = cellFromDrop(ev.clientX, ev.clientY);

      // если отпустили вне поля
      if (!cell) {
        if (from == null) {
          // вернуть в slot
          slot.innerHTML = "";
          slot.appendChild(el);
          el.style.position = "relative";
          el.style.left = "0";
          el.style.top = "0";
        } else {
          snapToCell(el, from.r, from.c);
        }
        cleanup(winMove, winUp, e.pointerId);
        return;
      }

      const occId = occ[cell.r][cell.c];
      const isNew = (from == null);

      if (occId != null) {
        if (isNew) {
          msgEl.innerHTML = `<b style="color:var(--red)">Клетка занята.</b> Поставь в пустую.`;
          slot.innerHTML = "";
          slot.appendChild(el);
          el.style.position = "relative";
          el.style.left = "0";
          el.style.top = "0";
          cleanup(winMove, winUp, e.pointerId);
          return;
        }

        // swap
        const other = pieces.get(occId);
        const old = from;

        occ[other.r][other.c] = id2;
        other.r = old.r; other.c = old.c;
        snapToCell(other.el, other.r, other.c);

        occ[cell.r][cell.c] = id2;
        st2.r = cell.r; st2.c = cell.c;
        snapToCell(el, st2.r, st2.c);

        occ[old.r][old.c] = occId;

        cleanup(winMove, winUp, e.pointerId);
        return;
      }

      // свободно
      if (isNew) {
        st2.r = cell.r; st2.c = cell.c;
        occ[cell.r][cell.c] = id2;
        snapToCell(el, st2.r, st2.c);

        placedCount++;
        placedEl.textContent = String(placedCount);
        msgEl.textContent = "";

        showNextPieceInSlot();
        if (placedCount === TOTAL) btnCheck.style.display = "inline-block";

        cleanup(winMove, winUp, e.pointerId);
        return;
      }

      // переезд в свободную клетку
      occ[from.r][from.c] = null;
      st2.r = cell.r; st2.c = cell.c;
      occ[cell.r][cell.c] = id2;
      snapToCell(el, st2.r, st2.c);

      cleanup(winMove, winUp, e.pointerId);
    };

    window.addEventListener("pointermove", winMove, { passive: false });
    window.addEventListener("pointerup", winUp, { passive: false });
  });
}


  function showNextPieceInSlot() {
    slot.innerHTML = "";

    if (qIndex >= queue.length) {
      slot.innerHTML = `<div class="small">Все детали уже на поле.</div>`;
      return;
    }

    const id = queue[qIndex++];
    const { el, cr, cc } = createPieceEl(id);

    pieces.set(id, { el, cr, cc, r: null, c: null });

    // в слоте - относительное позиционирование
    el.style.position = "relative";
    el.style.left = "0";
    el.style.top = "0";

    makeDraggable(el);
    slot.appendChild(el);
  }

  function isSolved() {
    for (const [id, st] of pieces.entries()) {
      if (st.r == null || st.c == null) return false;
      if (st.r !== st.cr || st.c !== st.cc) return false;
    }
    return true;
  }

  btnRestart.onclick = () => reset();

  btnCheck.onclick = () => {
    if (placedCount !== TOTAL) {
      msgEl.innerHTML = `<b style="color:var(--red)">Еще не все детали на поле.</b>`;
      return;
    }
    if (isSolved()) {
      msgEl.innerHTML = `<b style="color:var(--green)">Пазл собран.</b> Дальше - последний шаг.`;
      setTimeout(() => {
        d3_save(memKey, 5);
        runDay3();
      }, 650);
    } else {
      msgEl.innerHTML = `<b style="color:var(--red)">Пока не собрано.</b> Перетаскивай детали - они должны встать на свои места.`;
    }
  };

  img.onload = () => {
    computeSizes();
    makeCroppedDataUrl();
    reset();
  };

  img.onerror = () => {
    msgEl.innerHTML = `<b style="color:var(--red)">Не могу загрузить картинку.</b> Проверь путь: ${IMG_SRC}`;
  };
}


function d3_step5(memKey) {
  setStep(5,5);

  const quiz = boyfriendQuizData();

  contentEl.innerHTML = `
    <div class="board">
      <h3 class="boardTitle">Шаг 3 - Что выберет твой парень?</h3>
      <p class="small">5 вопросов, 2 варианта. Нужно 4 из 5.</p>

      <form id="bq"></form>
      <div class="row">
        <button class="btn primary" type="button" id="bqbtn">Проверить</button>
        <span class="small" id="bqmsg"></span>
      </div>
    </div>
  `;

  const form = document.getElementById("bq");
  form.innerHTML = quiz
    .map(
      (q, i) => `
    <div class="quizQ">
      <div class="q">${i + 1}. ${q.q}</div>
      ${q.a
        .map(
          (a, j) =>
            `<label><input type="radio" name="b${i}" value="${j}"> ${a}</label>`
        )
        .join("")}
    </div>
  `
    )
    .join("");

  document.getElementById("bqbtn").onclick = () => {
    let score = 0;
    for (let i = 0; i < quiz.length; i++) {
      const v = document.querySelector(`input[name="b${i}"]:checked`);
      if (!v) {
        document.getElementById("bqmsg").textContent = "Ответь на все вопросы.";
        return;
      }
      if (Number(v.value) === quiz[i].ok) score++;
    }
    const msg = document.getElementById("bqmsg");
    if (score >= 4) {
      msg.innerHTML = `<b style="color:var(--green)">Пройдено.</b> ${score}/5. Фрагмент: <b>${doors[2].frag}</b>`;
      award(3, doors[2].frag);
    } else {
      msg.innerHTML = `<b style="color:var(--red)">Мало.</b> ${score}/5 (нужно 4).`;
    }
  };
}

function boyfriendQuizData() {
  return [
    { q: "Вечером 31-го я скорее выберу:", a: ["Тихий домашний уют и медленный вечер", "Гулять до ночи по огням и снежной улице"], ok: 1 },
    { q: "На Новый год мне важнее:", a: ["Суета и неожиданности", "Четкий план и чтобы все было по таймингу"], ok: 1 },
    { q: "Прогулка по снегу:", a: ["Да - ради атмосферы и зимнего вайба", "Лучше дома - свечи, плед, тепло"], ok: 0 },
    { q: "Фильм на Новый год:", a: ["Уютная комедия под огоньки", "Детектив/триллер, но без жести"], ok: 0 },
    { q: "Подарочный квест:", a: ["Это мило - люблю такие штуки", "Лучше классика: сразу подарок без заданий"], ok: 0 },
  ];
}

// -----------------------------
// Дверь 4
// -----------------------------
function runDay4() {
  panelTitleEl.textContent = "Дверь 4 - Сейф финального подарка";

  if (openDay() < 4) {
    setStep(1);
    contentEl.innerHTML = `<div class="board"><h3 class="boardTitle">Закрыто</h3><p class="small">Эта дверь откроется в 12:00.</p></div>`;
    return;
  }

  const memKey = LS.day4;
  const saved = JSON.parse(localStorage.getItem(memKey) || "{}");
  const step = saved.step || 1;

  if (step === 1) d4_step1(memKey);
  if (step === 2) d4_step2(memKey);
  if (step === 3) d4_step3();
}

function d4_save(memKey, step, extra = {}) {
  localStorage.setItem(memKey, JSON.stringify({ step, ...extra }));
}

function d4_step1(memKey) {
  setStep(1);

  const anagram = "О Д П Р О К А";
  const answer = "ПОДАРОК";

  contentEl.innerHTML = `
    <div class="board">
      <h3 class="boardTitle">Шаг 1 - Анаграмма</h3>
      <p class="small">Собери слово из букв: <b>${anagram}</b></p>

      <div class="row">
        <input id="a4" placeholder="введи слово" />
        <button class="btn primary" id="a4btn">Открыть сейф</button>
        <span id="a4msg" class="small"></span>
      </div>
    </div>
  `;

  document.getElementById("a4btn").onclick = () => {
    const v = (document.getElementById("a4").value || "").trim().toUpperCase();
    const msg = document.getElementById("a4msg");

    if (v === answer) {
      msg.innerHTML = `<b style="color:var(--green)">Верно.</b> Сейф готов принимать код.`;
      setTimeout(() => {
        d4_save(memKey, 2);
        runDay4();
      }, 650);
    } else {
      msg.innerHTML = `<b style="color:var(--red)">Не то.</b> Подсказка: это то, что ты получишь.`;
    }
  };
}

function d4_step2(memKey) {
  setStep(2);

  const f1 = state.frags[1] || "";
  const f2 = state.frags[2] || "";
  const f3 = state.frags[3] || "";

  const clueText = "Подарок пришел. Скоро Новый год. Открой дверь и улыбнись.";
  const oCount = (clueText.match(/о/gi) || []).length;
  const lastDigit = 8; // если 10, то 0
  const correct = `${f1}${f2}${f3}${lastDigit}`;


  contentEl.innerHTML = `
    <div class="board">
      <h3 class="boardTitle">Шаг 2 - Кодовый замок</h3>
      <p class="small">
        Код = фрагменты из Дверей 1-3 + последняя цифра.
        Последняя цифра: посчитай, сколько букв <b>О</b> в предложении ниже.
      </p>

      <div class="quizQ">
        <div class="q">Подсказка</div>
        <div class="small" style="padding:10px; border-radius:14px; border:1px solid rgba(30,35,40,.10); background: rgba(255,255,255,.70)">${clueText}</div>
      </div>

      <div class="row">
        <input id="code" placeholder="4 цифры" />
        <button class="btn primary" id="codeBtn">Проверить</button>
        <span id="codeMsg" class="small"></span>
      </div>

      <div class="hr"></div>
      <p class="small">Подсказка "теплее-холоднее" сравнивает текущую попытку с предыдущей.</p>
    </div>
  `;

  document.getElementById("codeBtn").onclick = () => {
    const msg = document.getElementById("codeMsg");

    if (!f1 || !f2 || !f3) {
      msg.innerHTML = `<b style="color:var(--red)">Сначала пройди Двери 1-3.</b>`;
      return;
    }

    const v = (document.getElementById("code").value || "").trim();
    if (!/^\d{4}$/.test(v)) {
      msg.innerHTML = `<b style="color:var(--red)">Нужно ровно 4 цифры.</b>`;
      return;
    }

    if (v === correct) {
      msg.innerHTML = `<b style="color:var(--green)">Верно.</b>`;
      d4_save(memKey, 3);
      setTimeout(() => runDay4(), 600);
      return;
    }

    const dist = Math.abs(Number(v) - Number(correct));
    const prev = state.heatPrev;

    let hint = "";
    if (!Number.isFinite(prev)) hint = "Первая попытка.";
    else hint = dist < prev ? "Теплее." : "Холоднее.";

    state.heatPrev = dist;
    saveBase();

    msg.innerHTML = `<b style="color:var(--red)">Неверно.</b> ${hint}`;
  };
}

function d4_step3() {
  setStep(3);

  contentEl.innerHTML = `
    <div class="board">
      <h3 class="boardTitle">Шаг 3 - Награда</h3>
      <p class="small">Финальная фраза открыта.</p>

      <div class="quizQ" style="text-align:center">
        <div class="q" style="font-size:18px">Скажи пароль:</div>
        <div style="font-weight:950; font-size:28px; color: var(--gold); margin-top: 6px;">МАНДАРИН</div>
        <div class="small" style="margin-top:8px">Скажи его своему парню и сладкий подарок появится.</div>
      </div>

      <div class="row" style="justify-content:center">
        <button class="btn primary" id="finishBtn">Отметить как пройдено</button>
      </div>
    </div>
  `;

  document.getElementById("finishBtn").onclick = () => {
    award(4, "OK");
  };
}

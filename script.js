// ===============================
// Two-Fall Hospital (script.js)
// REBUILD v4 - 3F ~ Morgue/Roof full route (rule-driven)
// ===============================

/* -------------------------------
  0) Utils
--------------------------------*/
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (n, a, b) => Math.max(a, Math.min(b, Number.isFinite(+n) ? +n : a));
const chance = (p) => Math.random() < p;
const randi = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

const STORAGE_KEY = "TWO_FALL_HOSPITAL_V4";

/* -------------------------------
  1) Noise (v4+)
--------------------------------*/
/*
  ✅ 덜 답답하게: 글자를 "다 갈아엎는" 대신,
  - 단어 단위로 아주 가끔만 글리치
  - 첫/끝 글자는 최대한 보존
  - 공백/줄바꿈은 절대 훼손하지 않음
*/
const NOISE_CHARS = ["@", "#", "$", "%", "&", "*", "?", "!", "~", "+", "="];
const GLITCH_MARKS = ["·", "…", "∴", "≋", "≡", "ː", "⟡"];

function noiseify(text, intensity = 0.18) {
  const s = String(text ?? "");
  if (!s) return "";

  // intensity를 0~1로 고정
  const p = Math.max(0, Math.min(1, Number.isFinite(+intensity) ? +intensity : 0.18));

  // 단어 단위로 쪼개서 "가끔만" 변형
  return s.split(/(\s+)/).map(tok => {
    // 공백/줄바꿈 유지
    if (/^\s+$/.test(tok)) return tok;
    if (tok.length <= 2) {
      // 짧은 토큰은 글리치 삽입 정도만
      if (chance(p * 0.35)) return tok + GLITCH_MARKS[randi(0, GLITCH_MARKS.length - 1)];
      return tok;
    }

    // 글리치 발동 확률(단어 단위)
    if (!chance(p)) return tok;

    // 1) 끝에 표식 삽입(가장 읽기 쉬움)
    if (chance(0.55)) return tok + GLITCH_MARKS[randi(0, GLITCH_MARKS.length - 1)];

    // 2) 가운데 한 글자만 기호로 교체(첫/끝 보존)
    const mid = randi(1, tok.length - 2);
    const repl = chance(0.65) ? NOISE_CHARS[randi(0, NOISE_CHARS.length - 1)] : GLITCH_MARKS[randi(0, GLITCH_MARKS.length - 1)];
    return tok.slice(0, mid) + repl + tok.slice(mid + 1);
  }).join("");
}

function mosaicName() {
  // 방문객 표기용: 너무 난독화하지 않고, "가려진 느낌"만
  return `'${noiseify("SUBJECT", 0.45)}_${noiseify(String(randi(1, 99)).padStart(2, "0"), 0.35)}'`;
}

/* -------------------------------
  Story Dialogue Pools
--------------------------------*/
const LORE = {
  // 플레이 중 ‘해석’으로 노출될 문구(직접 스포 X, 엔딩에서만 명확해짐)
  truths: {
    MIDWAY_PLACE: [
      "이곳은 지옥도 현실도 아니다. 두 세계의 틈, 접수대가 있는 중간 지점이다.",
      "규칙은 협박이 아니라 ‘분류’다. 돌아갈 사람인지, 남을 사람인지.",
      "병원은 치료하지 않는다. 이미 끝난 기록을 ‘정리’할 뿐이다."
    ],
    ONLY_TWO_TODAY: [
      "오늘 명단에는 단 두 명. 그래서 유난히 친절했다.",
      "두 자리만 비어 있었다. 빈자리는 늘 누군가로 채워진다.",
      "환영은 축하가 아니다. 기록의 빈칸을 채우는 의식이다."
    ],
    LIGHT_SYMPTOM_RULE: [
      "‘가볍다’고 말하는 것은 돌아갈 여지가 있다는 선언이다.",
      "‘심각하다’고 말하는 순간, 너는 스스로를 환자로 등록한다.",
      "여기서는 아픔의 크기가 아니라 ‘인정’이 생사를 가른다."
    ],
    SILVER_KEY: [
      "은색 열쇠는 열쇠가 아니다. 역할을 바꾸는 도구다.",
      "메스 같은 형태는 ‘환자’가 아닌 ‘의사’로 보이게 만든다.",
      "마취를 거부한 건 허세가 아니라… 너희가 아직 살아있다는 증거였다."
    ],
    CHILD_AND_MOTHER: [
      "아이의 순수함은 통과권이 아니었다. 가장 좋은 미끼였다.",
      "엄마의 가게는 위로가 아니라, 사후의 단맛을 파는 곳이었다.",
      "아이스크림은 ‘치료 후 선물’이라는 약속의 잔해였다."
    ],
    MORGUE_GATE: [
      "영안실은 끝이 아니라, 현실로 돌아가는 출구에 가장 가까운 문이다.",
      "30초는 규칙이 아니라 시간이다. 심장이 멈추고 다시 뛰는, 그 틈.",
      "기도가 실패하면 돌아가는 곳이 달라진다. 몸이 아니라 ‘좌표’가 어긋난다."
    ],
    ROOF_EXORCISM: [
      "옥상은 탈출구가 아니라 정리장이다. 이 장소를 지우는 선택.",
      "그 아이는 천사처럼 웃지만, 떠나지 못한 존재들을 붙잡는 고정점이다.",
      "아이를 ‘없애는’ 것은 살해가 아니라 해방이다. 모든 기록의 소거."
    ],
  },

  endings: {
    GOOD_RETURN: {
      title: "현실로-.",
      tagline: "눈꺼풀 뒤로 빛이 번진다.",
      interpret: [
        "눈을 떠보니 밝은 병원 안이었다.",
        "마지막 장소의 기도가 닿았나보다.",
        "돌아가길 바라는 나의 '간절함'이 통한 것이겠지"
      ],
    },
    GOOD_TRUE: {
      title: "진엔딩: -.",
      tagline: "불길함이 지워지고, 남겨진 자들도 떠난다.",
      interpret: [
        "불길하고도 괴상한 공간은..",
        "더 이상 누군가에게 위협이 되지 않을 것이다",
        "그들도 원하는 곳으로 떠났을 것이다."
      ],
    },
    GOOD_HANDS: {
      title: "귀환",
      tagline: "손을 놓친 쪽이 기록 속에 남는다.",
      interpret: [
        "둘 다 돌아갈 수는 없었다.",
        "역시 그곳은, 보통 꿈이 아니였던 건가.",
        "현실로 돌아간 자는, 남겨진 이름을 평생 잊지 못한다."
      ],
    },

    BAD_REGISTERED: {
      title: "동기화",
      tagline: "그저 이 장소와 한 몸",
      interpret: [
        "한 몸이 되었다",
        "당신도 벗어날 수 없다.",
        "현실도 마찬가지."
      ],
    },
    BAD_RULE_BROKE: {
      title: "위반",
      tagline: "지키지 않았기 때문에.",
      interpret: [
        "이곳은 길이 아니라 절차다.",
        "잘못된 층은 잘못된 세계로 이어진다.",
        "문이 열리지 않은 이유는… 너희가 이미 다른 쪽으로 분류되었기 때문이다."
      ],
    },
    BAD_MORGUE_FAIL: {
      title: "기도 실패",
      tagline: "몸은 남았지만, 돌아갈 곳이 없다.",
      interpret: [
        "30초는 규칙이 아니라, 현실의 박동 간격이다.",
        "어긋난 기도는 어긋난 귀환을 만든다.",
        "너희는 살아있지만… ‘좌표’가 다르다."
      ],
    },
  },

  shards: [
    { key: "ONLY_TWO_TODAY", weight: 4 },
    { key: "LIGHT_SYMPTOM_RULE", weight: 4 },
    { key: "SILVER_KEY", weight: 3 },
    { key: "CHILD_AND_MOTHER", weight: 3 },
    { key: "MORGUE_GATE", weight: 4 },
    { key: "ROOF_EXORCISM", weight: 2 },
    { key: "MIDWAY_PLACE", weight: 2 },
  ],
};
const STAFF_LINES = {
  nurse: [
    "환자분, 목소리를 낮추세요.",
    "어머, 못 보던 분입니다",
    "새로운 분은 오랜만이네요",
    "어서 와요. 당신의 입원 일자는.. 18327418593247915832"
  ],
  doctor: [
    "모든 곳이 아프다면, 입원 절차를 밟으셔야 합니다.",
    "가벼운 증상도 입원하시는 것이 좋죠.",
    "하하, 오늘 저녁은 특식인가봅니다.",
    "하나 또는 둘, 언제나 다다익선이죠."
  ],
  stranger: [
    "어째서 이름을 부르지 않는 것일까.",
    "보이는 것, 보이지 않는 것. 그 어딘가"
  ],
  child: [
    "네가 나를 찾아왔다는 건.",
    "분명 여기가 처음이 아니라는 뜻이겠지."
  ]
};

const RELATION_LINES = {
  NEUTRAL: [
    "…우리, 지금 같은 걸 보고 있나?",
    "아무 말 하지 말자. 혹시 모르니까"
  ],
  FRIEND: [
    "괜찮아. 네 옆에 있을게.",
    "겁나도 같이 움직이자. 혼자 두지 마."
  ],
  LOVER: [
    "나 손 잡아. 놓치면… 돌아갈 수 없을 것 같아.",
    "너만은… 여기서 잃고 싶지 않아."
  ],
  ENEMY: [
    "네가 말해서 이렇게 된 거잖아.",
    "다음엔 너부터 내보낼 거야."
  ],
  MASTER: [
    "내 말만 따라. 그게 네가 사는 방법이야.",
    "뒤로 서. 내가 먼저 확인할게."
  ]
};
/* -------------------------------
  Hidden Truth / Ending Text
--------------------------------*/


const TRUTH_INTERPRETATION = [
  "진실 해석",
  "- 당신들은 교통사고 이후 혼수상태다.",
  "- 이 병원은 '현실 ↔ 지옥'의 중간 지점이며, 명단에 오른 두 명만을 반긴다.",
  "- '크게 아프다'는 말은 곧 '입원(=영구 등록)'이다. 그래서 반드시 가벼운 증상처럼 말해야 한다.",
  "- 4층의 은색 키(메스 모양)는 의사들이 당신을 '동료'로 착각하게 만드는 신분키다.",
  "- 놀이방의 아이는 순수하게 '수술실 2'로 들어가며, 위층 파스타집의 '엄마'는 그 사실을 알고 있다.",
  "- 아이스크림은 아이에게 주려던 선물(치료 후 보상)이라서, '컵'만 안전하도록 기록되어 있다.",
  "- 1층 영안실은 장례식 방문객으로 오인되어 통과하는 틈이다. 30초 기도는 '귀환 좌표'를 맞추는 절차다.",
  "- 옥상은 이 중간지대를 지우는 의식(퇴마)에 가깝다. '그 존재'를 끊으면, 떠나지 못한 것들이 흩어진다.",
].join("\n");

const TRUE_ENDING_TEXT = [
  "진엔딩: 퇴마",
  "불길함을 지우는 존재를 끊는 순간, 복도는 '병원'이 아니라 '경계'였음을 드러낸다.",
  "심전도 소리가 멀어지고, 눈꺼풀 뒤로 하얀 빛이 번진다.",
  "당신들은 다시 '현실의 병상'으로 돌아간다.",
].join("\n");

const STAFF_LINE_EXPLAIN = {
  nurse: {
    "환자분, 목소리를 낮추세요.": "소음=기록 손상. 말이 커지면 '환자(입원)'로 판정된다.",
    "기록이 흔들리면… 다시 처음부터예요.": "절차가 꼬이면 루트 리셋(혹은 강제 입원)이다.",
    "손을 내밀지 마세요. 잡히면 끝입니다.": "여기서 '잡힘'은 등록 확정(돌아가지 못함).",
    "여긴 '치료'가 아니라 '등록'이에요.": "치료가 아니라 분류/선별 시스템임을 암시.",
  },
  doctor: {
    "절차는 간단합니다. 틀리면… 환자가 되죠.": "규정 위반=입원(게임 오버)이라는 경고.",
    "당신들이 맞추는 건 문제고, 내가 맞추는 건 사람입니다.": "당신들은 시험받고, 그는 '선정'한다.",
    "눈을 뜨면 기록이 끊깁니다. 알아들었나요?": "5F/6F 카운트 규칙의 은유(눈 뜨면 종료).",
    "살고 싶으면, 질문을 줄이세요.": "정보를 캐면 캐낼수록 '관찰 대상'이 된다.",
  },
  stranger: {
    "…여기선 누구도 이름으로 안 불러.": "이름은 개인을 고정한다 → 고정=등록.",
    "문은 늘 하나 더 있어. 너희만 못 볼 뿐.": "조건(행운/절차) 만족 시 숨은 루트가 열린다.",
  },
  child: {
    "여긴… 죽기 전에 오는 곳이야.": "경계 공간임을 직설적으로 암시.",
    "키를 갖고 싶어? 그럼… 선택해.": "선택의 대가(희생) 구조를 암시.",
  }
};


// 특정 상황에서 가끔 대사 발생
async function maybeInjectDialogue(context = "") {
  if (state.busy) return;

  // 너무 자주 나오면 피곤하니 낮게
  if (!chance(0.18)) return;

  const rel = String(state.relation.type || "NEUTRAL");
  const aliveIdx = [0,1].filter(i => state.chars[i].alive);
  if (aliveIdx.length === 0) return;

  // 50%: 관계 대사 / 50%: 스태프 대사
  if (chance(0.5)) {
    const sp = chance(0.5) ? whoName(aliveIdx[0]) : whoName(aliveIdx[aliveIdx.length-1]);
    const line = pick(RELATION_LINES[rel] || RELATION_LINES.NEUTRAL);
    await logDialogue(sp, line, 520);
    return;
  }

  // staff lines
  const staffType = pick(["nurse","doctor","stranger"]);
  const label = staffType === "nurse" ? "간호사" : staffType === "doctor" ? "의사" : "행인";
  const line = pick(STAFF_LINES[staffType]);
  await logDialogue(label, line, 520);
}

/* -------------------------------
  2) State
--------------------------------*/
const DEFAULT_BODY = () => ({
  head: true,
  brain: true,
  heart: true,

  arm_l: true,
  arm_r: true,
  leg_l: true, // whole leg
  leg_r: true, // whole leg

  fingers_l: { cur: 5, max: 5 },
  fingers_r: { cur: 5, max: 5 },

  eyes: { cur: 2, max: 2 },     // internal
  teeth: { cur: 32, max: 32 },  // internal
  wrist_l: true,
  wrist_r: true,
});

const freshState = () => ({
  v: 4,
  started: false,
  busy: false,

  chars: [
    {
      id: "A",
      name: "Unknown",
      age: "",
      gender: "M",
      imgDataUrl: "",
      stats: { hp: 3, san: 3, knw: 3, agi: 3, str: 3 },
      luck: randi(1, 100),
      alive: true,
      hpPct: 100,
      sanPct: 100,
      body: DEFAULT_BODY(),
    },
    {
      id: "B",
      name: "Unknown",
      age: "",
      gender: "F",
      imgDataUrl: "",
      stats: { hp: 3, san: 3, knw: 3, agi: 3, str: 3 },
      luck: randi(1, 100),
      alive: true,
      hpPct: 100,
      sanPct: 100,
      body: DEFAULT_BODY(),
    },
  ],

  relation: { type: "NEUTRAL", masterIndex: 0 }, // FRIEND / MASTER / LOVER / ENEMY / NEUTRAL

  progress: {
    floor: 1,
    area: "COUNTER",
    moveMode: "WALK", // RUN only in chase screens

    f3AssignedRoom: null,  
  f3RerollsLeft: 2,
    // pledge
    pledgeAccepted: false,
    receptionWriter: null,
    confirmed: false,    // '알겠습니다'
    unlock2F: false,     // '간절함'

    // story flags
    stage: "PLEDGE_Q1",
    clinicDone: false,         // 1F clinic passed
    hadClinic: 2,              // for story (kept)
    f3KeyWrongOnce: false,
    hasKeyFrom3F: false,
    hasHandkerchief: false,
    hasRooftopKey: false,
    childSentToSurg2: false,
    icecreamCupBought: false,
    pastaReported: false,

    // 5F rule states
    wallTapped: false,
    bodyCheckedAfter5F: false,

    // morgue access: only from counter down-walk
    morgueAccess: false,
  },

  logs: [],
});

let state = null;

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== 4) return null;
    return parsed;
  } catch { return null; }
}
function hardReset() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  state = freshState();
}

/* -------------------------------
  3) DOM (game)
--------------------------------*/
function gameEls() {
  const screen = $("#screen-game");
  return {
    screen,
    floorText: $("#floor-text", screen),
    floorSub: $("#floor-sub", screen),
    moveMode: $("#move-mode", screen),
    consoleBox: $(".console-log-container", screen),
    cmdInput: $(".cmd-input", screen),
    choices: $(".choices", screen),

    cardA: $("#char-a", screen),
    cardB: $("#char-b", screen),
    nameA: $("#char-a .name-tag .data", screen),
    nameB: $("#char-b .name-tag .data", screen),
    imgA: $("#char-a .img-display-area", screen),
    imgB: $("#char-b .img-display-area", screen),
    hpA: $("#char-a .hp-bar", screen),
    hpB: $("#char-b .hp-bar", screen),
    sanA: $("#char-a .san-bar", screen),
    sanB: $("#char-b .san-bar", screen),
    relA: $("#char-a .relation-status", screen),
    relB: $("#char-b .relation-status", screen),
    bodyA: $("#char-a .body-parts", screen),
    bodyB: $("#char-b .body-parts", screen),
  };
}

function ensureEndingOverlay() {
  if ($("#ending-overlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "ending-overlay";
  overlay.innerHTML = `
    <div class="ending-panel">
      <div class="ending-title">GAME OVER</div>
      <div class="ending-body"></div>
      <div class="ending-actions">
        <button type="button" data-act="restart">재시작</button>
        <button type="button" data-act="wipe">데이터 삭제</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e) => {
    const btn = e.target?.closest("button");
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === "restart") { hardReset(); location.reload(); }
    if (act === "wipe") { hardReset(); location.reload(); }
  });
}

function escapeHTML(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/* -------------------------------
  4) Logs (slow)
--------------------------------*/
/* -------------------------------
  4-1) Dialogue-only mosaic helpers
--------------------------------*/
// (삭제해도 됨) const DIALOGUE_NOISE = 0.42;

async function logDialogue(speaker, line, ms = 520, intensity = null) {
  const sp = formatSpeakerLabel(speaker);
  const inten = (intensity === null || intensity === undefined)
    ? getNoiseLevel("dialogue")
    : intensity;
  const txt = `${sp}: ${noiseify(line, inten)}`;
  await logSlow("dialogue", txt, ms);
}

async function logNarration(text, ms = 520) {
  await logSlow("event", text, ms);
}
async function logSystem(text, ms = 520) {
  await logSlow("system", text, ms);
}

function appendLog(kind, text) {
  const el = gameEls().consoleBox;
  if (!el) return;
  const div = document.createElement("div");
  const cls =
  kind === "system" ? "system" :
  kind === "dialogue" ? "dialogue" :
  "event";
div.className = `log-entry ${cls}`;

  div.innerHTML = `> ${escapeHTML(text)}`;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;

  state.logs.push({ t: Date.now(), kind, text });
  if (state.logs.length > 280) state.logs = state.logs.slice(-200);
  saveState();
}
async function logSlow(kind, text, ms = 520) {
  appendLog(kind, text);
  await sleep(ms);
}

/* -------------------------------
  5) UI lock / choices
--------------------------------*/
function lockUI(flag) {
  state.busy = !!flag;
  const el = gameEls();
  if (el.cmdInput) el.cmdInput.disabled = !!flag;
  $$(".choice-btn", el.screen).forEach((b) => (b.disabled = !!flag));
}
function unlockHard() {
  state.busy = false;
  lockUI(false);
}
function setChoices(btns) {
  const el = gameEls().choices;
  if (!el) return;
  el.innerHTML = "";
  btns.forEach((b) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-btn";
    btn.textContent = b.label;
    btn.addEventListener("click", async () => {
      if (state.busy) return;
      try { await b.onClick?.(); } catch (e) { console.error(e); }
    });
    el.appendChild(btn);
  });
}

function formatSpeakerLabel(speaker) {
  return String(speaker ?? "???");
}

function getNoiseLevel(kind = "dialogue") {
  // 답답하지 않게: 기본은 낮게
  if (kind === "dialogue") return 0.18;
  if (kind === "event") return 0.14;
  return 0.16;
}

/* -------------------------------
  6) HUD render
--------------------------------*/
function renderPortrait(idx, imgEl, cardEl) {
  if (!imgEl) return;
  const c = state.chars[idx];
  if (!c.alive) {
    imgEl.style.backgroundImage = "none";
    imgEl.textContent = "NO SIGNAL";
    imgEl.classList.add("no-signal");
    cardEl?.classList.add("dead");
    return;
  }
  cardEl?.classList.remove("dead");
  imgEl.classList.remove("no-signal");
  imgEl.textContent = "";
  if (c.imgDataUrl) imgEl.style.backgroundImage = `url("${c.imgDataUrl}")`;
  else {
    imgEl.style.backgroundImage = "none";
    imgEl.textContent = "IMG";
  }
}
function ensureFingersRows(ul) {
  if (!ul) return;
  if ($('li[data-part="fingers_l"]', ul)) return;
  const liL = document.createElement("li");
  liL.dataset.part = "fingers_l";
  liL.innerHTML = `L-FINGERS <span class="status normal">5/5</span>`;
  const liR = document.createElement("li");
  liR.dataset.part = "fingers_r";
  liR.innerHTML = `R-FINGERS <span class="status normal">5/5</span>`;
  ul.appendChild(liL);
  ul.appendChild(liR);
}
function renderBody(idx, ul) {
  if (!ul) return;
  const b = state.chars[idx].body;

  const boolParts = ["head", "brain", "heart", "arm_l", "arm_r", "leg_l", "leg_r"];
  boolParts.forEach((p) => {
    const li = $(`li[data-part="${p}"]`, ul);
    if (!li) return;
    const sp = $("span.status", li);
    if (!sp) return;
    const ok = !!b[p];
    sp.classList.toggle("normal", ok);
    sp.classList.toggle("missing", !ok);
  });

  ["fingers_l", "fingers_r"].forEach((p) => {
    const li = $(`li[data-part="${p}"]`, ul);
    if (!li) return;
    const sp = $("span.status", li);
    if (!sp) return;
    const cur = clamp(b[p]?.cur ?? 0, 0, b[p]?.max ?? 5);
    const max = clamp(b[p]?.max ?? 5, 1, 10);
    sp.textContent = `${cur}/${max}`;
    const ok = cur > 0;
    sp.classList.toggle("normal", ok);
    sp.classList.toggle("missing", !ok);
  });
}
function syncHUD() {
  const el = gameEls();
  if (el.floorText) el.floorText.textContent = `${state.progress.floor}F`;
  if (el.floorSub) el.floorSub.textContent = state.progress.area || "—";
  if (el.moveMode) el.moveMode.textContent = state.progress.moveMode || "WALK";

  if (el.nameA) el.nameA.textContent = state.chars[0].name;
  if (el.nameB) el.nameB.textContent = state.chars[1].name;

  renderPortrait(0, el.imgA, el.cardA);
  renderPortrait(1, el.imgB, el.cardB);

  if (el.hpA) el.hpA.style.width = `${clamp(state.chars[0].hpPct, 0, 100)}%`;
  if (el.hpB) el.hpB.style.width = `${clamp(state.chars[1].hpPct, 0, 100)}%`;
  if (el.sanA) el.sanA.style.width = `${clamp(state.chars[0].sanPct, 0, 100)}%`;
  if (el.sanB) el.sanB.style.width = `${clamp(state.chars[1].sanPct, 0, 100)}%`;

  const r = String(state.relation.type || "NEUTRAL");
  if (el.relA) el.relA.textContent = r;
  if (el.relB) el.relB.textContent = r;

  ensureFingersRows(el.bodyA);
  ensureFingersRows(el.bodyB);
  renderBody(0, el.bodyA);
  renderBody(1, el.bodyB);

  saveState();
}

/* -------------------------------
  7) Body / death helpers
--------------------------------*/
function whoName(idx) { return state?.chars?.[idx]?.name || "???"; }
function bestMental() { return Math.max(state.chars[0].stats.san ?? 0, state.chars[1].stats.san ?? 0); }
function bestKnow() { return Math.max(state.chars[0].stats.knw ?? 0, state.chars[1].stats.knw ?? 0); }
function bestLuck() { return Math.max(state.chars[0].luck ?? 0, state.chars[1].luck ?? 0); }

function killChar(idx) {
  const c = state.chars[idx];
  c.alive = false;
  c.hpPct = 0;
}
function loseFinger(idx, hand /* "L"|"R" */) {
  const key = hand === "L" ? "fingers_l" : "fingers_r";
  const b = state.chars[idx].body[key];
  b.cur = clamp(b.cur - 1, 0, b.max);
}
function loseWholeLeg(idx, side /* "L"|"R" */) {
  state.chars[idx].body[side === "L" ? "leg_l" : "leg_r"] = false;
}
function bothLegsGone(idx) {
  const b = state.chars[idx].body;
  return !b.leg_l && !b.leg_r;
}
function anyLegMissing(idx) {
  const b = state.chars[idx].body;
  return (!b.leg_l || !b.leg_r);
}
function destroyAllParts(idx) {
  const b = state.chars[idx].body;
  Object.keys(b).forEach((k) => {
    if (typeof b[k] === "boolean") b[k] = false;
  });
  b.fingers_l.cur = 0;
  b.fingers_r.cur = 0;
  b.eyes.cur = 0;
  b.teeth.cur = 0;
}

function applyBothLegsDeathCheck() {
  if (bothLegsGone(0) || bothLegsGone(1)) {
    return badEndingSequence("과다출혈", "두 개의 다리가 소실되었습니다.");
  }
  return null;
}function relType() {
  return String(state?.relation?.type || "NEUTRAL");
}

const REL_MOD = {
  NEUTRAL: { survive: 0.00, chaos: 0.00, sacrifice: 0.00 },
  FRIEND:  { survive: 0.08, chaos: -0.05, sacrifice: -0.05 },
  LOVER:   { survive: 0.06, chaos: 0.03, sacrifice: 0.12 },
  ENEMY:   { survive: -0.08, chaos: 0.18, sacrifice: 0.10 },
  MASTER:  { survive: 0.04, chaos: -0.02, sacrifice: 0.00 },
};

function relMod() {
  return REL_MOD[relType()] || REL_MOD.NEUTRAL;
}

// 확률 보정 유틸 (p에 delta를 더해 clamp)
function pAdj(p, delta) {
  return clamp(p + delta, 0, 0.98);
}


/* -------------------------------
  8) Relationship sacrifice resolver
--------------------------------*/
function pickVictimByRelation() {
  const alive = [0, 1].filter((i) => state.chars[i].alive);
  if (alive.length === 1) return alive[0];
  if (alive.length === 0) return 0;

  const rel = relType();

  let v = chance(0.5) ? 0 : 1;

  if (rel === "MASTER") {
    const master = clamp(state.relation.masterIndex ?? 0, 0, 1);
    v = master;
  } else if (rel === "LOVER") {
    v = chance(0.55) ? 0 : 1;
  } else if (rel === "ENEMY") {
   v = chance(0.75) ? 1 : 0;
  } else if (rel === "FRIEND") {
    v = chance(0.52) ? 0 : 1;
  }

  return v;
}


/* -------------------------------
  9) Bad Ending Sequence (slow + dismantle)
--------------------------------*/
async function badEndingSequence(title, reason) {
  ensureEndingOverlay();
  lockUI(true);

  await logSlow("system", "SYSTEM: 연결 상태 불안정.", 520);

  const speaker = state.chars[0].alive ? 0 : 1;
  if (state.chars[speaker].alive) {
    await logDialogue(whoName(speaker), "…뭔가, 잘못됐어.", 560);

  }

  const steps = [
    ["fingers_l", "손가락(L)"],
    ["fingers_r", "손가락(R)"],
    ["wrist_l", "손목(L)"],
    ["wrist_r", "손목(R)"],
    ["arm_l", "팔(L)"],
    ["arm_r", "팔(R)"],
    ["leg_l", "다리(L)"],
    ["leg_r", "다리(R)"],
    ["heart", "심장"],
    ["brain", "뇌"],
    ["head", "머리"],
  ];

  for (const [key, label] of steps) {
    for (let i = 0; i < 2; i++) {
      const b = state.chars[i].body;
      if (key === "fingers_l") b.fingers_l.cur = 0;
      else if (key === "fingers_r") b.fingers_r.cur = 0;
      else if (key in b) b[key] = false;

      if (!b.leg_l && !b.leg_r) state.chars[i].alive = false;
    }
    syncHUD();
    await logSlow("event", noiseify(`기록: ${label} 부위가 손상당했습니다.`), 100);
  }

  killChar(0); killChar(1);
  destroyAllParts(0); destroyAllParts(1);
  syncHUD();

  await logSlow("event", noiseify("환자 등록이 완료되었습니다."), 600);
  await logSlow("system", "SYSTEM: 완벽하게 환자로 등록되었습니다.", 600);

  await sleep(1000);

  const overlay = $("#ending-overlay");
  const body = $("#ending-overlay .ending-body");
  const t = $("#ending-overlay .ending-title");
  if (t) t.textContent = "GAME OVER";
  if (body) body.textContent = `${title}\n${reason}`;
  overlay?.classList.add("show");
}

/* -------------------------------
  10) Movement (Elevator + sequence enforcement)
--------------------------------*/
function openElevatorMenu() {
  setChoices([
    { label: "1F", onClick: () => goElevator(1) },
    { label: "2F", onClick: () => goElevator(2) },
    { label: "3F", onClick: () => goElevator(3) },
    { label: "4F", onClick: () => goElevator(4) },
    { label: "5F", onClick: () => goElevator(5) },
    { label: "6F", onClick: () => goElevator(6) },
    { label: "7F", onClick: () => goElevator(7) },
  ]);
}

function allowedFloorsByStage(stage) {
  // Elevator is possible 1~7 but sequence matters: wrong target => bad ending.
  // Return Set of allowed floors in current stage (besides "stay")
  const s = new Set();

  if (stage === "LOBBY_1F") s.add(1);
  if (stage === "TO_2F") s.add(2);
  if (stage === "F2_ROOM5") s.add(2);
  if (stage === "TO_3F") s.add(3);
  if (stage === "F3_ASSIGN" || stage === "F3_ASK" || stage === "F3_KEYCHECK" || stage === "F3_ROOM" || stage === "KEY_WAIT" || stage === "F3_FORCE_REPORT") s.add(3);
  if (stage === "F3_ASK" || stage === "F3_KEYCHECK" || stage === "F3_ROOM" || stage === "KEY_WAIT") s.add(3);
  if (stage === "TO_4F" || stage === "F4_PICK" || stage === "SURG2_TALK" || stage === "SURG2_PHRASE" || stage === "PLAYROOM") s.add(4);
  if (stage === "TO_5F" || stage === "F5_IMPULSE" || stage === "F5_WARD" || stage === "F5_WALL" || stage === "F5_BODYCHECK") s.add(5);
  if (stage === "TO_6F" || stage === "F6_HUNGER" || stage === "F6_MALL" || stage === "F6_ICE" || stage === "F6_PASTA") s.add(6);
  if (stage === "RETURN_1F" || stage === "COUNTER" || stage === "MORGUE" ) s.add(1);
  if (stage === "ROOF_INTRO" || stage === "ROOF_CHOICE") s.add(7);

  // special: COUNTER allows 4F revisit option (rule 21) + roof (key) but elevator misuse kills; we expose via explicit buttons not free
  return s;
}

async function goElevator(floor) {
  lockUI(true);

  // 2F gating: needs unlock2F + confirmed
  if (floor === 2 && !(state.progress.unlock2F && state.progress.confirmed)) {
    await logSlow("event", "아직 그곳은 접근할 수 없습니다.", 520);
    lockUI(false);
    renderStage();
    return;
  }

  const allowed = allowedFloorsByStage(state.progress.stage);
  if (!allowed.has(floor)) {
    await logSlow("event", noiseify("…엘리베이터가 멈춥니다."), 520);
    await badEndingSequence("규정 위반", "이동 순서가 손상되었습니다.");
    return;
  }

  state.progress.floor = floor;
  state.progress.area = `${floor}F`;
  saveState();
  await logSlow("system", `SYSTEM: ${floor}F`, 520);

  await onArriveFloor(floor);
  await maybeInjectDialogue(`ARRIVE_${floor}F`);
  lockUI(false);
  renderStage();
}

async function onArriveFloor(floor) {
  if (floor === 2 && state.progress.stage === "TO_2F") {
    state.progress.stage = "F2_ROOM5";
    state.progress.area = "2F";
    await logSlow("event", noiseify("…문 하나만 열려 있습니다."), 520);
    saveState();
    return;
  }

 if (floor === 3 && state.progress.stage === "TO_3F") {
  state.progress.stage = "F3_ASSIGN";
  state.progress.area = "3F";

  state.progress.f3RerollsLeft = 2;
  state.progress.f3AssignedRoom = weightedPickRoom3F();

  await logSlow("event", noiseify("…간호사가 당신의 진료실을 배정합니다."), 520);
  await logSlow("system", `SYSTEM: ${state.progress.f3AssignedRoom}번 진료실`, 520);

  saveState();
  return;
}

  if (floor === 4 && state.progress.stage === "TO_4F") {
    state.progress.stage = "F4_PICK";
    state.progress.area = "4F";
    await logSlow("event", noiseify("…문이 네 개 보입니다."), 520);
    saveState();
    return;
  }

  if (floor === 5 && state.progress.stage === "TO_5F") {
    state.progress.stage = "F5_IMPULSE";
    state.progress.area = "5F";
    await logSlow("event", noiseify("…충돌음이 들립니다."), 520);
    saveState();
    return;
  }

  if (floor === 6 && state.progress.stage === "TO_6F") {
    state.progress.stage = "F6_HUNGER";
    state.progress.area = "6F";
    await logSlow("event", noiseify("…배고픔이 올라옵니다."), 520);
    saveState();
    return;
  }

  if (floor === 1 && state.progress.stage === "RETURN_1F") {
    state.progress.stage = "COUNTER";
    state.progress.area = "COUNTER";
    state.progress.morgueAccess = true;
    await logSlow("event", "카운터에 도착했습니다.", 520);
    await logSlow("event", "..이제 어디로 가시겠습니까?", 520);
    saveState();
    return;
  }

  if (floor === 7 && (state.progress.stage === "ROOF_INTRO" || state.progress.stage === "ROOF_CHOICE")) {
    state.progress.area = "ROOF";
    saveState();
    return;
  }
}

/* -------------------------------
  11) Story: 2F room 5 (girl key)
--------------------------------*/
async function enter2FRoom5() {
  lockUI(true);
  await logSlow("event", noiseify("…입원실 5."), 520);
  await logSlow("event", noiseify("…여자아이가 당신을 봅니다."), 520);

  setChoices([
    { label: "살고싶다", onClick: () => girlChoice2F("LIVE") },
    { label: "죽고싶다", onClick: () => girlChoice2F("DIE") },
    { label: "없애고싶다", onClick: () => girlChoice2F("ERASE") },
  ]);
  lockUI(false);
}

async function girlChoice2F(v) {
  lockUI(true);

  if (v === "ERASE") {
    state.progress.hasRooftopKey = true;
    await logSlow("event", noiseify("…열쇠가 떨어집니다."), 520);
    await logSlow("system", "SYSTEM: 옥상 열쇠가 등록됩니다.", 520);
  } else {
    await logSlow("event", noiseify("…아이는 웃지 않습니다."), 520);
  }

  // back to 1F flow: you must continue story -> 3F
  state.progress.stage = "TO_3F";
  state.progress.area = "ELEVATOR";
  saveState();

  await logSlow("system", "SYSTEM: 3F로 이동하십시오.", 520);
  lockUI(false);
  renderStage();
}

/* -------------------------------
  12) Story: 3F ask / key mismatch logic
--------------------------------*/
function weightedPickRoom3F() {
  const r = Math.random();
  if (r < 0.78) return 8;
  return randi(1, 7);
}

async function answerF3Clinic(n) {
  lockUI(true);

  if (n !== 8) {
    await logSlow("event", noiseify("…그건 아니었는데."), 520);
    await badEndingSequence("기록 불일치", "질의응답이 종료되었습니다.");
    return;
  }

  // correct answer, but sometimes wrong key is given (rule 8-1)
  const rm = relMod();
const wrongKey = chance(pAdj(0.18, rm.chaos * 0.6)); // 혼돈 성향이 키 오류에 반영

  if (wrongKey) {
    state.progress.stage = "F3_KEYCHECK";
    state.progress.f3KeyWrongOnce = false;
    await logSlow("system", "SYSTEM: 키가 전달됩니다.", 520);
    await logSlow("event", noiseify("…키가 이상합니다."), 520);
    saveState();
    lockUI(false);
    renderStage();
    return;
  }

  await logSlow("system", "SYSTEM: 확인.", 520);
  state.progress.stage = "F3_ROOM";
  state.progress.area = "3F";
  saveState();
  await maybeGrandmaF3();
  lockUI(false);
  renderStage();
}
async function f3Reroll() {
  lockUI(true);

  if ((state.progress.f3RerollsLeft ?? 0) <= 0) {
    await logSlow("event", noiseify("…더 이상 변경할 수 없습니다."), 520);
    lockUI(false);
    renderStage();
    return;
  }

  state.progress.f3RerollsLeft = clamp((state.progress.f3RerollsLeft ?? 0) - 1, 0, 2);
  state.progress.f3AssignedRoom = weightedPickRoom3F();


  await logSlow("event", noiseify("…배정이 변경됩니다."), 520);
  await logSlow("system", `SYSTEM: ${state.progress.f3AssignedRoom}번 진료실`, 520);
  await logSlow("system", `SYSTEM: 변경 기회 ${state.progress.f3RerollsLeft}회 남음`, 420);

  saveState();
  lockUI(false);
  renderStage();
}

async function f3AcceptAssignment() {
  lockUI(true);

  const n = Number(state.progress.f3AssignedRoom);

  await logSlow("event", noiseify("…배정을 확정합니다."), 520);

  if (n === 8) {
    await logSlow("system", "SYSTEM: 확인.", 520);
    state.progress.stage = "F3_ROOM"; // 기존 3층 '방(서랍/행인/아무것도)'로
    saveState();
    await maybeGrandmaF3();
    lockUI(false);
    renderStage();
    return;
  }

  state.progress.stage = "F3_FORCE_REPORT";
  saveState();

  await logSlow("event", noiseify("…이상합니다."), 520);
  await logSlow("system", "SYSTEM: 이상을 보고하십시오.", 520);

  lockUI(false);
  renderStage();
}

async function f3ForcedReport() {
  lockUI(true);

  await logSlow("event", noiseify("…이상이 있습니다."), 520);

  // 기존 로직 재활용: 키가 이상한 상황으로 취급
  // (너의 8-1/8-2 트리 유지)
  state.progress.stage = "F3_KEYCHECK";
  state.progress.f3KeyWrongOnce = false;
  saveState();

  await logSlow("event", noiseify("…재차례 키를 전달합니다."), 520);

  lockUI(false);
  renderStage();
}

async function reportF3KeyAnomaly() {
  lockUI(true);

  await logSlow("event", noiseify("…이상이 있습니다."), 520);
  await logSlow("event", noiseify("…재차례 키를 전달합니다."), 520);

  if (state.progress.f3KeyWrongOnce) {
    // second time wrong => immediate death (rule 8-2)
    await logSlow("event", noiseify("…다시, 다릅니다."), 520);
    await badEndingSequence("입원 판정", "키가 끝내 일치하지 않습니다.");
    return;
  }

  // first retry: small chance still wrong (dead), else proceed
  state.progress.f3KeyWrongOnce = true;
  const stillWrong = chance(0.22);

  if (stillWrong) {
    await logSlow("event", noiseify("…다시, 다릅니다."), 520);
    await badEndingSequence("입원 판정", "키가 끝내 일치하지 않습니다.");
    return;
  }

  await logSlow("system", "SYSTEM: 키가 갱신됩니다.", 520);
  state.progress.stage = "F3_ROOM";
  saveState();
  await maybeGrandmaF3();
  lockUI(false);
  renderStage();
}

async function maybeGrandmaF3() {
  // 9-1: talkative grandma sometimes; fail => admitted
  const appears = chance(0.22);
  if (!appears) return;

  await logSlow("event", noiseify("…말이 많은 할머니가 있습니다."), 520);

  // 판정: 지능/행운 기반
  const pass = (bestKnow() >= 4) || (bestLuck() >= 60 && chance(0.55));
  if (!pass) {
    await logSlow("event", noiseify("…할머니가 계속 말을 겁니다."), 520);
    await logSlow("event", noiseify("…하루종일."), 520);
    await badEndingSequence("입원 확정", "말이 끊기지 않습니다.");
    return;
  }

  await logSlow("event", noiseify("…당신은 고개만 끄덕입니다."), 520);
}

async function openDrawerF3() {
  lockUI(true);
  await logSlow("event", "서랍을 열었습니다.", 520);

  state.progress.hasKeyFrom3F = true;
  await logSlow("system", "SYSTEM: 키가 확인됩니다.", 520);

  state.progress.stage = "KEY_WAIT";
  saveState();
  lockUI(false);
  renderStage();
}

async function talkStrangerF3() {
  lockUI(true);
  await logSlow("event", noiseify("…(중얼거림)"), 520);

  // 9-2: mental >=4 & 30% chance, only one char may succeed
  if (bestMental() >= 4 && chance(0.30) && !state.progress.hasHandkerchief) {
    state.progress.hasHandkerchief = true;
    await logSlow("system", "SYSTEM: 물품이 등록됩니다.", 520);
  } else {
    await logSlow("event", noiseify("…대답이 없습니다."), 420);
  }

  saveState();
  lockUI(false);
  renderStage();
}

async function doNothingF3() {
  lockUI(true);
  await badEndingSequence("입원 확정", "절차가 정지되었습니다.");
}

/* -------------------------------
  13) Story: 4F
--------------------------------*/
async function enterF4Room(kind) {
  lockUI(true);

  if (!state.progress.hasKeyFrom3F) {
    await badEndingSequence("키 오류", "키가 없습니다.");
    return;
  }

  if (state.progress.stage !== "F4_PICK") {
    await badEndingSequence("규정 위반", "절차가 겹쳤습니다.");
    return;
  }

  if (kind === "CLINIC1") {
    await logSlow("event", noiseify("…진료실 1."), 520);
    await logSlow("event", noiseify("…처음으로 되돌아갑니다."), 520);

    // reset from admission-room (F3) — keep character data, clear some flags
    state.progress.hasKeyFrom3F = false;
    state.progress.f3KeyWrongOnce = false;
    state.progress.stage = "TO_3F";
    state.progress.area = "ELEVATOR";
    saveState();

    lockUI(false);
    renderStage();
    return;
  }

  if (kind === "CLINIC2") {
    await logSlow("event", noiseify("…진료실 2."), 520);
    // teeth removed
    state.chars[0].body.teeth.cur = 0;
    state.chars[1].body.teeth.cur = 0;
    syncHUD();
    await logNarration("기록: 치아가 소실되었습니다.", 520);

    // back to F4 pick
    lockUI(false);
    renderStage();
    return;
  }

  if (kind === "SURG1") {
    await logSlow("event", noiseify("…수술실 1."), 520);
    await logSlow("event", noiseify("…내장."), 520);

    const victim = pickVictimByRelation();
    killChar(victim);
    syncHUD();

    await logSlow("event", noiseify(`기록: ${victim === 0 ? mosaicName() : mosaicName()}의 상태가 종료되었습니다.`), 520);
    await logSlow("event", `${whoName(victim)}: …`, 520);

    // if one dies, NO SIGNAL is automatic via HUD
    // proceed: still can continue if at least one alive
    if (!state.chars[0].alive && !state.chars[1].alive) {
      await badEndingSequence("수술", "아무도 남지 않았습니다.");
      return;
    }

    // now must do surg2 doctor route to unlock playroom properly
    await logSlow("system", "SYSTEM: 다음 절차가 필요합니다.", 520);
    lockUI(false);
    renderStage();
    return;
  }

  if (kind === "SURG2") {
    await logSlow("event", noiseify("…수술실 2."), 520);
    state.progress.stage = "SURG2_TALK";
    saveState();
    lockUI(false);
    renderStage();
    return;
  }
}

async function surg2Talk(target) {
  lockUI(true);

  if (target === "NURSE") {
    await logSlow("event", noiseify("…간호사에게 말을 겁니다."), 520);
    const victim = pickVictimByRelation();
    killChar(victim);
    syncHUD();
    await logSlow("event", noiseify("…수면제가 투여됩니다."), 520);
    await logSlow("event", `${whoName(victim)}: …`, 520);

    if (!state.chars[0].alive && !state.chars[1].alive) {
      await badEndingSequence("수면", "아무도 남지 않았습니다.");
      return;
    }

    lockUI(false);
    renderStage();
    return;
  }

  if (target === "REPAIR") {
    await logSlow("event", noiseify("…수리기사에게 말을 겁니다."), 520);
    state.chars[0].body.eyes.cur = 0;
    state.chars[1].body.eyes.cur = 0;
    syncHUD();
    await logSlow("event", noiseify("기록: 시각 기관이 소멸했습니다."), 520);
    // 이후 선택지 전부 노이즈 처리 (시스템적으로는 라벨만 노이즈)
    lockUI(false);
    renderStage();
    return;
  }

  if (target === "DOCTOR") {
    await logSlow("event", noiseify("…담당 의사가 돌아봅니다."), 520);
    state.progress.stage = "SURG2_PHRASE";
    saveState();
    lockUI(false);
    renderStage();
    return;
  }
}

async function surg2Phrase(ok) {
  lockUI(true);

  if (!ok) {
    await logSlow("event", noiseify("전신 마취? 오랜만에 들어보네요"), 520);
    await badEndingSequence("마취", "수술대 위에 누우셔야겠습니다. 당신 말입니다.");
    return;
  }

  await logSlow("event", "…", 380);
  await logSlow("event", noiseify("이해했습니다, 원하신다면야."), 520);

  // surg2 becomes playroom accessible
  state.progress.stage = "PLAYROOM";
  saveState();

  lockUI(false);
  renderStage();
}

/* -------------------------------
  14) Story: Playroom (12)
--------------------------------*/
async function enterPlayroom() {
  lockUI(true);

  // child presence: luck check
  const luck = bestLuck();
  const childHere = (luck >= 55) ? chance(0.85) : chance(0.55);

  await logSlow("event", noiseify("…놀이방."), 520);

  if (!childHere) {
    await logSlow("event", noiseify("…아이가 없습니다."), 520);
    await logSlow("event", noiseify("어쩌죠, 수술을 하기 위해서.. 한 명은 꼭 필요한데."), 520);
    await logSlow("event", noiseify("누가 가겠습니까?"), 520);

    // 12-3: must abandon one
    setChoices([
      { label: "SUBJECT_01", onClick: async () => { await abandonOne(0); } },
      { label: "SUBJECT_02", onClick: async () => { await abandonOne(1); } },
    ]);
    lockUI(false);
    return;
  }

  await logSlow("event", noiseify("…아이가 있습니다."), 520);
    await logSlow("event", noiseify("아이를 데리고 어디로 가실겁니까?"), 520);

  setChoices([
    { label: "수술실 2", onClick: async () => sendChildToSurg2() },
    // any other request => you become patient (12-2)
    { label: "진료실 1", onClick: async () => badEndingSequence("요청", "수술실 2의 자리는 당신이 됩니다.") },
    { label: "진료실 2", onClick: async () => badEndingSequence("요청", "수술실 2의 자리는 당신이 됩니다.") },
    { label: "수술실 1", onClick: async () => badEndingSequence("요청", "수술실 2의 자리는 당신이 됩니다.") },
  ]);

  lockUI(false);
}

async function abandonOne(idx) {
  lockUI(true);
  killChar(idx);
  syncHUD();
  await logSlow("event", noiseify("…문이 닫힙니다."), 520);
  await logSlow("event", `${whoName(idx)}: …`, 520);

  if (!state.chars[0].alive && !state.chars[1].alive) {
    await badEndingSequence("포기", "아무도 남지 않았습니다.");
    return;
  }

  state.progress.stage = "TO_5F";
  state.progress.area = "ELEVATOR";
  saveState();
  await logSlow("system", "SYSTEM: 5F로 이동하십시오.", 520);

  lockUI(false);
  renderStage();
}

async function sendChildToSurg2() {
  lockUI(true);
  state.progress.childSentToSurg2 = true;
  await logSlow("event", noiseify("…아이가 고개를 끄덕입니다."), 520);
  await logSlow("system", "SYSTEM: 요청이 기록됩니다.", 520);

  // 13: after this, go 5F
  state.progress.stage = "TO_5F";
  state.progress.area = "ELEVATOR";
  saveState();

  lockUI(false);
  renderStage();
}

/* -------------------------------
  15) Story: 5F impulse + ward + wall
--------------------------------*/
async function f5ImpulseStart() {
  lockUI(true);

  // random impulse text
  const pool = ["나가고싶다", "소리치고싶다", "입원하고싶다"];
  const impulse = pool[randi(0, pool.length - 1)];

  await logSlow("event", noiseify(`…${impulse}`), 520);

  // 14-3: rare "no impulse"
  const noImpulse = chance(0.08);
  if (noImpulse) {
    await logSlow("event", noiseify("…아무것도 느껴지지 않습니다."), 520);
    await logSlow("system", "SYSTEM: 4F를 재방문하십시오.", 520);

    state.progress.stage = "TO_4F";
    state.progress.area = "ELEVATOR";
    saveState();

    lockUI(false);
    renderStage();
    return;
  }

  // if both eyes are gone for BOTH chars, auto skip
  const eyesOkA = state.chars[0].body.eyes.cur > 0;
  const eyesOkB = state.chars[1].body.eyes.cur > 0;
  const anyEyes = eyesOkA || eyesOkB;

  if (!anyEyes) {
    await logSlow("event", noiseify("…"), 420);
    state.progress.stage = "F5_WARD";
    saveState();
    lockUI(false);
    renderStage();
    return;
  }

  await logSlow("event", noiseify("…눈을 감습니다... 얼마나, 감으실 것입니까?"), 520);

  setChoices([
    { label: "8", onClick: () => f5Count(8) },
    { label: "9", onClick: () => f5Count(9) },
    { label: "10", onClick: () => f5Count(10) },
    { label: "11", onClick: () => f5Count(11) },
  ]);
  lockUI(false);
}

async function f5Count(n) {
  lockUI(true);

  if (n !== 10) {
    await logSlow("event", noiseify("…충동은 억제되지 않습니다."), 520);
    await badEndingSequence("충동", "눈을 뜬 순간, 절차가 종료되었습니다.");
    return;
  }

  await logSlow("event", noiseify("…"), 520);
  state.progress.stage = "F5_WARD";
  saveState();

  lockUI(false);
  renderStage();
}

async function f5Ward() {
  lockUI(true);

  const rm = relMod();
  const base = 0.25;
  const argueChance = pAdj(base, rm.chaos); // ENEMY면 더 싸움, FRIEND/MASTER면 덜 싸움


  if (chance(argueChance)) {
    await logSlow("event", noiseify("…언쟁이 시작됩니다."), 520);

    setChoices([
      { label: "말한다", onClick: async () => f5SpeakDeath() },
      { label: "침묵", onClick: async () => f5GoWallRule() },
    ]);
    lockUI(false);
    return;
  }

  await logSlow("event", noiseify("…당신은 숨을 죽입니다."), 520);
  lockUI(false);
  await f5GoWallRule();
}

async function f5SpeakDeath() {
  lockUI(true);

  for (let i = 0; i < 15; i++) {
    await logSlow("event", noiseify("…그들이 당신들을 쳐다본다"), 120);
  }
  await sleep(1000);
  await badEndingSequence("소음", "말소리를 냈습니다.");
}

async function f5GoWallRule() {
  lockUI(true);
  state.progress.stage = "F5_WALL";
  saveState();
  await logSlow("system", "SYSTEM: 조용히.", 520);
  await logSlow("system", "어디로 이동하시겠습니까?", 520);
  lockUI(false);
  renderStage();
}

async function f5EnterWrongRoom() {
  lockUI(true);

  // 16: entering rooms causes random amputations, then chase
  const who = pickVictimByRelation();
  const roll = randi(1, 6);
  if (roll === 1) loseWholeLeg(who, chance(0.5) ? "L" : "R");
  else if (roll === 2) state.chars[who].body[chance(0.5) ? "arm_l" : "arm_r"] = false;
  else if (roll === 3) loseFinger(who, "L");
  else if (roll === 4) loseFinger(who, "R");
  else if (roll === 5) state.chars[who].body[chance(0.5) ? "wrist_l" : "wrist_r"] = false;
  else state.chars[who].body.head = false;

  syncHUD();
  await logSlow("event", noiseify("기록: 부위가 절단되었습니다."), 520);

  // if both whole legs lost => immediate death
  if (bothLegsGone(who)) {
    await badEndingSequence("과다출혈", "두 개의 다리가 소실되었습니다.");
    return;
  }

  // chase rule 16-1
  await logSlow("event", noiseify("…그들이 당신을 쫓습니다."), 520);

  // if can't run (any whole leg missing) -> death
  const canRun = state.chars[0].alive && state.chars[1].alive
    ? (!anyLegMissing(0) && !anyLegMissing(1))
    : (state.chars[0].alive ? !anyLegMissing(0) : !anyLegMissing(1));

  if (!canRun) {
    await badEndingSequence("추격", "다리가 불완전합니다.");
    return;
  }

  state.progress.moveMode = "RUN";
  saveState();

  setChoices([
    { label: "1F", onClick: async () => f5ChasePickFloor(1) },
    { label: "3F", onClick: async () => f5ChasePickFloor(3) },
    { label: "4F", onClick: async () => f5ChasePickFloor(4) },
  ]);
  lockUI(false);
}

async function f5ChasePickFloor(f) {
  lockUI(true);

  if (f !== 1) {
    await logSlow("event", noiseify("…아무것도 할 수 없습니다."), 520);
    await badEndingSequence("추격", "도망칠 곳이 없습니다.");
    return;
  }

  // choose stairs vs elevator (elevator = doctor talk eat => death)
  setChoices([
    { label: "계단", onClick: async () => f5ChaseStairs() },
    { label: "엘리베이터", onClick: async () => f5ChaseElevatorDeath() },
  ]);
  lockUI(false);
}

async function f5ChaseElevatorDeath() {
  lockUI(true);
  await logSlow("event", noiseify("…의사가 말을 겁니다."), 520);
  await badEndingSequence("추격", "엘리베이터는 열리지 않습니다.");
}

async function f5ChaseStairs() {
  lockUI(true);

  await logSlow("event", noiseify("…계단을 내려갑니다."), 520);

  state.progress.floor = 1;
  state.progress.area = "OUTSIDE";
  state.progress.stage = "LOBBY_1F";
  state.progress.moveMode = "WALK";
  saveState();

  await logSlow("system", "SYSTEM: 밖으로 나가 재진행하십시오.", 520);

  lockUI(false);
  renderStage();
}

async function f5WallSuccess() {
  lockUI(true);

  // wall tap success
  await logSlow("event", noiseify("…벽."), 520);
  state.progress.wallTapped = true;
  saveState();

  // 17: must check body status (random loss at least 1)
  const lossCount = randi(1, 3);
  for (let i = 0; i < lossCount; i++) {
    const who = chance(0.5) ? 0 : 1;
    const b = state.chars[who].body;
    const pool = ["fingers_l", "fingers_r", "arm_l", "arm_r", "leg_l", "leg_r", "wrist_l", "wrist_r"];
    const k = pool[randi(0, pool.length - 1)];
    if (k === "fingers_l") b.fingers_l.cur = clamp(b.fingers_l.cur - 1, 0, b.fingers_l.max);
    else if (k === "fingers_r") b.fingers_r.cur = clamp(b.fingers_r.cur - 1, 0, b.fingers_r.max);
    else b[k] = false;
  }
  syncHUD();
  await logSlow("event", noiseify("…무언가 사라진 것 같습니다."), 520);

  if (bothLegsGone(0) || bothLegsGone(1)) {
    await badEndingSequence("과다출혈", "두 개의 다리가 소실되었습니다.");
    return;
  }

  state.progress.stage = "F5_BODYCHECK";
  saveState();
  lockUI(false);
  renderStage();
}

async function f5SkipBodyCheckDeath() {
  lockUI(true);
  await logSlow("event", noiseify("…확인하지 않습니다."), 520);

  // 17-1: internal organs missing -> high death (luck check)
  const rm = relMod();
const survive = (bestLuck() >= 75) && chance(pAdj(0.35, rm.survive));

  if (!survive) {
    await badEndingSequence("내장 실종", "확인 절차가 생략되었습니다.");
    return;
  }

  await logSlow("event", noiseify("…이상은, 아직 없습니다."), 520);
  // proceed to 6F
  state.progress.stage = "TO_6F";
  state.progress.area = "ELEVATOR";
  saveState();
  lockUI(false);
  renderStage();
}

async function f5ConfirmBody() {
  lockUI(true);
  await logSlow("event", noiseify("…상태를 확인합니다."), 520);

  state.progress.bodyCheckedAfter5F = true;
  saveState();

  // proceed to 6F
  state.progress.stage = "TO_6F";
  state.progress.area = "ELEVATOR";
  saveState();

  await logSlow("system", "SYSTEM: 6F로 이동하십시오.", 520);

  lockUI(false);
  renderStage();
}

/* -------------------------------
  16) Story: 6F hunger + mall + ice + pasta
--------------------------------*/
async function f6HungerStart() {
  lockUI(true);

  // must close eyes count 5 seconds (exact)
  const anyEyes = (state.chars[0].body.eyes.cur > 0) || (state.chars[1].body.eyes.cur > 0);
  if (anyEyes) {
    await logSlow("event", noiseify("…눈을 감습니다."), 520);
    setChoices([
      { label: "4", onClick: () => f6Count(4) },
      { label: "5", onClick: () => f6Count(5) },
      { label: "6", onClick: () => f6Count(6) },
    ]);
    lockUI(false);
    return;
  }

  // eyes gone -> still must be "skipped" cleanly
  await logSlow("event", noiseify("…"), 420);
  state.progress.stage = "F6_MALL";
  saveState();
  lockUI(false);
  renderStage();
}

async function f6Count(n) {
  lockUI(true);

  if (n !== 5) {
    await badEndingSequence("충동", "배고픔을 억제하지 못했습니다.");
    return;
  }

  await logSlow("event", noiseify("…"), 520);
  state.progress.stage = "F6_MALL";
  saveState();

  lockUI(false);
  renderStage();
}

async function f6Mall() {
  lockUI(true);

  await logSlow("event", noiseify("…음식점들이 보입니다."), 520);
  await logSlow("event", noiseify("어디로 가시겠습니까?."), 520);

  // 19-2: icecream store exists by luck
  const iceExists = (bestLuck() >= 60) ? chance(0.75) : chance(0.35);

  const btns = [];
  if (iceExists && !state.progress.icecreamCupBought) {
    btns.push({ label: "아이스크림", onClick: async () => f6Icecream() });
  }
  btns.push({ label: "파스타", onClick: async () => f6Pasta() });

  // other stores: demand parts (20-2)
  btns.push({ label: "매장 A", onClick: async () => f6OtherStore() });
  btns.push({ label: "매장 B", onClick: async () => f6OtherStore() });

  setChoices(btns.map(b => ({
    label: (state.chars[0].body.eyes.cur === 0 && state.chars[1].body.eyes.cur === 0) ? noiseify(b.label, 0.9) : b.label,
    onClick: b.onClick
  })));

  lockUI(false);
}

async function f6OtherStore() {
  lockUI(true);

  await logSlow("event", noiseify("…대가가 필요합니다."), 520);

  const who = pickVictimByRelation();
  const luck = state.chars[who].luck ?? 0;

  // mostly finger/toe; sometimes wrist/ankle; very bad = whole arm
  if (chance(0.60)) {
    loseFinger(who, chance(0.5) ? "L" : "R");
    await logSlow("event", noiseify("기록: 손가락이 요구되었습니다."), 520);
  } else if (chance(0.20)) {
    state.chars[who].body[chance(0.5) ? "wrist_l" : "wrist_r"] = false;
    await logSlow("event", noiseify("기록: 손목이 요구되었습니다."), 520);
  } else if (luck < 20 && chance(0.35)) {
    state.chars[who].body[chance(0.5) ? "arm_l" : "arm_r"] = false;
    await logSlow("event", noiseify("기록: 팔이 소실되었습니다."), 520);
  } else {
    loseFinger(who, chance(0.5) ? "L" : "R");
    await logSlow("event", noiseify("기록: 대가가 지불되었습니다."), 520);
  }

  syncHUD();
  lockUI(false);
  renderStage();
}

async function f6Icecream() {
  lockUI(true);

  // choose who orders
  
  await logSlow("event", noiseify("주문자는?"), 520);
  setChoices([
    { label: "SUBJECT_01", onClick: async () => f6IceOrder(0) },
    { label: "SUBJECT_02", onClick: async () => f6IceOrder(1) },
  ]);
  lockUI(false);
}

async function f6IceOrder(who) {
  lockUI(true);
  
  await logSlow("event", noiseify("수여 방식은?"), 520);
  setChoices([
    { label: "컵", onClick: async () => f6IceResult(who, "CUP") },
    { label: "콘", onClick: async () => f6IceResult(who, "CONE") },
  ]);
  lockUI(false);
}

async function f6IceResult(who, type) {
  lockUI(true);

  if (type === "CONE") {
    await logSlow("event", noiseify("…"), 520);
    await badEndingSequence("즉사", "콘을 선택했습니다.");
    return;
  }

  state.progress.icecreamCupBought = true;
  await logSlow("event", noiseify("…컵 아이스크림."), 520);
  await logSlow("system", "SYSTEM: 구매 기록.", 520);

  saveState();
  lockUI(false);
  renderStage();
}

async function f6Pasta() {
  lockUI(true);

  await logSlow("event", noiseify("…파스타집."), 520);
  await logSlow("event", noiseify("당신은 그녀에게 약간의 언질을 전합니다."), 520);
  await logSlow("event", noiseify("…무슨 말이지..기억은 나지 않습니다"), 520);
  await logSlow("event", noiseify("…자신도 모르게.. 본능이 행했거든요."), 520);


  // must report child went to surg2
  if (!state.progress.childSentToSurg2) {
    await badEndingSequence("절차 누락", "4층 요청이 확인되지 않습니다.");
    return;
  }

  await logSlow("event", noiseify("…직원이 묻습니다."), 520);

  // very rare verification question
  const verify = chance(0.06);

  if (verify) {
    setChoices([
      { label: "착각", onClick: async () => f6PastaMistake() },
      { label: "확인", onClick: async () => badEndingSequence("질의", "진위 확인에 실패했습니다.") },
    ]);
    lockUI(false);
    return;
  }

  // normal: report success
  state.progress.pastaReported = true;
  await logSlow("event", noiseify("…전달했습니다."), 520);

  // 20-3: discard food immediately (we just log)
  await logSlow("event", noiseify("…폐기합니다."), 520);

  // return to 1F
  state.progress.stage = "RETURN_1F";
  state.progress.area = "ELEVATOR";
  saveState();
  await logSlow("system", "SYSTEM: 1F로 돌아가십시오.", 520);

  lockUI(false);
  renderStage();
}

async function f6PastaMistake() {
  lockUI(true);
  await logSlow("event", noiseify("…착각했습니다."), 520);
  await logSlow("event", noiseify("…자리를 뜹니다."), 520);

  // come back and succeed
  await logSlow("event", noiseify("…다시 돌아옵니다."), 520);
  state.progress.pastaReported = true;
  await logSlow("event", noiseify("…전달했습니다."), 520);

  state.progress.stage = "RETURN_1F";
  state.progress.area = "ELEVATOR";
  saveState();
  await logSlow("system", "SYSTEM: 1F로 돌아가십시오.", 520);

  lockUI(false);
  renderStage();
}

/* -------------------------------
  17) Counter: Morgue / Roof / 4F (rule 21)
--------------------------------*/
async function counterToMorgue() {
  lockUI(true);

  if (!state.progress.morgueAccess) {
    await badEndingSequence("오류", "카운터 절차가 누락되었습니다.");
    return;
  }

  // morgue only by walking down from counter
  await logSlow("event", "당신은 카운터에서 걸어 내려갑니다.", 520);

  state.progress.stage = "MORGUE";
  state.progress.area = "MORGUE";
  saveState();

  lockUI(false);
  renderStage();
}

async function counterToRoof() {
  lockUI(true);

  // 21-1: if no roof key, you become key (one dies)
  if (!state.progress.hasRooftopKey) {
    const victim = pickVictimByRelation();
    killChar(victim);
    syncHUD();
    await logSlow("event", noiseify("…열쇠가 없습니다."), 520);
    await badEndingSequence("열쇠", "당신이 열쇠가 됩니다.");
    return;
  }

  // go to 7F then roof stage
  state.progress.stage = "ROOF_INTRO";
  state.progress.area = "ELEVATOR";
  state.progress.floor = 1;
  saveState();

  await logSlow("system", "SYSTEM: 7F로 이동하십시오.", 520);
  lockUI(false);
  renderStage();
}

/* -------------------------------
  18) Morgue sequence (22)
--------------------------------*/
async function morgueStart() {
  lockUI(true);

  await logSlow("event", noiseify("…영안실."), 520);
  await logSlow("event", noiseify("…무언가, 기도를 드려야 할 것 같습니다."), 520);
  await logSlow("event", noiseify("…그러한 충동이 느껴집니다."), 520);
  await logSlow("event", noiseify("…당신은 눈을 감고 기도합니다."), 520);
  await logSlow("event", noiseify("…얼마나 기도하시겠습니까?"), 520);

  if (state.progress.hasHandkerchief) {
    setChoices([
      { label: "SUBJECT_01", onClick: async () => morguePray(0, true) },
      { label: "SUBJECT_02", onClick: async () => morguePray(1, true) },
      { label: "사용 안 함", onClick: async () => morguePray(null, false) },
    ]);
    lockUI(false);
    return;
  }

  setChoices([
    { label: "20", onClick: async () => morgueCount(20, null) },
    { label: "30", onClick: async () => morgueCount(30, null) },
    { label: "40", onClick: async () => morgueCount(40, null) },
  ]);
  lockUI(false);
}

async function morguePray(who, useCloth) {
  lockUI(true);

  if (useCloth && (who === 0 || who === 1)) {
    await logSlow("event", noiseify("…손수건을 사용합니다."), 520);
  }

  // then count
  setChoices([
    { label: "20", onClick: async () => morgueCount(20, useCloth ? who : null) },
    { label: "30", onClick: async () => morgueCount(30, useCloth ? who : null) },
    { label: "40", onClick: async () => morgueCount(40, useCloth ? who : null) },
  ]);
  lockUI(false);
}

async function morgueCount(n, clothUserIdxOrNull) {
  lockUI(true);

  if (n !== 30) {
    await badEndingSequence("기도", "시간이 일치하지 않습니다.");
    return;
  }

  // 22-1: low chance admitted; cloth user exempt
  const rm = relMod();
  const baseAdmit = 0.18;
  const admitted = chance(pAdj(baseAdmit, rm.chaos * 0.5));

  if (admitted) {
    // choose who gets caught; cloth user exempt
    let victim = pickVictimByRelation();
    if (clothUserIdxOrNull === victim) victim = 1 - victim;

    await logSlow("event", noiseify("우다다다다"), 180);
    await logDialogue("영안실의 목소리", "…네 몸은 내 것이야.", 520);

    killChar(victim);
    syncHUD();

    if (!state.chars[0].alive && !state.chars[1].alive) {
      await badEndingSequence("입원", "아무도 남지 않았습니다.");
      return;
    }

    // if one survived -> still counts as failure in your vibe, but rule says "입원할지도"
    await badEndingSequence("입원", "기도가 끝나지 않았습니다.");
    return;
  }

  // 22-2: 현실 복귀 성공
  await goodEnding(
  "현실 복귀",
  "기도가 끝났고, 눈꺼풀 뒤로 빛이 번집니다.",
  "RETURN"
);

}

async function goodEnding(title, flavor, type = "RETURN") {
  ensureEndingOverlay();
  lockUI(true);

  // ✅ 하얀 배경 플래시(성공 연출)
  const overlay = $("#ending-overlay");
  if (overlay) {
    overlay.style.background = "rgba(255,255,255,0.96)";
    overlay.style.backdropFilter = "blur(2px)";
  }
  document.documentElement.style.background = "#fff";
  document.body.style.background = "#fff";

  await logSystem("SYSTEM: 연결이 안정화됩니다.", 520);
  if (flavor) await logNarration(flavor, 520);

  // ✅ 생존자 추출
  const alive = state.chars
    .map((c, i) => ({ i, name: c.name, alive: c.alive }))
    .filter(x => x.alive);

  const survivorText =
    alive.length === 0
      ? "생존자 없음"
      : alive.map(x => `- ${x.name || `SUBJECT_${String(x.i+1).padStart(2,"0")}`}`).join("\n");

  const body = $("#ending-overlay .ending-body");
  const t = $("#ending-overlay .ending-title");
  const panel = $("#ending-overlay .ending-panel");

  if (t) t.textContent = title;
  const extra =
  type === "TRUE"
    ? `

${TRUE_ENDING_TEXT}`
  : "";

if (body) body.textContent = `생존 확인
${survivorText}${extra}`;
  if (panel) {
    panel.style.color = "#111";
    panel.style.border = "1px solid rgba(0,0,0,0.18)";
    panel.style.background = "rgba(255,255,255,0.85)";
    panel.style.boxShadow = "0 12px 40px rgba(0,0,0,0.15)";
  }

  overlay?.classList.add("show");
}


/* -------------------------------
  19) Roof sequence (23~26)
--------------------------------*/
async function roofIntro() {
  lockUI(true);

  await logSlow("event", noiseify("…옥상."), 520);
  await logSlow("event", noiseify("…여자아이가 있습니다."), 520);
  await logSlow("event", noiseify("…여긴, 죽기 전 오는 곳이야."), 520);

  state.progress.stage = "ROOF_CHOICE";
  saveState();
  lockUI(false);
  renderStage();
}

async function roofChoice(choice) {
  lockUI(true);

  if (choice === "MORGUE") {
    state.progress.stage = "COUNTER";
    state.progress.floor = 1;
    state.progress.area = "COUNTER";
    state.progress.morgueAccess = true;
    saveState();

    await logSlow("system", "SYSTEM: 1F로 이동하십시오.", 520);
    lockUI(false);
    renderStage();
    return;
  }

  if (choice === "JUMP_WITH_CHILD") {
    await goodEnding("무사 귀환", "…", "GOOD");
    return;
  }

  if (choice === "JUMP_ALONE") {
    await badEndingSequence("추락", "혼자 떨어졌습니다.");
    return;
  }

  if (choice === "HANDS") {
    const bothAlive = state.chars[0].alive && state.chars[1].alive;
    if (!bothAlive) {
      await badEndingSequence("추락", "손을 잡을 수 없습니다.");
      return;
    }

    const rel = String(state.relation.type || "NEUTRAL");
    const luck = bestLuck();

    const bothSurvive =
      (rel === "FRIEND" || rel === "LOVER") &&
      (luck >= 70 && chance(0.65));

    if (bothSurvive) {
      await goodEnding("진엔딩: 퇴마", TRUE_ENDING_TEXT, "TRUE");
      return;
    }

    const victim = pickVictimByRelation();
    killChar(victim);
    syncHUD();
    await goodEnding("귀환", "…", "NORMAL");
    return;
  }

  // 혹시 모를 안전장치
  lockUI(false);
  renderStage();
};


/* -------------------------------
  20) 1F clinic (kept) + transition to 2F/3F
--------------------------------*/
async function enterClinic(n) {
  lockUI(true);
  await logSlow("system", `SYSTEM: 1F / 진료실 ${n}`, 520);

  if (n === 1) {
    // ✅ (설정 반영) "가벼운 증상"을 호소해야만 탈출 루트가 열린다.
    await logSlow("event", noiseify("…진료실 1."), 520);
    await logSlow("event", noiseify("…의사가 고개를 듭니다."), 520);

    setChoices([
      {
        label: "가벼운 증상이라고 말한다",
        onClick: async () => {
          lockUI(true);
          await logSlow("event", `${whoName(0)}: 저… 크게 아픈 건 아니에요. 그냥… 조금 어지러워서요.`, 520);
          await logSlow("event", `${whoName(1)}: 네, 잠깐이면 괜찮을 것 같아요.`, 520);
          await logSlow("system", "SYSTEM: 경미 판정.", 520);

          // 살짝 힌트: 4F 키/의사 오인 장치
          await logSlow("event", noiseify("…은색의 빛이, 한 번 스칩니다."), 520);

          // continue story -> 3F
          state.progress.clinicDone = true;
          state.progress.stage = "TO_3F";
          state.progress.area = "ELEVATOR";
          saveState();

          await logSlow("system", "SYSTEM: 3F로 이동하십시오.", 520);
          lockUI(false);
          renderStage();
        }
      },
      {
        label: "심하게 아프다고 말한다",
        onClick: async () => {
          lockUI(true);
          await logSlow("event", noiseify("축하드립니다."), 520);
          await logSlow("event", `${whoName(0)}: …뭐라고?`, 520);
          await logSlow("event", `${whoName(1)}: 나… 싫어.`, 520);
          await badEndingSequence("심장 적출", "진료 절차가 종료되었습니다.");
        }
      },
    ]);
    lockUI(false);
    return;
  }


  if (n === 3) {
    const survive = chance(0.08);
    if (!survive) {
      await logSlow("event", noiseify("…담당자가 없습니다."), 520);
      await badEndingSequence("진료 중단", "정상적인 담당자가 존재하지 않습니다.");
      return;
    }
    const t = chance(0.5) ? 0 : 1;
    state.chars[t].hpPct = clamp(state.chars[t].hpPct - 35, 0, 100);
    state.chars[t].sanPct = clamp(state.chars[t].sanPct - 20, 0, 100);
    state.chars[t].body[chance(0.5) ? "arm_l" : "arm_r"] = false;
    syncHUD();
    await logSlow("event", noiseify("기록: 중상."), 520);

  

    // still must go 3F
    state.progress.clinicDone = true;
    state.progress.stage = "TO_3F";
    state.progress.area = "ELEVATOR";
    saveState();
    await logSlow("system", "SYSTEM: 3F로 이동하십시오.", 520);
    lockUI(false);
    renderStage();
    return;
  }

  // clinic 2: injury choice
  await logSlow("event", noiseify("의사 : 어@?가 아%&$#셔프서 오니ㅃ@#셨니^습까?"), 520);
  setChoices([
    { label: "손목", onClick: () => clinic2Pick("WRIST") },
    { label: "팔", onClick: () => clinic2Pick("ARM") },
    { label: "눈", onClick: () => clinic2Pick("EYE") },
    { label: "뇌", onClick: () => clinic2Pick("BRAIN") },
  ]);
  lockUI(false);
}

async function clinic2Pick(type) {
  lockUI(true);

  const target = chance(0.5) ? 0 : 1;

  if (type === "WRIST") {
    await logSlow("event", noiseify("…기록이 통과됩니다."), 520);
    if (chance(0.06)) {
      state.chars[target].body[chance(0.5) ? "wrist_l" : "wrist_r"] = false;
      state.chars[target].hpPct = clamp(state.chars[target].hpPct - 35, 0, 100);
      await logSlow("event", noiseify("기록: 절단."), 520);
    } else if (chance(0.10)) {
      loseFinger(target, chance(0.5) ? "L" : "R");
      await logSlow("event", noiseify("미세한 손실."), 520);
    } else {
      await logSlow("event", noiseify("…통과."), 420);
    }
  } else if (type === "ARM") {
    await logSlow("event", noiseify("…상지 기록이 생성됩니다."), 100);
    if (chance(0.12)) {
      state.chars[target].body[chance(0.5) ? "arm_l" : "arm_r"] = false;
      await logSlow("event", noiseify("기록: 팔 부위가 손상당했습니다."), 100);
    } else {
      loseFinger(target, chance(0.5) ? "L" : "R");
      await logSlow("event", noiseify("기록: 손가락 부위가 손상당했습니다."), 100);
    }
  } else if (type === "EYE") {
    await logSlow("event", noiseify("…시야가 흔들립니다."), 520);
    state.chars[0].body.eyes.cur = clamp(state.chars[0].body.eyes.cur - 1, 0, 2);
    state.chars[1].body.eyes.cur = clamp(state.chars[1].body.eyes.cur - 1, 0, 2);
    await logSlow("event", noiseify("기록: 시각 기관 손상."), 100);
  } else if (type === "BRAIN") {
    await logSlow("event", noiseify("…문장이 끊깁니다."), 100);
    if (chance(0.22)) {
      await badEndingSequence("기록 오류", "진료 절차가 종료되었습니다.");
      return;
    }
    state.chars[target].sanPct = clamp(state.chars[target].sanPct - 35, 0, 100);
    await logSlow("event", noiseify("기록: 정신 손상."), 100);
  }

  syncHUD();

  state.progress.clinicDone = true;
  state.progress.stage = "TO_3F";
  state.progress.area = "ELEVATOR";
  saveState();

  await logSlow("system", "SYSTEM: 3F로 이동하십시오.", 520);

  lockUI(false);
  renderStage();
}

/* -------------------------------
  21) Terminal input (pledge)
--------------------------------*/
let terminalBound = false;
function bindTerminalOnce() {
  if (terminalBound) return;
  terminalBound = true;

  const input = gameEls().cmdInput;
  if (!input) return;

  input.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter") return;
    if (state.busy) return;

    const raw = String(input.value || "").trim();
    input.value = "";

    if (state.progress.stage !== "RECEPTION_INPUT") return;

    if (state.progress.receptionWriter === null) {
      await logSlow("system", "SYSTEM: 작성자를 결정해주세요.", 520);
      return;
    }

    lockUI(true);

    const w = state.progress.receptionWriter;
    await logSlow("event", `${whoName(w)}: ${raw}`, 520);

    if (raw === "간절함") {
      state.progress.unlock2F = true;
      await logSlow("system", "SYSTEM: 2F 접근 요청이 기록되었습니다.", 520);
      await logSlow("system", "SYSTEM: 확인 문구가 필요합니다.", 520);
      saveState();
      lockUI(false);
      renderStage();
      return;
    }

    if (raw === "알겠습니다") {
      state.progress.confirmed = true;
      await logSlow("system", "SYSTEM: 확인되었습니다.", 520);

      // 2-2 tiny finger loss
      if (chance(0.06)) {
        const victim = chance(0.5) ? 0 : 1;
        loseFinger(victim, chance(0.5) ? "L" : "R");
        syncHUD();
        await logSlow("event", noiseify("…미세한 손실이 기록됩니다."), 520);
      }

      // next: 1F lobby (clinic selection) + 2F is still locked unless '간절함'
      state.progress.stage = "LOBBY_1F";
      state.progress.area = "LOBBY";
      saveState();

      lockUI(false);
      renderStage();
      return;
    }

    await badEndingSequence("입원 절차", "확인 문구가 손상되었습니다.");
  });
}

/* -------------------------------
  22) Stage renderer (FULL)
--------------------------------*/
function renderStage() {
  unlockHard();
  syncHUD();

  const st = state.progress.stage;

  // ---- Pledge Q1
  if (st === "PLEDGE_Q1") {
    setChoices([
      {
        label: "서약서 작성",
        onClick: async () => {
          lockUI(true);
          state.progress.pledgeAccepted = true;
          await logSlow("system", "SYSTEM: 서약서 절차를 시작합니다.", 520);
          state.progress.stage = "WRITER_PICK";
          saveState();
          lockUI(false);
          renderStage();
        },
      },
      { label: "거절", onClick: async () => badEndingSequence("입장 거절", "서약서가 필요합니다.") },
    ]);
    return;
  }

  // ---- Writer pick
  if (st === "WRITER_PICK") {
    setChoices([
      {
        label: "작성자: SUBJECT_01",
        onClick: async () => {
          lockUI(true);
          state.progress.receptionWriter = 0;
          await logSlow("system", "SYSTEM: 작성자 확인.", 420);
          state.progress.stage = "RECEPTION_INPUT";
          saveState();
          lockUI(false);
          renderStage();
        },
      },
      {
        label: "작성자: SUBJECT_02",
        onClick: async () => {
          lockUI(true);
          state.progress.receptionWriter = 1;
          await logSlow("system", "SYSTEM: 작성자 확인.", 420);
          state.progress.stage = "RECEPTION_INPUT";
          saveState();
          lockUI(false);
          renderStage();
        },
      },
    ]);
    return;
  }

  // ---- Reception input (terminal)
  if (st === "RECEPTION_INPUT") {
    setChoices([{ label: "대기", onClick: async () => logSlow("event", noiseify("서류가 당신을 바라봅니다."), 520) }]);
    return;
  }

  // ---- 1F lobby (clinic + elevator)
  if (st === "LOBBY_1F") {
    const blind = state.chars[0].body.eyes.cur === 0 && state.chars[1].body.eyes.cur === 0;
    const lbl = (s) => blind ? noiseify(s, 0.92) : s;

    setChoices([
      { label: lbl("진료실 1"), onClick: () => enterClinic(1) },
      { label: lbl("진료실 2"), onClick: () => enterClinic(2) },
      { label: lbl("진료실 3"), onClick: () => enterClinic(3) },
      { label: lbl("엘리베이터"), onClick: () => openElevatorMenu() },
    ]);
    return;
  }

  // ---- TO_2F / TO_3F / TO_4F / TO_5F / TO_6F / RETURN_1F / ROOF_INTRO
  if (st === "TO_2F" || st === "TO_3F" || st === "TO_4F" || st === "TO_5F" || st === "TO_6F" || st === "RETURN_1F" || st === "ROOF_INTRO") {
    setChoices([{ label: "엘리베이터", onClick: () => openElevatorMenu() }]);
    return;
  }

  // ---- 2F room 5
  if (st === "F2_ROOM5") {
    setChoices([
      { label: "입원실 5", onClick: () => enter2FRoom5() },
      { label: "엘리베이터", onClick: () => openElevatorMenu() },
    ]);
    return;
  }

if (st === "F3_ASSIGN") {
  const left = state.progress.f3RerollsLeft ?? 0;
  const room = state.progress.f3AssignedRoom ?? "?";

  setChoices([
    { label: `현재 배정: ${room}번`, onClick: async () => {} },
    {
      label: left > 0 ? `바꾸겠습니까? (예) - 남은 기회 ${left}` : "바꾸겠습니까? (예) - 0",
      onClick: () => f3Reroll(),
    },
    { label: "아니요 (확정)", onClick: () => f3AcceptAssignment() },
]);
  return;
}


// ---- 3F forced report
if (st === "F3_FORCE_REPORT") {
  setChoices([
    { label: "이상", onClick: () => f3ForcedReport() },
  ]);
  return;
}


  // ---- 3F keycheck
  if (st === "F3_KEYCHECK") {
    setChoices([
      { label: "이상", onClick: () => reportF3KeyAnomaly() },
      { label: "대기", onClick: () => badEndingSequence("입원 확정", "절차가 정지되었습니다.") },
    ]);
    return;
  }

  // ---- 3F room
  if (st === "F3_ROOM") {
    
    logSlow("event", noiseify("무엇을 하시겠습니까?"), 520);
    
    setChoices([
      { label: "서랍", onClick: () => openDrawerF3() },
      { label: "행인 1", onClick: () => talkStrangerF3() },
      { label: "아무것도", onClick: () => doNothingF3() },
      { label: "엘리베이터", onClick: () => openElevatorMenu() },
    ]);
    return;
  }

  // ---- Key wait then go 4F
  if (st === "KEY_WAIT") {
    setChoices([
      {
        label: "대기",
        onClick: async () => {
          lockUI(true);
          await logSlow("event", noiseify("…당신은 숨을 고릅니다."), 520);
          state.progress.stage = "TO_4F";
          state.progress.area = "ELEVATOR";
          saveState();
          lockUI(false);
          renderStage();
        },
      },
      { label: "엘리베이터", onClick: () => openElevatorMenu() },
    ]);
    return;
  }

  // ---- 4F pick
  if (st === "F4_PICK") {
    const blind = state.chars[0].body.eyes.cur === 0 && state.chars[1].body.eyes.cur === 0;
    const lbl = (s) => blind ? noiseify(s, 0.92) : s;
    logSlow("event", noiseify("4층입니다. 무엇을 하시겠습니까?"), 520);
    setChoices([
      { label: lbl("수술실 1"), onClick: () => enterF4Room("SURG1") },
      { label: lbl("수술실 2"), onClick: () => enterF4Room("SURG2") },
      { label: lbl("진료실 1"), onClick: () => enterF4Room("CLINIC1") },
      { label: lbl("진료실 2"), onClick: () => enterF4Room("CLINIC2") },
      // block 5F early (13-1)
      { label: lbl("엘리베이터"), onClick: async () => {
        // if they try to go 5F before playroom/child step -> death handled by sequence, but we keep menu
        openElevatorMenu();
      }},
    ]);
    return;
  }

  // ---- surg2 talk
  if (st === "SURG2_TALK") {
    const blind = state.chars[0].body.eyes.cur === 0 && state.chars[1].body.eyes.cur === 0;
    const lbl = (s) => blind ? noiseify(s, 0.92) : s;
    
    logSlow("event", noiseify("…들어오니 의사, 간호사, 수리기사가 보입니다."), 520);
    setChoices([
      
      { label: lbl("간호사에게 말을 건다"), onClick: () => surg2Talk("NURSE") },
      { label: lbl("수리기사에게 말을 건다"), onClick: () => surg2Talk("REPAIR") },
      { label: lbl("담당 의사에게 말을 건다"), onClick: () => surg2Talk("DOCTOR") },
      { label: lbl("뒤로"), onClick: async () => { state.progress.stage = "F4_PICK"; saveState(); renderStage(); } },
    ]);
    return;
  }

  // ---- surg2 phrase
  if (st === "SURG2_PHRASE") {
    logSlow("event", noiseify("원하시는 것이 있으십니까?"), 520);
    
    setChoices([
      { label: "마취는 불필요", onClick: () => surg2Phrase(true) },
      { label: "전신 마취", onClick: () => surg2Phrase(false) },
    ]);
    return;
  }

  // ---- playroom
  if (st === "PLAYROOM") {
    setChoices([
      { label: "놀이방", onClick: () => enterPlayroom() },
      { label: "엘리베이터", onClick: async () => {
        // 13-1: if try 5F before completing playroom request -> death
        await badEndingSequence("규정 위반", "5층을 먼저 방문했습니다.");
      }},
      { label: "뒤로", onClick: async () => { state.progress.stage = "F4_PICK"; saveState(); renderStage(); } },
    ]);
    return;
  }

  // ---- 5F impulse
  if (st === "F5_IMPULSE") {
    setChoices([{ label: "진행", onClick: () => f5ImpulseStart() }]);
    return;
  }

  // ---- 5F ward
  if (st === "F5_WARD") {
    setChoices([{ label: "진행", onClick: () => f5Ward() }]);
    return;
  }

  // ---- 5F wall rule
  if (st === "F5_WALL") {
    setChoices([
      { label: "벽", onClick: () => f5WallSuccess() },
      { label: "자리이동", onClick: () => f5WallSuccess() },
      // entering any room is forbidden
      { label: "진료실 1", onClick: () => f5EnterWrongRoom() },
      { label: "진료실 2", onClick: () => f5EnterWrongRoom() },
      { label: "진료실 3", onClick: () => f5EnterWrongRoom() },
      { label: "진료실 4", onClick: () => f5EnterWrongRoom() },
    ]);
    return;
  }

  // ---- 5F body check
  if (st === "F5_BODYCHECK") {
    setChoices([
      { label: "확인", onClick: () => f5ConfirmBody() },
      { label: "무시", onClick: () => f5SkipBodyCheckDeath() },
    ]);
    return;
  }

  // ---- 6F hunger
  if (st === "F6_HUNGER") {
    setChoices([{ label: "진행", onClick: () => f6HungerStart() }]);
    return;
  }

  // ---- 6F mall
  if (st === "F6_MALL") {
    setChoices([{ label: "진행", onClick: () => f6Mall() }]);
    return;
  }

  // ---- COUNTER
  if (st === "COUNTER") {
    setChoices([
      { label: "영안실", onClick: () => counterToMorgue() },
      { label: "옥상", onClick: () => counterToRoof() },
      { label: "4F", onClick: async () => {
        // 21-2: revisiting 4F after pasta -> pasta owner harms you; 50/50 survive
        lockUI(true);
        await logSlow("event", noiseify("…그가 당신을 해하려 합니다."), 520);
        const live = chance(0.5);
        if (!live) { await badEndingSequence("습격", "도망치지 못했습니다."); return; }
        await logSlow("event", noiseify("…당신은 1F로 대피합니다."), 520);
        lockUI(false);
        renderStage();
      }},
      { label: "엘리베이터", onClick: () => openElevatorMenu() },
    ]);
    return;
  }

  // ---- MORGUE
  if (st === "MORGUE") {
    setChoices([{ label: "기도", onClick: () => morgueStart() }]);
    return;
  }

  // ---- ROOF
  if (st === "ROOF_INTRO") {
    setChoices([{ label: "엘리베이터", onClick: () => openElevatorMenu() }]);
    return;
  }

  if (st === "ROOF_CHOICE") {
    setChoices([
      { label: "영안실", onClick: () => roofChoice("MORGUE") },
      { label: "아이와", onClick: () => roofChoice("JUMP_WITH_CHILD") },
      { label: "혼자", onClick: () => roofChoice("JUMP_ALONE") },
      { label: "손잡기", onClick: () => roofChoice("HANDS") },
    ]);
    return;
  }

  setChoices([{ label: "대기", onClick: async () => logSlow("event", noiseify("…"), 520) }]);
}

/* -------------------------------
  23) Boot game screen
--------------------------------*/
async function bootGameScreen() {
  ensureEndingOverlay();
  unlockHard();
  syncHUD();

  const el = gameEls();
  if (el.consoleBox) el.consoleBox.innerHTML = "";

  await logSlow("system", "==안내문==", 420);
  await logSlow("system", "해당 병원 방문객 안내", 420);
  await logSlow("system", "병원에 입실하시는 방문객에게 알립니다.", 520);
  await logSlow("system", `현재 병원 방문객은 ${mosaicName()}님과 ${mosaicName()} 님만 받고 있습니다`, 520);
  await logSlow("system", "병원 방문시 반드시 서약서를 작성하셔야 하며,", 520);
  await logSlow("system", "마지막 문구엔 필시 '알겠습니다'를 적으십시오", 520);
  await logSlow("system", "저희 병원은 언제나 당신을 환영합니다", 520);

  state.progress.floor = 1;
  state.progress.area = "COUNTER";
  state.progress.stage = "PLEDGE_Q1";
  saveState();

  bindTerminalOnce();
  renderStage();
}

/* -------------------------------
  24) Start / Creation wiring
  (assumes your existing HTML has these screens and switchScreen())
--------------------------------*/
function bindStartScreen() {
  window.addEventListener("keydown", (e) => {
    if (!$("#screen-start")?.classList.contains("active")) return;
    if (e.key === "Enter") switchScreen("screen-creation");
  });
}

function bindCreationScreen() {
  const creation = $("#screen-creation");
  if (!creation) return;

  const cards = $$(".char-setup-card", creation);

  cards.forEach((card, idx) => {
    // image upload
    const slot = $(".img-upload-slot", card);
    const inputFile = $(".hidden-file-input", card);
    const preview = $(".img-preview", card);

    if (inputFile) {
      inputFile.addEventListener("change", () => {
        const f = inputFile.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
          const url = String(reader.result || "");
          state.chars[idx].imgDataUrl = url;
          if (preview) preview.src = url;
          slot?.classList.add("has-image");
          saveState();
        };
        reader.readAsDataURL(f);
      });
    }

    const inputs = $$("input, select", card);
    const nameInput = inputs.find((el) => el.type === "text");
    const ageInput = inputs.find((el) => el.type === "number");
    const genderSelect = inputs.find((el) => el.tagName === "SELECT");

    if (ageInput) {
      ageInput.min = "10";
      ageInput.max = "1000";
      ageInput.step = "1";
      ageInput.addEventListener("input", () => {
        state.chars[idx].age = String(ageInput.value || "");
        saveState();
      });
    }
    if (nameInput) {
      nameInput.addEventListener("input", () => {
        state.chars[idx].name = String(nameInput.value || "Unknown").trim() || "Unknown";
        saveState();
      });
    }
    if (genderSelect) {
      genderSelect.addEventListener("change", () => {
        state.chars[idx].gender = String(genderSelect.value || "M");
        saveState();
      });
    }

    // stats sliders (no cap, show sum)
    const sliders = $$('input[type="range"]', card);
    const sumEl = $(".stat-sum", card);
    const keys = ["hp", "san", "knw", "agi", "str"];

    function updateSum() {
      const sum = sliders.reduce((a, s) => a + Number(s.value || 0), 0);
      if (sumEl) sumEl.textContent = `도합 ${sum}`;
    }

    sliders.forEach((slider, sidx) => {
      slider.addEventListener("input", () => {
        const k = keys[sidx];
        if (k) state.chars[idx].stats[k] = Number(slider.value);
        updateSum();
        saveState();
      });
    });
    updateSum();

    const luckChip = $(".luck-chip", card);
    if (luckChip) {
      luckChip.textContent = String(state.chars[idx].luck).padStart(3, "0");
      luckChip.addEventListener("click", () => {
        state.chars[idx].luck = randi(1, 100);
        luckChip.textContent = String(state.chars[idx].luck).padStart(3, "0");
        saveState();
      });
    }
  });

  // relation pick
  const relBtns = $$(".rel-btn", creation);
  const masterPick = $("#master-pick", creation);
  const masterBtns = $$(".master-btn", creation);
  const desc = $("#relation-desc", creation);

  function setRelType(type) {
    state.relation.type = type;
    relBtns.forEach((b) => b.classList.toggle("active", b.dataset.rel === type));
    const isMaster = type === "MASTER";
    if (masterPick) masterPick.style.display = isMaster ? "block" : "none";
    if (desc) desc.textContent = "기록이 갱신되었습니다.";
    saveState();
  }

  relBtns.forEach((btn) => btn.addEventListener("click", () => setRelType(btn.dataset.rel || "NEUTRAL")));
  masterBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      const v = Number(btn.dataset.master || "0");
      state.relation.masterIndex = Number.isFinite(v) ? v : 0;
      masterBtns.forEach((b) => b.classList.toggle("active", b === btn));
      saveState();
    })
  );

  const agree = $('input[type="checkbox"]', creation);
  const btnSubmit = $(".btn-submit", creation);

  if (btnSubmit) {
  btnSubmit.addEventListener("click", async () => {
    if (!agree?.checked) {
      if (desc) desc.textContent = "서약서 확인이 필요합니다.";
      return;
    }

    // ✅ 새 게임 상태를 통째로 생성
    const ns = freshState();

    // ✅ 생성 화면에서 입력한 캐릭터 설정만 이식
    ns.chars = state.chars.map((c, i) => ({
      ...ns.chars[i],
      id: ns.chars[i].id,
      name: c.name || "Unknown",
      age: c.age || "",
      gender: c.gender || ns.chars[i].gender,
      imgDataUrl: c.imgDataUrl || "",
      stats: { ...ns.chars[i].stats, ...(c.stats || {}) },
      luck: Number.isFinite(+c.luck) ? +c.luck : ns.chars[i].luck,

      alive: true,
      hpPct: 100,
      sanPct: 100,
      body: DEFAULT_BODY(),
    }));

    ns.relation = { ...state.relation };

    ns.started = true;
    ns.busy = false;
    ns.logs = [];

    state = ns;
    saveState();

    switchScreen("screen-game");
    await bootGameScreen();
  });
}


  setRelType(state.relation.type || "NEUTRAL");
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; } // (이미 있으면 삭제)

function weightedPickShardKey() {
  const pool = [];
  for (const s of LORE.shards) {
    const w = Math.max(1, Number(s.weight || 1));
    for (let i = 0; i < w; i++) pool.push(s.key);
  }
  return pick(pool);
}

// 엔딩 오버레이 하단에 "해석" 문구를 추가로 보여주기
function endingInterpretText(key) {
  const pack = LORE.endings[key];
  if (!pack) return "";
  const lines = [];
  if (pack.tagline) lines.push(pack.tagline);
  if (Array.isArray(pack.interpret)) lines.push("", ...pack.interpret);
  return lines.join("\n");
}

// “진실 조각” 한 줄을 이벤트 로그로 살짝 던지기 (스포 방지: 낮은 확률로)
async function maybeDropTruthShard(prob = 0.10) {
  if (!chance(prob)) return;
  const k = weightedPickShardKey();
  const lines = LORE.truths[k];
  if (!lines || !lines.length) return;
  const one = pick(lines);
  await logNarration(noiseify(one, 0.18), 520); // 너무 심한 노이즈 X (의미 전달)
}



/* -------------------------------
  C) “진엔딩” 전용 문구(옥상에서 아이를 지우는 루트)
  - 네 코드의 roofChoice("JUMP_WITH_CHILD")에 연결 추천
--------------------------------*/
async function playTrueEndingSequence() {
  lockUI(true);

  await logSystem("SYSTEM: 신호가 변조됩니다.", 520);
  await logNarration(noiseify("…옥상 바람이 잠잠해진다.", 0.15), 520);
  await logDialogue("여자아이", "여기 남은 사람들은… 떠나는 법을 잊었어.", 520, 0.22);
  await logDialogue("여자아이", "지워주면… 다 끝나.", 520, 0.22);

  // 진실 조각 2~3개를 짧게
  await logNarration(" ", 220);
  await logNarration(LORE.truths.ROOF_EXORCISM[0], 520);
  await logNarration(LORE.truths.ROOF_EXORCISM[2], 520);

  await goodEndingWithInterpret("GOOD_TRUE");
}

/* -------------------------------
  D) goodEnding / badEndingSequence에 “해석” 붙이는 래퍼
  - 기존 goodEnding(...) / badEndingSequence(...)는 그대로 두고,
    아래 두 함수를 “대신” 호출해도 됨.
--------------------------------*/
async function goodEndingWithInterpret(key) {
  const pack = LORE.endings[key];
  const title = pack?.title || "END";
  const flavor = pack?.tagline || "…";

  await goodEnding(title, flavor, key);

  const body = $("#ending-overlay .ending-body");
  if (body) {
    const base = body.textContent || "";
    const extra = endingInterpretText(key);
    body.textContent = `${base}\n\n[해석]\n${extra}`.trim();
  }
}

async function badEndingWithInterpret(keyFallback = "BAD_REGISTERED") {
  const body = $("#ending-overlay .ending-body");
  if (!body) return;

  const extra = endingInterpretText(keyFallback);
  if (!extra) return;

  const base = body.textContent || "";
  body.textContent = `${base}\n\n[해석]\n${extra}`.trim();
}

/* -------------------------------
  25) Restore & boot
--------------------------------*/
(function boot() {
  state = loadState() || freshState();

  bindStartScreen();
  bindCreationScreen();

  if (state.started) {
    switchScreen("screen-game");
    bootGameScreen().then(() => {
      syncHUD();
      renderStage();
    });
  } else {
    // restore creation inputs (optional)
    const creation = $("#screen-creation");
    if (creation) {
      const cards = $$(".char-setup-card", creation);
      cards.forEach((card, idx) => {
        const luckChip = $(".luck-chip", card);
        if (luckChip) luckChip.textContent = String(state.chars[idx].luck).padStart(3, "0");

        const slot = $(".img-upload-slot", card);
        const preview = $(".img-preview", card);
        if (state.chars[idx].imgDataUrl && preview && slot) {
          preview.src = state.chars[idx].imgDataUrl;
          slot.classList.add("has-image");
        }

        const inputs = $$("input, select", card);
        const nameInput = inputs.find((el) => el.type === "text");
        const ageInput = inputs.find((el) => el.type === "number");
        const genderSelect = inputs.find((el) => el.tagName === "SELECT");

        if (nameInput) nameInput.value = state.chars[idx].name || "";
        if (ageInput) {
          ageInput.value = state.chars[idx].age || "";
          ageInput.min = "10";
          ageInput.max = "1000";
          ageInput.step = "1";
        }
        if (genderSelect) genderSelect.value = state.chars[idx].gender || genderSelect.value;

        const sliders = $$('input[type="range"]', card);
        const keys = ["hp", "san", "knw", "agi", "str"];
        sliders.forEach((s, i) => {
          const k = keys[i];
          if (!k) return;
          s.value = String(state.chars[idx].stats[k] ?? 3);
        });

        const sumEl = $(".stat-sum", card);
        if (sumEl) {
          const sum = sliders.reduce((a, s) => a + Number(s.value || 0), 0);
          sumEl.textContent = `도합 ${sum}`;
        }
      });
    }
  }
})();


/* Persist the initial character stat allocation across resets/reloads. */
(() => {
  const KEY = "TWO_FALL_HOSPITAL_INITIAL_STATS";
  const KEYS = ["hp", "san", "knw", "agi", "str"];
  const cards = () => Array.from(document.querySelectorAll("#screen-creation .char-setup-card"));
  const save = () => {
    const data = cards().map(card => {
      const sliders = Array.from(card.querySelectorAll('input[type="range"]'));
      return Object.fromEntries(KEYS.map((k, i) => [k, Number(sliders[i]?.value ?? 3)]));
    });
    if (data.length) localStorage.setItem(KEY, JSON.stringify(data));
  };
  const load = () => {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!Array.isArray(data)) return;
      cards().forEach((card, ci) => {
        if (!data[ci]) return;
        const sliders = Array.from(card.querySelectorAll('input[type="range"]'));
        KEYS.forEach((k, i) => {
          if (sliders[i] && Number.isFinite(Number(data[ci][k]))) sliders[i].value = String(data[ci][k]);
        });
        const sum = card.querySelector(".stat-sum");
        if (sum) sum.textContent = String(sliders.reduce((a, s) => a + Number(s.value || 0), 0));
      });
    } catch (e) { console.warn("Saved stat preset could not be restored.", e); }
  };
  load();
  cards().forEach(card => card.querySelectorAll('input[type="range"]').forEach(slider => {
    slider.addEventListener("input", save);
    slider.addEventListener("change", save);
  }));
  document.querySelector("#screen-creation .btn-submit")?.addEventListener("click", save);
})();

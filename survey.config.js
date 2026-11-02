/**
 * 설문 내용 설정 (v3 – 논문 초안 <표 2>·<표 3>·<표 4>, 3-3 절차 기준)
 * 흐름: 동의 → 자격 → 블록1 사전 설문 → 블록2 주행 부하 점검 → 블록3 본 실험 (5번째 장면 뒤 집중도 점검) → 블록5 메시지 속성 → AI 태도(GAAIS-K) → 마무리
 * 문항·장면을 바꾸려면 이 파일만 수정하면 됩니다.
 */
window.SURVEY = {
  // 응답 저장 주소 (구글 Apps Script). 비워 두면 검토용 미리보기로 동작 (저장 안 됨)
  ENDPOINT: "https://script.google.com/macros/s/AKfycbwESnM08oVafTKHv6_l5I3w37s7tVzD-Gt05pruVEwIRovNAjOUBBxoVGTfOz26WLCy/exec",
  version: "v3-main",
  // true: 사전 설문 등은 건너뛰고 실험 자극물만 보여 줌 (주소 끝에 ?stim=1 을 붙여도 같음, 이때 응답은 저장 안 됨)
  stimulusOnly: false,

  title: "차량 내 AI 에이전트의 선제적 정보 제공에 대한 사용자 인식 조사",

  // 7점 척도 공통 기준 (문서: 1 = 전혀 그렇지 않다, 4 = 보통이다, 7 = 매우 그렇다)
  scale7: ["전혀 그렇지 않다", "보통이다", "매우 그렇다"],

  // ── 블록 1. 사전 설문 ─────────────────────────────────
  demographics: [
    { key: "P1", type: "radio", text: "성별은 무엇인가요?", options: ["남성", "여성"] },
    { key: "P2", type: "radio", text: "만 나이는 어떻게 되시나요?", options: ["만 19–29세", "30–39세", "40–49세", "50–59세", "60세 이상"] },
    { key: "P3", type: "radio", text: "운전 경력은 얼마나 되시나요? (면허 취득 후 실제 운전한 기간)", options: ["1년 이상 3년 미만", "3년 이상 5년 미만", "5년 이상 10년 미만", "10년 이상 20년 미만", "20년 이상"] },
    { key: "P4", type: "radio", text: "평소 얼마나 자주 운전하시나요?", options: ["거의 매일", "주 3–4회", "주 1–2회", "월 1–3회", "그 이하"] },
    { key: "P5", type: "radio", text: "차로 유지 보조나 스마트 크루즈 컨트롤 같은 운전자 보조 기능(ADAS)을 사용해 본 적이 있나요?",
      options: ["자주 사용", "가끔 사용", "사용해 본 적 있음", "없음"] },
    { key: "P6", type: "radio", text: "차량 안에서 음성 비서(예: \"글레오\", \"안녕 벤츠\", 안드로이드 오토 음성 명령)를 사용해 본 적이 있나요?",
      options: ["자주 사용", "가끔 사용", "사용해 본 적 있음", "없음"] }
  ],

  // ── 블록 2. 주행 부하 조작 점검 (메시지 없는 영상) ──────
  loadCheck: {
    instruction: "지금부터 짧은 주행 영상을 보여드립니다. 내가 직접 운전석에 앉아 이 길을 운전하고 있다고 상상하며 보신 뒤 답해 주세요.",
    randomize: true,
    videos: [
      { id: "L", video: "media/load_L.mp4", poster: "media/load_L_poster.jpg" },
      { id: "M", video: "media/load_M.mp4", poster: "media/load_M_poster.jpg" },
      { id: "H", video: "media/load_H.mp4", poster: "media/load_H_poster.jpg" }
    ],
    items: [
      { key: "LOAD1", text: "이 주행 상황에서 운전하려면 정신적으로 많이 집중해야 한다고 느끼시나요?" },
      { key: "LOAD2", text: "이 주행 상황은 시간적으로 촉박해서 빠르게 판단해야 한다고 느끼시나요?" },
      { key: "LOAD3", text: "이 주행 상황에서 안전하게 운전하려면 많은 노력이 필요하다고 느끼시나요?" }
    ]
  },

  // ── 블록 3. 본 실험 장면 (연습 장면은 현재 흐름에서 뺌, 설정만 남겨 둠) ──
  sceneIntro: "내가 운전석에 있다고 상상하며 영상을 봐 주세요. 영상 중간에 차량 내 AI 에이전트가 먼저 알림을 보내고, 알림은 영상 바로 아래에 나타납니다. 영상이 끝나면 이 알림에 대해 답해 주세요.",
  sceneInstruction: "지금 직접 운전하고 있다고 상상해 주세요. 영상 아래에 나타나는 알림은 차량의 AI 에이전트가 이 상황에서 건네는 말이라고 생각해 주세요.",

  // 부하 수준별 상황 설명 (부하 점검 영상과 본 장면 페이지 모두 영상보다 먼저 보임)
  context: {
    L: ["늦은 밤, 차량이 많지 않은 고속도로를 일정한 속도로 달리고 있어요.", "차로를 바꿀 일 없이 앞차와 충분한 거리를 두고 직진하는 중이에요."],
    M: ["늦은 저녁, 신호등과 횡단보도가 이어지는 도심 도로를 달리고 있어요.", "주변 차량과 길을 건너는 오토바이·보행자를 살피며 주행하는 중이에요."],
    H: ["늦은 저녁, 차량이 많은 도심 도로를 달리고 있어요.", "앞쪽 교차로를 지나며 옆 차로로 옮겨 타야 하고, 바로 옆에는 다른 차가 가까이 붙어 있어요."]
  },

  practice: {
    id: "practice", load: "M", info: "practice", practice: true,
    video: "media/practice_clean.mp4", poster: "media/practice_clean_poster.jpg", overlayAt: 4.0,
    message: "앞 유리에 빗방울이 감지됐어요. 와이퍼를 켤까요?",
    context: ["늦은 저녁, 신호가 바뀐 뒤 앞차들을 따라 도심 도로를 천천히 출발하고 있어요.", "속도를 조금씩 올리며 횡단보도와 교차로를 지나는 중이에요.", "응답 방법을 익히기 위한 연습 장면이에요. 이 장면의 응답은 분석에 포함되지 않아요."]
  },

  // 본 실험: 주행 부하 3 × 정보 유형 3 = 9장면 (무작위 순서)
  // 영상은 부하별 알림 없는 원본을 쓰고, 알림은 4.0초에 영상 아래 띠로 표시 (전방 시야 가림 없음)
  // info: T1 주행·차량 / T2 개인·일정 / T3 생활·홈 (논문 <표 2>)
  randomizeScenes: true,
  // 이 번호의 장면 뒤에 집중도 점검 페이지 (휴식 대신)
  checkAfter: 5,
  checkpoint: {
    title: "잠깐, 집중도 확인",
    lead: "절반 넘게 오셨어요. 남은 장면으로 넘어가기 전에 두 가지만 여쭤볼게요.",
    recall: "방금 본 장면에서 AI 에이전트가 보낸 알림은 무엇이었나요?",
    focus: "지금 영상과 질문에 얼마나 집중하고 계신가요?",
    focusEnds: ["전혀 집중하지 못하고 있다", "보통이다", "매우 집중하고 있다"]
  },
  scenes: [
    { id: "L_T1", load: "L", info: "T1", video: "media/load_L.mp4", poster: "media/load_L_poster.jpg", overlayAt: 4.0,
      message: "2km 앞 사고로 정체가 시작됐어요. 우회 경로를 안내할까요?" },
    { id: "L_T2", load: "L", info: "T2", video: "media/load_L.mp4", poster: "media/load_L_poster.jpg", overlayAt: 4.0,
      message: "7시 회의에 약 15분 늦을 것 같아요. 참석자에게 알릴까요?" },
    { id: "L_T3", load: "L", info: "T3", video: "media/load_L.mp4", poster: "media/load_L_poster.jpg", overlayAt: 4.0,
      message: "집 도착 20분 전이에요. 귀가 모드로 에어컨을 켤까요?" },
    { id: "M_T1", load: "M", info: "T1", video: "media/load_M.mp4", poster: "media/load_M_poster.jpg", overlayAt: 4.0,
      message: "2km 앞 사고로 정체가 시작됐어요. 우회 경로를 안내할까요?" },
    { id: "M_T2", load: "M", info: "T2", video: "media/load_M.mp4", poster: "media/load_M_poster.jpg", overlayAt: 4.0,
      message: "7시 회의에 약 15분 늦을 것 같아요. 참석자에게 알릴까요?" },
    { id: "M_T3", load: "M", info: "T3", video: "media/load_M.mp4", poster: "media/load_M_poster.jpg", overlayAt: 4.0,
      message: "집 도착 20분 전이에요. 귀가 모드로 에어컨을 켤까요?" },
    { id: "H_T1", load: "H", info: "T1", video: "media/load_H.mp4", poster: "media/load_H_poster.jpg", overlayAt: 4.0,
      message: "2km 앞 사고로 정체가 시작됐어요. 우회 경로를 안내할까요?" },
    { id: "H_T2", load: "H", info: "T2", video: "media/load_H.mp4", poster: "media/load_H_poster.jpg", overlayAt: 4.0,
      message: "7시 회의에 약 15분 늦을 것 같아요. 참석자에게 알릴까요?" },
    { id: "H_T3", load: "H", info: "T3", video: "media/load_H.mp4", poster: "media/load_H_poster.jpg", overlayAt: 4.0,
      message: "집 도착 20분 전이에요. 귀가 모드로 에어컨을 켤까요?" }
  ],

  // 장면마다 같은 순서로 묻는 16문항 (묶음 단위로 카드 하나씩)
  sceneGroups: [
    { id: "AC", title: "주행 상황 확인",
      items: [{ key: "AC", type: "radio", text: "방금 영상의 도로 상황은 무엇이었나요?",
        options: ["고속도로 직선 주행", "도심 주행", "혼잡 구간 차선 변경·합류"] }] },
    { id: "DIS", title: "알림이 주행에 준 영향", likert: true,
      items: [
        { key: "DIS1", text: "이 알림 때문에 주행에 대한 주의가 분산되었나요?" },
        { key: "DIS2", text: "이 알림이 안전하게 주행하는 데 방해가 되었나요?" },
        { key: "DIS3", text: "이 상황에서 이 알림을 확인하고 처리하는 것이 부담스러웠나요?" }] },
    { id: "APP", title: "알림을 받은 시점", prompt: "지금 이 순간에 알림을 받은 것에 대해 답해 주세요.", likert: true,
      items: [
        { key: "APP1", text: "지금 이 시점에 이 정보를 알려준 것이 적절했다고 느끼시나요?" },
        { key: "APP2", text: "지금이 이런 알림을 받기에 좋은 때였다고 생각하시나요?" },
        { key: "APP3", text: "이 알림이 현재 주행 상황에 맞는 타이밍에 제공되었다고 느끼시나요?" }] },
    { id: "USE", title: "알림의 내용", prompt: "알려준 시점과 상관없이 알림의 내용만 생각해 주세요.", likert: true,
      items: [
        { key: "USE1", text: "이 알림의 내용이 본인에게 도움이 된다고 생각하시나요?" },
        { key: "USE2", text: "이 알림의 내용이 본인의 이동이나 일정을 관리하는 데 유용하다고 생각하시나요?" },
        { key: "USE3", text: "이 알림이 가치 있는 정보를 담고 있다고 생각하시나요?" }] },
    { id: "ACC", title: "이 기능을 쓸 의향", likert: true,
      items: [
        { key: "ACC1", text: "이런 주행 상황에서 에이전트가 이런 알림을 먼저 준다면 받아들일 의향이 있으신가요?" },
        { key: "ACC2", text: "이런 상황에서 이 알림 기능을 켜 두고 사용하실 의향이 있으신가요?" },
        { key: "ACC3", text: "앞으로도 이런 상황에서 이런 알림을 받고 싶으신가요?" }] },
    { id: "PREF", title: "원하는 제공 방식",
      items: [
        { key: "PT", type: "radio", text: "이 정보를 언제 받고 싶으신가요?",
          options: ["즉시", "주행이 안정된 뒤", "정차·도착 시", "내가 요청할 때만", "필요 없음"] },
        { key: "PC", type: "radio", text: "이 정보를 어떤 방식으로 받고 싶으신가요?",
          options: ["음성만", "화면만", "음성 + 화면", "진동(햅틱) + 화면", "필요 없음"] },
        { key: "PL", type: "radio", text: "화면으로 본다면 어디에 표시되기를 원하시나요?",
          image: { src: "media/dash_guide.jpg", w: 1600, h: 890, alt: "차량 실내 사진에 HUD(앞유리에 비치는 화면), 클러스터(핸들 너머 계기판), 센터 디스플레이(가운데 큰 화면) 위치를 표시한 그림" },
          options: ["클러스터(계기판)", "센터 디스플레이", "HUD(앞유리)", "스마트폰", "화면 표시는 원하지 않음"] }] }
  ],
  acAnswer: { L: "고속도로 직선 주행", M: "도심 주행", H: "혼잡 구간 차선 변경·합류" },

  // ── 블록 5. 메시지 속성 평가 (영상 없이) ───────────────
  messageAttr: {
    instruction: "마지막으로 앞서 본 알림 내용만 따로 보여드립니다. 주행 상황은 생각하지 말고, 알림의 내용 자체에 대해 답해 주세요.",
    randomize: true,
    messages: [
      { id: "T1", text: "2km 앞 사고로 정체가 시작됐어요. 우회 경로를 안내할까요?" },
      { id: "T2", text: "7시 회의에 약 15분 늦을 것 같아요. 참석자에게 알릴까요?" },
      { id: "T3", text: "집 도착 20분 전이에요. 귀가 모드로 에어컨을 켤까요?" }
    ],
    items: [
      { key: "URG", text: "이 정보는 지금 바로 알아야 할 만큼 긴급하다고 느끼시나요?" },
      { key: "REL", text: "이 정보가 운전하는 것 자체와 직접 관련이 있다고 느끼시나요?" },
      { key: "IMP", text: "이 정보가 본인에게 개인적으로 중요하다고 느끼시나요?" }
    ]
  },

  // ── AI에 대한 일반적인 태도: GAAIS-K (서연희·안정원, 2022) 18문항, 5점 ──
  // 특성 척도라 실험 장면에 영향을 주지 않도록 본 실험 뒤에 둠
  gaais: [
    { n: 2, sub: "pos", text: "인공지능은 이 나라에 새로운 경제적 기회를 제공할 수 있습니다." },
    { n: 3, sub: "neg", text: "조직들이 인공지능을 비윤리적으로 이용한다." },
    { n: 4, sub: "pos", text: "인공지능 시스템은 사람들이 더 행복감을 느끼도록 도울 수 있습니다." },
    { n: 5, sub: "pos", text: "저는 인공지능이 할 수 있는 일들에 깊은 인상을 받았습니다." },
    { n: 6, sub: "neg", text: "저는 인공지능 시스템이 많은 오류를 범한다고 생각합니다." },
    { n: 7, sub: "pos", text: "저는 일상생활에서 인공지능 시스템을 활용하는 데 관심이 있습니다." },
    { n: 8, sub: "neg", text: "나는 인공지능이 불길하다고 생각한다." },
    { n: 9, sub: "neg", text: "인공지능이 사람들을 지배할 수도 있다." },
    { n: 10, sub: "neg", text: "저는 인공지능이 위험하다고 생각합니다." },
    { n: 11, sub: "pos", text: "인공지능은 사람들의 행복에 긍정적인 영향을 미칠 수 있다." },
    { n: 12, sub: "pos", text: "인공지능은 흥미롭습니다." },
    { n: 13, sub: "pos", text: "인공지능 에이전트는 많은 일상적인 업무에서 직원보다 더 나을 것이다." },
    { n: 14, sub: "pos", text: "인공지능에는 많은 유익한 응용 분야가 있습니다." },
    { n: 15, sub: "neg", text: "인공지능의 미래 활용 방안을 생각하면 불편한 마음에 몸서리친다." },
    { n: 16, sub: "pos", text: "인공지능 시스템은 인간보다 더 뛰어난 성능을 발휘할 수 있습니다." },
    { n: 17, sub: "pos", text: "인공지능으로 가득 찬 미래는 사회 전반에 걸쳐 많은 이점을 가져다줄 것입니다." },
    { n: 18, sub: "pos", text: "저는 제 업무에 인공지능을 활용하고 싶습니다." },
    { n: 19, sub: "neg", text: "인공지능이 점점 더 많이 사용되면 나와 같은 사람들이 고통받을 것입니다." }
  ]
};

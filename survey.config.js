/**
 * 설문 내용 설정 파일
 * - 문항·장면을 바꾸려면 이 파일만 수정하면 됩니다.
 * - ENDPOINT: 구글 시트에 연결된 Apps Script 웹앱 주소 (배포 후 입력)
 */
window.SURVEY = {
  ENDPOINT: "https://script.google.com/macros/s/AKfycbwESnM08oVafTKHv6_l5I3w37s7tVzD-Gt05pruVEwIRovNAjOUBBxoVGTfOz26WLCy/exec",

  title: "차량 내 AI 에이전트의 선제적 정보 제공에 대한 사용자 인식 조사",

  // 참가자마다 장면 순서를 무작위로 섞음 (논문 3-1: 12개 장면을 무작위 순서로 평가)
  randomizeScenes: true,

  // ── 장면 정의 ──────────────────────────────────────────
  // load: L(저부하) / M(중부하) / H(고부하)
  // info: safety(주행·안전) / vehicle(차량·이동) / schedule(개인·일정) / home(생활·홈)
  scenes: [
    {
      id: "H_schedule",
      load: "H",
      info: "schedule",
      video: "media/scene_H_schedule.mp4",
      poster: "media/scene_H_schedule_poster.jpg",
      message: "7시 회의에 약 15분 늦을 것 같아요. 참석자에게 알릴까요?",
      context: [
        "늦은 저녁, 차량이 많은 도심 도로를 달리고 있어요.",
        "앞쪽 교차로를 지나며 옆 차로로 옮겨 타야 하고, 바로 옆에는 다른 차가 가까이 붙어 있어요."
      ],
      attentionCheck: true
    }
  ],

  // 모든 장면의 상황 설명 아래에 강조해서 보여주는 안내
  sceneInstruction: "지금 직접 운전하고 있다고 상상해 주세요. 영상 속에 나타나는 알림은 차량의 AI 에이전트가 이 상황에서 건네는 말이라고 생각해 주세요.",

  // 각 장면에서 묻는 문항 (N은 페이지 번호로 자동 치환)
  sceneItems: [
    { key: "appropriate", type: "likert", points: 7, text: "지금 시청하신 주행 상황에 AI Agent가 해당 정보를 알려주는 것이 적절하다고 느끼시나요?" },
    { key: "useful", type: "likert", points: 7, text: "AI Agent가 알려주는 정보가 지금 시청하신 주행 상황과 무관하게 본인에게 도움이 된다고 생각하시나요?" },
    { key: "interference", type: "likert", points: 7, text: "지금 시청하신 주행 상황에서 AI Agent가 알려주는 정보를 확인 및 처리하는 동안 안전하게 주행하는 데 방해를 느끼셨나요?" },
    { key: "acceptance", type: "likert", points: 7, text: "이 기능이 있다면 켜두고 사용하실 의향이 있으신가요?" },
    { key: "relevance", type: "likert", points: 7, text: "이 알림의 내용이 지금 하고 계신 운전과 직접 관련이 있다고 느끼시나요?" },
    { key: "urgency", type: "likert", points: 7, text: "이 정보를 지금 바로 알아야 할 만큼 긴급하다고 느끼시나요?" },
    { key: "timing", type: "radio", text: "이 정보를 언제 받고 싶으신가요?",
      options: ["즉시", "주행이 안정된 뒤", "정차 또는 도착 시", "내가 요청할 때만", "필요 없음"] },
    { key: "modality", type: "radio", text: "이 정보를 어떤 방식으로 받고 싶으신가요?",
      options: ["음성만", "화면(시각)만", "음성 + 화면", "진동(햅틱) + 화면", "필요 없음"] },
    { key: "location", type: "radio", text: "화면으로 본다면 어디에 표시되기를 원하시나요?",
      options: ["클러스터 (계기판)", "센터 디스플레이", "HUD (헤드업 디스플레이)", "스마트폰", "화면 표시는 원하지 않음"] }
  ],

  attentionItem: {
    key: "attention", type: "radio", text: "[확인 문항] 방금 보신 영상은 어떤 주행 상황이었나요?",
    options: ["고속도로 직선 주행", "일반 도심 주행", "혼잡 구간에서 차선 변경·합류", "잘 모르겠다"]
  },
  attentionAnswer: { L: "고속도로 직선 주행", M: "일반 도심 주행", H: "혼잡 구간에서 차선 변경·합류" },

  // ── 기본 정보 ─────────────────────────────────────────
  demographics: [
    { key: "gender", type: "radio", text: "성별이 어떻게 되시나요?", options: ["남성", "여성"] },
    { key: "age", type: "radio", text: "연령대가 어떻게 되시나요?", options: ["만 19–29세", "30–39세", "40–49세", "50–59세", "60세 이상"] },
    { key: "experience", type: "radio", text: "운전 경력은 얼마나 되시나요?", options: ["1–3년 미만", "3–5년 미만", "5–10년 미만", "10년 이상"] },
    { key: "frequency", type: "radio", text: "평소 얼마나 자주 운전하시나요?", options: ["거의 매일", "주 3–5회", "주 1–2회", "월 1–3회", "그보다 적게"] },
    { key: "voice_assistant", type: "radio", text: "차량 내 음성 비서(예: \"글레오\", \"안녕 메르세데스\" 등)를 사용해 보신 적이 있으신가요?",
      options: ["사용해 본 적 없음", "있지만 거의 사용하지 않음", "가끔 사용", "자주 사용"] },
    { key: "smarthome", type: "radio", text: "스마트홈 기기나 차량-집 연동 서비스(Car-to-Home 등)를 사용해 보신 적이 있으신가요?", options: ["있음", "없음"] }
  ],

  // ── GAAIS-K (서연희·안정원, 2022) 18문항, 5점 ───────────
  // n: 원척도 문항 번호, sub: pos(긍정) / neg(부정)
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

/* 설문 진행 로직 v3 – 내용은 survey.config.js */
(function () {
  "use strict";
  var C = window.SURVEY;
  var params = new URLSearchParams(location.search);
  // 자극물 점검 모드: 설정(stimulusOnly) 또는 주소의 ?stim=1. 연습+본 장면만 보여 주고 응답은 시트에 보내지 않음
  var STIM = !!C.stimulusOnly || params.get("stim") === "1";
  var STORE_KEY = "aidv-survey-state-v3" + (STIM ? "-stim" : "");
  var app = document.getElementById("app");
  var fill = document.querySelector(".progress-fill");
  var bar = document.querySelector(".progress");
  var MQ_NARROW = window.matchMedia("(max-width: 980px)");

  var safeStore = {
    get: function (k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    remove: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  // ── 상태 ────────────────────────────────────────────
  // ?reset=1: 저장된 진행 기록을 지우고 첫 화면부터 시작. 새로고침해도 다시 지워지지 않도록 주소에서 뺌
  if (params.has("reset")) {
    safeStore.remove(STORE_KEY);
    params.delete("reset");
    try { history.replaceState(null, "", location.pathname + (params.toString() ? "?" + params : "") + location.hash); } catch (e) {}
  }

  var sceneById = {};
  C.scenes.forEach(function (s) { sceneById[s.id] = s; });
  sceneById[C.practice.id] = C.practice;
  var loadById = {};
  C.loadCheck.videos.forEach(function (v) { loadById[v.id] = v; });
  var msgById = {};
  C.messageAttr.messages.forEach(function (m) { msgById[m.id] = m; });

  var state = safeStore.get(STORE_KEY);
  if (!isUsable(state)) state = newState();
  save();

  function ids(list) { return list.map(function (x) { return x.id; }); }
  function sameSet(a, b) {
    if (!Array.isArray(a) || a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (b.indexOf(a[i]) === -1) return false;
    return true;
  }
  // 저장된 진행 기록이 지금 설문 구성과 같은지 확인 (다르거나 손상되면 새로 시작)
  function isUsable(st) {
    return !!st && !st.finished && st.version === C.version && typeof st.page === "number" &&
      sameSet(st.order, ids(C.scenes)) && sameSet(st.loadOrder, ids(C.loadCheck.videos)) &&
      sameSet(st.msgOrder, ids(C.messageAttr.messages));
  }
  function newState() {
    var o = ids(C.scenes), lo = ids(C.loadCheck.videos), mo = ids(C.messageAttr.messages);
    if (C.randomizeScenes) shuffle(o);
    if (C.loadCheck.randomize) shuffle(lo);
    if (C.messageAttr.randomize) shuffle(mo);
    return { pid: makeId(), version: C.version, startedAt: new Date().toISOString(), order: o, loadOrder: lo, msgOrder: mo,
      page: 0, answers: {}, rec: {}, status: "in_progress", finished: false, src: params.get("src") || "" };
  }
  function save() { safeStore.set(STORE_KEY, state); }

  // ── 페이지 구성 ──────────────────────────────────────
  var SEC = { demo: 1, load: 2, main: 3, msg: 4, gaais: 5, end: 6 };
  var pages = [];
  if (STIM) {
    // 자극물 점검: 본 장면만 차례로 보여 주고 끝냄
    state.order.forEach(function (id, i) {
      pages.push({ kind: "video", mode: "scene", num: SEC.main, id: id, clip: sceneById[id], index: i, total: state.order.length });
    });
    pages.push({ kind: "done" });
  } else {
  pages.push({ kind: "welcome" });
  pages.push({ kind: "form", id: "elig", title: "참여 자격 확인", numbered: false,
    items: [{ key: "elig", type: "radio", text: "운전면허를 보유하고 계시며, 실제 운전 경력이 1년 이상이신가요?", options: ["예", "아니오"] }] });
  pages.push({ kind: "form", id: "demo", num: SEC.demo, title: "사전 설문",
    lead: ["응답하시는 분의 특성을 파악하기 위한 질문입니다. 연구 목적으로만 활용되며 개인을 식별하지 않습니다."],
    items: C.demographics });
  pages.push({ kind: "intro", id: "loadIntro", num: SEC.load, title: "주행 상황 살펴보기",
    lead: ["알림이 없는 짧은 주행 영상 " + C.loadCheck.videos.length + "개를 차례로 보여드려요. 영상마다 그 길을 운전하는 데 얼마나 부담이 드는지 3가지를 여쭤볼게요."],
    quote: C.loadCheck.instruction, next: "첫 번째 영상 보기" });
  state.loadOrder.forEach(function (id, i) {
    pages.push({ kind: "video", mode: "load", num: SEC.load, id: "load." + id, clip: loadById[id], index: i, total: state.loadOrder.length });
  });
  pages.push({ kind: "intro", id: "sceneIntro", num: SEC.main, title: "알림 장면 안내",
    lead: ["이제부터는 영상 중간에 차량의 AI 에이전트가 먼저 알림을 보내요. 장면마다 같은 순서로 " +
      C.sceneGroups.reduce(function (n, g) { return n + g.items.length; }, 0) + "가지를 여쭤보고, 질문은 " + C.sceneGroups.length + "개 묶음으로 나뉘어 있어요.",
      "장면 " + state.order.length + "개가 무작위 순서로 이어져요. 장면마다 상황과 알림이 달라요. 매번 방금 본 장면만 떠올리며 답해 주세요." +
      (C.checkAfter ? " 중간에 집중도를 확인하는 짧은 질문이 한 번 있어요." : "")],
    quote: C.sceneIntro, next: "첫 장면 보기" });
  state.order.forEach(function (id, i) {
    pages.push({ kind: "video", mode: "scene", num: SEC.main, id: id, clip: sceneById[id], index: i, total: state.order.length });
    if (C.checkAfter === i + 1 && i + 1 < state.order.length) pages.push(checkPage(id, state.order.length - (i + 1)));
  });
  pages.push({ kind: "messages", num: SEC.msg, title: "알림 내용 평가" });
  pages.push({ kind: "form", id: "gaais", num: SEC.gaais, title: "AI에 대한 일반적인 태도",
    lead: ["거의 다 왔어요. 평소 인공지능(AI)에 대해 어떻게 생각하시는지 여쭤볼게요. 각 문장이 본인의 생각과 얼마나 일치하는지 선택해 주세요."],
    scaleKey: "1 = 전혀 그렇지 않다 · 5 = 매우 그렇다",
    items: C.gaais.map(function (g) { return { key: "GAAIS" + g.n, type: "likert", points: 5, text: g.text, ends: ["전혀 그렇지 않다", "", "매우 그렇다"] }; }) });
  pages.push({ kind: "form", id: "end", num: SEC.end, title: "마무리", submit: true,
    lead: ["마지막 질문이에요. 끝까지 참여해 주셔서 감사합니다."],
    items: [{ key: "comment", type: "text", optional: true,
      text: "운전 중 AI 에이전트가 먼저 정보를 알려주는 것에 대해 추가로 하고 싶으신 의견이 있으신가요? 자유롭게 적어 주세요." }] });
  pages.push({ kind: "done" });
  }

  // 집중도 점검: 직전 장면의 알림을 고르는 회상 문항 + 현재 집중도 자기 보고
  function checkPage(prevId, left) {
    var k = C.checkpoint;
    return { kind: "form", id: "check", title: k.title, numbered: false, prevScene: prevId,
      lead: [k.lead, "응답을 마치면 남은 장면 " + left + "개가 이어져요."],
      items: [
        { key: "CHK_RECALL", type: "radio", text: k.recall, options: C.messageAttr.messages.map(function (m) { return m.text; }) },
        { key: "CHK_FOCUS", type: "likert", points: 7, text: k.focus, ends: k.focusEnds }
      ] };
  }

  var STEPS = STIM ? pages.length - 1 : pages.length - 2; // 동의·완료 화면 제외

  // 검토용 미리보기에서만: 주소 끝에 #band-test 를 붙이면 방안 A 테스트 장면으로 바로 이동
  function reviewJump() {
    if (C.ENDPOINT || location.hash !== "#band-test") return false;
    for (var i = 0; i < pages.length; i++) if (pages[i].clip && pages[i].clip.overlayAt != null) { state.page = i; save(); return true; }
    return false;
  }
  reviewJump();
  window.addEventListener("hashchange", function () { if (reviewJump()) { render(); window.scrollTo(0, 0); } });

  // ── 렌더링 ───────────────────────────────────────────
  function go(n) {
    state.page = Math.max(0, Math.min(pages.length - 1, n));
    save(); render();
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }
  function render() {
    var p = pages[state.page];
    document.body.classList.toggle("cabin", p.kind === "video");
    var pct = Math.round((state.page / (pages.length - 1)) * 100);
    fill.style.width = pct + "%";
    bar.setAttribute("aria-valuenow", String(pct));
    ({ welcome: renderWelcome, form: renderForm, intro: renderIntro, video: renderVideo, messages: renderMessages, done: renderDone })[p.kind](p);
    if (STIM) app.insertAdjacentHTML("afterbegin", '<p class="review-badge">자극물 점검 모드 · 응답이 저장되지 않아요</p>');
    else if (!C.ENDPOINT) app.insertAdjacentHTML("afterbegin", '<p class="review-badge">검토용 미리보기 · 응답이 저장되지 않습니다</p>');
  }
  function count() { return '<p class="page-count">' + (state.page + (STIM ? 1 : 0)) + " / " + STEPS + " 단계</p>"; }
  function heading(p, title) {
    return "<h1>" + (p.num ? '<span class="sec-num">' + p.num + ".</span>" : "") + esc(title || p.title) + "</h1>";
  }
  function navHTML(nextLabel, noPrev) {
    return '<p class="form-error" role="alert"></p><div class="actions">' +
      (noPrev ? "<span></span>" : '<button class="btn btn-ghost" data-prev>이전</button>') +
      '<button class="btn" data-next>' + esc(nextLabel || "다음") + "</button></div>";
  }

  function renderWelcome() {
    var nScenes = state.order.length;
    var mins = Math.round(4 + C.loadCheck.videos.length * 0.8 + nScenes * 2.3 + 1 + 3);
    app.innerHTML = '<section class="page">' +
      "<h1>" + esc(C.title) + "</h1>" +
      '<p class="lead">안녕하세요. 국민대학교 스마트경험디자인학과 AI디자인랩 정수아 연구원입니다.</p>' +
      '<p class="lead">본 연구는 레벨 2 차량에서 AI가 운전자에게 먼저 정보를 알려줄 때, 주행 상황과 정보 종류에 따라 이를 어떻게 받아들이는지 알아보기 위한 연구입니다.</p>' +
      '<p class="lead">본 설문 데이터는 연구 목적으로만 사용되며 그 이외의 목적으로는 활용되지 않습니다.</p>' +
      '<ul class="facts">' +
      "<li><b>소요 시간</b><span>약 " + mins + "분</span></li>" +
      "<li><b>진행 순서</b><span>사전 설문 → 주행 영상 " + C.loadCheck.videos.length + "개 평가 → 알림 장면 " + state.order.length + "개 → 알림 내용 평가 → AI 태도</span></li>" +
      "<li><b>개인정보</b><span>이름·연락처 등 개인을 식별할 수 있는 정보는 수집하지 않으며, 응답은 연구 목적으로만 사용됩니다.</span></li>" +
      "<li><b>중단</b><span>언제든 창을 닫아 그만두실 수 있으며, 불이익은 없습니다.</span></li>" +
      "<li><b>권장 환경</b><span>PC나 태블릿처럼 큰 화면에서 참여해 주십시오. 실제감을 위해 영상의 소리를 켜 주십시오.</span></li>" +
      "</ul>" +
      itemHTML({ key: "consent", type: "radio", text: "위 안내를 읽으셨으며, 본 연구에 자발적으로 참여하는 것에 동의하시나요?", options: ["네, 동의합니다", "아니요, 동의하지 않습니다"] }, null) +
      navHTML("설문 시작하기", true) + "</section>";
    bind();
    onNext(function () {
      if (!validate(["consent"])) return;
      if (state.answers.consent !== "네, 동의합니다") return finish("declined");
      go(state.page + 1);
    });
  }

  function renderForm(p) {
    var h = '<section class="page">' + count() + heading(p);
    (p.lead || []).forEach(function (l) { h += '<p class="lead">' + esc(l) + "</p>"; });
    if (p.scaleKey) h += '<span class="scale-key">' + esc(p.scaleKey) + "</span>";
    p.items.forEach(function (q, i) { h += itemHTML(q, p.numbered === false ? null : p.num + "-" + (i + 1)); });
    h += navHTML(p.submit ? "응답 제출하기" : "다음") + "</section>";
    app.innerHTML = h;
    bind();
    onPrev(); onNext(function () {
      if (!validate(p.items)) return;
      if (p.id === "elig" && state.answers.elig === "아니오") return finish("screened_out");
      if (p.submit) return finish("complete");
      go(state.page + 1);
    });
  }

  function renderIntro(p) {
    var h = '<section class="page">' + count() + heading(p);
    p.lead.forEach(function (l) { h += '<p class="lead">' + esc(l) + "</p>"; });
    if (p.quote) h += '<p class="imagine on-paper"><strong>' + esc(p.quote) + "</strong></p>";
    h += navHTML(p.next) + "</section>";
    app.innerHTML = h;
    onPrev(); onNext(function () { go(state.page + 1); });
  }

  // 영상 + 문항 페이지 (부하 점검 / 연습 / 본 장면)
  function renderVideo(p) {
    var c = p.clip, isLoad = p.mode === "load";
    var rec = state.rec[p.id] || (state.rec[p.id] = { plays: 0, watched: false, ms: 0 });
    rec.enteredAt = Date.now();
    var title = isLoad ? "주행 상황 " + (p.index + 1) + " / " + p.total
      : p.practice ? "연습 장면" : "장면 " + (p.index + 1) + " / " + p.total;
    // 상황 설명: 부하 점검 영상에도 같은 부하의 본 장면과 동일한 문구를 보여 줌
    var ctx = c.context || C.context[isLoad ? c.id : c.load] || [];

    var head = '<header class="scene-head">' + count() + heading(p, title) +
      (ctx.length ? '<div class="brief">' + ctx.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") + "</div>" : "") +
      (isLoad ? '<p class="imagine"><strong>' + esc(C.loadCheck.instruction) + "</strong></p>"
        : '<p class="imagine"><strong>“' + esc(c.overlayAt != null ? C.sceneInstruction.replace("영상 속에", "영상 아래에") : C.sceneInstruction) + "”</strong></p>") +
      '<p class="sound-note"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>주행 몰입을 위해 소리를 켜고 시청해 주세요.</p>' +
      "</header>";

    var media = '<div class="scene-media"><div class="screen">' +
      '<video playsinline webkit-playsinline preload="auto" disablepictureinpicture' + (c.poster ? ' poster="' + esc(c.poster) + '"' : "") + ">" +
      '<source src="' + esc(c.video) + '" type="video/mp4"></video>' +
      '<div class="screen-cover"><button class="play-btn" data-play>' +
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>' +
      "<span>영상 재생</span></button></div></div>" +
      (c.overlayAt != null ? '<div class="agent-band"><div class="agent-card" hidden>' +
        '<span class="agent-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10 3.5l1.6 4.9 4.9 1.6-4.9 1.6L10 16.5l-1.6-4.9L3.5 10l4.9-1.6z"/><path d="M17.5 13.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></svg></span>' +
        '<p>“' + esc(c.message) + "”</p></div></div>" : "") +
      '<div class="screen-status"><span class="status-text">위 설명을 읽고 재생해 주세요.</span>' +
      '<span class="timeline" aria-hidden="true"><i></i></span><button class="replay" data-replay hidden>다시 보기</button></div></div>';

    var qhtml = "", keys = [];
    if (isLoad) {
      var items = C.loadCheck.items.map(function (q) { var k = p.id + "." + q.key; keys.push(k); return { key: k, text: q.text }; });
      qhtml = groupHTML({ title: "이 길을 운전하는 부담", items: items, likert: true }, p.num, p.index * items.length);
    } else {
      var n = 0;
      qhtml += '<div class="msg-pin"><span>이 장면의 알림</span><p>“' + esc(c.message) + "”</p></div>";
      C.sceneGroups.forEach(function (g) {
        var gi = g.items.map(function (q) { var o = Object.assign({}, q); o.key = p.id + "." + q.key; keys.push(o.key); return o; });
        qhtml += groupHTML({ title: g.title, prompt: g.prompt, likert: g.likert, items: gi }, p.num, n);
        n += gi.length;
      });
    }
    app.innerHTML = '<section class="scene">' + head + media +
      '<div class="scene-side"><p class="watch-note">영상을 끝까지 시청하신 뒤 아래 질문에 응답해 주세요. 정답은 없으니 느끼신 그대로 답해 주시면 돼요.</p>' +
      '<div class="scene-questions"' + (rec.watched ? "" : " hidden") + ">" + qhtml + navHTML("다음") + "</div></div></section>";
    bind();
    markGroups();
    wireVideo(rec, c.overlayAt);

    function leave() { rec.ms += Date.now() - rec.enteredAt; save(); }
    var prevBtn = app.querySelector("[data-prev]");
    if (state.page === 0) prevBtn.style.visibility = "hidden";
    prevBtn.onclick = function () { leave(); go(state.page - 1); };
    onNext(function () {
      if (!validate(keys)) return; leave();
      if (STIM && pages[state.page + 1].kind === "done") return finish("complete");
      go(state.page + 1);
    });
  }

  function wireVideo(rec, overlayAt) {
    var video = app.querySelector("video"), cover = app.querySelector(".screen-cover");
    var card = app.querySelector(".agent-card");
    var status = app.querySelector(".status-text"), replay = app.querySelector("[data-replay]");
    var tl = app.querySelector(".timeline i"), qs = app.querySelector(".scene-questions");
    var countNext = false;
    function failed() { cover.hidden = false; status.textContent = "재생되지 않았어요. 재생 버튼을 다시 눌러 주세요."; }
    function play() {
      video.currentTime = 0; countNext = true; cover.hidden = true; replay.hidden = true; status.textContent = "불러오는 중";
      if (card) card.hidden = true;   // 다시 볼 때는 처음처럼 4초에 다시 나타남
      // 재생할 때 영상(과 아래 알림 띠)이 화면 안에 다 들어오도록 스크롤
      var stage = app.querySelector(".scene-media"), r = stage.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) stage.scrollIntoView({ behavior: "smooth", block: r.height > window.innerHeight ? "start" : "center" });
      var pr = video.play();
      if (pr && pr.catch) pr.catch(function () { setTimeout(function () { var p2 = video.play(); if (p2 && p2.catch) p2.catch(failed); }, 300); });
    }
    video.addEventListener("playing", function () { status.textContent = "재생 중"; if (countNext) { countNext = false; rec.plays += 1; save(); } });
    app.querySelector("[data-play]").onclick = play;
    replay.onclick = play;
    // 알림 띠: 영상 시각이 overlayAt을 넘는 순간 표시 (가능하면 프레임 단위로 확인)
    // 한 번 뜨면 다시 보기를 누를 때까지 그대로 유지 (재생 시각이 0으로 보고돼도 숨기지 않음)
    function syncCard(t) {
      if (!card || !card.hidden || video.paused && !video.ended && t < overlayAt) return;
      if (t >= overlayAt) {
        card.hidden = false;
        if (rec.overlayShownAt == null) { rec.overlayShownAt = Math.round(t * 1000) / 1000; save(); }   // 실제로 뜬 영상 시각
      }
    }
    if (card && "requestVideoFrameCallback" in video) {
      var onFrame = function (now, meta) { syncCard(meta.mediaTime); video.requestVideoFrameCallback(onFrame); };
      video.requestVideoFrameCallback(onFrame);
    }
    video.addEventListener("timeupdate", function () {
      if (video.duration) tl.style.width = (video.currentTime / video.duration * 100) + "%";
      syncCard(video.currentTime);
    });
    video.addEventListener("ended", function () {
      tl.style.width = "100%"; replay.hidden = false;
      if (card) card.hidden = false;
      status.textContent = rec.watched ? "다시 보기를 마쳤어요." : (MQ_NARROW.matches ? "시청을 마쳤어요. 아래 질문에 응답해 주세요." : "시청을 마쳤어요. 오른쪽 질문에 응답해 주세요.");
      if (!rec.watched) {
        rec.watched = true; save(); qs.hidden = false;
        if (MQ_NARROW.matches) qs.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    if (rec.watched) { cover.hidden = true; replay.hidden = false; status.textContent = "이미 시청한 영상이에요. 필요하면 다시 볼 수 있어요."; if (card) card.hidden = false; }
  }

  function renderMessages(p) {
    var keys = [], n = 0, h = '<section class="page">' + count() + heading(p) +
      '<p class="lead">앞서 영상에서 본 알림 ' + state.msgOrder.length + "개를 영상 없이 다시 보여드려요.</p>" +
      '<p class="imagine on-paper"><strong>' + esc(C.messageAttr.instruction) + "</strong></p>";
    state.msgOrder.forEach(function (id, i) {
      var items = C.messageAttr.items.map(function (q) { var k = "msg." + id + "." + q.key; keys.push(k); return { key: k, text: q.text }; });
      h += '<div class="msg-block"><p class="msg-label">알림 ' + (i + 1) + "</p>" +
        '<p class="msg-quote">“' + esc(msgById[id].text) + "”</p>" +
        groupHTML({ items: items, likert: true }, p.num, n) + "</div>";
      n += items.length;
    });
    h += navHTML("다음") + "</section>";
    app.innerHTML = h;
    bind(); markGroups();
    onPrev(); onNext(function () { if (validate(keys)) go(state.page + 1); });
  }

  function renderDone() {
    var st = state.status;
    if (STIM) {
      app.innerHTML = '<section class="page"><h1>점검할 장면을 모두 봤어요</h1><p class="lead">처음부터 다시 보려면 아래 버튼을 눌러 주세요. 장면 순서는 다시 무작위로 섞여요.</p>' +
        '<div class="actions"><span></span><button class="btn" data-restart>처음부터 다시 보기</button></div></section>';
      app.querySelector("[data-restart]").onclick = function () { safeStore.remove(STORE_KEY); location.reload(); };
      return;
    }
    var title = st === "complete" ? "응답이 제출되었어요" : "참여해 주셔서 감사합니다";
    var body = st === "complete" ? "소중한 시간을 내어 주셔서 감사합니다. 이제 창을 닫으셔도 돼요."
      : st === "screened_out" ? "이번 조사는 운전면허를 보유하고 운전 경력이 1년 이상인 분을 대상으로 합니다. 관심 가져 주셔서 감사합니다."
      : "동의하지 않으셔서 설문을 마칩니다. 관심 가져 주셔서 감사합니다.";
    app.innerHTML = '<section class="page">' +
      '<div class="end-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
      "<h1>" + title + '</h1><p class="lead">' + body + '</p><p class="lead submit-state"></p>' +
      '<p class="code-box">응답 번호 ' + esc(state.pid) + "</p></section>";
    showSubmitState();
  }

  // ── 문항 HTML ────────────────────────────────────────
  // 묶음 카드: 리커트 문항은 같은 척도 기준을 한 번만 보여 주고 행으로 나열
  function groupHTML(g, sec, start) {
    var h = '<section class="group' + (g.likert ? " is-likert" : "") + '" data-group>';
    if (g.title) h += '<h2 class="group-title"><span class="group-check" aria-hidden="true"></span>' + esc(g.title) + "</h2>";
    if (g.prompt) h += '<p class="group-prompt">' + esc(g.prompt) + "</p>";
    if (g.likert) {
      h += '<div class="scale-head" aria-hidden="true"><span>1 ' + esc(C.scale7[0]) + "</span><span>4 " + esc(C.scale7[1]) + "</span><span>7 " + esc(C.scale7[2]) + "</span></div>";
      g.items.forEach(function (q, i) { h += itemHTML({ key: q.key, type: "likert", points: 7, text: q.text, ends: C.scale7, row: true }, sec + "-" + (start + i + 1)); });
    } else {
      g.items.forEach(function (q, i) { h += itemHTML(q, sec + "-" + (start + i + 1)); });
    }
    return h + "</section>";
  }

  function itemHTML(q, num) {
    var id = qid(q.key), val = state.answers[q.key];
    var h = '<div class="q' + (q.row ? " q-row" : "") + '" role="group" id="' + id + '" aria-labelledby="' + id + '_t">' +
      '<div class="q-title" id="' + id + '_t">' + (num ? '<span class="q-num">' + num + ".</span>" : "") +
      "<span>" + esc(q.text) + (q.optional ? ' <span class="q-optional">(선택)</span>' : "") + "</span></div>";
    if (q.image) h += '<figure class="q-image"><img src="' + esc(q.image.src) + '" width="' + q.image.w + '" height="' + q.image.h + '" alt="' + esc(q.image.alt) + '" loading="lazy"></figure>';
    if (q.type === "likert") {
      var mid = Math.ceil(q.points / 2);
      h += '<div class="likert" style="--n:' + q.points + '">';
      for (var i = 1; i <= q.points; i++) {
        var lab = i === 1 ? q.ends[0] : i === q.points ? q.ends[2] : (i === mid && q.ends[1]) ? q.ends[1] : "";
        h += '<label><input type="radio" name="' + esc(q.key) + '" value="' + i + '"' + (String(val) === String(i) ? " checked" : "") +
          ' aria-label="' + i + (lab ? " " + esc(lab) : "") + '"><span>' + i + "</span></label>";
      }
      h += '</div><div class="likert-ends" aria-hidden="true"><span>' + esc(q.ends[0]) + "</span>" +
        (q.ends[1] ? '<span class="mid">' + esc(q.ends[1]) + "</span>" : "") + "<span>" + esc(q.ends[2]) + "</span></div>";
    } else if (q.type === "radio" || q.type === "checkbox") {
      h += '<div class="choices">';
      q.options.forEach(function (o) {
        var on = q.type === "checkbox" ? (Array.isArray(val) && val.indexOf(o) !== -1) : val === o;
        h += '<label class="choice' + (q.type === "checkbox" ? " is-check" : "") + '"><input type="' + q.type + '" name="' + esc(q.key) + '" value="' + esc(o) + '"' + (on ? " checked" : "") + '><span class="mark"></span><span>' + esc(o) + "</span></label>";
      });
      h += "</div>";
    } else if (q.type === "number") {
      h += '<label class="num-field"><input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" name="' + esc(q.key) + '" value="' + esc(val === undefined ? "" : val) +
        '" data-min="' + q.min + '" data-max="' + q.max + '" aria-label="' + esc(q.text) + '"><span>' + esc(q.unit) + "</span></label>";
    } else if (q.type === "text") {
      h += '<textarea name="' + esc(q.key) + '" maxlength="2000" aria-label="자유 의견">' + esc(val || "") + "</textarea>";
    }
    h += '<p class="q-hint">' + (q.type === "number" ? "숫자로 입력해 주세요 (" + q.min + "–" + q.max + q.unit + ")." : "이 질문에 응답해 주세요.") + "</p></div>";
    return h;
  }

  function bind() {
    app.querySelectorAll("input, textarea").forEach(function (el) {
      el.addEventListener("change", onInput);
      if (el.tagName === "TEXTAREA" || el.type === "text") el.addEventListener("input", onInput);
    });
  }
  function onInput(e) {
    var el = e.target, key = el.name;
    if (el.type === "radio") state.answers[key] = el.closest(".likert") ? Number(el.value) : el.value;
    else if (el.dataset.min !== undefined) {
      el.value = el.value.replace(/[^0-9]/g, "");
      if (el.value === "") delete state.answers[key]; else state.answers[key] = Number(el.value);
    } else state.answers[key] = el.value;
    var q = el.closest(".q");
    if (q && answered(q)) q.classList.remove("missing");
    markGroups(); save();
  }
  // 묶음 안 문항을 모두 답하면 카드 제목에 완료 표시
  function markGroups() {
    app.querySelectorAll("[data-group]").forEach(function (g) {
      var done = true;
      g.querySelectorAll(".q").forEach(function (q) { if (!answered(q)) done = false; });
      g.classList.toggle("is-done", done);
    });
  }
  function answered(qEl) {
    var inp = qEl.querySelector("input, textarea");
    return !inp || isAnswered(inp.name, inp);
  }
  function isAnswered(key, inp) {
    var v = state.answers[key];
    if (inp && inp.dataset && inp.dataset.min !== undefined) return typeof v === "number" && v >= Number(inp.dataset.min) && v <= Number(inp.dataset.max);
    return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== "";
  }

  function validate(list) {
    var first = null;
    list.forEach(function (q) {
      var key = typeof q === "string" ? q : q.key;
      if (typeof q === "object" && q.optional) return;
      var el = document.getElementById(qid(key));
      var ok = isAnswered(key, el && el.querySelector("input, textarea"));
      if (el) el.classList.toggle("missing", !ok);
      if (!ok && !first) first = el;
    });
    var err = app.querySelector(".form-error");
    if (first) {
      if (err) err.textContent = "응답하지 않은 질문이 있어요. 표시된 질문에 응답해 주세요.";
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      var inp = first.querySelector("input, textarea");
      if (inp) inp.focus({ preventScroll: true });
      return false;
    }
    if (err) err.textContent = "";
    return true;
  }
  function onNext(fn) { app.querySelector("[data-next]").onclick = fn; }
  function onPrev() { var b = app.querySelector("[data-prev]"); if (b) b.onclick = function () { go(state.page - 1); }; }

  // ── 제출 ─────────────────────────────────────────────
  function finish(status) {
    state.status = status; state.finished = true; state.finishedAt = new Date().toISOString();
    state.submit = { state: "pending" }; save();
    state.page = pages.length - 1; render(); window.scrollTo(0, 0);
    submit();
  }

  function buildPayload() {
    var a = state.answers, wide = {
      pid: state.pid, version: state.version, status: state.status, started_at: state.startedAt, finished_at: state.finishedAt,
      duration_sec: Math.round((new Date(state.finishedAt) - new Date(state.startedAt)) / 1000),
      scene_order: state.order.join(" > "), load_order: state.loadOrder.join(" > "), msg_order: state.msgOrder.join(" > "),
      source: state.src, user_agent: navigator.userAgent, viewport: window.innerWidth + "x" + window.innerHeight
    };
    Object.keys(a).forEach(function (k) { wide[k.replace(/\./g, "_")] = Array.isArray(a[k]) ? a[k].join(" | ") : a[k]; });
    var pos = [], neg = [];
    C.gaais.forEach(function (g) { var v = a["GAAIS" + g.n]; if (typeof v === "number") (g.sub === "pos" ? pos : neg).push(v); });
    if (pos.length) wide.GAAIS_pos_mean = round2(mean(pos));
    if (neg.length) wide.GAAIS_neg_mean = round2(mean(neg));

    var long = [];
    state.loadOrder.forEach(function (id, i) {
      var k = "load." + id, rec = state.rec[k] || {};
      if (a[k + ".LOAD1"] === undefined) return;
      var r = { pid: state.pid, block: "load_check", item_id: id, load: id, position: i + 1, plays: rec.plays || 0, time_sec: Math.round((rec.ms || 0) / 1000) };
      var v = [];
      C.loadCheck.items.forEach(function (q) { r[q.key] = a[k + "." + q.key]; v.push(r[q.key]); });
      r.LOAD_mean = round2(mean(v));
      long.push(r);
    });
    [C.practice.id].concat(state.order).forEach(function (id, i) {
      var s = sceneById[id], rec = state.rec[id] || {};
      if (a[id + ".AC"] === undefined) return;   // 응답하지 않은 장면은 건너뜀
      var r = { pid: state.pid, block: s.practice ? "practice" : "scene", item_id: id, load: s.load, info: s.info, position: s.practice ? 0 : i,
        message: s.message, alert_mode: s.overlayAt != null ? "band" : "in_video", alert_shown_at: rec.overlayShownAt != null ? rec.overlayShownAt : "",
        plays: rec.plays || 0, time_sec: Math.round((rec.ms || 0) / 1000) };
      var likerts = [];
      C.sceneGroups.forEach(function (g) {
        var gv = [];
        g.items.forEach(function (q) { r[q.key] = a[id + "." + q.key]; if (g.likert) { gv.push(r[q.key]); likerts.push(r[q.key]); } });
        if (g.likert) r[g.id + "_mean"] = round2(mean(gv));
      });
      r.AC_correct = r.AC === C.acAnswer[s.load] ? 1 : 0;
      r.straightline = likerts.every(function (v) { return v === likerts[0]; }) ? 1 : 0;   // 리커트 12문항을 모두 같은 값으로 답했는지
      wide[id + "_position"] = r.position; wide[id + "_plays"] = r.plays; wide[id + "_time_sec"] = r.time_sec;
      wide[id + "_AC_correct"] = r.AC_correct; wide[id + "_straightline"] = r.straightline;
      long.push(r);
    });
    state.msgOrder.forEach(function (id, i) {
      if (a["msg." + id + ".URG"] === undefined) return;
      var r = { pid: state.pid, block: "message_attr", item_id: id, info: id, position: i + 1, message: msgById[id].text };
      C.messageAttr.items.forEach(function (q) { r[q.key] = a["msg." + id + "." + q.key]; });
      long.push(r);
    });
    // 집중도 점검: 직전 장면(checkAfter번째)의 알림을 맞게 골랐는지
    if (a.CHK_RECALL !== undefined && C.checkAfter) {
      var prev = sceneById[state.order[C.checkAfter - 1]];
      wide.CHK_after_scene = prev.id;
      wide.CHK_RECALL_correct = a.CHK_RECALL === prev.message ? 1 : 0;
    }
    var sc = long.filter(function (r) { return r.block === "scene"; });
    wide.AC_correct_rate = sc.length ? round2(mean(sc.map(function (r) { return r.AC_correct; }))) : "";
    wide.straightline_scenes = sc.filter(function (r) { return r.straightline; }).length;
    return { wide: wide, long: long };
  }

  function submit() {
    var payload = buildPayload();
    safeStore.set("aidv-survey-backup-" + state.pid, payload);
    if (!C.ENDPOINT || STIM) { state.submit = { state: "no-endpoint" }; save(); showSubmitState(); return; }
    fetch(C.ENDPOINT, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), keepalive: true })
      .then(function () { state.submit = { state: "sent" }; save(); showSubmitState(); })
      .catch(function () { state.submit = { state: "failed" }; save(); showSubmitState(); });
  }
  function showSubmitState() {
    var el = app.querySelector(".submit-state");
    if (!el || !state.submit) return;
    var s = state.submit.state;
    if (s === "pending") el.textContent = "응답을 저장하는 중이에요. 창을 닫지 말고 잠시만 기다려 주세요.";
    else if (s === "sent") el.textContent = "";
    else if (s === "failed") {
      el.innerHTML = '응답을 저장하지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요. <button class="btn" data-retry style="margin-top:14px">다시 제출하기</button>';
      el.querySelector("[data-retry]").onclick = function () { state.submit = { state: "pending" }; showSubmitState(); submit(); };
    } else if (s === "no-endpoint" && state.status === "complete") {
      el.innerHTML = '검토용 미리보기라 응답이 시트에 저장되지 않았어요. <button class="btn" data-dl style="margin-top:14px">응답 데이터 내려받기</button>';
      el.querySelector("[data-dl]").onclick = function () {
        var blob = new Blob([JSON.stringify(buildPayload(), null, 2)], { type: "application/json" });
        var u = URL.createObjectURL(blob), link = document.createElement("a");
        link.href = u; link.download = "response_" + state.pid + ".json"; document.body.appendChild(link); link.click(); link.remove();
        setTimeout(function () { URL.revokeObjectURL(u); }, 1000);
      };
    }
  }

  // ── 도우미 ───────────────────────────────────────────
  function qid(key) { return "q_" + String(key).replace(/[^A-Za-z0-9_-]/g, "_"); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function mean(a) { a = a.filter(function (v) { return typeof v === "number"; }); return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : ""; }
  function round2(x) { return x === "" ? "" : Math.round(x * 100) / 100; }
  function makeId() {
    var t = new Date(), pad = function (n) { return String(n).padStart(2, "0"); };
    var rnd = (window.crypto && crypto.getRandomValues) ? Array.from(crypto.getRandomValues(new Uint8Array(3))).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("") : Math.random().toString(16).slice(2, 8);
    return "P" + String(t.getFullYear()).slice(2) + pad(t.getMonth() + 1) + pad(t.getDate()) + "-" + rnd.toUpperCase();
  }

  try {
    render();
    try { sessionStorage.removeItem("aidv-retried"); } catch (e) {}
  } catch (err) {
    var retried = false;
    try { retried = sessionStorage.getItem("aidv-retried") === "1"; sessionStorage.setItem("aidv-retried", "1"); } catch (e) { retried = true; }
    safeStore.remove(STORE_KEY);
    if (!retried) location.reload();
    else app.innerHTML = '<section class="page"><h1>설문을 불러오지 못했습니다</h1><p class="lead">잠시 후 페이지를 새로고침해 주십시오. 계속 같은 화면이 보이면 연구자에게 알려 주십시오.</p></section>';
    if (window.console) console.error(err);
  }
})();

/* 설문 진행 로직 – 설정은 survey.config.js */
(function () {
  "use strict";
  var safeStore = {
    get: function (k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    remove: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  var C = window.SURVEY;
  var STORE_KEY = "aidv-survey-state-v1";
  var app = document.getElementById("app");
  var fill = document.querySelector(".progress-fill");
  var bar = document.querySelector(".progress");

  // ── 상태 ────────────────────────────────────────────
  var params = new URLSearchParams(location.search);
  if (params.has("reset")) { safeStore.remove(STORE_KEY); }

  var state = safeStore.get(STORE_KEY) || newState();
  if (state.finished) state = newState();
  save();

  function newState() {
    var ids = C.scenes.map(function (s) { return s.id; });
    if (C.randomizeScenes) shuffle(ids);
    return {
      pid: makeId(),
      startedAt: new Date().toISOString(),
      order: ids,
      page: 0,
      answers: {},
      scene: {},            // 장면별 기록: 재생 횟수, 시청 완료 시각, 머문 시간
      status: "in_progress",
      finished: false,
      src: params.get("src") || ""
    };
  }

  function save() { safeStore.set(STORE_KEY, state); }

  // ── 페이지 구성 ──────────────────────────────────────
  var sceneById = {};
  C.scenes.forEach(function (s) { sceneById[s.id] = s; });

  var pages = [];
  pages.push({ kind: "welcome" });
  pages.push({
    kind: "form", id: "elig", title: "참여 자격 확인",
    items: [{ key: "elig_eligible", type: "radio", text: "운전면허를 보유하고 계시며, 실제 운전 경력이 1년 이상이신가요?", options: ["예", "아니오"] }],
    numbered: false
  });
  pages.push({
    kind: "form", id: "demo", num: 1, title: "기본 정보",
    lead: ["응답하시는 분의 특성을 파악하기 위한 질문이에요. 연구 목적으로만 활용되며 개인을 식별하지 않습니다."],
    items: C.demographics.map(function (q) { return Object.assign({}, q, { key: "demo_" + q.key }); })
  });
  pages.push({
    kind: "form", id: "gaais", num: 2, title: "AI에 대한 일반적인 태도",
    lead: ["평소 인공지능(AI)에 대해 어떻게 생각하시는지 여쭤보려고 해요. 각 문장을 읽고 본인의 생각과 얼마나 일치하는지 선택해 주세요. 정답은 없으니 떠오르는 대로 응답해 주시면 됩니다."],
    scaleKey: "1 = 전혀 그렇지 않다 · 5 = 매우 그렇다",
    items: C.gaais.map(function (g) {
      return { key: "gaais_" + g.n, type: "likert", points: 5, text: g.text, ends: ["전혀 그렇지 않다", "매우 그렇다"] };
    })
  });
  pages.push({ kind: "guide", num: 3, title: "실험 안내" });
  state.order.forEach(function (id, i) {
    pages.push({ kind: "scene", num: 4 + i, scene: sceneById[id], index: i });
  });
  pages.push({
    kind: "form", id: "end", num: 4 + state.order.length, title: "마무리",
    lead: ["마지막 질문이에요. 끝까지 참여해 주셔서 감사합니다."],
    items: [{ key: "end_comment", type: "text", optional: true,
      text: "운전 중 AI 에이전트가 먼저 정보를 알려주는 것에 대해 추가로 하고 싶으신 의견이 있으신가요? 자유롭게 적어 주세요." }],
    submit: true
  });
  pages.push({ kind: "done" });

  // ── 렌더링 ───────────────────────────────────────────
  function go(n) {
    state.page = Math.max(0, Math.min(pages.length - 1, n));
    save();
    render();
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }

  function render() {
    var p = pages[state.page];
    document.body.classList.toggle("cabin", p.kind === "scene");
    var pct = Math.round((state.page / (pages.length - 1)) * 100);
    fill.style.width = pct + "%";
    bar.setAttribute("aria-valuenow", String(pct));
    if (p.kind === "welcome") return renderWelcome();
    if (p.kind === "form") return renderForm(p);
    if (p.kind === "guide") return renderGuide(p);
    if (p.kind === "scene") return renderScene(p);
    if (p.kind === "done") return renderDone();
  }

  function pageCount() {
    // 안내·완료 페이지를 뺀 단계 표시
    return '<p class="page-count">' + (state.page) + " / " + (pages.length - 2) + " 단계</p>";
  }

  function renderWelcome() {
    app.innerHTML =
      '<section class="page">' +
      "<h1>" + esc(C.title) + "</h1>" +
      '<p class="lead">레벨 2 부분 자율주행(차로 유지·속도 조절 보조) 상황에서 차량 AI가 운전자에게 먼저 정보를 알려줄 때, 주행 상황과 정보 종류에 따라 이를 어떻게 받아들이는지 알아보기 위한 연구예요.</p>' +
      '<ul class="facts">' +
      "<li><b>소요 시간</b><span>약 " + (8 + state.order.length * 2) + "분</span></li>" +
      "<li><b>진행 순서</b><span>기본 정보 → AI 태도 설문 → 주행 영상 " + state.order.length + "개 시청 후 응답</span></li>" +
      "<li><b>개인정보</b><span>이름·연락처 등 개인을 식별할 수 있는 정보는 수집하지 않으며, 응답은 연구 목적으로만 사용돼요.</span></li>" +
      "<li><b>중단</b><span>언제든 창을 닫아 그만두실 수 있고, 불이익은 없어요.</span></li>" +
      "<li><b>권장 환경</b><span>PC나 태블릿처럼 큰 화면에서 참여해 주세요. 실제감을 위해 영상의 소리를 켜 주세요.</span></li>" +
      "</ul>" +
      questionHTML({ key: "consent", type: "radio", text: "위 안내를 읽으셨으며, 본 연구에 자발적으로 참여하는 것에 동의하시나요?", options: ["네, 동의합니다", "아니요, 동의하지 않습니다"] }, null) +
      '<p class="form-error" role="alert"></p>' +
      '<div class="actions"><span></span><button class="btn" data-next>설문 시작하기</button></div>' +
      "</section>";
    bindInputs();
    app.querySelector("[data-next]").onclick = function () {
      if (!validate([{ key: "consent" }])) return;
      if (state.answers.consent !== "네, 동의합니다") { finish("declined"); return; }
      go(state.page + 1);
    };
  }

  function renderForm(p) {
    var html = '<section class="page">' + pageCount() +
      "<h1>" + (p.num ? '<span class="sec-num">' + p.num + ".</span>" : "") + esc(p.title) + "</h1>";
    (p.lead || []).forEach(function (l) { html += '<p class="lead">' + esc(l) + "</p>"; });
    if (p.scaleKey) html += '<span class="scale-key">' + esc(p.scaleKey) + "</span>";
    p.items.forEach(function (q, i) {
      html += questionHTML(q, p.numbered === false ? null : p.num + "-" + (i + 1));
    });
    html += '<p class="form-error" role="alert"></p>' +
      '<div class="actions"><button class="btn btn-ghost" data-prev>이전</button>' +
      '<button class="btn" data-next>' + (p.submit ? "응답 제출하기" : "다음") + "</button></div></section>";
    app.innerHTML = html;
    bindInputs();
    app.querySelector("[data-prev]").onclick = function () { go(state.page - 1); };
    app.querySelector("[data-next]").onclick = function () {
      if (!validate(p.items)) return;
      if (p.id === "elig" && state.answers.elig_eligible === "아니오") { finish("screened_out"); return; }
      if (p.submit) { finish("complete"); return; }
      go(state.page + 1);
    };
  }

  function renderGuide(p) {
    app.innerHTML =
      '<section class="page">' + pageCount() +
      '<h1><span class="sec-num">' + p.num + ".</span>" + esc(p.title) + "</h1>" +
      '<p class="lead">지금부터 운전석 시점의 주행 영상을 보시게 됩니다.</p>' +
      '<ul class="facts">' +
      "<li><b>주행 상황</b><span>차량은 레벨 2 주행 보조(차로 유지·속도 조절)가 켜져 있지만, 운전자인 내가 앞과 주변을 살피고 필요하면 직접 개입해야 하는 상황이에요.</span></li>" +
      "<li><b>AI 알림</b><span>영상 도중 화면 위쪽에 차량 AI의 알림이 나타나요. 실제로 운전하면서 이 알림을 받았다고 상상하며 응답해 주세요.</span></li>" +
      "<li><b>보는 방법</b><span>영상마다 상황 설명을 먼저 읽고 재생해 주세요. 영상을 끝까지 보시면 질문이 나타나요.</span></li>" +
      "<li><b>응답</b><span>정답은 없으니 느끼신 그대로 답해 주시면 됩니다.</span></li>" +
      "</ul>" +
      '<figure class="dash-figure">' + dashSVG() +
      "<figcaption>질문에 나오는 차량 화면 위치예요. HUD는 앞유리, 클러스터는 핸들 뒤 계기판, 센터 디스플레이는 가운데 큰 화면이에요.</figcaption></figure>" +
      '<div class="actions"><button class="btn btn-ghost" data-prev>이전</button><button class="btn" data-next>영상 보러 가기</button></div>' +
      "</section>";
    app.querySelector("[data-prev]").onclick = function () { go(state.page - 1); };
    app.querySelector("[data-next]").onclick = function () { go(state.page + 1); };
  }

  function renderScene(p) {
    var s = p.scene;
    var rec = state.scene[s.id] || (state.scene[s.id] = { plays: 0, watched: false, enteredAt: null, ms: 0 });
    rec.enteredAt = Date.now();
    var items = C.sceneItems.map(function (q) { return Object.assign({}, q, { key: s.id + "_" + q.key, ends: ["전혀 그렇지 않다", "매우 그렇다"] }); });
    if (s.attentionCheck) items.push(Object.assign({}, C.attentionItem, { key: s.id + "_" + C.attentionItem.key }));

    var html =
      '<section class="scene">' +
      '<header class="scene-head">' + pageCount() +
      '<h1><span class="sec-num">' + p.num + ".</span>장면 " + (p.index + 1) + " / " + state.order.length + "</h1>" +
      '<div class="brief">' + s.context.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") + "</div>" +
      (C.sceneInstruction ? '<p class="imagine"><strong>“' + esc(C.sceneInstruction) + '”</strong></p>' : "") +
      "</header>" +
      '<div class="scene-media">' +
      '<div class="screen">' +
      '<video playsinline preload="auto" disablepictureinpicture' + (s.poster ? ' poster="' + esc(s.poster) + '"' : "") + ">" +
      '<source src="' + esc(s.video) + '" type="video/mp4"></video>' +
      '<div class="screen-cover"><button class="play-btn" data-play>' +
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>' +
      "<span>영상 재생</span></button></div>" +
      "</div>" +
      '<div class="screen-status"><span class="status-text">위 상황 설명을 읽고 재생해 주세요.</span>' +
      '<span class="timeline" aria-hidden="true"><i></i></span>' +
      '<button class="replay" data-replay hidden>다시 보기</button></div>' +
      "</div>" +
      '<div class="scene-side">' +
      '<p class="watch-note">영상을 끝까지 시청하신 뒤 아래 질문에 응답해 주세요. 정답은 없으니 느끼신 그대로 답해 주시면 됩니다.</p>' +
      '<div class="scene-questions"' + (rec.watched ? "" : " hidden") + ">" +
      items.map(function (q, i) { return questionHTML(q, p.num + "-" + (i + 1)); }).join("") +
      '<p class="form-error" role="alert"></p>' +
      '<div class="actions"><button class="btn btn-ghost" data-prev>이전</button><button class="btn" data-next>다음</button></div>' +
      "</div></div></section>";
    app.innerHTML = html;
    bindInputs();

    var video = app.querySelector("video");
    var cover = app.querySelector(".screen-cover");
    var status = app.querySelector(".status-text");
    var replay = app.querySelector("[data-replay]");
    var tl = app.querySelector(".timeline i");
    var qs = app.querySelector(".scene-questions");
    var note = app.querySelector(".watch-note");

    // 재생 횟수는 실제로 재생이 시작됐을 때만 셈
    var countNext = false;
    function failed() { cover.hidden = false; status.textContent = "재생되지 않았어요. 재생 버튼을 다시 눌러 주세요."; }
    function play() {
      video.currentTime = 0;
      countNext = true;
      cover.hidden = true;
      replay.hidden = true;
      status.textContent = "불러오는 중";
      var pr = video.play();
      if (pr && pr.catch) pr.catch(function () {
        // 탭 전환 직후 등 일시적으로 거부되면 한 번 더 시도
        setTimeout(function () {
          var p2 = video.play();
          if (p2 && p2.catch) p2.catch(failed);
        }, 300);
      });
    }
    video.addEventListener("playing", function () {
      status.textContent = "재생 중";
      if (countNext) { countNext = false; rec.plays += 1; save(); }
    });
    app.querySelector("[data-play]").onclick = play;
    replay.onclick = play;
    video.addEventListener("timeupdate", function () {
      if (video.duration) tl.style.width = (video.currentTime / video.duration * 100) + "%";
    });
    // 시청 중에는 화면을 눌러도 멈추거나 넘길 수 없음 (컨트롤 없음)
    video.addEventListener("ended", function () {
      tl.style.width = "100%";
      status.textContent = rec.watched ? "다시 보기를 마쳤어요." : "시청을 마쳤어요. 오른쪽 질문에 응답해 주세요.";
      if (window.matchMedia("(max-width: 980px)").matches && !rec.watched) status.textContent = "시청을 마쳤어요. 아래 질문에 응답해 주세요.";
      replay.hidden = false;
      if (!rec.watched) {
        rec.watched = true; rec.watchedAt = new Date().toISOString(); save();
        qs.hidden = false;
        if (window.matchMedia("(max-width: 980px)").matches) qs.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    if (rec.watched) { cover.hidden = true; replay.hidden = false; status.textContent = "이미 시청한 영상이에요. 필요하면 다시 볼 수 있어요."; }

    function leave() { rec.ms += Date.now() - rec.enteredAt; save(); }
    app.querySelector("[data-prev]").onclick = function () { leave(); go(state.page - 1); };
    app.querySelector("[data-next]").onclick = function () {
      if (!validate(items)) return;
      leave();
      go(state.page + 1);
    };
  }

  function renderDone() {
    var st = state.status;
    var title = st === "complete" ? "응답이 제출되었어요" : "참여해 주셔서 감사합니다";
    var body = st === "complete" ? "소중한 시간을 내어 주셔서 감사합니다. 이제 창을 닫으셔도 됩니다."
      : st === "screened_out" ? "이번 조사는 운전면허를 보유하고 운전 경력이 1년 이상인 분을 대상으로 하고 있어요. 관심 가져 주셔서 감사합니다."
      : "동의하지 않으셔서 설문을 마칩니다. 관심 가져 주셔서 감사합니다.";
    app.innerHTML =
      '<section class="page">' +
      '<div class="end-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
      "<h1>" + title + "</h1><p class=\"lead\">" + body + "</p>" +
      '<p class="lead submit-state"></p>' +
      '<p class="code-box">응답 번호 ' + esc(state.pid) + "</p>" +
      "</section>";
    showSubmitState();
  }

  // ── 문항 HTML ────────────────────────────────────────
  function questionHTML(q, num) {
    var id = "q_" + q.key;
    var val = state.answers[q.key];
    var h = '<div class="q" role="group" id="' + id + '" aria-labelledby="' + id + '_t">' +
      '<div class="q-title" id="' + id + '_t">' + (num ? '<span class="q-num">' + num + ".</span>" : "") +
      "<span>" + esc(q.text) + (q.optional ? ' <span class="q-optional">(선택)</span>' : "") + "</span></div>";
    if (q.type === "likert") {
      h += '<div class="likert" style="--n:' + q.points + '">';
      for (var i = 1; i <= q.points; i++) {
        h += '<label><input type="radio" name="' + esc(q.key) + '" value="' + i + '"' + (String(val) === String(i) ? " checked" : "") +
          ' aria-label="' + i + (i === 1 ? " " + q.ends[0] : i === q.points ? " " + q.ends[1] : "") + '"><span>' + i + "</span></label>";
      }
      h += '</div><div class="likert-ends" aria-hidden="true"><span>' + esc(q.ends[0]) + "</span><span>" + esc(q.ends[1]) + "</span></div>";
    } else if (q.type === "radio" || q.type === "checkbox") {
      var isCheck = q.type === "checkbox";
      h += '<div class="choices">';
      q.options.forEach(function (o) {
        var on = isCheck ? (Array.isArray(val) && val.indexOf(o) !== -1) : val === o;
        h += '<label class="choice' + (isCheck ? " is-check" : "") + '"><input type="' + q.type + '" name="' + esc(q.key) + '" value="' + esc(o) + '"' + (on ? " checked" : "") + '><span class="mark"></span><span>' + esc(o) + "</span></label>";
      });
      h += "</div>";
    } else if (q.type === "text") {
      h += '<textarea name="' + esc(q.key) + '" maxlength="2000" aria-label="자유 의견">' + esc(val || "") + "</textarea>";
    }
    h += '<p class="q-hint">이 질문에 응답해 주세요.</p></div>';
    return h;
  }

  function bindInputs() {
    app.querySelectorAll("input, textarea").forEach(function (el) {
      el.addEventListener("change", onInput);
      if (el.tagName === "TEXTAREA") el.addEventListener("input", onInput);
    });
  }

  function onInput(e) {
    var el = e.target, key = el.name;
    if (el.type === "checkbox") {
      var q = findItem(key);
      var boxes = app.querySelectorAll('input[name="' + cssEsc(key) + '"]');
      if (q && q.exclusive && el.checked) {
        boxes.forEach(function (b) {
          if (el.value === q.exclusive ? b !== el : b.value === q.exclusive) b.checked = false;
        });
      }
      state.answers[key] = Array.prototype.filter.call(boxes, function (b) { return b.checked; }).map(function (b) { return b.value; });
    } else if (el.type === "radio") {
      state.answers[key] = /^\d+$/.test(el.value) && el.closest(".likert") ? Number(el.value) : el.value;
    } else {
      state.answers[key] = el.value;
    }
    var fs = el.closest(".q");
    if (fs) fs.classList.remove("missing");
    save();
  }

  function findItem(key) {
    var all = [].concat(C.demographics.map(function (q) { return Object.assign({}, q, { key: "demo_" + q.key }); }));
    for (var i = 0; i < all.length; i++) if (all[i].key === key) return all[i];
    return null;
  }

  function validate(items) {
    var first = null;
    items.forEach(function (q) {
      if (q.optional) return;
      var v = state.answers[q.key];
      var ok = Array.isArray(v) ? v.length > 0 : v !== undefined && v !== "";
      var fs = document.getElementById("q_" + q.key);
      if (fs) fs.classList.toggle("missing", !ok);
      if (!ok && !first) first = fs;
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

  // ── 제출 ─────────────────────────────────────────────
  function finish(status) {
    state.status = status;
    state.finished = true;
    state.finishedAt = new Date().toISOString();
    state.submit = { state: "pending" };
    save();
    state.page = pages.length - 1;
    render();
    window.scrollTo(0, 0);
    submit();
  }

  function buildPayload() {
    var a = state.answers;
    var row = {
      pid: state.pid,
      status: state.status,
      started_at: state.startedAt,
      finished_at: state.finishedAt,
      duration_sec: Math.round((new Date(state.finishedAt) - new Date(state.startedAt)) / 1000),
      scene_order: state.order.join(" > "),
      source: state.src,
      user_agent: navigator.userAgent,
      screen: window.screen.width + "x" + window.screen.height,
      viewport: window.innerWidth + "x" + window.innerHeight
    };
    Object.keys(a).forEach(function (k) {
      row[k] = Array.isArray(a[k]) ? a[k].join(" | ") : a[k];
    });
    // GAAIS-K 하위척도 평균
    var pos = [], neg = [];
    C.gaais.forEach(function (g) {
      var v = a["gaais_" + g.n];
      if (typeof v === "number") (g.sub === "pos" ? pos : neg).push(v);
    });
    if (pos.length) row.gaais_pos_mean = round2(mean(pos));
    if (neg.length) row.gaais_neg_mean = round2(mean(neg));

    // 장면별 긴 형식 (분석용)
    var long = [];
    state.order.forEach(function (id, i) {
      var s = sceneById[id], rec = state.scene[id] || {};
      if (!rec.watched && a[id + "_appropriate"] === undefined) return;
      var r = { pid: state.pid, scene_id: id, position: i + 1, load: s.load, info: s.info, message: s.message,
        plays: rec.plays || 0, time_on_scene_sec: Math.round((rec.ms || 0) / 1000) };
      C.sceneItems.forEach(function (q) { r[q.key] = a[id + "_" + q.key]; });
      if (s.attentionCheck) {
        r.attention = a[id + "_attention"];
        r.attention_correct = r.attention === C.attentionAnswer[s.load] ? 1 : 0;
        row[id + "_attention_correct"] = r.attention_correct;
      }
      row[id + "_position"] = i + 1;
      row[id + "_plays"] = r.plays;
      row[id + "_time_sec"] = r.time_on_scene_sec;
      long.push(r);
    });
    return { wide: row, long: long };
  }

  function submit() {
    var payload = buildPayload();
    safeStore.set("aidv-survey-backup-" + state.pid, payload);
    if (!C.ENDPOINT) {
      state.submit = { state: "no-endpoint" }; save(); showSubmitState(); return;
    }
    fetch(C.ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      keepalive: true
    }).then(function () {
      state.submit = { state: "sent" }; save(); showSubmitState();
    }).catch(function () {
      state.submit = { state: "failed" }; save(); showSubmitState();
    });
  }

  function showSubmitState() {
    var el = app.querySelector(".submit-state");
    if (!el || !state.submit) return;
    var s = state.submit.state;
    if (s === "pending") el.textContent = "응답을 저장하는 중이에요. 잠시만 기다려 주세요.";
    else if (s === "sent") el.textContent = "";
    else if (s === "failed") {
      el.innerHTML = "응답을 저장하지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요. " +
        '<button class="btn" data-retry style="margin-top:14px">다시 제출하기</button>';
      el.querySelector("[data-retry]").onclick = function () { state.submit = { state: "pending" }; showSubmitState(); submit(); };
    } else if (s === "no-endpoint") {
      el.innerHTML = "테스트 모드: 저장 주소(ENDPOINT)가 아직 설정되지 않아 응답이 이 브라우저에만 저장됐어요. " +
        '<button class="btn" data-dl style="margin-top:14px">응답 파일 내려받기</button>';
      el.querySelector("[data-dl]").onclick = function () {
        var blob = new Blob([JSON.stringify(buildPayload(), null, 2)], { type: "application/json" });
        var u = URL.createObjectURL(blob), link = document.createElement("a");
        link.href = u; link.download = "response_" + state.pid + ".json"; link.click();
        setTimeout(function () { URL.revokeObjectURL(u); }, 1000);
      };
    }
  }

  // ── 실험 안내 그림 (차량 화면 위치) ─────────────────
  function dashSVG() {
    return '<svg viewBox="0 0 640 300" role="img" aria-label="차량 실내에서 HUD, 클러스터, 센터 디스플레이의 위치">' +
      '<path d="M40 20 Q320 -6 600 20 L560 150 Q320 132 80 150 Z" fill="#1E2A40"/>' +
      '<rect x="180" y="96" width="120" height="30" rx="6" fill="none" stroke="#A08BFF" stroke-width="2" stroke-dasharray="5 4"/>' +
      '<text x="240" y="116" fill="#CFC4FF" font-size="15" text-anchor="middle" font-weight="700">HUD</text>' +
      '<path d="M0 170 Q320 140 640 170 L640 300 L0 300 Z" fill="#141E30"/>' +
      '<rect x="168" y="160" width="144" height="40" rx="8" fill="#26334A" stroke="#A08BFF" stroke-width="2"/>' +
      '<text x="240" y="186" fill="#E8ECF3" font-size="15" text-anchor="middle" font-weight="700">클러스터</text>' +
      '<rect x="356" y="166" width="190" height="104" rx="12" fill="#26334A" stroke="#A08BFF" stroke-width="2"/>' +
      '<text x="451" y="224" fill="#E8ECF3" font-size="15" text-anchor="middle" font-weight="700">센터 디스플레이</text>' +
      '<circle cx="240" cy="270" r="74" fill="none" stroke="#3A4762" stroke-width="16"/>' +
      "</svg>";
  }

  // ── 도우미 ───────────────────────────────────────────
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : s; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function mean(a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; }
  function round2(x) { return Math.round(x * 100) / 100; }
  function makeId() {
    var t = new Date(), pad = function (n) { return String(n).padStart(2, "0"); };
    var rnd = (window.crypto && crypto.getRandomValues) ? Array.from(crypto.getRandomValues(new Uint8Array(3))).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("") : Math.random().toString(16).slice(2, 8);
    return "P" + String(t.getFullYear()).slice(2) + pad(t.getMonth() + 1) + pad(t.getDate()) + "-" + rnd.toUpperCase();
  }

  render();
})();

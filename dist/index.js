import { reconcileTrees as C, commitRoot as w, summarizeCommitOperations as x, formatFiberPath as D } from "./fiber.js";
import { ChildDeletion as X, NoFlags as Y, Placement as G, Update as Z, getFlagNames as tt } from "./fiber.js";
import { parseHtmlToVNode as L, mountVNode as p, domNodeToVNodeTree as b, cloneVNode as d, serializeVNodeToHtml as h, createRootVNode as $, countVNodeStats as T } from "./vdom.js";
import { domNodeToVNode as at, getVNodeKey as ot, removeDomAttribute as st, renderVNode as rt, setDomAttribute as it } from "./vdom.js";
const P = `
<section class="demo-card" data-key="dashboard">
  <header class="hero-block">
    <p class="eyebrow">Virtual DOM Playground</p>
    <h2>수요 코딩회 데모 보드</h2>
    <p class="lede">
      DOM을 읽어 Virtual DOM으로 바꾸고, 이전 상태와 비교해 변경된 노드만 실제 DOM에 반영합니다.
    </p>
  </header>

  <div class="content-grid">
    <article class="insight-card" data-key="insight">
      <h3>핵심 관찰</h3>
      <ul class="feature-list">
        <li data-key="observe">MutationObserver로 실제 DOM 변화를 추적합니다.</li>
        <li data-key="diff">Diff 알고리즘은 최소 변경만 계산합니다.</li>
        <li data-key="history">State History로 Undo/Redo를 지원합니다.</li>
      </ul>
    </article>

    <aside class="stat-panel" data-key="stats">
      <h3>빠른 실험</h3>
      <div class="stat-chip-row">
        <span class="sample-chip">data-key 순서 변경</span>
        <span class="sample-chip">텍스트 수정</span>
        <span class="sample-chip">속성 추가/삭제</span>
      </div>
      <label class="field">
        <span>샘플 입력</span>
        <input type="text" value="ready" />
      </label>
    </aside>
  </div>

  <footer class="demo-footer">
    <button type="button" class="ghost-action">Sample Button</button>
    <small>리스트 순서를 바꾸거나 새로운 태그를 추가해 Patch를 눌러보세요.</small>
  </footer>
</section>
`, O = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit"
});
function M(t) {
  return O.format(t);
}
function n(t) {
  return String(t).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
function H(t) {
  switch (t.opType) {
    case "INSERT_CHILD":
      return `index ${t.index} 위치에 새 노드를 삽입합니다.`;
    case "MOVE_CHILD":
      return `key "${t.key}" 노드를 index ${t.toIndex} 위치로 이동합니다.`;
    case "REMOVE_CHILD":
      return `index ${t.index} 자식 노드를 제거합니다.`;
    case "UPDATE_PROPS": {
      const e = Object.keys(t.payload.set || {}), a = t.payload.remove || [];
      return `props 변경: set ${e.join(", ") || "-"} / remove ${a.join(", ") || "-"}`;
    }
    case "UPDATE_TEXT":
      return `텍스트를 "${t.value}" 로 갱신합니다.`;
    default:
      return "설명할 수 없는 effect입니다.";
  }
}
function q(t) {
  return t.type === "attributes" ? `${t.attributeName} 속성이 변경되었습니다.` : t.type === "characterData" ? "텍스트 노드가 수정되었습니다." : `자식 노드 ${t.addedNodes.length}개 추가, ${t.removedNodes.length}개 제거`;
}
function N(t) {
  if (t.type === "root")
    return "root";
  if (t.type === "text")
    return `"${t.value.replace(/\s+/g, " ").trim() || "(whitespace)"}"`;
  const e = Object.entries(t.attrs || {}).slice(0, 3).map(([a, o]) => o === "" ? a : `${a}="${o}"`).join(" ");
  return e ? `<${t.tag} ${e}>` : `<${t.tag}>`;
}
const y = 250;
function F({ refs: t, state: e, render: a }) {
  let o = null;
  t.editor.addEventListener("input", () => {
    try {
      const s = L(t.editor.value);
      e.workingTree = s, e.parseError = "", p(t.testPreview, s), e.statusMessage = e.autoCommitEnabled ? "테스트 영역 미리보기를 동기화했고 자동 commit을 대기 중입니다." : "테스트 영역 미리보기를 최신 HTML로 동기화했습니다.";
    } catch (s) {
      e.parseError = s instanceof Error ? s.message : "HTML 파싱 실패";
    }
    o && (clearTimeout(o), o = null), e.autoCommitEnabled && !e.parseError && (o = window.setTimeout(() => {
      m({ refs: t, state: e, render: a, source: "auto" });
    }, y)), a();
  }), t.testPreview.addEventListener("input", (s) => {
    k(s.target) && S({ refs: t, state: e, render: a, autoCommitTimerRef: () => o, setAutoCommitTimer: (r) => {
      o = r;
    } });
  }), t.testPreview.addEventListener("change", (s) => {
    k(s.target) && S({ refs: t, state: e, render: a, autoCommitTimerRef: () => o, setAutoCommitTimer: (r) => {
      o = r;
    } });
  }), t.patchButton.addEventListener("click", () => {
    o && (clearTimeout(o), o = null), m({ refs: t, state: e, render: a, source: "manual" });
  }), t.autoCommitToggle.addEventListener("change", () => {
    e.autoCommitEnabled = t.autoCommitToggle.checked, e.statusMessage = e.autoCommitEnabled ? "실시간 commit 모드를 활성화했습니다." : "실시간 commit 모드를 비활성화했습니다.", o && (clearTimeout(o), o = null), e.autoCommitEnabled && !e.parseError && (o = window.setTimeout(() => {
      m({ refs: t, state: e, render: a, source: "auto" });
    }, y)), a();
  }), t.undoButton.addEventListener("click", () => {
    v(e.historyIndex - 1, { refs: t, state: e, render: a });
  }), t.redoButton.addEventListener("click", () => {
    v(e.historyIndex + 1, { refs: t, state: e, render: a });
  }), t.historyList.addEventListener("click", (s) => {
    const r = s.target.closest("[data-history-index]");
    r && v(Number(r.dataset.historyIndex), { refs: t, state: e, render: a });
  });
}
function m({ refs: t, state: e, render: a, source: o }) {
  const s = e.history[e.historyIndex];
  if (!s || e.parseError)
    return;
  const r = d(b(t.testPreview)), i = C(s, r);
  if (e.lastCommitEffects = i.effects, e.workingTree = d(r), o === "manual" && (t.editor.value = h(r)), !i.effects.length) {
    e.statusMessage = o === "auto" ? "자동 commit을 확인했지만 반영할 변경점이 없습니다." : "변경점이 없어 commit 단계를 생략했습니다.", a();
    return;
  }
  w(t.actual, i.rootFiber);
  const l = e.history.slice(0, e.historyIndex + 1), c = e.historyMeta.slice(0, e.historyIndex + 1);
  l.push(d(r)), c.push({
    label: `${o === "auto" ? "Auto Commit" : "Commit"} #${l.length - 1}`,
    effectCount: i.effects.length,
    timestamp: Date.now()
  }), e.history = l, e.historyMeta = c, e.historyIndex = l.length - 1, e.statusMessage = o === "auto" ? `${i.effects.length}개의 effect를 자동 commit 했습니다.` : `${i.effects.length}개의 effect를 commit 했습니다.`, a();
}
function S({ refs: t, state: e, render: a, autoCommitTimerRef: o, setAutoCommitTimer: s }) {
  const r = d(b(t.testPreview));
  e.workingTree = r, e.parseError = "", t.editor.value = h(r), e.statusMessage = e.autoCommitEnabled ? "테스트 영역 입력을 동기화했고 자동 commit을 대기 중입니다." : "테스트 영역 입력을 샘플 HTML 코드와 동기화했습니다.";
  const i = o();
  if (i && (clearTimeout(i), s(null)), e.autoCommitEnabled) {
    const l = window.setTimeout(() => {
      m({ refs: t, state: e, render: a, source: "auto" });
    }, y);
    s(l);
  }
  a();
}
function k(t) {
  return t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement;
}
function I({ refs: t, state: e }) {
  t.actual.innerHTML = P;
  const a = b(t.actual), o = d(a);
  p(t.actual, a), p(t.testPreview, a), t.editor.value = h(a), e.history = [o], e.historyMeta = [{
    label: "Initial DOM",
    effectCount: 0,
    timestamp: Date.now()
  }], e.historyIndex = 0, e.workingTree = d(a), e.parseError = "", e.statusMessage = "브라우저 DOM을 읽어 첫 번째 Virtual DOM과 Fiber 기준선을 만들었습니다.";
}
function A({ refs: t, state: e, render: a }) {
  new MutationObserver((s) => {
    const r = s.map((i) => ({
      id: `${i.type}-${i.target.nodeName}-${Math.random().toString(16).slice(2)}`,
      time: Date.now(),
      text: q(i)
    }));
    r.length && (e.mutationFeed = [...r.reverse(), ...e.mutationFeed].slice(0, 14), a());
  }).observe(t.actual, {
    subtree: !0,
    childList: !0,
    attributes: !0,
    characterData: !0
  });
}
function v(t, { refs: e, state: a, render: o }) {
  if (t < 0 || t >= a.history.length)
    return;
  const s = d(a.history[t]);
  p(e.actual, s), p(e.testPreview, s), a.historyIndex = t, a.workingTree = s, a.parseError = "", a.lastCommitEffects = [], e.editor.value = h(s), a.statusMessage = `히스토리 #${t} 상태로 이동했습니다.`, o();
}
function V() {
  return {
    history: [],
    historyMeta: [],
    historyIndex: 0,
    workingTree: $([]),
    parseError: "",
    autoCommitEnabled: !1,
    lastCommitEffects: [],
    mutationFeed: [],
    statusMessage: "실제 DOM을 초기화하고 있습니다."
  };
}
function j(t, e) {
  const a = e.history[e.historyIndex] || $([]), o = e.parseError ? { effects: [] } : C(a, e.workingTree), s = o.effects.length ? o.effects : e.lastCommitEffects, r = o.effects.length ? "대기 중 Fiber Work" : "마지막 Commit 기록", i = T(a), l = T(e.workingTree), c = x(o.effects);
  t.patchButton.disabled = !e.history.length || !!e.parseError, t.autoCommitToggle.checked = e.autoCommitEnabled, t.undoButton.disabled = e.historyIndex === 0, t.redoButton.disabled = e.historyIndex === e.history.length - 1, t.editor.classList.toggle("has-error", !!e.parseError), t.status.textContent = e.parseError || e.statusMessage, t.actualStats.innerHTML = `
    <span>${i.totalNodes} nodes</span>
    <span>${i.maxDepth} depth</span>
    <span>${e.historyIndex + 1}/${e.history.length || 1} history</span>
  `, t.testStats.innerHTML = `
    <span>${l.totalNodes} nodes</span>
    <span>${o.effects.length} pending effects</span>
    <span>${e.parseError ? "parse error" : "preview synced"}</span>
  `, t.pendingStats.textContent = o.effects.length, t.effectMode.textContent = r, t.effectJsonMeta.textContent = `${s.length} effect objects`, t.insertStat.textContent = c.insert, t.removeStat.textContent = c.remove, t.moveStat.textContent = c.move, t.attrStat.textContent = c.attribute, t.textStat.textContent = c.text, t.effectCards.innerHTML = s.length ? s.map(R).join("") : E("Fiber queue", "현재 표시할 effect가 없습니다."), t.effectJson.textContent = JSON.stringify(s, null, 2), t.committedTree.innerHTML = f(a, 0), t.workingTree.innerHTML = f(e.workingTree, 0), t.historyList.innerHTML = e.historyMeta.map((u, g) => `
      <button type="button" class="${g === e.historyIndex ? "history-item is-active" : "history-item"}" data-history-index="${g}">
        <strong>#${g}</strong>
        <span>${n(u.label)}</span>
        <small>${u.effectCount} effects · ${M(u.timestamp)}</small>
      </button>
    `).join(""), t.mutationFeed.innerHTML = e.mutationFeed.length ? e.mutationFeed.map((u) => `
        <div class="mutation-item">
          <strong>${M(u.time)}</strong>
          <span>${n(u.text)}</span>
        </div>
      `).join("") : E("Mutation log", "Commit 또는 History 이동 후 실제 DOM 변경 기록이 여기에 쌓입니다.");
}
function R(t) {
  return `
    <article class="patch-item">
      <div class="patch-head">
        <span class="patch-type">${n(t.opType)}</span>
        <span class="patch-path">${n(D(t.path || t.parentPath || []))}</span>
      </div>
      <p>${n(H(t))}</p>
      <div class="flag-chip-row">
        ${t.flagNames.map((e) => `<span class="flag-chip">${n(e)}</span>`).join("")}
      </div>
    </article>
  `;
}
function f(t, e) {
  var r;
  const a = N(t);
  if (!((r = t.children) != null && r.length))
    return `
      <div class="tree-leaf">
        <span class="tree-token is-${t.type}">${n(a)}</span>
      </div>
    `;
  const o = e < 2 ? "open" : "", s = t.children.map((i) => f(i, e + 1)).join("");
  return `
    <details class="tree-node" ${o}>
      <summary>
        <span class="tree-token is-${t.type}">${n(a)}</span>
        <span class="tree-count">${t.children.length} children</span>
      </summary>
      <div class="tree-children">${s}</div>
    </details>
  `;
}
function E(t, e) {
  return `
    <div class="empty-state">
      <strong>${n(t)}</strong>
      <p>${n(e)}</p>
    </div>
  `;
}
function B() {
  return `
    <main class="app-shell">
      <section class="hero-section">
        <div>
          <p class="eyebrow-badge">Vanilla JS Shell + Fiber Commit Engine</p>
          <h1>Virtual DOM Diff Lab</h1>
          <p class="hero-copy">
            브라우저 DOM을 읽어 Virtual DOM으로 바꾸고, Fiber flags를 붙인 뒤 commit 단계에서 필요한 DOM 연산만 수행합니다.
          </p>
        </div>

        <div class="hero-meta">
          <span>Flags: Placement / Update / ChildDeletion</span>
          <span>Commit phase only mutates the real DOM</span>
          <span>Undo / Redo History</span>
        </div>
      </section>

      <section class="control-bar">
        <div class="button-row">
          <button type="button" class="primary-button" data-role="patch-button">Commit Patch</button>
          <label class="toggle-pill">
            <input type="checkbox" data-role="auto-commit-toggle" />
            <span>실시간 반영</span>
          </label>
          <button type="button" class="secondary-button" data-role="undo-button">뒤로가기</button>
          <button type="button" class="secondary-button" data-role="redo-button">앞으로가기</button>
        </div>

        <div class="status-pill">
          <strong>Status</strong>
          <span data-role="status-text"></span>
        </div>
      </section>

      <section class="stage-grid">
        <article class="panel surface-panel">
          <header class="panel-head">
            <div>
              <p class="panel-kicker">실제 영역</p>
              <h2>Actual DOM</h2>
            </div>
            <div class="mini-chip-row" data-role="actual-stats"></div>
          </header>
          <div class="dom-canvas">
            <div class="dom-canvas-body" data-role="actual-dom"></div>
          </div>
        </article>

        <article class="panel surface-panel">
          <header class="panel-head">
            <div>
              <p class="panel-kicker">테스트 영역</p>
              <h2>Editor + Preview</h2>
            </div>
            <div class="mini-chip-row" data-role="test-stats"></div>
          </header>
          <div class="test-stack">
            <div class="dom-canvas is-test">
              <div class="dom-canvas-body" data-role="test-preview"></div>
            </div>
            <label class="editor-shell">
              <span>샘플 HTML 코드</span>
              <textarea spellcheck="false" data-role="html-editor"></textarea>
            </label>
          </div>
        </article>
      </section>

      <section class="stats-grid">
        <article class="stat-card"><span>Pending Insert</span><strong data-role="stat-insert">0</strong></article>
        <article class="stat-card"><span>Pending Remove</span><strong data-role="stat-remove">0</strong></article>
        <article class="stat-card"><span>Pending Move</span><strong data-role="stat-move">0</strong></article>
        <article class="stat-card"><span>Fiber Queue</span><strong data-role="pending-stats">0</strong></article>
        <article class="stat-card"><span>Pending Attr</span><strong data-role="stat-attr">0</strong></article>
        <article class="stat-card"><span>Pending Text</span><strong data-role="stat-text">0</strong></article>
      </section>

      <section class="inspector-grid">
        <article class="panel">
          <header class="panel-head">
            <div>
              <p class="panel-kicker">Fiber Effects</p>
              <h2 data-role="effect-mode"></h2>
            </div>
          </header>
          <div class="patch-list" data-role="effect-cards"></div>
        </article>

        <article class="panel">
          <header class="panel-head">
            <div>
              <p class="panel-kicker">Effect JSON</p>
              <h2>Commit Queue</h2>
            </div>
            <div class="json-meta">
              <strong>Raw effects</strong>
              <span data-role="effect-json-meta"></span>
            </div>
          </header>
          <pre class="json-code"><code data-role="effect-json"></code></pre>
        </article>

        <article class="panel">
          <header class="panel-head">
            <div>
              <p class="panel-kicker">Virtual DOM</p>
              <h2>Committed Tree</h2>
            </div>
          </header>
          <div class="tree-shell" data-role="committed-tree"></div>
        </article>

        <article class="panel">
          <header class="panel-head">
            <div>
              <p class="panel-kicker">Virtual DOM</p>
              <h2>Working Tree</h2>
            </div>
          </header>
          <div class="tree-shell" data-role="working-tree"></div>
        </article>

        <article class="panel">
          <header class="panel-head">
            <div>
              <p class="panel-kicker">History</p>
              <h2>Snapshots</h2>
            </div>
          </header>
          <div class="history-list" data-role="history-list"></div>
        </article>

        <article class="panel">
          <header class="panel-head">
            <div>
              <p class="panel-kicker">Browser API</p>
              <h2>MutationObserver Feed</h2>
            </div>
          </header>
          <div class="mutation-feed" data-role="mutation-feed"></div>
        </article>
      </section>
    </main>
  `;
}
function _(t) {
  return {
    actual: t.querySelector('[data-role="actual-dom"]'),
    testPreview: t.querySelector('[data-role="test-preview"]'),
    editor: t.querySelector('[data-role="html-editor"]'),
    patchButton: t.querySelector('[data-role="patch-button"]'),
    autoCommitToggle: t.querySelector('[data-role="auto-commit-toggle"]'),
    undoButton: t.querySelector('[data-role="undo-button"]'),
    redoButton: t.querySelector('[data-role="redo-button"]'),
    status: t.querySelector('[data-role="status-text"]'),
    actualStats: t.querySelector('[data-role="actual-stats"]'),
    testStats: t.querySelector('[data-role="test-stats"]'),
    pendingStats: t.querySelector('[data-role="pending-stats"]'),
    effectCards: t.querySelector('[data-role="effect-cards"]'),
    effectJson: t.querySelector('[data-role="effect-json"]'),
    effectMode: t.querySelector('[data-role="effect-mode"]'),
    effectJsonMeta: t.querySelector('[data-role="effect-json-meta"]'),
    committedTree: t.querySelector('[data-role="committed-tree"]'),
    workingTree: t.querySelector('[data-role="working-tree"]'),
    historyList: t.querySelector('[data-role="history-list"]'),
    mutationFeed: t.querySelector('[data-role="mutation-feed"]'),
    insertStat: t.querySelector('[data-role="stat-insert"]'),
    removeStat: t.querySelector('[data-role="stat-remove"]'),
    moveStat: t.querySelector('[data-role="stat-move"]'),
    attrStat: t.querySelector('[data-role="stat-attr"]'),
    textStat: t.querySelector('[data-role="stat-text"]')
  };
}
function z(t) {
  t.innerHTML = B();
  const e = _(t), a = V(), o = () => j(e, a);
  F({ refs: e, state: a, render: o }), I({ refs: e, state: a }), A({ refs: e, state: a, render: o }), o();
}
export {
  X as ChildDeletion,
  Y as NoFlags,
  G as Placement,
  Z as Update,
  d as cloneVNode,
  w as commitRoot,
  T as countVNodeStats,
  $ as createRootVNode,
  at as domNodeToVNode,
  b as domNodeToVNodeTree,
  D as formatFiberPath,
  tt as getFlagNames,
  ot as getVNodeKey,
  z as initApp,
  p as mountVNode,
  L as parseHtmlToVNode,
  C as reconcileTrees,
  st as removeDomAttribute,
  rt as renderVNode,
  h as serializeVNodeToHtml,
  it as setDomAttribute,
  x as summarizeCommitOperations
};

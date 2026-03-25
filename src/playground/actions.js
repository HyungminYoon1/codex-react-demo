import { SAMPLE_MARKUP } from '../lib/sampleMarkup.js';
import {
  commitRoot,
  reconcileTrees,
} from '../lib/fiber.js';
import {
  cloneVNode,
  domNodeToVNodeTree,
  mountVNode,
  parseHtmlToVNode,
  serializeVNodeToHtml,
} from '../lib/vdom.js';
import { describeMutation } from '../ui/formatters.js';

const AUTO_COMMIT_DELAY_MS = 250;

export function bindEvents({ refs, state, render }) {
  let autoCommitTimer = null;

  refs.editor.addEventListener('input', () => {
    try {
      const nextTree = parseHtmlToVNode(refs.editor.value);
      state.workingTree = nextTree;
      state.parseError = '';
      mountVNode(refs.testPreview, nextTree);
      state.statusMessage = state.autoCommitEnabled
        ? '테스트 영역 미리보기를 동기화했고 자동 commit을 대기 중입니다.'
        : '테스트 영역 미리보기를 최신 HTML로 동기화했습니다.';
    } catch (error) {
      state.parseError = error instanceof Error ? error.message : 'HTML 파싱 실패';
    }

    if (autoCommitTimer) {
      clearTimeout(autoCommitTimer);
      autoCommitTimer = null;
    }

    if (state.autoCommitEnabled && !state.parseError) {
      autoCommitTimer = window.setTimeout(() => {
        runCommit({ refs, state, render, source: 'auto' });
      }, AUTO_COMMIT_DELAY_MS);
    }

    render();
  });

  refs.testPreview.addEventListener('input', (event) => {
    if (!shouldSyncPreviewField(event.target)) {
      return;
    }

    syncFromPreview({ refs, state, render, autoCommitTimerRef: () => autoCommitTimer, setAutoCommitTimer: (value) => {
      autoCommitTimer = value;
    } });
  });

  refs.testPreview.addEventListener('change', (event) => {
    if (!shouldSyncPreviewField(event.target)) {
      return;
    }

    syncFromPreview({ refs, state, render, autoCommitTimerRef: () => autoCommitTimer, setAutoCommitTimer: (value) => {
      autoCommitTimer = value;
    } });
  });

  refs.patchButton.addEventListener('click', () => {
    if (autoCommitTimer) {
      clearTimeout(autoCommitTimer);
      autoCommitTimer = null;
    }

    runCommit({ refs, state, render, source: 'manual' });
  });

  refs.autoCommitToggle.addEventListener('change', () => {
    state.autoCommitEnabled = refs.autoCommitToggle.checked;
    state.statusMessage = state.autoCommitEnabled
      ? '실시간 commit 모드를 활성화했습니다.'
      : '실시간 commit 모드를 비활성화했습니다.';

    if (autoCommitTimer) {
      clearTimeout(autoCommitTimer);
      autoCommitTimer = null;
    }

    if (state.autoCommitEnabled && !state.parseError) {
      autoCommitTimer = window.setTimeout(() => {
        runCommit({ refs, state, render, source: 'auto' });
      }, AUTO_COMMIT_DELAY_MS);
    }

    render();
  });

  refs.undoButton.addEventListener('click', () => {
    jumpToHistory(state.historyIndex - 1, { refs, state, render });
  });

  refs.redoButton.addEventListener('click', () => {
    jumpToHistory(state.historyIndex + 1, { refs, state, render });
  });

  refs.historyList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-history-index]');

    if (!button) {
      return;
    }

    jumpToHistory(Number(button.dataset.historyIndex), { refs, state, render });
  });
}

function runCommit({ refs, state, render, source }) {
  const committedTree = state.history[state.historyIndex];

  if (!committedTree || state.parseError) {
    return;
  }

  const nextTree = cloneVNode(domNodeToVNodeTree(refs.testPreview));
  const workInProgress = reconcileTrees(committedTree, nextTree);

  state.lastCommitEffects = workInProgress.effects;
  state.workingTree = cloneVNode(nextTree);

  // 수동 commit일 때만 HTML을 정규화하고, 자동 commit 중에는 textarea 값을 덮어쓰지 않는다.
  if (source === 'manual') {
    refs.editor.value = serializeVNodeToHtml(nextTree);
  }

  if (!workInProgress.effects.length) {
    state.statusMessage = source === 'auto'
      ? '자동 commit을 확인했지만 반영할 변경점이 없습니다.'
      : '변경점이 없어 commit 단계를 생략했습니다.';
    render();
    return;
  }

  commitRoot(refs.actual, workInProgress.rootFiber);

  const truncatedHistory = state.history.slice(0, state.historyIndex + 1);
  const truncatedMeta = state.historyMeta.slice(0, state.historyIndex + 1);

  truncatedHistory.push(cloneVNode(nextTree));
  truncatedMeta.push({
    label: `${source === 'auto' ? 'Auto Commit' : 'Commit'} #${truncatedHistory.length - 1}`,
    effectCount: workInProgress.effects.length,
    timestamp: Date.now(),
  });

  state.history = truncatedHistory;
  state.historyMeta = truncatedMeta;
  state.historyIndex = truncatedHistory.length - 1;
  state.statusMessage = source === 'auto'
    ? `${workInProgress.effects.length}개의 effect를 자동 commit 했습니다.`
    : `${workInProgress.effects.length}개의 effect를 commit 했습니다.`;

  render();
}

function syncFromPreview({ refs, state, render, autoCommitTimerRef, setAutoCommitTimer }) {
  const nextTree = cloneVNode(domNodeToVNodeTree(refs.testPreview));

  state.workingTree = nextTree;
  state.parseError = '';
  refs.editor.value = serializeVNodeToHtml(nextTree);
  state.statusMessage = state.autoCommitEnabled
    ? '테스트 영역 입력을 동기화했고 자동 commit을 대기 중입니다.'
    : '테스트 영역 입력을 샘플 HTML 코드와 동기화했습니다.';

  const activeTimer = autoCommitTimerRef();

  if (activeTimer) {
    clearTimeout(activeTimer);
    setAutoCommitTimer(null);
  }

  if (state.autoCommitEnabled) {
    const nextTimer = window.setTimeout(() => {
      runCommit({ refs, state, render, source: 'auto' });
    }, AUTO_COMMIT_DELAY_MS);

    setAutoCommitTimer(nextTimer);
  }

  render();
}

function shouldSyncPreviewField(target) {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement;
}

export function mountInitialState({ refs, state }) {
  refs.actual.innerHTML = SAMPLE_MARKUP;
  const initialTree = domNodeToVNodeTree(refs.actual);
  const initialSnapshot = cloneVNode(initialTree);

  // 이후 fiber path가 실제 DOM 구조와 일치하도록 초기 actual DOM을 한 번 정규화한다.
  mountVNode(refs.actual, initialTree);
  mountVNode(refs.testPreview, initialTree);
  refs.editor.value = serializeVNodeToHtml(initialTree);

  state.history = [initialSnapshot];
  state.historyMeta = [{
    label: 'Initial DOM',
    effectCount: 0,
    timestamp: Date.now(),
  }];
  state.historyIndex = 0;
  state.workingTree = cloneVNode(initialTree);
  state.parseError = '';
  state.statusMessage = '브라우저 DOM을 읽어 첫 번째 Virtual DOM과 Fiber 기준선을 만들었습니다.';
}

export function attachMutationFeed({ refs, state, render }) {
  const observer = new MutationObserver((records) => {
    const entries = records.map((record) => ({
      id: `${record.type}-${record.target.nodeName}-${Math.random().toString(16).slice(2)}`,
      time: Date.now(),
      text: describeMutation(record),
    }));

    if (!entries.length) {
      return;
    }

    state.mutationFeed = [...entries.reverse(), ...state.mutationFeed].slice(0, 14);
    render();
  });

  observer.observe(refs.actual, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
  });
}

function jumpToHistory(nextIndex, { refs, state, render }) {
  if (nextIndex < 0 || nextIndex >= state.history.length) {
    return;
  }

  const snapshot = cloneVNode(state.history[nextIndex]);
  mountVNode(refs.actual, snapshot);
  mountVNode(refs.testPreview, snapshot);

  state.historyIndex = nextIndex;
  state.workingTree = snapshot;
  state.parseError = '';
  state.lastCommitEffects = [];
  refs.editor.value = serializeVNodeToHtml(snapshot);
  state.statusMessage = `히스토리 #${nextIndex} 상태로 이동했습니다.`;

  render();
}

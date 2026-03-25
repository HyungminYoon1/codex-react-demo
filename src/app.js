import { bindEvents, attachMutationFeed, mountInitialState } from './playground/actions.js';
import { createAppState } from './playground/state.js';
import { renderPanels } from './ui/renderPanels.js';
import { getAppShell, getRefs } from './ui/shell.js';

export function initApp(container) {
  container.innerHTML = getAppShell();

  const refs = getRefs(container);
  const state = createAppState();
  const render = () => renderPanels(refs, state);

  bindEvents({ refs, state, render });
  mountInitialState({ refs, state });
  attachMutationFeed({ refs, state, render });
  render();
}

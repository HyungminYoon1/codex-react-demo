import { createRootVNode } from '../lib/vdom.js';

export function createAppState() {
  return {
    history: [],
    historyMeta: [],
    historyIndex: 0,
    workingTree: createRootVNode([]),
    parseError: '',
    autoCommitEnabled: false,
    lastCommitEffects: [],
    mutationFeed: [],
    statusMessage: '실제 DOM을 초기화하고 있습니다.',
  };
}

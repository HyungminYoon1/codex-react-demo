const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export function formatTime(timestamp) {
  return timeFormatter.format(timestamp);
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function describeEffect(effect) {
  switch (effect.opType) {
    case 'INSERT_CHILD':
      return `index ${effect.index} 위치에 새 노드를 삽입합니다.`;
    case 'MOVE_CHILD':
      return `key "${effect.key}" 노드를 index ${effect.toIndex} 위치로 이동합니다.`;
    case 'REMOVE_CHILD':
      return `index ${effect.index} 자식 노드를 제거합니다.`;
    case 'UPDATE_PROPS': {
      const setKeys = Object.keys(effect.payload.set || {});
      const removeKeys = effect.payload.remove || [];
      return `props 변경: set ${setKeys.join(', ') || '-'} / remove ${removeKeys.join(', ') || '-'}`;
    }
    case 'UPDATE_TEXT':
      return `텍스트를 "${effect.value}" 로 갱신합니다.`;
    default:
      return '설명할 수 없는 effect입니다.';
  }
}

export function describeMutation(record) {
  if (record.type === 'attributes') {
    return `${record.attributeName} 속성이 변경되었습니다.`;
  }

  if (record.type === 'characterData') {
    return '텍스트 노드가 수정되었습니다.';
  }

  return `자식 노드 ${record.addedNodes.length}개 추가, ${record.removedNodes.length}개 제거`;
}

export function getTreeLabel(node) {
  if (node.type === 'root') {
    return 'root';
  }

  if (node.type === 'text') {
    const normalized = node.value.replace(/\s+/g, ' ').trim();
    return `"${normalized || '(whitespace)'}"`;
  }

  const attrs = Object.entries(node.attrs || {})
    .slice(0, 3)
    .map(([name, value]) => (value === '' ? name : `${name}="${value}"`))
    .join(' ');

  return attrs ? `<${node.tag} ${attrs}>` : `<${node.tag}>`;
}

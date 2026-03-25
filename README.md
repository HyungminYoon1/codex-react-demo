# Virtual DOM Diff Lab

브라우저 DOM을 Virtual DOM으로 정규화하고, 이전 트리와 비교해 Fiber effect 큐를 만든 뒤 commit 단계에서 필요한 DOM 연산만 적용하는 작은 JavaScript 라이브러리입니다.

이 저장소는 두 가지 용도를 함께 가집니다.

- 라이브러리 패키지: 다른 프로젝트에서 import 해서 사용
- 데모 앱: 동작을 시각적으로 확인하는 playground

자세한 사용 문서는 [USAGE.md](/Users/hong-yoonki/Desktop/krafton/vscode/codexproj/week4_react/react_codex_test/USAGE.md) 에 정리되어 있습니다.

## 설치

```bash
npm install virtual-dom-diff-lab
```

로컬 저장소 기준 개발:

```bash
npm install
```

## 빌드와 실행

라이브러리 빌드:

```bash
npm run build
```

데모 앱 개발 서버:

```bash
npm run dev
```

데모 앱 정적 빌드:

```bash
npm run build:demo
```

테스트:

```bash
npm run test
```

## 공개 엔트리

패키지는 아래 엔트리를 제공합니다.

- `virtual-dom-diff-lab`
- `virtual-dom-diff-lab/vdom`
- `virtual-dom-diff-lab/fiber`

루트 엔트리는 `initApp`, VDOM 유틸리티, Fiber API를 모두 다시 export 합니다.

## 빠른 사용 예시

```js
import {
  commitRoot,
  mountVNode,
  parseHtmlToVNode,
  reconcileTrees,
  serializeVNodeToHtml,
} from 'virtual-dom-diff-lab';

const container = document.querySelector('#preview');

const previousTree = parseHtmlToVNode(`
  <div class="before">
    <p>old text</p>
  </div>
`);

const nextTree = parseHtmlToVNode(`
  <div class="after" data-state="ready">
    <p>new text</p>
    <span>added</span>
  </div>
`);

mountVNode(container, previousTree);

const work = reconcileTrees(previousTree, nextTree);
commitRoot(container, work.rootFiber);

console.log(work.effects);
console.log(serializeVNodeToHtml(nextTree));
```

## API

### App

`initApp(container)`

- playground UI를 `container`에 마운트합니다.
- 데모 앱 용도입니다.

### VDOM

`createRootVNode(children)`

- 루트 VDOM 노드를 만듭니다.

`cloneVNode(node)`

- VDOM 노드를 깊은 복사합니다.

`parseHtmlToVNode(html, doc?)`

- HTML 문자열을 root VDOM으로 파싱합니다.

`domNodeToVNode(node)`

- 단일 DOM 노드를 VDOM 노드로 변환합니다.

`domNodeToVNodeTree(container)`

- 컨테이너의 자식 DOM 전체를 root VDOM으로 변환합니다.

`getVNodeKey(node)`

- `data-key` 또는 `id` 기반 key를 반환합니다.

`renderVNode(node, doc?)`

- VDOM 노드를 실제 DOM `Node`로 렌더링합니다.

`mountVNode(container, node)`

- 컨테이너 내용을 VDOM 기준 DOM으로 교체합니다.

`setDomAttribute(element, name, value)`

- DOM 속성을 안전하게 반영합니다.

`removeDomAttribute(element, name)`

- DOM 속성을 제거합니다.

`serializeVNodeToHtml(node)`

- VDOM을 HTML 문자열로 직렬화합니다.

`countVNodeStats(tree)`

- 노드 수, 최대 깊이, keyed element 수를 집계합니다.

### Fiber

`reconcileTrees(previousTree, nextTree)`

- 두 VDOM 트리를 비교해 work-in-progress fiber와 effect 큐를 생성합니다.
- 반환값: `{ rootFiber, effects }`

`commitRoot(container, rootFiber)`

- `reconcileTrees` 결과의 effect 큐를 실제 DOM에 반영합니다.

`summarizeCommitOperations(effects)`

- effect 큐를 삽입/이동/삭제/속성 변경/텍스트 변경 개수로 집계합니다.

`formatFiberPath(path)`

- fiber path 배열을 `root > 0 > 1` 형식 문자열로 바꿉니다.

`Placement`

- 삽입 또는 이동이 필요한 fiber flag입니다.

`Update`

- 텍스트나 속성 갱신이 필요한 fiber flag입니다.

`ChildDeletion`

- 자식 삭제가 필요한 fiber flag입니다.

`NoFlags`

- 작업이 없는 fiber flag입니다.

`getFlagNames(flags)`

- flag 비트마스크를 사람이 읽기 쉬운 이름 배열로 변환합니다.

## 사용 패턴

일반적인 흐름은 아래 순서입니다.

1. 현재 상태를 `parseHtmlToVNode` 또는 `domNodeToVNodeTree`로 VDOM으로 만든다.
2. 다음 상태를 새 VDOM으로 만든다.
3. `reconcileTrees(previousTree, nextTree)`를 호출한다.
4. 필요하면 `work.effects`를 검사한다.
5. `commitRoot(container, work.rootFiber)`로 실제 DOM에 반영한다.

## 제약 사항

- 브라우저 DOM API에 의존하므로 브라우저 또는 JSDOM 환경이 필요합니다.
- `<script>`, `<iframe>`, `<style>` 같은 일부 태그는 VDOM 변환 대상에서 제외됩니다.
- keyed diff는 형제 노드들이 모두 `data-key` 또는 `id` 를 가질 때만 활성화됩니다.
- TypeScript 타입 선언은 아직 제공하지 않습니다.

## 프로젝트 구조

```text
src/
  app.js
  index.js
  main.js
  lib/
    fiber.js
    vdom.js
tests/
  vdom.test.js
```

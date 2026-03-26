# codex-react 기초 개념 입문서

이 문서는 `codex-react` 시스템을 보기 전에 알아두면 좋은 가장 기본 개념을 정리한 교육용 문서입니다.

목표는 세 가지입니다.

- 브라우저 DOM이 무엇인지 이해하기
- Virtual DOM과 diff, commit이 왜 필요한지 이해하기
- 현재 프로젝트의 코드에서 그 개념이 어디에 들어 있는지 연결하기

---

## 1. DOM이란 무엇인가

`DOM`은 `Document Object Model`의 줄임말입니다.

쉽게 말하면 브라우저가 HTML 문서를 JavaScript가 다룰 수 있는 객체 구조로 바꿔 놓은 것입니다.

예를 들어 아래 HTML이 있다고 해 보겠습니다.

```html
<div class="card">
  <h1>Hello</h1>
  <p>World</p>
</div>
```

브라우저는 이것을 화면에 그릴 뿐 아니라, 내부적으로는 트리 구조로 이해합니다.

```text
div
├─ h1
│  └─ "Hello"
└─ p
   └─ "World"
```

즉 DOM은 "화면을 이루는 HTML 구조를 객체 트리로 표현한 것"이라고 보면 됩니다.

---

## 2. Node, Element, Text Node는 무엇이 다른가

DOM에서는 모든 것이 `Node`입니다.

그중에서도 자주 보는 것이 아래 두 가지입니다.

- `Element`
  - `<div>`, `<p>`, `<button>` 같은 태그 노드
- `Text Node`
  - 태그 안에 들어 있는 실제 텍스트

예를 들어:

```html
<button>Save</button>
```

이 구조는 하나의 버튼 element와, 그 안의 `"Save"`라는 text node로 나뉩니다.

이 구분이 중요한 이유는:

- 속성 변경은 주로 element에서 일어나고
- 글자 변경은 text node에서 일어나기 때문입니다

현재 `codex-react`도 이 차이를 그대로 반영해서 `element` 타입과 `text` 타입을 따로 가집니다.

---

## 3. Attribute와 Property는 무엇인가

이 둘은 비슷해 보여도 다릅니다.

### Attribute

HTML 태그에 적힌 값입니다.

예:

```html
<input type="text" value="hello" />
```

여기서 `type`, `value`는 HTML attribute입니다.

### Property

브라우저가 실제 DOM 객체 위에서 관리하는 현재 상태 값입니다.

예를 들어 사용자가 input에 직접 `"world"`를 입력하면:

- HTML에 적혀 있던 attribute는 여전히 `"hello"`일 수 있고
- 실제 DOM 객체의 `input.value` property는 `"world"`가 됩니다

즉:

- attribute는 "문서에 적힌 값"
- property는 "지금 브라우저 안의 실제 상태"

입니다.

현재 프로젝트가 `input.value`, `checked`, `textarea.value`, `option.selected`를 따로 읽는 이유도 여기에 있습니다.

---

## 4. 실제 DOM을 직접 조작하면 왜 어려운가

화면이 단순할 때는 DOM을 직접 바꿔도 괜찮습니다.

하지만 UI가 커질수록 개발자가 직접 계산해야 할 것이 많아집니다.

- 어떤 노드를 새로 만들지
- 어떤 노드를 지울지
- 텍스트만 바뀐 것인지
- 속성만 바뀐 것인지
- 같은 노드가 이동한 것인지

즉 문제는 "화면을 바꾸는 것"보다 "무엇을 어떻게 바꿔야 하는지 계산하는 것"입니다.

그래서 React 같은 시스템은 먼저 화면을 데이터로 표현하고, 이전 상태와 다음 상태를 비교한 뒤, 마지막에만 실제 DOM을 수정합니다.

---

## 5. Virtual DOM이란 무엇인가

`Virtual DOM`은 실제 DOM을 메모리 안의 가벼운 데이터 구조로 표현한 것입니다.

현재 프로젝트에서는 대략 이런 형태를 사용합니다.

```js
{
  type: 'element',
  tag: 'button',
  attrs: { type: 'button', class: 'primary' },
  children: [
    { type: 'text', value: 'Save' }
  ]
}
```

이것은 실제 브라우저 DOM이 아니라, 화면 구조를 설명하는 JavaScript 객체입니다.

Virtual DOM을 쓰면 좋은 점은 다음과 같습니다.

- 비교하기 쉽다
- 테스트하기 쉽다
- 로그로 보기 쉽다
- 중간 계산 결과를 남기기 쉽다

즉 Virtual DOM은 "화면을 데이터처럼 다루기 위한 표현"입니다.

---

## 6. 현재 프로젝트의 VDOM 구조

현재 `codex-react`는 Virtual DOM을 세 가지 타입으로 단순화했습니다.

### `root`

가상 최상위 노드입니다.

```js
{
  type: 'root',
  children: [...]
}
```

### `element`

일반 HTML 태그입니다.

```js
{
  type: 'element',
  tag: 'div',
  attrs: { class: 'card' },
  children: [...]
}
```

### `text`

텍스트 노드입니다.

```js
{
  type: 'text',
  value: 'Hello'
}
```

브라우저에는 실제로 `root`라는 태그가 없지만, 내부 계산을 쉽게 하기 위해 가상 루트를 둡니다.

즉:

- 실제 DOM의 컨테이너는 `#app`
- 내부 VDOM의 최상위는 `root`

라고 이해하면 됩니다.

---

## 7. 이 프로젝트에서 HTML, DOM, VDOM은 어떻게 연결되나

현재 시스템은 세 가지 방향의 변환을 지원합니다.

### HTML 문자열 -> VDOM

`parseHtmlToVNode`

- editor에 적힌 HTML을 내부 트리로 바꿀 때 사용합니다

### 실제 DOM -> VDOM

`domNodeToVNodeTree`

- test preview나 actual DOM을 다시 읽어 working tree를 만들 때 사용합니다

### VDOM -> 실제 DOM

`renderVNode`, `mountVNode`

- Virtual DOM을 실제 브라우저 DOM으로 다시 그릴 때 사용합니다

즉 현재 프로젝트는 "문자열", "브라우저 DOM", "가상 트리"를 서로 오갈 수 있게 설계되어 있습니다.

---

## 8. diff와 reconcile은 무엇인가

`diff`는 이전 트리와 다음 트리를 비교해서 무엇이 달라졌는지 찾는 과정입니다.

현재 프로젝트에서는 이 과정을 `reconcileTrees(previousTree, nextTree)`가 담당합니다.

이 함수는 실제 DOM을 바로 건드리지 않고:

- 어떤 노드는 재사용할지
- 어떤 노드는 삽입할지
- 어떤 노드는 삭제할지
- 어떤 속성이 바뀌었는지
- 어떤 텍스트가 바뀌었는지

를 계산합니다.

즉 `reconcile`은 "실행"이 아니라 "계획 수립" 단계입니다.

---

## 9. effect란 무엇인가

`effect`는 나중에 commit 단계에서 실행할 작업 목록입니다.

현재 시스템의 핵심 effect는 다섯 가지입니다.

- `INSERT_CHILD`
- `MOVE_CHILD`
- `REMOVE_CHILD`
- `UPDATE_PROPS`
- `UPDATE_TEXT`

예를 들어 `<p>Hello</p>`가 `<p>Hello world</p>`로 바뀌면, 전체를 다시 만드는 대신 이런 식의 effect를 생각할 수 있습니다.

```js
{
  opType: 'UPDATE_TEXT',
  path: [0, 0],
  value: 'Hello world'
}
```

즉 effect는 "무슨 DOM 작업을 해야 하는지 적어 둔 할 일 목록"입니다.

---

## 10. commit은 무엇인가

`commit`은 reconcile 단계에서 만든 effect를 실제 DOM 연산으로 실행하는 단계입니다.

현재 프로젝트에서는 `commitRoot(container, rootFiber)`가 이 역할을 합니다.

쉽게 말하면:

- reconcile은 "무엇을 바꿀지 계산"
- commit은 "실제로 바꾸기"

입니다.

이 둘을 분리하면:

- 중간 계산 결과를 볼 수 있고
- 디버깅이 쉬워지고
- 테스트하기 쉬워집니다

현재 playground에서 effect 카드와 raw JSON을 먼저 보여 줄 수 있는 이유도 이 분리 덕분입니다.

---

## 11. key는 왜 중요한가

리스트를 비교할 때 key가 없으면 보통 index 기준으로 비교합니다.

그러면 순서가 바뀐 상황을 시스템이 잘못 이해할 수 있습니다.

예를 들어:

```html
<li data-key="a">A</li>
<li data-key="b">B</li>
<li data-key="c">C</li>
```

가

```html
<li data-key="c">C</li>
<li data-key="a">A</li>
<li data-key="b">B</li>
```

로 바뀌면, key가 있으면 "같은 노드가 이동한 것"이라고 판단할 수 있습니다.

현재 프로젝트는:

- `data-key`를 우선 사용하고
- 없으면 `id`를 사용합니다

즉 key는 노드의 정체성을 나타내는 값입니다.

---

## 12. path는 무엇인가

현재 시스템의 effect에는 종종 `path`가 들어 있습니다.

예:

```js
path: [0, 1, 0]
```

이것은 루트에서부터:

- 0번 자식으로 내려가고
- 그 안의 1번 자식으로 내려가고
- 다시 그 안의 0번 자식으로 내려간다는 뜻입니다

즉 path는 "트리 안에서 이 노드가 어디 있는지 가리키는 주소"입니다.

commit 단계는 이 path를 따라 실제 DOM 노드를 찾습니다.

---

## 13. Fiber는 이 프로젝트에서 어떻게 이해하면 되나

현재 프로젝트에도 Fiber가 구현되어 있습니다.

다만 React 전체 Fiber 아키텍처를 그대로 구현한 것은 아니고, 학습용으로 단순화한 작업 노드입니다.

현재 Fiber는 대략 이런 정보를 가집니다.

- 부모, 자식, 형제 연결
- 이전 노드 정보
- 현재 위치(path)
- flags
- subtreeFlags
- deletions
- effects

즉 현재 프로젝트에서 Fiber는 "다음 화면으로 가기 위해 필요한 작업 정보를 담은 중간 작업 단위"로 이해하면 충분합니다.

---

## 14. 예시 1: 브라우저 DOM 직접 조작

아래는 순수 DOM API 예제입니다.

```js
const container = document.querySelector('#app');
const button = document.createElement('button');

button.setAttribute('type', 'button');
button.textContent = 'Save';

container.appendChild(button);
```

이 코드는 잘 동작합니다.

하지만 UI가 커지면 개발자가 직접 아래를 계속 계산해야 합니다.

- 기존 버튼을 재사용할지
- 새로 만들지
- 텍스트만 바꿀지
- 속성만 바꿀지

그래서 큰 시스템에서는 이 과정을 계산 단계와 실행 단계로 나누는 편이 더 관리하기 쉽습니다.

---

## 15. 예시 2: 현재 프로젝트 스타일의 VDOM

같은 버튼을 현재 프로젝트 스타일의 Virtual DOM으로 표현하면 이렇게 됩니다.

```js
const vnode = {
  type: 'root',
  children: [
    {
      type: 'element',
      tag: 'button',
      attrs: { type: 'button', class: 'primary' },
      children: [
        { type: 'text', value: 'Save' }
      ]
    }
  ]
};
```

이 구조는 실제 DOM이 아니라, 화면 상태를 설명하는 데이터입니다.

이 데이터를 가지고:

- DOM으로 렌더링할 수도 있고
- 다른 트리와 비교할 수도 있고
- JSON으로 저장할 수도 있습니다

---

## 16. 예시 3: diff가 만들어 내는 effect

이전 상태가 아래와 같다고 해 보겠습니다.

```js
const previousTree = {
  type: 'root',
  children: [
    {
      type: 'element',
      tag: 'p',
      attrs: {},
      children: [{ type: 'text', value: 'old text' }]
    }
  ]
};
```

다음 상태가 아래처럼 바뀌었다고 해 보겠습니다.

```js
const nextTree = {
  type: 'root',
  children: [
    {
      type: 'element',
      tag: 'p',
      attrs: { class: 'highlight' },
      children: [{ type: 'text', value: 'new text' }]
    }
  ]
};
```

이 경우 시스템은 대략 이런 판단을 할 수 있습니다.

- `p` 태그 자체는 재사용 가능
- 속성은 바뀌었으므로 `UPDATE_PROPS`
- 텍스트는 바뀌었으므로 `UPDATE_TEXT`

즉 전체 `<p>`를 지우고 새로 만드는 대신, 필요한 변경만 effect로 기록할 수 있습니다.

---

## 17. 현재 코드에서 개념을 어디서 보면 좋은가

처음 코드를 읽을 때는 아래 순서가 좋습니다.

### 1. `src/lib/vdom.js`

- VDOM 구조
- HTML/DOM/VDOM 변환
- attribute와 live DOM state 처리

### 2. `src/lib/fiber/reconcile.js`

- 이전 트리와 다음 트리 비교
- effect 생성
- key와 path 사용 방식

### 3. `src/lib/fiber/commit.js`

- effect를 실제 DOM으로 반영하는 방식

### 4. `src/playground/actions.js`

- editor, preview, history, commit 흐름이 실제로 어떻게 연결되는지

---

## 18. 5분 요약

이 프로젝트를 이해할 때 가장 중요한 문장은 아래 하나입니다.

`화면을 바로 DOM으로 다루지 않고, 먼저 Virtual DOM이라는 데이터 트리로 표현한 뒤, 이전 상태와 다음 상태의 차이를 계산해서 필요한 DOM 변경만 commit 한다.`

여기서 기억해야 할 핵심 단어는 아래와 같습니다.

- `DOM`: 브라우저가 관리하는 실제 화면 구조
- `VDOM`: 화면을 표현하는 가벼운 데이터 구조
- `attribute`: HTML에 적힌 값
- `property`: 브라우저 DOM 객체의 현재 상태 값
- `reconcile`: 무엇이 바뀌었는지 계산하는 단계
- `effect`: 나중에 실행할 DOM 작업 목록
- `commit`: effect를 실제 DOM에 반영하는 단계
- `key`: 리스트 항목의 정체성
- `path`: 트리 안에서 노드의 위치
- `Fiber`: 계산과 commit을 연결하는 작업 단위

이 단어들만 익혀도 현재 `codex-react`의 핵심 구조를 훨씬 쉽게 따라갈 수 있습니다.

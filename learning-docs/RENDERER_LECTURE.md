# 리액트 같은 렌더러의 동작 방식 강의자료

이 문서는 `codex-react` 프로젝트를 바탕으로, React 같은 렌더러가 왜 필요하고 어떻게 동작하는지 기초부터 차근차근 설명하기 위한 강의자료입니다.

목표는 세 가지입니다.

- 직접 DOM 조작이 왜 어려운지 이해하기
- Virtual DOM, reconcile, commit의 흐름 이해하기
- 현재 프로젝트가 그 개념을 어떻게 단순화해서 구현했는지 연결하기

---

## 1. 먼저, 렌더러는 왜 필요한가?

브라우저에서 화면을 바꾸는 가장 직접적인 방법은 DOM을 하나씩 조작하는 것입니다.

예를 들어 버튼을 누를 때마다 목록을 바꾸고, 텍스트를 수정하고, 입력창 값을 유지하고, 일부 노드는 이동시키려면 다음 같은 일이 필요합니다.

- 어떤 노드가 바뀌었는지 찾아야 함
- 어떤 속성이 달라졌는지 비교해야 함
- 새 노드는 만들고, 사라진 노드는 지워야 함
- 순서가 바뀐 노드는 이동해야 함
- 이미 입력 중인 값이나 체크 상태를 조심해서 유지해야 함

작은 화면에서는 가능하지만, UI가 커질수록 이 작업을 사람이 직접 관리하기가 매우 어렵습니다.

즉, 문제는 이것입니다.

`화면이 복잡해질수록 "무엇을 어떻게 바꿔야 하는지"를 사람이 직접 계산하는 비용이 너무 커진다.`

그래서 React 같은 렌더러는 이 계산을 대신 해 줍니다.

### 1-1. 브라우저에서 DOM을 다루는 기본 객체: `Window`와 `Document`

브라우저에서 JavaScript가 화면을 다룰 때 가장 먼저 만나는 객체는 `window`입니다.

- `window`: 브라우저 탭 전체를 대표하는 전역 객체
- `document`: 현재 페이지의 HTML 문서를 나타내는 객체

쉽게 말하면:

- `window`는 "브라우저 환경 전체"
- `document`는 "현재 페이지 문서"

입니다.

그리고 실제 DOM 조작은 보통 `document`에서 시작합니다.

예를 들어:

```js
const title = document.querySelector('h1');
title.textContent = 'Hello';
```

이 흐름은 다음처럼 이해하면 됩니다.

1. `document`에서 노드를 찾는다.
2. 찾은 노드는 `Node` 또는 `Element` 객체다.
3. 그 객체의 속성, 텍스트, 자식 구조를 바꾼다.

즉, 렌더러가 결국 다루는 대상도 브라우저의 `Document`, `Element`, `Text`, `Node`입니다.

### 1-2. DOM 변화 관찰과 현재 프로젝트의 선택

브라우저에는 DOM 변화를 감지하기 위한 API도 있습니다. 대표적인 것이 `MutationObserver`입니다.

`MutationObserver`는 다음 같은 변화를 관찰할 수 있습니다.

- 자식 노드 추가/삭제
- 속성 변경
- 텍스트 변경

예를 들면:

```js
const observer = new MutationObserver((records) => {
  console.log(records);
});

observer.observe(targetNode, {
  childList: true,
  attributes: true,
  characterData: true,
  subtree: true,
});
```

다만 현재 `codex-react`의 핵심 학습 포인트는 mutation observer 자체가 아니라, DOM을 다시 읽어 Virtual DOM으로 동기화하고 그 결과를 reconcile/commit 흐름으로 설명하는 데 있습니다. 즉, 현재 프로젝트는 mutation 로그 패널보다는 `effect queue`, `raw effect JSON`, `history snapshot`을 중심으로 작동 과정을 보여 줍니다.

### 1-3. 실제 DOM이 느릴 수 있는 이유: `Reflow`와 `Repaint`

실제 DOM 조작이 항상 느리다고 단정할 수는 없지만, 상대적으로 비용이 큰 이유는 브라우저가 DOM 변경 이후 추가 작업을 해야 하기 때문입니다.

대표적으로 두 가지 관점이 중요합니다.

#### Reflow

레이아웃이 다시 계산되는 과정입니다.

예를 들어:

- 요소 크기 변경
- 위치 변경
- 노드 추가/삭제
- 글자 수 변화로 인한 박스 크기 변화

가 생기면 브라우저는 어느 요소가 어디에 놓여야 하는지 다시 계산해야 할 수 있습니다.

#### Repaint

화면에 다시 그리는 과정입니다.

레이아웃은 그대로여도:

- 색상 변경
- 배경 변경
- 그림자 변경

같은 시각적 변화가 생기면 다시 칠해야 합니다.

즉, 실제 DOM 변경은 단순히 JavaScript 객체 값을 바꾸는 것이 아니라:

1. DOM 변경
2. 스타일 계산
3. 필요 시 Reflow
4. Repaint

로 이어질 수 있기 때문에 비용이 커질 수 있습니다.

그래서 React 같은 렌더러는 "실제 DOM을 자주, 많이 바꾸는 것"을 피하고, 먼저 메모리 안에서 계산한 뒤 꼭 필요한 변경만 반영하려고 합니다.

---

## 2. 명령형 UI와 선언형 UI

### 2-1. 명령형 UI

명령형 UI는 개발자가 DOM을 직접 조작하는 방식입니다.

예를 들면:

- `div`를 새로 만든다
- `class`를 바꾼다
- 텍스트를 수정한다
- 세 번째 자식 노드를 지운다

이 방식은 "어떻게 바꿀지"를 직접 써야 합니다.

### 2-2. 선언형 UI

선언형 UI는 "현재 상태라면 화면이 이렇게 보여야 한다"를 설명하는 방식입니다.

예를 들면:

- 로딩 중이면 스피너를 보여준다
- 데이터가 있으면 리스트를 보여준다
- 선택된 항목은 강조한다

그러면 내부 시스템이 이전 화면과 다음 화면을 비교해서 실제 DOM을 적절히 갱신합니다.

React가 중요한 이유는 선언형 UI를 가능하게 해 주기 때문입니다.

---

## 3. React 같은 렌더러의 핵심 아이디어

핵심 흐름은 아주 단순하게 요약할 수 있습니다.

1. 현재 화면을 어떤 트리 구조로 표현한다.
2. 상태가 바뀌면 다음 화면도 같은 형태의 트리로 만든다.
3. 이전 트리와 다음 트리를 비교한다.
4. 실제 DOM에는 필요한 변경만 반영한다.

이때 사용하는 대표적인 개념이 Virtual DOM입니다.

---

## 4. Virtual DOM이란 무엇인가?

Virtual DOM은 실제 DOM을 메모리 안의 JavaScript 객체 형태로 표현한 것입니다.

### 4-1. Virtual DOM의 구조

Virtual DOM은 보통 트리 구조입니다. 각 노드는 다음 같은 정보를 가질 수 있습니다.

- 노드 타입
- 태그 이름
- 속성
- 자식 노드 목록
- 텍스트 값

즉, 실제 DOM의 핵심 구조를 가볍게 데이터로 옮긴 것이라고 볼 수 있습니다.

예를 들어 이런 HTML이 있다고 가정해 보겠습니다.

```html
<div class="card">
  <p>Hello</p>
</div>
```

이것을 Virtual DOM으로 표현하면 대략 이런 생각을 할 수 있습니다.

```js
{
  type: 'element',
  tag: 'div',
  attrs: { class: 'card' },
  children: [
    {
      type: 'element',
      tag: 'p',
      attrs: {},
      children: [
        { type: 'text', value: 'Hello' }
      ]
    }
  ]
}
```

중요한 점은 이것이 실제 브라우저 DOM이 아니라, "화면 구조를 설명하는 데이터"라는 것입니다.

### 4-2. Virtual DOM이 필요한 이유

Virtual DOM이 필요한 이유는 "실제 DOM을 직접 비교하고 직접 계산하는 비용"을 줄이기 위해서입니다.

핵심 이유는 다음과 같습니다.

- 실제 DOM보다 비교하기 쉽다
- 순수 데이터라서 테스트와 디버깅이 쉽다
- 변경 사항을 미리 계산할 수 있다
- 실제 DOM 변경 횟수를 줄일 수 있다

즉, Virtual DOM은 성능을 위한 도구이기도 하지만, 더 본질적으로는 UI 업데이트를 예측 가능하게 만드는 계산 모델입니다.

---

## 5. 현재 프로젝트의 VDOM 구조

현재 `codex-react` 프로젝트에서는 Virtual DOM을 아주 단순하게 세 가지 타입으로 나눴습니다.

### 5-1. root

전체 트리의 시작점입니다.

```js
{
  type: 'root',
  children: [...]
}
```

### 5-2. element

일반 HTML 태그를 나타냅니다.

```js
{
  type: 'element',
  tag: 'button',
  attrs: { type: 'button', class: 'primary' },
  children: [...]
}
```

### 5-3. text

텍스트 노드입니다.

```js
{
  type: 'text',
  value: 'Click me'
}
```

이 구조는 실제 React보다 훨씬 단순하지만, 렌더러의 핵심 흐름을 학습하기에는 충분합니다.

---

## 6. 현재 프로젝트에서 VDOM은 어떻게 만들어지나?

현재 프로젝트는 세 가지 방식으로 Virtual DOM을 만듭니다.

### 6-1. HTML 문자열 -> Virtual DOM

`parseHtmlToVNode`를 사용합니다.

### 6-2. VDOM(JSON) 문자열 -> Virtual DOM

`parseVdomTextToVNode`를 사용합니다.

### 6-3. 실제 DOM -> Virtual DOM

`domNodeToVNodeTree`를 사용합니다.

즉, 이 프로젝트는 "문자열 편집", "JSON 편집", "이미 존재하는 브라우저 DOM 읽기"를 모두 같은 내부 트리 구조로 모읍니다.

---

## 7. render와 mount는 무엇인가?

Virtual DOM을 만들었다고 해서 바로 화면이 바뀌는 것은 아닙니다. Virtual DOM을 실제 DOM으로 바꾸는 과정이 필요합니다.

현재 프로젝트에서는 이 역할을 `renderVNode`와 `mountVNode`가 담당합니다.

### 7-1. `renderVNode`

Virtual DOM 노드 하나를 실제 브라우저 `Node`로 바꿉니다.

### 7-2. `mountVNode`

렌더링된 실제 DOM을 컨테이너에 붙입니다.

쉽게 말하면:

- `renderVNode`는 "DOM 만들기"
- `mountVNode`는 "화면에 붙이기"

입니다.

---

## 8. 그런데 매번 전체를 다시 그리면 안 될까?

가능은 합니다.

하지만 매번 전체를 지우고 다시 만들면 다음 같은 문제가 생깁니다.

- 불필요한 DOM 연산이 많아짐
- 입력 중인 폼 상태가 깨질 수 있음
- 노드 재사용이 불가능해짐
- 성능과 사용자 경험이 나빠질 수 있음

그래서 필요한 것이 diff입니다.

즉, 전체를 다시 만드는 대신:

- 무엇이 달라졌는지 찾고
- 그 부분만 바꾸는 것

이 더 좋은 전략입니다.

---

## 9. diff란 무엇인가?

diff는 이전 트리와 다음 트리를 비교해서 차이점을 찾는 과정입니다.

현재 프로젝트 기준에서 핵심 변경 유형은 다섯 가지입니다.

- `UPDATE_PROPS`
- `UPDATE_TEXT`
- `INSERT_CHILD`
- `REMOVE_CHILD`
- `MOVE_CHILD`

즉, Diff 알고리즘은 "무엇을 바꿀지"를 계산하고, commit은 그것을 브라우저 DOM API 호출로 바꾸는 단계입니다.

---

## 10. reconciliation은 무엇인가?

reconciliation은 diff를 수행하는 과정 전체를 말합니다.

현재 프로젝트에서는 `reconcileTrees(previousTree, nextTree)`가 이 역할을 합니다.

이 함수는:

- work-in-progress fiber 트리를 만들고
- effect 목록을 생성하고
- 어떤 작업이 필요한지 정리합니다

즉, reconciliation은 "다음 화면으로 가기 위해 필요한 작업 계획을 세우는 단계"입니다.

---

## 11. Fiber는 무엇인가?

이 프로젝트에서 Fiber는 "비교와 commit을 위해 사용하는 작업 단위"입니다.

Fiber에는 다음 같은 정보가 들어갑니다.

- 현재 노드의 타입
- 태그 이름
- 속성
- 부모, 자식, 형제 연결
- 이전 커밋 노드 정보
- 현재 위치(path)
- 어떤 작업이 필요한지 나타내는 flags

즉, Fiber는 단순 VDOM 복사본이 아니라, "업데이트를 수행하기 위해 보강된 노드"라고 이해하면 좋습니다.

---

## 12. effect는 무엇인가?

effect는 나중에 실제 DOM에 반영할 작업 목록입니다.

현재 프로젝트에는 다음 종류가 있습니다.

- `INSERT_CHILD`
- `MOVE_CHILD`
- `REMOVE_CHILD`
- `UPDATE_PROPS`
- `UPDATE_TEXT`

이것은 쉽게 말해 "commit 단계에서 할 일 리스트"입니다.

---

## 13. flag는 왜 필요한가?

flag는 어떤 fiber가 어떤 종류의 작업을 필요로 하는지 빠르게 표시하는 값입니다.

현재 프로젝트는 비트마스크 형태로 다음 값을 사용합니다.

- `Placement`
- `Update`
- `ChildDeletion`

즉, effect는 구체적인 작업 기록이고, flag는 그 작업의 성격을 표시하는 신호라고 볼 수 있습니다.

---

## 14. reconcile는 자식을 어떻게 비교할까?

트리를 비교할 때 가장 중요한 것은 자식 노드 비교입니다.

현재 프로젝트는 두 가지 방식을 사용합니다.

### 14-1. index 기반 비교

key가 없으면 같은 위치끼리 비교합니다.

### 14-2. keyed diff

자식이 모두 `data-key`나 `id`를 가지면 key를 기준으로 비교합니다.

현재 프로젝트에서 key는 `getVNodeKey`로 읽습니다. 우선순위는 `data-key`, 그다음 `id`이며, 둘 다 없으면 `null`입니다.

---

## 15. key는 왜 중요한가?

key가 있어야 "같은 노드가 위치만 바뀐 것인지", "완전히 다른 새 노드인지"를 안정적으로 판단할 수 있습니다.

key가 없으면 단순 index 비교에 의존하게 되어 재배열 상황에서 잘못된 재사용이나 불필요한 삭제/삽입이 발생하기 쉽습니다.

즉, key는 노드의 정체성을 나타냅니다.

---

## 16. commit 단계는 무엇을 하나?

reconcile 단계가 끝나면 effect 목록이 준비됩니다.

이제 commit 단계에서는 이 effect를 실제 DOM 조작으로 바꿉니다.

현재 프로젝트의 `commitRoot(container, rootFiber)`는:

1. effect 목록을 정렬하고
2. effect를 하나씩 읽고
3. 실제 DOM API를 호출해 반영합니다

즉, commit은 "계산 결과를 실제 화면으로 확정하는 단계"입니다.

---

## 17. 왜 reconcile과 commit을 분리해야 할까?

이 분리는 렌더러 이해의 핵심입니다.

### reconcile 단계

- 이전/다음 상태 비교
- 어떤 변경이 필요한지 계산
- effect 목록 생성

### commit 단계

- effect 목록을 실제 DOM 변경으로 실행

이렇게 나누면 좋은 점이 많습니다.

- 비교 로직을 테스트하기 쉬움
- 실제 DOM 반영 전 중간 결과를 확인할 수 있음
- 디버깅이 쉬움
- UI에서 effect를 시각화하기 쉬움

---

## 18. 현재 프로젝트의 전체 흐름

현재 시스템의 큰 흐름은 아래와 같습니다.

1. 초기 Actual DOM을 읽어 committed tree 기준선을 만든다.
2. 사용자가 HTML editor, VDOM editor, 또는 test preview에서 상태를 바꾼다.
3. 다음 Virtual DOM인 working tree를 만든다.
4. `reconcileTrees`로 committed tree와 working tree를 비교한다.
5. effect 목록을 만든다.
6. `commitRoot`로 Actual DOM에 반영한다.
7. 결과를 history snapshot으로 저장하고, effect 카드와 JSON으로 보여 준다.

즉, 이 프로젝트는 React의 핵심 흐름을 교육용으로 시각화한 시스템이라고 볼 수 있습니다.

---

## 19. form control은 왜 특별 취급이 필요한가?

일반 element는 속성만 비교해도 어느 정도 맞습니다.

하지만 form control은 다릅니다.

- `input`은 사용자가 타이핑하면 현재 `value`가 바뀝니다
- `checkbox`는 현재 `checked` 상태가 중요합니다
- `textarea`는 내부 텍스트보다 실제 `value`가 중요합니다
- `option`은 `selected` 상태가 중요합니다

그래서 현재 프로젝트는 DOM을 VDOM으로 읽을 때 이런 값을 별도로 반영합니다.

---

## 20. playground는 왜 중요한가?

이 프로젝트의 큰 장점 중 하나는 playground입니다.

playground에서는:

- Actual DOM
- Editor + Preview
- pending effect 카드
- raw effect JSON
- history snapshot
- 통계 카드

를 함께 볼 수 있습니다.

이것이 중요한 이유는, 보통 React 내부에서는 보이지 않는 reconcile과 commit 과정을 시각적으로 드러내 주기 때문입니다.

즉, 이 시스템은 단순한 라이브러리이면서 동시에 좋은 학습 도구입니다.

---

## 21. 실제 React와 현재 프로젝트의 차이

현재 프로젝트는 React를 그대로 구현한 것이 아닙니다.

중요한 점은, 현재 프로젝트에도 Fiber 구조 자체는 구현되어 있다는 것입니다. 다만 이 Fiber는 React 전체 아키텍처를 재현한 것이 아니라, reconciliation과 commit을 설명하기 위한 단순화된 작업 단위입니다.

차이점은 다음과 같습니다.

- 컴포넌트 모델이 없음
- Hook 시스템이 없음
- 스케줄링과 동시성 처리가 없음
- 이벤트 시스템이 없음
- 서버 렌더링이 없음
- 우선순위 기반 작업 분할이 없음

하지만 중요한 공통점도 있습니다.

- 상태를 트리로 표현한다
- 이전과 다음을 비교한다
- 변경 작업을 모아 둔다
- 마지막에 실제 DOM에 반영한다

그래서 이 프로젝트는 "React 전체"를 배우기보다, React의 렌더링 핵심 사상을 배우는 데 적합합니다.

---

## 22. 강의에서 강조하면 좋은 문장

### 문장 1

React 같은 렌더러의 핵심은 "화면을 직접 조작하는 것"이 아니라, "다음 화면을 데이터로 표현하고 이전 화면과 비교해서 필요한 변경만 반영하는 것"입니다.

### 문장 2

Virtual DOM은 실제 화면이 아니라 계산을 위한 중간 표현입니다.

### 문장 3

reconcile은 계획을 세우는 단계이고, commit은 실제로 실행하는 단계입니다.

### 문장 4

key는 리스트에서 각 노드의 정체성을 보장하는 장치입니다.

### 문장 5

이 프로젝트는 React 전체를 복제한 것이 아니라, 렌더링 엔진의 핵심 아이디어를 학습용으로 분해한 시스템입니다.

---

## 23. 간단 요약

렌더러의 핵심은 다음 한 문장으로 정리할 수 있습니다.

`현재 화면과 다음 화면을 트리로 표현하고, 둘의 차이를 계산한 뒤, 필요한 DOM 변경만 반영하는 시스템`

현재 `codex-react`는 이 개념을 다음 네 단계로 보여 줍니다.

1. `parse / read`: HTML, VDOM(JSON), 또는 DOM을 VDOM으로 만든다
2. `reconcile`: 이전과 다음을 비교한다
3. `effects`: 필요한 작업 목록을 만든다
4. `commit`: 실제 DOM에 반영한다

이 네 단계를 이해하면 React 같은 렌더러의 기본 동작 원리를 큰 틀에서 설명할 수 있습니다.

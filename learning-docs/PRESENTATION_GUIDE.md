# codex-react 발표 가이드

이 문서는 `codex-react` 시스템을 발표할 때 바로 읽거나, 발표 직전에 빠르게 훑어볼 수 있도록 만든 메인 가이드입니다.

관련 보조자료:

- `RENDERER_LECTURE.md`: 렌더러 개념을 기초부터 설명하는 강의자료
- `REACT_INTERNALS_COMPARE.md`: React 원본 내부 구조와 현재 시스템 비교 자료
- `COACH_QA.md`: 예상 질문과 답변 모음

---

## 1. 프로젝트 한 줄 소개

`codex-react`는 브라우저 DOM을 Virtual DOM으로 변환하고, 이전 트리와 다음 트리를 비교해 effect를 만든 뒤, 그 effect만 실제 DOM에 반영하는 작은 React 유사 렌더링 시스템입니다.

조금 더 쉽게 말하면:

- 화면 구조를 데이터로 표현하고
- 변경점을 계산한 뒤
- 필요한 DOM 변경만 반영하는

학습용 렌더러입니다.

---

## 2. 이 프로젝트를 만든 이유

React를 사용할 때는 보통 `setState`, `props`, `render` 같은 바깥 API만 보게 됩니다. 그런데 실제로는 내부에서 다음 같은 과정이 일어납니다.

1. 다음 화면을 계산한다.
2. 이전 화면과 비교한다.
3. 필요한 변경만 실제 DOM에 반영한다.

이 프로젝트는 이 과정을 직접 구현해 보면서 React의 핵심 아이디어를 이해하기 위해 만들었습니다.

즉 목표는 "React처럼 보이는 앱"을 만드는 것이 아니라, "React가 왜 이런 구조를 쓰는지"를 배우는 것입니다.

---

## 3. 문제의식: 왜 실제 DOM을 직접 다루기 어려운가

브라우저에서 DOM을 직접 조작하는 것은 가능하지만, UI가 커질수록 관리 비용이 커집니다.

예를 들어 화면이 바뀔 때마다 개발자는 직접 다음을 계산해야 합니다.

- 어떤 노드를 새로 만들어야 하는지
- 어떤 노드를 삭제해야 하는지
- 어떤 속성이 바뀌었는지
- 어떤 텍스트가 바뀌었는지
- 어떤 노드가 이동한 것인지

또 실제 DOM 변경은 브라우저 렌더링 파이프라인과 연결되므로 비용이 큽니다.

- 스타일 계산
- Reflow
- Repaint

즉 복잡한 UI를 사람이 직접 세밀하게 관리하는 것은 어렵고, 실수하기 쉽습니다.

---

## 4. 해결 아이디어: Virtual DOM

그래서 먼저 실제 DOM을 바로 건드리지 않고, 화면 구조를 메모리 안의 데이터로 표현합니다.

이 데이터가 Virtual DOM입니다.

예를 들어 현재 시스템에서는 아래 같은 구조를 사용합니다.

```js
{
  type: 'element',
  tag: 'div',
  attrs: { class: 'card' },
  children: [
    { type: 'text', value: 'Hello' }
  ]
}
```

Virtual DOM을 쓰는 이유는 다음과 같습니다.

- 비교하기 쉽다
- 테스트하기 쉽다
- 로그와 시각화가 쉽다
- 실제 DOM 변경 횟수를 줄일 수 있다

즉 Virtual DOM은 성능 도구이기도 하지만, 더 본질적으로는 UI 업데이트를 계산 가능한 데이터 문제로 바꾸는 장치입니다.

---

## 5. 현재 시스템의 핵심 흐름

현재 `codex-react`의 핵심 흐름은 아래 네 단계로 요약할 수 있습니다.

```text
1. parse / read
2. reconcile
3. effects
4. commit
```

조금 더 풀어서 말하면:

1. HTML 문자열, VDOM(JSON), 또는 실제 DOM을 읽어 working tree를 만든다.
2. 현재 기준선이 되는 committed tree와 working tree를 비교한다.
3. 필요한 변경을 effect 목록으로 만든다.
4. effect를 실제 DOM 연산으로 반영하고 history snapshot을 저장한다.

이 흐름이 현재 시스템의 가장 중요한 골격입니다.

---

## 6. 현재 시스템의 모듈 구조

### 6-1. VDOM 계층

파일:

- `src/lib/vdom.js`

역할:

- HTML 문자열 -> VDOM
- VDOM(JSON) 문자열 -> VDOM
- 실제 DOM -> VDOM
- VDOM -> 실제 DOM
- VDOM -> HTML / JSON 직렬화

즉 화면 구조를 데이터로 읽고 쓰는 계층입니다.

### 6-2. Reconciler 계층

파일:

- `src/lib/fiber/reconcile.js`

역할:

- 이전 트리와 다음 트리 비교
- work-in-progress fiber 생성
- 변경을 effect로 기록
- subtree flag 계산

즉 "무엇이 바뀌었는지 계산"하는 계층입니다.

### 6-3. Commit 계층

파일:

- `src/lib/fiber/commit.js`

역할:

- effect를 안전한 순서로 정렬
- effect를 실제 DOM 조작으로 실행
- 삽입, 삭제, 이동, 속성 변경, 텍스트 변경 수행

즉 "계산된 변경을 실제 화면에 확정"하는 계층입니다.

### 6-4. Playground 계층

파일:

- `src/app.js`
- `src/playground/*`
- `src/ui/*`

역할:

- HTML / VDOM 편집
- test preview 동기화
- effect 카드와 raw effect JSON 표시
- auto commit과 history snapshot 제어

즉 라이브러리 코어를 설명하기 위한 교육용 인터페이스입니다.

---

## 7. Fiber는 여기서 무엇을 의미하나

현재 시스템에도 Fiber는 구현되어 있습니다.

다만 실제 React 전체 Fiber 아키텍처를 그대로 구현한 것은 아니고, 학습용으로 단순화한 작업 단위입니다.

현재 Fiber는 이런 정보를 가집니다.

- 부모, 자식, 형제 연결
- 이전 노드 정보
- 현재 위치(path)
- flags
- subtreeFlags
- deletions
- effects

즉 현재 Fiber는 "업데이트 계산과 commit 연결을 위한 작업용 노드"라고 설명하면 가장 정확합니다.

---

## 8. Diff 알고리즘이 하는 일

Diff 알고리즘은 이전 트리와 다음 트리를 비교해서 최소한의 변경을 찾는 과정입니다.

현재 시스템에서 핵심 변경 유형은 다섯 가지입니다.

1. `UPDATE_PROPS`
2. `UPDATE_TEXT`
3. `INSERT_CHILD`
4. `REMOVE_CHILD`
5. `MOVE_CHILD`

이 다섯 가지를 잘 구분하면 전체를 다시 그리지 않고 필요한 부분만 반영할 수 있습니다.

특히 리스트 비교에서는 key가 중요합니다.

- `data-key` 우선
- 없으면 `id`
- 둘 다 없으면 `null`

그리고 key가 완전하지 않으면 keyed diff 대신 index 기반 비교로 내려갑니다.

---

## 9. 현재 playground에서 보여 주는 것

현재 화면을 설명할 때는 아래 다섯 패널만 기억하면 됩니다.

- `Actual DOM`
  - 현재 실제로 commit된 DOM 상태
- `Editor + Preview`
  - HTML 또는 VDOM(JSON)으로 다음 상태를 만들고, preview를 직접 수정할 수도 있는 영역
- `Fiber Effects`
  - pending effect queue 또는 마지막 commit 기록
- `Effect JSON`
  - effect 객체의 raw 데이터
- `History`
  - commit 이후 snapshot과 undo/redo 흐름

즉 현재 시스템은 실제 컨테이너와 가상 트리를 분리해서 관리하고, 그 사이의 변환 과정을 UI로 드러냅니다.

---

## 10. React 원본과 공통점

현재 시스템은 React 전체가 아니지만, 중요한 공통점이 있습니다.

- 화면을 트리 구조로 본다
- 이전과 다음을 비교한다
- 변경을 한 번에 계산한다
- 마지막에 실제 DOM에 반영한다
- Fiber 같은 작업 단위를 둔다

즉 React의 핵심 렌더링 사상을 학습하는 데는 충분히 의미 있는 구조를 가지고 있습니다.

---

## 11. React 원본과 차이점

반면 실제 React에는 현재 시스템에 없는 중요한 부분도 많습니다.

- JSX / 컴포넌트 계층
- Hook 시스템
- Context / Ref
- Scheduler
- 우선순위 관리
- 인터럽트 가능한 렌더링
- Synthetic event system
- 동시성 처리
- 더 세분화된 commit 단계

즉 현재 시스템은 React 전체가 아니라, React 내부 중에서도 `VDOM -> reconcile -> fiber -> commit`만 뽑아낸 축소판입니다.

---

## 12. 현재 시스템의 강점

### 강점 1

구조가 단순해서 설명하기 좋습니다.

### 강점 2

VDOM, reconcile, commit이 분리되어 있어 학습 효과가 높습니다.

### 강점 3

playground가 있어서 pending effect, raw effect JSON, history snapshot을 눈으로 확인할 수 있습니다.

### 강점 4

HTML 문자열, 실제 DOM, VDOM(JSON)을 오가며 상태를 비교해 볼 수 있습니다.

즉 "렌더러의 핵심 개념을 시각적으로 학습하기 좋은 구조"라는 점이 가장 큰 장점입니다.

---

## 13. 현재 시스템의 한계

### 한계 1

Scheduler가 없습니다.

즉 `reconcileTrees -> commitRoot`가 한 번 호출되면 동기적으로 끝까지 실행됩니다.

### 한계 2

컴포넌트 기반 렌더링이 없습니다.

즉 React처럼 컴포넌트를 실행해서 element 트리를 만드는 구조가 아닙니다.

### 한계 3

이벤트 시스템이 React처럼 추상화되어 있지 않습니다.

### 한계 4

일부 복잡한 reorder 시나리오와 form control 제어 규약은 더 보완할 여지가 있습니다.

즉 현재 시스템은 "실무용 React 대체재"가 아니라 "React 렌더링 핵심 원리를 보여주는 교육용 실험 시스템"이라고 설명하는 것이 정확합니다.

---

## 14. 3분 발표용 핵심 순서

짧게 발표해야 할 때는 아래 순서로 설명하면 좋습니다.

1. 이 프로젝트는 Virtual DOM과 Fiber commit 흐름을 학습하기 위한 작은 React 유사 렌더러입니다.
2. 실제 DOM을 직접 조작하면 변경 계산이 어렵고 비용도 큽니다.
3. 그래서 먼저 화면을 Virtual DOM으로 표현합니다.
4. 이전 트리와 다음 트리를 비교해 effect를 만듭니다.
5. 현재 시스템은 `UPDATE_PROPS`, `UPDATE_TEXT`, `INSERT_CHILD`, `REMOVE_CHILD`, `MOVE_CHILD`를 다룹니다.
6. 그다음 commit 단계에서 실제 DOM에 필요한 변경만 반영합니다.
7. playground는 editor, preview, effect queue, history를 함께 보여 줘서 이 과정을 설명하기 좋습니다.

이 정도만 전달해도 발표의 중심은 충분히 잡힙니다.

---

## 15. 5분 발표용 마무리 문장

이 프로젝트의 핵심은 "브라우저 DOM을 직접 조작하는 대신, 먼저 화면을 데이터로 표현하고, 이전 상태와 다음 상태를 비교해서, 필요한 변경만 실제 DOM에 반영한다"는 React의 핵심 아이디어를 직접 구현해 본 데 있습니다. 따라서 이 시스템은 React 전체를 복제한 것은 아니지만, React 렌더러의 가장 중요한 작동 원리를 이해하기 위한 학습용 시스템으로 설명할 수 있습니다.

---

## 16. 발표 전에 꼭 기억할 키워드

- Virtual DOM
- reconcile
- Fiber
- effect
- commit
- key
- history snapshot
- auto commit
- Reflow / Repaint
- Scheduler 없음

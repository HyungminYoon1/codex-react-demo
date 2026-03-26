# Virtual DOM Diff Lab 발표문

## 1. 프로젝트 한 줄 소개

이 프로젝트는 브라우저 DOM을 Virtual DOM으로 읽고, 이전 트리와 다음 트리를 비교해 effect queue를 만든 뒤, 그 effect만 실제 DOM에 반영하는 학습용 렌더링 시스템입니다.

더 짧게 말하면:

- 화면을 데이터로 표현하고
- 변경을 계산한 뒤
- 필요한 DOM 연산만 commit 하는

작은 React 유사 렌더러입니다.

---

## 2. 왜 이런 시스템이 필요한가

브라우저 DOM을 직접 조작하는 것은 가능하지만, UI가 커질수록 개발자가 직접 계산해야 할 것이 많아집니다.

- 어떤 노드를 새로 만들어야 하는지
- 어떤 노드를 삭제해야 하는지
- 속성이 어떻게 달라졌는지
- 텍스트만 바뀐 것인지
- 같은 노드가 이동한 것인지

즉 실제 DOM을 바로 계속 수정하는 방식은 화면이 커질수록 복잡해지고, 실수 가능성도 커집니다.

그래서 이 프로젝트는 먼저 화면을 Virtual DOM이라는 가벼운 트리 구조로 표현하고, 이전 상태와 다음 상태의 차이를 계산한 뒤, 마지막에만 실제 DOM을 수정하는 방식을 택했습니다.

---

## 3. 현재 데모 화면은 어떻게 구성되어 있나

현재 playground는 다섯 가지 축으로 설명할 수 있습니다.

### Actual DOM

실제로 commit이 반영된 결과 영역입니다.  
즉 사용자가 최종 결과로 보는 브라우저 DOM입니다.

### Editor + Preview

다음 상태를 만드는 작업 공간입니다.

- HTML 문자열로 편집할 수 있고
- VDOM(JSON)으로도 편집할 수 있고
- test preview를 직접 수정해서 working tree를 다시 읽어올 수도 있습니다

즉 "다음 화면"을 여러 방식으로 만들어 볼 수 있는 영역입니다.

### Fiber Effects

현재 committed tree와 working tree를 비교했을 때 어떤 effect가 필요한지 카드 형태로 보여 줍니다.

### Effect JSON

effect 객체를 raw JSON으로 그대로 보여 줍니다.  
그래서 설명용 UI뿐 아니라 실제 데이터 구조까지 확인할 수 있습니다.

### History

commit이 끝난 상태를 snapshot으로 저장합니다.  
그래서 뒤로가기와 앞으로가기로 이전 상태를 다시 재생할 수 있습니다.

---

## 4. 시스템의 핵심 흐름

이 프로젝트의 가장 중요한 흐름은 아래 네 단계입니다.

```text
1. parse / read
2. reconcile
3. effects
4. commit
```

조금 더 풀어서 말하면:

1. HTML 문자열이나 실제 DOM을 읽어서 Virtual DOM 트리를 만듭니다.
2. 현재 기준선이 되는 committed tree와 새로 만든 working tree를 비교합니다.
3. 비교 결과를 effect queue로 정리합니다.
4. commit 단계에서 effect를 실제 DOM 연산으로 실행합니다.

핵심은 "계산"과 "실행"을 분리했다는 점입니다.

---

## 5. Virtual DOM은 어떤 구조인가

현재 시스템의 Virtual DOM은 크게 세 가지 타입으로 구성됩니다.

### root

가상 최상위 노드입니다.

```js
{
  type: 'root',
  children: [...]
}
```

### element

일반 HTML 요소를 나타냅니다.

```js
{
  type: 'element',
  tag: 'div',
  attrs: { class: 'card' },
  children: [...]
}
```

### text

텍스트 노드를 나타냅니다.

```js
{
  type: 'text',
  value: 'Hello'
}
```

이 구조는 React의 실제 element/Fiber 구조보다 훨씬 단순하지만, 트리 비교와 DOM 반영을 설명하기에는 충분합니다.

---

## 6. Fiber는 여기서 무엇을 의미하나

현재 시스템에도 Fiber가 구현되어 있습니다.  
다만 React 전체 Fiber 아키텍처를 재현한 것은 아니고, 학습용으로 단순화한 작업 단위입니다.

현재 Fiber는 대략 이런 정보를 가집니다.

- 부모, 자식, 형제 연결
- 이전 노드 참조(alternate)
- 현재 위치(path)
- flags
- subtreeFlags
- deletions
- effects

즉 현재 Fiber는 "다음 화면으로 가기 위해 어떤 작업이 필요한지 계산하고, commit 단계와 연결하는 중간 작업 노드"라고 설명하는 것이 가장 정확합니다.

---

## 7. Diff 알고리즘은 무엇을 계산하나

현재 시스템은 최소 변경을 다섯 가지 effect로 나눠서 처리합니다.

1. `UPDATE_PROPS`
2. `UPDATE_TEXT`
3. `INSERT_CHILD`
4. `REMOVE_CHILD`
5. `MOVE_CHILD`

예를 들면:

- class나 data 속성이 바뀌면 `UPDATE_PROPS`
- 텍스트만 바뀌면 `UPDATE_TEXT`
- 새 노드가 생기면 `INSERT_CHILD`
- 기존 노드가 사라지면 `REMOVE_CHILD`
- 기존 노드가 재사용되면서 위치만 바뀌면 `MOVE_CHILD`

즉 이 프로젝트의 Diff는 "전체를 다시 그릴지"가 아니라, "어떤 종류의 effect를 몇 개 만들어야 하는지"를 계산하는 과정입니다.

---

## 8. 왜 key가 중요한가

리스트를 비교할 때 key가 없으면 시스템은 보통 index 기준으로 비교합니다.  
그러면 순서가 바뀐 상황을 "이동"이 아니라 "같은 자리에 있는 노드의 내용 변경"으로 오해할 수 있습니다.

현재 시스템은:

- `data-key`를 우선 사용하고
- 없으면 `id`를 사용하며
- 둘 다 없으면 index 기반 비교로 내려갑니다

즉 key는 단순 옵션이 아니라, 노드의 정체성을 유지하기 위한 장치입니다.

---

## 9. Commit 단계는 무엇을 하나

reconcile 단계에서 effect queue가 만들어지면, commit 단계는 그 effect를 실제 DOM 연산으로 바꿉니다.

현재 `commitRoot`는:

1. effect를 안전한 순서로 정렬하고
2. 삭제, 이동, 삽입, 속성 변경, 텍스트 변경으로 분기해서
3. 실제 브라우저 DOM API를 호출합니다

즉 reconcile이 "계획"이라면, commit은 "실행"입니다.

---

## 10. 이 데모에서 특히 보여주기 좋은 포인트

발표에서는 아래 흐름으로 시연하면 구조가 잘 보입니다.

1. 초기 Actual DOM을 기준선으로 잡는다.
2. HTML editor 또는 VDOM editor로 다음 상태를 만든다.
3. test preview가 working tree와 동기화되는 모습을 보여 준다.
4. pending effect 카드와 raw effect JSON을 같이 보여 준다.
5. Commit Patch를 눌러 Actual DOM만 최소 변경으로 갱신되는 점을 설명한다.
6. auto commit을 켜서 manual commit과 차이를 보여 준다.
7. history snapshot으로 이전 상태를 복원한다.

즉 이 데모는 단순히 "화면이 바뀐다"가 아니라, "왜 이렇게 바뀌는지"를 보여 주는 데 강점이 있습니다.

---

## 11. React와 닮은 점, 다른 점

### 닮은 점

- 화면을 트리 구조로 본다
- 이전과 다음을 비교한다
- 변경을 effect처럼 모아 둔다
- 마지막에 실제 DOM에 반영한다
- Fiber 같은 작업 단위를 둔다

### 다른 점

- JSX와 컴포넌트 계층이 없습니다
- Hook 시스템이 없습니다
- Scheduler와 우선순위 관리가 없습니다
- React synthetic event system이 없습니다
- commit 단계도 React보다 훨씬 단순합니다

즉 이 프로젝트는 React 전체가 아니라, React 렌더러의 핵심 아이디어를 교육용으로 축소한 시스템입니다.

---

## 12. 발표용 핵심 마무리

이 프로젝트의 핵심은 "브라우저 DOM을 직접 계속 조작하는 대신, 먼저 화면을 Virtual DOM으로 표현하고, 이전 상태와 다음 상태를 비교해서, 필요한 DOM 변경만 commit 한다"는 흐름을 직접 구현해 본 데 있습니다.

따라서 이 시스템은 React 전체를 복제한 것은 아니지만,

- Virtual DOM
- reconcile
- Fiber
- effect queue
- commit

이라는 React 렌더링의 핵심 축을 설명하기에는 충분한 학습용 시스템이라고 말할 수 있습니다.

---

## 13. 1분 요약 멘트

저희 프로젝트는 브라우저 DOM을 Virtual DOM으로 읽고, 이전 트리와 다음 트리를 비교해 effect queue를 만든 뒤, 그 effect만 실제 DOM에 반영하는 작은 React 유사 렌더러입니다. 현재 데모에서는 HTML 편집, VDOM 편집, preview 직접 수정, pending effect 카드, raw effect JSON, history snapshot까지 함께 볼 수 있어서 reconcile과 commit 과정을 눈으로 설명할 수 있습니다. 핵심은 전체를 다시 그리는 것이 아니라, 필요한 변경만 계산해서 실제 DOM에 적용하는 구조를 직접 구현했다는 점입니다.

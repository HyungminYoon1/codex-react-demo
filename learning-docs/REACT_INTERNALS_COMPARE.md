# React 내부 모듈 구조와 codex-react 비교 문서

이 문서는 React 내부 모듈들이 어떤 역할을 하는지 큰 흐름 기준으로 설명하고, 현재 `codex-react` 시스템에서는 어떤 모듈이 빠져 있는지, 구현된 모듈은 React 원본과 어떻게 다른지를 함께 비교하기 위한 문서입니다.

이 문서의 목적은 두 가지입니다.

- React 내부 구조를 발표용으로 설명할 수 있게 정리하기
- `codex-react`가 React의 어느 부분을 단순화해서 구현했는지 정확히 이해하기

참고 관점:

- React 공식 문서의 `Render and Commit`
- React 저장소 `packages` 구조

---

## 1. React 내부 구조를 한 장으로 보면

React를 아주 단순하게 도식화하면 아래와 같습니다.

```text
사용자 코드
  └─ JSX / Component / Hooks
      └─ react
          └─ React Element 트리 생성
              └─ react-reconciler
                  ├─ Fiber 트리 구성
                  ├─ render phase 수행
                  ├─ 변경점 계산
                  └─ scheduler와 협력
                      └─ react-dom / react-dom-bindings
                          ├─ 실제 DOM 생성/갱신
                          ├─ 이벤트 연결
                          └─ commit phase 수행
                              └─ 브라우저 DOM 반영
```

핵심은 아래 두 문장입니다.

- `react`는 주로 "무엇을 그릴지"를 표현하는 계층입니다.
- `react-dom`과 `react-reconciler`는 "어떻게 계산하고, 어떻게 실제 DOM에 반영할지"를 담당합니다.

---

## 2. React 원본에서 자주 언급되는 핵심 모듈

React 저장소의 `packages`에는 실제로 매우 많은 패키지가 있지만, 학습용으로 중요한 것은 아래 몇 가지입니다.

| 모듈 | 역할 | 한 줄 설명 |
| --- | --- | --- |
| `react` | element, component, hooks API | 사용자 코드가 직접 쓰는 핵심 API |
| `react-dom` | DOM 렌더러 진입점 | 웹 브라우저에 렌더링할 때 사용하는 패키지 |
| `react-dom-bindings` | DOM 전용 host binding | 실제 DOM 생성, 속성 반영, 이벤트 연결 |
| `react-reconciler` | reconciliation 엔진 | Fiber 트리, render phase, 변경 계산 |
| `scheduler` | 작업 스케줄링 | 언제 어떤 우선순위로 작업할지 관리 |
| `shared` | 공용 상수/유틸 | 여러 패키지가 함께 쓰는 내부 유틸리티 |

즉 React는 하나의 거대한 파일이 아니라, 역할별로 분리된 내부 모듈들의 조합입니다.

---

## 3. React 내부 동작 흐름

공식 문서 기준으로 React의 화면 갱신은 크게 세 단계로 설명할 수 있습니다.

```text
1. Trigger
2. Render
3. Commit
```

이를 내부 모듈과 연결하면 아래와 같이 볼 수 있습니다.

```text
state/props 변경
  └─ Trigger
      └─ scheduler가 작업 시점/우선순위 조정
          └─ react-reconciler가 render phase 수행
              ├─ 컴포넌트 호출
              ├─ 새 element 트리 계산
              ├─ Fiber 트리 비교
              └─ 변경점 계산
                  └─ react-dom / react-dom-bindings가 commit phase 수행
                      ├─ DOM 생성
                      ├─ DOM 삽입/삭제/이동
                      ├─ props 반영
                      └─ 브라우저가 paint 수행
```

중요한 점은 React가 처음부터 끝까지 DOM만 만지는 것이 아니라:

- 먼저 계산하고
- 그다음 반영한다

는 구조를 가진다는 점입니다.

---

## 4. React 내부에서 Fiber는 어디에 속하는가

Fiber는 독립된 별도 패키지라기보다, 주로 `react-reconciler` 내부에서 사용하는 핵심 자료구조라고 이해하는 것이 좋습니다.

Fiber의 역할은 아래와 같습니다.

- 현재 작업 중인 노드를 표현
- 부모, 자식, 형제 관계 유지
- 이전 트리와 현재 트리를 연결
- 어떤 작업이 필요한지 플래그로 표시
- commit 단계로 넘길 정보 보관

즉 Fiber는 단순 트리 노드가 아니라, "렌더링 작업을 수행하기 위한 상태를 담는 작업 단위"입니다.

---

## 5. React 원본 구조를 codex-react에 대응시키면

현재 `codex-react`는 React 전체를 구현한 것이 아니라, 핵심 렌더링 흐름 일부를 학습용으로 분해해서 구현한 시스템입니다.

대응 관계를 단순화하면 아래처럼 볼 수 있습니다.

```text
React 원본                        codex-react
------------------------------------------------------------
react                            없음 (JSX/Component/Hook 계층 미구현)
react-reconciler                 src/lib/fiber/reconcile.js
Fiber 자료구조                   src/lib/fiber/reconcile.js 내부 createFiber
commit / host 반영               src/lib/fiber/commit.js
DOM 렌더링 바인딩                src/lib/vdom.js
scheduler                        없음
react-dom client root            src/main.js + initApp(container)
시각화/디버깅 툴                 src/playground/* + src/ui/*
```

즉 `codex-react`는 React 전체 중에서도 특히 아래 부분에 초점을 맞추고 있습니다.

- VDOM 표현
- 트리 비교
- 간소화된 Fiber
- effect 생성
- commit을 통한 실제 DOM 반영

---

## 6. 현재 codex-react에서 구현된 모듈

### 6-1. VDOM 계층

파일:

- `src/lib/vdom.js`

역할:

- HTML 또는 실제 DOM을 VDOM으로 변환
- VDOM(JSON)을 내부 표준 형태로 정규화
- VDOM을 실제 DOM으로 렌더링
- VDOM을 HTML / JSON 문자열로 직렬화
- key 추출과 트리 통계 계산

React 원본과의 차이:

- React는 JSX -> React element -> fiber 흐름이 중심입니다.
- `codex-react`는 직접 `type`, `tag`, `attrs`, `children`을 갖는 단순 VDOM 객체를 사용합니다.
- 컴포넌트 추상화가 아니라 host node 중심 구조입니다.

### 6-2. Reconciler 계층

파일:

- `src/lib/fiber/reconcile.js`

역할:

- 이전 트리와 다음 트리를 비교
- work-in-progress fiber 생성
- effect 목록 생성
- subtree flag 계산

React 원본과의 차이:

- React는 컴포넌트 렌더 결과, Hook 상태, lane, priority 등을 고려합니다.
- `codex-react`는 오직 host VDOM 트리 비교 중심입니다.
- 비교 범위도 host node 수준에 한정되어 있으며, 컴포넌트 트리 계산은 없습니다.

### 6-3. Commit 계층

파일:

- `src/lib/fiber/commit.js`

역할:

- effect 정렬
- DOM 삽입/삭제/이동
- props / text 반영

React 원본과의 차이:

- React는 commit 단계도 before mutation / mutation / layout 같은 더 세분화된 개념을 가집니다.
- `codex-react`는 effect를 정렬한 뒤 순차적으로 바로 DOM에 반영하는 단순 구조입니다.

### 6-4. App / Playground 계층

파일:

- `src/app.js`
- `src/playground/actions.js`
- `src/playground/state.js`
- `src/ui/*`

역할:

- HTML / VDOM 편집
- test preview 동기화
- commit 실행과 history snapshot 관리
- effect 카드, raw effect JSON, 통계 UI 표시

React 원본과의 차이:

- React 원본의 일부가 아니라 이 저장소만의 교육용 시각화 계층입니다.
- 학습용으로는 매우 유용하지만, React 내부의 표준 모듈과 직접 대응되는 부분은 아닙니다.

---

## 7. 현재 codex-react에서 빠진 React 원본 모듈

아래는 현재 시스템에서 빠졌거나, 아주 축소되어 있는 부분입니다.

### 7-1. `react` 계층 자체

빠진 것:

- JSX element 생성 체계
- 함수형 컴포넌트
- 클래스형 컴포넌트
- Hook 시스템
- Context
- Ref

의미:

현재 `codex-react`는 "컴포넌트를 실행해서 UI를 계산하는 React"가 아니라, "이미 만들어진 VDOM을 비교하고 반영하는 엔진"에 더 가깝습니다.

### 7-2. `scheduler`

빠진 것:

- 작업 우선순위
- 인터럽트 가능한 렌더링
- 시간 분할
- 동시성 관련 처리

의미:

현재 시스템은 `reconcileTrees -> commitRoot`가 한 번 호출되면 동기적으로 끝까지 수행됩니다.

### 7-3. `react-dom-bindings` 수준의 분리

빠진 것:

- 호스트 환경 추상화 계층
- DOM 전용 내부 바인딩 분리
- 이벤트 시스템과 렌더러 계층의 세밀한 분리

의미:

현재 시스템은 `vdom.js`와 `commit.js`에서 DOM 관련 처리를 직접 수행합니다. 즉 renderer abstraction이 얇습니다.

### 7-4. 컴포넌트 기반 render phase

빠진 것:

- 컴포넌트 함수 실행
- props / state 기반 render 결과 계산
- Hook 상태 보존과 재사용

의미:

현재 시스템의 "render"는 사실상 host VDOM과 실제 DOM 사이 변환에 가깝고, React의 컴포넌트 렌더 의미와는 다릅니다.

---

## 8. 구현된 모듈은 React와 어떻게 다른가

### 8-1. VDOM 표현 방식 차이

| 항목 | React 원본 | codex-react |
| --- | --- | --- |
| 기본 표현 | React element | 단순 VDOM 객체 |
| 입력 방식 | JSX, `createElement` | HTML 문자열, VDOM(JSON), 실제 DOM |
| 컴포넌트 포함 여부 | 포함 | 없음 |
| host element 중심 여부 | 아님 | 매우 강함 |

정리:

React는 "컴포넌트가 반환하는 element 트리"를 다루고, `codex-react`는 "이미 host 중심으로 평평해진 VDOM 트리"를 다룹니다.

### 8-2. Fiber 구조 차이

| 항목 | React 원본 | codex-react |
| --- | --- | --- |
| 목적 | 작업 분할, 우선순위, 상태 보존, commit 연결 | 트리 비교와 commit 연결 |
| 스케줄링 연계 | 있음 | 없음 |
| 컴포넌트 상태 보존 | 있음 | 없음 |
| lane / priority | 있음 | 없음 |
| 트리 연결 | 있음 | 있음 |

정리:

현재 시스템에도 Fiber는 구현되어 있지만, React Fiber의 전체 기능 중 "작업 단위와 변경 기록" 부분만 남긴 축소판에 가깝습니다.

### 8-3. Reconciler 차이

| 항목 | React 원본 | codex-react |
| --- | --- | --- |
| 비교 대상 | 컴포넌트 + host tree | host VDOM tree |
| key 활용 | 있음 | 있음 |
| 상태/Hook 영향 | 큼 | 없음 |
| 부분 중단/재개 | 가능 | 없음 |
| 결과 | Fiber tree + effects + lanes 등 | rootFiber + effects |

정리:

`codex-react`의 reconciler는 개념적으로는 React와 닮았지만, 범위는 훨씬 좁고 동기적입니다.

### 8-4. Commit 차이

| 항목 | React 원본 | codex-react |
| --- | --- | --- |
| 단계 분리 | 더 세밀함 | 단순 순차 반영 |
| host binding 분리 | 높음 | 낮음 |
| DOM 외 렌더러 확장성 | 높음 | 사실상 DOM 전용 |
| mutation 처리 | 정교함 | effect 순차 실행 |

정리:

현재 시스템의 commit은 "교육용으로 핵심만 남긴 DOM patcher"라고 볼 수 있습니다.

---

## 9. 도식으로 보는 React와 codex-react의 차이

### 9-1. React 원본

```text
JSX / Component / Hook
        │
        ▼
      react
        │
        ▼
 React Element 트리
        │
        ▼
 react-reconciler
   ├─ Fiber 생성
   ├─ render phase
   ├─ 변경 계산
   └─ scheduler와 협력
        │
        ▼
 react-dom / react-dom-bindings
   ├─ host operation
   ├─ event system
   └─ commit phase
        │
        ▼
     Browser DOM
```

### 9-2. codex-react

```text
HTML 문자열 / VDOM(JSON) / 실제 DOM / preview 입력
                    │
                    ▼
              src/lib/vdom.js
                    │
                    ▼
              단순 VDOM 트리
                    │
                    ▼
        src/lib/fiber/reconcile.js
          ├─ 간소화 Fiber 생성
          ├─ diff
          └─ effect 목록 생성
                    │
                    ▼
          src/lib/fiber/commit.js
          ├─ effect 정렬
          └─ 실제 DOM 반영
                    │
                    ▼
                Browser DOM
```

### 9-3. 가장 큰 차이

```text
React:
"컴포넌트 실행 + 스케줄링 + Fiber + commit"

codex-react:
"host VDOM 비교 + 간소화 Fiber + commit"
```

---

## 10. 발표할 때 강조하면 좋은 요약

### 요약 1

React 원본은 `react`, `react-dom`, `react-reconciler`, `scheduler` 같은 여러 내부 모듈이 협력하는 구조입니다.

### 요약 2

현재 `codex-react`는 그중에서도 특히 `Virtual DOM -> Reconciler -> Fiber -> Commit` 흐름을 학습용으로 단순화해서 구현한 시스템입니다.

### 요약 3

현재 시스템에 없는 핵심 원본 기능은 컴포넌트 모델, Hook 시스템, Scheduler, 이벤트 시스템, 동시성 처리입니다.

### 요약 4

현재 시스템에 구현된 Fiber는 React Fiber 전체가 아니라, 변경 계산과 commit 연결을 위한 간소화된 작업 단위입니다.

---

## 11. 한 줄 결론

React 원본은 "컴포넌트와 상태를 기반으로 UI를 계산하고, 스케줄링과 Fiber를 통해 효율적으로 실제 DOM에 반영하는 대형 시스템"이고, 현재 `codex-react`는 그중 "VDOM 비교, 간소화된 Fiber, commit"을 교육용으로 뽑아낸 작은 렌더링 실험 시스템입니다.

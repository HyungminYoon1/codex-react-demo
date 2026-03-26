# 코치님 예상 질문지

이 문서는 `codex-react` 시스템을 설명할 때 나올 수 있는 질문과 답변을 정리한 문서입니다. 질문은 크게 두 가지로 나눴습니다.

- `codex-react` 시스템 구현 관련 질문
- React 기본 개념 관련 질문

---

## 1. codex-react 시스템 구현 관련 예상 질문

### Q1. 이 프로젝트를 한 줄로 설명하면 무엇인가요?

브라우저 DOM을 Virtual DOM으로 변환하고, 이전 트리와 다음 트리를 비교해서 effect를 만든 뒤, 그 effect만 실제 DOM에 반영하는 작은 React 유사 렌더링 시스템입니다. 동시에 playground를 제공해서 diff와 commit 과정을 시각적으로 확인할 수 있게 만들었습니다.

### Q2. 왜 이 프로젝트를 만들었나요?

React의 핵심 아이디어인 Virtual DOM, reconciliation, Fiber, commit 과정을 직접 구현해 보면서 내부 동작을 학습하기 위해 만들었습니다. 단순히 결과만 보여주는 것이 아니라, 중간 산출물인 effect queue와 history snapshot까지 볼 수 있게 해서 학습용 가치가 높도록 설계했습니다.

### Q3. 전체 구조는 어떻게 나뉘어 있나요?

전체 구조는 크게 네 층으로 나뉩니다.

- `src/lib/vdom.js`: Virtual DOM 생성, 변환, 직렬화 담당
- `src/lib/fiber/`: reconciliation, flags, commit, metrics 담당
- `src/playground/`: editor, preview, commit, history 상태 흐름 담당
- `src/ui/`: shell과 패널 렌더링 담당

즉, 라이브러리 핵심 로직과 교육용 UI를 분리해서 관심사를 나눴습니다.

### Q4. 왜 VDOM과 Fiber를 분리했나요?

VDOM은 상태를 표현하는 자료구조이고, Fiber는 그 상태를 비교하고 반영하기 위한 작업 단위입니다. VDOM은 "무엇을 렌더링할지"를 나타내고, Fiber는 "어떻게 바꿀지"를 나타내기 때문에 역할이 달라 분리하는 것이 자연스럽다고 판단했습니다.

### Q5. Virtual DOM 노드는 어떤 형태로 설계했나요?

세 가지 타입으로 단순화했습니다.

- `root`: 루트 노드
- `element`: 태그, 속성, 자식 노드를 가지는 일반 엘리먼트
- `text`: 텍스트 노드

이렇게 최소 구조로 설계하면 diff 알고리즘을 설명하기 쉽고, 실제 DOM과의 매핑도 비교적 직관적입니다.

### Q6. HTML 문자열은 어떻게 Virtual DOM으로 바꾸나요?

`parseHtmlToVNode`에서 `template.innerHTML`을 사용해 문자열을 DOM으로 파싱한 뒤, 그 DOM을 다시 Virtual DOM으로 변환합니다. 이 방식을 쓰면 브라우저의 HTML 파서를 활용할 수 있어서 문자열 파서를 직접 구현하지 않아도 됩니다.

### Q7. VDOM(JSON) 편집 모드는 어떻게 처리하나요?

`parseVdomTextToVNode`로 JSON 문자열을 읽고, 내부 표준 구조로 정규화합니다. 그래서 사용자는 같은 상태를 HTML 표현과 VDOM 표현 양쪽에서 모두 실험해 볼 수 있습니다.

### Q8. 실제 DOM을 Virtual DOM으로 읽어오는 기능도 있나요?

있습니다. `domNodeToVNodeTree`를 사용하면 현재 화면에 있는 DOM 상태를 읽어서 Virtual DOM 형태로 만들 수 있습니다. 이 기능 덕분에 test preview를 직접 수정한 뒤에도 working tree를 다시 동기화할 수 있습니다.

### Q9. reconciliation은 어떤 흐름으로 동작하나요?

기본 흐름은 `previousTree`와 `nextTree`를 비교해서 work-in-progress fiber 트리를 만들고, 변화가 있는 지점에 effect를 쌓는 방식입니다. 텍스트가 바뀌면 `UPDATE_TEXT`, 속성이 바뀌면 `UPDATE_PROPS`, 노드가 추가되면 `INSERT_CHILD`, 이동하면 `MOVE_CHILD`, 삭제되면 `REMOVE_CHILD` effect를 만듭니다.

### Q10. 왜 reconcile 단계와 commit 단계를 분리했나요?

비교와 실제 DOM 변경을 분리하면 구조가 훨씬 명확해집니다. reconcile 단계는 순수 계산 단계이고, commit 단계는 부수효과를 가진 DOM 반영 단계입니다. 이렇게 나누면 테스트가 쉬워지고, effect 목록을 중간 결과로 확인할 수 있어서 디버깅과 학습에도 유리합니다.

### Q11. Fiber에서 flag는 왜 사용했나요?

각 fiber가 어떤 종류의 작업을 필요로 하는지 빠르게 표현하기 위해 비트마스크 flag를 사용했습니다. 현재는 `Placement`, `Update`, `ChildDeletion` 세 가지를 두고, effect 객체에도 같은 의미를 남겨서 UI와 commit 단계에서 함께 활용합니다.

### Q12. keyed diff는 어떻게 구현했나요?

자식 노드들이 모두 `data-key` 또는 `id`를 가지고 있으면 keyed diff를 사용합니다. 이전 자식 목록을 key 기준으로 `Map`에 담아 두고, 다음 자식 목록을 순회하면서 재사용 가능한지, 새로 삽입해야 하는지, 이동해야 하는지를 판단합니다. key가 불완전하면 index 기반 비교로 내려갑니다.

현재 시스템에서 key의 우선순위는 `data-key`가 먼저이고, 없으면 `id`, 둘 다 없으면 `null`입니다.

### Q13. commit 단계에서는 무엇을 하나요?

reconcile 단계에서 만들어 둔 effect 목록을 안전한 순서로 정렬해서 실제 DOM에 반영합니다. 삭제, 이동, 삽입, 속성 변경, 텍스트 변경을 실제 브라우저 DOM 연산으로 바꾸는 단계라고 보면 됩니다.

### Q14. 왜 commit 순서를 따로 정렬했나요?

삭제와 이동, 삽입, 업데이트는 순서에 따라 결과가 달라질 수 있기 때문입니다. 그래서 effect를 commit 전에 정렬해서 가능한 한 안전한 순서로 적용하도록 했습니다. 이 설계는 DOM 조작의 예측 가능성을 높이기 위한 선택입니다.

### Q15. input, textarea 같은 form 요소는 어떻게 처리했나요?

일반 속성만 보면 실제 사용자 입력 상태를 놓칠 수 있기 때문에, `input.value`, `input.checked`, `textarea.value`, `option.selected` 같은 현재 상태를 별도로 읽도록 처리했습니다. 즉, 단순 HTML 속성뿐 아니라 실제 DOM state까지 반영하려고 했습니다.

### Q16. playground에서는 무엇을 보여 주나요?

현재 playground는 다음 정보를 함께 보여 줍니다.

- Actual DOM
- Editor + Preview
- pending effect 카드 또는 마지막 commit 기록
- raw effect JSON
- history snapshot과 undo/redo
- 연산 종류별 통계 카드

즉 "다음 화면을 만드는 과정"과 "실제 commit 결과"를 동시에 볼 수 있습니다.

### Q17. serialize 기능은 왜 넣었나요?

Virtual DOM 상태를 다시 HTML 문자열이나 JSON 문자열로 바꾸는 기능은 editor 동기화와 디버깅에 유용합니다. 현재 playground에서는 HTML 편집기와 VDOM 편집기를 같은 working tree에 맞춰 유지하는 데 사용합니다.

### Q18. 현재 테스트는 무엇을 검증하나요?

현재 `tests/vdom.test.js`는 다음 내용을 중심으로 검증합니다.

- HTML을 Virtual DOM으로 잘 변환하는지
- reconciliation이 적절한 effect를 만드는지
- keyed child move가 `MOVE_CHILD` effect로 기록되는지
- child deletion flag가 올바르게 설정되는지
- commit 이후 실제 DOM이 기대 결과와 일치하는지
- form control의 live value를 잘 읽는지
- inline event attribute를 유지하는지

즉, 파싱부터 reconcile, commit까지의 핵심 경로를 최소한으로 점검하는 구조입니다.

### Q19. 현재 구현의 강점은 무엇인가요?

강점은 구조가 명확하다는 점입니다. VDOM, reconciliation, commit, playground UI가 분리되어 있어서 설명하기 좋고, 각 단계의 역할이 뚜렷합니다. 또한 effect 카드, raw effect JSON, history snapshot을 함께 보여 주기 때문에 학습용 프로젝트로서 강점이 큽니다.

### Q20. 현재 구현의 한계는 무엇인가요?

Scheduler가 없어서 전체 흐름이 동기적으로 실행됩니다. 또 컴포넌트 모델, Hook, React 이벤트 시스템 같은 상위 계층이 없고, 일부 복잡한 reorder 시나리오와 form control 제어 규약은 더 보완할 여지가 있습니다. 즉 현재 시스템은 실무용 React 대체재라기보다 렌더링 원리를 설명하는 교육용 시스템입니다.

### Q21. 이 프로젝트에 Fiber가 실제로 구현되어 있나요?

네, 구현되어 있습니다. 다만 React 전체 Fiber 아키텍처를 완전히 재현한 것은 아니고, 학습용으로 단순화한 Fiber 구조입니다. 현재 Fiber는 부모-자식-형제 연결, 이전 노드 참조, path, flags, subtreeFlags, deletions, effects 같은 정보를 담아서 reconciliation과 commit을 연결하는 작업 단위로 사용됩니다.

### Q22. 그러면 이 Fiber와 React Fiber의 차이는 무엇인가요?

현재 프로젝트의 Fiber는 변경 계산과 DOM 반영을 설명하기 위한 최소 구조입니다. 반면 실제 React Fiber는 스케줄링, 우선순위, 중단 가능한 렌더링, 동시성 같은 훨씬 복잡한 기능까지 포함합니다. 즉, 개념은 닮았지만 범위와 복잡도는 크게 다릅니다.

### Q23. 브라우저에서 실제 DOM은 어떤 객체로 다루나요?

가장 바깥은 `window`이고, 현재 페이지 문서는 `document`입니다. 실제 DOM 조작은 보통 `document.querySelector`, `createElement`, `appendChild`, `removeChild`, `setAttribute` 같은 API로 `Element`와 `Node`를 다루는 방식으로 이루어집니다.

### Q24. 실제 DOM이 느리다고 하는 이유는 무엇인가요?

실제 DOM 변경은 단순 객체 수정이 아니라 브라우저 렌더링 파이프라인과 연결됩니다. DOM이 바뀌면 스타일 재계산, 레이아웃 계산인 Reflow, 다시 그리는 Repaint가 발생할 수 있기 때문에 비용이 커질 수 있습니다. 그래서 Virtual DOM과 Diff를 통해 필요한 변경만 최소화하려는 것입니다.

### Q25. 현재 시스템에서 Diff 알고리즘이 다루는 핵심 변경 유형은 무엇인가요?

현재 시스템은 다섯 가지 핵심 변경을 effect로 다룹니다. 속성 변경은 `UPDATE_PROPS`, 텍스트 변경은 `UPDATE_TEXT`, 새 노드 추가는 `INSERT_CHILD`, 노드 삭제는 `REMOVE_CHILD`, 노드 이동은 `MOVE_CHILD`입니다. 이 다섯 가지를 구분하는 것이 최소 변경 전략의 핵심입니다.

---

## 2. React 기본 개념 관련 예상 질문

### Q1. React는 무엇인가요?

React는 사용자 인터페이스를 컴포넌트 단위로 작성할 수 있게 해 주는 JavaScript 라이브러리입니다. 핵심은 화면을 상태의 결과로 선언적으로 표현한다는 점입니다.

### Q2. 선언형 UI란 무엇인가요?

선언형 UI는 "어떻게 바꿀지"를 일일이 명령하는 대신, "어떤 상태에서 화면이 어떻게 보여야 하는지"를 기술하는 방식입니다. 그러면 내부 시스템이 이전 상태와 다음 상태를 비교해서 필요한 업데이트를 수행합니다.

### Q3. Virtual DOM은 무엇인가요?

Virtual DOM은 실제 DOM을 메모리 상의 객체 구조로 표현한 것입니다. 상태가 바뀌면 먼저 Virtual DOM끼리 비교하고, 그 결과를 바탕으로 실제 DOM에 필요한 최소 변경만 적용하려는 아이디어입니다.

### Q4. React는 항상 Virtual DOM 때문에 빠른가요?

항상 그렇다고 말할 수는 없습니다. Virtual DOM은 무조건 빠르다기보다, UI 갱신을 예측 가능하고 관리하기 쉽게 만들어 주는 전략입니다. 성능은 컴포넌트 구조, 렌더링 빈도, key 사용, 불필요한 재렌더 방지 등 여러 요소에 함께 영향을 받습니다.

### Q5. reconciliation은 무엇인가요?

reconciliation은 이전 렌더 결과와 다음 렌더 결과를 비교해서 어떤 부분을 업데이트해야 하는지 계산하는 과정입니다. React에서는 이 과정을 통해 실제 DOM 변경을 최소화하려고 합니다.

### Q6. key는 왜 필요한가요?

리스트 렌더링에서 key는 각 항목의 정체성을 나타냅니다. React는 key를 바탕으로 어떤 항목이 유지되고, 이동하고, 삭제되고, 새로 생겼는지를 구분합니다. 그래서 key는 단순 경고 해소용이 아니라 diff 정확도에 직접 영향을 줍니다.

### Q7. key로 index를 쓰면 왜 위험한가요?

리스트 순서가 바뀌거나 중간에 삽입, 삭제가 발생하면 index는 항목의 정체성을 안정적으로 보장하지 못합니다. 그 결과 잘못된 DOM 재사용, 입력값 꼬임, 비효율적인 렌더링이 생길 수 있습니다.

### Q8. 렌더링과 commit의 차이는 무엇인가요?

렌더링은 다음 UI 결과를 계산하는 단계이고, commit은 그 계산 결과를 실제 DOM에 반영하는 단계입니다. 이 구분은 React 내부 동작을 이해할 때 매우 중요합니다.

### Q9. 컴포넌트란 무엇인가요?

컴포넌트는 UI와 로직을 하나의 독립된 단위로 묶은 것입니다. 재사용이 가능하고, 여러 컴포넌트를 조합해 더 큰 화면을 만들 수 있습니다.

### Q10. Hook은 왜 등장했나요?

함수형 컴포넌트에서도 상태와 생명주기 로직을 재사용 가능하게 다루기 위해 등장했습니다. Hook 덕분에 로직을 더 잘게 분리하고 재사용할 수 있게 됐습니다.

### Q11. controlled component는 무엇인가요?

입력값의 실제 기준이 React state에 있는 입력 컴포넌트입니다. 사용자가 입력하면 state를 갱신하고, 화면의 값도 그 state를 기준으로 다시 렌더링됩니다.

### Q12. 이 프로젝트와 실제 React의 차이는 무엇인가요?

이 프로젝트는 React의 핵심 아이디어 일부를 학습용으로 단순화한 구현입니다. 실제 React는 훨씬 복잡한 스케줄링, 동시성, 컴포넌트 모델, Hook 시스템, 이벤트 시스템, 서버 렌더링 등을 포함합니다. 하지만 Virtual DOM, reconciliation, commit을 분리해서 본다는 점에서는 중요한 공통 개념을 담고 있습니다.

---

## 3. 코치님께 설명할 때 추천하는 마무리 문장

이 프로젝트의 핵심은 "브라우저 DOM을 직접 다루는 대신, 먼저 Virtual DOM으로 상태를 표현하고, 비교 결과를 effect로 만든 뒤, 마지막에 필요한 DOM 변경만 반영한다"는 흐름을 직접 구현해 본 데 있습니다. 그래서 단순히 결과 화면을 만드는 프로젝트가 아니라, React가 왜 이런 구조를 사용하는지 이해하기 위한 학습용 시스템이라고 설명하면 좋습니다.

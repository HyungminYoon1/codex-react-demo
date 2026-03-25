const E = /* @__PURE__ */ new Set([
  "embed",
  "head",
  "iframe",
  "link",
  "meta",
  "object",
  "script",
  "style"
]), x = /* @__PURE__ */ new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]), T = /* @__PURE__ */ new Set(["code", "pre", "textarea"]);
function h(t = []) {
  return {
    type: "root",
    children: t
  };
}
function $(t) {
  return t ? t.type === "text" ? {
    type: "text",
    value: t.value
  } : {
    type: t.type,
    tag: t.tag,
    attrs: t.attrs ? { ...t.attrs } : void 0,
    children: t.children ? t.children.map($) : []
  } : null;
}
function k(t, e = document) {
  const r = e.createElement("template");
  return r.innerHTML = t, l(r.content);
}
function j(t) {
  const e = JSON.parse(t);
  return g(e, ["root"]);
}
function l(t) {
  return t ? t.nodeType === 11 ? h(
    Array.from(t.childNodes).map((e) => l(e)).filter(Boolean)
  ) : t.nodeType === 1 ? d(t) : t.nodeType === 3 ? A(t) : null : null;
}
function O(t) {
  return h(
    Array.from(t.childNodes).map((e) => l(e)).filter(Boolean)
  );
}
function A(t) {
  var n, i;
  const e = t.textContent ?? "", r = (i = (n = t.parentElement) == null ? void 0 : n.tagName) == null ? void 0 : i.toLowerCase();
  return !T.has(r) && e.trim() === "" ? null : {
    type: "text",
    value: e
  };
}
function d(t) {
  const e = t.tagName.toLowerCase();
  if (E.has(e))
    return null;
  const r = v(t, e);
  return e === "textarea" ? {
    type: "element",
    tag: e,
    attrs: r,
    children: []
  } : {
    type: "element",
    tag: e,
    attrs: r,
    children: Array.from(t.childNodes).map((n) => l(n)).filter(Boolean)
  };
}
function v(t, e) {
  const r = {};
  for (const n of Array.from(t.attributes))
    r[n.name] = n.value;
  if (e === "input") {
    const n = (t.getAttribute("type") || "").toLowerCase();
    (n === "checkbox" || n === "radio") && (t.checked ? r.checked = "" : delete r.checked), t.value !== void 0 && (r.value = t.value);
  }
  return e === "textarea" && (r.value = t.value ?? ""), e === "option" && (t.selected ? r.selected = "" : delete r.selected), r;
}
function w(t) {
  var e, r;
  return !t || t.type !== "element" ? null : ((e = t.attrs) == null ? void 0 : e["data-key"]) || ((r = t.attrs) == null ? void 0 : r.id) || null;
}
function s(t, e = document) {
  var n;
  if (t.type === "root") {
    const i = e.createDocumentFragment();
    for (const o of t.children)
      i.append(s(o, e));
    return i;
  }
  if (t.type === "text")
    return e.createTextNode(t.value);
  const r = e.createElement(t.tag);
  for (const [i, o] of Object.entries(t.attrs || {}))
    b(r, i, o);
  if (t.tag === "textarea")
    return r.value = ((n = t.attrs) == null ? void 0 : n.value) ?? "", r;
  for (const i of t.children || [])
    r.append(s(i, e));
  return r;
}
function S(t, e) {
  const r = t.ownerDocument || document, n = s(e, r);
  t.replaceChildren(n);
}
function b(t, e, r) {
  if (e === "checked") {
    t.checked = !0, t.setAttribute("checked", "");
    return;
  }
  if (e === "value") {
    t.value = r ?? "", t.tagName.toLowerCase() !== "textarea" && t.setAttribute("value", r ?? "");
    return;
  }
  t.setAttribute(e, r ?? "");
}
function C(t, e) {
  e === "checked" && (t.checked = !1), e === "value" && (t.value = ""), t.removeAttribute(e);
}
function _(t) {
  return t.type === "root" ? t.children.map((e) => f(e, 0)).join(`
`) : f(t, 0);
}
function L(t) {
  return JSON.stringify(t, null, 2);
}
function f(t, e) {
  var o, p;
  if (t.type === "text")
    return `${a(e)}${c(t.value)}`;
  const r = Object.entries(t.attrs || {}).map(([u, m]) => m === "" ? u : `${u}="${D(m)}"`).join(" "), n = r ? `<${t.tag} ${r}>` : `<${t.tag}>`;
  if (t.tag === "textarea")
    return `${a(e)}${n}${c(((o = t.attrs) == null ? void 0 : o.value) ?? "")}</${t.tag}>`;
  if (x.has(t.tag))
    return `${a(e)}${n}`;
  if (!((p = t.children) != null && p.length))
    return `${a(e)}${n}</${t.tag}>`;
  if (t.children.length === 1 && t.children[0].type === "text" && t.children[0].value.length <= 48 && !t.children[0].value.includes(`
`))
    return `${a(e)}${n}${c(t.children[0].value)}</${t.tag}>`;
  const i = t.children.map((u) => f(u, e + 1)).join(`
`);
  return `${a(e)}${n}
${i}
${a(e)}</${t.tag}>`;
}
function a(t) {
  return "  ".repeat(t);
}
function c(t) {
  return String(t).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function D(t) {
  return c(t).replaceAll('"', "&quot;");
}
function M(t) {
  const e = {
    totalNodes: 0,
    elements: 0,
    textNodes: 0,
    keyedElements: 0,
    maxDepth: 0
  };
  return N(t, 0, (r, n) => {
    if (r.type === "root") {
      e.maxDepth = Math.max(e.maxDepth, n);
      return;
    }
    if (e.totalNodes += 1, e.maxDepth = Math.max(e.maxDepth, n), r.type === "text") {
      e.textNodes += 1;
      return;
    }
    e.elements += 1, w(r) && (e.keyedElements += 1);
  }), e;
}
function N(t, e, r) {
  var n;
  if (r(t, e), !!((n = t.children) != null && n.length))
    for (const i of t.children)
      N(i, e + 1, r);
}
function g(t, e) {
  if (!t || typeof t != "object" || Array.isArray(t))
    throw new Error(`${e.join(".")}는 vnode 객체여야 합니다.`);
  if (t.type === "root")
    return {
      type: "root",
      children: y(t.children, [...e, "children"])
    };
  if (t.type === "text") {
    if (typeof t.value != "string")
      throw new Error(`${e.join(".")}의 text.value는 문자열이어야 합니다.`);
    return {
      type: "text",
      value: t.value
    };
  }
  if (t.type === "element") {
    if (typeof t.tag != "string" || !t.tag.trim())
      throw new Error(`${e.join(".")}의 element.tag는 비어 있지 않은 문자열이어야 합니다.`);
    if (t.attrs !== void 0 && (typeof t.attrs != "object" || t.attrs === null || Array.isArray(t.attrs)))
      throw new Error(`${e.join(".")}의 element.attrs는 객체여야 합니다.`);
    const r = V(t.attrs || {}, [...e, "attrs"]), n = t.tag.toLowerCase();
    return n === "textarea" ? {
      type: "element",
      tag: n,
      attrs: r,
      children: []
    } : {
      type: "element",
      tag: n,
      attrs: r,
      children: y(t.children, [...e, "children"])
    };
  }
  throw new Error(`${e.join(".")}의 type은 root, element, text 중 하나여야 합니다.`);
}
function y(t, e) {
  if (t === void 0)
    return [];
  if (!Array.isArray(t))
    throw new Error(`${e.join(".")}는 배열이어야 합니다.`);
  return t.map((r, n) => g(r, [...e, String(n)]));
}
function V(t, e) {
  const r = {};
  for (const [n, i] of Object.entries(t)) {
    if (typeof i != "string")
      throw new Error(`${e.join(".")}의 "${n}" 값은 문자열이어야 합니다.`);
    r[n] = i;
  }
  return r;
}
export {
  $ as cloneVNode,
  M as countVNodeStats,
  h as createRootVNode,
  l as domNodeToVNode,
  O as domNodeToVNodeTree,
  w as getVNodeKey,
  S as mountVNode,
  k as parseHtmlToVNode,
  j as parseVdomTextToVNode,
  C as removeDomAttribute,
  s as renderVNode,
  _ as serializeVNodeToHtml,
  L as serializeVNodeToText,
  b as setDomAttribute
};

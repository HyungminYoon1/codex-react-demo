const y = /* @__PURE__ */ new Set([
  "embed",
  "head",
  "iframe",
  "link",
  "meta",
  "object",
  "script",
  "style"
]), E = /* @__PURE__ */ new Set([
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
function d(t) {
  return t ? t.type === "text" ? {
    type: "text",
    value: t.value
  } : {
    type: t.type,
    tag: t.tag,
    attrs: t.attrs ? { ...t.attrs } : void 0,
    children: t.children ? t.children.map(d) : []
  } : null;
}
function D(t, e = document) {
  const r = e.createElement("template");
  return r.innerHTML = t, o(r.content);
}
function o(t) {
  return t ? t.nodeType === 11 ? h(
    Array.from(t.childNodes).map((e) => o(e)).filter(Boolean)
  ) : t.nodeType === 1 ? g(t) : t.nodeType === 3 ? x(t) : null : null;
}
function k(t) {
  return h(
    Array.from(t.childNodes).map((e) => o(e)).filter(Boolean)
  );
}
function x(t) {
  var n, a;
  const e = t.textContent ?? "", r = (a = (n = t.parentElement) == null ? void 0 : n.tagName) == null ? void 0 : a.toLowerCase();
  return !T.has(r) && e.trim() === "" ? null : {
    type: "text",
    value: e
  };
}
function g(t) {
  const e = t.tagName.toLowerCase();
  if (y.has(e))
    return null;
  const r = $(t, e);
  return e === "textarea" ? {
    type: "element",
    tag: e,
    attrs: r,
    children: []
  } : {
    type: "element",
    tag: e,
    attrs: r,
    children: Array.from(t.childNodes).map((n) => o(n)).filter(Boolean)
  };
}
function $(t, e) {
  const r = {};
  for (const n of Array.from(t.attributes))
    r[n.name] = n.value;
  if (e === "input") {
    const n = (t.getAttribute("type") || "").toLowerCase();
    (n === "checkbox" || n === "radio") && (t.checked ? r.checked = "" : delete r.checked), t.value !== void 0 && (r.value = t.value);
  }
  return e === "textarea" && (r.value = t.value ?? ""), e === "option" && (t.selected ? r.selected = "" : delete r.selected), r;
}
function A(t) {
  var e, r;
  return !t || t.type !== "element" ? null : ((e = t.attrs) == null ? void 0 : e["data-key"]) || ((r = t.attrs) == null ? void 0 : r.id) || null;
}
function s(t, e = document) {
  var n;
  if (t.type === "root") {
    const a = e.createDocumentFragment();
    for (const c of t.children)
      a.append(s(c, e));
    return a;
  }
  if (t.type === "text")
    return e.createTextNode(t.value);
  const r = e.createElement(t.tag);
  for (const [a, c] of Object.entries(t.attrs || {}))
    v(r, a, c);
  if (t.tag === "textarea")
    return r.value = ((n = t.attrs) == null ? void 0 : n.value) ?? "", r;
  for (const a of t.children || [])
    r.append(s(a, e));
  return r;
}
function V(t, e) {
  const r = t.ownerDocument || document, n = s(e, r);
  t.replaceChildren(n);
}
function v(t, e, r) {
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
function O(t, e) {
  e === "checked" && (t.checked = !1), e === "value" && (t.value = ""), t.removeAttribute(e);
}
function _(t) {
  return t.type === "root" ? t.children.map((e) => f(e, 0)).join(`
`) : f(t, 0);
}
function f(t, e) {
  var c, p;
  if (t.type === "text")
    return `${i(e)}${l(t.value)}`;
  const r = Object.entries(t.attrs || {}).map(([u, m]) => m === "" ? u : `${u}="${b(m)}"`).join(" "), n = r ? `<${t.tag} ${r}>` : `<${t.tag}>`;
  if (t.tag === "textarea")
    return `${i(e)}${n}${l(((c = t.attrs) == null ? void 0 : c.value) ?? "")}</${t.tag}>`;
  if (E.has(t.tag))
    return `${i(e)}${n}`;
  if (!((p = t.children) != null && p.length))
    return `${i(e)}${n}</${t.tag}>`;
  if (t.children.length === 1 && t.children[0].type === "text" && t.children[0].value.length <= 48 && !t.children[0].value.includes(`
`))
    return `${i(e)}${n}${l(t.children[0].value)}</${t.tag}>`;
  const a = t.children.map((u) => f(u, e + 1)).join(`
`);
  return `${i(e)}${n}
${a}
${i(e)}</${t.tag}>`;
}
function i(t) {
  return "  ".repeat(t);
}
function l(t) {
  return String(t).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function b(t) {
  return l(t).replaceAll('"', "&quot;");
}
function w(t) {
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
    e.elements += 1, A(r) && (e.keyedElements += 1);
  }), e;
}
function N(t, e, r) {
  var n;
  if (r(t, e), !!((n = t.children) != null && n.length))
    for (const a of t.children)
      N(a, e + 1, r);
}
export {
  d as cloneVNode,
  w as countVNodeStats,
  h as createRootVNode,
  o as domNodeToVNode,
  k as domNodeToVNodeTree,
  A as getVNodeKey,
  V as mountVNode,
  D as parseHtmlToVNode,
  O as removeDomAttribute,
  s as renderVNode,
  _ as serializeVNodeToHtml,
  v as setDomAttribute
};

import { cloneVNode as g, getVNodeKey as f, removeDomAttribute as U, setDomAttribute as V, renderVNode as A } from "./vdom.js";
const I = 0, E = 1, m = 2, D = 4, w = {
  [E]: "Placement",
  [m]: "Update",
  [D]: "ChildDeletion"
};
function P(n) {
  return n === I ? ["NoFlags"] : Object.entries(w).filter(([t]) => (n & Number(t)) !== 0).map(([, t]) => t);
}
function Z(n) {
  return n.reduce(
    (t, e) => {
      switch (e.opType) {
        case "INSERT_CHILD":
          t.insert += 1;
          break;
        case "MOVE_CHILD":
          t.move += 1;
          break;
        case "REMOVE_CHILD":
          t.remove += 1;
          break;
        case "UPDATE_PROPS":
          t.attribute += 1;
          break;
        case "UPDATE_TEXT":
          t.text += 1;
          break;
      }
      return t;
    },
    {
      insert: 0,
      move: 0,
      remove: 0,
      attribute: 0,
      text: 0
    }
  );
}
function F(n) {
  return n.length ? `root > ${n.join(" > ")}` : "root";
}
function v(n, t) {
  const e = p(t, null, n, 0, []), o = [];
  return e.effects = o, C(e, n, t, o), S(e), {
    rootFiber: e,
    effects: o
  };
}
function p(n, t, e, o, a) {
  return {
    type: n.type,
    tag: n.tag,
    value: n.value,
    attrs: n.attrs ? { ...n.attrs } : void 0,
    vnode: g(n),
    key: f(n),
    parent: t,
    child: null,
    sibling: null,
    alternate: e ? g(e) : null,
    index: o,
    path: a,
    flags: I,
    subtreeFlags: I,
    effects: null,
    deletions: []
  };
}
function C(n, t, e, o) {
  if (e.type === "root") {
    R(n, (t == null ? void 0 : t.children) || [], e.children || [], o);
    return;
  }
  if (e.type === "text") {
    (t == null ? void 0 : t.value) !== e.value && j(n, e.value, o);
    return;
  }
  const a = X((t == null ? void 0 : t.attrs) || {}, e.attrs || {});
  (a.set || a.remove.length) && N(n, a, o), R(n, (t == null ? void 0 : t.children) || [], e.children || [], o);
}
function R(n, t, e, o) {
  z(t, e) ? K(n, t, e, o) : B(n, t, e, o);
}
function B(n, t, e, o) {
  let a = null;
  const c = Math.min(t.length, e.length);
  for (let s = 0; s < c; s += 1) {
    const u = t[s], l = e[s], i = n.path.concat(s);
    let r;
    k(u, l) ? (r = p(l, n, u, s, i), C(r, u, l, o)) : (T(n, u, s, o), r = p(l, n, null, s, i), y(r, "INSERT_CHILD", {
      parentPath: n.path,
      index: s,
      node: g(l)
    }, o)), a = L(n, a, r);
  }
  for (let s = c; s < e.length; s += 1) {
    const u = e[s], l = p(
      u,
      n,
      null,
      s,
      n.path.concat(s)
    );
    y(l, "INSERT_CHILD", {
      parentPath: n.path,
      index: s,
      node: g(u)
    }, o), a = L(n, a, l);
  }
  for (let s = t.length - 1; s >= e.length; s -= 1)
    T(n, t[s], s, o);
}
function K(n, t, e, o) {
  const a = new Map(
    t.map((l, i) => [f(l), { child: l, index: i }])
  ), c = /* @__PURE__ */ new Set();
  let s = 0, u = null;
  for (let l = 0; l < e.length; l += 1) {
    const i = e[l], r = f(i), d = a.get(r), _ = n.path.concat(l);
    let h;
    d ? k(d.child, i) ? (c.add(r), h = p(i, n, d.child, l, _), d.index < s ? y(h, "MOVE_CHILD", {
      parentPath: n.path,
      fromIndex: d.index,
      toIndex: l,
      key: r
    }, o) : s = d.index, C(h, d.child, i, o)) : (c.add(r), T(n, d.child, d.index, o), h = p(i, n, null, l, _), y(h, "INSERT_CHILD", {
      parentPath: n.path,
      index: l,
      node: g(i),
      key: r
    }, o)) : (h = p(i, n, null, l, _), y(h, "INSERT_CHILD", {
      parentPath: n.path,
      index: l,
      node: g(i),
      key: r
    }, o)), u = L(n, u, h);
  }
  for (let l = t.length - 1; l >= 0; l -= 1) {
    const i = t[l], r = f(i);
    c.has(r) || T(n, i, l, o);
  }
}
function L(n, t, e) {
  return n.child ? t && (t.sibling = e) : n.child = e, e;
}
function T(n, t, e, o) {
  n.flags |= D;
  const a = {
    opType: "REMOVE_CHILD",
    flags: D,
    flagNames: P(D),
    path: n.path.concat(e),
    parentPath: n.path,
    index: e,
    key: f(t),
    node: g(t)
  };
  n.deletions.push(a), o.push(a);
}
function y(n, t, e, o) {
  n.flags |= E, o.push({
    opType: t,
    flags: E,
    flagNames: P(E),
    path: n.path,
    ...e
  });
}
function N(n, t, e) {
  n.flags |= m, n.updatePayload = t, e.push({
    opType: "UPDATE_PROPS",
    flags: m,
    flagNames: P(m),
    path: n.path,
    payload: t
  });
}
function j(n, t, e) {
  n.flags |= m, e.push({
    opType: "UPDATE_TEXT",
    flags: m,
    flagNames: P(m),
    path: n.path,
    value: t
  });
}
function S(n) {
  let t = I, e = n.child;
  for (; e; )
    S(e), t |= e.flags, t |= e.subtreeFlags, e = e.sibling;
  n.subtreeFlags = t;
}
function X(n, t) {
  const e = {}, o = [], a = /* @__PURE__ */ new Set([...Object.keys(n), ...Object.keys(t)]);
  for (const c of a) {
    if (!(c in t)) {
      o.push(c);
      continue;
    }
    n[c] !== t[c] && (e[c] = t[c]);
  }
  return {
    set: Object.keys(e).length ? e : null,
    remove: o
  };
}
function k(n, t) {
  return !n || !t || n.type !== t.type ? !1 : n.type === "text" ? !0 : n.tag === t.tag;
}
function z(n, t) {
  if (!n.length || !t.length)
    return !1;
  const e = n.map((a) => f(a)), o = t.map((a) => f(a));
  return !e.every(Boolean) || !o.every(Boolean) ? !1 : new Set(e).size === e.length && new Set(o).size === o.length;
}
function tt(n, t) {
  const e = b(t.effects || []);
  for (const o of e)
    G(n, o);
}
function b(n) {
  const t = {
    REMOVE_CHILD: 0,
    MOVE_CHILD: 1,
    INSERT_CHILD: 2,
    UPDATE_PROPS: 3,
    UPDATE_TEXT: 4
  };
  return n.map((e, o) => ({ ...e, order: o })).sort((e, o) => {
    const a = t[e.opType] - t[o.opType];
    if (a !== 0)
      return a;
    if (e.opType === "REMOVE_CHILD" && o.opType === "REMOVE_CHILD") {
      const c = o.parentPath.length - e.parentPath.length;
      return c !== 0 ? c : o.index - e.index;
    }
    if (e.opType === "MOVE_CHILD" && o.opType === "MOVE_CHILD") {
      const c = x(e.parentPath, o.parentPath);
      return c !== 0 ? c : e.toIndex - o.toIndex;
    }
    if (e.opType === "INSERT_CHILD" && o.opType === "INSERT_CHILD") {
      const c = x(e.parentPath, o.parentPath);
      return c !== 0 ? c : e.index - o.index;
    }
    return x(e.path, o.path) || e.order - o.order;
  });
}
function x(n, t) {
  const e = Math.min(n.length, t.length);
  for (let o = 0; o < e; o += 1)
    if (n[o] !== t[o])
      return n[o] - t[o];
  return n.length - t.length;
}
function G(n, t) {
  switch (t.opType) {
    case "REMOVE_CHILD":
      $(n, t);
      return;
    case "MOVE_CHILD":
      q(n, t);
      return;
    case "INSERT_CHILD":
      J(n, t);
      return;
    case "UPDATE_PROPS":
      Q(n, t);
      return;
    case "UPDATE_TEXT":
      W(n, t);
  }
}
function $(n, t) {
  const e = O(n, t.parentPath);
  if (!e)
    return;
  const o = t.key && M(e, t.key) || e.childNodes[t.index];
  o && e.removeChild(o);
}
function q(n, t) {
  const e = O(n, t.parentPath);
  if (!e)
    return;
  const o = t.key ? M(e, t.key) : e.childNodes[t.fromIndex];
  if (!o)
    return;
  const a = Array.from(e.childNodes), c = a[t.toIndex] || null;
  if (!c) {
    e.appendChild(o);
    return;
  }
  a.indexOf(o) < t.toIndex ? e.insertBefore(o, c.nextSibling) : e.insertBefore(o, c);
}
function J(n, t) {
  const e = O(n, t.parentPath);
  if (!e)
    return;
  const o = e.childNodes[t.index] || null;
  e.insertBefore(
    A(t.node, e.ownerDocument || document),
    o
  );
}
function Q(n, t) {
  const e = H(n, t.path);
  if (e instanceof Element) {
    for (const o of t.payload.remove)
      U(e, o);
    for (const [o, a] of Object.entries(t.payload.set || {}))
      V(e, o, a);
  }
}
function W(n, t) {
  const e = H(n, t.path);
  e && (e.textContent = t.value);
}
function O(n, t) {
  return t.length ? H(n, t) : n;
}
function H(n, t) {
  var o;
  let e = n;
  for (const a of t)
    e = ((o = e == null ? void 0 : e.childNodes) == null ? void 0 : o[a]) || null;
  return e;
}
function M(n, t) {
  return Array.from(n.children).find((e) => e.getAttribute("data-key") === t || e.id === t) || null;
}
export {
  D as ChildDeletion,
  I as NoFlags,
  E as Placement,
  m as Update,
  tt as commitRoot,
  F as formatFiberPath,
  P as getFlagNames,
  v as reconcileTrees,
  Z as summarizeCommitOperations
};

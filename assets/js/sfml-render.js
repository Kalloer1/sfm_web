/*
 * SFML renderer + syntax highlighter
 * Depends on: sfml-parser.js (window.SFML)
 * Exposes: SFMLRender.render(ast, errors) -> HTML string
 *          SFMLRender.highlight(text) -> HTML string (for editor overlay)
 */
(function (root) {
  "use strict";
  const SFML = root.SFML;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const CMP_SYM = { gt: ">", lt: "<", ge: ">=", le: "<=", eq: "=" };
  const QUANT = { overall: "", every: "每个", some: "任一", one: "恰好一个", lone: "至多一个" };
  const TYPE_LABEL = { fluid: "流体", energy: "能量", chemical: "化学品", item: "" };

  function resName(r) {
    if (!r) return "";
    if (r.isString) return '"' + esc(r.raw) + '"';
    const parts = (r.parts || []).map(p => (p === "*" ? "任意" : esc(p)));
    if (r.type && TYPE_LABEL[r.type] !== undefined) {
      const t = TYPE_LABEL[r.type];
      // first segment is the type hint; remaining is id
      const rest = parts.slice(1).join(":");
      return (t ? t + ":" : "") + (rest || (r.type === "energy" || r.type === "fluid" || r.type === "chemical" ? "任意" : ""));
    }
    return parts.join(":");
  }

  function humanCond(e) {
    if (!e) return "?";
    if (e.type === "bool") return e.value ? "真" : "假";
    if (e.type === "redstone")
      return "红石信号" + (e.cmp ? " " + CMP_SYM[e.cmp] + " " + e.value : " 存在");
    if (e.type === "has") {
      const q = QUANT[e.setOp] ? QUANT[e.setOp] + " " : "";
      const labels = (e.labels && e.labels.labels ? e.labels.labels : []).map(l => esc(l.name)).join(", ");
      const res = (e.resources && e.resources.length)
        ? e.resources.map(resName).join(" / ")
        : "资源";
      const cmp = e.cmp ? " " + CMP_SYM[e.cmp] + " " + e.value : "";
      return q + labels + " 的 " + res + cmp;
    }
    if (e.op === "not") return "非(" + humanCond(e.expr) + ")";
    if (e.op === "and") return "(" + humanCond(e.left) + " 且 " + humanCond(e.right) + ")";
    if (e.op === "or") return "(" + humanCond(e.left) + " 或 " + humanCond(e.right) + ")";
    return "?";
  }

  function humanInterval(iv) {
    if (!iv) return "红石脉冲";
    if (iv.unit === null && iv.value === null) return "红石脉冲";
    const unit = iv.unit === "seconds" || iv.unit === "second" ? "秒" : "刻";
    const g = iv.global ? " (全局)" : "";
    const off = iv.offset ? " +" + iv.offset : "";
    return "每 " + iv.value + off + " " + unit + g;
  }

  function labelChips(la, cls) {
    if (!la || !la.labels || !la.labels.length) return `<span class="lbl ${cls}">—</span>`;
    const each = la.each ? `<span class="badge each">每个</span>` : "";
    const chips = la.labels.map(l =>
      `<span class="lbl ${cls}">${l.isString ? '"' + esc(l.name) + '"' : esc(l.name)}</span>`
    ).join("");
    const sides = la.sides && la.sides.length
      ? `<span class="badge side">${la.sides.map(s => esc(s)).join("/")}</span>` : "";
    const slots = la.slots && la.slots.length
      ? `<span class="badge slot">槽 ${la.slots.map(r => r[0] === r[1] ? r[0] : r[0] + "-" + r[1]).join(",")}</span>` : "";
    const rr = la.roundRobin ? `<span class="badge rr">轮询:${esc(la.roundRobin)}</span>` : "";
    return chips + each + sides + slots + rr;
  }

  function managerNode() {
    return `<span class="lbl mgr">🛠 管理器</span>`;
  }

  function limitChip(lim) {
    const parts = [];
    if (lim.quantity != null) parts.push("×" + lim.quantity);
    if (lim.retention != null) parts.push("留" + lim.retention);
    const res = lim.resources && lim.resources.length
      ? lim.resources.map(resName).join(" / ")
      : "任意资源";
    const ea = lim.each ? " 每个" : "";
    const withTxt = lim.with ? ` <span class="badge with">${lim.with.negated ? "不含" : "含"} ${esc(lim.with.raw)}</span>` : "";
    return `<span class="chip">${esc(res)} ${parts.join(" ")}${ea}${withTxt}</span>`;
  }

  function renderTransfer(st) {
    const dir = st.kind;
    const from = dir === "input" ? labelChips(st.labelAccess, "src") : managerNode();
    const to = dir === "output" ? labelChips(st.labelAccess, "dst") : managerNode();
    const chips = st.limits.map(limitChip).join("") ||
      `<span class="chip dim">${dir === "input" ? "全部物品" : "全部"}</span>`;
    const exc = st.except && st.except.length
      ? `<span class="badge exc">排除 ${st.except.map(r => esc(r.raw)).join(", ")}</span>` : "";
    const eachBadge = st.each ? `<span class="badge each">每个标签</span>` : "";
    return `<div class="xfer ${dir}">
      <div class="xfer-from">${from}</div>
      <div class="xfer-mid">
        <div class="xfer-dir">${dir === "input" ? "输入 ▶" : "▶ 输出"}</div>
        <div class="xfer-res">${chips}${exc}${eachBadge}</div>
      </div>
      <div class="xfer-to">${to}</div>
    </div>`;
  }

  function renderStatement(st, depth) {
    if (!st) return "";
    if (st.kind === "input" || st.kind === "output") return renderTransfer(st);
    if (st.kind === "forget")
      return `<div class="forget">🧹 清空输入缓存${st.labels && st.labels.length ? "：" + st.labels.map(l => esc(l.name)).join(", ") : ""}</div>`;
    if (st.kind === "if") {
      let h = `<div class="ifbox" style="margin-left:${depth * 14}px">
        <div class="if-cond">IF <code>${humanCond(st.cond)}</code></div>`;
      h += `<div class="if-branch"><div class="branch-label then">THEN</div><div class="branch-body">${(st.then || []).map(s => renderStatement(s, depth + 1)).join("") || '<div class="dim">（空）</div>'}</div></div>`;
      (st.elseIfs || []).forEach(e => {
        h += `<div class="if-branch"><div class="branch-label elseif">ELSE IF <code>${humanCond(e.cond)}</code></div><div class="branch-body">${(e.body || []).map(s => renderStatement(s, depth + 1)).join("") || '<div class="dim">（空）</div>'}</div></div>`;
      });
      if (st.else && st.else.length) {
        h += `<div class="if-branch"><div class="branch-label els">ELSE</div><div class="branch-body">${(st.else || []).map(s => renderStatement(s, depth + 1)).join("")}</div></div>`;
      }
      h += `</div>`;
      return h;
    }
    return `<div class="dim">（未知语句）</div>`;
  }

  function renderTrigger(t, i) {
    const head = t.type === "redstone" ? "红石脉冲" : humanInterval(t.interval);
    let h = `<div class="trigger">
      <div class="trigger-head"><span class="trig-dot"></span>触发器 ${i + 1} · <b>${esc(head)}</b></div>
      <div class="trigger-body">`;
    if (!t.body || !t.body.length) h += `<div class="dim">（空触发器）</div>`;
    else t.body.forEach(st => h += renderStatement(st, 0));
    h += `</div></div>`;
    return h;
  }

  function render(ast, errors) {
    if (!ast) return `<div class="empty">没有可显示的内容。</div>`;
    let h = "";
    if (errors && errors.length) {
      h += `<div class="errors"><b>⚠ 解析提示（${errors.length}）</b><ul>` +
        errors.map(e => `<li>第 ${e.line} 行：${esc(e.message)}</li>`).join("") + `</ul></div>`;
    }
    if (ast.name) h += `<div class="prog-name">程序名：<code>${esc(ast.name)}</code></div>`;
    if (!ast.triggers || !ast.triggers.length)
      h += `<div class="empty">暂无触发器。试试：<code>every 20 ticks do input from a output to b end</code></div>`;
    else ast.triggers.forEach((t, i) => h += renderTrigger(t, i));
    return h;
  }

  // ---- Syntax highlighter (display only) ----
  // Reinserts the original whitespace between tokens so the highlighted
  // overlay keeps newlines AND indentation (critical for the transparent
  // textarea overlay to line up, and for read-only code panels).
  function highlight(text) {
    if (!SFML || !SFML.tokenize) return esc(text);
    const src = text || "";
    const toks = SFML.tokenize(src);
    const kw = SFML.KEYWORDS || {};
    let out = "", lastEnd = 0;
    toks.forEach(t => {
      const s = (t.start != null) ? t.start : lastEnd;
      const e = (t.end != null) ? t.end : s + t.value.length;
      const ws = src.slice(lastEnd, s);
      if (ws) out += `<span class="tok-pln">${esc(ws)}</span>`;
      let cls = "tok-pln";
      if (t.type === "comment") cls = "tok-com";
      else if (t.type === "string") cls = "tok-str";
      else if (t.type === "number") cls = "tok-num";
      else if (t.type === "word") cls = kw[t.lower] ? "tok-kw" : "tok-lbl";
      else if (t.type === "sym") cls = "tok-sym";
      out += `<span class="${cls}">${esc(t.value)}</span>`;
      lastEnd = e;
    });
    const trail = src.slice(lastEnd);
    if (trail) out += `<span class="tok-pln">${esc(trail)}</span>`;
    return out;
  }

  root.SFMLRender = { render, highlight, humanCond, humanInterval };
})(typeof self !== "undefined" ? self : this);

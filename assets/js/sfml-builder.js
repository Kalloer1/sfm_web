/*
 * SFML 代码生成器（可视化表单 → SFML 文本）
 * Depends on: sfml-parser.js (window.SFML), sfml-render.js (window.SFMLRender)
 * Exposes:  window.SFMLBuilder.mount(rootEl, opts)
 *
 * 玩家通过下拉/输入框选择工厂逻辑，实时生成可复制进游戏的 SFML 代码，
 * 并复用解析器+渲染器实时展示工厂流程图。
 */
(function (root) {
  "use strict";
  const SFML = root.SFML;
  const R = root.SFMLRender;

  // ---------- tiny DOM helper ----------
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    if (props) for (const k in props) {
      const v = props[k];
      if (v == null) continue;
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k === "html") e.innerHTML = v;
      else if (k.slice(0, 2) === "on" && typeof v === "function") e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    }
    function append(c) {
      if (c == null || c === false) return;
      if (Array.isArray(c)) { c.forEach(append); return; }
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    kids.forEach(append);
    return e;
  }
  function selectEl(options, value, onChange) {
    const s = h("select", { class: "inp" });
    options.forEach(o => s.appendChild(h("option", { value: o.v }, o.t)));
    s.value = value;
    s.addEventListener("change", () => onChange(s.value));
    return s;
  }
  function inputEl(value, onInput, attrs) {
    const i = h("input", Object.assign({ class: "inp", type: "text", value: value == null ? "" : value }, attrs || {}));
    i.addEventListener("input", () => onInput(i.value));
    return i;
  }
  function numEl(value, onInput, attrs) {
    const i = h("input", Object.assign({ class: "inp", type: "number", value: value == null ? "" : value, min: "0" }, attrs || {}));
    i.addEventListener("input", () => onInput(i.value));
    return i;
  }
  function field(labelText, control, hint) {
    return h("label", { class: "fld" },
      h("span", { class: "fld-l" }, labelText),
      control,
      hint ? h("span", { class: "fld-h" }, hint) : null);
  }
  function checkEl(checked, onCheck, label) {
    const i = h("input", { type: "checkbox" }); i.checked = !!checked;
    i.addEventListener("change", () => onCheck(i.checked));
    return h("label", { class: "chk" }, i, label ? h("span", null, label) : null);
  }

  // ---------- option lists ----------
  const RES_TYPES = [
    { v: "item", t: "物品 item" },
    { v: "fluid", t: "流体 fluid" },
    { v: "energy", t: "能量 energy" },
    { v: "chemical", t: "化学品 chemical" }
  ];
  const SIDES = [
    { v: "", t: "（不限）" }, { v: "top", t: "上 top" }, { v: "bottom", t: "下 bottom" },
    { v: "north", t: "北 north" }, { v: "south", t: "南 south" }, { v: "east", t: "东 east" }, { v: "west", t: "西 west" }
  ];
  const COND_TYPES = [
    { v: "has", t: "拥有资源 has" }, { v: "redstone", t: "红石信号 redstone" }
  ];
  const QUANTS = [
    { v: "overall", t: "总体 overall" }, { v: "every", t: "每个 every" }, { v: "some", t: "任一 some" },
    { v: "one", t: "恰好一个 one" }, { v: "lone", t: "至多一个 lone" }
  ];
  const CMPS = [
    { v: "ge", t: "≥ ge" }, { v: "gt", t: "> gt" }, { v: "le", t: "≤ le" },
    { v: "lt", t: "< lt" }, { v: "eq", t: "= eq" }, { v: "ne", t: "≠ ne" }
  ];
  const STMT_KINDS = [
    { v: "input", t: "输入 input" }, { v: "output", t: "输出 output" },
    { v: "if", t: "条件 if" }, { v: "forget", t: "清空缓存 forget" }
  ];

  // ---------- model defaults ----------
  function defaultTrigger() {
    return { type: "every", intervalValue: 20, intervalUnit: "ticks", statements: [defaultStatement("input")] };
  }
  function defaultStatement(kind) {
    switch (kind) {
      case "input": return { kind: "input", count: "", resourceType: "item", resource: "", from: "a", side: "", retain: "" };
      case "output": return { kind: "output", count: "", resourceType: "item", resource: "", to: "b", side: "" };
      case "wait": return { kind: "wait", value: 10, unit: "ticks" };
      case "forget": return { kind: "forget", label: "a" };
      case "print": return { kind: "print", text: "" };
      case "if": return { kind: "if", condRows: [defaultCondRow()], then: [defaultStatement("input")], elseIfs: [], else: [] };
    }
    return { kind: "input", count: "", resourceType: "item", resource: "", from: "a", side: "", retain: "" };
  }
  function defaultCondRow() {
    return { connect: "and", negate: false, ctype: "has", quantifier: "overall", label: "a", comparator: "ge", count: "1", resourceType: "item", resource: "" };
  }
  function defaultModel() {
    return {
      programName: "我的工厂",
      triggers: [{
        type: "every", intervalValue: 20, intervalUnit: "ticks",
        statements: [
          { kind: "input", count: "64", resourceType: "item", resource: "iron_ingot", from: "a", side: "", retain: "" },
          { kind: "output", count: "", resourceType: "item", resource: "", to: "b", side: "" },
          { kind: "if", condRows: [defaultCondRow()], then: [{ kind: "output", count: "5", resourceType: "item", resource: "", to: "c", side: "" }], elseIfs: [], else: [] }
        ]
      }]
    };
  }

  // ---------- serialization (model -> SFML text) ----------
  function buildResource(type, res) {
    res = (res || "").trim();
    if (type === "item") return res || "*";
    if (type === "fluid") return "fluid:" + (res || "*");
    if (type === "energy") return "energy:" + (res || "*");
    if (type === "chemical") return "chemical:" + (res || "*");
    return res || "*";
  }
  function genInput(s, ind) {
    const parts = ["input"];
    const cnt = parseInt(s.count, 10);
    if (!isNaN(cnt) && cnt > 0) parts.push(cnt);
    if (s.resourceType && s.resourceType !== "item") parts.push(buildResource(s.resourceType, s.resource));
    else { const r = (s.resource || "").trim(); if (r) parts.push(r); }
    if ((s.from || "").trim()) {
      parts.push("from " + s.from.trim());
      if ((s.side || "").trim()) parts.push(s.side.trim() + " side");
    }
    const ret = parseInt(s.retain, 10);
    if (!isNaN(ret) && ret > 0) parts.push("retain " + ret);
    return ind + parts.join(" ");
  }
  function genOutput(s, ind) {
    const parts = ["output"];
    const cnt = parseInt(s.count, 10);
    if (!isNaN(cnt) && cnt > 0) parts.push(cnt);
    if (s.resourceType && s.resourceType !== "item") parts.push(buildResource(s.resourceType, s.resource));
    else { const r = (s.resource || "").trim(); if (r) parts.push(r); }
    if ((s.to || "").trim()) {
      parts.push("to " + s.to.trim());
      if ((s.side || "").trim()) parts.push(s.side.trim() + " side");
    }
    return ind + parts.join(" ");
  }
  function genCondRows(rows) {
    if (!rows || !rows.length) return "true";
    return rows.map((r, idx) => {
      let core;
      if (r.ctype === "redstone") {
        const cmp = r.comparator || "ge";
        const cnt = isNaN(parseInt(r.count, 10)) ? 1 : parseInt(r.count, 10);
        core = "redstone " + cmp + " " + cnt;
      } else {
        const q = (r.quantifier && r.quantifier !== "overall") ? r.quantifier + " " : "";
        const cnt = isNaN(parseInt(r.count, 10)) ? 1 : parseInt(r.count, 10);
        const res = buildResource(r.resourceType, r.resource);
        core = q + (r.label || "a").trim() + " has " + (r.comparator || "ge") + " " + cnt + " " + res;
      }
      if (r.negate) core = "not (" + core + ")";
      const c = idx > 0 ? (r.connect === "or" ? " or " : " and ") : "";
      return c + core;
    }).join("");
  }
  function genIf(s, ind) {
    const lines = [ind + "if " + genCondRows(s.condRows) + " then"];
    (s.then || []).forEach(st => lines.push(genStatement(st, ind + "    ")));
    (s.elseIfs || []).forEach(e => {
      lines.push(ind + "else if " + genCondRows(e.condRows) + " then");
      (e.body || []).forEach(st => lines.push(genStatement(st, ind + "    ")));
    });
    if (s.else && s.else.length) {
      lines.push(ind + "else");
      s.else.forEach(st => lines.push(genStatement(st, ind + "    ")));
    }
    lines.push(ind + "end");
    return lines.join("\n");
  }
  function genStatement(s, ind) {
    ind = ind || "";
    switch (s.kind) {
      case "input": return genInput(s, ind);
      case "output": return genOutput(s, ind);
      case "wait": return ind + "wait " + (s.value || 1) + " " + (s.unit || "ticks");
      case "forget": return ind + "forget " + ((s.label || "a").trim() || "a");
      case "print": { const t = (s.text || "").trim(); return ind + "print " + (t.indexOf(" ") >= 0 || t === "" ? '"' + t + '"' : t); }
      case "if": return genIf(s, ind);
      default: return ind + "-- (未知语句)";
    }
  }
  function generate(model) {
    const lines = [];
    if (model.programName && model.programName.trim()) lines.push('name "' + model.programName.trim() + '"');
    (model.triggers || []).forEach(t => {
      let head = t.type === "redstone"
        ? "on redstone pulse do"
        : "every " + (parseInt(t.intervalValue, 10) || 1) + " " + (t.intervalUnit || "ticks") + " do";
      lines.push(head);
      (t.statements || []).forEach(st => lines.push(genStatement(st, "    ")));
      lines.push("end");
    });
    return lines.join("\n") + "\n";
  }

  // ---------- mount ----------
  function mount(rootEl) {
    const state = { model: defaultModel(), currentCode: "" };

    // datalists (shared)
    const dlItems = h("datalist", { id: "sfmItems" },
      ["iron_ingot", "gold_ingot", "diamond", "coal", "sand", "red_sand", "glass", "dirt", "cobblestone", "stick", "minecraft:iron_ingot"]
        .map(x => h("option", { value: x })));
    const dlLabels = h("datalist", { id: "sfmLabels" },
      ["a", "b", "c", "chest", "furnace", "hopper", "tank", "generator", "input", "output"]
        .map(x => h("option", { value: x })));

    // layout
    const layout = h("div", { class: "builder-layout" });
    const formCard = h("div", { class: "card builder-form" });
    const outCol = h("div", { class: "builder-out" });

    // generated code card
    const codeCard = h("div", { class: "card code-card" });
    const codeHead = h("div", { class: "code-card-head" },
      h("span", { class: "code-card-title" }, "生成的 SFML 代码"),
      h("button", { class: "btn", type: "button", onclick: copyCode }, "复制代码"),
      h("button", { class: "btn", type: "button", onclick: downloadCode }, "下载 .sfm"));
    const codePre = h("pre", { class: "gen-code" }, h("code", { id: "genCode" }));
    codeCard.appendChild(codeHead); codeCard.appendChild(codePre);

    // diagram card
    const diagCard = h("div", { class: "card" }, h("div", { id: "builderDiagram" }));

    outCol.appendChild(codeCard); outCol.appendChild(diagCard);
    layout.appendChild(formCard); layout.appendChild(outCol);

    rootEl.appendChild(dlItems); rootEl.appendChild(dlLabels); rootEl.appendChild(layout);

    const formEl = formCard;
    const genCodeEl = codePre.querySelector("code");
    const diagramEl = diagCard.querySelector("#builderDiagram");

    function regen() {
      const code = generate(state.model);
      state.currentCode = code;
      genCodeEl.innerHTML = R ? R.highlight(code) : code;
      if (SFML) {
        const res = SFML.parse(code);
        diagramEl.innerHTML = R ? R.render(res.ast, res.errors) : "";
      }
    }

    function copyCode() {
      navigator.clipboard.writeText(state.currentCode).then(() => alert("已复制 SFML 代码，可直接粘贴进游戏！"))
        .catch(() => alert("复制失败，请手动选择代码复制。"));
    }
    function downloadCode() {
      const name = (state.model.programName || "program").replace(/[^\w\-]+/g, "_");
      const blob = new Blob([state.currentCode], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = name + ".sfm"; a.click();
      URL.revokeObjectURL(a.href);
    }

    // ---- form rendering ----
    function renderForm() {
      formEl.innerHTML = "";
      formEl.appendChild(h("div", { class: "b-tip" }, "标签（a / b / chest 等）需在你的存档中用标签枪贴好；下面每一步都会实时生成右侧代码。"));
      formEl.appendChild(field("程序名 name", inputEl(state.model.programName, v => { state.model.programName = v; regen(); }, { list: "sfmItems" })));
      state.model.triggers.forEach((trig, ti) => formEl.appendChild(renderTrigger(trig, ti)));
      formEl.appendChild(h("button", { class: "btn add wide", type: "button", onclick: () => { state.model.triggers.push(defaultTrigger()); renderForm(); regen(); } }, "+ 添加触发器"));
    }

    function renderTrigger(trig, ti) {
      const card = h("div", { class: "b-trig" });
      const head = h("div", { class: "b-trig-head" },
        h("span", { class: "b-trig-idx" }, "触发器 " + (ti + 1)),
        selectEl([{ v: "every", t: "定时 every" }, { v: "redstone", t: "红石 on redstone" }], trig.type, v => { trig.type = v; renderForm(); regen(); }));
      if (trig.type === "every") {
        head.appendChild(numEl(trig.intervalValue, v => { trig.intervalValue = v; regen(); }, { style: "width:72px" }));
        head.appendChild(selectEl([{ v: "ticks", t: "刻 ticks" }, { v: "seconds", t: "秒 seconds" }], trig.intervalUnit, v => { trig.intervalUnit = v; regen(); }));
      }
      head.appendChild(h("button", { class: "x", type: "button", title: "删除触发器", onclick: () => { state.model.triggers.splice(ti, 1); renderForm(); regen(); } }, "✕"));
      card.appendChild(head);
      card.appendChild(renderStmtList(trig.statements));
      return card;
    }

    function renderStmtList(list) {
      const wrap = h("div", { class: "b-stmts" });
      list.forEach((st, idx) => wrap.appendChild(renderStmt(st, list, idx)));
      const addSel = selectEl([{ v: "", t: "+ 添加语句…" }].concat(STMT_KINDS), "", v => {
        if (!v) return;
        list.push(defaultStatement(v)); addSel.value = ""; renderForm(); regen();
      });
      wrap.appendChild(addSel);
      return wrap;
    }

    function renderStmt(st, list, idx) {
      const card = h("div", { class: "b-stmt b-" + st.kind });
      const head = h("div", { class: "b-stmt-head" },
        selectEl(STMT_KINDS, st.kind, v => { Object.assign(st, defaultStatement(v)); renderForm(); regen(); }),
        h("button", { class: "x", type: "button", title: "删除", onclick: () => { list.splice(idx, 1); renderForm(); regen(); } }, "✕"));
      card.appendChild(head);
      card.appendChild(renderStmtFields(st));
      return card;
    }

    function renderStmtFields(st) {
      const box = h("div", { class: "b-fields" });
      if (st.kind === "input") {
        box.appendChild(field("数量", numEl(st.count, v => { st.count = v; regen(); }, { placeholder: "留空=全部", style: "width:90px" })));
        box.appendChild(field("资源类型", selectEl(RES_TYPES, st.resourceType, v => { st.resourceType = v; regen(); })));
        box.appendChild(field("资源", inputEl(st.resource, v => { st.resource = v; regen(); }, { list: "sfmItems", placeholder: "如 iron_ingot（留空=任意）" })));
        box.appendChild(field("来源标签 from", inputEl(st.from, v => { st.from = v; regen(); }, { list: "sfmLabels", placeholder: "a" })));
        box.appendChild(field("方块面 side", selectEl(SIDES, st.side, v => { st.side = v; regen(); })));
        box.appendChild(field("保留数量 retain", numEl(st.retain, v => { st.retain = v; regen(); }, { placeholder: "可选", style: "width:80px" })));
      } else if (st.kind === "output") {
        box.appendChild(field("数量", numEl(st.count, v => { st.count = v; regen(); }, { placeholder: "可选", style: "width:90px" })));
        box.appendChild(field("资源类型", selectEl(RES_TYPES, st.resourceType, v => { st.resourceType = v; regen(); })));
        box.appendChild(field("资源", inputEl(st.resource, v => { st.resource = v; regen(); }, { list: "sfmItems", placeholder: "如 sand（留空=全部）" })));
        box.appendChild(field("目标标签 to", inputEl(st.to, v => { st.to = v; regen(); }, { list: "sfmLabels", placeholder: "b" })));
        box.appendChild(field("方块面 side", selectEl(SIDES, st.side, v => { st.side = v; regen(); })));
      } else if (st.kind === "wait") {
        box.appendChild(field("时长", numEl(st.value, v => { st.value = v; regen(); }, { style: "width:90px" })));
        box.appendChild(field("单位", selectEl([{ v: "ticks", t: "刻 ticks" }, { v: "seconds", t: "秒 seconds" }], st.unit, v => { st.unit = v; regen(); })));
      } else if (st.kind === "forget") {
        box.appendChild(field("标签", inputEl(st.label, v => { st.label = v; regen(); }, { list: "sfmLabels" })));
      } else if (st.kind === "print") {
        box.appendChild(field("文本", inputEl(st.text, v => { st.text = v; regen(); }, { placeholder: "要打印的内容" })));
      } else if (st.kind === "if") {
        box.appendChild(renderCondRows(st.condRows));
        box.appendChild(h("div", { class: "b-branch" }, h("span", { class: "branch-tag then" }, "THEN"), renderStmtList(st.then)));
        st.elseIfs.forEach((e, ei) => {
          const eb = h("div", { class: "b-branch" },
            h("span", { class: "branch-tag elseif" }, "ELSE IF"),
            h("button", { class: "x", type: "button", title: "删除", onclick: () => { st.elseIfs.splice(ei, 1); renderForm(); regen(); } }, "✕"),
            renderCondRows(e.condRows),
            renderStmtList(e.body));
          box.appendChild(eb);
        });
        box.appendChild(h("button", { class: "btn small", type: "button", onclick: () => { st.elseIfs.push({ condRows: [defaultCondRow()], body: [defaultStatement("input")] }); renderForm(); regen(); } }, "+ 添加 ELSE IF"));
        if (st.else && st.else.length) {
          box.appendChild(h("div", { class: "b-branch" },
            h("span", { class: "branch-tag els" }, "ELSE"),
            h("button", { class: "x", type: "button", title: "删除", onclick: () => { st.else = []; renderForm(); regen(); } }, "✕"),
            renderStmtList(st.else)));
        } else {
          box.appendChild(h("button", { class: "btn small", type: "button", onclick: () => { st.else = [defaultStatement("input")]; renderForm(); regen(); } }, "+ 添加 ELSE 分支"));
        }
      }
      return box;
    }

    function renderCondRows(rows) {
      const wrap = h("div", { class: "b-conds" });
      rows.forEach((row, ri) => {
        const r = h("div", { class: "b-cond" });
        if (ri > 0) r.appendChild(selectEl([{ v: "and", t: "且 and" }, { v: "or", t: "或 or" }], row.connect, v => { row.connect = v; regen(); }));
        r.appendChild(checkEl(row.negate, v => { row.negate = v; regen(); }, "非"));
        r.appendChild(selectEl(COND_TYPES, row.ctype, v => { row.ctype = v; renderForm(); regen(); }));
        if (row.ctype === "has") {
          r.appendChild(selectEl(QUANTS, row.quantifier, v => { row.quantifier = v; regen(); }));
          r.appendChild(inputEl(row.label, v => { row.label = v; regen(); }, { list: "sfmLabels", placeholder: "标签", style: "width:84px" }));
          r.appendChild(selectEl(CMPS, row.comparator, v => { row.comparator = v; regen(); }));
          r.appendChild(numEl(row.count, v => { row.count = v; regen(); }, { style: "width:60px" }));
          r.appendChild(selectEl(RES_TYPES, row.resourceType, v => { row.resourceType = v; regen(); }));
          r.appendChild(inputEl(row.resource, v => { row.resource = v; regen(); }, { list: "sfmItems", placeholder: "资源(留空=任意)", style: "width:120px" }));
        } else {
          r.appendChild(selectEl(CMPS, row.comparator, v => { row.comparator = v; regen(); }));
          r.appendChild(numEl(row.count, v => { row.count = v; regen(); }, { style: "width:60px" }));
        }
        if (rows.length > 1) r.appendChild(h("button", { class: "x", type: "button", title: "删除条件", onclick: () => { rows.splice(ri, 1); renderForm(); regen(); } }, "✕"));
        wrap.appendChild(r);
      });
      wrap.appendChild(h("button", { class: "btn small", type: "button", onclick: () => { rows.push(defaultCondRow()); renderForm(); regen(); } }, "+ 添加条件"));
      return wrap;
    }

    renderForm();
    regen();
  }

  root.SFMLBuilder = { mount, generate };
})(typeof self !== "undefined" ? self : this);

/*
 * SFML parser — Super Factory Manager Language
 * Recursive-descent parser modelled on platform/minecraft/src/main/antlr/sfml/SFML.g4
 * Exposes SFML.parse(text) -> { ok, ast, errors }
 *   ast: { name, triggers: [...] }
 * Works in browser (window.SFML) and Node (module.exports).
 */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory();
  else root.SFML = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const RESERVED = new Set([
    "from", "to", "input", "output", "if", "forget", "every", "end", "else",
    "then", "do", "name", "has", "except", "with", "without", "retain", "each",
    "round", "robin", "by", "slots", "slot", "and", "or", "not", "true", "false",
    "redstone", "pulse", "global", "ticks", "tick", "seconds", "second", "top",
    "bottom", "north", "east", "south", "west", "side", "left", "right", "front",
    "back", "null", "gt", "lt", "eq", "le", "ge", "in", "overall", "some", "one", "lone"
  ]);

  const SIDES = new Set([
    "top", "bottom", "north", "east", "south", "west", "left", "right", "front", "back", "null"
  ]);

  const RES_TYPE_HINT = new Set(["item", "fluid", "energy", "chemical"]);

  // set quantifiers (per SFML.g4 setOp) and condition verbs used for lookahead
  const QUANT_WORDS = { overall: 1, some: 1, every: 1, each: 1, one: 1, lone: 1 };
  const VERB_WORDS = { has: 1, lacks: 1, is: 1, isnt: 1, running: 1 };

  // ---------- Tokenizer ----------
  function tokenize(src) {
    const toks = [];
    let i = 0, line = 1;
    const n = src.length;
    while (i < n) {
      const c = src[i];
      const start = i;
      if (c === "\n") { line++; i++; continue; }
      if (c === " " || c === "\t" || c === "\r") { i++; continue; }
      // comment
      if (c === "-" && src[i + 1] === "-") {
        while (i < n && src[i] !== "\n") i++;
        continue;
      }
      // string
      if (c === '"') {
        let j = i + 1, val = "";
        while (j < n && src[j] !== '"') {
          if (src[j] === "\\" && src[j + 1] === '"') { val += '"'; j += 2; continue; }
          val += src[j]; j++;
        }
        toks.push({ type: "string", value: val, start, end: j + 1, line });
        i = j + 1; continue;
      }
      // number (with optional trailing g/G meaning GLOBAL)
      if (c >= "0" && c <= "9") {
        let j = i, val = "";
        while (j < n && src[j] >= "0" && src[j] <= "9") { val += src[j]; j++; }
        let global = false;
        if (src[j] === "g" || src[j] === "G") { global = true; j++; }
        toks.push({ type: "number", value: val, global, start, end: j, line });
        i = j; continue;
      }
      // word: [a-zA-Z_*][a-zA-Z0-9_*]*
      if (/[a-zA-Z_*]/.test(c)) {
        let j = i;
        while (j < n && /[a-zA-Z0-9_*]/.test(src[j])) j++;
        const raw = src.slice(i, j);
        toks.push({ type: "word", value: raw, lower: raw.toLowerCase(), start, end: j, line });
        i = j; continue;
      }
      // multi-char symbols
      const two = src.slice(i, i + 2);
      if (two === "<=" || two === ">=") {
        toks.push({ type: "sym", value: two, start, end: i + 2, line }); i += 2; continue;
      }
      // single symbols
      if ("><=+:/-#(),*".indexOf(c) !== -1) {
        toks.push({ type: "sym", value: c, start, end: i + 1, line }); i++; continue;
      }
      // unknown — skip
      i++;
    }
    return toks;
  }

  // ---------- Parser ----------
  function Parser(toks) {
    this.toks = toks;
    this.i = 0;
    this.errors = [];
  }
  Parser.prototype.atEnd = function () { return this.i >= this.toks.length; };
  Parser.prototype.peek = function (k) { return this.toks[this.i + (k || 0)]; };
  Parser.prototype.next = function () { return this.toks[this.i++]; };
  Parser.prototype.isWord = function (kw) {
    const t = this.peek();
    return !!t && t.type === "word" && t.lower === kw;
  };
  Parser.prototype.isSym = function (s) {
    const t = this.peek();
    return !!t && t.type === "sym" && t.value === s;
  };
  Parser.prototype.err = function (msg, tok) {
    this.errors.push({ message: msg, line: tok ? tok.line : (this.peek() ? this.peek().line : 0) });
  };
  Parser.prototype.expectWord = function (kw) {
    if (this.isWord(kw)) return this.next();
    this.err("缺少关键字 '" + kw + "'", this.peek());
    return null;
  };
  Parser.prototype.expectSym = function (s) {
    if (this.isSym(s)) return this.next();
    this.err("缺少符号 '" + s + "'", this.peek());
    return null;
  };
  Parser.prototype.parseNumber = function () {
    const t = this.peek();
    if (t && t.type === "number") { this.next(); return parseInt(t.value, 10); }
    return null;
  };

  Parser.prototype.parseProgram = function () {
    const ast = { name: null, triggers: [] };
    if (this.isWord("name")) ast.name = this.parseName();
    while (!this.atEnd()) {
      if (this.isWord("every")) {
        ast.triggers.push(this.parseTrigger());
      } else if (this.isWord("on")) {
        ast.triggers.push(this.parseTrigger());
      } else {
        const t = this.peek();
        this.err("意外的标记，期望触发器(every 或 on)", t);
        while (!this.atEnd() && !this.isWord("every") && !this.isWord("on")) this.next();
      }
    }
    return ast;
  };

  Parser.prototype.parseName = function () {
    this.next(); // name
    const t = this.peek();
    if (t && t.type === "string") { this.next(); return t.value; }
    this.err("name 后应跟字符串，如 name \"示例\"", t);
    return null;
  };

  Parser.prototype.parseTrigger = function () {
    let type = "timer", interval = null;
    if (this.isWord("on")) {
      this.next(); // on
      this.expectWord("redstone");
      if (this.isWord("pulse")) this.next(); // optional 'pulse'
      type = "redstone";
    } else {
      this.next(); // every
      if (this.isWord("redstone")) {
        // every redstone [pulse] do  -> redstone pulse interval trigger
        this.next();
        if (this.isWord("pulse")) this.next();
        type = "redstone";
        interval = { value: null, unit: "redstone-pulse", global: false, offset: 0 };
      } else {
        interval = this.parseInterval();
      }
    }
    this.expectWord("do");
    const body = this.parseStatementsUntil("end");
    this.expectWord("end");
    return { type, interval, body };
  };

  Parser.prototype.parseInterval = function () {
    let value = null, global = false, offset = 0, unit = null;
    let t = this.peek();
    if (t && t.type === "number") {
      value = parseInt(t.value, 10);
      if (t.global) global = true;
      this.next();
    }
    if (this.isWord("global")) { this.next(); global = true; }
    if (this.isSym("+")) {
      this.next();
      const o = this.parseNumber();
      if (o !== null) offset = o;
    }
    t = this.peek();
    if (t && t.type === "word" && ["ticks", "tick", "seconds", "second"].indexOf(t.lower) !== -1) {
      unit = t.lower; this.next();
    } else {
      this.err("触发器缺少时间单位(ticks/seconds)", t);
    }
    return { value, global, offset, unit };
  };

  Parser.prototype.parseStatementsUntil = function (stopWord) {
    const body = [];
    while (!this.atEnd()) {
      const t = this.peek();
      if (t.type === "word" && (t.lower === stopWord || t.lower === "else")) break;
      body.push(this.parseStatement());
    }
    return body;
  };

  Parser.prototype.parseStatement = function () {
    const t = this.peek();
    if (!t) { this.err("意外的文件结束", null); return null; }
    if (this.isWord("if")) return this.parseIf();
    if (this.isWord("forget")) return this.parseForget();
    if (this.isWord("input") || this.isWord("from")) { this.next(); return this.parseIO("input"); }
    if (this.isWord("output") || this.isWord("to")) { this.next(); return this.parseIO("output"); }
    this.err("无法识别的语句: '" + (t.value || t.value) + "'", t);
    this.next();
    return null;
  };

  Parser.prototype.parseIf = function () {
    this.next(); // if
    const cond = this.parseBoolExpr();
    this.expectWord("then");
    const thenBody = this.parseStatementsUntil("end");
    const elseIfs = [];
    let elseBody = null;
    while (this.isWord("else")) {
      this.next();
      if (this.isWord("if")) {
        this.next();
        const c = this.parseBoolExpr();
        this.expectWord("then");
        const b = this.parseStatementsUntil("end");
        elseIfs.push({ cond: c, body: b });
      } else {
        elseBody = this.parseStatementsUntil("end");
        break;
      }
    }
    this.expectWord("end");
    return { kind: "if", cond, then: thenBody, elseIfs, else: elseBody };
  };

  Parser.prototype.parseForget = function () {
    this.next(); // forget
    const labels = [];
    const FORGET_STOP = new Set(["end", "else", "then", "do", "every", "if", "input", "output", "from", "to", "forget"]);
    function isLabelTok(t) {
      if (!t) return false;
      if (t.type === "string") return true;
      if (t.type === "word" && !FORGET_STOP.has(t.lower)) return true;
      return false;
    }
    if (isLabelTok(this.peek())) {
      const t = this.next();
      labels.push({ name: t.value, isString: t.type === "string" });
    }
    while (this.isSym(",")) {
      this.next();
      if (isLabelTok(this.peek())) {
        const t = this.next();
        labels.push({ name: t.value, isString: t.type === "string" });
      } else break;
    }
    return { kind: "forget", labels };
  };

  Parser.prototype.parseIO = function (direction) {
    const anchorExpected = direction === "input" ? "from" : "to";
    const limits = [], except = [];
    let labelAccess = null, withClause = null, eachLabels = false;
    while (!this.atEnd()) {
      const t = this.peek();
      if (!t) break;
      if (t.type === "sym" && t.value === ",") { this.next(); continue; }
      if (this.isWord("except")) { this.next(); except.push.apply(except, this.parseResourceIdList()); continue; }
      if (this.isWord("with") || this.isWord("without")) {
        const neg = this.isWord("without"); this.next();
        withClause = this.parseWithClause(neg); continue;
      }
      if (this.isWord(anchorExpected)) {
        this.next();
        if (this.isWord("each")) { this.next(); eachLabels = true; }
        labelAccess = this.parseLabelAccess();
        continue;
      }
      if (this.isWord("each")) { // each before label access (shouldn't normally happen here)
        this.next(); eachLabels = true; continue;
      }
      if (this.isWord("retain") || this.isResourceLimitStart(t)) { limits.push(this.parseResourceLimit()); continue; }
      break;
    }
    return { kind: direction, limits, labelAccess, except, with: withClause, each: eachLabels };
  };

  Parser.prototype.isResourceLimitStart = function (t) {
    if (!t) return false;
    if (t.type === "number") return true;
    if (t.type === "string") return true;
    if (t.type === "word" && t.value === "*") return true;
    if (t.type === "word" && !RESERVED.has(t.lower)) return true;
    return false;
  };

  Parser.prototype.parseResourceLimit = function () {
    const limit = { quantity: null, retention: null, each: false, resources: [], with: null };
    let t = this.peek();
    if (t && t.type === "number") {
      limit.quantity = parseInt(t.value, 10); this.next();
      if (this.isWord("each")) { this.next(); limit.each = true; }
    }
    if (this.isWord("retain")) {
      this.next();
      const r = this.parseNumber();
      if (r !== null) limit.retention = r;
      if (this.isWord("each")) { this.next(); limit.each = true; }
    }
    while (this.isResourceIdStart(this.peek())) {
      limit.resources.push(this.parseResourceId());
      if (this.isWord("or")) { this.next(); continue; }
      break;
    }
    if (this.isWord("with") || this.isWord("without")) {
      const neg = this.isWord("without"); this.next();
      limit.with = this.parseWithClause(neg);
    }
    return limit;
  };

  Parser.prototype.parseResourceIdList = function () {
    const list = [];
    if (this.isResourceIdStart(this.peek())) list.push(this.parseResourceId());
    while (this.isSym(",")) {
      this.next();
      if (this.isResourceIdStart(this.peek())) list.push(this.parseResourceId());
      else break;
    }
    return list;
  };

  Parser.prototype.isResourceIdStart = function (t) {
    if (!t) return false;
    if (t.type === "string") return true;
    if (t.type === "word" && t.value === "*") return true;
    if (t.type === "word" && !RESERVED.has(t.lower)) return true;
    return false;
  };

  Parser.prototype.parseResourceId = function () {
    let parts = [];
    let isString = false;
    let t = this.peek();
    if (t && t.type === "string") { isString = true; parts.push(this.next().value); }
    else if (t && t.type === "word") { parts.push(this.next().value); }
    else { this.err("无效的资源标识", t); return { raw: "", parts: [], type: null, isString: false }; }
    // After the leading identifier, a resource id may carry up to three
    // colon-delimited segments, e.g.  mod:item, fluid:*, fe:: , minecraft:iron_ingot
    while (this.isSym(":")) {
      this.next();                 // consume the colon
      const p = this.peek();
      if (p && p.type === "string") { parts.push(this.next().value); }
      else if (p && p.type === "word" && !RESERVED.has(p.lower)) { parts.push(this.next().value); }
      else if (p && p.type === "sym" && p.value === "*") { parts.push(this.next().value); }
      else parts.push("");         // empty segment (e.g. `fluid::` or `fe::`); loop continues if another colon follows
    }
    const raw = parts.join(":");
    let type = null;
    if (!isString && RES_TYPE_HINT.has((parts[0] || "").toLowerCase())) {
      type = (parts[0] || "").toLowerCase();
    }
    return { raw, parts, type, isString };
  };

  Parser.prototype.parseWithClause = function (negated) {
    // capture raw tokens until statement boundary for display
    const raw = [];
    while (!this.atEnd()) {
      const t = this.peek();
      if (t.type === "word" && (t.lower === "end" || t.lower === "else" || RESERVED.has(t.lower) && ["from","to","input","output","if","forget"].indexOf(t.lower) !== -1)) break;
      if (t.type === "sym" && (t.value === "," && false)) break;
      raw.push(t.value);
      this.next();
      if (this.isSym(",")) break; // stop at separating comma
    }
    return { negated: !!negated, raw: raw.join(" ") };
  };

  Parser.prototype.parseLabelAccess = function () {
    const labels = [];
    let t = this.peek();
    if (t && t.type === "string") labels.push({ name: this.next().value, isString: true });
    else if (t && t.type === "word" && t.value !== "*") labels.push({ name: this.next().value, isString: false });
    else { this.err("标签访问缺少标签名", t); }
    while (this.isSym(",")) {
      this.next();
      const p = this.peek();
      if (p && p.type === "string") labels.push({ name: this.next().value, isString: true });
      else if (p && p.type === "word" && p.value !== "*") labels.push({ name: this.next().value, isString: false });
      else break;
    }
    let roundRobin = null;
    if (this.isWord("round")) {
      this.next(); this.expectWord("robin"); this.expectWord("by");
      const by = this.isWord("label") ? "label" : (this.isWord("block") ? "block" : null);
      if (by) this.next();
      roundRobin = by;
    }
    const sides = [];
    if (this.isWord("each") && this.peek(1) && this.peek(1).type === "word" && this.peek(1).lower === "side") {
      this.next(); this.next(); sides.push("ALL");
    } else if (this.isWord("side") === false && SIDES.has((this.peek() || {}).lower || "")) {
      while (this.peek() && SIDES.has(this.peek().lower)) {
        const s = this.next().lower;
        if (s === "null") { sides.push("null"); break; }
        sides.push(s);
      }
      this.expectWord("side");
    }
    let slots = null;
    if (this.isWord("slots") || this.isWord("slot")) {
      this.next();
      slots = this.parseRangeSet();
    }
    return { labels, each: false, roundRobin, sides, slots };
  };

  Parser.prototype.parseRangeSet = function () {
    const ranges = [];
    function readNum(p) { return (p && p.type === "number") ? parseInt(p.value, 10) : null; }
    let a = readNum(this.peek());
    if (a !== null) {
      this.next();
      if (this.isSym("-")) {
        this.next();
        const b = readNum(this.peek());
        if (b !== null) { this.next(); ranges.push([a, b]); }
        else ranges.push([a, a]);
      } else ranges.push([a, a]);
    }
    while (this.isSym(",")) {
      this.next();
      const x = readNum(this.peek());
      if (x === null) break;
      this.next();
      if (this.isSym("-")) {
        this.next();
        const y = readNum(this.peek());
        if (y !== null) { this.next(); ranges.push([x, y]); }
        else ranges.push([x, x]);
      } else ranges.push([x, x]);
    }
    return ranges;
  };

  // ---------- Boolean expressions ----------
  Parser.prototype.parseBoolExpr = function () { return this.parseOr(); };
  Parser.prototype.parseOr = function () {
    let left = this.parseAnd();
    while (this.isWord("or")) { this.next(); const right = this.parseAnd(); left = { op: "or", left, right }; }
    return left;
  };
  Parser.prototype.parseAnd = function () {
    let left = this.parseNot();
    while (this.isWord("and")) { this.next(); const right = this.parseNot(); left = { op: "and", left, right }; }
    return left;
  };
  Parser.prototype.parseNot = function () {
    if (this.isWord("not")) { this.next(); return { op: "not", expr: this.parseNot() }; }
    return this.parseBoolPrimary();
  };
  Parser.prototype.parseBoolPrimary = function () {
    const t = this.peek();
    if (!t) { this.err("条件表达式不完整", t); return { type: "incomplete" }; }
    if (this.isWord("true")) { this.next(); return { type: "bool", value: true }; }
    if (this.isWord("false")) { this.next(); return { type: "bool", value: false }; }
    if (this.isSym("(")) {
      this.next();
      const e = this.parseOr();
      this.expectSym(")");
      return e;
    }
    if (this.isWord("redstone")) {
      this.next();
      let cmp = null, value = null;
      const c = this.parseComparisonOp();
      if (c) { cmp = c; value = this.parseNumber(); }
      return { type: "redstone", cmp, value };
    }
    // HAS expression: setOp? labelAccess HAS comparisonOp number resourceIdDisjunction? with? except?
    let setOp = null;
    if (this.isWord("overall") || this.isWord("some") || this.isWord("every") ||
        this.isWord("each") || this.isWord("one") || this.isWord("lone")) {
      setOp = this.next().lower;
    }
    const labelAccess = this.parseLabelAccess();
    this.expectWord("has");
    const cmp = this.parseComparisonOp();
    const value = this.parseNumber();
    const resources = [];
    while (true) {
      if (!this.isResourceIdStart(this.peek())) break;
      resources.push(this.parseResourceId());
      if (this.isWord("or")) {
        // boolean OR (a has X or a has Y / a has X or every b has Y) vs
        // resource disjunction (coal or iron) inside a single has clause
        if (this.startsConditionAt(1)) break; // leave 'or' for parseOr
        this.next(); // consume 'or' as resource disjunction
        continue;
      }
      break;
    }
    let withClause = null;
    if (this.isWord("with") || this.isWord("without")) {
      const neg = this.isWord("without"); this.next();
      withClause = this.parseWithClause(neg);
    }
    const except = [];
    if (this.isWord("except")) { this.next(); except.push.apply(except, this.parseResourceIdList()); }
    return { type: "has", setOp, labels: labelAccess, cmp, value, resources, with: withClause, except };
  };
  // Look ahead from token index k to decide if a condition starts there.
  // Handles: redstone, not (label running), [quantifier] label verb ...
  Parser.prototype.startsConditionAt = function (k) {
    let t = this.peek(k);
    if (!t) return false;
    if (t.lower === "redstone") return true;
    if (t.lower === "not") {
      const a = this.peek(k + 1), b = this.peek(k + 2);
      return !!(a && a.type === "word" && b && b.lower === "running");
    }
    let idx = k;
    if (t.type === "word" && QUANT_WORDS[t.lower]) idx = k + 1; // skip setOp
    const label = this.peek(idx);
    const verb = this.peek(idx + 1);
    return !!(label && label.type === "word" && verb && verb.type === "word" && VERB_WORDS[verb.lower]);
  };
  Parser.prototype.parseComparisonOp = function () {
    const t = this.peek();
    if (!t) return null;
    if (this.isWord("gt") || this.isSym(">")) { this.next(); return "gt"; }
    if (this.isWord("lt") || this.isSym("<")) { this.next(); return "lt"; }
    if (this.isWord("eq") || this.isSym("=")) { this.next(); return "eq"; }
    if (this.isWord("le") || this.isSym("<=")) { this.next(); return "le"; }
    if (this.isWord("ge") || this.isSym(">=")) { this.next(); return "ge"; }
    return null;
  };

  // ---------- Public API ----------
  function parse(text) {
    const toks = tokenize(text || "");
    const p = new Parser(toks);
    const ast = p.parseProgram();
    return { ok: p.errors.length === 0, ast, errors: p.errors };
  }

  return { parse, tokenize, KEYWORDS: RESERVED };
});

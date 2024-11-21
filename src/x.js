const booleans = ["allowfullscreen", "async", "autofocus", "autoplay", "checked", "controls", "default", "disabled", "formnovalidate", "hidden", "indeterminate", "inert", "ismap", "loop", "multiple", "muted", "nomodule", "novalidate", "open", "playsinline", "readonly", "required", "reversed", "seamless", "selected"];
const Properties = /*#__PURE__*/new Set(["className", "value", "readOnly", "formNoValidate", "isMap", "noModule", "playsInline", ...booleans]);
const ChildProperties = /*#__PURE__*/new Set(["innerHTML", "textContent", "innerText", "children"]);

// React Compat
const Aliases = /*#__PURE__*/Object.assign(Object.create(null), {
  className: "class",
  htmlFor: "for"
});
const PropAliases = /*#__PURE__*/Object.assign(Object.create(null), {
  class: "className",
  formnovalidate: {
    $: "formNoValidate",
    BUTTON: 1,
    INPUT: 1
  },
  ismap: {
    $: "isMap",
    IMG: 1
  },
  nomodule: {
    $: "noModule",
    SCRIPT: 1
  },
  playsinline: {
    $: "playsInline",
    VIDEO: 1
  },
  readonly: {
    $: "readOnly",
    INPUT: 1,
    TEXTAREA: 1
  }
});
function getPropAlias(prop, tagName) {
  const a = PropAliases[prop];
  return typeof a === "object" ? a[tagName] ? a["$"] : undefined : a;
}

// list of Element events that will be delegated
const DelegatedEvents = /*#__PURE__*/new Set(["beforeinput", "click", "dblclick", "contextmenu", "focusin", "focusout", "input", "keydown", "keyup", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "pointerdown", "pointermove", "pointerout", "pointerover", "pointerup", "touchend", "touchmove", "touchstart"]);
const SVGElements = /*#__PURE__*/new Set([
// "a",
"altGlyph", "altGlyphDef", "altGlyphItem", "animate", "animateColor", "animateMotion", "animateTransform", "circle", "clipPath", "color-profile", "cursor", "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "font", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignObject", "g", "glyph", "glyphRef", "hkern", "image", "line", "linearGradient", "marker", "mask", "metadata", "missing-glyph", "mpath", "path", "pattern", "polygon", "polyline", "radialGradient", "rect",
// "script",
"set", "stop",
// "style",
"svg", "switch", "symbol", "text", "textPath",
// "title",
"tref", "tspan", "use", "view", "vkern"]);
const SVGNamespace = {
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace"
};
const DOMElements = /*#__PURE__*/new Set(["html", "base", "head", "link", "meta", "style", "title", "body", "address", "article", "aside", "footer", "header", "main", "nav", "section", "body", "blockquote", "dd", "div", "dl", "dt", "figcaption", "figure", "hr", "li", "ol", "p", "pre", "ul", "a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "data", "dfn", "em", "i", "kbd", "mark", "q", "rp", "rt", "ruby", "s", "samp", "small", "span", "strong", "sub", "sup", "time", "u", "var", "wbr", "area", "audio", "img", "map", "track", "video", "embed", "iframe", "object", "param", "picture", "portal", "source", "svg", "math", "canvas", "noscript", "script", "del", "ins", "caption", "col", "colgroup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "button", "datalist", "fieldset", "form", "input", "label", "legend", "meter", "optgroup", "option", "output", "progress", "select", "textarea", "details", "dialog", "menu", "summary", "details", "slot", "template", "acronym", "applet", "basefont", "bgsound", "big", "blink", "center", "content", "dir", "font", "frame", "frameset", "hgroup", "image", "keygen", "marquee", "menuitem", "nobr", "noembed", "noframes", "plaintext", "rb", "rtc", "shadow", "spacer", "strike", "tt", "xmp", "a", "abbr", "acronym", "address", "applet", "area", "article", "aside", "audio", "b", "base", "basefont", "bdi", "bdo", "bgsound", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption", "figure", "font", "footer", "form", "frame", "frameset", "head", "header", "hgroup", "hr", "html", "i", "iframe", "image", "img", "input", "ins", "kbd", "keygen", "label", "legend", "li", "link", "main", "map", "mark", "marquee", "menu", "menuitem", "meta", "meter", "nav", "nobr", "noembed", "noframes", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "picture", "plaintext", "portal", "pre", "progress", "q", "rb", "rp", "rt", "rtc", "ruby", "s", "samp", "script", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "tt", "u", "ul", "var", "video", "wbr", "xmp", "input", "h1", "h2", "h3", "h4", "h5", "h6"]);

// src/core/error.ts
var NotReadyError = class extends Error {};

// src/core/constants.ts
var STATE_CLEAN = 0;
var STATE_CHECK = 1;
var STATE_DIRTY = 2;
var STATE_DISPOSED = 3;

// src/core/owner.ts
var currentOwner = null;
var defaultContext = {};
function getOwner() {
  return currentOwner;
}
function setOwner(owner) {
  const out = currentOwner;
  currentOwner = owner;
  return out;
}
var Owner = class {
  // We flatten the owner tree into a linked list so that we don't need a pointer to .firstChild
  // However, the children are actually added in reverse creation order
  // See comment at the top of the file for an example of the _nextSibling traversal
  o = null;
  i = null;
  m = null;
  a = STATE_CLEAN;
  f = null;
  j = defaultContext;
  g = null;
  constructor(signal = false) {
    if (currentOwner && !signal) currentOwner.append(this);
  }
  append(child) {
    child.o = this;
    child.m = this;
    if (this.i) this.i.m = child;
    child.i = this.i;
    this.i = child;
    if (child.j !== this.j) {
      child.j = {
        ...this.j,
        ...child.j
      };
    }
    if (this.g) {
      child.g = !child.g ? this.g : [...child.g, ...this.g];
    }
  }
  dispose(self = true) {
    if (this.a === STATE_DISPOSED) return;
    let head = self ? this.m || this.o : this,
      current = this.i,
      next = null;
    while (current && current.o === this) {
      current.dispose(true);
      current.t();
      next = current.i;
      current.i = null;
      current = next;
    }
    if (self) this.t();
    if (current) current.m = !self ? this : this.m;
    if (head) head.i = current;
  }
  t() {
    if (this.m) this.m.i = null;
    this.o = null;
    this.m = null;
    this.j = defaultContext;
    this.g = null;
    this.a = STATE_DISPOSED;
    this.emptyDisposal();
  }
  emptyDisposal() {
    if (!this.f) return;
    if (Array.isArray(this.f)) {
      for (let i = 0; i < this.f.length; i++) {
        const callable = this.f[i];
        callable.call(callable);
      }
    } else {
      this.f.call(this.f);
    }
    this.f = null;
  }
  handleError(error) {
    if (!this.g) throw error;
    let i = 0,
      len = this.g.length;
    for (i = 0; i < len; i++) {
      try {
        this.g[i](error);
        break;
      } catch (e) {
        error = e;
      }
    }
    if (i === len) throw error;
  }
};
function onCleanup(disposable) {
  if (!currentOwner) return;
  const node = currentOwner;
  if (!node.f) {
    node.f = disposable;
  } else if (Array.isArray(node.f)) {
    node.f.push(disposable);
  } else {
    node.f = [node.f, disposable];
  }
}

// src/core/flags.ts
var ERROR_OFFSET = 0;
var ERROR_BIT = 1 << ERROR_OFFSET;
var LOADING_OFFSET = 1;
var LOADING_BIT = 1 << LOADING_OFFSET;
var DEFAULT_FLAGS = ERROR_BIT;

// src/core/scheduler.ts
var scheduled = false;
var runningScheduled = false;
var Computations = [];
var RenderEffects = [];
var Effects = [];
function flushSync() {
  if (!runningScheduled) runScheduled();
}
function flushQueue() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(runScheduled);
}
function runTop(node) {
  const ancestors = [];
  for (let current = node; current !== null; current = current.o) {
    if (current.a !== STATE_CLEAN) {
      ancestors.push(current);
    }
  }
  for (let i = ancestors.length - 1; i >= 0; i--) {
    if (ancestors[i].a !== STATE_DISPOSED) ancestors[i].p();
  }
}
function runScheduled() {
  if (!Effects.length && !RenderEffects.length && !Computations.length) {
    scheduled = false;
    return;
  }
  runningScheduled = true;
  try {
    runPureQueue(Computations);
    runPureQueue(RenderEffects);
    runPureQueue(Effects);
  } finally {
    const renderEffects = RenderEffects;
    const effects = Effects;
    Computations = [];
    Effects = [];
    RenderEffects = [];
    scheduled = false;
    runningScheduled = false;
    incrementClock();
    runEffectQueue(renderEffects);
    runEffectQueue(effects);
  }
}
function runPureQueue(queue) {
  for (let i = 0; i < queue.length; i++) {
    if (queue[i].a !== STATE_CLEAN) runTop(queue[i]);
  }
}
function runEffectQueue(queue) {
  for (let i = 0; i < queue.length; i++) {
    if (queue[i].x && queue[i].a !== STATE_DISPOSED) {
      queue[i].y(queue[i].d, queue[i].v);
      queue[i].x = false;
      queue[i].v = queue[i].d;
    }
  }
}

// src/core/core.ts
var currentObserver = null;
var currentMask = DEFAULT_FLAGS;
var newSources = null;
var newSourcesIndex = 0;
var newFlags = 0;
var clock = 0;
function getObserver() {
  return currentObserver;
}
function incrementClock() {
  clock++;
}
var UNCHANGED = Symbol(0);
var Computation2 = class extends Owner {
  b = null;
  c = null;
  d;
  z;
  // Used in __DEV__ mode, hopefully removed in production
  M;
  // Using false is an optimization as an alternative to _equals: () => false
  // which could enable more efficient DIRTY notification
  A = isEqual;
  G;
  /** Whether the computation is an error or has ancestors that are unresolved */
  k = 0;
  /** Which flags raised by sources are handled, vs. being passed through. */
  w = DEFAULT_FLAGS;
  B = null;
  C = null;
  D = -1;
  constructor(initialValue, compute2, options) {
    super(compute2 === null);
    this.z = compute2;
    this.a = compute2 ? STATE_DIRTY : STATE_CLEAN;
    this.d = initialValue;
    if (options?.equals !== void 0) this.A = options.equals;
    if (options?.unobserved) this.G = options?.unobserved;
  }
  H() {
    if (this.z) this.p();
    if (!this.b || this.b.length) track(this);
    newFlags |= this.k & ~currentMask;
    if (this.k & ERROR_BIT) {
      throw this.d;
    } else {
      return this.d;
    }
  }
  /**
   * Return the current value of this computation
   * Automatically re-executes the surrounding computation when the value changes
   */
  read() {
    return this.H();
  }
  /**
   * Return the current value of this computation
   * Automatically re-executes the surrounding computation when the value changes
   *
   * If the computation has any unresolved ancestors, this function waits for the value to resolve
   * before continuing
   */
  wait() {
    if (this.loading()) {
      throw new NotReadyError();
    }
    return this.H();
  }
  /**
   * Return true if the computation is the value is dependent on an unresolved promise
   * Triggers re-execution of the computation when the loading state changes
   *
   * This is useful especially when effects want to re-execute when a computation's
   * loading state changes
   */
  loading() {
    if (this.C === null) {
      this.C = loadingState(this);
    }
    return this.C.read();
  }
  /**
   * Return true if the computation is the computation threw an error
   * Triggers re-execution of the computation when the error state changes
   */
  error() {
    if (this.B === null) {
      this.B = errorState(this);
    }
    return this.B.read();
  }
  /** Update the computation with a new value. */
  write(value, flags = 0, raw = false) {
    const newValue = !raw && typeof value === "function" ? value(this.d) : value;
    const valueChanged = newValue !== UNCHANGED && (!!(flags & ERROR_BIT) || this.A === false || !this.A(this.d, newValue));
    if (valueChanged) this.d = newValue;
    const changedFlagsMask = this.k ^ flags,
      changedFlags = changedFlagsMask & flags;
    this.k = flags;
    this.D = clock + 1;
    if (this.c) {
      for (let i = 0; i < this.c.length; i++) {
        if (valueChanged) {
          this.c[i].q(STATE_DIRTY);
        } else if (changedFlagsMask) {
          this.c[i].I(changedFlagsMask, changedFlags);
        }
      }
    }
    return this.d;
  }
  /**
   * Set the current node's state, and recursively mark all of this node's observers as STATE_CHECK
   */
  q(state) {
    if (this.a >= state) return;
    this.a = state;
    if (this.c) {
      for (let i = 0; i < this.c.length; i++) {
        this.c[i].q(STATE_CHECK);
      }
    }
  }
  /**
   * Notify the computation that one of its sources has changed flags.
   *
   * @param mask A bitmask for which flag(s) were changed.
   * @param newFlags The source's new flags, masked to just the changed ones.
   */
  I(mask, newFlags2) {
    if (this.a >= STATE_DIRTY) return;
    if (mask & this.w) {
      this.q(STATE_DIRTY);
      return;
    }
    if (this.a >= STATE_CHECK) return;
    const prevFlags = this.k & mask;
    const deltaFlags = prevFlags ^ newFlags2;
    if (newFlags2 === prevFlags) ;else if (deltaFlags & prevFlags & mask) {
      this.q(STATE_CHECK);
    } else {
      this.k ^= deltaFlags;
      if (this.c) {
        for (let i = 0; i < this.c.length; i++) {
          this.c[i].I(mask, newFlags2);
        }
      }
    }
  }
  J(error) {
    this.write(error, this.k | ERROR_BIT);
  }
  /**
   * This is the core part of the reactivity system, which makes sure that the values are updated
   * before they are read. We've also adapted it to return the loading state of the computation,
   * so that we can propagate that to the computation's observers.
   *
   * This function will ensure that the value and states we read from the computation are up to date
   */
  p() {
    if (this.a === STATE_DISPOSED) {
      throw new Error("Tried to read a disposed computation");
    }
    if (this.a === STATE_CLEAN) {
      return;
    }
    let observerFlags = 0;
    if (this.a === STATE_CHECK) {
      for (let i = 0; i < this.b.length; i++) {
        this.b[i].p();
        observerFlags |= this.b[i].k;
        if (this.a === STATE_DIRTY) {
          break;
        }
      }
    }
    if (this.a === STATE_DIRTY) {
      update(this);
    } else {
      this.write(UNCHANGED, observerFlags);
      this.a = STATE_CLEAN;
    }
  }
  /**
   * Remove ourselves from the owner graph and the computation graph
   */
  t() {
    if (this.a === STATE_DISPOSED) return;
    if (this.b) removeSourceObservers(this, 0);
    super.t();
  }
};
function loadingState(node) {
  const prevOwner = setOwner(node.o);
  const options = void 0;
  const computation = new Computation2(void 0, () => {
    track(node);
    node.p();
    return !!(node.k & LOADING_BIT);
  }, options);
  computation.w = ERROR_BIT | LOADING_BIT;
  setOwner(prevOwner);
  return computation;
}
function errorState(node) {
  const prevOwner = setOwner(node.o);
  const options = void 0;
  const computation = new Computation2(void 0, () => {
    track(node);
    node.p();
    return !!(node.k & ERROR_BIT);
  }, options);
  computation.w = ERROR_BIT;
  setOwner(prevOwner);
  return computation;
}
function track(computation) {
  if (currentObserver) {
    if (!newSources && currentObserver.b && currentObserver.b[newSourcesIndex] === computation) {
      newSourcesIndex++;
    } else if (!newSources) newSources = [computation];else if (computation !== newSources[newSources.length - 1]) {
      newSources.push(computation);
    }
  }
}
function update(node) {
  const prevSources = newSources,
    prevSourcesIndex = newSourcesIndex,
    prevFlags = newFlags;
  newSources = null;
  newSourcesIndex = 0;
  newFlags = 0;
  try {
    node.dispose(false);
    node.emptyDisposal();
    const result = compute(node, node.z, node);
    node.write(result, newFlags, true);
  } catch (error) {
    if (error instanceof NotReadyError) {
      node.write(UNCHANGED, newFlags | LOADING_BIT);
    } else {
      node.J(error);
    }
  } finally {
    if (newSources) {
      if (node.b) removeSourceObservers(node, newSourcesIndex);
      if (node.b && newSourcesIndex > 0) {
        node.b.length = newSourcesIndex + newSources.length;
        for (let i = 0; i < newSources.length; i++) {
          node.b[newSourcesIndex + i] = newSources[i];
        }
      } else {
        node.b = newSources;
      }
      let source;
      for (let i = newSourcesIndex; i < node.b.length; i++) {
        source = node.b[i];
        if (!source.c) source.c = [node];else source.c.push(node);
      }
    } else if (node.b && newSourcesIndex < node.b.length) {
      removeSourceObservers(node, newSourcesIndex);
      node.b.length = newSourcesIndex;
    }
    newSources = prevSources;
    newSourcesIndex = prevSourcesIndex;
    newFlags = prevFlags;
    node.a = STATE_CLEAN;
  }
}
function removeSourceObservers(node, index) {
  let source;
  let swap;
  for (let i = index; i < node.b.length; i++) {
    source = node.b[i];
    if (source.c) {
      swap = source.c.indexOf(node);
      source.c[swap] = source.c[source.c.length - 1];
      source.c.pop();
      if (!source.c.length) source.G?.();
    }
  }
}
function isEqual(a, b) {
  return a === b;
}
function untrack(fn) {
  if (currentObserver === null) return fn();
  return compute(getOwner(), fn, null);
}
function compute(owner, compute2, observer) {
  const prevOwner = setOwner(owner),
    prevObserver = currentObserver,
    prevMask = currentMask;
  currentObserver = observer;
  currentMask = observer?.w ?? DEFAULT_FLAGS;
  try {
    return compute2(observer ? observer.d : void 0);
  } finally {
    setOwner(prevOwner);
    currentObserver = prevObserver;
    currentMask = prevMask;
  }
}
var EagerComputation = class extends Computation2 {
  constructor(initialValue, compute2, options) {
    super(initialValue, compute2, options);
    this.p();
    Computations.push(this);
  }
  q(state) {
    if (this.a >= state) return;
    if (this.a === STATE_CLEAN) {
      Computations.push(this);
      flushQueue();
    }
    super.q(state);
  }
};

// src/core/effect.ts
var USER_EFFECT = 0;
var RENDER_EFFECT = 1;
var Effect = class extends Computation2 {
  y;
  x = false;
  v;
  E;
  constructor(initialValue, compute2, effect, options) {
    super(initialValue, compute2, options);
    this.y = effect;
    this.v = initialValue;
    this.p();
    this.E = options?.render ? RENDER_EFFECT : USER_EFFECT;
    (this.E ? RenderEffects : Effects).push(this);
  }
  write(value) {
    if (value === UNCHANGED) return this.d;
    this.d = value;
    this.x = true;
    return value;
  }
  q(state) {
    if (this.a >= state) return;
    if (this.a === STATE_CLEAN) {
      (this.E ? RenderEffects : Effects).push(this);
      flushQueue();
    }
    this.a = state;
  }
  J(error) {
    this.handleError(error);
  }
  t() {
    this.y = void 0;
    this.v = void 0;
    super.t();
  }
};

// src/signals.ts
function createSignal(first, second, third) {
  if (typeof first === "function") {
    const memo = createMemo(p => {
      const node2 = new Computation2(first(p ? untrack(p[0]) : second), null, third);
      return [node2.read.bind(node2), node2.write.bind(node2)];
    });
    return [() => memo()[0](), value => memo()[1](value)];
  }
  const node = new Computation2(first, null, second);
  return [node.read.bind(node), node.write.bind(node)];
}
function createMemo(compute2, initialValue, options) {
  let node = new Computation2(initialValue, compute2, options);
  let value;
  return () => {
    if (node) {
      value = node.wait();
      if (!node.b?.length) node = void 0;
    }
    return value;
  };
}
function createEffect(compute2, effect, initialValue, options) {
  void new Effect(initialValue, compute2, effect, void 0);
}
function createRenderEffect(compute2, effect, initialValue, options) {
  void new Effect(initialValue, compute2, effect, {
    render: true,
    ...void 0
  });
}
function createRoot(init) {
  const owner = new Owner();
  return compute(owner, !init.length ? init : () => init(() => owner.dispose()), null);
}
function runWithOwner(owner, run) {
  try {
    return compute(owner, run, null);
  } catch (error) {
    owner?.handleError(error);
    return void 0;
  }
}
function catchError(fn, handler) {
  const owner = new Owner();
  owner.g = owner.g ? [handler, ...owner.g] : [handler];
  try {
    compute(owner, fn, null);
  } catch (error) {
    owner.handleError(error);
  }
}

// src/store/store.ts
var $RAW = Symbol(0);
var $TRACK = Symbol(0);
var $PROXY = Symbol(0);
var PROXIES = /* @__PURE__ */new WeakMap();
var NODES = [/* @__PURE__ */new WeakMap(), /* @__PURE__ */new WeakMap()];
function wrap(value) {
  let p = PROXIES.get(value);
  if (!p) PROXIES.set(value, p = new Proxy(value, proxyTraps));
  return p;
}
function isWrappable(obj) {
  let proto;
  return obj != null && typeof obj === "object" //&& (PROXIES.has(obj) || !(proto = Object.getPrototypeOf(obj)) || proto === Object.prototype || Array.isArray(obj));
}
function unwrap(item, set = /* @__PURE__ */new Set()) {
  let result, unwrapped, v, prop;
  if (!isWrappable(item) || set.has(item)) return item;
  if (result = item[$RAW]) return result;
  set.add(item);
  if (Array.isArray(item)) {
    for (let i = 0, l = item.length; i < l; i++) {
      v = item[i];
      if ((unwrapped = unwrap(v, set)) !== v) item[i] = unwrapped;
    }
  } else {
    const keys = Object.keys(item);
    for (let i = 0, l = keys.length; i < l; i++) {
      prop = keys[i];
      const desc = Object.getOwnPropertyDescriptor(item, prop);
      if (desc.get) continue;
      v = item[prop];
      if ((unwrapped = unwrap(v, set)) !== v) item[prop] = unwrapped;
    }
  }
  return item;
}
function getNodes(target, type) {
  let nodes = NODES[type].get(target);
  if (!nodes) NODES[type].set(target, nodes = /* @__PURE__ */Object.create(null));
  return nodes;
}
function getNode(nodes, property, value) {
  if (nodes[property]) return nodes[property];
  return nodes[property] = new Computation2(value, null, {
    equals: false,
    unobserved() {
      delete nodes[property];
    }
  });
}
function proxyDescriptor(target, property) {
  const desc = Reflect.getOwnPropertyDescriptor(target, property);
  if (!desc || desc.get || !desc.configurable || property === $PROXY) return desc;
  delete desc.value;
  delete desc.writable;
  desc.get = () => PROXIES.get(target)[property];
  return desc;
}
function trackSelf(target) {
  getObserver() && getNode(getNodes(target, 0), $TRACK).read();
}
function ownKeys(target) {
  trackSelf(target);
  return Reflect.ownKeys(target);
}
var Writing = /* @__PURE__ */new Set();
var proxyTraps = {
  get(target, property, receiver) {
    if (property === $RAW) return target;
    if (property === $PROXY) return receiver;
    if (property === $TRACK) {
      trackSelf(target);
      return receiver;
    }
    const desc = Object.getOwnPropertyDescriptor(target, property);
    if (desc && desc.get) return desc.get.call(receiver);
    const nodes = getNodes(target, 0);
    const tracked = nodes[property];
    if (Writing.has(target)) {
      const value2 = tracked ? tracked.d : target[property];
      return isWrappable(value2) ? (Writing.add(value2), wrap(value2)) : value2;
    }
    let value = tracked ? nodes[property].read() : target[property];
    if (!tracked && getObserver() && (typeof value !== "function" || target.hasOwnProperty(property))) value = getNode(nodes, property, value).read();
    return isWrappable(value) ? wrap(value) : value;
  },
  has(target, property) {
    if (property === $RAW || property === $PROXY || property === $TRACK || property === "__proto__") return true;
    getObserver() && getNode(getNodes(target, 1), property).read();
    return property in target;
  },
  set(target, property, value) {
    Writing.has(target) && setProperty$1(target, property, unwrap(value));
    return true;
  },
  deleteProperty(target, property) {
    Writing.has(target) && setProperty$1(target, property, void 0, true);
    return true;
  },
  ownKeys,
  getOwnPropertyDescriptor: proxyDescriptor
};
function setProperty$1(state, property, value, deleting = false) {
  if (!deleting && state[property] === value) return;
  const prev = state[property];
  const len = state.length;
  if (deleting) delete state[property];else state[property] = value;
  const nodes = getNodes(state, 0);
  let node;
  if (node = getNode(nodes, property, prev)) node.write(value);
  if (Array.isArray(state) && state.length !== len) (node = getNode(nodes, "length", len)) && node.write(state.length);
  (node = nodes[$TRACK]) && node.write(void 0);
}
function createStore(first, second) {
  const derived = typeof first === "function",
    store = derived ? second : first,
    unwrappedStore = unwrap(store);
  const wrappedStore = wrap(unwrappedStore);
  const setStore = fn => {
    try {
      Writing.add(store);
      fn(wrappedStore);
    } finally {
      Writing.clear();
    }
  };
  if (derived) {
    new EagerComputation(void 0, () => setStore(first));
  }
  return [wrappedStore, setStore];
}
function createProjection(fn, initialValue) {
  const [store] = createStore(fn, initialValue);
  return store;
}

// src/map.ts
function mapArray(list, map, options) {
  const keyFn = typeof options?.keyed === "function" ? options.keyed : void 0;
  return Computation2.prototype.read.bind(new Computation2([], updateKeyedMap.bind({
    K: new Owner(),
    r: 0,
    L: list,
    n: [],
    F: map,
    l: [],
    s: [],
    u: keyFn,
    e: keyFn || options?.keyed === false ? [] : void 0,
    h: map.length > 1 ? [] : void 0
  }), options));
}
function updateKeyedMap() {
  const newItems = this.L() || [],
    newLen = newItems.length;
  newItems[$TRACK];
  runWithOwner(this.K, () => {
    let i,
      j,
      mapper = this.e ? () => {
        this.e[j] = new Computation2(newItems[j], null);
        this.h[j] = new Computation2(j, null);
        return this.F(Computation2.prototype.read.bind(this.e[j]), Computation2.prototype.read.bind(this.h[j]));
      } : this.h ? () => {
        const item = newItems[j];
        this.h[j] = new Computation2(j, null);
        return this.F(() => item, Computation2.prototype.read.bind(this.h[j]));
      } : () => {
        const item = newItems[j];
        return this.F(() => item);
      };
    if (newLen === 0) {
      if (this.r !== 0) {
        this.K.dispose(false);
        this.s = [];
        this.n = [];
        this.l = [];
        this.r = 0;
        this.e && (this.e = []);
        this.h && (this.h = []);
      }
    } else if (this.r === 0) {
      this.l = new Array(newLen);
      for (j = 0; j < newLen; j++) {
        this.n[j] = newItems[j];
        this.l[j] = compute(this.s[j] = new Owner(), mapper, null);
      }
      this.r = newLen;
    } else {
      let start,
        end,
        newEnd,
        item,
        key,
        newIndices,
        newIndicesNext,
        temp = new Array(newLen),
        tempNodes = new Array(newLen),
        tempRows = this.e ? new Array(newLen) : void 0,
        tempIndexes = this.h ? new Array(newLen) : void 0;
      for (start = 0, end = Math.min(this.r, newLen); start < end && (this.n[start] === newItems[start] || this.e && compare(this.u, this.n[start], newItems[start])); start++) {
        if (this.e) this.e[start].write(newItems[start]);
      }
      for (end = this.r - 1, newEnd = newLen - 1; end >= start && newEnd >= start && (this.n[end] === newItems[newEnd] || this.e && compare(this.u, this.n[end], newItems[newEnd])); end--, newEnd--) {
        temp[newEnd] = this.l[end];
        tempNodes[newEnd] = this.s[end];
        tempRows && (tempRows[newEnd] = this.e[end]);
        tempIndexes && (tempIndexes[newEnd] = this.h[end]);
      }
      newIndices = /* @__PURE__ */new Map();
      newIndicesNext = new Array(newEnd + 1);
      for (j = newEnd; j >= start; j--) {
        item = newItems[j];
        key = this.u ? this.u(item) : item;
        i = newIndices.get(key);
        newIndicesNext[j] = i === void 0 ? -1 : i;
        newIndices.set(key, j);
      }
      for (i = start; i <= end; i++) {
        item = this.n[i];
        key = this.u ? this.u(item) : item;
        j = newIndices.get(key);
        if (j !== void 0 && j !== -1) {
          temp[j] = this.l[i];
          tempNodes[j] = this.s[i];
          tempRows && (tempRows[j] = this.e[i]);
          tempIndexes && (tempIndexes[j] = this.h[i]);
          j = newIndicesNext[j];
          newIndices.set(key, j);
        } else this.s[i].dispose();
      }
      for (j = start; j < newLen; j++) {
        if (j in temp) {
          this.l[j] = temp[j];
          this.s[j] = tempNodes[j];
          if (tempRows) {
            this.e[j] = tempRows[j];
            this.e[j].write(newItems[j]);
          }
          if (tempIndexes) {
            this.h[j] = tempIndexes[j];
            this.h[j].write(j);
          }
        } else {
          this.l[j] = compute(this.s[j] = new Owner(), mapper, null);
        }
      }
      this.l = this.l.slice(0, this.r = newLen);
      this.n = newItems.slice(0);
    }
  });
  return this.l;
}
function compare(key, a, b) {
  return key ? key(a) === key(b) : true;
}

function createComponent(Comp, props) {
  return untrack(() => Comp(props));
}
function For(props) {
  return mapArray(() => props.each, props.children);
}
function trueFn() {
  return true;
}
const propTraps = {
  get(_, property, receiver) {
    if (property === $PROXY) return receiver;
    return _.get(property);
  },
  has(_, property) {
    if (property === $PROXY) return true;
    return _.has(property);
  },
  set: trueFn,
  deleteProperty: trueFn,
  getOwnPropertyDescriptor(_, property) {
    return {
      configurable: true,
      enumerable: true,
      get() {
        return _.get(property);
      },
      set: trueFn,
      deleteProperty: trueFn
    };
  },
  ownKeys(_) {
    return _.keys();
  }
};
function resolveSource(s) {
  return !(s = typeof s === "function" ? s() : s) ? {} : s;
}
function mergeProps(...sources) {
  let proxy = false;
  for (let i = 0; i < sources.length; i++) {
    const s = sources[i];
    proxy = proxy || !!s && $PROXY in s;
    sources[i] = typeof s === "function" ? (proxy = true, createMemo(s)) : s;
  }
  if (proxy) {
    return new Proxy({
      get(property) {
        for (let i = sources.length - 1; i >= 0; i--) {
          const v = resolveSource(sources[i])[property];
          if (v !== undefined) return v;
        }
      },
      has(property) {
        for (let i = sources.length - 1; i >= 0; i--) {
          if (property in resolveSource(sources[i])) return true;
        }
        return false;
      },
      keys() {
        const keys = [];
        for (let i = 0; i < sources.length; i++) keys.push(...Object.keys(resolveSource(sources[i])));
        return [...new Set(keys)];
      }
    }, propTraps);
  }
  const target = {};
  for (let i = sources.length - 1; i >= 0; i--) {
    if (sources[i]) {
      const descriptors = Object.getOwnPropertyDescriptors(sources[i]);
      for (const key in descriptors) {
        if (key in target) continue;
        Object.defineProperty(target, key, {
          enumerable: true,
          get() {
            for (let i = sources.length - 1; i >= 0; i--) {
              const v = (sources[i] || {})[key];
              if (v !== undefined) return v;
            }
          }
        });
      }
    }
  }
  return target;
}

const sharedConfig = {
  context: undefined,
  registry: undefined
};

// Slightly modified version of: https://github.com/WebReflection/udomdiff/blob/master/index.js
function reconcileArrays(parentNode, a, b) {
  let bLength = b.length,
    aEnd = a.length,
    bEnd = bLength,
    aStart = 0,
    bStart = 0,
    after = a[aEnd - 1].nextSibling,
    map = null;
  while (aStart < aEnd || bStart < bEnd) {
    // common prefix
    if (a[aStart] === b[bStart]) {
      aStart++;
      bStart++;
      continue;
    }
    // common suffix
    while (a[aEnd - 1] === b[bEnd - 1]) {
      aEnd--;
      bEnd--;
    }
    // append
    if (aEnd === aStart) {
      const node = bEnd < bLength ? bStart ? b[bStart - 1].nextSibling : b[bEnd - bStart] : after;
      while (bStart < bEnd) parentNode.insertBefore(b[bStart++], node);
      // remove
    } else if (bEnd === bStart) {
      while (aStart < aEnd) {
        if (!map || !map.has(a[aStart])) a[aStart].remove();
        aStart++;
      }
      // swap backward
    } else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
      const node = a[--aEnd].nextSibling;
      parentNode.insertBefore(b[bStart++], a[aStart++].nextSibling);
      parentNode.insertBefore(b[--bEnd], node);
      a[aEnd] = b[bEnd];
      // fallback to map
    } else {
      if (!map) {
        map = new Map();
        let i = bStart;
        while (i < bEnd) map.set(b[i], i++);
      }
      const index = map.get(a[aStart]);
      if (index != null) {
        if (bStart < index && index < bEnd) {
          let i = aStart,
            sequence = 1,
            t;
          while (++i < aEnd && i < bEnd) {
            if ((t = map.get(a[i])) == null || t !== index + sequence) break;
            sequence++;
          }
          if (sequence > index - bStart) {
            const node = a[aStart];
            while (bStart < index) parentNode.insertBefore(b[bStart++], node);
          } else parentNode.replaceChild(b[bStart++], a[aStart++]);
        } else aStart++;
      } else a[aStart++].remove();
    }
  }
}

const $$EVENTS = "_$DX_DELEGATE";
function render(code, element, init, options = {}) {
  let disposer;
  createRoot(dispose => {
    disposer = dispose;
    element === document ? code() : insert(element, code(), element.firstChild ? null : undefined, init);
  }, options.owner);
  return () => {
    disposer();
    element.textContent = "";
  };
}
function template(html, isImportNode, isSVG) {
  let node;
  const create = () => {
    const t = document.createElement("template");
    t.innerHTML = html;
    return isSVG ? t.content.firstChild.firstChild : t.content.firstChild;
  };
  // backwards compatible with older builds
  const fn = isImportNode ? () => untrack(() => document.importNode(node || (node = create()), true)) : () => (node || (node = create())).cloneNode(true);
  fn.cloneNode = fn;
  return fn;
}
function delegateEvents(eventNames, document = window.document) {
  const e = document[$$EVENTS] || (document[$$EVENTS] = new Set());
  for (let i = 0, l = eventNames.length; i < l; i++) {
    const name = eventNames[i];
    if (!e.has(name)) {
      e.add(name);
      document.addEventListener(name, eventHandler);
    }
  }
}
function clearDelegatedEvents(document = window.document) {
  if (document[$$EVENTS]) {
    for (let name of document[$$EVENTS].keys()) document.removeEventListener(name, eventHandler);
    delete document[$$EVENTS];
  }
}
function setProperty(node, name, value) {
  node[name] = value;
}
function setAttribute(node, name, value) {
  if (value == null) node.removeAttribute(name);else node.setAttribute(name, value);
}
function setAttributeNS(node, namespace, name, value) {
  if (value == null) node.removeAttributeNS(namespace, name);else node.setAttributeNS(namespace, name, value);
}
function setBoolAttribute(node, name, value) {
  if (isHydrating(node)) return;
  value ? node.setAttribute(name, "") : node.removeAttribute(name);
}
function className(node, value) {
  if (value == null) node.removeAttribute("class");else node.className = value;
}
function addEventListener(node, name, handler, delegate) {
  if (delegate) {
    if (Array.isArray(handler)) {
      node[`$$${name}`] = handler[0];
      node[`$$${name}Data`] = handler[1];
    } else node[`$$${name}`] = handler;
  } else if (Array.isArray(handler)) {
    const handlerFn = handler[0];
    node.addEventListener(name, handler[0] = e => handlerFn.call(node, handler[1], e));
  } else node.addEventListener(name, handler, typeof handler !== "function" && handler);
}
function classList(node, value, prev = {}) {
  const classKeys = Object.keys(value || {}),
    prevKeys = Object.keys(prev);
  let i, len;
  for (i = 0, len = prevKeys.length; i < len; i++) {
    const key = prevKeys[i];
    if (!key || key === "undefined" || value[key]) continue;
    toggleClassKey(node, key, false);
    delete prev[key];
  }
  for (i = 0, len = classKeys.length; i < len; i++) {
    const key = classKeys[i],
      classValue = !!value[key];
    if (!key || key === "undefined" || prev[key] === classValue || !classValue) continue;
    toggleClassKey(node, key, true);
    prev[key] = classValue;
  }
  return prev;
}
function style(node, value, prev) {
  if (!value) return prev ? setAttribute(node, "style") : value;
  const nodeStyle = node.style;
  if (typeof value === "string") return nodeStyle.cssText = value;
  typeof prev === "string" && (nodeStyle.cssText = prev = undefined);
  prev || (prev = {});
  value || (value = {});
  let v, s;
  for (s in prev) {
    value[s] == null && nodeStyle.removeProperty(s);
    delete prev[s];
  }
  for (s in value) {
    v = value[s];
    if (v !== prev[s]) {
      nodeStyle.setProperty(s, v);
      prev[s] = v;
    }
  }
  return prev;
}

// TODO: make this better
function spread(node, props = {}, isSVG, skipChildren) {
  const prevProps = {};
  if (!skipChildren) {
    createRenderEffect(() => normalize(props.children, prevProps.children), value => {
      insertExpression(node, value, prevProps.children);
      prevProps.children = value;
    });
  }
  createRenderEffect(() => typeof props.ref === "function" && use(props.ref, node), () => ({}));
  createRenderEffect(() => {
    const newProps = {};
    for (const prop in props) {
      if (prop === "children" || prop === "ref") continue;
      newProps[prop] = props[prop];
    }
    return newProps;
  }, props => assign(node, props, isSVG, true, prevProps, true));
  return prevProps;
}
function dynamicProperty(props, key) {
  const src = props[key];
  Object.defineProperty(props, key, {
    get() {
      return src();
    },
    enumerable: true
  });
  return props;
}
function use(fn, element, arg) {
  return untrack(() => fn(element, arg));
}
function insert(parent, accessor, marker, initial) {
  const multi = marker !== undefined;
  if (multi && !initial) initial = [];
  if (typeof accessor !== "function") return insertExpression(parent, normalize(accessor, initial, multi), initial, marker);
  createRenderEffect(prev => normalize(accessor, prev, multi), (value, current) => insertExpression(parent, value, current, marker), initial);
}
function assign(node, props, isSVG, skipChildren, prevProps = {}, skipRef = false) {
  props || (props = {});
  for (const prop in prevProps) {
    if (!(prop in props)) {
      if (prop === "children") continue;
      prevProps[prop] = assignProp(node, prop, null, prevProps[prop], isSVG, skipRef, props);
    }
  }
  for (const prop in props) {
    if (prop === "children") {
      if (!skipChildren) insertExpression(node, props.children);
      continue;
    }
    const value = props[prop];
    prevProps[prop] = assignProp(node, prop, value, prevProps[prop], isSVG, skipRef, props);
  }
}

// Hydrate
function hydrate(code, element, options = {}) {
  if (globalThis._$HY.done) return render(code, element, [...element.childNodes], options);
  sharedConfig.completed = globalThis._$HY.completed;
  sharedConfig.events = globalThis._$HY.events;
  sharedConfig.load = id => globalThis._$HY.r[id];
  sharedConfig.has = id => id in globalThis._$HY.r;
  sharedConfig.gather = root => gatherHydratable(element, root);
  sharedConfig.registry = new Map();
  sharedConfig.context = {
    id: options.renderId || "",
    count: 0
  };
  try {
    gatherHydratable(element, options.renderId);
    return render(code, element, [...element.childNodes], options);
  } finally {
    sharedConfig.context = null;
  }
}
function getNextElement(template) {
  let node,
    key,
    hydrating = isHydrating();
  if (!hydrating || !(node = sharedConfig.registry.get(key = getHydrationKey()))) {
    return template();
  }
  if (sharedConfig.completed) sharedConfig.completed.add(node);
  sharedConfig.registry.delete(key);
  return node;
}
function getNextMatch(el, nodeName) {
  while (el && el.localName !== nodeName) el = el.nextSibling;
  return el;
}
function getNextMarker(start) {
  let end = start,
    count = 0,
    current = [];
  if (isHydrating(start)) {
    while (end) {
      if (end.nodeType === 8) {
        const v = end.nodeValue;
        if (v === "$") count++;else if (v === "/") {
          if (count === 0) return [end, current];
          count--;
        }
      }
      current.push(end);
      end = end.nextSibling;
    }
  }
  return [end, current];
}
function runHydrationEvents() {
  if (sharedConfig.events && !sharedConfig.events.queued) {
    queueMicrotask(() => {
      const {
        completed,
        events
      } = sharedConfig;
      if (!events) return;
      events.queued = false;
      while (events.length) {
        const [el, e] = events[0];
        if (!completed.has(el)) return;
        events.shift();
        eventHandler(e);
      }
      if (sharedConfig.done) {
        sharedConfig.events = _$HY.events = null;
        sharedConfig.completed = _$HY.completed = null;
      }
    });
    sharedConfig.events.queued = true;
  }
}

// Internal Functions
function isHydrating(node) {
  return !!sharedConfig.context && !sharedConfig.done && (!node || node.isConnected);
}
function toPropertyName(name) {
  return name.toLowerCase().replace(/-([a-z])/g, (_, w) => w.toUpperCase());
}
function toggleClassKey(node, key, value) {
  const classNames = key.trim().split(/\s+/);
  for (let i = 0, nameLen = classNames.length; i < nameLen; i++) node.classList.toggle(classNames[i], value);
}
function assignProp(node, prop, value, prev, isSVG, skipRef, props) {
  let isCE, isProp, isChildProp, propAlias, forceProp;
  if (prop === "style") return style(node, value, prev);
  if (prop === "classList") return classList(node, value, prev);
  if (value === prev) return prev;
  if (prop === "ref") {
    if (!skipRef) value(node);
  } else if (prop.slice(0, 3) === "on:") {
    const e = prop.slice(3);
    prev && node.removeEventListener(e, prev, typeof prev !== "function" && prev);
    value && node.addEventListener(e, value, typeof value !== "function" && value);
  } else if (prop.slice(0, 10) === "oncapture:") {
    const e = prop.slice(10);
    prev && node.removeEventListener(e, prev, true);
    value && node.addEventListener(e, value, true);
  } else if (prop.slice(0, 2) === "on") {
    const name = prop.slice(2).toLowerCase();
    const delegate = DelegatedEvents.has(name);
    if (!delegate && prev) {
      const h = Array.isArray(prev) ? prev[0] : prev;
      node.removeEventListener(name, h);
    }
    if (delegate || value) {
      addEventListener(node, name, value, delegate);
      delegate && delegateEvents([name]);
    }
  } else if (prop.slice(0, 5) === "attr:") {
    setAttribute(node, prop.slice(5), value);
  } else if (prop.slice(0, 5) === "bool:") {
    setBoolAttribute(node, prop.slice(5), value);
  } else if ((forceProp = prop.slice(0, 5) === "prop:") || (isChildProp = ChildProperties.has(prop)) || !isSVG && ((propAlias = getPropAlias(prop, node.tagName)) || (isProp = Properties.has(prop))) || (isCE = node.nodeName.includes("-") || 'is' in props)) {
    if (forceProp) {
      prop = prop.slice(5);
      isProp = true;
    }
    if (prop === "class" || prop === "className") className(node, value);else if (isCE && !isProp && !isChildProp) node[toPropertyName(prop)] = value;else node[propAlias || prop] = value;
  } else {
    const ns = isSVG && prop.indexOf(":") > -1 && SVGNamespace[prop.split(":")[0]];
    if (ns) setAttributeNS(node, ns, prop, value);else setAttribute(node, Aliases[prop] || prop, value);
  }
  return value;
}
function eventHandler(e) {
  if (sharedConfig.registry && sharedConfig.events) {
    if (sharedConfig.events.find(([el, ev]) => ev === e)) return;
  }
  let node = e.target;
  const key = `$$${e.type}`;
  const oriTarget = e.target;
  const oriCurrentTarget = e.currentTarget;
  const retarget = value => Object.defineProperty(e, "target", {
    configurable: true,
    value
  });
  const handleNode = () => {
    const handler = node[key];
    if (handler && !node.disabled) {
      const data = node[`${key}Data`];
      data !== undefined ? handler.call(node, data, e) : handler.call(node, e);
      if (e.cancelBubble) return;
    }
    node.host && typeof node.host !== "string" && !node.host._$host && node.contains(e.target) && retarget(node.host);
    return true;
  };
  const walkUpTree = () => {
    while (handleNode() && (node = node._$host || node.parentNode || node.host));
  };

  // simulate currentTarget
  Object.defineProperty(e, "currentTarget", {
    configurable: true,
    get() {
      return node || document;
    }
  });
  // cancel hydration
  if (sharedConfig.registry && !sharedConfig.done) sharedConfig.done = _$HY.done = true;
  if (e.composedPath) {
    const path = e.composedPath();
    retarget(path[0]);
    for (let i = 0; i < path.length - 2; i++) {
      node = path[i];
      if (!handleNode()) break;
      if (node._$host) {
        node = node._$host;
        // bubble up from portal mount instead of composedPath
        walkUpTree();
        break;
      }
      if (node.parentNode === oriCurrentTarget) {
        break; // don't bubble above root of event delegation
      }
    }
  }
  // fallback for browsers that don't support composedPath
  else walkUpTree();
  // Mixing portals and shadow dom can lead to a nonstandard target, so reset here.
  retarget(oriTarget);
}
function insertExpression(parent, value, current, marker) {
  if (value === current) return;
  const t = typeof value,
    multi = marker !== undefined;
  parent = multi && current[0] && current[0].parentNode || parent;
  if (t === "string") {
    if (typeof current === "string") {
      parent.firstChild.data = value;
    } else parent.textContent = value;
  } else if (value === undefined) {
    cleanChildren(parent, current, marker);
  } else if (value.nodeType) {
    if (Array.isArray(current)) {
      cleanChildren(parent, current, multi ? marker : null, value);
    } else if (current === undefined || !parent.firstChild) {
      parent.appendChild(value);
    } else parent.replaceChild(value, parent.firstChild);
  } else if (Array.isArray(value)) {
    const currentArray = current && Array.isArray(current);
    if (value.length === 0) {
      cleanChildren(parent, current, marker);
    } else if (currentArray) {
      if (current.length === 0) {
        appendNodes(parent, value, marker);
      } else reconcileArrays(parent, current, value);
    } else {
      current && cleanChildren(parent);
      appendNodes(parent, value);
    }
  } else ;
}
function normalize(value, current, multi) {
  let t;
  while ((t = typeof value) === "function") value = value();
  if (multi && !Array.isArray(value)) value = [value];
  if (t === "number") value = value.toString();else if (t === "boolean" || value == null || value === "") value = undefined;else if (Array.isArray(value)) {
    const normalized = [];
    normalizeIncomingArray(normalized, value, current);
    return normalized;
  }
  return value;
}
function normalizeIncomingArray(normalized, array, current) {
  for (let i = 0, len = array.length; i < len; i++) {
    let item = array[i],
      prev = current && current[normalized.length],
      t;
    if (item == null || item === true || item === false || item === "") ; else if ((t = typeof item) === "object" && item.nodeType) {
      normalized.push(item);
    } else if (Array.isArray(item)) {
      normalizeIncomingArray(normalized, item, current);
    } else if (t === "function") {
      while (typeof item === "function") item = item();
      normalizeIncomingArray(normalized, Array.isArray(item) ? item : [item], current);
    } else {
      const value = String(item);
      if (prev && prev.nodeType === 3 && prev.data === value) normalized.push(prev);else normalized.push(document.createTextNode(value));
    }
  }
}
function appendNodes(parent, array, marker = null) {
  for (let i = 0, len = array.length; i < len; i++) parent.insertBefore(array[i], marker);
}
function cleanChildren(parent, current, marker, replacement) {
  if (marker === undefined) return parent.textContent = "";
  if (current.length) {
    let inserted = false;
    for (let i = current.length - 1; i >= 0; i--) {
      const el = current[i];
      if (replacement !== el) {
        const isParent = el.parentNode === parent;
        if (replacement && !inserted && !i) isParent ? parent.replaceChild(replacement, el) : parent.insertBefore(replacement, marker);else isParent && el.remove();
      } else inserted = true;
    }
  } else if (replacement) parent.insertBefore(replacement, marker);
}
function gatherHydratable(element, root) {
  const templates = element.querySelectorAll(`*[data-hk]`);
  for (let i = 0; i < templates.length; i++) {
    const node = templates[i];
    const key = node.getAttribute("data-hk");
    if ((!root || key.startsWith(root)) && !sharedConfig.registry.has(key)) sharedConfig.registry.set(key, node);
  }
}
function getHydrationKey() {
  return sharedConfig.getNextContextId();
}
function NoHydration(props) {
  return sharedConfig.context ? undefined : props.children;
}
function Hydration(props) {
  return props.children;
}
const voidFn = () => undefined;

// experimental
const RequestContext = Symbol();

export { Aliases, voidFn as Assets, ChildProperties, DOMElements, DelegatedEvents, For, Hydration, voidFn as HydrationScript, NoHydration, Properties, RequestContext, SVGElements, SVGNamespace, addEventListener, assign, catchError, classList, className, clearDelegatedEvents, createComponent, createEffect, createMemo, createProjection, createRoot, createSignal, createStore, delegateEvents, dynamicProperty, createRenderEffect as effect, flushSync, voidFn as generateHydrationScript, voidFn as getAssets, getHydrationKey, getNextElement, getNextMarker, getNextMatch, getOwner, getPropAlias, voidFn as getRequestEvent, hydrate, insert, isWrappable, createMemo as memo, mergeProps, onCleanup, render, runHydrationEvents, runWithOwner, setAttribute, setAttributeNS, setBoolAttribute, setProperty, spread, style, template, untrack, unwrap, use, voidFn as useAssets, setProperty$1 as setStoreProperty, $RAW };

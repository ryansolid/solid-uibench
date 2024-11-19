(function () {
  'use strict';

  const equalFn = (a, b) => a === b;
  let runEffects = runQueue;
  const NOTPENDING = {};
  const STALE = 1;
  const PENDING = 2;
  const UNOWNED = {
    owned: null,
    cleanups: null,
    context: null,
    owner: null
  };
  createSignal(false, true);
  let Owner = null;
  let Listener = null;
  let Pending = null;
  let Updates = null;
  let Effects = null;
  let ExecCount = 0;
  function createRoot(fn, detachedOwner) {
    const listener = Listener,
          owner = Owner,
          root = fn.length === 0 ? UNOWNED : {
      owned: null,
      cleanups: null,
      context: null,
      owner
    };
    Owner = root;
    Listener = null;
    let result;
    try {
      runUpdates(() => result = fn(() => cleanNode(root)), true);
    } finally {
      Listener = listener;
      Owner = owner;
    }
    return result;
  }
  function createSignal(value, areEqual) {
    const s = {
      value,
      observers: null,
      observerSlots: null,
      pending: NOTPENDING,
      comparator: areEqual ? typeof areEqual === "function" ? areEqual : equalFn : undefined
    };
    return [readSignal.bind(s), writeSignal.bind(s)];
  }
  function createRenderEffect(fn, value) {
    updateComputation(createComputation(fn, value, false));
  }
  function createMemo(fn, value, areEqual) {
    const c = createComputation(fn, value, true);
    c.pending = NOTPENDING;
    c.observers = null;
    c.observerSlots = null;
    c.state = 0;
    c.comparator = undefined;
    updateComputation(c);
    return readSignal.bind(c);
  }
  function batch(fn) {
    if (Pending) return fn();
    const q = Pending = [],
          result = fn();
    Pending = null;
    runUpdates(() => {
      for (let i = 0; i < q.length; i += 1) {
        const data = q[i];
        if (data.pending !== NOTPENDING) {
          const pending = data.pending;
          data.pending = NOTPENDING;
          writeSignal.call(data, pending);
        }
      }
    }, false);
    return result;
  }
  function untrack(fn) {
    let result,
        listener = Listener;
    Listener = null;
    result = fn();
    Listener = listener;
    return result;
  }
  function onCleanup(fn) {
    if (Owner === null) console.warn("cleanups created outside a `createRoot` or `render` will never be run");else if (Owner.cleanups === null) Owner.cleanups = [fn];else Owner.cleanups.push(fn);
    return fn;
  }
  function getListener() {
    return Listener;
  }
  function readSignal() {
    if (this.state && this.sources) {
      const updates = Updates;
      Updates = null;
      this.state === STALE ? updateComputation(this) : lookDownstream(this);
      Updates = updates;
    }
    if (Listener) {
      const sSlot = this.observers ? this.observers.length : 0;
      if (!Listener.sources) {
        Listener.sources = [this];
        Listener.sourceSlots = [sSlot];
      } else {
        Listener.sources.push(this);
        Listener.sourceSlots.push(sSlot);
      }
      if (!this.observers) {
        this.observers = [Listener];
        this.observerSlots = [Listener.sources.length - 1];
      } else {
        this.observers.push(Listener);
        this.observerSlots.push(Listener.sources.length - 1);
      }
    }
    return this.value;
  }
  function writeSignal(value, isComp) {
    if (this.comparator) {
      if (this.comparator(this.value, value)) return value;
    }
    if (Pending) {
      if (this.pending === NOTPENDING) Pending.push(this);
      this.pending = value;
      return value;
    }
    this.value = value;
    if (this.observers && (!Updates || this.observers.length)) {
      runUpdates(() => {
        for (let i = 0; i < this.observers.length; i += 1) {
          const o = this.observers[i];
          if (o.observers && o.state !== PENDING) markUpstream(o);
          o.state = STALE;
          if (o.pure) Updates.push(o);else Effects.push(o);
        }
        if (Updates.length > 10e5) {
          Updates = [];
          throw new Error("Potential Infinite Loop Detected.");
        }
      }, false);
    }
    return value;
  }
  function updateComputation(node) {
    if (!node.fn) return;
    cleanNode(node);
    const owner = Owner,
          listener = Listener,
          time = ExecCount;
    Listener = Owner = node;
    runComputation(node, node.value, time);
    Listener = listener;
    Owner = owner;
  }
  function runComputation(node, value, time) {
    let nextValue;
    try {
      nextValue = node.fn(value);
    } catch (err) {
      handleError(err);
    }
    if (!node.updatedAt || node.updatedAt <= time) {
      if (node.observers && node.observers.length) {
        writeSignal.call(node, nextValue, true);
      } else node.value = nextValue;
      node.updatedAt = time;
    }
  }
  function createComputation(fn, init, pure) {
    const c = {
      fn,
      state: STALE,
      updatedAt: null,
      owned: null,
      sources: null,
      sourceSlots: null,
      cleanups: null,
      value: init,
      owner: Owner,
      context: null,
      pure
    };
    if (Owner === null) console.warn("computations created outside a `createRoot` or `render` will never be disposed");else if (Owner !== UNOWNED) {
      {
        if (!Owner.owned) Owner.owned = [c];else Owner.owned.push(c);
      }
    }
    return c;
  }
  function runTop(node) {
    let top = node.state === STALE && node,
        pending;
    if (node.suspense && untrack(node.suspense.inFallback)) return node.suspense.effects.push(node);
    while (node.fn && (node = node.owner)) {
      if (node.state === PENDING) pending = node;else if (node.state === STALE) {
        top = node;
        pending = undefined;
      }
    }
    if (pending) {
      const updates = Updates;
      Updates = null;
      lookDownstream(pending);
      Updates = updates;
      if (!top || top.state !== STALE) return;
    }
    top && updateComputation(top);
  }
  function runUpdates(fn, init) {
    if (Updates) return fn();
    let wait = false;
    if (!init) Updates = [];
    if (Effects) wait = true;else Effects = [];
    ExecCount++;
    try {
      fn();
    } catch (err) {
      handleError(err);
    } finally {
      do {
        if (Updates) {
          runQueue(Updates);
          Updates = [];
        }
        if (!wait) {
          runEffects(Effects);
          Effects = [];
        }
      } while (Updates && Updates.length);
      Updates = null;
      if (wait) return;
      Effects = null;
    }
  }
  function runQueue(queue) {
    for (let i = 0; i < queue.length; i++) runTop(queue[i]);
  }
  function lookDownstream(node) {
    node.state = 0;
    for (let i = 0; i < node.sources.length; i += 1) {
      const source = node.sources[i];
      if (source.sources) {
        if (source.state === STALE) runTop(source);else if (source.state === PENDING) lookDownstream(source);
      }
    }
  }
  function markUpstream(node) {
    for (let i = 0; i < node.observers.length; i += 1) {
      const o = node.observers[i];
      if (!o.state) {
        o.state = PENDING;
        o.observers && markUpstream(o);
      }
    }
  }
  function cleanNode(node) {
    let i;
    if (node.sources) {
      while (node.sources.length) {
        const source = node.sources.pop(),
              index = node.sourceSlots.pop(),
              obs = source.observers;
        if (obs && obs.length) {
          const n = obs.pop(),
                s = source.observerSlots.pop();
          if (index < obs.length) {
            n.sourceSlots[s] = index;
            obs[index] = n;
            source.observerSlots[index] = s;
          }
        }
      }
    }
    if (node.owned) {
      for (i = 0; i < node.owned.length; i++) cleanNode(node.owned[i]);
      node.owned = null;
    }
    if (node.cleanups) {
      for (i = 0; i < node.cleanups.length; i++) node.cleanups[i]();
      node.cleanups = null;
    }
    node.state = 0;
    node.context = null;
  }
  function handleError(err) {
    throw err;
  }

  const $RAW = Symbol("state-raw"),
        $NODE = Symbol("state-node"),
        $PROXY = Symbol("state-proxy");
  function wrap(value, traps) {
    let p = value[$PROXY];
    if (!p) Object.defineProperty(value, $PROXY, {
      value: p = new Proxy(value, proxyTraps)
    });
    return p;
  }
  function isWrappable(obj) {
    return obj != null && typeof obj === "object" //&& (obj.__proto__ === Object.prototype || Array.isArray(obj));
  }
  function unwrap(item, skipGetters) {
    let result, unwrapped, v, prop;
    if (result = item != null && item[$RAW]) return result;
    if (!isWrappable(item)) return item;
    if (Array.isArray(item)) {
      if (Object.isFrozen(item)) item = item.slice(0);
      for (let i = 0, l = item.length; i < l; i++) {
        v = item[i];
        if ((unwrapped = unwrap(v, skipGetters)) !== v) item[i] = unwrapped;
      }
    } else {
      if (Object.isFrozen(item)) item = Object.assign({}, item);
      let keys = Object.keys(item),
          desc = skipGetters && Object.getOwnPropertyDescriptors(item);
      for (let i = 0, l = keys.length; i < l; i++) {
        prop = keys[i];
        if (skipGetters && desc[prop].get) continue;
        v = item[prop];
        if ((unwrapped = unwrap(v, skipGetters)) !== v) item[prop] = unwrapped;
      }
    }
    return item;
  }
  function getDataNodes(target) {
    let nodes = target[$NODE];
    if (!nodes) Object.defineProperty(target, $NODE, {
      value: nodes = {}
    });
    return nodes;
  }
  const proxyTraps = {
    get(target, property, receiver) {
      if (property === $RAW) return target;
      if (property === $PROXY) return receiver;
      const value = target[property];
      if (property === $NODE || property === "__proto__") return value;
      const wrappable = isWrappable(value);
      if (getListener() && (typeof value !== "function" || target.hasOwnProperty(property))) {
        let nodes, node;
        if (wrappable && (nodes = getDataNodes(value))) {
          node = nodes._ || (nodes._ = createSignal());
          node[0]();
        }
        nodes = getDataNodes(target);
        node = nodes[property] || (nodes[property] = createSignal());
        node[0]();
      }
      return wrappable ? wrap(value) : value;
    },
    set() {
      return true;
    },
    deleteProperty() {
      return true;
    }
  };
  function setProperty(state, property, value, force) {
    if (state[property] === value) return;
    const notify = Array.isArray(state) || !(property in state);
    if (value === undefined) {
      delete state[property];
    } else state[property] = value;
    let nodes = getDataNodes(state),
        node;
    (node = nodes[property]) && node[1]();
    notify && (node = nodes._) && node[1]();
  }
  function mergeState(state, value, force) {
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      setProperty(state, key, value[key]);
    }
  }
  function updatePath(current, path, traversed = []) {
    let part,
        prev = current;
    if (path.length > 1) {
      part = path.shift();
      const partType = typeof part,
            isArray = Array.isArray(current);
      if (Array.isArray(part)) {
        for (let i = 0; i < part.length; i++) {
          updatePath(current, [part[i]].concat(path), [part[i]].concat(traversed));
        }
        return;
      } else if (isArray && partType === "function") {
        for (let i = 0; i < current.length; i++) {
          if (part(current[i], i)) updatePath(current, [i].concat(path), [i].concat(traversed));
        }
        return;
      } else if (isArray && partType === "object") {
        const {
          from = 0,
          to = current.length - 1,
          by = 1
        } = part;
        for (let i = from; i <= to; i += by) {
          updatePath(current, [i].concat(path), [i].concat(traversed));
        }
        return;
      } else if (path.length > 1) {
        updatePath(current[part], path, [part].concat(traversed));
        return;
      }
      prev = current[part];
      traversed = [part].concat(traversed);
    }
    let value = path[0];
    if (typeof value === "function") {
      value = value(prev, traversed);
      if (value === prev) return;
    }
    if (part === undefined && value == undefined) return;
    value = unwrap(value);
    if (part === undefined || isWrappable(prev) && isWrappable(value) && !Array.isArray(value)) {
      mergeState(prev, value);
    } else setProperty(current, part, value);
  }
  function createState(state) {
    const unwrappedState = unwrap({}, true);
    const wrappedState = wrap(unwrappedState);
    function setState(...args) {
      batch(() => updatePath(unwrappedState, args));
    }
    return [wrappedState, setState];
  }

  function applyState(target, parent, property, merge, key) {
    let previous = parent[property];
    if (target === previous) return;
    if (!isWrappable(target) || !isWrappable(previous) || key && target[key] !== previous[key]) {
      target !== previous && setProperty(parent, property, target);
      return;
    }
    if (Array.isArray(target)) {
      if (target.length && previous.length && (!merge || key && target[0][key] != null)) {
        let i, j, start, end, newEnd, item, newIndicesNext, keyVal;
        for (start = 0, end = Math.min(previous.length, target.length); start < end && (previous[start] === target[start] || key && previous[start][key] === target[start][key]); start++) {
          applyState(target[start], previous, start, merge, key);
        }
        const temp = new Array(target.length),
              newIndices = new Map();
        for (end = previous.length - 1, newEnd = target.length - 1; end >= start && newEnd >= start && (previous[end] === target[newEnd] || key && previous[end][key] === target[newEnd][key]); end--, newEnd--) {
          temp[newEnd] = previous[end];
        }
        if (start > newEnd || start > end) {
          for (j = start; j <= newEnd; j++) setProperty(previous, j, target[j]);
          for (; j < target.length; j++) {
            setProperty(previous, j, temp[j]);
            applyState(target[j], previous, j, merge, key);
          }
          if (previous.length > target.length) setProperty(previous, "length", target.length);
          return;
        }
        newIndicesNext = new Array(newEnd + 1);
        for (j = newEnd; j >= start; j--) {
          item = target[j];
          keyVal = key ? item[key] : item;
          i = newIndices.get(keyVal);
          newIndicesNext[j] = i === undefined ? -1 : i;
          newIndices.set(keyVal, j);
        }
        for (i = start; i <= end; i++) {
          item = previous[i];
          keyVal = key ? item[key] : item;
          j = newIndices.get(keyVal);
          if (j !== undefined && j !== -1) {
            temp[j] = previous[i];
            j = newIndicesNext[j];
            newIndices.set(keyVal, j);
          }
        }
        for (j = start; j < target.length; j++) {
          if (j in temp) {
            setProperty(previous, j, temp[j]);
            applyState(target[j], previous, j, merge, key);
          } else setProperty(previous, j, target[j]);
        }
      } else {
        for (let i = 0, len = target.length; i < len; i++) {
          applyState(target[i], previous, i, merge, key);
        }
      }
      if (previous.length > target.length) setProperty(previous, "length", target.length);
      return;
    }
    const targetKeys = Object.keys(target);
    for (let i = 0, len = targetKeys.length; i < len; i++) {
      applyState(target[targetKeys[i]], previous, targetKeys[i], merge, key);
    }
    const previousKeys = Object.keys(previous);
    for (let i = 0, len = previousKeys.length; i < len; i++) {
      if (target[previousKeys[i]] === undefined) setProperty(previous, previousKeys[i], undefined);
    }
  }
  function reconcile(value, options = {}) {
    const {
      merge,
      key = "id"
    } = options,
          v = unwrap(value);
    return state => {
      if (!isWrappable(state)) return v;
      applyState(v, {
        state
      }, "state", merge, key);
      return state;
    };
  }

  const FALLBACK = Symbol("fallback");
  function mapArray(list, mapFn, options = {}) {
    let items = [],
        mapped = [],
        disposers = [],
        len = 0,
        indexes = mapFn.length > 1 ? [] : null;
    onCleanup(() => {
      for (let i = 0, length = disposers.length; i < length; i++) disposers[i]();
    });
    return () => {
      let newItems = list() || [],
          i,
          j;
      return untrack(() => {
        let newLen = newItems.length,
            newIndices,
            newIndicesNext,
            temp,
            tempdisposers,
            tempIndexes,
            start,
            end,
            newEnd,
            item;
        if (newLen === 0) {
          if (len !== 0) {
            for (i = 0; i < len; i++) disposers[i]();
            disposers = [];
            items = [];
            mapped = [];
            len = 0;
            indexes && (indexes = []);
          }
          if (options.fallback) {
            items = [FALLBACK];
            mapped[0] = createRoot(disposer => {
              disposers[0] = disposer;
              return options.fallback();
            });
            len = 1;
          }
        }
        else if (len === 0) {
            for (j = 0; j < newLen; j++) {
              items[j] = newItems[j];
              mapped[j] = createRoot(mapper);
            }
            len = newLen;
          } else {
            temp = new Array(newLen);
            tempdisposers = new Array(newLen);
            indexes && (tempIndexes = new Array(newLen));
            for (start = 0, end = Math.min(len, newLen); start < end && items[start] === newItems[start]; start++);
            for (end = len - 1, newEnd = newLen - 1; end >= start && newEnd >= start && items[end] === newItems[newEnd]; end--, newEnd--) {
              temp[newEnd] = mapped[end];
              tempdisposers[newEnd] = disposers[end];
              indexes && (tempIndexes[newEnd] = indexes[end]);
            }
            newIndices = new Map();
            newIndicesNext = new Array(newEnd + 1);
            for (j = newEnd; j >= start; j--) {
              item = newItems[j];
              i = newIndices.get(item);
              newIndicesNext[j] = i === undefined ? -1 : i;
              newIndices.set(item, j);
            }
            for (i = start; i <= end; i++) {
              item = items[i];
              j = newIndices.get(item);
              if (j !== undefined && j !== -1) {
                temp[j] = mapped[i];
                tempdisposers[j] = disposers[i];
                indexes && (tempIndexes[j] = indexes[i]);
                j = newIndicesNext[j];
                newIndices.set(item, j);
              } else disposers[i]();
            }
            for (j = start; j < newLen; j++) {
              if (j in temp) {
                mapped[j] = temp[j];
                disposers[j] = tempdisposers[j];
                if (indexes) {
                  indexes[j] = tempIndexes[j];
                  indexes[j](j);
                }
              } else mapped[j] = createRoot(mapper);
            }
            len = mapped.length = newLen;
            items = newItems.slice(0);
          }
        return mapped;
      });
      function mapper(disposer) {
        disposers[j] = disposer;
        if (indexes) {
          const [s, set] = createSignal(j, true);
          indexes[j] = set;
          return mapFn(newItems[j], s);
        }
        return mapFn(newItems[j]);
      }
    };
  }

  function createComponent(Comp, props) {
    return untrack(() => Comp(props));
  }

  function For(props) {
    const fallback = "fallback" in props && {
      fallback: () => props.fallback
    };
    return createMemo(mapArray(() => props.each, props.children, fallback ? fallback : undefined));
  }

  if (!globalThis.Solid$$) globalThis.Solid$$ = true;else console.warn("You appear to have multiple instances of Solid. This can lead to unexpected behavior.");

  function reconcileArrays(parentNode, a, b) {
    let bLength = b.length,
        aEnd = a.length,
        bEnd = bLength,
        aStart = 0,
        bStart = 0,
        after = a[aEnd - 1].nextSibling,
        map = null;
    while (aStart < aEnd || bStart < bEnd) {
      if (aEnd === aStart) {
        const node = bEnd < bLength ? bStart ? b[bStart - 1].nextSibling : b[bEnd - bStart] : after;
        while (bStart < bEnd) parentNode.insertBefore(b[bStart++], node);
      } else if (bEnd === bStart) {
        while (aStart < aEnd) {
          if (!map || !map.has(a[aStart])) parentNode.removeChild(a[aStart]);
          aStart++;
        }
      } else if (a[aStart] === b[bStart]) {
        aStart++;
        bStart++;
      } else if (a[aEnd - 1] === b[bEnd - 1]) {
        aEnd--;
        bEnd--;
      } else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
        const node = a[--aEnd].nextSibling;
        parentNode.insertBefore(b[bStart++], a[aStart++].nextSibling);
        parentNode.insertBefore(b[--bEnd], node);
        a[aEnd] = b[bEnd];
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
        } else parentNode.removeChild(a[aStart++]);
      }
    }
  }

  const eventRegistry = new Set();
  function template(html, check, isSVG) {
    const t = document.createElement("template");
    t.innerHTML = html;
    if (check && t.innerHTML.split("<").length - 1 !== check) throw `Template html does not match input:\n${t.innerHTML}\n\n${html}`;
    let node = t.content.firstChild;
    return node;
  }
  function delegateEvents(eventNames) {
    for (let i = 0, l = eventNames.length; i < l; i++) {
      const name = eventNames[i];
      if (!eventRegistry.has(name)) {
        eventRegistry.add(name);
        document.addEventListener(name, eventHandler);
      }
    }
  }
  function setAttribute(node, name, value) {
    if (value === false || value == null) node.removeAttribute(name);else node.setAttribute(name, value);
  }
  function insert(parent, accessor, marker, initial) {
    if (typeof accessor !== "function") return insertExpression(parent, accessor, initial, marker);
    createRenderEffect(current => insertExpression(parent, accessor(), current, marker), initial);
  }
  function eventHandler(e) {
    const key = `__${e.type}`;
    let node = e.composedPath && e.composedPath()[0] || e.target;
    if (e.target !== node) {
      Object.defineProperty(e, "target", {
        configurable: true,
        value: node
      });
    }
    Object.defineProperty(e, "currentTarget", {
      configurable: true,
      get() {
        return node;
      }
    });
    while (node !== null) {
      const handler = node[key];
      if (handler) {
        const data = node[`${key}Data`];
        data !== undefined ? handler(data, e) : handler(e);
        if (e.cancelBubble) return;
      }
      node = node.host && node.host instanceof Node ? node.host : node.parentNode;
    }
  }
  function insertExpression(parent, value, current, marker, unwrapArray) {
    while (typeof current === "function") current = current();
    if (value === current) return current;
    const t = typeof value;
    parent = parent;
    if (t === "string" || t === "number") {
      if (t === "number") value = value.toString();
      {
        if (current !== "" && typeof current === "string") {
          current = parent.firstChild.data = value;
        } else current = parent.textContent = value;
      }
    } else if (value == null || t === "boolean") {
      current = cleanChildren(parent, current, marker);
    } else if (t === "function") {
      createRenderEffect(() => current = insertExpression(parent, value(), current, marker));
      return () => current;
    } else if (Array.isArray(value)) {
      const array = [];
      if (normalizeIncomingArray(array, value, unwrapArray)) {
        createRenderEffect(() => current = insertExpression(parent, array, current, marker, true));
        return () => current;
      }
      if (array.length === 0) {
        current = cleanChildren(parent, current, marker);
      } else {
        if (Array.isArray(current)) {
          if (current.length === 0) {
            appendNodes(parent, array, marker);
          } else reconcileArrays(parent, current, array);
        } else if (current == null || current === "") {
          appendNodes(parent, array);
        } else {
          reconcileArrays(parent, [parent.firstChild], array);
        }
      }
      current = array;
    } else if (value instanceof Node) {
      if (Array.isArray(current)) {
        cleanChildren(parent, current, null, value);
      } else if (current == null || current === "" || !parent.firstChild) {
        parent.appendChild(value);
      } else parent.replaceChild(value, parent.firstChild);
      current = value;
    } else console.warn(`Skipped inserting`, value);
    return current;
  }
  function normalizeIncomingArray(normalized, array, unwrap) {
    let dynamic = false;
    for (let i = 0, len = array.length; i < len; i++) {
      let item = array[i],
          t;
      if (item instanceof Node) {
        normalized.push(item);
      } else if (item == null || item === true || item === false) ; else if (Array.isArray(item)) {
        dynamic = normalizeIncomingArray(normalized, item) || dynamic;
      } else if ((t = typeof item) === "string") {
        normalized.push(document.createTextNode(item));
      } else if (t === "function") {
        if (unwrap) {
          const idx = item();
          dynamic = normalizeIncomingArray(normalized, Array.isArray(idx) ? idx : [idx]) || dynamic;
        } else {
          normalized.push(item);
          dynamic = true;
        }
      } else normalized.push(document.createTextNode(item.toString()));
    }
    return dynamic;
  }
  function appendNodes(parent, array, marker) {
    for (let i = 0, len = array.length; i < len; i++) parent.insertBefore(array[i], marker);
  }
  function cleanChildren(parent, current, marker, replacement) {
    if (marker === undefined) return parent.textContent = "";
    const node = replacement || document.createTextNode("");
    if (current.length) {
      let inserted = false;
      for (let i = current.length - 1; i >= 0; i--) {
        const el = current[i];
        if (node !== el) {
          const isParent = el.parentNode === parent;
          if (!inserted && !i) isParent ? parent.replaceChild(node, el) : parent.insertBefore(node, marker);else isParent && parent.removeChild(el);
        } else inserted = true;
      }
    } else parent.insertBefore(node, marker);
    return [node];
  }

  const _tmpl$ = template(`<td class="TableCell"></td>`, 2),
    _tmpl$2 = template(`<table class="Table"><tbody></tbody></table>`, 4),
    _tmpl$3 = template(`<tr></tr>`, 2),
    _tmpl$4 = template(`<div class="Anim"></div>`, 2),
    _tmpl$5 = template(`<div class="AnimBox"></div>`, 2),
    _tmpl$6 = template(`<ul class="TreeNode"></ul>`, 2),
    _tmpl$7 = template(`<li class="TreeLeaf"></li>`, 2),
    _tmpl$8 = template(`<div class="Tree"></div>`, 2),
    _tmpl$9 = template(`<div class="Main"></div>`, 2),
    _tmpl$10 = template(`<pre></pre>`, 2);
  const Table = props => {
    let rowId, children;
    const onClick = (text, e) => {
        console.log('Clicked' + text);
        e.stopPropagation();
      },
      cells = row => {
        const children = new Array(row.props.length + 1);
        children[0] = (() => {
          const _el$ = _tmpl$.cloneNode(true);
          _el$.textContent = '#' + rowId;
          return _el$;
        })();
        for (let i = 1, len = children.length; i < len; i++) {
          const text = row.props[i - 1];
          children[i] = (() => {
            const _el$2 = _tmpl$.cloneNode(true);
            _el$2.__click = onClick;
            _el$2.__clickData = text;
            _el$2.textContent = text;
            return _el$2;
          })();
        }
        return children;
      };
    return (() => {
      const _el$3 = _tmpl$2.cloneNode(true),
        _el$4 = _el$3.firstChild;
      insert(_el$4, createComponent(For, {
        get each() {
          return props.data.items;
        },
        children: row => (rowId = row.id, children = cells(row), (() => {
          const _el$5 = _tmpl$3.cloneNode(true);
          setAttribute(_el$5, "data-id", rowId);
          insert(_el$5, children);
          createRenderEffect(() => _el$5.className = row.active ? 'TableRow active' : 'TableRow');
          return _el$5;
        })())
      }));
      return _el$3;
    })();
  };
  const Anim = props => {
    let boxId;
    return (() => {
      const _el$6 = _tmpl$4.cloneNode(true);
      insert(_el$6, createComponent(For, {
        get each() {
          return props.data.items;
        },
        children: box => (boxId = box.id, (() => {
          const _el$7 = _tmpl$5.cloneNode(true);
          setAttribute(_el$7, "data-id", boxId);
          createRenderEffect(_p$ => {
            const _v$ = (box.time % 10).toString() + 'px',
              _v$2 = 'rgba(0,0,0,' + (0.5 + box.time % 10 / 10).toString() + ')';
            _v$ !== _p$._v$ && _el$7.style.setProperty("border-radius", _p$._v$ = _v$);
            _v$2 !== _p$._v$2 && _el$7.style.setProperty("background", _p$._v$2 = _v$2);
            return _p$;
          }, {
            _v$: undefined,
            _v$2: undefined
          });
          return _el$7;
        })())
      }));
      return _el$6;
    })();
  };
  const TreeNode = props => (() => {
    const _el$8 = _tmpl$6.cloneNode(true);
    insert(_el$8, createComponent(For, {
      get each() {
        return props.data.children;
      },
      children: node => {
        const nodeId = node.id;
        return node.container ? createComponent(TreeNode, {
          data: node
        }) : (() => {
          const _el$9 = _tmpl$7.cloneNode(true);
          _el$9.textContent = nodeId;
          return _el$9;
        })();
      }
    }));
    return _el$8;
  })();
  const Tree = props => (() => {
    const _el$10 = _tmpl$8.cloneNode(true);
    insert(_el$10, createComponent(TreeNode, {
      get data() {
        return props.data.root;
      }
    }));
    return _el$10;
  })();
  const Main = props => {
    const section = () => {
      const location = props.data.location;
      if (location === 'table') return createComponent(Table, {
        get data() {
          return props.data.table;
        }
      });
      if (location === 'anim') return createComponent(Anim, {
        get data() {
          return props.data.anim;
        }
      });
      if (location === 'tree') return createComponent(Tree, {
        get data() {
          return props.data.tree;
        }
      });
    };
    return (() => {
      const _el$11 = _tmpl$9.cloneNode(true);
      insert(_el$11, () => section());
      return _el$11;
    })();
  };
  uibench.init('Solid', '0.21.0');
  const [state, setState] = createState();
  createRoot(() => document.querySelector('#App').appendChild(createComponent(Main, {
    data: state
  })));
  document.addEventListener('DOMContentLoaded', function (e) {
    uibench.run(s => {
      setState(reconcile(s));
    }, samples => {
      document.body.textContent = '';
      document.body.appendChild((() => {
        const _el$12 = _tmpl$10.cloneNode(true);
        insert(_el$12, () => JSON.stringify(samples, null, ' '));
        return _el$12;
      })());
    });
  });
  delegateEvents(["click"]);

})();

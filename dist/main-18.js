(function () {
  'use strict';

  const equalFn = (a, b) => a === b;
  const ERROR = Symbol("error");
  const NOTPENDING = {};
  const STALE = 1;
  const PENDING = 2;
  const UNOWNED = {
    owned: null,
    cleanups: null,
    context: null,
    owner: null
  };
  let Owner = null;
  let Listener = null;
  let Pending = null;
  let Updates = null;
  let Afters = [];
  let ExecCount = 0;
  function createRoot(fn, detachedOwner) {
    detachedOwner && (Owner = detachedOwner);
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
      result = fn(() => cleanNode(root));
    } catch (err) {
      const fns = lookup(Owner, ERROR);
      if (!fns) throw err;
      fns.forEach(f => f(err));
    } finally {
      while (Afters.length) Afters.shift()();
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
      comparator: areEqual
    };
    return [readSignal.bind(s), writeSignal.bind(s)];
  }
  function createEffect(fn, value) {
    updateComputation(createComputation(fn, value));
  }
  function createMemo(fn, value, areEqual) {
    const c = createComputation(fn, value);
    c.pending = NOTPENDING;
    c.observers = null;
    c.observerSlots = null;
    c.comparator = areEqual;
    updateComputation(c);
    return readSignal.bind(c);
  }
  function freeze(fn) {
    let pending = Pending,
        q = Pending = [];
    const result = fn();
    Pending = pending;
    runUpdates(() => {
      for (let i = 0; i < q.length; i += 1) {
        const data = q[i];
        if (data.pending !== NOTPENDING) {
          const pending = data.pending;
          data.pending = NOTPENDING;
          writeSignal.call(data, pending);
        }
      }
    });
    return result;
  }
  function sample(fn) {
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
  function isListening() {
    return Listener !== null;
  }
  function createContext(defaultValue) {
    const id = Symbol("context");
    return {
      id,
      Provider: createProvider(id),
      defaultValue
    };
  }
  function useContext(context) {
    return lookup(Owner, context.id) || context.defaultValue;
  }
  function getContextOwner() {
    return Owner;
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
  function writeSignal(value) {
    if (this.comparator && this.comparator(this.value, value)) return;
    if (Pending) {
      if (this.pending === NOTPENDING) Pending.push(this);
      this.pending = value;
      return;
    }
    this.value = value;
    if (this.observers && (!Updates || this.observers.length)) {
      runUpdates(() => {
        for (let i = 0; i < this.observers.length; i += 1) {
          const o = this.observers[i];
          if (o.observers && o.state !== PENDING) markUpstream(o);
          o.state = STALE;
          if (Updates.length > 10e5) throw new Error("Potential Infinite Loop Detected.");
          Updates.push(o);
        }
      });
    }
  }
  function updateComputation(node) {
    if (!node.fn) return;
    cleanNode(node);
    const owner = Owner,
          listener = Listener,
          time = ExecCount;
    Listener = Owner = node;
    const nextValue = node.fn(node.value);
    if (!node.updatedAt || node.updatedAt <= time) {
      if (node.observers && node.observers.length) {
        writeSignal.call(node, nextValue);
      } else node.value = nextValue;
      node.updatedAt = time;
    }
    Listener = listener;
    Owner = owner;
  }
  function createComputation(fn, init) {
    const c = {
      fn,
      state: 0,
      updatedAt: null,
      owned: null,
      sources: null,
      sourceSlots: null,
      cleanups: null,
      value: init,
      owner: Owner,
      context: null
    };
    if (Owner === null) console.warn("computations created outside a `createRoot` or `render` will never be disposed");else if (Owner !== UNOWNED) {
      if (!Owner.owned) Owner.owned = [c];else Owner.owned.push(c);
    }
    return c;
  }
  function runTop(node) {
    let top = node.state === STALE && node;
    while (node.fn && (node = node.owner)) node.state === STALE && (top = node);
    top && updateComputation(top);
  }
  function runUpdates(fn) {
    if (Updates) return fn();
    Updates = [];
    ExecCount++;
    try {
      fn();
      for (let i = 0; i < Updates.length; i += 1) {
        try {
          runTop(Updates[i]);
        } catch (err) {
          const fns = lookup(Owner, ERROR);
          if (!fns) throw err;
          fns.forEach(f => f(err));
        }
      }
    } finally {
      Updates = null;
      while (Afters.length) Afters.shift()();
    }
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
      node.state = 0;
    }
    if (node.owned) {
      for (i = 0; i < node.owned.length; i++) cleanNode(node.owned[i]);
      node.owned = null;
    }
    if (node.cleanups) {
      for (i = 0; i < node.cleanups.length; i++) node.cleanups[i]();
      node.cleanups = null;
    }
  }
  function lookup(owner, key) {
    return owner && (owner.context && owner.context[key] || owner.owner && lookup(owner.owner, key));
  }
  function resolveChildren(children) {
    if (typeof children === "function") return createMemo(() => resolveChildren(children()));
    if (Array.isArray(children)) {
      const results = [];
      for (let i = 0; i < children.length; i++) {
        let result = resolveChildren(children[i]);
        Array.isArray(result) ? results.push.apply(results, result) : results.push(result);
      }
      return results;
    }
    return children;
  }
  function createProvider(id) {
    return function provider(props) {
      let rendered;
      createEffect(() => {
        Owner.context = {
          [id]: props.value
        };
        rendered = sample(() => resolveChildren(props.children));
      });
      return rendered;
    };
  }

  const $RAW = Symbol("state-raw"),
        $NODE = Symbol("state-node"),
        $PROXY = Symbol("state-proxy");
  function wrap(value, traps) {
    return value[$PROXY] || (value[$PROXY] = new Proxy(value, proxyTraps));
  }
  function isWrappable(obj) {
    return obj != null && typeof obj === "object" //&& (obj.__proto__ === Object.prototype || Array.isArray(obj));
  }
  function unwrap(item) {
    let result, unwrapped, v;
    if (result = item != null && item[$RAW]) return result;
    if (!isWrappable(item)) return item;
    if (Array.isArray(item)) {
      if (Object.isFrozen(item)) item = item.slice(0);
      for (let i = 0, l = item.length; i < l; i++) {
        v = item[i];
        if ((unwrapped = unwrap(v)) !== v) item[i] = unwrapped;
      }
    } else {
      if (Object.isFrozen(item)) item = Object.assign({}, item);
      let keys = Object.keys(item);
      for (let i = 0, l = keys.length; i < l; i++) {
        v = item[keys[i]];
        if ((unwrapped = unwrap(v)) !== v) item[keys[i]] = unwrapped;
      }
    }
    return item;
  }
  function getDataNodes(target) {
    let nodes = target[$NODE];
    if (!nodes) target[$NODE] = nodes = {};
    return nodes;
  }
  const proxyTraps = {
    get(target, property) {
      if (property === $RAW) return target;
      if (property === $PROXY || property === $NODE) return;
      const value = target[property],
            wrappable = isWrappable(value);
      if (isListening() && (typeof value !== "function" || target.hasOwnProperty(property))) {
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
  const setterTraps = {
    get(target, property) {
      if (property === $RAW) return target;
      const value = target[property];
      return isWrappable(value) ? new Proxy(value, setterTraps) : value;
    },
    set(target, property, value) {
      setProperty(target, property, unwrap(value));
      return true;
    },
    deleteProperty(target, property) {
      setProperty(target, property, undefined);
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
        next = current;
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
      next = current[part];
      traversed = [part].concat(traversed);
    }
    let value = path[0];
    if (typeof value === "function") {
      const wrapped = part === undefined || isWrappable(next) ? new Proxy(next, setterTraps) : next;
      value = value(wrapped, traversed);
      if (value === wrapped || value === undefined) return;
    }
    value = unwrap(value);
    if (part === undefined || isWrappable(next) && isWrappable(value) && !Array.isArray(value)) {
      mergeState(next, value);
    } else setProperty(current, part, value);
  }
  function createState(state) {
    const unwrappedState = unwrap({});
    const wrappedState = wrap(unwrappedState);
    function setState(...args) {
      freeze(() => updatePath(unwrappedState, args));
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
    } = options;
    return state => {
      state = unwrap(state);
      if (!isWrappable(state)) return value;
      applyState(value, {
        state
      }, "state", merge, key);
    };
  }

  const FALLBACK = Symbol("fallback");
  function mapArray(list, mapFn, options) {
    if (typeof mapFn !== "function") {
      options = mapFn || {};
      mapFn = list;
      return map;
    }
    options || (options = {});
    return map(list);
    function map(list) {
      let items = [],
          mapped = [],
          disposers = [],
          len = 0;
      onCleanup(() => {
        for (let i = 0, length = disposers.length; i < length; i++) disposers[i]();
      });
      return () => {
        let newItems = list() || [],
            i,
            j;
        return sample(() => {
          let newLen = newItems.length,
              newIndices,
              newIndicesNext,
              temp,
              tempdisposers,
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
              for (start = 0, end = Math.min(len, newLen); start < end && items[start] === newItems[start]; start++);
              for (end = len - 1, newEnd = newLen - 1; end >= start && newEnd >= start && items[end] === newItems[newEnd]; end--, newEnd--) {
                temp[newEnd] = mapped[end];
                tempdisposers[newEnd] = disposers[end];
              }
              if (start > newEnd) {
                for (j = end; start <= j; j--) disposers[j]();
                const rLen = end - start + 1;
                if (rLen > 0) {
                  mapped.splice(start, rLen);
                  disposers.splice(start, rLen);
                }
                items = newItems.slice(0);
                len = newLen;
                return mapped;
              }
              if (start > end) {
                for (j = start; j <= newEnd; j++) mapped[j] = createRoot(mapper);
                for (; j < newLen; j++) {
                  mapped[j] = temp[j];
                  disposers[j] = tempdisposers[j];
                }
                items = newItems.slice(0);
                len = newLen;
                return mapped;
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
                  j = newIndicesNext[j];
                  newIndices.set(item, j);
                } else disposers[i]();
              }
              for (j = start; j < newLen; j++) {
                if (j in temp) {
                  mapped[j] = temp[j];
                  disposers[j] = tempdisposers[j];
                } else mapped[j] = createRoot(mapper);
              }
              len = mapped.length = newLen;
              items = newItems.slice(0);
            }
          return mapped;
        });
        function mapper(disposer) {
          disposers[j] = disposer;
          return mapFn(newItems[j], j);
        }
      };
    }
  }

  const runtimeConfig = {};

  function createActivityTracker() {
    let count = 0;
    const [read, trigger] = createSignal(false);
    return [read, () => count++ === 0 && trigger(true), () => --count <= 0 && trigger(false)];
  }
  const SuspenseContext = createContext({});
  const [active, increment, decrement] = createActivityTracker();
  SuspenseContext.active = active;
  SuspenseContext.increment = increment;
  SuspenseContext.decrement = decrement;
  function suspend(fn) {
    const {
      state
    } = useContext(SuspenseContext);
    let cached;
    return state ? () => state() === "suspended" ? cached : cached = fn() : fn;
  }

  function dynamicProperty(props, key) {
    const src = props[key];
    Object.defineProperty(props, key, {
      get() {
        return src();
      },
      enumerable: true
    });
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
      node !== current[0] && parent.replaceChild(node, current[0]);
      for (let i = current.length - 1; i > 0; i--) parent.removeChild(current[i]);
    } else parent.insertBefore(node, marker);
    return [node];
  }

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
      } else if (aEnd - aStart === 1 && bEnd - bStart === 1) {
        if (map && map.has(a[aStart])) {
          parentNode.insertBefore(b[bStart], bEnd < bLength ? b[bEnd] : after);
        } else parentNode.replaceChild(b[bStart], a[aStart]);
        break;
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
        if (map.has(a[aStart])) {
          const index = map.get(a[aStart]);
          if (bStart < index && index < bEnd) {
            let i = aStart,
                sequence = 1;
            while (++i < aEnd && i < bEnd) {
              if (!map.has(a[i]) || map.get(a[i]) !== index + sequence) break;
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

  var core = {
    config: runtimeConfig,
    currentContext: getContextOwner,
    root: createRoot,
    ignore: sample,
    effect: createEffect,
    memo: (fn, equal) => {
      if (!equal) return createMemo(fn);
      return createMemo(fn, undefined, equalFn);
    }
  };

  const eventRegistry = new Set(),
        {
    config = {},
    root,
    effect,
    memo,
    ignore,
    currentContext,
    createComponent: cc
  } = core,
        createComponent = cc || ((Comp, props, dynamicKeys) => {
    if (dynamicKeys) {
      for (let i = 0; i < dynamicKeys.length; i++) dynamicProperty(props, dynamicKeys[i]);
    }
    return ignore(() => Comp(props));
  });
  function template(html, check, isSVG) {
    const t = document.createElement("template");
    t.innerHTML = html;
    if (check && t.innerHTML.split("<").length - 1 !== check) console.warn(`Template html does not match input:\n${t.innerHTML}\n\n${html}`);
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
  function insert(parent, accessor, marker, initial) {
    if (typeof accessor !== "function") return insertExpression(parent, accessor, initial, marker);
    effect(current => insertExpression(parent, accessor(), current, marker), initial);
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
        data ? handler(data, e) : handler(e);
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
      if (config.hydrate && config.hydrate.registry) return current;
      current = cleanChildren(parent, current, marker);
    } else if (t === "function") {
      effect(() => current = insertExpression(parent, value(), current, marker));
      return () => current;
    } else if (Array.isArray(value)) {
      const array = [];
      if (normalizeIncomingArray(array, value, unwrapArray)) {
        effect(() => current = insertExpression(parent, array, current, marker, true));
        return () => current;
      }
      if (config.hydrate && config.hydrate.registry) return current;
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
      } else if (current == null || current === "") {
        parent.appendChild(value);
      } else parent.replaceChild(value, parent.firstChild);
      current = value;
    }
    return current;
  }

  function For(props) {
    const fallback = "fallback" in props && {
      fallback: () => props.fallback
    };
    return suspend(createMemo(mapArray(() => props.each, props.children, fallback ? fallback : undefined)));
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
  const _ck$ = ["each"],
    _ck$2 = ["data"];
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
        each: () => props.data.items,
        children: row => (rowId = row.id, children = cells(row), (() => {
          const _el$5 = _tmpl$3.cloneNode(true);
          _el$5.setAttribute("data-id", rowId);
          insert(_el$5, children);
          effect(() => _el$5.className = row.active ? 'TableRow active' : 'TableRow');
          return _el$5;
        })())
      }, _ck$));
      return _el$3;
    })();
  };
  const Anim = props => {
    let boxId;
    return (() => {
      const _el$6 = _tmpl$4.cloneNode(true);
      insert(_el$6, createComponent(For, {
        each: () => props.data.items,
        children: box => (boxId = box.id, (() => {
          const _el$7 = _tmpl$5.cloneNode(true);
          _el$7.setAttribute("data-id", boxId);
          effect(_p$ => {
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
      }, _ck$));
      return _el$6;
    })();
  };
  const TreeNode = props => (() => {
    const _el$8 = _tmpl$6.cloneNode(true);
    insert(_el$8, createComponent(For, {
      each: () => props.data.children,
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
    }, _ck$));
    return _el$8;
  })();
  const Tree = props => (() => {
    const _el$10 = _tmpl$8.cloneNode(true);
    insert(_el$10, createComponent(TreeNode, {
      data: () => props.data.root
    }, _ck$2));
    return _el$10;
  })();
  const Main = props => {
    const section = () => {
      const location = props.data.location;
      if (location === 'table') return createComponent(Table, {
        data: () => props.data.table
      }, _ck$2);
      if (location === 'anim') return createComponent(Anim, {
        data: () => props.data.anim
      }, _ck$2);
      if (location === 'tree') return createComponent(Tree, {
        data: () => props.data.tree
      }, _ck$2);
    };
    return (() => {
      const _el$11 = _tmpl$9.cloneNode(true);
      insert(_el$11, () => section());
      return _el$11;
    })();
  };
  uibench.init('Solid', '0.18.0');
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

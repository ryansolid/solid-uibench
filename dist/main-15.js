(function () {
  'use strict';

  if (window && window.MessageChannel) {
    const channel = new MessageChannel();
          channel.port2;
    channel.port1.onmessage = () => {
    };
  }
  if (navigator && navigator.scheduling && navigator.scheduling.isInputPending) ;

  function createRoot(fn, detachedOwner) {
    let owner = Owner,
        listener = Listener,
        root = fn.length === 0 ? UNOWNED : createComputationNode(null, null),
        result = undefined,
        disposer = function _dispose() {
      if (RunningClock !== null) {
        RootClock.disposes.add(root);
      } else {
        dispose(root);
      }
    };
    Owner = root;
    Listener = null;
    try {
      result = fn(disposer);
    } finally {
      Listener = listener;
      Owner = owner;
    }
    return result;
  }
  function createEffect(fn, value) {
    createComputationNode(fn, value);
  }
  function createMemo(fn, value, comparator) {
    var node = createComputationNode(fn, value);
    node.comparator = null;
    return () => {
      if (Listener !== null) {
        const state = node.state;
        if ((state & 7) !== 0) {
          liftComputation(node);
        }
        if (node.age === RootClock.time && state === 8) {
          throw new Error("Circular dependency.");
        }
        if ((state & 16) === 0) {
          if (node.log === null) node.log = createLog();
          logRead(node.log);
        }
      }
      return node.value;
    };
  }
  function freeze(fn) {
    let result = undefined;
    if (RunningClock !== null) result = fn();else {
      RunningClock = RootClock;
      RunningClock.changes.reset();
      try {
        result = fn();
        event();
      } finally {
        RunningClock = null;
      }
    }
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
    if (Owner === null) console.warn("cleanups created without a root or parent will never be run");else if (Owner.cleanups === null) Owner.cleanups = [fn];else Owner.cleanups.push(fn);
  }
  function isListening() {
    return Listener !== null;
  }
  class DataNode {
    constructor(value) {
      this.value = value;
      this.pending = NOTPENDING;
      this.log = null;
    }
    current() {
      if (Listener !== null) {
        if (this.log === null) this.log = createLog();
        logRead(this.log);
      }
      return this.value;
    }
    next(value) {
      if (RunningClock !== null) {
        if (this.pending !== NOTPENDING) {
          if (value !== this.pending) {
            throw new Error("conflicting changes: " + value + " !== " + this.pending);
          }
        } else {
          this.pending = value;
          RootClock.changes.add(this);
        }
      } else {
        if (this.log !== null) {
          this.pending = value;
          RootClock.changes.add(this);
          event();
        } else {
          this.value = value;
        }
      }
      return value;
    }
  }
  function createComputationNode(fn, value) {
    const node = {
      fn,
      value,
      age: RootClock.time,
      state: 0,
      comparator: null,
      source1: null,
      source1slot: 0,
      sources: null,
      sourceslots: null,
      dependents: null,
      dependentslot: 0,
      dependentcount: 0,
      owner: Owner,
      owned: null,
      log: null,
      context: null,
      cleanups: null
    };
    if (fn === null) return node;
    let owner = Owner,
        listener = Listener;
    if (owner === null) console.warn("computations created without a root or parent will never be disposed");
    Owner = Listener = node;
    if (RunningClock === null) {
      toplevelComputation(node);
    } else {
      node.value = node.fn(node.value);
    }
    if (owner && owner !== UNOWNED) {
      if (owner.owned === null) owner.owned = [node];else owner.owned.push(node);
    }
    Owner = owner;
    Listener = listener;
    return node;
  }
  function createClock() {
    return {
      time: 0,
      changes: new Queue(),
      updates: new Queue(),
      disposes: new Queue()
    };
  }
  function createLog() {
    return {
      node1: null,
      node1slot: 0,
      nodes: null,
      nodeslots: null
    };
  }
  class Queue {
    constructor() {
      this.items = [];
      this.count = 0;
    }
    reset() {
      this.count = 0;
    }
    add(item) {
      this.items[this.count++] = item;
    }
    run(fn) {
      let items = this.items;
      for (let i = 0; i < this.count; i++) {
        fn(items[i]);
        items[i] = null;
      }
      this.count = 0;
    }
  }
  let RootClock = createClock(),
      RunningClock = null,
  Listener = null,
  Owner = null,
  Pending = null;
  let NOTPENDING = {},
      UNOWNED = createComputationNode(null, null);
  function logRead(from) {
    let to = Listener,
        fromslot,
        toslot = to.source1 === null ? -1 : to.sources === null ? 0 : to.sources.length;
    if (from.node1 === null) {
      from.node1 = to;
      from.node1slot = toslot;
      fromslot = -1;
    } else if (from.nodes === null) {
      if (from.node1 === to) return;
      from.nodes = [to];
      from.nodeslots = [toslot];
      fromslot = 0;
    } else {
      fromslot = from.nodes.length;
      if (from.nodes[fromslot - 1] === to) return;
      from.nodes.push(to);
      from.nodeslots.push(toslot);
    }
    if (to.source1 === null) {
      to.source1 = from;
      to.source1slot = fromslot;
    } else if (to.sources === null) {
      to.sources = [from];
      to.sourceslots = [fromslot];
    } else {
      to.sources.push(from);
      to.sourceslots.push(fromslot);
    }
  }
  function liftComputation(node) {
    if ((node.state & 6) !== 0) {
      applyUpstreamUpdates(node);
    }
    if ((node.state & 1) !== 0) {
      updateNode(node);
    }
    resetComputation(node, 31);
  }
  function event() {
    let owner = Owner;
    RootClock.updates.reset();
    RootClock.time++;
    try {
      run(RootClock);
    } finally {
      RunningClock = Listener = null;
      Owner = owner;
    }
  }
  function toplevelComputation(node) {
    RunningClock = RootClock;
    RootClock.changes.reset();
    RootClock.updates.reset();
    try {
      node.value = node.fn(node.value);
      if (RootClock.changes.count > 0 || RootClock.updates.count > 0) {
        RootClock.time++;
        run(RootClock);
      }
    } finally {
      RunningClock = Owner = Listener = null;
    }
  }
  function run(clock) {
    let running = RunningClock,
        count = 0;
    RunningClock = clock;
    clock.disposes.reset();
    while (clock.changes.count !== 0 || clock.updates.count !== 0 || clock.disposes.count !== 0) {
      if (count > 0)
        clock.time++;
      clock.changes.run(applyDataChange);
      clock.updates.run(updateNode);
      clock.disposes.run(dispose);
      if (count++ > 1e5) {
        throw new Error("Runaway clock detected");
      }
    }
    RunningClock = running;
  }
  function applyDataChange(data) {
    data.value = data.pending;
    data.pending = NOTPENDING;
    if (data.log) setComputationState(data.log, stateStale);
  }
  function updateNode(node) {
    const state = node.state;
    if ((state & 16) === 0) {
      if ((state & 2) !== 0) {
        node.dependents[node.dependentslot++] = null;
        if (node.dependentslot === node.dependentcount) {
          resetComputation(node, 14);
        }
      } else if ((state & 1) !== 0) {
        if ((state & 4) !== 0) {
          liftComputation(node);
        } else if (node.comparator) {
          const current = updateComputation(node);
          const comparator = node.comparator;
          if (!comparator(current, node.value)) {
            markDownstreamComputations(node, false, true);
          }
        } else {
          updateComputation(node);
        }
      }
    }
  }
  function updateComputation(node) {
    const value = node.value,
          owner = Owner,
          listener = Listener;
    Owner = Listener = node;
    node.state = 8;
    cleanupNode(node, false);
    node.value = node.fn(node.value);
    resetComputation(node, 31);
    Owner = owner;
    Listener = listener;
    return value;
  }
  function stateStale(node) {
    const time = RootClock.time;
    if (node.age < time) {
      node.state |= 1;
      node.age = time;
      setDownstreamState(node, !!node.comparator);
    }
  }
  function statePending(node) {
    const time = RootClock.time;
    if (node.age < time) {
      node.state |= 2;
      let dependents = node.dependents || (node.dependents = []);
      dependents[node.dependentcount++] = Pending;
      setDownstreamState(node, true);
    }
  }
  function pendingStateStale(node) {
    if ((node.state & 2) !== 0) {
      node.state = 1;
      const time = RootClock.time;
      if (node.age < time) {
        node.age = time;
        if (!node.comparator) {
          markDownstreamComputations(node, false, true);
        }
      }
    }
  }
  function setDownstreamState(node, pending) {
    RootClock.updates.add(node);
    if (node.comparator) {
      const pending = Pending;
      Pending = node;
      markDownstreamComputations(node, true, false);
      Pending = pending;
    } else {
      markDownstreamComputations(node, pending, false);
    }
  }
  function markDownstreamComputations(node, onchange, dirty) {
    const owned = node.owned;
    if (owned !== null) {
      const pending = onchange && !dirty;
      markForDisposal(owned, pending, RootClock.time);
    }
    const log = node.log;
    if (log !== null) {
      setComputationState(log, dirty ? pendingStateStale : onchange ? statePending : stateStale);
    }
  }
  function setComputationState(log, stateFn) {
    const node1 = log.node1,
          nodes = log.nodes;
    if (node1 !== null) stateFn(node1);
    if (nodes !== null) {
      for (let i = 0, ln = nodes.length; i < ln; i++) {
        stateFn(nodes[i]);
      }
    }
  }
  function markForDisposal(children, pending, time) {
    for (let i = 0, ln = children.length; i < ln; i++) {
      const child = children[i];
      if (child !== null) {
        if (pending) {
          if ((child.state & 16) === 0) {
            child.state |= 4;
          }
        } else {
          child.age = time;
          child.state = 16;
        }
        const owned = child.owned;
        if (owned !== null) markForDisposal(owned, pending, time);
      }
    }
  }
  function applyUpstreamUpdates(node) {
    if ((node.state & 4) !== 0) {
      const owner = node.owner;
      if ((owner.state & 7) !== 0) liftComputation(owner);
      node.state &= ~4;
    }
    if ((node.state & 2) !== 0) {
      const slots = node.dependents;
      for (let i = node.dependentslot, ln = node.dependentcount; i < ln; i++) {
        const slot = slots[i];
        if (slot != null) liftComputation(slot);
        slots[i] = null;
      }
      node.state &= ~2;
    }
  }
  function cleanupNode(node, final) {
    let source1 = node.source1,
        sources = node.sources,
        sourceslots = node.sourceslots,
        cleanups = node.cleanups,
        owned = node.owned,
        i,
        len;
    if (cleanups !== null) {
      for (i = 0; i < cleanups.length; i++) {
        cleanups[i](final);
      }
      node.cleanups = null;
    }
    if (owned !== null) {
      for (i = 0; i < owned.length; i++) {
        dispose(owned[i]);
      }
      node.owned = null;
    }
    if (source1 !== null) {
      cleanupSource(source1, node.source1slot);
      node.source1 = null;
    }
    if (sources !== null) {
      for (i = 0, len = sources.length; i < len; i++) {
        cleanupSource(sources.pop(), sourceslots.pop());
      }
    }
  }
  function cleanupSource(source, slot) {
    let nodes = source.nodes,
        nodeslots = source.nodeslots,
        last,
        lastslot;
    if (slot === -1) {
      source.node1 = null;
    } else {
      last = nodes.pop();
      lastslot = nodeslots.pop();
      if (slot !== nodes.length) {
        nodes[slot] = last;
        nodeslots[slot] = lastslot;
        if (lastslot === -1) {
          last.source1slot = slot;
        } else {
          last.sourceslots[lastslot] = slot;
        }
      }
    }
  }
  function resetComputation(node, flags) {
    node.state &= ~flags;
    node.dependentslot = 0;
    node.dependentcount = 0;
  }
  function dispose(node) {
    node.fn = null;
    node.log = null;
    node.dependents = null;
    cleanupNode(node, true);
    resetComputation(node, 31);
  }

  const SNODE = Symbol("state-node"),
        SPROXY = Symbol("state-proxy");
  function wrap(value) {
    return value[SPROXY] || (value[SPROXY] = new Proxy(value, proxyTraps));
  }
  function isWrappable(obj) {
    return obj != null && typeof obj === "object"//&& (obj.__proto__ === Object.prototype || Array.isArray(obj));
  }
  function unwrap(item) {
    let result, unwrapped, v;
    if (result = item != null && item._state) return result;
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
    let nodes = target[SNODE];
    if (!nodes) target[SNODE] = nodes = {};
    return nodes;
  }
  const proxyTraps = {
    get(target, property) {
      if (property === "_state") return target;
      if (property === SPROXY || property === SNODE) return;
      const value = target[property],
            wrappable = isWrappable(value);
      if (isListening() && (typeof value !== "function" || target.hasOwnProperty(property))) {
        let nodes, node;
        if (wrappable && (nodes = getDataNodes(value))) {
          node = nodes._ || (nodes._ = new DataNode());
          node.current();
        }
        nodes = getDataNodes(target);
        node = nodes[property] || (nodes[property] = new DataNode());
        node.current();
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
      if (property === "_state") return target;
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
    (node = nodes[property]) && node.next();
    notify && (node = nodes._) && node.next();
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
          updatePath(current, [part[i]].concat(path), traversed.concat([part[i]]));
        }
        return;
      } else if (isArray && partType === "function") {
        for (let i = 0; i < current.length; i++) {
          if (part(current[i], i)) updatePath(current, [i].concat(path), traversed.concat([i]));
        }
        return;
      } else if (isArray && partType === "object") {
        const {
          from = 0,
          to = current.length - 1,
          by = 1
        } = part;
        for (let i = from; i <= to; i += by) {
          updatePath(current, [i].concat(path), traversed.concat([i]));
        }
        return;
      } else if (path.length > 1) {
        updatePath(current[part], path, traversed.concat([part]));
        return;
      }
      next = current[part];
      traversed = traversed.concat([part]);
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
  function map(list, mapFn, options) {
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

  const eventRegistry = new Set();
  function template(html, isSVG) {
    const t = document.createElement('template');
    t.innerHTML = html;
    if (t.innerHTML !== html) throw new Error(`Template html does not match input:\n${t.innerHTML}\n${html}`);
    let node = t.content.firstChild;
    return node;
  }
  function createComponent(Comp, props, dynamicKeys) {
    if (dynamicKeys) {
      for (let i = 0; i < dynamicKeys.length; i++) dynamicProp(props, dynamicKeys[i]);
    }
    return sample(() => Comp(props));
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
    if (typeof accessor === 'function') createEffect((current = initial) => insertExpression(parent, accessor(), current, marker));else if (Array.isArray(accessor) && checkDynamicArray(accessor)) {
      createEffect((current = initial) => insertExpression(parent, accessor, current, marker));
    } else {
      return insertExpression(parent, accessor, initial, marker);
    }
  }
  function dynamicProp(props, key) {
    const src = props[key];
    Object.defineProperty(props, key, {
      get() {
        return src();
      },
      enumerable: true
    });
  }
  function lookup(el) {
    return el && (el.model || lookup(el.host || el.parentNode));
  }
  function eventHandler(e) {
    const key = `__${e.type}`;
    let node = e.composedPath && e.composedPath()[0] || e.target;
    if (e.target !== node) {
      Object.defineProperty(e, 'target', {
        configurable: true,
        value: node
      });
    }
    Object.defineProperty(e, 'currentTarget', {
      configurable: true,
      get() {
        return node;
      }
    });
    while (node !== null) {
      const handler = node[key];
      if (handler) {
        const model = handler.length > 1 ? lookup(node) : undefined;
        handler(e, model);
        if (e.cancelBubble) return;
      }
      node = node.host && node.host instanceof Node ? node.host : node.parentNode;
    }
  }
  function normalizeIncomingArray(normalized, array) {
    for (let i = 0, len = array.length; i < len; i++) {
      let item = array[i],
          t;
      if (item instanceof Node) {
        normalized.push(item);
      } else if (item == null || item === true || item === false) ; else if (Array.isArray(item)) {
        normalizeIncomingArray(normalized, item);
      } else if ((t = typeof item) === 'string') {
        normalized.push(document.createTextNode(item));
      } else if (t === 'function') {
        const idx = item();
        normalizeIncomingArray(normalized, Array.isArray(idx) ? idx : [idx]);
      } else normalized.push(document.createTextNode(item.toString()));
    }
    return normalized;
  }
  function appendNodes(parent, array, marker) {
    for (let i = 0, len = array.length; i < len; i++) parent.insertBefore(array[i], marker);
  }
  function cleanChildren(parent, current, marker, replacement) {
    if (marker === undefined) return parent.textContent = '';
    const node = replacement || document.createTextNode('');
    if (current.length) {
      node !== current[0] && parent.replaceChild(node, current[0]);
      for (let i = current.length - 1; i > 0; i--) parent.removeChild(current[i]);
    } else parent.insertBefore(node, marker);
    return [node];
  }
  function checkDynamicArray(array) {
    for (let i = 0, len = array.length; i < len; i++) {
      const item = array[i];
      if (Array.isArray(item) && checkDynamicArray(item) || typeof item === 'function') return true;
    }
    return false;
  }
  function insertExpression(parent, value, current, marker) {
    if (value === current) return current;
    const t = typeof value;
    parent = parent;
    if (t === 'string' || t === 'number') {
      if (t === 'number') value = value.toString();
      {
        if (current !== '' && typeof current === 'string') {
          current = parent.firstChild.data = value;
        } else current = parent.textContent = value;
      }
    } else if (value == null || t === 'boolean') {
      current = cleanChildren(parent, current, marker);
    } else if (t === 'function') {
      createEffect(() => current = insertExpression(parent, value(), current, marker));
    } else if (Array.isArray(value)) {
      const array = normalizeIncomingArray([], value);
      if (array.length === 0) {
        current = cleanChildren(parent, current, marker);
      } else {
        if (Array.isArray(current)) {
          if (current.length === 0) {
            appendNodes(parent, array, marker);
          } else reconcileArrays(parent, current, array);
        } else if (current == null || current === '') {
          appendNodes(parent, array);
        } else {
          reconcileArrays(parent, [parent.firstChild], array);
        }
      }
      current = array;
    } else if (value instanceof Node) {
      if (Array.isArray(current)) {
        cleanChildren(parent, current, null, value);
      } else if (current == null || current === '') {
        parent.appendChild(value);
      } else parent.replaceChild(value, parent.firstChild);
      current = value;
    }
    return current;
  }
  var NOMATCH = -1;
  function reconcileArrays(parent, ns, us) {
    var ulen = us.length,
    nmin = 0,
        nmax = ns.length - 1,
        umin = 0,
        umax = ulen - 1,
    n = ns[nmin],
        u = us[umin],
    nx = ns[nmax],
        ux = us[umax],
    ul = nx.nextSibling,
        i,
        loop = true;
    fixes: while (loop) {
      loop = false;
      while (u === n) {
        umin++;
        nmin++;
        if (umin > umax || nmin > nmax) break fixes;
        u = us[umin];
        n = ns[nmin];
      }
      while (ux === nx) {
        ul = nx;
        umax--;
        nmax--;
        if (umin > umax || nmin > nmax) break fixes;
        ux = us[umax];
        nx = ns[nmax];
      }
      while (u === nx) {
        loop = true;
        parent.insertBefore(nx, n);
        umin++;
        nmax--;
        if (umin > umax || nmin > nmax) break fixes;
        u = us[umin];
        nx = ns[nmax];
      }
      while (ux === n) {
        loop = true;
        if (ul === null) parent.appendChild(n);else parent.insertBefore(n, ul);
        ul = n;
        umax--;
        nmin++;
        if (umin > umax || nmin > nmax) break fixes;
        ux = us[umax];
        n = ns[nmin];
      }
    }
    if (umin > umax) {
      while (nmin <= nmax) {
        parent.removeChild(ns[nmax]);
        nmax--;
      }
      return;
    }
    if (nmin > nmax) {
      while (umin <= umax) {
        parent.insertBefore(us[umin], ul);
        umin++;
      }
      return;
    }
    const P = new Array(umax - umin + 1),
          I = new Map();
    for (let i = umin; i <= umax; i++) {
      P[i] = NOMATCH;
      I.set(us[i], i);
    }
    let reusingNodes = umin + us.length - 1 - umax,
        toRemove = [];
    for (let i = nmin; i <= nmax; i++) {
      if (I.has(ns[i])) {
        P[I.get(ns[i])] = i;
        reusingNodes++;
      } else toRemove.push(i);
    }
    if (reusingNodes === 0) {
      if (n !== parent.firstChild || nx !== parent.lastChild) {
        for (i = nmin; i <= nmax; i++) parent.removeChild(ns[i]);
        while (umin <= umax) {
          parent.insertBefore(us[umin], ul);
          umin++;
        }
        return;
      }
      parent.textContent = '';
      while (umin <= umax) {
        parent.appendChild(us[umin]);
        umin++;
      }
      return;
    }
    var lcs = longestPositiveIncreasingSubsequence(P, umin),
        nodes = [],
        tmp = ns[nmin],
        lisIdx = lcs.length - 1,
        tmpB;
    for (let i = nmin; i <= nmax; i++) {
      nodes[i] = tmp;
      tmp = tmp.nextSibling;
    }
    for (let i = 0; i < toRemove.length; i++) parent.removeChild(nodes[toRemove[i]]);
    for (let i = umax; i >= umin; i--) {
      if (lcs[lisIdx] === i) {
        ul = nodes[P[lcs[lisIdx]]];
        lisIdx--;
      } else {
        tmpB = P[i] === NOMATCH ? us[i] : nodes[P[i]];
        parent.insertBefore(tmpB, ul);
        ul = tmpB;
      }
    }
  }
  function longestPositiveIncreasingSubsequence(ns, newStart) {
    let seq = [],
        is = [],
        l = -1,
        pre = new Array(ns.length);
    for (let i = newStart, len = ns.length; i < len; i++) {
      let n = ns[i];
      if (n < 0) continue;
      let j = findGreatestIndexLEQ(seq, n);
      if (j !== -1) pre[i] = is[j];
      if (j === l) {
        l++;
        seq[l] = n;
        is[l] = i;
      } else if (n < seq[j + 1]) {
        seq[j + 1] = n;
        is[j + 1] = i;
      }
    }
    for (let i = is[l]; l >= 0; i = pre[i], l--) {
      seq[l] = i;
    }
    return seq;
  }
  function findGreatestIndexLEQ(seq, n) {
    var lo = -1,
        hi = seq.length;
    if (hi > 0 && seq[hi - 1] <= n) return hi - 1;
    while (hi - lo > 1) {
      var mid = Math.floor((lo + hi) / 2);
      if (seq[mid] > n) {
        hi = mid;
      } else {
        lo = mid;
      }
    }
    return lo;
  }
  function For(props) {
    const fallback = "fallback" in props && {
      fallback: () => props.fallback
    };
    return createMemo(map(() => props.each, props.children, fallback ? fallback : undefined));
  }

  const _tmpl$ = template(`<td class="TableCell"></td>`),
    _tmpl$2 = template(`<table class="Table"><tbody></tbody></table>`),
    _tmpl$3 = template(`<tr></tr>`),
    _tmpl$4 = template(`<div class="Anim"></div>`),
    _tmpl$5 = template(`<div class="AnimBox"></div>`),
    _tmpl$6 = template(`<ul class="TreeNode"></ul>`),
    _tmpl$7 = template(`<li class="TreeLeaf"></li>`),
    _tmpl$8 = template(`<div class="Tree"></div>`),
    _tmpl$9 = template(`<div class="Main"></div>`),
    _tmpl$10 = template(`<pre></pre>`);
  const Table = props => {
    let rowId, children;
    const onClick = (text, e) => {
        console.log('Clicked' + text);
        e.stopPropagation();
      },
      cells = row => {
        const children = new Array(row.props.length + 1);
        children[0] = function () {
          const _el$ = _tmpl$.cloneNode(true);
          _el$.textContent = '#' + rowId;
          return _el$;
        }();
        for (let i = 1, len = children.length; i < len; i++) {
          const text = row.props[i - 1];
          children[i] = function () {
            const _el$2 = _tmpl$.cloneNode(true);
            _el$2.__click = onClick;
            _el$2.model = text;
            _el$2.textContent = text;
            return _el$2;
          }();
        }
        return children;
      };
    return function () {
      const _el$3 = _tmpl$2.cloneNode(true),
        _el$4 = _el$3.firstChild;
      insert(_el$4, createComponent(For, {
        each: () => props.data.items,
        children: row => (rowId = row.id, children = cells(row), function () {
          const _el$5 = _tmpl$3.cloneNode(true);
          _el$5.setAttribute("data-id", rowId);
          insert(_el$5, children);
          createEffect(() => _el$5.className = row.active ? 'TableRow active' : 'TableRow');
          return _el$5;
        }())
      }, ["each"]));
      return _el$3;
    }();
  };
  const Anim = props => {
    let boxId;
    return function () {
      const _el$6 = _tmpl$4.cloneNode(true);
      insert(_el$6, createComponent(For, {
        each: () => props.data.items,
        children: box => (boxId = box.id, function () {
          const _el$7 = _tmpl$5.cloneNode(true);
          _el$7.setAttribute("data-id", boxId);
          createEffect(() => Object.assign(_el$7.style, {
            "border-radius": (box.time % 10).toString() + 'px',
            background: 'rgba(0,0,0,' + (0.5 + box.time % 10 / 10).toString() + ')'
          }));
          return _el$7;
        }())
      }, ["each"]));
      return _el$6;
    }();
  };
  const TreeNode = props => function () {
    const _el$8 = _tmpl$6.cloneNode(true);
    insert(_el$8, createComponent(For, {
      each: () => props.data.children,
      children: node => {
        const nodeId = node.id;
        return node.container ? createComponent(TreeNode, {
          data: node
        }) : function () {
          const _el$9 = _tmpl$7.cloneNode(true);
          _el$9.textContent = nodeId;
          return _el$9;
        }();
      }
    }, ["each"]));
    return _el$8;
  }();
  const Tree = props => function () {
    const _el$10 = _tmpl$8.cloneNode(true);
    insert(_el$10, createComponent(TreeNode, {
      data: () => props.data.root
    }, ["data"]));
    return _el$10;
  }();
  const Main = props => {
    const section = () => {
      const location = props.data.location;
      if (location === 'table') return createComponent(Table, {
        data: () => props.data.table
      }, ["data"]);
      if (location === 'anim') return createComponent(Anim, {
        data: () => props.data.anim
      }, ["data"]);
      if (location === 'tree') return createComponent(Tree, {
        data: () => props.data.tree
      }, ["data"]);
    };
    return function () {
      const _el$11 = _tmpl$9.cloneNode(true);
      insert(_el$11, () => section());
      return _el$11;
    }();
  };
  uibench.init('Solid', '0.15.0');
  const [state, setState] = createState();
  createRoot(() => document.querySelector('#App').appendChild(createComponent(Main, {
    data: state
  })));
  document.addEventListener('DOMContentLoaded', function (e) {
    uibench.run(s => {
      setState(reconcile(s));
    }, samples => {
      document.body.textContent = '';
      document.body.appendChild(function () {
        const _el$12 = _tmpl$10.cloneNode(true);
        insert(_el$12, () => JSON.stringify(samples, null, ' '));
        return _el$12;
      }());
    });
  });
  delegateEvents(["click"]);

})();

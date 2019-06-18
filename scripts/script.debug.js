var $jscomp = $jscomp || {};
$jscomp.scope = {};
$jscomp.getGlobal = function(maybeGlobal) {
  return typeof window != "undefined" && window === maybeGlobal ? maybeGlobal : typeof global != "undefined" && global != null ? global : maybeGlobal;
};
$jscomp.global = $jscomp.getGlobal(this);
$jscomp.checkEs6ConformanceViaProxy = function() {
  try {
    var proxied = {};
    var proxy = Object.create(new $jscomp.global["Proxy"](proxied, {"get":function(target, key, receiver) {
      return target == proxied && key == "q" && receiver == proxy;
    }}));
    return proxy["q"] === true;
  } catch (err) {
    return false;
  }
};
$jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS = false;
$jscomp.ES6_CONFORMANCE = $jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS && $jscomp.checkEs6ConformanceViaProxy();
$jscomp.arrayIteratorImpl = function(array) {
  var index = 0;
  return function() {
    if (index < array.length) {
      return {done:false, value:array[index++]};
    } else {
      return {done:true};
    }
  };
};
$jscomp.arrayIterator = function(array) {
  return {next:$jscomp.arrayIteratorImpl(array)};
};
$jscomp.ASSUME_ES5 = false;
$jscomp.ASSUME_NO_NATIVE_MAP = false;
$jscomp.ASSUME_NO_NATIVE_SET = false;
$jscomp.SIMPLE_FROUND_POLYFILL = false;
$jscomp.defineProperty = $jscomp.ASSUME_ES5 || typeof Object.defineProperties == "function" ? Object.defineProperty : function(target, property, descriptor) {
  descriptor = descriptor;
  if (target == Array.prototype || target == Object.prototype) {
    return;
  }
  target[property] = descriptor.value;
};
$jscomp.SYMBOL_PREFIX = "jscomp_symbol_";
$jscomp.initSymbol = function() {
  $jscomp.initSymbol = function() {
  };
  if (!$jscomp.global["Symbol"]) {
    $jscomp.global["Symbol"] = $jscomp.Symbol;
  }
};
$jscomp.Symbol = function() {
  var counter = 0;
  function Symbol(opt_description) {
    return $jscomp.SYMBOL_PREFIX + (opt_description || "") + counter++;
  }
  return Symbol;
}();
$jscomp.initSymbolIterator = function() {
  $jscomp.initSymbol();
  var symbolIterator = $jscomp.global["Symbol"].iterator;
  if (!symbolIterator) {
    symbolIterator = $jscomp.global["Symbol"].iterator = $jscomp.global["Symbol"]("iterator");
  }
  if (typeof Array.prototype[symbolIterator] != "function") {
    $jscomp.defineProperty(Array.prototype, symbolIterator, {configurable:true, writable:true, value:function() {
      return $jscomp.iteratorPrototype($jscomp.arrayIteratorImpl(this));
    }});
  }
  $jscomp.initSymbolIterator = function() {
  };
};
$jscomp.initSymbolAsyncIterator = function() {
  $jscomp.initSymbol();
  var symbolAsyncIterator = $jscomp.global["Symbol"].asyncIterator;
  if (!symbolAsyncIterator) {
    symbolAsyncIterator = $jscomp.global["Symbol"].asyncIterator = $jscomp.global["Symbol"]("asyncIterator");
  }
  $jscomp.initSymbolAsyncIterator = function() {
  };
};
$jscomp.iteratorPrototype = function(next) {
  $jscomp.initSymbolIterator();
  var iterator = {next:next};
  iterator[$jscomp.global["Symbol"].iterator] = function() {
    return this;
  };
  return iterator;
};
$jscomp.makeIterator = function(iterable) {
  var iteratorFunction = typeof Symbol != "undefined" && Symbol.iterator && iterable[Symbol.iterator];
  return iteratorFunction ? iteratorFunction.call(iterable) : $jscomp.arrayIterator(iterable);
};
$jscomp.owns = function(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};
$jscomp.polyfill = function(target, polyfill, fromLang, toLang) {
  if (!polyfill) {
    return;
  }
  var obj = $jscomp.global;
  var split = target.split(".");
  for (var i = 0; i < split.length - 1; i++) {
    var key = split[i];
    if (!(key in obj)) {
      obj[key] = {};
    }
    obj = obj[key];
  }
  var property = split[split.length - 1];
  var orig = obj[property];
  var impl = polyfill(orig);
  if (impl == orig || impl == null) {
    return;
  }
  $jscomp.defineProperty(obj, property, {configurable:true, writable:true, value:impl});
};
$jscomp.polyfill("WeakMap", function(NativeWeakMap) {
  function isConformant() {
    if (!NativeWeakMap || !Object.seal) {
      return false;
    }
    try {
      var x = Object.seal({});
      var y = Object.seal({});
      var map = new NativeWeakMap([[x, 2], [y, 3]]);
      if (map.get(x) != 2 || map.get(y) != 3) {
        return false;
      }
      map["delete"](x);
      map.set(y, 4);
      return !map.has(x) && map.get(y) == 4;
    } catch (err) {
      return false;
    }
  }
  if ($jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS) {
    if (NativeWeakMap && $jscomp.ES6_CONFORMANCE) {
      return NativeWeakMap;
    }
  } else {
    if (isConformant()) {
      return NativeWeakMap;
    }
  }
  var prop = "$jscomp_hidden_" + Math.random();
  function WeakMapMembership() {
  }
  function insert(target) {
    if (!$jscomp.owns(target, prop)) {
      var obj = new WeakMapMembership;
      $jscomp.defineProperty(target, prop, {value:obj});
    }
  }
  function patch(name) {
    var prev = Object[name];
    if (prev) {
      Object[name] = function(target) {
        if (target instanceof WeakMapMembership) {
          return target;
        } else {
          insert(target);
          return prev(target);
        }
      };
    }
  }
  patch("freeze");
  patch("preventExtensions");
  patch("seal");
  var index = 0;
  var PolyfillWeakMap = function(opt_iterable) {
    this.id_ = (index += Math.random() + 1).toString();
    if (opt_iterable) {
      var iter = $jscomp.makeIterator(opt_iterable);
      var entry;
      while (!(entry = iter.next()).done) {
        var item = entry.value;
        this.set(item[0], item[1]);
      }
    }
  };
  PolyfillWeakMap.prototype.set = function(key, value) {
    insert(key);
    if (!$jscomp.owns(key, prop)) {
      throw new Error("WeakMap key fail: " + key);
    }
    key[prop][this.id_] = value;
    return this;
  };
  PolyfillWeakMap.prototype.get = function(key) {
    return $jscomp.owns(key, prop) ? key[prop][this.id_] : undefined;
  };
  PolyfillWeakMap.prototype.has = function(key) {
    return $jscomp.owns(key, prop) && $jscomp.owns(key[prop], this.id_);
  };
  PolyfillWeakMap.prototype["delete"] = function(key) {
    if (!$jscomp.owns(key, prop) || !$jscomp.owns(key[prop], this.id_)) {
      return false;
    }
    return delete key[prop][this.id_];
  };
  return PolyfillWeakMap;
}, "es6", "es3");
$jscomp.MapEntry = function() {
  this.previous;
  this.next;
  this.head;
  this.key;
  this.value;
};
$jscomp.polyfill("Map", function(NativeMap) {
  function isConformant() {
    if ($jscomp.ASSUME_NO_NATIVE_MAP || !NativeMap || typeof NativeMap != "function" || !NativeMap.prototype.entries || typeof Object.seal != "function") {
      return false;
    }
    try {
      NativeMap = NativeMap;
      var key = Object.seal({x:4});
      var map = new NativeMap($jscomp.makeIterator([[key, "s"]]));
      if (map.get(key) != "s" || map.size != 1 || map.get({x:4}) || map.set({x:4}, "t") != map || map.size != 2) {
        return false;
      }
      var iter = map.entries();
      var item = iter.next();
      if (item.done || item.value[0] != key || item.value[1] != "s") {
        return false;
      }
      item = iter.next();
      if (item.done || item.value[0].x != 4 || item.value[1] != "t" || !iter.next().done) {
        return false;
      }
      return true;
    } catch (err) {
      return false;
    }
  }
  if ($jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS) {
    if (NativeMap && $jscomp.ES6_CONFORMANCE) {
      return NativeMap;
    }
  } else {
    if (isConformant()) {
      return NativeMap;
    }
  }
  $jscomp.initSymbolIterator();
  var idMap = new WeakMap;
  var PolyfillMap = function(opt_iterable) {
    this.data_ = {};
    this.head_ = createHead();
    this.size = 0;
    if (opt_iterable) {
      var iter = $jscomp.makeIterator(opt_iterable);
      var entry;
      while (!(entry = iter.next()).done) {
        var item = entry.value;
        this.set(item[0], item[1]);
      }
    }
  };
  PolyfillMap.prototype.set = function(key, value) {
    key = key === 0 ? 0 : key;
    var r = maybeGetEntry(this, key);
    if (!r.list) {
      r.list = this.data_[r.id] = [];
    }
    if (!r.entry) {
      r.entry = {next:this.head_, previous:this.head_.previous, head:this.head_, key:key, value:value};
      r.list.push(r.entry);
      this.head_.previous.next = r.entry;
      this.head_.previous = r.entry;
      this.size++;
    } else {
      r.entry.value = value;
    }
    return this;
  };
  PolyfillMap.prototype["delete"] = function(key) {
    var r = maybeGetEntry(this, key);
    if (r.entry && r.list) {
      r.list.splice(r.index, 1);
      if (!r.list.length) {
        delete this.data_[r.id];
      }
      r.entry.previous.next = r.entry.next;
      r.entry.next.previous = r.entry.previous;
      r.entry.head = null;
      this.size--;
      return true;
    }
    return false;
  };
  PolyfillMap.prototype.clear = function() {
    this.data_ = {};
    this.head_ = this.head_.previous = createHead();
    this.size = 0;
  };
  PolyfillMap.prototype.has = function(key) {
    return !!maybeGetEntry(this, key).entry;
  };
  PolyfillMap.prototype.get = function(key) {
    var entry = maybeGetEntry(this, key).entry;
    return entry && entry.value;
  };
  PolyfillMap.prototype.entries = function() {
    return makeIterator(this, function(entry) {
      return [entry.key, entry.value];
    });
  };
  PolyfillMap.prototype.keys = function() {
    return makeIterator(this, function(entry) {
      return entry.key;
    });
  };
  PolyfillMap.prototype.values = function() {
    return makeIterator(this, function(entry) {
      return entry.value;
    });
  };
  PolyfillMap.prototype.forEach = function(callback, opt_thisArg) {
    var iter = this.entries();
    var item;
    while (!(item = iter.next()).done) {
      var entry = item.value;
      callback.call(opt_thisArg, entry[1], entry[0], this);
    }
  };
  PolyfillMap.prototype[Symbol.iterator] = PolyfillMap.prototype.entries;
  var maybeGetEntry = function(map, key) {
    var id = getId(key);
    var list = map.data_[id];
    if (list && $jscomp.owns(map.data_, id)) {
      for (var index = 0; index < list.length; index++) {
        var entry = list[index];
        if (key !== key && entry.key !== entry.key || key === entry.key) {
          return {id:id, list:list, index:index, entry:entry};
        }
      }
    }
    return {id:id, list:list, index:-1, entry:undefined};
  };
  var makeIterator = function(map, func) {
    var entry = map.head_;
    return $jscomp.iteratorPrototype(function() {
      if (entry) {
        while (entry.head != map.head_) {
          entry = entry.previous;
        }
        while (entry.next != entry.head) {
          entry = entry.next;
          return {done:false, value:func(entry)};
        }
        entry = null;
      }
      return {done:true, value:void 0};
    });
  };
  var createHead = function() {
    var head = {};
    head.previous = head.next = head.head = head;
    return head;
  };
  var mapIndex = 0;
  var getId = function(obj) {
    var type = obj && typeof obj;
    if (type == "object" || type == "function") {
      obj = obj;
      if (!idMap.has(obj)) {
        var id = "" + ++mapIndex;
        idMap.set(obj, id);
        return id;
      }
      return idMap.get(obj);
    }
    return "p_" + obj;
  };
  return PolyfillMap;
}, "es6", "es3");
$jscomp.polyfill("Set", function(NativeSet) {
  function isConformant() {
    if ($jscomp.ASSUME_NO_NATIVE_SET || !NativeSet || typeof NativeSet != "function" || !NativeSet.prototype.entries || typeof Object.seal != "function") {
      return false;
    }
    try {
      NativeSet = NativeSet;
      var value = Object.seal({x:4});
      var set = new NativeSet($jscomp.makeIterator([value]));
      if (!set.has(value) || set.size != 1 || set.add(value) != set || set.size != 1 || set.add({x:4}) != set || set.size != 2) {
        return false;
      }
      var iter = set.entries();
      var item = iter.next();
      if (item.done || item.value[0] != value || item.value[1] != value) {
        return false;
      }
      item = iter.next();
      if (item.done || item.value[0] == value || item.value[0].x != 4 || item.value[1] != item.value[0]) {
        return false;
      }
      return iter.next().done;
    } catch (err) {
      return false;
    }
  }
  if ($jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS) {
    if (NativeSet && $jscomp.ES6_CONFORMANCE) {
      return NativeSet;
    }
  } else {
    if (isConformant()) {
      return NativeSet;
    }
  }
  $jscomp.initSymbolIterator();
  var PolyfillSet = function(opt_iterable) {
    this.map_ = new Map;
    if (opt_iterable) {
      var iter = $jscomp.makeIterator(opt_iterable);
      var entry;
      while (!(entry = iter.next()).done) {
        var item = entry.value;
        this.add(item);
      }
    }
    this.size = this.map_.size;
  };
  PolyfillSet.prototype.add = function(value) {
    value = value === 0 ? 0 : value;
    this.map_.set(value, value);
    this.size = this.map_.size;
    return this;
  };
  PolyfillSet.prototype["delete"] = function(value) {
    var result = this.map_["delete"](value);
    this.size = this.map_.size;
    return result;
  };
  PolyfillSet.prototype.clear = function() {
    this.map_.clear();
    this.size = 0;
  };
  PolyfillSet.prototype.has = function(value) {
    return this.map_.has(value);
  };
  PolyfillSet.prototype.entries = function() {
    return this.map_.entries();
  };
  PolyfillSet.prototype.values = function() {
    return this.map_.values();
  };
  PolyfillSet.prototype.keys = PolyfillSet.prototype.values;
  PolyfillSet.prototype[Symbol.iterator] = PolyfillSet.prototype.values;
  PolyfillSet.prototype.forEach = function(callback, opt_thisArg) {
    var set = this;
    this.map_.forEach(function(value) {
      return callback.call(opt_thisArg, value, value, set);
    });
  };
  return PolyfillSet;
}, "es6", "es3");
(function() {
  var Module = function(id, opt_exports) {
    this.id = id;
    this.exports = opt_exports || {};
  };
  Module.prototype.exportAllFrom = function(other) {
    var module = this;
    var define = {};
    for (var key in other) {
      if (key == "default" || key in module.exports || key in define) {
        continue;
      }
      define[key] = {enumerable:true, get:function(key) {
        return function() {
          return other[key];
        };
      }(key)};
    }
    $jscomp.global.Object.defineProperties(module.exports, define);
  };
  var CacheEntry = function(def, module, path) {
    this.def = def;
    this.module = module;
    this.path = path;
    this.blockingDeps = new Set;
  };
  CacheEntry.prototype.load = function() {
    if (this.def) {
      var def = this.def;
      this.def = null;
      callRequireCallback(def, this.module);
    }
    return this.module.exports;
  };
  function callRequireCallback(callback, opt_module) {
    var oldPath = currentModulePath;
    try {
      if (opt_module) {
        currentModulePath = opt_module.id;
        callback.call(opt_module, createRequire(opt_module), opt_module.exports, opt_module);
      } else {
        callback($jscomp.require);
      }
    } finally {
      currentModulePath = oldPath;
    }
  }
  var moduleCache = new Map;
  var currentModulePath = "";
  function normalizePath(path) {
    var components = path.split("/");
    var i = 0;
    while (i < components.length) {
      if (components[i] == ".") {
        components.splice(i, 1);
      } else {
        if (i && components[i] == ".." && components[i - 1] && components[i - 1] != "..") {
          components.splice(--i, 2);
        } else {
          i++;
        }
      }
    }
    return components.join("/");
  }
  $jscomp.getCurrentModulePath = function() {
    return currentModulePath;
  };
  function getCacheEntry(id) {
    var cacheEntry = moduleCache.get(id);
    if (cacheEntry === undefined) {
      throw new Error("Module " + id + " does not exist.");
    }
    return cacheEntry;
  }
  var ensureMap = new Map;
  var CallbackEntry = function(requireSet, callback) {
    this.requireSet = requireSet;
    this.callback = callback;
  };
  function maybeNormalizePath(root, absOrRelativePath) {
    if (absOrRelativePath.startsWith("./") || absOrRelativePath.startsWith("../")) {
      return normalizePath(root + "/../" + absOrRelativePath);
    } else {
      return absOrRelativePath;
    }
  }
  function createRequire(opt_module) {
    function require(absOrRelativePath) {
      var absPath = absOrRelativePath;
      if (opt_module) {
        absPath = maybeNormalizePath(opt_module.id, absPath);
      }
      return getCacheEntry(absPath).load();
    }
    function requireEnsure(requires, callback) {
      if (currentModulePath) {
        for (var i = 0; i < requires.length; i++) {
          requires[i] = maybeNormalizePath(currentModulePath, requires[i]);
        }
      }
      var blockingRequires = [];
      for (var i = 0; i < requires.length; i++) {
        var required = moduleCache.get(requires[i]);
        if (!required || required.blockingDeps.size) {
          blockingRequires.push(requires[i]);
        }
      }
      if (blockingRequires.length) {
        var requireSet = new Set(blockingRequires);
        var callbackEntry = new CallbackEntry(requireSet, callback);
        requireSet.forEach(function(require) {
          var arr = ensureMap.get(require);
          if (!arr) {
            arr = [];
            ensureMap.set(require, arr);
          }
          arr.push(callbackEntry);
        });
      } else {
        callback(require);
      }
    }
    require.ensure = requireEnsure;
    return require;
  }
  $jscomp.require = createRequire();
  $jscomp.hasModule = function(id) {
    return moduleCache.has(id);
  };
  function markAvailable(absModulePath) {
    var ensures = ensureMap.get(absModulePath);
    if (ensures) {
      for (var i = 0; i < ensures.length; i++) {
        var entry = ensures[i];
        entry.requireSet["delete"](absModulePath);
        if (!entry.requireSet.size) {
          ensures.splice(i--, 1);
          callRequireCallback(entry.callback);
        }
      }
      if (!ensures.length) {
        ensureMap["delete"](absModulePath);
      }
    }
  }
  $jscomp.registerModule = function(moduleDef, absModulePath, opt_shallowDeps) {
    if (moduleCache.has(absModulePath)) {
      throw new Error("Module " + absModulePath + " has already been registered.");
    }
    if (currentModulePath) {
      throw new Error("Cannot nest modules.");
    }
    var shallowDeps = opt_shallowDeps || [];
    for (var i = 0; i < shallowDeps.length; i++) {
      shallowDeps[i] = maybeNormalizePath(absModulePath, shallowDeps[i]);
    }
    var blockingDeps = new Set;
    for (var i = 0; i < shallowDeps.length; i++) {
      getTransitiveBlockingDepsOf(shallowDeps[i]).forEach(function(transitive) {
        blockingDeps.add(transitive);
      });
    }
    blockingDeps["delete"](absModulePath);
    var cacheEntry = new CacheEntry(moduleDef, new Module(absModulePath), absModulePath);
    moduleCache.set(absModulePath, cacheEntry);
    blockingDeps.forEach(function(blocker) {
      addAsBlocking(cacheEntry, blocker);
    });
    if (!blockingDeps.size) {
      markAvailable(cacheEntry.module.id);
    }
    removeAsBlocking(cacheEntry);
  };
  function getTransitiveBlockingDepsOf(moduleId) {
    var cacheEntry = moduleCache.get(moduleId);
    var blocking = new Set;
    if (cacheEntry) {
      cacheEntry.blockingDeps.forEach(function(dep) {
        getTransitiveBlockingDepsOf(dep).forEach(function(transitive) {
          blocking.add(transitive);
        });
      });
    } else {
      blocking.add(moduleId);
    }
    return blocking;
  }
  var blockingModulePathToBlockedModules = new Map;
  function addAsBlocking(blocked, blocker) {
    if (blocked.module.id != blocker) {
      var blockedModules = blockingModulePathToBlockedModules.get(blocker);
      if (!blockedModules) {
        blockedModules = new Set;
        blockingModulePathToBlockedModules.set(blocker, blockedModules);
      }
      blockedModules.add(blocked);
      blocked.blockingDeps.add(blocker);
    }
  }
  function removeAsBlocking(cacheEntry) {
    var blocked = blockingModulePathToBlockedModules.get(cacheEntry.module.id);
    if (blocked) {
      blockingModulePathToBlockedModules["delete"](cacheEntry.module.id);
      blocked.forEach(function(blockedCacheEntry) {
        blockedCacheEntry.blockingDeps["delete"](cacheEntry.module.id);
        cacheEntry.blockingDeps.forEach(function(blocker) {
          addAsBlocking(blockedCacheEntry, blocker);
        });
        if (!blockedCacheEntry.blockingDeps.size) {
          removeAsBlocking(blockedCacheEntry);
          markAvailable(blockedCacheEntry.module.id);
        }
      });
    }
  }
  $jscomp.registerAndLoadModule = function(moduleDef, absModulePath, shallowDeps) {
    $jscomp.require.ensure([absModulePath], function(require) {
      require(absModulePath);
    });
    $jscomp.registerModule(moduleDef, absModulePath, shallowDeps);
  };
  $jscomp.registerEs6ModuleExports = function(absModulePath, exports) {
    if (moduleCache.has(absModulePath)) {
      throw new Error("Module at path " + absModulePath + " is already registered.");
    }
    var entry = new CacheEntry(null, new Module(absModulePath, exports), absModulePath);
    moduleCache.set(absModulePath, entry);
    markAvailable(absModulePath);
  };
  $jscomp.clearModules = function() {
    moduleCache.clear();
  };
})();
//./src/bungie-api.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return BungieApi;
  }}});
  function BungieApi(options) {
    var jq = options.jq;
    var api_key = window.location.href.indexOf("beta") > -1 ? "2dea235ddd854458ab0dae8adc2f0835" : "755e377b63b5405090a4e4d202a58537";
    var bungieSite = "https://www.bungie.net";
    var _errorDisplayHandler;
    var errorDisplayHandler = function(errorMessage) {
      if (_errorDisplayHandler !== undefined) {
        _errorDisplayHandler(errorMessage);
      }
    };
    var ajaxError = function(xhr, textStatus, errorThrown) {
      errorDisplayHandler(textStatus + " " + errorThrown);
    };
    var prepareGetParams = function(getUrl, baseOverride) {
      var base = baseOverride === undefined ? bungieSite + "/Platform/Destiny2/" : bungieSite + baseOverride;
      errorDisplayHandler("");
      return {type:"GET", headers:{"X-API-Key":api_key}, error:ajaxError, url:base + getUrl};
    };
    var callApi = function(api) {
      return jq.ajax(prepareGetParams(api));
    };
    this.loadFullProfile = function(membershipInfo) {
      return callApi(membershipInfo.membershipType + "/Profile/" + membershipInfo.membershipId + "/?components\x3d100,200");
    };
    this.searchDestinyPlayers = function(searchTerm) {
      return callApi("SearchDestinyPlayer/-1/" + searchTerm + "/");
    };
    this.searchUsers = function(searchTerm) {
      return jq.ajax(prepareGetParams("/User/SearchUsersPaged/" + searchTerm + "/1/25/", "/Platform"));
    };
    this.getActivities = function(platformId, membershipId, characterId, maxRecords, page) {
      return callApi("" + platformId + "/Account/" + membershipId + "/Character/" + characterId + "/Stats/Activities/?mode\x3dNone\x26count\x3d" + maxRecords + "\x26page\x3d" + page);
    };
    this.getBungieSiteUrl = function() {
      return bungieSite;
    };
    this.getMembershipById = function(membershipId, membershipType) {
      return jq.ajax(prepareGetParams("/User/GetMembershipsById/" + membershipId + "/" + membershipType + "/", "/Platform"));
    };
    this.loadFullProfile = function(membershipInfo) {
      return callApi(membershipInfo.membershipType + "/Profile/" + membershipInfo.membershipId + "/?components\x3d100,200");
    };
    this.setErrorDisplayHandler = function(handler) {
      _errorDisplayHandler = handler;
    };
  }
}, "src/bungie-api.js", []);

//./src/charting-container.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return ChartingContainer;
  }}});
  var module$src$utils = $$require("src/utils.js");
  function ChartingContainer(options) {
    var COLOR_RED = "rgb(255, 99, 132)", COLOR_BLUE = "rgb(54, 162, 235)", COLOR_GREEN = "rgb(12, 255, 132)";
    var utils = new module$src$utils["default"];
    var jq = options.jq;
    var getDailyActivityChart = function() {
      var summarizeByDate = function() {
        return options.dataManager.getActivities().reduce(function(r, e) {
          var date = e.period.substr(0, e.period.indexOf("T"));
          if (r[date] === undefined) {
            r[date] = {count:1, time:0};
          }
          r[date].count = r[date].count + 1;
          r[date].time = r[date].time + e.values.timePlayedSeconds.basic.value;
          return r;
        }, []);
      };
      var summarizedActivities = summarizeByDate();
      var dailyActivityChartData = utils.objectToArray(summarizedActivities, function(item) {
        return {date:item.date, count:item.count, time:item.time};
      });
      var dailyActivityChartConfig = {type:"bar", options:{responsive:true, hoverMode:"index", stacked:false, title:{display:true, text:"Daily Activity Summary"}, scales:{yAxes:[{type:"linear", display:true, position:"left", id:"y-axis-activity-count"}, {type:"linear", display:true, position:"right", id:"y-axis-time-played", gridLines:{drawOnChartArea:false}, ticks:{callback:function(value, index, values) {
        return utils.minutesToHours(value);
      }}}]}}, data:{labels:[], datasets:[{label:"Total Daily Activities", borderColor:COLOR_RED, backgroundColor:COLOR_RED, fill:false, yAxisID:"y-axis-activity-count", data:[]}, {label:"Time Played (minutes)", borderColor:COLOR_BLUE, backgroundColor:COLOR_BLUE, fill:false, yAxisID:"y-axis-time-played", data:[]}]}};
      for (var i = 0; i < dailyActivityChartData.length; i++) {
        var cd = dailyActivityChartData[i];
        dailyActivityChartConfig.data.labels.push(cd.date);
        dailyActivityChartConfig.data.datasets[0].data.push(cd.count);
        dailyActivityChartConfig.data.datasets[1].data.push(Math.floor(cd.time / 60));
      }
      var dailyActivityChartCtx = document.getElementById(options.summaryChartElement);
      return new Chart.Line(dailyActivityChartCtx, dailyActivityChartConfig);
    };
    var getPvPActivityChart = function() {
      var summarizedPvPActivities = options.dataManager.getActivities().reduce(function(r, e) {
        if (e.isPvP) {
          var date = e.period.substr(0, e.period.indexOf("T"));
          if (r[date] === undefined) {
            r[date] = {details:[], won:0, lost:0};
          }
          if (r[date].details[e.activityDetails.mode] === undefined) {
            r[date].details[e.activityDetails.mode] = {won:0, lost:0};
          }
          if (e.values.standing.basic.value === 0) {
            r[date].won++;
            r[date].details[e.activityDetails.mode].won++;
          } else {
            r[date].lost++;
            r[date].details[e.activityDetails.mode].lost++;
          }
        }
        return r;
      }, []);
      var pvpActivityChartData = utils.objectToArray(summarizedPvPActivities, function(item) {
        return {date:item.date, won:item.won, lost:item.lost};
      });
      var pvpActivityChartConfig = {type:"bar", options:{title:{display:true, text:"Daily PvP Summary"}, tooltips:{mode:"index", intersect:false}, responsive:true, scales:{xAxes:[{stacked:true}], yAxes:[{stacked:true}]}}, data:{labels:[], datasets:[{label:"Matches Won", borderColor:COLOR_GREEN, backgroundColor:COLOR_GREEN, fill:false, data:[]}, {label:"Matches Lost", borderColor:COLOR_RED, backgroundColor:COLOR_RED, fill:false, data:[]}]}};
      for (var i = 0; i < pvpActivityChartData.length; i++) {
        var cd = pvpActivityChartData[i];
        pvpActivityChartConfig.data.labels.push(cd.date);
        pvpActivityChartConfig.data.datasets[0].data.push(cd.won);
        pvpActivityChartConfig.data.datasets[1].data.push(-1 * cd.lost);
      }
      var pvpActivityChartCtx = document.getElementById(options.pvpSummaryChartElement);
      return new Chart(pvpActivityChartCtx, pvpActivityChartConfig);
    };
    var _self = this;
    var drawActivitySummaryGraphs = function() {
      _self.dailyActivityChart = getDailyActivityChart();
      _self.pvpActivityChart = getPvPActivityChart();
    };
    jq(document).on(options.eventManager.getRedrawChartsEventName(), function(event, data) {
      drawActivitySummaryGraphs();
    });
  }
}, "src/charting-container.js", ["src/utils.js"]);

//./src/dashboard.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return Dashboard;
  }}});
  var module$src$vue_container = $$require("src/vue-container.js");
  var module$src$bungie_api = $$require("src/bungie-api.js");
  var module$src$charting_container = $$require("src/charting-container.js");
  var module$src$utils = $$require("src/utils.js");
  var module$src$data_manager = $$require("src/data-manager.js");
  var module$src$event_manager = $$require("src/event-manager.js");
  function Dashboard($) {
    var vueContainer, bungieApi, chartingContainer, eventManager, dataManager;
    eventManager = new module$src$event_manager["default"]({jq:$});
    bungieApi = new module$src$bungie_api["default"]({jq:$});
    vueContainer = new module$src$vue_container["default"]({jq:$, bungieApi:bungieApi, appContainer:"#dashboard-app", eventManager:eventManager, href:window.location.href});
    bungieApi.setErrorDisplayHandler(vueContainer.setErrorMessage);
    dataManager = new module$src$data_manager["default"]({getActivities:vueContainer.getAllActivities});
    chartingContainer = new module$src$charting_container["default"]({getActivities:vueContainer.getAllActivities, summaryChartElement:"summary-chart", pvpSummaryChartElement:"pvp-summary-chart", eventManager:eventManager, dataManager:dataManager, jq:$});
    var _self = this;
    this.bungieApi = bungieApi;
    this.vueContainer = vueContainer;
    this.chartingContainer = chartingContainer;
    window.appContainers = {vueContainer:_self.vueContainer, chartingContainer:_self.chartingContainer};
  }
}, "src/dashboard.js", ["src/vue-container.js", "src/bungie-api.js", "src/charting-container.js", "src/utils.js", "src/data-manager.js", "src/event-manager.js"]);

//./src/data-manager.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return DataManager;
  }}});
  function DataManager(options) {
    this.getActivities = function() {
      return options.getActivities();
    };
  }
}, "src/data-manager.js", []);

//./src/event-manager.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return EventManager;
  }}});
  function EventManager(options) {
    var jq = options.jq;
    var NAMESPACE = ".ln08";
    var EVENT_LOAD_CHARACTER_DATA = "load_character_data" + NAMESPACE;
    var EVENT_REDRAW_CHARTS = "redraw_chars" + NAMESPACE;
    this.triggerLoadCharacterData = function(eventData) {
      jq(document).trigger(EVENT_LOAD_CHARACTER_DATA, {characterIndex:eventData.characterIndex, membershipInfoIndex:eventData.membershipInfoIndex});
    };
    this.triggerRedrawCharts = function(eventData) {
      jq(document).trigger(EVENT_REDRAW_CHARTS, eventData);
    };
    this.getCharacterDataLoadedEventName = function() {
      return EVENT_LOAD_CHARACTER_DATA;
    };
    this.getRedrawChartsEventName = function() {
      return EVENT_REDRAW_CHARTS;
    };
  }
}, "src/event-manager.js", []);

//./src/maps.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return TypeMaps;
  }}});
  function TypeMaps() {
    this.activityTypeMap = new Map([[82913930, "Unknown"], [4159221189, "Io"], [3143798436, "European Dead Zone"], [3966792859, "Nessus, Unstable Centaur"], [4166562681, "Titan"], [1790343591, "Shard of the Traveler"], [379330092, "Shard of the Traveler"], [2259811067, "Shard of the Traveler"], [1952521609, "Shard of the Traveler"], [3652531274, "Shard of the Traveler"], [3172367001, "Shard of the Traveler"], [313572698, "Shard of the Traveler"], [2468202005, "Shard of the Traveler"], [703311712, 
    "Shard of the Traveler"], [3903562779, "Tower"], [2702476101, "Tower"], [3903562778, "Tower"], [1309646866, "The Farm"], [1568750156, "The Farm"], [2183066491, "The Farm"], [330545737, "The Farm"], [3631476566, "The Farm"], [2266954523, "The Farm"], [1290744998, "The Farm"], [719906507, "The Third Spire"], [2318812547, "The Pyramidion"], [2056035210, "Classified"], [1073289414, "Landing Zone"], [1233767907, "Hellas Basin"], [74501540, "The Whisper"], [1099555105, "The Whisper (Heroic)"], [563435123, 
    "Payback"], [3410237988, "1AU"], [234065414, "Spark"], [1011304245, "Chosen"], [877831883, "Homecoming"], [3679941640, "Homecoming"], [851766451, "Unknown"], [1928964033, "The Tangled Shore"], [1928964032, "The Tangled Shore"], [2047813119, "The Dreaming City"], [2814646673, "The Dreaming City"], [884226738, "Spider's Safehouse"], [1694456220, "Visions of Light"], [927242860, "Ace in the Hole"], [1803806070, ""], [3149513022, "A Hum of Starlight"], [3151789989, "???"], [1882259272, "Daily Heroic Story Mission"], 
    [3008658049, "Daily Heroic Story Mission"], [1602328239, "Daily Heroic Story Mission"], [3271773240, "Daily Heroic Story Mission"], [589157009, "Daily Heroic Story Mission"], [4234327344, "Daily Heroic Story Mission"], [2000185095, "Daily Heroic Story Mission"], [2568845238, "Daily Heroic Story Mission"], [2776154899, "Daily Heroic Story Mission"], [3205547455, "Daily Heroic Story Mission"], [2660895412, "Daily Heroic Story Mission"], [1513386090, "Daily Heroic Story Mission"], [1313648352, "Daily Heroic Story Mission"], 
    [271962655, "Daily Heroic Story Mission"], [2962137994, "Daily Heroic Story Mission"], [1906514856, "Daily Heroic Story Mission"], [1070049743, "Daily Heroic Story Mission"], [1534123682, "Daily Heroic Story Mission"], [1132291813, "Daily Heroic Story Mission"], [4244464899, "Daily Heroic Story Mission"], [4237009519, "Daily Heroic Story Mission"], [1023966646, "Daily Heroic Story Mission"], [4009655461, "Daily Heroic Story Mission"], [2146977720, "Daily Heroic Story Mission"], [129918239, "Daily Heroic Story Mission"], 
    [1259766043, "Daily Heroic Story Mission"], [2772894447, "Daily Heroic Story Mission"], [1872813880, "Daily Heroic Story Mission"], [1454880421, "Haunted Forest"], [707826522, "Firewalled Haunted Forest"], [3874292246, "Haunted Forest"], [1612844171, "Festival of the Lost\u2026 Sector"], [1799380107, "The Lost Cryptarch"], [1111176435, ""], [1502633527, "Tower"], [3434499700, "Initiation"], [384786172, ""], [2639045396, "Scourge of the Armory"], [1134562791, "Origin: Nessus"], [2604307096, "Another Lost Forge"], 
    [606484622, "Black Armory signature"], [3641102502, "Refurbished Izanami Igniter"], [3614852628, "Repair the Izanami Igniter"], [855989781, "Reignite the Izanami Forge"], [1431348899, "Unidentified Frame"], [2375911307, "Unidentified Radiant Frame"], [709854835, "Niobe's Torment"], [1367215417, "Lost Souvenir"], [11199080, ""], [619321468, "The Damnation"], [3628257792, "The Conversation"], [1019949956, "Forge Ignition"], [1483179969, "Forge Ignition"], [1878615566, "Forge Ignition"], [10898844, 
    "Forge Ignition"], [1434072700, "Bergusia Forge"], [1506080581, "Volundr Forge"], [957727787, "Gofannon Forge"], [2656947700, "Izanami Forge"], [1463335231, ""], [1463335228, ""], [3091400008, ""], [3091400011, ""], [1533124168, ""], [1533124171, ""], [4086427958, ""], [4086427957, ""], [2948690563, "Destiny 2: Forsaken Annual Pass"], [3232506937, "Zero Hour"], [2731208666, "Zero Hour (Heroic)"], [3835150701, "The Verdant Forest"], [2524369154, "Firewalled Verdant Forest"], [4034557395, "Homecoming"], 
    [1521232506, "Classified"], [2642769170, "Six"], [2052289205, "Combustion"], [955852466, "1AU"], [2297638408, "Fury"], [3105090879, "Adieu"], [2113712124, "Sacrilege"], [3147707814, "Riptide"], [1490848577, "Looped"], [2559514952, "Utopia"], [553537971, "Chosen"], [938512773, "Unbroken"], [3359466010, "Spark"], [2926767881, "Payback"], [1658347443, "Homecoming"], [3272002712, "Hope"], [1243390694, "Larceny"], [1075152813, "European Dead Zone"], [564863404, "Unknown"], [1412142789, ""], [2478782573, 
    ""], [3289842296, "Curse of Osiris"], [834864522, "Curse of Osiris"], [3206026167, "The Gateway"], [2351745587, "The Gateway"], [1175770231, "The Gateway"], [1057017675, "The Gateway"], [1512980468, "The Gateway"], [2279197206, "A Deadly Trial"], [1049899965, "Beyond Infinity"], [1426391278, "Deep Storage"], [1002145272, "Tree of Probabilities"], [2199986157, "Hijacked"], [1278641935, "A Garden World"], [2276204547, "Omega"], [4253800115, "The Frozen God"], [3405569225, "The Frozen God"], [4166632210, 
    "The Frozen God"], [2400231344, "The Frozen God"], [40940368, "Curse of Osiris"], [305709154, "Ice and Shadow"], [1194986370, "Ice and Shadow"], [1021495354, "Ice and Shadow"], [1967025365, "Ice and Shadow"], [1166237584, "Pilgrimage"], [1419459505, "Off-World Recovery"], [1926167080, "Strange Terrain"], [2718696427, "Will of the Thousands"], [3249986335, "Destiny 2: Forsaken"], [666063689, "Last Call"], [3226038743, "Last Call"], [521403014, "Last Call"], [530720427, "High Plains Blues"], [2345788617, 
    "Scorned"], [851841785, "The Machinist"], [4204849452, "Nothing Left to Say"], [3559661941, "Nothing Left to Say"], [539969356, ""], [1338487764, "A Hum of Starlight"], [2974605887, "Awakening"], [2068689865, "Destiny 2: Forsaken"], [2249739266, "The Reckoning"], [501703034, "The Reckoning"], [1786054751, "Premeditation"], [3410530777, "Calculated Action"], [2336998357, "The Long Play"], [2291549972, "Enhance!"], [2776929937, "Differential Diagnosis"], [3346345105, "Experimental Treatment"], 
    [3304835347, "Calling Them Home"], [1159314159, "Poor Reception"], [3688464794, "The Importance of Networking"], [153537894, "A New Frontier"], [2934103434, "Classified"], [3702064261, "Data Requisition"], [969385987, "Lighting the Dark"], [3150153711, "Chances and Choices"], [1755484011, "Classified"], [2867288098, "Classified"], [80726883, "O Captain"], [2759086913, ""], [1428050875, "My Captain"], [2307090074, "Signal Light"], [2067233851, "Not Even the Darkness"], [1725302079, "The Up and Up"], 
    [1823921651, "The Up and Up"], [1279862229, "Bug in the System"], [2675435236, "Bug in the System"], [1570598249, "The Runner"], [1418217191, "The Up and Up (Heroic)"], [3920569453, "Bug in the System (Heroic)"], [3370527053, "The Runner (Heroic)"], [1987624188, "The Up and Up (Heroic)"], [3248193378, "The Up and Up (Heroic)"], [1874578888, "Bug in the System (Heroic)"], [1740310101, "Bug in the System (Heroic)"], [723733266, "The Runner (Heroic)"], [2091731913, "Legacy Code"], [3204449126, "A Piece of the Past"], 
    [3909841711, "Psionic Potential (Heroic)"], [1783922093, "Incursion (Heroic)"], [2752743635, "Hephaestus (Heroic)"], [1682036469, "Deathly Tremors (Heroic)"], [1657356109, "Psionic Potential (Heroic)"], [1202325607, "Ice and Shadow"], [1202325606, "Ice and Shadow"], [2032534090, "The Shattered Throne"], [1640956655, "Broken Courier"], [3746811765, "The Oracle Engine"], [1313738982, "Dark Monastery"], [2278374121, "Unknown Space"], [1893059148, "The Shattered Throne"], [185515551, "(Heroic) Invitation from the Emperor"], 
    [1671235700, "(Heroic) Release"], [3664729722, "(Heroic) Exodus Siege"], [785871069, "(Heroic) Unbreakable"], [3042112297, "(Heroic) Hack the Planet"], [856342832, "(Heroic) Deep Conversation"], [2069143995, "(Heroic) Lost Crew"], [96442917, "(Heroic) Red Legion, Black Oil"], [2245202378, "(Heroic) Anti-Anti-Air"], [1018385878, "(Heroic) Dark Alliance"], [999972877, "(Heroic) Stop and Go"], [1018040791, "(Heroic) Getting Your Hands Dirty"], [1333621919, "(Heroic) Unsafe at Any Speed"], [1302437673, 
    "(Heroic) A Frame Job"], [2310677039, "(Heroic) Calling Them Home"], [2831644165, "(Heroic) Reversing the Polarity"], [2340776707, "(Heroic) Poor Reception"], [993905880, "(Heroic) Supply and Demand"], [3691789482, "(Heroic) No Safe Distance"], [3255524827, "(Heroic) Cliffhanger"], [2219006909, "(Heroic) Arecibo"], [3644215993, "(Heroic) Road Rage"], [449926115, "(Heroic) Postmodern Prometheus"], [801458995, "(Heroic) Unexpected Guests"], [1275562432, "(Heroic) Thief of Thieves"], [3033151437, 
    "(Heroic) Siren Song"], [319240296, "(Heroic) Deathless"], [3015346707, "(Heroic) Bad Neighbors"], [3069330044, "The Hangman (Heroic)"], [625165976, "The Trickster (Heroic)"], [1800749202, "The Rider (Heroic)"], [3601218952, "The Rifleman (Heroic)"], [2258680077, "The Mindbender (Heroic)"], [4238309598, "The Mad Bomber (Heroic)"], [3143659188, "The Reckoning"], [3264501078, "The Reckoning"], [1446606128, "The Reckoning"], [1281404748, "The Reckoning"], [2062544704, "Mystery and Potential"], [445417088, 
    "Unknown"], [4055504678, "Unknown"], [3617269021, "Crucible Labs"], [2598372743, "Crucible Labs"], [3135101885, "Crucible Labs"], [1709912095, "Crucible Labs"], [2810171920, "Bannerfall"], [3164915257, "The Dead Cliffs"], [3292922825, "Firebase Echo"], [3849796864, "Retribution"], [2473919228, "Meltdown"], [2262757213, "Solitude"], [2233665874, "Eternity"], [2666761222, "Distant Shore"], [399506119, "Endless Vale"], [1583254851, "The Fortress"], [778271008, "Emperor's Respite"], [1153409123, 
    "Convergence"], [532383918, "Radiant Cliffs"], [1673114595, "Pacifica"], [750001803, "Altar of Flame"], [332234118, "Vostok"], [3404623499, "The Citadel"], [2591737171, "Gambler's Ruin"], [777592567, "Midtown"], [806094750, "Javelin-4"], [1711620427, "Legion's Gulch"], [1815340083, "Equinox"], [2748633318, "Wormhaven"], [4012915511, "The Burnout"], [451430877, "Bannerfall"], [3233852802, "The Dead Cliffs"], [2276121440, "Firebase Echo"], [990984849, "Retribution"], [3788594815, "Meltdown"], [3349246768, 
    "Solitude"], [3734723183, "Eternity"], [3423042035, "Distant Shore"], [1489679220, "Endless Vale"], [2800919246, "The Fortress"], [1448435553, "Emperor's Respite"], [1482206498, "Convergence"], [931636133, "Radiant Cliffs"], [3897312654, "Pacifica"], [666770290, "Altar of Flame"], [1702649201, "Vostok"], [40003746, "The Citadel"], [3212348372, "Gambler's Ruin"], [1435054848, "Midtown"], [1003889713, "Javelin-4"], [1733006874, "Legion's Gulch"], [2978154446, "Equinox"], [148937731, "Wormhaven"], 
    [2271820498, "The Burnout"], [3243161126, "Quickplay"], [3062197616, "Competitive"], [2444890541, "Crimson Days"], [504444892, "Doubles"], [903584917, "Mayhem"], [1310854805, "Rumble"], [917887719, "Supremacy"], [2404525917, "Private Match"], [3767360267, "Private Match"], [1694936744, "Private Match"], [1887396202, "Private Match"], [2903879783, "Private Match"], [1218001922, "Private Match"], [4242525388, "Private Match"], [1859507212, "Private Match"], [29726492, "Private Match"], [2491884566, 
    "Private Match"], [3344441646, "Private Match"], [2459350930, "Private Match"], [585322760, "Armsweek"], [2274172949, "Quickplay"], [2947109551, "Competitive"], [2087163649, "Rumble"], [3753505781, "Iron Banner"], [2063575880, "Doubles"], [1312786953, "Mayhem"], [1746163491, "Supremacy"], [1276739382, "Breakthrough"], [3243244011, "Lockdown"], [1151331757, "Showdown"], [2737374369, "Trials of the Nine"], [1358255449, "Crimson Days"], [3089205900, "Leviathan, Eater of Worlds"], [2164432138, "Leviathan, Eater of Worlds"], 
    [809170886, "Leviathan, Eater of Worlds"], [119944200, "Leviathan, Spire of Stars"], [3004605630, "Leviathan, Spire of Stars"], [3213556450, "Leviathan, Spire of Stars"], [2122313384, "Last Wish"], [2214608157, "Last Wish"], [2214608156, "Last Wish"], [1661734046, "Last Wish"], [1183575934, "Unknown"], [548750096, "Scourge of the Past"], [2812525063, "Scourge of the Past"], [926940962, "Nightfall: The Pyramidion"], [642277473, "Nightfall: The Pyramidion"], [1129066976, "Nightfall: The Pyramidion"], 
    [3368226533, "Nightfall: The Inverted Spire"], [4054968718, "Nightfall: The Inverted Spire"], [3050465729, "Nightfall: The Inverted Spire"], [1357019430, "Nightfall: Exodus Crash"], [642256373, "Nightfall: Exodus Crash"], [1792985204, "Nightfall: Exodus Crash"], [145302664, "Nightfall: The Arms Dealer"], [3920643231, "Nightfall: The Arms Dealer"], [601540706, "Nightfall: The Arms Dealer"], [1207505828, "QUEST: The Arms Dealer"], [1975064760, "Nightfall: Savath\u00fbn's Song"], [1863334927, "Nightfall: Savath\u00fbn's Song"], 
    [585071442, "Nightfall: Savath\u00fbn's Song"], [2693136601, "Leviathan"], [287649202, "Leviathan"], [2693136600, "Leviathan"], [89727599, "Leviathan"], [2693136603, "Leviathan"], [4039317196, "Leviathan"], [2693136602, "Leviathan"], [3916343513, "Leviathan"], [2693136605, "Leviathan"], [1875726950, "Leviathan"], [2693136604, "Leviathan"], [1699948563, "Leviathan"], [3879860661, "Leviathan"], [1800508819, "Leviathan"], [2449714930, "Leviathan"], [771164842, "Leviathan"], [3446541099, "Leviathan"], 
    [508802457, "Leviathan"], [417231112, "Leviathan"], [4206123728, "Leviathan"], [1685065161, "Leviathan"], [3912437239, "Leviathan"], [757116822, "Leviathan"], [3857338478, "Leviathan"], [3336275007, 'Meditation: "Six"'], [2264636552, 'Meditation: "Combustion"'], [3580793473, 'Meditation: "1AU"'], [255819671, "Fury"], [60002467, "Sacrilege"], [3417504239, "Riptide"], [667604912, 'Meditation: "Looped"'], [2708828207, "Utopia"], [464789944, "Chosen"], [3738159218, "Unbroken"], [4239233351, 'Meditation: "Spark"'], 
    [3982474534, "Payback"], [1019362992, 'Meditation: "Homecoming"'], [4291922223, "Hope"], [1646219807, "Larceny"], [3799743268, "Trials of the Nine"], [2319065780, "Iron Banner Clash"], [3616746132, "Iron Banner Control"], [2014552458, "Iron Banner Supremacy"], [2322829199, "Nightfall: A Garden World"], [373475104, "Nightfall: A Garden World"], [2688061647, "Nightfall: A Garden World"], [2046332536, "Nightfall: Tree of Probabilities"], [989294159, "Nightfall: Tree of Probabilities"], [2416546450, 
    "Nightfall: Tree of Probabilities"], [3292523719, 'Meditation: "The Gateway"'], [3226632017, 'Meditation: "A Deadly Trial"'], [4119522487, 'Meditation: "Deep Storage"'], [3642412717, 'Meditation: "Tree of Probabilities"'], [991410404, 'Meditation: "Hijacked"'], [1034805570, 'Meditation: "A Garden World"'], [3215844014, 'Meditation: "Omega"'], [2229749170, "Nightfall: The Pyramidion"], [3678597432, "Armsweek Nightfall: The Prospector"], [2886394453, "Armsweek Nightfall: Hard Light"], [2288451134, 
    "Armsweek Nightfall: Rat King"], [1701995982, "Armsweek Nightfall: SUROS Regime"], [1646729752, "Armsweek Strikes"], [965849694, 'Protocol "Perfected Form"'], [2472211469, "Contested Zone: Metropolis"], [3543680867, "Strange Terrain"], [1760460831, "Fury"], [1811228210, "Psionic Potential (Heroic)"], [958578340, "Nightfall: Will of the Thousands"], [3132003003, "Nightfall: Will of the Thousands"], [2383858990, "Nightfall: Will of the Thousands"], [2179568029, "Nightfall: Strange Terrain"], [4279557030, 
    "Nightfall: Strange Terrain"], [1794007817, "Nightfall: Strange Terrain"], [4170982146, 'Meditation: "Ice and Shadow"'], [3865706603, 'Meditation: "Pilgrimage"'], [2427944384, 'Meditation: "Offworld Recovery"'], [1255167276, 'Meditation: "Strange Terrain"'], [3801976119, 'Meditation: "Will of the Thousands"'], [1984315274, "Vanguard Strikes"], [1495993294, "Lake of Shadows"], [1035135049, "The Pyramidion"], [338662534, "The Inverted Spire"], [1563393783, "Exodus Crash"], [2080275457, "The Arms Dealer"], 
    [1101792305, "Savath\u00fbn's Song"], [940394831, "QUEST: Exodus Crash"], [2026037412, "Heroic Strikes Playlist"], [689927878, "A Garden World"], [840678113, "Tree of Probabilities"], [656703508, "A Garden World"], [2678510381, "Tree of Probabilities"], [661855681, "Lake of Shadows"], [1603374112, "The Pyramidion"], [286562305, "The Inverted Spire"], [1549614516, "Exodus Crash"], [442671778, "The Arms Dealer"], [3191123858, "Savath\u00fbn's Song"], [492869759, "Vanguard Strikes"], [3807442202, 
    "Vanguard Strikes"], [3807442201, "Vanguard Strikes"], [3406133130, "Vanguard Strikes"], [434462141, "Heroic Strikes Playlist"], [387373040, "Heroic Strikes Playlist"], [387373043, "Heroic Strikes Playlist"], [4052671056, "Heroic Strikes Playlist"], [3801775390, "Strange Terrain"], [2992505404, "Strange Terrain"], [1891220709, "Will of the Thousands"], [3510043585, "Will of the Thousands"], [2124407811, "The Insight Terminus"], [2711970723, "The Insight Terminus"], [3676029623, "A Garden World"], 
    [1263901594, "Tree of Probabilities"], [882238722, "Lake of Shadows"], [2704613535, "The Pyramidion"], [1107473294, "The Inverted Spire"], [2479262829, "Exodus Crash"], [2724706103, "The Arms Dealer"], [649648599, "Savath\u00fbn's Song"], [3372160277, "Nightfall"], [3289589202, "Nightfall"], [4259769141, "Nightfall"], [1282886582, "Nightfall"], [3145298904, "Nightfall"], [3280234344, "Nightfall"], [936308438, "Nightfall"], [3718330161, "Nightfall"], [1034003646, "Nightfall"], [522318687, "Nightfall"], 
    [272852450, "Nightfall"], [3108813009, "Nightfall"], [3034843176, "Nightfall"], [3701132453, "Nightfall"], [1391780798, "Nightfall"], [417510172, "Nightfall"], [2577720109, "Nightfall"], [4218727740, "Nightfall"], [1189683657, "Nightfall"], [1862243539, "Nightfall"], [3708508195, "Nightfall"], [1204099817, "Nightfall"], [420210800, "Nightfall"], [2490460017, "Nightfall"], [2216675886, "Nightfall"], [3526461885, "Nightfall"], [1503474689, "Nightfall"], [562078030, "Nightfall"], [48090081, "Nightfall"], 
    [322277826, "Nightfall"], [2258250028, "Nightfall"], [3815730356, "Nightfall"], [411726442, "Nightfall"], [3326586101, "Nightfall"], [927394522, "Nightfall"], [18699611, "Nightfall"], [3907468134, "Nightfall"], [2491790989, "Nightfall"], [3447375316, "Nightfall"], [1465939129, "Nightfall"], [3692509130, "Nightfall"], [2630091889, "Lake of Shadows"], [1332567114, "The Pyramidion"], [1743518001, "The Inverted Spire"], [1930116822, "Exodus Crash"], [2378719024, "The Arms Dealer"], [981383200, "Savath\u00fbn's Song"], 
    [2230236214, "A Garden World"], [561345573, "Tree of Probabilities"], [3735153518, "The Insight Terminus"], [861639651, "Strange Terrain"], [3944547194, "Will of the Thousands"], [1360385765, "Warden of Nothing"], [3374205760, "The Corrupted"], [1475539137, "The Hollowed Lair"], [1778527054, "Broodhold"], [2630091888, "Lake of Shadows"], [1332567115, "The Pyramidion"], [1743518E3, "The Inverted Spire"], [1930116823, "Exodus Crash"], [2378719025, "The Arms Dealer"], [981383201, "Savath\u00fbn's Song"], 
    [2230236215, "A Garden World"], [561345572, "Tree of Probabilities"], [3735153519, "The Insight Terminus"], [861639650, "Strange Terrain"], [3944547195, "Will of the Thousands"], [1360385764, "Warden of Nothing"], [3374205761, "The Corrupted"], [1475539136, "The Hollowed Lair"], [1778527055, "Broodhold"], [2630091891, "Lake of Shadows"], [1332567112, "The Pyramidion"], [1743518003, "The Inverted Spire"], [1930116820, "Exodus Crash"], [2378719026, "The Arms Dealer"], [981383202, "Savath\u00fbn's Song"], 
    [2230236212, "A Garden World"], [561345575, "Tree of Probabilities"], [3735153516, "The Insight Terminus"], [861639649, "Strange Terrain"], [3944547192, "Will of the Thousands"], [1360385767, "Warden of Nothing"], [3374205762, "The Corrupted"], [1475539139, "The Hollowed Lair"], [1778527052, "Broodhold"], [3711627564, "Lake of Shadows"], [2799837309, "The Pyramidion"], [467266668, "The Inverted Spire"], [4260306233, "Exodus Crash"], [770196931, "The Arms Dealer"], [2359594803, "Savath\u00fbn's Song"], 
    [117447065, "A Garden World"], [4085493024, "Tree of Probabilities"], [1295173537, "The Insight Terminus"], [743963294, "Strange Terrain"], [1198216109, "Will of the Thousands"], [1895583727, "Vanguard Strikes"], [1895583726, "Vanguard Strikes"], [1895583725, "Vanguard Strikes"], [1182517645, "Legacy Strikes"], [2838151086, "Legacy Strikes"], [2838151085, "Legacy Strikes"], [4269241421, "Legacy Strikes"], [3388474648, "The Corrupted"], [2624692004, "Private Match"], [2461888874, "Private Match"], 
    [1292137709, "New Arcadia"], [2205768006, "New Arcadia"], [1043946881, "New Arcadia"], [2653420456, "Deep Six"], [673053667, "Deep Six"], [2397821612, "Deep Six"], [962547783, "Emerald Coast"], [2428492447, "Emerald Coast"], [1899006128, "Emerald Coast"], [2436539922, "Kell's Grave"], [1031809538, "Kell's Grave"], [244166221, "Kell's Grave"], [4163641477, "Cathedral of Scars"], [1037070105, "Cathedral of Scars"], [3633867161, "Cathedral of Scars"], [3585977417, "Legion's Folly"], [3370944873, 
    "Legion's Folly"], [952725781, "Legion's Folly"], [2086906937, "Emerald Coast"], [2830257365, "Emerald Coast"], [3705383694, "Emerald Coast"], [4002737048, "Kell's Grave"], [2140443708, "Kell's Grave"], [3146127059, "Kell's Grave"], [3923970483, "Cathedral of Scars"], [3653399243, "Cathedral of Scars"], [1228482987, "Cathedral of Scars"], [1065452335, "Legion's Folly"], [249656167, "Legion's Folly"], [3128368823, "Legion's Folly"], [3577607128, "Gambit"], [2068785595, "Gambit Preview"], [854211606, 
    "New Arcadia"], [3996138539, "New Arcadia"], [74956570, "New Arcadia"], [712032579, "Deep Six"], [2022812188, "Deep Six"], [2904672719, "Deep Six"], [1183187383, "Gambit Prime"], [2421741347, "The Chasm of Screams"], [1998911089, "Dead Drop"], [3352425710, "Looking for a Lead"], [2629975203, "Combat Mission"], [429361491, "Salvage Mission"], [993152361, "Salvage Mission"], [3211303924, "Salvage Mission"], [549123191, "Survey mission"], [2969403085, "Survey mission"], [4283649349, "Assassination Mission"], 
    [204298081, "Analysis Mission"], [2025057095, "Combat Mission"], [143647473, "Salvage Mission"], [2558926634, "Survey mission"], [37050217, "Survey mission"], [30240416, "Assassination Mission"], [2519564410, "Assassination Mission"], [4047570705, "Combat Mission"], [261349035, "Salvage Mission"], [387171436, "Salvage Mission"], [1557641249, "Salvage Mission"], [3489692681, "Survey mission"], [3662124488, "Survey mission"], [1038710420, "Assassination Mission"], [1778450722, "Analysis Mission"], 
    [1105211124, "Analysis Mission"], [622895925, "Arecibo"], [3500791146, "Cliffhanger"], [1651979106, "Postmodern Prometheus"], [2949941834, "Unexpected Guests"], [1824067376, "Road Rage"], [1969800443, "Arecibo"], [632790902, "Cliffhanger"], [808931822, "Postmodern Prometheus"], [3836086286, "Unexpected Guests"], [3485876484, "Road Rage"], [3337731612, "Combat Mission"], [2629998776, "Salvage Mission"], [1451946951, "Salvage Mission"], [2782300570, "Salvage Mission"], [2580713007, "Survey mission"], 
    [1536764325, "Survey mission"], [3298775062, "Survey mission"], [1685237649, "Assassination Mission"], [2773222353, "Analysis Mission"], [4209774794, "Salvage Mission"], [743100125, "Salvage Mission"], [3479544154, "Combat Mission"], [880665770, "Survey mission"], [4043714237, "Survey mission"], [293858112, "Combat Mission"], [1525633702, "Salvage Mission"], [189324537, "Salvage Mission"], [926012363, "Assassination Mission"], [4050886070, "Survey mission"], [461203479, "Survey mission"], [3834639884, 
    "Analysis Mission"], [444087412, "Combat Mission"], [2684479494, "Salvage Mission"], [1614692057, "Salvage Mission"], [2301390667, "Survey mission"], [298747401, "Survey mission"], [197670945, "Assassination Mission"], [2619236227, "Analysis Mission"], [2784803584, "Combat Mission"], [1949546348, "Assassination Mission"], [3806583577, "Assassination Mission"], [3303685562, "Salvage Mission"], [4095207117, "Salvage Mission"], [459955094, "Analysis Mission"], [3515770727, "Analysis Mission"], [798143184, 
    "Combat Mission"], [3268684190, "Salvage Mission"], [175598161, "Salvage Mission"], [3958400416, "Survey mission"], [355984230, "Assassination Mission"], [2288260902, "Assassination Mission"], [2151274060, "Analysis Mission"], [2610112492, "Analysis Mission"], [104342360, "Combat Mission"], [286324446, "Salvage Mission"], [1498466193, "Salvage Mission"], [3208779612, "Salvage Mission"], [57103244, "Survey mission"], [2536491635, "Survey mission"], [2445164291, "Assassination Mission"], [2651851341, 
    "Analysis Mission"], [1228327586, "Anti-Anti-Air"], [1971154629, "Unsafe at Any Speed"], [539897061, "Reversing the Polarity"], [3780356141, "Stop and Go"], [1254990192, "No Safe Distance"], [122988657, "Red Legion, Black Oil"], [320680002, "Supply and Demand"], [2174556965, "A Frame Job"], [1829866365, "Getting Your Hands Dirty"], [3002511278, "Dark Alliance"], [1416597166, "Supply and Demand"], [3283790633, "A Frame Job"], [1956541147, "Calling Them Home"], [1265390366, "Poor Reception"], [53954174, 
    "Anti-Anti-Air"], [1466550401, "Unsafe at Any Speed"], [3752039537, "Reversing the Polarity"], [3872525353, "Stop and Go"], [2517540332, "No Safe Distance"], [3664915501, "Red Legion, Black Oil"], [3148431353, "Getting Your Hands Dirty"], [919252154, "Dark Alliance"], [19982784, "Combat Mission"], [298793060, "Salvage Mission"], [964196803, "Salvage Mission"], [581323290, "Survey mission"], [1331268141, "Survey mission"], [2768347363, "Assassination Mission"], [849242583, "Analysis Mission"], 
    [3173130826, "Combat Mission"], [4216926874, "Salvage Mission"], [671904429, "Salvage Mission"], [2079994698, "Survey mission"], [2908287325, "Survey mission"], [4103844069, "Assassination Mission"], [2001433484, "Assassination Mission"], [435989417, "Analysis Mission"], [3049122128, "Analysis Mission"], [789332628, "Thief of Thieves"], [3277510674, "Deathless"], [3211568383, "Siren Song"], [3645117987, "Bad Neighbors"], [78673128, "Thief of Thieves"], [2250935166, "Deathless"], [2231840083, 
    "Siren Song"], [2574607799, "Bad Neighbors"], [3026637018, "Survey mission"], [3481058226, "Survey mission"], [1076851943, "Assassination Mission"], [837763871, "Salvage Mission"], [3978357488, "Salvage Mission"], [2243336789, "Combat Mission"], [2187073261, "Analysis Mission"], [1581219251, "Survey mission"], [1090267699, "Assassination Mission"], [2573702057, "Salvage Mission"], [750649238, "Salvage Mission"], [1164772243, "Salvage Mission"], [2846775197, "Combat Mission"], [2287222467, "Analysis Mission"], 
    [388289443, "Survey mission"], [782290869, "Survey mission"], [3379039897, "Salvage Mission"], [4174103238, "Salvage Mission"], [1102824603, "Assassination Mission"], [2575990417, "Combat Mission"], [2184866967, "Analysis Mission"], [715306877, "Combat Mission"], [4254776501, "Salvage Mission"], [248066530, "Salvage Mission"], [1085523978, "Survey mission"], [415388387, "Survey mission"], [3038694763, "Assassination Mission"], [1250426564, "Assassination Mission"], [3231065327, "Analysis Mission"], 
    [1375839088, "Analysis Mission"], [474380713, "Salvage Mission"], [2798856614, "Survey mission"], [3487576414, "Survey mission"], [3792746061, "Combat Mission"], [3627094182, "Combat Mission"], [1756055546, "Salvage Mission"], [51408141, "Salvage Mission"], [2561308143, "Survey mission"], [4231544111, "Survey mission"], [116352029, "Combat Mission"], [2420240009, "Salvage Mission"], [3669054326, "Salvage Mission"], [1206154103, "Assassination Mission"], [1053141615, "Assassination Mission"], 
    [782175145, "Assassination Mission"], [2588220738, "Survey mission"], [545240418, "Survey mission"], [3612741503, "Survey mission"], [1249965655, "Analysis Mission"], [2379494367, "Analysis Mission"], [1981289329, "Exodus Siege"], [359488722, "Hack the Planet"], [1063969232, "Invitation from the Emperor"], [963938931, "Deep Conversation"], [1289867188, "Unbreakable"], [1225970098, "Lost Crew"], [2665134323, "Release"], [1491022087, "Exodus Siege"], [1107208644, "Hack the Planet"], [1773400654, 
    "Invitation from the Emperor"], [2737739053, "Deep Conversation"], [3140524926, "Unbreakable"], [3289681664, "Lost Crew"], [3700722865, "Release"], [145136689, "Combat mission"], [3376869257, "Salvage mission"], [1120584691, "Salvage mission"], [2044882505, "Defeat enemies"], [3371785215, "Collect Hive Tablets"], [1980705864, "Collect Hive Tablets"], [3377331506, "Survey the Area"], [722882932, "Defeat the Target"], [2134290761, "Defeat Enemies"], [3914655049, "Collect Supplies"], [2896212196, 
    "Collect Supplies"], [724887049, "Survey the Hive"], [1848339284, "Neutralize the Target"], [2966841322, "Incursion"], [1294490226, "Deathly Tremors"], [340004423, "Hephaestus"], [2302677459, "Psionic Potential"], [1503376677, "Hephaestus"], [3384410381, "Psionic Potential"], [1643069750, "Incursion"], [4094398454, "Deathly Tremors"], [1042784002, "Target: The Trickster"], [952862146, "Target: The Hangman"], [2504933700, "Target: The Rifleman"], [1429621744, "Target: The Rider"], [1449366986, 
    "Target: The Mad Bomber"], [3926419686, "Target: The Mindbender"], [2159219121, "Combat Mission"], [2814410372, "Assassination Mission"], [3094124867, "Salvage Mission"], [2428721124, "Salvage Mission"], [1705677315, "Survey mission"], [90389924, "Survey mission"], [1267556998, "Analysis Mission"], [2327656989, "Combat Mission"], [1525152742, "Assassination Mission"], [2905427653, "Salvage Mission"], [1154661682, "Salvage Mission"], [2327658858, "Analysis Mission"], [474193231, "Survey mission"], 
    [1992706528, "Survey mission"], [2892775311, "Combat Mission"], [3535622620, "Assassination Mission"], [3108278497, "Salvage Mission"], [897272366, "Salvage Mission"], [2261527950, "Analysis Mission"], [2695348045, "Survey mission"], [1903826490, "Survey mission"], [2735529319, "Survey mission"], [3346680969, "Combat Mission"], [2207037656, "Assassination Mission"], [1679453803, "Salvage Mission"], [498220076, "Salvage Mission"], [1691057182, "Analysis Mission"], [1099158615, "Survey mission"], 
    [3634370598, "Field Assignment: Active Duty"], [3535117433, "Field Assignment: Assassination"], [1689885469, "Field Assignment: Pilgrimage"], [2272383802, "Field Assignment: Salvage"], [1229540554, "Field Assignment: Active Duty"], [840467755, "Field Assignment: Assassination"], [3467071851, "Field Assignment: Pilgrimage"], [3601558330, "Field Assignment: Salvage"], [98112589, "Field Assignment: Salvage"], [996637433, "Field Assignment: Active Duty"], [1075001832, "Field Assignment: Assassination"], 
    [3078057004, "Field Assignment: Pilgrimage"], [130838713, "Field Assignment: Salvage"], [1996247142, "Field Assignment: Salvage"], [3774573332, "WANTED: Arcadian Chord"], [2431838030, "WANTED: Arcadian Chord"], [3676143304, "WANTED: Arcadian Chord"], [497583046, "WANTED: Gravetide Summoner"], [386959931, "WANTED: Gravetide Summoner"], [186006588, "WANTED: Gravetide Summoner"], [1003955024, "WANTED: Blood Cleaver"], [4275462311, "WANTED: Blood Cleaver"], [3957909528, "WANTED: Blood Cleaver"], 
    [494635832, "WANTED: Silent Fang"], [3679946187, "WANTED: Silent Fang"], [1111101131, "WANTED: Silent Fang"], [4199058482, "WANTED: The Eye in the Dark"], [4150577752, "WANTED: The Eye in the Dark"], [3805779101, "WANTED: Combustor Valus"]]);
    this.activityModeTypeMap = new Map([[0, "All"], [7, "PvE"], [64, "Competitive Co-Op"], [6, "Explore"], [5, "Crucible"], [69, "Competitive PvP"], [70, "Quickplay PvP"], [4, "Raid"], [2, "Story"], [3, "Normal Strikes"], [16, "Nightfall Strikes"], [17, "Prestige Nightfall"], [46, "Scored Nightfall Strikes"], [47, "Scored Prestige Nightfall"], [18, "Strikes"], [19, "Iron Banner"], [10, "Control"], [73, "Control: Quickplay"], [74, "Control: Competitive"], [12, "Clash"], [71, "Clash: Quickplay"], [72, 
    "Clash: Competitive"], [67, "Salvage"], [37, "Survival"], [38, "Countdown"], [31, "Supremacy"], [45, "Iron Banner Supremacy"], [44, "Iron Banner Clash"], [43, "Iron Banner Control"], [68, "Iron Banner Salvage"], [39, "Trials of the Nine"], [41, "Trials of the Nine Countdown"], [42, "Trials of the Nine Survival"], [40, "Social"], [49, "All Doubles"], [50, "Doubles"], [15, "Crimson Doubles"], [25, "Mayhem"], [48, "Rumble"], [32, "Private Matches"], [51, "Private Matches Clash"], [52, "Private Matches Control"], 
    [54, "Private Matches Countdown"], [53, "Private Matches Supremacy"], [55, "Private Matches Survival"], [56, "Private Matches Mayhem"], [57, "Private Matches Rumble"], [58, "Heroic Adventure"], [59, "Showdown"], [60, "Lockdown"], [61, "Scorched"], [62, "Team Scorched"], [63, "Gambit"], [75, "Gambit Prime"], [76, "The Reckoning"], [65, "Breakthrough"], [66, "Forge"]]);
    this.classTypeMap = new Map([[0, "Titan"], [1, "Hunter"], [2, "Warlock"]]);
    this.genderTypeMap = new Map([[0, "Male"], [1, "Female"]]);
    this.raceTypeMap = new Map([[0, "Human"], [1, "Awoken"], [2, "Exo"]]);
    this.pvpActivities = [5, 10, 12, 15, 19, 25, 31, 37, 38, 39, 43, 48, 49, 50, 59, 60, 61, 62, 65];
  }
}, "src/maps.js", []);

//./src/script.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  var module$src$dashboard = $$require("src/dashboard.js");
  $(function() {
    window.dashboard = new module$src$dashboard["default"]($);
  });
}, "src/script.js", ["src/dashboard.js"]);

//./src/utils.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return Utils;
  }}});
  function Utils() {
    this.getDurationFromMinutes = function(minutes) {
      var d = Math.floor(minutes / 1440), dh = minutes % 1440;
      var h = Math.floor(dh / 60);
      var m = dh % 60;
      return d + "d " + h + "h " + m + "m";
    };
    this.minutesToHours = function(minutes) {
      var display = "";
      var h = Math.floor(minutes / 60);
      var m = minutes % 60;
      if (h > 0) {
        display = h + "h ";
      }
      if (m > 0) {
        display = display + m + "m";
      }
      return display;
    };
    this.objectToArray = function(obj, transformer) {
      var output = [];
      for (var o in obj) {
        var item = obj[o];
        output.push(transformer !== undefined ? transformer(item) : item);
      }
      return output;
    };
  }
}, "src/utils.js", []);

//./src/vue-container.js
$jscomp.registerAndLoadModule(function($$require, $$exports, $$module) {
  "use strict";
  Object.defineProperties($$exports, {"default":{enumerable:true, get:function() {
    return VueContainer;
  }}});
  var module$src$maps = $$require("src/maps.js");
  var module$src$utils = $$require("src/utils.js");
  function VueContainer(options) {
    var jq = options.jq;
    var bungieApi = options.bungieApi;
    var typeMaps = new module$src$maps["default"];
    var utils = new module$src$utils["default"];
    var config = {el:options.appContainer, data:{activetab:1, charactersInfo:[], activities:[], membershipInfo:[], searchTerm:"", userSearchResults:[], selectedBlizzardUserMembershipId:0, errorMessage:"", resolvedMemberships:[]}, computed:{isSearchDisabled:function() {
      return this.searchTerm.trim().length > 0;
    }, isLoadingComplete:function() {
      for (var c = 0; c < this.charactersInfo.length; c++) {
        if (this.charactersInfo[c].loaded === false) {
          return false;
        }
      }
      return true;
    }}, methods:{}};
    var bungieSite = bungieApi.getBungieSiteUrl();
    var parseDataFromUrl = function() {
      var hrefParts = options.href.split("#");
      if (hrefParts.length > 1) {
        config.data.searchTerm = decodeURIComponent(hrefParts[1]);
      }
    };
    var setErrorMessage = function(message) {
      config.data.errorMessage = message;
    };
    bungieApi.setErrorDisplayHandler(setErrorMessage);
    var storeActivityData = function(characterId, membershipType, activities) {
      if (activities) {
        activities.forEach(function(activity) {
          activity.characterId = characterId;
          activity.membershipType = membershipType;
          activity.isPvP = typeMaps.pvpActivities.indexOf(activity.activityDetails.mode) !== -1;
          config.data.activities.push(activity);
        });
      }
    };
    var sortActivities = function() {
      config.data.activities.sort(function(a, b) {
        return (new Date(b.period)).getTime() - (new Date(a.period)).getTime();
      });
    };
    var triggerLoadCharacterData = function(characterIndex, membershipInfoIndex) {
      options.eventManager.triggerLoadCharacterData({characterIndex:characterIndex, membershipInfoIndex:membershipInfoIndex});
    };
    jq(document).on(options.eventManager.getCharacterDataLoadedEventName(), function(event, data) {
      var membershipInfo = config.data.membershipInfo[data.membershipInfoIndex], maxRecord = 250, platformId = membershipInfo.membershipType, character = membershipInfo.characters[data.characterIndex];
      var processor = function(result) {
        if (result.Response && result.Response.activities && result.Response.activities.length > 0) {
          storeActivityData(character.characterId, membershipInfo.membershipType, result.Response.activities);
          config.data.membershipInfo[data.membershipInfoIndex].characters[data.characterIndex].activitiesPage++;
          triggerLoadCharacterData(data.characterIndex, data.membershipInfoIndex);
        } else {
          console.debug("Loaded " + character.activitiesPage + " page(s) of activites for chracter: " + character.characterId);
          config.data.membershipInfo[data.membershipInfoIndex].characters[data.characterIndex].loaded = true;
          sortActivities();
        }
      };
      bungieApi.getActivities(platformId, membershipInfo.membershipId, character.characterId, maxRecord, config.data.membershipInfo[data.membershipInfoIndex].characters[data.characterIndex].activitiesPage).then(processor);
    });
    config.methods.userClicked = function(e) {
      e.preventDefault();
      var membershipId = $(e.target).attr("data-membership-id");
      var membershipType = $(e.target).attr("data-membership-type");
      console.debug("User member: " + membershipId);
      config.data.userSearchResults = [];
      resolveUserMemberships(membershipId, membershipType);
    };
    var resolveUserMemberships = function(membershipId, membershipType) {
      config.data.resolvedMemberships = [];
      bungieApi.getMembershipById(membershipId, membershipType).then(function(response) {
        for (var i = 0; i < response.Response.destinyMemberships.length; i++) {
          var dm = response.Response.destinyMemberships[i];
          config.data.resolvedMemberships.push(dm);
        }
        if (config.data.resolvedMemberships.length > 0) {
          processResolvedMemberships();
        }
      });
    };
    var processResolvedMemberships = function() {
      var membershipInfoIndex = 0;
      config.data.activities = [];
      config.data.characterIds = [];
      config.data.charactersInfo = [];
      var parseCharacterDetails = function(membershipInfo, charactersData) {
        var characters = [];
        for (var c in charactersData) {
          var cd = charactersData[c];
          cd.platformIconPath = bungieSite + membershipInfo.iconPath;
          cd.membershipType = membershipInfo.membershipType;
          if (cd.membershipType === 4) {
            cd.platformIconPath = "/d2/images/logos/battlenet-icon.jpg";
          }
          cd.activitiesPage = 0;
          cd.loaded = false;
          characters.push(cd);
        }
        return characters;
      };
      var createCharacterDynamicCss = function(membershipInfo) {
        var characterStyle = "";
        for (var c in membershipInfo.characters) {
          var cd = membershipInfo.characters[c];
          characterStyle = characterStyle + " .char-class-" + cd.characterId + ' { background-image: url("' + bungieSite + cd.emblemPath + '" )}';
          characterStyle = characterStyle + " .char-class-emblem-bg-" + cd.characterId + ' { background-image: url("' + bungieSite + cd.emblemBackgroundPath + '" )}';
        }
        var $customStyle = $('\x3cstyle id\x3d"user-custom-' + membershipInfo.membershipType + '"\x3e');
        $customStyle.text(characterStyle);
        $customStyle.appendTo(document.head);
      };
      var loadAllCharacterActivities = function(membershipInfoIndex) {
        var membershipInfo = config.data.membershipInfo[membershipInfoIndex];
        console.debug("membershipInfoIndex: " + membershipInfoIndex);
        console.debug(membershipInfo);
        for (var characterIndex = 0; characterIndex < membershipInfo.characters.length; characterIndex++) {
          triggerLoadCharacterData(characterIndex, membershipInfoIndex);
        }
      };
      config.data.resolvedMemberships.forEach(function(membershipInfo) {
        bungieApi.loadFullProfile(membershipInfo).then(function(result) {
          membershipInfo.profile = result.Response.profile.data;
          membershipInfo.characterIds = result.Response.profile.data.characterIds;
          membershipInfo.characters = parseCharacterDetails(membershipInfo, result.Response.characters.data);
          for (var i = 0; i < membershipInfo.characters.length; i++) {
            var character = membershipInfo.characters[i];
            character.genderTypeName = typeMaps.genderTypeMap.get(character.genderType);
            character.raceTypeName = typeMaps.raceTypeMap.get(character.raceType);
            character.classTypeName = typeMaps.classTypeMap.get(character.classType);
            character.totalDurationPlayed = utils.getDurationFromMinutes(character.minutesPlayedTotal);
            config.data.charactersInfo.push(character);
          }
          createCharacterDynamicCss(membershipInfo);
          config.data.membershipInfo.push(membershipInfo);
          loadAllCharacterActivities(membershipInfoIndex);
          membershipInfoIndex++;
        });
      });
    };
    config.methods.clearSearchData = function() {
      config.data.userSearchResults = [];
      config.data.activities = [];
      config.data.characterIds = [];
      config.data.membershipInfo = [];
      config.data.charactersInfo = [];
      config.data.resolvedMemberships = [];
    };
    config.methods.findPlayers = function() {
      config.methods.clearSearchData();
      var searchTerm = config.data.searchTerm.trim();
      if (searchTerm.length === 0) {
        return;
      }
      bungieApi.searchUsers(searchTerm).then(function(response) {
        for (var i = 0; i < response.Response.results.length; i++) {
          var r = response.Response.results[i];
          if (r.blizzardDisplayName !== undefined) {
            r.membershipType = 4;
            r.displayName = "[BNet] " + r.blizzardDisplayName;
          } else {
            if (r.psnDisplayName !== undefined) {
              r.membershipType = 2;
              r.displayName = "[PSN] " + r.psnDisplayName;
            } else {
              if (r.xboxDisplayName !== undefined) {
                r.membershipType = 1;
                r.displayName = "[XBL] " + r.xboxDisplayName;
              }
            }
          }
          config.data.userSearchResults.push(r);
        }
      });
    };
    config.methods.getActivityType = function(activityHash) {
      return typeMaps.activityTypeMap.get(activityHash);
    };
    config.methods.getActivityModeTypes = function(activityModes) {
      var descriptions = [];
      typeMaps.activityModes.forEach(function(mode) {
        descriptions.push(activitModeTypeMap.get(mode));
      });
      return descriptions.join(",");
    };
    config.methods.getActivityModeType = function(activityMode) {
      return typeMaps.activityModeTypeMap.get(activityMode);
    };
    config.methods.drawActivitySummaryGraphs = function() {
      options.eventManager.triggerRedrawCharts();
    };
    config.data.chartTabClicked = function() {
      config.data.activetab = 3;
      setTimeout(function() {
        options.eventManager.triggerRedrawCharts();
      }, 500);
    };
    this.getAllActivities = function() {
      return config.data.activities;
    };
    parseDataFromUrl();
    if (config.data.searchTerm.length > 0) {
      config.methods.findPlayers();
    }
    this.config = config;
    window.config = this.config;
    this.vueApp = new Vue(window.config);
    this.setErrorMessage = setErrorMessage;
    window.vueApp = this.vueApp;
  }
}, "src/vue-container.js", ["src/maps.js", "src/utils.js"]);


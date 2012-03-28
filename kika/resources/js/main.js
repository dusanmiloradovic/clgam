var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.require = function(rule) {
  if(!COMPILED) {
    if(goog.getObjectByName(rule)) {
      return
    }
    var path = goog.getPathFromDeps_(rule);
    if(path) {
      goog.included_[path] = true;
      goog.writeScripts_()
    }else {
      var errorMessage = "goog.require could not find: " + rule;
      if(goog.global.console) {
        goog.global.console["error"](errorMessage)
      }
      throw Error(errorMessage);
    }
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName])
          }else {
            if(!goog.getObjectByName(requireName)) {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs)
    }
  }else {
    return function() {
      return fn.apply(context, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.ENABLE_MONITORING) {
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.ENABLE_MONITORING) {
      var uid = goog.getUid(this);
      if(!goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.disposeInternal = function() {
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global && !goog.string.contains(str, "<")) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global["document"]["createElement"]("div");
  el["innerHTML"] = "<pre>x" + str + "</pre>";
  if(el["firstChild"][goog.string.NORMALIZE_FN_]) {
    el["firstChild"][goog.string.NORMALIZE_FN_]()
  }
  str = el["firstChild"]["firstChild"]["nodeValue"].slice(1);
  el["innerHTML"] = "";
  return goog.string.canonicalizeNewlines(str)
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.NORMALIZE_FN_ = "normalize";
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\u000b":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isVersion("9"), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.inherits(goog.events.Event, goog.Disposable);
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
MESSAGE:"message", CONNECT:"connect"};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = new Function("a", "return a");
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      try {
        goog.reflect.sinkValue(relatedTarget.nodeName)
      }catch(err) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.structs.SimplePool");
goog.require("goog.Disposable");
goog.structs.SimplePool = function(initialCount, maxCount) {
  goog.Disposable.call(this);
  this.maxCount_ = maxCount;
  this.freeQueue_ = [];
  this.createInitial_(initialCount)
};
goog.inherits(goog.structs.SimplePool, goog.Disposable);
goog.structs.SimplePool.prototype.createObjectFn_ = null;
goog.structs.SimplePool.prototype.disposeObjectFn_ = null;
goog.structs.SimplePool.prototype.setCreateObjectFn = function(createObjectFn) {
  this.createObjectFn_ = createObjectFn
};
goog.structs.SimplePool.prototype.setDisposeObjectFn = function(disposeObjectFn) {
  this.disposeObjectFn_ = disposeObjectFn
};
goog.structs.SimplePool.prototype.getObject = function() {
  if(this.freeQueue_.length) {
    return this.freeQueue_.pop()
  }
  return this.createObject()
};
goog.structs.SimplePool.prototype.releaseObject = function(obj) {
  if(this.freeQueue_.length < this.maxCount_) {
    this.freeQueue_.push(obj)
  }else {
    this.disposeObject(obj)
  }
};
goog.structs.SimplePool.prototype.createInitial_ = function(initialCount) {
  if(initialCount > this.maxCount_) {
    throw Error("[goog.structs.SimplePool] Initial cannot be greater than max");
  }
  for(var i = 0;i < initialCount;i++) {
    this.freeQueue_.push(this.createObject())
  }
};
goog.structs.SimplePool.prototype.createObject = function() {
  if(this.createObjectFn_) {
    return this.createObjectFn_()
  }else {
    return{}
  }
};
goog.structs.SimplePool.prototype.disposeObject = function(obj) {
  if(this.disposeObjectFn_) {
    this.disposeObjectFn_(obj)
  }else {
    if(goog.isObject(obj)) {
      if(goog.isFunction(obj.dispose)) {
        obj.dispose()
      }else {
        for(var i in obj) {
          delete obj[i]
        }
      }
    }
  }
};
goog.structs.SimplePool.prototype.disposeInternal = function() {
  goog.structs.SimplePool.superClass_.disposeInternal.call(this);
  var freeQueue = this.freeQueue_;
  while(freeQueue.length) {
    this.disposeObject(freeQueue.pop())
  }
  delete this.freeQueue_
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.events.pools");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Listener");
goog.require("goog.structs.SimplePool");
goog.require("goog.userAgent.jscript");
goog.events.ASSUME_GOOD_GC = false;
goog.events.pools.getObject;
goog.events.pools.releaseObject;
goog.events.pools.getArray;
goog.events.pools.releaseArray;
goog.events.pools.getProxy;
goog.events.pools.setProxyCallbackFunction;
goog.events.pools.releaseProxy;
goog.events.pools.getListener;
goog.events.pools.releaseListener;
goog.events.pools.getEvent;
goog.events.pools.releaseEvent;
(function() {
  var BAD_GC = !goog.events.ASSUME_GOOD_GC && goog.userAgent.jscript.HAS_JSCRIPT && !goog.userAgent.jscript.isVersion("5.7");
  function getObject() {
    return{count_:0, remaining_:0}
  }
  function getArray() {
    return[]
  }
  var proxyCallbackFunction;
  goog.events.pools.setProxyCallbackFunction = function(cb) {
    proxyCallbackFunction = cb
  };
  function getProxy() {
    var f = function(eventObject) {
      return proxyCallbackFunction.call(f.src, f.key, eventObject)
    };
    return f
  }
  function getListener() {
    return new goog.events.Listener
  }
  function getEvent() {
    return new goog.events.BrowserEvent
  }
  if(!BAD_GC) {
    goog.events.pools.getObject = getObject;
    goog.events.pools.releaseObject = goog.nullFunction;
    goog.events.pools.getArray = getArray;
    goog.events.pools.releaseArray = goog.nullFunction;
    goog.events.pools.getProxy = getProxy;
    goog.events.pools.releaseProxy = goog.nullFunction;
    goog.events.pools.getListener = getListener;
    goog.events.pools.releaseListener = goog.nullFunction;
    goog.events.pools.getEvent = getEvent;
    goog.events.pools.releaseEvent = goog.nullFunction
  }else {
    goog.events.pools.getObject = function() {
      return objectPool.getObject()
    };
    goog.events.pools.releaseObject = function(obj) {
      objectPool.releaseObject(obj)
    };
    goog.events.pools.getArray = function() {
      return arrayPool.getObject()
    };
    goog.events.pools.releaseArray = function(obj) {
      arrayPool.releaseObject(obj)
    };
    goog.events.pools.getProxy = function() {
      return proxyPool.getObject()
    };
    goog.events.pools.releaseProxy = function(obj) {
      proxyPool.releaseObject(getProxy())
    };
    goog.events.pools.getListener = function() {
      return listenerPool.getObject()
    };
    goog.events.pools.releaseListener = function(obj) {
      listenerPool.releaseObject(obj)
    };
    goog.events.pools.getEvent = function() {
      return eventPool.getObject()
    };
    goog.events.pools.releaseEvent = function(obj) {
      eventPool.releaseObject(obj)
    };
    var OBJECT_POOL_INITIAL_COUNT = 0;
    var OBJECT_POOL_MAX_COUNT = 600;
    var objectPool = new goog.structs.SimplePool(OBJECT_POOL_INITIAL_COUNT, OBJECT_POOL_MAX_COUNT);
    objectPool.setCreateObjectFn(getObject);
    var ARRAY_POOL_INITIAL_COUNT = 0;
    var ARRAY_POOL_MAX_COUNT = 600;
    var arrayPool = new goog.structs.SimplePool(ARRAY_POOL_INITIAL_COUNT, ARRAY_POOL_MAX_COUNT);
    arrayPool.setCreateObjectFn(getArray);
    var HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT = 0;
    var HANDLE_EVENT_PROXY_POOL_MAX_COUNT = 600;
    var proxyPool = new goog.structs.SimplePool(HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT, HANDLE_EVENT_PROXY_POOL_MAX_COUNT);
    proxyPool.setCreateObjectFn(getProxy);
    var LISTENER_POOL_INITIAL_COUNT = 0;
    var LISTENER_POOL_MAX_COUNT = 600;
    var listenerPool = new goog.structs.SimplePool(LISTENER_POOL_INITIAL_COUNT, LISTENER_POOL_MAX_COUNT);
    listenerPool.setCreateObjectFn(getListener);
    var EVENT_POOL_INITIAL_COUNT = 0;
    var EVENT_POOL_MAX_COUNT = 600;
    var eventPool = new goog.structs.SimplePool(EVENT_POOL_INITIAL_COUNT, EVENT_POOL_MAX_COUNT);
    eventPool.setCreateObjectFn(getEvent)
  }
})();
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.pools");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.requiresSyntheticEventPropagation_;
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = goog.events.pools.getObject()
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = goog.events.pools.getObject();
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = goog.events.pools.getArray();
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.pools.getProxy();
      proxy.src = src;
      listenerObj = goog.events.pools.getListener();
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = goog.events.pools.getArray()
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          goog.events.pools.releaseProxy(proxy);
          goog.events.pools.releaseListener(listenerArray[oldIndex]);
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        goog.events.pools.releaseArray(listenerArray);
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type][capture]);
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type]);
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return rv
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(goog.events.synthesizeEventPropagation_()) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = goog.events.pools.getEvent();
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = goog.events.pools.getArray();
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0;
        goog.events.pools.releaseArray(ancestors)
      }
      evt.dispose();
      goog.events.pools.releaseEvent(evt)
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be)
  }finally {
    be.dispose()
  }
  return retval
};
goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_);
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.events.synthesizeEventPropagation_ = function() {
  if(goog.events.requiresSyntheticEventPropagation_ === undefined) {
    goog.events.requiresSyntheticEventPropagation_ = goog.userAgent.IE && !goog.global["addEventListener"]
  }
  return goog.events.requiresSyntheticEventPropagation_
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
});
goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.events.EventTarget = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = true;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null
};
goog.provide("goog.Timer");
goog.require("goog.events.EventTarget");
goog.Timer = function(opt_interval, opt_timerObject) {
  goog.events.EventTarget.call(this);
  this.interval_ = opt_interval || 1;
  this.timerObject_ = opt_timerObject || goog.Timer.defaultTimerObject;
  this.boundTick_ = goog.bind(this.tick_, this);
  this.last_ = goog.now()
};
goog.inherits(goog.Timer, goog.events.EventTarget);
goog.Timer.MAX_TIMEOUT_ = 2147483647;
goog.Timer.prototype.enabled = false;
goog.Timer.defaultTimerObject = goog.global["window"];
goog.Timer.intervalScale = 0.8;
goog.Timer.prototype.timer_ = null;
goog.Timer.prototype.getInterval = function() {
  return this.interval_
};
goog.Timer.prototype.setInterval = function(interval) {
  this.interval_ = interval;
  if(this.timer_ && this.enabled) {
    this.stop();
    this.start()
  }else {
    if(this.timer_) {
      this.stop()
    }
  }
};
goog.Timer.prototype.tick_ = function() {
  if(this.enabled) {
    var elapsed = goog.now() - this.last_;
    if(elapsed > 0 && elapsed < this.interval_ * goog.Timer.intervalScale) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_ - elapsed);
      return
    }
    this.dispatchTick();
    if(this.enabled) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
      this.last_ = goog.now()
    }
  }
};
goog.Timer.prototype.dispatchTick = function() {
  this.dispatchEvent(goog.Timer.TICK)
};
goog.Timer.prototype.start = function() {
  this.enabled = true;
  if(!this.timer_) {
    this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
    this.last_ = goog.now()
  }
};
goog.Timer.prototype.stop = function() {
  this.enabled = false;
  if(this.timer_) {
    this.timerObject_.clearTimeout(this.timer_);
    this.timer_ = null
  }
};
goog.Timer.prototype.disposeInternal = function() {
  goog.Timer.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.timerObject_
};
goog.Timer.TICK = "tick";
goog.Timer.callOnce = function(listener, opt_delay, opt_handler) {
  if(goog.isFunction(listener)) {
    if(opt_handler) {
      listener = goog.bind(listener, opt_handler)
    }
  }else {
    if(listener && typeof listener.handleEvent == "function") {
      listener = goog.bind(listener.handleEvent, listener)
    }else {
      throw Error("Invalid listener argument");
    }
  }
  if(opt_delay > goog.Timer.MAX_TIMEOUT_) {
    return-1
  }else {
    return goog.Timer.defaultTimerObject.setTimeout(listener, opt_delay || 0)
  }
};
goog.Timer.clear = function(timerId) {
  goog.Timer.defaultTimerObject.clearTimeout(timerId)
};
goog.provide("goog.structs");
goog.require("goog.array");
goog.require("goog.object");
goog.structs.getCount = function(col) {
  if(typeof col.getCount == "function") {
    return col.getCount()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return col.length
  }
  return goog.object.getCount(col)
};
goog.structs.getValues = function(col) {
  if(typeof col.getValues == "function") {
    return col.getValues()
  }
  if(goog.isString(col)) {
    return col.split("")
  }
  if(goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(col[i])
    }
    return rv
  }
  return goog.object.getValues(col)
};
goog.structs.getKeys = function(col) {
  if(typeof col.getKeys == "function") {
    return col.getKeys()
  }
  if(typeof col.getValues == "function") {
    return undefined
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(i)
    }
    return rv
  }
  return goog.object.getKeys(col)
};
goog.structs.contains = function(col, val) {
  if(typeof col.contains == "function") {
    return col.contains(val)
  }
  if(typeof col.containsValue == "function") {
    return col.containsValue(val)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(col, val)
  }
  return goog.object.containsValue(col, val)
};
goog.structs.isEmpty = function(col) {
  if(typeof col.isEmpty == "function") {
    return col.isEmpty()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(col)
  }
  return goog.object.isEmpty(col)
};
goog.structs.clear = function(col) {
  if(typeof col.clear == "function") {
    col.clear()
  }else {
    if(goog.isArrayLike(col)) {
      goog.array.clear(col)
    }else {
      goog.object.clear(col)
    }
  }
};
goog.structs.forEach = function(col, f, opt_obj) {
  if(typeof col.forEach == "function") {
    col.forEach(f, opt_obj)
  }else {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj)
    }else {
      var keys = goog.structs.getKeys(col);
      var values = goog.structs.getValues(col);
      var l = values.length;
      for(var i = 0;i < l;i++) {
        f.call(opt_obj, values[i], keys && keys[i], col)
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if(typeof col.filter == "function") {
    return col.filter(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i]
      }
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i])
      }
    }
  }
  return rv
};
goog.structs.map = function(col, f, opt_obj) {
  if(typeof col.map == "function") {
    return col.map(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col)
    }
  }
  return rv
};
goog.structs.some = function(col, f, opt_obj) {
  if(typeof col.some == "function") {
    return col.some(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true
    }
  }
  return false
};
goog.structs.every = function(col, f, opt_obj) {
  if(typeof col.every == "function") {
    return col.every(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false
    }
  }
  return true
};
goog.provide("goog.iter");
goog.provide("goog.iter.Iterator");
goog.provide("goog.iter.StopIteration");
goog.require("goog.array");
goog.require("goog.asserts");
goog.iter.Iterable;
if("StopIteration" in goog.global) {
  goog.iter.StopIteration = goog.global["StopIteration"]
}else {
  goog.iter.StopIteration = Error("StopIteration")
}
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this
};
goog.iter.toIterator = function(iterable) {
  if(iterable instanceof goog.iter.Iterator) {
    return iterable
  }
  if(typeof iterable.__iterator__ == "function") {
    return iterable.__iterator__(false)
  }
  if(goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while(true) {
        if(i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if(!(i in iterable)) {
          i++;
          continue
        }
        return iterable[i++]
      }
    };
    return newIter
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if(goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach(iterable, f, opt_obj)
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }else {
    iterable = goog.iter.toIterator(iterable);
    try {
      while(true) {
        f.call(opt_obj, iterable.next(), undefined, iterable)
      }
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(f.call(opt_obj, val, undefined, iterable)) {
        return val
      }
    }
  };
  return newIter
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if(arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop
  }
  if(step == 0) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if(step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv
  };
  return newIter
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator)
};
goog.iter.map = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      return f.call(opt_obj, val, undefined, iterable)
    }
  };
  return newIter
};
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val)
  });
  return rval
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true
};
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    try {
      if(i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next()
    }catch(ex) {
      if(ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      }else {
        i++;
        return this.next()
      }
    }
  };
  return newIter
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(dropping && f.call(opt_obj, val, undefined, iterable)) {
        continue
      }else {
        dropping = false
      }
      return val
    }
  };
  return newIter
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while(true) {
      if(taking) {
        var val = iterable.next();
        if(f.call(opt_obj, val, undefined, iterable)) {
          return val
        }else {
          taking = false
        }
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter
};
goog.iter.toArray = function(iterable) {
  if(goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable)
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val)
  });
  return array
};
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  try {
    while(true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if(val1 != val2) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }else {
      if(b1 && !b2) {
        return false
      }
      if(!b2) {
        try {
          val2 = iterable2.next();
          return false
        }catch(ex1) {
          if(ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          return true
        }
      }
    }
  }
  return false
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next()
  }catch(e) {
    if(e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue
  }
};
goog.iter.product = function(var_args) {
  var someArrayEmpty = goog.array.some(arguments, function(arr) {
    return!arr.length
  });
  if(someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator
  }
  var iter = new goog.iter.Iterator;
  var arrays = arguments;
  var indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if(indicies) {
      var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex]
      });
      for(var i = indicies.length - 1;i >= 0;i--) {
        goog.asserts.assert(indicies);
        if(indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break
        }
        if(i == 0) {
          indicies = null;
          break
        }
        indicies[i] = 0
      }
      return retVal
    }
    throw goog.iter.StopIteration;
  };
  return iter
};
goog.provide("goog.structs.Map");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  var argLength = arguments.length;
  if(argLength > 1) {
    if(argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var i = 0;i < argLength;i += 2) {
      this.set(arguments[i], arguments[i + 1])
    }
  }else {
    if(opt_map) {
      this.addAll(opt_map)
    }
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  var rv = [];
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key])
  }
  return rv
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat()
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key)
};
goog.structs.Map.prototype.containsValue = function(val) {
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if(goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true
    }
  }
  return false
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if(this === otherMap) {
    return true
  }
  if(this.count_ != otherMap.getCount()) {
    return false
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var key, i = 0;key = this.keys_[i];i++) {
    if(!equalityFn(this.get(key), otherMap.get(key))) {
      return false
    }
  }
  return true
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0
};
goog.structs.Map.prototype.remove = function(key) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;
    if(this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_()
    }
    return true
  }
  return false
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
  if(this.count_ != this.keys_.length) {
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(!goog.structs.Map.hasKey_(seen, key)) {
        this.keys_[destIndex++] = key;
        seen[key] = 1
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key]
  }
  return opt_val
};
goog.structs.Map.prototype.set = function(key, value) {
  if(!goog.structs.Map.hasKey_(this.map_, key)) {
    this.count_++;
    this.keys_.push(key);
    this.version_++
  }
  this.map_[key] = value
};
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if(map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues()
  }else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map)
  }
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map;
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key)
  }
  return transposed
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key]
  }
  return obj
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true)
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false)
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      if(version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key]
    }
  };
  return newIter
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
};
goog.provide("goog.structs.Set");
goog.require("goog.structs");
goog.require("goog.structs.Map");
goog.structs.Set = function(opt_values) {
  this.map_ = new goog.structs.Map;
  if(opt_values) {
    this.addAll(opt_values)
  }
};
goog.structs.Set.getKey_ = function(val) {
  var type = typeof val;
  if(type == "object" && val || type == "function") {
    return"o" + goog.getUid(val)
  }else {
    return type.substr(0, 1) + val
  }
};
goog.structs.Set.prototype.getCount = function() {
  return this.map_.getCount()
};
goog.structs.Set.prototype.add = function(element) {
  this.map_.set(goog.structs.Set.getKey_(element), element)
};
goog.structs.Set.prototype.addAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.add(values[i])
  }
};
goog.structs.Set.prototype.removeAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.remove(values[i])
  }
};
goog.structs.Set.prototype.remove = function(element) {
  return this.map_.remove(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.clear = function() {
  this.map_.clear()
};
goog.structs.Set.prototype.isEmpty = function() {
  return this.map_.isEmpty()
};
goog.structs.Set.prototype.contains = function(element) {
  return this.map_.containsKey(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.containsAll = function(col) {
  return goog.structs.every(col, this.contains, this)
};
goog.structs.Set.prototype.intersection = function(col) {
  var result = new goog.structs.Set;
  var values = goog.structs.getValues(col);
  for(var i = 0;i < values.length;i++) {
    var value = values[i];
    if(this.contains(value)) {
      result.add(value)
    }
  }
  return result
};
goog.structs.Set.prototype.getValues = function() {
  return this.map_.getValues()
};
goog.structs.Set.prototype.clone = function() {
  return new goog.structs.Set(this)
};
goog.structs.Set.prototype.equals = function(col) {
  return this.getCount() == goog.structs.getCount(col) && this.isSubsetOf(col)
};
goog.structs.Set.prototype.isSubsetOf = function(col) {
  var colCount = goog.structs.getCount(col);
  if(this.getCount() > colCount) {
    return false
  }
  if(!(col instanceof goog.structs.Set) && colCount > 5) {
    col = new goog.structs.Set(col)
  }
  return goog.structs.every(this, function(value) {
    return goog.structs.contains(col, value)
  })
};
goog.structs.Set.prototype.__iterator__ = function(opt_keys) {
  return this.map_.__iterator__(false)
};
goog.provide("goog.debug");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs.Set");
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global;
  var oldErrorHandler = target.onerror;
  target.onerror = function(message, url, line) {
    if(oldErrorHandler) {
      oldErrorHandler(message, url, line)
    }
    logFunc({message:message, fileName:url, line:line});
    return Boolean(opt_cancel)
  }
};
goog.debug.expose = function(obj, opt_showFn) {
  if(typeof obj == "undefined") {
    return"undefined"
  }
  if(obj == null) {
    return"NULL"
  }
  var str = [];
  for(var x in obj) {
    if(!opt_showFn && goog.isFunction(obj[x])) {
      continue
    }
    var s = x + " = ";
    try {
      s += obj[x]
    }catch(e) {
      s += "*** " + e + " ***"
    }
    str.push(s)
  }
  return str.join("\n")
};
goog.debug.deepExpose = function(obj, opt_showFn) {
  var previous = new goog.structs.Set;
  var str = [];
  var helper = function(obj, space) {
    var nestspace = space + "  ";
    var indentMultiline = function(str) {
      return str.replace(/\n/g, "\n" + space)
    };
    try {
      if(!goog.isDef(obj)) {
        str.push("undefined")
      }else {
        if(goog.isNull(obj)) {
          str.push("NULL")
        }else {
          if(goog.isString(obj)) {
            str.push('"' + indentMultiline(obj) + '"')
          }else {
            if(goog.isFunction(obj)) {
              str.push(indentMultiline(String(obj)))
            }else {
              if(goog.isObject(obj)) {
                if(previous.contains(obj)) {
                  str.push("*** reference loop detected ***")
                }else {
                  previous.add(obj);
                  str.push("{");
                  for(var x in obj) {
                    if(!opt_showFn && goog.isFunction(obj[x])) {
                      continue
                    }
                    str.push("\n");
                    str.push(nestspace);
                    str.push(x + " = ");
                    helper(obj[x], nestspace)
                  }
                  str.push("\n" + space + "}")
                }
              }else {
                str.push(obj)
              }
            }
          }
        }
      }
    }catch(e) {
      str.push("*** " + e + " ***")
    }
  };
  helper(obj, "");
  return str.join("")
};
goog.debug.exposeArray = function(arr) {
  var str = [];
  for(var i = 0;i < arr.length;i++) {
    if(goog.isArray(arr[i])) {
      str.push(goog.debug.exposeArray(arr[i]))
    }else {
      str.push(arr[i])
    }
  }
  return"[ " + str.join(", ") + " ]"
};
goog.debug.exposeException = function(err, opt_fn) {
  try {
    var e = goog.debug.normalizeErrorObject(err);
    var error = "Message: " + goog.string.htmlEscape(e.message) + '\nUrl: <a href="view-source:' + e.fileName + '" target="_new">' + e.fileName + "</a>\nLine: " + e.lineNumber + "\n\nBrowser stack:\n" + goog.string.htmlEscape(e.stack + "-> ") + "[end]\n\nJS stack traversal:\n" + goog.string.htmlEscape(goog.debug.getStacktrace(opt_fn) + "-> ");
    return error
  }catch(e2) {
    return"Exception trying to expose exception! You win, we lose. " + e2
  }
};
goog.debug.normalizeErrorObject = function(err) {
  var href = goog.getObjectByName("window.location.href");
  if(goog.isString(err)) {
    return{"message":err, "name":"Unknown error", "lineNumber":"Not available", "fileName":href, "stack":"Not available"}
  }
  var lineNumber, fileName;
  var threwError = false;
  try {
    lineNumber = err.lineNumber || err.line || "Not available"
  }catch(e) {
    lineNumber = "Not available";
    threwError = true
  }
  try {
    fileName = err.fileName || err.filename || err.sourceURL || href
  }catch(e) {
    fileName = "Not available";
    threwError = true
  }
  if(threwError || !err.lineNumber || !err.fileName || !err.stack) {
    return{"message":err.message, "name":err.name, "lineNumber":lineNumber, "fileName":fileName, "stack":err.stack || "Not available"}
  }
  return err
};
goog.debug.enhanceError = function(err, opt_message) {
  var error = typeof err == "string" ? Error(err) : err;
  if(!error.stack) {
    error.stack = goog.debug.getStacktrace(arguments.callee.caller)
  }
  if(opt_message) {
    var x = 0;
    while(error["message" + x]) {
      ++x
    }
    error["message" + x] = String(opt_message)
  }
  return error
};
goog.debug.getStacktraceSimple = function(opt_depth) {
  var sb = [];
  var fn = arguments.callee.caller;
  var depth = 0;
  while(fn && (!opt_depth || depth < opt_depth)) {
    sb.push(goog.debug.getFunctionName(fn));
    sb.push("()\n");
    try {
      fn = fn.caller
    }catch(e) {
      sb.push("[exception trying to get caller]\n");
      break
    }
    depth++;
    if(depth >= goog.debug.MAX_STACK_DEPTH) {
      sb.push("[...long stack...]");
      break
    }
  }
  if(opt_depth && depth >= opt_depth) {
    sb.push("[...reached max depth limit...]")
  }else {
    sb.push("[end]")
  }
  return sb.join("")
};
goog.debug.MAX_STACK_DEPTH = 50;
goog.debug.getStacktrace = function(opt_fn) {
  return goog.debug.getStacktraceHelper_(opt_fn || arguments.callee.caller, [])
};
goog.debug.getStacktraceHelper_ = function(fn, visited) {
  var sb = [];
  if(goog.array.contains(visited, fn)) {
    sb.push("[...circular reference...]")
  }else {
    if(fn && visited.length < goog.debug.MAX_STACK_DEPTH) {
      sb.push(goog.debug.getFunctionName(fn) + "(");
      var args = fn.arguments;
      for(var i = 0;i < args.length;i++) {
        if(i > 0) {
          sb.push(", ")
        }
        var argDesc;
        var arg = args[i];
        switch(typeof arg) {
          case "object":
            argDesc = arg ? "object" : "null";
            break;
          case "string":
            argDesc = arg;
            break;
          case "number":
            argDesc = String(arg);
            break;
          case "boolean":
            argDesc = arg ? "true" : "false";
            break;
          case "function":
            argDesc = goog.debug.getFunctionName(arg);
            argDesc = argDesc ? argDesc : "[fn]";
            break;
          case "undefined":
          ;
          default:
            argDesc = typeof arg;
            break
        }
        if(argDesc.length > 40) {
          argDesc = argDesc.substr(0, 40) + "..."
        }
        sb.push(argDesc)
      }
      visited.push(fn);
      sb.push(")\n");
      try {
        sb.push(goog.debug.getStacktraceHelper_(fn.caller, visited))
      }catch(e) {
        sb.push("[exception trying to get caller]\n")
      }
    }else {
      if(fn) {
        sb.push("[...long stack...]")
      }else {
        sb.push("[end]")
      }
    }
  }
  return sb.join("")
};
goog.debug.getFunctionName = function(fn) {
  var functionSource = String(fn);
  if(!goog.debug.fnNameCache_[functionSource]) {
    var matches = /function ([^\(]+)/.exec(functionSource);
    if(matches) {
      var method = matches[1];
      goog.debug.fnNameCache_[functionSource] = method
    }else {
      goog.debug.fnNameCache_[functionSource] = "[Anonymous]"
    }
  }
  return goog.debug.fnNameCache_[functionSource]
};
goog.debug.makeWhitespaceVisible = function(string) {
  return string.replace(/ /g, "[_]").replace(/\f/g, "[f]").replace(/\n/g, "[n]\n").replace(/\r/g, "[r]").replace(/\t/g, "[t]")
};
goog.debug.fnNameCache_ = {};
goog.provide("goog.debug.LogRecord");
goog.debug.LogRecord = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  this.reset(level, msg, loggerName, opt_time, opt_sequenceNumber)
};
goog.debug.LogRecord.prototype.time_;
goog.debug.LogRecord.prototype.level_;
goog.debug.LogRecord.prototype.msg_;
goog.debug.LogRecord.prototype.loggerName_;
goog.debug.LogRecord.prototype.sequenceNumber_ = 0;
goog.debug.LogRecord.prototype.exception_ = null;
goog.debug.LogRecord.prototype.exceptionText_ = null;
goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS = true;
goog.debug.LogRecord.nextSequenceNumber_ = 0;
goog.debug.LogRecord.prototype.reset = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  if(goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS) {
    this.sequenceNumber_ = typeof opt_sequenceNumber == "number" ? opt_sequenceNumber : goog.debug.LogRecord.nextSequenceNumber_++
  }
  this.time_ = opt_time || goog.now();
  this.level_ = level;
  this.msg_ = msg;
  this.loggerName_ = loggerName;
  delete this.exception_;
  delete this.exceptionText_
};
goog.debug.LogRecord.prototype.getLoggerName = function() {
  return this.loggerName_
};
goog.debug.LogRecord.prototype.getException = function() {
  return this.exception_
};
goog.debug.LogRecord.prototype.setException = function(exception) {
  this.exception_ = exception
};
goog.debug.LogRecord.prototype.getExceptionText = function() {
  return this.exceptionText_
};
goog.debug.LogRecord.prototype.setExceptionText = function(text) {
  this.exceptionText_ = text
};
goog.debug.LogRecord.prototype.setLoggerName = function(loggerName) {
  this.loggerName_ = loggerName
};
goog.debug.LogRecord.prototype.getLevel = function() {
  return this.level_
};
goog.debug.LogRecord.prototype.setLevel = function(level) {
  this.level_ = level
};
goog.debug.LogRecord.prototype.getMessage = function() {
  return this.msg_
};
goog.debug.LogRecord.prototype.setMessage = function(msg) {
  this.msg_ = msg
};
goog.debug.LogRecord.prototype.getMillis = function() {
  return this.time_
};
goog.debug.LogRecord.prototype.setMillis = function(time) {
  this.time_ = time
};
goog.debug.LogRecord.prototype.getSequenceNumber = function() {
  return this.sequenceNumber_
};
goog.provide("goog.debug.LogBuffer");
goog.require("goog.asserts");
goog.require("goog.debug.LogRecord");
goog.debug.LogBuffer = function() {
  goog.asserts.assert(goog.debug.LogBuffer.isBufferingEnabled(), "Cannot use goog.debug.LogBuffer without defining " + "goog.debug.LogBuffer.CAPACITY.");
  this.clear()
};
goog.debug.LogBuffer.getInstance = function() {
  if(!goog.debug.LogBuffer.instance_) {
    goog.debug.LogBuffer.instance_ = new goog.debug.LogBuffer
  }
  return goog.debug.LogBuffer.instance_
};
goog.debug.LogBuffer.CAPACITY = 0;
goog.debug.LogBuffer.prototype.buffer_;
goog.debug.LogBuffer.prototype.curIndex_;
goog.debug.LogBuffer.prototype.isFull_;
goog.debug.LogBuffer.prototype.addRecord = function(level, msg, loggerName) {
  var curIndex = (this.curIndex_ + 1) % goog.debug.LogBuffer.CAPACITY;
  this.curIndex_ = curIndex;
  if(this.isFull_) {
    var ret = this.buffer_[curIndex];
    ret.reset(level, msg, loggerName);
    return ret
  }
  this.isFull_ = curIndex == goog.debug.LogBuffer.CAPACITY - 1;
  return this.buffer_[curIndex] = new goog.debug.LogRecord(level, msg, loggerName)
};
goog.debug.LogBuffer.isBufferingEnabled = function() {
  return goog.debug.LogBuffer.CAPACITY > 0
};
goog.debug.LogBuffer.prototype.clear = function() {
  this.buffer_ = new Array(goog.debug.LogBuffer.CAPACITY);
  this.curIndex_ = -1;
  this.isFull_ = false
};
goog.debug.LogBuffer.prototype.forEachRecord = function(func) {
  var buffer = this.buffer_;
  if(!buffer[0]) {
    return
  }
  var curIndex = this.curIndex_;
  var i = this.isFull_ ? curIndex : -1;
  do {
    i = (i + 1) % goog.debug.LogBuffer.CAPACITY;
    func(buffer[i])
  }while(i != curIndex)
};
goog.provide("goog.debug.LogManager");
goog.provide("goog.debug.Logger");
goog.provide("goog.debug.Logger.Level");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.debug");
goog.require("goog.debug.LogBuffer");
goog.require("goog.debug.LogRecord");
goog.debug.Logger = function(name) {
  this.name_ = name
};
goog.debug.Logger.prototype.parent_ = null;
goog.debug.Logger.prototype.level_ = null;
goog.debug.Logger.prototype.children_ = null;
goog.debug.Logger.prototype.handlers_ = null;
goog.debug.Logger.ENABLE_HIERARCHY = true;
if(!goog.debug.Logger.ENABLE_HIERARCHY) {
  goog.debug.Logger.rootHandlers_ = [];
  goog.debug.Logger.rootLevel_
}
goog.debug.Logger.Level = function(name, value) {
  this.name = name;
  this.value = value
};
goog.debug.Logger.Level.prototype.toString = function() {
  return this.name
};
goog.debug.Logger.Level.OFF = new goog.debug.Logger.Level("OFF", Infinity);
goog.debug.Logger.Level.SHOUT = new goog.debug.Logger.Level("SHOUT", 1200);
goog.debug.Logger.Level.SEVERE = new goog.debug.Logger.Level("SEVERE", 1E3);
goog.debug.Logger.Level.WARNING = new goog.debug.Logger.Level("WARNING", 900);
goog.debug.Logger.Level.INFO = new goog.debug.Logger.Level("INFO", 800);
goog.debug.Logger.Level.CONFIG = new goog.debug.Logger.Level("CONFIG", 700);
goog.debug.Logger.Level.FINE = new goog.debug.Logger.Level("FINE", 500);
goog.debug.Logger.Level.FINER = new goog.debug.Logger.Level("FINER", 400);
goog.debug.Logger.Level.FINEST = new goog.debug.Logger.Level("FINEST", 300);
goog.debug.Logger.Level.ALL = new goog.debug.Logger.Level("ALL", 0);
goog.debug.Logger.Level.PREDEFINED_LEVELS = [goog.debug.Logger.Level.OFF, goog.debug.Logger.Level.SHOUT, goog.debug.Logger.Level.SEVERE, goog.debug.Logger.Level.WARNING, goog.debug.Logger.Level.INFO, goog.debug.Logger.Level.CONFIG, goog.debug.Logger.Level.FINE, goog.debug.Logger.Level.FINER, goog.debug.Logger.Level.FINEST, goog.debug.Logger.Level.ALL];
goog.debug.Logger.Level.predefinedLevelsCache_ = null;
goog.debug.Logger.Level.createPredefinedLevelsCache_ = function() {
  goog.debug.Logger.Level.predefinedLevelsCache_ = {};
  for(var i = 0, level;level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];i++) {
    goog.debug.Logger.Level.predefinedLevelsCache_[level.value] = level;
    goog.debug.Logger.Level.predefinedLevelsCache_[level.name] = level
  }
};
goog.debug.Logger.Level.getPredefinedLevel = function(name) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  return goog.debug.Logger.Level.predefinedLevelsCache_[name] || null
};
goog.debug.Logger.Level.getPredefinedLevelByValue = function(value) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  if(value in goog.debug.Logger.Level.predefinedLevelsCache_) {
    return goog.debug.Logger.Level.predefinedLevelsCache_[value]
  }
  for(var i = 0;i < goog.debug.Logger.Level.PREDEFINED_LEVELS.length;++i) {
    var level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];
    if(level.value <= value) {
      return level
    }
  }
  return null
};
goog.debug.Logger.getLogger = function(name) {
  return goog.debug.LogManager.getLogger(name)
};
goog.debug.Logger.prototype.getName = function() {
  return this.name_
};
goog.debug.Logger.prototype.addHandler = function(handler) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    if(!this.handlers_) {
      this.handlers_ = []
    }
    this.handlers_.push(handler)
  }else {
    goog.asserts.assert(!this.name_, "Cannot call addHandler on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootHandlers_.push(handler)
  }
};
goog.debug.Logger.prototype.removeHandler = function(handler) {
  var handlers = goog.debug.Logger.ENABLE_HIERARCHY ? this.handlers_ : goog.debug.Logger.rootHandlers_;
  return!!handlers && goog.array.remove(handlers, handler)
};
goog.debug.Logger.prototype.getParent = function() {
  return this.parent_
};
goog.debug.Logger.prototype.getChildren = function() {
  if(!this.children_) {
    this.children_ = {}
  }
  return this.children_
};
goog.debug.Logger.prototype.setLevel = function(level) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    this.level_ = level
  }else {
    goog.asserts.assert(!this.name_, "Cannot call setLevel() on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootLevel_ = level
  }
};
goog.debug.Logger.prototype.getLevel = function() {
  return this.level_
};
goog.debug.Logger.prototype.getEffectiveLevel = function() {
  if(!goog.debug.Logger.ENABLE_HIERARCHY) {
    return goog.debug.Logger.rootLevel_
  }
  if(this.level_) {
    return this.level_
  }
  if(this.parent_) {
    return this.parent_.getEffectiveLevel()
  }
  goog.asserts.fail("Root logger has no level set.");
  return null
};
goog.debug.Logger.prototype.isLoggable = function(level) {
  return level.value >= this.getEffectiveLevel().value
};
goog.debug.Logger.prototype.log = function(level, msg, opt_exception) {
  if(this.isLoggable(level)) {
    this.doLogRecord_(this.getLogRecord(level, msg, opt_exception))
  }
};
goog.debug.Logger.prototype.getLogRecord = function(level, msg, opt_exception) {
  if(goog.debug.LogBuffer.isBufferingEnabled()) {
    var logRecord = goog.debug.LogBuffer.getInstance().addRecord(level, msg, this.name_)
  }else {
    logRecord = new goog.debug.LogRecord(level, String(msg), this.name_)
  }
  if(opt_exception) {
    logRecord.setException(opt_exception);
    logRecord.setExceptionText(goog.debug.exposeException(opt_exception, arguments.callee.caller))
  }
  return logRecord
};
goog.debug.Logger.prototype.shout = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SHOUT, msg, opt_exception)
};
goog.debug.Logger.prototype.severe = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SEVERE, msg, opt_exception)
};
goog.debug.Logger.prototype.warning = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.WARNING, msg, opt_exception)
};
goog.debug.Logger.prototype.info = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.INFO, msg, opt_exception)
};
goog.debug.Logger.prototype.config = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.CONFIG, msg, opt_exception)
};
goog.debug.Logger.prototype.fine = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINE, msg, opt_exception)
};
goog.debug.Logger.prototype.finer = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINER, msg, opt_exception)
};
goog.debug.Logger.prototype.finest = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINEST, msg, opt_exception)
};
goog.debug.Logger.prototype.logRecord = function(logRecord) {
  if(this.isLoggable(logRecord.getLevel())) {
    this.doLogRecord_(logRecord)
  }
};
goog.debug.Logger.prototype.logToSpeedTracer_ = function(msg) {
  if(goog.global["console"] && goog.global["console"]["markTimeline"]) {
    goog.global["console"]["markTimeline"](msg)
  }
};
goog.debug.Logger.prototype.doLogRecord_ = function(logRecord) {
  this.logToSpeedTracer_("log:" + logRecord.getMessage());
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var target = this;
    while(target) {
      target.callPublish_(logRecord);
      target = target.getParent()
    }
  }else {
    for(var i = 0, handler;handler = goog.debug.Logger.rootHandlers_[i++];) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.callPublish_ = function(logRecord) {
  if(this.handlers_) {
    for(var i = 0, handler;handler = this.handlers_[i];i++) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.setParent_ = function(parent) {
  this.parent_ = parent
};
goog.debug.Logger.prototype.addChild_ = function(name, logger) {
  this.getChildren()[name] = logger
};
goog.debug.LogManager = {};
goog.debug.LogManager.loggers_ = {};
goog.debug.LogManager.rootLogger_ = null;
goog.debug.LogManager.initialize = function() {
  if(!goog.debug.LogManager.rootLogger_) {
    goog.debug.LogManager.rootLogger_ = new goog.debug.Logger("");
    goog.debug.LogManager.loggers_[""] = goog.debug.LogManager.rootLogger_;
    goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG)
  }
};
goog.debug.LogManager.getLoggers = function() {
  return goog.debug.LogManager.loggers_
};
goog.debug.LogManager.getRoot = function() {
  goog.debug.LogManager.initialize();
  return goog.debug.LogManager.rootLogger_
};
goog.debug.LogManager.getLogger = function(name) {
  goog.debug.LogManager.initialize();
  var ret = goog.debug.LogManager.loggers_[name];
  return ret || goog.debug.LogManager.createLogger_(name)
};
goog.debug.LogManager.createFunctionForCatchErrors = function(opt_logger) {
  return function(info) {
    var logger = opt_logger || goog.debug.LogManager.getRoot();
    logger.severe("Error: " + info.message + " (" + info.fileName + " @ Line: " + info.line + ")")
  }
};
goog.debug.LogManager.createLogger_ = function(name) {
  var logger = new goog.debug.Logger(name);
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var lastDotIndex = name.lastIndexOf(".");
    var parentName = name.substr(0, lastDotIndex);
    var leafName = name.substr(lastDotIndex + 1);
    var parentLogger = goog.debug.LogManager.getLogger(parentName);
    parentLogger.addChild_(leafName, logger);
    logger.setParent_(parentLogger)
  }
  goog.debug.LogManager.loggers_[name] = logger;
  return logger
};
goog.provide("goog.json");
goog.provide("goog.json.Serializer");
goog.json.isValid_ = function(s) {
  if(/^\s*$/.test(s)) {
    return false
  }
  var backslashesRe = /\\["\\\/bfnrtu]/g;
  var simpleValuesRe = /"[^"\\\n\r\u2028\u2029\x00-\x08\x10-\x1f\x80-\x9f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
  var openBracketsRe = /(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g;
  var remainderRe = /^[\],:{}\s\u2028\u2029]*$/;
  return remainderRe.test(s.replace(backslashesRe, "@").replace(simpleValuesRe, "]").replace(openBracketsRe, ""))
};
goog.json.parse = function(s) {
  var o = String(s);
  if(goog.json.isValid_(o)) {
    try {
      return eval("(" + o + ")")
    }catch(ex) {
    }
  }
  throw Error("Invalid JSON string: " + o);
};
goog.json.unsafeParse = function(s) {
  return eval("(" + s + ")")
};
goog.json.serialize = function(object) {
  return(new goog.json.Serializer).serialize(object)
};
goog.json.Serializer = function() {
};
goog.json.Serializer.prototype.serialize = function(object) {
  var sb = [];
  this.serialize_(object, sb);
  return sb.join("")
};
goog.json.Serializer.prototype.serialize_ = function(object, sb) {
  switch(typeof object) {
    case "string":
      this.serializeString_(object, sb);
      break;
    case "number":
      this.serializeNumber_(object, sb);
      break;
    case "boolean":
      sb.push(object);
      break;
    case "undefined":
      sb.push("null");
      break;
    case "object":
      if(object == null) {
        sb.push("null");
        break
      }
      if(goog.isArray(object)) {
        this.serializeArray_(object, sb);
        break
      }
      this.serializeObject_(object, sb);
      break;
    case "function":
      break;
    default:
      throw Error("Unknown type: " + typeof object);
  }
};
goog.json.Serializer.charToJsonCharCache_ = {'"':'\\"', "\\":"\\\\", "/":"\\/", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\u000b":"\\u000b"};
goog.json.Serializer.charsToReplace_ = /\uffff/.test("\uffff") ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;
goog.json.Serializer.prototype.serializeString_ = function(s, sb) {
  sb.push('"', s.replace(goog.json.Serializer.charsToReplace_, function(c) {
    if(c in goog.json.Serializer.charToJsonCharCache_) {
      return goog.json.Serializer.charToJsonCharCache_[c]
    }
    var cc = c.charCodeAt(0);
    var rv = "\\u";
    if(cc < 16) {
      rv += "000"
    }else {
      if(cc < 256) {
        rv += "00"
      }else {
        if(cc < 4096) {
          rv += "0"
        }
      }
    }
    return goog.json.Serializer.charToJsonCharCache_[c] = rv + cc.toString(16)
  }), '"')
};
goog.json.Serializer.prototype.serializeNumber_ = function(n, sb) {
  sb.push(isFinite(n) && !isNaN(n) ? n : "null")
};
goog.json.Serializer.prototype.serializeArray_ = function(arr, sb) {
  var l = arr.length;
  sb.push("[");
  var sep = "";
  for(var i = 0;i < l;i++) {
    sb.push(sep);
    this.serialize_(arr[i], sb);
    sep = ","
  }
  sb.push("]")
};
goog.json.Serializer.prototype.serializeObject_ = function(obj, sb) {
  sb.push("{");
  var sep = "";
  for(var key in obj) {
    if(Object.prototype.hasOwnProperty.call(obj, key)) {
      var value = obj[key];
      if(typeof value != "function") {
        sb.push(sep);
        this.serializeString_(key, sb);
        sb.push(":");
        this.serialize_(value, sb);
        sep = ","
      }
    }
  }
  sb.push("}")
};
goog.provide("goog.net.ErrorCode");
goog.net.ErrorCode = {NO_ERROR:0, ACCESS_DENIED:1, FILE_NOT_FOUND:2, FF_SILENT_ERROR:3, CUSTOM_ERROR:4, EXCEPTION:5, HTTP_ERROR:6, ABORT:7, TIMEOUT:8, OFFLINE:9};
goog.net.ErrorCode.getDebugMessage = function(errorCode) {
  switch(errorCode) {
    case goog.net.ErrorCode.NO_ERROR:
      return"No Error";
    case goog.net.ErrorCode.ACCESS_DENIED:
      return"Access denied to content document";
    case goog.net.ErrorCode.FILE_NOT_FOUND:
      return"File not found";
    case goog.net.ErrorCode.FF_SILENT_ERROR:
      return"Firefox silently errored";
    case goog.net.ErrorCode.CUSTOM_ERROR:
      return"Application custom error";
    case goog.net.ErrorCode.EXCEPTION:
      return"An exception occurred";
    case goog.net.ErrorCode.HTTP_ERROR:
      return"Http response at 400 or 500 level";
    case goog.net.ErrorCode.ABORT:
      return"Request was aborted";
    case goog.net.ErrorCode.TIMEOUT:
      return"Request timed out";
    case goog.net.ErrorCode.OFFLINE:
      return"The resource is not available offline";
    default:
      return"Unrecognized error code"
  }
};
goog.provide("goog.net.EventType");
goog.net.EventType = {COMPLETE:"complete", SUCCESS:"success", ERROR:"error", ABORT:"abort", READY:"ready", READY_STATE_CHANGE:"readystatechange", TIMEOUT:"timeout", INCREMENTAL_DATA:"incrementaldata", PROGRESS:"progress"};
goog.provide("goog.net.HttpStatus");
goog.net.HttpStatus = {CONTINUE:100, SWITCHING_PROTOCOLS:101, OK:200, CREATED:201, ACCEPTED:202, NON_AUTHORITATIVE_INFORMATION:203, NO_CONTENT:204, RESET_CONTENT:205, PARTIAL_CONTENT:206, MULTIPLE_CHOICES:300, MOVED_PERMANENTLY:301, FOUND:302, SEE_OTHER:303, NOT_MODIFIED:304, USE_PROXY:305, TEMPORARY_REDIRECT:307, BAD_REQUEST:400, UNAUTHORIZED:401, PAYMENT_REQUIRED:402, FORBIDDEN:403, NOT_FOUND:404, METHOD_NOT_ALLOWED:405, NOT_ACCEPTABLE:406, PROXY_AUTHENTICATION_REQUIRED:407, REQUEST_TIMEOUT:408, 
CONFLICT:409, GONE:410, LENGTH_REQUIRED:411, PRECONDITION_FAILED:412, REQUEST_ENTITY_TOO_LARGE:413, REQUEST_URI_TOO_LONG:414, UNSUPPORTED_MEDIA_TYPE:415, REQUEST_RANGE_NOT_SATISFIABLE:416, EXPECTATION_FAILED:417, INTERNAL_SERVER_ERROR:500, NOT_IMPLEMENTED:501, BAD_GATEWAY:502, SERVICE_UNAVAILABLE:503, GATEWAY_TIMEOUT:504, HTTP_VERSION_NOT_SUPPORTED:505};
goog.provide("goog.net.XmlHttpFactory");
goog.net.XmlHttpFactory = function() {
};
goog.net.XmlHttpFactory.prototype.cachedOptions_ = null;
goog.net.XmlHttpFactory.prototype.createInstance = goog.abstractMethod;
goog.net.XmlHttpFactory.prototype.getOptions = function() {
  return this.cachedOptions_ || (this.cachedOptions_ = this.internalGetOptions())
};
goog.net.XmlHttpFactory.prototype.internalGetOptions = goog.abstractMethod;
goog.provide("goog.net.WrapperXmlHttpFactory");
goog.require("goog.net.XmlHttpFactory");
goog.net.WrapperXmlHttpFactory = function(xhrFactory, optionsFactory) {
  goog.net.XmlHttpFactory.call(this);
  this.xhrFactory_ = xhrFactory;
  this.optionsFactory_ = optionsFactory
};
goog.inherits(goog.net.WrapperXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.WrapperXmlHttpFactory.prototype.createInstance = function() {
  return this.xhrFactory_()
};
goog.net.WrapperXmlHttpFactory.prototype.getOptions = function() {
  return this.optionsFactory_()
};
goog.provide("goog.net.DefaultXmlHttpFactory");
goog.provide("goog.net.XmlHttp");
goog.provide("goog.net.XmlHttp.OptionType");
goog.provide("goog.net.XmlHttp.ReadyState");
goog.require("goog.net.WrapperXmlHttpFactory");
goog.require("goog.net.XmlHttpFactory");
goog.net.XmlHttp = function() {
  return goog.net.XmlHttp.factory_.createInstance()
};
goog.net.XmlHttp.getOptions = function() {
  return goog.net.XmlHttp.factory_.getOptions()
};
goog.net.XmlHttp.OptionType = {USE_NULL_FUNCTION:0, LOCAL_REQUEST_ERROR:1};
goog.net.XmlHttp.ReadyState = {UNINITIALIZED:0, LOADING:1, LOADED:2, INTERACTIVE:3, COMPLETE:4};
goog.net.XmlHttp.factory_;
goog.net.XmlHttp.setFactory = function(factory, optionsFactory) {
  goog.net.XmlHttp.setGlobalFactory(new goog.net.WrapperXmlHttpFactory(factory, optionsFactory))
};
goog.net.XmlHttp.setGlobalFactory = function(factory) {
  goog.net.XmlHttp.factory_ = factory
};
goog.net.DefaultXmlHttpFactory = function() {
  goog.net.XmlHttpFactory.call(this)
};
goog.inherits(goog.net.DefaultXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.DefaultXmlHttpFactory.prototype.createInstance = function() {
  var progId = this.getProgId_();
  if(progId) {
    return new ActiveXObject(progId)
  }else {
    return new XMLHttpRequest
  }
};
goog.net.DefaultXmlHttpFactory.prototype.internalGetOptions = function() {
  var progId = this.getProgId_();
  var options = {};
  if(progId) {
    options[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] = true;
    options[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] = true
  }
  return options
};
goog.net.DefaultXmlHttpFactory.prototype.ieProgId_ = null;
goog.net.DefaultXmlHttpFactory.prototype.getProgId_ = function() {
  if(!this.ieProgId_ && typeof XMLHttpRequest == "undefined" && typeof ActiveXObject != "undefined") {
    var ACTIVE_X_IDENTS = ["MSXML2.XMLHTTP.6.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];
    for(var i = 0;i < ACTIVE_X_IDENTS.length;i++) {
      var candidate = ACTIVE_X_IDENTS[i];
      try {
        new ActiveXObject(candidate);
        this.ieProgId_ = candidate;
        return candidate
      }catch(e) {
      }
    }
    throw Error("Could not create ActiveXObject. ActiveX might be disabled," + " or MSXML might not be installed");
  }
  return this.ieProgId_
};
goog.net.XmlHttp.setGlobalFactory(new goog.net.DefaultXmlHttpFactory);
goog.provide("goog.net.xhrMonitor");
goog.require("goog.array");
goog.require("goog.debug.Logger");
goog.require("goog.userAgent");
goog.net.XhrMonitor_ = function() {
  if(!goog.userAgent.GECKO) {
    return
  }
  this.contextsToXhr_ = {};
  this.xhrToContexts_ = {};
  this.stack_ = []
};
goog.net.XhrMonitor_.getKey = function(obj) {
  return goog.isString(obj) ? obj : goog.isObject(obj) ? goog.getUid(obj) : ""
};
goog.net.XhrMonitor_.prototype.logger_ = goog.debug.Logger.getLogger("goog.net.xhrMonitor");
goog.net.XhrMonitor_.prototype.enabled_ = goog.userAgent.GECKO;
goog.net.XhrMonitor_.prototype.setEnabled = function(val) {
  this.enabled_ = goog.userAgent.GECKO && val
};
goog.net.XhrMonitor_.prototype.pushContext = function(context) {
  if(!this.enabled_) {
    return
  }
  var key = goog.net.XhrMonitor_.getKey(context);
  this.logger_.finest("Pushing context: " + context + " (" + key + ")");
  this.stack_.push(key)
};
goog.net.XhrMonitor_.prototype.popContext = function() {
  if(!this.enabled_) {
    return
  }
  var context = this.stack_.pop();
  this.logger_.finest("Popping context: " + context);
  this.updateDependentContexts_(context)
};
goog.net.XhrMonitor_.prototype.isContextSafe = function(context) {
  if(!this.enabled_) {
    return true
  }
  var deps = this.contextsToXhr_[goog.net.XhrMonitor_.getKey(context)];
  this.logger_.fine("Context is safe : " + context + " - " + deps);
  return!deps
};
goog.net.XhrMonitor_.prototype.markXhrOpen = function(xhr) {
  if(!this.enabled_) {
    return
  }
  var uid = goog.getUid(xhr);
  this.logger_.fine("Opening XHR : " + uid);
  for(var i = 0;i < this.stack_.length;i++) {
    var context = this.stack_[i];
    this.addToMap_(this.contextsToXhr_, context, uid);
    this.addToMap_(this.xhrToContexts_, uid, context)
  }
};
goog.net.XhrMonitor_.prototype.markXhrClosed = function(xhr) {
  if(!this.enabled_) {
    return
  }
  var uid = goog.getUid(xhr);
  this.logger_.fine("Closing XHR : " + uid);
  delete this.xhrToContexts_[uid];
  for(var context in this.contextsToXhr_) {
    goog.array.remove(this.contextsToXhr_[context], uid);
    if(this.contextsToXhr_[context].length == 0) {
      delete this.contextsToXhr_[context]
    }
  }
};
goog.net.XhrMonitor_.prototype.updateDependentContexts_ = function(xhrUid) {
  var contexts = this.xhrToContexts_[xhrUid];
  var xhrs = this.contextsToXhr_[xhrUid];
  if(contexts && xhrs) {
    this.logger_.finest("Updating dependent contexts");
    goog.array.forEach(contexts, function(context) {
      goog.array.forEach(xhrs, function(xhr) {
        this.addToMap_(this.contextsToXhr_, context, xhr);
        this.addToMap_(this.xhrToContexts_, xhr, context)
      }, this)
    }, this)
  }
};
goog.net.XhrMonitor_.prototype.addToMap_ = function(map, key, value) {
  if(!map[key]) {
    map[key] = []
  }
  if(!goog.array.contains(map[key], value)) {
    map[key].push(value)
  }
};
goog.net.xhrMonitor = new goog.net.XhrMonitor_;
goog.provide("goog.uri.utils");
goog.provide("goog.uri.utils.ComponentIndex");
goog.require("goog.asserts");
goog.require("goog.string");
goog.uri.utils.CharCode_ = {AMPERSAND:38, EQUAL:61, HASH:35, QUESTION:63};
goog.uri.utils.buildFromEncodedParts = function(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_queryData, opt_fragment) {
  var out = [];
  if(opt_scheme) {
    out.push(opt_scheme, ":")
  }
  if(opt_domain) {
    out.push("//");
    if(opt_userInfo) {
      out.push(opt_userInfo, "@")
    }
    out.push(opt_domain);
    if(opt_port) {
      out.push(":", opt_port)
    }
  }
  if(opt_path) {
    out.push(opt_path)
  }
  if(opt_queryData) {
    out.push("?", opt_queryData)
  }
  if(opt_fragment) {
    out.push("#", opt_fragment)
  }
  return out.join("")
};
goog.uri.utils.splitRe_ = new RegExp("^" + "(?:" + "([^:/?#.]+)" + ":)?" + "(?://" + "(?:([^/?#]*)@)?" + "([\\w\\d\\-\\u0100-\\uffff.%]*)" + "(?::([0-9]+))?" + ")?" + "([^?#]+)?" + "(?:\\?([^#]*))?" + "(?:#(.*))?" + "$");
goog.uri.utils.ComponentIndex = {SCHEME:1, USER_INFO:2, DOMAIN:3, PORT:4, PATH:5, QUERY_DATA:6, FRAGMENT:7};
goog.uri.utils.split = function(uri) {
  return uri.match(goog.uri.utils.splitRe_)
};
goog.uri.utils.decodeIfPossible_ = function(uri) {
  return uri && decodeURIComponent(uri)
};
goog.uri.utils.getComponentByIndex_ = function(componentIndex, uri) {
  return goog.uri.utils.split(uri)[componentIndex] || null
};
goog.uri.utils.getScheme = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.SCHEME, uri)
};
goog.uri.utils.getUserInfoEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.USER_INFO, uri)
};
goog.uri.utils.getUserInfo = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getUserInfoEncoded(uri))
};
goog.uri.utils.getDomainEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.DOMAIN, uri)
};
goog.uri.utils.getDomain = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getDomainEncoded(uri))
};
goog.uri.utils.getPort = function(uri) {
  return Number(goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PORT, uri)) || null
};
goog.uri.utils.getPathEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PATH, uri)
};
goog.uri.utils.getPath = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getPathEncoded(uri))
};
goog.uri.utils.getQueryData = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.QUERY_DATA, uri)
};
goog.uri.utils.getFragmentEncoded = function(uri) {
  var hashIndex = uri.indexOf("#");
  return hashIndex < 0 ? null : uri.substr(hashIndex + 1)
};
goog.uri.utils.setFragmentEncoded = function(uri, fragment) {
  return goog.uri.utils.removeFragment(uri) + (fragment ? "#" + fragment : "")
};
goog.uri.utils.getFragment = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getFragmentEncoded(uri))
};
goog.uri.utils.getHost = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(pieces[goog.uri.utils.ComponentIndex.SCHEME], pieces[goog.uri.utils.ComponentIndex.USER_INFO], pieces[goog.uri.utils.ComponentIndex.DOMAIN], pieces[goog.uri.utils.ComponentIndex.PORT])
};
goog.uri.utils.getPathAndAfter = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(null, null, null, null, pieces[goog.uri.utils.ComponentIndex.PATH], pieces[goog.uri.utils.ComponentIndex.QUERY_DATA], pieces[goog.uri.utils.ComponentIndex.FRAGMENT])
};
goog.uri.utils.removeFragment = function(uri) {
  var hashIndex = uri.indexOf("#");
  return hashIndex < 0 ? uri : uri.substr(0, hashIndex)
};
goog.uri.utils.haveSameDomain = function(uri1, uri2) {
  var pieces1 = goog.uri.utils.split(uri1);
  var pieces2 = goog.uri.utils.split(uri2);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.SCHEME] == pieces2[goog.uri.utils.ComponentIndex.SCHEME] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT]
};
goog.uri.utils.assertNoFragmentsOrQueries_ = function(uri) {
  if(goog.DEBUG && (uri.indexOf("#") >= 0 || uri.indexOf("?") >= 0)) {
    throw Error("goog.uri.utils: Fragment or query identifiers are not " + "supported: [" + uri + "]");
  }
};
goog.uri.utils.QueryValue;
goog.uri.utils.QueryArray;
goog.uri.utils.appendQueryData_ = function(buffer) {
  if(buffer[1]) {
    var baseUri = buffer[0];
    var hashIndex = baseUri.indexOf("#");
    if(hashIndex >= 0) {
      buffer.push(baseUri.substr(hashIndex));
      buffer[0] = baseUri = baseUri.substr(0, hashIndex)
    }
    var questionIndex = baseUri.indexOf("?");
    if(questionIndex < 0) {
      buffer[1] = "?"
    }else {
      if(questionIndex == baseUri.length - 1) {
        buffer[1] = undefined
      }
    }
  }
  return buffer.join("")
};
goog.uri.utils.appendKeyValuePairs_ = function(key, value, pairs) {
  if(goog.isArray(value)) {
    value = value;
    for(var j = 0;j < value.length;j++) {
      pairs.push("&", key);
      if(value[j] !== "") {
        pairs.push("=", goog.string.urlEncode(value[j]))
      }
    }
  }else {
    if(value != null) {
      pairs.push("&", key);
      if(value !== "") {
        pairs.push("=", goog.string.urlEncode(value))
      }
    }
  }
};
goog.uri.utils.buildQueryDataBuffer_ = function(buffer, keysAndValues, opt_startIndex) {
  goog.asserts.assert(Math.max(keysAndValues.length - (opt_startIndex || 0), 0) % 2 == 0, "goog.uri.utils: Key/value lists must be even in length.");
  for(var i = opt_startIndex || 0;i < keysAndValues.length;i += 2) {
    goog.uri.utils.appendKeyValuePairs_(keysAndValues[i], keysAndValues[i + 1], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryData = function(keysAndValues, opt_startIndex) {
  var buffer = goog.uri.utils.buildQueryDataBuffer_([], keysAndValues, opt_startIndex);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.buildQueryDataBufferFromMap_ = function(buffer, map) {
  for(var key in map) {
    goog.uri.utils.appendKeyValuePairs_(key, map[key], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryDataFromMap = function(map) {
  var buffer = goog.uri.utils.buildQueryDataBufferFromMap_([], map);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.appendParams = function(uri, var_args) {
  return goog.uri.utils.appendQueryData_(arguments.length == 2 ? goog.uri.utils.buildQueryDataBuffer_([uri], arguments[1], 0) : goog.uri.utils.buildQueryDataBuffer_([uri], arguments, 1))
};
goog.uri.utils.appendParamsFromMap = function(uri, map) {
  return goog.uri.utils.appendQueryData_(goog.uri.utils.buildQueryDataBufferFromMap_([uri], map))
};
goog.uri.utils.appendParam = function(uri, key, value) {
  return goog.uri.utils.appendQueryData_([uri, "&", key, "=", goog.string.urlEncode(value)])
};
goog.uri.utils.findParam_ = function(uri, startIndex, keyEncoded, hashOrEndIndex) {
  var index = startIndex;
  var keyLength = keyEncoded.length;
  while((index = uri.indexOf(keyEncoded, index)) >= 0 && index < hashOrEndIndex) {
    var precedingChar = uri.charCodeAt(index - 1);
    if(precedingChar == goog.uri.utils.CharCode_.AMPERSAND || precedingChar == goog.uri.utils.CharCode_.QUESTION) {
      var followingChar = uri.charCodeAt(index + keyLength);
      if(!followingChar || followingChar == goog.uri.utils.CharCode_.EQUAL || followingChar == goog.uri.utils.CharCode_.AMPERSAND || followingChar == goog.uri.utils.CharCode_.HASH) {
        return index
      }
    }
    index += keyLength + 1
  }
  return-1
};
goog.uri.utils.hashOrEndRe_ = /#|$/;
goog.uri.utils.hasParam = function(uri, keyEncoded) {
  return goog.uri.utils.findParam_(uri, 0, keyEncoded, uri.search(goog.uri.utils.hashOrEndRe_)) >= 0
};
goog.uri.utils.getParamValue = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var foundIndex = goog.uri.utils.findParam_(uri, 0, keyEncoded, hashOrEndIndex);
  if(foundIndex < 0) {
    return null
  }else {
    var endPosition = uri.indexOf("&", foundIndex);
    if(endPosition < 0 || endPosition > hashOrEndIndex) {
      endPosition = hashOrEndIndex
    }
    foundIndex += keyEncoded.length + 1;
    return goog.string.urlDecode(uri.substr(foundIndex, endPosition - foundIndex))
  }
};
goog.uri.utils.getParamValues = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var result = [];
  while((foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    position = uri.indexOf("&", foundIndex);
    if(position < 0 || position > hashOrEndIndex) {
      position = hashOrEndIndex
    }
    foundIndex += keyEncoded.length + 1;
    result.push(goog.string.urlDecode(uri.substr(foundIndex, position - foundIndex)))
  }
  return result
};
goog.uri.utils.trailingQueryPunctuationRe_ = /[?&]($|#)/;
goog.uri.utils.removeParam = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var buffer = [];
  while((foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    buffer.push(uri.substring(position, foundIndex));
    position = Math.min(uri.indexOf("&", foundIndex) + 1 || hashOrEndIndex, hashOrEndIndex)
  }
  buffer.push(uri.substr(position));
  return buffer.join("").replace(goog.uri.utils.trailingQueryPunctuationRe_, "$1")
};
goog.uri.utils.setParam = function(uri, keyEncoded, value) {
  return goog.uri.utils.appendParam(goog.uri.utils.removeParam(uri, keyEncoded), keyEncoded, value)
};
goog.uri.utils.appendPath = function(baseUri, path) {
  goog.uri.utils.assertNoFragmentsOrQueries_(baseUri);
  if(goog.string.endsWith(baseUri, "/")) {
    baseUri = baseUri.substr(0, baseUri.length - 1)
  }
  if(goog.string.startsWith(path, "/")) {
    path = path.substr(1)
  }
  return goog.string.buildString(baseUri, "/", path)
};
goog.uri.utils.StandardQueryParam = {RANDOM:"zx"};
goog.uri.utils.makeUnique = function(uri) {
  return goog.uri.utils.setParam(uri, goog.uri.utils.StandardQueryParam.RANDOM, goog.string.getRandomString())
};
goog.provide("goog.net.XhrIo");
goog.provide("goog.net.XhrIo.ResponseType");
goog.require("goog.Timer");
goog.require("goog.debug.Logger");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.EventTarget");
goog.require("goog.json");
goog.require("goog.net.ErrorCode");
goog.require("goog.net.EventType");
goog.require("goog.net.HttpStatus");
goog.require("goog.net.XmlHttp");
goog.require("goog.net.xhrMonitor");
goog.require("goog.object");
goog.require("goog.structs");
goog.require("goog.structs.Map");
goog.require("goog.uri.utils");
goog.net.XhrIo = function(opt_xmlHttpFactory) {
  goog.events.EventTarget.call(this);
  this.headers = new goog.structs.Map;
  this.xmlHttpFactory_ = opt_xmlHttpFactory || null
};
goog.inherits(goog.net.XhrIo, goog.events.EventTarget);
goog.net.XhrIo.ResponseType = {DEFAULT:"", TEXT:"text", DOCUMENT:"document", BLOB:"blob", ARRAY_BUFFER:"arraybuffer"};
goog.net.XhrIo.prototype.logger_ = goog.debug.Logger.getLogger("goog.net.XhrIo");
goog.net.XhrIo.CONTENT_TYPE_HEADER = "Content-Type";
goog.net.XhrIo.HTTP_SCHEME_PATTERN = /^https?:?$/i;
goog.net.XhrIo.FORM_CONTENT_TYPE = "application/x-www-form-urlencoded;charset=utf-8";
goog.net.XhrIo.sendInstances_ = [];
goog.net.XhrIo.send = function(url, opt_callback, opt_method, opt_content, opt_headers, opt_timeoutInterval) {
  var x = new goog.net.XhrIo;
  goog.net.XhrIo.sendInstances_.push(x);
  if(opt_callback) {
    goog.events.listen(x, goog.net.EventType.COMPLETE, opt_callback)
  }
  goog.events.listen(x, goog.net.EventType.READY, goog.partial(goog.net.XhrIo.cleanupSend_, x));
  if(opt_timeoutInterval) {
    x.setTimeoutInterval(opt_timeoutInterval)
  }
  x.send(url, opt_method, opt_content, opt_headers)
};
goog.net.XhrIo.cleanup = function() {
  var instances = goog.net.XhrIo.sendInstances_;
  while(instances.length) {
    instances.pop().dispose()
  }
};
goog.net.XhrIo.protectEntryPoints = function(errorHandler) {
  goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = errorHandler.protectEntryPoint(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_)
};
goog.net.XhrIo.cleanupSend_ = function(XhrIo) {
  XhrIo.dispose();
  goog.array.remove(goog.net.XhrIo.sendInstances_, XhrIo)
};
goog.net.XhrIo.prototype.active_ = false;
goog.net.XhrIo.prototype.xhr_ = null;
goog.net.XhrIo.prototype.xhrOptions_ = null;
goog.net.XhrIo.prototype.lastUri_ = "";
goog.net.XhrIo.prototype.lastMethod_ = "";
goog.net.XhrIo.prototype.lastErrorCode_ = goog.net.ErrorCode.NO_ERROR;
goog.net.XhrIo.prototype.lastError_ = "";
goog.net.XhrIo.prototype.errorDispatched_ = false;
goog.net.XhrIo.prototype.inSend_ = false;
goog.net.XhrIo.prototype.inOpen_ = false;
goog.net.XhrIo.prototype.inAbort_ = false;
goog.net.XhrIo.prototype.timeoutInterval_ = 0;
goog.net.XhrIo.prototype.timeoutId_ = null;
goog.net.XhrIo.prototype.responseType_ = goog.net.XhrIo.ResponseType.DEFAULT;
goog.net.XhrIo.prototype.withCredentials_ = false;
goog.net.XhrIo.prototype.getTimeoutInterval = function() {
  return this.timeoutInterval_
};
goog.net.XhrIo.prototype.setTimeoutInterval = function(ms) {
  this.timeoutInterval_ = Math.max(0, ms)
};
goog.net.XhrIo.prototype.setResponseType = function(type) {
  this.responseType_ = type
};
goog.net.XhrIo.prototype.getResponseType = function() {
  return this.responseType_
};
goog.net.XhrIo.prototype.setWithCredentials = function(withCredentials) {
  this.withCredentials_ = withCredentials
};
goog.net.XhrIo.prototype.getWithCredentials = function() {
  return this.withCredentials_
};
goog.net.XhrIo.prototype.send = function(url, opt_method, opt_content, opt_headers) {
  if(this.xhr_) {
    throw Error("[goog.net.XhrIo] Object is active with another request");
  }
  var method = opt_method || "GET";
  this.lastUri_ = url;
  this.lastError_ = "";
  this.lastErrorCode_ = goog.net.ErrorCode.NO_ERROR;
  this.lastMethod_ = method;
  this.errorDispatched_ = false;
  this.active_ = true;
  this.xhr_ = this.createXhr();
  this.xhrOptions_ = this.xmlHttpFactory_ ? this.xmlHttpFactory_.getOptions() : goog.net.XmlHttp.getOptions();
  goog.net.xhrMonitor.markXhrOpen(this.xhr_);
  this.xhr_.onreadystatechange = goog.bind(this.onReadyStateChange_, this);
  try {
    this.logger_.fine(this.formatMsg_("Opening Xhr"));
    this.inOpen_ = true;
    this.xhr_.open(method, url, true);
    this.inOpen_ = false
  }catch(err) {
    this.logger_.fine(this.formatMsg_("Error opening Xhr: " + err.message));
    this.error_(goog.net.ErrorCode.EXCEPTION, err);
    return
  }
  var content = opt_content || "";
  var headers = this.headers.clone();
  if(opt_headers) {
    goog.structs.forEach(opt_headers, function(value, key) {
      headers.set(key, value)
    })
  }
  if(method == "POST" && !headers.containsKey(goog.net.XhrIo.CONTENT_TYPE_HEADER)) {
    headers.set(goog.net.XhrIo.CONTENT_TYPE_HEADER, goog.net.XhrIo.FORM_CONTENT_TYPE)
  }
  goog.structs.forEach(headers, function(value, key) {
    this.xhr_.setRequestHeader(key, value)
  }, this);
  if(this.responseType_) {
    this.xhr_.responseType = this.responseType_
  }
  if(goog.object.containsKey(this.xhr_, "withCredentials")) {
    this.xhr_.withCredentials = this.withCredentials_
  }
  try {
    if(this.timeoutId_) {
      goog.Timer.defaultTimerObject.clearTimeout(this.timeoutId_);
      this.timeoutId_ = null
    }
    if(this.timeoutInterval_ > 0) {
      this.logger_.fine(this.formatMsg_("Will abort after " + this.timeoutInterval_ + "ms if incomplete"));
      this.timeoutId_ = goog.Timer.defaultTimerObject.setTimeout(goog.bind(this.timeout_, this), this.timeoutInterval_)
    }
    this.logger_.fine(this.formatMsg_("Sending request"));
    this.inSend_ = true;
    this.xhr_.send(content);
    this.inSend_ = false
  }catch(err) {
    this.logger_.fine(this.formatMsg_("Send error: " + err.message));
    this.error_(goog.net.ErrorCode.EXCEPTION, err)
  }
};
goog.net.XhrIo.prototype.createXhr = function() {
  return this.xmlHttpFactory_ ? this.xmlHttpFactory_.createInstance() : new goog.net.XmlHttp
};
goog.net.XhrIo.prototype.dispatchEvent = function(e) {
  if(this.xhr_) {
    goog.net.xhrMonitor.pushContext(this.xhr_);
    try {
      return goog.net.XhrIo.superClass_.dispatchEvent.call(this, e)
    }finally {
      goog.net.xhrMonitor.popContext()
    }
  }else {
    return goog.net.XhrIo.superClass_.dispatchEvent.call(this, e)
  }
};
goog.net.XhrIo.prototype.timeout_ = function() {
  if(typeof goog == "undefined") {
  }else {
    if(this.xhr_) {
      this.lastError_ = "Timed out after " + this.timeoutInterval_ + "ms, aborting";
      this.lastErrorCode_ = goog.net.ErrorCode.TIMEOUT;
      this.logger_.fine(this.formatMsg_(this.lastError_));
      this.dispatchEvent(goog.net.EventType.TIMEOUT);
      this.abort(goog.net.ErrorCode.TIMEOUT)
    }
  }
};
goog.net.XhrIo.prototype.error_ = function(errorCode, err) {
  this.active_ = false;
  if(this.xhr_) {
    this.inAbort_ = true;
    this.xhr_.abort();
    this.inAbort_ = false
  }
  this.lastError_ = err;
  this.lastErrorCode_ = errorCode;
  this.dispatchErrors_();
  this.cleanUpXhr_()
};
goog.net.XhrIo.prototype.dispatchErrors_ = function() {
  if(!this.errorDispatched_) {
    this.errorDispatched_ = true;
    this.dispatchEvent(goog.net.EventType.COMPLETE);
    this.dispatchEvent(goog.net.EventType.ERROR)
  }
};
goog.net.XhrIo.prototype.abort = function(opt_failureCode) {
  if(this.xhr_ && this.active_) {
    this.logger_.fine(this.formatMsg_("Aborting"));
    this.active_ = false;
    this.inAbort_ = true;
    this.xhr_.abort();
    this.inAbort_ = false;
    this.lastErrorCode_ = opt_failureCode || goog.net.ErrorCode.ABORT;
    this.dispatchEvent(goog.net.EventType.COMPLETE);
    this.dispatchEvent(goog.net.EventType.ABORT);
    this.cleanUpXhr_()
  }
};
goog.net.XhrIo.prototype.disposeInternal = function() {
  if(this.xhr_) {
    if(this.active_) {
      this.active_ = false;
      this.inAbort_ = true;
      this.xhr_.abort();
      this.inAbort_ = false
    }
    this.cleanUpXhr_(true)
  }
  goog.net.XhrIo.superClass_.disposeInternal.call(this)
};
goog.net.XhrIo.prototype.onReadyStateChange_ = function() {
  if(!this.inOpen_ && !this.inSend_ && !this.inAbort_) {
    this.onReadyStateChangeEntryPoint_()
  }else {
    this.onReadyStateChangeHelper_()
  }
};
goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = function() {
  this.onReadyStateChangeHelper_()
};
goog.net.XhrIo.prototype.onReadyStateChangeHelper_ = function() {
  if(!this.active_) {
    return
  }
  if(typeof goog == "undefined") {
  }else {
    if(this.xhrOptions_[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE && this.getStatus() == 2) {
      this.logger_.fine(this.formatMsg_("Local request error detected and ignored"))
    }else {
      if(this.inSend_ && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE) {
        goog.Timer.defaultTimerObject.setTimeout(goog.bind(this.onReadyStateChange_, this), 0);
        return
      }
      this.dispatchEvent(goog.net.EventType.READY_STATE_CHANGE);
      if(this.isComplete()) {
        this.logger_.fine(this.formatMsg_("Request complete"));
        this.active_ = false;
        if(this.isSuccess()) {
          this.dispatchEvent(goog.net.EventType.COMPLETE);
          this.dispatchEvent(goog.net.EventType.SUCCESS)
        }else {
          this.lastErrorCode_ = goog.net.ErrorCode.HTTP_ERROR;
          this.lastError_ = this.getStatusText() + " [" + this.getStatus() + "]";
          this.dispatchErrors_()
        }
        this.cleanUpXhr_()
      }
    }
  }
};
goog.net.XhrIo.prototype.cleanUpXhr_ = function(opt_fromDispose) {
  if(this.xhr_) {
    var xhr = this.xhr_;
    var clearedOnReadyStateChange = this.xhrOptions_[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] ? goog.nullFunction : null;
    this.xhr_ = null;
    this.xhrOptions_ = null;
    if(this.timeoutId_) {
      goog.Timer.defaultTimerObject.clearTimeout(this.timeoutId_);
      this.timeoutId_ = null
    }
    if(!opt_fromDispose) {
      goog.net.xhrMonitor.pushContext(xhr);
      this.dispatchEvent(goog.net.EventType.READY);
      goog.net.xhrMonitor.popContext()
    }
    goog.net.xhrMonitor.markXhrClosed(xhr);
    try {
      xhr.onreadystatechange = clearedOnReadyStateChange
    }catch(e) {
      this.logger_.severe("Problem encountered resetting onreadystatechange: " + e.message)
    }
  }
};
goog.net.XhrIo.prototype.isActive = function() {
  return!!this.xhr_
};
goog.net.XhrIo.prototype.isComplete = function() {
  return this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE
};
goog.net.XhrIo.prototype.isSuccess = function() {
  switch(this.getStatus()) {
    case 0:
      return!this.isLastUriEffectiveSchemeHttp_();
    case goog.net.HttpStatus.OK:
    ;
    case goog.net.HttpStatus.NO_CONTENT:
    ;
    case goog.net.HttpStatus.NOT_MODIFIED:
      return true;
    default:
      return false
  }
};
goog.net.XhrIo.prototype.isLastUriEffectiveSchemeHttp_ = function() {
  var lastUriScheme = goog.isString(this.lastUri_) ? goog.uri.utils.getScheme(this.lastUri_) : this.lastUri_.getScheme();
  if(lastUriScheme) {
    return goog.net.XhrIo.HTTP_SCHEME_PATTERN.test(lastUriScheme)
  }
  if(self.location) {
    return goog.net.XhrIo.HTTP_SCHEME_PATTERN.test(self.location.protocol)
  }else {
    return true
  }
};
goog.net.XhrIo.prototype.getReadyState = function() {
  return this.xhr_ ? this.xhr_.readyState : goog.net.XmlHttp.ReadyState.UNINITIALIZED
};
goog.net.XhrIo.prototype.getStatus = function() {
  try {
    return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.status : -1
  }catch(e) {
    this.logger_.warning("Can not get status: " + e.message);
    return-1
  }
};
goog.net.XhrIo.prototype.getStatusText = function() {
  try {
    return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.statusText : ""
  }catch(e) {
    this.logger_.fine("Can not get status: " + e.message);
    return""
  }
};
goog.net.XhrIo.prototype.getLastUri = function() {
  return String(this.lastUri_)
};
goog.net.XhrIo.prototype.getResponseText = function() {
  try {
    return this.xhr_ ? this.xhr_.responseText : ""
  }catch(e) {
    this.logger_.fine("Can not get responseText: " + e.message);
    return""
  }
};
goog.net.XhrIo.prototype.getResponseXml = function() {
  try {
    return this.xhr_ ? this.xhr_.responseXML : null
  }catch(e) {
    this.logger_.fine("Can not get responseXML: " + e.message);
    return null
  }
};
goog.net.XhrIo.prototype.getResponseJson = function(opt_xssiPrefix) {
  if(!this.xhr_) {
    return undefined
  }
  var responseText = this.xhr_.responseText;
  if(opt_xssiPrefix && responseText.indexOf(opt_xssiPrefix) == 0) {
    responseText = responseText.substring(opt_xssiPrefix.length)
  }
  return goog.json.parse(responseText)
};
goog.net.XhrIo.prototype.getResponse = function() {
  try {
    return this.xhr_ && this.xhr_.response
  }catch(e) {
    this.logger_.fine("Can not get response: " + e.message);
    return null
  }
};
goog.net.XhrIo.prototype.getResponseHeader = function(key) {
  return this.xhr_ && this.isComplete() ? this.xhr_.getResponseHeader(key) : undefined
};
goog.net.XhrIo.prototype.getAllResponseHeaders = function() {
  return this.xhr_ && this.isComplete() ? this.xhr_.getAllResponseHeaders() : ""
};
goog.net.XhrIo.prototype.getLastErrorCode = function() {
  return this.lastErrorCode_
};
goog.net.XhrIo.prototype.getLastError = function() {
  return goog.isString(this.lastError_) ? this.lastError_ : String(this.lastError_)
};
goog.net.XhrIo.prototype.formatMsg_ = function(msg) {
  return msg + " [" + this.lastMethod_ + " " + this.lastUri_ + " " + this.getStatus() + "]"
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = transformer(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_)
});
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("goog.fx.Animation");
goog.provide("goog.fx.Animation.EventType");
goog.provide("goog.fx.Animation.State");
goog.provide("goog.fx.AnimationEvent");
goog.require("goog.Timer");
goog.require("goog.array");
goog.require("goog.events.Event");
goog.require("goog.events.EventTarget");
goog.require("goog.object");
goog.fx.Animation = function(start, end, duration, opt_acc) {
  goog.events.EventTarget.call(this);
  if(!goog.isArray(start) || !goog.isArray(end)) {
    throw Error("Start and end parameters must be arrays");
  }
  if(start.length != end.length) {
    throw Error("Start and end points must be the same length");
  }
  this.startPoint = start;
  this.endPoint = end;
  this.duration = duration;
  this.accel_ = opt_acc;
  this.coords = []
};
goog.inherits(goog.fx.Animation, goog.events.EventTarget);
goog.fx.Animation.EventType = {PLAY:"play", BEGIN:"begin", RESUME:"resume", END:"end", STOP:"stop", FINISH:"finish", PAUSE:"pause", ANIMATE:"animate", DESTROY:"destroy"};
goog.fx.Animation.State = {STOPPED:0, PAUSED:-1, PLAYING:1};
goog.fx.Animation.TIMEOUT = 20;
goog.fx.Animation.activeAnimations_ = {};
goog.fx.Animation.globalTimer_ = null;
goog.fx.Animation.cycleAnimations_ = function() {
  goog.Timer.defaultTimerObject.clearTimeout(goog.fx.Animation.globalTimer_);
  var now = goog.now();
  for(var uid in goog.fx.Animation.activeAnimations_) {
    goog.fx.Animation.activeAnimations_[uid].cycle(now)
  }
  goog.fx.Animation.globalTimer_ = goog.object.isEmpty(goog.fx.Animation.activeAnimations_) ? null : goog.Timer.defaultTimerObject.setTimeout(goog.fx.Animation.cycleAnimations_, goog.fx.Animation.TIMEOUT)
};
goog.fx.Animation.registerAnimation = function(animation) {
  var uid = goog.getUid(animation);
  if(!(uid in goog.fx.Animation.activeAnimations_)) {
    goog.fx.Animation.activeAnimations_[uid] = animation
  }
  if(!goog.fx.Animation.globalTimer_) {
    goog.fx.Animation.globalTimer_ = goog.Timer.defaultTimerObject.setTimeout(goog.fx.Animation.cycleAnimations_, goog.fx.Animation.TIMEOUT)
  }
};
goog.fx.Animation.unregisterAnimation = function(animation) {
  var uid = goog.getUid(animation);
  delete goog.fx.Animation.activeAnimations_[uid];
  if(goog.fx.Animation.globalTimer_ && goog.object.isEmpty(goog.fx.Animation.activeAnimations_)) {
    goog.Timer.defaultTimerObject.clearTimeout(goog.fx.Animation.globalTimer_);
    goog.fx.Animation.globalTimer_ = null
  }
};
goog.fx.Animation.prototype.state_ = goog.fx.Animation.State.STOPPED;
goog.fx.Animation.prototype.fps_ = 0;
goog.fx.Animation.prototype.progress = 0;
goog.fx.Animation.prototype.startTime = null;
goog.fx.Animation.prototype.endTime = null;
goog.fx.Animation.prototype.lastFrame = null;
goog.fx.Animation.prototype.getStateInternal = function() {
  return this.state_
};
goog.fx.Animation.prototype.play = function(opt_restart) {
  if(opt_restart || this.state_ == goog.fx.Animation.State.STOPPED) {
    this.progress = 0;
    this.coords = this.startPoint
  }else {
    if(this.state_ == goog.fx.Animation.State.PLAYING) {
      return false
    }
  }
  goog.fx.Animation.unregisterAnimation(this);
  this.startTime = goog.now();
  if(this.state_ == goog.fx.Animation.State.PAUSED) {
    this.startTime -= this.duration * this.progress
  }
  this.endTime = this.startTime + this.duration;
  this.lastFrame = this.startTime;
  if(!this.progress) {
    this.onBegin()
  }
  this.onPlay();
  if(this.state_ == goog.fx.Animation.State.PAUSED) {
    this.onResume()
  }
  this.state_ = goog.fx.Animation.State.PLAYING;
  goog.fx.Animation.registerAnimation(this);
  this.cycle(this.startTime);
  return true
};
goog.fx.Animation.prototype.stop = function(gotoEnd) {
  goog.fx.Animation.unregisterAnimation(this);
  this.state_ = goog.fx.Animation.State.STOPPED;
  if(gotoEnd) {
    this.progress = 1
  }
  this.updateCoords_(this.progress);
  this.onStop();
  this.onEnd()
};
goog.fx.Animation.prototype.pause = function() {
  if(this.state_ == goog.fx.Animation.State.PLAYING) {
    goog.fx.Animation.unregisterAnimation(this);
    this.state_ = goog.fx.Animation.State.PAUSED;
    this.onPause()
  }
};
goog.fx.Animation.prototype.disposeInternal = function() {
  if(this.state_ != goog.fx.Animation.State.STOPPED) {
    this.stop(false)
  }
  this.onDestroy();
  goog.fx.Animation.superClass_.disposeInternal.call(this)
};
goog.fx.Animation.prototype.destroy = function() {
  this.dispose()
};
goog.fx.Animation.prototype.cycle = function(now) {
  this.progress = (now - this.startTime) / (this.endTime - this.startTime);
  if(this.progress >= 1) {
    this.progress = 1
  }
  this.fps_ = 1E3 / (now - this.lastFrame);
  this.lastFrame = now;
  if(goog.isFunction(this.accel_)) {
    this.updateCoords_(this.accel_(this.progress))
  }else {
    this.updateCoords_(this.progress)
  }
  if(this.progress == 1) {
    this.state_ = goog.fx.Animation.State.STOPPED;
    goog.fx.Animation.unregisterAnimation(this);
    this.onFinish();
    this.onEnd()
  }else {
    if(this.state_ == goog.fx.Animation.State.PLAYING) {
      this.onAnimate()
    }
  }
};
goog.fx.Animation.prototype.updateCoords_ = function(t) {
  this.coords = new Array(this.startPoint.length);
  for(var i = 0;i < this.startPoint.length;i++) {
    this.coords[i] = (this.endPoint[i] - this.startPoint[i]) * t + this.startPoint[i]
  }
};
goog.fx.Animation.prototype.onAnimate = function() {
  this.dispatchAnimationEvent_(goog.fx.Animation.EventType.ANIMATE)
};
goog.fx.Animation.prototype.onBegin = function() {
  this.dispatchAnimationEvent_(goog.fx.Animation.EventType.BEGIN)
};
goog.fx.Animation.prototype.onDestroy = function() {
  this.dispatchAnimationEvent_(goog.fx.Animation.EventType.DESTROY)
};
goog.fx.Animation.prototype.onEnd = function() {
  this.dispatchAnimationEvent_(goog.fx.Animation.EventType.END)
};
goog.fx.Animation.prototype.onFinish = function() {
  this.dispatchAnimationEvent_(goog.fx.Animation.EventType.FINISH)
};
goog.fx.Animation.prototype.onPause = function() {
  this.dispatchAnimationEvent_(goog.fx.Animation.EventType.PAUSE)
};
goog.fx.Animation.prototype.onPlay = function() {
  this.dispatchAnimationEvent_(goog.fx.Animation.EventType.PLAY)
};
goog.fx.Animation.prototype.onResume = function() {
  this.dispatchAnimationEvent_(goog.fx.Animation.EventType.RESUME)
};
goog.fx.Animation.prototype.onStop = function() {
  this.dispatchAnimationEvent_(goog.fx.Animation.EventType.STOP)
};
goog.fx.Animation.prototype.dispatchAnimationEvent_ = function(type) {
  this.dispatchEvent(new goog.fx.AnimationEvent(type, this))
};
goog.fx.AnimationEvent = function(type, anim) {
  goog.events.Event.call(this, type);
  this.coords = anim.coords;
  this.x = anim.coords[0];
  this.y = anim.coords[1];
  this.z = anim.coords[2];
  this.duration = anim.duration;
  this.progress = anim.progress;
  this.fps = anim.fps_;
  this.state = anim.state_;
  this.anim = anim
};
goog.inherits(goog.fx.AnimationEvent, goog.events.Event);
goog.fx.AnimationEvent.prototype.coordsAsInts = function() {
  return goog.array.map(this.coords, Math.round)
};
goog.provide("goog.fx.easing");
goog.fx.easing.easeIn = function(t) {
  return t * t * t
};
goog.fx.easing.easeOut = function(t) {
  return 1 - Math.pow(1 - t, 3)
};
goog.fx.easing.inAndOut = function(t) {
  return 3 * t * t - 2 * t * t * t
};
goog.provide("goog.fx");
goog.require("goog.asserts");
goog.require("goog.fx.Animation");
goog.require("goog.fx.Animation.EventType");
goog.require("goog.fx.Animation.State");
goog.require("goog.fx.AnimationEvent");
goog.require("goog.fx.easing");
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isVersion("9"), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isVersion("9") || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            element[key] = val
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc;
  if(goog.userAgent.WEBKIT) {
    doc = frame.document || frame.contentWindow.document
  }else {
    doc = frame.contentDocument || frame.contentWindow.document
  }
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    for(var i = 0, child;child = root.childNodes[i];i++) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.userAgent.IE) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("goog.dom.ViewportSizeMonitor");
goog.require("goog.dom");
goog.require("goog.events");
goog.require("goog.events.EventTarget");
goog.require("goog.events.EventType");
goog.require("goog.math.Size");
goog.require("goog.userAgent");
goog.dom.ViewportSizeMonitor = function(opt_window) {
  goog.events.EventTarget.call(this);
  this.window_ = opt_window || window;
  this.listenerKey_ = goog.events.listen(this.window_, goog.events.EventType.RESIZE, this.handleResize_, false, this);
  this.size_ = goog.dom.getViewportSize(this.window_);
  if(this.isPollingRequired_()) {
    this.windowSizePollInterval_ = window.setInterval(goog.bind(this.checkForSizeChange_, this), goog.dom.ViewportSizeMonitor.WINDOW_SIZE_POLL_RATE)
  }
};
goog.inherits(goog.dom.ViewportSizeMonitor, goog.events.EventTarget);
goog.dom.ViewportSizeMonitor.getInstanceForWindow = function(opt_window) {
  var currentWindow = opt_window || window;
  var uid = goog.getUid(currentWindow);
  return goog.dom.ViewportSizeMonitor.windowInstanceMap_[uid] = goog.dom.ViewportSizeMonitor.windowInstanceMap_[uid] || new goog.dom.ViewportSizeMonitor(currentWindow)
};
goog.dom.ViewportSizeMonitor.windowInstanceMap_ = {};
goog.dom.ViewportSizeMonitor.WINDOW_SIZE_POLL_RATE = 500;
goog.dom.ViewportSizeMonitor.prototype.listenerKey_ = null;
goog.dom.ViewportSizeMonitor.prototype.window_ = null;
goog.dom.ViewportSizeMonitor.prototype.size_ = null;
goog.dom.ViewportSizeMonitor.prototype.windowSizePollInterval_ = null;
goog.dom.ViewportSizeMonitor.prototype.isPollingRequired_ = function() {
  return goog.userAgent.WEBKIT && goog.userAgent.WINDOWS || goog.userAgent.OPERA && this.window_.self != this.window_.top
};
goog.dom.ViewportSizeMonitor.prototype.getSize = function() {
  return this.size_ ? this.size_.clone() : null
};
goog.dom.ViewportSizeMonitor.prototype.disposeInternal = function() {
  goog.dom.ViewportSizeMonitor.superClass_.disposeInternal.call(this);
  if(this.listenerKey_) {
    goog.events.unlistenByKey(this.listenerKey_);
    this.listenerKey_ = null
  }
  if(this.windowSizePollInterval_) {
    window.clearInterval(this.windowSizePollInterval_);
    this.windowSizePollInterval_ = null
  }
  this.window_ = null;
  this.size_ = null
};
goog.dom.ViewportSizeMonitor.prototype.handleResize_ = function(event) {
  this.checkForSizeChange_()
};
goog.dom.ViewportSizeMonitor.prototype.checkForSizeChange_ = function() {
  var size = goog.dom.getViewportSize(this.window_);
  if(!goog.math.Size.equals(size, this.size_)) {
    this.size_ = size;
    this.dispatchEvent(goog.events.EventType.RESIZE)
  }
};
goog.provide("goog.color.names");
goog.color.names = {"aliceblue":"#f0f8ff", "antiquewhite":"#faebd7", "aqua":"#00ffff", "aquamarine":"#7fffd4", "azure":"#f0ffff", "beige":"#f5f5dc", "bisque":"#ffe4c4", "black":"#000000", "blanchedalmond":"#ffebcd", "blue":"#0000ff", "blueviolet":"#8a2be2", "brown":"#a52a2a", "burlywood":"#deb887", "cadetblue":"#5f9ea0", "chartreuse":"#7fff00", "chocolate":"#d2691e", "coral":"#ff7f50", "cornflowerblue":"#6495ed", "cornsilk":"#fff8dc", "crimson":"#dc143c", "cyan":"#00ffff", "darkblue":"#00008b", "darkcyan":"#008b8b", 
"darkgoldenrod":"#b8860b", "darkgray":"#a9a9a9", "darkgreen":"#006400", "darkgrey":"#a9a9a9", "darkkhaki":"#bdb76b", "darkmagenta":"#8b008b", "darkolivegreen":"#556b2f", "darkorange":"#ff8c00", "darkorchid":"#9932cc", "darkred":"#8b0000", "darksalmon":"#e9967a", "darkseagreen":"#8fbc8f", "darkslateblue":"#483d8b", "darkslategray":"#2f4f4f", "darkslategrey":"#2f4f4f", "darkturquoise":"#00ced1", "darkviolet":"#9400d3", "deeppink":"#ff1493", "deepskyblue":"#00bfff", "dimgray":"#696969", "dimgrey":"#696969", 
"dodgerblue":"#1e90ff", "firebrick":"#b22222", "floralwhite":"#fffaf0", "forestgreen":"#228b22", "fuchsia":"#ff00ff", "gainsboro":"#dcdcdc", "ghostwhite":"#f8f8ff", "gold":"#ffd700", "goldenrod":"#daa520", "gray":"#808080", "green":"#008000", "greenyellow":"#adff2f", "grey":"#808080", "honeydew":"#f0fff0", "hotpink":"#ff69b4", "indianred":"#cd5c5c", "indigo":"#4b0082", "ivory":"#fffff0", "khaki":"#f0e68c", "lavender":"#e6e6fa", "lavenderblush":"#fff0f5", "lawngreen":"#7cfc00", "lemonchiffon":"#fffacd", 
"lightblue":"#add8e6", "lightcoral":"#f08080", "lightcyan":"#e0ffff", "lightgoldenrodyellow":"#fafad2", "lightgray":"#d3d3d3", "lightgreen":"#90ee90", "lightgrey":"#d3d3d3", "lightpink":"#ffb6c1", "lightsalmon":"#ffa07a", "lightseagreen":"#20b2aa", "lightskyblue":"#87cefa", "lightslategray":"#778899", "lightslategrey":"#778899", "lightsteelblue":"#b0c4de", "lightyellow":"#ffffe0", "lime":"#00ff00", "limegreen":"#32cd32", "linen":"#faf0e6", "magenta":"#ff00ff", "maroon":"#800000", "mediumaquamarine":"#66cdaa", 
"mediumblue":"#0000cd", "mediumorchid":"#ba55d3", "mediumpurple":"#9370d8", "mediumseagreen":"#3cb371", "mediumslateblue":"#7b68ee", "mediumspringgreen":"#00fa9a", "mediumturquoise":"#48d1cc", "mediumvioletred":"#c71585", "midnightblue":"#191970", "mintcream":"#f5fffa", "mistyrose":"#ffe4e1", "moccasin":"#ffe4b5", "navajowhite":"#ffdead", "navy":"#000080", "oldlace":"#fdf5e6", "olive":"#808000", "olivedrab":"#6b8e23", "orange":"#ffa500", "orangered":"#ff4500", "orchid":"#da70d6", "palegoldenrod":"#eee8aa", 
"palegreen":"#98fb98", "paleturquoise":"#afeeee", "palevioletred":"#d87093", "papayawhip":"#ffefd5", "peachpuff":"#ffdab9", "peru":"#cd853f", "pink":"#ffc0cb", "plum":"#dda0dd", "powderblue":"#b0e0e6", "purple":"#800080", "red":"#ff0000", "rosybrown":"#bc8f8f", "royalblue":"#4169e1", "saddlebrown":"#8b4513", "salmon":"#fa8072", "sandybrown":"#f4a460", "seagreen":"#2e8b57", "seashell":"#fff5ee", "sienna":"#a0522d", "silver":"#c0c0c0", "skyblue":"#87ceeb", "slateblue":"#6a5acd", "slategray":"#708090", 
"slategrey":"#708090", "snow":"#fffafa", "springgreen":"#00ff7f", "steelblue":"#4682b4", "tan":"#d2b48c", "teal":"#008080", "thistle":"#d8bfd8", "tomato":"#ff6347", "turquoise":"#40e0d0", "violet":"#ee82ee", "wheat":"#f5deb3", "white":"#ffffff", "whitesmoke":"#f5f5f5", "yellow":"#ffff00", "yellowgreen":"#9acd32"};
goog.provide("goog.math");
goog.require("goog.array");
goog.math.randomInt = function(a) {
  return Math.floor(Math.random() * a)
};
goog.math.uniformRandom = function(a, b) {
  return a + Math.random() * (b - a)
};
goog.math.clamp = function(value, min, max) {
  return Math.min(Math.max(value, min), max)
};
goog.math.modulo = function(a, b) {
  var r = a % b;
  return r * b < 0 ? r + b : r
};
goog.math.lerp = function(a, b, x) {
  return a + x * (b - a)
};
goog.math.nearlyEquals = function(a, b, opt_tolerance) {
  return Math.abs(a - b) <= (opt_tolerance || 1.0E-6)
};
goog.math.standardAngle = function(angle) {
  return goog.math.modulo(angle, 360)
};
goog.math.toRadians = function(angleDegrees) {
  return angleDegrees * Math.PI / 180
};
goog.math.toDegrees = function(angleRadians) {
  return angleRadians * 180 / Math.PI
};
goog.math.angleDx = function(degrees, radius) {
  return radius * Math.cos(goog.math.toRadians(degrees))
};
goog.math.angleDy = function(degrees, radius) {
  return radius * Math.sin(goog.math.toRadians(degrees))
};
goog.math.angle = function(x1, y1, x2, y2) {
  return goog.math.standardAngle(goog.math.toDegrees(Math.atan2(y2 - y1, x2 - x1)))
};
goog.math.angleDifference = function(startAngle, endAngle) {
  var d = goog.math.standardAngle(endAngle) - goog.math.standardAngle(startAngle);
  if(d > 180) {
    d = d - 360
  }else {
    if(d <= -180) {
      d = 360 + d
    }
  }
  return d
};
goog.math.sign = function(x) {
  return x == 0 ? 0 : x < 0 ? -1 : 1
};
goog.math.longestCommonSubsequence = function(array1, array2, opt_compareFn, opt_collectorFn) {
  var compare = opt_compareFn || function(a, b) {
    return a == b
  };
  var collect = opt_collectorFn || function(i1, i2) {
    return array1[i1]
  };
  var length1 = array1.length;
  var length2 = array2.length;
  var arr = [];
  for(var i = 0;i < length1 + 1;i++) {
    arr[i] = [];
    arr[i][0] = 0
  }
  for(var j = 0;j < length2 + 1;j++) {
    arr[0][j] = 0
  }
  for(i = 1;i <= length1;i++) {
    for(j = 1;j <= length1;j++) {
      if(compare(array1[i - 1], array2[j - 1])) {
        arr[i][j] = arr[i - 1][j - 1] + 1
      }else {
        arr[i][j] = Math.max(arr[i - 1][j], arr[i][j - 1])
      }
    }
  }
  var result = [];
  var i = length1, j = length2;
  while(i > 0 && j > 0) {
    if(compare(array1[i - 1], array2[j - 1])) {
      result.unshift(collect(i - 1, j - 1));
      i--;
      j--
    }else {
      if(arr[i - 1][j] > arr[i][j - 1]) {
        i--
      }else {
        j--
      }
    }
  }
  return result
};
goog.math.sum = function(var_args) {
  return goog.array.reduce(arguments, function(sum, value) {
    return sum + value
  }, 0)
};
goog.math.average = function(var_args) {
  return goog.math.sum.apply(null, arguments) / arguments.length
};
goog.math.standardDeviation = function(var_args) {
  var sampleSize = arguments.length;
  if(sampleSize < 2) {
    return 0
  }
  var mean = goog.math.average.apply(null, arguments);
  var variance = goog.math.sum.apply(null, goog.array.map(arguments, function(val) {
    return Math.pow(val - mean, 2)
  })) / (sampleSize - 1);
  return Math.sqrt(variance)
};
goog.math.isInt = function(num) {
  return isFinite(num) && num % 1 == 0
};
goog.math.isFiniteNumber = function(num) {
  return isFinite(num) && !isNaN(num)
};
goog.provide("goog.color");
goog.require("goog.color.names");
goog.require("goog.math");
goog.color.parse = function(str) {
  var result = {};
  str = String(str);
  var maybeHex = goog.color.prependPoundIfNecessary_(str);
  if(goog.color.isValidHexColor_(maybeHex)) {
    result.hex = goog.color.normalizeHex(maybeHex);
    result.type = "hex";
    return result
  }else {
    var rgb = goog.color.isValidRgbColor_(str);
    if(rgb.length) {
      result.hex = goog.color.rgbArrayToHex(rgb);
      result.type = "rgb";
      return result
    }else {
      if(goog.color.names) {
        var hex = goog.color.names[str.toLowerCase()];
        if(hex) {
          result.hex = hex;
          result.type = "named";
          return result
        }
      }
    }
  }
  throw Error(str + " is not a valid color string");
};
goog.color.parseRgb = function(str) {
  var rgb = goog.color.isValidRgbColor_(str);
  if(!rgb.length) {
    throw Error(str + " is not a valid RGB color");
  }
  return rgb
};
goog.color.hexToRgbStyle = function(hexColor) {
  return goog.color.rgbStyle_(goog.color.hexToRgb(hexColor))
};
goog.color.hexTripletRe_ = /#(.)(.)(.)/;
goog.color.normalizeHex = function(hexColor) {
  if(!goog.color.isValidHexColor_(hexColor)) {
    throw Error("'" + hexColor + "' is not a valid hex color");
  }
  if(hexColor.length == 4) {
    hexColor = hexColor.replace(goog.color.hexTripletRe_, "#$1$1$2$2$3$3")
  }
  return hexColor.toLowerCase()
};
goog.color.hexToRgb = function(hexColor) {
  hexColor = goog.color.normalizeHex(hexColor);
  var r = parseInt(hexColor.substr(1, 2), 16);
  var g = parseInt(hexColor.substr(3, 2), 16);
  var b = parseInt(hexColor.substr(5, 2), 16);
  return[r, g, b]
};
goog.color.rgbToHex = function(r, g, b) {
  r = Number(r);
  g = Number(g);
  b = Number(b);
  if(isNaN(r) || r < 0 || r > 255 || isNaN(g) || g < 0 || g > 255 || isNaN(b) || b < 0 || b > 255) {
    throw Error('"(' + r + "," + g + "," + b + '") is not a valid RGB color');
  }
  var hexR = goog.color.prependZeroIfNecessary_(r.toString(16));
  var hexG = goog.color.prependZeroIfNecessary_(g.toString(16));
  var hexB = goog.color.prependZeroIfNecessary_(b.toString(16));
  return"#" + hexR + hexG + hexB
};
goog.color.rgbArrayToHex = function(rgb) {
  return goog.color.rgbToHex(rgb[0], rgb[1], rgb[2])
};
goog.color.rgbToHsl = function(r, g, b) {
  var normR = r / 255;
  var normG = g / 255;
  var normB = b / 255;
  var max = Math.max(normR, normG, normB);
  var min = Math.min(normR, normG, normB);
  var h = 0;
  var s = 0;
  var l = 0.5 * (max + min);
  if(max != min) {
    if(max == normR) {
      h = 60 * (normG - normB) / (max - min)
    }else {
      if(max == normG) {
        h = 60 * (normB - normR) / (max - min) + 120
      }else {
        if(max == normB) {
          h = 60 * (normR - normG) / (max - min) + 240
        }
      }
    }
    if(0 < l && l <= 0.5) {
      s = (max - min) / (2 * l)
    }else {
      s = (max - min) / (2 - 2 * l)
    }
  }
  return[Math.round(h + 360) % 360, s, l]
};
goog.color.rgbArrayToHsl = function(rgb) {
  return goog.color.rgbToHsl(rgb[0], rgb[1], rgb[2])
};
goog.color.hueToRgb_ = function(v1, v2, vH) {
  if(vH < 0) {
    vH += 1
  }else {
    if(vH > 1) {
      vH -= 1
    }
  }
  if(6 * vH < 1) {
    return v1 + (v2 - v1) * 6 * vH
  }else {
    if(2 * vH < 1) {
      return v2
    }else {
      if(3 * vH < 2) {
        return v1 + (v2 - v1) * (2 / 3 - vH) * 6
      }
    }
  }
  return v1
};
goog.color.hslToRgb = function(h, s, l) {
  var r = 0;
  var g = 0;
  var b = 0;
  var normH = h / 360;
  if(s == 0) {
    r = g = b = l * 255
  }else {
    var temp1 = 0;
    var temp2 = 0;
    if(l < 0.5) {
      temp2 = l * (1 + s)
    }else {
      temp2 = l + s - s * l
    }
    temp1 = 2 * l - temp2;
    r = 255 * goog.color.hueToRgb_(temp1, temp2, normH + 1 / 3);
    g = 255 * goog.color.hueToRgb_(temp1, temp2, normH);
    b = 255 * goog.color.hueToRgb_(temp1, temp2, normH - 1 / 3)
  }
  return[Math.round(r), Math.round(g), Math.round(b)]
};
goog.color.hslArrayToRgb = function(hsl) {
  return goog.color.hslToRgb(hsl[0], hsl[1], hsl[2])
};
goog.color.validHexColorRe_ = /^#(?:[0-9a-f]{3}){1,2}$/i;
goog.color.isValidHexColor_ = function(str) {
  return goog.color.validHexColorRe_.test(str)
};
goog.color.normalizedHexColorRe_ = /^#[0-9a-f]{6}$/;
goog.color.isNormalizedHexColor_ = function(str) {
  return goog.color.normalizedHexColorRe_.test(str)
};
goog.color.rgbColorRe_ = /^(?:rgb)?\((0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2})\)$/i;
goog.color.isValidRgbColor_ = function(str) {
  var regExpResultArray = str.match(goog.color.rgbColorRe_);
  if(regExpResultArray) {
    var r = Number(regExpResultArray[1]);
    var g = Number(regExpResultArray[2]);
    var b = Number(regExpResultArray[3]);
    if(r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      return[r, g, b]
    }
  }
  return[]
};
goog.color.prependZeroIfNecessary_ = function(hex) {
  return hex.length == 1 ? "0" + hex : hex
};
goog.color.prependPoundIfNecessary_ = function(str) {
  return str.charAt(0) == "#" ? str : "#" + str
};
goog.color.rgbStyle_ = function(rgb) {
  return"rgb(" + rgb.join(",") + ")"
};
goog.color.hsvToRgb = function(h, s, brightness) {
  var red = 0;
  var green = 0;
  var blue = 0;
  if(s == 0) {
    red = brightness;
    green = brightness;
    blue = brightness
  }else {
    var sextant = Math.floor(h / 60);
    var remainder = h / 60 - sextant;
    var val1 = brightness * (1 - s);
    var val2 = brightness * (1 - s * remainder);
    var val3 = brightness * (1 - s * (1 - remainder));
    switch(sextant) {
      case 1:
        red = val2;
        green = brightness;
        blue = val1;
        break;
      case 2:
        red = val1;
        green = brightness;
        blue = val3;
        break;
      case 3:
        red = val1;
        green = val2;
        blue = brightness;
        break;
      case 4:
        red = val3;
        green = val1;
        blue = brightness;
        break;
      case 5:
        red = brightness;
        green = val1;
        blue = val2;
        break;
      case 6:
      ;
      case 0:
        red = brightness;
        green = val3;
        blue = val1;
        break
    }
  }
  return[Math.floor(red), Math.floor(green), Math.floor(blue)]
};
goog.color.rgbToHsv = function(red, green, blue) {
  var max = Math.max(Math.max(red, green), blue);
  var min = Math.min(Math.min(red, green), blue);
  var hue;
  var saturation;
  var value = max;
  if(min == max) {
    hue = 0;
    saturation = 0
  }else {
    var delta = max - min;
    saturation = delta / max;
    if(red == max) {
      hue = (green - blue) / delta
    }else {
      if(green == max) {
        hue = 2 + (blue - red) / delta
      }else {
        hue = 4 + (red - green) / delta
      }
    }
    hue *= 60;
    if(hue < 0) {
      hue += 360
    }
    if(hue > 360) {
      hue -= 360
    }
  }
  return[hue, saturation, value]
};
goog.color.rgbArrayToHsv = function(rgb) {
  return goog.color.rgbToHsv(rgb[0], rgb[1], rgb[2])
};
goog.color.hsvArrayToRgb = function(hsv) {
  return goog.color.hsvToRgb(hsv[0], hsv[1], hsv[2])
};
goog.color.hexToHsl = function(hex) {
  var rgb = goog.color.hexToRgb(hex);
  return goog.color.rgbToHsl(rgb[0], rgb[1], rgb[2])
};
goog.color.hslToHex = function(h, s, l) {
  return goog.color.rgbArrayToHex(goog.color.hslToRgb(h, s, l))
};
goog.color.hslArrayToHex = function(hsl) {
  return goog.color.rgbArrayToHex(goog.color.hslToRgb(hsl[0], hsl[1], hsl[2]))
};
goog.color.hexToHsv = function(hex) {
  return goog.color.rgbArrayToHsv(goog.color.hexToRgb(hex))
};
goog.color.hsvToHex = function(h, s, v) {
  return goog.color.rgbArrayToHex(goog.color.hsvToRgb(h, s, v))
};
goog.color.hsvArrayToHex = function(hsv) {
  return goog.color.hsvToHex(hsv[0], hsv[1], hsv[2])
};
goog.color.hslDistance = function(hsl1, hsl2) {
  var sl1, sl2;
  if(hsl1[2] <= 0.5) {
    sl1 = hsl1[1] * hsl1[2]
  }else {
    sl1 = hsl1[1] * (1 - hsl1[2])
  }
  if(hsl2[2] <= 0.5) {
    sl2 = hsl2[1] * hsl2[2]
  }else {
    sl2 = hsl2[1] * (1 - hsl2[2])
  }
  var h1 = hsl1[0] / 360;
  var h2 = hsl2[0] / 360;
  var dh = (h1 - h2) * 2 * Math.PI;
  return(hsl1[2] - hsl2[2]) * (hsl1[2] - hsl2[2]) + sl1 * sl1 + sl2 * sl2 - 2 * sl1 * sl2 * Math.cos(dh)
};
goog.color.blend = function(rgb1, rgb2, factor) {
  factor = goog.math.clamp(factor, 0, 1);
  return[Math.round(factor * rgb1[0] + (1 - factor) * rgb2[0]), Math.round(factor * rgb1[1] + (1 - factor) * rgb2[1]), Math.round(factor * rgb1[2] + (1 - factor) * rgb2[2])]
};
goog.color.darken = function(rgb, factor) {
  var black = [0, 0, 0];
  return goog.color.blend(black, rgb, factor)
};
goog.color.lighten = function(rgb, factor) {
  var white = [255, 255, 255];
  return goog.color.blend(white, rgb, factor)
};
goog.color.highContrast = function(prime, suggestions) {
  var suggestionsWithDiff = [];
  for(var i = 0;i < suggestions.length;i++) {
    suggestionsWithDiff.push({color:suggestions[i], diff:goog.color.yiqBrightnessDiff_(suggestions[i], prime) + goog.color.colorDiff_(suggestions[i], prime)})
  }
  suggestionsWithDiff.sort(function(a, b) {
    return b.diff - a.diff
  });
  return suggestionsWithDiff[0].color
};
goog.color.yiqBrightness_ = function(rgb) {
  return Math.round((rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1E3)
};
goog.color.yiqBrightnessDiff_ = function(rgb1, rgb2) {
  return Math.abs(goog.color.yiqBrightness_(rgb1) - goog.color.yiqBrightness_(rgb2))
};
goog.color.colorDiff_ = function(rgb1, rgb2) {
  return Math.abs(rgb1[0] - rgb2[0]) + Math.abs(rgb1[1] - rgb2[1]) + Math.abs(rgb1[2] - rgb2[2])
};
goog.provide("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.math.Box = function(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left
};
goog.math.Box.boundingBox = function(var_args) {
  var box = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x);
  for(var i = 1;i < arguments.length;i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x)
  }
  return box
};
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left)
};
if(goog.DEBUG) {
  goog.math.Box.prototype.toString = function() {
    return"(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)"
  }
}
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other)
};
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom, opt_left) {
  if(goog.isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left
  }else {
    this.top -= top;
    this.right += opt_right;
    this.bottom += opt_bottom;
    this.left -= opt_left
  }
  return this
};
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom)
};
goog.math.Box.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.top == b.top && a.right == b.right && a.bottom == b.bottom && a.left == b.left
};
goog.math.Box.contains = function(box, other) {
  if(!box || !other) {
    return false
  }
  if(other instanceof goog.math.Box) {
    return other.left >= box.left && other.right <= box.right && other.top >= box.top && other.bottom <= box.bottom
  }
  return other.x >= box.left && other.x <= box.right && other.y >= box.top && other.y <= box.bottom
};
goog.math.Box.distance = function(box, coord) {
  if(coord.x >= box.left && coord.x <= box.right) {
    if(coord.y >= box.top && coord.y <= box.bottom) {
      return 0
    }
    return coord.y < box.top ? box.top - coord.y : coord.y - box.bottom
  }
  if(coord.y >= box.top && coord.y <= box.bottom) {
    return coord.x < box.left ? box.left - coord.x : coord.x - box.right
  }
  return goog.math.Coordinate.distance(coord, new goog.math.Coordinate(coord.x < box.left ? box.left : box.right, coord.y < box.top ? box.top : box.bottom))
};
goog.math.Box.intersects = function(a, b) {
  return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom
};
goog.math.Box.intersectsWithPadding = function(a, b, padding) {
  return a.left <= b.right + padding && b.left <= a.right + padding && a.top <= b.bottom + padding && b.top <= a.bottom + padding
};
goog.provide("goog.math.Rect");
goog.require("goog.math.Box");
goog.require("goog.math.Size");
goog.math.Rect = function(x, y, w, h) {
  this.left = x;
  this.top = y;
  this.width = w;
  this.height = h
};
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height)
};
goog.math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new goog.math.Box(this.top, right, bottom, this.left)
};
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top, box.right - box.left, box.bottom - box.top)
};
if(goog.DEBUG) {
  goog.math.Rect.prototype.toString = function() {
    return"(" + this.left + ", " + this.top + " - " + this.width + "w x " + this.height + "h)"
  }
}
goog.math.Rect.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.left == b.left && a.width == b.width && a.top == b.top && a.height == b.height
};
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);
  if(x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);
    if(y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;
      return true
    }
  }
  return false
};
goog.math.Rect.intersection = function(a, b) {
  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);
  if(x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);
    if(y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0)
    }
  }
  return null
};
goog.math.Rect.intersects = function(a, b) {
  return a.left <= b.left + b.width && b.left <= a.left + a.width && a.top <= b.top + b.height && b.top <= a.top + a.height
};
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect)
};
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if(!intersection || !intersection.height || !intersection.width) {
    return[a.clone()]
  }
  var result = [];
  var top = a.top;
  var height = a.height;
  var ar = a.left + a.width;
  var ab = a.top + a.height;
  var br = b.left + b.width;
  var bb = b.top + b.height;
  if(b.top > a.top) {
    result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    height -= b.top - a.top
  }
  if(bb < ab) {
    result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top
  }
  if(b.left > a.left) {
    result.push(new goog.math.Rect(a.left, top, b.left - a.left, height))
  }
  if(br < ar) {
    result.push(new goog.math.Rect(br, top, ar - br, height))
  }
  return result
};
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect)
};
goog.math.Rect.prototype.boundingRect = function(rect) {
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);
  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);
  this.width = right - this.left;
  this.height = bottom - this.top
};
goog.math.Rect.boundingRect = function(a, b) {
  if(!a || !b) {
    return null
  }
  var clone = a.clone();
  clone.boundingRect(b);
  return clone
};
goog.math.Rect.prototype.contains = function(another) {
  if(another instanceof goog.math.Rect) {
    return this.left <= another.left && this.left + this.width >= another.left + another.width && this.top <= another.top && this.top + this.height >= another.top + another.height
  }else {
    return another.x >= this.left && another.x <= this.left + this.width && another.y >= this.top && another.y <= this.top + this.height
  }
};
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height)
};
goog.provide("goog.style");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Rect");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.style.setStyle = function(element, style, opt_value) {
  if(goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style)
  }else {
    goog.object.forEach(style, goog.partial(goog.style.setStyle_, element))
  }
};
goog.style.setStyle_ = function(element, value, style) {
  element.style[goog.string.toCamelCase(style)] = value
};
goog.style.getStyle = function(element, property) {
  return element.style[goog.string.toCamelCase(property)] || ""
};
goog.style.getComputedStyle = function(element, property) {
  var doc = goog.dom.getOwnerDocument(element);
  if(doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, null);
    if(styles) {
      return styles[property] || styles.getPropertyValue(property)
    }
  }
  return""
};
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null
};
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) || goog.style.getCascadedStyle(element, style) || element.style[style]
};
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, "position")
};
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, "backgroundColor")
};
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, "overflowX")
};
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, "overflowY")
};
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, "zIndex")
};
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, "textAlign")
};
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, "cursor")
};
goog.style.setPosition = function(el, arg1, opt_arg2) {
  var x, y;
  var buggyGeckoSubPixelPos = goog.userAgent.GECKO && (goog.userAgent.MAC || goog.userAgent.X11) && goog.userAgent.isVersion("1.9");
  if(arg1 instanceof goog.math.Coordinate) {
    x = arg1.x;
    y = arg1.y
  }else {
    x = arg1;
    y = opt_arg2
  }
  el.style.left = goog.style.getPixelStyleValue_(x, buggyGeckoSubPixelPos);
  el.style.top = goog.style.getPixelStyleValue_(y, buggyGeckoSubPixelPos)
};
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop)
};
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  if(opt_node) {
    if(opt_node.nodeType == goog.dom.NodeType.DOCUMENT) {
      doc = opt_node
    }else {
      doc = goog.dom.getOwnerDocument(opt_node)
    }
  }else {
    doc = goog.dom.getDocument()
  }
  if(goog.userAgent.IE && !goog.userAgent.isVersion(9) && !goog.dom.getDomHelper(doc).isCss1CompatMode()) {
    return doc.body
  }
  return doc.documentElement
};
goog.style.getBoundingClientRect_ = function(el) {
  var rect = el.getBoundingClientRect();
  if(goog.userAgent.IE) {
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop
  }
  return rect
};
goog.style.getOffsetParent = function(element) {
  if(goog.userAgent.IE) {
    return element.offsetParent
  }
  var doc = goog.dom.getOwnerDocument(element);
  var positionStyle = goog.style.getStyle_(element, "position");
  var skipStatic = positionStyle == "fixed" || positionStyle == "absolute";
  for(var parent = element.parentNode;parent && parent != doc;parent = parent.parentNode) {
    positionStyle = goog.style.getStyle_(parent, "position");
    skipStatic = skipStatic && positionStyle == "static" && parent != doc.documentElement && parent != doc.body;
    if(!skipStatic && (parent.scrollWidth > parent.clientWidth || parent.scrollHeight > parent.clientHeight || positionStyle == "fixed" || positionStyle == "absolute")) {
      return parent
    }
  }
  return null
};
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var scrollEl = dom.getDocumentScrollElement();
  var inContainer;
  for(var el = element;el = goog.style.getOffsetParent(el);) {
    if((!goog.userAgent.IE || el.clientWidth != 0) && (!goog.userAgent.WEBKIT || el.clientHeight != 0 || el != body) && (el.scrollWidth != el.clientWidth || el.scrollHeight != el.clientHeight) && goog.style.getStyle_(el, "overflow") != "visible") {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;
      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right, pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom, pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x);
      inContainer = inContainer || el != scrollEl
    }
  }
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  if(goog.userAgent.WEBKIT) {
    visibleRect.left += scrollX;
    visibleRect.top += scrollY
  }else {
    visibleRect.left = Math.max(visibleRect.left, scrollX);
    visibleRect.top = Math.max(visibleRect.top, scrollY)
  }
  if(!inContainer || goog.userAgent.WEBKIT) {
    visibleRect.right += scrollX;
    visibleRect.bottom += scrollY
  }
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
  return visibleRect.top >= 0 && visibleRect.left >= 0 && visibleRect.bottom > visibleRect.top && visibleRect.right > visibleRect.left ? visibleRect : null
};
goog.style.scrollIntoContainerView = function(element, container, opt_center) {
  var elementPos = goog.style.getPageOffset(element);
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);
  var relX = elementPos.x - containerPos.x - containerBorder.left;
  var relY = elementPos.y - containerPos.y - containerBorder.top;
  var spaceX = container.clientWidth - element.offsetWidth;
  var spaceY = container.clientHeight - element.offsetHeight;
  if(opt_center) {
    container.scrollLeft += relX - spaceX / 2;
    container.scrollTop += relY - spaceY / 2
  }else {
    container.scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    container.scrollTop += Math.min(relY, Math.max(relY - spaceY, 0))
  }
};
goog.style.getClientLeftTop = function(el) {
  if(goog.userAgent.GECKO && !goog.userAgent.isVersion("1.9")) {
    var left = parseFloat(goog.style.getComputedStyle(el, "borderLeftWidth"));
    if(goog.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left - parseFloat(goog.style.getComputedStyle(el, "borderRightWidth"));
      left += scrollbarWidth
    }
    return new goog.math.Coordinate(left, parseFloat(goog.style.getComputedStyle(el, "borderTopWidth")))
  }
  return new goog.math.Coordinate(el.clientLeft, el.clientTop)
};
goog.style.getPageOffset = function(el) {
  var box, doc = goog.dom.getOwnerDocument(el);
  var positionStyle = goog.style.getStyle_(el, "position");
  var BUGGY_GECKO_BOX_OBJECT = goog.userAgent.GECKO && doc.getBoxObjectFor && !el.getBoundingClientRect && positionStyle == "absolute" && (box = doc.getBoxObjectFor(el)) && (box.screenX < 0 || box.screenY < 0);
  var pos = new goog.math.Coordinate(0, 0);
  var viewportElement = goog.style.getClientViewportElement(doc);
  if(el == viewportElement) {
    return pos
  }
  if(el.getBoundingClientRect) {
    box = goog.style.getBoundingClientRect_(el);
    var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y
  }else {
    if(doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
      box = doc.getBoxObjectFor(el);
      var vpBox = doc.getBoxObjectFor(viewportElement);
      pos.x = box.screenX - vpBox.screenX;
      pos.y = box.screenY - vpBox.screenY
    }else {
      var parent = el;
      do {
        pos.x += parent.offsetLeft;
        pos.y += parent.offsetTop;
        if(parent != el) {
          pos.x += parent.clientLeft || 0;
          pos.y += parent.clientTop || 0
        }
        if(goog.userAgent.WEBKIT && goog.style.getComputedPosition(parent) == "fixed") {
          pos.x += doc.body.scrollLeft;
          pos.y += doc.body.scrollTop;
          break
        }
        parent = parent.offsetParent
      }while(parent && parent != el);
      if(goog.userAgent.OPERA || goog.userAgent.WEBKIT && positionStyle == "absolute") {
        pos.y -= doc.body.offsetTop
      }
      for(parent = el;(parent = goog.style.getOffsetParent(parent)) && parent != doc.body && parent != viewportElement;) {
        pos.x -= parent.scrollLeft;
        if(!goog.userAgent.OPERA || parent.tagName != "TR") {
          pos.y -= parent.scrollTop
        }
      }
    }
  }
  return pos
};
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x
};
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y
};
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0);
  var currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  var currentEl = el;
  do {
    var offset = currentWin == relativeWin ? goog.style.getPageOffset(currentEl) : goog.style.getClientPosition(currentEl);
    position.x += offset.x;
    position.y += offset.y
  }while(currentWin && currentWin != relativeWin && (currentEl = currentWin.frameElement) && (currentWin = currentWin.parent));
  return position
};
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if(origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body;
    var pos = goog.style.getFramedPageOffset(body, newBase.getWindow());
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));
    if(goog.userAgent.IE && !origBase.isCss1CompatMode()) {
      pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll())
    }
    rect.left += pos.x;
    rect.top += pos.y
  }
};
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a);
  var bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y)
};
goog.style.getClientPosition = function(el) {
  var pos = new goog.math.Coordinate;
  if(el.nodeType == goog.dom.NodeType.ELEMENT) {
    if(el.getBoundingClientRect) {
      var box = goog.style.getBoundingClientRect_(el);
      pos.x = box.left;
      pos.y = box.top
    }else {
      var scrollCoord = goog.dom.getDomHelper(el).getDocumentScroll();
      var pageCoord = goog.style.getPageOffset(el);
      pos.x = pageCoord.x - scrollCoord.x;
      pos.y = pageCoord.y - scrollCoord.y
    }
  }else {
    var isAbstractedEvent = goog.isFunction(el.getBrowserEvent);
    var targetEvent = el;
    if(el.targetTouches) {
      targetEvent = el.targetTouches[0]
    }else {
      if(isAbstractedEvent && el.getBrowserEvent().targetTouches) {
        targetEvent = el.getBrowserEvent().targetTouches[0]
      }
    }
    pos.x = targetEvent.clientX;
    pos.y = targetEvent.clientY
  }
  return pos
};
goog.style.setPageOffset = function(el, x, opt_y) {
  var cur = goog.style.getPageOffset(el);
  if(x instanceof goog.math.Coordinate) {
    opt_y = x.y;
    x = x.x
  }
  var dx = x - cur.x;
  var dy = opt_y - cur.y;
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + dy)
};
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if(w instanceof goog.math.Size) {
    h = w.height;
    w = w.width
  }else {
    if(opt_h == undefined) {
      throw Error("missing height argument");
    }
    h = opt_h
  }
  goog.style.setWidth(element, w);
  goog.style.setHeight(element, h)
};
goog.style.getPixelStyleValue_ = function(value, round) {
  if(typeof value == "number") {
    value = (round ? Math.round(value) : value) + "px"
  }
  return value
};
goog.style.setHeight = function(element, height) {
  element.style.height = goog.style.getPixelStyleValue_(height, true)
};
goog.style.setWidth = function(element, width) {
  element.style.width = goog.style.getPixelStyleValue_(width, true)
};
goog.style.getSize = function(element) {
  if(goog.style.getStyle_(element, "display") != "none") {
    return new goog.math.Size(element.offsetWidth, element.offsetHeight)
  }
  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;
  style.visibility = "hidden";
  style.position = "absolute";
  style.display = "inline";
  var originalWidth = element.offsetWidth;
  var originalHeight = element.offsetHeight;
  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;
  return new goog.math.Size(originalWidth, originalHeight)
};
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element);
  var s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height)
};
goog.style.toCamelCase = function(selector) {
  return goog.string.toCamelCase(String(selector))
};
goog.style.toSelectorCase = function(selector) {
  return goog.string.toSelectorCase(selector)
};
goog.style.getOpacity = function(el) {
  var style = el.style;
  var result = "";
  if("opacity" in style) {
    result = style.opacity
  }else {
    if("MozOpacity" in style) {
      result = style.MozOpacity
    }else {
      if("filter" in style) {
        var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
        if(match) {
          result = String(match[1] / 100)
        }
      }
    }
  }
  return result == "" ? result : Number(result)
};
goog.style.setOpacity = function(el, alpha) {
  var style = el.style;
  if("opacity" in style) {
    style.opacity = alpha
  }else {
    if("MozOpacity" in style) {
      style.MozOpacity = alpha
    }else {
      if("filter" in style) {
        if(alpha === "") {
          style.filter = ""
        }else {
          style.filter = "alpha(opacity=" + alpha * 100 + ")"
        }
      }
    }
  }
};
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(" + 'src="' + src + '", sizingMethod="crop")'
  }else {
    style.backgroundImage = "url(" + src + ")";
    style.backgroundPosition = "top left";
    style.backgroundRepeat = "no-repeat"
  }
};
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  if("filter" in style) {
    style.filter = ""
  }else {
    style.backgroundImage = "none"
  }
};
goog.style.showElement = function(el, display) {
  el.style.display = display ? "" : "none"
};
goog.style.isElementShown = function(el) {
  return el.style.display != "none"
};
goog.style.installStyles = function(stylesString, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node);
  var styleSheet = null;
  if(goog.userAgent.IE) {
    styleSheet = dh.getDocument().createStyleSheet();
    goog.style.setStyles(styleSheet, stylesString)
  }else {
    var head = dh.getElementsByTagNameAndClass("head")[0];
    if(!head) {
      var body = dh.getElementsByTagNameAndClass("body")[0];
      head = dh.createDom("head");
      body.parentNode.insertBefore(head, body)
    }
    styleSheet = dh.createDom("style");
    goog.style.setStyles(styleSheet, stylesString);
    dh.appendChild(head, styleSheet)
  }
  return styleSheet
};
goog.style.uninstallStyles = function(styleSheet) {
  var node = styleSheet.ownerNode || styleSheet.owningElement || styleSheet;
  goog.dom.removeNode(node)
};
goog.style.setStyles = function(element, stylesString) {
  if(goog.userAgent.IE) {
    element.cssText = stylesString
  }else {
    var propToSet = goog.userAgent.WEBKIT ? "innerText" : "innerHTML";
    element[propToSet] = stylesString
  }
};
goog.style.setPreWrap = function(el) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.whiteSpace = "pre";
    style.wordWrap = "break-word"
  }else {
    if(goog.userAgent.GECKO) {
      style.whiteSpace = "-moz-pre-wrap"
    }else {
      style.whiteSpace = "pre-wrap"
    }
  }
};
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  style.position = "relative";
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.zoom = "1";
    style.display = "inline"
  }else {
    if(goog.userAgent.GECKO) {
      style.display = goog.userAgent.isVersion("1.9a") ? "inline-block" : "-moz-inline-box"
    }else {
      style.display = "inline-block"
    }
  }
};
goog.style.isRightToLeft = function(el) {
  return"rtl" == goog.style.getStyle_(el, "direction")
};
goog.style.unselectableStyle_ = goog.userAgent.GECKO ? "MozUserSelect" : goog.userAgent.WEBKIT ? "WebkitUserSelect" : null;
goog.style.isUnselectable = function(el) {
  if(goog.style.unselectableStyle_) {
    return el.style[goog.style.unselectableStyle_].toLowerCase() == "none"
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      return el.getAttribute("unselectable") == "on"
    }
  }
  return false
};
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  var descendants = !opt_noRecurse ? el.getElementsByTagName("*") : null;
  var name = goog.style.unselectableStyle_;
  if(name) {
    var value = unselectable ? "none" : "";
    el.style[name] = value;
    if(descendants) {
      for(var i = 0, descendant;descendant = descendants[i];i++) {
        descendant.style[name] = value
      }
    }
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      var value = unselectable ? "on" : "";
      el.setAttribute("unselectable", value);
      if(descendants) {
        for(var i = 0, descendant;descendant = descendants[i];i++) {
          descendant.setAttribute("unselectable", value)
        }
      }
    }
  }
};
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight)
};
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom
    }else {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "border-box")
  }
};
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element);
  var ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if(ieCurrentStyle && goog.dom.getDomHelper(doc).isCss1CompatMode() && ieCurrentStyle.width != "auto" && ieCurrentStyle.height != "auto" && !ieCurrentStyle.boxSizing) {
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width, "width", "pixelWidth");
    var height = goog.style.getIePixelValue_(element, ieCurrentStyle.height, "height", "pixelHeight");
    return new goog.math.Size(width, height)
  }else {
    var borderBoxSize = goog.style.getBorderBoxSize(element);
    var paddingBox = goog.style.getPaddingBox(element);
    var borderBox = goog.style.getBorderBox(element);
    return new goog.math.Size(borderBoxSize.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right, borderBoxSize.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom)
  }
};
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }else {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left + paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top + paddingBox.bottom + borderBox.bottom
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "content-box")
  }
};
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  if(goog.userAgent.GECKO) {
    style.MozBoxSizing = boxSizing
  }else {
    if(goog.userAgent.WEBKIT) {
      style.WebkitBoxSizing = boxSizing
    }else {
      style.boxSizing = boxSizing
    }
  }
  style.width = size.width + "px";
  style.height = size.height + "px"
};
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  if(/^\d+px?$/.test(value)) {
    return parseInt(value, 10)
  }else {
    var oldStyleValue = element.style[name];
    var oldRuntimeValue = element.runtimeStyle[name];
    element.runtimeStyle[name] = element.currentStyle[name];
    element.style[name] = value;
    var pixelValue = element.style[pixelName];
    element.style[name] = oldStyleValue;
    element.runtimeStyle[name] = oldRuntimeValue;
    return pixelValue
  }
};
goog.style.getIePixelDistance_ = function(element, propName) {
  return goog.style.getIePixelValue_(element, goog.style.getCascadedStyle(element, propName), "left", "pixelLeft")
};
goog.style.getBox_ = function(element, stylePrefix) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + "Left");
    var right = goog.style.getIePixelDistance_(element, stylePrefix + "Right");
    var top = goog.style.getIePixelDistance_(element, stylePrefix + "Top");
    var bottom = goog.style.getIePixelDistance_(element, stylePrefix + "Bottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, stylePrefix + "Left");
    var right = goog.style.getComputedStyle(element, stylePrefix + "Right");
    var top = goog.style.getComputedStyle(element, stylePrefix + "Top");
    var bottom = goog.style.getComputedStyle(element, stylePrefix + "Bottom");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, "padding")
};
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, "margin")
};
goog.style.ieBorderWidthKeywords_ = {"thin":2, "medium":4, "thick":6};
goog.style.getIePixelBorder_ = function(element, prop) {
  if(goog.style.getCascadedStyle(element, prop + "Style") == "none") {
    return 0
  }
  var width = goog.style.getCascadedStyle(element, prop + "Width");
  if(width in goog.style.ieBorderWidthKeywords_) {
    return goog.style.ieBorderWidthKeywords_[width]
  }
  return goog.style.getIePixelValue_(element, width, "left", "pixelLeft")
};
goog.style.getBorderBox = function(element) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelBorder_(element, "borderLeft");
    var right = goog.style.getIePixelBorder_(element, "borderRight");
    var top = goog.style.getIePixelBorder_(element, "borderTop");
    var bottom = goog.style.getIePixelBorder_(element, "borderBottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, "borderLeftWidth");
    var right = goog.style.getComputedStyle(element, "borderRightWidth");
    var top = goog.style.getComputedStyle(element, "borderTopWidth");
    var bottom = goog.style.getComputedStyle(element, "borderBottomWidth");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  var font = "";
  if(doc.body.createTextRange) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    try {
      font = range.queryCommandValue("FontName")
    }catch(e) {
      font = ""
    }
  }
  if(!font) {
    font = goog.style.getStyle_(el, "fontFamily")
  }
  var fontsArray = font.split(",");
  if(fontsArray.length > 1) {
    font = fontsArray[0]
  }
  return goog.string.stripQuotes(font, "\"'")
};
goog.style.lengthUnitRegex_ = /[^\d]+$/;
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null
};
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {"cm":1, "in":1, "mm":1, "pc":1, "pt":1};
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {"em":1, "ex":1};
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, "fontSize");
  var sizeUnits = goog.style.getLengthUnits(fontSize);
  if(fontSize && "px" == sizeUnits) {
    return parseInt(fontSize, 10)
  }
  if(goog.userAgent.IE) {
    if(sizeUnits in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el, fontSize, "left", "pixelLeft")
    }else {
      if(el.parentNode && el.parentNode.nodeType == goog.dom.NodeType.ELEMENT && sizeUnits in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
        var parentElement = el.parentNode;
        var parentSize = goog.style.getStyle_(parentElement, "fontSize");
        return goog.style.getIePixelValue_(parentElement, fontSize == parentSize ? "1em" : fontSize, "left", "pixelLeft")
      }
    }
  }
  var sizeElement = goog.dom.createDom("span", {"style":"visibility:hidden;position:absolute;" + "line-height:0;padding:0;margin:0;border:0;height:1em;"});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);
  return fontSize
};
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.split(/\s*:\s*/);
    if(keyValue.length == 2) {
      result[goog.string.toCamelCase(keyValue[0].toLowerCase())] = keyValue[1]
    }
  });
  return result
};
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.string.toSelectorCase(key), ":", value, ";")
  });
  return buffer.join("")
};
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] = value
};
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] || ""
};
goog.style.getScrollbarWidth = function() {
  var mockElement = goog.dom.createElement("div");
  mockElement.style.cssText = "visibility:hidden;overflow:scroll;" + "position:absolute;top:0;width:100px;height:100px";
  goog.dom.appendChild(goog.dom.getDocument().body, mockElement);
  var width = mockElement.offsetWidth - mockElement.clientWidth;
  goog.dom.removeNode(mockElement);
  return width
};
goog.provide("goog.fx.dom");
goog.provide("goog.fx.dom.BgColorTransform");
goog.provide("goog.fx.dom.ColorTransform");
goog.provide("goog.fx.dom.Fade");
goog.provide("goog.fx.dom.FadeIn");
goog.provide("goog.fx.dom.FadeInAndShow");
goog.provide("goog.fx.dom.FadeOut");
goog.provide("goog.fx.dom.FadeOutAndHide");
goog.provide("goog.fx.dom.PredefinedEffect");
goog.provide("goog.fx.dom.Resize");
goog.provide("goog.fx.dom.ResizeHeight");
goog.provide("goog.fx.dom.ResizeWidth");
goog.provide("goog.fx.dom.Scroll");
goog.provide("goog.fx.dom.Slide");
goog.provide("goog.fx.dom.SlideFrom");
goog.provide("goog.fx.dom.Swipe");
goog.require("goog.color");
goog.require("goog.events");
goog.require("goog.fx.Animation");
goog.require("goog.fx.Animation.EventType");
goog.require("goog.style");
goog.fx.dom.PredefinedEffect = function(element, start, end, time, opt_acc) {
  goog.fx.Animation.call(this, start, end, time, opt_acc);
  this.element = element
};
goog.inherits(goog.fx.dom.PredefinedEffect, goog.fx.Animation);
goog.fx.dom.PredefinedEffect.prototype.updateStyle = goog.nullFunction;
goog.fx.dom.PredefinedEffect.prototype.onAnimate = function() {
  this.updateStyle();
  goog.fx.dom.PredefinedEffect.superClass_.onAnimate.call(this)
};
goog.fx.dom.PredefinedEffect.prototype.onEnd = function() {
  this.updateStyle();
  goog.fx.dom.PredefinedEffect.superClass_.onEnd.call(this)
};
goog.fx.dom.PredefinedEffect.prototype.onBegin = function() {
  this.updateStyle();
  goog.fx.dom.PredefinedEffect.superClass_.onBegin.call(this)
};
goog.fx.dom.Slide = function(element, start, end, time, opt_acc) {
  if(start.length != 2 || end.length != 2) {
    throw Error("Start and end points must be 2D");
  }
  goog.fx.dom.PredefinedEffect.apply(this, arguments)
};
goog.inherits(goog.fx.dom.Slide, goog.fx.dom.PredefinedEffect);
goog.fx.dom.Slide.prototype.updateStyle = function() {
  this.element.style.left = Math.round(this.coords[0]) + "px";
  this.element.style.top = Math.round(this.coords[1]) + "px"
};
goog.fx.dom.SlideFrom = function(element, end, time, opt_acc) {
  var start = [element.offsetLeft, element.offsetTop];
  goog.fx.dom.Slide.call(this, element, start, end, time, opt_acc)
};
goog.inherits(goog.fx.dom.SlideFrom, goog.fx.dom.Slide);
goog.fx.dom.SlideFrom.prototype.onBegin = function() {
  this.startPoint = [this.element.offsetLeft, this.element.offsetTop];
  goog.fx.dom.SlideFrom.superClass_.onBegin.call(this)
};
goog.fx.dom.Swipe = function(element, start, end, time, opt_acc) {
  if(start.length != 2 || end.length != 2) {
    throw Error("Start and end points must be 2D");
  }
  goog.fx.dom.PredefinedEffect.apply(this, arguments);
  this.maxWidth_ = Math.max(this.endPoint[0], this.startPoint[0]);
  this.maxHeight_ = Math.max(this.endPoint[1], this.startPoint[1])
};
goog.inherits(goog.fx.dom.Swipe, goog.fx.dom.PredefinedEffect);
goog.fx.dom.Swipe.prototype.updateStyle = function() {
  var x = this.coords[0];
  var y = this.coords[1];
  this.clip_(Math.round(x), Math.round(y), this.maxWidth_, this.maxHeight_);
  this.element.style.width = Math.round(x) + "px";
  this.element.style.marginLeft = Math.round(x) - this.maxWidth_ + "px";
  this.element.style.marginTop = Math.round(y) - this.maxHeight_ + "px"
};
goog.fx.dom.Swipe.prototype.clip_ = function(x, y, w, h) {
  this.element.style.clip = "rect(" + (h - y) + "px " + w + "px " + h + "px " + (w - x) + "px)"
};
goog.fx.dom.Scroll = function(element, start, end, time, opt_acc) {
  if(start.length != 2 || end.length != 2) {
    throw Error("Start and end points must be 2D");
  }
  goog.fx.dom.PredefinedEffect.apply(this, arguments)
};
goog.inherits(goog.fx.dom.Scroll, goog.fx.dom.PredefinedEffect);
goog.fx.dom.Scroll.prototype.updateStyle = function() {
  this.element.scrollLeft = Math.round(this.coords[0]);
  this.element.scrollTop = Math.round(this.coords[1])
};
goog.fx.dom.Resize = function(element, start, end, time, opt_acc) {
  if(start.length != 2 || end.length != 2) {
    throw Error("Start and end points must be 2D");
  }
  goog.fx.dom.PredefinedEffect.apply(this, arguments)
};
goog.inherits(goog.fx.dom.Resize, goog.fx.dom.PredefinedEffect);
goog.fx.dom.Resize.prototype.updateStyle = function() {
  this.element.style.width = Math.round(this.coords[0]) + "px";
  this.element.style.height = Math.round(this.coords[1]) + "px"
};
goog.fx.dom.ResizeWidth = function(element, start, end, time, opt_acc) {
  goog.fx.dom.PredefinedEffect.call(this, element, [start], [end], time, opt_acc)
};
goog.inherits(goog.fx.dom.ResizeWidth, goog.fx.dom.PredefinedEffect);
goog.fx.dom.ResizeWidth.prototype.updateStyle = function() {
  this.element.style.width = Math.round(this.coords[0]) + "px"
};
goog.fx.dom.ResizeHeight = function(element, start, end, time, opt_acc) {
  goog.fx.dom.PredefinedEffect.call(this, element, [start], [end], time, opt_acc)
};
goog.inherits(goog.fx.dom.ResizeHeight, goog.fx.dom.PredefinedEffect);
goog.fx.dom.ResizeHeight.prototype.updateStyle = function() {
  this.element.style.height = Math.round(this.coords[0]) + "px"
};
goog.fx.dom.Fade = function(element, start, end, time, opt_acc) {
  if(goog.isNumber(start)) {
    start = [start]
  }
  if(goog.isNumber(end)) {
    end = [end]
  }
  goog.fx.dom.PredefinedEffect.call(this, element, start, end, time, opt_acc);
  if(start.length != 1 || end.length != 1) {
    throw Error("Start and end points must be 1D");
  }
};
goog.inherits(goog.fx.dom.Fade, goog.fx.dom.PredefinedEffect);
goog.fx.dom.Fade.prototype.updateStyle = function() {
  goog.style.setOpacity(this.element, this.coords[0])
};
goog.fx.dom.Fade.prototype.show = function() {
  this.element.style.display = ""
};
goog.fx.dom.Fade.prototype.hide = function() {
  this.element.style.display = "none"
};
goog.fx.dom.FadeOut = function(element, time, opt_acc) {
  goog.fx.dom.Fade.call(this, element, 1, 0, time, opt_acc)
};
goog.inherits(goog.fx.dom.FadeOut, goog.fx.dom.Fade);
goog.fx.dom.FadeIn = function(element, time, opt_acc) {
  goog.fx.dom.Fade.call(this, element, 0, 1, time, opt_acc)
};
goog.inherits(goog.fx.dom.FadeIn, goog.fx.dom.Fade);
goog.fx.dom.FadeOutAndHide = function(element, time, opt_acc) {
  goog.fx.dom.Fade.call(this, element, 1, 0, time, opt_acc)
};
goog.inherits(goog.fx.dom.FadeOutAndHide, goog.fx.dom.Fade);
goog.fx.dom.FadeOutAndHide.prototype.onBegin = function() {
  this.show();
  goog.fx.dom.FadeOutAndHide.superClass_.onBegin.call(this)
};
goog.fx.dom.FadeOutAndHide.prototype.onEnd = function() {
  this.hide();
  goog.fx.dom.FadeOutAndHide.superClass_.onEnd.call(this)
};
goog.fx.dom.FadeInAndShow = function(element, time, opt_acc) {
  goog.fx.dom.Fade.call(this, element, 0, 1, time, opt_acc)
};
goog.inherits(goog.fx.dom.FadeInAndShow, goog.fx.dom.Fade);
goog.fx.dom.FadeInAndShow.prototype.onBegin = function() {
  this.show();
  goog.fx.dom.FadeInAndShow.superClass_.onBegin.call(this)
};
goog.fx.dom.BgColorTransform = function(element, start, end, time, opt_acc) {
  if(start.length != 3 || end.length != 3) {
    throw Error("Start and end points must be 3D");
  }
  goog.fx.dom.PredefinedEffect.apply(this, arguments)
};
goog.inherits(goog.fx.dom.BgColorTransform, goog.fx.dom.PredefinedEffect);
goog.fx.dom.BgColorTransform.prototype.setColor = function() {
  var coordsAsInts = [];
  for(var i = 0;i < this.coords.length;i++) {
    coordsAsInts[i] = Math.round(this.coords[i])
  }
  var color = "rgb(" + coordsAsInts.join(",") + ")";
  this.element.style.backgroundColor = color
};
goog.fx.dom.BgColorTransform.prototype.updateStyle = function() {
  this.setColor()
};
goog.fx.dom.bgColorFadeIn = function(element, start, time, opt_eventHandler) {
  var initialBgColor = element.style.backgroundColor || "";
  var computedBgColor = goog.style.getBackgroundColor(element);
  var end;
  if(computedBgColor != "transparent" && computedBgColor != "rgba(0, 0, 0, 0)") {
    end = goog.color.hexToRgb(goog.color.parse(computedBgColor).hex)
  }else {
    end = [255, 255, 255]
  }
  var anim = new goog.fx.dom.BgColorTransform(element, start, end, time);
  function setBgColor() {
    element.style.backgroundColor = initialBgColor
  }
  if(opt_eventHandler) {
    opt_eventHandler.listen(anim, goog.fx.Animation.EventType.END, setBgColor)
  }else {
    goog.events.listen(anim, goog.fx.Animation.EventType.END, setBgColor)
  }
  anim.play()
};
goog.fx.dom.ColorTransform = function(element, start, end, time, opt_acc) {
  if(start.length != 3 || end.length != 3) {
    throw Error("Start and end points must be 3D");
  }
  goog.fx.dom.PredefinedEffect.apply(this, arguments)
};
goog.inherits(goog.fx.dom.ColorTransform, goog.fx.dom.PredefinedEffect);
goog.fx.dom.ColorTransform.prototype.updateStyle = function() {
  var coordsAsInts = [];
  for(var i = 0;i < this.coords.length;i++) {
    coordsAsInts[i] = Math.round(this.coords[i])
  }
  var color = "rgb(" + coordsAsInts.join(",") + ")";
  this.element.style.color = color
};
goog.provide("goog.messaging.MessageChannel");
goog.messaging.MessageChannel = function() {
};
goog.messaging.MessageChannel.prototype.connect = function(opt_connectCb) {
};
goog.messaging.MessageChannel.prototype.isConnected = function() {
};
goog.messaging.MessageChannel.prototype.registerService = function(serviceName, callback, opt_objectPayload) {
};
goog.messaging.MessageChannel.prototype.registerDefaultService = function(callback) {
};
goog.messaging.MessageChannel.prototype.send = function(serviceName, payload) {
};
goog.provide("goog.net.xpc");
goog.provide("goog.net.xpc.CfgFields");
goog.provide("goog.net.xpc.ChannelStates");
goog.provide("goog.net.xpc.TransportNames");
goog.provide("goog.net.xpc.TransportTypes");
goog.provide("goog.net.xpc.UriCfgFields");
goog.require("goog.debug.Logger");
goog.net.xpc.TransportTypes = {NATIVE_MESSAGING:1, FRAME_ELEMENT_METHOD:2, IFRAME_RELAY:3, IFRAME_POLLING:4, FLASH:5, NIX:6};
goog.net.xpc.TransportNames = {1:"NativeMessagingTransport", 2:"FrameElementMethodTransport", 3:"IframeRelayTransport", 4:"IframePollingTransport", 5:"FlashTransport", 6:"NixTransport"};
goog.net.xpc.CfgFields = {CHANNEL_NAME:"cn", AUTH_TOKEN:"at", REMOTE_AUTH_TOKEN:"rat", PEER_URI:"pu", IFRAME_ID:"ifrid", TRANSPORT:"tp", LOCAL_RELAY_URI:"lru", PEER_RELAY_URI:"pru", LOCAL_POLL_URI:"lpu", PEER_POLL_URI:"ppu", PEER_HOSTNAME:"ph"};
goog.net.xpc.UriCfgFields = [goog.net.xpc.CfgFields.PEER_URI, goog.net.xpc.CfgFields.LOCAL_RELAY_URI, goog.net.xpc.CfgFields.PEER_RELAY_URI, goog.net.xpc.CfgFields.LOCAL_POLL_URI, goog.net.xpc.CfgFields.PEER_POLL_URI];
goog.net.xpc.ChannelStates = {NOT_CONNECTED:1, CONNECTED:2, CLOSED:3};
goog.net.xpc.TRANSPORT_SERVICE_ = "tp";
goog.net.xpc.SETUP = "SETUP";
goog.net.xpc.SETUP_ACK_ = "SETUP_ACK";
goog.net.xpc.channels_ = {};
goog.net.xpc.getRandomString = function(length, opt_characters) {
  var chars = opt_characters || goog.net.xpc.randomStringCharacters_;
  var charsLength = chars.length;
  var s = "";
  while(length-- > 0) {
    s += chars.charAt(Math.floor(Math.random() * charsLength))
  }
  return s
};
goog.net.xpc.randomStringCharacters_ = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
goog.net.xpc.logger = goog.debug.Logger.getLogger("goog.net.xpc");
goog.provide("goog.Uri");
goog.provide("goog.Uri.QueryData");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs");
goog.require("goog.structs.Map");
goog.require("goog.uri.utils");
goog.require("goog.uri.utils.ComponentIndex");
goog.Uri = function(opt_uri, opt_ignoreCase) {
  var m;
  if(opt_uri instanceof goog.Uri) {
    this.setIgnoreCase(opt_ignoreCase == null ? opt_uri.getIgnoreCase() : opt_ignoreCase);
    this.setScheme(opt_uri.getScheme());
    this.setUserInfo(opt_uri.getUserInfo());
    this.setDomain(opt_uri.getDomain());
    this.setPort(opt_uri.getPort());
    this.setPath(opt_uri.getPath());
    this.setQueryData(opt_uri.getQueryData().clone());
    this.setFragment(opt_uri.getFragment())
  }else {
    if(opt_uri && (m = goog.uri.utils.split(String(opt_uri)))) {
      this.setIgnoreCase(!!opt_ignoreCase);
      this.setScheme(m[goog.uri.utils.ComponentIndex.SCHEME] || "", true);
      this.setUserInfo(m[goog.uri.utils.ComponentIndex.USER_INFO] || "", true);
      this.setDomain(m[goog.uri.utils.ComponentIndex.DOMAIN] || "", true);
      this.setPort(m[goog.uri.utils.ComponentIndex.PORT]);
      this.setPath(m[goog.uri.utils.ComponentIndex.PATH] || "", true);
      this.setQuery(m[goog.uri.utils.ComponentIndex.QUERY_DATA] || "", true);
      this.setFragment(m[goog.uri.utils.ComponentIndex.FRAGMENT] || "", true)
    }else {
      this.setIgnoreCase(!!opt_ignoreCase);
      this.queryData_ = new goog.Uri.QueryData(null, this, this.ignoreCase_)
    }
  }
};
goog.Uri.RANDOM_PARAM = goog.uri.utils.StandardQueryParam.RANDOM;
goog.Uri.prototype.scheme_ = "";
goog.Uri.prototype.userInfo_ = "";
goog.Uri.prototype.domain_ = "";
goog.Uri.prototype.port_ = null;
goog.Uri.prototype.path_ = "";
goog.Uri.prototype.queryData_;
goog.Uri.prototype.fragment_ = "";
goog.Uri.prototype.isReadOnly_ = false;
goog.Uri.prototype.ignoreCase_ = false;
goog.Uri.prototype.toString = function() {
  if(this.cachedToString_) {
    return this.cachedToString_
  }
  var out = [];
  if(this.scheme_) {
    out.push(goog.Uri.encodeSpecialChars_(this.scheme_, goog.Uri.reDisallowedInSchemeOrUserInfo_), ":")
  }
  if(this.domain_) {
    out.push("//");
    if(this.userInfo_) {
      out.push(goog.Uri.encodeSpecialChars_(this.userInfo_, goog.Uri.reDisallowedInSchemeOrUserInfo_), "@")
    }
    out.push(goog.Uri.encodeString_(this.domain_));
    if(this.port_ != null) {
      out.push(":", String(this.getPort()))
    }
  }
  if(this.path_) {
    if(this.hasDomain() && this.path_.charAt(0) != "/") {
      out.push("/")
    }
    out.push(goog.Uri.encodeSpecialChars_(this.path_, goog.Uri.reDisallowedInPath_))
  }
  var query = String(this.queryData_);
  if(query) {
    out.push("?", query)
  }
  if(this.fragment_) {
    out.push("#", goog.Uri.encodeSpecialChars_(this.fragment_, goog.Uri.reDisallowedInFragment_))
  }
  return this.cachedToString_ = out.join("")
};
goog.Uri.prototype.resolve = function(relativeUri) {
  var absoluteUri = this.clone();
  var overridden = relativeUri.hasScheme();
  if(overridden) {
    absoluteUri.setScheme(relativeUri.getScheme())
  }else {
    overridden = relativeUri.hasUserInfo()
  }
  if(overridden) {
    absoluteUri.setUserInfo(relativeUri.getUserInfo())
  }else {
    overridden = relativeUri.hasDomain()
  }
  if(overridden) {
    absoluteUri.setDomain(relativeUri.getDomain())
  }else {
    overridden = relativeUri.hasPort()
  }
  var path = relativeUri.getPath();
  if(overridden) {
    absoluteUri.setPort(relativeUri.getPort())
  }else {
    overridden = relativeUri.hasPath();
    if(overridden) {
      if(path.charAt(0) != "/") {
        if(this.hasDomain() && !this.hasPath()) {
          path = "/" + path
        }else {
          var lastSlashIndex = absoluteUri.getPath().lastIndexOf("/");
          if(lastSlashIndex != -1) {
            path = absoluteUri.getPath().substr(0, lastSlashIndex + 1) + path
          }
        }
      }
      path = goog.Uri.removeDotSegments(path)
    }
  }
  if(overridden) {
    absoluteUri.setPath(path)
  }else {
    overridden = relativeUri.hasQuery()
  }
  if(overridden) {
    absoluteUri.setQuery(relativeUri.getDecodedQuery())
  }else {
    overridden = relativeUri.hasFragment()
  }
  if(overridden) {
    absoluteUri.setFragment(relativeUri.getFragment())
  }
  return absoluteUri
};
goog.Uri.prototype.clone = function() {
  return goog.Uri.create(this.scheme_, this.userInfo_, this.domain_, this.port_, this.path_, this.queryData_.clone(), this.fragment_, this.ignoreCase_)
};
goog.Uri.prototype.getScheme = function() {
  return this.scheme_
};
goog.Uri.prototype.setScheme = function(newScheme, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.scheme_ = opt_decode ? goog.Uri.decodeOrEmpty_(newScheme) : newScheme;
  if(this.scheme_) {
    this.scheme_ = this.scheme_.replace(/:$/, "")
  }
  return this
};
goog.Uri.prototype.hasScheme = function() {
  return!!this.scheme_
};
goog.Uri.prototype.getUserInfo = function() {
  return this.userInfo_
};
goog.Uri.prototype.setUserInfo = function(newUserInfo, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.userInfo_ = opt_decode ? goog.Uri.decodeOrEmpty_(newUserInfo) : newUserInfo;
  return this
};
goog.Uri.prototype.hasUserInfo = function() {
  return!!this.userInfo_
};
goog.Uri.prototype.getDomain = function() {
  return this.domain_
};
goog.Uri.prototype.setDomain = function(newDomain, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.domain_ = opt_decode ? goog.Uri.decodeOrEmpty_(newDomain) : newDomain;
  return this
};
goog.Uri.prototype.hasDomain = function() {
  return!!this.domain_
};
goog.Uri.prototype.getPort = function() {
  return this.port_
};
goog.Uri.prototype.setPort = function(newPort) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  if(newPort) {
    newPort = Number(newPort);
    if(isNaN(newPort) || newPort < 0) {
      throw Error("Bad port number " + newPort);
    }
    this.port_ = newPort
  }else {
    this.port_ = null
  }
  return this
};
goog.Uri.prototype.hasPort = function() {
  return this.port_ != null
};
goog.Uri.prototype.getPath = function() {
  return this.path_
};
goog.Uri.prototype.setPath = function(newPath, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.path_ = opt_decode ? goog.Uri.decodeOrEmpty_(newPath) : newPath;
  return this
};
goog.Uri.prototype.hasPath = function() {
  return!!this.path_
};
goog.Uri.prototype.hasQuery = function() {
  return this.queryData_.toString() !== ""
};
goog.Uri.prototype.setQueryData = function(queryData, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  if(queryData instanceof goog.Uri.QueryData) {
    this.queryData_ = queryData;
    this.queryData_.uri_ = this;
    this.queryData_.setIgnoreCase(this.ignoreCase_)
  }else {
    if(!opt_decode) {
      queryData = goog.Uri.encodeSpecialChars_(queryData, goog.Uri.reDisallowedInQuery_)
    }
    this.queryData_ = new goog.Uri.QueryData(queryData, this, this.ignoreCase_)
  }
  return this
};
goog.Uri.prototype.setQuery = function(newQuery, opt_decode) {
  return this.setQueryData(newQuery, opt_decode)
};
goog.Uri.prototype.getEncodedQuery = function() {
  return this.queryData_.toString()
};
goog.Uri.prototype.getDecodedQuery = function() {
  return this.queryData_.toDecodedString()
};
goog.Uri.prototype.getQueryData = function() {
  return this.queryData_
};
goog.Uri.prototype.getQuery = function() {
  return this.getEncodedQuery()
};
goog.Uri.prototype.setParameterValue = function(key, value) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.queryData_.set(key, value);
  return this
};
goog.Uri.prototype.setParameterValues = function(key, values) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  if(!goog.isArray(values)) {
    values = [String(values)]
  }
  this.queryData_.setValues(key, values);
  return this
};
goog.Uri.prototype.getParameterValues = function(name) {
  return this.queryData_.getValues(name)
};
goog.Uri.prototype.getParameterValue = function(paramName) {
  return this.queryData_.get(paramName)
};
goog.Uri.prototype.getFragment = function() {
  return this.fragment_
};
goog.Uri.prototype.setFragment = function(newFragment, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.fragment_ = opt_decode ? goog.Uri.decodeOrEmpty_(newFragment) : newFragment;
  return this
};
goog.Uri.prototype.hasFragment = function() {
  return!!this.fragment_
};
goog.Uri.prototype.hasSameDomainAs = function(uri2) {
  return(!this.hasDomain() && !uri2.hasDomain() || this.getDomain() == uri2.getDomain()) && (!this.hasPort() && !uri2.hasPort() || this.getPort() == uri2.getPort())
};
goog.Uri.prototype.makeUnique = function() {
  this.enforceReadOnly();
  this.setParameterValue(goog.Uri.RANDOM_PARAM, goog.string.getRandomString());
  return this
};
goog.Uri.prototype.removeParameter = function(key) {
  this.enforceReadOnly();
  this.queryData_.remove(key);
  return this
};
goog.Uri.prototype.setReadOnly = function(isReadOnly) {
  this.isReadOnly_ = isReadOnly;
  return this
};
goog.Uri.prototype.isReadOnly = function() {
  return this.isReadOnly_
};
goog.Uri.prototype.enforceReadOnly = function() {
  if(this.isReadOnly_) {
    throw Error("Tried to modify a read-only Uri");
  }
};
goog.Uri.prototype.setIgnoreCase = function(ignoreCase) {
  this.ignoreCase_ = ignoreCase;
  if(this.queryData_) {
    this.queryData_.setIgnoreCase(ignoreCase)
  }
  return this
};
goog.Uri.prototype.getIgnoreCase = function() {
  return this.ignoreCase_
};
goog.Uri.parse = function(uri, opt_ignoreCase) {
  return uri instanceof goog.Uri ? uri.clone() : new goog.Uri(uri, opt_ignoreCase)
};
goog.Uri.create = function(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_query, opt_fragment, opt_ignoreCase) {
  var uri = new goog.Uri(null, opt_ignoreCase);
  opt_scheme && uri.setScheme(opt_scheme);
  opt_userInfo && uri.setUserInfo(opt_userInfo);
  opt_domain && uri.setDomain(opt_domain);
  opt_port && uri.setPort(opt_port);
  opt_path && uri.setPath(opt_path);
  opt_query && uri.setQueryData(opt_query);
  opt_fragment && uri.setFragment(opt_fragment);
  return uri
};
goog.Uri.resolve = function(base, rel) {
  if(!(base instanceof goog.Uri)) {
    base = goog.Uri.parse(base)
  }
  if(!(rel instanceof goog.Uri)) {
    rel = goog.Uri.parse(rel)
  }
  return base.resolve(rel)
};
goog.Uri.removeDotSegments = function(path) {
  if(path == ".." || path == ".") {
    return""
  }else {
    if(!goog.string.contains(path, "./") && !goog.string.contains(path, "/.")) {
      return path
    }else {
      var leadingSlash = goog.string.startsWith(path, "/");
      var segments = path.split("/");
      var out = [];
      for(var pos = 0;pos < segments.length;) {
        var segment = segments[pos++];
        if(segment == ".") {
          if(leadingSlash && pos == segments.length) {
            out.push("")
          }
        }else {
          if(segment == "..") {
            if(out.length > 1 || out.length == 1 && out[0] != "") {
              out.pop()
            }
            if(leadingSlash && pos == segments.length) {
              out.push("")
            }
          }else {
            out.push(segment);
            leadingSlash = true
          }
        }
      }
      return out.join("/")
    }
  }
};
goog.Uri.decodeOrEmpty_ = function(val) {
  return val ? decodeURIComponent(val) : ""
};
goog.Uri.encodeString_ = function(unescapedPart) {
  if(goog.isString(unescapedPart)) {
    return encodeURIComponent(unescapedPart)
  }
  return null
};
goog.Uri.encodeSpecialRegExp_ = /^[a-zA-Z0-9\-_.!~*'():\/;?]*$/;
goog.Uri.encodeSpecialChars_ = function(unescapedPart, extra) {
  var ret = null;
  if(goog.isString(unescapedPart)) {
    ret = unescapedPart;
    if(!goog.Uri.encodeSpecialRegExp_.test(ret)) {
      ret = encodeURI(unescapedPart)
    }
    if(ret.search(extra) >= 0) {
      ret = ret.replace(extra, goog.Uri.encodeChar_)
    }
  }
  return ret
};
goog.Uri.encodeChar_ = function(ch) {
  var n = ch.charCodeAt(0);
  return"%" + (n >> 4 & 15).toString(16) + (n & 15).toString(16)
};
goog.Uri.reDisallowedInSchemeOrUserInfo_ = /[#\/\?@]/g;
goog.Uri.reDisallowedInPath_ = /[\#\?]/g;
goog.Uri.reDisallowedInQuery_ = /[\#\?@]/g;
goog.Uri.reDisallowedInFragment_ = /#/g;
goog.Uri.haveSameDomain = function(uri1String, uri2String) {
  var pieces1 = goog.uri.utils.split(uri1String);
  var pieces2 = goog.uri.utils.split(uri2String);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT]
};
goog.Uri.QueryData = function(opt_query, opt_uri, opt_ignoreCase) {
  this.encodedQuery_ = opt_query || null;
  this.uri_ = opt_uri || null;
  this.ignoreCase_ = !!opt_ignoreCase
};
goog.Uri.QueryData.prototype.ensureKeyMapInitialized_ = function() {
  if(!this.keyMap_) {
    this.keyMap_ = new goog.structs.Map;
    if(this.encodedQuery_) {
      var pairs = this.encodedQuery_.split("&");
      for(var i = 0;i < pairs.length;i++) {
        var indexOfEquals = pairs[i].indexOf("=");
        var name = null;
        var value = null;
        if(indexOfEquals >= 0) {
          name = pairs[i].substring(0, indexOfEquals);
          value = pairs[i].substring(indexOfEquals + 1)
        }else {
          name = pairs[i]
        }
        name = goog.string.urlDecode(name);
        name = this.getKeyName_(name);
        this.add(name, value ? goog.string.urlDecode(value) : "")
      }
    }
  }
};
goog.Uri.QueryData.createFromMap = function(map, opt_uri, opt_ignoreCase) {
  var keys = goog.structs.getKeys(map);
  if(typeof keys == "undefined") {
    throw Error("Keys are undefined");
  }
  return goog.Uri.QueryData.createFromKeysValues(keys, goog.structs.getValues(map), opt_uri, opt_ignoreCase)
};
goog.Uri.QueryData.createFromKeysValues = function(keys, values, opt_uri, opt_ignoreCase) {
  if(keys.length != values.length) {
    throw Error("Mismatched lengths for keys/values");
  }
  var queryData = new goog.Uri.QueryData(null, opt_uri, opt_ignoreCase);
  for(var i = 0;i < keys.length;i++) {
    queryData.add(keys[i], values[i])
  }
  return queryData
};
goog.Uri.QueryData.prototype.keyMap_ = null;
goog.Uri.QueryData.prototype.count_ = null;
goog.Uri.QueryData.decodedQuery_ = null;
goog.Uri.QueryData.prototype.getCount = function() {
  this.ensureKeyMapInitialized_();
  return this.count_
};
goog.Uri.QueryData.prototype.add = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  if(!this.containsKey(key)) {
    this.keyMap_.set(key, value)
  }else {
    var current = this.keyMap_.get(key);
    if(goog.isArray(current)) {
      current.push(value)
    }else {
      this.keyMap_.set(key, [current, value])
    }
  }
  this.count_++;
  return this
};
goog.Uri.QueryData.prototype.remove = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  if(this.keyMap_.containsKey(key)) {
    this.invalidateCache_();
    var old = this.keyMap_.get(key);
    if(goog.isArray(old)) {
      this.count_ -= old.length
    }else {
      this.count_--
    }
    return this.keyMap_.remove(key)
  }
  return false
};
goog.Uri.QueryData.prototype.clear = function() {
  this.invalidateCache_();
  if(this.keyMap_) {
    this.keyMap_.clear()
  }
  this.count_ = 0
};
goog.Uri.QueryData.prototype.isEmpty = function() {
  this.ensureKeyMapInitialized_();
  return this.count_ == 0
};
goog.Uri.QueryData.prototype.containsKey = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  return this.keyMap_.containsKey(key)
};
goog.Uri.QueryData.prototype.containsValue = function(value) {
  var vals = this.getValues();
  return goog.array.contains(vals, value)
};
goog.Uri.QueryData.prototype.getKeys = function() {
  this.ensureKeyMapInitialized_();
  var vals = this.keyMap_.getValues();
  var keys = this.keyMap_.getKeys();
  var rv = [];
  for(var i = 0;i < keys.length;i++) {
    var val = vals[i];
    if(goog.isArray(val)) {
      for(var j = 0;j < val.length;j++) {
        rv.push(keys[i])
      }
    }else {
      rv.push(keys[i])
    }
  }
  return rv
};
goog.Uri.QueryData.prototype.getValues = function(opt_key) {
  this.ensureKeyMapInitialized_();
  var rv;
  if(opt_key) {
    var key = this.getKeyName_(opt_key);
    if(this.containsKey(key)) {
      var value = this.keyMap_.get(key);
      if(goog.isArray(value)) {
        return value
      }else {
        rv = [];
        rv.push(value)
      }
    }else {
      rv = []
    }
  }else {
    var vals = this.keyMap_.getValues();
    rv = [];
    for(var i = 0;i < vals.length;i++) {
      var val = vals[i];
      if(goog.isArray(val)) {
        goog.array.extend(rv, val)
      }else {
        rv.push(val)
      }
    }
  }
  return rv
};
goog.Uri.QueryData.prototype.set = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  if(this.containsKey(key)) {
    var old = this.keyMap_.get(key);
    if(goog.isArray(old)) {
      this.count_ -= old.length
    }else {
      this.count_--
    }
  }
  this.keyMap_.set(key, value);
  this.count_++;
  return this
};
goog.Uri.QueryData.prototype.get = function(key, opt_default) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  if(this.containsKey(key)) {
    var val = this.keyMap_.get(key);
    if(goog.isArray(val)) {
      return val[0]
    }else {
      return val
    }
  }else {
    return opt_default
  }
};
goog.Uri.QueryData.prototype.setValues = function(key, values) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  if(this.containsKey(key)) {
    var old = this.keyMap_.get(key);
    if(goog.isArray(old)) {
      this.count_ -= old.length
    }else {
      this.count_--
    }
  }
  if(values.length > 0) {
    this.keyMap_.set(key, values);
    this.count_ += values.length
  }
};
goog.Uri.QueryData.prototype.toString = function() {
  if(this.encodedQuery_) {
    return this.encodedQuery_
  }
  if(!this.keyMap_) {
    return""
  }
  var sb = [];
  var count = 0;
  var keys = this.keyMap_.getKeys();
  for(var i = 0;i < keys.length;i++) {
    var key = keys[i];
    var encodedKey = goog.string.urlEncode(key);
    var val = this.keyMap_.get(key);
    if(goog.isArray(val)) {
      for(var j = 0;j < val.length;j++) {
        if(count > 0) {
          sb.push("&")
        }
        sb.push(encodedKey);
        if(val[j] !== "") {
          sb.push("=", goog.string.urlEncode(val[j]))
        }
        count++
      }
    }else {
      if(count > 0) {
        sb.push("&")
      }
      sb.push(encodedKey);
      if(val !== "") {
        sb.push("=", goog.string.urlEncode(val))
      }
      count++
    }
  }
  return this.encodedQuery_ = sb.join("")
};
goog.Uri.QueryData.prototype.toDecodedString = function() {
  if(!this.decodedQuery_) {
    this.decodedQuery_ = goog.Uri.decodeOrEmpty_(this.toString())
  }
  return this.decodedQuery_
};
goog.Uri.QueryData.prototype.invalidateCache_ = function() {
  delete this.decodedQuery_;
  delete this.encodedQuery_;
  if(this.uri_) {
    delete this.uri_.cachedToString_
  }
};
goog.Uri.QueryData.prototype.filterKeys = function(keys) {
  this.ensureKeyMapInitialized_();
  goog.structs.forEach(this.keyMap_, function(value, key, map) {
    if(!goog.array.contains(keys, key)) {
      this.remove(key)
    }
  }, this);
  return this
};
goog.Uri.QueryData.prototype.clone = function() {
  var rv = new goog.Uri.QueryData;
  if(this.decodedQuery_) {
    rv.decodedQuery_ = this.decodedQuery_
  }
  if(this.encodedQuery_) {
    rv.encodedQuery_ = this.encodedQuery_
  }
  if(this.keyMap_) {
    rv.keyMap_ = this.keyMap_.clone()
  }
  return rv
};
goog.Uri.QueryData.prototype.getKeyName_ = function(arg) {
  var keyName = String(arg);
  if(this.ignoreCase_) {
    keyName = keyName.toLowerCase()
  }
  return keyName
};
goog.Uri.QueryData.prototype.setIgnoreCase = function(ignoreCase) {
  var resetKeys = ignoreCase && !this.ignoreCase_;
  if(resetKeys) {
    this.ensureKeyMapInitialized_();
    this.invalidateCache_();
    goog.structs.forEach(this.keyMap_, function(value, key, map) {
      var lowerCase = key.toLowerCase();
      if(key != lowerCase) {
        this.remove(key);
        this.add(lowerCase, value)
      }
    }, this)
  }
  this.ignoreCase_ = ignoreCase
};
goog.Uri.QueryData.prototype.extend = function(var_args) {
  for(var i = 0;i < arguments.length;i++) {
    var data = arguments[i];
    goog.structs.forEach(data, function(value, key) {
      this.add(key, value)
    }, this)
  }
};
goog.provide("goog.net.xpc.Transport");
goog.require("goog.Disposable");
goog.require("goog.net.xpc");
goog.net.xpc.Transport = function(opt_domHelper) {
  goog.Disposable.call(this);
  this.domHelper_ = opt_domHelper || goog.dom.getDomHelper()
};
goog.inherits(goog.net.xpc.Transport, goog.Disposable);
goog.net.xpc.Transport.prototype.transportType = 0;
goog.net.xpc.Transport.prototype.getType = function() {
  return this.transportType
};
goog.net.xpc.Transport.prototype.getWindow = function() {
  return this.domHelper_.getWindow()
};
goog.net.xpc.Transport.prototype.getName = function() {
  return goog.net.xpc.TransportNames[this.transportType] || ""
};
goog.net.xpc.Transport.prototype.transportServiceHandler = goog.abstractMethod;
goog.net.xpc.Transport.prototype.connect = goog.abstractMethod;
goog.net.xpc.Transport.prototype.send = goog.abstractMethod;
goog.provide("goog.net.xpc.FrameElementMethodTransport");
goog.require("goog.net.xpc");
goog.require("goog.net.xpc.Transport");
goog.net.xpc.FrameElementMethodTransport = function(channel, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.channel_ = channel;
  this.queue_ = [];
  this.deliverQueuedCb_ = goog.bind(this.deliverQueued_, this)
};
goog.inherits(goog.net.xpc.FrameElementMethodTransport, goog.net.xpc.Transport);
goog.net.xpc.FrameElementMethodTransport.prototype.transportType = goog.net.xpc.TransportTypes.FRAME_ELEMENT_METHOD;
goog.net.xpc.FrameElementMethodTransport.prototype.recursive_ = false;
goog.net.xpc.FrameElementMethodTransport.prototype.timer_ = 0;
goog.net.xpc.FrameElementMethodTransport.outgoing_ = null;
goog.net.xpc.FrameElementMethodTransport.prototype.connect = function() {
  if(this.channel_.getRole() == goog.net.xpc.CrossPageChannel.Role.OUTER) {
    this.iframeElm_ = this.channel_.iframeElement_;
    this.iframeElm_["XPC_toOuter"] = goog.bind(this.incoming_, this)
  }else {
    this.attemptSetup_()
  }
};
goog.net.xpc.FrameElementMethodTransport.prototype.attemptSetup_ = function() {
  var retry = true;
  try {
    if(!this.iframeElm_) {
      this.iframeElm_ = this.getWindow().frameElement
    }
    if(this.iframeElm_ && this.iframeElm_["XPC_toOuter"]) {
      this.outgoing_ = this.iframeElm_["XPC_toOuter"];
      this.iframeElm_["XPC_toOuter"]["XPC_toInner"] = goog.bind(this.incoming_, this);
      retry = false;
      this.send(goog.net.xpc.TRANSPORT_SERVICE_, goog.net.xpc.SETUP_ACK_);
      this.channel_.notifyConnected_()
    }
  }catch(e) {
    goog.net.xpc.logger.severe("exception caught while attempting setup: " + e)
  }
  if(retry) {
    if(!this.attemptSetupCb_) {
      this.attemptSetupCb_ = goog.bind(this.attemptSetup_, this)
    }
    this.getWindow().setTimeout(this.attemptSetupCb_, 100)
  }
};
goog.net.xpc.FrameElementMethodTransport.prototype.transportServiceHandler = function(payload) {
  if(this.channel_.getRole() == goog.net.xpc.CrossPageChannel.Role.OUTER && !this.channel_.isConnected() && payload == goog.net.xpc.SETUP_ACK_) {
    this.outgoing_ = this.iframeElm_["XPC_toOuter"]["XPC_toInner"];
    this.channel_.notifyConnected_()
  }else {
    throw Error("Got unexpected transport message.");
  }
};
goog.net.xpc.FrameElementMethodTransport.prototype.incoming_ = function(serviceName, payload) {
  if(!this.recursive_ && this.queue_.length == 0) {
    this.channel_.deliver_(serviceName, payload)
  }else {
    this.queue_.push({serviceName:serviceName, payload:payload});
    if(this.queue_.length == 1) {
      this.timer_ = this.getWindow().setTimeout(this.deliverQueuedCb_, 1)
    }
  }
};
goog.net.xpc.FrameElementMethodTransport.prototype.deliverQueued_ = function() {
  while(this.queue_.length) {
    var msg = this.queue_.shift();
    this.channel_.deliver_(msg.serviceName, msg.payload)
  }
};
goog.net.xpc.FrameElementMethodTransport.prototype.send = function(service, payload) {
  this.recursive_ = true;
  this.outgoing_(service, payload);
  this.recursive_ = false
};
goog.net.xpc.FrameElementMethodTransport.prototype.disposeInternal = function() {
  goog.net.xpc.FrameElementMethodTransport.superClass_.disposeInternal.call(this);
  this.outgoing_ = null;
  this.iframeElm_ = null
};
goog.provide("goog.Delay");
goog.provide("goog.async.Delay");
goog.require("goog.Disposable");
goog.require("goog.Timer");
goog.async.Delay = function(listener, opt_interval, opt_handler) {
  goog.Disposable.call(this);
  this.listener_ = listener;
  this.interval_ = opt_interval || 0;
  this.handler_ = opt_handler;
  this.callback_ = goog.bind(this.doAction_, this)
};
goog.inherits(goog.async.Delay, goog.Disposable);
goog.Delay = goog.async.Delay;
goog.async.Delay.prototype.id_ = 0;
goog.async.Delay.prototype.disposeInternal = function() {
  goog.async.Delay.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.listener_;
  delete this.handler_
};
goog.async.Delay.prototype.start = function(opt_interval) {
  this.stop();
  this.id_ = goog.Timer.callOnce(this.callback_, goog.isDef(opt_interval) ? opt_interval : this.interval_)
};
goog.async.Delay.prototype.stop = function() {
  if(this.isActive()) {
    goog.Timer.clear(this.id_)
  }
  this.id_ = 0
};
goog.async.Delay.prototype.fire = function() {
  this.stop();
  this.doAction_()
};
goog.async.Delay.prototype.fireIfActive = function() {
  if(this.isActive()) {
    this.fire()
  }
};
goog.async.Delay.prototype.isActive = function() {
  return this.id_ != 0
};
goog.async.Delay.prototype.doAction_ = function() {
  this.id_ = 0;
  if(this.listener_) {
    this.listener_.call(this.handler_)
  }
};
goog.provide("goog.net.xpc.NixTransport");
goog.require("goog.net.xpc");
goog.require("goog.net.xpc.Transport");
goog.net.xpc.NixTransport = function(channel, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.channel_ = channel;
  this.authToken_ = channel[goog.net.xpc.CfgFields.AUTH_TOKEN] || "";
  this.remoteAuthToken_ = channel[goog.net.xpc.CfgFields.REMOTE_AUTH_TOKEN] || "";
  goog.net.xpc.NixTransport.conductGlobalSetup_(this.getWindow());
  this[goog.net.xpc.NixTransport.NIX_HANDLE_MESSAGE] = this.handleMessage_;
  this[goog.net.xpc.NixTransport.NIX_CREATE_CHANNEL] = this.createChannel_
};
goog.inherits(goog.net.xpc.NixTransport, goog.net.xpc.Transport);
goog.net.xpc.NixTransport.NIX_WRAPPER = "GCXPC____NIXVBS_wrapper";
goog.net.xpc.NixTransport.NIX_GET_WRAPPER = "GCXPC____NIXVBS_get_wrapper";
goog.net.xpc.NixTransport.NIX_HANDLE_MESSAGE = "GCXPC____NIXJS_handle_message";
goog.net.xpc.NixTransport.NIX_CREATE_CHANNEL = "GCXPC____NIXJS_create_channel";
goog.net.xpc.NixTransport.NIX_ID_FIELD = "GCXPC____NIXVBS_container";
goog.net.xpc.NixTransport.conductGlobalSetup_ = function(listenWindow) {
  if(listenWindow["nix_setup_complete"]) {
    return
  }
  var vbscript = "Class " + goog.net.xpc.NixTransport.NIX_WRAPPER + "\n " + "Private m_Transport\n" + "Private m_Auth\n" + "Public Sub SetTransport(transport)\n" + "If isEmpty(m_Transport) Then\n" + "Set m_Transport = transport\n" + "End If\n" + "End Sub\n" + "Public Sub SetAuth(auth)\n" + "If isEmpty(m_Auth) Then\n" + "m_Auth = auth\n" + "End If\n" + "End Sub\n" + "Public Function GetAuthToken()\n " + "GetAuthToken = m_Auth\n" + "End Function\n" + "Public Sub SendMessage(service, payload)\n " + 
  "Call m_Transport." + goog.net.xpc.NixTransport.NIX_HANDLE_MESSAGE + "(service, payload)\n" + "End Sub\n" + "Public Sub CreateChannel(channel)\n " + "Call m_Transport." + goog.net.xpc.NixTransport.NIX_CREATE_CHANNEL + "(channel)\n" + "End Sub\n" + "Public Sub " + goog.net.xpc.NixTransport.NIX_ID_FIELD + "()\n " + "End Sub\n" + "End Class\n " + "Function " + goog.net.xpc.NixTransport.NIX_GET_WRAPPER + "(transport, auth)\n" + "Dim wrap\n" + "Set wrap = New " + goog.net.xpc.NixTransport.NIX_WRAPPER + 
  "\n" + "wrap.SetTransport transport\n" + "wrap.SetAuth auth\n" + "Set " + goog.net.xpc.NixTransport.NIX_GET_WRAPPER + " = wrap\n" + "End Function";
  try {
    listenWindow.execScript(vbscript, "vbscript");
    listenWindow["nix_setup_complete"] = true
  }catch(e) {
    goog.net.xpc.logger.severe("exception caught while attempting global setup: " + e)
  }
};
goog.net.xpc.NixTransport.prototype.transportType = goog.net.xpc.TransportTypes.NIX;
goog.net.xpc.NixTransport.prototype.localSetupCompleted_ = false;
goog.net.xpc.NixTransport.prototype.nixChannel_ = null;
goog.net.xpc.NixTransport.prototype.connect = function() {
  if(this.channel_.getRole() == goog.net.xpc.CrossPageChannel.Role.OUTER) {
    this.attemptOuterSetup_()
  }else {
    this.attemptInnerSetup_()
  }
};
goog.net.xpc.NixTransport.prototype.attemptOuterSetup_ = function() {
  if(this.localSetupCompleted_) {
    return
  }
  var innerFrame = this.channel_.iframeElement_;
  try {
    innerFrame.contentWindow.opener = this.getWindow()[goog.net.xpc.NixTransport.NIX_GET_WRAPPER](this, this.authToken_);
    this.localSetupCompleted_ = true
  }catch(e) {
    goog.net.xpc.logger.severe("exception caught while attempting setup: " + e)
  }
  if(!this.localSetupCompleted_) {
    this.getWindow().setTimeout(goog.bind(this.attemptOuterSetup_, this), 100)
  }
};
goog.net.xpc.NixTransport.prototype.attemptInnerSetup_ = function() {
  if(this.localSetupCompleted_) {
    return
  }
  try {
    var opener = this.getWindow().opener;
    if(opener && goog.net.xpc.NixTransport.NIX_ID_FIELD in opener) {
      this.nixChannel_ = opener;
      var remoteAuthToken = this.nixChannel_["GetAuthToken"]();
      if(remoteAuthToken != this.remoteAuthToken_) {
        goog.net.xpc.logger.severe("Invalid auth token from other party");
        return
      }
      this.nixChannel_["CreateChannel"](this.getWindow()[goog.net.xpc.NixTransport.NIX_GET_WRAPPER](this, this.authToken_));
      this.localSetupCompleted_ = true;
      this.channel_.notifyConnected_()
    }
  }catch(e) {
    goog.net.xpc.logger.severe("exception caught while attempting setup: " + e);
    return
  }
  if(!this.localSetupCompleted_) {
    this.getWindow().setTimeout(goog.bind(this.attemptInnerSetup_, this), 100)
  }
};
goog.net.xpc.NixTransport.prototype.createChannel_ = function(channel) {
  if(typeof channel != "unknown" || !(goog.net.xpc.NixTransport.NIX_ID_FIELD in channel)) {
    goog.net.xpc.logger.severe("Invalid NIX channel given to createChannel_")
  }
  this.nixChannel_ = channel;
  var remoteAuthToken = this.nixChannel_["GetAuthToken"]();
  if(remoteAuthToken != this.remoteAuthToken_) {
    goog.net.xpc.logger.severe("Invalid auth token from other party");
    return
  }
  this.channel_.notifyConnected_()
};
goog.net.xpc.NixTransport.prototype.handleMessage_ = function(serviceName, payload) {
  function deliveryHandler() {
    this.channel_.deliver_(serviceName, payload)
  }
  this.getWindow().setTimeout(goog.bind(deliveryHandler, this), 1)
};
goog.net.xpc.NixTransport.prototype.send = function(service, payload) {
  if(typeof this.nixChannel_ !== "unknown") {
    goog.net.xpc.logger.severe("NIX channel not connected")
  }
  this.nixChannel_["SendMessage"](service, payload)
};
goog.net.xpc.NixTransport.prototype.disposeInternal = function() {
  goog.base(this, "disposeInternal");
  this.nixChannel_ = null
};
goog.provide("goog.net.xpc.IframePollingTransport");
goog.provide("goog.net.xpc.IframePollingTransport.Receiver");
goog.provide("goog.net.xpc.IframePollingTransport.Sender");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.net.xpc");
goog.require("goog.net.xpc.Transport");
goog.require("goog.userAgent");
goog.net.xpc.IframePollingTransport = function(channel, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.channel_ = channel;
  this.sendUri_ = this.channel_.cfg_[goog.net.xpc.CfgFields.PEER_POLL_URI];
  this.rcvUri_ = this.channel_.cfg_[goog.net.xpc.CfgFields.LOCAL_POLL_URI];
  this.sendQueue_ = []
};
goog.inherits(goog.net.xpc.IframePollingTransport, goog.net.xpc.Transport);
goog.net.xpc.IframePollingTransport.prototype.transportType = goog.net.xpc.TransportTypes.IFRAME_POLLING;
goog.net.xpc.IframePollingTransport.prototype.sequence_ = 0;
goog.net.xpc.IframePollingTransport.prototype.waitForAck_ = false;
goog.net.xpc.IframePollingTransport.prototype.initialized_ = false;
goog.net.xpc.IframePollingTransport.IFRAME_PREFIX = "googlexpc";
goog.net.xpc.IframePollingTransport.prototype.getMsgFrameName_ = function() {
  return goog.net.xpc.IframePollingTransport.IFRAME_PREFIX + "_" + this.channel_.name + "_msg"
};
goog.net.xpc.IframePollingTransport.prototype.getAckFrameName_ = function() {
  return goog.net.xpc.IframePollingTransport.IFRAME_PREFIX + "_" + this.channel_.name + "_ack"
};
goog.net.xpc.IframePollingTransport.prototype.connect = function() {
  goog.net.xpc.logger.fine("transport connect called");
  if(!this.initialized_) {
    goog.net.xpc.logger.fine("initializing...");
    this.constructSenderFrames_();
    this.initialized_ = true
  }
  this.checkForeignFramesReady_()
};
goog.net.xpc.IframePollingTransport.prototype.constructSenderFrames_ = function() {
  var name = this.getMsgFrameName_();
  this.msgIframeElm_ = this.constructSenderFrame_(name);
  this.msgWinObj_ = this.getWindow().frames[name];
  name = this.getAckFrameName_();
  this.ackIframeElm_ = this.constructSenderFrame_(name);
  this.ackWinObj_ = this.getWindow().frames[name]
};
goog.net.xpc.IframePollingTransport.prototype.constructSenderFrame_ = function(id) {
  goog.net.xpc.logger.finest("constructing sender frame: " + id);
  var ifr = goog.dom.createElement("iframe");
  var s = ifr.style;
  s.position = "absolute";
  s.top = "-10px";
  s.left = "10px";
  s.width = "1px";
  s.height = "1px";
  ifr.id = ifr.name = id;
  ifr.src = this.sendUri_ + "#INITIAL";
  this.getWindow().document.body.appendChild(ifr);
  return ifr
};
goog.net.xpc.IframePollingTransport.prototype.innerPeerReconnect_ = function() {
  goog.net.xpc.logger.finest("innerPeerReconnect called");
  this.channel_.name = goog.net.xpc.getRandomString(10);
  goog.net.xpc.logger.finest("switching channels: " + this.channel_.name);
  this.deconstructSenderFrames_();
  this.initialized_ = false;
  this.reconnectFrame_ = this.constructSenderFrame_(goog.net.xpc.IframePollingTransport.IFRAME_PREFIX + "_reconnect_" + this.channel_.name)
};
goog.net.xpc.IframePollingTransport.prototype.outerPeerReconnect_ = function() {
  goog.net.xpc.logger.finest("outerPeerReconnect called");
  var frames = this.channel_.peerWindowObject_.frames;
  var length = frames.length;
  for(var i = 0;i < length;i++) {
    var frameName;
    try {
      if(frames[i] && frames[i].name) {
        frameName = frames[i].name
      }
    }catch(e) {
    }
    if(!frameName) {
      continue
    }
    var message = frameName.split("_");
    if(message.length == 3 && message[0] == goog.net.xpc.IframePollingTransport.IFRAME_PREFIX && message[1] == "reconnect") {
      this.channel_.name = message[2];
      this.deconstructSenderFrames_();
      this.initialized_ = false;
      break
    }
  }
};
goog.net.xpc.IframePollingTransport.prototype.deconstructSenderFrames_ = function() {
  goog.net.xpc.logger.finest("deconstructSenderFrames called");
  if(this.msgIframeElm_) {
    this.msgIframeElm_.parentNode.removeChild(this.msgIframeElm_);
    this.msgIframeElm_ = null;
    this.msgWinObj_ = null
  }
  if(this.ackIframeElm_) {
    this.ackIframeElm_.parentNode.removeChild(this.ackIframeElm_);
    this.ackIframeElm_ = null;
    this.ackWinObj_ = null
  }
};
goog.net.xpc.IframePollingTransport.prototype.checkForeignFramesReady_ = function() {
  if(!(this.isRcvFrameReady_(this.getMsgFrameName_()) && this.isRcvFrameReady_(this.getAckFrameName_()))) {
    goog.net.xpc.logger.finest("foreign frames not (yet) present");
    if(this.channel_.getRole() == goog.net.xpc.CrossPageChannel.Role.INNER && !this.reconnectFrame_) {
      this.innerPeerReconnect_()
    }else {
      if(this.channel_.getRole() == goog.net.xpc.CrossPageChannel.Role.OUTER) {
        this.outerPeerReconnect_()
      }
    }
    this.getWindow().setTimeout(goog.bind(this.connect, this), 100)
  }else {
    goog.net.xpc.logger.fine("foreign frames present");
    this.msgReceiver_ = new goog.net.xpc.IframePollingTransport.Receiver(this, this.channel_.peerWindowObject_.frames[this.getMsgFrameName_()], goog.bind(this.processIncomingMsg, this));
    this.ackReceiver_ = new goog.net.xpc.IframePollingTransport.Receiver(this, this.channel_.peerWindowObject_.frames[this.getAckFrameName_()], goog.bind(this.processIncomingAck, this));
    this.checkLocalFramesPresent_()
  }
};
goog.net.xpc.IframePollingTransport.prototype.isRcvFrameReady_ = function(frameName) {
  goog.net.xpc.logger.finest("checking for receive frame: " + frameName);
  try {
    var winObj = this.channel_.peerWindowObject_.frames[frameName];
    if(!winObj || winObj.location.href.indexOf(this.rcvUri_) != 0) {
      return false
    }
  }catch(e) {
    return false
  }
  return true
};
goog.net.xpc.IframePollingTransport.prototype.checkLocalFramesPresent_ = function() {
  var frames = this.channel_.peerWindowObject_.frames;
  if(!(frames[this.getAckFrameName_()] && frames[this.getMsgFrameName_()])) {
    if(!this.checkLocalFramesPresentCb_) {
      this.checkLocalFramesPresentCb_ = goog.bind(this.checkLocalFramesPresent_, this)
    }
    this.getWindow().setTimeout(this.checkLocalFramesPresentCb_, 100);
    goog.net.xpc.logger.fine("local frames not (yet) present")
  }else {
    this.msgSender_ = new goog.net.xpc.IframePollingTransport.Sender(this.sendUri_, this.msgWinObj_);
    this.ackSender_ = new goog.net.xpc.IframePollingTransport.Sender(this.sendUri_, this.ackWinObj_);
    goog.net.xpc.logger.fine("local frames ready");
    this.getWindow().setTimeout(goog.bind(function() {
      this.msgSender_.send(goog.net.xpc.SETUP);
      this.sentConnectionSetup_ = true;
      this.waitForAck_ = true;
      goog.net.xpc.logger.fine("SETUP sent")
    }, this), 100)
  }
};
goog.net.xpc.IframePollingTransport.prototype.checkIfConnected_ = function() {
  if(this.sentConnectionSetupAck_ && this.rcvdConnectionSetupAck_) {
    this.channel_.notifyConnected_();
    if(this.deliveryQueue_) {
      goog.net.xpc.logger.fine("delivering queued messages " + "(" + this.deliveryQueue_.length + ")");
      for(var i = 0, m;i < this.deliveryQueue_.length;i++) {
        m = this.deliveryQueue_[i];
        this.channel_.deliver_(m.service, m.payload)
      }
      delete this.deliveryQueue_
    }
  }else {
    goog.net.xpc.logger.finest("checking if connected: " + "ack sent:" + this.sentConnectionSetupAck_ + ", ack rcvd: " + this.rcvdConnectionSetupAck_)
  }
};
goog.net.xpc.IframePollingTransport.prototype.processIncomingMsg = function(raw) {
  goog.net.xpc.logger.finest("msg received: " + raw);
  if(raw == goog.net.xpc.SETUP) {
    if(!this.ackSender_) {
      return
    }
    this.ackSender_.send(goog.net.xpc.SETUP_ACK_);
    goog.net.xpc.logger.finest("SETUP_ACK sent");
    this.sentConnectionSetupAck_ = true;
    this.checkIfConnected_()
  }else {
    if(this.channel_.isConnected() || this.sentConnectionSetupAck_) {
      var pos = raw.indexOf("|");
      var head = raw.substring(0, pos);
      var frame = raw.substring(pos + 1);
      pos = head.indexOf(",");
      if(pos == -1) {
        var seq = head;
        this.ackSender_.send("ACK:" + seq);
        this.deliverPayload_(frame)
      }else {
        var seq = head.substring(0, pos);
        this.ackSender_.send("ACK:" + seq);
        var partInfo = head.substring(pos + 1).split("/");
        var part0 = parseInt(partInfo[0], 10);
        var part1 = parseInt(partInfo[1], 10);
        if(part0 == 1) {
          this.parts_ = []
        }
        this.parts_.push(frame);
        if(part0 == part1) {
          this.deliverPayload_(this.parts_.join(""));
          delete this.parts_
        }
      }
    }else {
      goog.net.xpc.logger.warning("received msg, but channel is not connected")
    }
  }
};
goog.net.xpc.IframePollingTransport.prototype.processIncomingAck = function(msgStr) {
  goog.net.xpc.logger.finest("ack received: " + msgStr);
  if(msgStr == goog.net.xpc.SETUP_ACK_) {
    this.waitForAck_ = false;
    this.rcvdConnectionSetupAck_ = true;
    this.checkIfConnected_()
  }else {
    if(this.channel_.isConnected()) {
      if(!this.waitForAck_) {
        goog.net.xpc.logger.warning("got unexpected ack");
        return
      }
      var seq = parseInt(msgStr.split(":")[1], 10);
      if(seq == this.sequence_) {
        this.waitForAck_ = false;
        this.sendNextFrame_()
      }else {
        goog.net.xpc.logger.warning("got ack with wrong sequence")
      }
    }else {
      goog.net.xpc.logger.warning("received ack, but channel not connected")
    }
  }
};
goog.net.xpc.IframePollingTransport.prototype.sendNextFrame_ = function() {
  if(this.waitForAck_ || !this.sendQueue_.length) {
    return
  }
  var s = this.sendQueue_.shift();
  ++this.sequence_;
  this.msgSender_.send(this.sequence_ + s);
  goog.net.xpc.logger.finest("msg sent: " + this.sequence_ + s);
  this.waitForAck_ = true
};
goog.net.xpc.IframePollingTransport.prototype.deliverPayload_ = function(s) {
  var pos = s.indexOf(":");
  var service = s.substr(0, pos);
  var payload = s.substring(pos + 1);
  if(!this.channel_.isConnected()) {
    (this.deliveryQueue_ || (this.deliveryQueue_ = [])).push({service:service, payload:payload});
    goog.net.xpc.logger.finest("queued delivery")
  }else {
    this.channel_.deliver_(service, payload)
  }
};
goog.net.xpc.IframePollingTransport.prototype.MAX_FRAME_LENGTH_ = 3800;
goog.net.xpc.IframePollingTransport.prototype.send = function(service, payload) {
  var frame = service + ":" + payload;
  if(!goog.userAgent.IE || payload.length <= this.MAX_FRAME_LENGTH_) {
    this.sendQueue_.push("|" + frame)
  }else {
    var l = payload.length;
    var num = Math.ceil(l / this.MAX_FRAME_LENGTH_);
    var pos = 0;
    var i = 1;
    while(pos < l) {
      this.sendQueue_.push("," + i + "/" + num + "|" + frame.substr(pos, this.MAX_FRAME_LENGTH_));
      i++;
      pos += this.MAX_FRAME_LENGTH_
    }
  }
  this.sendNextFrame_()
};
goog.net.xpc.IframePollingTransport.prototype.disposeInternal = function() {
  goog.base(this, "disposeInternal");
  var receivers = goog.net.xpc.IframePollingTransport.receivers_;
  goog.array.remove(receivers, this.msgReceiver_);
  goog.array.remove(receivers, this.ackReceiver_);
  this.msgReceiver_ = this.ackReceiver_ = null;
  goog.dom.removeNode(this.msgIframeElm_);
  goog.dom.removeNode(this.ackIframeElm_);
  this.msgIframeElm_ = this.ackIframeElm_ = null;
  this.msgWinObj_ = this.ackWinObj_ = null
};
goog.net.xpc.IframePollingTransport.receivers_ = [];
goog.net.xpc.IframePollingTransport.TIME_POLL_SHORT_ = 10;
goog.net.xpc.IframePollingTransport.TIME_POLL_LONG_ = 100;
goog.net.xpc.IframePollingTransport.TIME_SHORT_POLL_AFTER_ACTIVITY_ = 1E3;
goog.net.xpc.IframePollingTransport.receive_ = function() {
  var rcvd = false;
  try {
    for(var i = 0, l = goog.net.xpc.IframePollingTransport.receivers_.length;i < l;i++) {
      rcvd = rcvd || goog.net.xpc.IframePollingTransport.receivers_[i].receive()
    }
  }catch(e) {
    goog.net.xpc.logger.info("receive_() failed: " + e);
    goog.net.xpc.IframePollingTransport.receivers_[i].transport_.channel_.notifyTransportError_();
    if(!goog.net.xpc.IframePollingTransport.receivers_.length) {
      return
    }
  }
  var now = goog.now();
  if(rcvd) {
    goog.net.xpc.IframePollingTransport.lastActivity_ = now
  }
  var t = now - goog.net.xpc.IframePollingTransport.lastActivity_ < goog.net.xpc.IframePollingTransport.TIME_SHORT_POLL_AFTER_ACTIVITY_ ? goog.net.xpc.IframePollingTransport.TIME_POLL_SHORT_ : goog.net.xpc.IframePollingTransport.TIME_POLL_LONG_;
  goog.net.xpc.IframePollingTransport.rcvTimer_ = window.setTimeout(goog.net.xpc.IframePollingTransport.receiveCb_, t)
};
goog.net.xpc.IframePollingTransport.receiveCb_ = goog.bind(goog.net.xpc.IframePollingTransport.receive_, goog.net.xpc.IframePollingTransport);
goog.net.xpc.IframePollingTransport.startRcvTimer_ = function() {
  goog.net.xpc.logger.fine("starting receive-timer");
  goog.net.xpc.IframePollingTransport.lastActivity_ = goog.now();
  if(goog.net.xpc.IframePollingTransport.rcvTimer_) {
    window.clearTimeout(goog.net.xpc.IframePollingTransport.rcvTimer_)
  }
  goog.net.xpc.IframePollingTransport.rcvTimer_ = window.setTimeout(goog.net.xpc.IframePollingTransport.receiveCb_, goog.net.xpc.IframePollingTransport.TIME_POLL_SHORT_)
};
goog.net.xpc.IframePollingTransport.Sender = function(url, windowObj) {
  this.sendUri_ = url;
  this.sendFrame_ = windowObj;
  this.cycle_ = 0
};
goog.net.xpc.IframePollingTransport.Sender.prototype.send = function(payload) {
  this.cycle_ = ++this.cycle_ % 2;
  var url = this.sendUri_ + "#" + this.cycle_ + encodeURIComponent(payload);
  try {
    if(goog.userAgent.WEBKIT) {
      this.sendFrame_.location.href = url
    }else {
      this.sendFrame_.location.replace(url)
    }
  }catch(e) {
    goog.net.xpc.logger.severe("sending failed", e)
  }
  goog.net.xpc.IframePollingTransport.startRcvTimer_()
};
goog.net.xpc.IframePollingTransport.Receiver = function(transport, windowObj, callback) {
  this.transport_ = transport;
  this.rcvFrame_ = windowObj;
  this.cb_ = callback;
  this.currentLoc_ = this.rcvFrame_.location.href.split("#")[0] + "#INITIAL";
  goog.net.xpc.IframePollingTransport.receivers_.push(this);
  goog.net.xpc.IframePollingTransport.startRcvTimer_()
};
goog.net.xpc.IframePollingTransport.Receiver.prototype.receive = function() {
  var loc = this.rcvFrame_.location.href;
  if(loc != this.currentLoc_) {
    this.currentLoc_ = loc;
    var payload = loc.split("#")[1];
    if(payload) {
      payload = payload.substr(1);
      this.cb_(decodeURIComponent(payload))
    }
    return true
  }else {
    return false
  }
};
goog.provide("goog.messaging.AbstractChannel");
goog.require("goog.Disposable");
goog.require("goog.debug");
goog.require("goog.debug.Logger");
goog.require("goog.json");
goog.require("goog.messaging.MessageChannel");
goog.messaging.AbstractChannel = function() {
  goog.base(this);
  this.services_ = {}
};
goog.inherits(goog.messaging.AbstractChannel, goog.Disposable);
goog.messaging.AbstractChannel.prototype.defaultService_;
goog.messaging.AbstractChannel.prototype.logger = goog.debug.Logger.getLogger("goog.messaging.AbstractChannel");
goog.messaging.AbstractChannel.prototype.connect = function(opt_connectCb) {
  if(opt_connectCb) {
    opt_connectCb()
  }
};
goog.messaging.AbstractChannel.prototype.isConnected = function() {
  return true
};
goog.messaging.AbstractChannel.prototype.registerService = function(serviceName, callback, opt_objectPayload) {
  this.services_[serviceName] = {callback:callback, objectPayload:!!opt_objectPayload}
};
goog.messaging.AbstractChannel.prototype.registerDefaultService = function(callback) {
  this.defaultService_ = callback
};
goog.messaging.AbstractChannel.prototype.send = goog.abstractMethod;
goog.messaging.AbstractChannel.prototype.deliver = function(serviceName, payload) {
  var service = this.getService(serviceName, payload);
  if(!service) {
    return
  }
  payload = this.decodePayload(serviceName, payload, service.objectPayload);
  if(goog.isDefAndNotNull(payload)) {
    service.callback(payload)
  }
};
goog.messaging.AbstractChannel.prototype.getService = function(serviceName, payload) {
  var service = this.services_[serviceName];
  if(service) {
    return service
  }else {
    if(this.defaultService_) {
      var callback = goog.partial(this.defaultService_, serviceName);
      var objectPayload = goog.isObject(payload);
      return{callback:callback, objectPayload:objectPayload}
    }
  }
  this.logger.warning('Unknown service name "' + serviceName + '"');
  return null
};
goog.messaging.AbstractChannel.prototype.decodePayload = function(serviceName, payload, objectPayload) {
  if(objectPayload && goog.isString(payload)) {
    try {
      return goog.json.parse(payload)
    }catch(err) {
      this.logger.warning("Expected JSON payload for " + serviceName + ', was "' + payload + '"');
      return null
    }
  }else {
    if(!objectPayload && !goog.isString(payload)) {
      return goog.json.serialize(payload)
    }
  }
  return payload
};
goog.messaging.AbstractChannel.prototype.disposeInternal = function() {
  goog.base(this, "disposeInternal");
  goog.dispose(this.logger);
  delete this.logger;
  delete this.services_;
  delete this.defaultService_
};
goog.provide("goog.functions");
goog.functions.constant = function(retValue) {
  return function() {
    return retValue
  }
};
goog.functions.FALSE = goog.functions.constant(false);
goog.functions.TRUE = goog.functions.constant(true);
goog.functions.NULL = goog.functions.constant(null);
goog.functions.identity = function(opt_returnValue, var_args) {
  return opt_returnValue
};
goog.functions.error = function(message) {
  return function() {
    throw Error(message);
  }
};
goog.functions.lock = function(f) {
  return function() {
    return f.call(this)
  }
};
goog.functions.withReturnValue = function(f, retValue) {
  return goog.functions.sequence(f, goog.functions.constant(retValue))
};
goog.functions.compose = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    var result;
    if(length) {
      result = functions[length - 1].apply(this, arguments)
    }
    for(var i = length - 2;i >= 0;i--) {
      result = functions[i].call(this, result)
    }
    return result
  }
};
goog.functions.sequence = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    var result;
    for(var i = 0;i < length;i++) {
      result = functions[i].apply(this, arguments)
    }
    return result
  }
};
goog.functions.and = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    for(var i = 0;i < length;i++) {
      if(!functions[i].apply(this, arguments)) {
        return false
      }
    }
    return true
  }
};
goog.functions.or = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    for(var i = 0;i < length;i++) {
      if(functions[i].apply(this, arguments)) {
        return true
      }
    }
    return false
  }
};
goog.functions.not = function(f) {
  return function() {
    return!f.apply(this, arguments)
  }
};
goog.functions.create = function(constructor, var_args) {
  var temp = function() {
  };
  temp.prototype = constructor.prototype;
  var obj = new temp;
  constructor.apply(obj, Array.prototype.slice.call(arguments, 1));
  return obj
};
/*
 Portions of this code are from the Dojo Toolkit, received by
 The Closure Library Authors under the BSD license. All other code is
 Copyright 2005-2009 The Closure Library Authors. All Rights Reserved.

 The "New" BSD License:

 Copyright (c) 2005-2009, The Dojo Foundation
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.
 Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.
 Neither the name of the Dojo Foundation nor the names of its contributors
 may be used to endorse or promote products derived from this software
 without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE
 FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
goog.provide("goog.dom.query");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.functions");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.query = function() {
  var cssCaseBug = goog.userAgent.WEBKIT && goog.dom.getDocument().compatMode == "BackCompat";
  var childNodesName = !!goog.dom.getDocument().firstChild["children"] ? "children" : "childNodes";
  var specials = ">~+";
  var caseSensitive = false;
  var getQueryParts = function(query) {
    if(specials.indexOf(query.slice(-1)) >= 0) {
      query += " * "
    }else {
      query += " "
    }
    var ts = function(s, e) {
      return goog.string.trim(query.slice(s, e))
    };
    var queryParts = [];
    var inBrackets = -1, inParens = -1, inMatchFor = -1, inPseudo = -1, inClass = -1, inId = -1, inTag = -1, lc = "", cc = "", pStart;
    var x = 0, ql = query.length, currentPart = null, cp = null;
    var endTag = function() {
      if(inTag >= 0) {
        var tv = inTag == x ? null : ts(inTag, x);
        if(specials.indexOf(tv) < 0) {
          currentPart.tag = tv
        }else {
          currentPart.oper = tv
        }
        inTag = -1
      }
    };
    var endId = function() {
      if(inId >= 0) {
        currentPart.id = ts(inId, x).replace(/\\/g, "");
        inId = -1
      }
    };
    var endClass = function() {
      if(inClass >= 0) {
        currentPart.classes.push(ts(inClass + 1, x).replace(/\\/g, ""));
        inClass = -1
      }
    };
    var endAll = function() {
      endId();
      endTag();
      endClass()
    };
    var endPart = function() {
      endAll();
      if(inPseudo >= 0) {
        currentPart.pseudos.push({name:ts(inPseudo + 1, x)})
      }
      currentPart.loops = currentPart.pseudos.length || currentPart.attrs.length || currentPart.classes.length;
      currentPart.oquery = currentPart.query = ts(pStart, x);
      currentPart.otag = currentPart.tag = currentPart.oper ? null : currentPart.tag || "*";
      if(currentPart.tag) {
        currentPart.tag = currentPart.tag.toUpperCase()
      }
      if(queryParts.length && queryParts[queryParts.length - 1].oper) {
        currentPart.infixOper = queryParts.pop();
        currentPart.query = currentPart.infixOper.query + " " + currentPart.query
      }
      queryParts.push(currentPart);
      currentPart = null
    };
    for(;lc = cc, cc = query.charAt(x), x < ql;x++) {
      if(lc == "\\") {
        continue
      }
      if(!currentPart) {
        pStart = x;
        currentPart = {query:null, pseudos:[], attrs:[], classes:[], tag:null, oper:null, id:null, getTag:function() {
          return caseSensitive ? this.otag : this.tag
        }};
        inTag = x
      }
      if(inBrackets >= 0) {
        if(cc == "]") {
          if(!cp.attr) {
            cp.attr = ts(inBrackets + 1, x)
          }else {
            cp.matchFor = ts(inMatchFor || inBrackets + 1, x)
          }
          var cmf = cp.matchFor;
          if(cmf) {
            if(cmf.charAt(0) == '"' || cmf.charAt(0) == "'") {
              cp.matchFor = cmf.slice(1, -1)
            }
          }
          currentPart.attrs.push(cp);
          cp = null;
          inBrackets = inMatchFor = -1
        }else {
          if(cc == "=") {
            var addToCc = "|~^$*".indexOf(lc) >= 0 ? lc : "";
            cp.type = addToCc + cc;
            cp.attr = ts(inBrackets + 1, x - addToCc.length);
            inMatchFor = x + 1
          }
        }
      }else {
        if(inParens >= 0) {
          if(cc == ")") {
            if(inPseudo >= 0) {
              cp.value = ts(inParens + 1, x)
            }
            inPseudo = inParens = -1
          }
        }else {
          if(cc == "#") {
            endAll();
            inId = x + 1
          }else {
            if(cc == ".") {
              endAll();
              inClass = x
            }else {
              if(cc == ":") {
                endAll();
                inPseudo = x
              }else {
                if(cc == "[") {
                  endAll();
                  inBrackets = x;
                  cp = {}
                }else {
                  if(cc == "(") {
                    if(inPseudo >= 0) {
                      cp = {name:ts(inPseudo + 1, x), value:null};
                      currentPart.pseudos.push(cp)
                    }
                    inParens = x
                  }else {
                    if(cc == " " && lc != cc) {
                      endPart()
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return queryParts
  };
  var agree = function(first, second) {
    if(!first) {
      return second
    }
    if(!second) {
      return first
    }
    return function() {
      return first.apply(window, arguments) && second.apply(window, arguments)
    }
  };
  function getArr(i, opt_arr) {
    var r = opt_arr || [];
    if(i) {
      r.push(i)
    }
    return r
  }
  var isElement = function(n) {
    return 1 == n.nodeType
  };
  var blank = "";
  var getAttr = function(elem, attr) {
    if(!elem) {
      return blank
    }
    if(attr == "class") {
      return elem.className || blank
    }
    if(attr == "for") {
      return elem.htmlFor || blank
    }
    if(attr == "style") {
      return elem.style.cssText || blank
    }
    return(caseSensitive ? elem.getAttribute(attr) : elem.getAttribute(attr, 2)) || blank
  };
  var attrs = {"*=":function(attr, value) {
    return function(elem) {
      return getAttr(elem, attr).indexOf(value) >= 0
    }
  }, "^=":function(attr, value) {
    return function(elem) {
      return getAttr(elem, attr).indexOf(value) == 0
    }
  }, "$=":function(attr, value) {
    var tval = " " + value;
    return function(elem) {
      var ea = " " + getAttr(elem, attr);
      return ea.lastIndexOf(value) == ea.length - value.length
    }
  }, "~=":function(attr, value) {
    var tval = " " + value + " ";
    return function(elem) {
      var ea = " " + getAttr(elem, attr) + " ";
      return ea.indexOf(tval) >= 0
    }
  }, "|=":function(attr, value) {
    value = " " + value;
    return function(elem) {
      var ea = " " + getAttr(elem, attr);
      return ea == value || ea.indexOf(value + "-") == 0
    }
  }, "=":function(attr, value) {
    return function(elem) {
      return getAttr(elem, attr) == value
    }
  }};
  var noNextElementSibling = typeof goog.dom.getDocument().firstChild.nextElementSibling == "undefined";
  var nSibling = !noNextElementSibling ? "nextElementSibling" : "nextSibling";
  var pSibling = !noNextElementSibling ? "previousElementSibling" : "previousSibling";
  var simpleNodeTest = noNextElementSibling ? isElement : goog.functions.TRUE;
  var _lookLeft = function(node) {
    while(node = node[pSibling]) {
      if(simpleNodeTest(node)) {
        return false
      }
    }
    return true
  };
  var _lookRight = function(node) {
    while(node = node[nSibling]) {
      if(simpleNodeTest(node)) {
        return false
      }
    }
    return true
  };
  var getNodeIndex = function(node) {
    var root = node.parentNode;
    var i = 0, tret = root[childNodesName], ci = node["_i"] || -1, cl = root["_l"] || -1;
    if(!tret) {
      return-1
    }
    var l = tret.length;
    if(cl == l && ci >= 0 && cl >= 0) {
      return ci
    }
    root["_l"] = l;
    ci = -1;
    var te = root["firstElementChild"] || root["firstChild"];
    for(;te;te = te[nSibling]) {
      if(simpleNodeTest(te)) {
        te["_i"] = ++i;
        if(node === te) {
          ci = i
        }
      }
    }
    return ci
  };
  var isEven = function(elem) {
    return!(getNodeIndex(elem) % 2)
  };
  var isOdd = function(elem) {
    return getNodeIndex(elem) % 2
  };
  var pseudos = {"checked":function(name, condition) {
    return function(elem) {
      return elem.checked || elem.attributes["checked"]
    }
  }, "first-child":function() {
    return _lookLeft
  }, "last-child":function() {
    return _lookRight
  }, "only-child":function(name, condition) {
    return function(node) {
      if(!_lookLeft(node)) {
        return false
      }
      if(!_lookRight(node)) {
        return false
      }
      return true
    }
  }, "empty":function(name, condition) {
    return function(elem) {
      var cn = elem.childNodes;
      var cnl = elem.childNodes.length;
      for(var x = cnl - 1;x >= 0;x--) {
        var nt = cn[x].nodeType;
        if(nt === 1 || nt == 3) {
          return false
        }
      }
      return true
    }
  }, "contains":function(name, condition) {
    var cz = condition.charAt(0);
    if(cz == '"' || cz == "'") {
      condition = condition.slice(1, -1)
    }
    return function(elem) {
      return elem.innerHTML.indexOf(condition) >= 0
    }
  }, "not":function(name, condition) {
    var p = getQueryParts(condition)[0];
    var ignores = {el:1};
    if(p.tag != "*") {
      ignores.tag = 1
    }
    if(!p.classes.length) {
      ignores.classes = 1
    }
    var ntf = getSimpleFilterFunc(p, ignores);
    return function(elem) {
      return!ntf(elem)
    }
  }, "nth-child":function(name, condition) {
    function pi(n) {
      return parseInt(n, 10)
    }
    if(condition == "odd") {
      return isOdd
    }else {
      if(condition == "even") {
        return isEven
      }
    }
    if(condition.indexOf("n") != -1) {
      var tparts = condition.split("n", 2);
      var pred = tparts[0] ? tparts[0] == "-" ? -1 : pi(tparts[0]) : 1;
      var idx = tparts[1] ? pi(tparts[1]) : 0;
      var lb = 0, ub = -1;
      if(pred > 0) {
        if(idx < 0) {
          idx = idx % pred && pred + idx % pred
        }else {
          if(idx > 0) {
            if(idx >= pred) {
              lb = idx - idx % pred
            }
            idx = idx % pred
          }
        }
      }else {
        if(pred < 0) {
          pred *= -1;
          if(idx > 0) {
            ub = idx;
            idx = idx % pred
          }
        }
      }
      if(pred > 0) {
        return function(elem) {
          var i = getNodeIndex(elem);
          return i >= lb && (ub < 0 || i <= ub) && i % pred == idx
        }
      }else {
        condition = idx
      }
    }
    var ncount = pi(condition);
    return function(elem) {
      return getNodeIndex(elem) == ncount
    }
  }};
  var defaultGetter = goog.userAgent.IE ? function(cond) {
    var clc = cond.toLowerCase();
    if(clc == "class") {
      cond = "className"
    }
    return function(elem) {
      return caseSensitive ? elem.getAttribute(cond) : elem[cond] || elem[clc]
    }
  } : function(cond) {
    return function(elem) {
      return elem && elem.getAttribute && elem.hasAttribute(cond)
    }
  };
  var getSimpleFilterFunc = function(query, ignores) {
    if(!query) {
      return goog.functions.TRUE
    }
    ignores = ignores || {};
    var ff = null;
    if(!ignores.el) {
      ff = agree(ff, isElement)
    }
    if(!ignores.tag) {
      if(query.tag != "*") {
        ff = agree(ff, function(elem) {
          return elem && elem.tagName == query.getTag()
        })
      }
    }
    if(!ignores.classes) {
      goog.array.forEach(query.classes, function(cname, idx, arr) {
        var re = new RegExp("(?:^|\\s)" + cname + "(?:\\s|$)");
        ff = agree(ff, function(elem) {
          return re.test(elem.className)
        });
        ff.count = idx
      })
    }
    if(!ignores.pseudos) {
      goog.array.forEach(query.pseudos, function(pseudo) {
        var pn = pseudo.name;
        if(pseudos[pn]) {
          ff = agree(ff, pseudos[pn](pn, pseudo.value))
        }
      })
    }
    if(!ignores.attrs) {
      goog.array.forEach(query.attrs, function(attr) {
        var matcher;
        var a = attr.attr;
        if(attr.type && attrs[attr.type]) {
          matcher = attrs[attr.type](a, attr.matchFor)
        }else {
          if(a.length) {
            matcher = defaultGetter(a)
          }
        }
        if(matcher) {
          ff = agree(ff, matcher)
        }
      })
    }
    if(!ignores.id) {
      if(query.id) {
        ff = agree(ff, function(elem) {
          return!!elem && elem.id == query.id
        })
      }
    }
    if(!ff) {
      if(!("default" in ignores)) {
        ff = goog.functions.TRUE
      }
    }
    return ff
  };
  var nextSiblingIterator = function(filterFunc) {
    return function(node, ret, bag) {
      while(node = node[nSibling]) {
        if(noNextElementSibling && !isElement(node)) {
          continue
        }
        if((!bag || _isUnique(node, bag)) && filterFunc(node)) {
          ret.push(node)
        }
        break
      }
      return ret
    }
  };
  var nextSiblingsIterator = function(filterFunc) {
    return function(root, ret, bag) {
      var te = root[nSibling];
      while(te) {
        if(simpleNodeTest(te)) {
          if(bag && !_isUnique(te, bag)) {
            break
          }
          if(filterFunc(te)) {
            ret.push(te)
          }
        }
        te = te[nSibling]
      }
      return ret
    }
  };
  var _childElements = function(filterFunc) {
    filterFunc = filterFunc || goog.functions.TRUE;
    return function(root, ret, bag) {
      var te, x = 0, tret = root[childNodesName];
      while(te = tret[x++]) {
        if(simpleNodeTest(te) && (!bag || _isUnique(te, bag)) && filterFunc(te, x)) {
          ret.push(te)
        }
      }
      return ret
    }
  };
  var _isDescendant = function(node, root) {
    var pn = node.parentNode;
    while(pn) {
      if(pn == root) {
        break
      }
      pn = pn.parentNode
    }
    return!!pn
  };
  var _getElementsFuncCache = {};
  var getElementsFunc = function(query) {
    var retFunc = _getElementsFuncCache[query.query];
    if(retFunc) {
      return retFunc
    }
    var io = query.infixOper;
    var oper = io ? io.oper : "";
    var filterFunc = getSimpleFilterFunc(query, {el:1});
    var qt = query.tag;
    var wildcardTag = "*" == qt;
    var ecs = goog.dom.getDocument()["getElementsByClassName"];
    if(!oper) {
      if(query.id) {
        filterFunc = !query.loops && wildcardTag ? goog.functions.TRUE : getSimpleFilterFunc(query, {el:1, id:1});
        retFunc = function(root, arr) {
          var te = goog.dom.getDomHelper(root).getElement(query.id);
          if(!te || !filterFunc(te)) {
            return
          }
          if(9 == root.nodeType) {
            return getArr(te, arr)
          }else {
            if(_isDescendant(te, root)) {
              return getArr(te, arr)
            }
          }
        }
      }else {
        if(ecs && /\{\s*\[native code\]\s*\}/.test(String(ecs)) && query.classes.length && !cssCaseBug) {
          filterFunc = getSimpleFilterFunc(query, {el:1, classes:1, id:1});
          var classesString = query.classes.join(" ");
          retFunc = function(root, arr) {
            var ret = getArr(0, arr), te, x = 0;
            var tret = root.getElementsByClassName(classesString);
            while(te = tret[x++]) {
              if(filterFunc(te, root)) {
                ret.push(te)
              }
            }
            return ret
          }
        }else {
          if(!wildcardTag && !query.loops) {
            retFunc = function(root, arr) {
              var ret = getArr(0, arr), te, x = 0;
              var tret = root.getElementsByTagName(query.getTag());
              while(te = tret[x++]) {
                ret.push(te)
              }
              return ret
            }
          }else {
            filterFunc = getSimpleFilterFunc(query, {el:1, tag:1, id:1});
            retFunc = function(root, arr) {
              var ret = getArr(0, arr), te, x = 0;
              var tret = root.getElementsByTagName(query.getTag());
              while(te = tret[x++]) {
                if(filterFunc(te, root)) {
                  ret.push(te)
                }
              }
              return ret
            }
          }
        }
      }
    }else {
      var skipFilters = {el:1};
      if(wildcardTag) {
        skipFilters.tag = 1
      }
      filterFunc = getSimpleFilterFunc(query, skipFilters);
      if("+" == oper) {
        retFunc = nextSiblingIterator(filterFunc)
      }else {
        if("~" == oper) {
          retFunc = nextSiblingsIterator(filterFunc)
        }else {
          if(">" == oper) {
            retFunc = _childElements(filterFunc)
          }
        }
      }
    }
    return _getElementsFuncCache[query.query] = retFunc
  };
  var filterDown = function(root, queryParts) {
    var candidates = getArr(root), qp, x, te, qpl = queryParts.length, bag, ret;
    for(var i = 0;i < qpl;i++) {
      ret = [];
      qp = queryParts[i];
      x = candidates.length - 1;
      if(x > 0) {
        bag = {};
        ret.nozip = true
      }
      var gef = getElementsFunc(qp);
      for(var j = 0;te = candidates[j];j++) {
        gef(te, ret, bag)
      }
      if(!ret.length) {
        break
      }
      candidates = ret
    }
    return ret
  };
  var _queryFuncCacheDOM = {}, _queryFuncCacheQSA = {};
  var getStepQueryFunc = function(query) {
    var qparts = getQueryParts(goog.string.trim(query));
    if(qparts.length == 1) {
      var tef = getElementsFunc(qparts[0]);
      return function(root) {
        var r = tef(root, []);
        if(r) {
          r.nozip = true
        }
        return r
      }
    }
    return function(root) {
      return filterDown(root, qparts)
    }
  };
  var qsa = "querySelectorAll";
  var qsaAvail = !!goog.dom.getDocument()[qsa] && (!goog.userAgent.WEBKIT || goog.userAgent.isVersion("526"));
  var getQueryFunc = function(query, opt_forceDOM) {
    if(qsaAvail) {
      var qsaCached = _queryFuncCacheQSA[query];
      if(qsaCached && !opt_forceDOM) {
        return qsaCached
      }
    }
    var domCached = _queryFuncCacheDOM[query];
    if(domCached) {
      return domCached
    }
    var qcz = query.charAt(0);
    var nospace = -1 == query.indexOf(" ");
    if(query.indexOf("#") >= 0 && nospace) {
      opt_forceDOM = true
    }
    var useQSA = qsaAvail && !opt_forceDOM && specials.indexOf(qcz) == -1 && (!goog.userAgent.IE || query.indexOf(":") == -1) && !(cssCaseBug && query.indexOf(".") >= 0) && query.indexOf(":contains") == -1 && query.indexOf("|=") == -1;
    if(useQSA) {
      var tq = specials.indexOf(query.charAt(query.length - 1)) >= 0 ? query + " *" : query;
      return _queryFuncCacheQSA[query] = function(root) {
        try {
          if(!(9 == root.nodeType || nospace)) {
            throw"";
          }
          var r = root[qsa](tq);
          if(goog.userAgent.IE) {
            r.commentStrip = true
          }else {
            r.nozip = true
          }
          return r
        }catch(e) {
          return getQueryFunc(query, true)(root)
        }
      }
    }else {
      var parts = query.split(/\s*,\s*/);
      return _queryFuncCacheDOM[query] = parts.length < 2 ? getStepQueryFunc(query) : function(root) {
        var pindex = 0, ret = [], tp;
        while(tp = parts[pindex++]) {
          ret = ret.concat(getStepQueryFunc(tp)(root))
        }
        return ret
      }
    }
  };
  var _zipIdx = 0;
  var _nodeUID = goog.userAgent.IE ? function(node) {
    if(caseSensitive) {
      return node.getAttribute("_uid") || node.setAttribute("_uid", ++_zipIdx) || _zipIdx
    }else {
      return node.uniqueID
    }
  } : function(node) {
    return node["_uid"] || (node["_uid"] = ++_zipIdx)
  };
  var _isUnique = function(node, bag) {
    if(!bag) {
      return 1
    }
    var id = _nodeUID(node);
    if(!bag[id]) {
      return bag[id] = 1
    }
    return 0
  };
  var _zipIdxName = "_zipIdx";
  var _zip = function(arr) {
    if(arr && arr.nozip) {
      return arr
    }
    var ret = [];
    if(!arr || !arr.length) {
      return ret
    }
    if(arr[0]) {
      ret.push(arr[0])
    }
    if(arr.length < 2) {
      return ret
    }
    _zipIdx++;
    if(goog.userAgent.IE && caseSensitive) {
      var szidx = _zipIdx + "";
      arr[0].setAttribute(_zipIdxName, szidx);
      for(var x = 1, te;te = arr[x];x++) {
        if(arr[x].getAttribute(_zipIdxName) != szidx) {
          ret.push(te)
        }
        te.setAttribute(_zipIdxName, szidx)
      }
    }else {
      if(goog.userAgent.IE && arr.commentStrip) {
        try {
          for(var x = 1, te;te = arr[x];x++) {
            if(isElement(te)) {
              ret.push(te)
            }
          }
        }catch(e) {
        }
      }else {
        if(arr[0]) {
          arr[0][_zipIdxName] = _zipIdx
        }
        for(var x = 1, te;te = arr[x];x++) {
          if(arr[x][_zipIdxName] != _zipIdx) {
            ret.push(te)
          }
          te[_zipIdxName] = _zipIdx
        }
      }
    }
    return ret
  };
  var query = function(query, root) {
    if(!query) {
      return[]
    }
    if(query.constructor == Array) {
      return query
    }
    if(!goog.isString(query)) {
      return[query]
    }
    if(goog.isString(root)) {
      root = goog.dom.getElement(root);
      if(!root) {
        return[]
      }
    }
    root = root || goog.dom.getDocument();
    var od = root.ownerDocument || root.documentElement;
    caseSensitive = root.contentType && root.contentType == "application/xml" || goog.userAgent.OPERA && (root.doctype || od.toString() == "[object XMLDocument]") || !!od && (goog.userAgent.IE ? od.xml : root.xmlVersion || od.xmlVersion);
    var r = getQueryFunc(query)(root);
    if(r && r.nozip) {
      return r
    }
    return _zip(r)
  };
  query.pseudos = pseudos;
  return query
}();
goog.exportSymbol("goog.dom.query", goog.dom.query);
goog.exportSymbol("goog.dom.query.pseudos", goog.dom.query.pseudos);
goog.provide("goog.net.xpc.IframeRelayTransport");
goog.require("goog.dom");
goog.require("goog.events");
goog.require("goog.net.xpc");
goog.require("goog.net.xpc.Transport");
goog.require("goog.userAgent");
goog.net.xpc.IframeRelayTransport = function(channel, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.channel_ = channel;
  this.peerRelayUri_ = this.channel_.cfg_[goog.net.xpc.CfgFields.PEER_RELAY_URI];
  this.peerIframeId_ = this.channel_.cfg_[goog.net.xpc.CfgFields.IFRAME_ID];
  if(goog.userAgent.WEBKIT) {
    goog.net.xpc.IframeRelayTransport.startCleanupTimer_()
  }
};
goog.inherits(goog.net.xpc.IframeRelayTransport, goog.net.xpc.Transport);
if(goog.userAgent.WEBKIT) {
  goog.net.xpc.IframeRelayTransport.iframeRefs_ = [];
  goog.net.xpc.IframeRelayTransport.CLEANUP_INTERVAL_ = 1E3;
  goog.net.xpc.IframeRelayTransport.IFRAME_MAX_AGE_ = 3E3;
  goog.net.xpc.IframeRelayTransport.cleanupTimer_ = 0;
  goog.net.xpc.IframeRelayTransport.startCleanupTimer_ = function() {
    if(!goog.net.xpc.IframeRelayTransport.cleanupTimer_) {
      goog.net.xpc.IframeRelayTransport.cleanupTimer_ = window.setTimeout(function() {
        goog.net.xpc.IframeRelayTransport.cleanup_()
      }, goog.net.xpc.IframeRelayTransport.CLEANUP_INTERVAL_)
    }
  };
  goog.net.xpc.IframeRelayTransport.cleanup_ = function(opt_maxAge) {
    var now = goog.now();
    var maxAge = opt_maxAge || goog.net.xpc.IframeRelayTransport.IFRAME_MAX_AGE_;
    while(goog.net.xpc.IframeRelayTransport.iframeRefs_.length && now - goog.net.xpc.IframeRelayTransport.iframeRefs_[0].timestamp >= maxAge) {
      var ifr = goog.net.xpc.IframeRelayTransport.iframeRefs_.shift().iframeElement;
      goog.dom.removeNode(ifr);
      goog.net.xpc.logger.finest("iframe removed")
    }
    goog.net.xpc.IframeRelayTransport.cleanupTimer_ = window.setTimeout(goog.net.xpc.IframeRelayTransport.cleanupCb_, goog.net.xpc.IframeRelayTransport.CLEANUP_INTERVAL_)
  };
  goog.net.xpc.IframeRelayTransport.cleanupCb_ = function() {
    goog.net.xpc.IframeRelayTransport.cleanup_()
  }
}
goog.net.xpc.IframeRelayTransport.IE_PAYLOAD_MAX_SIZE_ = 1800;
goog.net.xpc.IframeRelayTransport.FragmentInfo;
goog.net.xpc.IframeRelayTransport.fragmentMap_ = {};
goog.net.xpc.IframeRelayTransport.prototype.transportType = goog.net.xpc.TransportTypes.IFRAME_RELAY;
goog.net.xpc.IframeRelayTransport.prototype.connect = function() {
  if(!this.getWindow()["xpcRelay"]) {
    this.getWindow()["xpcRelay"] = goog.net.xpc.IframeRelayTransport.receiveMessage_
  }
  this.send(goog.net.xpc.TRANSPORT_SERVICE_, goog.net.xpc.SETUP)
};
goog.net.xpc.IframeRelayTransport.receiveMessage_ = function(channelName, frame) {
  var pos = frame.indexOf(":");
  var header = frame.substr(0, pos);
  var payload = frame.substr(pos + 1);
  if(!goog.userAgent.IE || (pos = header.indexOf("|")) == -1) {
    var service = header
  }else {
    var service = header.substr(0, pos);
    var fragmentIdStr = header.substr(pos + 1);
    pos = fragmentIdStr.indexOf("+");
    var messageIdStr = fragmentIdStr.substr(0, pos);
    var fragmentNum = parseInt(fragmentIdStr.substr(pos + 1), 10);
    var fragmentInfo = goog.net.xpc.IframeRelayTransport.fragmentMap_[messageIdStr];
    if(!fragmentInfo) {
      fragmentInfo = goog.net.xpc.IframeRelayTransport.fragmentMap_[messageIdStr] = {fragments:[], received:0, expected:0}
    }
    if(goog.string.contains(fragmentIdStr, "++")) {
      fragmentInfo.expected = fragmentNum + 1
    }
    fragmentInfo.fragments[fragmentNum] = payload;
    fragmentInfo.received++;
    if(fragmentInfo.received != fragmentInfo.expected) {
      return
    }
    payload = fragmentInfo.fragments.join("");
    delete goog.net.xpc.IframeRelayTransport.fragmentMap_[messageIdStr]
  }
  goog.net.xpc.channels_[channelName].deliver_(service, decodeURIComponent(payload))
};
goog.net.xpc.IframeRelayTransport.prototype.transportServiceHandler = function(payload) {
  if(payload == goog.net.xpc.SETUP) {
    this.send(goog.net.xpc.TRANSPORT_SERVICE_, goog.net.xpc.SETUP_ACK_);
    this.channel_.notifyConnected_()
  }else {
    if(payload == goog.net.xpc.SETUP_ACK_) {
      this.channel_.notifyConnected_()
    }
  }
};
goog.net.xpc.IframeRelayTransport.prototype.send = function(service, payload) {
  var encodedPayload = encodeURIComponent(payload);
  var encodedLen = encodedPayload.length;
  var maxSize = goog.net.xpc.IframeRelayTransport.IE_PAYLOAD_MAX_SIZE_;
  if(goog.userAgent.IE && encodedLen > maxSize) {
    var messageIdStr = goog.string.getRandomString();
    for(var startIndex = 0, fragmentNum = 0;startIndex < encodedLen;fragmentNum++) {
      var payloadFragment = encodedPayload.substr(startIndex, maxSize);
      startIndex += maxSize;
      var fragmentIdStr = messageIdStr + (startIndex >= encodedLen ? "++" : "+") + fragmentNum;
      this.send_(service, payloadFragment, fragmentIdStr)
    }
  }else {
    this.send_(service, encodedPayload)
  }
};
goog.net.xpc.IframeRelayTransport.prototype.send_ = function(service, encodedPayload, opt_fragmentIdStr) {
  if(goog.userAgent.IE) {
    var div = this.getWindow().document.createElement("div");
    div.innerHTML = '<iframe onload="this.xpcOnload()"></iframe>';
    var ifr = div.childNodes[0];
    div = null;
    ifr["xpcOnload"] = goog.net.xpc.IframeRelayTransport.iframeLoadHandler_
  }else {
    var ifr = this.getWindow().document.createElement("iframe");
    if(goog.userAgent.WEBKIT) {
      goog.net.xpc.IframeRelayTransport.iframeRefs_.push({timestamp:goog.now(), iframeElement:ifr})
    }else {
      goog.events.listen(ifr, "load", goog.net.xpc.IframeRelayTransport.iframeLoadHandler_)
    }
  }
  var style = ifr.style;
  style.visibility = "hidden";
  style.width = ifr.style.height = "0px";
  style.position = "absolute";
  var url = this.peerRelayUri_;
  url += "#" + this.channel_.name;
  if(this.peerIframeId_) {
    url += "," + this.peerIframeId_
  }
  url += "|" + service;
  if(opt_fragmentIdStr) {
    url += "|" + opt_fragmentIdStr
  }
  url += ":" + encodedPayload;
  ifr.src = url;
  this.getWindow().document.body.appendChild(ifr);
  goog.net.xpc.logger.finest("msg sent: " + url)
};
goog.net.xpc.IframeRelayTransport.iframeLoadHandler_ = function() {
  goog.net.xpc.logger.finest("iframe-load");
  goog.dom.removeNode(this);
  this.xpcOnload = null
};
goog.net.xpc.IframeRelayTransport.prototype.disposeInternal = function() {
  goog.base(this, "disposeInternal");
  if(goog.userAgent.WEBKIT) {
    goog.net.xpc.IframeRelayTransport.cleanup_(0)
  }
};
goog.provide("goog.net.xpc.NativeMessagingTransport");
goog.require("goog.events");
goog.require("goog.net.xpc");
goog.require("goog.net.xpc.Transport");
goog.net.xpc.NativeMessagingTransport = function(channel, peerHostname, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.channel_ = channel;
  this.peerHostname_ = peerHostname || "*"
};
goog.inherits(goog.net.xpc.NativeMessagingTransport, goog.net.xpc.Transport);
goog.net.xpc.NativeMessagingTransport.prototype.initialized_ = false;
goog.net.xpc.NativeMessagingTransport.prototype.transportType = goog.net.xpc.TransportTypes.NATIVE_MESSAGING;
goog.net.xpc.NativeMessagingTransport.activeCount_ = {};
goog.net.xpc.NativeMessagingTransport.initialize_ = function(listenWindow) {
  var uid = goog.getUid(listenWindow);
  var value = goog.net.xpc.NativeMessagingTransport.activeCount_[uid];
  if(!goog.isNumber(value)) {
    value = 0
  }
  if(value == 0) {
    goog.events.listen(listenWindow.postMessage ? listenWindow : listenWindow.document, "message", goog.net.xpc.NativeMessagingTransport.messageReceived_, false, goog.net.xpc.NativeMessagingTransport)
  }
  goog.net.xpc.NativeMessagingTransport.activeCount_[uid] = value + 1
};
goog.net.xpc.NativeMessagingTransport.messageReceived_ = function(msgEvt) {
  var data = msgEvt.getBrowserEvent().data;
  var headDelim = data.indexOf("|");
  var serviceDelim = data.indexOf(":");
  if(headDelim == -1 || serviceDelim == -1) {
    return false
  }
  var channelName = data.substring(0, headDelim);
  var service = data.substring(headDelim + 1, serviceDelim);
  var payload = data.substring(serviceDelim + 1);
  goog.net.xpc.logger.fine("messageReceived: channel=" + channelName + ", service=" + service + ", payload=" + payload);
  var channel = goog.net.xpc.channels_[channelName];
  if(channel) {
    channel.deliver_(service, payload, msgEvt.getBrowserEvent().origin);
    return true
  }
  for(var staleChannelName in goog.net.xpc.channels_) {
    var staleChannel = goog.net.xpc.channels_[staleChannelName];
    if(staleChannel.getRole() == goog.net.xpc.CrossPageChannel.Role.INNER && !staleChannel.isConnected() && service == goog.net.xpc.TRANSPORT_SERVICE_ && payload == goog.net.xpc.SETUP) {
      goog.net.xpc.logger.fine("changing channel name to " + channelName);
      staleChannel.name = channelName;
      delete goog.net.xpc.channels_[staleChannelName];
      goog.net.xpc.channels_[channelName] = staleChannel;
      staleChannel.deliver_(service, payload);
      return true
    }
  }
  goog.net.xpc.logger.info('channel name mismatch; message ignored"');
  return false
};
goog.net.xpc.NativeMessagingTransport.prototype.transportServiceHandler = function(payload) {
  switch(payload) {
    case goog.net.xpc.SETUP:
      this.send(goog.net.xpc.TRANSPORT_SERVICE_, goog.net.xpc.SETUP_ACK_);
      break;
    case goog.net.xpc.SETUP_ACK_:
      this.channel_.notifyConnected_();
      break
  }
};
goog.net.xpc.NativeMessagingTransport.prototype.connect = function() {
  goog.net.xpc.NativeMessagingTransport.initialize_(this.getWindow());
  this.initialized_ = true;
  this.connectWithRetries_()
};
goog.net.xpc.NativeMessagingTransport.prototype.connectWithRetries_ = function() {
  if(this.channel_.isConnected() || this.isDisposed()) {
    return
  }
  this.send(goog.net.xpc.TRANSPORT_SERVICE_, goog.net.xpc.SETUP);
  this.getWindow().setTimeout(goog.bind(this.connectWithRetries_, this), 100)
};
goog.net.xpc.NativeMessagingTransport.prototype.send = function(service, payload) {
  var win = this.channel_.peerWindowObject_;
  if(!win) {
    goog.net.xpc.logger.fine("send(): window not ready");
    return
  }
  var obj = win.postMessage ? win : win.document;
  this.send = function(service, payload) {
    goog.net.xpc.logger.fine("send(): payload=" + payload + " to hostname=" + this.peerHostname_);
    obj.postMessage(this.channel_.name + "|" + service + ":" + payload, this.peerHostname_)
  };
  this.send(service, payload)
};
goog.net.xpc.NativeMessagingTransport.prototype.disposeInternal = function() {
  goog.base(this, "disposeInternal");
  if(this.initialized_) {
    var listenWindow = this.getWindow();
    var uid = goog.getUid(listenWindow);
    var value = goog.net.xpc.NativeMessagingTransport.activeCount_[uid];
    goog.net.xpc.NativeMessagingTransport.activeCount_[uid] = value - 1;
    if(value == 1) {
      goog.events.unlisten(listenWindow.postMessage ? listenWindow : listenWindow.document, "message", goog.net.xpc.NativeMessagingTransport.messageReceived_, false, goog.net.xpc.NativeMessagingTransport)
    }
  }
};
goog.provide("goog.net.xpc.CrossPageChannel");
goog.provide("goog.net.xpc.CrossPageChannel.Role");
goog.require("goog.Disposable");
goog.require("goog.Uri");
goog.require("goog.dom");
goog.require("goog.events");
goog.require("goog.json");
goog.require("goog.messaging.AbstractChannel");
goog.require("goog.net.xpc");
goog.require("goog.net.xpc.FrameElementMethodTransport");
goog.require("goog.net.xpc.IframePollingTransport");
goog.require("goog.net.xpc.IframeRelayTransport");
goog.require("goog.net.xpc.NativeMessagingTransport");
goog.require("goog.net.xpc.NixTransport");
goog.require("goog.net.xpc.Transport");
goog.require("goog.userAgent");
goog.net.xpc.CrossPageChannel = function(cfg, opt_domHelper) {
  goog.base(this);
  for(var i = 0, uriField;uriField = goog.net.xpc.UriCfgFields[i];i++) {
    if(uriField in cfg && !/^https?:\/\//.test(cfg[uriField])) {
      throw Error("URI " + cfg[uriField] + " is invalid for field " + uriField);
    }
  }
  this.cfg_ = cfg;
  this.name = this.cfg_[goog.net.xpc.CfgFields.CHANNEL_NAME] || goog.net.xpc.getRandomString(10);
  this.domHelper_ = opt_domHelper || goog.dom.getDomHelper();
  goog.net.xpc.channels_[this.name] = this;
  goog.events.listen(window, "unload", goog.net.xpc.CrossPageChannel.disposeAll_);
  goog.net.xpc.logger.info("CrossPageChannel created: " + this.name)
};
goog.inherits(goog.net.xpc.CrossPageChannel, goog.messaging.AbstractChannel);
goog.net.xpc.CrossPageChannel.TRANSPORT_SERVICE_ESCAPE_RE_ = new RegExp("^%*" + goog.net.xpc.TRANSPORT_SERVICE_ + "$");
goog.net.xpc.CrossPageChannel.TRANSPORT_SERVICE_UNESCAPE_RE_ = new RegExp("^%+" + goog.net.xpc.TRANSPORT_SERVICE_ + "$");
goog.net.xpc.CrossPageChannel.prototype.transport_ = null;
goog.net.xpc.CrossPageChannel.prototype.state_ = goog.net.xpc.ChannelStates.NOT_CONNECTED;
goog.net.xpc.CrossPageChannel.prototype.isConnected = function() {
  return this.state_ == goog.net.xpc.ChannelStates.CONNECTED
};
goog.net.xpc.CrossPageChannel.prototype.peerWindowObject_ = null;
goog.net.xpc.CrossPageChannel.prototype.iframeElement_ = null;
goog.net.xpc.CrossPageChannel.prototype.setPeerWindowObject = function(peerWindowObject) {
  this.peerWindowObject_ = peerWindowObject
};
goog.net.xpc.CrossPageChannel.prototype.determineTransportType_ = function() {
  var transportType;
  if(goog.isFunction(document.postMessage) || goog.isFunction(window.postMessage) || goog.userAgent.IE && window.postMessage) {
    transportType = goog.net.xpc.TransportTypes.NATIVE_MESSAGING
  }else {
    if(goog.userAgent.GECKO) {
      transportType = goog.net.xpc.TransportTypes.FRAME_ELEMENT_METHOD
    }else {
      if(goog.userAgent.IE && this.cfg_[goog.net.xpc.CfgFields.PEER_RELAY_URI]) {
        transportType = goog.net.xpc.TransportTypes.IFRAME_RELAY
      }else {
        if(goog.userAgent.IE) {
          transportType = goog.net.xpc.TransportTypes.NIX
        }else {
          if(this.cfg_[goog.net.xpc.CfgFields.LOCAL_POLL_URI] && this.cfg_[goog.net.xpc.CfgFields.PEER_POLL_URI]) {
            transportType = goog.net.xpc.TransportTypes.IFRAME_POLLING
          }
        }
      }
    }
  }
  return transportType
};
goog.net.xpc.CrossPageChannel.prototype.createTransport_ = function() {
  if(this.transport_) {
    return
  }
  if(!this.cfg_[goog.net.xpc.CfgFields.TRANSPORT]) {
    this.cfg_[goog.net.xpc.CfgFields.TRANSPORT] = this.determineTransportType_()
  }
  switch(this.cfg_[goog.net.xpc.CfgFields.TRANSPORT]) {
    case goog.net.xpc.TransportTypes.NATIVE_MESSAGING:
      this.transport_ = new goog.net.xpc.NativeMessagingTransport(this, this.cfg_[goog.net.xpc.CfgFields.PEER_HOSTNAME], this.domHelper_);
      break;
    case goog.net.xpc.TransportTypes.NIX:
      this.transport_ = new goog.net.xpc.NixTransport(this, this.domHelper_);
      break;
    case goog.net.xpc.TransportTypes.FRAME_ELEMENT_METHOD:
      this.transport_ = new goog.net.xpc.FrameElementMethodTransport(this, this.domHelper_);
      break;
    case goog.net.xpc.TransportTypes.IFRAME_RELAY:
      this.transport_ = new goog.net.xpc.IframeRelayTransport(this, this.domHelper_);
      break;
    case goog.net.xpc.TransportTypes.IFRAME_POLLING:
      this.transport_ = new goog.net.xpc.IframePollingTransport(this, this.domHelper_);
      break
  }
  if(this.transport_) {
    goog.net.xpc.logger.info("Transport created: " + this.transport_.getName())
  }else {
    throw Error("CrossPageChannel: No suitable transport found!");
  }
};
goog.net.xpc.CrossPageChannel.prototype.getTransportType = function() {
  return this.transport_.getType()
};
goog.net.xpc.CrossPageChannel.prototype.getTransportName = function() {
  return this.transport_.getName()
};
goog.net.xpc.CrossPageChannel.prototype.getPeerConfiguration = function() {
  var peerCfg = {};
  peerCfg[goog.net.xpc.CfgFields.CHANNEL_NAME] = this.name;
  peerCfg[goog.net.xpc.CfgFields.TRANSPORT] = this.cfg_[goog.net.xpc.CfgFields.TRANSPORT];
  if(this.cfg_[goog.net.xpc.CfgFields.LOCAL_RELAY_URI]) {
    peerCfg[goog.net.xpc.CfgFields.PEER_RELAY_URI] = this.cfg_[goog.net.xpc.CfgFields.LOCAL_RELAY_URI]
  }
  if(this.cfg_[goog.net.xpc.CfgFields.LOCAL_POLL_URI]) {
    peerCfg[goog.net.xpc.CfgFields.PEER_POLL_URI] = this.cfg_[goog.net.xpc.CfgFields.LOCAL_POLL_URI]
  }
  if(this.cfg_[goog.net.xpc.CfgFields.PEER_POLL_URI]) {
    peerCfg[goog.net.xpc.CfgFields.LOCAL_POLL_URI] = this.cfg_[goog.net.xpc.CfgFields.PEER_POLL_URI]
  }
  return peerCfg
};
goog.net.xpc.CrossPageChannel.prototype.createPeerIframe = function(parentElm, opt_configureIframeCb, opt_addCfgParam) {
  var iframeId = this.cfg_[goog.net.xpc.CfgFields.IFRAME_ID];
  if(!iframeId) {
    iframeId = this.cfg_[goog.net.xpc.CfgFields.IFRAME_ID] = "xpcpeer" + goog.net.xpc.getRandomString(4)
  }
  var iframeElm = goog.dom.createElement("IFRAME");
  iframeElm.id = iframeElm.name = iframeId;
  if(opt_configureIframeCb) {
    opt_configureIframeCb(iframeElm)
  }else {
    iframeElm.style.width = iframeElm.style.height = "100%"
  }
  var peerUri = this.cfg_[goog.net.xpc.CfgFields.PEER_URI];
  if(goog.isString(peerUri)) {
    peerUri = this.cfg_[goog.net.xpc.CfgFields.PEER_URI] = new goog.Uri(peerUri)
  }
  if(opt_addCfgParam !== false) {
    peerUri.setParameterValue("xpc", goog.json.serialize(this.getPeerConfiguration()))
  }
  if(goog.userAgent.GECKO || goog.userAgent.WEBKIT) {
    this.deferConnect_ = true;
    window.setTimeout(goog.bind(function() {
      this.deferConnect_ = false;
      parentElm.appendChild(iframeElm);
      iframeElm.src = peerUri.toString();
      goog.net.xpc.logger.info("peer iframe created (" + iframeId + ")");
      if(this.connectDeferred_) {
        this.connect(this.connectCb_)
      }
    }, this), 1)
  }else {
    iframeElm.src = peerUri.toString();
    parentElm.appendChild(iframeElm);
    goog.net.xpc.logger.info("peer iframe created (" + iframeId + ")")
  }
  return iframeElm
};
goog.net.xpc.CrossPageChannel.prototype.deferConnect_ = false;
goog.net.xpc.CrossPageChannel.prototype.connectDeferred_ = false;
goog.net.xpc.CrossPageChannel.prototype.connect = function(opt_connectCb) {
  this.connectCb_ = opt_connectCb || goog.nullFunction;
  if(this.deferConnect_) {
    goog.net.xpc.logger.info("connect() deferred");
    this.connectDeferred_ = true;
    return
  }
  goog.net.xpc.logger.info("connect()");
  if(this.cfg_[goog.net.xpc.CfgFields.IFRAME_ID]) {
    this.iframeElement_ = this.domHelper_.getElement(this.cfg_[goog.net.xpc.CfgFields.IFRAME_ID])
  }
  if(this.iframeElement_) {
    var winObj = this.iframeElement_.contentWindow;
    if(!winObj) {
      winObj = window.frames[this.cfg_[goog.net.xpc.CfgFields.IFRAME_ID]]
    }
    this.setPeerWindowObject(winObj)
  }
  if(!this.peerWindowObject_) {
    if(window == top) {
      throw Error("CrossPageChannel: Can't connect, peer window-object not set.");
    }else {
      this.setPeerWindowObject(window.parent)
    }
  }
  this.createTransport_();
  this.transport_.connect()
};
goog.net.xpc.CrossPageChannel.prototype.close = function() {
  if(!this.isConnected()) {
    return
  }
  this.state_ = goog.net.xpc.ChannelStates.CLOSED;
  this.transport_.dispose();
  this.transport_ = null;
  goog.net.xpc.logger.info('Channel "' + this.name + '" closed')
};
goog.net.xpc.CrossPageChannel.prototype.notifyConnected_ = function() {
  if(this.isConnected()) {
    return
  }
  this.state_ = goog.net.xpc.ChannelStates.CONNECTED;
  goog.net.xpc.logger.info('Channel "' + this.name + '" connected');
  this.connectCb_()
};
goog.net.xpc.CrossPageChannel.prototype.notifyTransportError_ = function() {
  goog.net.xpc.logger.info("Transport Error");
  this.close()
};
goog.net.xpc.CrossPageChannel.prototype.send = function(serviceName, payload) {
  if(!this.isConnected()) {
    goog.net.xpc.logger.severe("Can't send. Channel not connected.");
    return
  }
  if(this.peerWindowObject_.closed) {
    goog.net.xpc.logger.severe("Peer has disappeared.");
    this.close();
    return
  }
  if(goog.isObject(payload)) {
    payload = goog.json.serialize(payload)
  }
  this.transport_.send(this.escapeServiceName_(serviceName), payload)
};
goog.net.xpc.CrossPageChannel.prototype.deliver_ = function(serviceName, payload, opt_origin) {
  if(!this.isMessageOriginAcceptable_(opt_origin)) {
    goog.net.xpc.logger.warning('Message received from unapproved origin "' + opt_origin + '" - rejected.');
    return
  }
  if(this.isDisposed()) {
    goog.net.xpc.logger.warning("CrossPageChannel::deliver_(): Disposed.")
  }else {
    if(!serviceName || serviceName == goog.net.xpc.TRANSPORT_SERVICE_) {
      this.transport_.transportServiceHandler(payload)
    }else {
      if(this.isConnected()) {
        this.deliver(this.unescapeServiceName_(serviceName), payload)
      }else {
        goog.net.xpc.logger.info("CrossPageChannel::deliver_(): Not connected.")
      }
    }
  }
};
goog.net.xpc.CrossPageChannel.prototype.escapeServiceName_ = function(name) {
  if(goog.net.xpc.CrossPageChannel.TRANSPORT_SERVICE_ESCAPE_RE_.test(name)) {
    name = "%" + name
  }
  return name.replace(/[%:|]/g, encodeURIComponent)
};
goog.net.xpc.CrossPageChannel.prototype.unescapeServiceName_ = function(name) {
  name = name.replace(/%[0-9a-f]{2}/gi, decodeURIComponent);
  if(goog.net.xpc.CrossPageChannel.TRANSPORT_SERVICE_UNESCAPE_RE_.test(name)) {
    return name.substring(1)
  }else {
    return name
  }
};
goog.net.xpc.CrossPageChannel.Role = {OUTER:0, INNER:1};
goog.net.xpc.CrossPageChannel.prototype.getRole = function() {
  return window.parent == this.peerWindowObject_ ? goog.net.xpc.CrossPageChannel.Role.INNER : goog.net.xpc.CrossPageChannel.Role.OUTER
};
goog.net.xpc.CrossPageChannel.prototype.isMessageOriginAcceptable_ = function(opt_origin) {
  var peerHostname = this.cfg_[goog.net.xpc.CfgFields.PEER_HOSTNAME];
  return goog.string.isEmptySafe(opt_origin) || goog.string.isEmptySafe(peerHostname) || opt_origin == this.cfg_[goog.net.xpc.CfgFields.PEER_HOSTNAME]
};
goog.net.xpc.CrossPageChannel.prototype.disposeInternal = function() {
  goog.base(this, "disposeInternal");
  this.close();
  this.peerWindowObject_ = null;
  this.iframeElement_ = null;
  delete goog.net.xpc.channels_[this.name]
};
goog.net.xpc.CrossPageChannel.disposeAll_ = function() {
  for(var name in goog.net.xpc.channels_) {
    var ch = goog.net.xpc.channels_[name];
    if(ch) {
      ch.dispose()
    }
  }
};
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var or__3548__auto____3324 = p[goog.typeOf.call(null, x)];
  if(cljs.core.truth_(or__3548__auto____3324)) {
    return or__3548__auto____3324
  }else {
    var or__3548__auto____3325 = p["_"];
    if(cljs.core.truth_(or__3548__auto____3325)) {
      return or__3548__auto____3325
    }else {
      return false
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error.call(null, "No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.aget = function aget(array, i) {
  return array[i]
};
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__3389 = function(this$) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3326 = this$;
      if(cljs.core.truth_(and__3546__auto____3326)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3326
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$)
    }else {
      return function() {
        var or__3548__auto____3327 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3327)) {
          return or__3548__auto____3327
        }else {
          var or__3548__auto____3328 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3328)) {
            return or__3548__auto____3328
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__3390 = function(this$, a) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3329 = this$;
      if(cljs.core.truth_(and__3546__auto____3329)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3329
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a)
    }else {
      return function() {
        var or__3548__auto____3330 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3330)) {
          return or__3548__auto____3330
        }else {
          var or__3548__auto____3331 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3331)) {
            return or__3548__auto____3331
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3391 = function(this$, a, b) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3332 = this$;
      if(cljs.core.truth_(and__3546__auto____3332)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3332
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____3333 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3333)) {
          return or__3548__auto____3333
        }else {
          var or__3548__auto____3334 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3334)) {
            return or__3548__auto____3334
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__3392 = function(this$, a, b, c) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3335 = this$;
      if(cljs.core.truth_(and__3546__auto____3335)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3335
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____3336 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3336)) {
          return or__3548__auto____3336
        }else {
          var or__3548__auto____3337 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3337)) {
            return or__3548__auto____3337
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__3393 = function(this$, a, b, c, d) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3338 = this$;
      if(cljs.core.truth_(and__3546__auto____3338)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3338
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____3339 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3339)) {
          return or__3548__auto____3339
        }else {
          var or__3548__auto____3340 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3340)) {
            return or__3548__auto____3340
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__3394 = function(this$, a, b, c, d, e) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3341 = this$;
      if(cljs.core.truth_(and__3546__auto____3341)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3341
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____3342 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3342)) {
          return or__3548__auto____3342
        }else {
          var or__3548__auto____3343 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3343)) {
            return or__3548__auto____3343
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__3395 = function(this$, a, b, c, d, e, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3344 = this$;
      if(cljs.core.truth_(and__3546__auto____3344)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3344
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____3345 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3345)) {
          return or__3548__auto____3345
        }else {
          var or__3548__auto____3346 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3346)) {
            return or__3548__auto____3346
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__3396 = function(this$, a, b, c, d, e, f, g) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3347 = this$;
      if(cljs.core.truth_(and__3546__auto____3347)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3347
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____3348 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3348)) {
          return or__3548__auto____3348
        }else {
          var or__3548__auto____3349 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3349)) {
            return or__3548__auto____3349
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__3397 = function(this$, a, b, c, d, e, f, g, h) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3350 = this$;
      if(cljs.core.truth_(and__3546__auto____3350)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3350
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____3351 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3351)) {
          return or__3548__auto____3351
        }else {
          var or__3548__auto____3352 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3352)) {
            return or__3548__auto____3352
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__3398 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3353 = this$;
      if(cljs.core.truth_(and__3546__auto____3353)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3353
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____3354 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3354)) {
          return or__3548__auto____3354
        }else {
          var or__3548__auto____3355 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3355)) {
            return or__3548__auto____3355
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__3399 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3356 = this$;
      if(cljs.core.truth_(and__3546__auto____3356)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3356
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____3357 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3357)) {
          return or__3548__auto____3357
        }else {
          var or__3548__auto____3358 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3358)) {
            return or__3548__auto____3358
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__3400 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3359 = this$;
      if(cljs.core.truth_(and__3546__auto____3359)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3359
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____3360 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3360)) {
          return or__3548__auto____3360
        }else {
          var or__3548__auto____3361 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3361)) {
            return or__3548__auto____3361
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__3401 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3362 = this$;
      if(cljs.core.truth_(and__3546__auto____3362)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3362
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____3363 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3363)) {
          return or__3548__auto____3363
        }else {
          var or__3548__auto____3364 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3364)) {
            return or__3548__auto____3364
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__3402 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3365 = this$;
      if(cljs.core.truth_(and__3546__auto____3365)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3365
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____3366 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3366)) {
          return or__3548__auto____3366
        }else {
          var or__3548__auto____3367 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3367)) {
            return or__3548__auto____3367
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__3403 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3368 = this$;
      if(cljs.core.truth_(and__3546__auto____3368)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3368
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____3369 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3369)) {
          return or__3548__auto____3369
        }else {
          var or__3548__auto____3370 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3370)) {
            return or__3548__auto____3370
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__3404 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3371 = this$;
      if(cljs.core.truth_(and__3546__auto____3371)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3371
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____3372 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3372)) {
          return or__3548__auto____3372
        }else {
          var or__3548__auto____3373 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3373)) {
            return or__3548__auto____3373
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__3405 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3374 = this$;
      if(cljs.core.truth_(and__3546__auto____3374)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3374
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____3375 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3375)) {
          return or__3548__auto____3375
        }else {
          var or__3548__auto____3376 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3376)) {
            return or__3548__auto____3376
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__3406 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3377 = this$;
      if(cljs.core.truth_(and__3546__auto____3377)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3377
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____3378 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3378)) {
          return or__3548__auto____3378
        }else {
          var or__3548__auto____3379 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3379)) {
            return or__3548__auto____3379
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__3407 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3380 = this$;
      if(cljs.core.truth_(and__3546__auto____3380)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3380
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____3381 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3381)) {
          return or__3548__auto____3381
        }else {
          var or__3548__auto____3382 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3382)) {
            return or__3548__auto____3382
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__3408 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3383 = this$;
      if(cljs.core.truth_(and__3546__auto____3383)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3383
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____3384 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3384)) {
          return or__3548__auto____3384
        }else {
          var or__3548__auto____3385 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3385)) {
            return or__3548__auto____3385
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__3409 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3386 = this$;
      if(cljs.core.truth_(and__3546__auto____3386)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3386
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____3387 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3387)) {
          return or__3548__auto____3387
        }else {
          var or__3548__auto____3388 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3388)) {
            return or__3548__auto____3388
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__3389.call(this, this$);
      case 2:
        return _invoke__3390.call(this, this$, a);
      case 3:
        return _invoke__3391.call(this, this$, a, b);
      case 4:
        return _invoke__3392.call(this, this$, a, b, c);
      case 5:
        return _invoke__3393.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__3394.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__3395.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__3396.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__3397.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__3398.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__3399.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__3400.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__3401.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__3402.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__3403.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__3404.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__3405.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__3406.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__3407.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__3408.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__3409.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3411 = coll;
    if(cljs.core.truth_(and__3546__auto____3411)) {
      return coll.cljs$core$ICounted$_count
    }else {
      return and__3546__auto____3411
    }
  }())) {
    return coll.cljs$core$ICounted$_count(coll)
  }else {
    return function() {
      var or__3548__auto____3412 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3412)) {
        return or__3548__auto____3412
      }else {
        var or__3548__auto____3413 = cljs.core._count["_"];
        if(cljs.core.truth_(or__3548__auto____3413)) {
          return or__3548__auto____3413
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3414 = coll;
    if(cljs.core.truth_(and__3546__auto____3414)) {
      return coll.cljs$core$IEmptyableCollection$_empty
    }else {
      return and__3546__auto____3414
    }
  }())) {
    return coll.cljs$core$IEmptyableCollection$_empty(coll)
  }else {
    return function() {
      var or__3548__auto____3415 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3415)) {
        return or__3548__auto____3415
      }else {
        var or__3548__auto____3416 = cljs.core._empty["_"];
        if(cljs.core.truth_(or__3548__auto____3416)) {
          return or__3548__auto____3416
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3417 = coll;
    if(cljs.core.truth_(and__3546__auto____3417)) {
      return coll.cljs$core$ICollection$_conj
    }else {
      return and__3546__auto____3417
    }
  }())) {
    return coll.cljs$core$ICollection$_conj(coll, o)
  }else {
    return function() {
      var or__3548__auto____3418 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3418)) {
        return or__3548__auto____3418
      }else {
        var or__3548__auto____3419 = cljs.core._conj["_"];
        if(cljs.core.truth_(or__3548__auto____3419)) {
          return or__3548__auto____3419
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__3426 = function(coll, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3420 = coll;
      if(cljs.core.truth_(and__3546__auto____3420)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____3420
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n)
    }else {
      return function() {
        var or__3548__auto____3421 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____3421)) {
          return or__3548__auto____3421
        }else {
          var or__3548__auto____3422 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____3422)) {
            return or__3548__auto____3422
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3427 = function(coll, n, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3423 = coll;
      if(cljs.core.truth_(and__3546__auto____3423)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____3423
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____3424 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____3424)) {
          return or__3548__auto____3424
        }else {
          var or__3548__auto____3425 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____3425)) {
            return or__3548__auto____3425
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__3426.call(this, coll, n);
      case 3:
        return _nth__3427.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _nth
}();
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3429 = coll;
    if(cljs.core.truth_(and__3546__auto____3429)) {
      return coll.cljs$core$ISeq$_first
    }else {
      return and__3546__auto____3429
    }
  }())) {
    return coll.cljs$core$ISeq$_first(coll)
  }else {
    return function() {
      var or__3548__auto____3430 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3430)) {
        return or__3548__auto____3430
      }else {
        var or__3548__auto____3431 = cljs.core._first["_"];
        if(cljs.core.truth_(or__3548__auto____3431)) {
          return or__3548__auto____3431
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3432 = coll;
    if(cljs.core.truth_(and__3546__auto____3432)) {
      return coll.cljs$core$ISeq$_rest
    }else {
      return and__3546__auto____3432
    }
  }())) {
    return coll.cljs$core$ISeq$_rest(coll)
  }else {
    return function() {
      var or__3548__auto____3433 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3433)) {
        return or__3548__auto____3433
      }else {
        var or__3548__auto____3434 = cljs.core._rest["_"];
        if(cljs.core.truth_(or__3548__auto____3434)) {
          return or__3548__auto____3434
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__3441 = function(o, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3435 = o;
      if(cljs.core.truth_(and__3546__auto____3435)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____3435
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k)
    }else {
      return function() {
        var or__3548__auto____3436 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____3436)) {
          return or__3548__auto____3436
        }else {
          var or__3548__auto____3437 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____3437)) {
            return or__3548__auto____3437
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3442 = function(o, k, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3438 = o;
      if(cljs.core.truth_(and__3546__auto____3438)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____3438
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____3439 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____3439)) {
          return or__3548__auto____3439
        }else {
          var or__3548__auto____3440 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____3440)) {
            return or__3548__auto____3440
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__3441.call(this, o, k);
      case 3:
        return _lookup__3442.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3444 = coll;
    if(cljs.core.truth_(and__3546__auto____3444)) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_
    }else {
      return and__3546__auto____3444
    }
  }())) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_(coll, k)
  }else {
    return function() {
      var or__3548__auto____3445 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3445)) {
        return or__3548__auto____3445
      }else {
        var or__3548__auto____3446 = cljs.core._contains_key_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____3446)) {
          return or__3548__auto____3446
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3447 = coll;
    if(cljs.core.truth_(and__3546__auto____3447)) {
      return coll.cljs$core$IAssociative$_assoc
    }else {
      return and__3546__auto____3447
    }
  }())) {
    return coll.cljs$core$IAssociative$_assoc(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____3448 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3448)) {
        return or__3548__auto____3448
      }else {
        var or__3548__auto____3449 = cljs.core._assoc["_"];
        if(cljs.core.truth_(or__3548__auto____3449)) {
          return or__3548__auto____3449
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3450 = coll;
    if(cljs.core.truth_(and__3546__auto____3450)) {
      return coll.cljs$core$IMap$_dissoc
    }else {
      return and__3546__auto____3450
    }
  }())) {
    return coll.cljs$core$IMap$_dissoc(coll, k)
  }else {
    return function() {
      var or__3548__auto____3451 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3451)) {
        return or__3548__auto____3451
      }else {
        var or__3548__auto____3452 = cljs.core._dissoc["_"];
        if(cljs.core.truth_(or__3548__auto____3452)) {
          return or__3548__auto____3452
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3453 = coll;
    if(cljs.core.truth_(and__3546__auto____3453)) {
      return coll.cljs$core$ISet$_disjoin
    }else {
      return and__3546__auto____3453
    }
  }())) {
    return coll.cljs$core$ISet$_disjoin(coll, v)
  }else {
    return function() {
      var or__3548__auto____3454 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3454)) {
        return or__3548__auto____3454
      }else {
        var or__3548__auto____3455 = cljs.core._disjoin["_"];
        if(cljs.core.truth_(or__3548__auto____3455)) {
          return or__3548__auto____3455
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3456 = coll;
    if(cljs.core.truth_(and__3546__auto____3456)) {
      return coll.cljs$core$IStack$_peek
    }else {
      return and__3546__auto____3456
    }
  }())) {
    return coll.cljs$core$IStack$_peek(coll)
  }else {
    return function() {
      var or__3548__auto____3457 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3457)) {
        return or__3548__auto____3457
      }else {
        var or__3548__auto____3458 = cljs.core._peek["_"];
        if(cljs.core.truth_(or__3548__auto____3458)) {
          return or__3548__auto____3458
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3459 = coll;
    if(cljs.core.truth_(and__3546__auto____3459)) {
      return coll.cljs$core$IStack$_pop
    }else {
      return and__3546__auto____3459
    }
  }())) {
    return coll.cljs$core$IStack$_pop(coll)
  }else {
    return function() {
      var or__3548__auto____3460 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3460)) {
        return or__3548__auto____3460
      }else {
        var or__3548__auto____3461 = cljs.core._pop["_"];
        if(cljs.core.truth_(or__3548__auto____3461)) {
          return or__3548__auto____3461
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3462 = coll;
    if(cljs.core.truth_(and__3546__auto____3462)) {
      return coll.cljs$core$IVector$_assoc_n
    }else {
      return and__3546__auto____3462
    }
  }())) {
    return coll.cljs$core$IVector$_assoc_n(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____3463 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3463)) {
        return or__3548__auto____3463
      }else {
        var or__3548__auto____3464 = cljs.core._assoc_n["_"];
        if(cljs.core.truth_(or__3548__auto____3464)) {
          return or__3548__auto____3464
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3465 = o;
    if(cljs.core.truth_(and__3546__auto____3465)) {
      return o.cljs$core$IDeref$_deref
    }else {
      return and__3546__auto____3465
    }
  }())) {
    return o.cljs$core$IDeref$_deref(o)
  }else {
    return function() {
      var or__3548__auto____3466 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3466)) {
        return or__3548__auto____3466
      }else {
        var or__3548__auto____3467 = cljs.core._deref["_"];
        if(cljs.core.truth_(or__3548__auto____3467)) {
          return or__3548__auto____3467
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3468 = o;
    if(cljs.core.truth_(and__3546__auto____3468)) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout
    }else {
      return and__3546__auto____3468
    }
  }())) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____3469 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3469)) {
        return or__3548__auto____3469
      }else {
        var or__3548__auto____3470 = cljs.core._deref_with_timeout["_"];
        if(cljs.core.truth_(or__3548__auto____3470)) {
          return or__3548__auto____3470
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3471 = o;
    if(cljs.core.truth_(and__3546__auto____3471)) {
      return o.cljs$core$IMeta$_meta
    }else {
      return and__3546__auto____3471
    }
  }())) {
    return o.cljs$core$IMeta$_meta(o)
  }else {
    return function() {
      var or__3548__auto____3472 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3472)) {
        return or__3548__auto____3472
      }else {
        var or__3548__auto____3473 = cljs.core._meta["_"];
        if(cljs.core.truth_(or__3548__auto____3473)) {
          return or__3548__auto____3473
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3474 = o;
    if(cljs.core.truth_(and__3546__auto____3474)) {
      return o.cljs$core$IWithMeta$_with_meta
    }else {
      return and__3546__auto____3474
    }
  }())) {
    return o.cljs$core$IWithMeta$_with_meta(o, meta)
  }else {
    return function() {
      var or__3548__auto____3475 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3475)) {
        return or__3548__auto____3475
      }else {
        var or__3548__auto____3476 = cljs.core._with_meta["_"];
        if(cljs.core.truth_(or__3548__auto____3476)) {
          return or__3548__auto____3476
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__3483 = function(coll, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3477 = coll;
      if(cljs.core.truth_(and__3546__auto____3477)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____3477
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f)
    }else {
      return function() {
        var or__3548__auto____3478 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____3478)) {
          return or__3548__auto____3478
        }else {
          var or__3548__auto____3479 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____3479)) {
            return or__3548__auto____3479
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3484 = function(coll, f, start) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3480 = coll;
      if(cljs.core.truth_(and__3546__auto____3480)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____3480
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____3481 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____3481)) {
          return or__3548__auto____3481
        }else {
          var or__3548__auto____3482 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____3482)) {
            return or__3548__auto____3482
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__3483.call(this, coll, f);
      case 3:
        return _reduce__3484.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _reduce
}();
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3486 = o;
    if(cljs.core.truth_(and__3546__auto____3486)) {
      return o.cljs$core$IEquiv$_equiv
    }else {
      return and__3546__auto____3486
    }
  }())) {
    return o.cljs$core$IEquiv$_equiv(o, other)
  }else {
    return function() {
      var or__3548__auto____3487 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3487)) {
        return or__3548__auto____3487
      }else {
        var or__3548__auto____3488 = cljs.core._equiv["_"];
        if(cljs.core.truth_(or__3548__auto____3488)) {
          return or__3548__auto____3488
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3489 = o;
    if(cljs.core.truth_(and__3546__auto____3489)) {
      return o.cljs$core$IHash$_hash
    }else {
      return and__3546__auto____3489
    }
  }())) {
    return o.cljs$core$IHash$_hash(o)
  }else {
    return function() {
      var or__3548__auto____3490 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3490)) {
        return or__3548__auto____3490
      }else {
        var or__3548__auto____3491 = cljs.core._hash["_"];
        if(cljs.core.truth_(or__3548__auto____3491)) {
          return or__3548__auto____3491
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3492 = o;
    if(cljs.core.truth_(and__3546__auto____3492)) {
      return o.cljs$core$ISeqable$_seq
    }else {
      return and__3546__auto____3492
    }
  }())) {
    return o.cljs$core$ISeqable$_seq(o)
  }else {
    return function() {
      var or__3548__auto____3493 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3493)) {
        return or__3548__auto____3493
      }else {
        var or__3548__auto____3494 = cljs.core._seq["_"];
        if(cljs.core.truth_(or__3548__auto____3494)) {
          return or__3548__auto____3494
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IRecord = {};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3495 = o;
    if(cljs.core.truth_(and__3546__auto____3495)) {
      return o.cljs$core$IPrintable$_pr_seq
    }else {
      return and__3546__auto____3495
    }
  }())) {
    return o.cljs$core$IPrintable$_pr_seq(o, opts)
  }else {
    return function() {
      var or__3548__auto____3496 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3496)) {
        return or__3548__auto____3496
      }else {
        var or__3548__auto____3497 = cljs.core._pr_seq["_"];
        if(cljs.core.truth_(or__3548__auto____3497)) {
          return or__3548__auto____3497
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3498 = d;
    if(cljs.core.truth_(and__3546__auto____3498)) {
      return d.cljs$core$IPending$_realized_QMARK_
    }else {
      return and__3546__auto____3498
    }
  }())) {
    return d.cljs$core$IPending$_realized_QMARK_(d)
  }else {
    return function() {
      var or__3548__auto____3499 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(cljs.core.truth_(or__3548__auto____3499)) {
        return or__3548__auto____3499
      }else {
        var or__3548__auto____3500 = cljs.core._realized_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____3500)) {
          return or__3548__auto____3500
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3501 = this$;
    if(cljs.core.truth_(and__3546__auto____3501)) {
      return this$.cljs$core$IWatchable$_notify_watches
    }else {
      return and__3546__auto____3501
    }
  }())) {
    return this$.cljs$core$IWatchable$_notify_watches(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____3502 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____3502)) {
        return or__3548__auto____3502
      }else {
        var or__3548__auto____3503 = cljs.core._notify_watches["_"];
        if(cljs.core.truth_(or__3548__auto____3503)) {
          return or__3548__auto____3503
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3504 = this$;
    if(cljs.core.truth_(and__3546__auto____3504)) {
      return this$.cljs$core$IWatchable$_add_watch
    }else {
      return and__3546__auto____3504
    }
  }())) {
    return this$.cljs$core$IWatchable$_add_watch(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____3505 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____3505)) {
        return or__3548__auto____3505
      }else {
        var or__3548__auto____3506 = cljs.core._add_watch["_"];
        if(cljs.core.truth_(or__3548__auto____3506)) {
          return or__3548__auto____3506
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3507 = this$;
    if(cljs.core.truth_(and__3546__auto____3507)) {
      return this$.cljs$core$IWatchable$_remove_watch
    }else {
      return and__3546__auto____3507
    }
  }())) {
    return this$.cljs$core$IWatchable$_remove_watch(this$, key)
  }else {
    return function() {
      var or__3548__auto____3508 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____3508)) {
        return or__3548__auto____3508
      }else {
        var or__3548__auto____3509 = cljs.core._remove_watch["_"];
        if(cljs.core.truth_(or__3548__auto____3509)) {
          return or__3548__auto____3509
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function _EQ_(x, y) {
  return cljs.core._equiv.call(null, x, y)
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x === null
};
cljs.core.type = function type(x) {
  return x.constructor
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__3510 = null;
  var G__3510__3511 = function(o, k) {
    return null
  };
  var G__3510__3512 = function(o, k, not_found) {
    return not_found
  };
  G__3510 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3510__3511.call(this, o, k);
      case 3:
        return G__3510__3512.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3510
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__3514 = null;
  var G__3514__3515 = function(_, f) {
    return f.call(null)
  };
  var G__3514__3516 = function(_, f, start) {
    return start
  };
  G__3514 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3514__3515.call(this, _, f);
      case 3:
        return G__3514__3516.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3514
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o === null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__3518 = null;
  var G__3518__3519 = function(_, n) {
    return null
  };
  var G__3518__3520 = function(_, n, not_found) {
    return not_found
  };
  G__3518 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3518__3519.call(this, _, n);
      case 3:
        return G__3518__3520.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3518
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__3528 = function(cicoll, f) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, cljs.core._count.call(null, cicoll)))) {
      return f.call(null)
    }else {
      var val__3522 = cljs.core._nth.call(null, cicoll, 0);
      var n__3523 = 1;
      while(true) {
        if(cljs.core.truth_(n__3523 < cljs.core._count.call(null, cicoll))) {
          var G__3532 = f.call(null, val__3522, cljs.core._nth.call(null, cicoll, n__3523));
          var G__3533 = n__3523 + 1;
          val__3522 = G__3532;
          n__3523 = G__3533;
          continue
        }else {
          return val__3522
        }
        break
      }
    }
  };
  var ci_reduce__3529 = function(cicoll, f, val) {
    var val__3524 = val;
    var n__3525 = 0;
    while(true) {
      if(cljs.core.truth_(n__3525 < cljs.core._count.call(null, cicoll))) {
        var G__3534 = f.call(null, val__3524, cljs.core._nth.call(null, cicoll, n__3525));
        var G__3535 = n__3525 + 1;
        val__3524 = G__3534;
        n__3525 = G__3535;
        continue
      }else {
        return val__3524
      }
      break
    }
  };
  var ci_reduce__3530 = function(cicoll, f, val, idx) {
    var val__3526 = val;
    var n__3527 = idx;
    while(true) {
      if(cljs.core.truth_(n__3527 < cljs.core._count.call(null, cicoll))) {
        var G__3536 = f.call(null, val__3526, cljs.core._nth.call(null, cicoll, n__3527));
        var G__3537 = n__3527 + 1;
        val__3526 = G__3536;
        n__3527 = G__3537;
        continue
      }else {
        return val__3526
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__3528.call(this, cicoll, f);
      case 3:
        return ci_reduce__3529.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__3530.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ci_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i
};
cljs.core.IndexedSeq.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3538 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce = function() {
  var G__3551 = null;
  var G__3551__3552 = function(_, f) {
    var this__3539 = this;
    return cljs.core.ci_reduce.call(null, this__3539.a, f, this__3539.a[this__3539.i], this__3539.i + 1)
  };
  var G__3551__3553 = function(_, f, start) {
    var this__3540 = this;
    return cljs.core.ci_reduce.call(null, this__3540.a, f, start, this__3540.i)
  };
  G__3551 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3551__3552.call(this, _, f);
      case 3:
        return G__3551__3553.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3551
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3541 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3542 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth = function() {
  var G__3555 = null;
  var G__3555__3556 = function(coll, n) {
    var this__3543 = this;
    var i__3544 = n + this__3543.i;
    if(cljs.core.truth_(i__3544 < this__3543.a.length)) {
      return this__3543.a[i__3544]
    }else {
      return null
    }
  };
  var G__3555__3557 = function(coll, n, not_found) {
    var this__3545 = this;
    var i__3546 = n + this__3545.i;
    if(cljs.core.truth_(i__3546 < this__3545.a.length)) {
      return this__3545.a[i__3546]
    }else {
      return not_found
    }
  };
  G__3555 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3555__3556.call(this, coll, n);
      case 3:
        return G__3555__3557.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3555
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count = function(_) {
  var this__3547 = this;
  return this__3547.a.length - this__3547.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first = function(_) {
  var this__3548 = this;
  return this__3548.a[this__3548.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest = function(_) {
  var this__3549 = this;
  if(cljs.core.truth_(this__3549.i + 1 < this__3549.a.length)) {
    return new cljs.core.IndexedSeq(this__3549.a, this__3549.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq = function(this$) {
  var this__3550 = this;
  return this$
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function prim_seq(prim, i) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, prim.length))) {
    return null
  }else {
    return new cljs.core.IndexedSeq(prim, i)
  }
};
cljs.core.array_seq = function array_seq(array, i) {
  return cljs.core.prim_seq.call(null, array, i)
};
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__3559 = null;
  var G__3559__3560 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__3559__3561 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__3559 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3559__3560.call(this, array, f);
      case 3:
        return G__3559__3561.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3559
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__3563 = null;
  var G__3563__3564 = function(array, k) {
    return array[k]
  };
  var G__3563__3565 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__3563 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3563__3564.call(this, array, k);
      case 3:
        return G__3563__3565.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3563
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__3567 = null;
  var G__3567__3568 = function(array, n) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return null
    }
  };
  var G__3567__3569 = function(array, n, not_found) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__3567 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3567__3568.call(this, array, n);
      case 3:
        return G__3567__3569.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3567
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core._seq.call(null, coll)
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  var temp__3698__auto____3571 = cljs.core.seq.call(null, coll);
  if(cljs.core.truth_(temp__3698__auto____3571)) {
    var s__3572 = temp__3698__auto____3571;
    return cljs.core._first.call(null, s__3572)
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  return cljs.core._rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.next = function next(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__3573 = cljs.core.next.call(null, s);
      s = G__3573;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.ICounted["_"] = true;
cljs.core._count["_"] = function(x) {
  var s__3574 = cljs.core.seq.call(null, x);
  var n__3575 = 0;
  while(true) {
    if(cljs.core.truth_(s__3574)) {
      var G__3576 = cljs.core.next.call(null, s__3574);
      var G__3577 = n__3575 + 1;
      s__3574 = G__3576;
      n__3575 = G__3577;
      continue
    }else {
      return n__3575
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__3578 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3579 = function() {
    var G__3581__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__3582 = conj.call(null, coll, x);
          var G__3583 = cljs.core.first.call(null, xs);
          var G__3584 = cljs.core.next.call(null, xs);
          coll = G__3582;
          x = G__3583;
          xs = G__3584;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__3581 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3581__delegate.call(this, coll, x, xs)
    };
    G__3581.cljs$lang$maxFixedArity = 2;
    G__3581.cljs$lang$applyTo = function(arglist__3585) {
      var coll = cljs.core.first(arglist__3585);
      var x = cljs.core.first(cljs.core.next(arglist__3585));
      var xs = cljs.core.rest(cljs.core.next(arglist__3585));
      return G__3581__delegate.call(this, coll, x, xs)
    };
    return G__3581
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__3578.call(this, coll, x);
      default:
        return conj__3579.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3579.cljs$lang$applyTo;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.count = function count(coll) {
  return cljs.core._count.call(null, coll)
};
cljs.core.nth = function() {
  var nth = null;
  var nth__3586 = function(coll, n) {
    return cljs.core._nth.call(null, coll, Math.floor(n))
  };
  var nth__3587 = function(coll, n, not_found) {
    return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__3586.call(this, coll, n);
      case 3:
        return nth__3587.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__3589 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3590 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__3589.call(this, o, k);
      case 3:
        return get__3590.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3593 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__3594 = function() {
    var G__3596__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__3592 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__3597 = ret__3592;
          var G__3598 = cljs.core.first.call(null, kvs);
          var G__3599 = cljs.core.second.call(null, kvs);
          var G__3600 = cljs.core.nnext.call(null, kvs);
          coll = G__3597;
          k = G__3598;
          v = G__3599;
          kvs = G__3600;
          continue
        }else {
          return ret__3592
        }
        break
      }
    };
    var G__3596 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3596__delegate.call(this, coll, k, v, kvs)
    };
    G__3596.cljs$lang$maxFixedArity = 3;
    G__3596.cljs$lang$applyTo = function(arglist__3601) {
      var coll = cljs.core.first(arglist__3601);
      var k = cljs.core.first(cljs.core.next(arglist__3601));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3601)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3601)));
      return G__3596__delegate.call(this, coll, k, v, kvs)
    };
    return G__3596
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3593.call(this, coll, k, v);
      default:
        return assoc__3594.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__3594.cljs$lang$applyTo;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__3603 = function(coll) {
    return coll
  };
  var dissoc__3604 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3605 = function() {
    var G__3607__delegate = function(coll, k, ks) {
      while(true) {
        var ret__3602 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__3608 = ret__3602;
          var G__3609 = cljs.core.first.call(null, ks);
          var G__3610 = cljs.core.next.call(null, ks);
          coll = G__3608;
          k = G__3609;
          ks = G__3610;
          continue
        }else {
          return ret__3602
        }
        break
      }
    };
    var G__3607 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3607__delegate.call(this, coll, k, ks)
    };
    G__3607.cljs$lang$maxFixedArity = 2;
    G__3607.cljs$lang$applyTo = function(arglist__3611) {
      var coll = cljs.core.first(arglist__3611);
      var k = cljs.core.first(cljs.core.next(arglist__3611));
      var ks = cljs.core.rest(cljs.core.next(arglist__3611));
      return G__3607__delegate.call(this, coll, k, ks)
    };
    return G__3607
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__3603.call(this, coll);
      case 2:
        return dissoc__3604.call(this, coll, k);
      default:
        return dissoc__3605.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3605.cljs$lang$applyTo;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(cljs.core.truth_(function() {
    var x__450__auto____3612 = o;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3613 = x__450__auto____3612;
      if(cljs.core.truth_(and__3546__auto____3613)) {
        var and__3546__auto____3614 = x__450__auto____3612.cljs$core$IMeta$;
        if(cljs.core.truth_(and__3546__auto____3614)) {
          return cljs.core.not.call(null, x__450__auto____3612.hasOwnProperty("cljs$core$IMeta$"))
        }else {
          return and__3546__auto____3614
        }
      }else {
        return and__3546__auto____3613
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__450__auto____3612)
    }
  }())) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__3616 = function(coll) {
    return coll
  };
  var disj__3617 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3618 = function() {
    var G__3620__delegate = function(coll, k, ks) {
      while(true) {
        var ret__3615 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__3621 = ret__3615;
          var G__3622 = cljs.core.first.call(null, ks);
          var G__3623 = cljs.core.next.call(null, ks);
          coll = G__3621;
          k = G__3622;
          ks = G__3623;
          continue
        }else {
          return ret__3615
        }
        break
      }
    };
    var G__3620 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3620__delegate.call(this, coll, k, ks)
    };
    G__3620.cljs$lang$maxFixedArity = 2;
    G__3620.cljs$lang$applyTo = function(arglist__3624) {
      var coll = cljs.core.first(arglist__3624);
      var k = cljs.core.first(cljs.core.next(arglist__3624));
      var ks = cljs.core.rest(cljs.core.next(arglist__3624));
      return G__3620__delegate.call(this, coll, k, ks)
    };
    return G__3620
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__3616.call(this, coll);
      case 2:
        return disj__3617.call(this, coll, k);
      default:
        return disj__3618.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3618.cljs$lang$applyTo;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__450__auto____3625 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3626 = x__450__auto____3625;
      if(cljs.core.truth_(and__3546__auto____3626)) {
        var and__3546__auto____3627 = x__450__auto____3625.cljs$core$ICollection$;
        if(cljs.core.truth_(and__3546__auto____3627)) {
          return cljs.core.not.call(null, x__450__auto____3625.hasOwnProperty("cljs$core$ICollection$"))
        }else {
          return and__3546__auto____3627
        }
      }else {
        return and__3546__auto____3626
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, x__450__auto____3625)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__450__auto____3628 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3629 = x__450__auto____3628;
      if(cljs.core.truth_(and__3546__auto____3629)) {
        var and__3546__auto____3630 = x__450__auto____3628.cljs$core$ISet$;
        if(cljs.core.truth_(and__3546__auto____3630)) {
          return cljs.core.not.call(null, x__450__auto____3628.hasOwnProperty("cljs$core$ISet$"))
        }else {
          return and__3546__auto____3630
        }
      }else {
        return and__3546__auto____3629
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, x__450__auto____3628)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var x__450__auto____3631 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3632 = x__450__auto____3631;
    if(cljs.core.truth_(and__3546__auto____3632)) {
      var and__3546__auto____3633 = x__450__auto____3631.cljs$core$IAssociative$;
      if(cljs.core.truth_(and__3546__auto____3633)) {
        return cljs.core.not.call(null, x__450__auto____3631.hasOwnProperty("cljs$core$IAssociative$"))
      }else {
        return and__3546__auto____3633
      }
    }else {
      return and__3546__auto____3632
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, x__450__auto____3631)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var x__450__auto____3634 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3635 = x__450__auto____3634;
    if(cljs.core.truth_(and__3546__auto____3635)) {
      var and__3546__auto____3636 = x__450__auto____3634.cljs$core$ISequential$;
      if(cljs.core.truth_(and__3546__auto____3636)) {
        return cljs.core.not.call(null, x__450__auto____3634.hasOwnProperty("cljs$core$ISequential$"))
      }else {
        return and__3546__auto____3636
      }
    }else {
      return and__3546__auto____3635
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, x__450__auto____3634)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var x__450__auto____3637 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3638 = x__450__auto____3637;
    if(cljs.core.truth_(and__3546__auto____3638)) {
      var and__3546__auto____3639 = x__450__auto____3637.cljs$core$ICounted$;
      if(cljs.core.truth_(and__3546__auto____3639)) {
        return cljs.core.not.call(null, x__450__auto____3637.hasOwnProperty("cljs$core$ICounted$"))
      }else {
        return and__3546__auto____3639
      }
    }else {
      return and__3546__auto____3638
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, x__450__auto____3637)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__450__auto____3640 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3641 = x__450__auto____3640;
      if(cljs.core.truth_(and__3546__auto____3641)) {
        var and__3546__auto____3642 = x__450__auto____3640.cljs$core$IMap$;
        if(cljs.core.truth_(and__3546__auto____3642)) {
          return cljs.core.not.call(null, x__450__auto____3640.hasOwnProperty("cljs$core$IMap$"))
        }else {
          return and__3546__auto____3642
        }
      }else {
        return and__3546__auto____3641
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, x__450__auto____3640)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var x__450__auto____3643 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3644 = x__450__auto____3643;
    if(cljs.core.truth_(and__3546__auto____3644)) {
      var and__3546__auto____3645 = x__450__auto____3643.cljs$core$IVector$;
      if(cljs.core.truth_(and__3546__auto____3645)) {
        return cljs.core.not.call(null, x__450__auto____3643.hasOwnProperty("cljs$core$IVector$"))
      }else {
        return and__3546__auto____3645
      }
    }else {
      return and__3546__auto____3644
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, x__450__auto____3643)
  }
};
cljs.core.js_obj = function js_obj() {
  return{}
};
cljs.core.js_keys = function js_keys(obj) {
  var keys__3646 = cljs.core.array.call(null);
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__3646.push(key)
  });
  return keys__3646
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.lookup_sentinel = cljs.core.js_obj.call(null);
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(cljs.core.truth_(s === null)) {
    return false
  }else {
    var x__450__auto____3647 = s;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3648 = x__450__auto____3647;
      if(cljs.core.truth_(and__3546__auto____3648)) {
        var and__3546__auto____3649 = x__450__auto____3647.cljs$core$ISeq$;
        if(cljs.core.truth_(and__3546__auto____3649)) {
          return cljs.core.not.call(null, x__450__auto____3647.hasOwnProperty("cljs$core$ISeq$"))
        }else {
          return and__3546__auto____3649
        }
      }else {
        return and__3546__auto____3648
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, x__450__auto____3647)
    }
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3546__auto____3650 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____3650)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____3651 = cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0");
      if(cljs.core.truth_(or__3548__auto____3651)) {
        return or__3548__auto____3651
      }else {
        return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
      }
    }())
  }else {
    return and__3546__auto____3650
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____3652 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____3652)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0")
  }else {
    return and__3546__auto____3652
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____3653 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____3653)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
  }else {
    return and__3546__auto____3653
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____3654 = cljs.core.number_QMARK_.call(null, n);
  if(cljs.core.truth_(and__3546__auto____3654)) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____3654
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core.truth_(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3655 = coll;
    if(cljs.core.truth_(and__3546__auto____3655)) {
      var and__3546__auto____3656 = cljs.core.associative_QMARK_.call(null, coll);
      if(cljs.core.truth_(and__3546__auto____3656)) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____3656
      }
    }else {
      return and__3546__auto____3655
    }
  }())) {
    return cljs.core.Vector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___3661 = function(x) {
    return true
  };
  var distinct_QMARK___3662 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___3663 = function() {
    var G__3665__delegate = function(x, y, more) {
      if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y)))) {
        var s__3657 = cljs.core.set([y, x]);
        var xs__3658 = more;
        while(true) {
          var x__3659 = cljs.core.first.call(null, xs__3658);
          var etc__3660 = cljs.core.next.call(null, xs__3658);
          if(cljs.core.truth_(xs__3658)) {
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, s__3657, x__3659))) {
              return false
            }else {
              var G__3666 = cljs.core.conj.call(null, s__3657, x__3659);
              var G__3667 = etc__3660;
              s__3657 = G__3666;
              xs__3658 = G__3667;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__3665 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3665__delegate.call(this, x, y, more)
    };
    G__3665.cljs$lang$maxFixedArity = 2;
    G__3665.cljs$lang$applyTo = function(arglist__3668) {
      var x = cljs.core.first(arglist__3668);
      var y = cljs.core.first(cljs.core.next(arglist__3668));
      var more = cljs.core.rest(cljs.core.next(arglist__3668));
      return G__3665__delegate.call(this, x, y, more)
    };
    return G__3665
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___3661.call(this, x);
      case 2:
        return distinct_QMARK___3662.call(this, x, y);
      default:
        return distinct_QMARK___3663.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3663.cljs$lang$applyTo;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  return goog.array.defaultCompare.call(null, x, y)
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, f, cljs.core.compare))) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__3669 = f.call(null, x, y);
      if(cljs.core.truth_(cljs.core.number_QMARK_.call(null, r__3669))) {
        return r__3669
      }else {
        if(cljs.core.truth_(r__3669)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__3671 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__3672 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__3670 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__3670, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__3670)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__3671.call(this, comp);
      case 2:
        return sort__3672.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__3674 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3675 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__3674.call(this, keyfn, comp);
      case 3:
        return sort_by__3675.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort_by
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__3677 = function(f, coll) {
    return cljs.core._reduce.call(null, coll, f)
  };
  var reduce__3678 = function(f, val, coll) {
    return cljs.core._reduce.call(null, coll, f, val)
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__3677.call(this, f, val);
      case 3:
        return reduce__3678.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reduce
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__3684 = function(f, coll) {
    var temp__3695__auto____3680 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____3680)) {
      var s__3681 = temp__3695__auto____3680;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__3681), cljs.core.next.call(null, s__3681))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3685 = function(f, val, coll) {
    var val__3682 = val;
    var coll__3683 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__3683)) {
        var G__3687 = f.call(null, val__3682, cljs.core.first.call(null, coll__3683));
        var G__3688 = cljs.core.next.call(null, coll__3683);
        val__3682 = G__3687;
        coll__3683 = G__3688;
        continue
      }else {
        return val__3682
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__3684.call(this, f, val);
      case 3:
        return seq_reduce__3685.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return seq_reduce
}();
cljs.core.IReduce["_"] = true;
cljs.core._reduce["_"] = function() {
  var G__3689 = null;
  var G__3689__3690 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__3689__3691 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__3689 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3689__3690.call(this, coll, f);
      case 3:
        return G__3689__3691.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3689
}();
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___3693 = function() {
    return 0
  };
  var _PLUS___3694 = function(x) {
    return x
  };
  var _PLUS___3695 = function(x, y) {
    return x + y
  };
  var _PLUS___3696 = function() {
    var G__3698__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__3698 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3698__delegate.call(this, x, y, more)
    };
    G__3698.cljs$lang$maxFixedArity = 2;
    G__3698.cljs$lang$applyTo = function(arglist__3699) {
      var x = cljs.core.first(arglist__3699);
      var y = cljs.core.first(cljs.core.next(arglist__3699));
      var more = cljs.core.rest(cljs.core.next(arglist__3699));
      return G__3698__delegate.call(this, x, y, more)
    };
    return G__3698
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___3693.call(this);
      case 1:
        return _PLUS___3694.call(this, x);
      case 2:
        return _PLUS___3695.call(this, x, y);
      default:
        return _PLUS___3696.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3696.cljs$lang$applyTo;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___3700 = function(x) {
    return-x
  };
  var ___3701 = function(x, y) {
    return x - y
  };
  var ___3702 = function() {
    var G__3704__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__3704 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3704__delegate.call(this, x, y, more)
    };
    G__3704.cljs$lang$maxFixedArity = 2;
    G__3704.cljs$lang$applyTo = function(arglist__3705) {
      var x = cljs.core.first(arglist__3705);
      var y = cljs.core.first(cljs.core.next(arglist__3705));
      var more = cljs.core.rest(cljs.core.next(arglist__3705));
      return G__3704__delegate.call(this, x, y, more)
    };
    return G__3704
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___3700.call(this, x);
      case 2:
        return ___3701.call(this, x, y);
      default:
        return ___3702.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3702.cljs$lang$applyTo;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___3706 = function() {
    return 1
  };
  var _STAR___3707 = function(x) {
    return x
  };
  var _STAR___3708 = function(x, y) {
    return x * y
  };
  var _STAR___3709 = function() {
    var G__3711__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__3711 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3711__delegate.call(this, x, y, more)
    };
    G__3711.cljs$lang$maxFixedArity = 2;
    G__3711.cljs$lang$applyTo = function(arglist__3712) {
      var x = cljs.core.first(arglist__3712);
      var y = cljs.core.first(cljs.core.next(arglist__3712));
      var more = cljs.core.rest(cljs.core.next(arglist__3712));
      return G__3711__delegate.call(this, x, y, more)
    };
    return G__3711
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___3706.call(this);
      case 1:
        return _STAR___3707.call(this, x);
      case 2:
        return _STAR___3708.call(this, x, y);
      default:
        return _STAR___3709.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3709.cljs$lang$applyTo;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___3713 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___3714 = function(x, y) {
    return x / y
  };
  var _SLASH___3715 = function() {
    var G__3717__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__3717 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3717__delegate.call(this, x, y, more)
    };
    G__3717.cljs$lang$maxFixedArity = 2;
    G__3717.cljs$lang$applyTo = function(arglist__3718) {
      var x = cljs.core.first(arglist__3718);
      var y = cljs.core.first(cljs.core.next(arglist__3718));
      var more = cljs.core.rest(cljs.core.next(arglist__3718));
      return G__3717__delegate.call(this, x, y, more)
    };
    return G__3717
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___3713.call(this, x);
      case 2:
        return _SLASH___3714.call(this, x, y);
      default:
        return _SLASH___3715.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3715.cljs$lang$applyTo;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___3719 = function(x) {
    return true
  };
  var _LT___3720 = function(x, y) {
    return x < y
  };
  var _LT___3721 = function() {
    var G__3723__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x < y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3724 = y;
            var G__3725 = cljs.core.first.call(null, more);
            var G__3726 = cljs.core.next.call(null, more);
            x = G__3724;
            y = G__3725;
            more = G__3726;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3723 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3723__delegate.call(this, x, y, more)
    };
    G__3723.cljs$lang$maxFixedArity = 2;
    G__3723.cljs$lang$applyTo = function(arglist__3727) {
      var x = cljs.core.first(arglist__3727);
      var y = cljs.core.first(cljs.core.next(arglist__3727));
      var more = cljs.core.rest(cljs.core.next(arglist__3727));
      return G__3723__delegate.call(this, x, y, more)
    };
    return G__3723
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___3719.call(this, x);
      case 2:
        return _LT___3720.call(this, x, y);
      default:
        return _LT___3721.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3721.cljs$lang$applyTo;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___3728 = function(x) {
    return true
  };
  var _LT__EQ___3729 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3730 = function() {
    var G__3732__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x <= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3733 = y;
            var G__3734 = cljs.core.first.call(null, more);
            var G__3735 = cljs.core.next.call(null, more);
            x = G__3733;
            y = G__3734;
            more = G__3735;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3732 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3732__delegate.call(this, x, y, more)
    };
    G__3732.cljs$lang$maxFixedArity = 2;
    G__3732.cljs$lang$applyTo = function(arglist__3736) {
      var x = cljs.core.first(arglist__3736);
      var y = cljs.core.first(cljs.core.next(arglist__3736));
      var more = cljs.core.rest(cljs.core.next(arglist__3736));
      return G__3732__delegate.call(this, x, y, more)
    };
    return G__3732
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___3728.call(this, x);
      case 2:
        return _LT__EQ___3729.call(this, x, y);
      default:
        return _LT__EQ___3730.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3730.cljs$lang$applyTo;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___3737 = function(x) {
    return true
  };
  var _GT___3738 = function(x, y) {
    return x > y
  };
  var _GT___3739 = function() {
    var G__3741__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x > y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3742 = y;
            var G__3743 = cljs.core.first.call(null, more);
            var G__3744 = cljs.core.next.call(null, more);
            x = G__3742;
            y = G__3743;
            more = G__3744;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3741 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3741__delegate.call(this, x, y, more)
    };
    G__3741.cljs$lang$maxFixedArity = 2;
    G__3741.cljs$lang$applyTo = function(arglist__3745) {
      var x = cljs.core.first(arglist__3745);
      var y = cljs.core.first(cljs.core.next(arglist__3745));
      var more = cljs.core.rest(cljs.core.next(arglist__3745));
      return G__3741__delegate.call(this, x, y, more)
    };
    return G__3741
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___3737.call(this, x);
      case 2:
        return _GT___3738.call(this, x, y);
      default:
        return _GT___3739.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3739.cljs$lang$applyTo;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___3746 = function(x) {
    return true
  };
  var _GT__EQ___3747 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3748 = function() {
    var G__3750__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x >= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3751 = y;
            var G__3752 = cljs.core.first.call(null, more);
            var G__3753 = cljs.core.next.call(null, more);
            x = G__3751;
            y = G__3752;
            more = G__3753;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3750 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3750__delegate.call(this, x, y, more)
    };
    G__3750.cljs$lang$maxFixedArity = 2;
    G__3750.cljs$lang$applyTo = function(arglist__3754) {
      var x = cljs.core.first(arglist__3754);
      var y = cljs.core.first(cljs.core.next(arglist__3754));
      var more = cljs.core.rest(cljs.core.next(arglist__3754));
      return G__3750__delegate.call(this, x, y, more)
    };
    return G__3750
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___3746.call(this, x);
      case 2:
        return _GT__EQ___3747.call(this, x, y);
      default:
        return _GT__EQ___3748.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3748.cljs$lang$applyTo;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__3755 = function(x) {
    return x
  };
  var max__3756 = function(x, y) {
    return x > y ? x : y
  };
  var max__3757 = function() {
    var G__3759__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__3759 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3759__delegate.call(this, x, y, more)
    };
    G__3759.cljs$lang$maxFixedArity = 2;
    G__3759.cljs$lang$applyTo = function(arglist__3760) {
      var x = cljs.core.first(arglist__3760);
      var y = cljs.core.first(cljs.core.next(arglist__3760));
      var more = cljs.core.rest(cljs.core.next(arglist__3760));
      return G__3759__delegate.call(this, x, y, more)
    };
    return G__3759
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__3755.call(this, x);
      case 2:
        return max__3756.call(this, x, y);
      default:
        return max__3757.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3757.cljs$lang$applyTo;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__3761 = function(x) {
    return x
  };
  var min__3762 = function(x, y) {
    return x < y ? x : y
  };
  var min__3763 = function() {
    var G__3765__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__3765 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3765__delegate.call(this, x, y, more)
    };
    G__3765.cljs$lang$maxFixedArity = 2;
    G__3765.cljs$lang$applyTo = function(arglist__3766) {
      var x = cljs.core.first(arglist__3766);
      var y = cljs.core.first(cljs.core.next(arglist__3766));
      var more = cljs.core.rest(cljs.core.next(arglist__3766));
      return G__3765__delegate.call(this, x, y, more)
    };
    return G__3765
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__3761.call(this, x);
      case 2:
        return min__3762.call(this, x, y);
      default:
        return min__3763.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3763.cljs$lang$applyTo;
  return min
}();
cljs.core.fix = function fix(q) {
  if(cljs.core.truth_(q >= 0)) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__3767 = n % d;
  return cljs.core.fix.call(null, (n - rem__3767) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__3768 = cljs.core.quot.call(null, n, d);
  return n - d * q__3768
};
cljs.core.rand = function() {
  var rand = null;
  var rand__3769 = function() {
    return Math.random.call(null)
  };
  var rand__3770 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__3769.call(this);
      case 1:
        return rand__3770.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___3772 = function(x) {
    return true
  };
  var _EQ__EQ___3773 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3774 = function() {
    var G__3776__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3777 = y;
            var G__3778 = cljs.core.first.call(null, more);
            var G__3779 = cljs.core.next.call(null, more);
            x = G__3777;
            y = G__3778;
            more = G__3779;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3776 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3776__delegate.call(this, x, y, more)
    };
    G__3776.cljs$lang$maxFixedArity = 2;
    G__3776.cljs$lang$applyTo = function(arglist__3780) {
      var x = cljs.core.first(arglist__3780);
      var y = cljs.core.first(cljs.core.next(arglist__3780));
      var more = cljs.core.rest(cljs.core.next(arglist__3780));
      return G__3776__delegate.call(this, x, y, more)
    };
    return G__3776
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___3772.call(this, x);
      case 2:
        return _EQ__EQ___3773.call(this, x, y);
      default:
        return _EQ__EQ___3774.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3774.cljs$lang$applyTo;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__3781 = n;
  var xs__3782 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3783 = xs__3782;
      if(cljs.core.truth_(and__3546__auto____3783)) {
        return n__3781 > 0
      }else {
        return and__3546__auto____3783
      }
    }())) {
      var G__3784 = n__3781 - 1;
      var G__3785 = cljs.core.next.call(null, xs__3782);
      n__3781 = G__3784;
      xs__3782 = G__3785;
      continue
    }else {
      return xs__3782
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__3790 = null;
  var G__3790__3791 = function(coll, n) {
    var temp__3695__auto____3786 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____3786)) {
      var xs__3787 = temp__3695__auto____3786;
      return cljs.core.first.call(null, xs__3787)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__3790__3792 = function(coll, n, not_found) {
    var temp__3695__auto____3788 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____3788)) {
      var xs__3789 = temp__3695__auto____3788;
      return cljs.core.first.call(null, xs__3789)
    }else {
      return not_found
    }
  };
  G__3790 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3790__3791.call(this, coll, n);
      case 3:
        return G__3790__3792.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3790
}();
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___3794 = function() {
    return""
  };
  var str_STAR___3795 = function(x) {
    if(cljs.core.truth_(x === null)) {
      return""
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___3796 = function() {
    var G__3798__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__3799 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__3800 = cljs.core.next.call(null, more);
            sb = G__3799;
            more = G__3800;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__3798 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__3798__delegate.call(this, x, ys)
    };
    G__3798.cljs$lang$maxFixedArity = 1;
    G__3798.cljs$lang$applyTo = function(arglist__3801) {
      var x = cljs.core.first(arglist__3801);
      var ys = cljs.core.rest(arglist__3801);
      return G__3798__delegate.call(this, x, ys)
    };
    return G__3798
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___3794.call(this);
      case 1:
        return str_STAR___3795.call(this, x);
      default:
        return str_STAR___3796.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___3796.cljs$lang$applyTo;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__3802 = function() {
    return""
  };
  var str__3803 = function(x) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, x))) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, x))) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(cljs.core.truth_(x === null)) {
          return""
        }else {
          if(cljs.core.truth_("\ufdd0'else")) {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__3804 = function() {
    var G__3806__delegate = function(x, ys) {
      return cljs.core.apply.call(null, cljs.core.str_STAR_, x, ys)
    };
    var G__3806 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__3806__delegate.call(this, x, ys)
    };
    G__3806.cljs$lang$maxFixedArity = 1;
    G__3806.cljs$lang$applyTo = function(arglist__3807) {
      var x = cljs.core.first(arglist__3807);
      var ys = cljs.core.rest(arglist__3807);
      return G__3806__delegate.call(this, x, ys)
    };
    return G__3806
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__3802.call(this);
      case 1:
        return str__3803.call(this, x);
      default:
        return str__3804.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__3804.cljs$lang$applyTo;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__3808 = function(s, start) {
    return s.substring(start)
  };
  var subs__3809 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__3808.call(this, s, start);
      case 3:
        return subs__3809.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__3811 = function(name) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
      name
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__3812 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__3811.call(this, ns);
      case 2:
        return symbol__3812.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__3814 = function(name) {
    if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
      return name
    }else {
      if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__3815 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__3814.call(this, ns);
      case 2:
        return keyword__3815.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.sequential_QMARK_.call(null, y)) ? function() {
    var xs__3817 = cljs.core.seq.call(null, x);
    var ys__3818 = cljs.core.seq.call(null, y);
    while(true) {
      if(cljs.core.truth_(xs__3817 === null)) {
        return ys__3818 === null
      }else {
        if(cljs.core.truth_(ys__3818 === null)) {
          return false
        }else {
          if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__3817), cljs.core.first.call(null, ys__3818)))) {
            var G__3819 = cljs.core.next.call(null, xs__3817);
            var G__3820 = cljs.core.next.call(null, ys__3818);
            xs__3817 = G__3819;
            ys__3818 = G__3820;
            continue
          }else {
            if(cljs.core.truth_("\ufdd0'else")) {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__3821_SHARP_, p2__3822_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__3821_SHARP_, cljs.core.hash.call(null, p2__3822_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__3823__3824 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__3823__3824)) {
    var G__3826__3828 = cljs.core.first.call(null, G__3823__3824);
    var vec__3827__3829 = G__3826__3828;
    var key_name__3830 = cljs.core.nth.call(null, vec__3827__3829, 0, null);
    var f__3831 = cljs.core.nth.call(null, vec__3827__3829, 1, null);
    var G__3823__3832 = G__3823__3824;
    var G__3826__3833 = G__3826__3828;
    var G__3823__3834 = G__3823__3832;
    while(true) {
      var vec__3835__3836 = G__3826__3833;
      var key_name__3837 = cljs.core.nth.call(null, vec__3835__3836, 0, null);
      var f__3838 = cljs.core.nth.call(null, vec__3835__3836, 1, null);
      var G__3823__3839 = G__3823__3834;
      var str_name__3840 = cljs.core.name.call(null, key_name__3837);
      obj[str_name__3840] = f__3838;
      var temp__3698__auto____3841 = cljs.core.next.call(null, G__3823__3839);
      if(cljs.core.truth_(temp__3698__auto____3841)) {
        var G__3823__3842 = temp__3698__auto____3841;
        var G__3843 = cljs.core.first.call(null, G__3823__3842);
        var G__3844 = G__3823__3842;
        G__3826__3833 = G__3843;
        G__3823__3834 = G__3844;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count
};
cljs.core.List.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3845 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3846 = this;
  return new cljs.core.List(this__3846.meta, o, coll, this__3846.count + 1)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3847 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3848 = this;
  return this__3848.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__3849 = this;
  return this__3849.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__3850 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3851 = this;
  return this__3851.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3852 = this;
  return this__3852.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3853 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3854 = this;
  return new cljs.core.List(meta, this__3854.first, this__3854.rest, this__3854.count)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3855 = this;
  return this__3855.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3856 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta
};
cljs.core.EmptyList.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3857 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3858 = this;
  return new cljs.core.List(this__3858.meta, o, null, 1)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3859 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3860 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__3861 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__3862 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3863 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3864 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3865 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3866 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3867 = this;
  return this__3867.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3868 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__3869) {
    var items = cljs.core.seq(arglist__3869);
    return list__delegate.call(this, items)
  };
  return list
}();
cljs.core.Cons = function(meta, first, rest) {
  this.meta = meta;
  this.first = first;
  this.rest = rest
};
cljs.core.Cons.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3870 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3871 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3872 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3873 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__3873.meta)
};
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3874 = this;
  return new cljs.core.Cons(null, o, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3875 = this;
  return this__3875.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3876 = this;
  if(cljs.core.truth_(this__3876.rest === null)) {
    return cljs.core.List.EMPTY
  }else {
    return this__3876.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3877 = this;
  return this__3877.meta
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3878 = this;
  return new cljs.core.Cons(meta, this__3878.first, this__3878.rest)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq)
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__3879 = null;
  var G__3879__3880 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__3879__3881 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__3879 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3879__3880.call(this, string, f);
      case 3:
        return G__3879__3881.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3879
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__3883 = null;
  var G__3883__3884 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__3883__3885 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__3883 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3883__3884.call(this, string, k);
      case 3:
        return G__3883__3885.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3883
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__3887 = null;
  var G__3887__3888 = function(string, n) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__3887__3889 = function(string, n, not_found) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__3887 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3887__3888.call(this, string, n);
      case 3:
        return G__3887__3889.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3887
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__3897 = null;
  var G__3897__3898 = function(tsym3891, coll) {
    var tsym3891__3893 = this;
    var this$__3894 = tsym3891__3893;
    return cljs.core.get.call(null, coll, this$__3894.toString())
  };
  var G__3897__3899 = function(tsym3892, coll, not_found) {
    var tsym3892__3895 = this;
    var this$__3896 = tsym3892__3895;
    return cljs.core.get.call(null, coll, this$__3896.toString(), not_found)
  };
  G__3897 = function(tsym3892, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3897__3898.call(this, tsym3892, coll);
      case 3:
        return G__3897__3899.call(this, tsym3892, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3897
}();
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.truth_(cljs.core.count.call(null, args) < 2)) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__3901 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__3901
  }else {
    lazy_seq.x = x__3901.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x) {
  this.meta = meta;
  this.realized = realized;
  this.x = x
};
cljs.core.LazySeq.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3902 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3903 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3904 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3905 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__3905.meta)
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3906 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3907 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3908 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3909 = this;
  return this__3909.meta
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3910 = this;
  return new cljs.core.LazySeq(meta, this__3910.realized, this__3910.x)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__3911 = cljs.core.array.call(null);
  var s__3912 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__3912))) {
      ary__3911.push(cljs.core.first.call(null, s__3912));
      var G__3913 = cljs.core.next.call(null, s__3912);
      s__3912 = G__3913;
      continue
    }else {
      return ary__3911
    }
    break
  }
};
cljs.core.bounded_count = function bounded_count(s, n) {
  var s__3914 = s;
  var i__3915 = n;
  var sum__3916 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3917 = i__3915 > 0;
      if(cljs.core.truth_(and__3546__auto____3917)) {
        return cljs.core.seq.call(null, s__3914)
      }else {
        return and__3546__auto____3917
      }
    }())) {
      var G__3918 = cljs.core.next.call(null, s__3914);
      var G__3919 = i__3915 - 1;
      var G__3920 = sum__3916 + 1;
      s__3914 = G__3918;
      i__3915 = G__3919;
      sum__3916 = G__3920;
      continue
    }else {
      return sum__3916
    }
    break
  }
};
cljs.core.spread = function spread(arglist) {
  if(cljs.core.truth_(arglist === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core.next.call(null, arglist) === null)) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__3924 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__3925 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__3926 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__3921 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__3921)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__3921), concat.call(null, cljs.core.rest.call(null, s__3921), y))
      }else {
        return y
      }
    })
  };
  var concat__3927 = function() {
    var G__3929__delegate = function(x, y, zs) {
      var cat__3923 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__3922 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__3922)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__3922), cat.call(null, cljs.core.rest.call(null, xys__3922), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__3923.call(null, concat.call(null, x, y), zs)
    };
    var G__3929 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3929__delegate.call(this, x, y, zs)
    };
    G__3929.cljs$lang$maxFixedArity = 2;
    G__3929.cljs$lang$applyTo = function(arglist__3930) {
      var x = cljs.core.first(arglist__3930);
      var y = cljs.core.first(cljs.core.next(arglist__3930));
      var zs = cljs.core.rest(cljs.core.next(arglist__3930));
      return G__3929__delegate.call(this, x, y, zs)
    };
    return G__3929
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__3924.call(this);
      case 1:
        return concat__3925.call(this, x);
      case 2:
        return concat__3926.call(this, x, y);
      default:
        return concat__3927.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3927.cljs$lang$applyTo;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___3931 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___3932 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3933 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___3934 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___3935 = function() {
    var G__3937__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__3937 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3937__delegate.call(this, a, b, c, d, more)
    };
    G__3937.cljs$lang$maxFixedArity = 4;
    G__3937.cljs$lang$applyTo = function(arglist__3938) {
      var a = cljs.core.first(arglist__3938);
      var b = cljs.core.first(cljs.core.next(arglist__3938));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3938)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3938))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3938))));
      return G__3937__delegate.call(this, a, b, c, d, more)
    };
    return G__3937
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___3931.call(this, a);
      case 2:
        return list_STAR___3932.call(this, a, b);
      case 3:
        return list_STAR___3933.call(this, a, b, c);
      case 4:
        return list_STAR___3934.call(this, a, b, c, d);
      default:
        return list_STAR___3935.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___3935.cljs$lang$applyTo;
  return list_STAR_
}();
cljs.core.apply = function() {
  var apply = null;
  var apply__3948 = function(f, args) {
    var fixed_arity__3939 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, args, fixed_arity__3939 + 1) <= fixed_arity__3939)) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3949 = function(f, x, args) {
    var arglist__3940 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__3941 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3940, fixed_arity__3941) <= fixed_arity__3941)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3940))
      }else {
        return f.cljs$lang$applyTo(arglist__3940)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__3940))
    }
  };
  var apply__3950 = function(f, x, y, args) {
    var arglist__3942 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__3943 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3942, fixed_arity__3943) <= fixed_arity__3943)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3942))
      }else {
        return f.cljs$lang$applyTo(arglist__3942)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__3942))
    }
  };
  var apply__3951 = function(f, x, y, z, args) {
    var arglist__3944 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__3945 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3944, fixed_arity__3945) <= fixed_arity__3945)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3944))
      }else {
        return f.cljs$lang$applyTo(arglist__3944)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__3944))
    }
  };
  var apply__3952 = function() {
    var G__3954__delegate = function(f, a, b, c, d, args) {
      var arglist__3946 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__3947 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3946, fixed_arity__3947) <= fixed_arity__3947)) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__3946))
        }else {
          return f.cljs$lang$applyTo(arglist__3946)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3946))
      }
    };
    var G__3954 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__3954__delegate.call(this, f, a, b, c, d, args)
    };
    G__3954.cljs$lang$maxFixedArity = 5;
    G__3954.cljs$lang$applyTo = function(arglist__3955) {
      var f = cljs.core.first(arglist__3955);
      var a = cljs.core.first(cljs.core.next(arglist__3955));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3955)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3955))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3955)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3955)))));
      return G__3954__delegate.call(this, f, a, b, c, d, args)
    };
    return G__3954
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__3948.call(this, f, a);
      case 3:
        return apply__3949.call(this, f, a, b);
      case 4:
        return apply__3950.call(this, f, a, b, c);
      case 5:
        return apply__3951.call(this, f, a, b, c, d);
      default:
        return apply__3952.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__3952.cljs$lang$applyTo;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__3956) {
    var obj = cljs.core.first(arglist__3956);
    var f = cljs.core.first(cljs.core.next(arglist__3956));
    var args = cljs.core.rest(cljs.core.next(arglist__3956));
    return vary_meta__delegate.call(this, obj, f, args)
  };
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___3957 = function(x) {
    return false
  };
  var not_EQ___3958 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___3959 = function() {
    var G__3961__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__3961 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3961__delegate.call(this, x, y, more)
    };
    G__3961.cljs$lang$maxFixedArity = 2;
    G__3961.cljs$lang$applyTo = function(arglist__3962) {
      var x = cljs.core.first(arglist__3962);
      var y = cljs.core.first(cljs.core.next(arglist__3962));
      var more = cljs.core.rest(cljs.core.next(arglist__3962));
      return G__3961__delegate.call(this, x, y, more)
    };
    return G__3961
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___3957.call(this, x);
      case 2:
        return not_EQ___3958.call(this, x, y);
      default:
        return not_EQ___3959.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3959.cljs$lang$applyTo;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll) === null)) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__3963 = pred;
        var G__3964 = cljs.core.next.call(null, coll);
        pred = G__3963;
        coll = G__3964;
        continue
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3548__auto____3965 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____3965)) {
        return or__3548__auto____3965
      }else {
        var G__3966 = pred;
        var G__3967 = cljs.core.next.call(null, coll);
        pred = G__3966;
        coll = G__3967;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.truth_(cljs.core.integer_QMARK_.call(null, n))) {
    return(n & 1) === 0
  }else {
    throw new Error(cljs.core.str.call(null, "Argument must be an integer: ", n));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__3968 = null;
    var G__3968__3969 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__3968__3970 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__3968__3971 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__3968__3972 = function() {
      var G__3974__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__3974 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__3974__delegate.call(this, x, y, zs)
      };
      G__3974.cljs$lang$maxFixedArity = 2;
      G__3974.cljs$lang$applyTo = function(arglist__3975) {
        var x = cljs.core.first(arglist__3975);
        var y = cljs.core.first(cljs.core.next(arglist__3975));
        var zs = cljs.core.rest(cljs.core.next(arglist__3975));
        return G__3974__delegate.call(this, x, y, zs)
      };
      return G__3974
    }();
    G__3968 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__3968__3969.call(this);
        case 1:
          return G__3968__3970.call(this, x);
        case 2:
          return G__3968__3971.call(this, x, y);
        default:
          return G__3968__3972.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__3968.cljs$lang$maxFixedArity = 2;
    G__3968.cljs$lang$applyTo = G__3968__3972.cljs$lang$applyTo;
    return G__3968
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__3976__delegate = function(args) {
      return x
    };
    var G__3976 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__3976__delegate.call(this, args)
    };
    G__3976.cljs$lang$maxFixedArity = 0;
    G__3976.cljs$lang$applyTo = function(arglist__3977) {
      var args = cljs.core.seq(arglist__3977);
      return G__3976__delegate.call(this, args)
    };
    return G__3976
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__3981 = function() {
    return cljs.core.identity
  };
  var comp__3982 = function(f) {
    return f
  };
  var comp__3983 = function(f, g) {
    return function() {
      var G__3987 = null;
      var G__3987__3988 = function() {
        return f.call(null, g.call(null))
      };
      var G__3987__3989 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__3987__3990 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__3987__3991 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__3987__3992 = function() {
        var G__3994__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__3994 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3994__delegate.call(this, x, y, z, args)
        };
        G__3994.cljs$lang$maxFixedArity = 3;
        G__3994.cljs$lang$applyTo = function(arglist__3995) {
          var x = cljs.core.first(arglist__3995);
          var y = cljs.core.first(cljs.core.next(arglist__3995));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3995)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3995)));
          return G__3994__delegate.call(this, x, y, z, args)
        };
        return G__3994
      }();
      G__3987 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3987__3988.call(this);
          case 1:
            return G__3987__3989.call(this, x);
          case 2:
            return G__3987__3990.call(this, x, y);
          case 3:
            return G__3987__3991.call(this, x, y, z);
          default:
            return G__3987__3992.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3987.cljs$lang$maxFixedArity = 3;
      G__3987.cljs$lang$applyTo = G__3987__3992.cljs$lang$applyTo;
      return G__3987
    }()
  };
  var comp__3984 = function(f, g, h) {
    return function() {
      var G__3996 = null;
      var G__3996__3997 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__3996__3998 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__3996__3999 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__3996__4000 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__3996__4001 = function() {
        var G__4003__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__4003 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4003__delegate.call(this, x, y, z, args)
        };
        G__4003.cljs$lang$maxFixedArity = 3;
        G__4003.cljs$lang$applyTo = function(arglist__4004) {
          var x = cljs.core.first(arglist__4004);
          var y = cljs.core.first(cljs.core.next(arglist__4004));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4004)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4004)));
          return G__4003__delegate.call(this, x, y, z, args)
        };
        return G__4003
      }();
      G__3996 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3996__3997.call(this);
          case 1:
            return G__3996__3998.call(this, x);
          case 2:
            return G__3996__3999.call(this, x, y);
          case 3:
            return G__3996__4000.call(this, x, y, z);
          default:
            return G__3996__4001.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3996.cljs$lang$maxFixedArity = 3;
      G__3996.cljs$lang$applyTo = G__3996__4001.cljs$lang$applyTo;
      return G__3996
    }()
  };
  var comp__3985 = function() {
    var G__4005__delegate = function(f1, f2, f3, fs) {
      var fs__3978 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__4006__delegate = function(args) {
          var ret__3979 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__3978), args);
          var fs__3980 = cljs.core.next.call(null, fs__3978);
          while(true) {
            if(cljs.core.truth_(fs__3980)) {
              var G__4007 = cljs.core.first.call(null, fs__3980).call(null, ret__3979);
              var G__4008 = cljs.core.next.call(null, fs__3980);
              ret__3979 = G__4007;
              fs__3980 = G__4008;
              continue
            }else {
              return ret__3979
            }
            break
          }
        };
        var G__4006 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__4006__delegate.call(this, args)
        };
        G__4006.cljs$lang$maxFixedArity = 0;
        G__4006.cljs$lang$applyTo = function(arglist__4009) {
          var args = cljs.core.seq(arglist__4009);
          return G__4006__delegate.call(this, args)
        };
        return G__4006
      }()
    };
    var G__4005 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4005__delegate.call(this, f1, f2, f3, fs)
    };
    G__4005.cljs$lang$maxFixedArity = 3;
    G__4005.cljs$lang$applyTo = function(arglist__4010) {
      var f1 = cljs.core.first(arglist__4010);
      var f2 = cljs.core.first(cljs.core.next(arglist__4010));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4010)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4010)));
      return G__4005__delegate.call(this, f1, f2, f3, fs)
    };
    return G__4005
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__3981.call(this);
      case 1:
        return comp__3982.call(this, f1);
      case 2:
        return comp__3983.call(this, f1, f2);
      case 3:
        return comp__3984.call(this, f1, f2, f3);
      default:
        return comp__3985.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__3985.cljs$lang$applyTo;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__4011 = function(f, arg1) {
    return function() {
      var G__4016__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__4016 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__4016__delegate.call(this, args)
      };
      G__4016.cljs$lang$maxFixedArity = 0;
      G__4016.cljs$lang$applyTo = function(arglist__4017) {
        var args = cljs.core.seq(arglist__4017);
        return G__4016__delegate.call(this, args)
      };
      return G__4016
    }()
  };
  var partial__4012 = function(f, arg1, arg2) {
    return function() {
      var G__4018__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__4018 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__4018__delegate.call(this, args)
      };
      G__4018.cljs$lang$maxFixedArity = 0;
      G__4018.cljs$lang$applyTo = function(arglist__4019) {
        var args = cljs.core.seq(arglist__4019);
        return G__4018__delegate.call(this, args)
      };
      return G__4018
    }()
  };
  var partial__4013 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__4020__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__4020 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__4020__delegate.call(this, args)
      };
      G__4020.cljs$lang$maxFixedArity = 0;
      G__4020.cljs$lang$applyTo = function(arglist__4021) {
        var args = cljs.core.seq(arglist__4021);
        return G__4020__delegate.call(this, args)
      };
      return G__4020
    }()
  };
  var partial__4014 = function() {
    var G__4022__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__4023__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__4023 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__4023__delegate.call(this, args)
        };
        G__4023.cljs$lang$maxFixedArity = 0;
        G__4023.cljs$lang$applyTo = function(arglist__4024) {
          var args = cljs.core.seq(arglist__4024);
          return G__4023__delegate.call(this, args)
        };
        return G__4023
      }()
    };
    var G__4022 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__4022__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__4022.cljs$lang$maxFixedArity = 4;
    G__4022.cljs$lang$applyTo = function(arglist__4025) {
      var f = cljs.core.first(arglist__4025);
      var arg1 = cljs.core.first(cljs.core.next(arglist__4025));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4025)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4025))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4025))));
      return G__4022__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__4022
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__4011.call(this, f, arg1);
      case 3:
        return partial__4012.call(this, f, arg1, arg2);
      case 4:
        return partial__4013.call(this, f, arg1, arg2, arg3);
      default:
        return partial__4014.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__4014.cljs$lang$applyTo;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__4026 = function(f, x) {
    return function() {
      var G__4030 = null;
      var G__4030__4031 = function(a) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a)
      };
      var G__4030__4032 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b)
      };
      var G__4030__4033 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b, c)
      };
      var G__4030__4034 = function() {
        var G__4036__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, b, c, ds)
        };
        var G__4036 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4036__delegate.call(this, a, b, c, ds)
        };
        G__4036.cljs$lang$maxFixedArity = 3;
        G__4036.cljs$lang$applyTo = function(arglist__4037) {
          var a = cljs.core.first(arglist__4037);
          var b = cljs.core.first(cljs.core.next(arglist__4037));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4037)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4037)));
          return G__4036__delegate.call(this, a, b, c, ds)
        };
        return G__4036
      }();
      G__4030 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__4030__4031.call(this, a);
          case 2:
            return G__4030__4032.call(this, a, b);
          case 3:
            return G__4030__4033.call(this, a, b, c);
          default:
            return G__4030__4034.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4030.cljs$lang$maxFixedArity = 3;
      G__4030.cljs$lang$applyTo = G__4030__4034.cljs$lang$applyTo;
      return G__4030
    }()
  };
  var fnil__4027 = function(f, x, y) {
    return function() {
      var G__4038 = null;
      var G__4038__4039 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__4038__4040 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c)
      };
      var G__4038__4041 = function() {
        var G__4043__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c, ds)
        };
        var G__4043 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4043__delegate.call(this, a, b, c, ds)
        };
        G__4043.cljs$lang$maxFixedArity = 3;
        G__4043.cljs$lang$applyTo = function(arglist__4044) {
          var a = cljs.core.first(arglist__4044);
          var b = cljs.core.first(cljs.core.next(arglist__4044));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4044)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4044)));
          return G__4043__delegate.call(this, a, b, c, ds)
        };
        return G__4043
      }();
      G__4038 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__4038__4039.call(this, a, b);
          case 3:
            return G__4038__4040.call(this, a, b, c);
          default:
            return G__4038__4041.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4038.cljs$lang$maxFixedArity = 3;
      G__4038.cljs$lang$applyTo = G__4038__4041.cljs$lang$applyTo;
      return G__4038
    }()
  };
  var fnil__4028 = function(f, x, y, z) {
    return function() {
      var G__4045 = null;
      var G__4045__4046 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__4045__4047 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c)
      };
      var G__4045__4048 = function() {
        var G__4050__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c, ds)
        };
        var G__4050 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4050__delegate.call(this, a, b, c, ds)
        };
        G__4050.cljs$lang$maxFixedArity = 3;
        G__4050.cljs$lang$applyTo = function(arglist__4051) {
          var a = cljs.core.first(arglist__4051);
          var b = cljs.core.first(cljs.core.next(arglist__4051));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4051)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4051)));
          return G__4050__delegate.call(this, a, b, c, ds)
        };
        return G__4050
      }();
      G__4045 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__4045__4046.call(this, a, b);
          case 3:
            return G__4045__4047.call(this, a, b, c);
          default:
            return G__4045__4048.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4045.cljs$lang$maxFixedArity = 3;
      G__4045.cljs$lang$applyTo = G__4045__4048.cljs$lang$applyTo;
      return G__4045
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__4026.call(this, f, x);
      case 3:
        return fnil__4027.call(this, f, x, y);
      case 4:
        return fnil__4028.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__4054 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4052 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4052)) {
        var s__4053 = temp__3698__auto____4052;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__4053)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__4053)))
      }else {
        return null
      }
    })
  };
  return mapi__4054.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4055 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4055)) {
      var s__4056 = temp__3698__auto____4055;
      var x__4057 = f.call(null, cljs.core.first.call(null, s__4056));
      if(cljs.core.truth_(x__4057 === null)) {
        return keep.call(null, f, cljs.core.rest.call(null, s__4056))
      }else {
        return cljs.core.cons.call(null, x__4057, keep.call(null, f, cljs.core.rest.call(null, s__4056)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__4067 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4064 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4064)) {
        var s__4065 = temp__3698__auto____4064;
        var x__4066 = f.call(null, idx, cljs.core.first.call(null, s__4065));
        if(cljs.core.truth_(x__4066 === null)) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__4065))
        }else {
          return cljs.core.cons.call(null, x__4066, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__4065)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__4067.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__4112 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__4117 = function() {
        return true
      };
      var ep1__4118 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__4119 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____4074 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____4074)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____4074
          }
        }())
      };
      var ep1__4120 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____4075 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____4075)) {
            var and__3546__auto____4076 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____4076)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____4076
            }
          }else {
            return and__3546__auto____4075
          }
        }())
      };
      var ep1__4121 = function() {
        var G__4123__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____4077 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____4077)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____4077
            }
          }())
        };
        var G__4123 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4123__delegate.call(this, x, y, z, args)
        };
        G__4123.cljs$lang$maxFixedArity = 3;
        G__4123.cljs$lang$applyTo = function(arglist__4124) {
          var x = cljs.core.first(arglist__4124);
          var y = cljs.core.first(cljs.core.next(arglist__4124));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4124)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4124)));
          return G__4123__delegate.call(this, x, y, z, args)
        };
        return G__4123
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__4117.call(this);
          case 1:
            return ep1__4118.call(this, x);
          case 2:
            return ep1__4119.call(this, x, y);
          case 3:
            return ep1__4120.call(this, x, y, z);
          default:
            return ep1__4121.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4121.cljs$lang$applyTo;
      return ep1
    }()
  };
  var every_pred__4113 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__4125 = function() {
        return true
      };
      var ep2__4126 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____4078 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____4078)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____4078
          }
        }())
      };
      var ep2__4127 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____4079 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____4079)) {
            var and__3546__auto____4080 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____4080)) {
              var and__3546__auto____4081 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____4081)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____4081
              }
            }else {
              return and__3546__auto____4080
            }
          }else {
            return and__3546__auto____4079
          }
        }())
      };
      var ep2__4128 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____4082 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____4082)) {
            var and__3546__auto____4083 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____4083)) {
              var and__3546__auto____4084 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____4084)) {
                var and__3546__auto____4085 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____4085)) {
                  var and__3546__auto____4086 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____4086)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____4086
                  }
                }else {
                  return and__3546__auto____4085
                }
              }else {
                return and__3546__auto____4084
              }
            }else {
              return and__3546__auto____4083
            }
          }else {
            return and__3546__auto____4082
          }
        }())
      };
      var ep2__4129 = function() {
        var G__4131__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____4087 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____4087)) {
              return cljs.core.every_QMARK_.call(null, function(p1__4058_SHARP_) {
                var and__3546__auto____4088 = p1.call(null, p1__4058_SHARP_);
                if(cljs.core.truth_(and__3546__auto____4088)) {
                  return p2.call(null, p1__4058_SHARP_)
                }else {
                  return and__3546__auto____4088
                }
              }, args)
            }else {
              return and__3546__auto____4087
            }
          }())
        };
        var G__4131 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4131__delegate.call(this, x, y, z, args)
        };
        G__4131.cljs$lang$maxFixedArity = 3;
        G__4131.cljs$lang$applyTo = function(arglist__4132) {
          var x = cljs.core.first(arglist__4132);
          var y = cljs.core.first(cljs.core.next(arglist__4132));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4132)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4132)));
          return G__4131__delegate.call(this, x, y, z, args)
        };
        return G__4131
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__4125.call(this);
          case 1:
            return ep2__4126.call(this, x);
          case 2:
            return ep2__4127.call(this, x, y);
          case 3:
            return ep2__4128.call(this, x, y, z);
          default:
            return ep2__4129.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4129.cljs$lang$applyTo;
      return ep2
    }()
  };
  var every_pred__4114 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__4133 = function() {
        return true
      };
      var ep3__4134 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____4089 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____4089)) {
            var and__3546__auto____4090 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____4090)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____4090
            }
          }else {
            return and__3546__auto____4089
          }
        }())
      };
      var ep3__4135 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____4091 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____4091)) {
            var and__3546__auto____4092 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____4092)) {
              var and__3546__auto____4093 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____4093)) {
                var and__3546__auto____4094 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____4094)) {
                  var and__3546__auto____4095 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____4095)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____4095
                  }
                }else {
                  return and__3546__auto____4094
                }
              }else {
                return and__3546__auto____4093
              }
            }else {
              return and__3546__auto____4092
            }
          }else {
            return and__3546__auto____4091
          }
        }())
      };
      var ep3__4136 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____4096 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____4096)) {
            var and__3546__auto____4097 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____4097)) {
              var and__3546__auto____4098 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____4098)) {
                var and__3546__auto____4099 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____4099)) {
                  var and__3546__auto____4100 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____4100)) {
                    var and__3546__auto____4101 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____4101)) {
                      var and__3546__auto____4102 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____4102)) {
                        var and__3546__auto____4103 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____4103)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____4103
                        }
                      }else {
                        return and__3546__auto____4102
                      }
                    }else {
                      return and__3546__auto____4101
                    }
                  }else {
                    return and__3546__auto____4100
                  }
                }else {
                  return and__3546__auto____4099
                }
              }else {
                return and__3546__auto____4098
              }
            }else {
              return and__3546__auto____4097
            }
          }else {
            return and__3546__auto____4096
          }
        }())
      };
      var ep3__4137 = function() {
        var G__4139__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____4104 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____4104)) {
              return cljs.core.every_QMARK_.call(null, function(p1__4059_SHARP_) {
                var and__3546__auto____4105 = p1.call(null, p1__4059_SHARP_);
                if(cljs.core.truth_(and__3546__auto____4105)) {
                  var and__3546__auto____4106 = p2.call(null, p1__4059_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____4106)) {
                    return p3.call(null, p1__4059_SHARP_)
                  }else {
                    return and__3546__auto____4106
                  }
                }else {
                  return and__3546__auto____4105
                }
              }, args)
            }else {
              return and__3546__auto____4104
            }
          }())
        };
        var G__4139 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4139__delegate.call(this, x, y, z, args)
        };
        G__4139.cljs$lang$maxFixedArity = 3;
        G__4139.cljs$lang$applyTo = function(arglist__4140) {
          var x = cljs.core.first(arglist__4140);
          var y = cljs.core.first(cljs.core.next(arglist__4140));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4140)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4140)));
          return G__4139__delegate.call(this, x, y, z, args)
        };
        return G__4139
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__4133.call(this);
          case 1:
            return ep3__4134.call(this, x);
          case 2:
            return ep3__4135.call(this, x, y);
          case 3:
            return ep3__4136.call(this, x, y, z);
          default:
            return ep3__4137.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4137.cljs$lang$applyTo;
      return ep3
    }()
  };
  var every_pred__4115 = function() {
    var G__4141__delegate = function(p1, p2, p3, ps) {
      var ps__4107 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__4142 = function() {
          return true
        };
        var epn__4143 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__4060_SHARP_) {
            return p1__4060_SHARP_.call(null, x)
          }, ps__4107)
        };
        var epn__4144 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__4061_SHARP_) {
            var and__3546__auto____4108 = p1__4061_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____4108)) {
              return p1__4061_SHARP_.call(null, y)
            }else {
              return and__3546__auto____4108
            }
          }, ps__4107)
        };
        var epn__4145 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__4062_SHARP_) {
            var and__3546__auto____4109 = p1__4062_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____4109)) {
              var and__3546__auto____4110 = p1__4062_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____4110)) {
                return p1__4062_SHARP_.call(null, z)
              }else {
                return and__3546__auto____4110
              }
            }else {
              return and__3546__auto____4109
            }
          }, ps__4107)
        };
        var epn__4146 = function() {
          var G__4148__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____4111 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____4111)) {
                return cljs.core.every_QMARK_.call(null, function(p1__4063_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__4063_SHARP_, args)
                }, ps__4107)
              }else {
                return and__3546__auto____4111
              }
            }())
          };
          var G__4148 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__4148__delegate.call(this, x, y, z, args)
          };
          G__4148.cljs$lang$maxFixedArity = 3;
          G__4148.cljs$lang$applyTo = function(arglist__4149) {
            var x = cljs.core.first(arglist__4149);
            var y = cljs.core.first(cljs.core.next(arglist__4149));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4149)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4149)));
            return G__4148__delegate.call(this, x, y, z, args)
          };
          return G__4148
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__4142.call(this);
            case 1:
              return epn__4143.call(this, x);
            case 2:
              return epn__4144.call(this, x, y);
            case 3:
              return epn__4145.call(this, x, y, z);
            default:
              return epn__4146.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4146.cljs$lang$applyTo;
        return epn
      }()
    };
    var G__4141 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4141__delegate.call(this, p1, p2, p3, ps)
    };
    G__4141.cljs$lang$maxFixedArity = 3;
    G__4141.cljs$lang$applyTo = function(arglist__4150) {
      var p1 = cljs.core.first(arglist__4150);
      var p2 = cljs.core.first(cljs.core.next(arglist__4150));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4150)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4150)));
      return G__4141__delegate.call(this, p1, p2, p3, ps)
    };
    return G__4141
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__4112.call(this, p1);
      case 2:
        return every_pred__4113.call(this, p1, p2);
      case 3:
        return every_pred__4114.call(this, p1, p2, p3);
      default:
        return every_pred__4115.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4115.cljs$lang$applyTo;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__4190 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__4195 = function() {
        return null
      };
      var sp1__4196 = function(x) {
        return p.call(null, x)
      };
      var sp1__4197 = function(x, y) {
        var or__3548__auto____4152 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4152)) {
          return or__3548__auto____4152
        }else {
          return p.call(null, y)
        }
      };
      var sp1__4198 = function(x, y, z) {
        var or__3548__auto____4153 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4153)) {
          return or__3548__auto____4153
        }else {
          var or__3548__auto____4154 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____4154)) {
            return or__3548__auto____4154
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4199 = function() {
        var G__4201__delegate = function(x, y, z, args) {
          var or__3548__auto____4155 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____4155)) {
            return or__3548__auto____4155
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__4201 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4201__delegate.call(this, x, y, z, args)
        };
        G__4201.cljs$lang$maxFixedArity = 3;
        G__4201.cljs$lang$applyTo = function(arglist__4202) {
          var x = cljs.core.first(arglist__4202);
          var y = cljs.core.first(cljs.core.next(arglist__4202));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4202)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4202)));
          return G__4201__delegate.call(this, x, y, z, args)
        };
        return G__4201
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__4195.call(this);
          case 1:
            return sp1__4196.call(this, x);
          case 2:
            return sp1__4197.call(this, x, y);
          case 3:
            return sp1__4198.call(this, x, y, z);
          default:
            return sp1__4199.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4199.cljs$lang$applyTo;
      return sp1
    }()
  };
  var some_fn__4191 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__4203 = function() {
        return null
      };
      var sp2__4204 = function(x) {
        var or__3548__auto____4156 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4156)) {
          return or__3548__auto____4156
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__4205 = function(x, y) {
        var or__3548__auto____4157 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4157)) {
          return or__3548__auto____4157
        }else {
          var or__3548__auto____4158 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____4158)) {
            return or__3548__auto____4158
          }else {
            var or__3548__auto____4159 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____4159)) {
              return or__3548__auto____4159
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__4206 = function(x, y, z) {
        var or__3548__auto____4160 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4160)) {
          return or__3548__auto____4160
        }else {
          var or__3548__auto____4161 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____4161)) {
            return or__3548__auto____4161
          }else {
            var or__3548__auto____4162 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____4162)) {
              return or__3548__auto____4162
            }else {
              var or__3548__auto____4163 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____4163)) {
                return or__3548__auto____4163
              }else {
                var or__3548__auto____4164 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____4164)) {
                  return or__3548__auto____4164
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4207 = function() {
        var G__4209__delegate = function(x, y, z, args) {
          var or__3548__auto____4165 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____4165)) {
            return or__3548__auto____4165
          }else {
            return cljs.core.some.call(null, function(p1__4068_SHARP_) {
              var or__3548__auto____4166 = p1.call(null, p1__4068_SHARP_);
              if(cljs.core.truth_(or__3548__auto____4166)) {
                return or__3548__auto____4166
              }else {
                return p2.call(null, p1__4068_SHARP_)
              }
            }, args)
          }
        };
        var G__4209 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4209__delegate.call(this, x, y, z, args)
        };
        G__4209.cljs$lang$maxFixedArity = 3;
        G__4209.cljs$lang$applyTo = function(arglist__4210) {
          var x = cljs.core.first(arglist__4210);
          var y = cljs.core.first(cljs.core.next(arglist__4210));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4210)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4210)));
          return G__4209__delegate.call(this, x, y, z, args)
        };
        return G__4209
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__4203.call(this);
          case 1:
            return sp2__4204.call(this, x);
          case 2:
            return sp2__4205.call(this, x, y);
          case 3:
            return sp2__4206.call(this, x, y, z);
          default:
            return sp2__4207.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4207.cljs$lang$applyTo;
      return sp2
    }()
  };
  var some_fn__4192 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__4211 = function() {
        return null
      };
      var sp3__4212 = function(x) {
        var or__3548__auto____4167 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4167)) {
          return or__3548__auto____4167
        }else {
          var or__3548__auto____4168 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____4168)) {
            return or__3548__auto____4168
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__4213 = function(x, y) {
        var or__3548__auto____4169 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4169)) {
          return or__3548__auto____4169
        }else {
          var or__3548__auto____4170 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____4170)) {
            return or__3548__auto____4170
          }else {
            var or__3548__auto____4171 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____4171)) {
              return or__3548__auto____4171
            }else {
              var or__3548__auto____4172 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____4172)) {
                return or__3548__auto____4172
              }else {
                var or__3548__auto____4173 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____4173)) {
                  return or__3548__auto____4173
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__4214 = function(x, y, z) {
        var or__3548__auto____4174 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4174)) {
          return or__3548__auto____4174
        }else {
          var or__3548__auto____4175 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____4175)) {
            return or__3548__auto____4175
          }else {
            var or__3548__auto____4176 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____4176)) {
              return or__3548__auto____4176
            }else {
              var or__3548__auto____4177 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____4177)) {
                return or__3548__auto____4177
              }else {
                var or__3548__auto____4178 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____4178)) {
                  return or__3548__auto____4178
                }else {
                  var or__3548__auto____4179 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____4179)) {
                    return or__3548__auto____4179
                  }else {
                    var or__3548__auto____4180 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____4180)) {
                      return or__3548__auto____4180
                    }else {
                      var or__3548__auto____4181 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____4181)) {
                        return or__3548__auto____4181
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4215 = function() {
        var G__4217__delegate = function(x, y, z, args) {
          var or__3548__auto____4182 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____4182)) {
            return or__3548__auto____4182
          }else {
            return cljs.core.some.call(null, function(p1__4069_SHARP_) {
              var or__3548__auto____4183 = p1.call(null, p1__4069_SHARP_);
              if(cljs.core.truth_(or__3548__auto____4183)) {
                return or__3548__auto____4183
              }else {
                var or__3548__auto____4184 = p2.call(null, p1__4069_SHARP_);
                if(cljs.core.truth_(or__3548__auto____4184)) {
                  return or__3548__auto____4184
                }else {
                  return p3.call(null, p1__4069_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__4217 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4217__delegate.call(this, x, y, z, args)
        };
        G__4217.cljs$lang$maxFixedArity = 3;
        G__4217.cljs$lang$applyTo = function(arglist__4218) {
          var x = cljs.core.first(arglist__4218);
          var y = cljs.core.first(cljs.core.next(arglist__4218));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4218)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4218)));
          return G__4217__delegate.call(this, x, y, z, args)
        };
        return G__4217
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__4211.call(this);
          case 1:
            return sp3__4212.call(this, x);
          case 2:
            return sp3__4213.call(this, x, y);
          case 3:
            return sp3__4214.call(this, x, y, z);
          default:
            return sp3__4215.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4215.cljs$lang$applyTo;
      return sp3
    }()
  };
  var some_fn__4193 = function() {
    var G__4219__delegate = function(p1, p2, p3, ps) {
      var ps__4185 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__4220 = function() {
          return null
        };
        var spn__4221 = function(x) {
          return cljs.core.some.call(null, function(p1__4070_SHARP_) {
            return p1__4070_SHARP_.call(null, x)
          }, ps__4185)
        };
        var spn__4222 = function(x, y) {
          return cljs.core.some.call(null, function(p1__4071_SHARP_) {
            var or__3548__auto____4186 = p1__4071_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____4186)) {
              return or__3548__auto____4186
            }else {
              return p1__4071_SHARP_.call(null, y)
            }
          }, ps__4185)
        };
        var spn__4223 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__4072_SHARP_) {
            var or__3548__auto____4187 = p1__4072_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____4187)) {
              return or__3548__auto____4187
            }else {
              var or__3548__auto____4188 = p1__4072_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____4188)) {
                return or__3548__auto____4188
              }else {
                return p1__4072_SHARP_.call(null, z)
              }
            }
          }, ps__4185)
        };
        var spn__4224 = function() {
          var G__4226__delegate = function(x, y, z, args) {
            var or__3548__auto____4189 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____4189)) {
              return or__3548__auto____4189
            }else {
              return cljs.core.some.call(null, function(p1__4073_SHARP_) {
                return cljs.core.some.call(null, p1__4073_SHARP_, args)
              }, ps__4185)
            }
          };
          var G__4226 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__4226__delegate.call(this, x, y, z, args)
          };
          G__4226.cljs$lang$maxFixedArity = 3;
          G__4226.cljs$lang$applyTo = function(arglist__4227) {
            var x = cljs.core.first(arglist__4227);
            var y = cljs.core.first(cljs.core.next(arglist__4227));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4227)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4227)));
            return G__4226__delegate.call(this, x, y, z, args)
          };
          return G__4226
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__4220.call(this);
            case 1:
              return spn__4221.call(this, x);
            case 2:
              return spn__4222.call(this, x, y);
            case 3:
              return spn__4223.call(this, x, y, z);
            default:
              return spn__4224.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4224.cljs$lang$applyTo;
        return spn
      }()
    };
    var G__4219 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4219__delegate.call(this, p1, p2, p3, ps)
    };
    G__4219.cljs$lang$maxFixedArity = 3;
    G__4219.cljs$lang$applyTo = function(arglist__4228) {
      var p1 = cljs.core.first(arglist__4228);
      var p2 = cljs.core.first(cljs.core.next(arglist__4228));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4228)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4228)));
      return G__4219__delegate.call(this, p1, p2, p3, ps)
    };
    return G__4219
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__4190.call(this, p1);
      case 2:
        return some_fn__4191.call(this, p1, p2);
      case 3:
        return some_fn__4192.call(this, p1, p2, p3);
      default:
        return some_fn__4193.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4193.cljs$lang$applyTo;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__4241 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4229 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4229)) {
        var s__4230 = temp__3698__auto____4229;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__4230)), map.call(null, f, cljs.core.rest.call(null, s__4230)))
      }else {
        return null
      }
    })
  };
  var map__4242 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__4231 = cljs.core.seq.call(null, c1);
      var s2__4232 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____4233 = s1__4231;
        if(cljs.core.truth_(and__3546__auto____4233)) {
          return s2__4232
        }else {
          return and__3546__auto____4233
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__4231), cljs.core.first.call(null, s2__4232)), map.call(null, f, cljs.core.rest.call(null, s1__4231), cljs.core.rest.call(null, s2__4232)))
      }else {
        return null
      }
    })
  };
  var map__4243 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__4234 = cljs.core.seq.call(null, c1);
      var s2__4235 = cljs.core.seq.call(null, c2);
      var s3__4236 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____4237 = s1__4234;
        if(cljs.core.truth_(and__3546__auto____4237)) {
          var and__3546__auto____4238 = s2__4235;
          if(cljs.core.truth_(and__3546__auto____4238)) {
            return s3__4236
          }else {
            return and__3546__auto____4238
          }
        }else {
          return and__3546__auto____4237
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__4234), cljs.core.first.call(null, s2__4235), cljs.core.first.call(null, s3__4236)), map.call(null, f, cljs.core.rest.call(null, s1__4234), cljs.core.rest.call(null, s2__4235), cljs.core.rest.call(null, s3__4236)))
      }else {
        return null
      }
    })
  };
  var map__4244 = function() {
    var G__4246__delegate = function(f, c1, c2, c3, colls) {
      var step__4240 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__4239 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__4239))) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__4239), step.call(null, map.call(null, cljs.core.rest, ss__4239)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__4151_SHARP_) {
        return cljs.core.apply.call(null, f, p1__4151_SHARP_)
      }, step__4240.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__4246 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__4246__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__4246.cljs$lang$maxFixedArity = 4;
    G__4246.cljs$lang$applyTo = function(arglist__4247) {
      var f = cljs.core.first(arglist__4247);
      var c1 = cljs.core.first(cljs.core.next(arglist__4247));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4247)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4247))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4247))));
      return G__4246__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__4246
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__4241.call(this, f, c1);
      case 3:
        return map__4242.call(this, f, c1, c2);
      case 4:
        return map__4243.call(this, f, c1, c2, c3);
      default:
        return map__4244.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__4244.cljs$lang$applyTo;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(cljs.core.truth_(n > 0)) {
      var temp__3698__auto____4248 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4248)) {
        var s__4249 = temp__3698__auto____4248;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__4249), take.call(null, n - 1, cljs.core.rest.call(null, s__4249)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__4252 = function(n, coll) {
    while(true) {
      var s__4250 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____4251 = n > 0;
        if(cljs.core.truth_(and__3546__auto____4251)) {
          return s__4250
        }else {
          return and__3546__auto____4251
        }
      }())) {
        var G__4253 = n - 1;
        var G__4254 = cljs.core.rest.call(null, s__4250);
        n = G__4253;
        coll = G__4254;
        continue
      }else {
        return s__4250
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__4252.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__4255 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__4256 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__4255.call(this, n);
      case 2:
        return drop_last__4256.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__4258 = cljs.core.seq.call(null, coll);
  var lead__4259 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__4259)) {
      var G__4260 = cljs.core.next.call(null, s__4258);
      var G__4261 = cljs.core.next.call(null, lead__4259);
      s__4258 = G__4260;
      lead__4259 = G__4261;
      continue
    }else {
      return s__4258
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__4264 = function(pred, coll) {
    while(true) {
      var s__4262 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____4263 = s__4262;
        if(cljs.core.truth_(and__3546__auto____4263)) {
          return pred.call(null, cljs.core.first.call(null, s__4262))
        }else {
          return and__3546__auto____4263
        }
      }())) {
        var G__4265 = pred;
        var G__4266 = cljs.core.rest.call(null, s__4262);
        pred = G__4265;
        coll = G__4266;
        continue
      }else {
        return s__4262
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__4264.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4267 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4267)) {
      var s__4268 = temp__3698__auto____4267;
      return cljs.core.concat.call(null, s__4268, cycle.call(null, s__4268))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.Vector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__4269 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__4270 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__4269.call(this, n);
      case 2:
        return repeat__4270.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__4272 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__4273 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__4272.call(this, n);
      case 2:
        return repeatedly__4273.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__4279 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__4275 = cljs.core.seq.call(null, c1);
      var s2__4276 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____4277 = s1__4275;
        if(cljs.core.truth_(and__3546__auto____4277)) {
          return s2__4276
        }else {
          return and__3546__auto____4277
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__4275), cljs.core.cons.call(null, cljs.core.first.call(null, s2__4276), interleave.call(null, cljs.core.rest.call(null, s1__4275), cljs.core.rest.call(null, s2__4276))))
      }else {
        return null
      }
    })
  };
  var interleave__4280 = function() {
    var G__4282__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__4278 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__4278))) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__4278), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__4278)))
        }else {
          return null
        }
      })
    };
    var G__4282 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4282__delegate.call(this, c1, c2, colls)
    };
    G__4282.cljs$lang$maxFixedArity = 2;
    G__4282.cljs$lang$applyTo = function(arglist__4283) {
      var c1 = cljs.core.first(arglist__4283);
      var c2 = cljs.core.first(cljs.core.next(arglist__4283));
      var colls = cljs.core.rest(cljs.core.next(arglist__4283));
      return G__4282__delegate.call(this, c1, c2, colls)
    };
    return G__4282
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__4279.call(this, c1, c2);
      default:
        return interleave__4280.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__4280.cljs$lang$applyTo;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__4286 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____4284 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____4284)) {
        var coll__4285 = temp__3695__auto____4284;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__4285), cat.call(null, cljs.core.rest.call(null, coll__4285), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__4286.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__4287 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__4288 = function() {
    var G__4290__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__4290 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4290__delegate.call(this, f, coll, colls)
    };
    G__4290.cljs$lang$maxFixedArity = 2;
    G__4290.cljs$lang$applyTo = function(arglist__4291) {
      var f = cljs.core.first(arglist__4291);
      var coll = cljs.core.first(cljs.core.next(arglist__4291));
      var colls = cljs.core.rest(cljs.core.next(arglist__4291));
      return G__4290__delegate.call(this, f, coll, colls)
    };
    return G__4290
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__4287.call(this, f, coll);
      default:
        return mapcat__4288.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__4288.cljs$lang$applyTo;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4292 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4292)) {
      var s__4293 = temp__3698__auto____4292;
      var f__4294 = cljs.core.first.call(null, s__4293);
      var r__4295 = cljs.core.rest.call(null, s__4293);
      if(cljs.core.truth_(pred.call(null, f__4294))) {
        return cljs.core.cons.call(null, f__4294, filter.call(null, pred, r__4295))
      }else {
        return filter.call(null, pred, r__4295)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__4297 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__4297.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__4296_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__4296_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  return cljs.core.reduce.call(null, cljs.core._conj, to, from)
};
cljs.core.partition = function() {
  var partition = null;
  var partition__4304 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__4305 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4298 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4298)) {
        var s__4299 = temp__3698__auto____4298;
        var p__4300 = cljs.core.take.call(null, n, s__4299);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__4300)))) {
          return cljs.core.cons.call(null, p__4300, partition.call(null, n, step, cljs.core.drop.call(null, step, s__4299)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__4306 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4301 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4301)) {
        var s__4302 = temp__3698__auto____4301;
        var p__4303 = cljs.core.take.call(null, n, s__4302);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__4303)))) {
          return cljs.core.cons.call(null, p__4303, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__4302)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__4303, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__4304.call(this, n, step);
      case 3:
        return partition__4305.call(this, n, step, pad);
      case 4:
        return partition__4306.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__4312 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__4313 = function(m, ks, not_found) {
    var sentinel__4308 = cljs.core.lookup_sentinel;
    var m__4309 = m;
    var ks__4310 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__4310)) {
        var m__4311 = cljs.core.get.call(null, m__4309, cljs.core.first.call(null, ks__4310), sentinel__4308);
        if(cljs.core.truth_(sentinel__4308 === m__4311)) {
          return not_found
        }else {
          var G__4315 = sentinel__4308;
          var G__4316 = m__4311;
          var G__4317 = cljs.core.next.call(null, ks__4310);
          sentinel__4308 = G__4315;
          m__4309 = G__4316;
          ks__4310 = G__4317;
          continue
        }
      }else {
        return m__4309
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__4312.call(this, m, ks);
      case 3:
        return get_in__4313.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__4318, v) {
  var vec__4319__4320 = p__4318;
  var k__4321 = cljs.core.nth.call(null, vec__4319__4320, 0, null);
  var ks__4322 = cljs.core.nthnext.call(null, vec__4319__4320, 1);
  if(cljs.core.truth_(ks__4322)) {
    return cljs.core.assoc.call(null, m, k__4321, assoc_in.call(null, cljs.core.get.call(null, m, k__4321), ks__4322, v))
  }else {
    return cljs.core.assoc.call(null, m, k__4321, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__4323, f, args) {
    var vec__4324__4325 = p__4323;
    var k__4326 = cljs.core.nth.call(null, vec__4324__4325, 0, null);
    var ks__4327 = cljs.core.nthnext.call(null, vec__4324__4325, 1);
    if(cljs.core.truth_(ks__4327)) {
      return cljs.core.assoc.call(null, m, k__4326, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__4326), ks__4327, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__4326, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__4326), args))
    }
  };
  var update_in = function(m, p__4323, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__4323, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__4328) {
    var m = cljs.core.first(arglist__4328);
    var p__4323 = cljs.core.first(cljs.core.next(arglist__4328));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4328)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4328)));
    return update_in__delegate.call(this, m, p__4323, f, args)
  };
  return update_in
}();
cljs.core.Vector = function(meta, array) {
  this.meta = meta;
  this.array = array
};
cljs.core.Vector.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4329 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4362 = null;
  var G__4362__4363 = function(coll, k) {
    var this__4330 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__4362__4364 = function(coll, k, not_found) {
    var this__4331 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__4362 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4362__4363.call(this, coll, k);
      case 3:
        return G__4362__4364.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4362
}();
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__4332 = this;
  var new_array__4333 = cljs.core.aclone.call(null, this__4332.array);
  new_array__4333[k] = v;
  return new cljs.core.Vector(this__4332.meta, new_array__4333)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__4366 = null;
  var G__4366__4367 = function(tsym4334, k) {
    var this__4336 = this;
    var tsym4334__4337 = this;
    var coll__4338 = tsym4334__4337;
    return cljs.core._lookup.call(null, coll__4338, k)
  };
  var G__4366__4368 = function(tsym4335, k, not_found) {
    var this__4339 = this;
    var tsym4335__4340 = this;
    var coll__4341 = tsym4335__4340;
    return cljs.core._lookup.call(null, coll__4341, k, not_found)
  };
  G__4366 = function(tsym4335, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4366__4367.call(this, tsym4335, k);
      case 3:
        return G__4366__4368.call(this, tsym4335, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4366
}();
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4342 = this;
  var new_array__4343 = cljs.core.aclone.call(null, this__4342.array);
  new_array__4343.push(o);
  return new cljs.core.Vector(this__4342.meta, new_array__4343)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__4370 = null;
  var G__4370__4371 = function(v, f) {
    var this__4344 = this;
    return cljs.core.ci_reduce.call(null, this__4344.array, f)
  };
  var G__4370__4372 = function(v, f, start) {
    var this__4345 = this;
    return cljs.core.ci_reduce.call(null, this__4345.array, f, start)
  };
  G__4370 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4370__4371.call(this, v, f);
      case 3:
        return G__4370__4372.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4370
}();
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4346 = this;
  if(cljs.core.truth_(this__4346.array.length > 0)) {
    var vector_seq__4347 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__4346.array.length)) {
          return cljs.core.cons.call(null, this__4346.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__4347.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4348 = this;
  return this__4348.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__4349 = this;
  var count__4350 = this__4349.array.length;
  if(cljs.core.truth_(count__4350 > 0)) {
    return this__4349.array[count__4350 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__4351 = this;
  if(cljs.core.truth_(this__4351.array.length > 0)) {
    var new_array__4352 = cljs.core.aclone.call(null, this__4351.array);
    new_array__4352.pop();
    return new cljs.core.Vector(this__4351.meta, new_array__4352)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__4353 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4354 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4355 = this;
  return new cljs.core.Vector(meta, this__4355.array)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4356 = this;
  return this__4356.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__4374 = null;
  var G__4374__4375 = function(coll, n) {
    var this__4357 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____4358 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____4358)) {
        return n < this__4357.array.length
      }else {
        return and__3546__auto____4358
      }
    }())) {
      return this__4357.array[n]
    }else {
      return null
    }
  };
  var G__4374__4376 = function(coll, n, not_found) {
    var this__4359 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____4360 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____4360)) {
        return n < this__4359.array.length
      }else {
        return and__3546__auto____4360
      }
    }())) {
      return this__4359.array[n]
    }else {
      return not_found
    }
  };
  G__4374 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4374__4375.call(this, coll, n);
      case 3:
        return G__4374__4376.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4374
}();
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4361 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__4361.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, cljs.core.array.call(null));
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs)
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.Vector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__4378) {
    var args = cljs.core.seq(arglist__4378);
    return vector__delegate.call(this, args)
  };
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end
};
cljs.core.Subvec.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4379 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4407 = null;
  var G__4407__4408 = function(coll, k) {
    var this__4380 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__4407__4409 = function(coll, k, not_found) {
    var this__4381 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__4407 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4407__4408.call(this, coll, k);
      case 3:
        return G__4407__4409.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4407
}();
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc = function(coll, key, val) {
  var this__4382 = this;
  var v_pos__4383 = this__4382.start + key;
  return new cljs.core.Subvec(this__4382.meta, cljs.core._assoc.call(null, this__4382.v, v_pos__4383, val), this__4382.start, this__4382.end > v_pos__4383 + 1 ? this__4382.end : v_pos__4383 + 1)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__4411 = null;
  var G__4411__4412 = function(tsym4384, k) {
    var this__4386 = this;
    var tsym4384__4387 = this;
    var coll__4388 = tsym4384__4387;
    return cljs.core._lookup.call(null, coll__4388, k)
  };
  var G__4411__4413 = function(tsym4385, k, not_found) {
    var this__4389 = this;
    var tsym4385__4390 = this;
    var coll__4391 = tsym4385__4390;
    return cljs.core._lookup.call(null, coll__4391, k, not_found)
  };
  G__4411 = function(tsym4385, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4411__4412.call(this, tsym4385, k);
      case 3:
        return G__4411__4413.call(this, tsym4385, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4411
}();
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4392 = this;
  return new cljs.core.Subvec(this__4392.meta, cljs.core._assoc_n.call(null, this__4392.v, this__4392.end, o), this__4392.start, this__4392.end + 1)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce = function() {
  var G__4415 = null;
  var G__4415__4416 = function(coll, f) {
    var this__4393 = this;
    return cljs.core.ci_reduce.call(null, coll, f)
  };
  var G__4415__4417 = function(coll, f, start) {
    var this__4394 = this;
    return cljs.core.ci_reduce.call(null, coll, f, start)
  };
  G__4415 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4415__4416.call(this, coll, f);
      case 3:
        return G__4415__4417.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4415
}();
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4395 = this;
  var subvec_seq__4396 = function subvec_seq(i) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, i, this__4395.end))) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__4395.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__4396.call(null, this__4395.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4397 = this;
  return this__4397.end - this__4397.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__4398 = this;
  return cljs.core._nth.call(null, this__4398.v, this__4398.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__4399 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, this__4399.start, this__4399.end))) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__4399.meta, this__4399.v, this__4399.start, this__4399.end - 1)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__4400 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4401 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4402 = this;
  return new cljs.core.Subvec(meta, this__4402.v, this__4402.start, this__4402.end)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4403 = this;
  return this__4403.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth = function() {
  var G__4419 = null;
  var G__4419__4420 = function(coll, n) {
    var this__4404 = this;
    return cljs.core._nth.call(null, this__4404.v, this__4404.start + n)
  };
  var G__4419__4421 = function(coll, n, not_found) {
    var this__4405 = this;
    return cljs.core._nth.call(null, this__4405.v, this__4405.start + n, not_found)
  };
  G__4419 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4419__4420.call(this, coll, n);
      case 3:
        return G__4419__4421.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4419
}();
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4406 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__4406.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__4423 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__4424 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__4423.call(this, v, start);
      case 3:
        return subvec__4424.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subvec
}();
cljs.core.PersistentQueueSeq = function(meta, front, rear) {
  this.meta = meta;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueueSeq.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4426 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4427 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4428 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4429 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__4429.meta)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4430 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__4431 = this;
  return cljs.core._first.call(null, this__4431.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__4432 = this;
  var temp__3695__auto____4433 = cljs.core.next.call(null, this__4432.front);
  if(cljs.core.truth_(temp__3695__auto____4433)) {
    var f1__4434 = temp__3695__auto____4433;
    return new cljs.core.PersistentQueueSeq(this__4432.meta, f1__4434, this__4432.rear)
  }else {
    if(cljs.core.truth_(this__4432.rear === null)) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__4432.meta, this__4432.rear, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4435 = this;
  return this__4435.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4436 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__4436.front, this__4436.rear)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueue.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4437 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4438 = this;
  if(cljs.core.truth_(this__4438.front)) {
    return new cljs.core.PersistentQueue(this__4438.meta, this__4438.count + 1, this__4438.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____4439 = this__4438.rear;
      if(cljs.core.truth_(or__3548__auto____4439)) {
        return or__3548__auto____4439
      }else {
        return cljs.core.Vector.fromArray([])
      }
    }(), o))
  }else {
    return new cljs.core.PersistentQueue(this__4438.meta, this__4438.count + 1, cljs.core.conj.call(null, this__4438.front, o), cljs.core.Vector.fromArray([]))
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4440 = this;
  var rear__4441 = cljs.core.seq.call(null, this__4440.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____4442 = this__4440.front;
    if(cljs.core.truth_(or__3548__auto____4442)) {
      return or__3548__auto____4442
    }else {
      return rear__4441
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__4440.front, cljs.core.seq.call(null, rear__4441))
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4443 = this;
  return this__4443.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__4444 = this;
  return cljs.core._first.call(null, this__4444.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__4445 = this;
  if(cljs.core.truth_(this__4445.front)) {
    var temp__3695__auto____4446 = cljs.core.next.call(null, this__4445.front);
    if(cljs.core.truth_(temp__3695__auto____4446)) {
      var f1__4447 = temp__3695__auto____4446;
      return new cljs.core.PersistentQueue(this__4445.meta, this__4445.count - 1, f1__4447, this__4445.rear)
    }else {
      return new cljs.core.PersistentQueue(this__4445.meta, this__4445.count - 1, cljs.core.seq.call(null, this__4445.rear), cljs.core.Vector.fromArray([]))
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__4448 = this;
  return cljs.core.first.call(null, this__4448.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__4449 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4450 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4451 = this;
  return new cljs.core.PersistentQueue(meta, this__4451.count, this__4451.front, this__4451.rear)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4452 = this;
  return this__4452.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4453 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.Vector.fromArray([]));
cljs.core.NeverEquiv = function() {
};
cljs.core.NeverEquiv.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__4454 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.map_QMARK_.call(null, y)) ? cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, x), cljs.core.count.call(null, y))) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__4455 = array.length;
  var i__4456 = 0;
  while(true) {
    if(cljs.core.truth_(i__4456 < len__4455)) {
      if(cljs.core.truth_(cljs.core._EQ_.call(null, k, array[i__4456]))) {
        return i__4456
      }else {
        var G__4457 = i__4456 + incr;
        i__4456 = G__4457;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___4459 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___4460 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____4458 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____4458)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____4458
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___4459.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___4460.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__4463 = cljs.core.hash.call(null, a);
  var b__4464 = cljs.core.hash.call(null, b);
  if(cljs.core.truth_(a__4463 < b__4464)) {
    return-1
  }else {
    if(cljs.core.truth_(a__4463 > b__4464)) {
      return 1
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.ObjMap = function(meta, keys, strobj) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj
};
cljs.core.ObjMap.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4465 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4492 = null;
  var G__4492__4493 = function(coll, k) {
    var this__4466 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__4492__4494 = function(coll, k, not_found) {
    var this__4467 = this;
    return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__4467.strobj, this__4467.strobj[k], not_found)
  };
  G__4492 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4492__4493.call(this, coll, k);
      case 3:
        return G__4492__4494.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4492
}();
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__4468 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var new_strobj__4469 = goog.object.clone.call(null, this__4468.strobj);
    var overwrite_QMARK___4470 = new_strobj__4469.hasOwnProperty(k);
    new_strobj__4469[k] = v;
    if(cljs.core.truth_(overwrite_QMARK___4470)) {
      return new cljs.core.ObjMap(this__4468.meta, this__4468.keys, new_strobj__4469)
    }else {
      var new_keys__4471 = cljs.core.aclone.call(null, this__4468.keys);
      new_keys__4471.push(k);
      return new cljs.core.ObjMap(this__4468.meta, new_keys__4471, new_strobj__4469)
    }
  }else {
    return cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null, k, v), cljs.core.seq.call(null, coll)), this__4468.meta)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__4472 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__4472.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__4496 = null;
  var G__4496__4497 = function(tsym4473, k) {
    var this__4475 = this;
    var tsym4473__4476 = this;
    var coll__4477 = tsym4473__4476;
    return cljs.core._lookup.call(null, coll__4477, k)
  };
  var G__4496__4498 = function(tsym4474, k, not_found) {
    var this__4478 = this;
    var tsym4474__4479 = this;
    var coll__4480 = tsym4474__4479;
    return cljs.core._lookup.call(null, coll__4480, k, not_found)
  };
  G__4496 = function(tsym4474, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4496__4497.call(this, tsym4474, k);
      case 3:
        return G__4496__4498.call(this, tsym4474, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4496
}();
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__4481 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4482 = this;
  if(cljs.core.truth_(this__4482.keys.length > 0)) {
    return cljs.core.map.call(null, function(p1__4462_SHARP_) {
      return cljs.core.vector.call(null, p1__4462_SHARP_, this__4482.strobj[p1__4462_SHARP_])
    }, this__4482.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4483 = this;
  return this__4483.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4484 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4485 = this;
  return new cljs.core.ObjMap(meta, this__4485.keys, this__4485.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4486 = this;
  return this__4486.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4487 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__4487.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__4488 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____4489 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____4489)) {
      return this__4488.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____4489
    }
  }())) {
    var new_keys__4490 = cljs.core.aclone.call(null, this__4488.keys);
    var new_strobj__4491 = goog.object.clone.call(null, this__4488.strobj);
    new_keys__4490.splice(cljs.core.scan_array.call(null, 1, k, new_keys__4490), 1);
    cljs.core.js_delete.call(null, new_strobj__4491, k);
    return new cljs.core.ObjMap(this__4488.meta, new_keys__4490, new_strobj__4491)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, cljs.core.array.call(null), cljs.core.js_obj.call(null));
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj)
};
cljs.core.HashMap = function(meta, count, hashobj) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj
};
cljs.core.HashMap.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4501 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4539 = null;
  var G__4539__4540 = function(coll, k) {
    var this__4502 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__4539__4541 = function(coll, k, not_found) {
    var this__4503 = this;
    var bucket__4504 = this__4503.hashobj[cljs.core.hash.call(null, k)];
    var i__4505 = cljs.core.truth_(bucket__4504) ? cljs.core.scan_array.call(null, 2, k, bucket__4504) : null;
    if(cljs.core.truth_(i__4505)) {
      return bucket__4504[i__4505 + 1]
    }else {
      return not_found
    }
  };
  G__4539 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4539__4540.call(this, coll, k);
      case 3:
        return G__4539__4541.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4539
}();
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__4506 = this;
  var h__4507 = cljs.core.hash.call(null, k);
  var bucket__4508 = this__4506.hashobj[h__4507];
  if(cljs.core.truth_(bucket__4508)) {
    var new_bucket__4509 = cljs.core.aclone.call(null, bucket__4508);
    var new_hashobj__4510 = goog.object.clone.call(null, this__4506.hashobj);
    new_hashobj__4510[h__4507] = new_bucket__4509;
    var temp__3695__auto____4511 = cljs.core.scan_array.call(null, 2, k, new_bucket__4509);
    if(cljs.core.truth_(temp__3695__auto____4511)) {
      var i__4512 = temp__3695__auto____4511;
      new_bucket__4509[i__4512 + 1] = v;
      return new cljs.core.HashMap(this__4506.meta, this__4506.count, new_hashobj__4510)
    }else {
      new_bucket__4509.push(k, v);
      return new cljs.core.HashMap(this__4506.meta, this__4506.count + 1, new_hashobj__4510)
    }
  }else {
    var new_hashobj__4513 = goog.object.clone.call(null, this__4506.hashobj);
    new_hashobj__4513[h__4507] = cljs.core.array.call(null, k, v);
    return new cljs.core.HashMap(this__4506.meta, this__4506.count + 1, new_hashobj__4513)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__4514 = this;
  var bucket__4515 = this__4514.hashobj[cljs.core.hash.call(null, k)];
  var i__4516 = cljs.core.truth_(bucket__4515) ? cljs.core.scan_array.call(null, 2, k, bucket__4515) : null;
  if(cljs.core.truth_(i__4516)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__4543 = null;
  var G__4543__4544 = function(tsym4517, k) {
    var this__4519 = this;
    var tsym4517__4520 = this;
    var coll__4521 = tsym4517__4520;
    return cljs.core._lookup.call(null, coll__4521, k)
  };
  var G__4543__4545 = function(tsym4518, k, not_found) {
    var this__4522 = this;
    var tsym4518__4523 = this;
    var coll__4524 = tsym4518__4523;
    return cljs.core._lookup.call(null, coll__4524, k, not_found)
  };
  G__4543 = function(tsym4518, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4543__4544.call(this, tsym4518, k);
      case 3:
        return G__4543__4545.call(this, tsym4518, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4543
}();
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__4525 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4526 = this;
  if(cljs.core.truth_(this__4526.count > 0)) {
    var hashes__4527 = cljs.core.js_keys.call(null, this__4526.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__4500_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__4526.hashobj[p1__4500_SHARP_]))
    }, hashes__4527)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4528 = this;
  return this__4528.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4529 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4530 = this;
  return new cljs.core.HashMap(meta, this__4530.count, this__4530.hashobj)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4531 = this;
  return this__4531.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4532 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__4532.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__4533 = this;
  var h__4534 = cljs.core.hash.call(null, k);
  var bucket__4535 = this__4533.hashobj[h__4534];
  var i__4536 = cljs.core.truth_(bucket__4535) ? cljs.core.scan_array.call(null, 2, k, bucket__4535) : null;
  if(cljs.core.truth_(cljs.core.not.call(null, i__4536))) {
    return coll
  }else {
    var new_hashobj__4537 = goog.object.clone.call(null, this__4533.hashobj);
    if(cljs.core.truth_(3 > bucket__4535.length)) {
      cljs.core.js_delete.call(null, new_hashobj__4537, h__4534)
    }else {
      var new_bucket__4538 = cljs.core.aclone.call(null, bucket__4535);
      new_bucket__4538.splice(i__4536, 2);
      new_hashobj__4537[h__4534] = new_bucket__4538
    }
    return new cljs.core.HashMap(this__4533.meta, this__4533.count - 1, new_hashobj__4537)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, cljs.core.js_obj.call(null));
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__4547 = ks.length;
  var i__4548 = 0;
  var out__4549 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(cljs.core.truth_(i__4548 < len__4547)) {
      var G__4550 = i__4548 + 1;
      var G__4551 = cljs.core.assoc.call(null, out__4549, ks[i__4548], vs[i__4548]);
      i__4548 = G__4550;
      out__4549 = G__4551;
      continue
    }else {
      return out__4549
    }
    break
  }
};
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__4552 = cljs.core.seq.call(null, keyvals);
    var out__4553 = cljs.core.HashMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__4552)) {
        var G__4554 = cljs.core.nnext.call(null, in$__4552);
        var G__4555 = cljs.core.assoc.call(null, out__4553, cljs.core.first.call(null, in$__4552), cljs.core.second.call(null, in$__4552));
        in$__4552 = G__4554;
        out__4553 = G__4555;
        continue
      }else {
        return out__4553
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__4556) {
    var keyvals = cljs.core.seq(arglist__4556);
    return hash_map__delegate.call(this, keyvals)
  };
  return hash_map
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__4557_SHARP_, p2__4558_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____4559 = p1__4557_SHARP_;
          if(cljs.core.truth_(or__3548__auto____4559)) {
            return or__3548__auto____4559
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__4558_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__4560) {
    var maps = cljs.core.seq(arglist__4560);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__4563 = function(m, e) {
        var k__4561 = cljs.core.first.call(null, e);
        var v__4562 = cljs.core.second.call(null, e);
        if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, m, k__4561))) {
          return cljs.core.assoc.call(null, m, k__4561, f.call(null, cljs.core.get.call(null, m, k__4561), v__4562))
        }else {
          return cljs.core.assoc.call(null, m, k__4561, v__4562)
        }
      };
      var merge2__4565 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__4563, function() {
          var or__3548__auto____4564 = m1;
          if(cljs.core.truth_(or__3548__auto____4564)) {
            return or__3548__auto____4564
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__4565, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__4566) {
    var f = cljs.core.first(arglist__4566);
    var maps = cljs.core.rest(arglist__4566);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__4568 = cljs.core.ObjMap.fromObject([], {});
  var keys__4569 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__4569)) {
      var key__4570 = cljs.core.first.call(null, keys__4569);
      var entry__4571 = cljs.core.get.call(null, map, key__4570, "\ufdd0'user/not-found");
      var G__4572 = cljs.core.truth_(cljs.core.not_EQ_.call(null, entry__4571, "\ufdd0'user/not-found")) ? cljs.core.assoc.call(null, ret__4568, key__4570, entry__4571) : ret__4568;
      var G__4573 = cljs.core.next.call(null, keys__4569);
      ret__4568 = G__4572;
      keys__4569 = G__4573;
      continue
    }else {
      return ret__4568
    }
    break
  }
};
cljs.core.Set = function(meta, hash_map) {
  this.meta = meta;
  this.hash_map = hash_map
};
cljs.core.Set.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Set")
};
cljs.core.Set.prototype.cljs$core$IHash$ = true;
cljs.core.Set.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4574 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Set.prototype.cljs$core$ILookup$ = true;
cljs.core.Set.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4595 = null;
  var G__4595__4596 = function(coll, v) {
    var this__4575 = this;
    return cljs.core._lookup.call(null, coll, v, null)
  };
  var G__4595__4597 = function(coll, v, not_found) {
    var this__4576 = this;
    if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__4576.hash_map, v))) {
      return v
    }else {
      return not_found
    }
  };
  G__4595 = function(coll, v, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4595__4596.call(this, coll, v);
      case 3:
        return G__4595__4597.call(this, coll, v, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4595
}();
cljs.core.Set.prototype.cljs$core$IFn$ = true;
cljs.core.Set.prototype.call = function() {
  var G__4599 = null;
  var G__4599__4600 = function(tsym4577, k) {
    var this__4579 = this;
    var tsym4577__4580 = this;
    var coll__4581 = tsym4577__4580;
    return cljs.core._lookup.call(null, coll__4581, k)
  };
  var G__4599__4601 = function(tsym4578, k, not_found) {
    var this__4582 = this;
    var tsym4578__4583 = this;
    var coll__4584 = tsym4578__4583;
    return cljs.core._lookup.call(null, coll__4584, k, not_found)
  };
  G__4599 = function(tsym4578, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4599__4600.call(this, tsym4578, k);
      case 3:
        return G__4599__4601.call(this, tsym4578, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4599
}();
cljs.core.Set.prototype.cljs$core$ICollection$ = true;
cljs.core.Set.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4585 = this;
  return new cljs.core.Set(this__4585.meta, cljs.core.assoc.call(null, this__4585.hash_map, o, null))
};
cljs.core.Set.prototype.cljs$core$ISeqable$ = true;
cljs.core.Set.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4586 = this;
  return cljs.core.keys.call(null, this__4586.hash_map)
};
cljs.core.Set.prototype.cljs$core$ISet$ = true;
cljs.core.Set.prototype.cljs$core$ISet$_disjoin = function(coll, v) {
  var this__4587 = this;
  return new cljs.core.Set(this__4587.meta, cljs.core.dissoc.call(null, this__4587.hash_map, v))
};
cljs.core.Set.prototype.cljs$core$ICounted$ = true;
cljs.core.Set.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4588 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.Set.prototype.cljs$core$IEquiv$ = true;
cljs.core.Set.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4589 = this;
  var and__3546__auto____4590 = cljs.core.set_QMARK_.call(null, other);
  if(cljs.core.truth_(and__3546__auto____4590)) {
    var and__3546__auto____4591 = cljs.core._EQ_.call(null, cljs.core.count.call(null, coll), cljs.core.count.call(null, other));
    if(cljs.core.truth_(and__3546__auto____4591)) {
      return cljs.core.every_QMARK_.call(null, function(p1__4567_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__4567_SHARP_)
      }, other)
    }else {
      return and__3546__auto____4591
    }
  }else {
    return and__3546__auto____4590
  }
};
cljs.core.Set.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Set.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4592 = this;
  return new cljs.core.Set(meta, this__4592.hash_map)
};
cljs.core.Set.prototype.cljs$core$IMeta$ = true;
cljs.core.Set.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4593 = this;
  return this__4593.meta
};
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4594 = this;
  return cljs.core.with_meta.call(null, cljs.core.Set.EMPTY, this__4594.meta)
};
cljs.core.Set;
cljs.core.Set.EMPTY = new cljs.core.Set(null, cljs.core.hash_map.call(null));
cljs.core.set = function set(coll) {
  var in$__4604 = cljs.core.seq.call(null, coll);
  var out__4605 = cljs.core.Set.EMPTY;
  while(true) {
    if(cljs.core.truth_(cljs.core.not.call(null, cljs.core.empty_QMARK_.call(null, in$__4604)))) {
      var G__4606 = cljs.core.rest.call(null, in$__4604);
      var G__4607 = cljs.core.conj.call(null, out__4605, cljs.core.first.call(null, in$__4604));
      in$__4604 = G__4606;
      out__4605 = G__4607;
      continue
    }else {
      return out__4605
    }
    break
  }
};
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, coll))) {
    var n__4608 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____4609 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____4609)) {
        var e__4610 = temp__3695__auto____4609;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__4610))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__4608, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__4603_SHARP_) {
      var temp__3695__auto____4611 = cljs.core.find.call(null, smap, p1__4603_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____4611)) {
        var e__4612 = temp__3695__auto____4611;
        return cljs.core.second.call(null, e__4612)
      }else {
        return p1__4603_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__4620 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__4613, seen) {
        while(true) {
          var vec__4614__4615 = p__4613;
          var f__4616 = cljs.core.nth.call(null, vec__4614__4615, 0, null);
          var xs__4617 = vec__4614__4615;
          var temp__3698__auto____4618 = cljs.core.seq.call(null, xs__4617);
          if(cljs.core.truth_(temp__3698__auto____4618)) {
            var s__4619 = temp__3698__auto____4618;
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, seen, f__4616))) {
              var G__4621 = cljs.core.rest.call(null, s__4619);
              var G__4622 = seen;
              p__4613 = G__4621;
              seen = G__4622;
              continue
            }else {
              return cljs.core.cons.call(null, f__4616, step.call(null, cljs.core.rest.call(null, s__4619), cljs.core.conj.call(null, seen, f__4616)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__4620.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__4623 = cljs.core.Vector.fromArray([]);
  var s__4624 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__4624))) {
      var G__4625 = cljs.core.conj.call(null, ret__4623, cljs.core.first.call(null, s__4624));
      var G__4626 = cljs.core.next.call(null, s__4624);
      ret__4623 = G__4625;
      s__4624 = G__4626;
      continue
    }else {
      return cljs.core.seq.call(null, ret__4623)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, x))) {
    return x
  }else {
    if(cljs.core.truth_(function() {
      var or__3548__auto____4627 = cljs.core.keyword_QMARK_.call(null, x);
      if(cljs.core.truth_(or__3548__auto____4627)) {
        return or__3548__auto____4627
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }())) {
      var i__4628 = x.lastIndexOf("/");
      if(cljs.core.truth_(i__4628 < 0)) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__4628 + 1)
      }
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Doesn't support name: ", x));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(cljs.core.truth_(function() {
    var or__3548__auto____4629 = cljs.core.keyword_QMARK_.call(null, x);
    if(cljs.core.truth_(or__3548__auto____4629)) {
      return or__3548__auto____4629
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }())) {
    var i__4630 = x.lastIndexOf("/");
    if(cljs.core.truth_(i__4630 > -1)) {
      return cljs.core.subs.call(null, x, 2, i__4630)
    }else {
      return null
    }
  }else {
    throw new Error(cljs.core.str.call(null, "Doesn't support namespace: ", x));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__4633 = cljs.core.ObjMap.fromObject([], {});
  var ks__4634 = cljs.core.seq.call(null, keys);
  var vs__4635 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____4636 = ks__4634;
      if(cljs.core.truth_(and__3546__auto____4636)) {
        return vs__4635
      }else {
        return and__3546__auto____4636
      }
    }())) {
      var G__4637 = cljs.core.assoc.call(null, map__4633, cljs.core.first.call(null, ks__4634), cljs.core.first.call(null, vs__4635));
      var G__4638 = cljs.core.next.call(null, ks__4634);
      var G__4639 = cljs.core.next.call(null, vs__4635);
      map__4633 = G__4637;
      ks__4634 = G__4638;
      vs__4635 = G__4639;
      continue
    }else {
      return map__4633
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__4642 = function(k, x) {
    return x
  };
  var max_key__4643 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) > k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__4644 = function() {
    var G__4646__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__4631_SHARP_, p2__4632_SHARP_) {
        return max_key.call(null, k, p1__4631_SHARP_, p2__4632_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__4646 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4646__delegate.call(this, k, x, y, more)
    };
    G__4646.cljs$lang$maxFixedArity = 3;
    G__4646.cljs$lang$applyTo = function(arglist__4647) {
      var k = cljs.core.first(arglist__4647);
      var x = cljs.core.first(cljs.core.next(arglist__4647));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4647)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4647)));
      return G__4646__delegate.call(this, k, x, y, more)
    };
    return G__4646
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__4642.call(this, k, x);
      case 3:
        return max_key__4643.call(this, k, x, y);
      default:
        return max_key__4644.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4644.cljs$lang$applyTo;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__4648 = function(k, x) {
    return x
  };
  var min_key__4649 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) < k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__4650 = function() {
    var G__4652__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__4640_SHARP_, p2__4641_SHARP_) {
        return min_key.call(null, k, p1__4640_SHARP_, p2__4641_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__4652 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4652__delegate.call(this, k, x, y, more)
    };
    G__4652.cljs$lang$maxFixedArity = 3;
    G__4652.cljs$lang$applyTo = function(arglist__4653) {
      var k = cljs.core.first(arglist__4653);
      var x = cljs.core.first(cljs.core.next(arglist__4653));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4653)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4653)));
      return G__4652__delegate.call(this, k, x, y, more)
    };
    return G__4652
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__4648.call(this, k, x);
      case 3:
        return min_key__4649.call(this, k, x, y);
      default:
        return min_key__4650.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4650.cljs$lang$applyTo;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__4656 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__4657 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4654 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4654)) {
        var s__4655 = temp__3698__auto____4654;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__4655), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__4655)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__4656.call(this, n, step);
      case 3:
        return partition_all__4657.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4659 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4659)) {
      var s__4660 = temp__3698__auto____4659;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__4660)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__4660), take_while.call(null, pred, cljs.core.rest.call(null, s__4660)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.Range = function(meta, start, end, step) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step
};
cljs.core.Range.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash = function(rng) {
  var this__4661 = this;
  return cljs.core.hash_coll.call(null, rng)
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj = function(rng, o) {
  var this__4662 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce = function() {
  var G__4678 = null;
  var G__4678__4679 = function(rng, f) {
    var this__4663 = this;
    return cljs.core.ci_reduce.call(null, rng, f)
  };
  var G__4678__4680 = function(rng, f, s) {
    var this__4664 = this;
    return cljs.core.ci_reduce.call(null, rng, f, s)
  };
  G__4678 = function(rng, f, s) {
    switch(arguments.length) {
      case 2:
        return G__4678__4679.call(this, rng, f);
      case 3:
        return G__4678__4680.call(this, rng, f, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4678
}();
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq = function(rng) {
  var this__4665 = this;
  var comp__4666 = cljs.core.truth_(this__4665.step > 0) ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__4666.call(null, this__4665.start, this__4665.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count = function(rng) {
  var this__4667 = this;
  if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._seq.call(null, rng)))) {
    return 0
  }else {
    return Math["ceil"].call(null, (this__4667.end - this__4667.start) / this__4667.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first = function(rng) {
  var this__4668 = this;
  return this__4668.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest = function(rng) {
  var this__4669 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__4669.meta, this__4669.start + this__4669.step, this__4669.end, this__4669.step)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv = function(rng, other) {
  var this__4670 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta = function(rng, meta) {
  var this__4671 = this;
  return new cljs.core.Range(meta, this__4671.start, this__4671.end, this__4671.step)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta = function(rng) {
  var this__4672 = this;
  return this__4672.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth = function() {
  var G__4682 = null;
  var G__4682__4683 = function(rng, n) {
    var this__4673 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__4673.start + n * this__4673.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____4674 = this__4673.start > this__4673.end;
        if(cljs.core.truth_(and__3546__auto____4674)) {
          return cljs.core._EQ_.call(null, this__4673.step, 0)
        }else {
          return and__3546__auto____4674
        }
      }())) {
        return this__4673.start
      }else {
        throw new Error("Index out of bounds");
      }
    }
  };
  var G__4682__4684 = function(rng, n, not_found) {
    var this__4675 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__4675.start + n * this__4675.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____4676 = this__4675.start > this__4675.end;
        if(cljs.core.truth_(and__3546__auto____4676)) {
          return cljs.core._EQ_.call(null, this__4675.step, 0)
        }else {
          return and__3546__auto____4676
        }
      }())) {
        return this__4675.start
      }else {
        return not_found
      }
    }
  };
  G__4682 = function(rng, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4682__4683.call(this, rng, n);
      case 3:
        return G__4682__4684.call(this, rng, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4682
}();
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty = function(rng) {
  var this__4677 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__4677.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__4686 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__4687 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__4688 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__4689 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__4686.call(this);
      case 1:
        return range__4687.call(this, start);
      case 2:
        return range__4688.call(this, start, end);
      case 3:
        return range__4689.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4691 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4691)) {
      var s__4692 = temp__3698__auto____4691;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__4692), take_nth.call(null, n, cljs.core.drop.call(null, n, s__4692)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.Vector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4694 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4694)) {
      var s__4695 = temp__3698__auto____4694;
      var fst__4696 = cljs.core.first.call(null, s__4695);
      var fv__4697 = f.call(null, fst__4696);
      var run__4698 = cljs.core.cons.call(null, fst__4696, cljs.core.take_while.call(null, function(p1__4693_SHARP_) {
        return cljs.core._EQ_.call(null, fv__4697, f.call(null, p1__4693_SHARP_))
      }, cljs.core.next.call(null, s__4695)));
      return cljs.core.cons.call(null, run__4698, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__4698), s__4695))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__4713 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____4709 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____4709)) {
        var s__4710 = temp__3695__auto____4709;
        return reductions.call(null, f, cljs.core.first.call(null, s__4710), cljs.core.rest.call(null, s__4710))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__4714 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4711 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4711)) {
        var s__4712 = temp__3698__auto____4711;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__4712)), cljs.core.rest.call(null, s__4712))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__4713.call(this, f, init);
      case 3:
        return reductions__4714.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__4717 = function(f) {
    return function() {
      var G__4722 = null;
      var G__4722__4723 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__4722__4724 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__4722__4725 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__4722__4726 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__4722__4727 = function() {
        var G__4729__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__4729 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4729__delegate.call(this, x, y, z, args)
        };
        G__4729.cljs$lang$maxFixedArity = 3;
        G__4729.cljs$lang$applyTo = function(arglist__4730) {
          var x = cljs.core.first(arglist__4730);
          var y = cljs.core.first(cljs.core.next(arglist__4730));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4730)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4730)));
          return G__4729__delegate.call(this, x, y, z, args)
        };
        return G__4729
      }();
      G__4722 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4722__4723.call(this);
          case 1:
            return G__4722__4724.call(this, x);
          case 2:
            return G__4722__4725.call(this, x, y);
          case 3:
            return G__4722__4726.call(this, x, y, z);
          default:
            return G__4722__4727.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4722.cljs$lang$maxFixedArity = 3;
      G__4722.cljs$lang$applyTo = G__4722__4727.cljs$lang$applyTo;
      return G__4722
    }()
  };
  var juxt__4718 = function(f, g) {
    return function() {
      var G__4731 = null;
      var G__4731__4732 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__4731__4733 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__4731__4734 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__4731__4735 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__4731__4736 = function() {
        var G__4738__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__4738 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4738__delegate.call(this, x, y, z, args)
        };
        G__4738.cljs$lang$maxFixedArity = 3;
        G__4738.cljs$lang$applyTo = function(arglist__4739) {
          var x = cljs.core.first(arglist__4739);
          var y = cljs.core.first(cljs.core.next(arglist__4739));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4739)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4739)));
          return G__4738__delegate.call(this, x, y, z, args)
        };
        return G__4738
      }();
      G__4731 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4731__4732.call(this);
          case 1:
            return G__4731__4733.call(this, x);
          case 2:
            return G__4731__4734.call(this, x, y);
          case 3:
            return G__4731__4735.call(this, x, y, z);
          default:
            return G__4731__4736.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4731.cljs$lang$maxFixedArity = 3;
      G__4731.cljs$lang$applyTo = G__4731__4736.cljs$lang$applyTo;
      return G__4731
    }()
  };
  var juxt__4719 = function(f, g, h) {
    return function() {
      var G__4740 = null;
      var G__4740__4741 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__4740__4742 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__4740__4743 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__4740__4744 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__4740__4745 = function() {
        var G__4747__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__4747 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4747__delegate.call(this, x, y, z, args)
        };
        G__4747.cljs$lang$maxFixedArity = 3;
        G__4747.cljs$lang$applyTo = function(arglist__4748) {
          var x = cljs.core.first(arglist__4748);
          var y = cljs.core.first(cljs.core.next(arglist__4748));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4748)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4748)));
          return G__4747__delegate.call(this, x, y, z, args)
        };
        return G__4747
      }();
      G__4740 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4740__4741.call(this);
          case 1:
            return G__4740__4742.call(this, x);
          case 2:
            return G__4740__4743.call(this, x, y);
          case 3:
            return G__4740__4744.call(this, x, y, z);
          default:
            return G__4740__4745.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4740.cljs$lang$maxFixedArity = 3;
      G__4740.cljs$lang$applyTo = G__4740__4745.cljs$lang$applyTo;
      return G__4740
    }()
  };
  var juxt__4720 = function() {
    var G__4749__delegate = function(f, g, h, fs) {
      var fs__4716 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__4750 = null;
        var G__4750__4751 = function() {
          return cljs.core.reduce.call(null, function(p1__4699_SHARP_, p2__4700_SHARP_) {
            return cljs.core.conj.call(null, p1__4699_SHARP_, p2__4700_SHARP_.call(null))
          }, cljs.core.Vector.fromArray([]), fs__4716)
        };
        var G__4750__4752 = function(x) {
          return cljs.core.reduce.call(null, function(p1__4701_SHARP_, p2__4702_SHARP_) {
            return cljs.core.conj.call(null, p1__4701_SHARP_, p2__4702_SHARP_.call(null, x))
          }, cljs.core.Vector.fromArray([]), fs__4716)
        };
        var G__4750__4753 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__4703_SHARP_, p2__4704_SHARP_) {
            return cljs.core.conj.call(null, p1__4703_SHARP_, p2__4704_SHARP_.call(null, x, y))
          }, cljs.core.Vector.fromArray([]), fs__4716)
        };
        var G__4750__4754 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__4705_SHARP_, p2__4706_SHARP_) {
            return cljs.core.conj.call(null, p1__4705_SHARP_, p2__4706_SHARP_.call(null, x, y, z))
          }, cljs.core.Vector.fromArray([]), fs__4716)
        };
        var G__4750__4755 = function() {
          var G__4757__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__4707_SHARP_, p2__4708_SHARP_) {
              return cljs.core.conj.call(null, p1__4707_SHARP_, cljs.core.apply.call(null, p2__4708_SHARP_, x, y, z, args))
            }, cljs.core.Vector.fromArray([]), fs__4716)
          };
          var G__4757 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__4757__delegate.call(this, x, y, z, args)
          };
          G__4757.cljs$lang$maxFixedArity = 3;
          G__4757.cljs$lang$applyTo = function(arglist__4758) {
            var x = cljs.core.first(arglist__4758);
            var y = cljs.core.first(cljs.core.next(arglist__4758));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4758)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4758)));
            return G__4757__delegate.call(this, x, y, z, args)
          };
          return G__4757
        }();
        G__4750 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__4750__4751.call(this);
            case 1:
              return G__4750__4752.call(this, x);
            case 2:
              return G__4750__4753.call(this, x, y);
            case 3:
              return G__4750__4754.call(this, x, y, z);
            default:
              return G__4750__4755.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__4750.cljs$lang$maxFixedArity = 3;
        G__4750.cljs$lang$applyTo = G__4750__4755.cljs$lang$applyTo;
        return G__4750
      }()
    };
    var G__4749 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4749__delegate.call(this, f, g, h, fs)
    };
    G__4749.cljs$lang$maxFixedArity = 3;
    G__4749.cljs$lang$applyTo = function(arglist__4759) {
      var f = cljs.core.first(arglist__4759);
      var g = cljs.core.first(cljs.core.next(arglist__4759));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4759)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4759)));
      return G__4749__delegate.call(this, f, g, h, fs)
    };
    return G__4749
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__4717.call(this, f);
      case 2:
        return juxt__4718.call(this, f, g);
      case 3:
        return juxt__4719.call(this, f, g, h);
      default:
        return juxt__4720.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4720.cljs$lang$applyTo;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__4761 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__4764 = cljs.core.next.call(null, coll);
        coll = G__4764;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__4762 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____4760 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____4760)) {
          return n > 0
        }else {
          return and__3546__auto____4760
        }
      }())) {
        var G__4765 = n - 1;
        var G__4766 = cljs.core.next.call(null, coll);
        n = G__4765;
        coll = G__4766;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__4761.call(this, n);
      case 2:
        return dorun__4762.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__4767 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__4768 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__4767.call(this, n);
      case 2:
        return doall__4768.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__4770 = re.exec(s);
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__4770), s))) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__4770), 1))) {
      return cljs.core.first.call(null, matches__4770)
    }else {
      return cljs.core.vec.call(null, matches__4770)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__4771 = re.exec(s);
  if(cljs.core.truth_(matches__4771 === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__4771), 1))) {
      return cljs.core.first.call(null, matches__4771)
    }else {
      return cljs.core.vec.call(null, matches__4771)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__4772 = cljs.core.re_find.call(null, re, s);
  var match_idx__4773 = s.search(re);
  var match_str__4774 = cljs.core.truth_(cljs.core.coll_QMARK_.call(null, match_data__4772)) ? cljs.core.first.call(null, match_data__4772) : match_data__4772;
  var post_match__4775 = cljs.core.subs.call(null, s, match_idx__4773 + cljs.core.count.call(null, match_str__4774));
  if(cljs.core.truth_(match_data__4772)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__4772, re_seq.call(null, re, post_match__4775))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__4777__4778 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___4779 = cljs.core.nth.call(null, vec__4777__4778, 0, null);
  var flags__4780 = cljs.core.nth.call(null, vec__4777__4778, 1, null);
  var pattern__4781 = cljs.core.nth.call(null, vec__4777__4778, 2, null);
  return new RegExp(pattern__4781, flags__4780)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.Vector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.Vector.fromArray([sep]), cljs.core.map.call(null, function(p1__4776_SHARP_) {
    return print_one.call(null, p1__4776_SHARP_, opts)
  }, coll))), cljs.core.Vector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(cljs.core.truth_(obj === null)) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(cljs.core.truth_(void 0 === obj)) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3546__auto____4782 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____4782)) {
            var and__3546__auto____4786 = function() {
              var x__450__auto____4783 = obj;
              if(cljs.core.truth_(function() {
                var and__3546__auto____4784 = x__450__auto____4783;
                if(cljs.core.truth_(and__3546__auto____4784)) {
                  var and__3546__auto____4785 = x__450__auto____4783.cljs$core$IMeta$;
                  if(cljs.core.truth_(and__3546__auto____4785)) {
                    return cljs.core.not.call(null, x__450__auto____4783.hasOwnProperty("cljs$core$IMeta$"))
                  }else {
                    return and__3546__auto____4785
                  }
                }else {
                  return and__3546__auto____4784
                }
              }())) {
                return true
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__450__auto____4783)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____4786)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____4786
            }
          }else {
            return and__3546__auto____4782
          }
        }()) ? cljs.core.concat.call(null, cljs.core.Vector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.Vector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var x__450__auto____4787 = obj;
          if(cljs.core.truth_(function() {
            var and__3546__auto____4788 = x__450__auto____4787;
            if(cljs.core.truth_(and__3546__auto____4788)) {
              var and__3546__auto____4789 = x__450__auto____4787.cljs$core$IPrintable$;
              if(cljs.core.truth_(and__3546__auto____4789)) {
                return cljs.core.not.call(null, x__450__auto____4787.hasOwnProperty("cljs$core$IPrintable$"))
              }else {
                return and__3546__auto____4789
              }
            }else {
              return and__3546__auto____4788
            }
          }())) {
            return true
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, x__450__auto____4787)
          }
        }()) ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.list.call(null, "#<", cljs.core.str.call(null, obj), ">"))
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  var first_obj__4790 = cljs.core.first.call(null, objs);
  var sb__4791 = new goog.string.StringBuffer;
  var G__4792__4793 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__4792__4793)) {
    var obj__4794 = cljs.core.first.call(null, G__4792__4793);
    var G__4792__4795 = G__4792__4793;
    while(true) {
      if(cljs.core.truth_(obj__4794 === first_obj__4790)) {
      }else {
        sb__4791.append(" ")
      }
      var G__4796__4797 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__4794, opts));
      if(cljs.core.truth_(G__4796__4797)) {
        var string__4798 = cljs.core.first.call(null, G__4796__4797);
        var G__4796__4799 = G__4796__4797;
        while(true) {
          sb__4791.append(string__4798);
          var temp__3698__auto____4800 = cljs.core.next.call(null, G__4796__4799);
          if(cljs.core.truth_(temp__3698__auto____4800)) {
            var G__4796__4801 = temp__3698__auto____4800;
            var G__4804 = cljs.core.first.call(null, G__4796__4801);
            var G__4805 = G__4796__4801;
            string__4798 = G__4804;
            G__4796__4799 = G__4805;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____4802 = cljs.core.next.call(null, G__4792__4795);
      if(cljs.core.truth_(temp__3698__auto____4802)) {
        var G__4792__4803 = temp__3698__auto____4802;
        var G__4806 = cljs.core.first.call(null, G__4792__4803);
        var G__4807 = G__4792__4803;
        obj__4794 = G__4806;
        G__4792__4795 = G__4807;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return cljs.core.str.call(null, sb__4791)
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__4808 = cljs.core.first.call(null, objs);
  var G__4809__4810 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__4809__4810)) {
    var obj__4811 = cljs.core.first.call(null, G__4809__4810);
    var G__4809__4812 = G__4809__4810;
    while(true) {
      if(cljs.core.truth_(obj__4811 === first_obj__4808)) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__4813__4814 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__4811, opts));
      if(cljs.core.truth_(G__4813__4814)) {
        var string__4815 = cljs.core.first.call(null, G__4813__4814);
        var G__4813__4816 = G__4813__4814;
        while(true) {
          cljs.core.string_print.call(null, string__4815);
          var temp__3698__auto____4817 = cljs.core.next.call(null, G__4813__4816);
          if(cljs.core.truth_(temp__3698__auto____4817)) {
            var G__4813__4818 = temp__3698__auto____4817;
            var G__4821 = cljs.core.first.call(null, G__4813__4818);
            var G__4822 = G__4813__4818;
            string__4815 = G__4821;
            G__4813__4816 = G__4822;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____4819 = cljs.core.next.call(null, G__4809__4812);
      if(cljs.core.truth_(temp__3698__auto____4819)) {
        var G__4809__4820 = temp__3698__auto____4819;
        var G__4823 = cljs.core.first.call(null, G__4809__4820);
        var G__4824 = G__4809__4820;
        obj__4811 = G__4823;
        G__4809__4812 = G__4824;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__4825) {
    var objs = cljs.core.seq(arglist__4825);
    return pr_str__delegate.call(this, objs)
  };
  return pr_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__4826) {
    var objs = cljs.core.seq(arglist__4826);
    return pr__delegate.call(this, objs)
  };
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__4827) {
    var objs = cljs.core.seq(arglist__4827);
    return cljs_core_print__delegate.call(this, objs)
  };
  return cljs_core_print
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__4828) {
    var objs = cljs.core.seq(arglist__4828);
    return println__delegate.call(this, objs)
  };
  return println
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__4829) {
    var objs = cljs.core.seq(arglist__4829);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__4830 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__4830, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, n))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, bool))
};
cljs.core.Set.prototype.cljs$core$IPrintable$ = true;
cljs.core.Set.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, obj))) {
    return cljs.core.list.call(null, cljs.core.str.call(null, ":", function() {
      var temp__3698__auto____4831 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____4831)) {
        var nspc__4832 = temp__3698__auto____4831;
        return cljs.core.str.call(null, nspc__4832, "/")
      }else {
        return null
      }
    }(), cljs.core.name.call(null, obj)))
  }else {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, obj))) {
      return cljs.core.list.call(null, cljs.core.str.call(null, function() {
        var temp__3698__auto____4833 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____4833)) {
          var nspc__4834 = temp__3698__auto____4833;
          return cljs.core.str.call(null, nspc__4834, "/")
        }else {
          return null
        }
      }(), cljs.core.name.call(null, obj)))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", cljs.core.str.call(null, this$), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__4835 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__4835, "{", ", ", "}", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches
};
cljs.core.Atom.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__4836 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches = function(this$, oldval, newval) {
  var this__4837 = this;
  var G__4838__4839 = cljs.core.seq.call(null, this__4837.watches);
  if(cljs.core.truth_(G__4838__4839)) {
    var G__4841__4843 = cljs.core.first.call(null, G__4838__4839);
    var vec__4842__4844 = G__4841__4843;
    var key__4845 = cljs.core.nth.call(null, vec__4842__4844, 0, null);
    var f__4846 = cljs.core.nth.call(null, vec__4842__4844, 1, null);
    var G__4838__4847 = G__4838__4839;
    var G__4841__4848 = G__4841__4843;
    var G__4838__4849 = G__4838__4847;
    while(true) {
      var vec__4850__4851 = G__4841__4848;
      var key__4852 = cljs.core.nth.call(null, vec__4850__4851, 0, null);
      var f__4853 = cljs.core.nth.call(null, vec__4850__4851, 1, null);
      var G__4838__4854 = G__4838__4849;
      f__4853.call(null, key__4852, this$, oldval, newval);
      var temp__3698__auto____4855 = cljs.core.next.call(null, G__4838__4854);
      if(cljs.core.truth_(temp__3698__auto____4855)) {
        var G__4838__4856 = temp__3698__auto____4855;
        var G__4863 = cljs.core.first.call(null, G__4838__4856);
        var G__4864 = G__4838__4856;
        G__4841__4848 = G__4863;
        G__4838__4849 = G__4864;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch = function(this$, key, f) {
  var this__4857 = this;
  return this$.watches = cljs.core.assoc.call(null, this__4857.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch = function(this$, key) {
  var this__4858 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__4858.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq = function(a, opts) {
  var this__4859 = this;
  return cljs.core.concat.call(null, cljs.core.Vector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__4859.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta = function(_) {
  var this__4860 = this;
  return this__4860.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__4861 = this;
  return this__4861.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__4862 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__4871 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__4872 = function() {
    var G__4874__delegate = function(x, p__4865) {
      var map__4866__4867 = p__4865;
      var map__4866__4868 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__4866__4867)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4866__4867) : map__4866__4867;
      var validator__4869 = cljs.core.get.call(null, map__4866__4868, "\ufdd0'validator");
      var meta__4870 = cljs.core.get.call(null, map__4866__4868, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__4870, validator__4869, null)
    };
    var G__4874 = function(x, var_args) {
      var p__4865 = null;
      if(goog.isDef(var_args)) {
        p__4865 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4874__delegate.call(this, x, p__4865)
    };
    G__4874.cljs$lang$maxFixedArity = 1;
    G__4874.cljs$lang$applyTo = function(arglist__4875) {
      var x = cljs.core.first(arglist__4875);
      var p__4865 = cljs.core.rest(arglist__4875);
      return G__4874__delegate.call(this, x, p__4865)
    };
    return G__4874
  }();
  atom = function(x, var_args) {
    var p__4865 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__4871.call(this, x);
      default:
        return atom__4872.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__4872.cljs$lang$applyTo;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____4876 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____4876)) {
    var validate__4877 = temp__3698__auto____4876;
    if(cljs.core.truth_(validate__4877.call(null, new_value))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", "Validator rejected reference state", "\n", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 3073)))));
    }
  }else {
  }
  var old_value__4878 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__4878, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___4879 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___4880 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4881 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___4882 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___4883 = function() {
    var G__4885__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__4885 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__4885__delegate.call(this, a, f, x, y, z, more)
    };
    G__4885.cljs$lang$maxFixedArity = 5;
    G__4885.cljs$lang$applyTo = function(arglist__4886) {
      var a = cljs.core.first(arglist__4886);
      var f = cljs.core.first(cljs.core.next(arglist__4886));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4886)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4886))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4886)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4886)))));
      return G__4885__delegate.call(this, a, f, x, y, z, more)
    };
    return G__4885
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___4879.call(this, a, f);
      case 3:
        return swap_BANG___4880.call(this, a, f, x);
      case 4:
        return swap_BANG___4881.call(this, a, f, x, y);
      case 5:
        return swap_BANG___4882.call(this, a, f, x, y, z);
      default:
        return swap_BANG___4883.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___4883.cljs$lang$applyTo;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, a.state, oldval))) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__4887) {
    var iref = cljs.core.first(arglist__4887);
    var f = cljs.core.first(cljs.core.next(arglist__4887));
    var args = cljs.core.rest(cljs.core.next(arglist__4887));
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__4888 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__4889 = function(prefix_string) {
    if(cljs.core.truth_(cljs.core.gensym_counter === null)) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, cljs.core.str.call(null, prefix_string, cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc)))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__4888.call(this);
      case 1:
        return gensym__4889.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(f, state) {
  this.f = f;
  this.state = state
};
cljs.core.Delay.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_ = function(d) {
  var this__4891 = this;
  return cljs.core.not.call(null, cljs.core.deref.call(null, this__4891.state) === null)
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__4892 = this;
  if(cljs.core.truth_(cljs.core.deref.call(null, this__4892.state))) {
  }else {
    cljs.core.swap_BANG_.call(null, this__4892.state, this__4892.f)
  }
  return cljs.core.deref.call(null, this__4892.state)
};
cljs.core.Delay;
cljs.core.delay = function() {
  var delay__delegate = function(body) {
    return new cljs.core.Delay(function() {
      return cljs.core.apply.call(null, cljs.core.identity, body)
    }, cljs.core.atom.call(null, null))
  };
  var delay = function(var_args) {
    var body = null;
    if(goog.isDef(var_args)) {
      body = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return delay__delegate.call(this, body)
  };
  delay.cljs$lang$maxFixedArity = 0;
  delay.cljs$lang$applyTo = function(arglist__4893) {
    var body = cljs.core.seq(arglist__4893);
    return delay__delegate.call(this, body)
  };
  return delay
}();
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.truth_(cljs.core.delay_QMARK_.call(null, x))) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__4894__4895 = options;
    var map__4894__4896 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__4894__4895)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4894__4895) : map__4894__4895;
    var keywordize_keys__4897 = cljs.core.get.call(null, map__4894__4896, "\ufdd0'keywordize-keys");
    var keyfn__4898 = cljs.core.truth_(keywordize_keys__4897) ? cljs.core.keyword : cljs.core.str;
    var f__4904 = function thisfn(x) {
      if(cljs.core.truth_(cljs.core.seq_QMARK_.call(null, x))) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.truth_(cljs.core.coll_QMARK_.call(null, x))) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.truth_(goog.isObject.call(null, x))) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__514__auto____4903 = function iter__4899(s__4900) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__4900__4901 = s__4900;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__4900__4901))) {
                        var k__4902 = cljs.core.first.call(null, s__4900__4901);
                        return cljs.core.cons.call(null, cljs.core.Vector.fromArray([keyfn__4898.call(null, k__4902), thisfn.call(null, x[k__4902])]), iter__4899.call(null, cljs.core.rest.call(null, s__4900__4901)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__514__auto____4903.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if(cljs.core.truth_("\ufdd0'else")) {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__4904.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__4905) {
    var x = cljs.core.first(arglist__4905);
    var options = cljs.core.rest(arglist__4905);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__4906 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__4910__delegate = function(args) {
      var temp__3695__auto____4907 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__4906), args);
      if(cljs.core.truth_(temp__3695__auto____4907)) {
        var v__4908 = temp__3695__auto____4907;
        return v__4908
      }else {
        var ret__4909 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__4906, cljs.core.assoc, args, ret__4909);
        return ret__4909
      }
    };
    var G__4910 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4910__delegate.call(this, args)
    };
    G__4910.cljs$lang$maxFixedArity = 0;
    G__4910.cljs$lang$applyTo = function(arglist__4911) {
      var args = cljs.core.seq(arglist__4911);
      return G__4910__delegate.call(this, args)
    };
    return G__4910
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__4913 = function(f) {
    while(true) {
      var ret__4912 = f.call(null);
      if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, ret__4912))) {
        var G__4916 = ret__4912;
        f = G__4916;
        continue
      }else {
        return ret__4912
      }
      break
    }
  };
  var trampoline__4914 = function() {
    var G__4917__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__4917 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4917__delegate.call(this, f, args)
    };
    G__4917.cljs$lang$maxFixedArity = 1;
    G__4917.cljs$lang$applyTo = function(arglist__4918) {
      var f = cljs.core.first(arglist__4918);
      var args = cljs.core.rest(arglist__4918);
      return G__4917__delegate.call(this, f, args)
    };
    return G__4917
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__4913.call(this, f);
      default:
        return trampoline__4914.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__4914.cljs$lang$applyTo;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__4919 = function() {
    return rand.call(null, 1)
  };
  var rand__4920 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__4919.call(this);
      case 1:
        return rand__4920.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__4922 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__4922, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__4922, cljs.core.Vector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___4931 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___4932 = function(h, child, parent) {
    var or__3548__auto____4923 = cljs.core._EQ_.call(null, child, parent);
    if(cljs.core.truth_(or__3548__auto____4923)) {
      return or__3548__auto____4923
    }else {
      var or__3548__auto____4924 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(cljs.core.truth_(or__3548__auto____4924)) {
        return or__3548__auto____4924
      }else {
        var and__3546__auto____4925 = cljs.core.vector_QMARK_.call(null, parent);
        if(cljs.core.truth_(and__3546__auto____4925)) {
          var and__3546__auto____4926 = cljs.core.vector_QMARK_.call(null, child);
          if(cljs.core.truth_(and__3546__auto____4926)) {
            var and__3546__auto____4927 = cljs.core._EQ_.call(null, cljs.core.count.call(null, parent), cljs.core.count.call(null, child));
            if(cljs.core.truth_(and__3546__auto____4927)) {
              var ret__4928 = true;
              var i__4929 = 0;
              while(true) {
                if(cljs.core.truth_(function() {
                  var or__3548__auto____4930 = cljs.core.not.call(null, ret__4928);
                  if(cljs.core.truth_(or__3548__auto____4930)) {
                    return or__3548__auto____4930
                  }else {
                    return cljs.core._EQ_.call(null, i__4929, cljs.core.count.call(null, parent))
                  }
                }())) {
                  return ret__4928
                }else {
                  var G__4934 = isa_QMARK_.call(null, h, child.call(null, i__4929), parent.call(null, i__4929));
                  var G__4935 = i__4929 + 1;
                  ret__4928 = G__4934;
                  i__4929 = G__4935;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____4927
            }
          }else {
            return and__3546__auto____4926
          }
        }else {
          return and__3546__auto____4925
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___4931.call(this, h, child);
      case 3:
        return isa_QMARK___4932.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__4936 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__4937 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__4936.call(this, h);
      case 2:
        return parents__4937.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__4939 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__4940 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__4939.call(this, h);
      case 2:
        return ancestors__4940.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__4942 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__4943 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__4942.call(this, h);
      case 2:
        return descendants__4943.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__4953 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3365)))));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__4954 = function(h, tag, parent) {
    if(cljs.core.truth_(cljs.core.not_EQ_.call(null, tag, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3369)))));
    }
    var tp__4948 = "\ufdd0'parents".call(null, h);
    var td__4949 = "\ufdd0'descendants".call(null, h);
    var ta__4950 = "\ufdd0'ancestors".call(null, h);
    var tf__4951 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____4952 = cljs.core.truth_(cljs.core.contains_QMARK_.call(null, tp__4948.call(null, tag), parent)) ? null : function() {
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__4950.call(null, tag), parent))) {
        throw new Error(cljs.core.str.call(null, tag, "already has", parent, "as ancestor"));
      }else {
      }
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__4950.call(null, parent), tag))) {
        throw new Error(cljs.core.str.call(null, "Cyclic derivation:", parent, "has", tag, "as ancestor"));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__4948, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__4951.call(null, "\ufdd0'ancestors".call(null, h), tag, td__4949, parent, ta__4950), "\ufdd0'descendants":tf__4951.call(null, "\ufdd0'descendants".call(null, h), parent, ta__4950, tag, td__4949)})
    }();
    if(cljs.core.truth_(or__3548__auto____4952)) {
      return or__3548__auto____4952
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__4953.call(this, h, tag);
      case 3:
        return derive__4954.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__4960 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__4961 = function(h, tag, parent) {
    var parentMap__4956 = "\ufdd0'parents".call(null, h);
    var childsParents__4957 = cljs.core.truth_(parentMap__4956.call(null, tag)) ? cljs.core.disj.call(null, parentMap__4956.call(null, tag), parent) : cljs.core.set([]);
    var newParents__4958 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__4957)) ? cljs.core.assoc.call(null, parentMap__4956, tag, childsParents__4957) : cljs.core.dissoc.call(null, parentMap__4956, tag);
    var deriv_seq__4959 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__4945_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__4945_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__4945_SHARP_), cljs.core.second.call(null, p1__4945_SHARP_)))
    }, cljs.core.seq.call(null, newParents__4958)));
    if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, parentMap__4956.call(null, tag), parent))) {
      return cljs.core.reduce.call(null, function(p1__4946_SHARP_, p2__4947_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__4946_SHARP_, p2__4947_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__4959))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__4960.call(this, h, tag);
      case 3:
        return underive__4961.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__4963 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____4965 = cljs.core.truth_(function() {
    var and__3546__auto____4964 = xprefs__4963;
    if(cljs.core.truth_(and__3546__auto____4964)) {
      return xprefs__4963.call(null, y)
    }else {
      return and__3546__auto____4964
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____4965)) {
    return or__3548__auto____4965
  }else {
    var or__3548__auto____4967 = function() {
      var ps__4966 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.truth_(cljs.core.count.call(null, ps__4966) > 0)) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__4966), prefer_table))) {
          }else {
          }
          var G__4970 = cljs.core.rest.call(null, ps__4966);
          ps__4966 = G__4970;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____4967)) {
      return or__3548__auto____4967
    }else {
      var or__3548__auto____4969 = function() {
        var ps__4968 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.truth_(cljs.core.count.call(null, ps__4968) > 0)) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__4968), y, prefer_table))) {
            }else {
            }
            var G__4971 = cljs.core.rest.call(null, ps__4968);
            ps__4968 = G__4971;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____4969)) {
        return or__3548__auto____4969
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____4972 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____4972)) {
    return or__3548__auto____4972
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__4981 = cljs.core.reduce.call(null, function(be, p__4973) {
    var vec__4974__4975 = p__4973;
    var k__4976 = cljs.core.nth.call(null, vec__4974__4975, 0, null);
    var ___4977 = cljs.core.nth.call(null, vec__4974__4975, 1, null);
    var e__4978 = vec__4974__4975;
    if(cljs.core.truth_(cljs.core.isa_QMARK_.call(null, dispatch_val, k__4976))) {
      var be2__4980 = cljs.core.truth_(function() {
        var or__3548__auto____4979 = be === null;
        if(cljs.core.truth_(or__3548__auto____4979)) {
          return or__3548__auto____4979
        }else {
          return cljs.core.dominates.call(null, k__4976, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__4978 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__4980), k__4976, prefer_table))) {
      }else {
        throw new Error(cljs.core.str.call(null, "Multiple methods in multimethod '", name, "' match dispatch value: ", dispatch_val, " -> ", k__4976, " and ", cljs.core.first.call(null, be2__4980), ", and neither is preferred"));
      }
      return be2__4980
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__4981)) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy)))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__4981));
      return cljs.core.second.call(null, best_entry__4981)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4982 = mf;
    if(cljs.core.truth_(and__3546__auto____4982)) {
      return mf.cljs$core$IMultiFn$_reset
    }else {
      return and__3546__auto____4982
    }
  }())) {
    return mf.cljs$core$IMultiFn$_reset(mf)
  }else {
    return function() {
      var or__3548__auto____4983 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4983)) {
        return or__3548__auto____4983
      }else {
        var or__3548__auto____4984 = cljs.core._reset["_"];
        if(cljs.core.truth_(or__3548__auto____4984)) {
          return or__3548__auto____4984
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4985 = mf;
    if(cljs.core.truth_(and__3546__auto____4985)) {
      return mf.cljs$core$IMultiFn$_add_method
    }else {
      return and__3546__auto____4985
    }
  }())) {
    return mf.cljs$core$IMultiFn$_add_method(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____4986 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4986)) {
        return or__3548__auto____4986
      }else {
        var or__3548__auto____4987 = cljs.core._add_method["_"];
        if(cljs.core.truth_(or__3548__auto____4987)) {
          return or__3548__auto____4987
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4988 = mf;
    if(cljs.core.truth_(and__3546__auto____4988)) {
      return mf.cljs$core$IMultiFn$_remove_method
    }else {
      return and__3546__auto____4988
    }
  }())) {
    return mf.cljs$core$IMultiFn$_remove_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____4989 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4989)) {
        return or__3548__auto____4989
      }else {
        var or__3548__auto____4990 = cljs.core._remove_method["_"];
        if(cljs.core.truth_(or__3548__auto____4990)) {
          return or__3548__auto____4990
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4991 = mf;
    if(cljs.core.truth_(and__3546__auto____4991)) {
      return mf.cljs$core$IMultiFn$_prefer_method
    }else {
      return and__3546__auto____4991
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefer_method(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____4992 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4992)) {
        return or__3548__auto____4992
      }else {
        var or__3548__auto____4993 = cljs.core._prefer_method["_"];
        if(cljs.core.truth_(or__3548__auto____4993)) {
          return or__3548__auto____4993
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4994 = mf;
    if(cljs.core.truth_(and__3546__auto____4994)) {
      return mf.cljs$core$IMultiFn$_get_method
    }else {
      return and__3546__auto____4994
    }
  }())) {
    return mf.cljs$core$IMultiFn$_get_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____4995 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4995)) {
        return or__3548__auto____4995
      }else {
        var or__3548__auto____4996 = cljs.core._get_method["_"];
        if(cljs.core.truth_(or__3548__auto____4996)) {
          return or__3548__auto____4996
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4997 = mf;
    if(cljs.core.truth_(and__3546__auto____4997)) {
      return mf.cljs$core$IMultiFn$_methods
    }else {
      return and__3546__auto____4997
    }
  }())) {
    return mf.cljs$core$IMultiFn$_methods(mf)
  }else {
    return function() {
      var or__3548__auto____4998 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4998)) {
        return or__3548__auto____4998
      }else {
        var or__3548__auto____4999 = cljs.core._methods["_"];
        if(cljs.core.truth_(or__3548__auto____4999)) {
          return or__3548__auto____4999
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____5000 = mf;
    if(cljs.core.truth_(and__3546__auto____5000)) {
      return mf.cljs$core$IMultiFn$_prefers
    }else {
      return and__3546__auto____5000
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefers(mf)
  }else {
    return function() {
      var or__3548__auto____5001 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____5001)) {
        return or__3548__auto____5001
      }else {
        var or__3548__auto____5002 = cljs.core._prefers["_"];
        if(cljs.core.truth_(or__3548__auto____5002)) {
          return or__3548__auto____5002
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____5003 = mf;
    if(cljs.core.truth_(and__3546__auto____5003)) {
      return mf.cljs$core$IMultiFn$_dispatch
    }else {
      return and__3546__auto____5003
    }
  }())) {
    return mf.cljs$core$IMultiFn$_dispatch(mf, args)
  }else {
    return function() {
      var or__3548__auto____5004 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____5004)) {
        return or__3548__auto____5004
      }else {
        var or__3548__auto____5005 = cljs.core._dispatch["_"];
        if(cljs.core.truth_(or__3548__auto____5005)) {
          return or__3548__auto____5005
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__5006 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__5007 = cljs.core._get_method.call(null, mf, dispatch_val__5006);
  if(cljs.core.truth_(target_fn__5007)) {
  }else {
    throw new Error(cljs.core.str.call(null, "No method in multimethod '", cljs.core.name, "' for dispatch value: ", dispatch_val__5006));
  }
  return cljs.core.apply.call(null, target_fn__5007, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy
};
cljs.core.MultiFn.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__5008 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset = function(mf) {
  var this__5009 = this;
  cljs.core.swap_BANG_.call(null, this__5009.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__5009.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__5009.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__5009.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method = function(mf, dispatch_val, method) {
  var this__5010 = this;
  cljs.core.swap_BANG_.call(null, this__5010.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__5010.method_cache, this__5010.method_table, this__5010.cached_hierarchy, this__5010.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method = function(mf, dispatch_val) {
  var this__5011 = this;
  cljs.core.swap_BANG_.call(null, this__5011.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__5011.method_cache, this__5011.method_table, this__5011.cached_hierarchy, this__5011.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method = function(mf, dispatch_val) {
  var this__5012 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__5012.cached_hierarchy), cljs.core.deref.call(null, this__5012.hierarchy)))) {
  }else {
    cljs.core.reset_cache.call(null, this__5012.method_cache, this__5012.method_table, this__5012.cached_hierarchy, this__5012.hierarchy)
  }
  var temp__3695__auto____5013 = cljs.core.deref.call(null, this__5012.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____5013)) {
    var target_fn__5014 = temp__3695__auto____5013;
    return target_fn__5014
  }else {
    var temp__3695__auto____5015 = cljs.core.find_and_cache_best_method.call(null, this__5012.name, dispatch_val, this__5012.hierarchy, this__5012.method_table, this__5012.prefer_table, this__5012.method_cache, this__5012.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____5015)) {
      var target_fn__5016 = temp__3695__auto____5015;
      return target_fn__5016
    }else {
      return cljs.core.deref.call(null, this__5012.method_table).call(null, this__5012.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__5017 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__5017.prefer_table))) {
    throw new Error(cljs.core.str.call(null, "Preference conflict in multimethod '", this__5017.name, "': ", dispatch_val_y, " is already preferred to ", dispatch_val_x));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__5017.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__5017.method_cache, this__5017.method_table, this__5017.cached_hierarchy, this__5017.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods = function(mf) {
  var this__5018 = this;
  return cljs.core.deref.call(null, this__5018.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers = function(mf) {
  var this__5019 = this;
  return cljs.core.deref.call(null, this__5019.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch = function(mf, args) {
  var this__5020 = this;
  return cljs.core.do_dispatch.call(null, mf, this__5020.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__5021__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__5021 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__5021__delegate.call(this, _, args)
  };
  G__5021.cljs$lang$maxFixedArity = 1;
  G__5021.cljs$lang$applyTo = function(arglist__5022) {
    var _ = cljs.core.first(arglist__5022);
    var args = cljs.core.rest(arglist__5022);
    return G__5021__delegate.call(this, _, args)
  };
  return G__5021
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("clojure.browser.event");
goog.require("cljs.core");
goog.require("goog.events");
goog.require("goog.events.EventTarget");
goog.require("goog.events.EventType");
clojure.browser.event.EventType = {};
clojure.browser.event.event_types = function event_types(this$) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____5363 = this$;
    if(cljs.core.truth_(and__3546__auto____5363)) {
      return this$.clojure$browser$event$EventType$event_types
    }else {
      return and__3546__auto____5363
    }
  }())) {
    return this$.clojure$browser$event$EventType$event_types(this$)
  }else {
    return function() {
      var or__3548__auto____5364 = clojure.browser.event.event_types[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____5364)) {
        return or__3548__auto____5364
      }else {
        var or__3548__auto____5365 = clojure.browser.event.event_types["_"];
        if(cljs.core.truth_(or__3548__auto____5365)) {
          return or__3548__auto____5365
        }else {
          throw cljs.core.missing_protocol.call(null, "EventType.event-types", this$);
        }
      }
    }().call(null, this$)
  }
};
Element.prototype.clojure$browser$event$EventType$ = true;
Element.prototype.clojure$browser$event$EventType$event_types = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), cljs.core.map.call(null, function(p__5366) {
    var vec__5367__5368 = p__5366;
    var k__5369 = cljs.core.nth.call(null, vec__5367__5368, 0, null);
    var v__5370 = cljs.core.nth.call(null, vec__5367__5368, 1, null);
    return cljs.core.Vector.fromArray([cljs.core.keyword.call(null, k__5369.toLowerCase()), v__5370])
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
goog.events.EventTarget.prototype.clojure$browser$event$EventType$ = true;
goog.events.EventTarget.prototype.clojure$browser$event$EventType$event_types = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), cljs.core.map.call(null, function(p__5371) {
    var vec__5372__5373 = p__5371;
    var k__5374 = cljs.core.nth.call(null, vec__5372__5373, 0, null);
    var v__5375 = cljs.core.nth.call(null, vec__5372__5373, 1, null);
    return cljs.core.Vector.fromArray([cljs.core.keyword.call(null, k__5374.toLowerCase()), v__5375])
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
clojure.browser.event.listen = function() {
  var listen = null;
  var listen__5376 = function(src, type, fn) {
    return listen.call(null, src, type, fn, false)
  };
  var listen__5377 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listen.call(null, src, cljs.core.get.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen__5376.call(this, src, type, fn);
      case 4:
        return listen__5377.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return listen
}();
clojure.browser.event.listen_once = function() {
  var listen_once = null;
  var listen_once__5379 = function(src, type, fn) {
    return listen_once.call(null, src, type, fn, false)
  };
  var listen_once__5380 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listenOnce.call(null, src, cljs.core.get.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen_once = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen_once__5379.call(this, src, type, fn);
      case 4:
        return listen_once__5380.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return listen_once
}();
clojure.browser.event.unlisten = function() {
  var unlisten = null;
  var unlisten__5382 = function(src, type, fn) {
    return unlisten.call(null, src, type, fn, false)
  };
  var unlisten__5383 = function(src, type, fn, capture_QMARK_) {
    return goog.events.unlisten.call(null, src, cljs.core.get.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  unlisten = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return unlisten__5382.call(this, src, type, fn);
      case 4:
        return unlisten__5383.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return unlisten
}();
clojure.browser.event.unlisten_by_key = function unlisten_by_key(key) {
  return goog.events.unlistenByKey.call(null, key)
};
clojure.browser.event.dispatch_event = function dispatch_event(src, event) {
  return goog.events.dispatchEvent.call(null, src, event)
};
clojure.browser.event.expose = function expose(e) {
  return goog.events.expose.call(null, e)
};
clojure.browser.event.fire_listeners = function fire_listeners(obj, type, capture, event) {
  return null
};
clojure.browser.event.total_listener_count = function total_listener_count() {
  return goog.events.getTotalListenerCount.call(null)
};
clojure.browser.event.get_listener = function get_listener(src, type, listener, opt_capt, opt_handler) {
  return null
};
clojure.browser.event.all_listeners = function all_listeners(obj, type, capture) {
  return null
};
clojure.browser.event.unique_event_id = function unique_event_id(event_type) {
  return null
};
clojure.browser.event.has_listener = function has_listener(obj, opt_type, opt_capture) {
  return null
};
clojure.browser.event.remove_all = function remove_all(opt_obj, opt_type, opt_capt) {
  return null
};
goog.provide("clojure.browser.net");
goog.require("cljs.core");
goog.require("clojure.browser.event");
goog.require("goog.net.XhrIo");
goog.require("goog.net.EventType");
goog.require("goog.net.xpc.CfgFields");
goog.require("goog.net.xpc.CrossPageChannel");
goog.require("goog.json");
clojure.browser.net._STAR_timeout_STAR_ = 1E4;
clojure.browser.net.event_types = cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), cljs.core.map.call(null, function(p__5269) {
  var vec__5270__5271 = p__5269;
  var k__5272 = cljs.core.nth.call(null, vec__5270__5271, 0, null);
  var v__5273 = cljs.core.nth.call(null, vec__5270__5271, 1, null);
  return cljs.core.Vector.fromArray([cljs.core.keyword.call(null, k__5272.toLowerCase()), v__5273])
}, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.net.EventType))));
clojure.browser.net.IConnection = {};
clojure.browser.net.connect = function() {
  var connect = null;
  var connect__5304 = function(this$) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5274 = this$;
      if(cljs.core.truth_(and__3546__auto____5274)) {
        return this$.clojure$browser$net$IConnection$connect
      }else {
        return and__3546__auto____5274
      }
    }())) {
      return this$.clojure$browser$net$IConnection$connect(this$)
    }else {
      return function() {
        var or__3548__auto____5275 = clojure.browser.net.connect[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____5275)) {
          return or__3548__auto____5275
        }else {
          var or__3548__auto____5276 = clojure.browser.net.connect["_"];
          if(cljs.core.truth_(or__3548__auto____5276)) {
            return or__3548__auto____5276
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.connect", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var connect__5305 = function(this$, opt1) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5277 = this$;
      if(cljs.core.truth_(and__3546__auto____5277)) {
        return this$.clojure$browser$net$IConnection$connect
      }else {
        return and__3546__auto____5277
      }
    }())) {
      return this$.clojure$browser$net$IConnection$connect(this$, opt1)
    }else {
      return function() {
        var or__3548__auto____5278 = clojure.browser.net.connect[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____5278)) {
          return or__3548__auto____5278
        }else {
          var or__3548__auto____5279 = clojure.browser.net.connect["_"];
          if(cljs.core.truth_(or__3548__auto____5279)) {
            return or__3548__auto____5279
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.connect", this$);
          }
        }
      }().call(null, this$, opt1)
    }
  };
  var connect__5306 = function(this$, opt1, opt2) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5280 = this$;
      if(cljs.core.truth_(and__3546__auto____5280)) {
        return this$.clojure$browser$net$IConnection$connect
      }else {
        return and__3546__auto____5280
      }
    }())) {
      return this$.clojure$browser$net$IConnection$connect(this$, opt1, opt2)
    }else {
      return function() {
        var or__3548__auto____5281 = clojure.browser.net.connect[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____5281)) {
          return or__3548__auto____5281
        }else {
          var or__3548__auto____5282 = clojure.browser.net.connect["_"];
          if(cljs.core.truth_(or__3548__auto____5282)) {
            return or__3548__auto____5282
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.connect", this$);
          }
        }
      }().call(null, this$, opt1, opt2)
    }
  };
  var connect__5307 = function(this$, opt1, opt2, opt3) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5283 = this$;
      if(cljs.core.truth_(and__3546__auto____5283)) {
        return this$.clojure$browser$net$IConnection$connect
      }else {
        return and__3546__auto____5283
      }
    }())) {
      return this$.clojure$browser$net$IConnection$connect(this$, opt1, opt2, opt3)
    }else {
      return function() {
        var or__3548__auto____5284 = clojure.browser.net.connect[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____5284)) {
          return or__3548__auto____5284
        }else {
          var or__3548__auto____5285 = clojure.browser.net.connect["_"];
          if(cljs.core.truth_(or__3548__auto____5285)) {
            return or__3548__auto____5285
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.connect", this$);
          }
        }
      }().call(null, this$, opt1, opt2, opt3)
    }
  };
  connect = function(this$, opt1, opt2, opt3) {
    switch(arguments.length) {
      case 1:
        return connect__5304.call(this, this$);
      case 2:
        return connect__5305.call(this, this$, opt1);
      case 3:
        return connect__5306.call(this, this$, opt1, opt2);
      case 4:
        return connect__5307.call(this, this$, opt1, opt2, opt3)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return connect
}();
clojure.browser.net.transmit = function() {
  var transmit = null;
  var transmit__5309 = function(this$, opt) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5286 = this$;
      if(cljs.core.truth_(and__3546__auto____5286)) {
        return this$.clojure$browser$net$IConnection$transmit
      }else {
        return and__3546__auto____5286
      }
    }())) {
      return this$.clojure$browser$net$IConnection$transmit(this$, opt)
    }else {
      return function() {
        var or__3548__auto____5287 = clojure.browser.net.transmit[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____5287)) {
          return or__3548__auto____5287
        }else {
          var or__3548__auto____5288 = clojure.browser.net.transmit["_"];
          if(cljs.core.truth_(or__3548__auto____5288)) {
            return or__3548__auto____5288
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.transmit", this$);
          }
        }
      }().call(null, this$, opt)
    }
  };
  var transmit__5310 = function(this$, opt, opt2) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5289 = this$;
      if(cljs.core.truth_(and__3546__auto____5289)) {
        return this$.clojure$browser$net$IConnection$transmit
      }else {
        return and__3546__auto____5289
      }
    }())) {
      return this$.clojure$browser$net$IConnection$transmit(this$, opt, opt2)
    }else {
      return function() {
        var or__3548__auto____5290 = clojure.browser.net.transmit[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____5290)) {
          return or__3548__auto____5290
        }else {
          var or__3548__auto____5291 = clojure.browser.net.transmit["_"];
          if(cljs.core.truth_(or__3548__auto____5291)) {
            return or__3548__auto____5291
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.transmit", this$);
          }
        }
      }().call(null, this$, opt, opt2)
    }
  };
  var transmit__5311 = function(this$, opt, opt2, opt3) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5292 = this$;
      if(cljs.core.truth_(and__3546__auto____5292)) {
        return this$.clojure$browser$net$IConnection$transmit
      }else {
        return and__3546__auto____5292
      }
    }())) {
      return this$.clojure$browser$net$IConnection$transmit(this$, opt, opt2, opt3)
    }else {
      return function() {
        var or__3548__auto____5293 = clojure.browser.net.transmit[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____5293)) {
          return or__3548__auto____5293
        }else {
          var or__3548__auto____5294 = clojure.browser.net.transmit["_"];
          if(cljs.core.truth_(or__3548__auto____5294)) {
            return or__3548__auto____5294
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.transmit", this$);
          }
        }
      }().call(null, this$, opt, opt2, opt3)
    }
  };
  var transmit__5312 = function(this$, opt, opt2, opt3, opt4) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5295 = this$;
      if(cljs.core.truth_(and__3546__auto____5295)) {
        return this$.clojure$browser$net$IConnection$transmit
      }else {
        return and__3546__auto____5295
      }
    }())) {
      return this$.clojure$browser$net$IConnection$transmit(this$, opt, opt2, opt3, opt4)
    }else {
      return function() {
        var or__3548__auto____5296 = clojure.browser.net.transmit[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____5296)) {
          return or__3548__auto____5296
        }else {
          var or__3548__auto____5297 = clojure.browser.net.transmit["_"];
          if(cljs.core.truth_(or__3548__auto____5297)) {
            return or__3548__auto____5297
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.transmit", this$);
          }
        }
      }().call(null, this$, opt, opt2, opt3, opt4)
    }
  };
  var transmit__5313 = function(this$, opt, opt2, opt3, opt4, opt5) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5298 = this$;
      if(cljs.core.truth_(and__3546__auto____5298)) {
        return this$.clojure$browser$net$IConnection$transmit
      }else {
        return and__3546__auto____5298
      }
    }())) {
      return this$.clojure$browser$net$IConnection$transmit(this$, opt, opt2, opt3, opt4, opt5)
    }else {
      return function() {
        var or__3548__auto____5299 = clojure.browser.net.transmit[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____5299)) {
          return or__3548__auto____5299
        }else {
          var or__3548__auto____5300 = clojure.browser.net.transmit["_"];
          if(cljs.core.truth_(or__3548__auto____5300)) {
            return or__3548__auto____5300
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.transmit", this$);
          }
        }
      }().call(null, this$, opt, opt2, opt3, opt4, opt5)
    }
  };
  transmit = function(this$, opt, opt2, opt3, opt4, opt5) {
    switch(arguments.length) {
      case 2:
        return transmit__5309.call(this, this$, opt);
      case 3:
        return transmit__5310.call(this, this$, opt, opt2);
      case 4:
        return transmit__5311.call(this, this$, opt, opt2, opt3);
      case 5:
        return transmit__5312.call(this, this$, opt, opt2, opt3, opt4);
      case 6:
        return transmit__5313.call(this, this$, opt, opt2, opt3, opt4, opt5)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return transmit
}();
clojure.browser.net.close = function close(this$) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____5301 = this$;
    if(cljs.core.truth_(and__3546__auto____5301)) {
      return this$.clojure$browser$net$IConnection$close
    }else {
      return and__3546__auto____5301
    }
  }())) {
    return this$.clojure$browser$net$IConnection$close(this$)
  }else {
    return function() {
      var or__3548__auto____5302 = clojure.browser.net.close[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____5302)) {
        return or__3548__auto____5302
      }else {
        var or__3548__auto____5303 = clojure.browser.net.close["_"];
        if(cljs.core.truth_(or__3548__auto____5303)) {
          return or__3548__auto____5303
        }else {
          throw cljs.core.missing_protocol.call(null, "IConnection.close", this$);
        }
      }
    }().call(null, this$)
  }
};
goog.net.XhrIo.prototype.clojure$browser$event$EventType$ = true;
goog.net.XhrIo.prototype.clojure$browser$event$EventType$event_types = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), cljs.core.map.call(null, function(p__5315) {
    var vec__5316__5317 = p__5315;
    var k__5318 = cljs.core.nth.call(null, vec__5316__5317, 0, null);
    var v__5319 = cljs.core.nth.call(null, vec__5316__5317, 1, null);
    return cljs.core.Vector.fromArray([cljs.core.keyword.call(null, k__5318.toLowerCase()), v__5319])
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.net.EventType))))
};
goog.net.XhrIo.prototype.clojure$browser$net$IConnection$ = true;
goog.net.XhrIo.prototype.clojure$browser$net$IConnection$transmit = function() {
  var G__5320 = null;
  var G__5320__5321 = function(this$, uri) {
    return clojure.browser.net.transmit.call(null, this$, uri, "GET", null, null, clojure.browser.net._STAR_timeout_STAR_)
  };
  var G__5320__5322 = function(this$, uri, method) {
    return clojure.browser.net.transmit.call(null, this$, uri, method, null, null, clojure.browser.net._STAR_timeout_STAR_)
  };
  var G__5320__5323 = function(this$, uri, method, content) {
    return clojure.browser.net.transmit.call(null, this$, uri, method, content, null, clojure.browser.net._STAR_timeout_STAR_)
  };
  var G__5320__5324 = function(this$, uri, method, content, headers) {
    return clojure.browser.net.transmit.call(null, this$, uri, method, content, headers, clojure.browser.net._STAR_timeout_STAR_)
  };
  var G__5320__5325 = function(this$, uri, method, content, headers, timeout) {
    this$.setTimeoutInterval(timeout);
    return this$.send(uri, method, content, headers)
  };
  G__5320 = function(this$, uri, method, content, headers, timeout) {
    switch(arguments.length) {
      case 2:
        return G__5320__5321.call(this, this$, uri);
      case 3:
        return G__5320__5322.call(this, this$, uri, method);
      case 4:
        return G__5320__5323.call(this, this$, uri, method, content);
      case 5:
        return G__5320__5324.call(this, this$, uri, method, content, headers);
      case 6:
        return G__5320__5325.call(this, this$, uri, method, content, headers, timeout)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5320
}();
clojure.browser.net.xpc_config_fields = cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), cljs.core.map.call(null, function(p__5327) {
  var vec__5328__5329 = p__5327;
  var k__5330 = cljs.core.nth.call(null, vec__5328__5329, 0, null);
  var v__5331 = cljs.core.nth.call(null, vec__5328__5329, 1, null);
  return cljs.core.Vector.fromArray([cljs.core.keyword.call(null, k__5330.toLowerCase()), v__5331])
}, cljs.core.js__GT_clj.call(null, goog.net.xpc.CfgFields)));
clojure.browser.net.xhr_connection = function xhr_connection() {
  return new goog.net.XhrIo
};
clojure.browser.net.ICrossPageChannel = {};
clojure.browser.net.register_service = function() {
  var register_service = null;
  var register_service__5338 = function(this$, service_name, fn) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5332 = this$;
      if(cljs.core.truth_(and__3546__auto____5332)) {
        return this$.clojure$browser$net$ICrossPageChannel$register_service
      }else {
        return and__3546__auto____5332
      }
    }())) {
      return this$.clojure$browser$net$ICrossPageChannel$register_service(this$, service_name, fn)
    }else {
      return function() {
        var or__3548__auto____5333 = clojure.browser.net.register_service[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____5333)) {
          return or__3548__auto____5333
        }else {
          var or__3548__auto____5334 = clojure.browser.net.register_service["_"];
          if(cljs.core.truth_(or__3548__auto____5334)) {
            return or__3548__auto____5334
          }else {
            throw cljs.core.missing_protocol.call(null, "ICrossPageChannel.register-service", this$);
          }
        }
      }().call(null, this$, service_name, fn)
    }
  };
  var register_service__5339 = function(this$, service_name, fn, encode_json_QMARK_) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5335 = this$;
      if(cljs.core.truth_(and__3546__auto____5335)) {
        return this$.clojure$browser$net$ICrossPageChannel$register_service
      }else {
        return and__3546__auto____5335
      }
    }())) {
      return this$.clojure$browser$net$ICrossPageChannel$register_service(this$, service_name, fn, encode_json_QMARK_)
    }else {
      return function() {
        var or__3548__auto____5336 = clojure.browser.net.register_service[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____5336)) {
          return or__3548__auto____5336
        }else {
          var or__3548__auto____5337 = clojure.browser.net.register_service["_"];
          if(cljs.core.truth_(or__3548__auto____5337)) {
            return or__3548__auto____5337
          }else {
            throw cljs.core.missing_protocol.call(null, "ICrossPageChannel.register-service", this$);
          }
        }
      }().call(null, this$, service_name, fn, encode_json_QMARK_)
    }
  };
  register_service = function(this$, service_name, fn, encode_json_QMARK_) {
    switch(arguments.length) {
      case 3:
        return register_service__5338.call(this, this$, service_name, fn);
      case 4:
        return register_service__5339.call(this, this$, service_name, fn, encode_json_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return register_service
}();
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$IConnection$ = true;
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$IConnection$connect = function() {
  var G__5341 = null;
  var G__5341__5342 = function(this$) {
    return clojure.browser.net.connect.call(null, this$, null)
  };
  var G__5341__5343 = function(this$, on_connect_fn) {
    return this$.connect(on_connect_fn)
  };
  var G__5341__5344 = function(this$, on_connect_fn, config_iframe_fn) {
    return clojure.browser.net.connect.call(null, this$, on_connect_fn, config_iframe_fn, document.body)
  };
  var G__5341__5345 = function(this$, on_connect_fn, config_iframe_fn, iframe_parent) {
    this$.createPeerIframe(iframe_parent, config_iframe_fn);
    return this$.connect(on_connect_fn)
  };
  G__5341 = function(this$, on_connect_fn, config_iframe_fn, iframe_parent) {
    switch(arguments.length) {
      case 1:
        return G__5341__5342.call(this, this$);
      case 2:
        return G__5341__5343.call(this, this$, on_connect_fn);
      case 3:
        return G__5341__5344.call(this, this$, on_connect_fn, config_iframe_fn);
      case 4:
        return G__5341__5345.call(this, this$, on_connect_fn, config_iframe_fn, iframe_parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5341
}();
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$IConnection$transmit = function(this$, service_name, payload) {
  return this$.send(cljs.core.name.call(null, service_name), payload)
};
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$IConnection$close = function(this$) {
  return this$.close(cljs.core.List.EMPTY)
};
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$ICrossPageChannel$ = true;
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$ICrossPageChannel$register_service = function() {
  var G__5347 = null;
  var G__5347__5348 = function(this$, service_name, fn) {
    return clojure.browser.net.register_service.call(null, this$, service_name, fn, false)
  };
  var G__5347__5349 = function(this$, service_name, fn, encode_json_QMARK_) {
    return this$.registerService(cljs.core.name.call(null, service_name), fn, encode_json_QMARK_)
  };
  G__5347 = function(this$, service_name, fn, encode_json_QMARK_) {
    switch(arguments.length) {
      case 3:
        return G__5347__5348.call(this, this$, service_name, fn);
      case 4:
        return G__5347__5349.call(this, this$, service_name, fn, encode_json_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5347
}();
clojure.browser.net.xpc_connection = function() {
  var xpc_connection = null;
  var xpc_connection__5360 = function() {
    var temp__3698__auto____5351 = (new goog.Uri(window.location.href)).getParameterValue("xpc");
    if(cljs.core.truth_(temp__3698__auto____5351)) {
      var config__5352 = temp__3698__auto____5351;
      return new goog.net.xpc.CrossPageChannel(goog.json.parse.call(null, config__5352))
    }else {
      return null
    }
  };
  var xpc_connection__5361 = function(config) {
    return new goog.net.xpc.CrossPageChannel(cljs.core.reduce.call(null, function(sum, p__5353) {
      var vec__5354__5355 = p__5353;
      var k__5356 = cljs.core.nth.call(null, vec__5354__5355, 0, null);
      var v__5357 = cljs.core.nth.call(null, vec__5354__5355, 1, null);
      var temp__3695__auto____5358 = cljs.core.get.call(null, clojure.browser.net.xpc_config_fields, k__5356);
      if(cljs.core.truth_(temp__3695__auto____5358)) {
        var field__5359 = temp__3695__auto____5358;
        return cljs.core.assoc.call(null, sum, field__5359, v__5357)
      }else {
        return sum
      }
    }, cljs.core.ObjMap.fromObject([], {}), config).strobj)
  };
  xpc_connection = function(config) {
    switch(arguments.length) {
      case 0:
        return xpc_connection__5360.call(this);
      case 1:
        return xpc_connection__5361.call(this, config)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return xpc_connection
}();
goog.provide("clojure.browser.repl");
goog.require("cljs.core");
goog.require("clojure.browser.net");
goog.require("clojure.browser.event");
clojure.browser.repl.xpc_connection = cljs.core.atom.call(null, null);
clojure.browser.repl.repl_print = function repl_print(data) {
  var temp__3695__auto____5256 = cljs.core.deref.call(null, clojure.browser.repl.xpc_connection);
  if(cljs.core.truth_(temp__3695__auto____5256)) {
    var conn__5257 = temp__3695__auto____5256;
    return clojure.browser.net.transmit.call(null, conn__5257, "\ufdd0'print", cljs.core.pr_str.call(null, data))
  }else {
    return null
  }
};
clojure.browser.repl.evaluate_javascript = function evaluate_javascript(conn, block) {
  var result__5260 = function() {
    try {
      return cljs.core.ObjMap.fromObject(["\ufdd0'status", "\ufdd0'value"], {"\ufdd0'status":"\ufdd0'success", "\ufdd0'value":cljs.core.str.call(null, eval(block))})
    }catch(e5258) {
      if(cljs.core.truth_(cljs.core.instance_QMARK_.call(null, Error, e5258))) {
        var e__5259 = e5258;
        return cljs.core.ObjMap.fromObject(["\ufdd0'status", "\ufdd0'value", "\ufdd0'stacktrace"], {"\ufdd0'status":"\ufdd0'exception", "\ufdd0'value":cljs.core.pr_str.call(null, e__5259), "\ufdd0'stacktrace":cljs.core.truth_(e__5259.hasOwnProperty("stack")) ? e__5259.stack : "No stacktrace available."})
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          throw e5258;
        }else {
          return null
        }
      }
    }
  }();
  return cljs.core.pr_str.call(null, result__5260)
};
clojure.browser.repl.send_result = function send_result(connection, url, data) {
  return clojure.browser.net.transmit.call(null, connection, url, "POST", data, null, 0)
};
clojure.browser.repl.send_print = function() {
  var send_print = null;
  var send_print__5262 = function(url, data) {
    return send_print.call(null, url, data, 0)
  };
  var send_print__5263 = function(url, data, n) {
    var conn__5261 = clojure.browser.net.xhr_connection.call(null);
    clojure.browser.event.listen.call(null, conn__5261, "\ufdd0'error", function(_) {
      if(cljs.core.truth_(n < 10)) {
        return send_print.call(null, url, data, n + 1)
      }else {
        return console.log(cljs.core.str.call(null, "Could not send ", data, " after ", n, " attempts."))
      }
    });
    return clojure.browser.net.transmit.call(null, conn__5261, url, "POST", data, null, 0)
  };
  send_print = function(url, data, n) {
    switch(arguments.length) {
      case 2:
        return send_print__5262.call(this, url, data);
      case 3:
        return send_print__5263.call(this, url, data, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return send_print
}();
clojure.browser.repl.order = cljs.core.atom.call(null, 0);
clojure.browser.repl.wrap_message = function wrap_message(t, data) {
  return cljs.core.pr_str.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'content", "\ufdd0'order"], {"\ufdd0'type":t, "\ufdd0'content":data, "\ufdd0'order":cljs.core.swap_BANG_.call(null, clojure.browser.repl.order, cljs.core.inc)}))
};
clojure.browser.repl.start_evaluator = function start_evaluator(url) {
  var temp__3695__auto____5265 = clojure.browser.net.xpc_connection.call(null);
  if(cljs.core.truth_(temp__3695__auto____5265)) {
    var repl_connection__5266 = temp__3695__auto____5265;
    var connection__5267 = clojure.browser.net.xhr_connection.call(null);
    clojure.browser.event.listen.call(null, connection__5267, "\ufdd0'success", function(e) {
      return clojure.browser.net.transmit.call(null, repl_connection__5266, "\ufdd0'evaluate-javascript", e.currentTarget.getResponseText(cljs.core.List.EMPTY))
    });
    clojure.browser.net.register_service.call(null, repl_connection__5266, "\ufdd0'send-result", function(data) {
      return clojure.browser.repl.send_result.call(null, connection__5267, url, clojure.browser.repl.wrap_message.call(null, "\ufdd0'result", data))
    });
    clojure.browser.net.register_service.call(null, repl_connection__5266, "\ufdd0'print", function(data) {
      return clojure.browser.repl.send_print.call(null, url, clojure.browser.repl.wrap_message.call(null, "\ufdd0'print", data))
    });
    clojure.browser.net.connect.call(null, repl_connection__5266, cljs.core.constantly.call(null, null));
    return setTimeout.call(null, function() {
      return clojure.browser.repl.send_result.call(null, connection__5267, url, clojure.browser.repl.wrap_message.call(null, "\ufdd0'ready", "ready"))
    }, 50)
  }else {
    return alert.call(null, "No 'xpc' param provided to child iframe.")
  }
};
clojure.browser.repl.connect = function connect(repl_server_url) {
  var repl_connection__5268 = clojure.browser.net.xpc_connection.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'peer_uri"], {"\ufdd0'peer_uri":repl_server_url}));
  cljs.core.swap_BANG_.call(null, clojure.browser.repl.xpc_connection, cljs.core.constantly.call(null, repl_connection__5268));
  clojure.browser.net.register_service.call(null, repl_connection__5268, "\ufdd0'evaluate-javascript", function(js) {
    return clojure.browser.net.transmit.call(null, repl_connection__5268, "\ufdd0'send-result", clojure.browser.repl.evaluate_javascript.call(null, repl_connection__5268, js))
  });
  return clojure.browser.net.connect.call(null, repl_connection__5268, cljs.core.constantly.call(null, null), function(iframe) {
    return iframe.style.display = "none"
  })
};
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, match))) {
    return s.replace(new RegExp(goog.string.regExpEscape.call(null, match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw cljs.core.str.call(null, "Invalid match arg: ", match);
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__5227 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__5228 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__5227.call(this, separator);
      case 2:
        return join__5228.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.truth_(cljs.core.count.call(null, s) < 2)) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return cljs.core.str.call(null, clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1)), clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))
  }
};
clojure.string.split = function() {
  var split = null;
  var split__5236 = function(s, re) {
    return cljs.core.vec.call(null, cljs.core.str.call(null, s).split(re))
  };
  var split__5237 = function(s, re, limit) {
    if(cljs.core.truth_(limit < 1)) {
      return cljs.core.vec.call(null, cljs.core.str.call(null, s).split(re))
    }else {
      var s__5230 = s;
      var limit__5231 = limit;
      var parts__5232 = cljs.core.Vector.fromArray([]);
      while(true) {
        if(cljs.core.truth_(cljs.core._EQ_.call(null, limit__5231, 1))) {
          return cljs.core.conj.call(null, parts__5232, s__5230)
        }else {
          var temp__3695__auto____5233 = cljs.core.re_find.call(null, re, s__5230);
          if(cljs.core.truth_(temp__3695__auto____5233)) {
            var m__5234 = temp__3695__auto____5233;
            var index__5235 = s__5230.indexOf(m__5234);
            var G__5239 = s__5230.substring(index__5235 + cljs.core.count.call(null, m__5234));
            var G__5240 = limit__5231 - 1;
            var G__5241 = cljs.core.conj.call(null, parts__5232, s__5230.substring(0, index__5235));
            s__5230 = G__5239;
            limit__5231 = G__5240;
            parts__5232 = G__5241;
            continue
          }else {
            return cljs.core.conj.call(null, parts__5232, s__5230)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__5236.call(this, s, re);
      case 3:
        return split__5237.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim.call(null, s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft.call(null, s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight.call(null, s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__5242 = s.length;
  while(true) {
    if(cljs.core.truth_(index__5242 === 0)) {
      return""
    }else {
      var ch__5243 = cljs.core.get.call(null, s, index__5242 - 1);
      if(cljs.core.truth_(function() {
        var or__3548__auto____5244 = cljs.core._EQ_.call(null, ch__5243, "\n");
        if(cljs.core.truth_(or__3548__auto____5244)) {
          return or__3548__auto____5244
        }else {
          return cljs.core._EQ_.call(null, ch__5243, "\r")
        }
      }())) {
        var G__5245 = index__5242 - 1;
        index__5242 = G__5245;
        continue
      }else {
        return s.substring(0, index__5242)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__5246 = cljs.core.str.call(null, s);
  if(cljs.core.truth_(function() {
    var or__3548__auto____5247 = cljs.core.not.call(null, s__5246);
    if(cljs.core.truth_(or__3548__auto____5247)) {
      return or__3548__auto____5247
    }else {
      var or__3548__auto____5248 = cljs.core._EQ_.call(null, "", s__5246);
      if(cljs.core.truth_(or__3548__auto____5248)) {
        return or__3548__auto____5248
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__5246)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__5249 = new goog.string.StringBuffer;
  var length__5250 = s.length;
  var index__5251 = 0;
  while(true) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, length__5250, index__5251))) {
      return buffer__5249.toString()
    }else {
      var ch__5252 = s.charAt(index__5251);
      var temp__3695__auto____5253 = cljs.core.get.call(null, cmap, ch__5252);
      if(cljs.core.truth_(temp__3695__auto____5253)) {
        var replacement__5254 = temp__3695__auto____5253;
        buffer__5249.append(cljs.core.str.call(null, replacement__5254))
      }else {
        buffer__5249.append(ch__5252)
      }
      var G__5255 = index__5251 + 1;
      index__5251 = G__5255;
      continue
    }
    break
  }
};
goog.provide("enfocus.core");
goog.require("cljs.core");
goog.require("goog.dom.query");
goog.require("goog.async.Delay");
goog.require("goog.dom.classes");
goog.require("goog.dom.ViewportSizeMonitor");
goog.require("goog.events");
goog.require("goog.dom");
goog.require("clojure.string");
goog.require("goog.fx.dom");
goog.require("goog.Timer");
goog.require("goog.style");
goog.require("goog.net.XhrIo");
goog.require("goog.fx");
enfocus.core.debug = true;
enfocus.core.log_debug = function log_debug(mesg) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____5023 = enfocus.core.debug;
    if(cljs.core.truth_(and__3546__auto____5023)) {
      return cljs.core.not.call(null, cljs.core._EQ_.call(null, window.console, undefined))
    }else {
      return and__3546__auto____5023
    }
  }())) {
    return console.log(mesg)
  }else {
    return null
  }
};
enfocus.core.setTimeout = function setTimeout(func, ttime) {
  return goog.Timer.callOnce.call(null, func, ttime)
};
enfocus.core.node_QMARK_ = function node_QMARK_(tst) {
  return goog.dom.isNodeLike.call(null, tst)
};
enfocus.core.nodelist_QMARK_ = function nodelist_QMARK_(tst) {
  return cljs.core.instance_QMARK_.call(null, NodeList, tst)
};
enfocus.core.nodes__GT_coll = function nodes__GT_coll(nl) {
  if(cljs.core.truth_(nl === null)) {
    return cljs.core.Vector.fromArray([])
  }else {
    if(cljs.core.truth_(enfocus.core.node_QMARK_.call(null, nl))) {
      return cljs.core.Vector.fromArray([nl])
    }else {
      if(cljs.core.truth_(window === nl)) {
        return cljs.core.Vector.fromArray([nl])
      }else {
        if(cljs.core.truth_(function() {
          var or__3548__auto____5025 = cljs.core.instance_QMARK_.call(null, Array, nl);
          if(cljs.core.truth_(or__3548__auto____5025)) {
            return or__3548__auto____5025
          }else {
            return cljs.core.coll_QMARK_.call(null, nl)
          }
        }())) {
          return nl
        }else {
          if(cljs.core.truth_(enfocus.core.nodelist_QMARK_.call(null, nl))) {
            var iter__514__auto____5030 = function iter__5026(s__5027) {
              return new cljs.core.LazySeq(null, false, function() {
                var s__5027__5028 = s__5027;
                while(true) {
                  if(cljs.core.truth_(cljs.core.seq.call(null, s__5027__5028))) {
                    var x__5029 = cljs.core.first.call(null, s__5027__5028);
                    return cljs.core.cons.call(null, nl[x__5029], iter__5026.call(null, cljs.core.rest.call(null, s__5027__5028)))
                  }else {
                    return null
                  }
                  break
                }
              })
            };
            return iter__514__auto____5030.call(null, cljs.core.range.call(null, 0, nl.length))
          }else {
            return null
          }
        }
      }
    }
  }
};
enfocus.core.flatten_nodes_coll = function flatten_nodes_coll(values) {
  return cljs.core.mapcat.call(null, function(p1__5024_SHARP_) {
    if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, p1__5024_SHARP_))) {
      return cljs.core.Vector.fromArray([goog.dom.createTextNode.call(null, p1__5024_SHARP_)])
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return enfocus.core.nodes__GT_coll.call(null, p1__5024_SHARP_)
      }else {
        return null
      }
    }
  }, values)
};
enfocus.core.style_set = function style_set(obj, values) {
  var G__5031__5032 = cljs.core.seq.call(null, cljs.core.apply.call(null, cljs.core.hash_map, values));
  if(cljs.core.truth_(G__5031__5032)) {
    var G__5034__5036 = cljs.core.first.call(null, G__5031__5032);
    var vec__5035__5037 = G__5034__5036;
    var attr__5038 = cljs.core.nth.call(null, vec__5035__5037, 0, null);
    var value__5039 = cljs.core.nth.call(null, vec__5035__5037, 1, null);
    var G__5031__5040 = G__5031__5032;
    var G__5034__5041 = G__5034__5036;
    var G__5031__5042 = G__5031__5040;
    while(true) {
      var vec__5043__5044 = G__5034__5041;
      var attr__5045 = cljs.core.nth.call(null, vec__5043__5044, 0, null);
      var value__5046 = cljs.core.nth.call(null, vec__5043__5044, 1, null);
      var G__5031__5047 = G__5031__5042;
      goog.style.setStyle.call(null, obj, cljs.core.name.call(null, attr__5045), value__5046);
      var temp__3698__auto____5048 = cljs.core.next.call(null, G__5031__5047);
      if(cljs.core.truth_(temp__3698__auto____5048)) {
        var G__5031__5049 = temp__3698__auto____5048;
        var G__5050 = cljs.core.first.call(null, G__5031__5049);
        var G__5051 = G__5031__5049;
        G__5034__5041 = G__5050;
        G__5031__5042 = G__5051;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
enfocus.core.style_remove = function style_remove(obj, values) {
  var G__5052__5053 = cljs.core.seq.call(null, values);
  if(cljs.core.truth_(G__5052__5053)) {
    var attr__5054 = cljs.core.first.call(null, G__5052__5053);
    var G__5052__5055 = G__5052__5053;
    while(true) {
      if(cljs.core.truth_(goog.userAgent.IE)) {
        goog.style.setStyle.call(null, obj, cljs.core.name.call(null, attr__5054), "")
      }else {
        obj.style.removeProperty(cljs.core.name.call(null, attr__5054))
      }
      var temp__3698__auto____5056 = cljs.core.next.call(null, G__5052__5055);
      if(cljs.core.truth_(temp__3698__auto____5056)) {
        var G__5052__5057 = temp__3698__auto____5056;
        var G__5058 = cljs.core.first.call(null, G__5052__5057);
        var G__5059 = G__5052__5057;
        attr__5054 = G__5058;
        G__5052__5055 = G__5059;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
enfocus.core.get_eff_prop_name = function get_eff_prop_name(etype) {
  return cljs.core.str.call(null, "__ef_effect_", etype)
};
enfocus.core.get_mills = function get_mills() {
  return(new Date).getMilliseconds()
};
enfocus.core.child_of_QMARK_ = function child_of_QMARK_(parent, child) {
  while(true) {
    if(cljs.core.truth_(cljs.core.not.call(null, child))) {
      return false
    }else {
      if(cljs.core.truth_(parent === child)) {
        return false
      }else {
        if(cljs.core.truth_(child.parentNode === parent)) {
          return true
        }else {
          if(cljs.core.truth_("\ufdd0'else")) {
            var G__5060 = parent;
            var G__5061 = child.parentNode;
            parent = G__5060;
            child = G__5061;
            continue
          }else {
            return null
          }
        }
      }
    }
    break
  }
};
enfocus.core.mouse_enter_leave = function mouse_enter_leave(func) {
  return function(e) {
    var re__5062 = e.relatedTarget;
    var this$__5063 = e.currentTarget;
    if(cljs.core.truth_(function() {
      var and__3546__auto____5064 = cljs.core.not.call(null, re__5062 === this$__5063);
      if(cljs.core.truth_(and__3546__auto____5064)) {
        return cljs.core.not.call(null, enfocus.core.child_of_QMARK_.call(null, this$__5063, re__5062))
      }else {
        return and__3546__auto____5064
      }
    }())) {
      return func.call(null, e)
    }else {
      return null
    }
  }
};
enfocus.core.pix_round = function pix_round(step) {
  if(cljs.core.truth_(step < 0)) {
    return Math.floor.call(null, step)
  }else {
    return Math.ceil.call(null, step)
  }
};
enfocus.core.add_map_attrs = function() {
  var add_map_attrs = null;
  var add_map_attrs__5084 = function(elem, ats) {
    if(cljs.core.truth_(elem)) {
      if(cljs.core.truth_(cljs.core.map_QMARK_.call(null, ats))) {
        var G__5065__5066 = cljs.core.seq.call(null, ats);
        if(cljs.core.truth_(G__5065__5066)) {
          var G__5068__5070 = cljs.core.first.call(null, G__5065__5066);
          var vec__5069__5071 = G__5068__5070;
          var k__5072 = cljs.core.nth.call(null, vec__5069__5071, 0, null);
          var v__5073 = cljs.core.nth.call(null, vec__5069__5071, 1, null);
          var G__5065__5074 = G__5065__5066;
          var G__5068__5075 = G__5068__5070;
          var G__5065__5076 = G__5065__5074;
          while(true) {
            var vec__5077__5078 = G__5068__5075;
            var k__5079 = cljs.core.nth.call(null, vec__5077__5078, 0, null);
            var v__5080 = cljs.core.nth.call(null, vec__5077__5078, 1, null);
            var G__5065__5081 = G__5065__5076;
            add_map_attrs.call(null, elem, k__5079, v__5080);
            var temp__3698__auto____5082 = cljs.core.next.call(null, G__5065__5081);
            if(cljs.core.truth_(temp__3698__auto____5082)) {
              var G__5065__5083 = temp__3698__auto____5082;
              var G__5087 = cljs.core.first.call(null, G__5065__5083);
              var G__5088 = G__5065__5083;
              G__5068__5075 = G__5087;
              G__5065__5076 = G__5088;
              continue
            }else {
            }
            break
          }
        }else {
        }
        return elem
      }else {
        return null
      }
    }else {
      return null
    }
  };
  var add_map_attrs__5085 = function(elem, k, v) {
    elem.setAttribute(cljs.core.name.call(null, k), v);
    return elem
  };
  add_map_attrs = function(elem, k, v) {
    switch(arguments.length) {
      case 2:
        return add_map_attrs__5084.call(this, elem, k);
      case 3:
        return add_map_attrs__5085.call(this, elem, k, v)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return add_map_attrs
}();
enfocus.core.tpl_load_cnt = cljs.core.atom.call(null, 0);
enfocus.core.tpl_cache = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
enfocus.core.hide_style = cljs.core.ObjMap.fromObject(["style"], {"style":"display: none; width: 0px; height: 0px"}).strobj;
enfocus.core.create_hidden_dom = function create_hidden_dom(child) {
  var div__5089 = goog.dom.createDom.call(null, "div", enfocus.core.hide_style);
  div__5089.appendChild(child);
  goog.dom.appendChild.call(null, goog.dom.getDocument.call(null).body, div__5089);
  return div__5089
};
enfocus.core.remove_node_return_child = function remove_node_return_child(div) {
  var child__5090 = div.childNodes;
  var frag__5091 = document.createDocumentFragment();
  goog.dom.append.call(null, frag__5091, child__5090);
  goog.dom.removeNode.call(null, div);
  return frag__5091
};
enfocus.core.replace_ids = function replace_ids(text) {
  var re__5093 = new RegExp("(<.*?\\sid=['\"])(.*?)(['\"].*?>)", "g");
  var sym__5094 = cljs.core.str.call(null, cljs.core.name.call(null, cljs.core.gensym.call(null, "id")), "_");
  return cljs.core.Vector.fromArray([cljs.core.str.call(null, sym__5094), text.replace(re__5093, function(a, b, c, d) {
    return cljs.core.str.call(null, b, sym__5094, c, d)
  })])
};
enfocus.core.reset_ids = function reset_ids(sym, nod) {
  var id_nodes__5095 = enfocus.core.css_select.call(null, nod, "*[id]");
  var nod_col__5096 = enfocus.core.nodes__GT_coll.call(null, id_nodes__5095);
  return cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__5092_SHARP_) {
    var id__5097 = p1__5092_SHARP_.getAttribute("id");
    var rid__5098 = id__5097.replace(sym, "");
    return p1__5092_SHARP_.setAttribute("id", rid__5098)
  }, nod_col__5096))
};
enfocus.core.load_remote_dom = function load_remote_dom(uri) {
  if(cljs.core.truth_(cljs.core.deref.call(null, enfocus.core.tpl_cache).call(null, uri) === null)) {
    cljs.core.swap_BANG_.call(null, enfocus.core.tpl_load_cnt, cljs.core.inc);
    var req__5099 = new goog.net.XhrIo;
    var callback__5109 = function(req) {
      var text__5101 = req.getResponseText();
      var vec__5100__5102 = enfocus.core.replace_ids.call(null, text__5101);
      var sym__5103 = cljs.core.nth.call(null, vec__5100__5102, 0, null);
      var txt__5104 = cljs.core.nth.call(null, vec__5100__5102, 1, null);
      var data__5105 = goog.dom.htmlToDocumentFragment.call(null, txt__5104);
      var body__5106 = cljs.core.first.call(null, enfocus.core.nodes__GT_coll.call(null, enfocus.core.css_select.call(null, data__5105, "body")));
      if(cljs.core.truth_(body__5106)) {
        var frag__5107 = document.createDocumentFragment();
        var childs__5108 = frag__5107.childNodes;
        goog.dom.append.call(null, frag__5107, childs__5108);
        return cljs.core.swap_BANG_.call(null, enfocus.core.tpl_cache, cljs.core.assoc, uri, cljs.core.Vector.fromArray([sym__5103, frag__5107]))
      }else {
        return cljs.core.swap_BANG_.call(null, enfocus.core.tpl_cache, cljs.core.assoc, uri, cljs.core.Vector.fromArray([sym__5103, data__5105]))
      }
    };
    goog.events.listen.call(null, req__5099, goog.net.EventType.COMPLETE, function() {
      callback__5109.call(null, req__5099);
      return cljs.core.swap_BANG_.call(null, enfocus.core.tpl_load_cnt, cljs.core.dec)
    });
    return req__5099.send(uri, "GET")
  }else {
    return null
  }
};
enfocus.core.get_cached_dom = function get_cached_dom(uri) {
  var nod__5110 = cljs.core.deref.call(null, enfocus.core.tpl_cache).call(null, uri);
  if(cljs.core.truth_(nod__5110)) {
    return cljs.core.Vector.fromArray([cljs.core.first.call(null, nod__5110), cljs.core.second.call(null, nod__5110).cloneNode(true)])
  }else {
    return null
  }
};
enfocus.core.get_cached_snippet = function get_cached_snippet(uri, sel) {
  var sel_str__5111 = enfocus.core.create_sel_str.call(null, sel);
  var cache__5112 = cljs.core.deref.call(null, enfocus.core.tpl_cache).call(null, cljs.core.str.call(null, uri.call(null, sel_str__5111)));
  if(cljs.core.truth_(cache__5112)) {
    return cljs.core.Vector.fromArray([cljs.core.first.call(null, cache__5112), cljs.core.second.call(null, cache__5112).cloneNode(true)])
  }else {
    var vec__5113__5114 = enfocus.core.get_cached_dom.call(null, uri);
    var sym__5115 = cljs.core.nth.call(null, vec__5113__5114, 0, null);
    var tdom__5116 = cljs.core.nth.call(null, vec__5113__5114, 1, null);
    var dom__5117 = enfocus.core.create_hidden_dom.call(null, tdom__5116);
    var tsnip__5118 = enfocus.core.css_select.call(null, dom__5117, sel_str__5111);
    var snip__5119 = cljs.core.truth_(cljs.core.instance_QMARK_.call(null, Array, tsnip__5118)) ? cljs.core.first.call(null, tsnip__5118) : tsnip__5118;
    enfocus.core.remove_node_return_child.call(null, dom__5117);
    cljs.core.assoc.call(null, cljs.core.deref.call(null, enfocus.core.tpl_cache), cljs.core.str.call(null, uri, sel_str__5111), cljs.core.Vector.fromArray([sym__5115, snip__5119]));
    return cljs.core.Vector.fromArray([sym__5115, snip__5119])
  }
};
enfocus.core.extr_multi_node = function extr_multi_node(func) {
  return function trans(pnodes) {
    var pnod_col__5120 = enfocus.core.nodes__GT_coll.call(null, pnodes);
    var result__5121 = cljs.core.doall.call(null, cljs.core.map.call(null, func, pnod_col__5120));
    if(cljs.core.truth_(cljs.core.count.call(null, result__5121) <= 1)) {
      return cljs.core.first.call(null, result__5121)
    }else {
      return result__5121
    }
  }
};
enfocus.core.chainable_standard = function chainable_standard(func) {
  return function() {
    var trans = null;
    var trans__5124 = function(pnodes) {
      return trans.call(null, pnodes, null)
    };
    var trans__5125 = function(pnodes, chain) {
      var pnod_col__5123 = enfocus.core.nodes__GT_coll.call(null, pnodes);
      cljs.core.doall.call(null, cljs.core.map.call(null, func, pnod_col__5123));
      if(cljs.core.truth_(cljs.core.not.call(null, chain === null))) {
        return chain.call(null, pnodes)
      }else {
        return null
      }
    };
    trans = function(pnodes, chain) {
      switch(arguments.length) {
        case 1:
          return trans__5124.call(this, pnodes);
        case 2:
          return trans__5125.call(this, pnodes, chain)
      }
      throw"Invalid arity: " + arguments.length;
    };
    return trans
  }()
};
enfocus.core.chainable_effect = function chainable_effect(func, callback) {
  return function() {
    var trans = null;
    var trans__5131 = function(pnodes) {
      return trans.call(null, pnodes, null)
    };
    var trans__5132 = function(pnodes, chain) {
      var pnod_col__5128 = enfocus.core.nodes__GT_coll.call(null, pnodes);
      var cnt__5129 = cljs.core.atom.call(null, cljs.core.count.call(null, pnod_col__5128));
      var partial_cback__5130 = function() {
        cljs.core.swap_BANG_.call(null, cnt__5129, cljs.core.dec);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, cljs.core.deref.call(null, cnt__5129)))) {
          if(cljs.core.truth_(cljs.core.not.call(null, callback === null))) {
            callback.call(null, pnodes)
          }else {
          }
          if(cljs.core.truth_(cljs.core.not.call(null, chain === null))) {
            return chain.call(null, pnodes)
          }else {
            return null
          }
        }else {
          return null
        }
      };
      return cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__5122_SHARP_) {
        return func.call(null, p1__5122_SHARP_, partial_cback__5130)
      }, pnod_col__5128))
    };
    trans = function(pnodes, chain) {
      switch(arguments.length) {
        case 1:
          return trans__5131.call(this, pnodes);
        case 2:
          return trans__5132.call(this, pnodes, chain)
      }
      throw"Invalid arity: " + arguments.length;
    };
    return trans
  }()
};
enfocus.core.content_based_trans = function content_based_trans(values, func) {
  var fnodes__5134 = enfocus.core.flatten_nodes_coll.call(null, values);
  return enfocus.core.chainable_standard.call(null, function(pnod) {
    var frag__5135 = document.createDocumentFragment();
    cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__5127_SHARP_) {
      return goog.dom.appendChild.call(null, frag__5135, p1__5127_SHARP_.cloneNode(true))
    }, fnodes__5134));
    return func.call(null, pnod, frag__5135)
  })
};
enfocus.core.en_content = function() {
  var en_content__delegate = function(values) {
    return enfocus.core.content_based_trans.call(null, values, function(pnod, frag) {
      goog.dom.removeChildren.call(null, pnod);
      return goog.dom.appendChild.call(null, pnod, frag)
    })
  };
  var en_content = function(var_args) {
    var values = null;
    if(goog.isDef(var_args)) {
      values = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return en_content__delegate.call(this, values)
  };
  en_content.cljs$lang$maxFixedArity = 0;
  en_content.cljs$lang$applyTo = function(arglist__5136) {
    var values = cljs.core.seq(arglist__5136);
    return en_content__delegate.call(this, values)
  };
  return en_content
}();
enfocus.core.en_html_content = function en_html_content(txt) {
  return enfocus.core.chainable_standard.call(null, function(pnod) {
    var frag__5137 = goog.dom.htmlToDocumentFragment.call(null, txt);
    goog.dom.removeChildren.call(null, pnod);
    return goog.dom.append.call(null, pnod, frag__5137)
  })
};
enfocus.core.en_set_attr = function() {
  var en_set_attr__delegate = function(values) {
    var at_lst__5139 = cljs.core.partition.call(null, 2, values);
    return enfocus.core.chainable_standard.call(null, function(pnod) {
      return cljs.core.doall.call(null, cljs.core.map.call(null, function(p__5140) {
        var vec__5141__5142 = p__5140;
        var a__5143 = cljs.core.nth.call(null, vec__5141__5142, 0, null);
        var v__5144 = cljs.core.nth.call(null, vec__5141__5142, 1, null);
        return pnod.setAttribute(cljs.core.name.call(null, a__5143), v__5144)
      }, at_lst__5139))
    })
  };
  var en_set_attr = function(var_args) {
    var values = null;
    if(goog.isDef(var_args)) {
      values = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return en_set_attr__delegate.call(this, values)
  };
  en_set_attr.cljs$lang$maxFixedArity = 0;
  en_set_attr.cljs$lang$applyTo = function(arglist__5145) {
    var values = cljs.core.seq(arglist__5145);
    return en_set_attr__delegate.call(this, values)
  };
  return en_set_attr
}();
enfocus.core.en_remove_attr = function() {
  var en_remove_attr__delegate = function(values) {
    return enfocus.core.chainable_standard.call(null, function(pnod) {
      return cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__5138_SHARP_) {
        return pnod.removeAttribute(cljs.core.name.call(null, p1__5138_SHARP_))
      }, values))
    })
  };
  var en_remove_attr = function(var_args) {
    var values = null;
    if(goog.isDef(var_args)) {
      values = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return en_remove_attr__delegate.call(this, values)
  };
  en_remove_attr.cljs$lang$maxFixedArity = 0;
  en_remove_attr.cljs$lang$applyTo = function(arglist__5146) {
    var values = cljs.core.seq(arglist__5146);
    return en_remove_attr__delegate.call(this, values)
  };
  return en_remove_attr
}();
enfocus.core.has_class = function has_class(el, cls) {
  return goog.dom.classes.hasClass.call(null, el, cls)
};
enfocus.core.en_add_class = function() {
  var en_add_class__delegate = function(values) {
    return enfocus.core.chainable_standard.call(null, function(pnod) {
      return cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__5147_SHARP_) {
        return goog.dom.classes.add.call(null, pnod, p1__5147_SHARP_)
      }, values))
    })
  };
  var en_add_class = function(var_args) {
    var values = null;
    if(goog.isDef(var_args)) {
      values = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return en_add_class__delegate.call(this, values)
  };
  en_add_class.cljs$lang$maxFixedArity = 0;
  en_add_class.cljs$lang$applyTo = function(arglist__5149) {
    var values = cljs.core.seq(arglist__5149);
    return en_add_class__delegate.call(this, values)
  };
  return en_add_class
}();
enfocus.core.en_remove_class = function() {
  var en_remove_class__delegate = function(values) {
    return enfocus.core.chainable_standard.call(null, function(pnod) {
      return cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__5148_SHARP_) {
        return goog.dom.classes.remove.call(null, pnod, p1__5148_SHARP_)
      }, values))
    })
  };
  var en_remove_class = function(var_args) {
    var values = null;
    if(goog.isDef(var_args)) {
      values = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return en_remove_class__delegate.call(this, values)
  };
  en_remove_class.cljs$lang$maxFixedArity = 0;
  en_remove_class.cljs$lang$applyTo = function(arglist__5151) {
    var values = cljs.core.seq(arglist__5151);
    return en_remove_class__delegate.call(this, values)
  };
  return en_remove_class
}();
enfocus.core.en_do__GT_ = function() {
  var en_do__GT___delegate = function(forms) {
    return enfocus.core.chainable_standard.call(null, function(pnod) {
      return cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__5150_SHARP_) {
        return p1__5150_SHARP_.call(null, pnod)
      }, forms))
    })
  };
  var en_do__GT_ = function(var_args) {
    var forms = null;
    if(goog.isDef(var_args)) {
      forms = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return en_do__GT___delegate.call(this, forms)
  };
  en_do__GT_.cljs$lang$maxFixedArity = 0;
  en_do__GT_.cljs$lang$applyTo = function(arglist__5152) {
    var forms = cljs.core.seq(arglist__5152);
    return en_do__GT___delegate.call(this, forms)
  };
  return en_do__GT_
}();
enfocus.core.en_append = function() {
  var en_append__delegate = function(values) {
    return enfocus.core.content_based_trans.call(null, values, function(pnod, frag) {
      return goog.dom.appendChild.call(null, pnod, frag)
    })
  };
  var en_append = function(var_args) {
    var values = null;
    if(goog.isDef(var_args)) {
      values = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return en_append__delegate.call(this, values)
  };
  en_append.cljs$lang$maxFixedArity = 0;
  en_append.cljs$lang$applyTo = function(arglist__5153) {
    var values = cljs.core.seq(arglist__5153);
    return en_append__delegate.call(this, values)
  };
  return en_append
}();
enfocus.core.en_prepend = function() {
  var en_prepend__delegate = function(values) {
    return enfocus.core.content_based_trans.call(null, values, function(pnod, frag) {
      var nod__5154 = pnod.firstChild;
      return pnod.insertBefore(frag, nod__5154)
    })
  };
  var en_prepend = function(var_args) {
    var values = null;
    if(goog.isDef(var_args)) {
      values = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return en_prepend__delegate.call(this, values)
  };
  en_prepend.cljs$lang$maxFixedArity = 0;
  en_prepend.cljs$lang$applyTo = function(arglist__5155) {
    var values = cljs.core.seq(arglist__5155);
    return en_prepend__delegate.call(this, values)
  };
  return en_prepend
}();
enfocus.core.en_before = function() {
  var en_before__delegate = function(values) {
    return enfocus.core.content_based_trans.call(null, values, function(pnod, frag) {
      return goog.dom.insertSiblingBefore.call(null, frag, pnod)
    })
  };
  var en_before = function(var_args) {
    var values = null;
    if(goog.isDef(var_args)) {
      values = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return en_before__delegate.call(this, values)
  };
  en_before.cljs$lang$maxFixedArity = 0;
  en_before.cljs$lang$applyTo = function(arglist__5156) {
    var values = cljs.core.seq(arglist__5156);
    return en_before__delegate.call(this, values)
  };
  return en_before
}();
enfocus.core.en_after = function() {
  var en_after__delegate = function(values) {
    return enfocus.core.content_based_trans.call(null, values, function(pnod, frag) {
      return goog.dom.insertSiblingAfter.call(null, frag, pnod)
    })
  };
  var en_after = function(var_args) {
    var values = null;
    if(goog.isDef(var_args)) {
      values = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return en_after__delegate.call(this, values)
  };
  en_after.cljs$lang$maxFixedArity = 0;
  en_after.cljs$lang$applyTo = function(arglist__5157) {
    var values = cljs.core.seq(arglist__5157);
    return en_after__delegate.call(this, values)
  };
  return en_after
}();
enfocus.core.en_substitute = function() {
  var en_substitute__delegate = function(values) {
    return enfocus.core.content_based_trans.call(null, values, function(pnod, frag) {
      return goog.dom.replaceNode.call(null, frag, pnod)
    })
  };
  var en_substitute = function(var_args) {
    var values = null;
    if(goog.isDef(var_args)) {
      values = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return en_substitute__delegate.call(this, values)
  };
  en_substitute.cljs$lang$maxFixedArity = 0;
  en_substitute.cljs$lang$applyTo = function(arglist__5158) {
    var values = cljs.core.seq(arglist__5158);
    return en_substitute__delegate.call(this, values)
  };
  return en_substitute
}();
enfocus.core.en_remove_node = function() {
  var en_remove_node__delegate = function(values) {
    return enfocus.core.chainable_standard.call(null, function(pnod) {
      return goog.dom.removeNode.call(null, pnod)
    })
  };
  var en_remove_node = function(var_args) {
    var values = null;
    if(goog.isDef(var_args)) {
      values = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return en_remove_node__delegate.call(this, values)
  };
  en_remove_node.cljs$lang$maxFixedArity = 0;
  en_remove_node.cljs$lang$applyTo = function(arglist__5159) {
    var values = cljs.core.seq(arglist__5159);
    return en_remove_node__delegate.call(this, values)
  };
  return en_remove_node
}();
enfocus.core.en_wrap = function en_wrap(elm, mattr) {
  return enfocus.core.chainable_standard.call(null, function(pnod) {
    var elem__5160 = goog.dom.createElement.call(null, cljs.core.name.call(null, elm));
    enfocus.core.add_map_attrs.call(null, elem__5160, mattr);
    enfocus.core.en_content.call(null, pnod.cloneNode(true)).call(null, elem__5160);
    elem__5160;
    enfocus.core.en_do__GT_.call(null, enfocus.core.en_after.call(null, elem__5160), enfocus.core.en_remove_node.call(null)).call(null, pnod);
    return pnod
  })
};
enfocus.core.en_unwrap = function en_unwrap() {
  return enfocus.core.chainable_standard.call(null, function(pnod) {
    var frag__5161 = document.createDocumentFragment();
    enfocus.core.en_append.call(null, pnod.childNodes).call(null, frag__5161);
    frag__5161;
    return goog.dom.replaceNode.call(null, frag__5161, pnod)
  })
};
enfocus.core.en_set_style = function() {
  var en_set_style__delegate = function(values) {
    return enfocus.core.chainable_standard.call(null, function(pnod) {
      return enfocus.core.style_set.call(null, pnod, values)
    })
  };
  var en_set_style = function(var_args) {
    var values = null;
    if(goog.isDef(var_args)) {
      values = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return en_set_style__delegate.call(this, values)
  };
  en_set_style.cljs$lang$maxFixedArity = 0;
  en_set_style.cljs$lang$applyTo = function(arglist__5162) {
    var values = cljs.core.seq(arglist__5162);
    return en_set_style__delegate.call(this, values)
  };
  return en_set_style
}();
enfocus.core.en_remove_style = function() {
  var en_remove_style__delegate = function(values) {
    return enfocus.core.chainable_standard.call(null, function(pnod) {
      return enfocus.core.style_remove.call(null, pnod, values)
    })
  };
  var en_remove_style = function(var_args) {
    var values = null;
    if(goog.isDef(var_args)) {
      values = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return en_remove_style__delegate.call(this, values)
  };
  en_remove_style.cljs$lang$maxFixedArity = 0;
  en_remove_style.cljs$lang$applyTo = function(arglist__5163) {
    var values = cljs.core.seq(arglist__5163);
    return en_remove_style__delegate.call(this, values)
  };
  return en_remove_style
}();
enfocus.core.view_port_monitor = cljs.core.atom.call(null, null);
enfocus.core.get_vp_monitor = function get_vp_monitor() {
  if(cljs.core.truth_(cljs.core.deref.call(null, enfocus.core.view_port_monitor))) {
    return cljs.core.deref.call(null, enfocus.core.view_port_monitor)
  }else {
    cljs.core.swap_BANG_.call(null, enfocus.core.view_port_monitor, function() {
      return new goog.dom.ViewportSizeMonitor
    });
    return cljs.core.deref.call(null, enfocus.core.view_port_monitor)
  }
};
enfocus.core.gen_enter_leave_wrapper = function gen_enter_leave_wrapper(event) {
  var obj__5164 = new Object;
  obj__5164.listen = function(elm, func, opt_cap, opt_scope, opt_handler) {
    var callback__5165 = enfocus.core.mouse_enter_leave.call(null, func);
    callback__5165.listen = func;
    callback__5165.scope = opt_scope;
    if(cljs.core.truth_(enfocus.core.op_handler)) {
      return opt_handler.listen(elm, cljs.core.name.call(null, event), callback__5165)
    }else {
      return goog.events.listen.call(null, elm, cljs.core.name.call(null, event), callback__5165)
    }
  };
  obj__5164.unlisten = function(elm, func, opt_cap, opt_scope, opt_handler) {
    var listeners__5166 = goog.events.getListeners.call(null, elm, cljs.core.name.call(null, event), false);
    return cljs.core.dorun.call(null, cljs.core.map.call(null, function(obj) {
      var listener__5167 = obj.listener;
      if(cljs.core.truth_(function() {
        var and__3546__auto____5169 = function() {
          var or__3548__auto____5168 = cljs.core.not.call(null, func);
          if(cljs.core.truth_(or__3548__auto____5168)) {
            return or__3548__auto____5168
          }else {
            return cljs.core._EQ_.call(null, listener__5167.listen, func)
          }
        }();
        if(cljs.core.truth_(and__3546__auto____5169)) {
          var or__3548__auto____5170 = cljs.core.not.call(null, opt_scope);
          if(cljs.core.truth_(or__3548__auto____5170)) {
            return or__3548__auto____5170
          }else {
            return cljs.core._EQ_.call(null, listener__5167.scope, opt_scope)
          }
        }else {
          return and__3546__auto____5169
        }
      }())) {
        if(cljs.core.truth_(opt_handler)) {
          return opt_handler.unlisten(elm, cljs.core.name.call(null, event), listener__5167)
        }else {
          return goog.events.unlisten.call(null, elm, cljs.core.name.call(null, event), listener__5167)
        }
      }else {
        return null
      }
    }, listeners__5166))
  };
  return obj__5164
};
enfocus.core.wrapper_register = cljs.core.ObjMap.fromObject(["\ufdd0'mouseenter", "\ufdd0'mouseleave"], {"\ufdd0'mouseenter":enfocus.core.gen_enter_leave_wrapper.call(null, "\ufdd0'mouseover"), "\ufdd0'mouseleave":enfocus.core.gen_enter_leave_wrapper.call(null, "\ufdd0'mouseout")});
enfocus.core.en_listen = function en_listen(event, func) {
  var wrapper__5171 = enfocus.core.wrapper_register.call(null, event);
  return enfocus.core.chainable_standard.call(null, function(pnod) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5172 = cljs.core._EQ_.call(null, "\ufdd0'resize", event);
      if(cljs.core.truth_(and__3546__auto____5172)) {
        return window === pnod
      }else {
        return and__3546__auto____5172
      }
    }())) {
      return goog.events.listen.call(null, enfocus.core.get_vp_monitor.call(null), "resize", func)
    }else {
      if(cljs.core.truth_(wrapper__5171 === null)) {
        return goog.events.listen.call(null, pnod, cljs.core.name.call(null, event), func)
      }else {
        return goog.events.listenWithWrapper.call(null, pnod, wrapper__5171, func)
      }
    }
  })
};
enfocus.core.en_unlisten = function en_unlisten(event, func) {
  var wrapper__5175 = enfocus.core.wrapper_register.call(null, event);
  return enfocus.core.chainable_standard.call(null, function(pnod) {
    if(cljs.core.truth_(wrapper__5175 === null)) {
      return goog.events.unlisten.call(null, pnod, cljs.core.name.call(null, event), func)
    }else {
      return goog.events.unlistenWithWrapper.call(null, pnod, wrapper__5175, func)
    }
  })
};
enfocus.core.en_remove_listeners = function() {
  var en_remove_listeners__delegate = function(event_list) {
    var get_name__5176 = function(p1__5173_SHARP_) {
      return cljs.core.name.call(null, cljs.core.truth_(cljs.core._EQ_.call(null, p1__5173_SHARP_, "\ufdd0'mouseenter")) ? "\ufdd0'mouseover" : cljs.core.truth_(cljs.core._EQ_.call(null, p1__5173_SHARP_, "\ufdd0'mouseleave")) ? "\ufdd0'mouseout" : cljs.core.truth_("\ufdd0'else") ? p1__5173_SHARP_ : null)
    };
    return enfocus.core.chainable_standard.call(null, function(pnod) {
      return cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__5174_SHARP_) {
        return goog.events.removeAll.call(null, pnod, get_name__5176.call(null, p1__5174_SHARP_))
      }, event_list))
    })
  };
  var en_remove_listeners = function(var_args) {
    var event_list = null;
    if(goog.isDef(var_args)) {
      event_list = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return en_remove_listeners__delegate.call(this, event_list)
  };
  en_remove_listeners.cljs$lang$maxFixedArity = 0;
  en_remove_listeners.cljs$lang$applyTo = function(arglist__5177) {
    var event_list = cljs.core.seq(arglist__5177);
    return en_remove_listeners__delegate.call(this, event_list)
  };
  return en_remove_listeners
}();
enfocus.core.en_fade_out = function en_fade_out(ttime, callback, accel) {
  return enfocus.core.chainable_effect.call(null, function(pnod, pcallback) {
    var anim__5178 = new goog.fx.dom.FadeOut(pnod, ttime, accel);
    if(cljs.core.truth_(cljs.core.not.call(null, pcallback === null))) {
      goog.events.listen.call(null, anim__5178, goog.fx.Animation.EventType.END, pcallback)
    }else {
    }
    return anim__5178.play()
  }, callback)
};
enfocus.core.en_fade_in = function en_fade_in(ttime, callback, accel) {
  return enfocus.core.chainable_effect.call(null, function(pnod, pcallback) {
    var anim__5179 = new goog.fx.dom.FadeIn(pnod, ttime, accel);
    if(cljs.core.truth_(cljs.core.not.call(null, pcallback === null))) {
      goog.events.listen.call(null, anim__5179, goog.fx.Animation.EventType.END, pcallback)
    }else {
    }
    return anim__5179.play()
  }, callback)
};
enfocus.core.en_resize = function en_resize(wth, hgt, ttime, callback, accel) {
  return enfocus.core.chainable_effect.call(null, function(pnod, pcallback) {
    var csize__5180 = goog.style.getSize.call(null, pnod);
    var start__5181 = cljs.core.array.call(null, csize__5180.width, csize__5180.height);
    var wth__5182 = cljs.core.truth_(cljs.core._EQ_.call(null, "\ufdd0'curwidth", wth)) ? csize__5180.width : wth;
    var hgt__5183 = cljs.core.truth_(cljs.core._EQ_.call(null, "\ufdd0'curheight", hgt)) ? csize__5180.height : hgt;
    var end__5184 = cljs.core.array.call(null, wth__5182, hgt__5183);
    var anim__5185 = new goog.fx.dom.Resize(pnod, start__5181, end__5184, ttime, accel);
    if(cljs.core.truth_(cljs.core.not.call(null, pcallback === null))) {
      goog.events.listen.call(null, anim__5185, goog.fx.Animation.EventType.END, pcallback)
    }else {
    }
    return anim__5185.play()
  }, callback)
};
enfocus.core.en_move = function en_move(xpos, ypos, ttime, callback, accel) {
  return enfocus.core.chainable_effect.call(null, function(pnod, pcallback) {
    var cpos__5186 = goog.style.getPosition.call(null, pnod);
    var start__5187 = cljs.core.array.call(null, cpos__5186.x, cpos__5186.y);
    var xpos__5188 = cljs.core.truth_(cljs.core._EQ_.call(null, "\ufdd0'curx")) ? cpos__5186.x : xpos;
    var ypos__5189 = cljs.core.truth_(cljs.core._EQ_.call(null, "\ufdd0'cury")) ? cpos__5186.y : ypos;
    var end__5190 = cljs.core.array.call(null, xpos__5188, ypos__5189);
    var anim__5191 = new goog.fx.dom.Slide(pnod, start__5187, end__5190, ttime, accel);
    if(cljs.core.truth_(cljs.core.not.call(null, pcallback === null))) {
      goog.events.listen.call(null, anim__5191, goog.fx.Animation.EventType.END, pcallback)
    }else {
    }
    return anim__5191.play()
  }, callback)
};
enfocus.core.en_get_attr = function en_get_attr(attr) {
  return enfocus.core.extr_multi_node.call(null, function(pnod) {
    return pnod.getAttribute(cljs.core.name.call(null, attr))
  })
};
enfocus.core.en_get_attr = function en_get_attr(attr) {
  return enfocus.core.extr_multi_node.call(null, function(pnod) {
    return pnod.getAttribute(cljs.core.name.call(null, attr))
  })
};
enfocus.core.en_get_text = function en_get_text() {
  return enfocus.core.extr_multi_node.call(null, function(pnod) {
    return goog.dom.getTextContent.call(null, pnod)
  })
};
enfocus.core.reg_filt = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
enfocus.core.en_filter = function en_filter(tst, trans) {
  return function() {
    var filt = null;
    var filt__5195 = function(pnodes) {
      return filt.call(null, pnodes, null)
    };
    var filt__5196 = function(pnodes, chain) {
      var pnod_col__5192 = enfocus.core.nodes__GT_coll.call(null, pnodes);
      var ttest__5193 = cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, tst)) ? cljs.core.deref.call(null, enfocus.core.reg_filt).call(null, tst) : tst;
      var res__5194 = cljs.core.filter.call(null, ttest__5193, pnod_col__5192);
      enfocus.core.log_debug.call(null, cljs.core.pr_str.call(null, res__5194));
      if(cljs.core.truth_(chain === null)) {
        return trans.call(null, res__5194)
      }else {
        return trans.call(null, res__5194, chain)
      }
    };
    filt = function(pnodes, chain) {
      switch(arguments.length) {
        case 1:
          return filt__5195.call(this, pnodes);
        case 2:
          return filt__5196.call(this, pnodes, chain)
      }
      throw"Invalid arity: " + arguments.length;
    };
    return filt
  }()
};
enfocus.core.register_filter = function register_filter(ky, func) {
  return cljs.core.swap_BANG_.call(null, enfocus.core.reg_filt, cljs.core.assoc, ky, func)
};
enfocus.core.selected_options = function selected_options(pnod) {
  return pnod.selected
};
enfocus.core.checked_radio_checkbox = function checked_radio_checkbox(pnod) {
  return pnod.checked
};
enfocus.core.register_filter.call(null, "\ufdd0'selected", enfocus.core.selected_options);
enfocus.core.register_filter.call(null, "\ufdd0'checked", enfocus.core.checked_radio_checkbox);
enfocus.core.create_sel_str = function() {
  var create_sel_str = null;
  var create_sel_str__5199 = function(css_sel) {
    return create_sel_str.call(null, "", css_sel)
  };
  var create_sel_str__5200 = function(id_mask_sym, css_sel) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.map.call(null, function(p1__5198_SHARP_) {
      if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, p1__5198_SHARP_))) {
        return enfocus.core.css_syms.call(null, p1__5198_SHARP_)
      }else {
        if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, p1__5198_SHARP_))) {
          return cljs.core.str.call(null, " ", cljs.core.name.call(null, p1__5198_SHARP_).replace("#", cljs.core.str.call(null, "#", id_mask_sym)))
        }else {
          if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, p1__5198_SHARP_))) {
            return create_sel_str.call(null, p1__5198_SHARP_)
          }else {
            if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, p1__5198_SHARP_))) {
              return p1__5198_SHARP_.replace("#", cljs.core.str.call(null, "#", id_mask_sym))
            }else {
              return null
            }
          }
        }
      }
    }, css_sel))
  };
  create_sel_str = function(id_mask_sym, css_sel) {
    switch(arguments.length) {
      case 1:
        return create_sel_str__5199.call(this, id_mask_sym);
      case 2:
        return create_sel_str__5200.call(this, id_mask_sym, css_sel)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return create_sel_str
}();
enfocus.core.css_select = function() {
  var css_select = null;
  var css_select__5204 = function(css_sel) {
    return css_select.call(null, "", document, css_sel)
  };
  var css_select__5205 = function(dom_node, css_sel) {
    return css_select.call(null, "", dom_node, css_sel)
  };
  var css_select__5206 = function(id_mask_sym, dom_node, css_sel) {
    var sel__5202 = clojure.string.trim.call(null, clojure.string.replace.call(null, enfocus.core.create_sel_str.call(null, id_mask_sym, css_sel), " :", ":"));
    var ret__5203 = goog.dom.query.call(null, sel__5202, dom_node);
    return ret__5203
  };
  css_select = function(id_mask_sym, dom_node, css_sel) {
    switch(arguments.length) {
      case 1:
        return css_select__5204.call(this, id_mask_sym);
      case 2:
        return css_select__5205.call(this, id_mask_sym, dom_node);
      case 3:
        return css_select__5206.call(this, id_mask_sym, dom_node, css_sel)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return css_select
}();
enfocus.core.css_syms = cljs.core.HashMap.fromArrays(["\ufdd1'first-child", "\ufdd1'last-child"], [" *:first-child", " *:last-child"]);
enfocus.core.attr_QMARK_ = function() {
  var attr_QMARK___delegate = function(kys) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.mapcat.call(null, function(p1__5208_SHARP_) {
      return cljs.core.str.call(null, "[", cljs.core.name.call(null, p1__5208_SHARP_), "]")
    }, kys))
  };
  var attr_QMARK_ = function(var_args) {
    var kys = null;
    if(goog.isDef(var_args)) {
      kys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return attr_QMARK___delegate.call(this, kys)
  };
  attr_QMARK_.cljs$lang$maxFixedArity = 0;
  attr_QMARK_.cljs$lang$applyTo = function(arglist__5209) {
    var kys = cljs.core.seq(arglist__5209);
    return attr_QMARK___delegate.call(this, kys)
  };
  return attr_QMARK_
}();
enfocus.core.attr_EQ_ = function() {
  var attr_EQ_ = null;
  var attr_EQ___5210 = function() {
    return""
  };
  var attr_EQ___5211 = function() {
    var G__5213__delegate = function(ky, txt, forms) {
      return cljs.core.str.call(null, "[", cljs.core.name.call(null, ky), "='", txt, "']", cljs.core.apply.call(null, attr_EQ_, forms))
    };
    var G__5213 = function(ky, txt, var_args) {
      var forms = null;
      if(goog.isDef(var_args)) {
        forms = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5213__delegate.call(this, ky, txt, forms)
    };
    G__5213.cljs$lang$maxFixedArity = 2;
    G__5213.cljs$lang$applyTo = function(arglist__5214) {
      var ky = cljs.core.first(arglist__5214);
      var txt = cljs.core.first(cljs.core.next(arglist__5214));
      var forms = cljs.core.rest(cljs.core.next(arglist__5214));
      return G__5213__delegate.call(this, ky, txt, forms)
    };
    return G__5213
  }();
  attr_EQ_ = function(ky, txt, var_args) {
    var forms = var_args;
    switch(arguments.length) {
      case 0:
        return attr_EQ___5210.call(this);
      default:
        return attr_EQ___5211.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  attr_EQ_.cljs$lang$maxFixedArity = 2;
  attr_EQ_.cljs$lang$applyTo = attr_EQ___5211.cljs$lang$applyTo;
  return attr_EQ_
}();
enfocus.core.nth_child = function() {
  var nth_child = null;
  var nth_child__5215 = function(x) {
    return cljs.core.str.call(null, ":nth-child(", x, ")")
  };
  var nth_child__5216 = function(x, y) {
    return cljs.core.str.call(null, ":nth-child(", x, "n+", y, ")")
  };
  nth_child = function(x, y) {
    switch(arguments.length) {
      case 1:
        return nth_child__5215.call(this, x);
      case 2:
        return nth_child__5216.call(this, x, y)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth_child
}();
enfocus.core.nth_of_type = function() {
  var nth_of_type = null;
  var nth_of_type__5218 = function(x) {
    return cljs.core.str.call(null, ":nth-of-type(", x, ")")
  };
  var nth_of_type__5219 = function(x, y) {
    return cljs.core.str.call(null, ":nth-of-type(", x, "n+", y, ")")
  };
  nth_of_type = function(x, y) {
    switch(arguments.length) {
      case 1:
        return nth_of_type__5218.call(this, x);
      case 2:
        return nth_of_type__5219.call(this, x, y)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth_of_type
}();
enfocus.core.nth_last_child = function() {
  var nth_last_child = null;
  var nth_last_child__5221 = function(x) {
    return cljs.core.str.call(null, ":nth-last-child(", x, ")")
  };
  var nth_last_child__5222 = function(x, y) {
    return cljs.core.str.call(null, ":nth-last-child(", x, "n+", y, ")")
  };
  nth_last_child = function(x, y) {
    switch(arguments.length) {
      case 1:
        return nth_last_child__5221.call(this, x);
      case 2:
        return nth_last_child__5222.call(this, x, y)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth_last_child
}();
enfocus.core.nth_last_of_type = function() {
  var nth_last_of_type = null;
  var nth_last_of_type__5224 = function(x) {
    return cljs.core.str.call(null, ":nth-last-of-type(", x, ")")
  };
  var nth_last_of_type__5225 = function(x, y) {
    return cljs.core.str.call(null, ":nth-last-of-type(", x, "n+", y, ")")
  };
  nth_last_of_type = function(x, y) {
    switch(arguments.length) {
      case 1:
        return nth_last_of_type__5224.call(this, x);
      case 2:
        return nth_last_of_type__5225.call(this, x, y)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth_last_of_type
}();
goog.provide("kika");
goog.require("cljs.core");
goog.require("clojure.browser.repl");
goog.require("enfocus.core");
goog.require("goog.dom");
kika.dusan = function dusan(x) {
  return 1 + x
};
kika.kika = function kika(x) {
  return alert.call(null, x)
};
kika.queuein = "http://localhost:8080/queuein";
kika.longpoll = "http://localhost:8080/longpoll";
clojure.browser.repl.connect.call(null, "http://localhost:9000/repl");
kika.start2 = function start2(c) {
  var nods__3121__auto____3319 = enfocus.core.nodes__GT_coll.call(null, document);
  cljs.core.doall.call(null, cljs.core.map.call(null, function(pnod3318) {
    enfocus.core.en_content.call(null, c).call(null, enfocus.core.css_select.call(null, "", pnod3318, cljs.core.Vector.fromArray(["body"])));
    return pnod3318
  }, nods__3121__auto____3319));
  return document
};
kika.xhr = kika.xhr_connection;
kika.callback1 = function callback1(reply) {
  var nods__3121__auto____3321 = enfocus.core.nodes__GT_coll.call(null, document);
  cljs.core.doall.call(null, cljs.core.map.call(null, function(pnod3320) {
    enfocus.core.en_append.call(null, reply).call(null, enfocus.core.css_select.call(null, "", pnod3320, cljs.core.Vector.fromArray(["#div1"])));
    return pnod3320
  }, nods__3121__auto____3321));
  return document
};
kika.callback2 = function callback2(reply) {
  var nods__3121__auto____3323 = enfocus.core.nodes__GT_coll.call(null, document);
  cljs.core.doall.call(null, cljs.core.map.call(null, function(pnod3322) {
    enfocus.core.en_content.call(null, reply).call(null, enfocus.core.css_select.call(null, "", pnod3322, cljs.core.Vector.fromArray(["#div2"])));
    return pnod3322
  }, nods__3121__auto____3323));
  return document
};
kika.ajax_call = function ajax_call(url, callback) {
  return kika.xhr.send(url, callback)
};

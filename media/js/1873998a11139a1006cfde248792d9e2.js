/*  Prototype JavaScript framework, version 1.7
 *  (c) 2005-2010 Sam Stephenson
 *
 *  Prototype is freely distributable under the terms of an MIT-style license.
 *  For details, see the Prototype web site: http://www.prototypejs.org/
 *
 *--------------------------------------------------------------------------*/

var Prototype = {

  Version: '1.7',

  Browser: (function(){
    var ua = navigator.userAgent;
    var isOpera = Object.prototype.toString.call(window.opera) == '[object Opera]';
    return {
      IE:             !!window.attachEvent && !isOpera,
      Opera:          isOpera,
      WebKit:         ua.indexOf('AppleWebKit/') > -1,
      Gecko:          ua.indexOf('Gecko') > -1 && ua.indexOf('KHTML') === -1,
      MobileSafari:   /Apple.*Mobile/.test(ua)
    }
  })(),

  BrowserFeatures: {
    XPath: !!document.evaluate,

    SelectorsAPI: !!document.querySelector,

    ElementExtensions: (function() {
      var constructor = window.Element || window.HTMLElement;
      return !!(constructor && constructor.prototype);
    })(),
    SpecificElementExtensions: (function() {
      if (typeof window.HTMLDivElement !== 'undefined')
        return true;

      var div = document.createElement('div'),
          form = document.createElement('form'),
          isSupported = false;

      if (div['__proto__'] && (div['__proto__'] !== form['__proto__'])) {
        isSupported = true;
      }

      div = form = null;

      return isSupported;
    })()
  },

  ScriptFragment: '<script[^>]*>([\\S\\s]*?)<\/script>',
  JSONFilter: /^\/\*-secure-([\s\S]*)\*\/\s*$/,

  emptyFunction: function() { },

  K: function(x) { return x }
};

if (Prototype.Browser.MobileSafari)
  Prototype.BrowserFeatures.SpecificElementExtensions = false;


var Abstract = { };


var Try = {
  these: function() {
    var returnValue;

    for (var i = 0, length = arguments.length; i < length; i++) {
      var lambda = arguments[i];
      try {
        returnValue = lambda();
        break;
      } catch (e) { }
    }

    return returnValue;
  }
};

/* Based on Alex Arnell's inheritance implementation. */

var Class = (function() {

  var IS_DONTENUM_BUGGY = (function(){
    for (var p in { toString: 1 }) {
      if (p === 'toString') return false;
    }
    return true;
  })();

  function subclass() {};
  function create() {
    var parent = null, properties = $A(arguments);
    if (Object.isFunction(properties[0]))
      parent = properties.shift();

    function klass() {
      this.initialize.apply(this, arguments);
    }

    Object.extend(klass, Class.Methods);
    klass.superclass = parent;
    klass.subclasses = [];

    if (parent) {
      subclass.prototype = parent.prototype;
      klass.prototype = new subclass;
      parent.subclasses.push(klass);
    }

    for (var i = 0, length = properties.length; i < length; i++)
      klass.addMethods(properties[i]);

    if (!klass.prototype.initialize)
      klass.prototype.initialize = Prototype.emptyFunction;

    klass.prototype.constructor = klass;
    return klass;
  }

  function addMethods(source) {
    var ancestor   = this.superclass && this.superclass.prototype,
        properties = Object.keys(source);

    if (IS_DONTENUM_BUGGY) {
      if (source.toString != Object.prototype.toString)
        properties.push("toString");
      if (source.valueOf != Object.prototype.valueOf)
        properties.push("valueOf");
    }

    for (var i = 0, length = properties.length; i < length; i++) {
      var property = properties[i], value = source[property];
      if (ancestor && Object.isFunction(value) &&
          value.argumentNames()[0] == "$super") {
        var method = value;
        value = (function(m) {
          return function() { return ancestor[m].apply(this, arguments); };
        })(property).wrap(method);

        value.valueOf = method.valueOf.bind(method);
        value.toString = method.toString.bind(method);
      }
      this.prototype[property] = value;
    }

    return this;
  }

  return {
    create: create,
    Methods: {
      addMethods: addMethods
    }
  };
})();
(function() {

  var _toString = Object.prototype.toString,
      NULL_TYPE = 'Null',
      UNDEFINED_TYPE = 'Undefined',
      BOOLEAN_TYPE = 'Boolean',
      NUMBER_TYPE = 'Number',
      STRING_TYPE = 'String',
      OBJECT_TYPE = 'Object',
      FUNCTION_CLASS = '[object Function]',
      BOOLEAN_CLASS = '[object Boolean]',
      NUMBER_CLASS = '[object Number]',
      STRING_CLASS = '[object String]',
      ARRAY_CLASS = '[object Array]',
      DATE_CLASS = '[object Date]',
      NATIVE_JSON_STRINGIFY_SUPPORT = window.JSON &&
        typeof JSON.stringify === 'function' &&
        JSON.stringify(0) === '0' &&
        typeof JSON.stringify(Prototype.K) === 'undefined';

  function Type(o) {
    switch(o) {
      case null: return NULL_TYPE;
      case (void 0): return UNDEFINED_TYPE;
    }
    var type = typeof o;
    switch(type) {
      case 'boolean': return BOOLEAN_TYPE;
      case 'number':  return NUMBER_TYPE;
      case 'string':  return STRING_TYPE;
    }
    return OBJECT_TYPE;
  }

  function extend(destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
  }

  function inspect(object) {
    try {
      if (isUndefined(object)) return 'undefined';
      if (object === null) return 'null';
      return object.inspect ? object.inspect() : String(object);
    } catch (e) {
      if (e instanceof RangeError) return '...';
      throw e;
    }
  }

  function toJSON(value) {
    return Str('', { '': value }, []);
  }

  function Str(key, holder, stack) {
    var value = holder[key],
        type = typeof value;

    if (Type(value) === OBJECT_TYPE && typeof value.toJSON === 'function') {
      value = value.toJSON(key);
    }

    var _class = _toString.call(value);

    switch (_class) {
      case NUMBER_CLASS:
      case BOOLEAN_CLASS:
      case STRING_CLASS:
        value = value.valueOf();
    }

    switch (value) {
      case null: return 'null';
      case true: return 'true';
      case false: return 'false';
    }

    type = typeof value;
    switch (type) {
      case 'string':
        return value.inspect(true);
      case 'number':
        return isFinite(value) ? String(value) : 'null';
      case 'object':

        for (var i = 0, length = stack.length; i < length; i++) {
          if (stack[i] === value) { throw new TypeError(); }
        }
        stack.push(value);

        var partial = [];
        if (_class === ARRAY_CLASS) {
          for (var i = 0, length = value.length; i < length; i++) {
            var str = Str(i, value, stack);
            partial.push(typeof str === 'undefined' ? 'null' : str);
          }
          partial = '[' + partial.join(',') + ']';
        } else {
          var keys = Object.keys(value);
          for (var i = 0, length = keys.length; i < length; i++) {
            var key = keys[i], str = Str(key, value, stack);
            if (typeof str !== "undefined") {
               partial.push(key.inspect(true)+ ':' + str);
             }
          }
          partial = '{' + partial.join(',') + '}';
        }
        stack.pop();
        return partial;
    }
  }

  function stringify(object) {
    return JSON.stringify(object);
  }

  function toQueryString(object) {
    return $H(object).toQueryString();
  }

  function toHTML(object) {
    return object && object.toHTML ? object.toHTML() : String.interpret(object);
  }

  function keys(object) {
    if (Type(object) !== OBJECT_TYPE) { throw new TypeError(); }
    var results = [];
    for (var property in object) {
      if (object.hasOwnProperty(property)) {
        results.push(property);
      }
    }
    return results;
  }

  function values(object) {
    var results = [];
    for (var property in object)
      results.push(object[property]);
    return results;
  }

  function clone(object) {
    return extend({ }, object);
  }

  function isElement(object) {
    return !!(object && object.nodeType == 1);
  }

  function isArray(object) {
    return _toString.call(object) === ARRAY_CLASS;
  }

  var hasNativeIsArray = (typeof Array.isArray == 'function')
    && Array.isArray([]) && !Array.isArray({});

  if (hasNativeIsArray) {
    isArray = Array.isArray;
  }

  function isHash(object) {
    return object instanceof Hash;
  }

  function isFunction(object) {
    return _toString.call(object) === FUNCTION_CLASS;
  }

  function isString(object) {
    return _toString.call(object) === STRING_CLASS;
  }

  function isNumber(object) {
    return _toString.call(object) === NUMBER_CLASS;
  }

  function isDate(object) {
    return _toString.call(object) === DATE_CLASS;
  }

  function isUndefined(object) {
    return typeof object === "undefined";
  }

  extend(Object, {
    extend:        extend,
    inspect:       inspect,
    toJSON:        NATIVE_JSON_STRINGIFY_SUPPORT ? stringify : toJSON,
    toQueryString: toQueryString,
    toHTML:        toHTML,
    keys:          Object.keys || keys,
    values:        values,
    clone:         clone,
    isElement:     isElement,
    isArray:       isArray,
    isHash:        isHash,
    isFunction:    isFunction,
    isString:      isString,
    isNumber:      isNumber,
    isDate:        isDate,
    isUndefined:   isUndefined
  });
})();
Object.extend(Function.prototype, (function() {
  var slice = Array.prototype.slice;

  function update(array, args) {
    var arrayLength = array.length, length = args.length;
    while (length--) array[arrayLength + length] = args[length];
    return array;
  }

  function merge(array, args) {
    array = slice.call(array, 0);
    return update(array, args);
  }

  function argumentNames() {
    var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
      .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
      .replace(/\s+/g, '').split(',');
    return names.length == 1 && !names[0] ? [] : names;
  }

  function bind(context) {
    if (arguments.length < 2 && Object.isUndefined(arguments[0])) return this;
    var __method = this, args = slice.call(arguments, 1);
    return function() {
      var a = merge(args, arguments);
      return __method.apply(context, a);
    }
  }

  function bindAsEventListener(context) {
    var __method = this, args = slice.call(arguments, 1);
    return function(event) {
      var a = update([event || window.event], args);
      return __method.apply(context, a);
    }
  }

  function curry() {
    if (!arguments.length) return this;
    var __method = this, args = slice.call(arguments, 0);
    return function() {
      var a = merge(args, arguments);
      return __method.apply(this, a);
    }
  }

  function delay(timeout) {
    var __method = this, args = slice.call(arguments, 1);
    timeout = timeout * 1000;
    return window.setTimeout(function() {
      return __method.apply(__method, args);
    }, timeout);
  }

  function defer() {
    var args = update([0.01], arguments);
    return this.delay.apply(this, args);
  }

  function wrap(wrapper) {
    var __method = this;
    return function() {
      var a = update([__method.bind(this)], arguments);
      return wrapper.apply(this, a);
    }
  }

  function methodize() {
    if (this._methodized) return this._methodized;
    var __method = this;
    return this._methodized = function() {
      var a = update([this], arguments);
      return __method.apply(null, a);
    };
  }

  return {
    argumentNames:       argumentNames,
    bind:                bind,
    bindAsEventListener: bindAsEventListener,
    curry:               curry,
    delay:               delay,
    defer:               defer,
    wrap:                wrap,
    methodize:           methodize
  }
})());



(function(proto) {


  function toISOString() {
    return this.getUTCFullYear() + '-' +
      (this.getUTCMonth() + 1).toPaddedString(2) + '-' +
      this.getUTCDate().toPaddedString(2) + 'T' +
      this.getUTCHours().toPaddedString(2) + ':' +
      this.getUTCMinutes().toPaddedString(2) + ':' +
      this.getUTCSeconds().toPaddedString(2) + 'Z';
  }


  function toJSON() {
    return this.toISOString();
  }

  if (!proto.toISOString) proto.toISOString = toISOString;
  if (!proto.toJSON) proto.toJSON = toJSON;

})(Date.prototype);


RegExp.prototype.match = RegExp.prototype.test;

RegExp.escape = function(str) {
  return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
};
var PeriodicalExecuter = Class.create({
  initialize: function(callback, frequency) {
    this.callback = callback;
    this.frequency = frequency;
    this.currentlyExecuting = false;

    this.registerCallback();
  },

  registerCallback: function() {
    this.timer = setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
  },

  execute: function() {
    this.callback(this);
  },

  stop: function() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  },

  onTimerEvent: function() {
    if (!this.currentlyExecuting) {
      try {
        this.currentlyExecuting = true;
        this.execute();
        this.currentlyExecuting = false;
      } catch(e) {
        this.currentlyExecuting = false;
        throw e;
      }
    }
  }
});
Object.extend(String, {
  interpret: function(value) {
    return value == null ? '' : String(value);
  },
  specialChar: {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '\\': '\\\\'
  }
});

Object.extend(String.prototype, (function() {
  var NATIVE_JSON_PARSE_SUPPORT = window.JSON &&
    typeof JSON.parse === 'function' &&
    JSON.parse('{"test": true}').test;

  function prepareReplacement(replacement) {
    if (Object.isFunction(replacement)) return replacement;
    var template = new Template(replacement);
    return function(match) { return template.evaluate(match) };
  }

  function gsub(pattern, replacement) {
    var result = '', source = this, match;
    replacement = prepareReplacement(replacement);

    if (Object.isString(pattern))
      pattern = RegExp.escape(pattern);

    if (!(pattern.length || pattern.source)) {
      replacement = replacement('');
      return replacement + source.split('').join(replacement) + replacement;
    }

    while (source.length > 0) {
      if (match = source.match(pattern)) {
        result += source.slice(0, match.index);
        result += String.interpret(replacement(match));
        source  = source.slice(match.index + match[0].length);
      } else {
        result += source, source = '';
      }
    }
    return result;
  }

  function sub(pattern, replacement, count) {
    replacement = prepareReplacement(replacement);
    count = Object.isUndefined(count) ? 1 : count;

    return this.gsub(pattern, function(match) {
      if (--count < 0) return match[0];
      return replacement(match);
    });
  }

  function scan(pattern, iterator) {
    this.gsub(pattern, iterator);
    return String(this);
  }

  function truncate(length, truncation) {
    length = length || 30;
    truncation = Object.isUndefined(truncation) ? '...' : truncation;
    return this.length > length ?
      this.slice(0, length - truncation.length) + truncation : String(this);
  }

  function strip() {
    return this.replace(/^\s+/, '').replace(/\s+$/, '');
  }

  function stripTags() {
    return this.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, '');
  }

  function stripScripts() {
    return this.replace(new RegExp(Prototype.ScriptFragment, 'img'), '');
  }

  function extractScripts() {
    var matchAll = new RegExp(Prototype.ScriptFragment, 'img'),
        matchOne = new RegExp(Prototype.ScriptFragment, 'im');
    return (this.match(matchAll) || []).map(function(scriptTag) {
      return (scriptTag.match(matchOne) || ['', ''])[1];
    });
  }

  function evalScripts() {
    return this.extractScripts().map(function(script) { return eval(script) });
  }

  function escapeHTML() {
    return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function unescapeHTML() {
    return this.stripTags().replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  }


  function toQueryParams(separator) {
    var match = this.strip().match(/([^?#]*)(#.*)?$/);
    if (!match) return { };

    return match[1].split(separator || '&').inject({ }, function(hash, pair) {
      if ((pair = pair.split('='))[0]) {
        var key = decodeURIComponent(pair.shift()),
            value = pair.length > 1 ? pair.join('=') : pair[0];

        if (value != undefined) value = decodeURIComponent(value);

        if (key in hash) {
          if (!Object.isArray(hash[key])) hash[key] = [hash[key]];
          hash[key].push(value);
        }
        else hash[key] = value;
      }
      return hash;
    });
  }

  function toArray() {
    return this.split('');
  }

  function succ() {
    return this.slice(0, this.length - 1) +
      String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
  }

  function times(count) {
    return count < 1 ? '' : new Array(count + 1).join(this);
  }

  function camelize() {
    return this.replace(/-+(.)?/g, function(match, chr) {
      return chr ? chr.toUpperCase() : '';
    });
  }

  function capitalize() {
    return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
  }

  function underscore() {
    return this.replace(/::/g, '/')
               .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
               .replace(/([a-z\d])([A-Z])/g, '$1_$2')
               .replace(/-/g, '_')
               .toLowerCase();
  }

  function dasherize() {
    return this.replace(/_/g, '-');
  }

  function inspect(useDoubleQuotes) {
    var escapedString = this.replace(/[\x00-\x1f\\]/g, function(character) {
      if (character in String.specialChar) {
        return String.specialChar[character];
      }
      return '\\u00' + character.charCodeAt().toPaddedString(2, 16);
    });
    if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
    return "'" + escapedString.replace(/'/g, '\\\'') + "'";
  }

  function unfilterJSON(filter) {
    return this.replace(filter || Prototype.JSONFilter, '$1');
  }

  function isJSON() {
    var str = this;
    if (str.blank()) return false;
    str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
    str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
    str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
    return (/^[\],:{}\s]*$/).test(str);
  }

  function evalJSON(sanitize) {
    var json = this.unfilterJSON(),
        cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    if (cx.test(json)) {
      json = json.replace(cx, function (a) {
        return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
      });
    }
    try {
      if (!sanitize || json.isJSON()) return eval('(' + json + ')');
    } catch (e) { }
    throw new SyntaxError('Badly formed JSON string: ' + this.inspect());
  }

  function parseJSON() {
    var json = this.unfilterJSON();
    return JSON.parse(json);
  }

  function include(pattern) {
    return this.indexOf(pattern) > -1;
  }

  function startsWith(pattern) {
    return this.lastIndexOf(pattern, 0) === 0;
  }

  function endsWith(pattern) {
    var d = this.length - pattern.length;
    return d >= 0 && this.indexOf(pattern, d) === d;
  }

  function empty() {
    return this == '';
  }

  function blank() {
    return /^\s*$/.test(this);
  }

  function interpolate(object, pattern) {
    return new Template(this, pattern).evaluate(object);
  }

  return {
    gsub:           gsub,
    sub:            sub,
    scan:           scan,
    truncate:       truncate,
    strip:          String.prototype.trim || strip,
    stripTags:      stripTags,
    stripScripts:   stripScripts,
    extractScripts: extractScripts,
    evalScripts:    evalScripts,
    escapeHTML:     escapeHTML,
    unescapeHTML:   unescapeHTML,
    toQueryParams:  toQueryParams,
    parseQuery:     toQueryParams,
    toArray:        toArray,
    succ:           succ,
    times:          times,
    camelize:       camelize,
    capitalize:     capitalize,
    underscore:     underscore,
    dasherize:      dasherize,
    inspect:        inspect,
    unfilterJSON:   unfilterJSON,
    isJSON:         isJSON,
    evalJSON:       NATIVE_JSON_PARSE_SUPPORT ? parseJSON : evalJSON,
    include:        include,
    startsWith:     startsWith,
    endsWith:       endsWith,
    empty:          empty,
    blank:          blank,
    interpolate:    interpolate
  };
})());

var Template = Class.create({
  initialize: function(template, pattern) {
    this.template = template.toString();
    this.pattern = pattern || Template.Pattern;
  },

  evaluate: function(object) {
    if (object && Object.isFunction(object.toTemplateReplacements))
      object = object.toTemplateReplacements();

    return this.template.gsub(this.pattern, function(match) {
      if (object == null) return (match[1] + '');

      var before = match[1] || '';
      if (before == '\\') return match[2];

      var ctx = object, expr = match[3],
          pattern = /^([^.[]+|\[((?:.*?[^\\])?)\])(\.|\[|$)/;

      match = pattern.exec(expr);
      if (match == null) return before;

      while (match != null) {
        var comp = match[1].startsWith('[') ? match[2].replace(/\\\\]/g, ']') : match[1];
        ctx = ctx[comp];
        if (null == ctx || '' == match[3]) break;
        expr = expr.substring('[' == match[3] ? match[1].length : match[0].length);
        match = pattern.exec(expr);
      }

      return before + String.interpret(ctx);
    });
  }
});
Template.Pattern = /(^|.|\r|\n)(#\{(.*?)\})/;

var $break = { };

var Enumerable = (function() {
  function each(iterator, context) {
    var index = 0;
    try {
      this._each(function(value) {
        iterator.call(context, value, index++);
      });
    } catch (e) {
      if (e != $break) throw e;
    }
    return this;
  }

  function eachSlice(number, iterator, context) {
    var index = -number, slices = [], array = this.toArray();
    if (number < 1) return array;
    while ((index += number) < array.length)
      slices.push(array.slice(index, index+number));
    return slices.collect(iterator, context);
  }

  function all(iterator, context) {
    iterator = iterator || Prototype.K;
    var result = true;
    this.each(function(value, index) {
      result = result && !!iterator.call(context, value, index);
      if (!result) throw $break;
    });
    return result;
  }

  function any(iterator, context) {
    iterator = iterator || Prototype.K;
    var result = false;
    this.each(function(value, index) {
      if (result = !!iterator.call(context, value, index))
        throw $break;
    });
    return result;
  }

  function collect(iterator, context) {
    iterator = iterator || Prototype.K;
    var results = [];
    this.each(function(value, index) {
      results.push(iterator.call(context, value, index));
    });
    return results;
  }

  function detect(iterator, context) {
    var result;
    this.each(function(value, index) {
      if (iterator.call(context, value, index)) {
        result = value;
        throw $break;
      }
    });
    return result;
  }

  function findAll(iterator, context) {
    var results = [];
    this.each(function(value, index) {
      if (iterator.call(context, value, index))
        results.push(value);
    });
    return results;
  }

  function grep(filter, iterator, context) {
    iterator = iterator || Prototype.K;
    var results = [];

    if (Object.isString(filter))
      filter = new RegExp(RegExp.escape(filter));

    this.each(function(value, index) {
      if (filter.match(value))
        results.push(iterator.call(context, value, index));
    });
    return results;
  }

  function include(object) {
    if (Object.isFunction(this.indexOf))
      if (this.indexOf(object) != -1) return true;

    var found = false;
    this.each(function(value) {
      if (value == object) {
        found = true;
        throw $break;
      }
    });
    return found;
  }

  function inGroupsOf(number, fillWith) {
    fillWith = Object.isUndefined(fillWith) ? null : fillWith;
    return this.eachSlice(number, function(slice) {
      while(slice.length < number) slice.push(fillWith);
      return slice;
    });
  }

  function inject(memo, iterator, context) {
    this.each(function(value, index) {
      memo = iterator.call(context, memo, value, index);
    });
    return memo;
  }

  function invoke(method) {
    var args = $A(arguments).slice(1);
    return this.map(function(value) {
      return value[method].apply(value, args);
    });
  }

  function max(iterator, context) {
    iterator = iterator || Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator.call(context, value, index);
      if (result == null || value >= result)
        result = value;
    });
    return result;
  }

  function min(iterator, context) {
    iterator = iterator || Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator.call(context, value, index);
      if (result == null || value < result)
        result = value;
    });
    return result;
  }

  function partition(iterator, context) {
    iterator = iterator || Prototype.K;
    var trues = [], falses = [];
    this.each(function(value, index) {
      (iterator.call(context, value, index) ?
        trues : falses).push(value);
    });
    return [trues, falses];
  }

  function pluck(property) {
    var results = [];
    this.each(function(value) {
      results.push(value[property]);
    });
    return results;
  }

  function reject(iterator, context) {
    var results = [];
    this.each(function(value, index) {
      if (!iterator.call(context, value, index))
        results.push(value);
    });
    return results;
  }

  function sortBy(iterator, context) {
    return this.map(function(value, index) {
      return {
        value: value,
        criteria: iterator.call(context, value, index)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }).pluck('value');
  }

  function toArray() {
    return this.map();
  }

  function zip() {
    var iterator = Prototype.K, args = $A(arguments);
    if (Object.isFunction(args.last()))
      iterator = args.pop();

    var collections = [this].concat(args).map($A);
    return this.map(function(value, index) {
      return iterator(collections.pluck(index));
    });
  }

  function size() {
    return this.toArray().length;
  }

  function inspect() {
    return '#<Enumerable:' + this.toArray().inspect() + '>';
  }









  return {
    each:       each,
    eachSlice:  eachSlice,
    all:        all,
    every:      all,
    any:        any,
    some:       any,
    collect:    collect,
    map:        collect,
    detect:     detect,
    findAll:    findAll,
    select:     findAll,
    filter:     findAll,
    grep:       grep,
    include:    include,
    member:     include,
    inGroupsOf: inGroupsOf,
    inject:     inject,
    invoke:     invoke,
    max:        max,
    min:        min,
    partition:  partition,
    pluck:      pluck,
    reject:     reject,
    sortBy:     sortBy,
    toArray:    toArray,
    entries:    toArray,
    zip:        zip,
    size:       size,
    inspect:    inspect,
    find:       detect
  };
})();

function $A(iterable) {
  if (!iterable) return [];
  if ('toArray' in Object(iterable)) return iterable.toArray();
  var length = iterable.length || 0, results = new Array(length);
  while (length--) results[length] = iterable[length];
  return results;
}


function $w(string) {
  if (!Object.isString(string)) return [];
  string = string.strip();
  return string ? string.split(/\s+/) : [];
}

Array.from = $A;


(function() {
  var arrayProto = Array.prototype,
      slice = arrayProto.slice,
      _each = arrayProto.forEach; // use native browser JS 1.6 implementation if available

  function each(iterator, context) {
    for (var i = 0, length = this.length >>> 0; i < length; i++) {
      if (i in this) iterator.call(context, this[i], i, this);
    }
  }
  if (!_each) _each = each;

  function clear() {
    this.length = 0;
    return this;
  }

  function first() {
    return this[0];
  }

  function last() {
    return this[this.length - 1];
  }

  function compact() {
    return this.select(function(value) {
      return value != null;
    });
  }

  function flatten() {
    return this.inject([], function(array, value) {
      if (Object.isArray(value))
        return array.concat(value.flatten());
      array.push(value);
      return array;
    });
  }

  function without() {
    var values = slice.call(arguments, 0);
    return this.select(function(value) {
      return !values.include(value);
    });
  }

  function reverse(inline) {
    return (inline === false ? this.toArray() : this)._reverse();
  }

  function uniq(sorted) {
    return this.inject([], function(array, value, index) {
      if (0 == index || (sorted ? array.last() != value : !array.include(value)))
        array.push(value);
      return array;
    });
  }

  function intersect(array) {
    return this.uniq().findAll(function(item) {
      return array.detect(function(value) { return item === value });
    });
  }


  function clone() {
    return slice.call(this, 0);
  }

  function size() {
    return this.length;
  }

  function inspect() {
    return '[' + this.map(Object.inspect).join(', ') + ']';
  }

  function indexOf(item, i) {
    i || (i = 0);
    var length = this.length;
    if (i < 0) i = length + i;
    for (; i < length; i++)
      if (this[i] === item) return i;
    return -1;
  }

  function lastIndexOf(item, i) {
    i = isNaN(i) ? this.length : (i < 0 ? this.length + i : i) + 1;
    var n = this.slice(0, i).reverse().indexOf(item);
    return (n < 0) ? n : i - n - 1;
  }

  function concat() {
    var array = slice.call(this, 0), item;
    for (var i = 0, length = arguments.length; i < length; i++) {
      item = arguments[i];
      if (Object.isArray(item) && !('callee' in item)) {
        for (var j = 0, arrayLength = item.length; j < arrayLength; j++)
          array.push(item[j]);
      } else {
        array.push(item);
      }
    }
    return array;
  }

  Object.extend(arrayProto, Enumerable);

  if (!arrayProto._reverse)
    arrayProto._reverse = arrayProto.reverse;

  Object.extend(arrayProto, {
    _each:     _each,
    clear:     clear,
    first:     first,
    last:      last,
    compact:   compact,
    flatten:   flatten,
    without:   without,
    reverse:   reverse,
    uniq:      uniq,
    intersect: intersect,
    clone:     clone,
    toArray:   clone,
    size:      size,
    inspect:   inspect
  });

  var CONCAT_ARGUMENTS_BUGGY = (function() {
    return [].concat(arguments)[0][0] !== 1;
  })(1,2)

  if (CONCAT_ARGUMENTS_BUGGY) arrayProto.concat = concat;

  if (!arrayProto.indexOf) arrayProto.indexOf = indexOf;
  if (!arrayProto.lastIndexOf) arrayProto.lastIndexOf = lastIndexOf;
})();
function $H(object) {
  return new Hash(object);
};

var Hash = Class.create(Enumerable, (function() {
  function initialize(object) {
    this._object = Object.isHash(object) ? object.toObject() : Object.clone(object);
  }


  function _each(iterator) {
    for (var key in this._object) {
      var value = this._object[key], pair = [key, value];
      pair.key = key;
      pair.value = value;
      iterator(pair);
    }
  }

  function set(key, value) {
    return this._object[key] = value;
  }

  function get(key) {
    if (this._object[key] !== Object.prototype[key])
      return this._object[key];
  }

  function unset(key) {
    var value = this._object[key];
    delete this._object[key];
    return value;
  }

  function toObject() {
    return Object.clone(this._object);
  }



  function keys() {
    return this.pluck('key');
  }

  function values() {
    return this.pluck('value');
  }

  function index(value) {
    var match = this.detect(function(pair) {
      return pair.value === value;
    });
    return match && match.key;
  }

  function merge(object) {
    return this.clone().update(object);
  }

  function update(object) {
    return new Hash(object).inject(this, function(result, pair) {
      result.set(pair.key, pair.value);
      return result;
    });
  }

  function toQueryPair(key, value) {
    if (Object.isUndefined(value)) return key;
    return key + '=' + encodeURIComponent(String.interpret(value));
  }

  function toQueryString() {
    return this.inject([], function(results, pair) {
      var key = encodeURIComponent(pair.key), values = pair.value;

      if (values && typeof values == 'object') {
        if (Object.isArray(values)) {
          var queryValues = [];
          for (var i = 0, len = values.length, value; i < len; i++) {
            value = values[i];
            queryValues.push(toQueryPair(key, value));
          }
          return results.concat(queryValues);
        }
      } else results.push(toQueryPair(key, values));
      return results;
    }).join('&');
  }

  function inspect() {
    return '#<Hash:{' + this.map(function(pair) {
      return pair.map(Object.inspect).join(': ');
    }).join(', ') + '}>';
  }

  function clone() {
    return new Hash(this);
  }

  return {
    initialize:             initialize,
    _each:                  _each,
    set:                    set,
    get:                    get,
    unset:                  unset,
    toObject:               toObject,
    toTemplateReplacements: toObject,
    keys:                   keys,
    values:                 values,
    index:                  index,
    merge:                  merge,
    update:                 update,
    toQueryString:          toQueryString,
    inspect:                inspect,
    toJSON:                 toObject,
    clone:                  clone
  };
})());

Hash.from = $H;
Object.extend(Number.prototype, (function() {
  function toColorPart() {
    return this.toPaddedString(2, 16);
  }

  function succ() {
    return this + 1;
  }

  function times(iterator, context) {
    $R(0, this, true).each(iterator, context);
    return this;
  }

  function toPaddedString(length, radix) {
    var string = this.toString(radix || 10);
    return '0'.times(length - string.length) + string;
  }

  function abs() {
    return Math.abs(this);
  }

  function round() {
    return Math.round(this);
  }

  function ceil() {
    return Math.ceil(this);
  }

  function floor() {
    return Math.floor(this);
  }

  return {
    toColorPart:    toColorPart,
    succ:           succ,
    times:          times,
    toPaddedString: toPaddedString,
    abs:            abs,
    round:          round,
    ceil:           ceil,
    floor:          floor
  };
})());

function $R(start, end, exclusive) {
  return new ObjectRange(start, end, exclusive);
}

var ObjectRange = Class.create(Enumerable, (function() {
  function initialize(start, end, exclusive) {
    this.start = start;
    this.end = end;
    this.exclusive = exclusive;
  }

  function _each(iterator) {
    var value = this.start;
    while (this.include(value)) {
      iterator(value);
      value = value.succ();
    }
  }

  function include(value) {
    if (value < this.start)
      return false;
    if (this.exclusive)
      return value < this.end;
    return value <= this.end;
  }

  return {
    initialize: initialize,
    _each:      _each,
    include:    include
  };
})());



var Ajax = {
  getTransport: function() {
    return Try.these(
      function() {return new XMLHttpRequest()},
      function() {return new ActiveXObject('Msxml2.XMLHTTP')},
      function() {return new ActiveXObject('Microsoft.XMLHTTP')}
    ) || false;
  },

  activeRequestCount: 0
};

Ajax.Responders = {
  responders: [],

  _each: function(iterator) {
    this.responders._each(iterator);
  },

  register: function(responder) {
    if (!this.include(responder))
      this.responders.push(responder);
  },

  unregister: function(responder) {
    this.responders = this.responders.without(responder);
  },

  dispatch: function(callback, request, transport, json) {
    this.each(function(responder) {
      if (Object.isFunction(responder[callback])) {
        try {
          responder[callback].apply(responder, [request, transport, json]);
        } catch (e) { }
      }
    });
  }
};

Object.extend(Ajax.Responders, Enumerable);

Ajax.Responders.register({
  onCreate:   function() { Ajax.activeRequestCount++ },
  onComplete: function() { Ajax.activeRequestCount-- }
});
Ajax.Base = Class.create({
  initialize: function(options) {
    this.options = {
      method:       'post',
      asynchronous: true,
      contentType:  'application/x-www-form-urlencoded',
      encoding:     'UTF-8',
      parameters:   '',
      evalJSON:     true,
      evalJS:       true
    };
    Object.extend(this.options, options || { });

    this.options.method = this.options.method.toLowerCase();

    if (Object.isHash(this.options.parameters))
      this.options.parameters = this.options.parameters.toObject();
  }
});
Ajax.Request = Class.create(Ajax.Base, {
  _complete: false,

  initialize: function($super, url, options) {
    $super(options);
    this.transport = Ajax.getTransport();
    this.request(url);
  },

  request: function(url) {
    this.url = url;
    this.method = this.options.method;
    var params = Object.isString(this.options.parameters) ?
          this.options.parameters :
          Object.toQueryString(this.options.parameters);

    if (!['get', 'post'].include(this.method)) {
      params += (params ? '&' : '') + "_method=" + this.method;
      this.method = 'post';
    }

    if (params && this.method === 'get') {
      this.url += (this.url.include('?') ? '&' : '?') + params;
    }

    this.parameters = params.toQueryParams();

    try {
      var response = new Ajax.Response(this);
      if (this.options.onCreate) this.options.onCreate(response);
      Ajax.Responders.dispatch('onCreate', this, response);

      this.transport.open(this.method.toUpperCase(), this.url,
        this.options.asynchronous);

      if (this.options.asynchronous) this.respondToReadyState.bind(this).defer(1);

      this.transport.onreadystatechange = this.onStateChange.bind(this);
      this.setRequestHeaders();

      this.body = this.method == 'post' ? (this.options.postBody || params) : null;
      this.transport.send(this.body);

      /* Force Firefox to handle ready state 4 for synchronous requests */
      if (!this.options.asynchronous && this.transport.overrideMimeType)
        this.onStateChange();

    }
    catch (e) {
      this.dispatchException(e);
    }
  },

  onStateChange: function() {
    var readyState = this.transport.readyState;
    if (readyState > 1 && !((readyState == 4) && this._complete))
      this.respondToReadyState(this.transport.readyState);
  },

  setRequestHeaders: function() {
    var headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Prototype-Version': Prototype.Version,
      'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
    };

    if (this.method == 'post') {
      headers['Content-type'] = this.options.contentType +
        (this.options.encoding ? '; charset=' + this.options.encoding : '');

      /* Force "Connection: close" for older Mozilla browsers to work
       * around a bug where XMLHttpRequest sends an incorrect
       * Content-length header. See Mozilla Bugzilla #246651.
       */
      if (this.transport.overrideMimeType &&
          (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0,2005])[1] < 2005)
            headers['Connection'] = 'close';
    }

    if (typeof this.options.requestHeaders == 'object') {
      var extras = this.options.requestHeaders;

      if (Object.isFunction(extras.push))
        for (var i = 0, length = extras.length; i < length; i += 2)
          headers[extras[i]] = extras[i+1];
      else
        $H(extras).each(function(pair) { headers[pair.key] = pair.value });
    }

    for (var name in headers)
      this.transport.setRequestHeader(name, headers[name]);
  },

  success: function() {
    var status = this.getStatus();
    return !status || (status >= 200 && status < 300) || status == 304;
  },

  getStatus: function() {
    try {
      if (this.transport.status === 1223) return 204;
      return this.transport.status || 0;
    } catch (e) { return 0 }
  },

  respondToReadyState: function(readyState) {
    var state = Ajax.Request.Events[readyState], response = new Ajax.Response(this);

    if (state == 'Complete') {
      try {
        this._complete = true;
        (this.options['on' + response.status]
         || this.options['on' + (this.success() ? 'Success' : 'Failure')]
         || Prototype.emptyFunction)(response, response.headerJSON);
      } catch (e) {
        this.dispatchException(e);
      }

      var contentType = response.getHeader('Content-type');
      if (this.options.evalJS == 'force'
          || (this.options.evalJS && this.isSameOrigin() && contentType
          && contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i)))
        this.evalResponse();
    }

    try {
      (this.options['on' + state] || Prototype.emptyFunction)(response, response.headerJSON);
      Ajax.Responders.dispatch('on' + state, this, response, response.headerJSON);
    } catch (e) {
      this.dispatchException(e);
    }

    if (state == 'Complete') {
      this.transport.onreadystatechange = Prototype.emptyFunction;
    }
  },

  isSameOrigin: function() {
    var m = this.url.match(/^\s*https?:\/\/[^\/]*/);
    return !m || (m[0] == '#{protocol}//#{domain}#{port}'.interpolate({
      protocol: location.protocol,
      domain: document.domain,
      port: location.port ? ':' + location.port : ''
    }));
  },

  getHeader: function(name) {
    try {
      return this.transport.getResponseHeader(name) || null;
    } catch (e) { return null; }
  },

  evalResponse: function() {
    try {
      return eval((this.transport.responseText || '').unfilterJSON());
    } catch (e) {
      this.dispatchException(e);
    }
  },

  dispatchException: function(exception) {
    (this.options.onException || Prototype.emptyFunction)(this, exception);
    Ajax.Responders.dispatch('onException', this, exception);
  }
});

Ajax.Request.Events =
  ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];








Ajax.Response = Class.create({
  initialize: function(request){
    this.request = request;
    var transport  = this.transport  = request.transport,
        readyState = this.readyState = transport.readyState;

    if ((readyState > 2 && !Prototype.Browser.IE) || readyState == 4) {
      this.status       = this.getStatus();
      this.statusText   = this.getStatusText();
      this.responseText = String.interpret(transport.responseText);
      this.headerJSON   = this._getHeaderJSON();
    }

    if (readyState == 4) {
      var xml = transport.responseXML;
      this.responseXML  = Object.isUndefined(xml) ? null : xml;
      this.responseJSON = this._getResponseJSON();
    }
  },

  status:      0,

  statusText: '',

  getStatus: Ajax.Request.prototype.getStatus,

  getStatusText: function() {
    try {
      return this.transport.statusText || '';
    } catch (e) { return '' }
  },

  getHeader: Ajax.Request.prototype.getHeader,

  getAllHeaders: function() {
    try {
      return this.getAllResponseHeaders();
    } catch (e) { return null }
  },

  getResponseHeader: function(name) {
    return this.transport.getResponseHeader(name);
  },

  getAllResponseHeaders: function() {
    return this.transport.getAllResponseHeaders();
  },

  _getHeaderJSON: function() {
    var json = this.getHeader('X-JSON');
    if (!json) return null;
    json = decodeURIComponent(escape(json));
    try {
      return json.evalJSON(this.request.options.sanitizeJSON ||
        !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  },

  _getResponseJSON: function() {
    var options = this.request.options;
    if (!options.evalJSON || (options.evalJSON != 'force' &&
      !(this.getHeader('Content-type') || '').include('application/json')) ||
        this.responseText.blank())
          return null;
    try {
      return this.responseText.evalJSON(options.sanitizeJSON ||
        !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  }
});

Ajax.Updater = Class.create(Ajax.Request, {
  initialize: function($super, container, url, options) {
    this.container = {
      success: (container.success || container),
      failure: (container.failure || (container.success ? null : container))
    };

    options = Object.clone(options);
    var onComplete = options.onComplete;
    options.onComplete = (function(response, json) {
      this.updateContent(response.responseText);
      if (Object.isFunction(onComplete)) onComplete(response, json);
    }).bind(this);

    $super(url, options);
  },

  updateContent: function(responseText) {
    var receiver = this.container[this.success() ? 'success' : 'failure'],
        options = this.options;

    if (!options.evalScripts) responseText = responseText.stripScripts();

    if (receiver = $(receiver)) {
      if (options.insertion) {
        if (Object.isString(options.insertion)) {
          var insertion = { }; insertion[options.insertion] = responseText;
          receiver.insert(insertion);
        }
        else options.insertion(receiver, responseText);
      }
      else receiver.update(responseText);
    }
  }
});

Ajax.PeriodicalUpdater = Class.create(Ajax.Base, {
  initialize: function($super, container, url, options) {
    $super(options);
    this.onComplete = this.options.onComplete;

    this.frequency = (this.options.frequency || 2);
    this.decay = (this.options.decay || 1);

    this.updater = { };
    this.container = container;
    this.url = url;

    this.start();
  },

  start: function() {
    this.options.onComplete = this.updateComplete.bind(this);
    this.onTimerEvent();
  },

  stop: function() {
    this.updater.options.onComplete = undefined;
    clearTimeout(this.timer);
    (this.onComplete || Prototype.emptyFunction).apply(this, arguments);
  },

  updateComplete: function(response) {
    if (this.options.decay) {
      this.decay = (response.responseText == this.lastText ?
        this.decay * this.options.decay : 1);

      this.lastText = response.responseText;
    }
    this.timer = this.onTimerEvent.bind(this).delay(this.decay * this.frequency);
  },

  onTimerEvent: function() {
    this.updater = new Ajax.Updater(this.container, this.url, this.options);
  }
});


function $(element) {
  if (arguments.length > 1) {
    for (var i = 0, elements = [], length = arguments.length; i < length; i++)
      elements.push($(arguments[i]));
    return elements;
  }
  if (Object.isString(element))
    element = document.getElementById(element);
  return Element.extend(element);
}

if (Prototype.BrowserFeatures.XPath) {
  document._getElementsByXPath = function(expression, parentElement) {
    var results = [];
    var query = document.evaluate(expression, $(parentElement) || document,
      null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0, length = query.snapshotLength; i < length; i++)
      results.push(Element.extend(query.snapshotItem(i)));
    return results;
  };
}

/*--------------------------------------------------------------------------*/

if (!Node) var Node = { };

if (!Node.ELEMENT_NODE) {
  Object.extend(Node, {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    ENTITY_REFERENCE_NODE: 5,
    ENTITY_NODE: 6,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
    NOTATION_NODE: 12
  });
}



(function(global) {
  function shouldUseCache(tagName, attributes) {
    if (tagName === 'select') return false;
    if ('type' in attributes) return false;
    return true;
  }

  var HAS_EXTENDED_CREATE_ELEMENT_SYNTAX = (function(){
    try {
      var el = document.createElement('<input name="x">');
      return el.tagName.toLowerCase() === 'input' && el.name === 'x';
    }
    catch(err) {
      return false;
    }
  })();

  var element = global.Element;

  global.Element = function(tagName, attributes) {
    attributes = attributes || { };
    tagName = tagName.toLowerCase();
    var cache = Element.cache;

    if (HAS_EXTENDED_CREATE_ELEMENT_SYNTAX && attributes.name) {
      tagName = '<' + tagName + ' name="' + attributes.name + '">';
      delete attributes.name;
      return Element.writeAttribute(document.createElement(tagName), attributes);
    }

    if (!cache[tagName]) cache[tagName] = Element.extend(document.createElement(tagName));

    var node = shouldUseCache(tagName, attributes) ?
     cache[tagName].cloneNode(false) : document.createElement(tagName);

    return Element.writeAttribute(node, attributes);
  };

  Object.extend(global.Element, element || { });
  if (element) global.Element.prototype = element.prototype;

})(this);

Element.idCounter = 1;
Element.cache = { };

Element._purgeElement = function(element) {
  var uid = element._prototypeUID;
  if (uid) {
    Element.stopObserving(element);
    element._prototypeUID = void 0;
    delete Element.Storage[uid];
  }
}

Element.Methods = {
  visible: function(element) {
    return $(element).style.display != 'none';
  },

  toggle: function(element) {
    element = $(element);
    Element[Element.visible(element) ? 'hide' : 'show'](element);
    return element;
  },

  hide: function(element) {
    element = $(element);
    element.style.display = 'none';
    return element;
  },

  show: function(element) {
    element = $(element);
    element.style.display = '';
    return element;
  },

  remove: function(element) {
    element = $(element);
    element.parentNode.removeChild(element);
    return element;
  },

  update: (function(){

    var SELECT_ELEMENT_INNERHTML_BUGGY = (function(){
      var el = document.createElement("select"),
          isBuggy = true;
      el.innerHTML = "<option value=\"test\">test</option>";
      if (el.options && el.options[0]) {
        isBuggy = el.options[0].nodeName.toUpperCase() !== "OPTION";
      }
      el = null;
      return isBuggy;
    })();

    var TABLE_ELEMENT_INNERHTML_BUGGY = (function(){
      try {
        var el = document.createElement("table");
        if (el && el.tBodies) {
          el.innerHTML = "<tbody><tr><td>test</td></tr></tbody>";
          var isBuggy = typeof el.tBodies[0] == "undefined";
          el = null;
          return isBuggy;
        }
      } catch (e) {
        return true;
      }
    })();

    var LINK_ELEMENT_INNERHTML_BUGGY = (function() {
      try {
        var el = document.createElement('div');
        el.innerHTML = "<link>";
        var isBuggy = (el.childNodes.length === 0);
        el = null;
        return isBuggy;
      } catch(e) {
        return true;
      }
    })();

    var ANY_INNERHTML_BUGGY = SELECT_ELEMENT_INNERHTML_BUGGY ||
     TABLE_ELEMENT_INNERHTML_BUGGY || LINK_ELEMENT_INNERHTML_BUGGY;

    var SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING = (function () {
      var s = document.createElement("script"),
          isBuggy = false;
      try {
        s.appendChild(document.createTextNode(""));
        isBuggy = !s.firstChild ||
          s.firstChild && s.firstChild.nodeType !== 3;
      } catch (e) {
        isBuggy = true;
      }
      s = null;
      return isBuggy;
    })();


    function update(element, content) {
      element = $(element);
      var purgeElement = Element._purgeElement;

      var descendants = element.getElementsByTagName('*'),
       i = descendants.length;
      while (i--) purgeElement(descendants[i]);

      if (content && content.toElement)
        content = content.toElement();

      if (Object.isElement(content))
        return element.update().insert(content);

      content = Object.toHTML(content);

      var tagName = element.tagName.toUpperCase();

      if (tagName === 'SCRIPT' && SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING) {
        element.text = content;
        return element;
      }

      if (ANY_INNERHTML_BUGGY) {
        if (tagName in Element._insertionTranslations.tags) {
          while (element.firstChild) {
            element.removeChild(element.firstChild);
          }
          Element._getContentFromAnonymousElement(tagName, content.stripScripts())
            .each(function(node) {
              element.appendChild(node)
            });
        } else if (LINK_ELEMENT_INNERHTML_BUGGY && Object.isString(content) && content.indexOf('<link') > -1) {
          while (element.firstChild) {
            element.removeChild(element.firstChild);
          }
          var nodes = Element._getContentFromAnonymousElement(tagName, content.stripScripts(), true);
          nodes.each(function(node) { element.appendChild(node) });
        }
        else {
          element.innerHTML = content.stripScripts();
        }
      }
      else {
        element.innerHTML = content.stripScripts();
      }

      content.evalScripts.bind(content).defer();
      return element;
    }

    return update;
  })(),

  replace: function(element, content) {
    element = $(element);
    if (content && content.toElement) content = content.toElement();
    else if (!Object.isElement(content)) {
      content = Object.toHTML(content);
      var range = element.ownerDocument.createRange();
      range.selectNode(element);
      content.evalScripts.bind(content).defer();
      content = range.createContextualFragment(content.stripScripts());
    }
    element.parentNode.replaceChild(content, element);
    return element;
  },

  insert: function(element, insertions) {
    element = $(element);

    if (Object.isString(insertions) || Object.isNumber(insertions) ||
        Object.isElement(insertions) || (insertions && (insertions.toElement || insertions.toHTML)))
          insertions = {bottom:insertions};

    var content, insert, tagName, childNodes;

    for (var position in insertions) {
      content  = insertions[position];
      position = position.toLowerCase();
      insert = Element._insertionTranslations[position];

      if (content && content.toElement) content = content.toElement();
      if (Object.isElement(content)) {
        insert(element, content);
        continue;
      }

      content = Object.toHTML(content);

      tagName = ((position == 'before' || position == 'after')
        ? element.parentNode : element).tagName.toUpperCase();

      childNodes = Element._getContentFromAnonymousElement(tagName, content.stripScripts());

      if (position == 'top' || position == 'after') childNodes.reverse();
      childNodes.each(insert.curry(element));

      content.evalScripts.bind(content).defer();
    }

    return element;
  },

  wrap: function(element, wrapper, attributes) {
    element = $(element);
    if (Object.isElement(wrapper))
      $(wrapper).writeAttribute(attributes || { });
    else if (Object.isString(wrapper)) wrapper = new Element(wrapper, attributes);
    else wrapper = new Element('div', wrapper);
    if (element.parentNode)
      element.parentNode.replaceChild(wrapper, element);
    wrapper.appendChild(element);
    return wrapper;
  },

  inspect: function(element) {
    element = $(element);
    var result = '<' + element.tagName.toLowerCase();
    $H({'id': 'id', 'className': 'class'}).each(function(pair) {
      var property = pair.first(),
          attribute = pair.last(),
          value = (element[property] || '').toString();
      if (value) result += ' ' + attribute + '=' + value.inspect(true);
    });
    return result + '>';
  },

  recursivelyCollect: function(element, property, maximumLength) {
    element = $(element);
    maximumLength = maximumLength || -1;
    var elements = [];

    while (element = element[property]) {
      if (element.nodeType == 1)
        elements.push(Element.extend(element));
      if (elements.length == maximumLength)
        break;
    }

    return elements;
  },

  ancestors: function(element) {
    return Element.recursivelyCollect(element, 'parentNode');
  },

  descendants: function(element) {
    return Element.select(element, "*");
  },

  firstDescendant: function(element) {
    element = $(element).firstChild;
    while (element && element.nodeType != 1) element = element.nextSibling;
    return $(element);
  },

  immediateDescendants: function(element) {
    var results = [], child = $(element).firstChild;
    while (child) {
      if (child.nodeType === 1) {
        results.push(Element.extend(child));
      }
      child = child.nextSibling;
    }
    return results;
  },

  previousSiblings: function(element, maximumLength) {
    return Element.recursivelyCollect(element, 'previousSibling');
  },

  nextSiblings: function(element) {
    return Element.recursivelyCollect(element, 'nextSibling');
  },

  siblings: function(element) {
    element = $(element);
    return Element.previousSiblings(element).reverse()
      .concat(Element.nextSiblings(element));
  },

  match: function(element, selector) {
    element = $(element);
    if (Object.isString(selector))
      return Prototype.Selector.match(element, selector);
    return selector.match(element);
  },

  up: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return $(element.parentNode);
    var ancestors = Element.ancestors(element);
    return Object.isNumber(expression) ? ancestors[expression] :
      Prototype.Selector.find(ancestors, expression, index);
  },

  down: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return Element.firstDescendant(element);
    return Object.isNumber(expression) ? Element.descendants(element)[expression] :
      Element.select(element, expression)[index || 0];
  },

  previous: function(element, expression, index) {
    element = $(element);
    if (Object.isNumber(expression)) index = expression, expression = false;
    if (!Object.isNumber(index)) index = 0;

    if (expression) {
      return Prototype.Selector.find(element.previousSiblings(), expression, index);
    } else {
      return element.recursivelyCollect("previousSibling", index + 1)[index];
    }
  },

  next: function(element, expression, index) {
    element = $(element);
    if (Object.isNumber(expression)) index = expression, expression = false;
    if (!Object.isNumber(index)) index = 0;

    if (expression) {
      return Prototype.Selector.find(element.nextSiblings(), expression, index);
    } else {
      var maximumLength = Object.isNumber(index) ? index + 1 : 1;
      return element.recursivelyCollect("nextSibling", index + 1)[index];
    }
  },


  select: function(element) {
    element = $(element);
    var expressions = Array.prototype.slice.call(arguments, 1).join(', ');
    return Prototype.Selector.select(expressions, element);
  },

  adjacent: function(element) {
    element = $(element);
    var expressions = Array.prototype.slice.call(arguments, 1).join(', ');
    return Prototype.Selector.select(expressions, element.parentNode).without(element);
  },

  identify: function(element) {
    element = $(element);
    var id = Element.readAttribute(element, 'id');
    if (id) return id;
    do { id = 'anonymous_element_' + Element.idCounter++ } while ($(id));
    Element.writeAttribute(element, 'id', id);
    return id;
  },

  readAttribute: function(element, name) {
    element = $(element);
    if (Prototype.Browser.IE) {
      var t = Element._attributeTranslations.read;
      if (t.values[name]) return t.values[name](element, name);
      if (t.names[name]) name = t.names[name];
      if (name.include(':')) {
        return (!element.attributes || !element.attributes[name]) ? null :
         element.attributes[name].value;
      }
    }
    return element.getAttribute(name);
  },

  writeAttribute: function(element, name, value) {
    element = $(element);
    var attributes = { }, t = Element._attributeTranslations.write;

    if (typeof name == 'object') attributes = name;
    else attributes[name] = Object.isUndefined(value) ? true : value;

    for (var attr in attributes) {
      name = t.names[attr] || attr;
      value = attributes[attr];
      if (t.values[attr]) name = t.values[attr](element, value);
      if (value === false || value === null)
        element.removeAttribute(name);
      else if (value === true)
        element.setAttribute(name, name);
      else element.setAttribute(name, value);
    }
    return element;
  },

  getHeight: function(element) {
    return Element.getDimensions(element).height;
  },

  getWidth: function(element) {
    return Element.getDimensions(element).width;
  },

  classNames: function(element) {
    return new Element.ClassNames(element);
  },

  hasClassName: function(element, className) {
    if (!(element = $(element))) return;
    var elementClassName = element.className;
    return (elementClassName.length > 0 && (elementClassName == className ||
      new RegExp("(^|\\s)" + className + "(\\s|$)").test(elementClassName)));
  },

  addClassName: function(element, className) {
    if (!(element = $(element))) return;
    if (!Element.hasClassName(element, className))
      element.className += (element.className ? ' ' : '') + className;
    return element;
  },

  removeClassName: function(element, className) {
    if (!(element = $(element))) return;
    element.className = element.className.replace(
      new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' ').strip();
    return element;
  },

  toggleClassName: function(element, className) {
    if (!(element = $(element))) return;
    return Element[Element.hasClassName(element, className) ?
      'removeClassName' : 'addClassName'](element, className);
  },

  cleanWhitespace: function(element) {
    element = $(element);
    var node = element.firstChild;
    while (node) {
      var nextNode = node.nextSibling;
      if (node.nodeType == 3 && !/\S/.test(node.nodeValue))
        element.removeChild(node);
      node = nextNode;
    }
    return element;
  },

  empty: function(element) {
    return $(element).innerHTML.blank();
  },

  descendantOf: function(element, ancestor) {
    element = $(element), ancestor = $(ancestor);

    if (element.compareDocumentPosition)
      return (element.compareDocumentPosition(ancestor) & 8) === 8;

    if (ancestor.contains)
      return ancestor.contains(element) && ancestor !== element;

    while (element = element.parentNode)
      if (element == ancestor) return true;

    return false;
  },

  scrollTo: function(element) {
    element = $(element);
    var pos = Element.cumulativeOffset(element);
    window.scrollTo(pos[0], pos[1]);
    return element;
  },

  getStyle: function(element, style) {
    element = $(element);
    style = style == 'float' ? 'cssFloat' : style.camelize();
    var value = element.style[style];
    if (!value || value == 'auto') {
      var css = document.defaultView.getComputedStyle(element, null);
      value = css ? css[style] : null;
    }
    if (style == 'opacity') return value ? parseFloat(value) : 1.0;
    return value == 'auto' ? null : value;
  },

  getOpacity: function(element) {
    return $(element).getStyle('opacity');
  },

  setStyle: function(element, styles) {
    element = $(element);
    var elementStyle = element.style, match;
    if (Object.isString(styles)) {
      element.style.cssText += ';' + styles;
      return styles.include('opacity') ?
        element.setOpacity(styles.match(/opacity:\s*(\d?\.?\d*)/)[1]) : element;
    }
    for (var property in styles)
      if (property == 'opacity') element.setOpacity(styles[property]);
      else
        elementStyle[(property == 'float' || property == 'cssFloat') ?
          (Object.isUndefined(elementStyle.styleFloat) ? 'cssFloat' : 'styleFloat') :
            property] = styles[property];

    return element;
  },

  setOpacity: function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1 || value === '') ? '' :
      (value < 0.00001) ? 0 : value;
    return element;
  },

  makePositioned: function(element) {
    element = $(element);
    var pos = Element.getStyle(element, 'position');
    if (pos == 'static' || !pos) {
      element._madePositioned = true;
      element.style.position = 'relative';
      if (Prototype.Browser.Opera) {
        element.style.top = 0;
        element.style.left = 0;
      }
    }
    return element;
  },

  undoPositioned: function(element) {
    element = $(element);
    if (element._madePositioned) {
      element._madePositioned = undefined;
      element.style.position =
        element.style.top =
        element.style.left =
        element.style.bottom =
        element.style.right = '';
    }
    return element;
  },

  makeClipping: function(element) {
    element = $(element);
    if (element._overflow) return element;
    element._overflow = Element.getStyle(element, 'overflow') || 'auto';
    if (element._overflow !== 'hidden')
      element.style.overflow = 'hidden';
    return element;
  },

  undoClipping: function(element) {
    element = $(element);
    if (!element._overflow) return element;
    element.style.overflow = element._overflow == 'auto' ? '' : element._overflow;
    element._overflow = null;
    return element;
  },

  clonePosition: function(element, source) {
    var options = Object.extend({
      setLeft:    true,
      setTop:     true,
      setWidth:   true,
      setHeight:  true,
      offsetTop:  0,
      offsetLeft: 0
    }, arguments[2] || { });

    source = $(source);
    var p = Element.viewportOffset(source), delta = [0, 0], parent = null;

    element = $(element);

    if (Element.getStyle(element, 'position') == 'absolute') {
      parent = Element.getOffsetParent(element);
      delta = Element.viewportOffset(parent);
    }

    if (parent == document.body) {
      delta[0] -= document.body.offsetLeft;
      delta[1] -= document.body.offsetTop;
    }

    if (options.setLeft)   element.style.left  = (p[0] - delta[0] + options.offsetLeft) + 'px';
    if (options.setTop)    element.style.top   = (p[1] - delta[1] + options.offsetTop) + 'px';
    if (options.setWidth)  element.style.width = source.offsetWidth + 'px';
    if (options.setHeight) element.style.height = source.offsetHeight + 'px';
    return element;
  }
};

Object.extend(Element.Methods, {
  getElementsBySelector: Element.Methods.select,

  childElements: Element.Methods.immediateDescendants
});

Element._attributeTranslations = {
  write: {
    names: {
      className: 'class',
      htmlFor:   'for'
    },
    values: { }
  }
};

if (Prototype.Browser.Opera) {
  Element.Methods.getStyle = Element.Methods.getStyle.wrap(
    function(proceed, element, style) {
      switch (style) {
        case 'height': case 'width':
          if (!Element.visible(element)) return null;

          var dim = parseInt(proceed(element, style), 10);

          if (dim !== element['offset' + style.capitalize()])
            return dim + 'px';

          var properties;
          if (style === 'height') {
            properties = ['border-top-width', 'padding-top',
             'padding-bottom', 'border-bottom-width'];
          }
          else {
            properties = ['border-left-width', 'padding-left',
             'padding-right', 'border-right-width'];
          }
          return properties.inject(dim, function(memo, property) {
            var val = proceed(element, property);
            return val === null ? memo : memo - parseInt(val, 10);
          }) + 'px';
        default: return proceed(element, style);
      }
    }
  );

  Element.Methods.readAttribute = Element.Methods.readAttribute.wrap(
    function(proceed, element, attribute) {
      if (attribute === 'title') return element.title;
      return proceed(element, attribute);
    }
  );
}

else if (Prototype.Browser.IE) {
  Element.Methods.getStyle = function(element, style) {
    element = $(element);
    style = (style == 'float' || style == 'cssFloat') ? 'styleFloat' : style.camelize();
    var value = element.style[style];
    if (!value && element.currentStyle) value = element.currentStyle[style];

    if (style == 'opacity') {
      if (value = (element.getStyle('filter') || '').match(/alpha\(opacity=(.*)\)/))
        if (value[1]) return parseFloat(value[1]) / 100;
      return 1.0;
    }

    if (value == 'auto') {
      if ((style == 'width' || style == 'height') && (element.getStyle('display') != 'none'))
        return element['offset' + style.capitalize()] + 'px';
      return null;
    }
    return value;
  };

  Element.Methods.setOpacity = function(element, value) {
    function stripAlpha(filter){
      return filter.replace(/alpha\([^\)]*\)/gi,'');
    }
    element = $(element);
    var currentStyle = element.currentStyle;
    if ((currentStyle && !currentStyle.hasLayout) ||
      (!currentStyle && element.style.zoom == 'normal'))
        element.style.zoom = 1;

    var filter = element.getStyle('filter'), style = element.style;
    if (value == 1 || value === '') {
      (filter = stripAlpha(filter)) ?
        style.filter = filter : style.removeAttribute('filter');
      return element;
    } else if (value < 0.00001) value = 0;
    style.filter = stripAlpha(filter) +
      'alpha(opacity=' + (value * 100) + ')';
    return element;
  };

  Element._attributeTranslations = (function(){

    var classProp = 'className',
        forProp = 'for',
        el = document.createElement('div');

    el.setAttribute(classProp, 'x');

    if (el.className !== 'x') {
      el.setAttribute('class', 'x');
      if (el.className === 'x') {
        classProp = 'class';
      }
    }
    el = null;

    el = document.createElement('label');
    el.setAttribute(forProp, 'x');
    if (el.htmlFor !== 'x') {
      el.setAttribute('htmlFor', 'x');
      if (el.htmlFor === 'x') {
        forProp = 'htmlFor';
      }
    }
    el = null;

    return {
      read: {
        names: {
          'class':      classProp,
          'className':  classProp,
          'for':        forProp,
          'htmlFor':    forProp
        },
        values: {
          _getAttr: function(element, attribute) {
            return element.getAttribute(attribute);
          },
          _getAttr2: function(element, attribute) {
            return element.getAttribute(attribute, 2);
          },
          _getAttrNode: function(element, attribute) {
            var node = element.getAttributeNode(attribute);
            return node ? node.value : "";
          },
          _getEv: (function(){

            var el = document.createElement('div'), f;
            el.onclick = Prototype.emptyFunction;
            var value = el.getAttribute('onclick');

            if (String(value).indexOf('{') > -1) {
              f = function(element, attribute) {
                attribute = element.getAttribute(attribute);
                if (!attribute) return null;
                attribute = attribute.toString();
                attribute = attribute.split('{')[1];
                attribute = attribute.split('}')[0];
                return attribute.strip();
              };
            }
            else if (value === '') {
              f = function(element, attribute) {
                attribute = element.getAttribute(attribute);
                if (!attribute) return null;
                return attribute.strip();
              };
            }
            el = null;
            return f;
          })(),
          _flag: function(element, attribute) {
            return $(element).hasAttribute(attribute) ? attribute : null;
          },
          style: function(element) {
            return element.style.cssText.toLowerCase();
          },
          title: function(element) {
            return element.title;
          }
        }
      }
    }
  })();

  Element._attributeTranslations.write = {
    names: Object.extend({
      cellpadding: 'cellPadding',
      cellspacing: 'cellSpacing'
    }, Element._attributeTranslations.read.names),
    values: {
      checked: function(element, value) {
        element.checked = !!value;
      },

      style: function(element, value) {
        element.style.cssText = value ? value : '';
      }
    }
  };

  Element._attributeTranslations.has = {};

  $w('colSpan rowSpan vAlign dateTime accessKey tabIndex ' +
      'encType maxLength readOnly longDesc frameBorder').each(function(attr) {
    Element._attributeTranslations.write.names[attr.toLowerCase()] = attr;
    Element._attributeTranslations.has[attr.toLowerCase()] = attr;
  });

  (function(v) {
    Object.extend(v, {
      href:        v._getAttr2,
      src:         v._getAttr2,
      type:        v._getAttr,
      action:      v._getAttrNode,
      disabled:    v._flag,
      checked:     v._flag,
      readonly:    v._flag,
      multiple:    v._flag,
      onload:      v._getEv,
      onunload:    v._getEv,
      onclick:     v._getEv,
      ondblclick:  v._getEv,
      onmousedown: v._getEv,
      onmouseup:   v._getEv,
      onmouseover: v._getEv,
      onmousemove: v._getEv,
      onmouseout:  v._getEv,
      onfocus:     v._getEv,
      onblur:      v._getEv,
      onkeypress:  v._getEv,
      onkeydown:   v._getEv,
      onkeyup:     v._getEv,
      onsubmit:    v._getEv,
      onreset:     v._getEv,
      onselect:    v._getEv,
      onchange:    v._getEv
    });
  })(Element._attributeTranslations.read.values);

  if (Prototype.BrowserFeatures.ElementExtensions) {
    (function() {
      function _descendants(element) {
        var nodes = element.getElementsByTagName('*'), results = [];
        for (var i = 0, node; node = nodes[i]; i++)
          if (node.tagName !== "!") // Filter out comment nodes.
            results.push(node);
        return results;
      }

      Element.Methods.down = function(element, expression, index) {
        element = $(element);
        if (arguments.length == 1) return element.firstDescendant();
        return Object.isNumber(expression) ? _descendants(element)[expression] :
          Element.select(element, expression)[index || 0];
      }
    })();
  }

}

else if (Prototype.Browser.Gecko && /rv:1\.8\.0/.test(navigator.userAgent)) {
  Element.Methods.setOpacity = function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1) ? 0.999999 :
      (value === '') ? '' : (value < 0.00001) ? 0 : value;
    return element;
  };
}

else if (Prototype.Browser.WebKit) {
  Element.Methods.setOpacity = function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1 || value === '') ? '' :
      (value < 0.00001) ? 0 : value;

    if (value == 1)
      if (element.tagName.toUpperCase() == 'IMG' && element.width) {
        element.width++; element.width--;
      } else try {
        var n = document.createTextNode(' ');
        element.appendChild(n);
        element.removeChild(n);
      } catch (e) { }

    return element;
  };
}

if ('outerHTML' in document.documentElement) {
  Element.Methods.replace = function(element, content) {
    element = $(element);

    if (content && content.toElement) content = content.toElement();
    if (Object.isElement(content)) {
      element.parentNode.replaceChild(content, element);
      return element;
    }

    content = Object.toHTML(content);
    var parent = element.parentNode, tagName = parent.tagName.toUpperCase();

    if (Element._insertionTranslations.tags[tagName]) {
      var nextSibling = element.next(),
          fragments = Element._getContentFromAnonymousElement(tagName, content.stripScripts());
      parent.removeChild(element);
      if (nextSibling)
        fragments.each(function(node) { parent.insertBefore(node, nextSibling) });
      else
        fragments.each(function(node) { parent.appendChild(node) });
    }
    else element.outerHTML = content.stripScripts();

    content.evalScripts.bind(content).defer();
    return element;
  };
}

Element._returnOffset = function(l, t) {
  var result = [l, t];
  result.left = l;
  result.top = t;
  return result;
};

Element._getContentFromAnonymousElement = function(tagName, html, force) {
  var div = new Element('div'),
      t = Element._insertionTranslations.tags[tagName];

  var workaround = false;
  if (t) workaround = true;
  else if (force) {
    workaround = true;
    t = ['', '', 0];
  }

  if (workaround) {
    div.innerHTML = '&nbsp;' + t[0] + html + t[1];
    div.removeChild(div.firstChild);
    for (var i = t[2]; i--; ) {
      div = div.firstChild;
    }
  }
  else {
    div.innerHTML = html;
  }
  return $A(div.childNodes);
};

Element._insertionTranslations = {
  before: function(element, node) {
    element.parentNode.insertBefore(node, element);
  },
  top: function(element, node) {
    element.insertBefore(node, element.firstChild);
  },
  bottom: function(element, node) {
    element.appendChild(node);
  },
  after: function(element, node) {
    element.parentNode.insertBefore(node, element.nextSibling);
  },
  tags: {
    TABLE:  ['<table>',                '</table>',                   1],
    TBODY:  ['<table><tbody>',         '</tbody></table>',           2],
    TR:     ['<table><tbody><tr>',     '</tr></tbody></table>',      3],
    TD:     ['<table><tbody><tr><td>', '</td></tr></tbody></table>', 4],
    SELECT: ['<select>',               '</select>',                  1]
  }
};

(function() {
  var tags = Element._insertionTranslations.tags;
  Object.extend(tags, {
    THEAD: tags.TBODY,
    TFOOT: tags.TBODY,
    TH:    tags.TD
  });
})();

Element.Methods.Simulated = {
  hasAttribute: function(element, attribute) {
    attribute = Element._attributeTranslations.has[attribute] || attribute;
    var node = $(element).getAttributeNode(attribute);
    return !!(node && node.specified);
  }
};

Element.Methods.ByTag = { };

Object.extend(Element, Element.Methods);

(function(div) {

  if (!Prototype.BrowserFeatures.ElementExtensions && div['__proto__']) {
    window.HTMLElement = { };
    window.HTMLElement.prototype = div['__proto__'];
    Prototype.BrowserFeatures.ElementExtensions = true;
  }

  div = null;

})(document.createElement('div'));

Element.extend = (function() {

  function checkDeficiency(tagName) {
    if (typeof window.Element != 'undefined') {
      var proto = window.Element.prototype;
      if (proto) {
        var id = '_' + (Math.random()+'').slice(2),
            el = document.createElement(tagName);
        proto[id] = 'x';
        var isBuggy = (el[id] !== 'x');
        delete proto[id];
        el = null;
        return isBuggy;
      }
    }
    return false;
  }

  function extendElementWith(element, methods) {
    for (var property in methods) {
      var value = methods[property];
      if (Object.isFunction(value) && !(property in element))
        element[property] = value.methodize();
    }
  }

  var HTMLOBJECTELEMENT_PROTOTYPE_BUGGY = checkDeficiency('object');

  if (Prototype.BrowserFeatures.SpecificElementExtensions) {
    if (HTMLOBJECTELEMENT_PROTOTYPE_BUGGY) {
      return function(element) {
        if (element && typeof element._extendedByPrototype == 'undefined') {
          var t = element.tagName;
          if (t && (/^(?:object|applet|embed)$/i.test(t))) {
            extendElementWith(element, Element.Methods);
            extendElementWith(element, Element.Methods.Simulated);
            extendElementWith(element, Element.Methods.ByTag[t.toUpperCase()]);
          }
        }
        return element;
      }
    }
    return Prototype.K;
  }

  var Methods = { }, ByTag = Element.Methods.ByTag;

  var extend = Object.extend(function(element) {
    if (!element || typeof element._extendedByPrototype != 'undefined' ||
        element.nodeType != 1 || element == window) return element;

    var methods = Object.clone(Methods),
        tagName = element.tagName.toUpperCase();

    if (ByTag[tagName]) Object.extend(methods, ByTag[tagName]);

    extendElementWith(element, methods);

    element._extendedByPrototype = Prototype.emptyFunction;
    return element;

  }, {
    refresh: function() {
      if (!Prototype.BrowserFeatures.ElementExtensions) {
        Object.extend(Methods, Element.Methods);
        Object.extend(Methods, Element.Methods.Simulated);
      }
    }
  });

  extend.refresh();
  return extend;
})();

if (document.documentElement.hasAttribute) {
  Element.hasAttribute = function(element, attribute) {
    return element.hasAttribute(attribute);
  };
}
else {
  Element.hasAttribute = Element.Methods.Simulated.hasAttribute;
}

Element.addMethods = function(methods) {
  var F = Prototype.BrowserFeatures, T = Element.Methods.ByTag;

  if (!methods) {
    Object.extend(Form, Form.Methods);
    Object.extend(Form.Element, Form.Element.Methods);
    Object.extend(Element.Methods.ByTag, {
      "FORM":     Object.clone(Form.Methods),
      "INPUT":    Object.clone(Form.Element.Methods),
      "SELECT":   Object.clone(Form.Element.Methods),
      "TEXTAREA": Object.clone(Form.Element.Methods),
      "BUTTON":   Object.clone(Form.Element.Methods)
    });
  }

  if (arguments.length == 2) {
    var tagName = methods;
    methods = arguments[1];
  }

  if (!tagName) Object.extend(Element.Methods, methods || { });
  else {
    if (Object.isArray(tagName)) tagName.each(extend);
    else extend(tagName);
  }

  function extend(tagName) {
    tagName = tagName.toUpperCase();
    if (!Element.Methods.ByTag[tagName])
      Element.Methods.ByTag[tagName] = { };
    Object.extend(Element.Methods.ByTag[tagName], methods);
  }

  function copy(methods, destination, onlyIfAbsent) {
    onlyIfAbsent = onlyIfAbsent || false;
    for (var property in methods) {
      var value = methods[property];
      if (!Object.isFunction(value)) continue;
      if (!onlyIfAbsent || !(property in destination))
        destination[property] = value.methodize();
    }
  }

  function findDOMClass(tagName) {
    var klass;
    var trans = {
      "OPTGROUP": "OptGroup", "TEXTAREA": "TextArea", "P": "Paragraph",
      "FIELDSET": "FieldSet", "UL": "UList", "OL": "OList", "DL": "DList",
      "DIR": "Directory", "H1": "Heading", "H2": "Heading", "H3": "Heading",
      "H4": "Heading", "H5": "Heading", "H6": "Heading", "Q": "Quote",
      "INS": "Mod", "DEL": "Mod", "A": "Anchor", "IMG": "Image", "CAPTION":
      "TableCaption", "COL": "TableCol", "COLGROUP": "TableCol", "THEAD":
      "TableSection", "TFOOT": "TableSection", "TBODY": "TableSection", "TR":
      "TableRow", "TH": "TableCell", "TD": "TableCell", "FRAMESET":
      "FrameSet", "IFRAME": "IFrame"
    };
    if (trans[tagName]) klass = 'HTML' + trans[tagName] + 'Element';
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName + 'Element';
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName.capitalize() + 'Element';
    if (window[klass]) return window[klass];

    var element = document.createElement(tagName),
        proto = element['__proto__'] || element.constructor.prototype;

    element = null;
    return proto;
  }

  var elementPrototype = window.HTMLElement ? HTMLElement.prototype :
   Element.prototype;

  if (F.ElementExtensions) {
    copy(Element.Methods, elementPrototype);
    copy(Element.Methods.Simulated, elementPrototype, true);
  }

  if (F.SpecificElementExtensions) {
    for (var tag in Element.Methods.ByTag) {
      var klass = findDOMClass(tag);
      if (Object.isUndefined(klass)) continue;
      copy(T[tag], klass.prototype);
    }
  }

  Object.extend(Element, Element.Methods);
  delete Element.ByTag;

  if (Element.extend.refresh) Element.extend.refresh();
  Element.cache = { };
};


document.viewport = {

  getDimensions: function() {
    return { width: this.getWidth(), height: this.getHeight() };
  },

  getScrollOffsets: function() {
    return Element._returnOffset(
      window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
      window.pageYOffset || document.documentElement.scrollTop  || document.body.scrollTop);
  }
};

(function(viewport) {
  var B = Prototype.Browser, doc = document, element, property = {};

  function getRootElement() {
    if (B.WebKit && !doc.evaluate)
      return document;

    if (B.Opera && window.parseFloat(window.opera.version()) < 9.5)
      return document.body;

    return document.documentElement;
  }

  function define(D) {
    if (!element) element = getRootElement();

    property[D] = 'client' + D;

    viewport['get' + D] = function() { return element[property[D]] };
    return viewport['get' + D]();
  }

  viewport.getWidth  = define.curry('Width');

  viewport.getHeight = define.curry('Height');
})(document.viewport);


Element.Storage = {
  UID: 1
};

Element.addMethods({
  getStorage: function(element) {
    if (!(element = $(element))) return;

    var uid;
    if (element === window) {
      uid = 0;
    } else {
      if (typeof element._prototypeUID === "undefined")
        element._prototypeUID = Element.Storage.UID++;
      uid = element._prototypeUID;
    }

    if (!Element.Storage[uid])
      Element.Storage[uid] = $H();

    return Element.Storage[uid];
  },

  store: function(element, key, value) {
    if (!(element = $(element))) return;

    if (arguments.length === 2) {
      Element.getStorage(element).update(key);
    } else {
      Element.getStorage(element).set(key, value);
    }

    return element;
  },

  retrieve: function(element, key, defaultValue) {
    if (!(element = $(element))) return;
    var hash = Element.getStorage(element), value = hash.get(key);

    if (Object.isUndefined(value)) {
      hash.set(key, defaultValue);
      value = defaultValue;
    }

    return value;
  },

  clone: function(element, deep) {
    if (!(element = $(element))) return;
    var clone = element.cloneNode(deep);
    clone._prototypeUID = void 0;
    if (deep) {
      var descendants = Element.select(clone, '*'),
          i = descendants.length;
      while (i--) {
        descendants[i]._prototypeUID = void 0;
      }
    }
    return Element.extend(clone);
  },

  purge: function(element) {
    if (!(element = $(element))) return;
    var purgeElement = Element._purgeElement;

    purgeElement(element);

    var descendants = element.getElementsByTagName('*'),
     i = descendants.length;

    while (i--) purgeElement(descendants[i]);

    return null;
  }
});

(function() {

  function toDecimal(pctString) {
    var match = pctString.match(/^(\d+)%?$/i);
    if (!match) return null;
    return (Number(match[1]) / 100);
  }

  function getPixelValue(value, property, context) {
    var element = null;
    if (Object.isElement(value)) {
      element = value;
      value = element.getStyle(property);
    }

    if (value === null) {
      return null;
    }

    if ((/^(?:-)?\d+(\.\d+)?(px)?$/i).test(value)) {
      return window.parseFloat(value);
    }

    var isPercentage = value.include('%'), isViewport = (context === document.viewport);

    if (/\d/.test(value) && element && element.runtimeStyle && !(isPercentage && isViewport)) {
      var style = element.style.left, rStyle = element.runtimeStyle.left;
      element.runtimeStyle.left = element.currentStyle.left;
      element.style.left = value || 0;
      value = element.style.pixelLeft;
      element.style.left = style;
      element.runtimeStyle.left = rStyle;

      return value;
    }

    if (element && isPercentage) {
      context = context || element.parentNode;
      var decimal = toDecimal(value);
      var whole = null;
      var position = element.getStyle('position');

      var isHorizontal = property.include('left') || property.include('right') ||
       property.include('width');

      var isVertical =  property.include('top') || property.include('bottom') ||
        property.include('height');

      if (context === document.viewport) {
        if (isHorizontal) {
          whole = document.viewport.getWidth();
        } else if (isVertical) {
          whole = document.viewport.getHeight();
        }
      } else {
        if (isHorizontal) {
          whole = $(context).measure('width');
        } else if (isVertical) {
          whole = $(context).measure('height');
        }
      }

      return (whole === null) ? 0 : whole * decimal;
    }

    return 0;
  }

  function toCSSPixels(number) {
    if (Object.isString(number) && number.endsWith('px')) {
      return number;
    }
    return number + 'px';
  }

  function isDisplayed(element) {
    var originalElement = element;
    while (element && element.parentNode) {
      var display = element.getStyle('display');
      if (display === 'none') {
        return false;
      }
      element = $(element.parentNode);
    }
    return true;
  }

  var hasLayout = Prototype.K;
  if ('currentStyle' in document.documentElement) {
    hasLayout = function(element) {
      if (!element.currentStyle.hasLayout) {
        element.style.zoom = 1;
      }
      return element;
    };
  }

  function cssNameFor(key) {
    if (key.include('border')) key = key + '-width';
    return key.camelize();
  }

  Element.Layout = Class.create(Hash, {
    initialize: function($super, element, preCompute) {
      $super();
      this.element = $(element);

      Element.Layout.PROPERTIES.each( function(property) {
        this._set(property, null);
      }, this);

      if (preCompute) {
        this._preComputing = true;
        this._begin();
        Element.Layout.PROPERTIES.each( this._compute, this );
        this._end();
        this._preComputing = false;
      }
    },

    _set: function(property, value) {
      return Hash.prototype.set.call(this, property, value);
    },

    set: function(property, value) {
      throw "Properties of Element.Layout are read-only.";
    },

    get: function($super, property) {
      var value = $super(property);
      return value === null ? this._compute(property) : value;
    },

    _begin: function() {
      if (this._prepared) return;

      var element = this.element;
      if (isDisplayed(element)) {
        this._prepared = true;
        return;
      }

      var originalStyles = {
        position:   element.style.position   || '',
        width:      element.style.width      || '',
        visibility: element.style.visibility || '',
        display:    element.style.display    || ''
      };

      element.store('prototype_original_styles', originalStyles);

      var position = element.getStyle('position'),
       width = element.getStyle('width');

      if (width === "0px" || width === null) {
        element.style.display = 'block';
        width = element.getStyle('width');
      }

      var context = (position === 'fixed') ? document.viewport :
       element.parentNode;

      element.setStyle({
        position:   'absolute',
        visibility: 'hidden',
        display:    'block'
      });

      var positionedWidth = element.getStyle('width');

      var newWidth;
      if (width && (positionedWidth === width)) {
        newWidth = getPixelValue(element, 'width', context);
      } else if (position === 'absolute' || position === 'fixed') {
        newWidth = getPixelValue(element, 'width', context);
      } else {
        var parent = element.parentNode, pLayout = $(parent).getLayout();

        newWidth = pLayout.get('width') -
         this.get('margin-left') -
         this.get('border-left') -
         this.get('padding-left') -
         this.get('padding-right') -
         this.get('border-right') -
         this.get('margin-right');
      }

      element.setStyle({ width: newWidth + 'px' });

      this._prepared = true;
    },

    _end: function() {
      var element = this.element;
      var originalStyles = element.retrieve('prototype_original_styles');
      element.store('prototype_original_styles', null);
      element.setStyle(originalStyles);
      this._prepared = false;
    },

    _compute: function(property) {
      var COMPUTATIONS = Element.Layout.COMPUTATIONS;
      if (!(property in COMPUTATIONS)) {
        throw "Property not found.";
      }

      return this._set(property, COMPUTATIONS[property].call(this, this.element));
    },

    toObject: function() {
      var args = $A(arguments);
      var keys = (args.length === 0) ? Element.Layout.PROPERTIES :
       args.join(' ').split(' ');
      var obj = {};
      keys.each( function(key) {
        if (!Element.Layout.PROPERTIES.include(key)) return;
        var value = this.get(key);
        if (value != null) obj[key] = value;
      }, this);
      return obj;
    },

    toHash: function() {
      var obj = this.toObject.apply(this, arguments);
      return new Hash(obj);
    },

    toCSS: function() {
      var args = $A(arguments);
      var keys = (args.length === 0) ? Element.Layout.PROPERTIES :
       args.join(' ').split(' ');
      var css = {};

      keys.each( function(key) {
        if (!Element.Layout.PROPERTIES.include(key)) return;
        if (Element.Layout.COMPOSITE_PROPERTIES.include(key)) return;

        var value = this.get(key);
        if (value != null) css[cssNameFor(key)] = value + 'px';
      }, this);
      return css;
    },

    inspect: function() {
      return "#<Element.Layout>";
    }
  });

  Object.extend(Element.Layout, {
    PROPERTIES: $w('height width top left right bottom border-left border-right border-top border-bottom padding-left padding-right padding-top padding-bottom margin-top margin-bottom margin-left margin-right padding-box-width padding-box-height border-box-width border-box-height margin-box-width margin-box-height'),

    COMPOSITE_PROPERTIES: $w('padding-box-width padding-box-height margin-box-width margin-box-height border-box-width border-box-height'),

    COMPUTATIONS: {
      'height': function(element) {
        if (!this._preComputing) this._begin();

        var bHeight = this.get('border-box-height');
        if (bHeight <= 0) {
          if (!this._preComputing) this._end();
          return 0;
        }

        var bTop = this.get('border-top'),
         bBottom = this.get('border-bottom');

        var pTop = this.get('padding-top'),
         pBottom = this.get('padding-bottom');

        if (!this._preComputing) this._end();

        return bHeight - bTop - bBottom - pTop - pBottom;
      },

      'width': function(element) {
        if (!this._preComputing) this._begin();

        var bWidth = this.get('border-box-width');
        if (bWidth <= 0) {
          if (!this._preComputing) this._end();
          return 0;
        }

        var bLeft = this.get('border-left'),
         bRight = this.get('border-right');

        var pLeft = this.get('padding-left'),
         pRight = this.get('padding-right');

        if (!this._preComputing) this._end();

        return bWidth - bLeft - bRight - pLeft - pRight;
      },

      'padding-box-height': function(element) {
        var height = this.get('height'),
         pTop = this.get('padding-top'),
         pBottom = this.get('padding-bottom');

        return height + pTop + pBottom;
      },

      'padding-box-width': function(element) {
        var width = this.get('width'),
         pLeft = this.get('padding-left'),
         pRight = this.get('padding-right');

        return width + pLeft + pRight;
      },

      'border-box-height': function(element) {
        if (!this._preComputing) this._begin();
        var height = element.offsetHeight;
        if (!this._preComputing) this._end();
        return height;
      },

      'border-box-width': function(element) {
        if (!this._preComputing) this._begin();
        var width = element.offsetWidth;
        if (!this._preComputing) this._end();
        return width;
      },

      'margin-box-height': function(element) {
        var bHeight = this.get('border-box-height'),
         mTop = this.get('margin-top'),
         mBottom = this.get('margin-bottom');

        if (bHeight <= 0) return 0;

        return bHeight + mTop + mBottom;
      },

      'margin-box-width': function(element) {
        var bWidth = this.get('border-box-width'),
         mLeft = this.get('margin-left'),
         mRight = this.get('margin-right');

        if (bWidth <= 0) return 0;

        return bWidth + mLeft + mRight;
      },

      'top': function(element) {
        var offset = element.positionedOffset();
        return offset.top;
      },

      'bottom': function(element) {
        var offset = element.positionedOffset(),
         parent = element.getOffsetParent(),
         pHeight = parent.measure('height');

        var mHeight = this.get('border-box-height');

        return pHeight - mHeight - offset.top;
      },

      'left': function(element) {
        var offset = element.positionedOffset();
        return offset.left;
      },

      'right': function(element) {
        var offset = element.positionedOffset(),
         parent = element.getOffsetParent(),
         pWidth = parent.measure('width');

        var mWidth = this.get('border-box-width');

        return pWidth - mWidth - offset.left;
      },

      'padding-top': function(element) {
        return getPixelValue(element, 'paddingTop');
      },

      'padding-bottom': function(element) {
        return getPixelValue(element, 'paddingBottom');
      },

      'padding-left': function(element) {
        return getPixelValue(element, 'paddingLeft');
      },

      'padding-right': function(element) {
        return getPixelValue(element, 'paddingRight');
      },

      'border-top': function(element) {
        return getPixelValue(element, 'borderTopWidth');
      },

      'border-bottom': function(element) {
        return getPixelValue(element, 'borderBottomWidth');
      },

      'border-left': function(element) {
        return getPixelValue(element, 'borderLeftWidth');
      },

      'border-right': function(element) {
        return getPixelValue(element, 'borderRightWidth');
      },

      'margin-top': function(element) {
        return getPixelValue(element, 'marginTop');
      },

      'margin-bottom': function(element) {
        return getPixelValue(element, 'marginBottom');
      },

      'margin-left': function(element) {
        return getPixelValue(element, 'marginLeft');
      },

      'margin-right': function(element) {
        return getPixelValue(element, 'marginRight');
      }
    }
  });

  if ('getBoundingClientRect' in document.documentElement) {
    Object.extend(Element.Layout.COMPUTATIONS, {
      'right': function(element) {
        var parent = hasLayout(element.getOffsetParent());
        var rect = element.getBoundingClientRect(),
         pRect = parent.getBoundingClientRect();

        return (pRect.right - rect.right).round();
      },

      'bottom': function(element) {
        var parent = hasLayout(element.getOffsetParent());
        var rect = element.getBoundingClientRect(),
         pRect = parent.getBoundingClientRect();

        return (pRect.bottom - rect.bottom).round();
      }
    });
  }

  Element.Offset = Class.create({
    initialize: function(left, top) {
      this.left = left.round();
      this.top  = top.round();

      this[0] = this.left;
      this[1] = this.top;
    },

    relativeTo: function(offset) {
      return new Element.Offset(
        this.left - offset.left,
        this.top  - offset.top
      );
    },

    inspect: function() {
      return "#<Element.Offset left: #{left} top: #{top}>".interpolate(this);
    },

    toString: function() {
      return "[#{left}, #{top}]".interpolate(this);
    },

    toArray: function() {
      return [this.left, this.top];
    }
  });

  function getLayout(element, preCompute) {
    return new Element.Layout(element, preCompute);
  }

  function measure(element, property) {
    return $(element).getLayout().get(property);
  }

  function getDimensions(element) {
    element = $(element);
    var display = Element.getStyle(element, 'display');

    if (display && display !== 'none') {
      return { width: element.offsetWidth, height: element.offsetHeight };
    }

    var style = element.style;
    var originalStyles = {
      visibility: style.visibility,
      position:   style.position,
      display:    style.display
    };

    var newStyles = {
      visibility: 'hidden',
      display:    'block'
    };

    if (originalStyles.position !== 'fixed')
      newStyles.position = 'absolute';

    Element.setStyle(element, newStyles);

    var dimensions = {
      width:  element.offsetWidth,
      height: element.offsetHeight
    };

    Element.setStyle(element, originalStyles);

    return dimensions;
  }

  function getOffsetParent(element) {
    element = $(element);

    if (isDocument(element) || isDetached(element) || isBody(element) || isHtml(element))
      return $(document.body);

    var isInline = (Element.getStyle(element, 'display') === 'inline');
    if (!isInline && element.offsetParent) return $(element.offsetParent);

    while ((element = element.parentNode) && element !== document.body) {
      if (Element.getStyle(element, 'position') !== 'static') {
        return isHtml(element) ? $(document.body) : $(element);
      }
    }

    return $(document.body);
  }


  function cumulativeOffset(element) {
    element = $(element);
    var valueT = 0, valueL = 0;
    if (element.parentNode) {
      do {
        valueT += element.offsetTop  || 0;
        valueL += element.offsetLeft || 0;
        element = element.offsetParent;
      } while (element);
    }
    return new Element.Offset(valueL, valueT);
  }

  function positionedOffset(element) {
    element = $(element);

    var layout = element.getLayout();

    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
      if (element) {
        if (isBody(element)) break;
        var p = Element.getStyle(element, 'position');
        if (p !== 'static') break;
      }
    } while (element);

    valueL -= layout.get('margin-top');
    valueT -= layout.get('margin-left');

    return new Element.Offset(valueL, valueT);
  }

  function cumulativeScrollOffset(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.scrollTop  || 0;
      valueL += element.scrollLeft || 0;
      element = element.parentNode;
    } while (element);
    return new Element.Offset(valueL, valueT);
  }

  function viewportOffset(forElement) {
    element = $(element);
    var valueT = 0, valueL = 0, docBody = document.body;

    var element = forElement;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      if (element.offsetParent == docBody &&
        Element.getStyle(element, 'position') == 'absolute') break;
    } while (element = element.offsetParent);

    element = forElement;
    do {
      if (element != docBody) {
        valueT -= element.scrollTop  || 0;
        valueL -= element.scrollLeft || 0;
      }
    } while (element = element.parentNode);
    return new Element.Offset(valueL, valueT);
  }

  function absolutize(element) {
    element = $(element);

    if (Element.getStyle(element, 'position') === 'absolute') {
      return element;
    }

    var offsetParent = getOffsetParent(element);
    var eOffset = element.viewportOffset(),
     pOffset = offsetParent.viewportOffset();

    var offset = eOffset.relativeTo(pOffset);
    var layout = element.getLayout();

    element.store('prototype_absolutize_original_styles', {
      left:   element.getStyle('left'),
      top:    element.getStyle('top'),
      width:  element.getStyle('width'),
      height: element.getStyle('height')
    });

    element.setStyle({
      position: 'absolute',
      top:    offset.top + 'px',
      left:   offset.left + 'px',
      width:  layout.get('width') + 'px',
      height: layout.get('height') + 'px'
    });

    return element;
  }

  function relativize(element) {
    element = $(element);
    if (Element.getStyle(element, 'position') === 'relative') {
      return element;
    }

    var originalStyles =
     element.retrieve('prototype_absolutize_original_styles');

    if (originalStyles) element.setStyle(originalStyles);
    return element;
  }

  if (Prototype.Browser.IE) {
    getOffsetParent = getOffsetParent.wrap(
      function(proceed, element) {
        element = $(element);

        if (isDocument(element) || isDetached(element) || isBody(element) || isHtml(element))
          return $(document.body);

        var position = element.getStyle('position');
        if (position !== 'static') return proceed(element);

        element.setStyle({ position: 'relative' });
        var value = proceed(element);
        element.setStyle({ position: position });
        return value;
      }
    );

    positionedOffset = positionedOffset.wrap(function(proceed, element) {
      element = $(element);
      if (!element.parentNode) return new Element.Offset(0, 0);
      var position = element.getStyle('position');
      if (position !== 'static') return proceed(element);

      var offsetParent = element.getOffsetParent();
      if (offsetParent && offsetParent.getStyle('position') === 'fixed')
        hasLayout(offsetParent);

      element.setStyle({ position: 'relative' });
      var value = proceed(element);
      element.setStyle({ position: position });
      return value;
    });
  } else if (Prototype.Browser.Webkit) {
    cumulativeOffset = function(element) {
      element = $(element);
      var valueT = 0, valueL = 0;
      do {
        valueT += element.offsetTop  || 0;
        valueL += element.offsetLeft || 0;
        if (element.offsetParent == document.body)
          if (Element.getStyle(element, 'position') == 'absolute') break;

        element = element.offsetParent;
      } while (element);

      return new Element.Offset(valueL, valueT);
    };
  }


  Element.addMethods({
    getLayout:              getLayout,
    measure:                measure,
    getDimensions:          getDimensions,
    getOffsetParent:        getOffsetParent,
    cumulativeOffset:       cumulativeOffset,
    positionedOffset:       positionedOffset,
    cumulativeScrollOffset: cumulativeScrollOffset,
    viewportOffset:         viewportOffset,
    absolutize:             absolutize,
    relativize:             relativize
  });

  function isBody(element) {
    return element.nodeName.toUpperCase() === 'BODY';
  }

  function isHtml(element) {
    return element.nodeName.toUpperCase() === 'HTML';
  }

  function isDocument(element) {
    return element.nodeType === Node.DOCUMENT_NODE;
  }

  function isDetached(element) {
    return element !== document.body &&
     !Element.descendantOf(element, document.body);
  }

  if ('getBoundingClientRect' in document.documentElement) {
    Element.addMethods({
      viewportOffset: function(element) {
        element = $(element);
        if (isDetached(element)) return new Element.Offset(0, 0);

        var rect = element.getBoundingClientRect(),
         docEl = document.documentElement;
        return new Element.Offset(rect.left - docEl.clientLeft,
         rect.top - docEl.clientTop);
      }
    });
  }
})();
window.$$ = function() {
  var expression = $A(arguments).join(', ');
  return Prototype.Selector.select(expression, document);
};

Prototype.Selector = (function() {

  function select() {
    throw new Error('Method "Prototype.Selector.select" must be defined.');
  }

  function match() {
    throw new Error('Method "Prototype.Selector.match" must be defined.');
  }

  function find(elements, expression, index) {
    index = index || 0;
    var match = Prototype.Selector.match, length = elements.length, matchIndex = 0, i;

    for (i = 0; i < length; i++) {
      if (match(elements[i], expression) && index == matchIndex++) {
        return Element.extend(elements[i]);
      }
    }
  }

  function extendElements(elements) {
    for (var i = 0, length = elements.length; i < length; i++) {
      Element.extend(elements[i]);
    }
    return elements;
  }


  var K = Prototype.K;

  return {
    select: select,
    match: match,
    find: find,
    extendElements: (Element.extend === K) ? K : extendElements,
    extendElement: Element.extend
  };
})();
Prototype._original_property = window.Sizzle;
/*!
 * Sizzle CSS Selector Engine - v1.0
 *  Copyright 2009, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function(){

var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
	done = 0,
	toString = Object.prototype.toString,
	hasDuplicate = false,
	baseHasDuplicate = true;

[0, 0].sort(function(){
	baseHasDuplicate = false;
	return 0;
});

var Sizzle = function(selector, context, results, seed) {
	results = results || [];
	var origContext = context = context || document;

	if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
		return [];
	}

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	var parts = [], m, set, checkSet, check, mode, extra, prune = true, contextXML = isXML(context),
		soFar = selector;

	while ( (chunker.exec(""), m = chunker.exec(soFar)) !== null ) {
		soFar = m[3];

		parts.push( m[1] );

		if ( m[2] ) {
			extra = m[3];
			break;
		}
	}

	if ( parts.length > 1 && origPOS.exec( selector ) ) {
		if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
			set = posProcess( parts[0] + parts[1], context );
		} else {
			set = Expr.relative[ parts[0] ] ?
				[ context ] :
				Sizzle( parts.shift(), context );

			while ( parts.length ) {
				selector = parts.shift();

				if ( Expr.relative[ selector ] )
					selector += parts.shift();

				set = posProcess( selector, set );
			}
		}
	} else {
		if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
				Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {
			var ret = Sizzle.find( parts.shift(), context, contextXML );
			context = ret.expr ? Sizzle.filter( ret.expr, ret.set )[0] : ret.set[0];
		}

		if ( context ) {
			var ret = seed ?
				{ expr: parts.pop(), set: makeArray(seed) } :
				Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );
			set = ret.expr ? Sizzle.filter( ret.expr, ret.set ) : ret.set;

			if ( parts.length > 0 ) {
				checkSet = makeArray(set);
			} else {
				prune = false;
			}

			while ( parts.length ) {
				var cur = parts.pop(), pop = cur;

				if ( !Expr.relative[ cur ] ) {
					cur = "";
				} else {
					pop = parts.pop();
				}

				if ( pop == null ) {
					pop = context;
				}

				Expr.relative[ cur ]( checkSet, pop, contextXML );
			}
		} else {
			checkSet = parts = [];
		}
	}

	if ( !checkSet ) {
		checkSet = set;
	}

	if ( !checkSet ) {
		throw "Syntax error, unrecognized expression: " + (cur || selector);
	}

	if ( toString.call(checkSet) === "[object Array]" ) {
		if ( !prune ) {
			results.push.apply( results, checkSet );
		} else if ( context && context.nodeType === 1 ) {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && contains(context, checkSet[i])) ) {
					results.push( set[i] );
				}
			}
		} else {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
					results.push( set[i] );
				}
			}
		}
	} else {
		makeArray( checkSet, results );
	}

	if ( extra ) {
		Sizzle( extra, origContext, results, seed );
		Sizzle.uniqueSort( results );
	}

	return results;
};

Sizzle.uniqueSort = function(results){
	if ( sortOrder ) {
		hasDuplicate = baseHasDuplicate;
		results.sort(sortOrder);

		if ( hasDuplicate ) {
			for ( var i = 1; i < results.length; i++ ) {
				if ( results[i] === results[i-1] ) {
					results.splice(i--, 1);
				}
			}
		}
	}

	return results;
};

Sizzle.matches = function(expr, set){
	return Sizzle(expr, null, null, set);
};

Sizzle.find = function(expr, context, isXML){
	var set, match;

	if ( !expr ) {
		return [];
	}

	for ( var i = 0, l = Expr.order.length; i < l; i++ ) {
		var type = Expr.order[i], match;

		if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
			var left = match[1];
			match.splice(1,1);

			if ( left.substr( left.length - 1 ) !== "\\" ) {
				match[1] = (match[1] || "").replace(/\\/g, "");
				set = Expr.find[ type ]( match, context, isXML );
				if ( set != null ) {
					expr = expr.replace( Expr.match[ type ], "" );
					break;
				}
			}
		}
	}

	if ( !set ) {
		set = context.getElementsByTagName("*");
	}

	return {set: set, expr: expr};
};

Sizzle.filter = function(expr, set, inplace, not){
	var old = expr, result = [], curLoop = set, match, anyFound,
		isXMLFilter = set && set[0] && isXML(set[0]);

	while ( expr && set.length ) {
		for ( var type in Expr.filter ) {
			if ( (match = Expr.match[ type ].exec( expr )) != null ) {
				var filter = Expr.filter[ type ], found, item;
				anyFound = false;

				if ( curLoop == result ) {
					result = [];
				}

				if ( Expr.preFilter[ type ] ) {
					match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

					if ( !match ) {
						anyFound = found = true;
					} else if ( match === true ) {
						continue;
					}
				}

				if ( match ) {
					for ( var i = 0; (item = curLoop[i]) != null; i++ ) {
						if ( item ) {
							found = filter( item, match, i, curLoop );
							var pass = not ^ !!found;

							if ( inplace && found != null ) {
								if ( pass ) {
									anyFound = true;
								} else {
									curLoop[i] = false;
								}
							} else if ( pass ) {
								result.push( item );
								anyFound = true;
							}
						}
					}
				}

				if ( found !== undefined ) {
					if ( !inplace ) {
						curLoop = result;
					}

					expr = expr.replace( Expr.match[ type ], "" );

					if ( !anyFound ) {
						return [];
					}

					break;
				}
			}
		}

		if ( expr == old ) {
			if ( anyFound == null ) {
				throw "Syntax error, unrecognized expression: " + expr;
			} else {
				break;
			}
		}

		old = expr;
	}

	return curLoop;
};

var Expr = Sizzle.selectors = {
	order: [ "ID", "NAME", "TAG" ],
	match: {
		ID: /#((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
		CLASS: /\.((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
		NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF-]|\\.)+)['"]*\]/,
		ATTR: /\[\s*((?:[\w\u00c0-\uFFFF-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
		TAG: /^((?:[\w\u00c0-\uFFFF\*-]|\\.)+)/,
		CHILD: /:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,
		POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,
		PSEUDO: /:((?:[\w\u00c0-\uFFFF-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/
	},
	leftMatch: {},
	attrMap: {
		"class": "className",
		"for": "htmlFor"
	},
	attrHandle: {
		href: function(elem){
			return elem.getAttribute("href");
		}
	},
	relative: {
		"+": function(checkSet, part, isXML){
			var isPartStr = typeof part === "string",
				isTag = isPartStr && !/\W/.test(part),
				isPartStrNotTag = isPartStr && !isTag;

			if ( isTag && !isXML ) {
				part = part.toUpperCase();
			}

			for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
				if ( (elem = checkSet[i]) ) {
					while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

					checkSet[i] = isPartStrNotTag || elem && elem.nodeName === part ?
						elem || false :
						elem === part;
				}
			}

			if ( isPartStrNotTag ) {
				Sizzle.filter( part, checkSet, true );
			}
		},
		">": function(checkSet, part, isXML){
			var isPartStr = typeof part === "string";

			if ( isPartStr && !/\W/.test(part) ) {
				part = isXML ? part : part.toUpperCase();

				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						var parent = elem.parentNode;
						checkSet[i] = parent.nodeName === part ? parent : false;
					}
				}
			} else {
				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						checkSet[i] = isPartStr ?
							elem.parentNode :
							elem.parentNode === part;
					}
				}

				if ( isPartStr ) {
					Sizzle.filter( part, checkSet, true );
				}
			}
		},
		"": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( !/\W/.test(part) ) {
				var nodeCheck = part = isXML ? part : part.toUpperCase();
				checkFn = dirNodeCheck;
			}

			checkFn("parentNode", part, doneName, checkSet, nodeCheck, isXML);
		},
		"~": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( typeof part === "string" && !/\W/.test(part) ) {
				var nodeCheck = part = isXML ? part : part.toUpperCase();
				checkFn = dirNodeCheck;
			}

			checkFn("previousSibling", part, doneName, checkSet, nodeCheck, isXML);
		}
	},
	find: {
		ID: function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? [m] : [];
			}
		},
		NAME: function(match, context, isXML){
			if ( typeof context.getElementsByName !== "undefined" ) {
				var ret = [], results = context.getElementsByName(match[1]);

				for ( var i = 0, l = results.length; i < l; i++ ) {
					if ( results[i].getAttribute("name") === match[1] ) {
						ret.push( results[i] );
					}
				}

				return ret.length === 0 ? null : ret;
			}
		},
		TAG: function(match, context){
			return context.getElementsByTagName(match[1]);
		}
	},
	preFilter: {
		CLASS: function(match, curLoop, inplace, result, not, isXML){
			match = " " + match[1].replace(/\\/g, "") + " ";

			if ( isXML ) {
				return match;
			}

			for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
				if ( elem ) {
					if ( not ^ (elem.className && (" " + elem.className + " ").indexOf(match) >= 0) ) {
						if ( !inplace )
							result.push( elem );
					} else if ( inplace ) {
						curLoop[i] = false;
					}
				}
			}

			return false;
		},
		ID: function(match){
			return match[1].replace(/\\/g, "");
		},
		TAG: function(match, curLoop){
			for ( var i = 0; curLoop[i] === false; i++ ){}
			return curLoop[i] && isXML(curLoop[i]) ? match[1] : match[1].toUpperCase();
		},
		CHILD: function(match){
			if ( match[1] == "nth" ) {
				var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(
					match[2] == "even" && "2n" || match[2] == "odd" && "2n+1" ||
					!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

				match[2] = (test[1] + (test[2] || 1)) - 0;
				match[3] = test[3] - 0;
			}

			match[0] = done++;

			return match;
		},
		ATTR: function(match, curLoop, inplace, result, not, isXML){
			var name = match[1].replace(/\\/g, "");

			if ( !isXML && Expr.attrMap[name] ) {
				match[1] = Expr.attrMap[name];
			}

			if ( match[2] === "~=" ) {
				match[4] = " " + match[4] + " ";
			}

			return match;
		},
		PSEUDO: function(match, curLoop, inplace, result, not){
			if ( match[1] === "not" ) {
				if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
					match[3] = Sizzle(match[3], null, null, curLoop);
				} else {
					var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
					if ( !inplace ) {
						result.push.apply( result, ret );
					}
					return false;
				}
			} else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
				return true;
			}

			return match;
		},
		POS: function(match){
			match.unshift( true );
			return match;
		}
	},
	filters: {
		enabled: function(elem){
			return elem.disabled === false && elem.type !== "hidden";
		},
		disabled: function(elem){
			return elem.disabled === true;
		},
		checked: function(elem){
			return elem.checked === true;
		},
		selected: function(elem){
			elem.parentNode.selectedIndex;
			return elem.selected === true;
		},
		parent: function(elem){
			return !!elem.firstChild;
		},
		empty: function(elem){
			return !elem.firstChild;
		},
		has: function(elem, i, match){
			return !!Sizzle( match[3], elem ).length;
		},
		header: function(elem){
			return /h\d/i.test( elem.nodeName );
		},
		text: function(elem){
			return "text" === elem.type;
		},
		radio: function(elem){
			return "radio" === elem.type;
		},
		checkbox: function(elem){
			return "checkbox" === elem.type;
		},
		file: function(elem){
			return "file" === elem.type;
		},
		password: function(elem){
			return "password" === elem.type;
		},
		submit: function(elem){
			return "submit" === elem.type;
		},
		image: function(elem){
			return "image" === elem.type;
		},
		reset: function(elem){
			return "reset" === elem.type;
		},
		button: function(elem){
			return "button" === elem.type || elem.nodeName.toUpperCase() === "BUTTON";
		},
		input: function(elem){
			return /input|select|textarea|button/i.test(elem.nodeName);
		}
	},
	setFilters: {
		first: function(elem, i){
			return i === 0;
		},
		last: function(elem, i, match, array){
			return i === array.length - 1;
		},
		even: function(elem, i){
			return i % 2 === 0;
		},
		odd: function(elem, i){
			return i % 2 === 1;
		},
		lt: function(elem, i, match){
			return i < match[3] - 0;
		},
		gt: function(elem, i, match){
			return i > match[3] - 0;
		},
		nth: function(elem, i, match){
			return match[3] - 0 == i;
		},
		eq: function(elem, i, match){
			return match[3] - 0 == i;
		}
	},
	filter: {
		PSEUDO: function(elem, match, i, array){
			var name = match[1], filter = Expr.filters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			} else if ( name === "contains" ) {
				return (elem.textContent || elem.innerText || "").indexOf(match[3]) >= 0;
			} else if ( name === "not" ) {
				var not = match[3];

				for ( var i = 0, l = not.length; i < l; i++ ) {
					if ( not[i] === elem ) {
						return false;
					}
				}

				return true;
			}
		},
		CHILD: function(elem, match){
			var type = match[1], node = elem;
			switch (type) {
				case 'only':
				case 'first':
					while ( (node = node.previousSibling) )  {
						if ( node.nodeType === 1 ) return false;
					}
					if ( type == 'first') return true;
					node = elem;
				case 'last':
					while ( (node = node.nextSibling) )  {
						if ( node.nodeType === 1 ) return false;
					}
					return true;
				case 'nth':
					var first = match[2], last = match[3];

					if ( first == 1 && last == 0 ) {
						return true;
					}

					var doneName = match[0],
						parent = elem.parentNode;

					if ( parent && (parent.sizcache !== doneName || !elem.nodeIndex) ) {
						var count = 0;
						for ( node = parent.firstChild; node; node = node.nextSibling ) {
							if ( node.nodeType === 1 ) {
								node.nodeIndex = ++count;
							}
						}
						parent.sizcache = doneName;
					}

					var diff = elem.nodeIndex - last;
					if ( first == 0 ) {
						return diff == 0;
					} else {
						return ( diff % first == 0 && diff / first >= 0 );
					}
			}
		},
		ID: function(elem, match){
			return elem.nodeType === 1 && elem.getAttribute("id") === match;
		},
		TAG: function(elem, match){
			return (match === "*" && elem.nodeType === 1) || elem.nodeName === match;
		},
		CLASS: function(elem, match){
			return (" " + (elem.className || elem.getAttribute("class")) + " ")
				.indexOf( match ) > -1;
		},
		ATTR: function(elem, match){
			var name = match[1],
				result = Expr.attrHandle[ name ] ?
					Expr.attrHandle[ name ]( elem ) :
					elem[ name ] != null ?
						elem[ name ] :
						elem.getAttribute( name ),
				value = result + "",
				type = match[2],
				check = match[4];

			return result == null ?
				type === "!=" :
				type === "=" ?
				value === check :
				type === "*=" ?
				value.indexOf(check) >= 0 :
				type === "~=" ?
				(" " + value + " ").indexOf(check) >= 0 :
				!check ?
				value && result !== false :
				type === "!=" ?
				value != check :
				type === "^=" ?
				value.indexOf(check) === 0 :
				type === "$=" ?
				value.substr(value.length - check.length) === check :
				type === "|=" ?
				value === check || value.substr(0, check.length + 1) === check + "-" :
				false;
		},
		POS: function(elem, match, i, array){
			var name = match[2], filter = Expr.setFilters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			}
		}
	}
};

var origPOS = Expr.match.POS;

for ( var type in Expr.match ) {
	Expr.match[ type ] = new RegExp( Expr.match[ type ].source + /(?![^\[]*\])(?![^\(]*\))/.source );
	Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source );
}

var makeArray = function(array, results) {
	array = Array.prototype.slice.call( array, 0 );

	if ( results ) {
		results.push.apply( results, array );
		return results;
	}

	return array;
};

try {
	Array.prototype.slice.call( document.documentElement.childNodes, 0 );

} catch(e){
	makeArray = function(array, results) {
		var ret = results || [];

		if ( toString.call(array) === "[object Array]" ) {
			Array.prototype.push.apply( ret, array );
		} else {
			if ( typeof array.length === "number" ) {
				for ( var i = 0, l = array.length; i < l; i++ ) {
					ret.push( array[i] );
				}
			} else {
				for ( var i = 0; array[i]; i++ ) {
					ret.push( array[i] );
				}
			}
		}

		return ret;
	};
}

var sortOrder;

if ( document.documentElement.compareDocumentPosition ) {
	sortOrder = function( a, b ) {
		if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return 0;
		}

		var ret = a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( "sourceIndex" in document.documentElement ) {
	sortOrder = function( a, b ) {
		if ( !a.sourceIndex || !b.sourceIndex ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return 0;
		}

		var ret = a.sourceIndex - b.sourceIndex;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( document.createRange ) {
	sortOrder = function( a, b ) {
		if ( !a.ownerDocument || !b.ownerDocument ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return 0;
		}

		var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
		aRange.setStart(a, 0);
		aRange.setEnd(a, 0);
		bRange.setStart(b, 0);
		bRange.setEnd(b, 0);
		var ret = aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
}

(function(){
	var form = document.createElement("div"),
		id = "script" + (new Date).getTime();
	form.innerHTML = "<a name='" + id + "'/>";

	var root = document.documentElement;
	root.insertBefore( form, root.firstChild );

	if ( !!document.getElementById( id ) ) {
		Expr.find.ID = function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
			}
		};

		Expr.filter.ID = function(elem, match){
			var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
			return elem.nodeType === 1 && node && node.nodeValue === match;
		};
	}

	root.removeChild( form );
	root = form = null; // release memory in IE
})();

(function(){

	var div = document.createElement("div");
	div.appendChild( document.createComment("") );

	if ( div.getElementsByTagName("*").length > 0 ) {
		Expr.find.TAG = function(match, context){
			var results = context.getElementsByTagName(match[1]);

			if ( match[1] === "*" ) {
				var tmp = [];

				for ( var i = 0; results[i]; i++ ) {
					if ( results[i].nodeType === 1 ) {
						tmp.push( results[i] );
					}
				}

				results = tmp;
			}

			return results;
		};
	}

	div.innerHTML = "<a href='#'></a>";
	if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
			div.firstChild.getAttribute("href") !== "#" ) {
		Expr.attrHandle.href = function(elem){
			return elem.getAttribute("href", 2);
		};
	}

	div = null; // release memory in IE
})();

if ( document.querySelectorAll ) (function(){
	var oldSizzle = Sizzle, div = document.createElement("div");
	div.innerHTML = "<p class='TEST'></p>";

	if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
		return;
	}

	Sizzle = function(query, context, extra, seed){
		context = context || document;

		if ( !seed && context.nodeType === 9 && !isXML(context) ) {
			try {
				return makeArray( context.querySelectorAll(query), extra );
			} catch(e){}
		}

		return oldSizzle(query, context, extra, seed);
	};

	for ( var prop in oldSizzle ) {
		Sizzle[ prop ] = oldSizzle[ prop ];
	}

	div = null; // release memory in IE
})();

if ( document.getElementsByClassName && document.documentElement.getElementsByClassName ) (function(){
	var div = document.createElement("div");
	div.innerHTML = "<div class='test e'></div><div class='test'></div>";

	if ( div.getElementsByClassName("e").length === 0 )
		return;

	div.lastChild.className = "e";

	if ( div.getElementsByClassName("e").length === 1 )
		return;

	Expr.order.splice(1, 0, "CLASS");
	Expr.find.CLASS = function(match, context, isXML) {
		if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
			return context.getElementsByClassName(match[1]);
		}
	};

	div = null; // release memory in IE
})();

function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	var sibDir = dir == "previousSibling" && !isXML;
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			if ( sibDir && elem.nodeType === 1 ){
				elem.sizcache = doneName;
				elem.sizset = i;
			}
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 && !isXML ){
					elem.sizcache = doneName;
					elem.sizset = i;
				}

				if ( elem.nodeName === cur ) {
					match = elem;
					break;
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	var sibDir = dir == "previousSibling" && !isXML;
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			if ( sibDir && elem.nodeType === 1 ) {
				elem.sizcache = doneName;
				elem.sizset = i;
			}
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 ) {
					if ( !isXML ) {
						elem.sizcache = doneName;
						elem.sizset = i;
					}
					if ( typeof cur !== "string" ) {
						if ( elem === cur ) {
							match = true;
							break;
						}

					} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
						match = elem;
						break;
					}
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

var contains = document.compareDocumentPosition ?  function(a, b){
	return a.compareDocumentPosition(b) & 16;
} : function(a, b){
	return a !== b && (a.contains ? a.contains(b) : true);
};

var isXML = function(elem){
	return elem.nodeType === 9 && elem.documentElement.nodeName !== "HTML" ||
		!!elem.ownerDocument && elem.ownerDocument.documentElement.nodeName !== "HTML";
};

var posProcess = function(selector, context){
	var tmpSet = [], later = "", match,
		root = context.nodeType ? [context] : context;

	while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
		later += match[0];
		selector = selector.replace( Expr.match.PSEUDO, "" );
	}

	selector = Expr.relative[selector] ? selector + "*" : selector;

	for ( var i = 0, l = root.length; i < l; i++ ) {
		Sizzle( selector, root[i], tmpSet );
	}

	return Sizzle.filter( later, tmpSet );
};


window.Sizzle = Sizzle;

})();

;(function(engine) {
  var extendElements = Prototype.Selector.extendElements;

  function select(selector, scope) {
    return extendElements(engine(selector, scope || document));
  }

  function match(element, selector) {
    return engine.matches(selector, [element]).length == 1;
  }

  Prototype.Selector.engine = engine;
  Prototype.Selector.select = select;
  Prototype.Selector.match = match;
})(Sizzle);

window.Sizzle = Prototype._original_property;
delete Prototype._original_property;

var Form = {
  reset: function(form) {
    form = $(form);
    form.reset();
    return form;
  },

  serializeElements: function(elements, options) {
    if (typeof options != 'object') options = { hash: !!options };
    else if (Object.isUndefined(options.hash)) options.hash = true;
    var key, value, submitted = false, submit = options.submit, accumulator, initial;

    if (options.hash) {
      initial = {};
      accumulator = function(result, key, value) {
        if (key in result) {
          if (!Object.isArray(result[key])) result[key] = [result[key]];
          result[key].push(value);
        } else result[key] = value;
        return result;
      };
    } else {
      initial = '';
      accumulator = function(result, key, value) {
        return result + (result ? '&' : '') + encodeURIComponent(key) + '=' + encodeURIComponent(value);
      }
    }

    return elements.inject(initial, function(result, element) {
      if (!element.disabled && element.name) {
        key = element.name; value = $(element).getValue();
        if (value != null && element.type != 'file' && (element.type != 'submit' || (!submitted &&
            submit !== false && (!submit || key == submit) && (submitted = true)))) {
          result = accumulator(result, key, value);
        }
      }
      return result;
    });
  }
};

Form.Methods = {
  serialize: function(form, options) {
    return Form.serializeElements(Form.getElements(form), options);
  },

  getElements: function(form) {
    var elements = $(form).getElementsByTagName('*'),
        element,
        arr = [ ],
        serializers = Form.Element.Serializers;
    for (var i = 0; element = elements[i]; i++) {
      arr.push(element);
    }
    return arr.inject([], function(elements, child) {
      if (serializers[child.tagName.toLowerCase()])
        elements.push(Element.extend(child));
      return elements;
    })
  },

  getInputs: function(form, typeName, name) {
    form = $(form);
    var inputs = form.getElementsByTagName('input');

    if (!typeName && !name) return $A(inputs).map(Element.extend);

    for (var i = 0, matchingInputs = [], length = inputs.length; i < length; i++) {
      var input = inputs[i];
      if ((typeName && input.type != typeName) || (name && input.name != name))
        continue;
      matchingInputs.push(Element.extend(input));
    }

    return matchingInputs;
  },

  disable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('disable');
    return form;
  },

  enable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('enable');
    return form;
  },

  findFirstElement: function(form) {
    var elements = $(form).getElements().findAll(function(element) {
      return 'hidden' != element.type && !element.disabled;
    });
    var firstByIndex = elements.findAll(function(element) {
      return element.hasAttribute('tabIndex') && element.tabIndex >= 0;
    }).sortBy(function(element) { return element.tabIndex }).first();

    return firstByIndex ? firstByIndex : elements.find(function(element) {
      return /^(?:input|select|textarea)$/i.test(element.tagName);
    });
  },

  focusFirstElement: function(form) {
    form = $(form);
    var element = form.findFirstElement();
    if (element) element.activate();
    return form;
  },

  request: function(form, options) {
    form = $(form), options = Object.clone(options || { });

    var params = options.parameters, action = form.readAttribute('action') || '';
    if (action.blank()) action = window.location.href;
    options.parameters = form.serialize(true);

    if (params) {
      if (Object.isString(params)) params = params.toQueryParams();
      Object.extend(options.parameters, params);
    }

    if (form.hasAttribute('method') && !options.method)
      options.method = form.method;

    return new Ajax.Request(action, options);
  }
};

/*--------------------------------------------------------------------------*/


Form.Element = {
  focus: function(element) {
    $(element).focus();
    return element;
  },

  select: function(element) {
    $(element).select();
    return element;
  }
};

Form.Element.Methods = {

  serialize: function(element) {
    element = $(element);
    if (!element.disabled && element.name) {
      var value = element.getValue();
      if (value != undefined) {
        var pair = { };
        pair[element.name] = value;
        return Object.toQueryString(pair);
      }
    }
    return '';
  },

  getValue: function(element) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    return Form.Element.Serializers[method](element);
  },

  setValue: function(element, value) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    Form.Element.Serializers[method](element, value);
    return element;
  },

  clear: function(element) {
    $(element).value = '';
    return element;
  },

  present: function(element) {
    return $(element).value != '';
  },

  activate: function(element) {
    element = $(element);
    try {
      element.focus();
      if (element.select && (element.tagName.toLowerCase() != 'input' ||
          !(/^(?:button|reset|submit)$/i.test(element.type))))
        element.select();
    } catch (e) { }
    return element;
  },

  disable: function(element) {
    element = $(element);
    element.disabled = true;
    return element;
  },

  enable: function(element) {
    element = $(element);
    element.disabled = false;
    return element;
  }
};

/*--------------------------------------------------------------------------*/

var Field = Form.Element;

var $F = Form.Element.Methods.getValue;

/*--------------------------------------------------------------------------*/

Form.Element.Serializers = (function() {
  function input(element, value) {
    switch (element.type.toLowerCase()) {
      case 'checkbox':
      case 'radio':
        return inputSelector(element, value);
      default:
        return valueSelector(element, value);
    }
  }

  function inputSelector(element, value) {
    if (Object.isUndefined(value))
      return element.checked ? element.value : null;
    else element.checked = !!value;
  }

  function valueSelector(element, value) {
    if (Object.isUndefined(value)) return element.value;
    else element.value = value;
  }

  function select(element, value) {
    if (Object.isUndefined(value))
      return (element.type === 'select-one' ? selectOne : selectMany)(element);

    var opt, currentValue, single = !Object.isArray(value);
    for (var i = 0, length = element.length; i < length; i++) {
      opt = element.options[i];
      currentValue = this.optionValue(opt);
      if (single) {
        if (currentValue == value) {
          opt.selected = true;
          return;
        }
      }
      else opt.selected = value.include(currentValue);
    }
  }

  function selectOne(element) {
    var index = element.selectedIndex;
    return index >= 0 ? optionValue(element.options[index]) : null;
  }

  function selectMany(element) {
    var values, length = element.length;
    if (!length) return null;

    for (var i = 0, values = []; i < length; i++) {
      var opt = element.options[i];
      if (opt.selected) values.push(optionValue(opt));
    }
    return values;
  }

  function optionValue(opt) {
    return Element.hasAttribute(opt, 'value') ? opt.value : opt.text;
  }

  return {
    input:         input,
    inputSelector: inputSelector,
    textarea:      valueSelector,
    select:        select,
    selectOne:     selectOne,
    selectMany:    selectMany,
    optionValue:   optionValue,
    button:        valueSelector
  };
})();

/*--------------------------------------------------------------------------*/


Abstract.TimedObserver = Class.create(PeriodicalExecuter, {
  initialize: function($super, element, frequency, callback) {
    $super(callback, frequency);
    this.element   = $(element);
    this.lastValue = this.getValue();
  },

  execute: function() {
    var value = this.getValue();
    if (Object.isString(this.lastValue) && Object.isString(value) ?
        this.lastValue != value : String(this.lastValue) != String(value)) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  }
});

Form.Element.Observer = Class.create(Abstract.TimedObserver, {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.Observer = Class.create(Abstract.TimedObserver, {
  getValue: function() {
    return Form.serialize(this.element);
  }
});

/*--------------------------------------------------------------------------*/

Abstract.EventObserver = Class.create({
  initialize: function(element, callback) {
    this.element  = $(element);
    this.callback = callback;

    this.lastValue = this.getValue();
    if (this.element.tagName.toLowerCase() == 'form')
      this.registerFormCallbacks();
    else
      this.registerCallback(this.element);
  },

  onElementEvent: function() {
    var value = this.getValue();
    if (this.lastValue != value) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  },

  registerFormCallbacks: function() {
    Form.getElements(this.element).each(this.registerCallback, this);
  },

  registerCallback: function(element) {
    if (element.type) {
      switch (element.type.toLowerCase()) {
        case 'checkbox':
        case 'radio':
          Event.observe(element, 'click', this.onElementEvent.bind(this));
          break;
        default:
          Event.observe(element, 'change', this.onElementEvent.bind(this));
          break;
      }
    }
  }
});

Form.Element.EventObserver = Class.create(Abstract.EventObserver, {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.EventObserver = Class.create(Abstract.EventObserver, {
  getValue: function() {
    return Form.serialize(this.element);
  }
});
(function() {

  var Event = {
    KEY_BACKSPACE: 8,
    KEY_TAB:       9,
    KEY_RETURN:   13,
    KEY_ESC:      27,
    KEY_LEFT:     37,
    KEY_UP:       38,
    KEY_RIGHT:    39,
    KEY_DOWN:     40,
    KEY_DELETE:   46,
    KEY_HOME:     36,
    KEY_END:      35,
    KEY_PAGEUP:   33,
    KEY_PAGEDOWN: 34,
    KEY_INSERT:   45,

    cache: {}
  };

  var docEl = document.documentElement;
  var MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED = 'onmouseenter' in docEl
    && 'onmouseleave' in docEl;



  var isIELegacyEvent = function(event) { return false; };

  if (window.attachEvent) {
    if (window.addEventListener) {
      isIELegacyEvent = function(event) {
        return !(event instanceof window.Event);
      };
    } else {
      isIELegacyEvent = function(event) { return true; };
    }
  }

  var _isButton;

  function _isButtonForDOMEvents(event, code) {
    return event.which ? (event.which === code + 1) : (event.button === code);
  }

  var legacyButtonMap = { 0: 1, 1: 4, 2: 2 };
  function _isButtonForLegacyEvents(event, code) {
    return event.button === legacyButtonMap[code];
  }

  function _isButtonForWebKit(event, code) {
    switch (code) {
      case 0: return event.which == 1 && !event.metaKey;
      case 1: return event.which == 2 || (event.which == 1 && event.metaKey);
      case 2: return event.which == 3;
      default: return false;
    }
  }

  if (window.attachEvent) {
    if (!window.addEventListener) {
      _isButton = _isButtonForLegacyEvents;
    } else {
      _isButton = function(event, code) {
        return isIELegacyEvent(event) ? _isButtonForLegacyEvents(event, code) :
         _isButtonForDOMEvents(event, code);
      }
    }
  } else if (Prototype.Browser.WebKit) {
    _isButton = _isButtonForWebKit;
  } else {
    _isButton = _isButtonForDOMEvents;
  }

  function isLeftClick(event)   { return _isButton(event, 0) }

  function isMiddleClick(event) { return _isButton(event, 1) }

  function isRightClick(event)  { return _isButton(event, 2) }

  function element(event) {
    event = Event.extend(event);

    var node = event.target, type = event.type,
     currentTarget = event.currentTarget;

    if (currentTarget && currentTarget.tagName) {
      if (type === 'load' || type === 'error' ||
        (type === 'click' && currentTarget.tagName.toLowerCase() === 'input'
          && currentTarget.type === 'radio'))
            node = currentTarget;
    }

    if (node.nodeType == Node.TEXT_NODE)
      node = node.parentNode;

    return Element.extend(node);
  }

  function findElement(event, expression) {
    var element = Event.element(event);

    if (!expression) return element;
    while (element) {
      if (Object.isElement(element) && Prototype.Selector.match(element, expression)) {
        return Element.extend(element);
      }
      element = element.parentNode;
    }
  }

  function pointer(event) {
    return { x: pointerX(event), y: pointerY(event) };
  }

  function pointerX(event) {
    var docElement = document.documentElement,
     body = document.body || { scrollLeft: 0 };

    return event.pageX || (event.clientX +
      (docElement.scrollLeft || body.scrollLeft) -
      (docElement.clientLeft || 0));
  }

  function pointerY(event) {
    var docElement = document.documentElement,
     body = document.body || { scrollTop: 0 };

    return  event.pageY || (event.clientY +
       (docElement.scrollTop || body.scrollTop) -
       (docElement.clientTop || 0));
  }


  function stop(event) {
    Event.extend(event);
    event.preventDefault();
    event.stopPropagation();

    event.stopped = true;
  }


  Event.Methods = {
    isLeftClick:   isLeftClick,
    isMiddleClick: isMiddleClick,
    isRightClick:  isRightClick,

    element:     element,
    findElement: findElement,

    pointer:  pointer,
    pointerX: pointerX,
    pointerY: pointerY,

    stop: stop
  };

  var methods = Object.keys(Event.Methods).inject({ }, function(m, name) {
    m[name] = Event.Methods[name].methodize();
    return m;
  });

  if (window.attachEvent) {
    function _relatedTarget(event) {
      var element;
      switch (event.type) {
        case 'mouseover':
        case 'mouseenter':
          element = event.fromElement;
          break;
        case 'mouseout':
        case 'mouseleave':
          element = event.toElement;
          break;
        default:
          return null;
      }
      return Element.extend(element);
    }

    var additionalMethods = {
      stopPropagation: function() { this.cancelBubble = true },
      preventDefault:  function() { this.returnValue = false },
      inspect: function() { return '[object Event]' }
    };

    Event.extend = function(event, element) {
      if (!event) return false;

      if (!isIELegacyEvent(event)) return event;

      if (event._extendedByPrototype) return event;
      event._extendedByPrototype = Prototype.emptyFunction;

      var pointer = Event.pointer(event);

      Object.extend(event, {
        target: event.srcElement || element,
        relatedTarget: _relatedTarget(event),
        pageX:  pointer.x,
        pageY:  pointer.y
      });

      Object.extend(event, methods);
      Object.extend(event, additionalMethods);

      return event;
    };
  } else {
    Event.extend = Prototype.K;
  }

  if (window.addEventListener) {
    Event.prototype = window.Event.prototype || document.createEvent('HTMLEvents').__proto__;
    Object.extend(Event.prototype, methods);
  }

  function _createResponder(element, eventName, handler) {
    var registry = Element.retrieve(element, 'prototype_event_registry');

    if (Object.isUndefined(registry)) {
      CACHE.push(element);
      registry = Element.retrieve(element, 'prototype_event_registry', $H());
    }

    var respondersForEvent = registry.get(eventName);
    if (Object.isUndefined(respondersForEvent)) {
      respondersForEvent = [];
      registry.set(eventName, respondersForEvent);
    }

    if (respondersForEvent.pluck('handler').include(handler)) return false;

    var responder;
    if (eventName.include(":")) {
      responder = function(event) {
        if (Object.isUndefined(event.eventName))
          return false;

        if (event.eventName !== eventName)
          return false;

        Event.extend(event, element);
        handler.call(element, event);
      };
    } else {
      if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED &&
       (eventName === "mouseenter" || eventName === "mouseleave")) {
        if (eventName === "mouseenter" || eventName === "mouseleave") {
          responder = function(event) {
            Event.extend(event, element);

            var parent = event.relatedTarget;
            while (parent && parent !== element) {
              try { parent = parent.parentNode; }
              catch(e) { parent = element; }
            }

            if (parent === element) return;

            handler.call(element, event);
          };
        }
      } else {
        responder = function(event) {
          Event.extend(event, element);
          handler.call(element, event);
        };
      }
    }

    responder.handler = handler;
    respondersForEvent.push(responder);
    return responder;
  }

  function _destroyCache() {
    for (var i = 0, length = CACHE.length; i < length; i++) {
      Event.stopObserving(CACHE[i]);
      CACHE[i] = null;
    }
  }

  var CACHE = [];

  if (Prototype.Browser.IE)
    window.attachEvent('onunload', _destroyCache);

  if (Prototype.Browser.WebKit)
    window.addEventListener('unload', Prototype.emptyFunction, false);


  var _getDOMEventName = Prototype.K,
      translations = { mouseenter: "mouseover", mouseleave: "mouseout" };

  if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED) {
    _getDOMEventName = function(eventName) {
      return (translations[eventName] || eventName);
    };
  }

  function observe(element, eventName, handler) {
    element = $(element);

    var responder = _createResponder(element, eventName, handler);

    if (!responder) return element;

    if (eventName.include(':')) {
      if (element.addEventListener)
        element.addEventListener("dataavailable", responder, false);
      else {
        element.attachEvent("ondataavailable", responder);
        element.attachEvent("onlosecapture", responder);
      }
    } else {
      var actualEventName = _getDOMEventName(eventName);

      if (element.addEventListener)
        element.addEventListener(actualEventName, responder, false);
      else
        element.attachEvent("on" + actualEventName, responder);
    }

    return element;
  }

  function stopObserving(element, eventName, handler) {
    element = $(element);

    var registry = Element.retrieve(element, 'prototype_event_registry');
    if (!registry) return element;

    if (!eventName) {
      registry.each( function(pair) {
        var eventName = pair.key;
        stopObserving(element, eventName);
      });
      return element;
    }

    var responders = registry.get(eventName);
    if (!responders) return element;

    if (!handler) {
      responders.each(function(r) {
        stopObserving(element, eventName, r.handler);
      });
      return element;
    }

    var i = responders.length, responder;
    while (i--) {
      if (responders[i].handler === handler) {
        responder = responders[i];
        break;
      }
    }
    if (!responder) return element;

    if (eventName.include(':')) {
      if (element.removeEventListener)
        element.removeEventListener("dataavailable", responder, false);
      else {
        element.detachEvent("ondataavailable", responder);
        element.detachEvent("onlosecapture", responder);
      }
    } else {
      var actualEventName = _getDOMEventName(eventName);
      if (element.removeEventListener)
        element.removeEventListener(actualEventName, responder, false);
      else
        element.detachEvent('on' + actualEventName, responder);
    }

    registry.set(eventName, responders.without(responder));

    return element;
  }

  function fire(element, eventName, memo, bubble) {
    element = $(element);

    if (Object.isUndefined(bubble))
      bubble = true;

    if (element == document && document.createEvent && !element.dispatchEvent)
      element = document.documentElement;

    var event;
    if (document.createEvent) {
      event = document.createEvent('HTMLEvents');
      event.initEvent('dataavailable', bubble, true);
    } else {
      event = document.createEventObject();
      event.eventType = bubble ? 'ondataavailable' : 'onlosecapture';
    }

    event.eventName = eventName;
    event.memo = memo || { };

    if (document.createEvent)
      element.dispatchEvent(event);
    else
      element.fireEvent(event.eventType, event);

    return Event.extend(event);
  }

  Event.Handler = Class.create({
    initialize: function(element, eventName, selector, callback) {
      this.element   = $(element);
      this.eventName = eventName;
      this.selector  = selector;
      this.callback  = callback;
      this.handler   = this.handleEvent.bind(this);
    },

    start: function() {
      Event.observe(this.element, this.eventName, this.handler);
      return this;
    },

    stop: function() {
      Event.stopObserving(this.element, this.eventName, this.handler);
      return this;
    },

    handleEvent: function(event) {
      var element = Event.findElement(event, this.selector);
      if (element) this.callback.call(this.element, event, element);
    }
  });

  function on(element, eventName, selector, callback) {
    element = $(element);
    if (Object.isFunction(selector) && Object.isUndefined(callback)) {
      callback = selector, selector = null;
    }

    return new Event.Handler(element, eventName, selector, callback).start();
  }

  Object.extend(Event, Event.Methods);

  Object.extend(Event, {
    fire:          fire,
    observe:       observe,
    stopObserving: stopObserving,
    on:            on
  });

  Element.addMethods({
    fire:          fire,

    observe:       observe,

    stopObserving: stopObserving,

    on:            on
  });

  Object.extend(document, {
    fire:          fire.methodize(),

    observe:       observe.methodize(),

    stopObserving: stopObserving.methodize(),

    on:            on.methodize(),

    loaded:        false
  });

  if (window.Event) Object.extend(window.Event, Event);
  else window.Event = Event;
})();

(function() {
  /* Support for the DOMContentLoaded event is based on work by Dan Webb,
     Matthias Miller, Dean Edwards, John Resig, and Diego Perini. */

  var timer;

  function fireContentLoadedEvent() {
    if (document.loaded) return;
    if (timer) window.clearTimeout(timer);
    document.loaded = true;
    document.fire('dom:loaded');
  }

  function checkReadyState() {
    if (document.readyState === 'complete') {
      document.stopObserving('readystatechange', checkReadyState);
      fireContentLoadedEvent();
    }
  }

  function pollDoScroll() {
    try { document.documentElement.doScroll('left'); }
    catch(e) {
      timer = pollDoScroll.defer();
      return;
    }
    fireContentLoadedEvent();
  }

  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', fireContentLoadedEvent, false);
  } else {
    document.observe('readystatechange', checkReadyState);
    if (window == top)
      timer = pollDoScroll.defer();
  }

  Event.observe(window, 'load', fireContentLoadedEvent);
})();

Element.addMethods();

/*------------------------------- DEPRECATED -------------------------------*/

Hash.toQueryString = Object.toQueryString;

var Toggle = { display: Element.toggle };

Element.Methods.childOf = Element.Methods.descendantOf;

var Insertion = {
  Before: function(element, content) {
    return Element.insert(element, {before:content});
  },

  Top: function(element, content) {
    return Element.insert(element, {top:content});
  },

  Bottom: function(element, content) {
    return Element.insert(element, {bottom:content});
  },

  After: function(element, content) {
    return Element.insert(element, {after:content});
  }
};

var $continue = new Error('"throw $continue" is deprecated, use "return" instead');

var Position = {
  includeScrollOffsets: false,

  prepare: function() {
    this.deltaX =  window.pageXOffset
                || document.documentElement.scrollLeft
                || document.body.scrollLeft
                || 0;
    this.deltaY =  window.pageYOffset
                || document.documentElement.scrollTop
                || document.body.scrollTop
                || 0;
  },

  within: function(element, x, y) {
    if (this.includeScrollOffsets)
      return this.withinIncludingScrolloffsets(element, x, y);
    this.xcomp = x;
    this.ycomp = y;
    this.offset = Element.cumulativeOffset(element);

    return (y >= this.offset[1] &&
            y <  this.offset[1] + element.offsetHeight &&
            x >= this.offset[0] &&
            x <  this.offset[0] + element.offsetWidth);
  },

  withinIncludingScrolloffsets: function(element, x, y) {
    var offsetcache = Element.cumulativeScrollOffset(element);

    this.xcomp = x + offsetcache[0] - this.deltaX;
    this.ycomp = y + offsetcache[1] - this.deltaY;
    this.offset = Element.cumulativeOffset(element);

    return (this.ycomp >= this.offset[1] &&
            this.ycomp <  this.offset[1] + element.offsetHeight &&
            this.xcomp >= this.offset[0] &&
            this.xcomp <  this.offset[0] + element.offsetWidth);
  },

  overlap: function(mode, element) {
    if (!mode) return 0;
    if (mode == 'vertical')
      return ((this.offset[1] + element.offsetHeight) - this.ycomp) /
        element.offsetHeight;
    if (mode == 'horizontal')
      return ((this.offset[0] + element.offsetWidth) - this.xcomp) /
        element.offsetWidth;
  },


  cumulativeOffset: Element.Methods.cumulativeOffset,

  positionedOffset: Element.Methods.positionedOffset,

  absolutize: function(element) {
    Position.prepare();
    return Element.absolutize(element);
  },

  relativize: function(element) {
    Position.prepare();
    return Element.relativize(element);
  },

  realOffset: Element.Methods.cumulativeScrollOffset,

  offsetParent: Element.Methods.getOffsetParent,

  page: Element.Methods.viewportOffset,

  clone: function(source, target, options) {
    options = options || { };
    return Element.clonePosition(target, source, options);
  }
};

/*--------------------------------------------------------------------------*/

if (!document.getElementsByClassName) document.getElementsByClassName = function(instanceMethods){
  function iter(name) {
    return name.blank() ? null : "[contains(concat(' ', @class, ' '), ' " + name + " ')]";
  }

  instanceMethods.getElementsByClassName = Prototype.BrowserFeatures.XPath ?
  function(element, className) {
    className = className.toString().strip();
    var cond = /\s/.test(className) ? $w(className).map(iter).join('') : iter(className);
    return cond ? document._getElementsByXPath('.//*' + cond, element) : [];
  } : function(element, className) {
    className = className.toString().strip();
    var elements = [], classNames = (/\s/.test(className) ? $w(className) : null);
    if (!classNames && !className) return elements;

    var nodes = $(element).getElementsByTagName('*');
    className = ' ' + className + ' ';

    for (var i = 0, child, cn; child = nodes[i]; i++) {
      if (child.className && (cn = ' ' + child.className + ' ') && (cn.include(className) ||
          (classNames && classNames.all(function(name) {
            return !name.toString().blank() && cn.include(' ' + name + ' ');
          }))))
        elements.push(Element.extend(child));
    }
    return elements;
  };

  return function(className, parentElement) {
    return $(parentElement || document.body).getElementsByClassName(className);
  };
}(Element.Methods);

/*--------------------------------------------------------------------------*/

Element.ClassNames = Class.create();
Element.ClassNames.prototype = {
  initialize: function(element) {
    this.element = $(element);
  },

  _each: function(iterator) {
    this.element.className.split(/\s+/).select(function(name) {
      return name.length > 0;
    })._each(iterator);
  },

  set: function(className) {
    this.element.className = className;
  },

  add: function(classNameToAdd) {
    if (this.include(classNameToAdd)) return;
    this.set($A(this).concat(classNameToAdd).join(' '));
  },

  remove: function(classNameToRemove) {
    if (!this.include(classNameToRemove)) return;
    this.set($A(this).without(classNameToRemove).join(' '));
  },

  toString: function() {
    return $A(this).join(' ');
  }
};

Object.extend(Element.ClassNames.prototype, Enumerable);

/*--------------------------------------------------------------------------*/

(function() {
  window.Selector = Class.create({
    initialize: function(expression) {
      this.expression = expression.strip();
    },

    findElements: function(rootElement) {
      return Prototype.Selector.select(this.expression, rootElement);
    },

    match: function(element) {
      return Prototype.Selector.match(element, this.expression);
    },

    toString: function() {
      return this.expression;
    },

    inspect: function() {
      return "#<Selector: " + this.expression + ">";
    }
  });

  Object.extend(Selector, {
    matchElements: function(elements, expression) {
      var match = Prototype.Selector.match,
          results = [];

      for (var i = 0, length = elements.length; i < length; i++) {
        var element = elements[i];
        if (match(element, expression)) {
          results.push(Element.extend(element));
        }
      }
      return results;
    },

    findElement: function(elements, expression, index) {
      index = index || 0;
      var matchIndex = 0, element;
      for (var i = 0, length = elements.length; i < length; i++) {
        element = elements[i];
        if (Prototype.Selector.match(element, expression) && index === matchIndex++) {
          return Element.extend(element);
        }
      }
    },

    findChildElements: function(element, expressions) {
      var selector = expressions.toArray().join(', ');
      return Prototype.Selector.select(selector, element || document);
    }
  });
})();

/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Mage
 * @package     js
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */
/*@cc_on
// code only for IE7 when ExtJs overwrite "defer" function in PrototypeJs
(function(){
    var last = null;
    var ie7 = @if(@_jscript_version==5.7) 1 @end + 0;
    var ie8 = @if(@_jscript_version==5.8) 1 @end + 0;
    if (ie7 || ie8) {
        var eDefer = Function.prototype.defer;
        Function.prototype.defer = function() {
            // prevent throw stack overflow exception
            if (last !== this) {
                last = this;
                eDefer.apply(last, arguments);
            }
            return this;
        };
    }
})();
@*/

// Copyright (c) 2006 Sébastien Gruhier (http://xilinus.com, http://itseb.com)
// 
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
// 
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// VERSION 1.3

var Window = Class.create();

Window.keepMultiModalWindow = false;
Window.hasEffectLib = (typeof Effect != 'undefined');
Window.resizeEffectDuration = 0.4;

Window.prototype = {
  // Constructor
  // Available parameters : className, blurClassName, title, minWidth, minHeight, maxWidth, maxHeight, width, height, top, left, bottom, right, resizable, zIndex, opacity, recenterAuto, wiredDrag
  //                        hideEffect, showEffect, showEffectOptions, hideEffectOptions, effectOptions, url, draggable, closable, minimizable, maximizable, parent, onload
  //                        add all callbacks (if you do not use an observer)
  //                        onDestroy onStartResize onStartMove onResize onMove onEndResize onEndMove onFocus onBlur onBeforeShow onShow onHide onMinimize onMaximize onClose
  
  initialize: function() {
    var id;
    var optionIndex = 0;
    // For backward compatibility like win= new Window("id", {...}) instead of win = new Window({id: "id", ...})
    if (arguments.length > 0) {
      if (typeof arguments[0] == "string" ) {
        id = arguments[0];
        optionIndex = 1;
      }
      else
        id = arguments[0] ? arguments[0].id : null;
    }
    
    // Generate unique ID if not specified
    if (!id)
      id = "window_" + new Date().getTime();
      
    if ($(id))
      alert("Window " + id + " is already registered in the DOM! Make sure you use setDestroyOnClose() or destroyOnClose: true in the constructor");

    this.options = Object.extend({
      className:         "dialog",
      windowClassName:   null,
      blurClassName:     null,
      minWidth:          100, 
      minHeight:         20,
      resizable:         true,
      closable:          true,
      minimizable:       true,
      maximizable:       true,
      draggable:         true,
      userData:          null,
      showEffect:        (Window.hasEffectLib ? Effect.Appear : Element.show),
      hideEffect:        (Window.hasEffectLib ? Effect.Fade : Element.hide),
      showEffectOptions: {},
      hideEffectOptions: {},
      effectOptions:     null,
      parent:            document.body,
      title:             "&nbsp;",
      url:               null,
      onload:            Prototype.emptyFunction,
      width:             200,
      height:            300,
      opacity:           1,
      recenterAuto:      true,
      wiredDrag:         false,
      closeOnEsc:        true,
      closeCallback:     null,
      destroyOnClose:    false,
      gridX:             1, 
      gridY:             1      
    }, arguments[optionIndex] || {});
    if (this.options.blurClassName)
      this.options.focusClassName = this.options.className;
      
    if (typeof this.options.top == "undefined" &&  typeof this.options.bottom ==  "undefined") 
      this.options.top = this._round(Math.random()*500, this.options.gridY);
    if (typeof this.options.left == "undefined" &&  typeof this.options.right ==  "undefined") 
      this.options.left = this._round(Math.random()*500, this.options.gridX);

    if (this.options.effectOptions) {
      Object.extend(this.options.hideEffectOptions, this.options.effectOptions);
      Object.extend(this.options.showEffectOptions, this.options.effectOptions);
      if (this.options.showEffect == Element.Appear)
        this.options.showEffectOptions.to = this.options.opacity;
    }
    if (Window.hasEffectLib) {
      if (this.options.showEffect == Effect.Appear)
        this.options.showEffectOptions.to = this.options.opacity;
    
      if (this.options.hideEffect == Effect.Fade)
        this.options.hideEffectOptions.from = this.options.opacity;
    }
    if (this.options.hideEffect == Element.hide)
      this.options.hideEffect = function(){ Element.hide(this.element); if (this.options.destroyOnClose) this.destroy(); }.bind(this)
    
    if (this.options.parent != document.body)  
      this.options.parent = $(this.options.parent);
      
    this.element = this._createWindow(id);       
    this.element.win = this;
    
    // Bind event listener
    this.eventMouseDown = this._initDrag.bindAsEventListener(this);
    this.eventMouseUp   = this._endDrag.bindAsEventListener(this);
    this.eventMouseMove = this._updateDrag.bindAsEventListener(this);
    this.eventOnLoad    = this._getWindowBorderSize.bindAsEventListener(this);
    this.eventMouseDownContent = this.toFront.bindAsEventListener(this);
    this.eventResize = this._recenter.bindAsEventListener(this);
    this.eventKeyUp = this._keyUp.bindAsEventListener(this);
 
    this.topbar = $(this.element.id + "_top");
    this.bottombar = $(this.element.id + "_bottom");
    this.content = $(this.element.id + "_content");
    
    Event.observe(this.topbar, "mousedown", this.eventMouseDown);
    Event.observe(this.bottombar, "mousedown", this.eventMouseDown);
    Event.observe(this.content, "mousedown", this.eventMouseDownContent);
    Event.observe(window, "load", this.eventOnLoad);
    Event.observe(window, "resize", this.eventResize);
    Event.observe(window, "scroll", this.eventResize);
    Event.observe(document, "keyup", this.eventKeyUp);
    Event.observe(this.options.parent, "scroll", this.eventResize);
    
    if (this.options.draggable)  {
      var that = this;
      [this.topbar, this.topbar.up().previous(), this.topbar.up().next()].each(function(element) {
        element.observe("mousedown", that.eventMouseDown);
        element.addClassName("top_draggable");
      });
      [this.bottombar.up(), this.bottombar.up().previous(), this.bottombar.up().next()].each(function(element) {
        element.observe("mousedown", that.eventMouseDown);
        element.addClassName("bottom_draggable");
      });
      
    }    
    
    if (this.options.resizable) {
      this.sizer = $(this.element.id + "_sizer");
      Event.observe(this.sizer, "mousedown", this.eventMouseDown);
    }  
    
    this.useLeft = null;
    this.useTop = null;
    if (typeof this.options.left != "undefined") {
      this.element.setStyle({left: parseFloat(this.options.left) + 'px'});
      this.useLeft = true;
    }
    else {
      this.element.setStyle({right: parseFloat(this.options.right) + 'px'});
      this.useLeft = false;
    }
    
    if (typeof this.options.top != "undefined") {
      this.element.setStyle({top: parseFloat(this.options.top) + 'px'});
      this.useTop = true;
    }
    else {
      this.element.setStyle({bottom: parseFloat(this.options.bottom) + 'px'});      
      this.useTop = false;
    }
      
    this.storedLocation = null;
    
    this.setOpacity(this.options.opacity);
    if (this.options.zIndex)
      this.setZIndex(this.options.zIndex)

    if (this.options.destroyOnClose)
      this.setDestroyOnClose(true);

    this._getWindowBorderSize();
    this.width = this.options.width;
    this.height = this.options.height;
    this.visible = false;
    
    this.constraint = false;
    this.constraintPad = {top: 0, left:0, bottom:0, right:0};
    
    if (this.width && this.height)
      this.setSize(this.options.width, this.options.height);
    this.setTitle(this.options.title)
    Windows.register(this);      
  },
  
  // Destructor
  destroy: function() {
    this._notify("onDestroy");
    Event.stopObserving(this.topbar, "mousedown", this.eventMouseDown);
    Event.stopObserving(this.bottombar, "mousedown", this.eventMouseDown);
    Event.stopObserving(this.content, "mousedown", this.eventMouseDownContent);
    
    Event.stopObserving(window, "load", this.eventOnLoad);
    Event.stopObserving(window, "resize", this.eventResize);
    Event.stopObserving(window, "scroll", this.eventResize);
    
    Event.stopObserving(this.content, "load", this.options.onload);
    Event.stopObserving(document, "keyup", this.eventKeyUp);

    if (this._oldParent) {
      var content = this.getContent();
      var originalContent = null;
      for(var i = 0; i < content.childNodes.length; i++) {
        originalContent = content.childNodes[i];
        if (originalContent.nodeType == 1) 
          break;
        originalContent = null;
      }
      if (originalContent)
        this._oldParent.appendChild(originalContent);
      this._oldParent = null;
    }

    if (this.sizer)
        Event.stopObserving(this.sizer, "mousedown", this.eventMouseDown);

    if (this.options.url) 
      this.content.src = null

     if(this.iefix) 
      Element.remove(this.iefix);

    Element.remove(this.element);
    Windows.unregister(this);      
  },
    
  // Sets close callback, if it sets, it should return true to be able to close the window.
  setCloseCallback: function(callback) {
    this.options.closeCallback = callback;
  },
  
  // Gets window content
  getContent: function () {
    return this.content;
  },
  
  // Sets the content with an element id
  setContent: function(id, autoresize, autoposition) {
    var element = $(id);
    if (null == element) throw "Unable to find element '" + id + "' in DOM";
    this._oldParent = element.parentNode;

    var d = null;
    var p = null;

    if (autoresize) 
      d = Element.getDimensions(element);
    if (autoposition) 
      p = Position.cumulativeOffset(element);

    var content = this.getContent();
    // Clear HTML (and even iframe)
    this.setHTMLContent("");
    content = this.getContent();
    
    content.appendChild(element);
    element.show();
    if (autoresize) 
      this.setSize(d.width, d.height);
    if (autoposition) 
      this.setLocation(p[1] - this.heightN, p[0] - this.widthW);    
  },
  
  setHTMLContent: function(html) {
    // It was an url (iframe), recreate a div content instead of iframe content
    if (this.options.url) {
      this.content.src = null;
      this.options.url = null;
      
  	  var content ="<div id=\"" + this.getId() + "_content\" class=\"" + this.options.className + "_content\"> </div>";
      $(this.getId() +"_table_content").innerHTML = content;
      
      this.content = $(this.element.id + "_content");
    }
      
    this.getContent().innerHTML = html;
  },
  
  setAjaxContent: function(url, options, showCentered, showModal) {
    this.showFunction = showCentered ? "showCenter" : "show";
    this.showModal = showModal || false;
  
    options = options || {};

    // Clear HTML (and even iframe)
    this.setHTMLContent("");
 
    this.onComplete = options.onComplete;
    if (! this._onCompleteHandler)
      this._onCompleteHandler = this._setAjaxContent.bind(this);
    options.onComplete = this._onCompleteHandler;

    new Ajax.Request(url, options);    
    options.onComplete = this.onComplete;
  },
  
  _setAjaxContent: function(originalRequest) {
    Element.update(this.getContent(), originalRequest.responseText);
    if (this.onComplete)
      this.onComplete(originalRequest);
    this.onComplete = null;
    this[this.showFunction](this.showModal)
  },
  
  setURL: function(url) {
    // Not an url content, change div to iframe
    if (this.options.url) 
      this.content.src = null;
    this.options.url = url;
    var content= "<iframe frameborder='0' name='" + this.getId() + "_content'  id='" + this.getId() + "_content' src='" + url + "' width='" + this.width + "' height='" + this.height + "'> </iframe>";
    $(this.getId() +"_table_content").innerHTML = content;
    
    this.content = $(this.element.id + "_content");
  },

  getURL: function() {
  	return this.options.url ? this.options.url : null;
  },

  refresh: function() {
    if (this.options.url)
	    $(this.element.getAttribute('id') + '_content').src = this.options.url;
  },
  
  // Stores position/size in a cookie, by default named with window id
  setCookie: function(name, expires, path, domain, secure) {
    name = name || this.element.id;
    this.cookie = [name, expires, path, domain, secure];
    
    // Get cookie
    var value = WindowUtilities.getCookie(name)
    // If exists
    if (value) {
      var values = value.split(',');
      var x = values[0].split(':');
      var y = values[1].split(':');

      var w = parseFloat(values[2]), h = parseFloat(values[3]);
      var mini = values[4];
      var maxi = values[5];

      this.setSize(w, h);
      if (mini == "true")
        this.doMinimize = true; // Minimize will be done at onload window event
      else if (maxi == "true")
        this.doMaximize = true; // Maximize will be done at onload window event

      this.useLeft = x[0] == "l";
      this.useTop = y[0] == "t";

      this.element.setStyle(this.useLeft ? {left: x[1]} : {right: x[1]});
      this.element.setStyle(this.useTop ? {top: y[1]} : {bottom: y[1]});
    }
  },
  
  // Gets window ID
  getId: function() {
    return this.element.id;
  },
  
  // Detroys itself when closing 
  setDestroyOnClose: function() {
    this.options.destroyOnClose = true;
  },
  
  setConstraint: function(bool, padding) {
    this.constraint = bool;
    this.constraintPad = Object.extend(this.constraintPad, padding || {});
    // Reset location to apply constraint
    if (this.useTop && this.useLeft)
      this.setLocation(parseFloat(this.element.style.top), parseFloat(this.element.style.left));
  },
  
  // initDrag event

  _initDrag: function(event) {
    // No resize on minimized window
    if (Event.element(event) == this.sizer && this.isMinimized())
      return;

    // No move on maximzed window
    if (Event.element(event) != this.sizer && this.isMaximized())
      return;
      
    if (Prototype.Browser.IE && this.heightN == 0)
      this._getWindowBorderSize();
    
    // Get pointer X,Y
    this.pointer = [this._round(Event.pointerX(event), this.options.gridX), this._round(Event.pointerY(event), this.options.gridY)];
    if (this.options.wiredDrag) 
      this.currentDrag = this._createWiredElement();
    else
      this.currentDrag = this.element;
      
    // Resize
    if (Event.element(event) == this.sizer) {
      this.doResize = true;
      this.widthOrg = this.width;
      this.heightOrg = this.height;
      this.bottomOrg = parseFloat(this.element.getStyle('bottom'));
      this.rightOrg = parseFloat(this.element.getStyle('right'));
      this._notify("onStartResize");
    }
    else {
      this.doResize = false;

      // Check if click on close button, 
      var closeButton = $(this.getId() + '_close');
      if (closeButton && Position.within(closeButton, this.pointer[0], this.pointer[1])) {
        this.currentDrag = null;
        return;
      }

      this.toFront();

      if (! this.options.draggable) 
        return;
      this._notify("onStartMove");
    }    
    // Register global event to capture mouseUp and mouseMove
    Event.observe(document, "mouseup", this.eventMouseUp, false);
    Event.observe(document, "mousemove", this.eventMouseMove, false);
    
    // Add an invisible div to keep catching mouse event over iframes
    WindowUtilities.disableScreen('__invisible__', '__invisible__', this.overlayOpacity);

    // Stop selection while dragging
    document.body.ondrag = function () { return false; };
    document.body.onselectstart = function () { return false; };
    
    this.currentDrag.show();
    Event.stop(event);
  },
  
  _round: function(val, round) {
    return round == 1 ? val  : val = Math.floor(val / round) * round;
  },

  // updateDrag event
  _updateDrag: function(event) {
    var pointer =  [this._round(Event.pointerX(event), this.options.gridX), this._round(Event.pointerY(event), this.options.gridY)];  
    var dx = pointer[0] - this.pointer[0];
    var dy = pointer[1] - this.pointer[1];
    
    // Resize case, update width/height
    if (this.doResize) {
      var w = this.widthOrg + dx;
      var h = this.heightOrg + dy;
      
      dx = this.width - this.widthOrg
      dy = this.height - this.heightOrg
      
      // Check if it's a right position, update it to keep upper-left corner at the same position
      if (this.useLeft) 
        w = this._updateWidthConstraint(w)
      else 
        this.currentDrag.setStyle({right: (this.rightOrg -dx) + 'px'});
      // Check if it's a bottom position, update it to keep upper-left corner at the same position
      if (this.useTop) 
        h = this._updateHeightConstraint(h)
      else
        this.currentDrag.setStyle({bottom: (this.bottomOrg -dy) + 'px'});
        
      this.setSize(w , h);
      this._notify("onResize");
    }
    // Move case, update top/left
    else {
      this.pointer = pointer;
      
      if (this.useLeft) {
        var left =  parseFloat(this.currentDrag.getStyle('left')) + dx;
        var newLeft = this._updateLeftConstraint(left);
        // Keep mouse pointer correct
        this.pointer[0] += newLeft-left;
        this.currentDrag.setStyle({left: newLeft + 'px'});
      }
      else 
        this.currentDrag.setStyle({right: parseFloat(this.currentDrag.getStyle('right')) - dx + 'px'});
      
      if (this.useTop) {
        var top =  parseFloat(this.currentDrag.getStyle('top')) + dy;
        var newTop = this._updateTopConstraint(top);
        // Keep mouse pointer correct
        this.pointer[1] += newTop - top;
        this.currentDrag.setStyle({top: newTop + 'px'});
      }
      else 
        this.currentDrag.setStyle({bottom: parseFloat(this.currentDrag.getStyle('bottom')) - dy + 'px'});

      this._notify("onMove");
    }
    if (this.iefix) 
      this._fixIEOverlapping(); 
      
    this._removeStoreLocation();
    Event.stop(event);
  },

   // endDrag callback
   _endDrag: function(event) {
    // Remove temporary div over iframes
     WindowUtilities.enableScreen('__invisible__');
    
    if (this.doResize)
      this._notify("onEndResize");
    else
      this._notify("onEndMove");
    
    // Release event observing
    Event.stopObserving(document, "mouseup", this.eventMouseUp,false);
    Event.stopObserving(document, "mousemove", this.eventMouseMove, false);

    Event.stop(event);
    
    this._hideWiredElement();

    // Store new location/size if need be
    this._saveCookie()
      
    // Restore selection
    document.body.ondrag = null;
    document.body.onselectstart = null;
  },

  _updateLeftConstraint: function(left) {
    if (this.constraint && this.useLeft && this.useTop) {
      var width = this.options.parent == document.body ? WindowUtilities.getPageSize().windowWidth : this.options.parent.getDimensions().width;

      if (left < this.constraintPad.left)
        left = this.constraintPad.left;
      if (left + this.width + this.widthE + this.widthW > width - this.constraintPad.right) 
        left = width - this.constraintPad.right - this.width - this.widthE - this.widthW;
    }
    return left;
  },
  
  _updateTopConstraint: function(top) {
    if (this.constraint && this.useLeft && this.useTop) {        
      var height = this.options.parent == document.body ? WindowUtilities.getPageSize().windowHeight : this.options.parent.getDimensions().height;
      
      var h = this.height + this.heightN + this.heightS;

      if (top < this.constraintPad.top)
        top = this.constraintPad.top;
      if (top + h > height - this.constraintPad.bottom) 
        top = height - this.constraintPad.bottom - h;
    }
    return top;
  },
  
  _updateWidthConstraint: function(w) {
    if (this.constraint && this.useLeft && this.useTop) {
      var width = this.options.parent == document.body ? WindowUtilities.getPageSize().windowWidth : this.options.parent.getDimensions().width;
      var left =  parseFloat(this.element.getStyle("left"));

      if (left + w + this.widthE + this.widthW > width - this.constraintPad.right) 
        w = width - this.constraintPad.right - left - this.widthE - this.widthW;
    }
    return w;
  },
  
  _updateHeightConstraint: function(h) {
    if (this.constraint && this.useLeft && this.useTop) {
      var height = this.options.parent == document.body ? WindowUtilities.getPageSize().windowHeight : this.options.parent.getDimensions().height;
      var top =  parseFloat(this.element.getStyle("top"));

      if (top + h + this.heightN + this.heightS > height - this.constraintPad.bottom) 
        h = height - this.constraintPad.bottom - top - this.heightN - this.heightS;
    }
    return h;
  },
  
  
  // Creates HTML window code
  _createWindow: function(id) {
    var className = this.options.className;
    var win = document.createElement("div");
    win.setAttribute('id', id);
    win.className = "dialog";
    if (this.options.windowClassName) {
      win.className += ' ' + this.options.windowClassName;
    }

    var content;
    if (this.options.url)
      content= "<iframe frameborder=\"0\" name=\"" + id + "_content\"  id=\"" + id + "_content\" src=\"" + this.options.url + "\"> </iframe>";
    else
      content ="<div id=\"" + id + "_content\" class=\"" +className + "_content\"> </div>";

    var closeDiv = this.options.closable ? "<div class='"+ className +"_close' id='"+ id +"_close' onclick='Windows.close(\""+ id +"\", event)'> </div>" : "";
    var minDiv = this.options.minimizable ? "<div class='"+ className + "_minimize' id='"+ id +"_minimize' onclick='Windows.minimize(\""+ id +"\", event)'> </div>" : "";
    var maxDiv = this.options.maximizable ? "<div class='"+ className + "_maximize' id='"+ id +"_maximize' onclick='Windows.maximize(\""+ id +"\", event)'> </div>" : "";
    var seAttributes = this.options.resizable ? "class='" + className + "_sizer' id='" + id + "_sizer'" : "class='"  + className + "_se'";
    var blank = "../themes/default/blank.gif";
    
    win.innerHTML = closeDiv + minDiv + maxDiv + "\
      <a href='#' id='"+ id +"_focus_anchor'><!-- --></a>\
      <table id='"+ id +"_row1' class=\"top table_window\">\
        <tr>\
          <td class='"+ className +"_nw'></td>\
          <td class='"+ className +"_n'><div id='"+ id +"_top' class='"+ className +"_title title_window'>"+ this.options.title +"</div></td>\
          <td class='"+ className +"_ne'></td>\
        </tr>\
      </table>\
      <table id='"+ id +"_row2' class=\"mid table_window\">\
        <tr>\
          <td class='"+ className +"_w'></td>\
            <td id='"+ id +"_table_content' class='"+ className +"_content' valign='top'>" + content + "</td>\
          <td class='"+ className +"_e'></td>\
        </tr>\
      </table>\
        <table id='"+ id +"_row3' class=\"bot table_window\">\
        <tr>\
          <td class='"+ className +"_sw'></td>\
            <td class='"+ className +"_s'><div id='"+ id +"_bottom' class='status_bar'><span style='float:left; width:1px; height:1px'></span></div></td>\
            <td " + seAttributes + "></td>\
        </tr>\
      </table>\
    ";
    Element.hide(win);
    this.options.parent.insertBefore(win, this.options.parent.firstChild);
    Event.observe($(id + "_content"), "load", this.options.onload);
    return win;
  },
  
  
  changeClassName: function(newClassName) {    
    var className = this.options.className;
    var id = this.getId();
    $A(["_close", "_minimize", "_maximize", "_sizer", "_content"]).each(function(value) { this._toggleClassName($(id + value), className + value, newClassName + value) }.bind(this));
    this._toggleClassName($(id + "_top"), className + "_title", newClassName + "_title");
    $$("#" + id + " td").each(function(td) {td.className = td.className.sub(className,newClassName); });
    this.options.className = newClassName;
  },
  
  _toggleClassName: function(element, oldClassName, newClassName) { 
    if (element) {
      element.removeClassName(oldClassName);
      element.addClassName(newClassName);
    }
  },
  
  // Sets window location
  setLocation: function(top, left) {
    top = this._updateTopConstraint(top);
    left = this._updateLeftConstraint(left);

    var e = this.currentDrag || this.element;
    e.setStyle({top: top + 'px'});
    e.setStyle({left: left + 'px'});

    this.useLeft = true;
    this.useTop = true;
  },
    
  getLocation: function() {
    var location = {};
    if (this.useTop)
      location = Object.extend(location, {top: this.element.getStyle("top")});
    else
      location = Object.extend(location, {bottom: this.element.getStyle("bottom")});
    if (this.useLeft)
      location = Object.extend(location, {left: this.element.getStyle("left")});
    else
      location = Object.extend(location, {right: this.element.getStyle("right")});
    
    return location;
  },
  
  // Gets window size
  getSize: function() {
    return {width: this.width, height: this.height};
  },
    
  // Sets window size
  setSize: function(width, height, useEffect) {    
    width = parseFloat(width);
    height = parseFloat(height);
    
    // Check min and max size
    if (!this.minimized && width < this.options.minWidth)
      width = this.options.minWidth;

    if (!this.minimized && height < this.options.minHeight)
      height = this.options.minHeight;
      
    if (this.options. maxHeight && height > this.options. maxHeight)
      height = this.options. maxHeight;

    if (this.options. maxWidth && width > this.options. maxWidth)
      width = this.options. maxWidth;

    
    if (this.useTop && this.useLeft && Window.hasEffectLib && Effect.ResizeWindow && useEffect) {
      new Effect.ResizeWindow(this, null, null, width, height, {duration: Window.resizeEffectDuration});
    } else {
      this.width = width;
      this.height = height;
      var e = this.currentDrag ? this.currentDrag : this.element;

      e.setStyle({width: width + this.widthW + this.widthE + "px"})
      e.setStyle({height: height  + this.heightN + this.heightS + "px"})

      // Update content size
      if (!this.currentDrag || this.currentDrag == this.element) {
        var content = $(this.element.id + '_content');
        content.setStyle({height: height  + 'px'});
        content.setStyle({width: width  + 'px'});
      }
    }
  },
  
  updateHeight: function() {
    this.setSize(this.width, this.content.scrollHeight, true);
  },
  
  updateWidth: function() {
    this.setSize(this.content.scrollWidth, this.height, true);
  },
  
  // Brings window to front
  toFront: function() {
    if (this.element.style.zIndex < Windows.maxZIndex)  
      this.setZIndex(Windows.maxZIndex + 1);
    if (this.iefix) 
      this._fixIEOverlapping(); 
  },
   
  getBounds: function(insideOnly) {
    if (! this.width || !this.height || !this.visible)  
      this.computeBounds();
    var w = this.width;
    var h = this.height;

    if (!insideOnly) {
      w += this.widthW + this.widthE;
      h += this.heightN + this.heightS;
    }
    var bounds = Object.extend(this.getLocation(), {width: w + "px", height: h + "px"});
    return bounds;
  },
      
  computeBounds: function() {
     if (! this.width || !this.height) {
      var size = WindowUtilities._computeSize(this.content.innerHTML, this.content.id, this.width, this.height, 0, this.options.className)
      if (this.height)
        this.width = size + 5
      else
        this.height = size + 5
    }

    this.setSize(this.width, this.height);
    if (this.centered)
      this._center(this.centerTop, this.centerLeft);    
  },
  
  // Displays window modal state or not
  show: function(modal) {
    this.visible = true;
    if (modal) {
      // Hack for Safari !!
      if (typeof this.overlayOpacity == "undefined") {
        var that = this;
        setTimeout(function() {that.show(modal)}, 10);
        return;
      }
      Windows.addModalWindow(this);
      
      this.modal = true;      
      this.setZIndex(Windows.maxZIndex + 1);
      Windows.unsetOverflow(this);
    }
    else    
      if (!this.element.style.zIndex) 
        this.setZIndex(Windows.maxZIndex + 1);        
      
    // To restore overflow if need be
    if (this.oldStyle)
      this.getContent().setStyle({overflow: this.oldStyle});
      
    this.computeBounds();
    
    this._notify("onBeforeShow");   
    if (this.options.showEffect != Element.show && this.options.showEffectOptions)
      this.options.showEffect(this.element, this.options.showEffectOptions);  
    else
      this.options.showEffect(this.element);  
      
    this._checkIEOverlapping();
    WindowUtilities.focusedWindow = this
    this._notify("onShow");   
    $(this.element.id + '_focus_anchor').focus();
  },
  
  // Displays window modal state or not at the center of the page
  showCenter: function(modal, top, left) {
    this.centered = true;
    this.centerTop = top;
    this.centerLeft = left;

    this.show(modal);
  },
  
  isVisible: function() {
    return this.visible;
  },
  
  _center: function(top, left) {    
    var windowScroll = WindowUtilities.getWindowScroll(this.options.parent);    
    var pageSize = WindowUtilities.getPageSize(this.options.parent);    
    if (typeof top == "undefined")
      top = (pageSize.windowHeight - (this.height + this.heightN + this.heightS))/2;
    top += windowScroll.top
    
    if (typeof left == "undefined")
      left = (pageSize.windowWidth - (this.width + this.widthW + this.widthE))/2;
    left += windowScroll.left      
    this.setLocation(top, left);
    this.toFront();
  },
  
  _recenter: function(event) {     
    if (this.centered) {
      var pageSize = WindowUtilities.getPageSize(this.options.parent);
      var windowScroll = WindowUtilities.getWindowScroll(this.options.parent);    

      // Check for this stupid IE that sends dumb events
      if (this.pageSize && this.pageSize.windowWidth == pageSize.windowWidth && this.pageSize.windowHeight == pageSize.windowHeight && 
          this.windowScroll.left == windowScroll.left && this.windowScroll.top == windowScroll.top) 
        return;
      this.pageSize = pageSize;
      this.windowScroll = windowScroll;
      // set height of Overlay to take up whole page and show
      if ($('overlay_modal')) 
        $('overlay_modal').setStyle({height: (pageSize.pageHeight + 'px')});
      
      if (this.options.recenterAuto)
        this._center(this.centerTop, this.centerLeft);    
    }
  },
  
  // Hides window
  hide: function() {
    this.visible = false;
    if (this.modal) {
      Windows.removeModalWindow(this);
      Windows.resetOverflow();
    }
    // To avoid bug on scrolling bar
    this.oldStyle = this.getContent().getStyle('overflow') || "auto"
    this.getContent().setStyle({overflow: "hidden"});

    this.options.hideEffect(this.element, this.options.hideEffectOptions);  

     if(this.iefix) 
      this.iefix.hide();

    if (!this.doNotNotifyHide)
      this._notify("onHide");
  },

  close: function() {
    // Asks closeCallback if exists
    if (this.visible) {
      if (this.options.closeCallback && ! this.options.closeCallback(this)) 
        return;

      if (this.options.destroyOnClose) {
        var destroyFunc = this.destroy.bind(this);
        if (this.options.hideEffectOptions.afterFinish) {
          var func = this.options.hideEffectOptions.afterFinish;
          this.options.hideEffectOptions.afterFinish = function() {func();destroyFunc() }
        }
        else 
          this.options.hideEffectOptions.afterFinish = function() {destroyFunc() }
      }
      Windows.updateFocusedWindow();
      
      this.doNotNotifyHide = true;
      this.hide();
      this.doNotNotifyHide = false;
      this._notify("onClose");
    }
  },
  
  minimize: function() {
    if (this.resizing)
      return;
    
    var r2 = $(this.getId() + "_row2");
    
    if (!this.minimized) {
      this.minimized = true;

      var dh = r2.getDimensions().height;
      this.r2Height = dh;
      var h  = this.element.getHeight() - dh;

      if (this.useLeft && this.useTop && Window.hasEffectLib && Effect.ResizeWindow) {
        new Effect.ResizeWindow(this, null, null, null, this.height -dh, {duration: Window.resizeEffectDuration});
      } else  {
        this.height -= dh;
        this.element.setStyle({height: h + "px"});
        r2.hide();
      }

      if (! this.useTop) {
        var bottom = parseFloat(this.element.getStyle('bottom'));
        this.element.setStyle({bottom: (bottom + dh) + 'px'});
      }
    } 
    else {      
      this.minimized = false;
      
      var dh = this.r2Height;
      this.r2Height = null;
      if (this.useLeft && this.useTop && Window.hasEffectLib && Effect.ResizeWindow) {
        new Effect.ResizeWindow(this, null, null, null, this.height + dh, {duration: Window.resizeEffectDuration});
      }
      else {
        var h  = this.element.getHeight() + dh;
        this.height += dh;
        this.element.setStyle({height: h + "px"})
        r2.show();
      }
      if (! this.useTop) {
        var bottom = parseFloat(this.element.getStyle('bottom'));
        this.element.setStyle({bottom: (bottom - dh) + 'px'});
      }
      this.toFront();
    }
    this._notify("onMinimize");
    
    // Store new location/size if need be
    this._saveCookie()
  },
  
  maximize: function() {
    if (this.isMinimized() || this.resizing)
      return;
  
    if (Prototype.Browser.IE && this.heightN == 0)
      this._getWindowBorderSize();
      
    if (this.storedLocation != null) {
      this._restoreLocation();
      if(this.iefix) 
        this.iefix.hide();
    }
    else {
      this._storeLocation();
      Windows.unsetOverflow(this);
      
      var windowScroll = WindowUtilities.getWindowScroll(this.options.parent);
      var pageSize = WindowUtilities.getPageSize(this.options.parent);    
      var left = windowScroll.left;
      var top = windowScroll.top;
      
      if (this.options.parent != document.body) {
        windowScroll =  {top:0, left:0, bottom:0, right:0};
        var dim = this.options.parent.getDimensions();
        pageSize.windowWidth = dim.width;
        pageSize.windowHeight = dim.height;
        top = 0; 
        left = 0;
      }
      
      if (this.constraint) {
        pageSize.windowWidth -= Math.max(0, this.constraintPad.left) + Math.max(0, this.constraintPad.right);
        pageSize.windowHeight -= Math.max(0, this.constraintPad.top) + Math.max(0, this.constraintPad.bottom);
        left +=  Math.max(0, this.constraintPad.left);
        top +=  Math.max(0, this.constraintPad.top);
      }
      
      var width = pageSize.windowWidth - this.widthW - this.widthE;
      var height= pageSize.windowHeight - this.heightN - this.heightS;

      if (this.useLeft && this.useTop && Window.hasEffectLib && Effect.ResizeWindow) {
        new Effect.ResizeWindow(this, top, left, width, height, {duration: Window.resizeEffectDuration});
      }
      else {
        this.setSize(width, height);
        this.element.setStyle(this.useLeft ? {left: left} : {right: left});
        this.element.setStyle(this.useTop ? {top: top} : {bottom: top});
      }
        
      this.toFront();
      if (this.iefix) 
        this._fixIEOverlapping(); 
    }
    this._notify("onMaximize");

    // Store new location/size if need be
    this._saveCookie()
  },
  
  isMinimized: function() {
    return this.minimized;
  },
  
  isMaximized: function() {
    return (this.storedLocation != null);
  },
  
  setOpacity: function(opacity) {
    if (Element.setOpacity)
      Element.setOpacity(this.element, opacity);
  },
  
  setZIndex: function(zindex) {
    this.element.setStyle({zIndex: zindex});
    Windows.updateZindex(zindex, this);
  },

  setTitle: function(newTitle) {
    if (!newTitle || newTitle == "") 
      newTitle = "&nbsp;";
      
    Element.update(this.element.id + '_top', newTitle);
  },
   
  getTitle: function() {
    return $(this.element.id + '_top').innerHTML;
  },
  
  setStatusBar: function(element) {
    var statusBar = $(this.getId() + "_bottom");

    if (typeof(element) == "object") {
      if (this.bottombar.firstChild)
        this.bottombar.replaceChild(element, this.bottombar.firstChild);
      else
        this.bottombar.appendChild(element);
    }
    else
      this.bottombar.innerHTML = element;
  },

  _checkIEOverlapping: function() {
    if(!this.iefix && (navigator.appVersion.indexOf('MSIE')>0) && (navigator.userAgent.indexOf('Opera')<0) && (this.element.getStyle('position')=='absolute')) {
        new Insertion.After(this.element.id, '<iframe id="' + this.element.id + '_iefix" '+ 'style="display:none;position:absolute;filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0);" ' + 'src="javascript:false;" frameborder="0" scrolling="no"></iframe>');
        this.iefix = $(this.element.id+'_iefix');
    }
    if(this.iefix) 
      setTimeout(this._fixIEOverlapping.bind(this), 50);
  },

  _fixIEOverlapping: function() {
      Position.clone(this.element, this.iefix);
      this.iefix.style.zIndex = this.element.style.zIndex - 1;
      this.iefix.show();
  },
  
  _keyUp: function(event) {
      if (27 == event.keyCode && this.options.closeOnEsc) {
          this.close();
      }
  },

  _getWindowBorderSize: function(event) {
    // Hack to get real window border size!!
    var div = this._createHiddenDiv(this.options.className + "_n")
    this.heightN = Element.getDimensions(div).height;    
    div.parentNode.removeChild(div)

    var div = this._createHiddenDiv(this.options.className + "_s")
    this.heightS = Element.getDimensions(div).height;    
    div.parentNode.removeChild(div)

    var div = this._createHiddenDiv(this.options.className + "_e")
    this.widthE = Element.getDimensions(div).width;    
    div.parentNode.removeChild(div)

    var div = this._createHiddenDiv(this.options.className + "_w")
    this.widthW = Element.getDimensions(div).width;
    div.parentNode.removeChild(div);
    
    var div = document.createElement("div");
    div.className = "overlay_" + this.options.className ;
    document.body.appendChild(div);
    //alert("no timeout:\nopacity: " + div.getStyle("opacity") + "\nwidth: " + document.defaultView.getComputedStyle(div, null).width);
    var that = this;
    
    // Workaround for Safari!!
    setTimeout(function() {that.overlayOpacity = ($(div).getStyle("opacity")); div.parentNode.removeChild(div);}, 10);
    
    // Workaround for IE!!
    if (Prototype.Browser.IE) {
      this.heightS = $(this.getId() +"_row3").getDimensions().height;
      this.heightN = $(this.getId() +"_row1").getDimensions().height;
    }

    // Safari size fix
    if (Prototype.Browser.WebKit && Prototype.Browser.WebKitVersion < 420)
      this.setSize(this.width, this.height);
    if (this.doMaximize)
      this.maximize();
    if (this.doMinimize)
      this.minimize();
  },
 
  _createHiddenDiv: function(className) {
    var objBody = document.body;
    var win = document.createElement("div");
    win.setAttribute('id', this.element.id+ "_tmp");
    win.className = className;
    win.style.display = 'none';
    win.innerHTML = '';
    objBody.insertBefore(win, objBody.firstChild);
    return win;
  },
  
  _storeLocation: function() {
    if (this.storedLocation == null) {
      this.storedLocation = {useTop: this.useTop, useLeft: this.useLeft, 
                             top: this.element.getStyle('top'), bottom: this.element.getStyle('bottom'),
                             left: this.element.getStyle('left'), right: this.element.getStyle('right'),
                             width: this.width, height: this.height };
    }
  },
  
  _restoreLocation: function() {
    if (this.storedLocation != null) {
      this.useLeft = this.storedLocation.useLeft;
      this.useTop = this.storedLocation.useTop;
      
      if (this.useLeft && this.useTop && Window.hasEffectLib && Effect.ResizeWindow)
        new Effect.ResizeWindow(this, this.storedLocation.top, this.storedLocation.left, this.storedLocation.width, this.storedLocation.height, {duration: Window.resizeEffectDuration});
      else {
        this.element.setStyle(this.useLeft ? {left: this.storedLocation.left} : {right: this.storedLocation.right});
        this.element.setStyle(this.useTop ? {top: this.storedLocation.top} : {bottom: this.storedLocation.bottom});
        this.setSize(this.storedLocation.width, this.storedLocation.height);
      }
      
      Windows.resetOverflow();
      this._removeStoreLocation();
    }
  },
  
  _removeStoreLocation: function() {
    this.storedLocation = null;
  },
  
  _saveCookie: function() {
    if (this.cookie) {
      var value = "";
      if (this.useLeft)
        value += "l:" +  (this.storedLocation ? this.storedLocation.left : this.element.getStyle('left'))
      else
        value += "r:" + (this.storedLocation ? this.storedLocation.right : this.element.getStyle('right'))
      if (this.useTop)
        value += ",t:" + (this.storedLocation ? this.storedLocation.top : this.element.getStyle('top'))
      else
        value += ",b:" + (this.storedLocation ? this.storedLocation.bottom :this.element.getStyle('bottom'))
        
      value += "," + (this.storedLocation ? this.storedLocation.width : this.width);
      value += "," + (this.storedLocation ? this.storedLocation.height : this.height);
      value += "," + this.isMinimized();
      value += "," + this.isMaximized();
      WindowUtilities.setCookie(value, this.cookie)
    }
  },
  
  _createWiredElement: function() {
    if (! this.wiredElement) {
      if (Prototype.Browser.IE)
        this._getWindowBorderSize();
      var div = document.createElement("div");
      div.className = "wired_frame " + this.options.className + "_wired_frame";
      
      div.style.position = 'absolute';
      this.options.parent.insertBefore(div, this.options.parent.firstChild);
      this.wiredElement = $(div);
    }
    if (this.useLeft) 
      this.wiredElement.setStyle({left: this.element.getStyle('left')});
    else 
      this.wiredElement.setStyle({right: this.element.getStyle('right')});
      
    if (this.useTop) 
      this.wiredElement.setStyle({top: this.element.getStyle('top')});
    else 
      this.wiredElement.setStyle({bottom: this.element.getStyle('bottom')});

    var dim = this.element.getDimensions();
    this.wiredElement.setStyle({width: dim.width + "px", height: dim.height +"px"});

    this.wiredElement.setStyle({zIndex: Windows.maxZIndex+30});
    return this.wiredElement;
  },
  
  _hideWiredElement: function() {
    if (! this.wiredElement || ! this.currentDrag)
      return;
    if (this.currentDrag == this.element) 
      this.currentDrag = null;
    else {
      if (this.useLeft) 
        this.element.setStyle({left: this.currentDrag.getStyle('left')});
      else 
        this.element.setStyle({right: this.currentDrag.getStyle('right')});

      if (this.useTop) 
        this.element.setStyle({top: this.currentDrag.getStyle('top')});
      else 
        this.element.setStyle({bottom: this.currentDrag.getStyle('bottom')});

      this.currentDrag.hide();
      this.currentDrag = null;
      if (this.doResize)
        this.setSize(this.width, this.height);
    } 
  },
  
  _notify: function(eventName) {
    if (this.options[eventName])
      this.options[eventName](this);
    else
      Windows.notify(eventName, this);
  }
};

// Windows containers, register all page windows
var Windows = {
  windows: [],
  modalWindows: [],
  observers: [],
  focusedWindow: null,
  maxZIndex: 0,
  overlayShowEffectOptions: {duration: 0.5},
  overlayHideEffectOptions: {duration: 0.5},

  addObserver: function(observer) {
    this.removeObserver(observer);
    this.observers.push(observer);
  },
  
  removeObserver: function(observer) {  
    this.observers = this.observers.reject( function(o) { return o==observer });
  },
  
  // onDestroy onStartResize onStartMove onResize onMove onEndResize onEndMove onFocus onBlur onBeforeShow onShow onHide onMinimize onMaximize onClose
  notify: function(eventName, win) {  
    this.observers.each( function(o) {if(o[eventName]) o[eventName](eventName, win);});
  },

  // Gets window from its id
  getWindow: function(id) {
    return this.windows.detect(function(d) { return d.getId() ==id });
  },

  // Gets the last focused window
  getFocusedWindow: function() {
    return this.focusedWindow;
  },

  updateFocusedWindow: function() {
    this.focusedWindow = this.windows.length >=2 ? this.windows[this.windows.length-2] : null;    
  },
  
  // Registers a new window (called by Windows constructor)
  register: function(win) {
    this.windows.push(win);
  },
    
  // Add a modal window in the stack
  addModalWindow: function(win) {
    // Disable screen if first modal window
    if (this.modalWindows.length == 0) {
      WindowUtilities.disableScreen(win.options.className, 'overlay_modal', win.overlayOpacity, win.getId(), win.options.parent);
    }
    else {
      // Move overlay over all windows
      if (Window.keepMultiModalWindow) {
        $('overlay_modal').style.zIndex = Windows.maxZIndex + 1;
        Windows.maxZIndex += 1;
        WindowUtilities._hideSelect(this.modalWindows.last().getId());
      }
      // Hide current modal window
      else
        this.modalWindows.last().element.hide();
      // Fucking IE select issue
      WindowUtilities._showSelect(win.getId());
    }      
    this.modalWindows.push(win);    
  },
  
  removeModalWindow: function(win) {
    this.modalWindows.pop();
    
    // No more modal windows
    if (this.modalWindows.length == 0)
      WindowUtilities.enableScreen();     
    else {
      if (Window.keepMultiModalWindow) {
        this.modalWindows.last().toFront();
        WindowUtilities._showSelect(this.modalWindows.last().getId());        
      }
      else
        this.modalWindows.last().element.show();
    }
  },
  
  // Registers a new window (called by Windows constructor)
  register: function(win) {
    this.windows.push(win);
  },
  
  // Unregisters a window (called by Windows destructor)
  unregister: function(win) {
    this.windows = this.windows.reject(function(d) { return d==win });
  }, 
  
  // Closes all windows
  closeAll: function() {  
    this.windows.each( function(w) {Windows.close(w.getId())} );
  },
  
  closeAllModalWindows: function() {
    WindowUtilities.enableScreen();     
    this.modalWindows.each( function(win) {if (win) win.close()});    
  },

  // Minimizes a window with its id
  minimize: function(id, event) {
    var win = this.getWindow(id)
    if (win && win.visible)
      win.minimize();
    Event.stop(event);
  },
  
  // Maximizes a window with its id
  maximize: function(id, event) {
    var win = this.getWindow(id)
    if (win && win.visible)
      win.maximize();
    Event.stop(event);
  },

  // Closes a window with its id
  close: function(id, event) {
    var win = this.getWindow(id);
    if (win) 
      win.close();
    if (event)
      Event.stop(event);
  },
  
  blur: function(id) {
    var win = this.getWindow(id);  
    if (!win)
      return;
    if (win.options.blurClassName)
      win.changeClassName(win.options.blurClassName);
    if (this.focusedWindow == win)  
      this.focusedWindow = null;
    win._notify("onBlur");  
  },
  
  focus: function(id) {
    var win = this.getWindow(id);  
    if (!win)
      return;       
    if (this.focusedWindow)
      this.blur(this.focusedWindow.getId())

    if (win.options.focusClassName)
      win.changeClassName(win.options.focusClassName);  
    this.focusedWindow = win;
    win._notify("onFocus");
  },
  
  unsetOverflow: function(except) {    
    this.windows.each(function(d) { d.oldOverflow = d.getContent().getStyle("overflow") || "auto" ; d.getContent().setStyle({overflow: "hidden"}) });
    if (except && except.oldOverflow)
      except.getContent().setStyle({overflow: except.oldOverflow});
  },

  resetOverflow: function() {
    this.windows.each(function(d) { if (d.oldOverflow) d.getContent().setStyle({overflow: d.oldOverflow}) });
  },

  updateZindex: function(zindex, win) { 
    if (zindex > this.maxZIndex) {   
      this.maxZIndex = zindex;    
      if (this.focusedWindow) 
        this.blur(this.focusedWindow.getId())
    }
    this.focusedWindow = win;
    if (this.focusedWindow) 
      this.focus(this.focusedWindow.getId())
  }
};

var Dialog = {
  dialogId: null,
  onCompleteFunc: null,
  callFunc: null, 
  parameters: null, 
    
  confirm: function(content, parameters) {
    // Get Ajax return before
    if (content && typeof content != "string") {
      Dialog._runAjaxRequest(content, parameters, Dialog.confirm);
      return 
    }
    content = content || "";
    
    parameters = parameters || {};
    var okLabel = parameters.okLabel ? parameters.okLabel : "Ok";
    var cancelLabel = parameters.cancelLabel ? parameters.cancelLabel : "Cancel";

    // Backward compatibility
    parameters = Object.extend(parameters, parameters.windowParameters || {});
    parameters.windowParameters = parameters.windowParameters || {};

    parameters.className = parameters.className || "alert";

    var okButtonClass = "class ='" + (parameters.buttonClass ? parameters.buttonClass + " " : "") + " ok_button'" 
    var cancelButtonClass = "class ='" + (parameters.buttonClass ? parameters.buttonClass + " " : "") + " cancel_button'" 
/*     var content = "\
      <div class='" + parameters.className + "_message'>" + content  + "</div>\
        <div class='" + parameters.className + "_buttons'>\
          <input type='button' value='" + okLabel + "' onclick='Dialog.okCallback()' " + okButtonClass + "/>\
          <input type='button' value='" + cancelLabel + "' onclick='Dialog.cancelCallback()' " + cancelButtonClass + "/>\
        </div>\
    "; */
    var content = "\
      <div class='" + parameters.className + "_message'>" + content  + "</div>\
        <div class='" + parameters.className + "_buttons'>\
          <button type='button' title='" + okLabel + "' onclick='Dialog.okCallback()' " + okButtonClass + "><span><span><span>" + okLabel + "</span></span></span></button>\
          <button type='button' title='" + cancelLabel + "' onclick='Dialog.cancelCallback()' " + cancelButtonClass + "><span><span><span>" + cancelLabel + "</span></span></span></button>\
        </div>\
    ";
    return this._openDialog(content, parameters)
  },
  
  alert: function(content, parameters) {
    // Get Ajax return before
    if (content && typeof content != "string") {
      Dialog._runAjaxRequest(content, parameters, Dialog.alert);
      return 
    }
    content = content || "";
    
    parameters = parameters || {};
    var okLabel = parameters.okLabel ? parameters.okLabel : "Ok";

    // Backward compatibility    
    parameters = Object.extend(parameters, parameters.windowParameters || {});
    parameters.windowParameters = parameters.windowParameters || {};
    
    parameters.className = parameters.className || "alert";
    
    var okButtonClass = "class ='" + (parameters.buttonClass ? parameters.buttonClass + " " : "") + " ok_button'" 
/*     var content = "\
      <div class='" + parameters.className + "_message'>" + content  + "</div>\
        <div class='" + parameters.className + "_buttons'>\
          <input type='button' value='" + okLabel + "' onclick='Dialog.okCallback()' " + okButtonClass + "/>\
        </div>";   */
    var content = "\
      <div class='" + parameters.className + "_message'>" + content  + "</div>\
        <div class='" + parameters.className + "_buttons'>\
          <button type='button' title='" + okLabel + "' onclick='Dialog.okCallback()' " + okButtonClass + "><span><span><span>" + okLabel + "</span></span></span></button>\
        </div>";                  
    return this._openDialog(content, parameters)
  },
  
  info: function(content, parameters) {
    // Get Ajax return before
    if (content && typeof content != "string") {
      Dialog._runAjaxRequest(content, parameters, Dialog.info);
      return 
    }
    content = content || "";
     
    // Backward compatibility
    parameters = parameters || {};
    parameters = Object.extend(parameters, parameters.windowParameters || {});
    parameters.windowParameters = parameters.windowParameters || {};
    
    parameters.className = parameters.className || "alert";
    
    var content = "<div id='modal_dialog_message' class='" + parameters.className + "_message'>" + content  + "</div>";
    if (parameters.showProgress)
      content += "<div id='modal_dialog_progress' class='" + parameters.className + "_progress'>  </div>";

    parameters.ok = null;
    parameters.cancel = null;
    
    return this._openDialog(content, parameters)
  },
  
  setInfoMessage: function(message) {
    $('modal_dialog_message').update(message);
  },
  
  closeInfo: function() {
    Windows.close(this.dialogId);
  },
  
  _openDialog: function(content, parameters) {
    var className = parameters.className;
    
    if (! parameters.height && ! parameters.width) {
      parameters.width = WindowUtilities.getPageSize(parameters.options.parent || document.body).pageWidth / 2;
    }
    if (parameters.id)
      this.dialogId = parameters.id;
    else { 
      var t = new Date();
      this.dialogId = 'modal_dialog_' + t.getTime();
      parameters.id = this.dialogId;
    }

    // compute height or width if need be
    if (! parameters.height || ! parameters.width) {
      var size = WindowUtilities._computeSize(content, this.dialogId, parameters.width, parameters.height, 5, className)
      if (parameters.height)
        parameters.width = size + 5
      else
        parameters.height = size + 5
    }
    parameters.effectOptions = parameters.effectOptions ;
    parameters.resizable   = parameters.resizable || false;
    parameters.minimizable = parameters.minimizable || false;
    parameters.maximizable = parameters.maximizable ||  false;
    parameters.draggable   = parameters.draggable || false;
    parameters.closable    = parameters.closable || false;

    var win = new Window(parameters);
    win.getContent().innerHTML = content;
    
    win.showCenter(true, parameters.top, parameters.left);  
    win.setDestroyOnClose();
    
    win.cancelCallback = parameters.onCancel || parameters.cancel; 
    win.okCallback = parameters.onOk || parameters.ok;
    
    return win;    
  },
  
  _getAjaxContent: function(originalRequest)  {
      Dialog.callFunc(originalRequest.responseText, Dialog.parameters)
  },
  
  _runAjaxRequest: function(message, parameters, callFunc) {
    if (message.options == null)
      message.options = {}  
    Dialog.onCompleteFunc = message.options.onComplete;
    Dialog.parameters = parameters;
    Dialog.callFunc = callFunc;
    
    message.options.onComplete = Dialog._getAjaxContent;
    new Ajax.Request(message.url, message.options);
  },
  
  okCallback: function() {
    var win = Windows.focusedWindow;
    if (!win.okCallback || win.okCallback(win)) {
      // Remove onclick on button
      $$("#" + win.getId()+" input").each(function(element) {element.onclick=null;})
      win.close();
    }
  },

  cancelCallback: function() {
    var win = Windows.focusedWindow;
    // Remove onclick on button
    $$("#" + win.getId()+" input").each(function(element) {element.onclick=null})
    win.close();
    if (win.cancelCallback)
      win.cancelCallback(win);
  }
}
/*
  Based on Lightbox JS: Fullsize Image Overlays 
  by Lokesh Dhakar - http://www.huddletogether.com

  For more information on this script, visit:
  http://huddletogether.com/projects/lightbox/

  Licensed under the Creative Commons Attribution 2.5 License - http://creativecommons.org/licenses/by/2.5/
  (basically, do anything you want, just leave my name and link)
*/

if (Prototype.Browser.WebKit) {
  var array = navigator.userAgent.match(new RegExp(/AppleWebKit\/([\d\.\+]*)/));
  Prototype.Browser.WebKitVersion = parseFloat(array[1]);
}

var WindowUtilities = {  
  // From dragdrop.js
  getWindowScroll: function(parent) {
    var T, L, W, H;
    parent = parent || document.body;              
    if (parent != document.body) {
      T = parent.scrollTop;
      L = parent.scrollLeft;
      W = parent.scrollWidth;
      H = parent.scrollHeight;
    } 
    else {
      var w = window;
      with (w.document) {
        if (w.document.documentElement && documentElement.scrollTop) {
          T = documentElement.scrollTop;
          L = documentElement.scrollLeft;
        } else if (w.document.body) {
          T = body.scrollTop;
          L = body.scrollLeft;
        }
        if (w.innerWidth) {
          W = w.innerWidth;
          H = w.innerHeight;
        } else if (w.document.documentElement && documentElement.clientWidth) {
          W = documentElement.clientWidth;
          H = documentElement.clientHeight;
        } else {
          W = body.offsetWidth;
          H = body.offsetHeight
        }
      }
    }
    return { top: T, left: L, width: W, height: H };
  }, 
  //
  // getPageSize()
  // Returns array with page width, height and window width, height
  // Core code from - quirksmode.org
  // Edit for Firefox by pHaez
  //
  getPageSize: function(parent){
    parent = parent || document.body;              
    var windowWidth, windowHeight;
    var pageHeight, pageWidth;
    if (parent != document.body) {
      windowWidth = parent.getWidth();
      windowHeight = parent.getHeight();                                
      pageWidth = parent.scrollWidth;
      pageHeight = parent.scrollHeight;                                
    } 
    else {
      var xScroll, yScroll;

      if (window.innerHeight && window.scrollMaxY) {  
        xScroll = document.body.scrollWidth;
        yScroll = window.innerHeight + window.scrollMaxY;
      } else if (document.body.scrollHeight > document.body.offsetHeight){ // all but Explorer Mac
        xScroll = document.body.scrollWidth;
        yScroll = document.body.scrollHeight;
      } else { // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari
        xScroll = document.body.offsetWidth;
        yScroll = document.body.offsetHeight;
      }


      if (self.innerHeight) {  // all except Explorer
        windowWidth = document.documentElement.clientWidth;//self.innerWidth;
        windowHeight = self.innerHeight;
      } else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
        windowWidth = document.documentElement.clientWidth;
        windowHeight = document.documentElement.clientHeight;
      } else if (document.body) { // other Explorers
        windowWidth = document.body.clientWidth;
        windowHeight = document.body.clientHeight;
      }  

      // for small pages with total height less then height of the viewport
      if(yScroll < windowHeight){
        pageHeight = windowHeight;
      } else { 
        pageHeight = yScroll;
      }

      // for small pages with total width less then width of the viewport
      if(xScroll < windowWidth){  
        pageWidth = windowWidth;
      } else {
        pageWidth = xScroll;
      }
    }             
    return {pageWidth: pageWidth ,pageHeight: pageHeight , windowWidth: windowWidth, windowHeight: windowHeight};
  },

  disableScreen: function(className, overlayId, overlayOpacity, contentId, parent) {
    WindowUtilities.initLightbox(overlayId, className, function() {this._disableScreen(className, overlayId, overlayOpacity, contentId)}.bind(this), parent || document.body);
  },

  _disableScreen: function(className, overlayId, overlayOpacity, contentId) {
    // prep objects
    var objOverlay = $(overlayId);

    var pageSize = WindowUtilities.getPageSize(objOverlay.parentNode);

    // Hide select boxes as they will 'peek' through the image in IE, store old value
    if (contentId && Prototype.Browser.IE) {
      WindowUtilities._hideSelect();
      WindowUtilities._showSelect(contentId);
    }  
  
    // set height of Overlay to take up whole page and show
    objOverlay.style.height = (pageSize.pageHeight + 'px');
    objOverlay.style.display = 'none'; 
    if (overlayId == "overlay_modal" && Window.hasEffectLib && Windows.overlayShowEffectOptions) {
      objOverlay.overlayOpacity = overlayOpacity;
      new Effect.Appear(objOverlay, Object.extend({from: 0, to: overlayOpacity}, Windows.overlayShowEffectOptions));
    }
    else
      objOverlay.style.display = "block";
  },
  
  enableScreen: function(id) {
    id = id || 'overlay_modal';
    var objOverlay =  $(id);
    if (objOverlay) {
      // hide lightbox and overlay
      if (id == "overlay_modal" && Window.hasEffectLib && Windows.overlayHideEffectOptions)
        new Effect.Fade(objOverlay, Object.extend({from: objOverlay.overlayOpacity, to:0}, Windows.overlayHideEffectOptions));
      else {
        objOverlay.style.display = 'none';
        objOverlay.parentNode.removeChild(objOverlay);
      }
      
      // make select boxes visible using old value
      if (id != "__invisible__") 
        WindowUtilities._showSelect();
    }
  },

  _hideSelect: function(id) {
    if (Prototype.Browser.IE) {
      id = id ==  null ? "" : "#" + id + " ";
      $$(id + 'select').each(function(element) {
        if (! WindowUtilities.isDefined(element.oldVisibility)) {
          element.oldVisibility = element.style.visibility ? element.style.visibility : "visible";
          element.style.visibility = "hidden";
        }
      });
    }
  },
  
  _showSelect: function(id) {
    if (Prototype.Browser.IE) {
      id = id ==  null ? "" : "#" + id + " ";
      $$(id + 'select').each(function(element) {
        if (WindowUtilities.isDefined(element.oldVisibility)) {
          // Why?? Ask IE
          try {
            element.style.visibility = element.oldVisibility;
          } catch(e) {
            element.style.visibility = "visible";
          }
          element.oldVisibility = null;
        }
        else {
          if (element.style.visibility)
            element.style.visibility = "visible";
        }
      });
    }
  },

  isDefined: function(object) {
    return typeof(object) != "undefined" && object != null;
  },
  
  // initLightbox()
  // Function runs on window load, going through link tags looking for rel="lightbox".
  // These links receive onclick events that enable the lightbox display for their targets.
  // The function also inserts html markup at the top of the page which will be used as a
  // container for the overlay pattern and the inline image.
  initLightbox: function(id, className, doneHandler, parent) {
    // Already done, just update zIndex
    if ($(id)) {
      Element.setStyle(id, {zIndex: Windows.maxZIndex + 1});
      Windows.maxZIndex++;
      doneHandler();
    }
    // create overlay div and hardcode some functional styles (aesthetic styles are in CSS file)
    else {
      var objOverlay = document.createElement("div");
      objOverlay.setAttribute('id', id);
      objOverlay.className = "overlay_" + className
      objOverlay.style.display = 'none';
      objOverlay.style.position = 'absolute';
      objOverlay.style.top = '0';
      objOverlay.style.left = '0';
      objOverlay.style.zIndex = Windows.maxZIndex + 1;
      Windows.maxZIndex++;
      objOverlay.style.width = '100%';
      parent.insertBefore(objOverlay, parent.firstChild);
      if (Prototype.Browser.WebKit && id == "overlay_modal") {
        setTimeout(function() {doneHandler()}, 10);
      }
      else
        doneHandler();
    }    
  },
  
  setCookie: function(value, parameters) {
    document.cookie= parameters[0] + "=" + escape(value) +
      ((parameters[1]) ? "; expires=" + parameters[1].toGMTString() : "") +
      ((parameters[2]) ? "; path=" + parameters[2] : "") +
      ((parameters[3]) ? "; domain=" + parameters[3] : "") +
      ((parameters[4]) ? "; secure" : "");
  },

  getCookie: function(name) {
    var dc = document.cookie;
    var prefix = name + "=";
    var begin = dc.indexOf("; " + prefix);
    if (begin == -1) {
      begin = dc.indexOf(prefix);
      if (begin != 0) return null;
    } else {
      begin += 2;
    }
    var end = document.cookie.indexOf(";", begin);
    if (end == -1) {
      end = dc.length;
    }
    return unescape(dc.substring(begin + prefix.length, end));
  },
    
  _computeSize: function(content, id, width, height, margin, className) {
    var objBody = document.body;
    var tmpObj = document.createElement("div");
    tmpObj.setAttribute('id', id);
    tmpObj.className = className + "_content";

    if (height)
      tmpObj.style.height = height + "px"
    else
      tmpObj.style.width = width + "px"
  
    tmpObj.style.position = 'absolute';
    tmpObj.style.top = '0';
    tmpObj.style.left = '0';
    tmpObj.style.display = 'none';

    tmpObj.innerHTML = content;
    objBody.insertBefore(tmpObj, objBody.firstChild);

    var size;
    if (height)
      size = $(tmpObj).getDimensions().width + margin;
    else
      size = $(tmpObj).getDimensions().height + margin;
    objBody.removeChild(tmpObj);
    return size;
  }  
}


// script.aculo.us builder.js v1.8.2, Tue Nov 18 18:30:58 +0100 2008

// Copyright (c) 2005-2008 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
//
// script.aculo.us is freely distributable under the terms of an MIT-style license.
// For details, see the script.aculo.us web site: http://script.aculo.us/

var Builder = {
  NODEMAP: {
    AREA: 'map',
    CAPTION: 'table',
    COL: 'table',
    COLGROUP: 'table',
    LEGEND: 'fieldset',
    OPTGROUP: 'select',
    OPTION: 'select',
    PARAM: 'object',
    TBODY: 'table',
    TD: 'table',
    TFOOT: 'table',
    TH: 'table',
    THEAD: 'table',
    TR: 'table'
  },
  // note: For Firefox < 1.5, OPTION and OPTGROUP tags are currently broken,
  //       due to a Firefox bug
  node: function(elementName) {
    elementName = elementName.toUpperCase();

    // try innerHTML approach
    var parentTag = this.NODEMAP[elementName] || 'div';
    var parentElement = document.createElement(parentTag);
    try { // prevent IE "feature": http://dev.rubyonrails.org/ticket/2707
      parentElement.innerHTML = "<" + elementName + "></" + elementName + ">";
    } catch(e) {}
    var element = parentElement.firstChild || null;

    // see if browser added wrapping tags
    if(element && (element.tagName.toUpperCase() != elementName))
      element = element.getElementsByTagName(elementName)[0];

    // fallback to createElement approach
    if(!element) element = document.createElement(elementName);

    // abort if nothing could be created
    if(!element) return;

    // attributes (or text)
    if(arguments[1])
      if(this._isStringOrNumber(arguments[1]) ||
        (arguments[1] instanceof Array) ||
        arguments[1].tagName) {
          this._children(element, arguments[1]);
        } else {
          var attrs = this._attributes(arguments[1]);
          if(attrs.length) {
            try { // prevent IE "feature": http://dev.rubyonrails.org/ticket/2707
              parentElement.innerHTML = "<" +elementName + " " +
                attrs + "></" + elementName + ">";
            } catch(e) {}
            element = parentElement.firstChild || null;
            // workaround firefox 1.0.X bug
            if(!element) {
              element = document.createElement(elementName);
              for(attr in arguments[1])
                element[attr == 'class' ? 'className' : attr] = arguments[1][attr];
            }
            if(element.tagName.toUpperCase() != elementName)
              element = parentElement.getElementsByTagName(elementName)[0];
          }
        }

    // text, or array of children
    if(arguments[2])
      this._children(element, arguments[2]);

     return $(element);
  },
  _text: function(text) {
     return document.createTextNode(text);
  },

  ATTR_MAP: {
    'className': 'class',
    'htmlFor': 'for'
  },

  _attributes: function(attributes) {
    var attrs = [];
    for(attribute in attributes)
      attrs.push((attribute in this.ATTR_MAP ? this.ATTR_MAP[attribute] : attribute) +
          '="' + attributes[attribute].toString().escapeHTML().gsub(/"/,'&quot;') + '"');
    return attrs.join(" ");
  },
  _children: function(element, children) {
    if(children.tagName) {
      element.appendChild(children);
      return;
    }
    if(typeof children=='object') { // array can hold nodes and text
      children.flatten().each( function(e) {
        if(typeof e=='object')
          element.appendChild(e);
        else
          if(Builder._isStringOrNumber(e))
            element.appendChild(Builder._text(e));
      });
    } else
      if(Builder._isStringOrNumber(children))
        element.appendChild(Builder._text(children));
  },
  _isStringOrNumber: function(param) {
    return(typeof param=='string' || typeof param=='number');
  },
  build: function(html) {
    var element = this.node('div');
    $(element).update(html.strip());
    return element.down();
  },
  dump: function(scope) {
    if(typeof scope != 'object' && typeof scope != 'function') scope = window; //global scope

    var tags = ("A ABBR ACRONYM ADDRESS APPLET AREA B BASE BASEFONT BDO BIG BLOCKQUOTE BODY " +
      "BR BUTTON CAPTION CENTER CITE CODE COL COLGROUP DD DEL DFN DIR DIV DL DT EM FIELDSET " +
      "FONT FORM FRAME FRAMESET H1 H2 H3 H4 H5 H6 HEAD HR HTML I IFRAME IMG INPUT INS ISINDEX "+
      "KBD LABEL LEGEND LI LINK MAP MENU META NOFRAMES NOSCRIPT OBJECT OL OPTGROUP OPTION P "+
      "PARAM PRE Q S SAMP SCRIPT SELECT SMALL SPAN STRIKE STRONG STYLE SUB SUP TABLE TBODY TD "+
      "TEXTAREA TFOOT TH THEAD TITLE TR TT U UL VAR").split(/\s+/);

    tags.each( function(tag){
      scope[tag] = function() {
        return Builder.node.apply(Builder, [tag].concat($A(arguments)));
      };
    });
  }
};
// script.aculo.us effects.js v1.8.2, Tue Nov 18 18:30:58 +0100 2008

// Copyright (c) 2005-2008 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
// Contributors:
//  Justin Palmer (http://encytemedia.com/)
//  Mark Pilgrim (http://diveintomark.org/)
//  Martin Bialasinki
//
// script.aculo.us is freely distributable under the terms of an MIT-style license.
// For details, see the script.aculo.us web site: http://script.aculo.us/

// converts rgb() and #xxx to #xxxxxx format,
// returns self (or first argument) if not convertable
String.prototype.parseColor = function() {
  var color = '#';
  if (this.slice(0,4) == 'rgb(') {
    var cols = this.slice(4,this.length-1).split(',');
    var i=0; do { color += parseInt(cols[i]).toColorPart() } while (++i<3);
  } else {
    if (this.slice(0,1) == '#') {
      if (this.length==4) for(var i=1;i<4;i++) color += (this.charAt(i) + this.charAt(i)).toLowerCase();
      if (this.length==7) color = this.toLowerCase();
    }
  }
  return (color.length==7 ? color : (arguments[0] || this));
};

/*--------------------------------------------------------------------------*/

Element.collectTextNodes = function(element) {
  return $A($(element).childNodes).collect( function(node) {
    return (node.nodeType==3 ? node.nodeValue :
      (node.hasChildNodes() ? Element.collectTextNodes(node) : ''));
  }).flatten().join('');
};

Element.collectTextNodesIgnoreClass = function(element, className) {
  return $A($(element).childNodes).collect( function(node) {
    return (node.nodeType==3 ? node.nodeValue :
      ((node.hasChildNodes() && !Element.hasClassName(node,className)) ?
        Element.collectTextNodesIgnoreClass(node, className) : ''));
  }).flatten().join('');
};

Element.setContentZoom = function(element, percent) {
  element = $(element);
  element.setStyle({fontSize: (percent/100) + 'em'});
  if (Prototype.Browser.WebKit) window.scrollBy(0,0);
  return element;
};

Element.getInlineOpacity = function(element){
  return $(element).style.opacity || '';
};

Element.forceRerendering = function(element) {
  try {
    element = $(element);
    var n = document.createTextNode(' ');
    element.appendChild(n);
    element.removeChild(n);
  } catch(e) { }
};

/*--------------------------------------------------------------------------*/

var Effect = {
  _elementDoesNotExistError: {
    name: 'ElementDoesNotExistError',
    message: 'The specified DOM element does not exist, but is required for this effect to operate'
  },
  Transitions: {
    linear: Prototype.K,
    sinoidal: function(pos) {
      return (-Math.cos(pos*Math.PI)/2) + .5;
    },
    reverse: function(pos) {
      return 1-pos;
    },
    flicker: function(pos) {
      var pos = ((-Math.cos(pos*Math.PI)/4) + .75) + Math.random()/4;
      return pos > 1 ? 1 : pos;
    },
    wobble: function(pos) {
      return (-Math.cos(pos*Math.PI*(9*pos))/2) + .5;
    },
    pulse: function(pos, pulses) {
      return (-Math.cos((pos*((pulses||5)-.5)*2)*Math.PI)/2) + .5;
    },
    spring: function(pos) {
      return 1 - (Math.cos(pos * 4.5 * Math.PI) * Math.exp(-pos * 6));
    },
    none: function(pos) {
      return 0;
    },
    full: function(pos) {
      return 1;
    }
  },
  DefaultOptions: {
    duration:   1.0,   // seconds
    fps:        100,   // 100= assume 66fps max.
    sync:       false, // true for combining
    from:       0.0,
    to:         1.0,
    delay:      0.0,
    queue:      'parallel'
  },
  tagifyText: function(element) {
    var tagifyStyle = 'position:relative';
    if (Prototype.Browser.IE) tagifyStyle += ';zoom:1';

    element = $(element);
    $A(element.childNodes).each( function(child) {
      if (child.nodeType==3) {
        child.nodeValue.toArray().each( function(character) {
          element.insertBefore(
            new Element('span', {style: tagifyStyle}).update(
              character == ' ' ? String.fromCharCode(160) : character),
              child);
        });
        Element.remove(child);
      }
    });
  },
  multiple: function(element, effect) {
    var elements;
    if (((typeof element == 'object') ||
        Object.isFunction(element)) &&
       (element.length))
      elements = element;
    else
      elements = $(element).childNodes;

    var options = Object.extend({
      speed: 0.1,
      delay: 0.0
    }, arguments[2] || { });
    var masterDelay = options.delay;

    $A(elements).each( function(element, index) {
      new effect(element, Object.extend(options, { delay: index * options.speed + masterDelay }));
    });
  },
  PAIRS: {
    'slide':  ['SlideDown','SlideUp'],
    'blind':  ['BlindDown','BlindUp'],
    'appear': ['Appear','Fade']
  },
  toggle: function(element, effect) {
    element = $(element);
    effect = (effect || 'appear').toLowerCase();
    var options = Object.extend({
      queue: { position:'end', scope:(element.id || 'global'), limit: 1 }
    }, arguments[2] || { });
    Effect[element.visible() ?
      Effect.PAIRS[effect][1] : Effect.PAIRS[effect][0]](element, options);
  }
};

Effect.DefaultOptions.transition = Effect.Transitions.sinoidal;

/* ------------- core effects ------------- */

Effect.ScopedQueue = Class.create(Enumerable, {
  initialize: function() {
    this.effects  = [];
    this.interval = null;
  },
  _each: function(iterator) {
    this.effects._each(iterator);
  },
  add: function(effect) {
    var timestamp = new Date().getTime();

    var position = Object.isString(effect.options.queue) ?
      effect.options.queue : effect.options.queue.position;

    switch(position) {
      case 'front':
        // move unstarted effects after this effect
        this.effects.findAll(function(e){ return e.state=='idle' }).each( function(e) {
            e.startOn  += effect.finishOn;
            e.finishOn += effect.finishOn;
          });
        break;
      case 'with-last':
        timestamp = this.effects.pluck('startOn').max() || timestamp;
        break;
      case 'end':
        // start effect after last queued effect has finished
        timestamp = this.effects.pluck('finishOn').max() || timestamp;
        break;
    }

    effect.startOn  += timestamp;
    effect.finishOn += timestamp;

    if (!effect.options.queue.limit || (this.effects.length < effect.options.queue.limit))
      this.effects.push(effect);

    if (!this.interval)
      this.interval = setInterval(this.loop.bind(this), 15);
  },
  remove: function(effect) {
    this.effects = this.effects.reject(function(e) { return e==effect });
    if (this.effects.length == 0) {
      clearInterval(this.interval);
      this.interval = null;
    }
  },
  loop: function() {
    var timePos = new Date().getTime();
    for(var i=0, len=this.effects.length;i<len;i++)
      this.effects[i] && this.effects[i].loop(timePos);
  }
});

Effect.Queues = {
  instances: $H(),
  get: function(queueName) {
    if (!Object.isString(queueName)) return queueName;

    return this.instances.get(queueName) ||
      this.instances.set(queueName, new Effect.ScopedQueue());
  }
};
Effect.Queue = Effect.Queues.get('global');

Effect.Base = Class.create({
  position: null,
  start: function(options) {
    function codeForEvent(options,eventName){
      return (
        (options[eventName+'Internal'] ? 'this.options.'+eventName+'Internal(this);' : '') +
        (options[eventName] ? 'this.options.'+eventName+'(this);' : '')
      );
    }
    if (options && options.transition === false) options.transition = Effect.Transitions.linear;
    this.options      = Object.extend(Object.extend({ },Effect.DefaultOptions), options || { });
    this.currentFrame = 0;
    this.state        = 'idle';
    this.startOn      = this.options.delay*1000;
    this.finishOn     = this.startOn+(this.options.duration*1000);
    this.fromToDelta  = this.options.to-this.options.from;
    this.totalTime    = this.finishOn-this.startOn;
    this.totalFrames  = this.options.fps*this.options.duration;

    this.render = (function() {
      function dispatch(effect, eventName) {
        if (effect.options[eventName + 'Internal'])
          effect.options[eventName + 'Internal'](effect);
        if (effect.options[eventName])
          effect.options[eventName](effect);
      }

      return function(pos) {
        if (this.state === "idle") {
          this.state = "running";
          dispatch(this, 'beforeSetup');
          if (this.setup) this.setup();
          dispatch(this, 'afterSetup');
        }
        if (this.state === "running") {
          pos = (this.options.transition(pos) * this.fromToDelta) + this.options.from;
          this.position = pos;
          dispatch(this, 'beforeUpdate');
          if (this.update) this.update(pos);
          dispatch(this, 'afterUpdate');
        }
      };
    })();

    this.event('beforeStart');
    if (!this.options.sync)
      Effect.Queues.get(Object.isString(this.options.queue) ?
        'global' : this.options.queue.scope).add(this);
  },
  loop: function(timePos) {
    if (timePos >= this.startOn) {
      if (timePos >= this.finishOn) {
        this.render(1.0);
        this.cancel();
        this.event('beforeFinish');
        if (this.finish) this.finish();
        this.event('afterFinish');
        return;
      }
      var pos   = (timePos - this.startOn) / this.totalTime,
          frame = (pos * this.totalFrames).round();
      if (frame > this.currentFrame) {
        this.render(pos);
        this.currentFrame = frame;
      }
    }
  },
  cancel: function() {
    if (!this.options.sync)
      Effect.Queues.get(Object.isString(this.options.queue) ?
        'global' : this.options.queue.scope).remove(this);
    this.state = 'finished';
  },
  event: function(eventName) {
    if (this.options[eventName + 'Internal']) this.options[eventName + 'Internal'](this);
    if (this.options[eventName]) this.options[eventName](this);
  },
  inspect: function() {
    var data = $H();
    for(property in this)
      if (!Object.isFunction(this[property])) data.set(property, this[property]);
    return '#<Effect:' + data.inspect() + ',options:' + $H(this.options).inspect() + '>';
  }
});

Effect.Parallel = Class.create(Effect.Base, {
  initialize: function(effects) {
    this.effects = effects || [];
    this.start(arguments[1]);
  },
  update: function(position) {
    this.effects.invoke('render', position);
  },
  finish: function(position) {
    this.effects.each( function(effect) {
      effect.render(1.0);
      effect.cancel();
      effect.event('beforeFinish');
      if (effect.finish) effect.finish(position);
      effect.event('afterFinish');
    });
  }
});

Effect.Tween = Class.create(Effect.Base, {
  initialize: function(object, from, to) {
    object = Object.isString(object) ? $(object) : object;
    var args = $A(arguments), method = args.last(),
      options = args.length == 5 ? args[3] : null;
    this.method = Object.isFunction(method) ? method.bind(object) :
      Object.isFunction(object[method]) ? object[method].bind(object) :
      function(value) { object[method] = value };
    this.start(Object.extend({ from: from, to: to }, options || { }));
  },
  update: function(position) {
    this.method(position);
  }
});

Effect.Event = Class.create(Effect.Base, {
  initialize: function() {
    this.start(Object.extend({ duration: 0 }, arguments[0] || { }));
  },
  update: Prototype.emptyFunction
});

Effect.Opacity = Class.create(Effect.Base, {
  initialize: function(element) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    // make this work on IE on elements without 'layout'
    if (Prototype.Browser.IE && (!this.element.currentStyle.hasLayout))
      this.element.setStyle({zoom: 1});
    var options = Object.extend({
      from: this.element.getOpacity() || 0.0,
      to:   1.0
    }, arguments[1] || { });
    this.start(options);
  },
  update: function(position) {
    this.element.setOpacity(position);
  }
});

Effect.Move = Class.create(Effect.Base, {
  initialize: function(element) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    var options = Object.extend({
      x:    0,
      y:    0,
      mode: 'relative'
    }, arguments[1] || { });
    this.start(options);
  },
  setup: function() {
    this.element.makePositioned();
    this.originalLeft = parseFloat(this.element.getStyle('left') || '0');
    this.originalTop  = parseFloat(this.element.getStyle('top')  || '0');
    if (this.options.mode == 'absolute') {
      this.options.x = this.options.x - this.originalLeft;
      this.options.y = this.options.y - this.originalTop;
    }
  },
  update: function(position) {
    this.element.setStyle({
      left: (this.options.x  * position + this.originalLeft).round() + 'px',
      top:  (this.options.y  * position + this.originalTop).round()  + 'px'
    });
  }
});

// for backwards compatibility
Effect.MoveBy = function(element, toTop, toLeft) {
  return new Effect.Move(element,
    Object.extend({ x: toLeft, y: toTop }, arguments[3] || { }));
};

Effect.Scale = Class.create(Effect.Base, {
  initialize: function(element, percent) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    var options = Object.extend({
      scaleX: true,
      scaleY: true,
      scaleContent: true,
      scaleFromCenter: false,
      scaleMode: 'box',        // 'box' or 'contents' or { } with provided values
      scaleFrom: 100.0,
      scaleTo:   percent
    }, arguments[2] || { });
    this.start(options);
  },
  setup: function() {
    this.restoreAfterFinish = this.options.restoreAfterFinish || false;
    this.elementPositioning = this.element.getStyle('position');

    this.originalStyle = { };
    ['top','left','width','height','fontSize'].each( function(k) {
      this.originalStyle[k] = this.element.style[k];
    }.bind(this));

    this.originalTop  = this.element.offsetTop;
    this.originalLeft = this.element.offsetLeft;

    var fontSize = this.element.getStyle('font-size') || '100%';
    ['em','px','%','pt'].each( function(fontSizeType) {
      if (fontSize.indexOf(fontSizeType)>0) {
        this.fontSize     = parseFloat(fontSize);
        this.fontSizeType = fontSizeType;
      }
    }.bind(this));

    this.factor = (this.options.scaleTo - this.options.scaleFrom)/100;

    this.dims = null;
    if (this.options.scaleMode=='box')
      this.dims = [this.element.offsetHeight, this.element.offsetWidth];
    if (/^content/.test(this.options.scaleMode))
      this.dims = [this.element.scrollHeight, this.element.scrollWidth];
    if (!this.dims)
      this.dims = [this.options.scaleMode.originalHeight,
                   this.options.scaleMode.originalWidth];
  },
  update: function(position) {
    var currentScale = (this.options.scaleFrom/100.0) + (this.factor * position);
    if (this.options.scaleContent && this.fontSize)
      this.element.setStyle({fontSize: this.fontSize * currentScale + this.fontSizeType });
    this.setDimensions(this.dims[0] * currentScale, this.dims[1] * currentScale);
  },
  finish: function(position) {
    if (this.restoreAfterFinish) this.element.setStyle(this.originalStyle);
  },
  setDimensions: function(height, width) {
    var d = { };
    if (this.options.scaleX) d.width = width.round() + 'px';
    if (this.options.scaleY) d.height = height.round() + 'px';
    if (this.options.scaleFromCenter) {
      var topd  = (height - this.dims[0])/2;
      var leftd = (width  - this.dims[1])/2;
      if (this.elementPositioning == 'absolute') {
        if (this.options.scaleY) d.top = this.originalTop-topd + 'px';
        if (this.options.scaleX) d.left = this.originalLeft-leftd + 'px';
      } else {
        if (this.options.scaleY) d.top = -topd + 'px';
        if (this.options.scaleX) d.left = -leftd + 'px';
      }
    }
    this.element.setStyle(d);
  }
});

Effect.Highlight = Class.create(Effect.Base, {
  initialize: function(element) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    var options = Object.extend({ startcolor: '#ffff99' }, arguments[1] || { });
    this.start(options);
  },
  setup: function() {
    // Prevent executing on elements not in the layout flow
    if (this.element.getStyle('display')=='none') { this.cancel(); return; }
    // Disable background image during the effect
    this.oldStyle = { };
    if (!this.options.keepBackgroundImage) {
      this.oldStyle.backgroundImage = this.element.getStyle('background-image');
      this.element.setStyle({backgroundImage: 'none'});
    }
    if (!this.options.endcolor)
      this.options.endcolor = this.element.getStyle('background-color').parseColor('#ffffff');
    if (!this.options.restorecolor)
      this.options.restorecolor = this.element.getStyle('background-color');
    // init color calculations
    this._base  = $R(0,2).map(function(i){ return parseInt(this.options.startcolor.slice(i*2+1,i*2+3),16) }.bind(this));
    this._delta = $R(0,2).map(function(i){ return parseInt(this.options.endcolor.slice(i*2+1,i*2+3),16)-this._base[i] }.bind(this));
  },
  update: function(position) {
    this.element.setStyle({backgroundColor: $R(0,2).inject('#',function(m,v,i){
      return m+((this._base[i]+(this._delta[i]*position)).round().toColorPart()); }.bind(this)) });
  },
  finish: function() {
    this.element.setStyle(Object.extend(this.oldStyle, {
      backgroundColor: this.options.restorecolor
    }));
  }
});

Effect.ScrollTo = function(element) {
  var options = arguments[1] || { },
  scrollOffsets = document.viewport.getScrollOffsets(),
  elementOffsets = $(element).cumulativeOffset();

  if (options.offset) elementOffsets[1] += options.offset;

  return new Effect.Tween(null,
    scrollOffsets.top,
    elementOffsets[1],
    options,
    function(p){ scrollTo(scrollOffsets.left, p.round()); }
  );
};

/* ------------- combination effects ------------- */

Effect.Fade = function(element) {
  element = $(element);
  var oldOpacity = element.getInlineOpacity();
  var options = Object.extend({
    from: element.getOpacity() || 1.0,
    to:   0.0,
    afterFinishInternal: function(effect) {
      if (effect.options.to!=0) return;
      effect.element.hide().setStyle({opacity: oldOpacity});
    }
  }, arguments[1] || { });
  return new Effect.Opacity(element,options);
};

Effect.Appear = function(element) {
  element = $(element);
  var options = Object.extend({
  from: (element.getStyle('display') == 'none' ? 0.0 : element.getOpacity() || 0.0),
  to:   1.0,
  // force Safari to render floated elements properly
  afterFinishInternal: function(effect) {
    effect.element.forceRerendering();
  },
  beforeSetup: function(effect) {
    effect.element.setOpacity(effect.options.from).show();
  }}, arguments[1] || { });
  return new Effect.Opacity(element,options);
};

Effect.Puff = function(element) {
  element = $(element);
  var oldStyle = {
    opacity: element.getInlineOpacity(),
    position: element.getStyle('position'),
    top:  element.style.top,
    left: element.style.left,
    width: element.style.width,
    height: element.style.height
  };
  return new Effect.Parallel(
   [ new Effect.Scale(element, 200,
      { sync: true, scaleFromCenter: true, scaleContent: true, restoreAfterFinish: true }),
     new Effect.Opacity(element, { sync: true, to: 0.0 } ) ],
     Object.extend({ duration: 1.0,
      beforeSetupInternal: function(effect) {
        Position.absolutize(effect.effects[0].element);
      },
      afterFinishInternal: function(effect) {
         effect.effects[0].element.hide().setStyle(oldStyle); }
     }, arguments[1] || { })
   );
};

Effect.BlindUp = function(element) {
  element = $(element);
  element.makeClipping();
  return new Effect.Scale(element, 0,
    Object.extend({ scaleContent: false,
      scaleX: false,
      restoreAfterFinish: true,
      afterFinishInternal: function(effect) {
        effect.element.hide().undoClipping();
      }
    }, arguments[1] || { })
  );
};

Effect.BlindDown = function(element) {
  element = $(element);
  var elementDimensions = element.getDimensions();
  return new Effect.Scale(element, 100, Object.extend({
    scaleContent: false,
    scaleX: false,
    scaleFrom: 0,
    scaleMode: {originalHeight: elementDimensions.height, originalWidth: elementDimensions.width},
    restoreAfterFinish: true,
    afterSetup: function(effect) {
      effect.element.makeClipping().setStyle({height: '0px'}).show();
    },
    afterFinishInternal: function(effect) {
      effect.element.undoClipping();
    }
  }, arguments[1] || { }));
};

Effect.SwitchOff = function(element) {
  element = $(element);
  var oldOpacity = element.getInlineOpacity();
  return new Effect.Appear(element, Object.extend({
    duration: 0.4,
    from: 0,
    transition: Effect.Transitions.flicker,
    afterFinishInternal: function(effect) {
      new Effect.Scale(effect.element, 1, {
        duration: 0.3, scaleFromCenter: true,
        scaleX: false, scaleContent: false, restoreAfterFinish: true,
        beforeSetup: function(effect) {
          effect.element.makePositioned().makeClipping();
        },
        afterFinishInternal: function(effect) {
          effect.element.hide().undoClipping().undoPositioned().setStyle({opacity: oldOpacity});
        }
      });
    }
  }, arguments[1] || { }));
};

Effect.DropOut = function(element) {
  element = $(element);
  var oldStyle = {
    top: element.getStyle('top'),
    left: element.getStyle('left'),
    opacity: element.getInlineOpacity() };
  return new Effect.Parallel(
    [ new Effect.Move(element, {x: 0, y: 100, sync: true }),
      new Effect.Opacity(element, { sync: true, to: 0.0 }) ],
    Object.extend(
      { duration: 0.5,
        beforeSetup: function(effect) {
          effect.effects[0].element.makePositioned();
        },
        afterFinishInternal: function(effect) {
          effect.effects[0].element.hide().undoPositioned().setStyle(oldStyle);
        }
      }, arguments[1] || { }));
};

Effect.Shake = function(element) {
  element = $(element);
  var options = Object.extend({
    distance: 20,
    duration: 0.5
  }, arguments[1] || {});
  var distance = parseFloat(options.distance);
  var split = parseFloat(options.duration) / 10.0;
  var oldStyle = {
    top: element.getStyle('top'),
    left: element.getStyle('left') };
    return new Effect.Move(element,
      { x:  distance, y: 0, duration: split, afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x: -distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x:  distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x: -distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x:  distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x: -distance, y: 0, duration: split, afterFinishInternal: function(effect) {
        effect.element.undoPositioned().setStyle(oldStyle);
  }}); }}); }}); }}); }}); }});
};

Effect.SlideDown = function(element) {
  element = $(element).cleanWhitespace();
  // SlideDown need to have the content of the element wrapped in a container element with fixed height!
  var oldInnerBottom = element.down().getStyle('bottom');
  var elementDimensions = element.getDimensions();
  return new Effect.Scale(element, 100, Object.extend({
    scaleContent: false,
    scaleX: false,
    scaleFrom: window.opera ? 0 : 1,
    scaleMode: {originalHeight: elementDimensions.height, originalWidth: elementDimensions.width},
    restoreAfterFinish: true,
    afterSetup: function(effect) {
      effect.element.makePositioned();
      effect.element.down().makePositioned();
      if (window.opera) effect.element.setStyle({top: ''});
      effect.element.makeClipping().setStyle({height: '0px'}).show();
    },
    afterUpdateInternal: function(effect) {
      effect.element.down().setStyle({bottom:
        (effect.dims[0] - effect.element.clientHeight) + 'px' });
    },
    afterFinishInternal: function(effect) {
      effect.element.undoClipping().undoPositioned();
      effect.element.down().undoPositioned().setStyle({bottom: oldInnerBottom}); }
    }, arguments[1] || { })
  );
};

Effect.SlideUp = function(element) {
  element = $(element).cleanWhitespace();
  var oldInnerBottom = element.down().getStyle('bottom');
  var elementDimensions = element.getDimensions();
  return new Effect.Scale(element, window.opera ? 0 : 1,
   Object.extend({ scaleContent: false,
    scaleX: false,
    scaleMode: 'box',
    scaleFrom: 100,
    scaleMode: {originalHeight: elementDimensions.height, originalWidth: elementDimensions.width},
    restoreAfterFinish: true,
    afterSetup: function(effect) {
      effect.element.makePositioned();
      effect.element.down().makePositioned();
      if (window.opera) effect.element.setStyle({top: ''});
      effect.element.makeClipping().show();
    },
    afterUpdateInternal: function(effect) {
      effect.element.down().setStyle({bottom:
        (effect.dims[0] - effect.element.clientHeight) + 'px' });
    },
    afterFinishInternal: function(effect) {
      effect.element.hide().undoClipping().undoPositioned();
      effect.element.down().undoPositioned().setStyle({bottom: oldInnerBottom});
    }
   }, arguments[1] || { })
  );
};

// Bug in opera makes the TD containing this element expand for a instance after finish
Effect.Squish = function(element) {
  return new Effect.Scale(element, window.opera ? 1 : 0, {
    restoreAfterFinish: true,
    beforeSetup: function(effect) {
      effect.element.makeClipping();
    },
    afterFinishInternal: function(effect) {
      effect.element.hide().undoClipping();
    }
  });
};

Effect.Grow = function(element) {
  element = $(element);
  var options = Object.extend({
    direction: 'center',
    moveTransition: Effect.Transitions.sinoidal,
    scaleTransition: Effect.Transitions.sinoidal,
    opacityTransition: Effect.Transitions.full
  }, arguments[1] || { });
  var oldStyle = {
    top: element.style.top,
    left: element.style.left,
    height: element.style.height,
    width: element.style.width,
    opacity: element.getInlineOpacity() };

  var dims = element.getDimensions();
  var initialMoveX, initialMoveY;
  var moveX, moveY;

  switch (options.direction) {
    case 'top-left':
      initialMoveX = initialMoveY = moveX = moveY = 0;
      break;
    case 'top-right':
      initialMoveX = dims.width;
      initialMoveY = moveY = 0;
      moveX = -dims.width;
      break;
    case 'bottom-left':
      initialMoveX = moveX = 0;
      initialMoveY = dims.height;
      moveY = -dims.height;
      break;
    case 'bottom-right':
      initialMoveX = dims.width;
      initialMoveY = dims.height;
      moveX = -dims.width;
      moveY = -dims.height;
      break;
    case 'center':
      initialMoveX = dims.width / 2;
      initialMoveY = dims.height / 2;
      moveX = -dims.width / 2;
      moveY = -dims.height / 2;
      break;
  }

  return new Effect.Move(element, {
    x: initialMoveX,
    y: initialMoveY,
    duration: 0.01,
    beforeSetup: function(effect) {
      effect.element.hide().makeClipping().makePositioned();
    },
    afterFinishInternal: function(effect) {
      new Effect.Parallel(
        [ new Effect.Opacity(effect.element, { sync: true, to: 1.0, from: 0.0, transition: options.opacityTransition }),
          new Effect.Move(effect.element, { x: moveX, y: moveY, sync: true, transition: options.moveTransition }),
          new Effect.Scale(effect.element, 100, {
            scaleMode: { originalHeight: dims.height, originalWidth: dims.width },
            sync: true, scaleFrom: window.opera ? 1 : 0, transition: options.scaleTransition, restoreAfterFinish: true})
        ], Object.extend({
             beforeSetup: function(effect) {
               effect.effects[0].element.setStyle({height: '0px'}).show();
             },
             afterFinishInternal: function(effect) {
               effect.effects[0].element.undoClipping().undoPositioned().setStyle(oldStyle);
             }
           }, options)
      );
    }
  });
};

Effect.Shrink = function(element) {
  element = $(element);
  var options = Object.extend({
    direction: 'center',
    moveTransition: Effect.Transitions.sinoidal,
    scaleTransition: Effect.Transitions.sinoidal,
    opacityTransition: Effect.Transitions.none
  }, arguments[1] || { });
  var oldStyle = {
    top: element.style.top,
    left: element.style.left,
    height: element.style.height,
    width: element.style.width,
    opacity: element.getInlineOpacity() };

  var dims = element.getDimensions();
  var moveX, moveY;

  switch (options.direction) {
    case 'top-left':
      moveX = moveY = 0;
      break;
    case 'top-right':
      moveX = dims.width;
      moveY = 0;
      break;
    case 'bottom-left':
      moveX = 0;
      moveY = dims.height;
      break;
    case 'bottom-right':
      moveX = dims.width;
      moveY = dims.height;
      break;
    case 'center':
      moveX = dims.width / 2;
      moveY = dims.height / 2;
      break;
  }

  return new Effect.Parallel(
    [ new Effect.Opacity(element, { sync: true, to: 0.0, from: 1.0, transition: options.opacityTransition }),
      new Effect.Scale(element, window.opera ? 1 : 0, { sync: true, transition: options.scaleTransition, restoreAfterFinish: true}),
      new Effect.Move(element, { x: moveX, y: moveY, sync: true, transition: options.moveTransition })
    ], Object.extend({
         beforeStartInternal: function(effect) {
           effect.effects[0].element.makePositioned().makeClipping();
         },
         afterFinishInternal: function(effect) {
           effect.effects[0].element.hide().undoClipping().undoPositioned().setStyle(oldStyle); }
       }, options)
  );
};

Effect.Pulsate = function(element) {
  element = $(element);
  var options    = arguments[1] || { },
    oldOpacity = element.getInlineOpacity(),
    transition = options.transition || Effect.Transitions.linear,
    reverser   = function(pos){
      return 1 - transition((-Math.cos((pos*(options.pulses||5)*2)*Math.PI)/2) + .5);
    };

  return new Effect.Opacity(element,
    Object.extend(Object.extend({  duration: 2.0, from: 0,
      afterFinishInternal: function(effect) { effect.element.setStyle({opacity: oldOpacity}); }
    }, options), {transition: reverser}));
};

Effect.Fold = function(element) {
  element = $(element);
  var oldStyle = {
    top: element.style.top,
    left: element.style.left,
    width: element.style.width,
    height: element.style.height };
  element.makeClipping();
  return new Effect.Scale(element, 5, Object.extend({
    scaleContent: false,
    scaleX: false,
    afterFinishInternal: function(effect) {
    new Effect.Scale(element, 1, {
      scaleContent: false,
      scaleY: false,
      afterFinishInternal: function(effect) {
        effect.element.hide().undoClipping().setStyle(oldStyle);
      } });
  }}, arguments[1] || { }));
};

Effect.Morph = Class.create(Effect.Base, {
  initialize: function(element) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    var options = Object.extend({
      style: { }
    }, arguments[1] || { });

    if (!Object.isString(options.style)) this.style = $H(options.style);
    else {
      if (options.style.include(':'))
        this.style = options.style.parseStyle();
      else {
        this.element.addClassName(options.style);
        this.style = $H(this.element.getStyles());
        this.element.removeClassName(options.style);
        var css = this.element.getStyles();
        this.style = this.style.reject(function(style) {
          return style.value == css[style.key];
        });
        options.afterFinishInternal = function(effect) {
          effect.element.addClassName(effect.options.style);
          effect.transforms.each(function(transform) {
            effect.element.style[transform.style] = '';
          });
        };
      }
    }
    this.start(options);
  },

  setup: function(){
    function parseColor(color){
      if (!color || ['rgba(0, 0, 0, 0)','transparent'].include(color)) color = '#ffffff';
      color = color.parseColor();
      return $R(0,2).map(function(i){
        return parseInt( color.slice(i*2+1,i*2+3), 16 );
      });
    }
    this.transforms = this.style.map(function(pair){
      var property = pair[0], value = pair[1], unit = null;

      if (value.parseColor('#zzzzzz') != '#zzzzzz') {
        value = value.parseColor();
        unit  = 'color';
      } else if (property == 'opacity') {
        value = parseFloat(value);
        if (Prototype.Browser.IE && (!this.element.currentStyle.hasLayout))
          this.element.setStyle({zoom: 1});
      } else if (Element.CSS_LENGTH.test(value)) {
          var components = value.match(/^([\+\-]?[0-9\.]+)(.*)$/);
          value = parseFloat(components[1]);
          unit = (components.length == 3) ? components[2] : null;
      }

      var originalValue = this.element.getStyle(property);
      return {
        style: property.camelize(),
        originalValue: unit=='color' ? parseColor(originalValue) : parseFloat(originalValue || 0),
        targetValue: unit=='color' ? parseColor(value) : value,
        unit: unit
      };
    }.bind(this)).reject(function(transform){
      return (
        (transform.originalValue == transform.targetValue) ||
        (
          transform.unit != 'color' &&
          (isNaN(transform.originalValue) || isNaN(transform.targetValue))
        )
      );
    });
  },
  update: function(position) {
    var style = { }, transform, i = this.transforms.length;
    while(i--)
      style[(transform = this.transforms[i]).style] =
        transform.unit=='color' ? '#'+
          (Math.round(transform.originalValue[0]+
            (transform.targetValue[0]-transform.originalValue[0])*position)).toColorPart() +
          (Math.round(transform.originalValue[1]+
            (transform.targetValue[1]-transform.originalValue[1])*position)).toColorPart() +
          (Math.round(transform.originalValue[2]+
            (transform.targetValue[2]-transform.originalValue[2])*position)).toColorPart() :
        (transform.originalValue +
          (transform.targetValue - transform.originalValue) * position).toFixed(3) +
            (transform.unit === null ? '' : transform.unit);
    this.element.setStyle(style, true);
  }
});

Effect.Transform = Class.create({
  initialize: function(tracks){
    this.tracks  = [];
    this.options = arguments[1] || { };
    this.addTracks(tracks);
  },
  addTracks: function(tracks){
    tracks.each(function(track){
      track = $H(track);
      var data = track.values().first();
      this.tracks.push($H({
        ids:     track.keys().first(),
        effect:  Effect.Morph,
        options: { style: data }
      }));
    }.bind(this));
    return this;
  },
  play: function(){
    return new Effect.Parallel(
      this.tracks.map(function(track){
        var ids = track.get('ids'), effect = track.get('effect'), options = track.get('options');
        var elements = [$(ids) || $$(ids)].flatten();
        return elements.map(function(e){ return new effect(e, Object.extend({ sync:true }, options)) });
      }).flatten(),
      this.options
    );
  }
});

Element.CSS_PROPERTIES = $w(
  'backgroundColor backgroundPosition borderBottomColor borderBottomStyle ' +
  'borderBottomWidth borderLeftColor borderLeftStyle borderLeftWidth ' +
  'borderRightColor borderRightStyle borderRightWidth borderSpacing ' +
  'borderTopColor borderTopStyle borderTopWidth bottom clip color ' +
  'fontSize fontWeight height left letterSpacing lineHeight ' +
  'marginBottom marginLeft marginRight marginTop markerOffset maxHeight '+
  'maxWidth minHeight minWidth opacity outlineColor outlineOffset ' +
  'outlineWidth paddingBottom paddingLeft paddingRight paddingTop ' +
  'right textIndent top width wordSpacing zIndex');

Element.CSS_LENGTH = /^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/;

String.__parseStyleElement = document.createElement('div');
String.prototype.parseStyle = function(){
  var style, styleRules = $H();
  if (Prototype.Browser.WebKit)
    style = new Element('div',{style:this}).style;
  else {
    String.__parseStyleElement.innerHTML = '<div style="' + this + '"></div>';
    style = String.__parseStyleElement.childNodes[0].style;
  }

  Element.CSS_PROPERTIES.each(function(property){
    if (style[property]) styleRules.set(property, style[property]);
  });

  if (Prototype.Browser.IE && this.include('opacity'))
    styleRules.set('opacity', this.match(/opacity:\s*((?:0|1)?(?:\.\d*)?)/)[1]);

  return styleRules;
};

if (document.defaultView && document.defaultView.getComputedStyle) {
  Element.getStyles = function(element) {
    var css = document.defaultView.getComputedStyle($(element), null);
    return Element.CSS_PROPERTIES.inject({ }, function(styles, property) {
      styles[property] = css[property];
      return styles;
    });
  };
} else {
  Element.getStyles = function(element) {
    element = $(element);
    var css = element.currentStyle, styles;
    styles = Element.CSS_PROPERTIES.inject({ }, function(results, property) {
      results[property] = css[property];
      return results;
    });
    if (!styles.opacity) styles.opacity = element.getOpacity();
    return styles;
  };
}

Effect.Methods = {
  morph: function(element, style) {
    element = $(element);
    new Effect.Morph(element, Object.extend({ style: style }, arguments[2] || { }));
    return element;
  },
  visualEffect: function(element, effect, options) {
    element = $(element);
    var s = effect.dasherize().camelize(), klass = s.charAt(0).toUpperCase() + s.substring(1);
    new Effect[klass](element, options);
    return element;
  },
  highlight: function(element, options) {
    element = $(element);
    new Effect.Highlight(element, options);
    return element;
  }
};

$w('fade appear grow shrink fold blindUp blindDown slideUp slideDown '+
  'pulsate shake puff squish switchOff dropOut').each(
  function(effect) {
    Effect.Methods[effect] = function(element, options){
      element = $(element);
      Effect[effect.charAt(0).toUpperCase() + effect.substring(1)](element, options);
      return element;
    };
  }
);

$w('getInlineOpacity forceRerendering setContentZoom collectTextNodes collectTextNodesIgnoreClass getStyles').each(
  function(f) { Effect.Methods[f] = Element[f]; }
);

Element.addMethods(Effect.Methods);
// script.aculo.us dragdrop.js v1.9.0, Thu Dec 23 16:54:48 -0500 2010

// Copyright (c) 2005-2010 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
//
// script.aculo.us is freely distributable under the terms of an MIT-style license.
// For details, see the script.aculo.us web site: http://script.aculo.us/

if(Object.isUndefined(Effect))
  throw("dragdrop.js requires including script.aculo.us' effects.js library");

var Droppables = {
  drops: [],

  remove: function(element) {
    this.drops = this.drops.reject(function(d) { return d.element==$(element) });
  },

  add: function(element) {
    element = $(element);
    var options = Object.extend({
      greedy:     true,
      hoverclass: null,
      tree:       false
    }, arguments[1] || { });

    // cache containers
    if(options.containment) {
      options._containers = [];
      var containment = options.containment;
      if(Object.isArray(containment)) {
        containment.each( function(c) { options._containers.push($(c)) });
      } else {
        options._containers.push($(containment));
      }
    }

    if(options.accept) options.accept = [options.accept].flatten();

    Element.makePositioned(element); // fix IE
    options.element = element;

    this.drops.push(options);
  },

  findDeepestChild: function(drops) {
    deepest = drops[0];

    for (i = 1; i < drops.length; ++i)
      if (Element.isParent(drops[i].element, deepest.element))
        deepest = drops[i];

    return deepest;
  },

  isContained: function(element, drop) {
    var containmentNode;
    if(drop.tree) {
      containmentNode = element.treeNode;
    } else {
      containmentNode = element.parentNode;
    }
    return drop._containers.detect(function(c) { return containmentNode == c });
  },

  isAffected: function(point, element, drop) {
    return (
      (drop.element!=element) &&
      ((!drop._containers) ||
        this.isContained(element, drop)) &&
      ((!drop.accept) ||
        (Element.classNames(element).detect(
          function(v) { return drop.accept.include(v) } ) )) &&
      Position.within(drop.element, point[0], point[1]) );
  },

  deactivate: function(drop) {
    if(drop.hoverclass)
      Element.removeClassName(drop.element, drop.hoverclass);
    this.last_active = null;
  },

  activate: function(drop) {
    if(drop.hoverclass)
      Element.addClassName(drop.element, drop.hoverclass);
    this.last_active = drop;
  },

  show: function(point, element) {
    if(!this.drops.length) return;
    var drop, affected = [];

    this.drops.each( function(drop) {
      if(Droppables.isAffected(point, element, drop))
        affected.push(drop);
    });

    if(affected.length>0)
      drop = Droppables.findDeepestChild(affected);

    if(this.last_active && this.last_active != drop) this.deactivate(this.last_active);
    if (drop) {
      Position.within(drop.element, point[0], point[1]);
      if(drop.onHover)
        drop.onHover(element, drop.element, Position.overlap(drop.overlap, drop.element));

      if (drop != this.last_active) Droppables.activate(drop);
    }
  },

  fire: function(event, element) {
    if(!this.last_active) return;
    Position.prepare();

    if (this.isAffected([Event.pointerX(event), Event.pointerY(event)], element, this.last_active))
      if (this.last_active.onDrop) {
        this.last_active.onDrop(element, this.last_active.element, event);
        return true;
      }
  },

  reset: function() {
    if(this.last_active)
      this.deactivate(this.last_active);
  }
};

var Draggables = {
  drags: [],
  observers: [],

  register: function(draggable) {
    if(this.drags.length == 0) {
      this.eventMouseUp   = this.endDrag.bindAsEventListener(this);
      this.eventMouseMove = this.updateDrag.bindAsEventListener(this);
      this.eventKeypress  = this.keyPress.bindAsEventListener(this);

      Event.observe(document, "mouseup", this.eventMouseUp);
      Event.observe(document, "mousemove", this.eventMouseMove);
      Event.observe(document, "keypress", this.eventKeypress);
    }
    this.drags.push(draggable);
  },

  unregister: function(draggable) {
    this.drags = this.drags.reject(function(d) { return d==draggable });
    if(this.drags.length == 0) {
      Event.stopObserving(document, "mouseup", this.eventMouseUp);
      Event.stopObserving(document, "mousemove", this.eventMouseMove);
      Event.stopObserving(document, "keypress", this.eventKeypress);
    }
  },

  activate: function(draggable) {
    if(draggable.options.delay) {
      this._timeout = setTimeout(function() {
        Draggables._timeout = null;
        window.focus();
        Draggables.activeDraggable = draggable;
      }.bind(this), draggable.options.delay);
    } else {
      window.focus(); // allows keypress events if window isn't currently focused, fails for Safari
      this.activeDraggable = draggable;
    }
  },

  deactivate: function() {
    this.activeDraggable = null;
  },

  updateDrag: function(event) {
    if(!this.activeDraggable) return;
    var pointer = [Event.pointerX(event), Event.pointerY(event)];
    // Mozilla-based browsers fire successive mousemove events with
    // the same coordinates, prevent needless redrawing (moz bug?)
    if(this._lastPointer && (this._lastPointer.inspect() == pointer.inspect())) return;
    this._lastPointer = pointer;

    this.activeDraggable.updateDrag(event, pointer);
  },

  endDrag: function(event) {
    if(this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
    if(!this.activeDraggable) return;
    this._lastPointer = null;
    this.activeDraggable.endDrag(event);
    this.activeDraggable = null;
  },

  keyPress: function(event) {
    if(this.activeDraggable)
      this.activeDraggable.keyPress(event);
  },

  addObserver: function(observer) {
    this.observers.push(observer);
    this._cacheObserverCallbacks();
  },

  removeObserver: function(element) {  // element instead of observer fixes mem leaks
    this.observers = this.observers.reject( function(o) { return o.element==element });
    this._cacheObserverCallbacks();
  },

  notify: function(eventName, draggable, event) {  // 'onStart', 'onEnd', 'onDrag'
    if(this[eventName+'Count'] > 0)
      this.observers.each( function(o) {
        if(o[eventName]) o[eventName](eventName, draggable, event);
      });
    if(draggable.options[eventName]) draggable.options[eventName](draggable, event);
  },

  _cacheObserverCallbacks: function() {
    ['onStart','onEnd','onDrag'].each( function(eventName) {
      Draggables[eventName+'Count'] = Draggables.observers.select(
        function(o) { return o[eventName]; }
      ).length;
    });
  }
};

/*--------------------------------------------------------------------------*/

var Draggable = Class.create({
  initialize: function(element) {
    var defaults = {
      handle: false,
      reverteffect: function(element, top_offset, left_offset) {
        var dur = Math.sqrt(Math.abs(top_offset^2)+Math.abs(left_offset^2))*0.02;
        new Effect.Move(element, { x: -left_offset, y: -top_offset, duration: dur,
          queue: {scope:'_draggable', position:'end'}
        });
      },
      endeffect: function(element) {
        var toOpacity = Object.isNumber(element._opacity) ? element._opacity : 1.0;
        new Effect.Opacity(element, {duration:0.2, from:0.7, to:toOpacity,
          queue: {scope:'_draggable', position:'end'},
          afterFinish: function(){
            Draggable._dragging[element] = false
          }
        });
      },
      zindex: 1000,
      revert: false,
      quiet: false,
      scroll: false,
      scrollSensitivity: 20,
      scrollSpeed: 15,
      snap: false,  // false, or xy or [x,y] or function(x,y){ return [x,y] }
      delay: 0
    };

    if(!arguments[1] || Object.isUndefined(arguments[1].endeffect))
      Object.extend(defaults, {
        starteffect: function(element) {
          element._opacity = Element.getOpacity(element);
          Draggable._dragging[element] = true;
          new Effect.Opacity(element, {duration:0.2, from:element._opacity, to:0.7});
        }
      });

    var options = Object.extend(defaults, arguments[1] || { });

    this.element = $(element);

    if(options.handle && Object.isString(options.handle))
      this.handle = this.element.down('.'+options.handle, 0);

    if(!this.handle) this.handle = $(options.handle);
    if(!this.handle) this.handle = this.element;

    if(options.scroll && !options.scroll.scrollTo && !options.scroll.outerHTML) {
      options.scroll = $(options.scroll);
      this._isScrollChild = Element.childOf(this.element, options.scroll);
    }

    Element.makePositioned(this.element); // fix IE

    this.options  = options;
    this.dragging = false;

    this.eventMouseDown = this.initDrag.bindAsEventListener(this);
    Event.observe(this.handle, "mousedown", this.eventMouseDown);

    Draggables.register(this);
  },

  destroy: function() {
    Event.stopObserving(this.handle, "mousedown", this.eventMouseDown);
    Draggables.unregister(this);
  },

  currentDelta: function() {
    return([
      parseInt(Element.getStyle(this.element,'left') || '0'),
      parseInt(Element.getStyle(this.element,'top') || '0')]);
  },

  initDrag: function(event) {
    if(!Object.isUndefined(Draggable._dragging[this.element]) &&
      Draggable._dragging[this.element]) return;
    if(Event.isLeftClick(event)) {
      // abort on form elements, fixes a Firefox issue
      var src = Event.element(event);
      if((tag_name = src.tagName.toUpperCase()) && (
        tag_name=='INPUT' ||
        tag_name=='SELECT' ||
        tag_name=='OPTION' ||
        tag_name=='BUTTON' ||
        tag_name=='TEXTAREA')) return;

      var pointer = [Event.pointerX(event), Event.pointerY(event)];
      var pos     = this.element.cumulativeOffset();
      this.offset = [0,1].map( function(i) { return (pointer[i] - pos[i]) });

      Draggables.activate(this);
      Event.stop(event);
    }
  },

  startDrag: function(event) {
    this.dragging = true;
    if(!this.delta)
      this.delta = this.currentDelta();

    if(this.options.zindex) {
      this.originalZ = parseInt(Element.getStyle(this.element,'z-index') || 0);
      this.element.style.zIndex = this.options.zindex;
    }

    if(this.options.ghosting) {
      this._clone = this.element.cloneNode(true);
      this._originallyAbsolute = (this.element.getStyle('position') == 'absolute');
      if (!this._originallyAbsolute)
        Position.absolutize(this.element);
      this.element.parentNode.insertBefore(this._clone, this.element);
    }

    if(this.options.scroll) {
      if (this.options.scroll == window) {
        var where = this._getWindowScroll(this.options.scroll);
        this.originalScrollLeft = where.left;
        this.originalScrollTop = where.top;
      } else {
        this.originalScrollLeft = this.options.scroll.scrollLeft;
        this.originalScrollTop = this.options.scroll.scrollTop;
      }
    }

    Draggables.notify('onStart', this, event);

    if(this.options.starteffect) this.options.starteffect(this.element);
  },

  updateDrag: function(event, pointer) {
    if(!this.dragging) this.startDrag(event);

    if(!this.options.quiet){
      Position.prepare();
      Droppables.show(pointer, this.element);
    }

    Draggables.notify('onDrag', this, event);

    this.draw(pointer);
    if(this.options.change) this.options.change(this);

    if(this.options.scroll) {
      this.stopScrolling();

      var p;
      if (this.options.scroll == window) {
        with(this._getWindowScroll(this.options.scroll)) { p = [ left, top, left+width, top+height ]; }
      } else {
        p = Position.page(this.options.scroll).toArray();
        p[0] += this.options.scroll.scrollLeft + Position.deltaX;
        p[1] += this.options.scroll.scrollTop + Position.deltaY;
        p.push(p[0]+this.options.scroll.offsetWidth);
        p.push(p[1]+this.options.scroll.offsetHeight);
      }
      var speed = [0,0];
      if(pointer[0] < (p[0]+this.options.scrollSensitivity)) speed[0] = pointer[0]-(p[0]+this.options.scrollSensitivity);
      if(pointer[1] < (p[1]+this.options.scrollSensitivity)) speed[1] = pointer[1]-(p[1]+this.options.scrollSensitivity);
      if(pointer[0] > (p[2]-this.options.scrollSensitivity)) speed[0] = pointer[0]-(p[2]-this.options.scrollSensitivity);
      if(pointer[1] > (p[3]-this.options.scrollSensitivity)) speed[1] = pointer[1]-(p[3]-this.options.scrollSensitivity);
      this.startScrolling(speed);
    }

    // fix AppleWebKit rendering
    if(Prototype.Browser.WebKit) window.scrollBy(0,0);

    Event.stop(event);
  },

  finishDrag: function(event, success) {
    this.dragging = false;

    if(this.options.quiet){
      Position.prepare();
      var pointer = [Event.pointerX(event), Event.pointerY(event)];
      Droppables.show(pointer, this.element);
    }

    if(this.options.ghosting) {
      if (!this._originallyAbsolute)
        Position.relativize(this.element);
      delete this._originallyAbsolute;
      Element.remove(this._clone);
      this._clone = null;
    }

    var dropped = false;
    if(success) {
      dropped = Droppables.fire(event, this.element);
      if (!dropped) dropped = false;
    }
    if(dropped && this.options.onDropped) this.options.onDropped(this.element);
    Draggables.notify('onEnd', this, event);

    var revert = this.options.revert;
    if(revert && Object.isFunction(revert)) revert = revert(this.element);

    var d = this.currentDelta();
    if(revert && this.options.reverteffect) {
      if (dropped == 0 || revert != 'failure')
        this.options.reverteffect(this.element,
          d[1]-this.delta[1], d[0]-this.delta[0]);
    } else {
      this.delta = d;
    }

    if(this.options.zindex)
      this.element.style.zIndex = this.originalZ;

    if(this.options.endeffect)
      this.options.endeffect(this.element);

    Draggables.deactivate(this);
    Droppables.reset();
  },

  keyPress: function(event) {
    if(event.keyCode!=Event.KEY_ESC) return;
    this.finishDrag(event, false);
    Event.stop(event);
  },

  endDrag: function(event) {
    if(!this.dragging) return;
    this.stopScrolling();
    this.finishDrag(event, true);
    Event.stop(event);
  },

  draw: function(point) {
    var pos = this.element.cumulativeOffset();
    if(this.options.ghosting) {
      var r   = Position.realOffset(this.element);
      pos[0] += r[0] - Position.deltaX; pos[1] += r[1] - Position.deltaY;
    }

    var d = this.currentDelta();
    pos[0] -= d[0]; pos[1] -= d[1];

    if(this.options.scroll && (this.options.scroll != window && this._isScrollChild)) {
      pos[0] -= this.options.scroll.scrollLeft-this.originalScrollLeft;
      pos[1] -= this.options.scroll.scrollTop-this.originalScrollTop;
    }

    var p = [0,1].map(function(i){
      return (point[i]-pos[i]-this.offset[i])
    }.bind(this));

    if(this.options.snap) {
      if(Object.isFunction(this.options.snap)) {
        p = this.options.snap(p[0],p[1],this);
      } else {
      if(Object.isArray(this.options.snap)) {
        p = p.map( function(v, i) {
          return (v/this.options.snap[i]).round()*this.options.snap[i] }.bind(this));
      } else {
        p = p.map( function(v) {
          return (v/this.options.snap).round()*this.options.snap }.bind(this));
      }
    }}

    var style = this.element.style;
    if((!this.options.constraint) || (this.options.constraint=='horizontal'))
      style.left = p[0] + "px";
    if((!this.options.constraint) || (this.options.constraint=='vertical'))
      style.top  = p[1] + "px";

    if(style.visibility=="hidden") style.visibility = ""; // fix gecko rendering
  },

  stopScrolling: function() {
    if(this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
      Draggables._lastScrollPointer = null;
    }
  },

  startScrolling: function(speed) {
    if(!(speed[0] || speed[1])) return;
    this.scrollSpeed = [speed[0]*this.options.scrollSpeed,speed[1]*this.options.scrollSpeed];
    this.lastScrolled = new Date();
    this.scrollInterval = setInterval(this.scroll.bind(this), 10);
  },

  scroll: function() {
    var current = new Date();
    var delta = current - this.lastScrolled;
    this.lastScrolled = current;
    if(this.options.scroll == window) {
      with (this._getWindowScroll(this.options.scroll)) {
        if (this.scrollSpeed[0] || this.scrollSpeed[1]) {
          var d = delta / 1000;
          this.options.scroll.scrollTo( left + d*this.scrollSpeed[0], top + d*this.scrollSpeed[1] );
        }
      }
    } else {
      this.options.scroll.scrollLeft += this.scrollSpeed[0] * delta / 1000;
      this.options.scroll.scrollTop  += this.scrollSpeed[1] * delta / 1000;
    }

    Position.prepare();
    Droppables.show(Draggables._lastPointer, this.element);
    Draggables.notify('onDrag', this);
    if (this._isScrollChild) {
      Draggables._lastScrollPointer = Draggables._lastScrollPointer || $A(Draggables._lastPointer);
      Draggables._lastScrollPointer[0] += this.scrollSpeed[0] * delta / 1000;
      Draggables._lastScrollPointer[1] += this.scrollSpeed[1] * delta / 1000;
      if (Draggables._lastScrollPointer[0] < 0)
        Draggables._lastScrollPointer[0] = 0;
      if (Draggables._lastScrollPointer[1] < 0)
        Draggables._lastScrollPointer[1] = 0;
      this.draw(Draggables._lastScrollPointer);
    }

    if(this.options.change) this.options.change(this);
  },

  _getWindowScroll: function(w) {
    var T, L, W, H;
    with (w.document) {
      if (w.document.documentElement && documentElement.scrollTop) {
        T = documentElement.scrollTop;
        L = documentElement.scrollLeft;
      } else if (w.document.body) {
        T = body.scrollTop;
        L = body.scrollLeft;
      }
      if (w.innerWidth) {
        W = w.innerWidth;
        H = w.innerHeight;
      } else if (w.document.documentElement && documentElement.clientWidth) {
        W = documentElement.clientWidth;
        H = documentElement.clientHeight;
      } else {
        W = body.offsetWidth;
        H = body.offsetHeight;
      }
    }
    return { top: T, left: L, width: W, height: H };
  }
});

Draggable._dragging = { };

/*--------------------------------------------------------------------------*/

var SortableObserver = Class.create({
  initialize: function(element, observer) {
    this.element   = $(element);
    this.observer  = observer;
    this.lastValue = Sortable.serialize(this.element);
  },

  onStart: function() {
    this.lastValue = Sortable.serialize(this.element);
  },

  onEnd: function() {
    Sortable.unmark();
    if(this.lastValue != Sortable.serialize(this.element))
      this.observer(this.element)
  }
});

var Sortable = {
  SERIALIZE_RULE: /^[^_\-](?:[A-Za-z0-9\-\_]*)[_](.*)$/,

  sortables: { },

  _findRootElement: function(element) {
    while (element.tagName.toUpperCase() != "BODY") {
      if(element.id && Sortable.sortables[element.id]) return element;
      element = element.parentNode;
    }
  },

  options: function(element) {
    element = Sortable._findRootElement($(element));
    if(!element) return;
    return Sortable.sortables[element.id];
  },

  destroy: function(element){
    element = $(element);
    var s = Sortable.sortables[element.id];

    if(s) {
      Draggables.removeObserver(s.element);
      s.droppables.each(function(d){ Droppables.remove(d) });
      s.draggables.invoke('destroy');

      delete Sortable.sortables[s.element.id];
    }
  },

  create: function(element) {
    element = $(element);
    var options = Object.extend({
      element:     element,
      tag:         'li',       // assumes li children, override with tag: 'tagname'
      dropOnEmpty: false,
      tree:        false,
      treeTag:     'ul',
      overlap:     'vertical', // one of 'vertical', 'horizontal'
      constraint:  'vertical', // one of 'vertical', 'horizontal', false
      containment: element,    // also takes array of elements (or id's); or false
      handle:      false,      // or a CSS class
      only:        false,
      delay:       0,
      hoverclass:  null,
      ghosting:    false,
      quiet:       false,
      scroll:      false,
      scrollSensitivity: 20,
      scrollSpeed: 15,
      format:      this.SERIALIZE_RULE,

      // these take arrays of elements or ids and can be
      // used for better initialization performance
      elements:    false,
      handles:     false,

      onChange:    Prototype.emptyFunction,
      onUpdate:    Prototype.emptyFunction
    }, arguments[1] || { });

    // clear any old sortable with same element
    this.destroy(element);

    // build options for the draggables
    var options_for_draggable = {
      revert:      true,
      quiet:       options.quiet,
      scroll:      options.scroll,
      scrollSpeed: options.scrollSpeed,
      scrollSensitivity: options.scrollSensitivity,
      delay:       options.delay,
      ghosting:    options.ghosting,
      constraint:  options.constraint,
      handle:      options.handle };

    if(options.starteffect)
      options_for_draggable.starteffect = options.starteffect;

    if(options.reverteffect)
      options_for_draggable.reverteffect = options.reverteffect;
    else
      if(options.ghosting) options_for_draggable.reverteffect = function(element) {
        element.style.top  = 0;
        element.style.left = 0;
      };

    if(options.endeffect)
      options_for_draggable.endeffect = options.endeffect;

    if(options.zindex)
      options_for_draggable.zindex = options.zindex;

    // build options for the droppables
    var options_for_droppable = {
      overlap:     options.overlap,
      containment: options.containment,
      tree:        options.tree,
      hoverclass:  options.hoverclass,
      onHover:     Sortable.onHover
    };

    var options_for_tree = {
      onHover:      Sortable.onEmptyHover,
      overlap:      options.overlap,
      containment:  options.containment,
      hoverclass:   options.hoverclass
    };

    // fix for gecko engine
    Element.cleanWhitespace(element);

    options.draggables = [];
    options.droppables = [];

    // drop on empty handling
    if(options.dropOnEmpty || options.tree) {
      Droppables.add(element, options_for_tree);
      options.droppables.push(element);
    }

    (options.elements || this.findElements(element, options) || []).each( function(e,i) {
      var handle = options.handles ? $(options.handles[i]) :
        (options.handle ? $(e).select('.' + options.handle)[0] : e);
      options.draggables.push(
        new Draggable(e, Object.extend(options_for_draggable, { handle: handle })));
      Droppables.add(e, options_for_droppable);
      if(options.tree) e.treeNode = element;
      options.droppables.push(e);
    });

    if(options.tree) {
      (Sortable.findTreeElements(element, options) || []).each( function(e) {
        Droppables.add(e, options_for_tree);
        e.treeNode = element;
        options.droppables.push(e);
      });
    }

    // keep reference
    this.sortables[element.identify()] = options;

    // for onupdate
    Draggables.addObserver(new SortableObserver(element, options.onUpdate));

  },

  // return all suitable-for-sortable elements in a guaranteed order
  findElements: function(element, options) {
    return Element.findChildren(
      element, options.only, options.tree ? true : false, options.tag);
  },

  findTreeElements: function(element, options) {
    return Element.findChildren(
      element, options.only, options.tree ? true : false, options.treeTag);
  },

  onHover: function(element, dropon, overlap) {
    if(Element.isParent(dropon, element)) return;

    if(overlap > .33 && overlap < .66 && Sortable.options(dropon).tree) {
      return;
    } else if(overlap>0.5) {
      Sortable.mark(dropon, 'before');
      if(dropon.previousSibling != element) {
        var oldParentNode = element.parentNode;
        element.style.visibility = "hidden"; // fix gecko rendering
        dropon.parentNode.insertBefore(element, dropon);
        if(dropon.parentNode!=oldParentNode)
          Sortable.options(oldParentNode).onChange(element);
        Sortable.options(dropon.parentNode).onChange(element);
      }
    } else {
      Sortable.mark(dropon, 'after');
      var nextElement = dropon.nextSibling || null;
      if(nextElement != element) {
        var oldParentNode = element.parentNode;
        element.style.visibility = "hidden"; // fix gecko rendering
        dropon.parentNode.insertBefore(element, nextElement);
        if(dropon.parentNode!=oldParentNode)
          Sortable.options(oldParentNode).onChange(element);
        Sortable.options(dropon.parentNode).onChange(element);
      }
    }
  },

  onEmptyHover: function(element, dropon, overlap) {
    var oldParentNode = element.parentNode;
    var droponOptions = Sortable.options(dropon);

    if(!Element.isParent(dropon, element)) {
      var index;

      var children = Sortable.findElements(dropon, {tag: droponOptions.tag, only: droponOptions.only});
      var child = null;

      if(children) {
        var offset = Element.offsetSize(dropon, droponOptions.overlap) * (1.0 - overlap);

        for (index = 0; index < children.length; index += 1) {
          if (offset - Element.offsetSize (children[index], droponOptions.overlap) >= 0) {
            offset -= Element.offsetSize (children[index], droponOptions.overlap);
          } else if (offset - (Element.offsetSize (children[index], droponOptions.overlap) / 2) >= 0) {
            child = index + 1 < children.length ? children[index + 1] : null;
            break;
          } else {
            child = children[index];
            break;
          }
        }
      }

      dropon.insertBefore(element, child);

      Sortable.options(oldParentNode).onChange(element);
      droponOptions.onChange(element);
    }
  },

  unmark: function() {
    if(Sortable._marker) Sortable._marker.hide();
  },

  mark: function(dropon, position) {
    // mark on ghosting only
    var sortable = Sortable.options(dropon.parentNode);
    if(sortable && !sortable.ghosting) return;

    if(!Sortable._marker) {
      Sortable._marker =
        ($('dropmarker') || Element.extend(document.createElement('DIV'))).
          hide().addClassName('dropmarker').setStyle({position:'absolute'});
      document.getElementsByTagName("body").item(0).appendChild(Sortable._marker);
    }
    var offsets = dropon.cumulativeOffset();
    Sortable._marker.setStyle({left: offsets[0]+'px', top: offsets[1] + 'px'});

    if(position=='after')
      if(sortable.overlap == 'horizontal')
        Sortable._marker.setStyle({left: (offsets[0]+dropon.clientWidth) + 'px'});
      else
        Sortable._marker.setStyle({top: (offsets[1]+dropon.clientHeight) + 'px'});

    Sortable._marker.show();
  },

  _tree: function(element, options, parent) {
    var children = Sortable.findElements(element, options) || [];

    for (var i = 0; i < children.length; ++i) {
      var match = children[i].id.match(options.format);

      if (!match) continue;

      var child = {
        id: encodeURIComponent(match ? match[1] : null),
        element: element,
        parent: parent,
        children: [],
        position: parent.children.length,
        container: $(children[i]).down(options.treeTag)
      };

      /* Get the element containing the children and recurse over it */
      if (child.container)
        this._tree(child.container, options, child);

      parent.children.push (child);
    }

    return parent;
  },

  tree: function(element) {
    element = $(element);
    var sortableOptions = this.options(element);
    var options = Object.extend({
      tag: sortableOptions.tag,
      treeTag: sortableOptions.treeTag,
      only: sortableOptions.only,
      name: element.id,
      format: sortableOptions.format
    }, arguments[1] || { });

    var root = {
      id: null,
      parent: null,
      children: [],
      container: element,
      position: 0
    };

    return Sortable._tree(element, options, root);
  },

  /* Construct a [i] index for a particular node */
  _constructIndex: function(node) {
    var index = '';
    do {
      if (node.id) index = '[' + node.position + ']' + index;
    } while ((node = node.parent) != null);
    return index;
  },

  sequence: function(element) {
    element = $(element);
    var options = Object.extend(this.options(element), arguments[1] || { });

    return $(this.findElements(element, options) || []).map( function(item) {
      return item.id.match(options.format) ? item.id.match(options.format)[1] : '';
    });
  },

  setSequence: function(element, new_sequence) {
    element = $(element);
    var options = Object.extend(this.options(element), arguments[2] || { });

    var nodeMap = { };
    this.findElements(element, options).each( function(n) {
        if (n.id.match(options.format))
            nodeMap[n.id.match(options.format)[1]] = [n, n.parentNode];
        n.parentNode.removeChild(n);
    });

    new_sequence.each(function(ident) {
      var n = nodeMap[ident];
      if (n) {
        n[1].appendChild(n[0]);
        delete nodeMap[ident];
      }
    });
  },

  serialize: function(element) {
    element = $(element);
    var options = Object.extend(Sortable.options(element), arguments[1] || { });
    var name = encodeURIComponent(
      (arguments[1] && arguments[1].name) ? arguments[1].name : element.id);

    if (options.tree) {
      return Sortable.tree(element, arguments[1]).children.map( function (item) {
        return [name + Sortable._constructIndex(item) + "[id]=" +
                encodeURIComponent(item.id)].concat(item.children.map(arguments.callee));
      }).flatten().join('&');
    } else {
      return Sortable.sequence(element, arguments[1]).map( function(item) {
        return name + "[]=" + encodeURIComponent(item);
      }).join('&');
    }
  }
};

// Returns true if child is contained within element
Element.isParent = function(child, element) {
  if (!child.parentNode || child == element) return false;
  if (child.parentNode == element) return true;
  return Element.isParent(child.parentNode, element);
};

Element.findChildren = function(element, only, recursive, tagName) {
  if(!element.hasChildNodes()) return null;
  tagName = tagName.toUpperCase();
  if(only) only = [only].flatten();
  var elements = [];
  $A(element.childNodes).each( function(e) {
    if(e.tagName && e.tagName.toUpperCase()==tagName &&
      (!only || (Element.classNames(e).detect(function(v) { return only.include(v) }))))
        elements.push(e);
    if(recursive) {
      var grandchildren = Element.findChildren(e, only, recursive, tagName);
      if(grandchildren) elements.push(grandchildren);
    }
  });

  return (elements.length>0 ? elements.flatten() : []);
};

Element.offsetSize = function (element, type) {
  return element['offset' + ((type=='vertical' || type=='height') ? 'Height' : 'Width')];
};
// script.aculo.us controls.js v1.8.2, Tue Nov 18 18:30:58 +0100 2008

// Copyright (c) 2005-2008 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
//           (c) 2005-2008 Ivan Krstic (http://blogs.law.harvard.edu/ivan)
//           (c) 2005-2008 Jon Tirsen (http://www.tirsen.com)
// Contributors:
//  Richard Livsey
//  Rahul Bhargava
//  Rob Wills
//
// script.aculo.us is freely distributable under the terms of an MIT-style license.
// For details, see the script.aculo.us web site: http://script.aculo.us/

// Autocompleter.Base handles all the autocompletion functionality
// that's independent of the data source for autocompletion. This
// includes drawing the autocompletion menu, observing keyboard
// and mouse events, and similar.
//
// Specific autocompleters need to provide, at the very least,
// a getUpdatedChoices function that will be invoked every time
// the text inside the monitored textbox changes. This method
// should get the text for which to provide autocompletion by
// invoking this.getToken(), NOT by directly accessing
// this.element.value. This is to allow incremental tokenized
// autocompletion. Specific auto-completion logic (AJAX, etc)
// belongs in getUpdatedChoices.
//
// Tokenized incremental autocompletion is enabled automatically
// when an autocompleter is instantiated with the 'tokens' option
// in the options parameter, e.g.:
// new Ajax.Autocompleter('id','upd', '/url/', { tokens: ',' });
// will incrementally autocomplete with a comma as the token.
// Additionally, ',' in the above example can be replaced with
// a token array, e.g. { tokens: [',', '\n'] } which
// enables autocompletion on multiple tokens. This is most
// useful when one of the tokens is \n (a newline), as it
// allows smart autocompletion after linebreaks.

if(typeof Effect == 'undefined')
  throw("controls.js requires including script.aculo.us' effects.js library");

var Autocompleter = { };
Autocompleter.Base = Class.create({
  baseInitialize: function(element, update, options) {
    element          = $(element);
    this.element     = element;
    this.update      = $(update);
    this.hasFocus    = false;
    this.changed     = false;
    this.active      = false;
    this.index       = 0;
    this.entryCount  = 0;
    this.oldElementValue = this.element.value;

    if(this.setOptions)
      this.setOptions(options);
    else
      this.options = options || { };

    this.options.paramName    = this.options.paramName || this.element.name;
    this.options.tokens       = this.options.tokens || [];
    this.options.frequency    = this.options.frequency || 0.4;
    this.options.minChars     = this.options.minChars || 1;
    this.options.onShow       = this.options.onShow ||
      function(element, update){
        if(!update.style.position || update.style.position=='absolute') {
          update.style.position = 'absolute';
          Position.clone(element, update, {
            setHeight: false,
            offsetTop: element.offsetHeight
          });
        }
        Effect.Appear(update,{duration:0.15});
      };
    this.options.onHide = this.options.onHide ||
      function(element, update){ new Effect.Fade(update,{duration:0.15}) };

    if(typeof(this.options.tokens) == 'string')
      this.options.tokens = new Array(this.options.tokens);
    // Force carriage returns as token delimiters anyway
    if (!this.options.tokens.include('\n'))
      this.options.tokens.push('\n');

    this.observer = null;

    this.element.setAttribute('autocomplete','off');

    Element.hide(this.update);

    Event.observe(this.element, 'blur', this.onBlur.bindAsEventListener(this));
    Event.observe(this.element, 'keydown', this.onKeyPress.bindAsEventListener(this));
  },

  show: function() {
    if(Element.getStyle(this.update, 'display')=='none') this.options.onShow(this.element, this.update);
    if(!this.iefix &&
      (Prototype.Browser.IE) &&
      (Element.getStyle(this.update, 'position')=='absolute')) {
      new Insertion.After(this.update,
       '<iframe id="' + this.update.id + '_iefix" '+
       'style="display:none;position:absolute;filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0);" ' +
       'src="javascript:false;" frameborder="0" scrolling="no"></iframe>');
      this.iefix = $(this.update.id+'_iefix');
    }
    if(this.iefix) setTimeout(this.fixIEOverlapping.bind(this), 50);
  },

  fixIEOverlapping: function() {
    Position.clone(this.update, this.iefix, {setTop:(!this.update.style.height)});
    this.iefix.style.zIndex = 1;
    this.update.style.zIndex = 2;
    Element.show(this.iefix);
  },

  hide: function() {
    this.stopIndicator();
    if(Element.getStyle(this.update, 'display')!='none') this.options.onHide(this.element, this.update);
    if(this.iefix) Element.hide(this.iefix);
  },

  startIndicator: function() {
    if(this.options.indicator) Element.show(this.options.indicator);
  },

  stopIndicator: function() {
    if(this.options.indicator) Element.hide(this.options.indicator);
  },

  onKeyPress: function(event) {
    if(this.active)
      switch(event.keyCode) {
       case Event.KEY_TAB:
       case Event.KEY_RETURN:
         this.selectEntry();
         Event.stop(event);
       case Event.KEY_ESC:
         this.hide();
         this.active = false;
         Event.stop(event);
         return;
       case Event.KEY_LEFT:
       case Event.KEY_RIGHT:
         return;
       case Event.KEY_UP:
         this.markPrevious();
         this.render();
         Event.stop(event);
         return;
       case Event.KEY_DOWN:
         this.markNext();
         this.render();
         Event.stop(event);
         return;
      }
     else
       if(event.keyCode==Event.KEY_TAB || event.keyCode==Event.KEY_RETURN ||
         (Prototype.Browser.WebKit > 0 && event.keyCode == 0)) return;

    this.changed = true;
    this.hasFocus = true;

    if(this.observer) clearTimeout(this.observer);
      this.observer =
        setTimeout(this.onObserverEvent.bind(this), this.options.frequency*1000);
  },

  activate: function() {
    this.changed = false;
    this.hasFocus = true;
    this.getUpdatedChoices();
  },

  onHover: function(event) {
    var element = Event.findElement(event, 'LI');
    if(this.index != element.autocompleteIndex)
    {
        this.index = element.autocompleteIndex;
        this.render();
    }
    Event.stop(event);
  },

  onClick: function(event) {
    var element = Event.findElement(event, 'LI');
    this.index = element.autocompleteIndex;
    this.selectEntry();
    this.hide();
  },

  onBlur: function(event) {
    // needed to make click events working
    setTimeout(this.hide.bind(this), 250);
    this.hasFocus = false;
    this.active = false;
  },

  render: function() {
    if(this.entryCount > 0) {
      for (var i = 0; i < this.entryCount; i++)
        this.index==i ?
          Element.addClassName(this.getEntry(i),"selected") :
          Element.removeClassName(this.getEntry(i),"selected");
      if(this.hasFocus) {
        this.show();
        this.active = true;
      }
    } else {
      this.active = false;
      this.hide();
    }
  },

  markPrevious: function() {
    if(this.index > 0) this.index--;
      else this.index = this.entryCount-1;
    //this.getEntry(this.index).scrollIntoView(true); useless
  },

  markNext: function() {
    if(this.index < this.entryCount-1) this.index++;
      else this.index = 0;
    this.getEntry(this.index).scrollIntoView(false);
  },

  getEntry: function(index) {
    return this.update.firstChild.childNodes[index];
  },

  getCurrentEntry: function() {
    return this.getEntry(this.index);
  },

  selectEntry: function() {
    this.active = false;
    this.updateElement(this.getCurrentEntry());
  },

  updateElement: function(selectedElement) {
    if (this.options.updateElement) {
      this.options.updateElement(selectedElement);
      return;
    }
    var value = '';
    if (this.options.select) {
      var nodes = $(selectedElement).select('.' + this.options.select) || [];
      if(nodes.length>0) value = Element.collectTextNodes(nodes[0], this.options.select);
    } else
      value = Element.collectTextNodesIgnoreClass(selectedElement, 'informal');

    var bounds = this.getTokenBounds();
    if (bounds[0] != -1) {
      var newValue = this.element.value.substr(0, bounds[0]);
      var whitespace = this.element.value.substr(bounds[0]).match(/^\s+/);
      if (whitespace)
        newValue += whitespace[0];
      this.element.value = newValue + value + this.element.value.substr(bounds[1]);
    } else {
      this.element.value = value;
    }
    this.oldElementValue = this.element.value;
    this.element.focus();

    if (this.options.afterUpdateElement)
      this.options.afterUpdateElement(this.element, selectedElement);
  },

  updateChoices: function(choices) {
    if(!this.changed && this.hasFocus) {
      this.update.innerHTML = choices;
      Element.cleanWhitespace(this.update);
      Element.cleanWhitespace(this.update.down());

      if(this.update.firstChild && this.update.down().childNodes) {
        this.entryCount =
          this.update.down().childNodes.length;
        for (var i = 0; i < this.entryCount; i++) {
          var entry = this.getEntry(i);
          entry.autocompleteIndex = i;
          this.addObservers(entry);
        }
      } else {
        this.entryCount = 0;
      }

      this.stopIndicator();
      this.index = 0;

      if(this.entryCount==1 && this.options.autoSelect) {
        this.selectEntry();
        this.hide();
      } else {
        this.render();
      }
    }
  },

  addObservers: function(element) {
    Event.observe(element, "mouseover", this.onHover.bindAsEventListener(this));
    Event.observe(element, "click", this.onClick.bindAsEventListener(this));
  },

  onObserverEvent: function() {
    this.changed = false;
    this.tokenBounds = null;
    if(this.getToken().length>=this.options.minChars) {
      this.getUpdatedChoices();
    } else {
      this.active = false;
      this.hide();
    }
    this.oldElementValue = this.element.value;
  },

  getToken: function() {
    var bounds = this.getTokenBounds();
    return this.element.value.substring(bounds[0], bounds[1]).strip();
  },

  getTokenBounds: function() {
    if (null != this.tokenBounds) return this.tokenBounds;
    var value = this.element.value;
    if (value.strip().empty()) return [-1, 0];
    var diff = arguments.callee.getFirstDifferencePos(value, this.oldElementValue);
    var offset = (diff == this.oldElementValue.length ? 1 : 0);
    var prevTokenPos = -1, nextTokenPos = value.length;
    var tp;
    for (var index = 0, l = this.options.tokens.length; index < l; ++index) {
      tp = value.lastIndexOf(this.options.tokens[index], diff + offset - 1);
      if (tp > prevTokenPos) prevTokenPos = tp;
      tp = value.indexOf(this.options.tokens[index], diff + offset);
      if (-1 != tp && tp < nextTokenPos) nextTokenPos = tp;
    }
    return (this.tokenBounds = [prevTokenPos + 1, nextTokenPos]);
  }
});

Autocompleter.Base.prototype.getTokenBounds.getFirstDifferencePos = function(newS, oldS) {
  var boundary = Math.min(newS.length, oldS.length);
  for (var index = 0; index < boundary; ++index)
    if (newS[index] != oldS[index])
      return index;
  return boundary;
};

Ajax.Autocompleter = Class.create(Autocompleter.Base, {
  initialize: function(element, update, url, options) {
    this.baseInitialize(element, update, options);
    this.options.asynchronous  = true;
    this.options.onComplete    = this.onComplete.bind(this);
    this.options.defaultParams = this.options.parameters || null;
    this.url                   = url;
  },

  getUpdatedChoices: function() {
    this.startIndicator();

    var entry = encodeURIComponent(this.options.paramName) + '=' +
      encodeURIComponent(this.getToken());

    this.options.parameters = this.options.callback ?
      this.options.callback(this.element, entry) : entry;

    if(this.options.defaultParams)
      this.options.parameters += '&' + this.options.defaultParams;

    new Ajax.Request(this.url, this.options);
  },

  onComplete: function(request) {
    this.updateChoices(request.responseText);
  }
});

// The local array autocompleter. Used when you'd prefer to
// inject an array of autocompletion options into the page, rather
// than sending out Ajax queries, which can be quite slow sometimes.
//
// The constructor takes four parameters. The first two are, as usual,
// the id of the monitored textbox, and id of the autocompletion menu.
// The third is the array you want to autocomplete from, and the fourth
// is the options block.
//
// Extra local autocompletion options:
// - choices - How many autocompletion choices to offer
//
// - partialSearch - If false, the autocompleter will match entered
//                    text only at the beginning of strings in the
//                    autocomplete array. Defaults to true, which will
//                    match text at the beginning of any *word* in the
//                    strings in the autocomplete array. If you want to
//                    search anywhere in the string, additionally set
//                    the option fullSearch to true (default: off).
//
// - fullSsearch - Search anywhere in autocomplete array strings.
//
// - partialChars - How many characters to enter before triggering
//                   a partial match (unlike minChars, which defines
//                   how many characters are required to do any match
//                   at all). Defaults to 2.
//
// - ignoreCase - Whether to ignore case when autocompleting.
//                 Defaults to true.
//
// It's possible to pass in a custom function as the 'selector'
// option, if you prefer to write your own autocompletion logic.
// In that case, the other options above will not apply unless
// you support them.

Autocompleter.Local = Class.create(Autocompleter.Base, {
  initialize: function(element, update, array, options) {
    this.baseInitialize(element, update, options);
    this.options.array = array;
  },

  getUpdatedChoices: function() {
    this.updateChoices(this.options.selector(this));
  },

  setOptions: function(options) {
    this.options = Object.extend({
      choices: 10,
      partialSearch: true,
      partialChars: 2,
      ignoreCase: true,
      fullSearch: false,
      selector: function(instance) {
        var ret       = []; // Beginning matches
        var partial   = []; // Inside matches
        var entry     = instance.getToken();
        var count     = 0;

        for (var i = 0; i < instance.options.array.length &&
          ret.length < instance.options.choices ; i++) {

          var elem = instance.options.array[i];
          var foundPos = instance.options.ignoreCase ?
            elem.toLowerCase().indexOf(entry.toLowerCase()) :
            elem.indexOf(entry);

          while (foundPos != -1) {
            if (foundPos == 0 && elem.length != entry.length) {
              ret.push("<li><strong>" + elem.substr(0, entry.length) + "</strong>" +
                elem.substr(entry.length) + "</li>");
              break;
            } else if (entry.length >= instance.options.partialChars &&
              instance.options.partialSearch && foundPos != -1) {
              if (instance.options.fullSearch || /\s/.test(elem.substr(foundPos-1,1))) {
                partial.push("<li>" + elem.substr(0, foundPos) + "<strong>" +
                  elem.substr(foundPos, entry.length) + "</strong>" + elem.substr(
                  foundPos + entry.length) + "</li>");
                break;
              }
            }

            foundPos = instance.options.ignoreCase ?
              elem.toLowerCase().indexOf(entry.toLowerCase(), foundPos + 1) :
              elem.indexOf(entry, foundPos + 1);

          }
        }
        if (partial.length)
          ret = ret.concat(partial.slice(0, instance.options.choices - ret.length));
        return "<ul>" + ret.join('') + "</ul>";
      }
    }, options || { });
  }
});

// AJAX in-place editor and collection editor
// Full rewrite by Christophe Porteneuve <tdd@tddsworld.com> (April 2007).

// Use this if you notice weird scrolling problems on some browsers,
// the DOM might be a bit confused when this gets called so do this
// waits 1 ms (with setTimeout) until it does the activation
Field.scrollFreeActivate = function(field) {
  setTimeout(function() {
    Field.activate(field);
  }, 1);
};

Ajax.InPlaceEditor = Class.create({
  initialize: function(element, url, options) {
    this.url = url;
    this.element = element = $(element);
    this.prepareOptions();
    this._controls = { };
    arguments.callee.dealWithDeprecatedOptions(options); // DEPRECATION LAYER!!!
    Object.extend(this.options, options || { });
    if (!this.options.formId && this.element.id) {
      this.options.formId = this.element.id + '-inplaceeditor';
      if ($(this.options.formId))
        this.options.formId = '';
    }
    if (this.options.externalControl)
      this.options.externalControl = $(this.options.externalControl);
    if (!this.options.externalControl)
      this.options.externalControlOnly = false;
    this._originalBackground = this.element.getStyle('background-color') || 'transparent';
    this.element.title = this.options.clickToEditText;
    this._boundCancelHandler = this.handleFormCancellation.bind(this);
    this._boundComplete = (this.options.onComplete || Prototype.emptyFunction).bind(this);
    this._boundFailureHandler = this.handleAJAXFailure.bind(this);
    this._boundSubmitHandler = this.handleFormSubmission.bind(this);
    this._boundWrapperHandler = this.wrapUp.bind(this);
    this.registerListeners();
  },
  checkForEscapeOrReturn: function(e) {
    if (!this._editing || e.ctrlKey || e.altKey || e.shiftKey) return;
    if (Event.KEY_ESC == e.keyCode)
      this.handleFormCancellation(e);
    else if (Event.KEY_RETURN == e.keyCode)
      this.handleFormSubmission(e);
  },
  createControl: function(mode, handler, extraClasses) {
    var control = this.options[mode + 'Control'];
    var text = this.options[mode + 'Text'];
    if ('button' == control) {
      var btn = document.createElement('input');
      btn.type = 'submit';
      btn.value = text;
      btn.className = 'editor_' + mode + '_button';
      if ('cancel' == mode)
        btn.onclick = this._boundCancelHandler;
      this._form.appendChild(btn);
      this._controls[mode] = btn;
    } else if ('link' == control) {
      var link = document.createElement('a');
      link.href = '#';
      link.appendChild(document.createTextNode(text));
      link.onclick = 'cancel' == mode ? this._boundCancelHandler : this._boundSubmitHandler;
      link.className = 'editor_' + mode + '_link';
      if (extraClasses)
        link.className += ' ' + extraClasses;
      this._form.appendChild(link);
      this._controls[mode] = link;
    }
  },
  createEditField: function() {
    var text = (this.options.loadTextURL ? this.options.loadingText : this.getText());
    var fld;
    if (1 >= this.options.rows && !/\r|\n/.test(this.getText())) {
      fld = document.createElement('input');
      fld.type = 'text';
      var size = this.options.size || this.options.cols || 0;
      if (0 < size) fld.size = size;
    } else {
      fld = document.createElement('textarea');
      fld.rows = (1 >= this.options.rows ? this.options.autoRows : this.options.rows);
      fld.cols = this.options.cols || 40;
    }
    fld.name = this.options.paramName;
    fld.value = text; // No HTML breaks conversion anymore
    fld.className = 'editor_field';
    if (this.options.submitOnBlur)
      fld.onblur = this._boundSubmitHandler;
    this._controls.editor = fld;
    if (this.options.loadTextURL)
      this.loadExternalText();
    this._form.appendChild(this._controls.editor);
  },
  createForm: function() {
    var ipe = this;
    function addText(mode, condition) {
      var text = ipe.options['text' + mode + 'Controls'];
      if (!text || condition === false) return;
      ipe._form.appendChild(document.createTextNode(text));
    };
    this._form = $(document.createElement('form'));
    this._form.id = this.options.formId;
    this._form.addClassName(this.options.formClassName);
    this._form.onsubmit = this._boundSubmitHandler;
    this.createEditField();
    if ('textarea' == this._controls.editor.tagName.toLowerCase())
      this._form.appendChild(document.createElement('br'));
    if (this.options.onFormCustomization)
      this.options.onFormCustomization(this, this._form);
    addText('Before', this.options.okControl || this.options.cancelControl);
    this.createControl('ok', this._boundSubmitHandler);
    addText('Between', this.options.okControl && this.options.cancelControl);
    this.createControl('cancel', this._boundCancelHandler, 'editor_cancel');
    addText('After', this.options.okControl || this.options.cancelControl);
  },
  destroy: function() {
    if (this._oldInnerHTML)
      this.element.innerHTML = this._oldInnerHTML;
    this.leaveEditMode();
    this.unregisterListeners();
  },
  enterEditMode: function(e) {
    if (this._saving || this._editing) return;
    this._editing = true;
    this.triggerCallback('onEnterEditMode');
    if (this.options.externalControl)
      this.options.externalControl.hide();
    this.element.hide();
    this.createForm();
    this.element.parentNode.insertBefore(this._form, this.element);
    if (!this.options.loadTextURL)
      this.postProcessEditField();
    if (e) Event.stop(e);
  },
  enterHover: function(e) {
    if (this.options.hoverClassName)
      this.element.addClassName(this.options.hoverClassName);
    if (this._saving) return;
    this.triggerCallback('onEnterHover');
  },
  getText: function() {
    return this.element.innerHTML.unescapeHTML();
  },
  handleAJAXFailure: function(transport) {
    this.triggerCallback('onFailure', transport);
    if (this._oldInnerHTML) {
      this.element.innerHTML = this._oldInnerHTML;
      this._oldInnerHTML = null;
    }
  },
  handleFormCancellation: function(e) {
    this.wrapUp();
    if (e) Event.stop(e);
  },
  handleFormSubmission: function(e) {
    var form = this._form;
    var value = $F(this._controls.editor);
    this.prepareSubmission();
    var params = this.options.callback(form, value) || '';
    if (Object.isString(params))
      params = params.toQueryParams();
    params.editorId = this.element.id;
    if (this.options.htmlResponse) {
      var options = Object.extend({ evalScripts: true }, this.options.ajaxOptions);
      Object.extend(options, {
        parameters: params,
        onComplete: this._boundWrapperHandler,
        onFailure: this._boundFailureHandler
      });
      new Ajax.Updater({ success: this.element }, this.url, options);
    } else {
      var options = Object.extend({ method: 'get' }, this.options.ajaxOptions);
      Object.extend(options, {
        parameters: params,
        onComplete: this._boundWrapperHandler,
        onFailure: this._boundFailureHandler
      });
      new Ajax.Request(this.url, options);
    }
    if (e) Event.stop(e);
  },
  leaveEditMode: function() {
    this.element.removeClassName(this.options.savingClassName);
    this.removeForm();
    this.leaveHover();
    this.element.style.backgroundColor = this._originalBackground;
    this.element.show();
    if (this.options.externalControl)
      this.options.externalControl.show();
    this._saving = false;
    this._editing = false;
    this._oldInnerHTML = null;
    this.triggerCallback('onLeaveEditMode');
  },
  leaveHover: function(e) {
    if (this.options.hoverClassName)
      this.element.removeClassName(this.options.hoverClassName);
    if (this._saving) return;
    this.triggerCallback('onLeaveHover');
  },
  loadExternalText: function() {
    this._form.addClassName(this.options.loadingClassName);
    this._controls.editor.disabled = true;
    var options = Object.extend({ method: 'get' }, this.options.ajaxOptions);
    Object.extend(options, {
      parameters: 'editorId=' + encodeURIComponent(this.element.id),
      onComplete: Prototype.emptyFunction,
      onSuccess: function(transport) {
        this._form.removeClassName(this.options.loadingClassName);
        var text = transport.responseText;
        if (this.options.stripLoadedTextTags)
          text = text.stripTags();
        this._controls.editor.value = text;
        this._controls.editor.disabled = false;
        this.postProcessEditField();
      }.bind(this),
      onFailure: this._boundFailureHandler
    });
    new Ajax.Request(this.options.loadTextURL, options);
  },
  postProcessEditField: function() {
    var fpc = this.options.fieldPostCreation;
    if (fpc)
      $(this._controls.editor)['focus' == fpc ? 'focus' : 'activate']();
  },
  prepareOptions: function() {
    this.options = Object.clone(Ajax.InPlaceEditor.DefaultOptions);
    Object.extend(this.options, Ajax.InPlaceEditor.DefaultCallbacks);
    [this._extraDefaultOptions].flatten().compact().each(function(defs) {
      Object.extend(this.options, defs);
    }.bind(this));
  },
  prepareSubmission: function() {
    this._saving = true;
    this.removeForm();
    this.leaveHover();
    this.showSaving();
  },
  registerListeners: function() {
    this._listeners = { };
    var listener;
    $H(Ajax.InPlaceEditor.Listeners).each(function(pair) {
      listener = this[pair.value].bind(this);
      this._listeners[pair.key] = listener;
      if (!this.options.externalControlOnly)
        this.element.observe(pair.key, listener);
      if (this.options.externalControl)
        this.options.externalControl.observe(pair.key, listener);
    }.bind(this));
  },
  removeForm: function() {
    if (!this._form) return;
    this._form.remove();
    this._form = null;
    this._controls = { };
  },
  showSaving: function() {
    this._oldInnerHTML = this.element.innerHTML;
    this.element.innerHTML = this.options.savingText;
    this.element.addClassName(this.options.savingClassName);
    this.element.style.backgroundColor = this._originalBackground;
    this.element.show();
  },
  triggerCallback: function(cbName, arg) {
    if ('function' == typeof this.options[cbName]) {
      this.options[cbName](this, arg);
    }
  },
  unregisterListeners: function() {
    $H(this._listeners).each(function(pair) {
      if (!this.options.externalControlOnly)
        this.element.stopObserving(pair.key, pair.value);
      if (this.options.externalControl)
        this.options.externalControl.stopObserving(pair.key, pair.value);
    }.bind(this));
  },
  wrapUp: function(transport) {
    this.leaveEditMode();
    // Can't use triggerCallback due to backward compatibility: requires
    // binding + direct element
    this._boundComplete(transport, this.element);
  }
});

Object.extend(Ajax.InPlaceEditor.prototype, {
  dispose: Ajax.InPlaceEditor.prototype.destroy
});

Ajax.InPlaceCollectionEditor = Class.create(Ajax.InPlaceEditor, {
  initialize: function($super, element, url, options) {
    this._extraDefaultOptions = Ajax.InPlaceCollectionEditor.DefaultOptions;
    $super(element, url, options);
  },

  createEditField: function() {
    var list = document.createElement('select');
    list.name = this.options.paramName;
    list.size = 1;
    this._controls.editor = list;
    this._collection = this.options.collection || [];
    if (this.options.loadCollectionURL)
      this.loadCollection();
    else
      this.checkForExternalText();
    this._form.appendChild(this._controls.editor);
  },

  loadCollection: function() {
    this._form.addClassName(this.options.loadingClassName);
    this.showLoadingText(this.options.loadingCollectionText);
    var options = Object.extend({ method: 'get' }, this.options.ajaxOptions);
    Object.extend(options, {
      parameters: 'editorId=' + encodeURIComponent(this.element.id),
      onComplete: Prototype.emptyFunction,
      onSuccess: function(transport) {
        var js = transport.responseText.strip();
        if (!/^\[.*\]$/.test(js)) // TODO: improve sanity check
          throw('Server returned an invalid collection representation.');
        this._collection = eval(js);
        this.checkForExternalText();
      }.bind(this),
      onFailure: this.onFailure
    });
    new Ajax.Request(this.options.loadCollectionURL, options);
  },

  showLoadingText: function(text) {
    this._controls.editor.disabled = true;
    var tempOption = this._controls.editor.firstChild;
    if (!tempOption) {
      tempOption = document.createElement('option');
      tempOption.value = '';
      this._controls.editor.appendChild(tempOption);
      tempOption.selected = true;
    }
    tempOption.update((text || '').stripScripts().stripTags());
  },

  checkForExternalText: function() {
    this._text = this.getText();
    if (this.options.loadTextURL)
      this.loadExternalText();
    else
      this.buildOptionList();
  },

  loadExternalText: function() {
    this.showLoadingText(this.options.loadingText);
    var options = Object.extend({ method: 'get' }, this.options.ajaxOptions);
    Object.extend(options, {
      parameters: 'editorId=' + encodeURIComponent(this.element.id),
      onComplete: Prototype.emptyFunction,
      onSuccess: function(transport) {
        this._text = transport.responseText.strip();
        this.buildOptionList();
      }.bind(this),
      onFailure: this.onFailure
    });
    new Ajax.Request(this.options.loadTextURL, options);
  },

  buildOptionList: function() {
    this._form.removeClassName(this.options.loadingClassName);
    this._collection = this._collection.map(function(entry) {
      return 2 === entry.length ? entry : [entry, entry].flatten();
    });
    var marker = ('value' in this.options) ? this.options.value : this._text;
    var textFound = this._collection.any(function(entry) {
      return entry[0] == marker;
    }.bind(this));
    this._controls.editor.update('');
    var option;
    this._collection.each(function(entry, index) {
      option = document.createElement('option');
      option.value = entry[0];
      option.selected = textFound ? entry[0] == marker : 0 == index;
      option.appendChild(document.createTextNode(entry[1]));
      this._controls.editor.appendChild(option);
    }.bind(this));
    this._controls.editor.disabled = false;
    Field.scrollFreeActivate(this._controls.editor);
  }
});

//**** DEPRECATION LAYER FOR InPlace[Collection]Editor! ****
//**** This only  exists for a while,  in order to  let ****
//**** users adapt to  the new API.  Read up on the new ****
//**** API and convert your code to it ASAP!            ****

Ajax.InPlaceEditor.prototype.initialize.dealWithDeprecatedOptions = function(options) {
  if (!options) return;
  function fallback(name, expr) {
    if (name in options || expr === undefined) return;
    options[name] = expr;
  };
  fallback('cancelControl', (options.cancelLink ? 'link' : (options.cancelButton ? 'button' :
    options.cancelLink == options.cancelButton == false ? false : undefined)));
  fallback('okControl', (options.okLink ? 'link' : (options.okButton ? 'button' :
    options.okLink == options.okButton == false ? false : undefined)));
  fallback('highlightColor', options.highlightcolor);
  fallback('highlightEndColor', options.highlightendcolor);
};

Object.extend(Ajax.InPlaceEditor, {
  DefaultOptions: {
    ajaxOptions: { },
    autoRows: 3,                                // Use when multi-line w/ rows == 1
    cancelControl: 'link',                      // 'link'|'button'|false
    cancelText: 'cancel',
    clickToEditText: 'Click to edit',
    externalControl: null,                      // id|elt
    externalControlOnly: false,
    fieldPostCreation: 'activate',              // 'activate'|'focus'|false
    formClassName: 'inplaceeditor-form',
    formId: null,                               // id|elt
    highlightColor: '#ffff99',
    highlightEndColor: '#ffffff',
    hoverClassName: '',
    htmlResponse: true,
    loadingClassName: 'inplaceeditor-loading',
    loadingText: 'Loading...',
    okControl: 'button',                        // 'link'|'button'|false
    okText: 'ok',
    paramName: 'value',
    rows: 1,                                    // If 1 and multi-line, uses autoRows
    savingClassName: 'inplaceeditor-saving',
    savingText: 'Saving...',
    size: 0,
    stripLoadedTextTags: false,
    submitOnBlur: false,
    textAfterControls: '',
    textBeforeControls: '',
    textBetweenControls: ''
  },
  DefaultCallbacks: {
    callback: function(form) {
      return Form.serialize(form);
    },
    onComplete: function(transport, element) {
      // For backward compatibility, this one is bound to the IPE, and passes
      // the element directly.  It was too often customized, so we don't break it.
      new Effect.Highlight(element, {
        startcolor: this.options.highlightColor, keepBackgroundImage: true });
    },
    onEnterEditMode: null,
    onEnterHover: function(ipe) {
      ipe.element.style.backgroundColor = ipe.options.highlightColor;
      if (ipe._effect)
        ipe._effect.cancel();
    },
    onFailure: function(transport, ipe) {
      alert('Error communication with the server: ' + transport.responseText.stripTags());
    },
    onFormCustomization: null, // Takes the IPE and its generated form, after editor, before controls.
    onLeaveEditMode: null,
    onLeaveHover: function(ipe) {
      ipe._effect = new Effect.Highlight(ipe.element, {
        startcolor: ipe.options.highlightColor, endcolor: ipe.options.highlightEndColor,
        restorecolor: ipe._originalBackground, keepBackgroundImage: true
      });
    }
  },
  Listeners: {
    click: 'enterEditMode',
    keydown: 'checkForEscapeOrReturn',
    mouseover: 'enterHover',
    mouseout: 'leaveHover'
  }
});

Ajax.InPlaceCollectionEditor.DefaultOptions = {
  loadingCollectionText: 'Loading options...'
};

// Delayed observer, like Form.Element.Observer,
// but waits for delay after last key input
// Ideal for live-search fields

Form.Element.DelayedObserver = Class.create({
  initialize: function(element, delay, callback) {
    this.delay     = delay || 0.5;
    this.element   = $(element);
    this.callback  = callback;
    this.timer     = null;
    this.lastValue = $F(this.element);
    Event.observe(this.element,'keyup',this.delayedListener.bindAsEventListener(this));
  },
  delayedListener: function(event) {
    if(this.lastValue == $F(this.element)) return;
    if(this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(this.onTimerEvent.bind(this), this.delay * 1000);
    this.lastValue = $F(this.element);
  },
  onTimerEvent: function() {
    this.timer = null;
    this.callback(this.element, $F(this.element));
  }
});
// script.aculo.us slider.js v1.8.2, Tue Nov 18 18:30:58 +0100 2008

// Copyright (c) 2005-2008 Marty Haught, Thomas Fuchs
//
// script.aculo.us is freely distributable under the terms of an MIT-style license.
// For details, see the script.aculo.us web site: http://script.aculo.us/

if (!Control) var Control = { };

// options:
//  axis: 'vertical', or 'horizontal' (default)
//
// callbacks:
//  onChange(value)
//  onSlide(value)
Control.Slider = Class.create({
  initialize: function(handle, track, options) {
    var slider = this;

    if (Object.isArray(handle)) {
      this.handles = handle.collect( function(e) { return $(e) });
    } else {
      this.handles = [$(handle)];
    }

    this.track   = $(track);
    this.options = options || { };

    this.axis      = this.options.axis || 'horizontal';
    this.increment = this.options.increment || 1;
    this.step      = parseInt(this.options.step || '1');
    this.range     = this.options.range || $R(0,1);

    this.value     = 0; // assure backwards compat
    this.values    = this.handles.map( function() { return 0 });
    this.spans     = this.options.spans ? this.options.spans.map(function(s){ return $(s) }) : false;
    this.options.startSpan = $(this.options.startSpan || null);
    this.options.endSpan   = $(this.options.endSpan || null);

    this.restricted = this.options.restricted || false;

    this.maximum   = this.options.maximum || this.range.end;
    this.minimum   = this.options.minimum || this.range.start;

    // Will be used to align the handle onto the track, if necessary
    this.alignX = parseInt(this.options.alignX || '0');
    this.alignY = parseInt(this.options.alignY || '0');

    this.trackLength = this.maximumOffset() - this.minimumOffset();

    this.handleLength = this.isVertical() ?
      (this.handles[0].offsetHeight != 0 ?
        this.handles[0].offsetHeight : this.handles[0].style.height.replace(/px$/,"")) :
      (this.handles[0].offsetWidth != 0 ? this.handles[0].offsetWidth :
        this.handles[0].style.width.replace(/px$/,""));

    this.active   = false;
    this.dragging = false;
    this.disabled = false;

    if (this.options.disabled) this.setDisabled();

    // Allowed values array
    this.allowedValues = this.options.values ? this.options.values.sortBy(Prototype.K) : false;
    if (this.allowedValues) {
      this.minimum = this.allowedValues.min();
      this.maximum = this.allowedValues.max();
    }

    this.eventMouseDown = this.startDrag.bindAsEventListener(this);
    this.eventMouseUp   = this.endDrag.bindAsEventListener(this);
    this.eventMouseMove = this.update.bindAsEventListener(this);

    // Initialize handles in reverse (make sure first handle is active)
    this.handles.each( function(h,i) {
      i = slider.handles.length-1-i;
      slider.setValue(parseFloat(
        (Object.isArray(slider.options.sliderValue) ?
          slider.options.sliderValue[i] : slider.options.sliderValue) ||
         slider.range.start), i);
      h.makePositioned().observe("mousedown", slider.eventMouseDown);
    });

    this.track.observe("mousedown", this.eventMouseDown);
    document.observe("mouseup", this.eventMouseUp);
    $(this.track.parentNode.parentNode).observe("mousemove", this.eventMouseMove);


    this.initialized = true;
  },
  dispose: function() {
    var slider = this;
    Event.stopObserving(this.track, "mousedown", this.eventMouseDown);
    Event.stopObserving(document, "mouseup", this.eventMouseUp);
    Event.stopObserving(this.track.parentNode.parentNode, "mousemove", this.eventMouseMove);
    this.handles.each( function(h) {
      Event.stopObserving(h, "mousedown", slider.eventMouseDown);
    });
  },
  setDisabled: function(){
    this.disabled = true;
    this.track.parentNode.className = this.track.parentNode.className + ' disabled';
  },
  setEnabled: function(){
    this.disabled = false;
  },
  getNearestValue: function(value){
    if (this.allowedValues){
      if (value >= this.allowedValues.max()) return(this.allowedValues.max());
      if (value <= this.allowedValues.min()) return(this.allowedValues.min());

      var offset = Math.abs(this.allowedValues[0] - value);
      var newValue = this.allowedValues[0];
      this.allowedValues.each( function(v) {
        var currentOffset = Math.abs(v - value);
        if (currentOffset <= offset){
          newValue = v;
          offset = currentOffset;
        }
      });
      return newValue;
    }
    if (value > this.range.end) return this.range.end;
    if (value < this.range.start) return this.range.start;
    return value;
  },
  setValue: function(sliderValue, handleIdx){
    if (!this.active) {
      this.activeHandleIdx = handleIdx || 0;
      this.activeHandle    = this.handles[this.activeHandleIdx];
      this.updateStyles();
    }
    handleIdx = handleIdx || this.activeHandleIdx || 0;
    if (this.initialized && this.restricted) {
      if ((handleIdx>0) && (sliderValue<this.values[handleIdx-1]))
        sliderValue = this.values[handleIdx-1];
      if ((handleIdx < (this.handles.length-1)) && (sliderValue>this.values[handleIdx+1]))
        sliderValue = this.values[handleIdx+1];
    }
    sliderValue = this.getNearestValue(sliderValue);
    this.values[handleIdx] = sliderValue;
    this.value = this.values[0]; // assure backwards compat

    this.handles[handleIdx].style[this.isVertical() ? 'top' : 'left'] =
      this.translateToPx(sliderValue);

    this.drawSpans();
    if (!this.dragging || !this.event) this.updateFinished();
  },
  setValueBy: function(delta, handleIdx) {
    this.setValue(this.values[handleIdx || this.activeHandleIdx || 0] + delta,
      handleIdx || this.activeHandleIdx || 0);
  },
  translateToPx: function(value) {
    return Math.round(
      ((this.trackLength-this.handleLength)/(this.range.end-this.range.start)) *
      (value - this.range.start)) + "px";
  },
  translateToValue: function(offset) {
    return ((offset/(this.trackLength-this.handleLength) *
      (this.range.end-this.range.start)) + this.range.start);
  },
  getRange: function(range) {
    var v = this.values.sortBy(Prototype.K);
    range = range || 0;
    return $R(v[range],v[range+1]);
  },
  minimumOffset: function(){
    return(this.isVertical() ? this.alignY : this.alignX);
  },
  maximumOffset: function(){
    return(this.isVertical() ?
      (this.track.offsetHeight != 0 ? this.track.offsetHeight :
        this.track.style.height.replace(/px$/,"")) - this.alignY :
      (this.track.offsetWidth != 0 ? this.track.offsetWidth :
        this.track.style.width.replace(/px$/,"")) - this.alignX);
  },
  isVertical:  function(){
    return (this.axis == 'vertical');
  },
  drawSpans: function() {
    var slider = this;
    if (this.spans)
      $R(0, this.spans.length-1).each(function(r) { slider.setSpan(slider.spans[r], slider.getRange(r)) });
    if (this.options.startSpan)
      this.setSpan(this.options.startSpan,
        $R(0, this.values.length>1 ? this.getRange(0).min() : this.value ));
    if (this.options.endSpan)
      this.setSpan(this.options.endSpan,
        $R(this.values.length>1 ? this.getRange(this.spans.length-1).max() : this.value, this.maximum));
  },
  setSpan: function(span, range) {
    if (this.isVertical()) {
      span.style.top = this.translateToPx(range.start);
      span.style.height = this.translateToPx(range.end - range.start + this.range.start);
    } else {
      span.style.left = this.translateToPx(range.start);
      span.style.width = this.translateToPx(range.end - range.start + this.range.start);
    }
  },
  updateStyles: function() {
    this.handles.each( function(h){ Element.removeClassName(h, 'selected') });
    Element.addClassName(this.activeHandle, 'selected');
  },
  startDrag: function(event) {
    if (Event.isLeftClick(event)) {
      if (!this.disabled){
        this.active = true;

        var handle = Event.element(event);
        var pointer  = [Event.pointerX(event), Event.pointerY(event)];
        var track = handle;
        if (track==this.track) {
          var offsets  = Position.cumulativeOffset(this.track);
          this.event = event;
          this.setValue(this.translateToValue(
           (this.isVertical() ? pointer[1]-offsets[1] : pointer[0]-offsets[0])-(this.handleLength/2)
          ));
          var offsets  = Position.cumulativeOffset(this.activeHandle);
          this.offsetX = (pointer[0] - offsets[0]);
          this.offsetY = (pointer[1] - offsets[1]);
        } else {
          // find the handle (prevents issues with Safari)
          while((this.handles.indexOf(handle) == -1) && handle.parentNode)
            handle = handle.parentNode;

          if (this.handles.indexOf(handle)!=-1) {
            this.activeHandle    = handle;
            this.activeHandleIdx = this.handles.indexOf(this.activeHandle);
            this.updateStyles();

            var offsets  = Position.cumulativeOffset(this.activeHandle);
            this.offsetX = (pointer[0] - offsets[0]);
            this.offsetY = (pointer[1] - offsets[1]);
          }
        }
      }
      Event.stop(event);
    }
  },
  update: function(event) {
   if (this.active) {
      if (!this.dragging) this.dragging = true;
      this.draw(event);
      if (Prototype.Browser.WebKit) window.scrollBy(0,0);
      Event.stop(event);
   }
  },
  draw: function(event) {
    var pointer = [Event.pointerX(event), Event.pointerY(event)];
    var offsets = Position.cumulativeOffset(this.track);
    pointer[0] -= this.offsetX + offsets[0];
    pointer[1] -= this.offsetY + offsets[1];
    this.event = event;
    this.setValue(this.translateToValue( this.isVertical() ? pointer[1] : pointer[0] ));
    if (this.initialized && this.options.onSlide)
      this.options.onSlide(this.values.length>1 ? this.values : this.value, this);
  },
  endDrag: function(event) {
    if (this.active && this.dragging) {
      this.finishDrag(event, true);
      Event.stop(event);
    }
    this.active = false;
    this.dragging = false;
  },
  finishDrag: function(event, success) {
    this.active = false;
    this.dragging = false;
    this.updateFinished();
  },
  updateFinished: function() {
    if (this.initialized && this.options.onChange)
      this.options.onChange(this.values.length>1 ? this.values : this.value, this);
    this.event = null;
  }
});
// Credit Card Validation Javascript
// copyright 12th May 2003, by Stephen Chapman, Felgall Pty Ltd

// You have permission to copy and use this javascript provided that
// the content of the script is not changed in any way.

function validateCreditCard(s) {
    // remove non-numerics
    var v = "0123456789";
    var w = "";
    for (i=0; i < s.length; i++) {
        x = s.charAt(i);
        if (v.indexOf(x,0) != -1)
        w += x;
    }
    // validate number
    j = w.length / 2;
    k = Math.floor(j);
    m = Math.ceil(j) - k;
    c = 0;
    for (i=0; i<k; i++) {
        a = w.charAt(i*2+m) * 2;
        c += a > 9 ? Math.floor(a/10 + a%10) : a;
    }
    for (i=0; i<k+m; i++) c += w.charAt(i*2+1-m) * 1;
    return (c%10 == 0);
}


/*
* Really easy field validation with Prototype
* http://tetlaw.id.au/view/javascript/really-easy-field-validation
* Andrew Tetlaw
* Version 1.5.4.1 (2007-01-05)
*
* Copyright (c) 2007 Andrew Tetlaw
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use, copy,
* modify, merge, publish, distribute, sublicense, and/or sell copies
* of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
* MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
* BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
* ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
* CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*
*/
var Validator = Class.create();

Validator.prototype = {
    initialize : function(className, error, test, options) {
        if(typeof test == 'function'){
            this.options = $H(options);
            this._test = test;
        } else {
            this.options = $H(test);
            this._test = function(){return true};
        }
        this.error = error || 'Validation failed.';
        this.className = className;
    },
    test : function(v, elm) {
        return (this._test(v,elm) && this.options.all(function(p){
            return Validator.methods[p.key] ? Validator.methods[p.key](v,elm,p.value) : true;
        }));
    }
}
Validator.methods = {
    pattern : function(v,elm,opt) {return Validation.get('IsEmpty').test(v) || opt.test(v)},
    minLength : function(v,elm,opt) {return v.length >= opt},
    maxLength : function(v,elm,opt) {return v.length <= opt},
    min : function(v,elm,opt) {return v >= parseFloat(opt)},
    max : function(v,elm,opt) {return v <= parseFloat(opt)},
    notOneOf : function(v,elm,opt) {return $A(opt).all(function(value) {
        return v != value;
    })},
    oneOf : function(v,elm,opt) {return $A(opt).any(function(value) {
        return v == value;
    })},
    is : function(v,elm,opt) {return v == opt},
    isNot : function(v,elm,opt) {return v != opt},
    equalToField : function(v,elm,opt) {return v == $F(opt)},
    notEqualToField : function(v,elm,opt) {return v != $F(opt)},
    include : function(v,elm,opt) {return $A(opt).all(function(value) {
        return Validation.get(value).test(v,elm);
    })}
}

var Validation = Class.create();
Validation.defaultOptions = {
    onSubmit : true,
    stopOnFirst : false,
    immediate : false,
    focusOnError : true,
    useTitles : false,
    addClassNameToContainer: false,
    containerClassName: '.input-box',
    onFormValidate : function(result, form) {},
    onElementValidate : function(result, elm) {}
};

Validation.prototype = {
    initialize : function(form, options){
        this.form = $(form);
        if (!this.form) {
            return;
        }
        this.options = Object.extend({
            onSubmit : Validation.defaultOptions.onSubmit,
            stopOnFirst : Validation.defaultOptions.stopOnFirst,
            immediate : Validation.defaultOptions.immediate,
            focusOnError : Validation.defaultOptions.focusOnError,
            useTitles : Validation.defaultOptions.useTitles,
            onFormValidate : Validation.defaultOptions.onFormValidate,
            onElementValidate : Validation.defaultOptions.onElementValidate
        }, options || {});
        if(this.options.onSubmit) Event.observe(this.form,'submit',this.onSubmit.bind(this),false);
        if(this.options.immediate) {
            Form.getElements(this.form).each(function(input) { // Thanks Mike!
                if (input.tagName.toLowerCase() == 'select') {
                    Event.observe(input, 'blur', this.onChange.bindAsEventListener(this));
                }
                if (input.type.toLowerCase() == 'radio' || input.type.toLowerCase() == 'checkbox') {
                    Event.observe(input, 'click', this.onChange.bindAsEventListener(this));
                } else {
                    Event.observe(input, 'change', this.onChange.bindAsEventListener(this));
                }
            }, this);
        }
    },
    onChange : function (ev) {
        Validation.isOnChange = true;
        Validation.validate(Event.element(ev),{
                useTitle : this.options.useTitles,
                onElementValidate : this.options.onElementValidate
        });
        Validation.isOnChange = false;
    },
    onSubmit :  function(ev){
        if(!this.validate()) Event.stop(ev);
    },
    validate : function() {
        var result = false;
        var useTitles = this.options.useTitles;
        var callback = this.options.onElementValidate;
        try {
            if(this.options.stopOnFirst) {
                result = Form.getElements(this.form).all(function(elm) {
                    if (elm.hasClassName('local-validation') && !this.isElementInForm(elm, this.form)) {
                        return true;
                    }
                    return Validation.validate(elm,{useTitle : useTitles, onElementValidate : callback});
                }, this);
            } else {
                result = Form.getElements(this.form).collect(function(elm) {
                    if (elm.hasClassName('local-validation') && !this.isElementInForm(elm, this.form)) {
                        return true;
                    }
                    return Validation.validate(elm,{useTitle : useTitles, onElementValidate : callback});
                }, this).all();
            }
        } catch (e) {
        }
        if(!result && this.options.focusOnError) {
            try{
                Form.getElements(this.form).findAll(function(elm){return $(elm).hasClassName('validation-failed')}).first().focus()
            }
            catch(e){
            }
        }
        this.options.onFormValidate(result, this.form);
        return result;
    },
    reset : function() {
        Form.getElements(this.form).each(Validation.reset);
    },
    isElementInForm : function(elm, form) {
        var domForm = elm.up('form');
        if (domForm == form) {
            return true;
        }
        return false;
    }
}

Object.extend(Validation, {
    validate : function(elm, options){
        options = Object.extend({
            useTitle : false,
            onElementValidate : function(result, elm) {}
        }, options || {});
        elm = $(elm);

        var cn = $w(elm.className);
        return result = cn.all(function(value) {
            var test = Validation.test(value,elm,options.useTitle);
            options.onElementValidate(test, elm);
            return test;
        });
    },
    insertAdvice : function(elm, advice){
        var container = $(elm).up('.field-row');
        if(container){
            Element.insert(container, {after: advice});
        } else if (elm.up('td.value')) {
            elm.up('td.value').insert({bottom: advice});
        } else if (elm.advaiceContainer && $(elm.advaiceContainer)) {
            $(elm.advaiceContainer).update(advice);
        }
        else {
            switch (elm.type.toLowerCase()) {
                case 'checkbox':
                case 'radio':
                    var p = elm.parentNode;
                    if(p) {
                        Element.insert(p, {'bottom': advice});
                    } else {
                        Element.insert(elm, {'after': advice});
                    }
                    break;
                default:
                    Element.insert(elm, {'after': advice});
            }
        }
    },
    showAdvice : function(elm, advice, adviceName){
        if(!elm.advices){
            elm.advices = new Hash();
        }
        else{
            elm.advices.each(function(pair){
                if (!advice || pair.value.id != advice.id) {
                    // hide non-current advice after delay
                    this.hideAdvice(elm, pair.value);
                }
            }.bind(this));
        }
        elm.advices.set(adviceName, advice);
        if(typeof Effect == 'undefined') {
            advice.style.display = 'block';
        } else {
            if(!advice._adviceAbsolutize) {
                new Effect.Appear(advice, {duration : 1 });
            } else {
                Position.absolutize(advice);
                advice.show();
                advice.setStyle({
                    'top':advice._adviceTop,
                    'left': advice._adviceLeft,
                    'width': advice._adviceWidth,
                    'z-index': 1000
                });
                advice.addClassName('advice-absolute');
            }
        }
    },
    hideAdvice : function(elm, advice){
        if (advice != null) {
            new Effect.Fade(advice, {duration : 1, afterFinishInternal : function() {advice.hide();}});
        }
    },
    updateCallback : function(elm, status) {
        if (typeof elm.callbackFunction != 'undefined') {
            eval(elm.callbackFunction+'(\''+elm.id+'\',\''+status+'\')');
        }
    },
    ajaxError : function(elm, errorMsg) {
        var name = 'validate-ajax';
        var advice = Validation.getAdvice(name, elm);
        if (advice == null) {
            advice = this.createAdvice(name, elm, false, errorMsg);
        }
        this.showAdvice(elm, advice, 'validate-ajax');
        this.updateCallback(elm, 'failed');

        elm.addClassName('validation-failed');
        elm.addClassName('validate-ajax');
        if (Validation.defaultOptions.addClassNameToContainer && Validation.defaultOptions.containerClassName != '') {
            var container = elm.up(Validation.defaultOptions.containerClassName);
            if (container && this.allowContainerClassName(elm)) {
                container.removeClassName('validation-passed');
                container.addClassName('validation-error');
            }
        }
    },
    allowContainerClassName: function (elm) {
        if (elm.type == 'radio' || elm.type == 'checkbox') {
            return elm.hasClassName('change-container-classname');
        }

        return true;
    },
    test : function(name, elm, useTitle) {
        var v = Validation.get(name);
        var prop = '__advice'+name.camelize();
        try {
        if(Validation.isVisible(elm) && !v.test($F(elm), elm)) {
            //if(!elm[prop]) {
                var advice = Validation.getAdvice(name, elm);
                if (advice == null) {
                    advice = this.createAdvice(name, elm, useTitle);
                }
                this.showAdvice(elm, advice, name);
                this.updateCallback(elm, 'failed');
            //}
            elm[prop] = 1;
            if (!elm.advaiceContainer) {
                elm.removeClassName('validation-passed');
                elm.addClassName('validation-failed');
            }

           if (Validation.defaultOptions.addClassNameToContainer && Validation.defaultOptions.containerClassName != '') {
                var container = elm.up(Validation.defaultOptions.containerClassName);
                if (container && this.allowContainerClassName(elm)) {
                    container.removeClassName('validation-passed');
                    container.addClassName('validation-error');
                }
            }
            return false;
        } else {
            var advice = Validation.getAdvice(name, elm);
            this.hideAdvice(elm, advice);
            this.updateCallback(elm, 'passed');
            elm[prop] = '';
            elm.removeClassName('validation-failed');
            elm.addClassName('validation-passed');
            if (Validation.defaultOptions.addClassNameToContainer && Validation.defaultOptions.containerClassName != '') {
                var container = elm.up(Validation.defaultOptions.containerClassName);
                if (container && !container.down('.validation-failed') && this.allowContainerClassName(elm)) {
                    if (!Validation.get('IsEmpty').test(elm.value) || !this.isVisible(elm)) {
                        container.addClassName('validation-passed');
                    } else {
                        container.removeClassName('validation-passed');
                    }
                    container.removeClassName('validation-error');
                }
            }
            return true;
        }
        } catch(e) {
            throw(e)
        }
    },
    isVisible : function(elm) {
        while(elm.tagName != 'BODY') {
            if(!$(elm).visible()) return false;
            elm = elm.parentNode;
        }
        return true;
    },
    getAdvice : function(name, elm) {
        return $('advice-' + name + '-' + Validation.getElmID(elm)) || $('advice-' + Validation.getElmID(elm));
    },
    createAdvice : function(name, elm, useTitle, customError) {
        var v = Validation.get(name);
        var errorMsg = useTitle ? ((elm && elm.title) ? elm.title : v.error) : v.error;
        if (customError) {
            errorMsg = customError;
        }
        try {
            if (Translator){
                errorMsg = Translator.translate(errorMsg);
            }
        }
        catch(e){}

        advice = '<div class="validation-advice" id="advice-' + name + '-' + Validation.getElmID(elm) +'" style="display:none">' + errorMsg + '</div>'


        Validation.insertAdvice(elm, advice);
        advice = Validation.getAdvice(name, elm);
        if($(elm).hasClassName('absolute-advice')) {
            var dimensions = $(elm).getDimensions();
            var originalPosition = Position.cumulativeOffset(elm);

            advice._adviceTop = (originalPosition[1] + dimensions.height) + 'px';
            advice._adviceLeft = (originalPosition[0])  + 'px';
            advice._adviceWidth = (dimensions.width)  + 'px';
            advice._adviceAbsolutize = true;
        }
        return advice;
    },
    getElmID : function(elm) {
        return elm.id ? elm.id : elm.name;
    },
    reset : function(elm) {
        elm = $(elm);
        var cn = $w(elm.className);
        cn.each(function(value) {
            var prop = '__advice'+value.camelize();
            if(elm[prop]) {
                var advice = Validation.getAdvice(value, elm);
                if (advice) {
                    advice.hide();
                }
                elm[prop] = '';
            }
            elm.removeClassName('validation-failed');
            elm.removeClassName('validation-passed');
            if (Validation.defaultOptions.addClassNameToContainer && Validation.defaultOptions.containerClassName != '') {
                var container = elm.up(Validation.defaultOptions.containerClassName);
                if (container) {
                    container.removeClassName('validation-passed');
                    container.removeClassName('validation-error');
                }
            }
        });
    },
    add : function(className, error, test, options) {
        var nv = {};
        nv[className] = new Validator(className, error, test, options);
        Object.extend(Validation.methods, nv);
    },
    addAllThese : function(validators) {
        var nv = {};
        $A(validators).each(function(value) {
                nv[value[0]] = new Validator(value[0], value[1], value[2], (value.length > 3 ? value[3] : {}));
            });
        Object.extend(Validation.methods, nv);
    },
    get : function(name) {
        return  Validation.methods[name] ? Validation.methods[name] : Validation.methods['_LikeNoIDIEverSaw_'];
    },
    methods : {
        '_LikeNoIDIEverSaw_' : new Validator('_LikeNoIDIEverSaw_','',{})
    }
});

Validation.add('IsEmpty', '', function(v) {
    return  (v == '' || (v == null) || (v.length == 0) || /^\s+$/.test(v));
});

Validation.addAllThese([
    ['validate-no-html-tags', 'HTML tags are not allowed', function(v) {
				return !/<(\/)?\w+/.test(v);
			}],
	['validate-select', 'Please select an option.', function(v) {
                return ((v != "none") && (v != null) && (v.length != 0));
            }],
    ['required-entry', 'This is a required field.', function(v) {
                return !Validation.get('IsEmpty').test(v);
            }],
    ['validate-number', 'Please enter a valid number in this field.', function(v) {
                return Validation.get('IsEmpty').test(v)
                    || (!isNaN(parseNumber(v)) && /^\s*-?\d*(\.\d*)?\s*$/.test(v));
            }],
    ['validate-number-range', 'The value is not within the specified range.', function(v, elm) {
                if (Validation.get('IsEmpty').test(v)) {
                    return true;
                }

                var numValue = parseNumber(v);
                if (isNaN(numValue)) {
                    return false;
                }

                var reRange = /^number-range-(-?[\d.,]+)?-(-?[\d.,]+)?$/,
                    result = true;

                $w(elm.className).each(function(name) {
                    var m = reRange.exec(name);
                    if (m) {
                        result = result
                            && (m[1] == null || m[1] == '' || numValue >= parseNumber(m[1]))
                            && (m[2] == null || m[2] == '' || numValue <= parseNumber(m[2]));
                    }
                });

                return result;
            }],
    ['validate-digits', 'Please use numbers only in this field. Please avoid spaces or other characters such as dots or commas.', function(v) {
                return Validation.get('IsEmpty').test(v) ||  !/[^\d]/.test(v);
            }],
    ['validate-digits-range', 'The value is not within the specified range.', function(v, elm) {
                if (Validation.get('IsEmpty').test(v)) {
                    return true;
                }

                var numValue = parseNumber(v);
                if (isNaN(numValue)) {
                    return false;
                }

                var reRange = /^digits-range-(-?\d+)?-(-?\d+)?$/,
                    result = true;

                $w(elm.className).each(function(name) {
                    var m = reRange.exec(name);
                    if (m) {
                        result = result
                            && (m[1] == null || m[1] == '' || numValue >= parseNumber(m[1]))
                            && (m[2] == null || m[2] == '' || numValue <= parseNumber(m[2]));
                    }
                });

                return result;
            }],
    ['validate-alpha', 'Please use letters only (a-z or A-Z) in this field.', function (v) {
                return Validation.get('IsEmpty').test(v) ||  /^[a-zA-Z]+$/.test(v)
            }],
    ['validate-code', 'Please use only letters (a-z), numbers (0-9) or underscore(_) in this field, first character should be a letter.', function (v) {
                return Validation.get('IsEmpty').test(v) ||  /^[a-z]+[a-z0-9_]+$/.test(v)
            }],
    ['validate-alphanum', 'Please use only letters (a-z or A-Z) or numbers (0-9) only in this field. No spaces or other characters are allowed.', function(v) {
                return Validation.get('IsEmpty').test(v) || /^[a-zA-Z0-9]+$/.test(v)
            }],
    ['validate-alphanum-with-spaces', 'Please use only letters (a-z or A-Z), numbers (0-9) or spaces only in this field.', function(v) {
                    return Validation.get('IsEmpty').test(v) || /^[a-zA-Z0-9 ]+$/.test(v)
            }],
    ['validate-street', 'Please use only letters (a-z or A-Z) or numbers (0-9) or spaces and # only in this field.', function(v) {
                return Validation.get('IsEmpty').test(v) ||  /^[ \w]{3,}([A-Za-z]\.)?([ \w]*\#\d+)?(\r\n| )[ \w]{3,}/.test(v)
            }],
    ['validate-phoneStrict', 'Please enter a valid phone number. For example (123) 456-7890 or 123-456-7890.', function(v) {
                return Validation.get('IsEmpty').test(v) || /^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/.test(v);
            }],
    ['validate-phoneLax', 'Please enter a valid phone number. For example (123) 456-7890 or 123-456-7890.', function(v) {
                return Validation.get('IsEmpty').test(v) || /^((\d[-. ]?)?((\(\d{3}\))|\d{3}))?[-. ]?\d{3}[-. ]?\d{4}$/.test(v);
            }],
    ['validate-fax', 'Please enter a valid fax number. For example (123) 456-7890 or 123-456-7890.', function(v) {
                return Validation.get('IsEmpty').test(v) || /^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/.test(v);
            }],
    ['validate-date', 'Please enter a valid date.', function(v) {
                var test = new Date(v);
                return Validation.get('IsEmpty').test(v) || !isNaN(test);
            }],
    ['validate-date-range', 'The From Date value should be less than or equal to the To Date value.', function(v, elm) {
            var m = /\bdate-range-(\w+)-(\w+)\b/.exec(elm.className);
            if (!m || m[2] == 'to' || Validation.get('IsEmpty').test(v)) {
                return true;
            }

            var currentYear = new Date().getFullYear() + '';
            var normalizedTime = function(v) {
                v = v.split(/[.\/]/);
                if (v[2] && v[2].length < 4) {
                    v[2] = currentYear.substr(0, v[2].length) + v[2];
                }
                return new Date(v.join('/')).getTime();
            };

            var dependentElements = Element.select(elm.form, '.validate-date-range.date-range-' + m[1] + '-to');
            return !dependentElements.length || Validation.get('IsEmpty').test(dependentElements[0].value)
                || normalizedTime(v) <= normalizedTime(dependentElements[0].value);
        }],
    ['validate-email', 'Please enter a valid email address. For example johndoe@domain.com.', function (v) {
                //return Validation.get('IsEmpty').test(v) || /\w{1,}[@][\w\-]{1,}([.]([\w\-]{1,})){1,3}$/.test(v)
                //return Validation.get('IsEmpty').test(v) || /^[\!\#$%\*/?|\^\{\}`~&\'\+\-=_a-z0-9][\!\#$%\*/?|\^\{\}`~&\'\+\-=_a-z0-9\.]{1,30}[\!\#$%\*/?|\^\{\}`~&\'\+\-=_a-z0-9]@([a-z0-9_-]{1,30}\.){1,5}[a-z]{2,4}$/i.test(v)
                return Validation.get('IsEmpty').test(v) || /^([a-z0-9,!\#\$%&'\*\+\/=\?\^_`\{\|\}~-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z0-9,!\#\$%&'\*\+\/=\?\^_`\{\|\}~-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*@([a-z0-9-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z0-9-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*\.(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]){2,})$/i.test(v)
            }],
    ['validate-emailSender', 'Please use only visible characters and spaces.', function (v) {
                return Validation.get('IsEmpty').test(v) ||  /^[\S ]+$/.test(v)
                    }],
    ['validate-password', 'Please enter 6 or more characters. Leading or trailing spaces will be ignored.', function(v) {
                var pass=v.strip(); /*strip leading and trailing spaces*/
                return !(pass.length>0 && pass.length < 6);
            }],
    ['validate-admin-password', 'Please enter 7 or more characters. Password should contain both numeric and alphabetic characters.', function(v) {
                var pass=v.strip();
                if (0 == pass.length) {
                    return true;
                }
                if (!(/[a-z]/i.test(v)) || !(/[0-9]/.test(v))) {
                    return false;
                }
                return !(pass.length < 7);
            }],
    ['validate-cpassword', 'Please make sure your passwords match.', function(v) {
                var conf = $('confirmation') ? $('confirmation') : $$('.validate-cpassword')[0];
                var pass = false;
                if ($('password')) {
                    pass = $('password');
                }
                var passwordElements = $$('.validate-password');
                for (var i = 0; i < passwordElements.size(); i++) {
                    var passwordElement = passwordElements[i];
                    if (passwordElement.up('form').id == conf.up('form').id) {
                        pass = passwordElement;
                    }
                }
                if ($$('.validate-admin-password').size()) {
                    pass = $$('.validate-admin-password')[0];
                }
                return (pass.value == conf.value);
            }],
    ['validate-both-passwords', 'Please make sure your passwords match.', function(v, input) {
                var dependentInput = $(input.form[input.name == 'password' ? 'confirmation' : 'password']),
                    isEqualValues  = input.value == dependentInput.value;

                if (isEqualValues && dependentInput.hasClassName('validation-failed')) {
                    Validation.test(this.className, dependentInput);
                }

                return dependentInput.value == '' || isEqualValues;
            }],
    ['validate-url', 'Please enter a valid URL. Protocol is required (http://, https:// or ftp://)', function (v) {
                v = (v || '').replace(/^\s+/, '').replace(/\s+$/, '');
                return Validation.get('IsEmpty').test(v) || /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(v)
            }],
    ['validate-clean-url', 'Please enter a valid URL. For example http://www.example.com or www.example.com', function (v) {
                return Validation.get('IsEmpty').test(v) || /^(http|https|ftp):\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+.(com|org|net|dk|at|us|tv|info|uk|co.uk|biz|se)$)(:(\d+))?\/?/i.test(v) || /^(www)((\.[A-Z0-9][A-Z0-9_-]*)+.(com|org|net|dk|at|us|tv|info|uk|co.uk|biz|se)$)(:(\d+))?\/?/i.test(v)
            }],
    ['validate-identifier', 'Please enter a valid URL Key. For example "example-page", "example-page.html" or "anotherlevel/example-page".', function (v) {
                return Validation.get('IsEmpty').test(v) || /^[a-z0-9][a-z0-9_\/-]+(\.[a-z0-9_-]+)?$/.test(v)
            }],
    ['validate-xml-identifier', 'Please enter a valid XML-identifier. For example something_1, block5, id-4.', function (v) {
                return Validation.get('IsEmpty').test(v) || /^[A-Z][A-Z0-9_\/-]*$/i.test(v)
            }],
    ['validate-ssn', 'Please enter a valid social security number. For example 123-45-6789.', function(v) {
            return Validation.get('IsEmpty').test(v) || /^\d{3}-?\d{2}-?\d{4}$/.test(v);
            }],
    ['validate-zip', 'Please enter a valid zip code. For example 90602 or 90602-1234.', function(v) {
            return Validation.get('IsEmpty').test(v) || /(^\d{5}$)|(^\d{5}-\d{4}$)/.test(v);
            }],
    ['validate-zip-international', 'Please enter a valid zip code.', function(v) {
            //return Validation.get('IsEmpty').test(v) || /(^[A-z0-9]{2,10}([\s]{0,1}|[\-]{0,1})[A-z0-9]{2,10}$)/.test(v);
            return true;
            }],
    ['validate-date-au', 'Please use this date format: dd/mm/yyyy. For example 17/03/2006 for the 17th of March, 2006.', function(v) {
                if(Validation.get('IsEmpty').test(v)) return true;
                var regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
                if(!regex.test(v)) return false;
                var d = new Date(v.replace(regex, '$2/$1/$3'));
                return ( parseInt(RegExp.$2, 10) == (1+d.getMonth()) ) &&
                            (parseInt(RegExp.$1, 10) == d.getDate()) &&
                            (parseInt(RegExp.$3, 10) == d.getFullYear() );
            }],
    ['validate-currency-dollar', 'Please enter a valid $ amount. For example $100.00.', function(v) {
                // [$]1[##][,###]+[.##]
                // [$]1###+[.##]
                // [$]0.##
                // [$].##
                return Validation.get('IsEmpty').test(v) ||  /^\$?\-?([1-9]{1}[0-9]{0,2}(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}\d*(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2})?)$/.test(v)
            }],
    ['validate-one-required', 'Please select one of the above options.', function (v,elm) {
                var p = elm.parentNode;
                var options = p.getElementsByTagName('INPUT');
                return $A(options).any(function(elm) {
                    return $F(elm);
                });
            }],
    ['validate-one-required-by-name', 'Please select one of the options.', function (v,elm) {
                var inputs = $$('input[name="' + elm.name.replace(/([\\"])/g, '\\$1') + '"]');

                var error = 1;
                for(var i=0;i<inputs.length;i++) {
                    if((inputs[i].type == 'checkbox' || inputs[i].type == 'radio') && inputs[i].checked == true) {
                        error = 0;
                    }

                    if(Validation.isOnChange && (inputs[i].type == 'checkbox' || inputs[i].type == 'radio')) {
                        Validation.reset(inputs[i]);
                    }
                }

                if( error == 0 ) {
                    return true;
                } else {
                    return false;
                }
            }],
    ['validate-not-negative-number', 'Please enter a number 0 or greater in this field.', function(v) {
                if (Validation.get('IsEmpty').test(v)) {
                    return true;
                }
                v = parseNumber(v);
                return !isNaN(v) && v >= 0;
            }],
    ['validate-zero-or-greater', 'Please enter a number 0 or greater in this field.', function(v) {
            return Validation.get('validate-not-negative-number').test(v);
        }],
    ['validate-greater-than-zero', 'Please enter a number greater than 0 in this field.', function(v) {
            if (Validation.get('IsEmpty').test(v)) {
                return true;
            }
            v = parseNumber(v);
            return !isNaN(v) && v > 0;
        }],
    ['validate-state', 'Please select State/Province.', function(v) {
                return (v!=0 || v == '');
            }],
    ['validate-new-password', 'Please enter 6 or more characters. Leading or trailing spaces will be ignored.', function(v) {
                if (!Validation.get('validate-password').test(v)) return false;
                if (Validation.get('IsEmpty').test(v) && v != '') return false;
                return true;
            }],
    ['validate-cc-number', 'Please enter a valid credit card number.', function(v, elm) {
                // remove non-numerics
                var ccTypeContainer = $(elm.id.substr(0,elm.id.indexOf('_cc_number')) + '_cc_type');
                if (ccTypeContainer && typeof Validation.creditCartTypes.get(ccTypeContainer.value) != 'undefined'
                        && Validation.creditCartTypes.get(ccTypeContainer.value)[2] == false) {
                    if (!Validation.get('IsEmpty').test(v) && Validation.get('validate-digits').test(v)) {
                        return true;
                    } else {
                        return false;
                    }
                }
                return validateCreditCard(v);
            }],
    ['validate-cc-type', 'Credit card number does not match credit card type.', function(v, elm) {
                // remove credit card number delimiters such as "-" and space
                elm.value = removeDelimiters(elm.value);
                v         = removeDelimiters(v);

                var ccTypeContainer = $(elm.id.substr(0,elm.id.indexOf('_cc_number')) + '_cc_type');
                if (!ccTypeContainer) {
                    return true;
                }
                var ccType = ccTypeContainer.value;

                if (typeof Validation.creditCartTypes.get(ccType) == 'undefined') {
                    return false;
                }

                // Other card type or switch or solo card
                if (Validation.creditCartTypes.get(ccType)[0]==false) {
                    return true;
                }

                var validationFailure = false;
                Validation.creditCartTypes.each(function (pair) {
                    if (pair.key == ccType) {
                        if (pair.value[0] && !v.match(pair.value[0])) {
                            validationFailure = true;
                        }
                        throw $break;
                    }
                });

                if (validationFailure) {
                    return false;
                }

                if (ccTypeContainer.hasClassName('validation-failed') && Validation.isOnChange) {
                    Validation.validate(ccTypeContainer);
                }

                return true;
            }],
     ['validate-cc-type-select', 'Card type does not match credit card number.', function(v, elm) {
                var ccNumberContainer = $(elm.id.substr(0,elm.id.indexOf('_cc_type')) + '_cc_number');
                if (Validation.isOnChange && Validation.get('IsEmpty').test(ccNumberContainer.value)) {
                    return true;
                }
                if (Validation.get('validate-cc-type').test(ccNumberContainer.value, ccNumberContainer)) {
                    Validation.validate(ccNumberContainer);
                }
                return Validation.get('validate-cc-type').test(ccNumberContainer.value, ccNumberContainer);
            }],
     ['validate-cc-exp', 'Incorrect credit card expiration date.', function(v, elm) {
                var ccExpMonth   = v;
                var ccExpYear    = $(elm.id.substr(0,elm.id.indexOf('_expiration')) + '_expiration_yr').value;
                var currentTime  = new Date();
                var currentMonth = currentTime.getMonth() + 1;
                var currentYear  = currentTime.getFullYear();
                if (ccExpMonth < currentMonth && ccExpYear == currentYear) {
                    return false;
                }
                return true;
            }],
     ['validate-cc-cvn', 'Please enter a valid credit card verification number.', function(v, elm) {
                var ccTypeContainer = $(elm.id.substr(0,elm.id.indexOf('_cc_cid')) + '_cc_type');
                if (!ccTypeContainer) {
                    return true;
                }
                var ccType = ccTypeContainer.value;

                if (typeof Validation.creditCartTypes.get(ccType) == 'undefined') {
                    return false;
                }

                var re = Validation.creditCartTypes.get(ccType)[1];

                if (v.match(re)) {
                    return true;
                }

                return false;
            }],
     ['validate-ajax', '', function(v, elm) { return true; }],
     ['validate-data', 'Please use only letters (a-z or A-Z), numbers (0-9) or underscore(_) in this field, first character should be a letter.', function (v) {
                if(v != '' && v) {
                    return /^[A-Za-z]+[A-Za-z0-9_]+$/.test(v);
                }
                return true;
            }],
     ['validate-css-length', 'Please input a valid CSS-length. For example 100px or 77pt or 20em or .5ex or 50%.', function (v) {
                if (v != '' && v) {
                    return /^[0-9\.]+(px|pt|em|ex|%)?$/.test(v) && (!(/\..*\./.test(v))) && !(/\.$/.test(v));
                }
                return true;
            }],
     ['validate-length', 'Text length does not satisfy specified text range.', function (v, elm) {
                var reMax = new RegExp(/^maximum-length-[0-9]+$/);
                var reMin = new RegExp(/^minimum-length-[0-9]+$/);
                var result = true;
                $w(elm.className).each(function(name, index) {
                    if (name.match(reMax) && result) {
                       var length = name.split('-')[2];
                       result = (v.length <= length);
                    }
                    if (name.match(reMin) && result && !Validation.get('IsEmpty').test(v)) {
                        var length = name.split('-')[2];
                        result = (v.length >= length);
                    }
                });
                return result;
            }],
     ['validate-percents', 'Please enter a number lower than 100.', {max:100}],
     ['required-file', 'Please select a file', function(v, elm) {
         var result = !Validation.get('IsEmpty').test(v);
         if (result === false) {
             ovId = elm.id + '_value';
             if ($(ovId)) {
                 result = !Validation.get('IsEmpty').test($(ovId).value);
             }
         }
         return result;
     }],
     ['validate-cc-ukss', 'Please enter issue number or start date for switch/solo card type.', function(v,elm) {
         var endposition;

         if (elm.id.match(/(.)+_cc_issue$/)) {
             endposition = elm.id.indexOf('_cc_issue');
         } else if (elm.id.match(/(.)+_start_month$/)) {
             endposition = elm.id.indexOf('_start_month');
         } else {
             endposition = elm.id.indexOf('_start_year');
         }

         var prefix = elm.id.substr(0,endposition);

         var ccTypeContainer = $(prefix + '_cc_type');

         if (!ccTypeContainer) {
               return true;
         }
         var ccType = ccTypeContainer.value;

         if(['SS','SM','SO'].indexOf(ccType) == -1){
             return true;
         }

         $(prefix + '_cc_issue').advaiceContainer
           = $(prefix + '_start_month').advaiceContainer
           = $(prefix + '_start_year').advaiceContainer
           = $(prefix + '_cc_type_ss_div').down('ul li.adv-container');

         var ccIssue   =  $(prefix + '_cc_issue').value;
         var ccSMonth  =  $(prefix + '_start_month').value;
         var ccSYear   =  $(prefix + '_start_year').value;

         var ccStartDatePresent = (ccSMonth && ccSYear) ? true : false;

         if (!ccStartDatePresent && !ccIssue){
             return false;
         }
         return true;
     }]
]);

function removeDelimiters (v) {
    v = v.replace(/\s/g, '');
    v = v.replace(/\-/g, '');
    return v;
}

function parseNumber(v)
{
    if (typeof v != 'string') {
        return parseFloat(v);
    }

    var isDot  = v.indexOf('.');
    var isComa = v.indexOf(',');

    if (isDot != -1 && isComa != -1) {
        if (isComa > isDot) {
            v = v.replace('.', '').replace(',', '.');
        }
        else {
            v = v.replace(',', '');
        }
    }
    else if (isComa != -1) {
        v = v.replace(',', '.');
    }

    return parseFloat(v);
}

/**
 * Hash with credit card types which can be simply extended in payment modules
 * 0 - regexp for card number
 * 1 - regexp for cvn
 * 2 - check or not credit card number trough Luhn algorithm by
 *     function validateCreditCard which you can find above in this file
 */
Validation.creditCartTypes = $H({
//    'SS': [new RegExp('^((6759[0-9]{12})|(5018|5020|5038|6304|6759|6761|6763[0-9]{12,19})|(49[013][1356][0-9]{12})|(6333[0-9]{12})|(6334[0-4]\d{11})|(633110[0-9]{10})|(564182[0-9]{10}))([0-9]{2,3})?$'), new RegExp('^([0-9]{3}|[0-9]{4})?$'), true],
    'SO': [new RegExp('^(6334[5-9]([0-9]{11}|[0-9]{13,14}))|(6767([0-9]{12}|[0-9]{14,15}))$'), new RegExp('^([0-9]{3}|[0-9]{4})?$'), true],
    'VI': [new RegExp('^4[0-9]{12}([0-9]{3})?$'), new RegExp('^[0-9]{3}$'), true],
    'MC': [new RegExp('^5[1-5][0-9]{14}$'), new RegExp('^[0-9]{3}$'), true],
    'AE': [new RegExp('^3[47][0-9]{13}$'), new RegExp('^[0-9]{4}$'), true],
    'DI': [new RegExp('^(30[0-5][0-9]{13}|3095[0-9]{12}|35(2[8-9][0-9]{12}|[3-8][0-9]{13})|36[0-9]{12}|3[8-9][0-9]{14}|6011(0[0-9]{11}|[2-4][0-9]{11}|74[0-9]{10}|7[7-9][0-9]{10}|8[6-9][0-9]{10}|9[0-9]{11})|62(2(12[6-9][0-9]{10}|1[3-9][0-9]{11}|[2-8][0-9]{12}|9[0-1][0-9]{11}|92[0-5][0-9]{10})|[4-6][0-9]{13}|8[2-8][0-9]{12})|6(4[4-9][0-9]{13}|5[0-9]{14}))$'), new RegExp('^[0-9]{3}$'), true],
    'JCB': [new RegExp('^(30[0-5][0-9]{13}|3095[0-9]{12}|35(2[8-9][0-9]{12}|[3-8][0-9]{13})|36[0-9]{12}|3[8-9][0-9]{14}|6011(0[0-9]{11}|[2-4][0-9]{11}|74[0-9]{10}|7[7-9][0-9]{10}|8[6-9][0-9]{10}|9[0-9]{11})|62(2(12[6-9][0-9]{10}|1[3-9][0-9]{11}|[2-8][0-9]{12}|9[0-1][0-9]{11}|92[0-5][0-9]{10})|[4-6][0-9]{13}|8[2-8][0-9]{12})|6(4[4-9][0-9]{13}|5[0-9]{14}))$'), new RegExp('^[0-9]{3,4}$'), true],
    'DICL': [new RegExp('^(30[0-5][0-9]{13}|3095[0-9]{12}|35(2[8-9][0-9]{12}|[3-8][0-9]{13})|36[0-9]{12}|3[8-9][0-9]{14}|6011(0[0-9]{11}|[2-4][0-9]{11}|74[0-9]{10}|7[7-9][0-9]{10}|8[6-9][0-9]{10}|9[0-9]{11})|62(2(12[6-9][0-9]{10}|1[3-9][0-9]{11}|[2-8][0-9]{12}|9[0-1][0-9]{11}|92[0-5][0-9]{10})|[4-6][0-9]{13}|8[2-8][0-9]{12})|6(4[4-9][0-9]{13}|5[0-9]{14}))$'), new RegExp('^[0-9]{3}$'), true],
    'SM': [new RegExp('(^(5[0678])[0-9]{11,18}$)|(^(6[^05])[0-9]{11,18}$)|(^(601)[^1][0-9]{9,16}$)|(^(6011)[0-9]{9,11}$)|(^(6011)[0-9]{13,16}$)|(^(65)[0-9]{11,13}$)|(^(65)[0-9]{15,18}$)|(^(49030)[2-9]([0-9]{10}$|[0-9]{12,13}$))|(^(49033)[5-9]([0-9]{10}$|[0-9]{12,13}$))|(^(49110)[1-2]([0-9]{10}$|[0-9]{12,13}$))|(^(49117)[4-9]([0-9]{10}$|[0-9]{12,13}$))|(^(49118)[0-2]([0-9]{10}$|[0-9]{12,13}$))|(^(4936)([0-9]{12}$|[0-9]{14,15}$))'), new RegExp('^([0-9]{3}|[0-9]{4})?$'), true],
    'OT': [false, new RegExp('^([0-9]{3}|[0-9]{4})?$'), false]
});

/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Varien
 * @package     js
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */
function popWin(url,win,para) {
    var win = window.open(url,win,para);
    win.focus();
}

function setLocation(url){
    window.location.href = url;
}

function setPLocation(url, setFocus){
    if( setFocus ) {
        window.opener.focus();
    }
    window.opener.location.href = url;
}

function setLanguageCode(code, fromCode){
    //TODO: javascript cookies have different domain and path than php cookies
    var href = window.location.href;
    var after = '', dash;
    if (dash = href.match(/\#(.*)$/)) {
        href = href.replace(/\#(.*)$/, '');
        after = dash[0];
    }

    if (href.match(/[?]/)) {
        var re = /([?&]store=)[a-z0-9_]*/;
        if (href.match(re)) {
            href = href.replace(re, '$1'+code);
        } else {
            href += '&store='+code;
        }

        var re = /([?&]from_store=)[a-z0-9_]*/;
        if (href.match(re)) {
            href = href.replace(re, '');
        }
    } else {
        href += '?store='+code;
    }
    if (typeof(fromCode) != 'undefined') {
        href += '&from_store='+fromCode;
    }
    href += after;

    setLocation(href);
}

/**
 * Add classes to specified elements.
 * Supported classes are: 'odd', 'even', 'first', 'last'
 *
 * @param elements - array of elements to be decorated
 * [@param decorateParams] - array of classes to be set. If omitted, all available will be used
 */
function decorateGeneric(elements, decorateParams)
{
    var allSupportedParams = ['odd', 'even', 'first', 'last'];
    var _decorateParams = {};
    var total = elements.length;

    if (total) {
        // determine params called
        if (typeof(decorateParams) == 'undefined') {
            decorateParams = allSupportedParams;
        }
        if (!decorateParams.length) {
            return;
        }
        for (var k in allSupportedParams) {
            _decorateParams[allSupportedParams[k]] = false;
        }
        for (var k in decorateParams) {
            _decorateParams[decorateParams[k]] = true;
        }

        // decorate elements
        // elements[0].addClassName('first'); // will cause bug in IE (#5587)
        if (_decorateParams.first) {
            Element.addClassName(elements[0], 'first');
        }
        if (_decorateParams.last) {
            Element.addClassName(elements[total-1], 'last');
        }
        for (var i = 0; i < total; i++) {
            if ((i + 1) % 2 == 0) {
                if (_decorateParams.even) {
                    Element.addClassName(elements[i], 'even');
                }
            }
            else {
                if (_decorateParams.odd) {
                    Element.addClassName(elements[i], 'odd');
                }
            }
        }
    }
}

/**
 * Decorate table rows and cells, tbody etc
 * @see decorateGeneric()
 */
function decorateTable(table, options) {
    var table = $(table);
    if (table) {
        // set default options
        var _options = {
            'tbody'    : false,
            'tbody tr' : ['odd', 'even', 'first', 'last'],
            'thead tr' : ['first', 'last'],
            'tfoot tr' : ['first', 'last'],
            'tr td'    : ['last']
        };
        // overload options
        if (typeof(options) != 'undefined') {
            for (var k in options) {
                _options[k] = options[k];
            }
        }
        // decorate
        if (_options['tbody']) {
            decorateGeneric(table.select('tbody'), _options['tbody']);
        }
        if (_options['tbody tr']) {
            decorateGeneric(table.select('tbody tr'), _options['tbody tr']);
        }
        if (_options['thead tr']) {
            decorateGeneric(table.select('thead tr'), _options['thead tr']);
        }
        if (_options['tfoot tr']) {
            decorateGeneric(table.select('tfoot tr'), _options['tfoot tr']);
        }
        if (_options['tr td']) {
            var allRows = table.select('tr');
            if (allRows.length) {
                for (var i = 0; i < allRows.length; i++) {
                    decorateGeneric(allRows[i].getElementsByTagName('TD'), _options['tr td']);
                }
            }
        }
    }
}

/**
 * Set "odd", "even" and "last" CSS classes for list items
 * @see decorateGeneric()
 */
function decorateList(list, nonRecursive) {
    if ($(list)) {
        if (typeof(nonRecursive) == 'undefined') {
            var items = $(list).select('li')
        }
        else {
            var items = $(list).childElements();
        }
        decorateGeneric(items, ['odd', 'even', 'last']);
    }
}

/**
 * Set "odd", "even" and "last" CSS classes for list items
 * @see decorateGeneric()
 */
function decorateDataList(list) {
    list = $(list);
    if (list) {
        decorateGeneric(list.select('dt'), ['odd', 'even', 'last']);
        decorateGeneric(list.select('dd'), ['odd', 'even', 'last']);
    }
}

/**
 * Parse SID and produces the correct URL
 */
function parseSidUrl(baseUrl, urlExt) {
    var sidPos = baseUrl.indexOf('/?SID=');
    var sid = '';
    urlExt = (urlExt != undefined) ? urlExt : '';

    if(sidPos > -1) {
        sid = '?' + baseUrl.substring(sidPos + 2);
        baseUrl = baseUrl.substring(0, sidPos + 1);
    }

    return baseUrl+urlExt+sid;
}

/**
 * Formats currency using patern
 * format - JSON (pattern, decimal, decimalsDelimeter, groupsDelimeter)
 * showPlus - true (always show '+'or '-'),
 *      false (never show '-' even if number is negative)
 *      null (show '-' if number is negative)
 */

function formatCurrency(price, format, showPlus){
    var precision = isNaN(format.precision = Math.abs(format.precision)) ? 2 : format.precision;
    var requiredPrecision = isNaN(format.requiredPrecision = Math.abs(format.requiredPrecision)) ? 2 : format.requiredPrecision;

    //precision = (precision > requiredPrecision) ? precision : requiredPrecision;
    //for now we don't need this difference so precision is requiredPrecision
    precision = requiredPrecision;

    var integerRequired = isNaN(format.integerRequired = Math.abs(format.integerRequired)) ? 1 : format.integerRequired;

    var decimalSymbol = format.decimalSymbol == undefined ? "," : format.decimalSymbol;
    var groupSymbol = format.groupSymbol == undefined ? "." : format.groupSymbol;
    var groupLength = format.groupLength == undefined ? 3 : format.groupLength;

    var s = '';

    if (showPlus == undefined || showPlus == true) {
        s = price < 0 ? "-" : ( showPlus ? "+" : "");
    } else if (showPlus == false) {
        s = '';
    }

    var i = parseInt(price = Math.abs(+price || 0).toFixed(precision)) + "";
    var pad = (i.length < integerRequired) ? (integerRequired - i.length) : 0;
    while (pad) { i = '0' + i; pad--; }
    j = (j = i.length) > groupLength ? j % groupLength : 0;
    re = new RegExp("(\\d{" + groupLength + "})(?=\\d)", "g");

    /**
     * replace(/-/, 0) is only for fixing Safari bug which appears
     * when Math.abs(0).toFixed() executed on "0" number.
     * Result is "0.-0" :(
     */
    var r = (j ? i.substr(0, j) + groupSymbol : "") + i.substr(j).replace(re, "$1" + groupSymbol) + (precision ? decimalSymbol + Math.abs(price - i).toFixed(precision).replace(/-/, 0).slice(2) : "")
    var pattern = '';
    if (format.pattern.indexOf('{sign}') == -1) {
        pattern = s + format.pattern;
    } else {
        pattern = format.pattern.replace('{sign}', s);
    }

    return pattern.replace('%s', r).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};

function expandDetails(el, childClass) {
    if (Element.hasClassName(el,'show-details')) {
        $$(childClass).each(function(item){item.hide()});
        Element.removeClassName(el,'show-details');
    }
    else {
        $$(childClass).each(function(item){item.show()});
        Element.addClassName(el,'show-details');
    }
}

// Version 1.0
var isIE = navigator.appVersion.match(/MSIE/) == "MSIE";

if (!window.Varien)
    var Varien = new Object();

Varien.showLoading = function(){
    var loader = $('loading-process');
    loader && loader.show();
}
Varien.hideLoading = function(){
    var loader = $('loading-process');
    loader && loader.hide();
}
Varien.GlobalHandlers = {
    onCreate: function() {
        Varien.showLoading();
    },

    onComplete: function() {
        if(Ajax.activeRequestCount == 0) {
            Varien.hideLoading();
        }
    }
};

Ajax.Responders.register(Varien.GlobalHandlers);

/**
 * Quick Search form client model
 */
Varien.searchForm = Class.create();
Varien.searchForm.prototype = {
    initialize : function(form, field, emptyText){
        this.form   = $(form);
        this.field  = $(field);
        this.emptyText = emptyText;

        Event.observe(this.form,  'submit', this.submit.bind(this));
        Event.observe(this.field, 'focus', this.focus.bind(this));
        Event.observe(this.field, 'blur', this.blur.bind(this));
        this.blur();
    },

    submit : function(event){
        if (this.field.value == this.emptyText || this.field.value == ''){
            Event.stop(event);
            return false;
        }
        return true;
    },

    focus : function(event){
        if(this.field.value==this.emptyText){
            this.field.value='';
        }

    },

    blur : function(event){
        if(this.field.value==''){
            this.field.value=this.emptyText;
        }
    },

    initAutocomplete : function(url, destinationElement){
        new Ajax.Autocompleter(
            this.field,
            destinationElement,
            url,
            {
                paramName: this.field.name,
                method: 'get',
                minChars: 2,
                updateElement: this._selectAutocompleteItem.bind(this),
                onShow : function(element, update) {
                    if(!update.style.position || update.style.position=='absolute') {
                        update.style.position = 'absolute';
                        Position.clone(element, update, {
                            setHeight: false,
                            offsetTop: element.offsetHeight
                        });
                    }
                    Effect.Appear(update,{duration:0});
                }

            }
        );
    },

    _selectAutocompleteItem : function(element){
        if(element.title){
            this.field.value = element.title;
        }
        this.form.submit();
    }
}

Varien.Tabs = Class.create();
Varien.Tabs.prototype = {
  initialize: function(selector) {
    var self=this;
    $$(selector+' a').each(this.initTab.bind(this));
  },

  initTab: function(el) {
      el.href = 'javascript:void(0)';
      if ($(el.parentNode).hasClassName('active')) {
        this.showContent(el);
      }
      el.observe('click', this.showContent.bind(this, el));
  },

  showContent: function(a) {
    var li = $(a.parentNode), ul = $(li.parentNode);
    ul.getElementsBySelector('li', 'ol').each(function(el){
      var contents = $(el.id+'_contents');
      if (el==li) {
        el.addClassName('active');
        contents.show();
      } else {
        el.removeClassName('active');
        contents.hide();
      }
    });
  }
}

Varien.DateElement = Class.create();
Varien.DateElement.prototype = {
    initialize: function(type, content, required, format) {
        if (type == 'id') {
            // id prefix
            this.day    = $(content + 'day');
            this.month  = $(content + 'month');
            this.year   = $(content + 'year');
            this.full   = $(content + 'full');
            this.advice = $(content + 'date-advice');
        } else if (type == 'container') {
            // content must be container with data
            this.day    = content.day;
            this.month  = content.month;
            this.year   = content.year;
            this.full   = content.full;
            this.advice = content.advice;
        } else {
            return;
        }

        this.required = required;
        this.format   = format;

        this.day.addClassName('validate-custom');
        this.day.validate = this.validate.bind(this);
        this.month.addClassName('validate-custom');
        this.month.validate = this.validate.bind(this);
        this.year.addClassName('validate-custom');
        this.year.validate = this.validate.bind(this);

        this.setDateRange(false, false);
        this.year.setAttribute('autocomplete','off');

        this.advice.hide();
    },
    validate: function() {
        var error = false,
            day   = parseInt(this.day.value, 10)   || 0,
            month = parseInt(this.month.value, 10) || 0,
            year  = parseInt(this.year.value, 10)  || 0;
        if (this.day.value.strip().empty()
            && this.month.value.strip().empty()
            && this.year.value.strip().empty()
        ) {
            if (this.required) {
                error = 'This date is a required value.';
            } else {
                this.full.value = '';
            }
        } else if (!day || !month || !year) {
            error = 'Please enter a valid full date.';
        } else {
            var date = new Date, countDaysInMonth = 0, errorType = null;
            date.setYear(year);date.setMonth(month-1);date.setDate(32);
            countDaysInMonth = 32 - date.getDate();
            if(!countDaysInMonth || countDaysInMonth>31) countDaysInMonth = 31;

            if (day<1 || day>countDaysInMonth) {
                errorType = 'day';
                error = 'Please enter a valid day (1-%d).';
            } else if (month<1 || month>12) {
                errorType = 'month';
                error = 'Please enter a valid month (1-12).';
            } else {
                if(day % 10 == day) this.day.value = '0'+day;
                if(month % 10 == month) this.month.value = '0'+month;
                this.full.value = this.format.replace(/%[mb]/i, this.month.value).replace(/%[de]/i, this.day.value).replace(/%y/i, this.year.value);
                var testFull = this.month.value + '/' + this.day.value + '/'+ this.year.value;
                var test = new Date(testFull);
                if (isNaN(test)) {
                    error = 'Please enter a valid date.';
                } else {
                    this.setFullDate(test);
                }
            }
            var valueError = false;
            if (!error && !this.validateData()){//(year<1900 || year>curyear) {
                errorType = this.validateDataErrorType;//'year';
                valueError = this.validateDataErrorText;//'Please enter a valid year (1900-%d).';
                error = valueError;
            }
        }

        if (error !== false) {
            try {
                error = Translator.translate(error);
            }
            catch (e) {}
            if (!valueError) {
                this.advice.innerHTML = error.replace('%d', countDaysInMonth);
            } else {
                this.advice.innerHTML = this.errorTextModifier(error);
            }
            this.advice.show();
            return false;
        }

        // fixing elements class
        this.day.removeClassName('validation-failed');
        this.month.removeClassName('validation-failed');
        this.year.removeClassName('validation-failed');

        this.advice.hide();
        return true;
    },
    validateData: function() {
        var year = this.fullDate.getFullYear();
        var date = new Date;
        this.curyear = date.getFullYear();
        return (year>=1900 && year<=this.curyear);
    },
    validateDataErrorType: 'year',
    validateDataErrorText: 'Please enter a valid year (1900-%d).',
    errorTextModifier: function(text) {
        return text.replace('%d', this.curyear);
    },
    setDateRange: function(minDate, maxDate) {
        this.minDate = minDate;
        this.maxDate = maxDate;
    },
    setFullDate: function(date) {
        this.fullDate = date;
    }
};

Varien.DOB = Class.create();
Varien.DOB.prototype = {
    initialize: function(selector, required, format) {
        var el = $$(selector)[0];
        var container       = {};
        container.day       = Element.select(el, '.dob-day input')[0];
        container.month     = Element.select(el, '.dob-month input')[0];
        container.year      = Element.select(el, '.dob-year input')[0];
        container.full      = Element.select(el, '.dob-full input')[0];
        container.advice    = Element.select(el, '.validation-advice')[0];

        new Varien.DateElement('container', container, required, format);
    }
};

Varien.dateRangeDate = Class.create();
Varien.dateRangeDate.prototype = Object.extend(new Varien.DateElement(), {
    validateData: function() {
        var validate = true;
        if (this.minDate || this.maxValue) {
            if (this.minDate) {
                this.minDate = new Date(this.minDate);
                this.minDate.setHours(0);
                if (isNaN(this.minDate)) {
                    this.minDate = new Date('1/1/1900');
                }
                validate = validate && (this.fullDate >= this.minDate)
            }
            if (this.maxDate) {
                this.maxDate = new Date(this.maxDate)
                this.minDate.setHours(0);
                if (isNaN(this.maxDate)) {
                    this.maxDate = new Date();
                }
                validate = validate && (this.fullDate <= this.maxDate)
            }
            if (this.maxDate && this.minDate) {
                this.validateDataErrorText = 'Please enter a valid date between %s and %s';
            } else if (this.maxDate) {
                this.validateDataErrorText = 'Please enter a valid date less than or equal to %s';
            } else if (this.minDate) {
                this.validateDataErrorText = 'Please enter a valid date equal to or greater than %s';
            } else {
                this.validateDataErrorText = '';
            }
        }
        return validate;
    },
    validateDataErrorText: 'Date should be between %s and %s',
    errorTextModifier: function(text) {
        if (this.minDate) {
            text = text.sub('%s', this.dateFormat(this.minDate));
        }
        if (this.maxDate) {
            text = text.sub('%s', this.dateFormat(this.maxDate));
        }
        return text;
    },
    dateFormat: function(date) {
        return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
    }
});

Varien.FileElement = Class.create();
Varien.FileElement.prototype = {
    initialize: function (id) {
        this.fileElement = $(id);
        this.hiddenElement = $(id + '_value');

        this.fileElement.observe('change', this.selectFile.bind(this));
    },
    selectFile: function(event) {
        this.hiddenElement.value = this.fileElement.getValue();
    }
};

Validation.addAllThese([
    ['validate-custom', ' ', function(v,elm) {
        return elm.validate();
    }]
]);

function truncateOptions() {
    $$('.truncated').each(function(element){
        Event.observe(element, 'mouseover', function(){
            if (element.down('div.truncated_full_value')) {
                element.down('div.truncated_full_value').addClassName('show')
            }
        });
        Event.observe(element, 'mouseout', function(){
            if (element.down('div.truncated_full_value')) {
                element.down('div.truncated_full_value').removeClassName('show')
            }
        });

    });
}
Event.observe(window, 'load', function(){
   truncateOptions();
});

Element.addMethods({
    getInnerText: function(element)
    {
        element = $(element);
        if(element.innerText && !Prototype.Browser.Opera) {
            return element.innerText
        }
        return element.innerHTML.stripScripts().unescapeHTML().replace(/[\n\r\s]+/g, ' ').strip();
    }
});

/*
if (!("console" in window) || !("firebug" in console))
{
    var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
    "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

    window.console = {};
    for (var i = 0; i < names.length; ++i)
        window.console[names[i]] = function() {}
}
*/

/**
 * Executes event handler on the element. Works with event handlers attached by Prototype,
 * in a browser-agnostic fashion.
 * @param element The element object
 * @param event Event name, like 'change'
 *
 * @example fireEvent($('my-input', 'click'));
 */
function fireEvent(element, event) {
    if (document.createEvent) {
        // dispatch for all browsers except IE before version 9
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent(event, true, true ); // event type, bubbling, cancelable
        return element.dispatchEvent(evt);
    } else {
        // dispatch for IE before version 9
        var evt = document.createEventObject();
        return element.fireEvent('on' + event, evt)
    }
}

/**
 * Returns more accurate results of floating-point modulo division
 * E.g.:
 * 0.6 % 0.2 = 0.19999999999999996
 * modulo(0.6, 0.2) = 0
 *
 * @param dividend
 * @param divisor
 */
function modulo(dividend, divisor)
{
    var epsilon = divisor / 10000;
    var remainder = dividend % divisor;

    if (Math.abs(remainder - divisor) < epsilon || Math.abs(remainder) < epsilon) {
        remainder = 0;
    }

    return remainder;
}

/**
 * createContextualFragment is not supported in IE9. Adding its support.
 */
if ((typeof Range != "undefined") && !Range.prototype.createContextualFragment)
{
    Range.prototype.createContextualFragment = function(html)
    {
        var frag = document.createDocumentFragment(),
        div = document.createElement("div");
        frag.appendChild(div);
        div.outerHTML = html;
        return frag;
    };
}

/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Mage
 * @package     js
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */

var Translate = Class.create();
Translate.prototype = {
    initialize: function(data){
        this.data = $H(data);
    },

    translate : function(){
        var args = arguments;
        var text = arguments[0];

        if(this.data.get(text)){
            return this.data.get(text);
        }
        return text;
    },
    add : function() {
        if (arguments.length > 1) {
            this.data.set(arguments[0], arguments[1]);
        } else if (typeof arguments[0] =='object') {
            $H(arguments[0]).each(function (pair){
                this.data.set(pair.key, pair.value);
            }.bind(this));
        }
    }
}

/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Mage
 * @package     Mage_Adminhtml
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */
/*
 * Caudium - An extensible World Wide Web server
 * Copyright C 2002 The Caudium Group
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
 *
 */

/*
 * base64.js - a JavaScript implementation of the base64 algorithm,
 *             (mostly) as defined in RFC 2045.
 *
 * This is a direct JavaScript reimplementation of the original C code
 * as found in the Exim mail transport agent, by Philip Hazel.
 *
 * $Id: base64.js,v 1.7 2002/07/16 17:21:23 kazmer Exp $
 *
 */


function encode_base64( what )
{
    var base64_encodetable = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var result = "";
    var len = what.length;
    var x, y;
    var ptr = 0;

    while( len-- > 0 )
    {
        x = what.charCodeAt( ptr++ );
        result += base64_encodetable.charAt( ( x >> 2 ) & 63 );

        if( len-- <= 0 )
        {
            result += base64_encodetable.charAt( ( x << 4 ) & 63 );
            result += "==";
            break;
        }

        y = what.charCodeAt( ptr++ );
        result += base64_encodetable.charAt( ( ( x << 4 ) | ( ( y >> 4 ) & 15 ) ) & 63 );

        if ( len-- <= 0 )
        {
            result += base64_encodetable.charAt( ( y << 2 ) & 63 );
            result += "=";
            break;
        }

        x = what.charCodeAt( ptr++ );
        result += base64_encodetable.charAt( ( ( y << 2 ) | ( ( x >> 6 ) & 3 ) ) & 63 );
        result += base64_encodetable.charAt( x & 63 );

    }

    return result;
}


function decode_base64( what )
{
    var base64_decodetable = new Array (
        255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
        255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
        255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,  62, 255, 255, 255,  63,
         52,  53,  54,  55,  56,  57,  58,  59,  60,  61, 255, 255, 255, 255, 255, 255,
        255,   0,   1,   2,   3,   4,   5,   6,   7,   8,   9,  10,  11,  12,  13,  14,
         15,  16,  17,  18,  19,  20,  21,  22,  23,  24,  25, 255, 255, 255, 255, 255,
        255,  26,  27,  28,  29,  30,  31,  32,  33,  34,  35,  36,  37,  38,  39,  40,
         41,  42,  43,  44,  45,  46,  47,  48,  49,  50,  51, 255, 255, 255, 255, 255
    );
    var result = "";
    var len = what.length;
    var x, y;
    var ptr = 0;

    while( !isNaN( x = what.charCodeAt( ptr++ ) ) )
    {
        if( x == 13 || x == 10 )
            continue;

        if( ( x > 127 ) || (( x = base64_decodetable[x] ) == 255) )
            return false;
        if( ( isNaN( y = what.charCodeAt( ptr++ ) ) ) || (( y = base64_decodetable[y] ) == 255) )
            return false;

        result += String.fromCharCode( (x << 2) | (y >> 4) );

        if( (x = what.charCodeAt( ptr++ )) == 61 )
        {
            if( (what.charCodeAt( ptr++ ) != 61) || (!isNaN(what.charCodeAt( ptr ) ) ) )
                return false;
        }
        else
        {
            if( ( x > 127 ) || (( x = base64_decodetable[x] ) == 255) )
                return false;
            result += String.fromCharCode( (y << 4) | (x >> 2) );
            if( (y = what.charCodeAt( ptr++ )) == 61 )
            {
                if( !isNaN(what.charCodeAt( ptr ) ) )
                    return false;
            }
            else
            {
                if( (y > 127) || ((y = base64_decodetable[y]) == 255) )
                    return false;
                result += String.fromCharCode( (x << 6) | y );
            }
        }
    }
    return result;
}

function wrap76( what )
{
    var result = "";
    var i;

    for(i=0; i < what.length; i+=76)
    {
        result += what.substring(i, i+76) + String.fromCharCode(13) + String.fromCharCode(10);
    }
    return result;
}

/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Mage
 * @package     Mage_Adminhtml
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */
// from http://www.someelement.com/2007/03/eventpublisher-custom-events-la-pubsub.html
varienEvents = Class.create();

varienEvents.prototype = {
    initialize: function() {
        this.arrEvents = {};
        this.eventPrefix = '';
    },

    /**
    * Attaches a {handler} function to the publisher's {eventName} event for execution upon the event firing
    * @param {String} eventName
    * @param {Function} handler
    * @param {Boolean} asynchFlag [optional] Defaults to false if omitted. Indicates whether to execute {handler} asynchronously (true) or not (false).
    */
    attachEventHandler : function(eventName, handler) {
        if ((typeof handler == 'undefined') || (handler == null)) {
            return;
        }
        eventName = eventName + this.eventPrefix;
        // using an event cache array to track all handlers for proper cleanup
        if (this.arrEvents[eventName] == null){
            this.arrEvents[eventName] = [];
        }
        //create a custom object containing the handler method and the asynch flag
        var asynchVar = arguments.length > 2 ? arguments[2] : false;
        var handlerObj = {
            method: handler,
            asynch: asynchVar
        };
        this.arrEvents[eventName].push(handlerObj);
    },

    /**
    * Removes a single handler from a specific event
    * @param {String} eventName The event name to clear the handler from
    * @param {Function} handler A reference to the handler function to un-register from the event
    */
    removeEventHandler : function(eventName, handler) {
        eventName = eventName + this.eventPrefix;
        if (this.arrEvents[eventName] != null){
            this.arrEvents[eventName] = this.arrEvents[eventName].reject(function(obj) { return obj.method == handler; });
        }
    },

    /**
    * Removes all handlers from a single event
    * @param {String} eventName The event name to clear handlers from
    */
    clearEventHandlers : function(eventName) {
        eventName = eventName + this.eventPrefix;
        this.arrEvents[eventName] = null;
    },

    /**
    * Removes all handlers from ALL events
    */
    clearAllEventHandlers : function() {
        this.arrEvents = {};
    },

    /**
    * Fires the event {eventName}, resulting in all registered handlers to be executed.
    * It also collects and returns results of all non-asynchronous handlers
    * @param {String} eventName The name of the event to fire
    * @params {Object} args [optional] Any object, will be passed into the handler function as the only argument
    * @return {Array}
    */
    fireEvent : function(eventName) {
        var evtName = eventName + this.eventPrefix;
        var results = [];
        var result;
        if (this.arrEvents[evtName] != null) {
            var len = this.arrEvents[evtName].length; //optimization
            for (var i = 0; i < len; i++) {
                try {
                    if (arguments.length > 1) {
                        if (this.arrEvents[evtName][i].asynch) {
                            var eventArgs = arguments[1];
                            var method = this.arrEvents[evtName][i].method.bind(this);
                            setTimeout(function() { method(eventArgs) }.bind(this), 10);
                        }
                        else{
                            result = this.arrEvents[evtName][i].method(arguments[1]);
                        }
                    }
                    else {
                        if (this.arrEvents[evtName][i].asynch) {
                            var eventHandler = this.arrEvents[evtName][i].method;
                            setTimeout(eventHandler, 1);
                        }
                        else if (this.arrEvents && this.arrEvents[evtName] && this.arrEvents[evtName][i] && this.arrEvents[evtName][i].method){
                            result = this.arrEvents[evtName][i].method();
                        }
                    }
                    results.push(result);
                }
                catch (e) {
                    if (this.id){
                        alert("error: error in " + this.id + ".fireEvent():\n\nevent name: " + eventName + "\n\nerror message: " + e.message);
                    }
                    else {
                        alert("error: error in [unknown object].fireEvent():\n\nevent name: " + eventName + "\n\nerror message: " + e.message);
                    }
                }
            }
        }
        return results;
    }
};

varienGlobalEvents = new varienEvents();


/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Mage
 * @package     Mage_Adminhtml
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */

var SessionError = Class.create();
SessionError.prototype = {
    initialize: function(errorText) {
        this.errorText = errorText;
    },
    toString: function()
    {
        return 'Session Error:' + this.errorText;
    }
};

Ajax.Request.addMethods({
    initialize: function($super, url, options){
        $super(options);
        this.transport = Ajax.getTransport();
        if (!url.match(new RegExp('[?&]isAjax=true',''))) {
            url = url.match(new RegExp('\\?',"g")) ? url + '&isAjax=true' : url + '?isAjax=true';
        }
        if (Object.isString(this.options.parameters)
            && this.options.parameters.indexOf('form_key=') == -1
        ) {
            this.options.parameters += '&' + Object.toQueryString({
                form_key: FORM_KEY
            });
        } else {
            if (!this.options.parameters) {
                this.options.parameters = {
                    form_key: FORM_KEY
                };
            }
            if (!this.options.parameters.form_key) {
                this.options.parameters.form_key = FORM_KEY;
            }
        }

        this.request(url);
    },
    respondToReadyState: function(readyState) {
        var state = Ajax.Request.Events[readyState], response = new Ajax.Response(this);

        if (state == 'Complete') {
            try {
                this._complete = true;
                if (response.responseText.isJSON()) {
                    var jsonObject = response.responseText.evalJSON();
                    if (jsonObject.ajaxExpired && jsonObject.ajaxRedirect) {
                        window.location.replace(jsonObject.ajaxRedirect);
                        throw new SessionError('session expired');
                    }
                }

                (this.options['on' + response.status]
                 || this.options['on' + (this.success() ? 'Success' : 'Failure')]
                 || Prototype.emptyFunction)(response, response.headerJSON);
            } catch (e) {
                this.dispatchException(e);
                if (e instanceof SessionError) {
                    return;
                }
            }

            var contentType = response.getHeader('Content-type');
            if (this.options.evalJS == 'force'
                || (this.options.evalJS && this.isSameOrigin() && contentType
                && contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i))) {
                this.evalResponse();
            }
        }

        try {
            (this.options['on' + state] || Prototype.emptyFunction)(response, response.headerJSON);
            Ajax.Responders.dispatch('on' + state, this, response, response.headerJSON);
        } catch (e) {
            this.dispatchException(e);
        }

        if (state == 'Complete') {
            // avoid memory leak in MSIE: clean up
            this.transport.onreadystatechange = Prototype.emptyFunction;
        }
    }
});

Ajax.Updater.respondToReadyState = Ajax.Request.respondToReadyState;
//Ajax.Updater = Object.extend(Ajax.Updater, {
//  initialize: function($super, container, url, options) {
//    this.container = {
//      success: (container.success || container),
//      failure: (container.failure || (container.success ? null : container))
//    };
//
//    options = Object.clone(options);
//    var onComplete = options.onComplete;
//    options.onComplete = (function(response, json) {
//      this.updateContent(response.responseText);
//      if (Object.isFunction(onComplete)) onComplete(response, json);
//    }).bind(this);
//
//    $super((url.match(new RegExp('\\?',"g")) ? url + '&isAjax=1' : url + '?isAjax=1'), options);
//  }
//});

var varienLoader = new Class.create();

varienLoader.prototype = {
    initialize : function(caching){
        this.callback= false;
        this.cache   = $H();
        this.caching = caching || false;
        this.url     = false;
    },

    getCache : function(url){
        if(this.cache.get(url)){
            return this.cache.get(url)
        }
        return false;
    },

    load : function(url, params, callback){
        this.url      = url;
        this.callback = callback;

        if(this.caching){
            var transport = this.getCache(url);
            if(transport){
                this.processResult(transport);
                return;
            }
        }

        if (typeof(params.updaterId) != 'undefined') {
            new varienUpdater(params.updaterId, url, {
                evalScripts : true,
                onComplete: this.processResult.bind(this),
                onFailure: this._processFailure.bind(this)
            });
        }
        else {
            new Ajax.Request(url,{
                method: 'post',
                parameters: params || {},
                onComplete: this.processResult.bind(this),
                onFailure: this._processFailure.bind(this)
            });
        }
    },

    _processFailure : function(transport){
        location.href = BASE_URL;
    },

    processResult : function(transport){
        if(this.caching){
            this.cache.set(this.url, transport);
        }
        if(this.callback){
            this.callback(transport.responseText);
        }
    }
}

if (!window.varienLoaderHandler)
    var varienLoaderHandler = new Object();

varienLoaderHandler.handler = {
    onCreate: function(request) {
        if(request.options.loaderArea===false){
            return;
        }

        request.options.loaderArea = $$('#html-body .wrapper')[0]; // Blocks all page

        if(request && request.options.loaderArea){
            Element.clonePosition($('loading-mask'), $(request.options.loaderArea), {offsetLeft:-2})
            toggleSelectsUnderBlock($('loading-mask'), false);
            Element.show('loading-mask');
            setLoaderPosition();
            if(request.options.loaderArea=='html-body'){
                //Element.show('loading-process');
            }
        }
        else{
            //Element.show('loading-process');
        }
    },

    onComplete: function(transport) {
        if(Ajax.activeRequestCount == 0) {
            //Element.hide('loading-process');
            toggleSelectsUnderBlock($('loading-mask'), true);
            Element.hide('loading-mask');
        }
    }
};

/**
 * @todo need calculate middle of visible area and scroll bind
 */
function setLoaderPosition(){
    var elem = $('loading_mask_loader');
    if (elem && Prototype.Browser.IE) {
        var elementDims = elem.getDimensions();
        var viewPort = document.viewport.getDimensions();
        var offsets = document.viewport.getScrollOffsets();
        elem.style.left = Math.floor(viewPort.width / 2 + offsets.left - elementDims.width / 2) + 'px';
        elem.style.top = Math.floor(viewPort.height / 2 + offsets.top - elementDims.height / 2) + 'px';
        elem.style.position = 'absolute';
    }
}

/*function getRealHeight() {
    var body = document.body;
    if (window.innerHeight && window.scrollMaxY) {
        return window.innerHeight + window.scrollMaxY;
    }
    return Math.max(body.scrollHeight, body.offsetHeight);
}*/



function toggleSelectsUnderBlock(block, flag){
    if(Prototype.Browser.IE){
        var selects = document.getElementsByTagName("select");
        for(var i=0; i<selects.length; i++){
            /**
             * @todo: need check intersection
             */
            if(flag){
                if(selects[i].needShowOnSuccess){
                    selects[i].needShowOnSuccess = false;
                    // Element.show(selects[i])
                    selects[i].style.visibility = '';
                }
            }
            else{
                if(Element.visible(selects[i])){
                    // Element.hide(selects[i]);
                    selects[i].style.visibility = 'hidden';
                    selects[i].needShowOnSuccess = true;
                }
            }
        }
    }
}

Ajax.Responders.register(varienLoaderHandler.handler);

var varienUpdater = Class.create(Ajax.Updater, {
    updateContent: function($super, responseText) {
        if (responseText.isJSON()) {
            var responseJSON = responseText.evalJSON();
            if (responseJSON.ajaxExpired && responseJSON.ajaxRedirect) {
                window.location.replace(responseJSON.ajaxRedirect);
            }
        } else {
            $super(responseText);
        }
    }
});

/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Mage
 * @package     Mage_Adminhtml
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */
var varienGrid = new Class.create();

varienGrid.prototype = {
    initialize : function(containerId, url, pageVar, sortVar, dirVar, filterVar){
        this.containerId = containerId;
        this.url = url;
        this.pageVar = pageVar || false;
        this.sortVar = sortVar || false;
        this.dirVar  = dirVar || false;
        this.filterVar  = filterVar || false;
        this.tableSufix = '_table';
        this.useAjax = false;
        this.rowClickCallback = false;
        this.checkboxCheckCallback = false;
        this.preInitCallback = false;
        this.initCallback = false;
        this.initRowCallback = false;
        this.doFilterCallback = false;

        this.reloadParams = false;

        this.trOnMouseOver  = this.rowMouseOver.bindAsEventListener(this);
        this.trOnMouseOut   = this.rowMouseOut.bindAsEventListener(this);
        this.trOnClick      = this.rowMouseClick.bindAsEventListener(this);
        this.trOnDblClick   = this.rowMouseDblClick.bindAsEventListener(this);
        this.trOnKeyPress   = this.keyPress.bindAsEventListener(this);

        this.thLinkOnClick      = this.doSort.bindAsEventListener(this);
        this.initGrid();
    },
    initGrid : function(){
        if(this.preInitCallback){
            this.preInitCallback(this);
        }
        if($(this.containerId+this.tableSufix)){
            this.rows = $$('#'+this.containerId+this.tableSufix+' tbody tr');
            for (var row=0; row<this.rows.length; row++) {
                if(row%2==0){
                    Element.addClassName(this.rows[row], 'even');
                }

                Event.observe(this.rows[row],'mouseover',this.trOnMouseOver);
                Event.observe(this.rows[row],'mouseout',this.trOnMouseOut);
                Event.observe(this.rows[row],'click',this.trOnClick);
                Event.observe(this.rows[row],'dblclick',this.trOnDblClick);
            }
        }
        if(this.sortVar && this.dirVar){
            var columns = $$('#'+this.containerId+this.tableSufix+' thead a');

            for(var col=0; col<columns.length; col++){
                Event.observe(columns[col],'click',this.thLinkOnClick);
            }
        }
        this.bindFilterFields();
        this.bindFieldsChange();
        if(this.initCallback){
            try {
                this.initCallback(this);
            }
            catch (e) {
                if(console) {
                    console.log(e);
                }
            }
        }
    },
    initGridAjax: function () {
        this.initGrid();
        this.initGridRows();
    },
    initGridRows: function() {
        if(this.initRowCallback){
            for (var row=0; row<this.rows.length; row++) {
                try {
                    this.initRowCallback(this, this.rows[row]);
                } catch (e) {
                    if(console) {
                        console.log(e);
                    }
                }
            }
        }
    },
    getContainerId : function(){
        return this.containerId;
    },
    rowMouseOver : function(event){
        var element = Event.findElement(event, 'tr');

        if (!element.title) return;

        Element.addClassName(element, 'on-mouse');

        if (!Element.hasClassName('pointer')
            && (this.rowClickCallback !== openGridRow || element.title)) {
            if (element.title) {
                Element.addClassName(element, 'pointer');
            }
        }
    },
    rowMouseOut : function(event){
        var element = Event.findElement(event, 'tr');
        Element.removeClassName(element, 'on-mouse');
    },
    rowMouseClick : function(event){
        if(this.rowClickCallback){
            try{
                this.rowClickCallback(this, event);
            }
            catch(e){}
        }
        varienGlobalEvents.fireEvent('gridRowClick', event);
    },
    rowMouseDblClick : function(event){
        varienGlobalEvents.fireEvent('gridRowDblClick', event);
    },
    keyPress : function(event){

    },
    doSort : function(event){
        var element = Event.findElement(event, 'a');

        if(element.name && element.title){
            this.addVarToUrl(this.sortVar, element.name);
            this.addVarToUrl(this.dirVar, element.title);
            this.reload(this.url);
        }
        Event.stop(event);
        return false;
    },
    loadByElement : function(element){
        if(element && element.name){
            this.reload(this.addVarToUrl(element.name, element.value));
        }
    },
    reload : function(url){
        if (!this.reloadParams) {
            this.reloadParams = {form_key: FORM_KEY};
        }
        else {
            this.reloadParams.form_key = FORM_KEY;
        }
        url = url || this.url;
        if(this.useAjax){
            new Ajax.Request(url + (url.match(new RegExp('\\?')) ? '&ajax=true' : '?ajax=true' ), {
                loaderArea: this.containerId,
                parameters: this.reloadParams || {},
                evalScripts: true,
                onFailure: this._processFailure.bind(this),
                onComplete: this.initGridAjax.bind(this),
                onSuccess: function(transport) {
                    try {
                        var responseText = transport.responseText.replace(/>\s+</g, '><');

                        if (transport.responseText.isJSON()) {
                            var response = transport.responseText.evalJSON()
                            if (response.error) {
                                alert(response.message);
                            }
                            if(response.ajaxExpired && response.ajaxRedirect) {
                                setLocation(response.ajaxRedirect);
                            }
                        } else {
                            /**
                             * For IE <= 7.
                             * If there are two elements, and first has name, that equals id of second.
                             * In this case, IE will choose one that is above
                             *
                             * @see https://prototype.lighthouseapp.com/projects/8886/tickets/994-id-selector-finds-elements-by-name-attribute-in-ie7
                             */
                            var divId = $(this.containerId);
                            if (divId.id == this.containerId) {
                                divId.update(responseText);
                            } else {
                                $$('div[id="'+this.containerId+'"]')[0].update(responseText);
                            }
                        }
                    } catch (e) {
                        var divId = $(this.containerId);
                        if (divId.id == this.containerId) {
                            divId.update(responseText);
                        } else {
                            $$('div[id="'+this.containerId+'"]')[0].update(responseText);
                        }
                    }
                }.bind(this)
            });
            return;
        }
        else{
            if(this.reloadParams){
                $H(this.reloadParams).each(function(pair){
                    url = this.addVarToUrl(pair.key, pair.value);
                }.bind(this));
            }
            location.href = url;
        }
    },
    /*_processComplete : function(transport){
        console.log(transport);
        if (transport && transport.responseText){
            try{
                response = eval('(' + transport.responseText + ')');
            }
            catch (e) {
                response = {};
            }
        }
        if (response.ajaxExpired && response.ajaxRedirect) {
            location.href = response.ajaxRedirect;
            return false;
        }
        this.initGrid();
    },*/
    _processFailure : function(transport){
        location.href = BASE_URL;
    },
    _addVarToUrl : function(url, varName, varValue){
        var re = new RegExp('\/('+varName+'\/.*?\/)');
        var parts = url.split(new RegExp('\\?'));
        url = parts[0].replace(re, '/');
        url+= varName+'/'+varValue+'/';
        if(parts.size()>1) {
            url+= '?' + parts[1];
        }
        return url;
    },
    addVarToUrl : function(varName, varValue){
        this.url = this._addVarToUrl(this.url, varName, varValue);
        return this.url;
    },
    doExport : function(){
        if($(this.containerId+'_export')){
            var exportUrl = $(this.containerId+'_export').value;
            if(this.massaction && this.massaction.checkedString) {
                exportUrl = this._addVarToUrl(exportUrl, this.massaction.formFieldNameInternal, this.massaction.checkedString);
            }
            location.href = exportUrl;
        }
    },
    bindFilterFields : function(){
        var filters = $$('#'+this.containerId+' .filter input', '#'+this.containerId+' .filter select');
        for (var i=0; i<filters.length; i++) {
            Event.observe(filters[i],'keypress',this.filterKeyPress.bind(this));
        }
    },
    bindFieldsChange : function(){
        if (!$(this.containerId)) {
            return;
        }
//        var dataElements = $(this.containerId+this.tableSufix).down('.data tbody').select('input', 'select');
        var dataElements = $(this.containerId+this.tableSufix).down('tbody').select('input', 'select');
        for(var i=0; i<dataElements.length;i++){
            Event.observe(dataElements[i], 'change', dataElements[i].setHasChanges.bind(dataElements[i]));
        }
    },
    filterKeyPress : function(event){
        if(event.keyCode==Event.KEY_RETURN){
            this.doFilter();
        }
    },
    doFilter : function(){
        var filters = $$('#'+this.containerId+' .filter input', '#'+this.containerId+' .filter select');
        var elements = [];
        for(var i in filters){
            if(filters[i].value && filters[i].value.length) elements.push(filters[i]);
        }
        if (!this.doFilterCallback || (this.doFilterCallback && this.doFilterCallback())) {
            this.reload(this.addVarToUrl(this.filterVar, encode_base64(Form.serializeElements(elements))));
        }
    },
    resetFilter : function(){
        this.reload(this.addVarToUrl(this.filterVar, ''));
    },
    checkCheckboxes : function(element){
        elements = Element.select($(this.containerId), 'input[name="'+element.name+'"]');
        for(var i=0; i<elements.length;i++){
            this.setCheckboxChecked(elements[i], element.checked);
        }
    },
    setCheckboxChecked : function(element, checked){
        element.checked = checked;
        element.setHasChanges({});
        if(this.checkboxCheckCallback){
            this.checkboxCheckCallback(this,element,checked);
        }
    },
    inputPage : function(event, maxNum){
        var element = Event.element(event);
        var keyCode = event.keyCode || event.which;
        if(keyCode==Event.KEY_RETURN){
            this.setPage(element.value);
        }
        /*if(keyCode>47 && keyCode<58){

        }
        else{
             Event.stop(event);
        }*/
    },
    setPage : function(pageNumber){
        this.reload(this.addVarToUrl(this.pageVar, pageNumber));
    }
};

function openGridRow(grid, event){
    var element = Event.findElement(event, 'tr');
    if(['a', 'input', 'select', 'option'].indexOf(Event.element(event).tagName.toLowerCase())!=-1) {
        return;
    }

    if(element.title){
        setLocation(element.title);
    }
}

var varienGridMassaction = Class.create();
varienGridMassaction.prototype = {
    /* Predefined vars */
    checkedValues: $H({}),
    checkedString: '',
    oldCallbacks: {},
    errorText:'',
    items: {},
    gridIds: [],
    useSelectAll: false,
    currentItem: false,
    lastChecked: { left: false, top: false, checkbox: false },
    fieldTemplate: new Template('<input type="hidden" name="#{name}" value="#{value}" />'),
    initialize: function (containerId, grid, checkedValues, formFieldNameInternal, formFieldName) {
        this.setOldCallback('row_click', grid.rowClickCallback);
        this.setOldCallback('init',      grid.initCallback);
        this.setOldCallback('init_row',  grid.initRowCallback);
        this.setOldCallback('pre_init',  grid.preInitCallback);

        this.useAjax        = false;
        this.grid           = grid;
        this.grid.massaction = this;
        this.containerId    = containerId;
        this.initMassactionElements();

        this.checkedString          = checkedValues;
        this.formFieldName          = formFieldName;
        this.formFieldNameInternal  = formFieldNameInternal;

        this.grid.initCallback      = this.onGridInit.bind(this);
        this.grid.preInitCallback   = this.onGridPreInit.bind(this);
        this.grid.initRowCallback   = this.onGridRowInit.bind(this);
        this.grid.rowClickCallback  = this.onGridRowClick.bind(this);
        this.initCheckboxes();
        this.checkCheckboxes();
    },
    setUseAjax: function(flag) {
        this.useAjax = flag;
    },
    setUseSelectAll: function(flag) {
        this.useSelectAll = flag;
    },
    initMassactionElements: function() {
        this.container      = $(this.containerId);
        this.count          = $(this.containerId + '-count');
        this.formHiddens    = $(this.containerId + '-form-hiddens');
        this.formAdditional = $(this.containerId + '-form-additional');
        this.select         = $(this.containerId + '-select');
        this.form           = this.prepareForm();
        this.validator      = new Validation(this.form);
        this.select.observe('change', this.onSelectChange.bindAsEventListener(this));
        this.lastChecked    = { left: false, top: false, checkbox: false };
        this.initMassSelect();
    },
    prepareForm: function() {
        var form = $(this.containerId + '-form'), formPlace = null,
            formElement = this.formHiddens || this.formAdditional;

        if (!formElement) {
            formElement = this.container.getElementsByTagName('button')[0];
            formElement && formElement.parentNode;
        }
        if (!form && formElement) {
            /* fix problem with rendering form in FF through innerHTML property */
            form = document.createElement('form');
            form.setAttribute('method', 'post');
            form.setAttribute('action', '');
            form.id = this.containerId + '-form';
            formPlace = formElement.parentNode.parentNode;
            formPlace.parentNode.appendChild(form);
            form.appendChild(formPlace);
        }

        return form;
    },
    setGridIds: function(gridIds) {
        this.gridIds = gridIds;
        this.updateCount();
    },
    getGridIds: function() {
        return this.gridIds;
    },
    setItems: function(items) {
        this.items = items;
        this.updateCount();
    },
    getItems: function() {
        return this.items;
    },
    getItem: function(itemId) {
        if(this.items[itemId]) {
            return this.items[itemId];
        }
        return false;
    },
    getOldCallback: function (callbackName) {
        return this.oldCallbacks[callbackName] ? this.oldCallbacks[callbackName] : Prototype.emptyFunction;
    },
    setOldCallback: function (callbackName, callback) {
        this.oldCallbacks[callbackName] = callback;
    },
    onGridPreInit: function(grid) {
        this.initMassactionElements();
        this.getOldCallback('pre_init')(grid);
    },
    onGridInit: function(grid) {
        this.initCheckboxes();
        this.checkCheckboxes();
        this.updateCount();
        this.getOldCallback('init')(grid);
    },
    onGridRowInit: function(grid, row) {
        this.getOldCallback('init_row')(grid, row);
    },
    onGridRowClick: function(grid, evt) {

        var tdElement = Event.findElement(evt, 'td');
        var trElement = Event.findElement(evt, 'tr');

        if(!$(tdElement).down('input')) {
            if($(tdElement).down('a') || $(tdElement).down('select')) {
                return;
            }
            if (trElement.title) {
                setLocation(trElement.title);
            }
            else{
                var checkbox = Element.select(trElement, 'input');
                var isInput  = Event.element(evt).tagName == 'input';
                var checked = isInput ? checkbox[0].checked : !checkbox[0].checked;

                if(checked) {
                    this.checkedString = varienStringArray.add(checkbox[0].value, this.checkedString);
                } else {
                    this.checkedString = varienStringArray.remove(checkbox[0].value, this.checkedString);
                }
                this.grid.setCheckboxChecked(checkbox[0], checked);
                this.updateCount();
            }
            return;
        }

        if(Event.element(evt).isMassactionCheckbox) {
           this.setCheckbox(Event.element(evt));
        } else if (checkbox = this.findCheckbox(evt)) {
           checkbox.checked = !checkbox.checked;
           this.setCheckbox(checkbox);
        }
    },
    onSelectChange: function(evt) {
        var item = this.getSelectedItem();
        if(item) {
            this.formAdditional.update($(this.containerId + '-item-' + item.id + '-block').innerHTML);
        } else {
            this.formAdditional.update('');
        }

        this.validator.reset();
    },
    findCheckbox: function(evt) {
        if(['a', 'input', 'select'].indexOf(Event.element(evt).tagName.toLowerCase())!==-1) {
            return false;
        }
        checkbox = false;
        Event.findElement(evt, 'tr').select('.massaction-checkbox').each(function(element){
            if(element.isMassactionCheckbox) {
                checkbox = element;
            }
        }.bind(this));
        return checkbox;
    },
    initCheckboxes: function() {
        this.getCheckboxes().each(function(checkbox) {
           checkbox.isMassactionCheckbox = true;
        }.bind(this));
    },
    checkCheckboxes: function() {
        this.getCheckboxes().each(function(checkbox) {
            checkbox.checked = varienStringArray.has(checkbox.value, this.checkedString);
        }.bind(this));
    },
    selectAll: function() {
        this.setCheckedValues((this.useSelectAll ? this.getGridIds() : this.getCheckboxesValuesAsString()));
        this.checkCheckboxes();
        this.updateCount();
        this.clearLastChecked();
        return false;
    },
    unselectAll: function() {
        this.setCheckedValues('');
        this.checkCheckboxes();
        this.updateCount();
        this.clearLastChecked();
        return false;
    },
    selectVisible: function() {
        this.setCheckedValues(this.getCheckboxesValuesAsString());
        this.checkCheckboxes();
        this.updateCount();
        this.clearLastChecked();
        return false;
    },
    unselectVisible: function() {
        this.getCheckboxesValues().each(function(key){
            this.checkedString = varienStringArray.remove(key, this.checkedString);
        }.bind(this));
        this.checkCheckboxes();
        this.updateCount();
        this.clearLastChecked();
        return false;
    },
    setCheckedValues: function(values) {
        this.checkedString = values;
    },
    getCheckedValues: function() {
        return this.checkedString;
    },
    getCheckboxes: function() {
        var result = [];
        this.grid.rows.each(function(row){
            var checkboxes = row.select('.massaction-checkbox');
            checkboxes.each(function(checkbox){
                result.push(checkbox);
            });
        });
        return result;
    },
    getCheckboxesValues: function() {
        var result = [];
        this.getCheckboxes().each(function(checkbox) {
            result.push(checkbox.value);
        }.bind(this));
        return result;
    },
    getCheckboxesValuesAsString: function()
    {
        return this.getCheckboxesValues().join(',');
    },
    setCheckbox: function(checkbox) {
        if(checkbox.checked) {
            this.checkedString = varienStringArray.add(checkbox.value, this.checkedString);
        } else {
            this.checkedString = varienStringArray.remove(checkbox.value, this.checkedString);
        }
        this.updateCount();
    },
    updateCount: function() {
        this.count.update(varienStringArray.count(this.checkedString));
        if(!this.grid.reloadParams) {
            this.grid.reloadParams = {};
        }
        this.grid.reloadParams[this.formFieldNameInternal] = this.checkedString;
    },
    getSelectedItem: function() {
        if(this.getItem(this.select.value)) {
            return this.getItem(this.select.value);
        } else {
            return false;
        }
    },
    apply: function() {
        if(varienStringArray.count(this.checkedString) == 0) {
                alert(this.errorText);
                return;
            }

        var item = this.getSelectedItem();
        if(!item) {
            this.validator.validate();
            return;
        }
        this.currentItem = item;
        var fieldName = (item.field ? item.field : this.formFieldName);
        var fieldsHtml = '';

        if(this.currentItem.confirm && !window.confirm(this.currentItem.confirm)) {
            return;
        }

        this.formHiddens.update('');
        new Insertion.Bottom(this.formHiddens, this.fieldTemplate.evaluate({name: fieldName, value: this.checkedString}));
        new Insertion.Bottom(this.formHiddens, this.fieldTemplate.evaluate({name: 'massaction_prepare_key', value: fieldName}));

        if(!this.validator.validate()) {
            return;
        }

        if(this.useAjax && item.url) {
            new Ajax.Request(item.url, {
                'method': 'post',
                'parameters': this.form.serialize(true),
                'onComplete': this.onMassactionComplete.bind(this)
            });
        } else if(item.url) {
            this.form.action = item.url;
            this.form.submit();
        }
    },
    onMassactionComplete: function(transport) {
        if(this.currentItem.complete) {
            try {
                var listener = this.getListener(this.currentItem.complete) || Prototype.emptyFunction;
                listener(this.grid, this, transport);
            } catch (e) {}
       }
    },
    getListener: function(strValue) {
        return eval(strValue);
    },
    initMassSelect: function() {
        $$('input[class~="massaction-checkbox"]').each(
            function(element) {
                element.observe('click', this.massSelect.bind(this));
            }.bind(this)
            );
    },
    clearLastChecked: function() {
        this.lastChecked = {
            left: false,
            top: false,
            checkbox: false
        };
    },
    massSelect: function(evt) {
        if(this.lastChecked.left !== false
            && this.lastChecked.top !== false
            && evt.button === 0
            && evt.shiftKey === true
        ) {
            var currentCheckbox = Event.element(evt);
            var lastCheckbox = this.lastChecked.checkbox;
            if (lastCheckbox != currentCheckbox) {
                var start = this.getCheckboxOrder(lastCheckbox);
                var finish = this.getCheckboxOrder(currentCheckbox);
                if (start !== false && finish !== false) {
                    this.selectCheckboxRange(
                        Math.min(start, finish),
                        Math.max(start, finish),
                        currentCheckbox.checked
                    );
                }
            }
        }

        this.lastChecked = {
            left: Event.element(evt).viewportOffset().left,
            top: Event.element(evt).viewportOffset().top,
            checkbox: Event.element(evt) // "boundary" checkbox
        };
    },
    getCheckboxOrder: function(curCheckbox) {
        var order = false;
        this.getCheckboxes().each(function(checkbox, key){
            if (curCheckbox == checkbox) {
                order = key;
            }
        });
        return order;
    },
    selectCheckboxRange: function(start, finish, isChecked){
        this.getCheckboxes().each((function(checkbox, key){
            if (key >= start && key <= finish) {
                checkbox.checked = isChecked;
                this.setCheckbox(checkbox);
            }
        }).bind(this));
    }
};

var varienGridAction = {
    execute: function(select) {
        if(!select.value || !select.value.isJSON()) {
            return;
        }

        var config = select.value.evalJSON();
        if(config.confirm && !window.confirm(config.confirm)) {
            select.options[0].selected = true;
            return;
        }

        if(config.popup) {
            var win = window.open(config.href, 'action_window', 'width=500,height=600,resizable=1,scrollbars=1');
            win.focus();
            select.options[0].selected = true;
        } else {
            setLocation(config.href);
        }
    }
};

var varienStringArray = {
    remove: function(str, haystack)
    {
        haystack = ',' + haystack + ',';
        haystack = haystack.replace(new RegExp(',' + str + ',', 'g'), ',');
        return this.trimComma(haystack);
    },
    add: function(str, haystack)
    {
        haystack = ',' + haystack + ',';
        if (haystack.search(new RegExp(',' + str + ',', 'g'), haystack) === -1) {
            haystack += str + ',';
        }
        return this.trimComma(haystack);
    },
    has: function(str, haystack)
    {
        haystack = ',' + haystack + ',';
        if (haystack.search(new RegExp(',' + str + ',', 'g'), haystack) === -1) {
            return false;
        }
        return true;
    },
    count: function(haystack)
    {
        if (typeof haystack != 'string') {
            return 0;
        }
        if (match = haystack.match(new RegExp(',', 'g'))) {
            return match.length + 1;
        } else if (haystack.length != 0) {
            return 1;
        }
        return 0;
    },
    each: function(haystack, fnc)
    {
        var haystack = haystack.split(',');
        for (var i=0; i<haystack.length; i++) {
            fnc(haystack[i]);
        }
    },
    trimComma: function(string)
    {
        string = string.replace(new RegExp('^(,+)','i'), '');
        string = string.replace(new RegExp('(,+)$','i'), '');
        return string;
    }
};

var serializerController = Class.create();
serializerController.prototype = {
    oldCallbacks: {},
    initialize: function(hiddenDataHolder, predefinedData, inputsToManage, grid, reloadParamName){
        //Grid inputs
        this.tabIndex = 1000;
        this.inputsToManage       = inputsToManage;
        this.multidimensionalMode = inputsToManage.length > 0;

        //Hash with grid data
        this.gridData             = this.getGridDataHash(predefinedData);

        //Hidden input data holder
        this.hiddenDataHolder     = $(hiddenDataHolder);
        this.hiddenDataHolder.value = this.serializeObject();

        this.grid = grid;

        // Set old callbacks
        this.setOldCallback('row_click', this.grid.rowClickCallback);
        this.setOldCallback('init_row', this.grid.initRowCallback);
        this.setOldCallback('checkbox_check', this.grid.checkboxCheckCallback);

        //Grid
        this.reloadParamName = reloadParamName;
        this.grid.reloadParams = {};
        this.grid.reloadParams[this.reloadParamName+'[]'] = this.getDataForReloadParam();
        this.grid.rowClickCallback = this.rowClick.bind(this);
        this.grid.initRowCallback = this.rowInit.bind(this);
        this.grid.checkboxCheckCallback = this.registerData.bind(this);
        this.grid.rows.each(this.eachRow.bind(this));
    },
    setOldCallback: function (callbackName, callback) {
        this.oldCallbacks[callbackName] = callback;
    },
    getOldCallback: function (callbackName) {
        return this.oldCallbacks[callbackName] ? this.oldCallbacks[callbackName] : Prototype.emptyFunction;
    },
    registerData : function(grid, element, checked) {
        if(this.multidimensionalMode){
            if(checked){
                 if(element.inputElements) {
                     this.gridData.set(element.value, {});
                     for(var i = 0; i < element.inputElements.length; i++) {
                         element.inputElements[i].disabled = false;
                         this.gridData.get(element.value)[element.inputElements[i].name] = element.inputElements[i].value;
                     }
                 }
            }
            else{
                if(element.inputElements){
                    for(var i = 0; i < element.inputElements.length; i++) {
                        element.inputElements[i].disabled = true;
                    }
                }
                this.gridData.unset(element.value);
            }
        }
        else{
            if(checked){
                this.gridData.set(element.value, element.value);
            }
            else{
                this.gridData.unset(element.value);
            }
        }

        this.hiddenDataHolder.value = this.serializeObject();
        this.grid.reloadParams = {};
        this.grid.reloadParams[this.reloadParamName+'[]'] = this.getDataForReloadParam();
        this.getOldCallback('checkbox_check')(grid, element, checked);
    },
    eachRow : function(row) {
        this.rowInit(this.grid, row);
    },
    rowClick : function(grid, event) {
        var trElement = Event.findElement(event, 'tr');
        var isInput   = Event.element(event).tagName == 'INPUT';
        if(trElement){
            var checkbox = Element.select(trElement, 'input');
            if(checkbox[0] && !checkbox[0].disabled){
                var checked = isInput ? checkbox[0].checked : !checkbox[0].checked;
                this.grid.setCheckboxChecked(checkbox[0], checked);
            }
        }
        this.getOldCallback('row_click')(grid, event);
    },
    inputChange : function(event) {
        var element = Event.element(event);
        if(element && element.checkboxElement && element.checkboxElement.checked){
            this.gridData.get(element.checkboxElement.value)[element.name] = element.value;
            this.hiddenDataHolder.value = this.serializeObject();
        }
    },
    rowInit : function(grid, row) {
        if(this.multidimensionalMode){
            var checkbox = $(row).select('.checkbox')[0];
            var selectors = this.inputsToManage.map(function (name) { return ['input[name="' + name + '"]', 'select[name="' + name + '"]']; });
            var inputs = $(row).select.apply($(row), selectors.flatten());
            if(checkbox && inputs.length > 0) {
                checkbox.inputElements = inputs;
                for(var i = 0; i < inputs.length; i++) {
                    inputs[i].checkboxElement = checkbox;
                    if(this.gridData.get(checkbox.value) && this.gridData.get(checkbox.value)[inputs[i].name]) {
                        inputs[i].value = this.gridData.get(checkbox.value)[inputs[i].name];
                    }
                    inputs[i].disabled = !checkbox.checked;
                    inputs[i].tabIndex = this.tabIndex++;
                    Event.observe(inputs[i],'keyup', this.inputChange.bind(this));
                    Event.observe(inputs[i],'change', this.inputChange.bind(this));
                }
            }
        }
        this.getOldCallback('init_row')(grid, row);
    },

    //Stuff methods
    getGridDataHash: function (_object){
        return $H(this.multidimensionalMode ? _object : this.convertArrayToObject(_object))
    },
    getDataForReloadParam: function(){
        return this.multidimensionalMode ? this.gridData.keys() : this.gridData.values();
    },
    serializeObject: function(){
        if(this.multidimensionalMode){
            var clone = this.gridData.clone();
            clone.each(function(pair) {
                clone.set(pair.key, encode_base64(Object.toQueryString(pair.value)));
            });
            return clone.toQueryString();
        }
        else{
            return this.gridData.values().join('&');
        }
    },
    convertArrayToObject: function (_array){
        var _object = {};
        for(var i = 0, l = _array.length; i < l; i++){
            _object[_array[i]] = _array[i];
        }
        return _object;
    }
};

/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Mage
 * @package     Mage_Adminhtml
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */
var varienTabs = new Class.create();

varienTabs.prototype = {
    initialize : function(containerId, destElementId,  activeTabId, shadowTabs){
        this.containerId    = containerId;
        this.destElementId  = destElementId;
        this.activeTab = null;

        this.tabOnClick     = this.tabMouseClick.bindAsEventListener(this);

        this.tabs = $$('#'+this.containerId+' li a.tab-item-link');

        this.hideAllTabsContent();
        for (var tab=0; tab<this.tabs.length; tab++) {
            Event.observe(this.tabs[tab],'click',this.tabOnClick);
            // move tab contents to destination element
            if($(this.destElementId)){
                var tabContentElement = $(this.getTabContentElementId(this.tabs[tab]));
                if(tabContentElement && tabContentElement.parentNode.id != this.destElementId){
                    $(this.destElementId).appendChild(tabContentElement);
                    tabContentElement.container = this;
                    tabContentElement.statusBar = this.tabs[tab];
                    tabContentElement.tabObject  = this.tabs[tab];
                    this.tabs[tab].contentMoved = true;
                    this.tabs[tab].container = this;
                    this.tabs[tab].show = function(){
                        this.container.showTabContent(this);
                    }
                    if(varienGlobalEvents){
                        varienGlobalEvents.fireEvent('moveTab', {tab:this.tabs[tab]});
                    }
                }
            }
/*
            // this code is pretty slow in IE, so lets do it in tabs*.phtml
            // mark ajax tabs as not loaded
            if (Element.hasClassName($(this.tabs[tab].id), 'ajax')) {
                Element.addClassName($(this.tabs[tab].id), 'notloaded');
            }
*/
            // bind shadow tabs
            if (this.tabs[tab].id && shadowTabs && shadowTabs[this.tabs[tab].id]) {
                this.tabs[tab].shadowTabs = shadowTabs[this.tabs[tab].id];
            }
        }

        this.displayFirst = activeTabId;
        Event.observe(window,'load',this.moveTabContentInDest.bind(this));
    },
    
    setSkipDisplayFirstTab : function(){
        this.displayFirst = null;
    },

    moveTabContentInDest : function(){
        for(var tab=0; tab<this.tabs.length; tab++){
            if($(this.destElementId) &&  !this.tabs[tab].contentMoved){
                var tabContentElement = $(this.getTabContentElementId(this.tabs[tab]));
                if(tabContentElement && tabContentElement.parentNode.id != this.destElementId){
                    $(this.destElementId).appendChild(tabContentElement);
                    tabContentElement.container = this;
                    tabContentElement.statusBar = this.tabs[tab];
                    tabContentElement.tabObject  = this.tabs[tab];
                    this.tabs[tab].container = this;
                    this.tabs[tab].show = function(){
                        this.container.showTabContent(this);
                    }
                    if(varienGlobalEvents){
                        varienGlobalEvents.fireEvent('moveTab', {tab:this.tabs[tab]});
                    }
                }
            }
        }
        if (this.displayFirst) {
            this.showTabContent($(this.displayFirst));
            this.displayFirst = null;
        }
    },

    getTabContentElementId : function(tab){
        if(tab){
            return tab.id+'_content';
        }
        return false;
    },

    tabMouseClick : function(event) {
        var tab = Event.findElement(event, 'a');

        // go directly to specified url or switch tab
        if ((tab.href.indexOf('#') != tab.href.length-1)
            && !(Element.hasClassName(tab, 'ajax'))
        ) {
            location.href = tab.href;
        }
        else {
            this.showTabContent(tab);
        }
        Event.stop(event);
    },

    hideAllTabsContent : function(){
        for(var tab in this.tabs){
            this.hideTabContent(this.tabs[tab]);
        }
    },

    // show tab, ready or not
    showTabContentImmediately : function(tab) {
        this.hideAllTabsContent();
        var tabContentElement = $(this.getTabContentElementId(tab));
        if (tabContentElement) {
            Element.show(tabContentElement);
            Element.addClassName(tab, 'active');
            // load shadow tabs, if any
            if (tab.shadowTabs && tab.shadowTabs.length) {
                for (var k in tab.shadowTabs) {
                    this.loadShadowTab($(tab.shadowTabs[k]));
                }
            }
            if (!Element.hasClassName(tab, 'ajax only')) {
                Element.removeClassName(tab, 'notloaded');
            }
            this.activeTab = tab;
        }
        if (varienGlobalEvents) {
            varienGlobalEvents.fireEvent('showTab', {tab:tab});
        }
    },

    // the lazy show tab method
    showTabContent : function(tab) {
        var tabContentElement = $(this.getTabContentElementId(tab));
        if (tabContentElement) {
            if (this.activeTab != tab) {
                if (varienGlobalEvents) {
                    if (varienGlobalEvents.fireEvent('tabChangeBefore', $(this.getTabContentElementId(this.activeTab))).indexOf('cannotchange') != -1) {
                        return;
                    };
                }
            }
            // wait for ajax request, if defined
            var isAjax = Element.hasClassName(tab, 'ajax');
            var isEmpty = tabContentElement.innerHTML=='' && tab.href.indexOf('#')!=tab.href.length-1;
            var isNotLoaded = Element.hasClassName(tab, 'notloaded');

            if ( isAjax && (isEmpty || isNotLoaded) )
            {
                new Ajax.Request(tab.href, {
                    parameters: {form_key: FORM_KEY},
                    evalScripts: true,
                    onSuccess: function(transport) {
                        try {
                            if (transport.responseText.isJSON()) {
                                var response = transport.responseText.evalJSON()
                                if (response.error) {
                                    alert(response.message);
                                }
                                if(response.ajaxExpired && response.ajaxRedirect) {
                                    setLocation(response.ajaxRedirect);
                                }
                            } else {
                                $(tabContentElement.id).update(transport.responseText);
                                this.showTabContentImmediately(tab)
                            }
                        }
                        catch (e) {
                            $(tabContentElement.id).update(transport.responseText);
                            this.showTabContentImmediately(tab)
                        }
                    }.bind(this)
                });
            }
            else {
                this.showTabContentImmediately(tab);
            }
        }
    },

    loadShadowTab : function(tab) {
        var tabContentElement = $(this.getTabContentElementId(tab));
        if (tabContentElement && Element.hasClassName(tab, 'ajax') && Element.hasClassName(tab, 'notloaded')) {
            new Ajax.Request(tab.href, {
                parameters: {form_key: FORM_KEY},
                evalScripts: true,
                onSuccess: function(transport) {
                    try {
                        if (transport.responseText.isJSON()) {
                            var response = transport.responseText.evalJSON()
                            if (response.error) {
                                alert(response.message);
                            }
                            if(response.ajaxExpired && response.ajaxRedirect) {
                                setLocation(response.ajaxRedirect);
                            }
                        } else {
                            $(tabContentElement.id).update(transport.responseText);
                            if (!Element.hasClassName(tab, 'ajax only')) {
                                Element.removeClassName(tab, 'notloaded');
                            }
                        }
                    }
                    catch (e) {
                        $(tabContentElement.id).update(transport.responseText);
                        if (!Element.hasClassName(tab, 'ajax only')) {
                            Element.removeClassName(tab, 'notloaded');
                        }
                    }
                }.bind(this)
            });
        }
    },

    hideTabContent : function(tab){
        var tabContentElement = $(this.getTabContentElementId(tab));
        if($(this.destElementId) && tabContentElement){
           Element.hide(tabContentElement);
           Element.removeClassName(tab, 'active');
        }
        if(varienGlobalEvents){
            varienGlobalEvents.fireEvent('hideTab', {tab:tab});
        }
    }
}

/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Mage
 * @package     Mage_Adminhtml
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */
var varienForm = new Class.create();

varienForm.prototype = {
    initialize : function(formId, validationUrl){
        this.formId = formId;
        this.validationUrl = validationUrl;
        this.submitUrl = false;

        if($(this.formId)){
            this.validator  = new Validation(this.formId, {onElementValidate : this.checkErrors.bind(this)});
        }
        this.errorSections = $H({});
    },

    checkErrors : function(result, elm){
        if(!result)
            elm.setHasError(true, this);
        else
            elm.setHasError(false, this);
    },

    validate : function(){
        if(this.validator && this.validator.validate()){
            if(this.validationUrl){
                this._validate();
            }
            return true;
        }
        return false;
    },

    submit : function(url){
        if (typeof varienGlobalEvents != undefined) {
            varienGlobalEvents.fireEvent('formSubmit', this.formId);
        }
        this.errorSections = $H({});
        this.canShowError = true;
        this.submitUrl = url;
        if(this.validator && this.validator.validate()){
            if(this.validationUrl){
                this._validate();
            }
            else{
                this._submit();
            }
            return true;
        }
        return false;
    },

    _validate : function(){
        new Ajax.Request(this.validationUrl,{
            method: 'post',
            parameters: $(this.formId).serialize(),
            onComplete: this._processValidationResult.bind(this),
            onFailure: this._processFailure.bind(this)
        });
    },

    _processValidationResult : function(transport){
        if (typeof varienGlobalEvents != undefined) {
            varienGlobalEvents.fireEvent('formValidateAjaxComplete', transport);
        }
        var response = transport.responseText.evalJSON();
        if(response.error){
            if($('messages')){
                $('messages').innerHTML = response.message;
            }
        }
        else{
            this._submit();
        }
    },

    _processFailure : function(transport){
        location.href = BASE_URL;
    },

    _submit : function(){
        var $form = $(this.formId);
        if(this.submitUrl){
            $form.action = this.submitUrl;
        }
        $form.submit();
    }
}

/**
 * redeclare Validation.isVisible function
 *
 * use for not visible elements validation
 */
Validation.isVisible = function(elm){
    while (elm && elm.tagName != 'BODY') {
        if (elm.disabled) return false;
        if ((Element.hasClassName(elm, 'template') && Element.hasClassName(elm, 'no-display'))
             || Element.hasClassName(elm, 'ignore-validate')){
            return false;
        }
        elm = elm.parentNode;
    }
    return true;
}

/**
 *  Additional elements methods
 */
var varienElementMethods = {
    setHasChanges : function(element, event){
        if($(element) && $(element).hasClassName('no-changes')) return;
        var elm = element;
        while(elm && elm.tagName != 'BODY') {
            if(elm.statusBar)
                Element.addClassName($(elm.statusBar), 'changed')
            elm = elm.parentNode;
        }
    },
    setHasError : function(element, flag, form){
        var elm = element;
        while(elm && elm.tagName != 'BODY') {
            if(elm.statusBar){
                if(form.errorSections.keys().indexOf(elm.statusBar.id)<0)
                    form.errorSections.set(elm.statusBar.id, flag);
                if(flag){
                    Element.addClassName($(elm.statusBar), 'error');
                    if(form.canShowError && $(elm.statusBar).show){
                        form.canShowError = false;
                        $(elm.statusBar).show();
                    }
                    form.errorSections.set(elm.statusBar.id, flag);
                }
                else if(!form.errorSections.get(elm.statusBar.id)){
                    Element.removeClassName($(elm.statusBar), 'error')
                }
            }
            elm = elm.parentNode;
        }
        this.canShowElement = false;
    }
}

Element.addMethods(varienElementMethods);

// Global bind changes
varienWindowOnloadCache = {};
function varienWindowOnload(useCache){
    var dataElements = $$('input', 'select', 'textarea');
    for(var i=0; i<dataElements.length;i++){
        if(dataElements[i] && dataElements[i].id){
            if ((!useCache) || (!varienWindowOnloadCache[dataElements[i].id])) {
                Event.observe(dataElements[i], 'change', dataElements[i].setHasChanges.bind(dataElements[i]));
                if (useCache) {
                    varienWindowOnloadCache[dataElements[i].id] = true;
                }
            }
        }
    }
}
Event.observe(window, 'load', varienWindowOnload);

RegionUpdater = Class.create();
RegionUpdater.prototype = {
    initialize: function (countryEl, regionTextEl, regionSelectEl, regions, disableAction, clearRegionValueOnDisable)
    {
        this.countryEl = $(countryEl);
        this.regionTextEl = $(regionTextEl);
        this.regionSelectEl = $(regionSelectEl);
//        // clone for select element (#6924)
//        this._regionSelectEl = {};
//        this.tpl = new Template('<select class="#{className}" name="#{name}" id="#{id}">#{innerHTML}</select>');
        this.config = regions['config'];
        delete regions.config;
        this.regions = regions;
        this.disableAction = (typeof disableAction=='undefined') ? 'hide' : disableAction;
        this.clearRegionValueOnDisable = (typeof clearRegionValueOnDisable == 'undefined') ? false : clearRegionValueOnDisable;

        if (this.regionSelectEl.options.length<=1) {
            this.update();
        }
        else {
            this.lastCountryId = this.countryEl.value;
        }

        this.countryEl.changeUpdater = this.update.bind(this);

        Event.observe(this.countryEl, 'change', this.update.bind(this));
    },

    _checkRegionRequired: function()
    {
        var label, wildCard;
        var elements = [this.regionTextEl, this.regionSelectEl];
        var that = this;
        if (typeof this.config == 'undefined') {
            return;
        }
        var regionRequired = this.config.regions_required.indexOf(this.countryEl.value) >= 0;

        elements.each(function(currentElement) {
            if(!currentElement) {
                return;
            }
            Validation.reset(currentElement);
            label = $$('label[for="' + currentElement.id + '"]')[0];
            if (label) {
                wildCard = label.down('em') || label.down('span.required');
                var topElement = label.up('tr') || label.up('li');
                if (!that.config.show_all_regions && topElement) {
                    if (regionRequired) {
                        topElement.show();
                    } else {
                        topElement.hide();
                    }
                }
            }

            if (label && wildCard) {
                if (!regionRequired) {
                    wildCard.hide();
                } else {
                    wildCard.show();
                }
            }

            if (!regionRequired || !currentElement.visible()) {
                if (currentElement.hasClassName('required-entry')) {
                    currentElement.removeClassName('required-entry');
                }
                if ('select' == currentElement.tagName.toLowerCase() &&
                    currentElement.hasClassName('validate-select')
                ) {
                    currentElement.removeClassName('validate-select');
                }
            } else {
                if (!currentElement.hasClassName('required-entry')) {
                    currentElement.addClassName('required-entry');
                }
                if ('select' == currentElement.tagName.toLowerCase() &&
                    !currentElement.hasClassName('validate-select')
                ) {
                    currentElement.addClassName('validate-select');
                }
            }
        });
    },

    update: function()
    {
        if (this.regions[this.countryEl.value]) {
//            if (!this.regionSelectEl) {
//                Element.insert(this.regionTextEl, {after : this.tpl.evaluate(this._regionSelectEl)});
//                this.regionSelectEl = $(this._regionSelectEl.id);
//            }
            if (this.lastCountryId != this.countryEl.value) {
                var i, option, region, def;

                def = this.regionSelectEl.getAttribute('defaultValue');
                if (this.regionTextEl) {
                    if (!def) {
                        def = this.regionTextEl.value.toLowerCase();
                    }
                    this.regionTextEl.value = '';
                }

                this.regionSelectEl.options.length = 1;
                for (regionId in this.regions[this.countryEl.value]) {
                    region = this.regions[this.countryEl.value][regionId];

                    option = document.createElement('OPTION');
                    option.value = regionId;
                    option.text = region.name.stripTags();
                    option.title = region.name;

                    if (this.regionSelectEl.options.add) {
                        this.regionSelectEl.options.add(option);
                    } else {
                        this.regionSelectEl.appendChild(option);
                    }

                    if (regionId == def || region.name.toLowerCase() == def || region.code.toLowerCase() == def) {
                        this.regionSelectEl.value = regionId;
                    }
                }
            }
            this.sortSelect();
            if (this.disableAction == 'hide') {
                if (this.regionTextEl) {
                    this.regionTextEl.style.display = 'none';
                    this.regionTextEl.style.disabled = true;
                }
                this.regionSelectEl.style.display = '';
                this.regionSelectEl.disabled = false;
            } else if (this.disableAction == 'disable') {
                if (this.regionTextEl) {
                    this.regionTextEl.disabled = true;
                }
                this.regionSelectEl.disabled = false;
            }
            this.setMarkDisplay(this.regionSelectEl, true);

            this.lastCountryId = this.countryEl.value;
        } else {
            this.sortSelect();
            if (this.disableAction == 'hide') {
                if (this.regionTextEl) {
                    this.regionTextEl.style.display = '';
                    this.regionTextEl.style.disabled = false;
                }
                this.regionSelectEl.style.display = 'none';
                this.regionSelectEl.disabled = true;
            } else if (this.disableAction == 'disable') {
                if (this.regionTextEl) {
                    this.regionTextEl.disabled = false;
                }
                this.regionSelectEl.disabled = true;
                if (this.clearRegionValueOnDisable) {
                    this.regionSelectEl.value = '';
                }
            } else if (this.disableAction == 'nullify') {
                this.regionSelectEl.options.length = 1;
                this.regionSelectEl.value = '';
                this.regionSelectEl.selectedIndex = 0;
                this.lastCountryId = '';
            }
            this.setMarkDisplay(this.regionSelectEl, false);

//            // clone required stuff from select element and then remove it
//            this._regionSelectEl.className = this.regionSelectEl.className;
//            this._regionSelectEl.name      = this.regionSelectEl.name;
//            this._regionSelectEl.id        = this.regionSelectEl.id;
//            this._regionSelectEl.innerHTML = this.regionSelectEl.innerHTML;
//            Element.remove(this.regionSelectEl);
//            this.regionSelectEl = null;
        }
        varienGlobalEvents.fireEvent("address_country_changed", this.countryEl);
        this._checkRegionRequired();
    },

    setMarkDisplay: function(elem, display){
        if(elem.parentNode.parentNode){
            var marks = Element.select(elem.parentNode.parentNode, '.required');
            if(marks[0]){
                display ? marks[0].show() : marks[0].hide();
            }
        }
    },
    sortSelect : function () {
        var elem = this.regionSelectEl;
        var tmpArray = new Array();
        var currentVal = $(elem).value;
        for (var i = 0; i < $(elem).options.length; i++) {
            if (i == 0) {
                continue;
            }
            tmpArray[i-1] = new Array();
            tmpArray[i-1][0] = $(elem).options[i].text;
            tmpArray[i-1][1] = $(elem).options[i].value;
        }
        tmpArray.sort();
        for (var i = 1; i <= tmpArray.length; i++) {
            var op = new Option(tmpArray[i-1][0], tmpArray[i-1][1]);
            $(elem).options[i] = op;
        }
        $(elem).value = currentVal;
        return;
    }
}

regionUpdater = RegionUpdater;

/**
 * Fix errorrs in IE
 */
Event.pointerX = function(event){
    try{
        return event.pageX || (event.clientX +(document.documentElement.scrollLeft || document.body.scrollLeft));
    }
    catch(e){

    }
}
Event.pointerY = function(event){
    try{
        return event.pageY || (event.clientY +(document.documentElement.scrollTop || document.body.scrollTop));
    }
    catch(e){

    }
}

SelectUpdater = Class.create();
SelectUpdater.prototype = {
    initialize: function (firstSelect, secondSelect, selectFirstMessage, noValuesMessage, values, selected)
    {
        this.first = $(firstSelect);
        this.second = $(secondSelect);
        this.message = selectFirstMessage;
        this.values = values;
        this.noMessage = noValuesMessage;
        this.selected = selected;

        this.update();

        Event.observe(this.first, 'change', this.update.bind(this));
    },

    update: function()
    {
        this.second.length = 0;
        this.second.value = '';

        if (this.first.value && this.values[this.first.value]) {
            for (optionValue in this.values[this.first.value]) {
                optionTitle = this.values[this.first.value][optionValue];

                this.addOption(this.second, optionValue, optionTitle);
            }
            this.second.disabled = false;
        } else if (this.first.value && !this.values[this.first.value]) {
            this.addOption(this.second, '', this.noMessage);
        } else {
            this.addOption(this.second, '', this.message);
            this.second.disabled = true;
        }
    },

    addOption: function(select, value, text)
    {
        option = document.createElement('OPTION');
        option.value = value;
        option.text = text;

        if (this.selected && option.value == this.selected) {
            option.selected = true;
            this.selected = false;
        }

        if (select.options.add) {
            select.options.add(option);
        } else {
            select.appendChild(option);
        }
    }
}


/**
 * Observer that watches for dependent form elements
 * If an element depends on 1 or more of other elements, it should show up only when all of them gain specified values
 */
FormElementDependenceController = Class.create();
FormElementDependenceController.prototype = {
    /**
     * Structure of elements: {
     *     'id_of_dependent_element' : {
     *         'id_of_master_element_1' : 'reference_value',
     *         'id_of_master_element_2' : 'reference_value'
     *         'id_of_master_element_3' : ['reference_value1', 'reference_value2']
     *         ...
     *     }
     * }
     * @param object elementsMap
     * @param object config
     */
    initialize : function (elementsMap, config)
    {
        if (config) {
            this._config = config;
        }
        for (var idTo in elementsMap) {
            for (var idFrom in elementsMap[idTo]) {
                if ($(idFrom)) {
                    Event.observe($(idFrom), 'change', this.trackChange.bindAsEventListener(this, idTo, elementsMap[idTo]));
                    this.trackChange(null, idTo, elementsMap[idTo]);
                } else {
                    this.trackChange(null, idTo, elementsMap[idTo]);
                }
            }
        }
    },

    /**
     * Misc. config options
     * Keys are underscored intentionally
     */
    _config : {
        levels_up : 1 // how many levels up to travel when toggling element
    },

    /**
     * Define whether target element should be toggled and show/hide its row
     *
     * @param object e - event
     * @param string idTo - id of target element
     * @param valuesFrom - ids of master elements and reference values
     * @return
     */
    trackChange : function(e, idTo, valuesFrom)
    {
        if (!$(idTo)) {
            return;
        }

        // define whether the target should show up
        var shouldShowUp = true;
        for (var idFrom in valuesFrom) {
            var from = $(idFrom);
            if (valuesFrom[idFrom] instanceof Array) {
                if (!from || valuesFrom[idFrom].indexOf(from.value) == -1) {
                    shouldShowUp = false;
                }
            } else {
                if (!from || from.value != valuesFrom[idFrom]) {
                    shouldShowUp = false;
                }
            }
        }

        // toggle target row
        if (shouldShowUp) {
            var currentConfig = this._config;
            $(idTo).up(this._config.levels_up).select('input', 'select', 'td').each(function (item) {
                // don't touch hidden inputs (and Use Default inputs too), bc they may have custom logic
                if ((!item.type || item.type != 'hidden') && !($(item.id+'_inherit') && $(item.id+'_inherit').checked)
                    && !(currentConfig.can_edit_price != undefined && !currentConfig.can_edit_price)) {
                    item.disabled = false;
                }
            });
            $(idTo).up(this._config.levels_up).show();
        } else {
            $(idTo).up(this._config.levels_up).select('input', 'select', 'td').each(function (item){
                // don't touch hidden inputs (and Use Default inputs too), bc they may have custom logic
                if ((!item.type || item.type != 'hidden') && !($(item.id+'_inherit') && $(item.id+'_inherit').checked)) {
                    item.disabled = true;
                }
            });
            $(idTo).up(this._config.levels_up).hide();
        }
    }
}

/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Mage
 * @package     Mage_Adminhtml
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */
var varienAccordion = new Class.create();
varienAccordion.prototype = {
    initialize : function(containerId, activeOnlyOne){
        this.containerId = containerId;
        this.activeOnlyOne = activeOnlyOne || false;
        this.container   = $(this.containerId);
        this.items       = $$('#'+this.containerId+' dt');
        this.loader      = new varienLoader(true);

        var links = $$('#'+this.containerId+' dt a');
        for(var i in links){
            if(links[i].href){
                Event.observe(links[i],'click',this.clickItem.bind(this));
                this.items[i].dd = this.items[i].next('dd');
                this.items[i].link = links[i];
            }
        }

        this.initFromCookie();
    },
    initFromCookie : function () {
        var activeItemId, visibility;
        if (this.activeOnlyOne &&
            (activeItemId = Cookie.read(this.cookiePrefix() + 'active-item')) !== null) {
            this.hideAllItems();
            this.showItem(this.getItemById(activeItemId));
        } else if(!this.activeOnlyOne) {
            this.items.each(function(item){
                if((visibility = Cookie.read(this.cookiePrefix() + item.id)) !== null) {
                    if(visibility == 0) {
                        this.hideItem(item);
                    } else {
                        this.showItem(item);
                    }
                }
            }.bind(this));
        }
    },
    cookiePrefix: function () {
        return 'accordion-' + this.containerId + '-';
    },
    getItemById : function (itemId) {
        var result = null;

        this.items.each(function(item){
            if (item.id == itemId) {
                result = item;
                throw $break;
            }
        });

        return result;
    },
    clickItem : function(event){
        var item = Event.findElement(event, 'dt');
        if(this.activeOnlyOne){
            this.hideAllItems();
            this.showItem(item);
            Cookie.write(this.cookiePrefix() + 'active-item', item.id, 30*24*60*60);
        }
        else{
            if(this.isItemVisible(item)){
                this.hideItem(item);
                Cookie.write(this.cookiePrefix() + item.id, 0, 30*24*60*60);
            }
            else {
                this.showItem(item);
                Cookie.write(this.cookiePrefix() + item.id, 1, 30*24*60*60);
            }
        }
        Event.stop(event);
    },
    showItem : function(item){
        if(item && item.link){
            if(item.link.href){
                this.loadContent(item);
            }

            Element.addClassName(item, 'open');
            Element.addClassName(item.dd, 'open');
        }
    },
    hideItem : function(item){
        Element.removeClassName(item, 'open');
        Element.removeClassName(item.dd, 'open');
    },
    isItemVisible : function(item){
        return Element.hasClassName(item, 'open');
    },
    loadContent : function(item){
        if(item.link.href.indexOf('#') == item.link.href.length-1){
            return;
        }
        if (Element.hasClassName(item.link, 'ajax')) {
            this.loadingItem = item;
            this.loader.load(item.link.href, {updaterId : this.loadingItem.dd.id}, this.setItemContent.bind(this));
            return;
        }
        location.href = item.link.href;
    },
    setItemContent : function(content){
        if (content.isJSON) {
            return;
        }
        this.loadingItem.dd.innerHTML = content;
    },
    hideAllItems : function(){
        for(var i in this.items){
            if(this.items[i].id){
                Element.removeClassName(this.items[i], 'open');
                Element.removeClassName(this.items[i].dd, 'open');
            }
        }
    }
}

/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Mage
 * @package     Mage_Adminhtml
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */
function setLocation(url){
    window.location.href = url;
}

function confirmSetLocation(message, url){
    if( confirm(message) ) {
        setLocation(url);
    }
    return false;
}

function deleteConfirm(message, url) {
    confirmSetLocation(message, url);
}

function setElementDisable(element, disable){
    if($(element)){
        $(element).disabled = disable;
    }
}

function toggleParentVis(obj) {
    obj = $(obj).parentNode;
    if( obj.style.display == 'none' ) {
        obj.style.display = '';
    } else {
        obj.style.display = 'none';
    }
}

// to fix new app/design/adminhtml/default/default/template/widget/form/renderer/fieldset.phtml
// with toggleParentVis
function toggleFieldsetVis(obj) {
    id = obj;
    obj = $(obj);
    if( obj.style.display == 'none' ) {
        obj.style.display = '';
    } else {
        obj.style.display = 'none';
    }
    obj = obj.parentNode.childElements();
    for (var i = 0; i < obj.length; i++) {
        if (obj[i].id != undefined
            && obj[i].id == id
            && obj[(i-1)].classNames() == 'entry-edit-head')
        {
            if (obj[i-1].style.display == 'none') {
                obj[i-1].style.display = '';
            } else {
                obj[i-1].style.display = 'none';
            }
        }
    }
}

function toggleVis(obj) {
    obj = $(obj);
    if( obj.style.display == 'none' ) {
        obj.style.display = '';
    } else {
        obj.style.display = 'none';
    }
}

function imagePreview(element){
    if($(element)){
        var win = window.open('', 'preview', 'width=400,height=400,resizable=1,scrollbars=1');
        win.document.open();
        win.document.write('<body style="padding:0;margin:0"><img src="'+$(element).src+'" id="image_preview"/></body>');
        win.document.close();
        Event.observe(win, 'load', function(){
            var img = win.document.getElementById('image_preview');
            win.resizeTo(img.width+40, img.height+80)
        });
    }
}

function checkByProductPriceType(elem) {
    if (elem.id == 'price_type') {
        this.productPriceType = elem.value;
        return false;
    } else {
        if (elem.id == 'price' && this.productPriceType == 0) {
            return false;
        }
        return true;
    }
}

Event.observe(window, 'load', function() {
    if ($('price_default') && $('price_default').checked) {
        $('price').disabled = 'disabled';
    }
});

function toggleValueElements(checkbox, container, excludedElements, checked){
    if(container && checkbox){
        var ignoredElements = [checkbox];
        if (typeof excludedElements != 'undefined') {
            if (Object.prototype.toString.call(excludedElements) != '[object Array]') {
                excludedElements = [excludedElements];
            }
            for (var i = 0; i < excludedElements.length; i++) {
                ignoredElements.push(excludedElements[i]);
            }
        }
        //var elems = container.select('select', 'input');
        var elems = Element.select(container, ['select', 'input', 'textarea', 'button', 'img']);
        var isDisabled = (checked != undefined ? checked : checkbox.checked);
        elems.each(function (elem) {
            if (checkByProductPriceType(elem)) {
                var i = ignoredElements.length;
                while (i-- && elem != ignoredElements[i]);
                if (i != -1) {
                    return;
                }

                elem.disabled = isDisabled;
                if (isDisabled) {
                    elem.addClassName('disabled');
                } else {
                    elem.removeClassName('disabled');
                }
                if (elem.nodeName.toLowerCase() == 'img') {
                    isDisabled ? elem.hide() : elem.show();
                }
            }
        });
    }
}

/**
 * @todo add validation for fields
 */
function submitAndReloadArea(area, url) {
    if($(area)) {
        var fields = $(area).select('input', 'select', 'textarea');
        var data = Form.serializeElements(fields, true);
        url = url + (url.match(new RegExp('\\?')) ? '&isAjax=true' : '?isAjax=true');
        new Ajax.Request(url, {
            parameters: $H(data),
            loaderArea: area,
            onSuccess: function(transport) {
                try {
                    if (transport.responseText.isJSON()) {
                        var response = transport.responseText.evalJSON()
                        if (response.error) {
                            alert(response.message);
                        }
                        if(response.ajaxExpired && response.ajaxRedirect) {
                            setLocation(response.ajaxRedirect);
                        }
                    } else {
                        $(area).update(transport.responseText);
                    }
                }
                catch (e) {
                    $(area).update(transport.responseText);
                }
            }
        });
    }
}

/********** MESSAGES ***********/
/*
Event.observe(window, 'load', function() {
    $$('.messages .error-msg').each(function(el) {
        new Effect.Highlight(el, {startcolor:'#E13422', endcolor:'#fdf9f8', duration:1});
    });
    $$('.messages .warning-msg').each(function(el) {
        new Effect.Highlight(el, {startcolor:'#E13422', endcolor:'#fdf9f8', duration:1});
    });
    $$('.messages .notice-msg').each(function(el) {
        new Effect.Highlight(el, {startcolor:'#E5B82C', endcolor:'#fbf7e9', duration:1});
    });
    $$('.messages .success-msg').each(function(el) {
        new Effect.Highlight(el, {startcolor:'#507477', endcolor:'#f2fafb', duration:1});
    });
});
*/
function syncOnchangeValue(baseElem, distElem){
    var compare = {baseElem:baseElem, distElem:distElem}
    Event.observe(baseElem, 'change', function(){
        if($(this.baseElem) && $(this.distElem)){
            $(this.distElem).value = $(this.baseElem).value;
        }
    }.bind(compare));
}

// Insert some content to the cursor position of input element
function updateElementAtCursor(el, value, win) {
    if (win == undefined) {
        win = window.self;
    }
    if (document.selection) {
        el.focus();
        sel = win.document.selection.createRange();
        sel.text = value;
    } else if (el.selectionStart || el.selectionStart == '0') {
        var startPos = el.selectionStart;
        var endPos = el.selectionEnd;
        el.value = el.value.substring(0, startPos) + value + el.value.substring(endPos, el.value.length);
    } else {
        el.value += value;
    }
}

// Firebug detection
function firebugEnabled() {
    if(window.console && window.console.firebug) {
        return true;
    }
    return false;
}

function disableElement(elem) {
    elem.disabled = true;
    elem.addClassName('disabled');
}

function enableElement(elem) {
    elem.disabled = false;
    elem.removeClassName('disabled');
}

function disableElements(search){
    $$('.' + search).each(disableElement);
}

function enableElements(search){
    $$('.' + search).each(enableElement);
}

/********** Toolbar toggle object to manage normal/floating toolbar toggle during vertical scroll ***********/
var toolbarToggle = {
    // Properties
    header: null, // Normal toolbar
    headerOffset: null, // Normal toolbar offset - calculated once
    headerCopy: null, // Floating toolbar
    eventsAdded: false, // We're listening to scroll/resize
    compatible: !navigator.appVersion.match('MSIE 6.'), // Whether object is compatible with browser (do not support old browsers, legacy code)

    // Inits object and pushes it into work. Can be used to init/reset(update) object by current DOM.
    reset: function () {
        // Maybe we are already using floating toolbar - just remove it to update from html
        if (this.headerCopy) {
            this.headerCopy.remove();
        }
        this.createToolbar();
        this.updateForScroll();
    },

    // Creates toolbar and inits all needed properties
    createToolbar: function () {
        if (!this.compatible) {
            return;
        }

        // Extract header that we will use as toolbar
        var headers = $$('.content-header');
        for (var i = headers.length - 1; i >= 0; i--) {
            if (!headers[i].hasClassName('skip-header')) {
                this.header = headers[i];
                break;
            }
        }
        if (!this.header) {
            return;
        }

        // Calculate header offset once - for optimization
        this.headerOffset = Element.cumulativeOffset(this.header)[1];

        // Toolbar buttons
        var buttons = $$('.content-buttons')[0];
        if (buttons) {
            // Wrap buttons with 'placeholder' div - to serve as container for buttons
            Element.insert(buttons, {before: '<div class="content-buttons-placeholder"></div>'});
            buttons.placeholder = buttons.previous('.content-buttons-placeholder');
            buttons.remove();
            buttons.placeholder.appendChild(buttons);

            this.headerOffset = Element.cumulativeOffset(buttons)[1];
        }

        // Create copy of header, that will serve as floating toolbar docked to top of window
        this.headerCopy = $(document.createElement('div'));
        this.headerCopy.appendChild(this.header.cloneNode(true));
        document.body.insertBefore(this.headerCopy, document.body.lastChild)
        this.headerCopy.addClassName('content-header-floating');

        // Remove duplicated buttons and their container
        var placeholder = this.headerCopy.down('.content-buttons-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
    },

    // Checks whether object properties are ready and valid
    ready: function () {
        // Return definitely boolean value
        return (this.compatible && this.header && this.headerCopy && this.headerCopy.parentNode) ? true : false;
    },

    // Updates toolbars for current scroll - shows/hides normal and floating toolbar
    updateForScroll: function () {
        if (!this.ready()) {
            return;
        }

        // scrolling offset calculation via www.quirksmode.org
        var s;
        if (self.pageYOffset){
            s = self.pageYOffset;
        } else if (document.documentElement && document.documentElement.scrollTop) {
            s = document.documentElement.scrollTop;
        } else if (document.body) {
            s = document.body.scrollTop;
        }

        // Show floating or normal toolbar
        if (s > this.headerOffset) {
            // Page offset is more than header offset, switch to floating toolbar
            this.showFloatingToolbar();
        } else {
            // Page offset is less than header offset, switch to normal toolbar
            this.showNormalToolbar();
        }
    },

    // Shows normal toolbar (and hides floating one)
    showNormalToolbar: function () {
        if (!this.ready()) {
            return;
        }

        var buttons = $$('.content-buttons')[0];
        if (buttons && buttons.oldParent && buttons.oldParent != buttons.parentNode) {
            buttons.remove();
            if(buttons.oldBefore) {
                buttons.oldParent.insertBefore(buttons, buttons.oldBefore);
            } else {
                buttons.oldParent.appendChild(buttons);
            }
        }

        this.headerCopy.style.display = 'none';
    },

    // Shows floating toolbar (and hides normal one)
    // Notice that buttons could had changed in html by setting new inner html,
    // so our added custom properties (placeholder, oldParent) can be not present in them any more
    showFloatingToolbar: function () {
        if (!this.ready()) {
            return;
        }

        var buttons = $$('.content-buttons')[0];

        if (buttons) {
            // Remember original parent in normal toolbar to which these buttons belong
            if (!buttons.oldParent) {
                buttons.oldParent = buttons.parentNode;
                buttons.oldBefore = buttons.previous();
            }

            // Move buttons from normal to floating toolbar
            if (buttons.oldParent == buttons.parentNode) {
                // Make static dimensions for placeholder, so it's not collapsed when buttons are removed
                if (buttons.placeholder) {
                    var dimensions = buttons.placeholder.getDimensions()
                    buttons.placeholder.style.width = dimensions.width + 'px';
                    buttons.placeholder.style.height = dimensions.height + 'px';
                }

                // Move to floating
                var target = this.headerCopy.down('div');
                if (target) {
                    buttons.hide();
                    buttons.remove();

                    target.appendChild(buttons);
                    buttons.show();
                }
            }
        }

        this.headerCopy.style.display = 'block';
    },

    // Starts object on window load
    startOnLoad: function () {
        if (!this.compatible) {
            return;
        }

        if (!this.funcOnWindowLoad) {
            this.funcOnWindowLoad = this.start.bind(this);
        }
        Event.observe(window, 'load', this.funcOnWindowLoad);
    },

    // Removes object start on window load
    removeOnLoad: function () {
        if (!this.funcOnWindowLoad) {
            return;
        }
        Event.stopObserving(window, 'load', this.funcOnWindowLoad);
    },

    // Starts object by creating toolbar and enabling scroll/resize events
    start: function () {
        if (!this.compatible) {
            return;
        }

        this.reset();
        this.startListening();
    },

    // Stops object by removing toolbar and stopping listening to events
    stop: function () {
        this.stopListening();
        this.removeOnLoad();
        this.showNormalToolbar();
    },

    // Addes events on scroll/resize
    startListening: function () {
        if (this.eventsAdded) {
            return;
        }

        if (!this.funcUpdateForViewport) {
            this.funcUpdateForViewport = this.updateForScroll.bind(this);
        }

        Event.observe(window, 'scroll', this.funcUpdateForViewport);
        Event.observe(window, 'resize', this.funcUpdateForViewport);

        this.eventsAdded = true;
    },

    // Removes listening to events on resize/update
    stopListening: function () {
        if (!this.eventsAdded) {
            return;
        }
        Event.stopObserving(window, 'scroll', this.funcUpdateForViewport);
        Event.stopObserving(window, 'resize', this.funcUpdateForViewport);

        this.eventsAdded = false;
    }
}

// Deprecated since 1.4.2.0-beta1 - use toolbarToggle.reset() instead
function updateTopButtonToolbarToggle()
{
    toolbarToggle.reset();
}

// Deprecated since 1.4.2.0-beta1 - use toolbarToggle.createToolbar() instead
function createTopButtonToolbarToggle()
{
    toolbarToggle.createToolbar();
}

// Deprecated since 1.4.2.0-beta1 - use toolbarToggle.updateForScroll() instead
function floatingTopButtonToolbarToggle()
{
    toolbarToggle.updateForScroll();
}

// Start toolbar on window load
toolbarToggle.startOnLoad();


/** Cookie Reading And Writing **/

var Cookie = {
    all: function() {
        var pairs = document.cookie.split(';');
        var cookies = {};
        pairs.each(function(item, index) {
            var pair = item.strip().split('=');
            cookies[unescape(pair[0])] = unescape(pair[1]);
        });

        return cookies;
    },
    read: function(cookieName) {
        var cookies = this.all();
        if(cookies[cookieName]) {
            return cookies[cookieName];
        }
        return null;
    },
    write: function(cookieName, cookieValue, cookieLifeTime) {
        var expires = '';
        if (cookieLifeTime) {
            var date = new Date();
            date.setTime(date.getTime()+(cookieLifeTime*1000));
            expires = '; expires='+date.toGMTString();
        }
        var urlPath = '/' + BASE_URL.split('/').slice(3).join('/'); // Get relative path
        document.cookie = escape(cookieName) + "=" + escape(cookieValue) + expires + "; path=" + urlPath;
    },
    clear: function(cookieName) {
        this.write(cookieName, '', -1);
    }
};

var Fieldset = {
    cookiePrefix: 'fh-',
    applyCollapse: function(containerId) {
        //var collapsed = Cookie.read(this.cookiePrefix + containerId);
        //if (collapsed !== null) {
        //    Cookie.clear(this.cookiePrefix + containerId);
        //}
        if ($(containerId + '-state')) {
            collapsed = $(containerId + '-state').value == 1 ? 0 : 1;
        } else {
            collapsed = $(containerId + '-head').collapsed;
        }
        if (collapsed==1 || collapsed===undefined) {
           $(containerId + '-head').removeClassName('open');
           if($(containerId + '-head').up('.section-config')) {
                $(containerId + '-head').up('.section-config').removeClassName('active');
           }
           $(containerId).hide();
        } else {
           $(containerId + '-head').addClassName('open');
           if($(containerId + '-head').up('.section-config')) {
                $(containerId + '-head').up('.section-config').addClassName('active');
           }
           $(containerId).show();
        }
    },
    toggleCollapse: function(containerId, saveThroughAjax) {
        if ($(containerId + '-state')) {
            collapsed = $(containerId + '-state').value == 1 ? 0 : 1;
        } else {
            collapsed = $(containerId + '-head').collapsed;
        }
        //Cookie.read(this.cookiePrefix + containerId);
        if(collapsed==1 || collapsed===undefined) {
            //Cookie.write(this.cookiePrefix + containerId,  0, 30*24*60*60);
            if ($(containerId + '-state')) {
                $(containerId + '-state').value = 1;
            }
            $(containerId + '-head').collapsed = 0;
        } else {
            //Cookie.clear(this.cookiePrefix + containerId);
            if ($(containerId + '-state')) {
                $(containerId + '-state').value = 0;
            }
            $(containerId + '-head').collapsed = 1;
        }

        this.applyCollapse(containerId);
        if (typeof saveThroughAjax != "undefined") {
            this.saveState(saveThroughAjax, {container: containerId, value: $(containerId + '-state').value});
        }
    },
    addToPrefix: function (value) {
        this.cookiePrefix += value + '-';
    },
    saveState: function(url, parameters) {
        new Ajax.Request(url, {
            method: 'get',
            parameters: Object.toQueryString(parameters),
            loaderArea: false
        });
    }
};

var Base64 = {
    // private property
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
     //'+/=', '-_,'
    // public method for encoding
    encode: function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output +
            this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
            this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        }

        return output;
    },

    // public method for decoding
    decode: function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
        }
        output = Base64._utf8_decode(output);
        return output;
    },

    mageEncode: function(input){
        return this.encode(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ',');
    },

    mageDecode: function(output){
        output = output.replace(/\-/g, '+').replace(/_/g, '/').replace(/,/g, '=');
        return this.decode(output);
    },

    idEncode: function(input){
        return this.encode(input).replace(/\+/g, ':').replace(/\//g, '_').replace(/=/g, '-');
    },

    idDecode: function(output){
        output = output.replace(/\-/g, '=').replace(/_/g, '/').replace(/\:/g, '\+');
        return this.decode(output);
    },

    // private method for UTF-8 encoding
    _utf8_encode : function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    },

    // private method for UTF-8 decoding
    _utf8_decode : function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while ( i < utftext.length ) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i+1);
                c3 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    }
};

/**
 * Array functions
 */

/**
 * Callback function for sort numeric values
 *
 * @param val1
 * @param val2
 */
function sortNumeric(val1, val2)
{
    return val1 - val2;
}

/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Mage
 * @package     Mage_Adminhtml
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */
/**
 * Convert a single file-input element into a 'multiple' input list
 *
 * Usage:
 *
 *   1. Create a file input element (no name)
 *      eg. <input type="file" id="first_file_element">
 *
 *   2. Create a DIV for the output to be written to
 *      eg. <div id="files_list"></div>
 *
 *   3. Instantiate a MultiSelector object, passing in the DIV and an (optional) maximum number of files
 *      eg. var multi_selector = new MultiSelector( document.getElementById( 'files_list' ), 3 );
 *
 *   4. Add the first element
 *      eg. multi_selector.addElement( document.getElementById( 'first_file_element' ) );
 *
 *   5. That's it.
 *
 *   You might (will) want to play around with the addListRow() method to make the output prettier.
 *
 *   You might also want to change the line
 *       element.name = 'file_' + this.count;
 *   ...to a naming convention that makes more sense to you.
 *
 */
function MultiSelector( list_target, field_name, max, new_element_html, delete_text, new_file_input ){

    // Where to write the list
    this.list_target = list_target;
    // Field name
    this.field_name = field_name;
    // How many elements?
    this.count = 0;
    // How many elements?
    this.id = 0;
    // Is there a maximum?
    if( max ){
        this.max = max;
    } else {
        this.max = -1;
    };
    this.new_element_html = new_element_html;
    this.delete_text = delete_text;
    this.new_file_input = new_file_input;

    /**
     * Add a new file input element
     */
    this.addElement = function( element ){

        // Make sure it's a file input element
        if( element.tagName == 'INPUT' && element.type == 'file' ){

            // Element name -- what number am I?
            // element.name = 'file_' + this.id++;
            this.id++;
            element.name = this.field_name + '[]';

            // Add reference to this object
            element.multi_selector = this;

            // What to do when a file is selected
            element.onchange = function(){

                // New file input
                var new_element = document.createElement( 'input' );
                new_element.type = 'file';

                // Add new element
                this.parentNode.insertBefore( new_element, this );

                // Apply 'update' to element
                this.multi_selector.addElement( new_element );

                // Update list
                this.multi_selector.addListRow( this );

                // Hide this: we can't use display:none because Safari doesn't like it
                this.style.position = 'absolute';
                this.style.left = '-1000px';

            };
            // If we've reached maximum number, disable input element
            if( this.max != -1 && this.count >= this.max ){
                element.disabled = true;
            };

            // File element counter
            this.count++;
            // Most recent element
            this.current_element = element;

        } else {
            // This can only be applied to file input elements!
            alert( 'Error: not a file input element' );
        };

    };

    /**
     * Add a new row to the list of files
     */
    this.addListRow = function( element ){

/*
        // Row div
        var new_row = document.createElement( 'div' );
*/

        // Sort order input
        var new_row_input = document.createElement( 'input' );
        new_row_input.type = 'text';
        new_row_input.name = 'general[position_new][]';
        new_row_input.size = '3';
        new_row_input.value = '0';

        // Delete button
        var new_row_button = document.createElement( 'input' );
        new_row_button.type = 'checkbox';
        new_row_button.value = 'Delete';

        var new_row_span = document.createElement( 'span' );
        new_row_span.innerHTML = this.delete_text;

        table = this.list_target;

        // no of rows in the table:
        noOfRows = table.rows.length;

        // no of columns in the pre-last row:
        noOfCols = table.rows[noOfRows-2].cells.length;

        // insert row at pre-last:
        var x=table.insertRow(noOfRows-1);

        // insert cells in row.
        for (var j = 0; j < noOfCols; j++) {

            newCell = x.insertCell(j);
            newCell.align = "center";
            newCell.valign = "middle";

//            if (j==0) {
//                newCell.innerHTML = this.new_element_html.replace(/%file%/g, element.value).replace(/%id%/g, this.id).replace(/%j%/g, j)
//                    + this.new_file_input.replace(/%file%/g, element.value).replace(/%id%/g, this.id).replace(/%j%/g, j);
//            }
            if (j==3) {
                newCell.appendChild( new_row_input );
            }
            else if (j==4) {
                newCell.appendChild( new_row_button );
            }
            else {
//                newCell.innerHTML = this.new_file_input.replace(/%file%/g, element.value).replace(/%id%/g, this.id).replace(/%j%/g, j);
                newCell.innerHTML = this.new_file_input.replace(/%id%/g, this.id).replace(/%j%/g, j);
            }

//            newCell.innerHTML="NEW CELL" + j;

        }

        // References
//		new_row.element = element;

        // Delete function
        new_row_button.onclick= function(){

            // Remove element from form
            this.parentNode.element.parentNode.removeChild( this.parentNode.element );

            // Remove this row from the list
            this.parentNode.parentNode.removeChild( this.parentNode );

            // Decrement counter
            this.parentNode.element.multi_selector.count--;

            // Re-enable input element (if it's disabled)
            this.parentNode.element.multi_selector.current_element.disabled = false;

            // Appease Safari
            //    without it Safari wants to reload the browser window
            //    which nixes your already queued uploads
            return false;
        };

        // Set row value
//		new_row.innerHTML = this.new_element_html.replace(/%file%/g, element.value).replace(/%id%/g, this.id);

        // Add button
//		new_row.appendChild( new_row_button );
//		new_row.appendChild( new_row_span );

        // Add it to the list
//		this.list_target.appendChild( new_row );

    };

    // Insert row into table.
    this.insRowLast = function ( table ){

        // noOfRpws in table.
        noOfRows = table.rows.length;
        // no of columns of last row.
        noOfCols = table.rows[noOfRows-1].cells.length;

        // insert row at last.
        var x=table.insertRow(noOfRows);

        // insert cells in row.
        for (var j = 0; j < noOfCols; j++) {
            newCell = x.insertCell(j);
            newCell.innerHTML="NEW CELL" + j;
        }

    };

    //delete row
    this.deleteRow = function ( table, row ){

        table.deleteRow(row);

    };

    //delete last row
    this.deleteRow = function ( table ){

        noOfRows = table.rows.length;
        table.deleteRow(noOfRows-1);

    };


};

/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Mage
 * @package     Mage_Adminhtml
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */

var Product = {};

Product.Gallery = Class.create();
Product.Gallery.prototype = {
    images : [],
    file2id : {
        'no_selection' :0
    },
    idIncrement :1,
    containerId :'',
    container :null,
    uploader :null,
    imageTypes : {},
    initialize : function(containerId, uploader, imageTypes) {
        this.containerId = containerId, this.container = $(this.containerId);
        this.uploader = uploader;
        this.imageTypes = imageTypes;
        if (this.uploader) {
            this.uploader.onFilesComplete = this.handleUploadComplete
                    .bind(this);
        }
        // this.uploader.onFileProgress = this.handleUploadProgress.bind(this);
        // this.uploader.onFileError = this.handleUploadError.bind(this);
        this.images = this.getElement('save').value.evalJSON();
        this.imagesValues = this.getElement('save_image').value.evalJSON();
        this.template = new Template('<tr id="__id__" class="preview">' + this
                .getElement('template').innerHTML + '</tr>', new RegExp(
                '(^|.|\\r|\\n)(__([a-zA-Z0-9_]+)__)', ''));
        this.fixParentTable();
        this.updateImages();
        varienGlobalEvents.attachEventHandler('moveTab', this.onImageTabMove
                .bind(this));
    },
    onImageTabMove : function(event) {
        var imagesTab = false;
        this.container.ancestors().each( function(parentItem) {
            if (parentItem.tabObject) {
                imagesTab = parentItem.tabObject;
                throw $break;
            }
        }.bind(this));

        if (imagesTab && event.tab && event.tab.name && imagesTab.name == event.tab.name) {
            this.container.select('input[type="radio"]').each(function(radio) {
                radio.observe('change', this.onChangeRadio);
            }.bind(this));
            this.updateImages();
        }

    },
    fixParentTable : function() {
        this.container.ancestors().each( function(parentItem) {
            if (parentItem.tagName.toLowerCase() == 'td') {
                parentItem.style.width = '100%';
            }
            if (parentItem.tagName.toLowerCase() == 'table') {
                parentItem.style.width = '100%';
                throw $break;
            }
        });
    },
    getElement : function(name) {
        return $(this.containerId + '_' + name);
    },
    showUploader : function() {
        this.getElement('add_images_button').hide();
        this.getElement('uploader').show();
    },
    handleUploadComplete : function(files) {
        files.each( function(item) {
            if (!item.response.isJSON()) {
                try {
                    console.log(item.response);
                } catch (e2) {
                    alert(item.response);
                }
                return;
            }
            var response = item.response.evalJSON();
            if (response.error) {
                return;
            }
            var newImage = {};
            newImage.url = response.url;
            newImage.file = response.file;
            newImage.label = '';
            newImage.position = this.getNextPosition();
            newImage.disabled = 0;
            newImage.removed = 0;
            this.images.push(newImage);
            this.uploader.removeFile(item.id);
        }.bind(this));
        this.container.setHasChanges();
        this.updateImages();
    },
    updateImages : function() {
        this.getElement('save').value = Object.toJSON(this.images);
        $H(this.imageTypes).each(
                function(pair) {
                    this.getFileElement('no_selection',
                            'cell-' + pair.key + ' input').checked = true;
                }.bind(this));
        this.images.each( function(row) {
            if (!$(this.prepareId(row.file))) {
                this.createImageRow(row);
            }
            this.updateVisualisation(row.file);
        }.bind(this));
        this.updateUseDefault(false);
    },
    onChangeRadio: function (evt) {
        var element = Event.element(evt);
        element.setHasChanges();
    },
    createImageRow : function(image) {
        var vars = Object.clone(image);
        vars.id = this.prepareId(image.file);
        var html = this.template.evaluate(vars);
        Element.insert(this.getElement('list'), {
            bottom :html
        });

        $(vars.id).select('input[type="radio"]').each(function(radio) {
            radio.observe('change', this.onChangeRadio);
        }.bind(this));
    },
    prepareId : function(file) {
        if (typeof this.file2id[file] == 'undefined') {
            this.file2id[file] = this.idIncrement++;
        }
        return this.containerId + '-image-' + this.file2id[file];
    },
    getNextPosition : function() {
        var maxPosition = 0;
        this.images.each( function(item) {
            if (parseInt(item.position) > maxPosition) {
                maxPosition = parseInt(item.position);
            }
        });
        return maxPosition + 1;
    },
    updateImage : function(file) {
        var index = this.getIndexByFile(file);
        this.images[index].label = this
                .getFileElement(file, 'cell-label input').value;
        this.images[index].position = this.getFileElement(file,
                'cell-position input').value;
        this.images[index].removed = (this.getFileElement(file,
                'cell-remove input').checked ? 1 : 0);
        this.images[index].disabled = (this.getFileElement(file,
                'cell-disable input').checked ? 1 : 0);
        this.getElement('save').value = Object.toJSON(this.images);
        this.updateState(file);
        this.container.setHasChanges();
    },
    loadImage : function(file) {
        var image = this.getImageByFile(file);
        this.getFileElement(file, 'cell-image img').src = image.url;
        this.getFileElement(file, 'cell-image img').show();
        this.getFileElement(file, 'cell-image .place-holder').hide();
    },
    setProductImages : function(file) {
        $H(this.imageTypes)
                .each(
                        function(pair) {
                            if (this.getFileElement(file,
                                    'cell-' + pair.key + ' input').checked) {
                                this.imagesValues[pair.key] = (file == 'no_selection' ? null
                                        : file);
                            }
                        }.bind(this));

        this.getElement('save_image').value = Object.toJSON($H(this.imagesValues));
    },
    updateVisualisation : function(file) {
        var image = this.getImageByFile(file);
        this.getFileElement(file, 'cell-label input').value = image.label;
        this.getFileElement(file, 'cell-position input').value = image.position;
        this.getFileElement(file, 'cell-remove input').checked = (image.removed == 1);
        this.getFileElement(file, 'cell-disable input').checked = (image.disabled == 1);
        $H(this.imageTypes)
                .each(
                        function(pair) {
                            if (this.imagesValues[pair.key] == file) {
                                this.getFileElement(file,
                                        'cell-' + pair.key + ' input').checked = true;
                            }
                        }.bind(this));
        this.updateState(file);
    },
    updateState : function(file) {
        if (this.getFileElement(file, 'cell-disable input').checked) {
            this.getFileElement(file, 'cell-position input').disabled = true;
        } else {
            this.getFileElement(file, 'cell-position input').disabled = false;
        }
    },
    getFileElement : function(file, element) {
        var selector = '#' + this.prepareId(file) + ' .' + element;
        var elems = $$(selector);
        if (!elems[0]) {
            try {
                console.log(selector);
            } catch (e2) {
                alert(selector);
            }
        }

        return $$('#' + this.prepareId(file) + ' .' + element)[0];
    },
    getImageByFile : function(file) {
        if (this.getIndexByFile(file) === null) {
            return false;
        }

        return this.images[this.getIndexByFile(file)];
    },
    getIndexByFile : function(file) {
        var index;
        this.images.each( function(item, i) {
            if (item.file == file) {
                index = i;
            }
        });
        return index;
    },
    updateUseDefault : function() {
        if (this.getElement('default')) {
            this.getElement('default').select('input').each(
                    function(input) {
                        $(this.containerId).select(
                                '.cell-' + input.value + ' input').each(
                                function(radio) {
                                    radio.disabled = input.checked;
                                });
                    }.bind(this));
        }

        if (arguments.length == 0) {
            this.container.setHasChanges();
        }
    },
    handleUploadProgress : function(file) {

    },
    handleUploadError : function(fileId) {

    }
};

Product.AttributesBridge = {
    tabsObject :false,
    bindTabs2Attributes : {},
    bind : function(tabId, attributesObject) {
        this.bindTabs2Attributes[tabId] = attributesObject;
    },
    getAttributes : function(tabId) {
        return this.bindTabs2Attributes[tabId];
    },
    setTabsObject : function(tabs) {
        this.tabsObject = tabs;
    },
    getTabsObject : function() {
        return this.tabsObject;
    },
    addAttributeRow : function(data) {
        $H(data).each( function(item) {
            if (this.getTabsObject().activeTab.name != item.key) {
                this.getTabsObject().showTabContent($(item.key));
            }
            this.getAttributes(item.key).addRow(item.value);
        }.bind(this));
    }
};

Product.Attributes = Class.create();
Product.Attributes.prototype = {
    config : {},
    containerId :null,
    initialize : function(containerId) {
        this.containerId = containerId;
    },
    setConfig : function(config) {
        this.config = config;
        Product.AttributesBridge.bind(this.getConfig().tab_id, this);
    },
    getConfig : function() {
        return this.config;
    },
    create : function() {
        var win = window.open(this.getConfig().url, 'new_attribute',
                'width=900,height=600,resizable=1,scrollbars=1');
        win.focus();
    },
    addRow : function(html) {
        var attributesContainer = $$('#group_fields' + this.getConfig().group_id + ' .form-list tbody')[0];
        Element.insert(attributesContainer, {
            bottom :html
        });

        var childs = attributesContainer.childElements();
        var element = childs[childs.size() - 1].select('input', 'select',
                'textarea')[0];
        if (element) {
            window.scrollTo(0, Position.cumulativeOffset(element)[1]
                    + element.offsetHeight);
        }
    }
};

Product.Configurable = Class.create();
Product.Configurable.prototype = {
    initialize : function(attributes, links, idPrefix, grid, readonly) {
        this.templatesSyntax = new RegExp(
                '(^|.|\\r|\\n)(\'{{\\s*(\\w+)\\s*}}\')', "");
        this.attributes = attributes; // Attributes
        this.idPrefix = idPrefix; // Container id prefix
        this.links = $H(links); // Associated products
        this.newProducts = []; // For product that's created through Create
                                // Empty and Copy from Configurable
        this.readonly = readonly;

        /* Generation templates */
        this.addAttributeTemplate = new Template(
                $(idPrefix + 'attribute_template').innerHTML.replace(/__id__/g,
                        "'{{html_id}}'").replace(/ template no-display/g, ''),
                this.templatesSyntax);
        this.addValueTemplate = new Template(
                $(idPrefix + 'value_template').innerHTML.replace(/__id__/g,
                        "'{{html_id}}'").replace(/ template no-display/g, ''),
                this.templatesSyntax);
        this.pricingValueTemplate = new Template(
                $(idPrefix + 'simple_pricing').innerHTML, this.templatesSyntax);
        this.pricingValueViewTemplate = new Template(
                $(idPrefix + 'simple_pricing_view').innerHTML,
                this.templatesSyntax);

        this.container = $(idPrefix + 'attributes');

        /* Listeners */
        this.onLabelUpdate = this.updateLabel.bindAsEventListener(this); // Update
                                                                            // attribute
                                                                            // label
        this.onValuePriceUpdate = this.updateValuePrice
                .bindAsEventListener(this); // Update pricing value
        this.onValueTypeUpdate = this.updateValueType.bindAsEventListener(this); // Update
                                                                                    // pricing
                                                                                    // type
        this.onValueDefaultUpdate = this.updateValueUseDefault
                .bindAsEventListener(this);

        /* Grid initialization and attributes initialization */
        this.createAttributes(); // Creation of default attributes

        this.grid = grid;
        this.grid.rowClickCallback = this.rowClick.bind(this);
        this.grid.initRowCallback = this.rowInit.bind(this);
        this.grid.checkboxCheckCallback = this.registerProduct.bind(this); // Associate/Unassociate
                                                                            // simple
                                                                            // product

        this.grid.rows.each( function(row) {
            this.rowInit(this.grid, row);
        }.bind(this));
    },
    createAttributes : function() {
        this.attributes.each( function(attribute, index) {
            // var li = Builder.node('li', {className:'attribute'});
                var li = $(document.createElement('LI'));
                li.className = 'attribute';

                li.id = this.idPrefix + '_attribute_' + index;
                attribute.html_id = li.id;
                if (attribute && attribute.label && attribute.label.blank()) {
                    attribute.label = '&nbsp;'
                }
                var label_readonly = '';
                var use_default_checked = '';
                if (attribute.use_default == '1') {
                    use_default_checked = ' checked="checked"';
                    label_readonly = ' readonly="readonly"';
                }

                var template = this.addAttributeTemplate.evaluate(attribute);
                template = template.replace(
                        new RegExp(' readonly="label"', 'ig'), label_readonly);
                template = template.replace(new RegExp(
                        ' checked="use_default"', 'ig'), use_default_checked);
                li.update(template);
                li.attributeObject = attribute;

                this.container.appendChild(li);
                li.attributeValues = li.down('.attribute-values');

                if (attribute.values) {
                    attribute.values.each( function(value) {
                        this.createValueRow(li, value); // Add pricing values
                        }.bind(this));
                }

                /* Observe label change */
                Event.observe(li.down('.attribute-label'), 'change',
                        this.onLabelUpdate);
                Event.observe(li.down('.attribute-label'), 'keyup',
                        this.onLabelUpdate);
                Event.observe(li.down('.attribute-use-default-label'),
                        'change', this.onLabelUpdate);
            }.bind(this));
        if (!this.readonly) {
            // Creation of sortable for attributes sorting
            Sortable.create(this.container, {
                handle :'attribute-name-container',
                onUpdate :this.updatePositions.bind(this)
            });
        }
        this.updateSaveInput();
    },

    updateLabel : function(event) {
        var li = Event.findElement(event, 'LI');
        var labelEl = li.down('.attribute-label');
        var defEl = li.down('.attribute-use-default-label');

        li.attributeObject.label = labelEl.value;
        if (defEl.checked) {
            labelEl.readOnly = true;
            li.attributeObject.use_default = 1;
        } else {
            labelEl.readOnly = false;
            li.attributeObject.use_default = 0;
        }

        this.updateSaveInput();
    },
    updatePositions : function(param) {
        this.container.childElements().each( function(row, index) {
            row.attributeObject.position = index;
        });
        this.updateSaveInput();
    },
    addNewProduct : function(productId, attributes) {
        if (this.checkAttributes(attributes)) {
            this.links.set(productId, this.cloneAttributes(attributes));
        } else {
            this.newProducts.push(productId);
        }

        this.updateGrid();
        this.updateValues();
        this.grid.reload(null);
    },
    createEmptyProduct : function() {
        this.createPopup(this.createEmptyUrl)
    },
    createNewProduct : function() {
        this.createPopup(this.createNormalUrl);
    },
    createPopup : function(url) {
        if (this.win && !this.win.closed) {
            this.win.close();
        }

        this.win = window.open(url, '',
                'width=1000,height=700,resizable=1,scrollbars=1');
        this.win.focus();
    },
    registerProduct : function(grid, element, checked) {
        if (checked) {
            if (element.linkAttributes) {
                this.links.set(element.value, element.linkAttributes);
            }
        } else {
            this.links.unset(element.value);
        }
        this.updateGrid();
        this.grid.rows.each( function(row) {
            this.revalidateRow(this.grid, row);
        }.bind(this));
        this.updateValues();
    },
    updateProduct : function(productId, attributes) {
        var isAssociated = false;

        if (typeof this.links.get(productId) != 'undefined') {
            isAssociated = true;
            this.links.unset(productId);
        }

        if (isAssociated && this.checkAttributes(attributes)) {
            this.links.set(productId, this.cloneAttributes(attributes));
        } else if (isAssociated) {
            this.newProducts.push(productId);
        }

        this.updateGrid();
        this.updateValues();
        this.grid.reload(null);
    },
    cloneAttributes : function(attributes) {
        var newObj = [];
        for ( var i = 0, length = attributes.length; i < length; i++) {
            newObj[i] = Object.clone(attributes[i]);
        }
        return newObj;
    },
    rowClick : function(grid, event) {
        var trElement = Event.findElement(event, 'tr');
        var isInput = Event.element(event).tagName.toUpperCase() == 'INPUT';

        if ($(Event.findElement(event, 'td')).down('a')) {
            return;
        }

        if (trElement) {
            var checkbox = $(trElement).down('input');
            if (checkbox && !checkbox.disabled) {
                var checked = isInput ? checkbox.checked : !checkbox.checked;
                grid.setCheckboxChecked(checkbox, checked);
            }
        }
    },
    rowInit : function(grid, row) {
        var checkbox = $(row).down('.checkbox');
        var input = $(row).down('.value-json');
        if (checkbox && input) {
            checkbox.linkAttributes = input.value.evalJSON();
            if (!checkbox.checked) {
                if (!this.checkAttributes(checkbox.linkAttributes)) {
                    $(row).addClassName('invalid');
                    checkbox.disable();
                } else {
                    $(row).removeClassName('invalid');
                    checkbox.enable();
                }
            }
        }
    },
    revalidateRow : function(grid, row) {
        var checkbox = $(row).down('.checkbox');
        if (checkbox) {
            if (!checkbox.checked) {
                if (!this.checkAttributes(checkbox.linkAttributes)) {
                    $(row).addClassName('invalid');
                    checkbox.disable();
                } else {
                    $(row).removeClassName('invalid');
                    checkbox.enable();
                }
            }
        }
    },
    checkAttributes : function(attributes) {
        var result = true;
        this.links
                .each( function(pair) {
                    var fail = false;
                    for ( var i = 0; i < pair.value.length && !fail; i++) {
                        for ( var j = 0; j < attributes.length && !fail; j++) {
                            if (pair.value[i].attribute_id == attributes[j].attribute_id
                                    && pair.value[i].value_index != attributes[j].value_index) {
                                fail = true;
                            }
                        }
                    }
                    if (!fail) {
                        result = false;
                    }
                });
        return result;
    },
    updateGrid : function() {
        this.grid.reloadParams = {
            'products[]' :this.links.keys().size() ? this.links.keys() : [ 0 ],
            'new_products[]' :this.newProducts
        };
    },
    updateValues : function() {
        var uniqueAttributeValues = $H( {});
        /* Collect unique attributes */
        this.links.each( function(pair) {
            for ( var i = 0, length = pair.value.length; i < length; i++) {
                var attribute = pair.value[i];
                if (uniqueAttributeValues.keys()
                        .indexOf(attribute.attribute_id) == -1) {
                    uniqueAttributeValues.set(attribute.attribute_id, $H( {}));
                }
                uniqueAttributeValues.get(attribute.attribute_id).set(
                        attribute.value_index, attribute);
            }
        });
        /* Updating attributes value container */
        this.container
                .childElements()
                .each(
                        function(row) {
                            var attribute = row.attributeObject;
                            for ( var i = 0, length = attribute.values.length; i < length; i++) {
                                if (uniqueAttributeValues.keys().indexOf(
                                        attribute.attribute_id) == -1
                                        || uniqueAttributeValues
                                                .get(attribute.attribute_id)
                                                .keys()
                                                .indexOf(
                                                        attribute.values[i].value_index) == -1) {
                                    row.attributeValues
                                            .childElements()
                                            .each(
                                                    function(elem) {
                                                        if (elem.valueObject.value_index == attribute.values[i].value_index) {
                                                            elem.remove();
                                                        }
                                                    });
                                    attribute.values[i] = undefined;

                                } else {
                                    uniqueAttributeValues.get(
                                            attribute.attribute_id).unset(
                                            attribute.values[i].value_index);
                                }
                            }
                            attribute.values = attribute.values.compact();
                            if (uniqueAttributeValues
                                    .get(attribute.attribute_id)) {
                                uniqueAttributeValues.get(
                                        attribute.attribute_id).each(
                                        function(pair) {
                                            attribute.values.push(pair.value);
                                            this
                                                    .createValueRow(row,
                                                            pair.value);
                                        }.bind(this));
                            }
                        }.bind(this));
        this.updateSaveInput();
        this.updateSimpleForm();
    },
    createValueRow : function(container, value) {
        var templateVariables = $H( {});
        if (!this.valueAutoIndex) {
            this.valueAutoIndex = 1;
        }
        templateVariables.set('html_id', container.id + '_'
                + this.valueAutoIndex);
        templateVariables.update(value);
        var pricingValue = parseFloat(templateVariables.get('pricing_value'));
        if (!isNaN(pricingValue)) {
            templateVariables.set('pricing_value', pricingValue);
        } else {
            templateVariables.unset('pricing_value');
        }
        this.valueAutoIndex++;

        // var li = $(Builder.node('li', {className:'attribute-value'}));
        var li = $(document.createElement('LI'));
        li.className = 'attribute-value';
        li.id = templateVariables.get('html_id');
        li.update(this.addValueTemplate.evaluate(templateVariables));
        li.valueObject = value;
        if (typeof li.valueObject.is_percent == 'undefined') {
            li.valueObject.is_percent = 0;
        }

        if (typeof li.valueObject.pricing_value == 'undefined') {
            li.valueObject.pricing_value = '';
        }

        container.attributeValues.appendChild(li);

        var priceField = li.down('.attribute-price');
        var priceTypeField = li.down('.attribute-price-type');

        if (priceTypeField != undefined && priceTypeField.options != undefined) {
            if (parseInt(value.is_percent)) {
                priceTypeField.options[1].selected = !(priceTypeField.options[0].selected = false);
            } else {
                priceTypeField.options[1].selected = !(priceTypeField.options[0].selected = true);
            }
        }

        Event.observe(priceField, 'keyup', this.onValuePriceUpdate);
        Event.observe(priceField, 'change', this.onValuePriceUpdate);
        Event.observe(priceTypeField, 'change', this.onValueTypeUpdate);
        var useDefaultEl = li.down('.attribute-use-default-value');
        if (useDefaultEl) {
            if (li.valueObject.use_default_value) {
                useDefaultEl.checked = true;
                this.updateUseDefaultRow(useDefaultEl, li);
            }
            Event.observe(useDefaultEl, 'change', this.onValueDefaultUpdate);
        }
    },
    updateValuePrice : function(event) {
        var li = Event.findElement(event, 'LI');
        li.valueObject.pricing_value = (Event.element(event).value.blank() ? null
                : Event.element(event).value);
        this.updateSimpleForm();
        this.updateSaveInput();
    },
    updateValueType : function(event) {
        var li = Event.findElement(event, 'LI');
        li.valueObject.is_percent = (Event.element(event).value.blank() ? null
                : Event.element(event).value);
        this.updateSimpleForm();
        this.updateSaveInput();
    },
    updateValueUseDefault : function(event) {
        var li = Event.findElement(event, 'LI');
        var useDefaultEl = Event.element(event);
        li.valueObject.use_default_value = useDefaultEl.checked;
        this.updateUseDefaultRow(useDefaultEl, li);
    },
    updateUseDefaultRow : function(useDefaultEl, li) {
        var priceField = li.down('.attribute-price');
        var priceTypeField = li.down('.attribute-price-type');
        if (useDefaultEl.checked) {
            priceField.disabled = true;
            priceTypeField.disabled = true;
        } else {
            priceField.disabled = false;
            priceTypeField.disabled = false;
        }
        this.updateSimpleForm();
        this.updateSaveInput();
    },
    updateSaveInput : function() {
        $(this.idPrefix + 'save_attributes').value = Object.toJSON(this.attributes);
        $(this.idPrefix + 'save_links').value = Object.toJSON(this.links);
    },
    initializeAdvicesForSimpleForm : function() {
        if ($(this.idPrefix + 'simple_form').advicesInited) {
            return;
        }

        $(this.idPrefix + 'simple_form').select('td.value').each( function(td) {
            var adviceContainer = $(Builder.node('div'));
            td.appendChild(adviceContainer);
            td.select('input', 'select').each( function(element) {
                element.advaiceContainer = adviceContainer;
            });
        });
        $(this.idPrefix + 'simple_form').advicesInited = true;
    },
    quickCreateNewProduct : function() {
        this.initializeAdvicesForSimpleForm();
        $(this.idPrefix + 'simple_form').removeClassName('ignore-validate');
        var validationResult = $(this.idPrefix + 'simple_form').select('input',
                'select', 'textarea').collect( function(elm) {
            return Validation.validate(elm, {
                useTitle :false,
                onElementValidate : function() {
                }
            });
        }).all();
        $(this.idPrefix + 'simple_form').addClassName('ignore-validate');

        if (!validationResult) {
            return;
        }

        var params = Form.serializeElements($(this.idPrefix + 'simple_form')
                .select('input', 'select', 'textarea'), true);
        params.form_key = FORM_KEY;
        $('messages').update();
        new Ajax.Request(this.createQuickUrl, {
            parameters :params,
            method :'post',
            area :$(this.idPrefix + 'simple_form'),
            onComplete :this.quickCreateNewProductComplete.bind(this)
        });
    },
    quickCreateNewProductComplete : function(transport) {
        var result = transport.responseText.evalJSON();

        if (result.error) {
            if (result.error.fields) {
                $(this.idPrefix + 'simple_form').removeClassName(
                        'ignore-validate');
                $H(result.error.fields)
                        .each(
                                function(pair) {
                                    $('simple_product_' + pair.key).value = pair.value;
                                    $('simple_product_' + pair.key + '_autogenerate').checked = false;
                                    toggleValueElements(
                                            $('simple_product_' + pair.key + '_autogenerate'),
                                            $('simple_product_' + pair.key + '_autogenerate').parentNode);
                                    Validation.ajaxError(
                                            $('simple_product_' + pair.key),
                                            result.error.message);
                                });
                $(this.idPrefix + 'simple_form')
                        .addClassName('ignore-validate');
            } else {
                if (result.error.message) {
                    alert(result.error.message);
                } else {
                    alert(result.error);
                }
            }
            return;
        } else if (result.messages) {
            $('messages').update(result.messages);
        }

        result.attributes
                .each( function(attribute) {
                    var attr = this.getAttributeById(attribute.attribute_id);
                    if (!this.getValueByIndex(attr, attribute.value_index)
                            && result.pricing
                            && result.pricing[attr.attribute_code]) {

                        attribute.is_percent = result.pricing[attr.attribute_code].is_percent;
                        attribute.pricing_value = (result.pricing[attr.attribute_code].value == null ? ''
                                : result.pricing[attr.attribute_code].value);
                    }
                }.bind(this));

        this.attributes.each( function(attribute) {
            if ($('simple_product_' + attribute.attribute_code)) {
                $('simple_product_' + attribute.attribute_code).value = '';
            }
        }.bind(this));

        this.links.set(result.product_id, result.attributes);
        this.updateGrid();
        this.updateValues();
        this.grid.reload();
    },
    checkCreationUniqueAttributes : function() {
        var attributes = [];
        this.attributes
                .each( function(attribute) {
                    attributes
                            .push( {
                                attribute_id :attribute.attribute_id,
                                value_index :$('simple_product_' + attribute.attribute_code).value
                            });
                }.bind(this));

        return this.checkAttributes(attributes);
    },
    getAttributeByCode : function(attributeCode) {
        var attribute = null;
        this.attributes.each( function(item) {
            if (item.attribute_code == attributeCode) {
                attribute = item;
                throw $break;
            }
        });
        return attribute;
    },
    getAttributeById : function(attributeId) {
        var attribute = null;
        this.attributes.each( function(item) {
            if (item.attribute_id == attributeId) {
                attribute = item;
                throw $break;
            }
        });
        return attribute;
    },
    getValueByIndex : function(attribute, valueIndex) {
        var result = null;
        attribute.values.each( function(value) {
            if (value.value_index == valueIndex) {
                result = value;
                throw $break;
            }
        });
        return result;
    },
    showPricing : function(select, attributeCode) {
        var attribute = this.getAttributeByCode(attributeCode);
        if (!attribute) {
            return;
        }

        select = $(select);
        if (select.value
                && !$('simple_product_' + attributeCode + '_pricing_container')) {
            Element
                    .insert(
                            select,
                            {
                                after :'<div class="left"></div> <div id="simple_product_' + attributeCode + '_pricing_container" class="left"></div>'
                            });
            var newContainer = select.next('div');
            select.parentNode.removeChild(select);
            newContainer.appendChild(select);
            // Fix visualization bug
            $(this.idPrefix + 'simple_form').down('.form-list').style.width = '100%';
        }

        var container = $('simple_product_' + attributeCode + '_pricing_container');

        if (select.value) {
            var value = this.getValueByIndex(attribute, select.value);
            if (!value) {
                if (!container.down('.attribute-price')) {
                    if (value == null) {
                        value = {};
                    }
                    container.update(this.pricingValueTemplate.evaluate(value));
                    var priceValueField = container.down('.attribute-price');
                    var priceTypeField = container
                            .down('.attribute-price-type');

                    priceValueField.attributeCode = attributeCode;
                    priceValueField.priceField = priceValueField;
                    priceValueField.typeField = priceTypeField;

                    priceTypeField.attributeCode = attributeCode;
                    priceTypeField.priceField = priceValueField;
                    priceTypeField.typeField = priceTypeField;

                    Event.observe(priceValueField, 'change',
                            this.updateSimplePricing.bindAsEventListener(this));
                    Event.observe(priceValueField, 'keyup',
                            this.updateSimplePricing.bindAsEventListener(this));
                    Event.observe(priceTypeField, 'change',
                            this.updateSimplePricing.bindAsEventListener(this));

                    $('simple_product_' + attributeCode + '_pricing_value').value = null;
                    $('simple_product_' + attributeCode + '_pricing_type').value = null;
                }
            } else if (!isNaN(parseFloat(value.pricing_value))) {
                container.update(this.pricingValueViewTemplate.evaluate( {
                    'value' :(parseFloat(value.pricing_value) > 0 ? '+' : '')
                            + parseFloat(value.pricing_value)
                            + (parseInt(value.is_percent) > 0 ? '%' : '')
                }));
                $('simple_product_' + attributeCode + '_pricing_value').value = value.pricing_value;
                $('simple_product_' + attributeCode + '_pricing_type').value = value.is_percent;
            } else {
                container.update('');
                $('simple_product_' + attributeCode + '_pricing_value').value = null;
                $('simple_product_' + attributeCode + '_pricing_type').value = null;
            }
        } else if (container) {
            container.update('');
            $('simple_product_' + attributeCode + '_pricing_value').value = null;
            $('simple_product_' + attributeCode + '_pricing_type').value = null;
        }
    },
    updateSimplePricing : function(evt) {
        var element = Event.element(evt);
        if (!element.priceField.value.blank()) {
            $('simple_product_' + element.attributeCode + '_pricing_value').value = element.priceField.value;
            $('simple_product_' + element.attributeCode + '_pricing_type').value = element.typeField.value;
        } else {
            $('simple_product_' + element.attributeCode + '_pricing_value').value = null;
            $('simple_product_' + element.attributeCode + '_pricing_type').value = null;
        }
    },
    updateSimpleForm : function() {
        this.attributes.each( function(attribute) {
            if ($('simple_product_' + attribute.attribute_code)) {
                this.showPricing(
                        $('simple_product_' + attribute.attribute_code),
                        attribute.attribute_code);
            }
        }.bind(this));
    },
    showNoticeMessage : function() {
        $('assign_product_warrning').show();
    }
}

var onInitDisableFieldsList = [];

function toogleFieldEditMode(toogleIdentifier, fieldContainer) {
    if ($(toogleIdentifier).checked) {
        enableFieldEditMode(fieldContainer);
    } else {
        disableFieldEditMode(fieldContainer);
    }
}

function disableFieldEditMode(fieldContainer) {
    $(fieldContainer).disabled = true;
    if ($(fieldContainer + '_hidden')) {
        $(fieldContainer + '_hidden').disabled = true;
    }
}

function enableFieldEditMode(fieldContainer) {
    $(fieldContainer).disabled = false;
    if ($(fieldContainer + '_hidden')) {
        $(fieldContainer + '_hidden').disabled = false;
    }
}

function initDisableFields(fieldContainer) {
    onInitDisableFieldsList.push(fieldContainer);
}

function onCompleteDisableInited() {
    onInitDisableFieldsList.each( function(item) {
        disableFieldEditMode(item);
    });
}

function onUrlkeyChanged(urlKey) {
    urlKey = $(urlKey);
    var hidden = urlKey.next('input[type=hidden]');
    var chbx = urlKey.next('input[type=checkbox]');
    var oldValue = chbx.value;
    chbx.disabled = (oldValue == urlKey.value);
    hidden.disabled = chbx.disabled;
}

function onCustomUseParentChanged(element) {
    var useParent = (element.value == 1) ? true : false;
    element.up(2).select('input', 'select', 'textarea').each(function(el){
        if (element.id != el.id) {
            el.disabled = useParent;
        }
    });
    element.up(2).select('img').each(function(el){
        if (useParent) {
            el.hide();
        } else {
            el.show();
        }
    });
}

Event.observe(window, 'load', onCompleteDisableInited);

/*  Copyright Mihai Bazon, 2002-2005 | www.bazon.net/mishoo
 * -----------------------------------------------------------
 *
 * The DHTML Calendar, version 1.0 "It is happening again"
 *
 * Details and latest version at:
 * www.dynarch.com/projects/calendar
 *
 * This script is developed by Dynarch.com.  Visit us at www.dynarch.com.
 *
 * This script is distributed under the GNU Lesser General Public License.
 * Read the entire license text here: http://www.gnu.org/licenses/lgpl.html
 */

// $Id: calendar.js,v 1.51 2005/03/07 16:44:31 mishoo Exp $

/** The Calendar object constructor. */
Calendar = function (firstDayOfWeek, dateStr, onSelected, onClose) {
    // member variables
    this.activeDiv = null;
    this.currentDateEl = null;
    this.getDateStatus = null;
    this.getDateToolTip = null;
    this.getDateText = null;
    this.timeout = null;
    this.onSelected = onSelected || null;
    this.onClose = onClose || null;
    this.dragging = false;
    this.hidden = false;
    this.minYear = 1970;
    this.maxYear = 2050;
    this.dateFormat = Calendar._TT["DEF_DATE_FORMAT"];
    this.ttDateFormat = Calendar._TT["TT_DATE_FORMAT"];
    this.isPopup = true;
    this.weekNumbers = true;
    this.firstDayOfWeek = typeof firstDayOfWeek == "number" ? firstDayOfWeek : Calendar._FD; // 0 for Sunday, 1 for Monday, etc.
    this.showsOtherMonths = false;
    this.dateStr = dateStr;
    this.ar_days = null;
    this.showsTime = false;
    this.time24 = true;
    this.yearStep = 2;
    this.hiliteToday = true;
    this.multiple = null;
    // HTML elements
    this.table = null;
    this.element = null;
    this.tbody = null;
    this.firstdayname = null;
    // Combo boxes
    this.monthsCombo = null;
    this.yearsCombo = null;
    this.hilitedMonth = null;
    this.activeMonth = null;
    this.hilitedYear = null;
    this.activeYear = null;
    // Information
    this.dateClicked = false;

    // one-time initializations
    if (typeof Calendar._SDN == "undefined") {
        // table of short day names
        if (typeof Calendar._SDN_len == "undefined")
            Calendar._SDN_len = 3;
        var ar = new Array();
        for (var i = 8; i > 0;) {
            ar[--i] = Calendar._DN[i].substr(0, Calendar._SDN_len);
        }
        Calendar._SDN = ar;
        // table of short month names
        if (typeof Calendar._SMN_len == "undefined")
            Calendar._SMN_len = 3;
        ar = new Array();
        for (var i = 12; i > 0;) {
            ar[--i] = Calendar._MN[i].substr(0, Calendar._SMN_len);
        }
        Calendar._SMN = ar;
    }
};

// ** constants

/// "static", needed for event handlers.
Calendar._C = null;

/// detect a special case of "web browser"
Calendar.is_ie = ( /msie/i.test(navigator.userAgent) &&
           !/opera/i.test(navigator.userAgent) );

Calendar.is_ie5 = ( Calendar.is_ie && /msie 5\.0/i.test(navigator.userAgent) );

/// detect Opera browser
Calendar.is_opera = /opera/i.test(navigator.userAgent);

/// detect KHTML-based browsers
Calendar.is_khtml = /Konqueror|Safari|KHTML/i.test(navigator.userAgent);

/// detect Gecko browsers
Calendar.is_gecko = navigator.userAgent.match(/gecko/i);

// BEGIN: UTILITY FUNCTIONS; beware that these might be moved into a separate
//        library, at some point.

// Returns CSS property for element
Calendar.getStyle = function(element, style) {
    if (element.currentStyle) {
        var y = element.currentStyle[style];
    } else if (window.getComputedStyle) {
        var y = document.defaultView.getComputedStyle(element,null).getPropertyValue(style);
    }

    return y;
};

/*
 * Different ways to find element's absolute position
 */
Calendar.getAbsolutePos = function(element) {

    var res = new Object();
    res.x = 0; res.y = 0;

    // variant 1 (working best, copy-paste from prototype library)
    do {
        res.x += element.offsetLeft || 0;
        res.y += element.offsetTop  || 0;
        element = element.offsetParent;
        if (element) {
            if (element.tagName.toUpperCase() == 'BODY') break;
            var p = Calendar.getStyle(element, 'position');
            if ((p !== 'static') && (p !== 'relative')) break;
        }
    } while (element);

    return res;

    // variant 2 (good solution, but lost in IE8)
    if (element !== null) {
        res.x = element.offsetLeft;
        res.y = element.offsetTop;

        var offsetParent = element.offsetParent;
        var parentNode = element.parentNode;

        while (offsetParent !== null) {
            res.x += offsetParent.offsetLeft;
            res.y += offsetParent.offsetTop;

            if (offsetParent != document.body && offsetParent != document.documentElement) {
                res.x -= offsetParent.scrollLeft;
                res.y -= offsetParent.scrollTop;
            }
            //next lines are necessary to support FireFox problem with offsetParent
            if (Calendar.is_gecko) {
                while (offsetParent != parentNode && parentNode !== null) {
                    res.x -= parentNode.scrollLeft;
                    res.y -= parentNode.scrollTop;
                    parentNode = parentNode.parentNode;
                }
            }
            parentNode = offsetParent.parentNode;
            offsetParent = offsetParent.offsetParent;
        }
    }
    return res;

    // variant 2 (not working)

//    var SL = 0, ST = 0;
//    var is_div = /^div$/i.test(el.tagName);
//    if (is_div && el.scrollLeft)
//        SL = el.scrollLeft;
//    if (is_div && el.scrollTop)
//        ST = el.scrollTop;
//    var r = { x: el.offsetLeft - SL, y: el.offsetTop - ST };
//    if (el.offsetParent) {
//        var tmp = this.getAbsolutePos(el.offsetParent);
//        r.x += tmp.x;
//        r.y += tmp.y;
//    }
//    return r;
};

Calendar.isRelated = function (el, evt) {
    var related = evt.relatedTarget;
    if (!related) {
        var type = evt.type;
        if (type == "mouseover") {
            related = evt.fromElement;
        } else if (type == "mouseout") {
            related = evt.toElement;
        }
    }
    while (related) {
        if (related == el) {
            return true;
        }
        related = related.parentNode;
    }
    return false;
};

Calendar.removeClass = function(el, className) {
    if (!(el && el.className)) {
        return;
    }
    var cls = el.className.split(" ");
    var ar = new Array();
    for (var i = cls.length; i > 0;) {
        if (cls[--i] != className) {
            ar[ar.length] = cls[i];
        }
    }
    el.className = ar.join(" ");
};

Calendar.addClass = function(el, className) {
    Calendar.removeClass(el, className);
    el.className += " " + className;
};

// FIXME: the following 2 functions totally suck, are useless and should be replaced immediately.
Calendar.getElement = function(ev) {
    var f = Calendar.is_ie ? window.event.srcElement : ev.currentTarget;
    while (f.nodeType != 1 || /^div$/i.test(f.tagName))
        f = f.parentNode;
    return f;
};

Calendar.getTargetElement = function(ev) {
    var f = Calendar.is_ie ? window.event.srcElement : ev.target;
    while (f.nodeType != 1)
        f = f.parentNode;
    return f;
};

Calendar.stopEvent = function(ev) {
    ev || (ev = window.event);
    if (Calendar.is_ie) {
        ev.cancelBubble = true;
        ev.returnValue = false;
    } else {
        ev.preventDefault();
        ev.stopPropagation();
    }
    return false;
};

Calendar.addEvent = function(el, evname, func) {
    if (el.attachEvent) { // IE
        el.attachEvent("on" + evname, func);
    } else if (el.addEventListener) { // Gecko / W3C
        el.addEventListener(evname, func, true);
    } else {
        el["on" + evname] = func;
    }
};

Calendar.removeEvent = function(el, evname, func) {
    if (el.detachEvent) { // IE
        el.detachEvent("on" + evname, func);
    } else if (el.removeEventListener) { // Gecko / W3C
        el.removeEventListener(evname, func, true);
    } else {
        el["on" + evname] = null;
    }
};

Calendar.createElement = function(type, parent) {
    var el = null;
    if (document.createElementNS) {
        // use the XHTML namespace; IE won't normally get here unless
        // _they_ "fix" the DOM2 implementation.
        el = document.createElementNS("http://www.w3.org/1999/xhtml", type);
    } else {
        el = document.createElement(type);
    }
    if (typeof parent != "undefined") {
        parent.appendChild(el);
    }
    return el;
};

// END: UTILITY FUNCTIONS

// BEGIN: CALENDAR STATIC FUNCTIONS

/** Internal -- adds a set of events to make some element behave like a button. */
Calendar._add_evs = function(el) {
    with (Calendar) {
        addEvent(el, "mouseover", dayMouseOver);
        addEvent(el, "mousedown", dayMouseDown);
        addEvent(el, "mouseout", dayMouseOut);
        if (is_ie) {
            addEvent(el, "dblclick", dayMouseDblClick);
            el.setAttribute("unselectable", true);
        }
    }
};

Calendar.findMonth = function(el) {
    if (typeof el.month != "undefined") {
        return el;
    } else if (typeof el.parentNode.month != "undefined") {
        return el.parentNode;
    }
    return null;
};

Calendar.findYear = function(el) {
    if (typeof el.year != "undefined") {
        return el;
    } else if (typeof el.parentNode.year != "undefined") {
        return el.parentNode;
    }
    return null;
};

Calendar.showMonthsCombo = function () {
    var cal = Calendar._C;
    if (!cal) {
        return false;
    }
    var cal = cal;
    var cd = cal.activeDiv;
    var mc = cal.monthsCombo;
    if (cal.hilitedMonth) {
        Calendar.removeClass(cal.hilitedMonth, "hilite");
    }
    if (cal.activeMonth) {
        Calendar.removeClass(cal.activeMonth, "active");
    }
    var mon = cal.monthsCombo.getElementsByTagName("div")[cal.date.getMonth()];
    Calendar.addClass(mon, "active");
    cal.activeMonth = mon;
    var s = mc.style;
    s.display = "block";
    if (cd.navtype < 0)
        s.left = cd.offsetLeft + "px";
    else {
        var mcw = mc.offsetWidth;
        if (typeof mcw == "undefined")
            // Konqueror brain-dead techniques
            mcw = 50;
        s.left = (cd.offsetLeft + cd.offsetWidth - mcw) + "px";
    }
    s.top = (cd.offsetTop + cd.offsetHeight) + "px";
};

Calendar.showYearsCombo = function (fwd) {
    var cal = Calendar._C;
    if (!cal) {
        return false;
    }
    var cal = cal;
    var cd = cal.activeDiv;
    var yc = cal.yearsCombo;
    if (cal.hilitedYear) {
        Calendar.removeClass(cal.hilitedYear, "hilite");
    }
    if (cal.activeYear) {
        Calendar.removeClass(cal.activeYear, "active");
    }
    cal.activeYear = null;
    var Y = cal.date.getFullYear() + (fwd ? 1 : -1);
    var yr = yc.firstChild;
    var show = false;
    for (var i = 12; i > 0; --i) {
        if (Y >= cal.minYear && Y <= cal.maxYear) {
            yr.innerHTML = Y;
            yr.year = Y;
            yr.style.display = "block";
            show = true;
        } else {
            yr.style.display = "none";
        }
        yr = yr.nextSibling;
        Y += fwd ? cal.yearStep : -cal.yearStep;
    }
    if (show) {
        var s = yc.style;
        s.display = "block";
        if (cd.navtype < 0)
            s.left = cd.offsetLeft + "px";
        else {
            var ycw = yc.offsetWidth;
            if (typeof ycw == "undefined")
                // Konqueror brain-dead techniques
                ycw = 50;
            s.left = (cd.offsetLeft + cd.offsetWidth - ycw) + "px";
        }
        s.top = (cd.offsetTop + cd.offsetHeight) + "px";
    }
};

// event handlers

Calendar.tableMouseUp = function(ev) {
    var cal = Calendar._C;
    if (!cal) {
        return false;
    }
    if (cal.timeout) {
        clearTimeout(cal.timeout);
    }
    var el = cal.activeDiv;
    if (!el) {
        return false;
    }
    var target = Calendar.getTargetElement(ev);
    ev || (ev = window.event);
    Calendar.removeClass(el, "active");
    if (target == el || target.parentNode == el) {
        Calendar.cellClick(el, ev);
    }
    var mon = Calendar.findMonth(target);
    var date = null;
    if (mon) {
        date = new CalendarDateObject(cal.date);
        if (mon.month != date.getMonth()) {
            date.setMonth(mon.month);
            cal.setDate(date);
            cal.dateClicked = false;
            cal.callHandler();
        }
    } else {
        var year = Calendar.findYear(target);
        if (year) {
            date = new CalendarDateObject(cal.date);
            if (year.year != date.getFullYear()) {
                date.setFullYear(year.year);
                cal.setDate(date);
                cal.dateClicked = false;
                cal.callHandler();
            }
        }
    }
    with (Calendar) {
        removeEvent(document, "mouseup", tableMouseUp);
        removeEvent(document, "mouseover", tableMouseOver);
        removeEvent(document, "mousemove", tableMouseOver);
        cal._hideCombos();
        _C = null;
        return stopEvent(ev);
    }
};

Calendar.tableMouseOver = function (ev) {
    var cal = Calendar._C;
    if (!cal) {
        return;
    }
    var el = cal.activeDiv;
    var target = Calendar.getTargetElement(ev);
    if (target == el || target.parentNode == el) {
        Calendar.addClass(el, "hilite active");
        Calendar.addClass(el.parentNode, "rowhilite");
    } else {
        if (typeof el.navtype == "undefined" || (el.navtype != 50 && (el.navtype == 0 || Math.abs(el.navtype) > 2)))
            Calendar.removeClass(el, "active");
        Calendar.removeClass(el, "hilite");
        Calendar.removeClass(el.parentNode, "rowhilite");
    }
    ev || (ev = window.event);
    if (el.navtype == 50 && target != el) {
        var pos = Calendar.getAbsolutePos(el);
        var w = el.offsetWidth;
        var x = ev.clientX;
        var dx;
        var decrease = true;
        if (x > pos.x + w) {
            dx = x - pos.x - w;
            decrease = false;
        } else
            dx = pos.x - x;

        if (dx < 0) dx = 0;
        var range = el._range;
        var current = el._current;
        var count = Math.floor(dx / 10) % range.length;
        for (var i = range.length; --i >= 0;)
            if (range[i] == current)
                break;
        while (count-- > 0)
            if (decrease) {
                if (--i < 0)
                    i = range.length - 1;
            } else if ( ++i >= range.length )
                i = 0;
        var newval = range[i];
        el.innerHTML = newval;

        cal.onUpdateTime();
    }
    var mon = Calendar.findMonth(target);
    if (mon) {
        if (mon.month != cal.date.getMonth()) {
            if (cal.hilitedMonth) {
                Calendar.removeClass(cal.hilitedMonth, "hilite");
            }
            Calendar.addClass(mon, "hilite");
            cal.hilitedMonth = mon;
        } else if (cal.hilitedMonth) {
            Calendar.removeClass(cal.hilitedMonth, "hilite");
        }
    } else {
        if (cal.hilitedMonth) {
            Calendar.removeClass(cal.hilitedMonth, "hilite");
        }
        var year = Calendar.findYear(target);
        if (year) {
            if (year.year != cal.date.getFullYear()) {
                if (cal.hilitedYear) {
                    Calendar.removeClass(cal.hilitedYear, "hilite");
                }
                Calendar.addClass(year, "hilite");
                cal.hilitedYear = year;
            } else if (cal.hilitedYear) {
                Calendar.removeClass(cal.hilitedYear, "hilite");
            }
        } else if (cal.hilitedYear) {
            Calendar.removeClass(cal.hilitedYear, "hilite");
        }
    }
    return Calendar.stopEvent(ev);
};

Calendar.tableMouseDown = function (ev) {
    if (Calendar.getTargetElement(ev) == Calendar.getElement(ev)) {
        return Calendar.stopEvent(ev);
    }
};

Calendar.calDragIt = function (ev) {
    var cal = Calendar._C;
    if (!(cal && cal.dragging)) {
        return false;
    }
    var posX;
    var posY;
    if (Calendar.is_ie) {
        posY = window.event.clientY + document.body.scrollTop;
        posX = window.event.clientX + document.body.scrollLeft;
    } else {
        posX = ev.pageX;
        posY = ev.pageY;
    }
    cal.hideShowCovered();
    var st = cal.element.style;
    st.left = (posX - cal.xOffs) + "px";
    st.top = (posY - cal.yOffs) + "px";
    return Calendar.stopEvent(ev);
};

Calendar.calDragEnd = function (ev) {
    var cal = Calendar._C;
    if (!cal) {
        return false;
    }
    cal.dragging = false;
    with (Calendar) {
        removeEvent(document, "mousemove", calDragIt);
        removeEvent(document, "mouseup", calDragEnd);
        tableMouseUp(ev);
    }
    cal.hideShowCovered();
};

Calendar.dayMouseDown = function(ev) {
    var el = Calendar.getElement(ev);
    if (el.disabled) {
        return false;
    }
    var cal = el.calendar;
    cal.activeDiv = el;
    Calendar._C = cal;
    if (el.navtype != 300) with (Calendar) {
        if (el.navtype == 50) {
            el._current = el.innerHTML;
            addEvent(document, "mousemove", tableMouseOver);
        } else
            addEvent(document, Calendar.is_ie5 ? "mousemove" : "mouseover", tableMouseOver);
        addClass(el, "hilite active");
        addEvent(document, "mouseup", tableMouseUp);
    } else if (cal.isPopup) {
        cal._dragStart(ev);
    }
    if (el.navtype == -1 || el.navtype == 1) {
        if (cal.timeout) clearTimeout(cal.timeout);
        cal.timeout = setTimeout("Calendar.showMonthsCombo()", 250);
    } else if (el.navtype == -2 || el.navtype == 2) {
        if (cal.timeout) clearTimeout(cal.timeout);
        cal.timeout = setTimeout((el.navtype > 0) ? "Calendar.showYearsCombo(true)" : "Calendar.showYearsCombo(false)", 250);
    } else {
        cal.timeout = null;
    }
    return Calendar.stopEvent(ev);
};

Calendar.dayMouseDblClick = function(ev) {
    Calendar.cellClick(Calendar.getElement(ev), ev || window.event);
    if (Calendar.is_ie) {
        document.selection.empty();
    }
};

Calendar.dayMouseOver = function(ev) {
    var el = Calendar.getElement(ev);
    if (Calendar.isRelated(el, ev) || Calendar._C || el.disabled) {
        return false;
    }
    if (el.ttip) {
        if (el.ttip.substr(0, 1) == "_") {
            el.ttip = el.caldate.print(el.calendar.ttDateFormat) + el.ttip.substr(1);
        }
        el.calendar.tooltips.innerHTML = el.ttip;
    }
    if (el.navtype != 300) {
        Calendar.addClass(el, "hilite");
        if (el.caldate) {
            Calendar.addClass(el.parentNode, "rowhilite");
        }
    }
    return Calendar.stopEvent(ev);
};

Calendar.dayMouseOut = function(ev) {
    with (Calendar) {
        var el = getElement(ev);
        if (isRelated(el, ev) || _C || el.disabled)
            return false;
        removeClass(el, "hilite");
        if (el.caldate)
            removeClass(el.parentNode, "rowhilite");
        if (el.calendar)
            el.calendar.tooltips.innerHTML = _TT["SEL_DATE"];
        return stopEvent(ev);
    }
};

/**
 *  A generic "click" handler :) handles all types of buttons defined in this
 *  calendar.
 */
Calendar.cellClick = function(el, ev) {
    var cal = el.calendar;
    var closing = false;
    var newdate = false;
    var date = null;
    if (typeof el.navtype == "undefined") {
        if (cal.currentDateEl) {
            Calendar.removeClass(cal.currentDateEl, "selected");
            Calendar.addClass(el, "selected");
            closing = (cal.currentDateEl == el);
            if (!closing) {
                cal.currentDateEl = el;
            }
        }
        cal.date.setDateOnly(el.caldate);
        date = cal.date;
        var other_month = !(cal.dateClicked = !el.otherMonth);
        if (!other_month && !cal.currentDateEl)
            cal._toggleMultipleDate(new CalendarDateObject(date));
        else
            newdate = !el.disabled;
        // a date was clicked
        if (other_month)
            cal._init(cal.firstDayOfWeek, date);
    } else {
        if (el.navtype == 200) {
            Calendar.removeClass(el, "hilite");
            cal.callCloseHandler();
            return;
        }
        date = new CalendarDateObject(cal.date);
        if (el.navtype == 0)
            date.setDateOnly(new CalendarDateObject()); // TODAY
        // unless "today" was clicked, we assume no date was clicked so
        // the selected handler will know not to close the calenar when
        // in single-click mode.
        // cal.dateClicked = (el.navtype == 0);
        cal.dateClicked = false;
        var year = date.getFullYear();
        var mon = date.getMonth();
        function setMonth(m) {
            var day = date.getDate();
            var max = date.getMonthDays(m);
            if (day > max) {
                date.setDate(max);
            }
            date.setMonth(m);
        };
        switch (el.navtype) {
            case 400:
            Calendar.removeClass(el, "hilite");
            var text = Calendar._TT["ABOUT"];
            if (typeof text != "undefined") {
                text += cal.showsTime ? Calendar._TT["ABOUT_TIME"] : "";
            } else {
                // FIXME: this should be removed as soon as lang files get updated!
                text = "Help and about box text is not translated into this language.\n" +
                    "If you know this language and you feel generous please update\n" +
                    "the corresponding file in \"lang\" subdir to match calendar-en.js\n" +
                    "and send it back to <mihai_bazon@yahoo.com> to get it into the distribution  ;-)\n\n" +
                    "Thank you!\n" +
                    "http://dynarch.com/mishoo/calendar.epl\n";
            }
            alert(text);
            return;
            case -2:
            if (year > cal.minYear) {
                date.setFullYear(year - 1);
            }
            break;
            case -1:
            if (mon > 0) {
                setMonth(mon - 1);
            } else if (year-- > cal.minYear) {
                date.setFullYear(year);
                setMonth(11);
            }
            break;
            case 1:
            if (mon < 11) {
                setMonth(mon + 1);
            } else if (year < cal.maxYear) {
                date.setFullYear(year + 1);
                setMonth(0);
            }
            break;
            case 2:
            if (year < cal.maxYear) {
                date.setFullYear(year + 1);
            }
            break;
            case 100:
            cal.setFirstDayOfWeek(el.fdow);
            return;
            case 50:
            var range = el._range;
            var current = el.innerHTML;
            for (var i = range.length; --i >= 0;)
                if (range[i] == current)
                    break;
            if (ev && ev.shiftKey) {
                if (--i < 0)
                    i = range.length - 1;
            } else if ( ++i >= range.length )
                i = 0;
            var newval = range[i];
            el.innerHTML = newval;
            cal.onUpdateTime();
            return;
            case 0:
            // TODAY will bring us here
            if ((typeof cal.getDateStatus == "function") &&
                cal.getDateStatus(date, date.getFullYear(), date.getMonth(), date.getDate())) {
                return false;
            }
            break;
        }
        if (!date.equalsTo(cal.date)) {
            cal.setDate(date);
            newdate = true;
        } else if (el.navtype == 0)
            newdate = closing = true;
    }
    if (newdate) {
        ev && cal.callHandler();
    }
    if (closing) {
        Calendar.removeClass(el, "hilite");
        ev && cal.callCloseHandler();
    }
};

// END: CALENDAR STATIC FUNCTIONS

// BEGIN: CALENDAR OBJECT FUNCTIONS

/**
 *  This function creates the calendar inside the given parent.  If _par is
 *  null than it creates a popup calendar inside the BODY element.  If _par is
 *  an element, be it BODY, then it creates a non-popup calendar (still
 *  hidden).  Some properties need to be set before calling this function.
 */
Calendar.prototype.create = function (_par) {
    var parent = null;
    if (! _par) {
        // default parent is the document body, in which case we create
        // a popup calendar.
        parent = document.getElementsByTagName("body")[0];
        this.isPopup = true;
    } else {
        parent = _par;
        this.isPopup = false;
    }
    this.date = this.dateStr ? new CalendarDateObject(this.dateStr) : new CalendarDateObject();

    var table = Calendar.createElement("table");
    this.table = table;
    table.cellSpacing = 0;
    table.cellPadding = 0;
    table.calendar = this;
    Calendar.addEvent(table, "mousedown", Calendar.tableMouseDown);

    var div = Calendar.createElement("div");
    this.element = div;
    div.className = "calendar";
    if (this.isPopup) {
        div.style.position = "absolute";
        div.style.display = "none";
    }
    div.appendChild(table);

    var thead = Calendar.createElement("thead", table);
    var cell = null;
    var row = null;

    var cal = this;
    var hh = function (text, cs, navtype) {
        cell = Calendar.createElement("td", row);
        cell.colSpan = cs;
        cell.className = "button";
        if (navtype != 0 && Math.abs(navtype) <= 2)
            cell.className += " nav";
        Calendar._add_evs(cell);
        cell.calendar = cal;
        cell.navtype = navtype;
        cell.innerHTML = "<div unselectable='on'>" + text + "</div>";
        return cell;
    };

    row = Calendar.createElement("tr", thead);
    var title_length = 6;
    (this.isPopup) && --title_length;
    (this.weekNumbers) && ++title_length;

    hh("?", 1, 400).ttip = Calendar._TT["INFO"];
    this.title = hh("", title_length, 300);
    this.title.className = "title";
    if (this.isPopup) {
        this.title.ttip = Calendar._TT["DRAG_TO_MOVE"];
        this.title.style.cursor = "move";
        hh("&#x00d7;", 1, 200).ttip = Calendar._TT["CLOSE"];
    }

    row = Calendar.createElement("tr", thead);
    row.className = "headrow";

    this._nav_py = hh("&#x00ab;", 1, -2);
    this._nav_py.ttip = Calendar._TT["PREV_YEAR"];

    this._nav_pm = hh("&#x2039;", 1, -1);
    this._nav_pm.ttip = Calendar._TT["PREV_MONTH"];

    this._nav_now = hh(Calendar._TT["TODAY"], this.weekNumbers ? 4 : 3, 0);
    this._nav_now.ttip = Calendar._TT["GO_TODAY"];

    this._nav_nm = hh("&#x203a;", 1, 1);
    this._nav_nm.ttip = Calendar._TT["NEXT_MONTH"];

    this._nav_ny = hh("&#x00bb;", 1, 2);
    this._nav_ny.ttip = Calendar._TT["NEXT_YEAR"];

    // day names
    row = Calendar.createElement("tr", thead);
    row.className = "daynames";
    if (this.weekNumbers) {
        cell = Calendar.createElement("td", row);
        cell.className = "name wn";
        cell.innerHTML = Calendar._TT["WK"];
    }
    for (var i = 7; i > 0; --i) {
        cell = Calendar.createElement("td", row);
        if (!i) {
            cell.navtype = 100;
            cell.calendar = this;
            Calendar._add_evs(cell);
        }
    }
    this.firstdayname = (this.weekNumbers) ? row.firstChild.nextSibling : row.firstChild;
    this._displayWeekdays();

    var tbody = Calendar.createElement("tbody", table);
    this.tbody = tbody;

    for (i = 6; i > 0; --i) {
        row = Calendar.createElement("tr", tbody);
        if (this.weekNumbers) {
            cell = Calendar.createElement("td", row);
        }
        for (var j = 7; j > 0; --j) {
            cell = Calendar.createElement("td", row);
            cell.calendar = this;
            Calendar._add_evs(cell);
        }
    }

    if (this.showsTime) {
        row = Calendar.createElement("tr", tbody);
        row.className = "time";

        cell = Calendar.createElement("td", row);
        cell.className = "time";
        cell.colSpan = 2;
        cell.innerHTML = Calendar._TT["TIME"] || "&nbsp;";

        cell = Calendar.createElement("td", row);
        cell.className = "time";
        cell.colSpan = this.weekNumbers ? 4 : 3;

        (function(){
            function makeTimePart(className, init, range_start, range_end) {
                var part = Calendar.createElement("span", cell);
                part.className = className;
                part.innerHTML = init;
                part.calendar = cal;
                part.ttip = Calendar._TT["TIME_PART"];
                part.navtype = 50;
                part._range = [];
                if (typeof range_start != "number")
                    part._range = range_start;
                else {
                    for (var i = range_start; i <= range_end; ++i) {
                        var txt;
                        if (i < 10 && range_end >= 10) txt = '0' + i;
                        else txt = '' + i;
                        part._range[part._range.length] = txt;
                    }
                }
                Calendar._add_evs(part);
                return part;
            };
            var hrs = cal.date.getHours();
            var mins = cal.date.getMinutes();
            var t12 = !cal.time24;
            var pm = (hrs > 12);
            if (t12 && pm) hrs -= 12;
            var H = makeTimePart("hour", hrs, t12 ? 1 : 0, t12 ? 12 : 23);
            var span = Calendar.createElement("span", cell);
            span.innerHTML = ":";
            span.className = "colon";
            var M = makeTimePart("minute", mins, 0, 59);
            var AP = null;
            cell = Calendar.createElement("td", row);
            cell.className = "time";
            cell.colSpan = 2;
            if (t12)
                AP = makeTimePart("ampm", pm ? "pm" : "am", ["am", "pm"]);
            else
                cell.innerHTML = "&nbsp;";

            cal.onSetTime = function() {
                var pm, hrs = this.date.getHours(),
                    mins = this.date.getMinutes();
                if (t12) {
                    pm = (hrs >= 12);
                    if (pm) hrs -= 12;
                    if (hrs == 0) hrs = 12;
                    AP.innerHTML = pm ? "pm" : "am";
                }
                H.innerHTML = (hrs < 10) ? ("0" + hrs) : hrs;
                M.innerHTML = (mins < 10) ? ("0" + mins) : mins;
            };

            cal.onUpdateTime = function() {
                var date = this.date;
                var h = parseInt(H.innerHTML, 10);
                if (t12) {
                    if (/pm/i.test(AP.innerHTML) && h < 12)
                        h += 12;
                    else if (/am/i.test(AP.innerHTML) && h == 12)
                        h = 0;
                }
                var d = date.getDate();
                var m = date.getMonth();
                var y = date.getFullYear();
                date.setHours(h);
                date.setMinutes(parseInt(M.innerHTML, 10));
                date.setFullYear(y);
                date.setMonth(m);
                date.setDate(d);
                this.dateClicked = false;
                this.callHandler();
            };
        })();
    } else {
        this.onSetTime = this.onUpdateTime = function() {};
    }

    var tfoot = Calendar.createElement("tfoot", table);

    row = Calendar.createElement("tr", tfoot);
    row.className = "footrow";

    cell = hh(Calendar._TT["SEL_DATE"], this.weekNumbers ? 8 : 7, 300);
    cell.className = "ttip";
    if (this.isPopup) {
        cell.ttip = Calendar._TT["DRAG_TO_MOVE"];
        cell.style.cursor = "move";
    }
    this.tooltips = cell;

    div = Calendar.createElement("div", this.element);
    this.monthsCombo = div;
    div.className = "combo";
    for (i = 0; i < Calendar._MN.length; ++i) {
        var mn = Calendar.createElement("div");
        mn.className = Calendar.is_ie ? "label-IEfix" : "label";
        mn.month = i;
        mn.innerHTML = Calendar._SMN[i];
        div.appendChild(mn);
    }

    div = Calendar.createElement("div", this.element);
    this.yearsCombo = div;
    div.className = "combo";
    for (i = 12; i > 0; --i) {
        var yr = Calendar.createElement("div");
        yr.className = Calendar.is_ie ? "label-IEfix" : "label";
        div.appendChild(yr);
    }

    this._init(this.firstDayOfWeek, this.date);
    parent.appendChild(this.element);
};

/** keyboard navigation, only for popup calendars */
Calendar._keyEvent = function(ev) {
    var cal = window._dynarch_popupCalendar;
    if (!cal || cal.multiple)
        return false;
    (Calendar.is_ie) && (ev = window.event);
    var act = (Calendar.is_ie || ev.type == "keypress"),
        K = ev.keyCode;
    if (ev.ctrlKey) {
        switch (K) {
            case 37: // KEY left
            act && Calendar.cellClick(cal._nav_pm);
            break;
            case 38: // KEY up
            act && Calendar.cellClick(cal._nav_py);
            break;
            case 39: // KEY right
            act && Calendar.cellClick(cal._nav_nm);
            break;
            case 40: // KEY down
            act && Calendar.cellClick(cal._nav_ny);
            break;
            default:
            return false;
        }
    } else switch (K) {
        case 32: // KEY space (now)
        Calendar.cellClick(cal._nav_now);
        break;
        case 27: // KEY esc
        act && cal.callCloseHandler();
        break;
        case 37: // KEY left
        case 38: // KEY up
        case 39: // KEY right
        case 40: // KEY down
        if (act) {
            var prev, x, y, ne, el, step;
            prev = K == 37 || K == 38;
            step = (K == 37 || K == 39) ? 1 : 7;
            function setVars() {
                el = cal.currentDateEl;
                var p = el.pos;
                x = p & 15;
                y = p >> 4;
                ne = cal.ar_days[y][x];
            };setVars();
            function prevMonth() {
                var date = new CalendarDateObject(cal.date);
                date.setDate(date.getDate() - step);
                cal.setDate(date);
            };
            function nextMonth() {
                var date = new CalendarDateObject(cal.date);
                date.setDate(date.getDate() + step);
                cal.setDate(date);
            };
            while (1) {
                switch (K) {
                    case 37: // KEY left
                    if (--x >= 0)
                        ne = cal.ar_days[y][x];
                    else {
                        x = 6;
                        K = 38;
                        continue;
                    }
                    break;
                    case 38: // KEY up
                    if (--y >= 0)
                        ne = cal.ar_days[y][x];
                    else {
                        prevMonth();
                        setVars();
                    }
                    break;
                    case 39: // KEY right
                    if (++x < 7)
                        ne = cal.ar_days[y][x];
                    else {
                        x = 0;
                        K = 40;
                        continue;
                    }
                    break;
                    case 40: // KEY down
                    if (++y < cal.ar_days.length)
                        ne = cal.ar_days[y][x];
                    else {
                        nextMonth();
                        setVars();
                    }
                    break;
                }
                break;
            }
            if (ne) {
                if (!ne.disabled)
                    Calendar.cellClick(ne);
                else if (prev)
                    prevMonth();
                else
                    nextMonth();
            }
        }
        break;
        case 13: // KEY enter
        if (act)
            Calendar.cellClick(cal.currentDateEl, ev);
        break;
        default:
        return false;
    }
    return Calendar.stopEvent(ev);
};

/**
 *  (RE)Initializes the calendar to the given date and firstDayOfWeek
 */
Calendar.prototype._init = function (firstDayOfWeek, date) {
    var today = new CalendarDateObject(),
        TY = today.getFullYear(),
        TM = today.getMonth(),
        TD = today.getDate();
    this.table.style.visibility = "hidden";
    var year = date.getFullYear();
    if (year < this.minYear) {
        year = this.minYear;
        date.setFullYear(year);
    } else if (year > this.maxYear) {
        year = this.maxYear;
        date.setFullYear(year);
    }
    this.firstDayOfWeek = firstDayOfWeek;
    this.date = new CalendarDateObject(date);
    var month = date.getMonth();
    var mday = date.getDate();
    var no_days = date.getMonthDays();

    // calendar voodoo for computing the first day that would actually be
    // displayed in the calendar, even if it's from the previous month.
    // WARNING: this is magic. ;-)
    date.setDate(1);
    var day1 = (date.getDay() - this.firstDayOfWeek) % 7;
    if (day1 < 0)
        day1 += 7;
    date.setDate(-day1);
    date.setDate(date.getDate() + 1);

    var row = this.tbody.firstChild;
    var MN = Calendar._SMN[month];
    var ar_days = this.ar_days = new Array();
    var weekend = Calendar._TT["WEEKEND"];
    var dates = this.multiple ? (this.datesCells = {}) : null;
    for (var i = 0; i < 6; ++i, row = row.nextSibling) {
        var cell = row.firstChild;
        if (this.weekNumbers) {
            cell.className = "day wn";
            cell.innerHTML = date.getWeekNumber();
            cell = cell.nextSibling;
        }
        row.className = "daysrow";
        var hasdays = false, iday, dpos = ar_days[i] = [];
        for (var j = 0; j < 7; ++j, cell = cell.nextSibling, date.setDate(iday + 1)) {
            iday = date.getDate();
            var wday = date.getDay();
            cell.className = "day";
            cell.pos = i << 4 | j;
            dpos[j] = cell;
            var current_month = (date.getMonth() == month);
            if (!current_month) {
                if (this.showsOtherMonths) {
                    cell.className += " othermonth";
                    cell.otherMonth = true;
                } else {
                    cell.className = "emptycell";
                    cell.innerHTML = "&nbsp;";
                    cell.disabled = true;
                    continue;
                }
            } else {
                cell.otherMonth = false;
                hasdays = true;
            }
            cell.disabled = false;
            cell.innerHTML = this.getDateText ? this.getDateText(date, iday) : iday;
            if (dates)
                dates[date.print("%Y%m%d")] = cell;
            if (this.getDateStatus) {
                var status = this.getDateStatus(date, year, month, iday);
                if (this.getDateToolTip) {
                    var toolTip = this.getDateToolTip(date, year, month, iday);
                    if (toolTip)
                        cell.title = toolTip;
                }
                if (status === true) {
                    cell.className += " disabled";
                    cell.disabled = true;
                } else {
                    if (/disabled/i.test(status))
                        cell.disabled = true;
                    cell.className += " " + status;
                }
            }
            if (!cell.disabled) {
                cell.caldate = new CalendarDateObject(date);
                cell.ttip = "_";
                if (!this.multiple && current_month
                    && iday == mday && this.hiliteToday) {
                    cell.className += " selected";
                    this.currentDateEl = cell;
                }
                if (date.getFullYear() == TY &&
                    date.getMonth() == TM &&
                    iday == TD) {
                    cell.className += " today";
                    cell.ttip += Calendar._TT["PART_TODAY"];
                }
                if (weekend.indexOf(wday.toString()) != -1)
                    cell.className += cell.otherMonth ? " oweekend" : " weekend";
            }
        }
        if (!(hasdays || this.showsOtherMonths))
            row.className = "emptyrow";
    }
    this.title.innerHTML = Calendar._MN[month] + ", " + year;
    this.onSetTime();
    this.table.style.visibility = "visible";
    this._initMultipleDates();
    // PROFILE
    // this.tooltips.innerHTML = "Generated in " + ((new CalendarDateObject()) - today) + " ms";
};

Calendar.prototype._initMultipleDates = function() {
    if (this.multiple) {
        for (var i in this.multiple) {
            var cell = this.datesCells[i];
            var d = this.multiple[i];
            if (!d)
                continue;
            if (cell)
                cell.className += " selected";
        }
    }
};

Calendar.prototype._toggleMultipleDate = function(date) {
    if (this.multiple) {
        var ds = date.print("%Y%m%d");
        var cell = this.datesCells[ds];
        if (cell) {
            var d = this.multiple[ds];
            if (!d) {
                Calendar.addClass(cell, "selected");
                this.multiple[ds] = date;
            } else {
                Calendar.removeClass(cell, "selected");
                delete this.multiple[ds];
            }
        }
    }
};

Calendar.prototype.setDateToolTipHandler = function (unaryFunction) {
    this.getDateToolTip = unaryFunction;
};

/**
 *  Calls _init function above for going to a certain date (but only if the
 *  date is different than the currently selected one).
 */
Calendar.prototype.setDate = function (date) {
    if (!date.equalsTo(this.date)) {
        this._init(this.firstDayOfWeek, date);
    }
};

/**
 *  Refreshes the calendar.  Useful if the "disabledHandler" function is
 *  dynamic, meaning that the list of disabled date can change at runtime.
 *  Just * call this function if you think that the list of disabled dates
 *  should * change.
 */
Calendar.prototype.refresh = function () {
    this._init(this.firstDayOfWeek, this.date);
};

/** Modifies the "firstDayOfWeek" parameter (pass 0 for Synday, 1 for Monday, etc.). */
Calendar.prototype.setFirstDayOfWeek = function (firstDayOfWeek) {
    this._init(firstDayOfWeek, this.date);
    this._displayWeekdays();
};

/**
 *  Allows customization of what dates are enabled.  The "unaryFunction"
 *  parameter must be a function object that receives the date (as a JS Date
 *  object) and returns a boolean value.  If the returned value is true then
 *  the passed date will be marked as disabled.
 */
Calendar.prototype.setDateStatusHandler = Calendar.prototype.setDisabledHandler = function (unaryFunction) {
    this.getDateStatus = unaryFunction;
};

/** Customization of allowed year range for the calendar. */
Calendar.prototype.setRange = function (a, z) {
    this.minYear = a;
    this.maxYear = z;
};

/** Calls the first user handler (selectedHandler). */
Calendar.prototype.callHandler = function () {
    if (this.onSelected) {
        this.onSelected(this, this.date.print(this.dateFormat));
    }
};

/** Calls the second user handler (closeHandler). */
Calendar.prototype.callCloseHandler = function () {
    if (this.onClose) {
        this.onClose(this);
    }
    this.hideShowCovered();
};

/** Removes the calendar object from the DOM tree and destroys it. */
Calendar.prototype.destroy = function () {
    var el = this.element.parentNode;
    el.removeChild(this.element);
    Calendar._C = null;
    window._dynarch_popupCalendar = null;
};

/**
 *  Moves the calendar element to a different section in the DOM tree (changes
 *  its parent).
 */
Calendar.prototype.reparent = function (new_parent) {
    var el = this.element;
    el.parentNode.removeChild(el);
    new_parent.appendChild(el);
};

// This gets called when the user presses a mouse button anywhere in the
// document, if the calendar is shown.  If the click was outside the open
// calendar this function closes it.
Calendar._checkCalendar = function(ev) {
    var calendar = window._dynarch_popupCalendar;
    if (!calendar) {
        return false;
    }
    var el = Calendar.is_ie ? Calendar.getElement(ev) : Calendar.getTargetElement(ev);
    for (; el != null && el != calendar.element; el = el.parentNode);
    if (el == null) {
        // calls closeHandler which should hide the calendar.
        window._dynarch_popupCalendar.callCloseHandler();
        return Calendar.stopEvent(ev);
    }
};

/** Shows the calendar. */
Calendar.prototype.show = function () {
    var rows = this.table.getElementsByTagName("tr");
    for (var i = rows.length; i > 0;) {
        var row = rows[--i];
        Calendar.removeClass(row, "rowhilite");
        var cells = row.getElementsByTagName("td");
        for (var j = cells.length; j > 0;) {
            var cell = cells[--j];
            Calendar.removeClass(cell, "hilite");
            Calendar.removeClass(cell, "active");
        }
    }
    this.element.style.display = "block";
    this.hidden = false;
    if (this.isPopup) {
        window._dynarch_popupCalendar = this;
        Calendar.addEvent(document, "keydown", Calendar._keyEvent);
        Calendar.addEvent(document, "keypress", Calendar._keyEvent);
        Calendar.addEvent(document, "mousedown", Calendar._checkCalendar);
    }
    this.hideShowCovered();
};

/**
 *  Hides the calendar.  Also removes any "hilite" from the class of any TD
 *  element.
 */
Calendar.prototype.hide = function () {
    if (this.isPopup) {
        Calendar.removeEvent(document, "keydown", Calendar._keyEvent);
        Calendar.removeEvent(document, "keypress", Calendar._keyEvent);
        Calendar.removeEvent(document, "mousedown", Calendar._checkCalendar);
    }
    this.element.style.display = "none";
    this.hidden = true;
    this.hideShowCovered();
};

/**
 *  Shows the calendar at a given absolute position (beware that, depending on
 *  the calendar element style -- position property -- this might be relative
 *  to the parent's containing rectangle).
 */
Calendar.prototype.showAt = function (x, y) {
    var s = this.element.style;
    s.left = x + "px";
    s.top = y + "px";
    this.show();
};

/** Shows the calendar near a given element. */
Calendar.prototype.showAtElement = function (el, opts) {
    var self = this;
    var p = Calendar.getAbsolutePos(el);
    if (!opts || typeof opts != "string") {
        this.showAt(p.x, p.y + el.offsetHeight);
        return true;
    }
    function fixPosition(box) {
        if (box.x < 0)
            box.x = 0;
        if (box.y < 0)
            box.y = 0;
        var cp = document.createElement("div");
        var s = cp.style;
        s.position = "absolute";
        s.right = s.bottom = s.width = s.height = "0px";
        document.body.appendChild(cp);
        var br = Calendar.getAbsolutePos(cp);
        document.body.removeChild(cp);
        if (Calendar.is_ie) {
            br.y += document.documentElement.scrollTop;
            br.x += document.documentElement.scrollLeft;
        } else {
            br.y += window.scrollY;
            br.x += window.scrollX;
        }
        var tmp = box.x + box.width - br.x;
        if (tmp > 0) box.x -= tmp;
        tmp = box.y + box.height - br.y;
        if (tmp > 0) box.y -= tmp;
    };
    this.element.style.display = "block";
    Calendar.continuation_for_the_fucking_khtml_browser = function() {
        var w = self.element.offsetWidth;
        var h = self.element.offsetHeight;
        self.element.style.display = "none";
        var valign = opts.substr(0, 1);
        var halign = "l";
        if (opts.length > 1) {
            halign = opts.substr(1, 1);
        }
        // vertical alignment
        switch (valign) {
            case "T": p.y -= h; break;
            case "B": p.y += el.offsetHeight; break;
            case "C": p.y += (el.offsetHeight - h) / 2; break;
            case "t": p.y += el.offsetHeight - h; break;
            case "b": break; // already there
        }
        // horizontal alignment
        switch (halign) {
            case "L": p.x -= w; break;
            case "R": p.x += el.offsetWidth; break;
            case "C": p.x += (el.offsetWidth - w) / 2; break;
            case "l": p.x += el.offsetWidth - w; break;
            case "r": break; // already there
        }
        p.width = w;
        p.height = h + 40;
        self.monthsCombo.style.display = "none";
        fixPosition(p);
        self.showAt(p.x, p.y);
    };
    if (Calendar.is_khtml)
        setTimeout("Calendar.continuation_for_the_fucking_khtml_browser()", 10);
    else
        Calendar.continuation_for_the_fucking_khtml_browser();
};

/** Customizes the date format. */
Calendar.prototype.setDateFormat = function (str) {
    this.dateFormat = str;
};

/** Customizes the tooltip date format. */
Calendar.prototype.setTtDateFormat = function (str) {
    this.ttDateFormat = str;
};

/**
 *  Tries to identify the date represented in a string.  If successful it also
 *  calls this.setDate which moves the calendar to the given date.
 */
Calendar.prototype.parseDate = function(str, fmt) {
    if (!fmt)
        fmt = this.dateFormat;
    this.setDate(Date.parseDate(str, fmt));
};

Calendar.prototype.hideShowCovered = function () {
    if (!Calendar.is_ie && !Calendar.is_opera)
        return;
    function getVisib(obj){
        var value = obj.style.visibility;
        if (!value) {
            if (document.defaultView && typeof (document.defaultView.getComputedStyle) == "function") { // Gecko, W3C
                if (!Calendar.is_khtml)
                    value = document.defaultView.
                        getComputedStyle(obj, "").getPropertyValue("visibility");
                else
                    value = '';
            } else if (obj.currentStyle) { // IE
                value = obj.currentStyle.visibility;
            } else
                value = '';
        }
        return value;
    };

    var tags = new Array("applet", "iframe", "select");
    var el = this.element;

    var p = Calendar.getAbsolutePos(el);
    var EX1 = p.x;
    var EX2 = el.offsetWidth + EX1;
    var EY1 = p.y;
    var EY2 = el.offsetHeight + EY1;

    for (var k = tags.length; k > 0; ) {
        var ar = document.getElementsByTagName(tags[--k]);
        var cc = null;

        for (var i = ar.length; i > 0;) {
            cc = ar[--i];

            p = Calendar.getAbsolutePos(cc);
            var CX1 = p.x;
            var CX2 = cc.offsetWidth + CX1;
            var CY1 = p.y;
            var CY2 = cc.offsetHeight + CY1;

            if (this.hidden || (CX1 > EX2) || (CX2 < EX1) || (CY1 > EY2) || (CY2 < EY1)) {
                if (!cc.__msh_save_visibility) {
                    cc.__msh_save_visibility = getVisib(cc);
                }
                cc.style.visibility = cc.__msh_save_visibility;
            } else {
                if (!cc.__msh_save_visibility) {
                    cc.__msh_save_visibility = getVisib(cc);
                }
                cc.style.visibility = "hidden";
            }
        }
    }
};

/** Internal function; it displays the bar with the names of the weekday. */
Calendar.prototype._displayWeekdays = function () {
    var fdow = this.firstDayOfWeek;
    var cell = this.firstdayname;
    var weekend = Calendar._TT["WEEKEND"];
    for (var i = 0; i < 7; ++i) {
        cell.className = "day name";
        var realday = (i + fdow) % 7;
        if (i) {
            cell.ttip = Calendar._TT["DAY_FIRST"].replace("%s", Calendar._DN[realday]);
            cell.navtype = 100;
            cell.calendar = this;
            cell.fdow = realday;
            Calendar._add_evs(cell);
        }
        if (weekend.indexOf(realday.toString()) != -1) {
            Calendar.addClass(cell, "weekend");
        }
        cell.innerHTML = Calendar._SDN[(i + fdow) % 7];
        cell = cell.nextSibling;
    }
};

/** Internal function.  Hides all combo boxes that might be displayed. */
Calendar.prototype._hideCombos = function () {
    this.monthsCombo.style.display = "none";
    this.yearsCombo.style.display = "none";
};

/** Internal function.  Starts dragging the element. */
Calendar.prototype._dragStart = function (ev) {
    if (this.dragging) {
        return;
    }
    this.dragging = true;
    var posX;
    var posY;
    if (Calendar.is_ie) {
        posY = window.event.clientY + document.body.scrollTop;
        posX = window.event.clientX + document.body.scrollLeft;
    } else {
        posY = ev.clientY + window.scrollY;
        posX = ev.clientX + window.scrollX;
    }
    var st = this.element.style;
    this.xOffs = posX - parseInt(st.left);
    this.yOffs = posY - parseInt(st.top);
    with (Calendar) {
        addEvent(document, "mousemove", calDragIt);
        addEvent(document, "mouseup", calDragEnd);
    }
};

// BEGIN: DATE OBJECT PATCHES

/** Adds the number of days array to the Date object. */
Date._MD = new Array(31,28,31,30,31,30,31,31,30,31,30,31);

/** Constants used for time computations */
Date.SECOND = 1000 /* milliseconds */;
Date.MINUTE = 60 * Date.SECOND;
Date.HOUR   = 60 * Date.MINUTE;
Date.DAY    = 24 * Date.HOUR;
Date.WEEK   =  7 * Date.DAY;

Date.parseDate = function(str, fmt) {
    var today = new CalendarDateObject();
    var y = 0;
    var m = -1;
    var d = 0;

    // translate date into en_US, because split() cannot parse non-latin stuff
    var a = str;
    var i;
    for (i = 0; i < Calendar._MN.length; i++) {
        a = a.replace(Calendar._MN[i], enUS.m.wide[i]);
    }
    for (i = 0; i < Calendar._SMN.length; i++) {
        a = a.replace(Calendar._SMN[i], enUS.m.abbr[i]);
    }
    a = a.replace(Calendar._am, 'am');
    a = a.replace(Calendar._am.toLowerCase(), 'am');
    a = a.replace(Calendar._pm, 'pm');
    a = a.replace(Calendar._pm.toLowerCase(), 'pm');

    a = a.split(/\W+/);

    var b = fmt.match(/%./g);
    var i = 0, j = 0;
    var hr = 0;
    var min = 0;
    for (i = 0; i < a.length; ++i) {
        if (!a[i])
            continue;
        switch (b[i]) {
            case "%d":
            case "%e":
            d = parseInt(a[i], 10);
            break;

            case "%m":
            m = parseInt(a[i], 10) - 1;
            break;

            case "%Y":
            case "%y":
            y = parseInt(a[i], 10);
            (y < 100) && (y += (y > 29) ? 1900 : 2000);
            break;

            case "%b":
            for (j = 0; j < 12; ++j) {
                if (enUS.m.abbr[j].substr(0, a[i].length).toLowerCase() == a[i].toLowerCase()) { m = j; break; }
            }
            break;

            case "%B":
            for (j = 0; j < 12; ++j) {
                if (enUS.m.wide[j].substr(0, a[i].length).toLowerCase() == a[i].toLowerCase()) { m = j; break; }
            }
            break;

            case "%H":
            case "%I":
            case "%k":
            case "%l":
            hr = parseInt(a[i], 10);
            break;

            case "%P":
            case "%p":
            if (/pm/i.test(a[i]) && hr < 12)
                hr += 12;
            else if (/am/i.test(a[i]) && hr >= 12)
                hr -= 12;
            break;

            case "%M":
            min = parseInt(a[i], 10);
            break;
        }
    }
    if (isNaN(y)) y = today.getFullYear();
    if (isNaN(m)) m = today.getMonth();
    if (isNaN(d)) d = today.getDate();
    if (isNaN(hr)) hr = today.getHours();
    if (isNaN(min)) min = today.getMinutes();
    if (y != 0 && m != -1 && d != 0)
        return new CalendarDateObject(y, m, d, hr, min, 0);
    y = 0; m = -1; d = 0;
    for (i = 0; i < a.length; ++i) {
        if (a[i].search(/[a-zA-Z]+/) != -1) {
            var t = -1;
            for (j = 0; j < 12; ++j) {
                if (Calendar._MN[j].substr(0, a[i].length).toLowerCase() == a[i].toLowerCase()) { t = j; break; }
            }
            if (t != -1) {
                if (m != -1) {
                    d = m+1;
                }
                m = t;
            }
        } else if (parseInt(a[i], 10) <= 12 && m == -1) {
            m = a[i]-1;
        } else if (parseInt(a[i], 10) > 31 && y == 0) {
            y = parseInt(a[i], 10);
            (y < 100) && (y += (y > 29) ? 1900 : 2000);
        } else if (d == 0) {
            d = a[i];
        }
    }
    if (y == 0)
        y = today.getFullYear();
    if (m != -1 && d != 0)
        return new CalendarDateObject(y, m, d, hr, min, 0);
    return today;
};

/** Returns the number of days in the current month */
Date.prototype.getMonthDays = function(month) {
    var year = this.getFullYear();
    if (typeof month == "undefined") {
        month = this.getMonth();
    }
    if (((0 == (year%4)) && ( (0 != (year%100)) || (0 == (year%400)))) && month == 1) {
        return 29;
    } else {
        return Date._MD[month];
    }
};

/** Returns the number of day in the year. */
Date.prototype.getDayOfYear = function() {
    var now = new CalendarDateObject(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0);
    var then = new CalendarDateObject(this.getFullYear(), 0, 0, 0, 0, 0);
    var time = now - then;
    return Math.floor(time / Date.DAY);
};

/** Returns the number of the week in year, as defined in ISO 8601. */
Date.prototype.getWeekNumber = function() {
    var d = new CalendarDateObject(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0);
    var DoW = d.getDay();
    d.setDate(d.getDate() - (DoW + 6) % 7 + 3); // Nearest Thu
    var ms = d.valueOf(); // GMT
    d.setMonth(0);
    d.setDate(4); // Thu in Week 1
    return Math.round((ms - d.valueOf()) / (7 * 864e5)) + 1;
};

/** Checks date and time equality */
Date.prototype.equalsTo = function(date) {
    return ((this.getFullYear() == date.getFullYear()) &&
        (this.getMonth() == date.getMonth()) &&
        (this.getDate() == date.getDate()) &&
        (this.getHours() == date.getHours()) &&
        (this.getMinutes() == date.getMinutes()));
};

/** Set only the year, month, date parts (keep existing time) */
Date.prototype.setDateOnly = function(date) {
    var tmp = new CalendarDateObject(date);
    this.setDate(1);
    this.setFullYear(tmp.getFullYear());
    this.setMonth(tmp.getMonth());
    this.setDate(tmp.getDate());
};

/** Prints the date in a string according to the given format. */
Date.prototype.print = function (str) {
    var m = this.getMonth();
    var d = this.getDate();
    var y = this.getFullYear();
    var wn = this.getWeekNumber();
    var w = this.getDay();
    var s = {};
    var hr = this.getHours();
    var pm = (hr >= 12);
    var ir = (pm) ? (hr - 12) : hr;
    var dy = this.getDayOfYear();
    if (ir == 0)
        ir = 12;
    var min = this.getMinutes();
    var sec = this.getSeconds();
    s["%a"] = Calendar._SDN[w]; // abbreviated weekday name [FIXME: I18N]
    s["%A"] = Calendar._DN[w]; // full weekday name
    s["%b"] = Calendar._SMN[m]; // abbreviated month name [FIXME: I18N]
    s["%B"] = Calendar._MN[m]; // full month name
    // FIXME: %c : preferred date and time representation for the current locale
    s["%C"] = 1 + Math.floor(y / 100); // the century number
    s["%d"] = (d < 10) ? ("0" + d) : d; // the day of the month (range 01 to 31)
    s["%e"] = d; // the day of the month (range 1 to 31)
    // FIXME: %D : american date style: %m/%d/%y
    // FIXME: %E, %F, %G, %g, %h (man strftime)
    s["%H"] = (hr < 10) ? ("0" + hr) : hr; // hour, range 00 to 23 (24h format)
    s["%I"] = (ir < 10) ? ("0" + ir) : ir; // hour, range 01 to 12 (12h format)
    s["%j"] = (dy < 100) ? ((dy < 10) ? ("00" + dy) : ("0" + dy)) : dy; // day of the year (range 001 to 366)
    s["%k"] = hr;        // hour, range 0 to 23 (24h format)
    s["%l"] = ir;        // hour, range 1 to 12 (12h format)
    s["%m"] = (m < 9) ? ("0" + (1+m)) : (1+m); // month, range 01 to 12
    s["%M"] = (min < 10) ? ("0" + min) : min; // minute, range 00 to 59
    s["%n"] = "\n";        // a newline character
    s["%p"] = pm ? Calendar._pm.toUpperCase() : Calendar._am.toUpperCase();
    s["%P"] = pm ? Calendar._pm.toLowerCase() : Calendar._am.toLowerCase();
    // FIXME: %r : the time in am/pm notation %I:%M:%S %p
    // FIXME: %R : the time in 24-hour notation %H:%M
    s["%s"] = Math.floor(this.getTime() / 1000);
    s["%S"] = (sec < 10) ? ("0" + sec) : sec; // seconds, range 00 to 59
    s["%t"] = "\t";        // a tab character
    // FIXME: %T : the time in 24-hour notation (%H:%M:%S)
    s["%U"] = s["%W"] = s["%V"] = (wn < 10) ? ("0" + wn) : wn;
    s["%u"] = w + 1;    // the day of the week (range 1 to 7, 1 = MON)
    s["%w"] = w;        // the day of the week (range 0 to 6, 0 = SUN)
    // FIXME: %x : preferred date representation for the current locale without the time
    // FIXME: %X : preferred time representation for the current locale without the date
    s["%y"] = ('' + y).substr(2, 2); // year without the century (range 00 to 99)
    s["%Y"] = y;        // year with the century
    s["%%"] = "%";        // a literal '%' character

    var re = /%./g;
    if (!Calendar.is_ie5 && !Calendar.is_khtml)
        return str.replace(re, function (par) { return s[par] || par; });

    var a = str.match(re);
    for (var i = 0; i < a.length; i++) {
        var tmp = s[a[i]];
        if (tmp) {
            re = new RegExp(a[i], 'g');
            str = str.replace(re, tmp);
        }
    }

    return str;
};

Date.prototype.__msh_oldSetFullYear = Date.prototype.setFullYear;
Date.prototype.setFullYear = function(y) {
    var d = new CalendarDateObject(this);
    d.__msh_oldSetFullYear(y);
    if (d.getMonth() != this.getMonth())
        this.setDate(28);
    this.__msh_oldSetFullYear(y);
};

CalendarDateObject.prototype = new Date();
CalendarDateObject.prototype.constructor = CalendarDateObject;
CalendarDateObject.prototype.parent = Date.prototype;
function CalendarDateObject() {
    var dateObj;
    if (arguments.length > 1) {
        dateObj = eval("new this.parent.constructor("+Array.prototype.slice.call(arguments).join(",")+");");
    } else if (arguments.length > 0) {
        dateObj = new this.parent.constructor(arguments[0]);
    } else {
        dateObj = new this.parent.constructor();
        if (typeof(CalendarDateObject._SERVER_TIMZEONE_SECONDS) != "undefined") {
            dateObj.setTime((CalendarDateObject._SERVER_TIMZEONE_SECONDS + dateObj.getTimezoneOffset()*60)*1000);
        }
    }
    return dateObj;
}

// END: DATE OBJECT PATCHES


// global object that remembers the calendar
window._dynarch_popupCalendar = null;

/*  Copyright Mihai Bazon, 2002, 2003  |  http://dynarch.com/mishoo/
 * ---------------------------------------------------------------------------
 *
 * The DHTML Calendar
 *
 * Details and latest version at:
 * http://dynarch.com/mishoo/calendar.epl
 *
 * This script is distributed under the GNU Lesser General Public License.
 * Read the entire license text here: http://www.gnu.org/licenses/lgpl.html
 *
 * This file defines helper functions for setting up the calendar.  They are
 * intended to help non-programmers get a working calendar on their site
 * quickly.  This script should not be seen as part of the calendar.  It just
 * shows you what one can do with the calendar, while in the same time
 * providing a quick and simple method for setting it up.  If you need
 * exhaustive customization of the calendar creation process feel free to
 * modify this code to suit your needs (this is recommended and much better
 * than modifying calendar.js itself).
 */
Calendar.setup=function(params){function param_default(pname,def){if(typeof params[pname]=="undefined"){params[pname]=def;}};param_default("inputField",null);param_default("displayArea",null);param_default("button",null);param_default("eventName","click");param_default("ifFormat","%Y/%m/%d");param_default("daFormat","%Y/%m/%d");param_default("singleClick",true);param_default("disableFunc",null);param_default("dateStatusFunc",params["disableFunc"]);param_default("dateText",null);param_default("firstDay",null);param_default("align","Br");param_default("range",[1900,2999]);param_default("weekNumbers",true);param_default("flat",null);param_default("flatCallback",null);param_default("onSelect",null);param_default("onClose",null);param_default("onUpdate",null);param_default("date",null);param_default("showsTime",false);param_default("timeFormat","24");param_default("electric",true);param_default("step",2);param_default("position",null);param_default("cache",false);param_default("showOthers",false);param_default("multiple",null);var tmp=["inputField","displayArea","button"];for(var i in tmp){if(typeof params[tmp[i]]=="string"){params[tmp[i]]=document.getElementById(params[tmp[i]]);}}if(!(params.flat||params.multiple||params.inputField||params.displayArea||params.button)){alert("Calendar.setup:\n  Nothing to setup (no fields found).  Please check your code");return false;}function onSelect(cal){var p=cal.params;var update=(cal.dateClicked||p.electric);if(update&&p.inputField){p.inputField.value=cal.date.print(p.ifFormat);if(typeof p.inputField.onchange=="function")p.inputField.onchange();if(typeof fireEvent == 'function')fireEvent(p.inputField, "change");}if(update&&p.displayArea)p.displayArea.innerHTML=cal.date.print(p.daFormat);if(update&&typeof p.onUpdate=="function")p.onUpdate(cal);if(update&&p.flat){if(typeof p.flatCallback=="function")p.flatCallback(cal);}if(update&&p.singleClick&&cal.dateClicked)cal.callCloseHandler();};if(params.flat!=null){if(typeof params.flat=="string")params.flat=document.getElementById(params.flat);if(!params.flat){alert("Calendar.setup:\n  Flat specified but can't find parent.");return false;}var cal=new Calendar(params.firstDay,params.date,params.onSelect||onSelect);cal.showsOtherMonths=params.showOthers;cal.showsTime=params.showsTime;cal.time24=(params.timeFormat=="24");cal.params=params;cal.weekNumbers=params.weekNumbers;cal.setRange(params.range[0],params.range[1]);cal.setDateStatusHandler(params.dateStatusFunc);cal.getDateText=params.dateText;if(params.ifFormat){cal.setDateFormat(params.ifFormat);}if(params.inputField&&typeof params.inputField.value=="string"){cal.parseDate(params.inputField.value);}cal.create(params.flat);cal.show();return false;}var triggerEl=params.button||params.displayArea||params.inputField;triggerEl["on"+params.eventName]=function(){var dateEl=params.inputField||params.displayArea;var dateFmt=params.inputField?params.ifFormat:params.daFormat;var mustCreate=false;var cal=window.calendar;if(dateEl)params.date=Date.parseDate(dateEl.value||dateEl.innerHTML,dateFmt);if(!(cal&&params.cache)){window.calendar=cal=new Calendar(params.firstDay,params.date,params.onSelect||onSelect,params.onClose||function(cal){cal.hide();});cal.showsTime=params.showsTime;cal.time24=(params.timeFormat=="24");cal.weekNumbers=params.weekNumbers;mustCreate=true;}else{if(params.date)cal.setDate(params.date);cal.hide();}if(params.multiple){cal.multiple={};for(var i=params.multiple.length;--i>=0;){var d=params.multiple[i];var ds=d.print("%Y%m%d");cal.multiple[ds]=d;}}cal.showsOtherMonths=params.showOthers;cal.yearStep=params.step;cal.setRange(params.range[0],params.range[1]);cal.params=params;cal.setDateStatusHandler(params.dateStatusFunc);cal.getDateText=params.dateText;cal.setDateFormat(dateFmt);if(mustCreate)cal.create();cal.refresh();if(!params.position)cal.showAtElement(params.button||params.displayArea||params.inputField,params.align);else cal.showAt(params.position[0],params.position[1]);return false;};return cal;};
/*
 * Ext JS Library 1.0.1
 * Copyright(c) 2006-2007, Ext JS, LLC.
 * licensing@extjs.com
 *
 * http://www.extjs.com/license
 */

Ext={};window["undefined"]=window["undefined"];Ext.apply=function(o,c,_3){if(_3){Ext.apply(o,_3);}if(o&&c&&typeof c=="object"){for(var p in c){o[p]=c[p];}}return o;};(function(){var _5=0;var ua=navigator.userAgent.toLowerCase();var _7=document.compatMode=="CSS1Compat",_8=ua.indexOf("opera")>-1,_9=(/webkit|khtml/).test(ua),_a=ua.indexOf("msie")>-1,_b=ua.indexOf("msie 7")>-1,_c=!_9&&ua.indexOf("gecko")>-1,_d=_a&&!_7,_e=(ua.indexOf("windows")!=-1||ua.indexOf("win32")!=-1),_f=(ua.indexOf("macintosh")!=-1||ua.indexOf("mac os x")!=-1),_10=window.location.href.toLowerCase().indexOf("https")===0;if(_a&&!_b){try{document.execCommand("BackgroundImageCache",false,true);}catch(e){}}Ext.apply(Ext,{isStrict:_7,isSecure:_10,isReady:false,SSL_SECURE_URL:"javascript:false",BLANK_IMAGE_URL:"http:/"+"/extjs.com/s.gif",emptyFn:function(){},applyIf:function(o,c){if(o&&c){for(var p in c){if(typeof o[p]=="undefined"){o[p]=c[p];}}}return o;},addBehaviors:function(o){if(!Ext.isReady){Ext.onReady(function(){Ext.addBehaviors(o);});return;}var _15={};for(var b in o){var _17=b.split("@");if(_17[1]){var s=_17[0];if(!_15[s]){_15[s]=Ext.select(s);}_15[s].on(_17[1],o[b]);}}_15=null;},id:function(el,_1a){_1a=_1a||"ext-gen";el=Ext.getDom(el);var id=_1a+(++_5);return el?(el.id?el.id:(el.id=id)):id;},extend:function(){var io=function(o){for(var m in o){this[m]=o[m];}};return function(sb,sp,_21){if(typeof sp=="object"){_21=sp;sp=sb;sb=function(){sp.apply(this,arguments);};}var F=function(){},sbp,spp=sp.prototype;F.prototype=spp;sbp=sb.prototype=new F();sbp.constructor=sb;sb.superclass=spp;if(spp.constructor==Object.prototype.constructor){spp.constructor=sp;}sb.override=function(o){Ext.override(sb,o);};sbp.override=io;sbp.__extcls=sb;Ext.override(sb,_21);return sb;};}(),override:function(_26,_27){if(_27){var p=_26.prototype;for(var _29 in _27){p[_29]=_27[_29];}}},namespace:function(){var a=arguments,o=null,i,j,d,rt;for(i=0;i<a.length;++i){d=a[i].split(".");rt=d[0];eval("if (typeof "+rt+" == \"undefined\"){"+rt+" = {};} o = "+rt+";");for(j=1;j<d.length;++j){o[d[j]]=o[d[j]]||{};o=o[d[j]];}}},urlEncode:function(o){if(!o){return "";}var buf=[];for(var key in o){var ov=o[key];var _34=typeof ov;if(_34=="undefined"){buf.push(encodeURIComponent(key),"=&");}else{if(_34!="function"&&_34!="object"){buf.push(encodeURIComponent(key),"=",encodeURIComponent(ov),"&");}else{if(ov instanceof Array){for(var i=0,len=ov.length;i<len;i++){buf.push(encodeURIComponent(key),"=",encodeURIComponent(ov[i]===undefined?"":ov[i]),"&");}}}}}buf.pop();return buf.join("");},urlDecode:function(_37,_38){if(!_37||!_37.length){return {};}var obj={};var _3a=_37.split("&");var _3b,_3c,_3d;for(var i=0,len=_3a.length;i<len;i++){_3b=_3a[i].split("=");_3c=decodeURIComponent(_3b[0]);_3d=decodeURIComponent(_3b[1]);if(_38!==true){if(typeof obj[_3c]=="undefined"){obj[_3c]=_3d;}else{if(typeof obj[_3c]=="string"){obj[_3c]=[obj[_3c]];obj[_3c].push(_3d);}else{obj[_3c].push(_3d);}}}else{obj[_3c]=_3d;}}return obj;},each:function(_40,fn,_42){if(typeof _40.length=="undefined"||typeof _40=="string"){_40=[_40];}for(var i=0,len=_40.length;i<len;i++){if(fn.call(_42||_40[i],_40[i],i,_40)===false){return i;}}},combine:function(){var as=arguments,l=as.length,r=[];for(var i=0;i<l;i++){var a=as[i];if(a instanceof Array){r=r.concat(a);}else{if(a.length!==undefined&&!a.substr){r=r.concat(Array.prototype.slice.call(a,0));}else{r.push(a);}}}return r;},escapeRe:function(s){return s.replace(/([.*+?^${}()|[\]\/\\])/g,"\\$1");},callback:function(cb,_4c,_4d,_4e){if(typeof cb=="function"){if(_4e){cb.defer(_4e,_4c,_4d||[]);}else{cb.apply(_4c,_4d||[]);}}},getDom:function(el){if(!el){return null;}return el.dom?el.dom:(typeof el=="string"?document.getElementById(el):el);},getCmp:function(id){return Ext.ComponentMgr.get(id);},num:function(v,_52){if(typeof v!="number"){return _52;}return v;},destroy:function(){for(var i=0,a=arguments,len=a.length;i<len;i++){var as=a[i];if(as){if(as.dom){as.removeAllListeners();as.remove();continue;}if(typeof as.purgeListeners=="function"){as.purgeListeners();}if(typeof as.destroy=="function"){as.destroy();}}}},isOpera:_8,isSafari:_9,isIE:_a,isIE7:_b,isGecko:_c,isBorderBox:_d,isWindows:_e,isMac:_f,useShims:((_a&&!_b)||(_c&&_f))});})();Ext.namespace("Ext","Ext.util","Ext.grid","Ext.dd","Ext.tree","Ext.data","Ext.form","Ext.menu","Ext.state","Ext.lib","Ext.layout");Ext.apply(Function.prototype,{createCallback:function(){var _57=arguments;var _58=this;return function(){return _58.apply(window,_57);};},createDelegate:function(obj,_5a,_5b){var _5c=this;return function(){var _5d=_5a||arguments;if(_5b===true){_5d=Array.prototype.slice.call(arguments,0);_5d=_5d.concat(_5a);}else{if(typeof _5b=="number"){_5d=Array.prototype.slice.call(arguments,0);var _5e=[_5b,0].concat(_5a);Array.prototype.splice.apply(_5d,_5e);}}return _5c.apply(obj||window,_5d);};},defer:function(_5f,obj,_61,_62){var fn=this.createDelegate(obj,_61,_62);if(_5f){return setTimeout(fn,_5f);}fn();return 0;},createSequence:function(fcn,_65){if(typeof fcn!="function"){return this;}var _66=this;return function(){var _67=_66.apply(this||window,arguments);fcn.apply(_65||this||window,arguments);return _67;};},createInterceptor:function(fcn,_69){if(typeof fcn!="function"){return this;}var _6a=this;return function(){fcn.target=this;fcn.method=_6a;if(fcn.apply(_69||this||window,arguments)===false){return;}return _6a.apply(this||window,arguments);};}});Ext.applyIf(String,{escape:function(_6b){return _6b.replace(/('|\\)/g,"\\$1");},leftPad:function(val,_6d,ch){var _6f=new String(val);if(ch==null){ch=" ";}while(_6f.length<_6d){_6f=ch+_6f;}return _6f;},format:function(_70){var _71=Array.prototype.slice.call(arguments,1);return _70.replace(/\{(\d+)\}/g,function(m,i){return _71[i];});}});String.prototype.toggle=function(_74,_75){return this==_74?_75:_74;};Ext.applyIf(Number.prototype,{constrain:function(min,max){return Math.min(Math.max(this,min),max);}});Ext.applyIf(Array.prototype,{indexOf:function(o){for(var i=0,len=this.length;i<len;i++){if(this[i]==o){return i;}}return -1;},remove:function(o){var _7c=this.indexOf(o);if(_7c!=-1){this.splice(_7c,1);}}});Date.prototype.getElapsed=function(_7d){return Math.abs((_7d||new Date()).getTime()-this.getTime());};



(function(){var _1;Ext.lib.Dom={getViewWidth:function(_2){return _2?this.getDocumentWidth():this.getViewportWidth();},getViewHeight:function(_3){return _3?this.getDocumentHeight():this.getViewportHeight();},getDocumentHeight:function(){var _4=(document.compatMode!="CSS1Compat")?document.body.scrollHeight:document.documentElement.scrollHeight;return Math.max(_4,this.getViewportHeight());},getDocumentWidth:function(){var _5=(document.compatMode!="CSS1Compat")?document.body.scrollWidth:document.documentElement.scrollWidth;return Math.max(_5,this.getViewportWidth());},getViewportHeight:function(){var _6=self.innerHeight;var _7=document.compatMode;if((_7||Ext.isIE)&&!Ext.isOpera){_6=(_7=="CSS1Compat")?document.documentElement.clientHeight:document.body.clientHeight;}return _6;},getViewportWidth:function(){var _8=self.innerWidth;var _9=document.compatMode;if(_9||Ext.isIE){_8=(_9=="CSS1Compat")?document.documentElement.clientWidth:document.body.clientWidth;}return _8;},isAncestor:function(p,c){p=Ext.getDom(p);c=Ext.getDom(c);if(!p||!c){return false;}if(p.contains&&!Ext.isSafari){return p.contains(c);}else{if(p.compareDocumentPosition){return !!(p.compareDocumentPosition(c)&16);}else{var _c=c.parentNode;while(_c){if(_c==p){return true;}else{if(!_c.tagName||_c.tagName.toUpperCase()=="HTML"){return false;}}_c=_c.parentNode;}return false;}}},getRegion:function(el){return Ext.lib.Region.getRegion(el);},getY:function(el){return this.getXY(el)[1];},getX:function(el){return this.getXY(el)[0];},getXY:function(el){var p,pe,b,_14,bd=document.body;el=Ext.getDom(el);if(el.getBoundingClientRect){b=el.getBoundingClientRect();_14=fly(document).getScroll();return [b.left+_14.left,b.top+_14.top];}else{var x=el.offsetLeft,y=el.offsetTop;p=el.offsetParent;var _18=false;if(p!=el){while(p){x+=p.offsetLeft;y+=p.offsetTop;if(Ext.isSafari&&!_18&&fly(p).getStyle("position")=="absolute"){_18=true;}if(Ext.isGecko){pe=fly(p);var bt=parseInt(pe.getStyle("borderTopWidth"),10)||0;var bl=parseInt(pe.getStyle("borderLeftWidth"),10)||0;x+=bl;y+=bt;if(p!=el&&pe.getStyle("overflow")!="visible"){x+=bl;y+=bt;}}p=p.offsetParent;}}if(Ext.isSafari&&(_18||fly(el).getStyle("position")=="absolute")){x-=bd.offsetLeft;y-=bd.offsetTop;}}p=el.parentNode;while(p&&p!=bd){if(!Ext.isOpera||(Ext.isOpera&&p.tagName!="TR"&&fly(p).getStyle("display")!="inline")){x-=p.scrollLeft;y-=p.scrollTop;}p=p.parentNode;}return [x,y];},setXY:function(el,xy){el=Ext.fly(el,"_setXY");el.position();var pts=el.translatePoints(xy);if(xy[0]!==false){el.dom.style.left=pts.left+"px";}if(xy[1]!==false){el.dom.style.top=pts.top+"px";}},setX:function(el,x){this.setXY(el,[x,false]);},setY:function(el,y){this.setXY(el,[false,y]);}};Ext.lib.Event={getPageX:function(e){return Event.pointerX(e.browserEvent||e);},getPageY:function(e){return Event.pointerY(e.browserEvent||e);},getXY:function(e){e=e.browserEvent||e;return [Event.pointerX(e),Event.pointerY(e)];},getTarget:function(e){return Event.element(e.browserEvent||e);},resolveTextNode:function(_26){if(_26&&3==_26.nodeType){return _26.parentNode;}else{return _26;}},getRelatedTarget:function(ev){ev=ev.browserEvent||ev;var t=ev.relatedTarget;if(!t){if(ev.type=="mouseout"){t=ev.toElement;}else{if(ev.type=="mouseover"){t=ev.fromElement;}}}return this.resolveTextNode(t);},on:function(el,_2a,fn){Event.observe(el,_2a,fn,false);},un:function(el,_2d,fn){Event.stopObserving(el,_2d,fn,false);},purgeElement:function(el){},preventDefault:function(e){e=e.browserEvent||e;if(e.preventDefault){e.preventDefault();}else{e.returnValue=false;}},stopPropagation:function(e){e=e.browserEvent||e;if(e.stopPropagation){e.stopPropagation();}else{e.cancelBubble=true;}},stopEvent:function(e){Event.stop(e.browserEvent||e);},onAvailable:function(el,fn,_35,_36){var _37=new Date(),iid;var f=function(){if(_37.getElapsed()>10000){clearInterval(iid);}var el=document.getElementById(id);if(el){clearInterval(iid);fn.call(_35||window,el);}};iid=setInterval(f,50);}};Ext.lib.Ajax=function(){var _3b=function(cb){return cb.success?function(xhr){cb.success.call(cb.scope||window,{responseText:xhr.responseText,responseXML:xhr.responseXML,argument:cb.argument});}:Ext.emptyFn;};var _3e=function(cb){return cb.failure?function(xhr){cb.failure.call(cb.scope||window,{responseText:xhr.responseText,responseXML:xhr.responseXML,argument:cb.argument});}:Ext.emptyFn;};return {request:function(_41,uri,cb,_44){new Ajax.Request(uri,{method:_41,parameters:_44||"",timeout:cb.timeout,onSuccess:_3b(cb),onFailure:_3e(cb)});},formRequest:function(_45,uri,cb,_48,_49,_4a){new Ajax.Request(uri,{method:Ext.getDom(_45).method||"POST",parameters:Form.serialize(_45)+(_48?"&"+_48:""),timeout:cb.timeout,onSuccess:_3b(cb),onFailure:_3e(cb)});},isCallInProgress:function(_4b){return false;},abort:function(_4c){return false;},serializeForm:function(_4d){return Form.serialize(_4d.dom||_4d,true);}};}();Ext.lib.Anim=function(){var _4e={easeOut:function(pos){return 1-Math.pow(1-pos,2);},easeIn:function(pos){return 1-Math.pow(1-pos,2);}};var _51=function(cb,_53){return {stop:function(_54){this.effect.cancel();},isAnimated:function(){return this.effect.state=="running";},proxyCallback:function(){Ext.callback(cb,_53);}};};return {scroll:function(el,_56,_57,_58,cb,_5a){var _5b=_51(cb,_5a);el=Ext.getDom(el);el.scrollLeft=_56.to[0];el.scrollTop=_56.to[1];_5b.proxyCallback();return _5b;},motion:function(el,_5d,_5e,_5f,cb,_61){return this.run(el,_5d,_5e,_5f,cb,_61);},color:function(el,_63,_64,_65,cb,_67){return this.run(el,_63,_64,_65,cb,_67);},run:function(el,_69,_6a,_6b,cb,_6d,_6e){var o={};for(var k in _69){switch(k){case "points":var by,pts,e=Ext.fly(el,"_animrun");e.position();if(by=_69.points.by){var xy=e.getXY();pts=e.translatePoints([xy[0]+by[0],xy[1]+by[1]]);}else{pts=e.translatePoints(_69.points.to);}o.left=pts.left+"px";o.top=pts.top+"px";break;case "width":o.width=_69.width.to+"px";break;case "height":o.height=_69.height.to+"px";break;case "opacity":o.opacity=String(_69.opacity.to);break;default:o[k]=String(_69[k].to);break;}}var _75=_51(cb,_6d);_75.effect=new Effect.Morph(Ext.id(el),{duration:_6a,afterFinish:_75.proxyCallback,transition:_4e[_6b]||Effect.Transitions.linear,style:o});return _75;}};}();function fly(el){if(!_1){_1=new Ext.Element.Flyweight();}_1.dom=el;return _1;}Ext.lib.Region=function(t,r,b,l){this.top=t;this[1]=t;this.right=r;this.bottom=b;this.left=l;this[0]=l;};Ext.lib.Region.prototype={contains:function(_7b){return (_7b.left>=this.left&&_7b.right<=this.right&&_7b.top>=this.top&&_7b.bottom<=this.bottom);},getArea:function(){return ((this.bottom-this.top)*(this.right-this.left));},intersect:function(_7c){var t=Math.max(this.top,_7c.top);var r=Math.min(this.right,_7c.right);var b=Math.min(this.bottom,_7c.bottom);var l=Math.max(this.left,_7c.left);if(b>=t&&r>=l){return new Ext.lib.Region(t,r,b,l);}else{return null;}},union:function(_81){var t=Math.min(this.top,_81.top);var r=Math.max(this.right,_81.right);var b=Math.max(this.bottom,_81.bottom);var l=Math.min(this.left,_81.left);return new Ext.lib.Region(t,r,b,l);},adjust:function(t,l,b,r){this.top+=t;this.left+=l;this.right+=r;this.bottom+=b;return this;}};Ext.lib.Region.getRegion=function(el){var p=Ext.lib.Dom.getXY(el);var t=p[1];var r=p[0]+el.offsetWidth;var b=p[1]+el.offsetHeight;var l=p[0];return new Ext.lib.Region(t,r,b,l);};Ext.lib.Point=function(x,y){if(x instanceof Array){y=x[1];x=x[0];}this.x=this.right=this.left=this[0]=x;this.y=this.top=this.bottom=this[1]=y;};Ext.lib.Point.prototype=new Ext.lib.Region();if(Ext.isIE){Event.observe(window,"unload",function(){var p=Function.prototype;delete p.createSequence;delete p.defer;delete p.createDelegate;delete p.createCallback;delete p.createInterceptor;});}})();



Ext.DomHelper=function(){var _1=null;var _2=/^(?:br|frame|hr|img|input|link|meta|range|spacer|wbr|area|param|col)$/i;var _3=function(o){if(typeof o=="string"){return o;}var b="";if(!o.tag){o.tag="div";}b+="<"+o.tag;for(var _6 in o){if(_6=="tag"||_6=="children"||_6=="cn"||_6=="html"||typeof o[_6]=="function"){continue;}if(_6=="style"){var s=o["style"];if(typeof s=="function"){s=s.call();}if(typeof s=="string"){b+=" style=\""+s+"\"";}else{if(typeof s=="object"){b+=" style=\"";for(var _8 in s){if(typeof s[_8]!="function"){b+=_8+":"+s[_8]+";";}}b+="\"";}}}else{if(_6=="cls"){b+=" class=\""+o["cls"]+"\"";}else{if(_6=="htmlFor"){b+=" for=\""+o["htmlFor"]+"\"";}else{b+=" "+_6+"=\""+o[_6]+"\"";}}}}if(_2.test(o.tag)){b+="/>";}else{b+=">";var cn=o.children||o.cn;if(cn){if(cn instanceof Array){for(var i=0,_b=cn.length;i<_b;i++){b+=_3(cn[i],b);}}else{b+=_3(cn,b);}}if(o.html){b+=o.html;}b+="</"+o.tag+">";}return b;};var _c=function(o,_e){var el=document.createElement(o.tag);var _10=el.setAttribute?true:false;for(var _11 in o){if(_11=="tag"||_11=="children"||_11=="cn"||_11=="html"||_11=="style"||typeof o[_11]=="function"){continue;}if(_11=="cls"){el.className=o["cls"];}else{if(_10){el.setAttribute(_11,o[_11]);}else{el[_11]=o[_11];}}}Ext.DomHelper.applyStyles(el,o.style);var cn=o.children||o.cn;if(cn){if(cn instanceof Array){for(var i=0,len=cn.length;i<len;i++){_c(cn[i],el);}}else{_c(cn,el);}}if(o.html){el.innerHTML=o.html;}if(_e){_e.appendChild(el);}return el;};var _15=function(_16,s,h,e){_1.innerHTML=[s,h,e].join("");var i=-1,el=_1;while(++i<_16){el=el.firstChild;}return el;};var ts="<table>",te="</table>",tbs=ts+"<tbody>",tbe="</tbody>"+te,trs=tbs+"<tr>",tre="</tr>"+tbe;var _22=function(tag,_24,el,_26){if(!_1){_1=document.createElement("div");}var _27;var _28=null;if(tag=="td"){if(_24=="afterbegin"||_24=="beforeend"){return;}if(_24=="beforebegin"){_28=el;el=el.parentNode;}else{_28=el.nextSibling;el=el.parentNode;}_27=_15(4,trs,_26,tre);}else{if(tag=="tr"){if(_24=="beforebegin"){_28=el;el=el.parentNode;_27=_15(3,tbs,_26,tbe);}else{if(_24=="afterend"){_28=el.nextSibling;el=el.parentNode;_27=_15(3,tbs,_26,tbe);}else{if(_24=="afterbegin"){_28=el.firstChild;}_27=_15(4,trs,_26,tre);}}}else{if(tag=="tbody"){if(_24=="beforebegin"){_28=el;el=el.parentNode;_27=_15(2,ts,_26,te);}else{if(_24=="afterend"){_28=el.nextSibling;el=el.parentNode;_27=_15(2,ts,_26,te);}else{if(_24=="afterbegin"){_28=el.firstChild;}_27=_15(3,tbs,_26,tbe);}}}else{if(_24=="beforebegin"||_24=="afterend"){return;}if(_24=="afterbegin"){_28=el.firstChild;}_27=_15(2,ts,_26,te);}}}el.insertBefore(_27,_28);return _27;};return {useDom:false,markup:function(o){return _3(o);},applyStyles:function(el,_2b){if(_2b){el=Ext.fly(el);if(typeof _2b=="string"){var re=/\s?([a-z\-]*)\:\s?([^;]*);?/gi;var _2d;while((_2d=re.exec(_2b))!=null){el.setStyle(_2d[1],_2d[2]);}}else{if(typeof _2b=="object"){for(var _2e in _2b){el.setStyle(_2e,_2b[_2e]);}}else{if(typeof _2b=="function"){Ext.DomHelper.applyStyles(el,_2b.call());}}}}},insertHtml:function(_2f,el,_31){_2f=_2f.toLowerCase();if(el.insertAdjacentHTML){var tag=el.tagName.toLowerCase();if(tag=="table"||tag=="tbody"||tag=="tr"||tag=="td"){var rs;if(rs=_22(tag,_2f,el,_31)){return rs;}}switch(_2f){case "beforebegin":el.insertAdjacentHTML(_2f,_31);return el.previousSibling;case "afterbegin":el.insertAdjacentHTML(_2f,_31);return el.firstChild;case "beforeend":el.insertAdjacentHTML(_2f,_31);return el.lastChild;case "afterend":el.insertAdjacentHTML(_2f,_31);return el.nextSibling;}throw "Illegal insertion point -> \""+_2f+"\"";}var _34=el.ownerDocument.createRange();var _35;switch(_2f){case "beforebegin":_34.setStartBefore(el);_35=_34.createContextualFragment(_31);el.parentNode.insertBefore(_35,el);return el.previousSibling;case "afterbegin":if(el.firstChild){_34.setStartBefore(el.firstChild);_35=_34.createContextualFragment(_31);el.insertBefore(_35,el.firstChild);return el.firstChild;}else{el.innerHTML=_31;return el.firstChild;}case "beforeend":if(el.lastChild){_34.setStartAfter(el.lastChild);_35=_34.createContextualFragment(_31);el.appendChild(_35);return el.lastChild;}else{el.innerHTML=_31;return el.lastChild;}case "afterend":_34.setStartAfter(el);_35=_34.createContextualFragment(_31);el.parentNode.insertBefore(_35,el.nextSibling);return el.nextSibling;}throw "Illegal insertion point -> \""+_2f+"\"";},insertBefore:function(el,o,_38){return this.doInsert(el,o,_38,"beforeBegin");},insertAfter:function(el,o,_3b){return this.doInsert(el,o,_3b,"afterEnd","nextSibling");},insertFirst:function(el,o,_3e){return this.doInsert(el,o,_3e,"afterBegin");},doInsert:function(el,o,_41,pos,_43){el=Ext.getDom(el);var _44;if(this.useDom){_44=_c(o,null);el.parentNode.insertBefore(_44,_43?el[_43]:el);}else{var _45=_3(o);_44=this.insertHtml(pos,el,_45);}return _41?Ext.get(_44,true):_44;},append:function(el,o,_48){el=Ext.getDom(el);var _49;if(this.useDom){_49=_c(o,null);el.appendChild(_49);}else{var _4a=_3(o);_49=this.insertHtml("beforeEnd",el,_4a);}return _48?Ext.get(_49,true):_49;},overwrite:function(el,o,_4d){el=Ext.getDom(el);el.innerHTML=_3(o);return _4d?Ext.get(el.firstChild,true):el.firstChild;},createTemplate:function(o){var _4f=_3(o);return new Ext.Template(_4f);}};}();



Ext.Template=function(_1){if(_1 instanceof Array){_1=_1.join("");}else{if(arguments.length>1){_1=Array.prototype.join.call(arguments,"");}}this.html=_1;};Ext.Template.prototype={applyTemplate:function(_2){if(this.compiled){return this.compiled(_2);}var _3=this.disableFormats!==true;var fm=Ext.util.Format,_5=this;var fn=function(m,_8,_9,_a){if(_9&&_3){if(_9.substr(0,5)=="this."){return _5.call(_9.substr(5),_2[_8]);}else{if(_a){var re=/^\s*['"](.*)["']\s*$/;_a=_a.split(",");for(var i=0,_d=_a.length;i<_d;i++){_a[i]=_a[i].replace(re,"$1");}_a=[_2[_8]].concat(_a);}else{_a=[_2[_8]];}return fm[_9].apply(fm,_a);}}else{return _2[_8]!==undefined?_2[_8]:"";}};return this.html.replace(this.re,fn);},set:function(_e,_f){this.html=_e;this.compiled=null;if(_f){this.compile();}return this;},disableFormats:false,re:/\{([\w-]+)(?:\:([\w\.]*)(?:\((.*?)?\))?)?\}/g,compile:function(){var fm=Ext.util.Format;var _11=this.disableFormats!==true;var sep=Ext.isGecko?"+":",";var fn=function(m,_15,_16,_17){if(_16&&_11){_17=_17?","+_17:"";if(_16.substr(0,5)!="this."){_16="fm."+_16+"(";}else{_16="this.call(\""+_16.substr(5)+"\", ";_17="";}}else{_17="",_16="(values['"+_15+"'] == undefined ? '' : ";}return "'"+sep+_16+"values['"+_15+"']"+_17+")"+sep+"'";};var _18;if(Ext.isGecko){_18="this.compiled = function(values){ return '"+this.html.replace(/(\r\n|\n)/g,"\\n").replace("'","\\'").replace(this.re,fn)+"';};";}else{_18=["this.compiled = function(values){ return ['"];_18.push(this.html.replace(/(\r\n|\n)/g,"\\n").replace("'","\\'").replace(this.re,fn));_18.push("'].join('');};");_18=_18.join("");}eval(_18);return this;},call:function(_19,_1a){return this[_19](_1a);},insertFirst:function(el,_1c,_1d){return this.doInsert("afterBegin",el,_1c,_1d);},insertBefore:function(el,_1f,_20){return this.doInsert("beforeBegin",el,_1f,_20);},insertAfter:function(el,_22,_23){return this.doInsert("afterEnd",el,_22,_23);},append:function(el,_25,_26){return this.doInsert("beforeEnd",el,_25,_26);},doInsert:function(_27,el,_29,_2a){el=Ext.getDom(el);var _2b=Ext.DomHelper.insertHtml(_27,el,this.applyTemplate(_29));return _2a?Ext.get(_2b,true):_2b;},overwrite:function(el,_2d,_2e){el=Ext.getDom(el);el.innerHTML=this.applyTemplate(_2d);return _2e?Ext.get(el.firstChild,true):el.firstChild;}};Ext.Template.prototype.apply=Ext.Template.prototype.applyTemplate;Ext.DomHelper.Template=Ext.Template;Ext.Template.from=function(el){el=Ext.getDom(el);return new Ext.Template(el.value||el.innerHTML);};Ext.MasterTemplate=function(){Ext.MasterTemplate.superclass.constructor.apply(this,arguments);this.originalHtml=this.html;var st={};var m,re=this.subTemplateRe;re.lastIndex=0;var _33=0;while(m=re.exec(this.html)){var _34=m[1],_35=m[2];st[_33]={name:_34,index:_33,buffer:[],tpl:new Ext.Template(_35)};if(_34){st[_34]=st[_33];}st[_33].tpl.compile();st[_33].tpl.call=this.call.createDelegate(this);_33++;}this.subCount=_33;this.subs=st;};Ext.extend(Ext.MasterTemplate,Ext.Template,{subTemplateRe:/<tpl(?:\sname="([\w-]+)")?>((?:.|\n)*?)<\/tpl>/gi,add:function(_36,_37){if(arguments.length==1){_37=arguments[0];_36=0;}var s=this.subs[_36];s.buffer[s.buffer.length]=s.tpl.apply(_37);return this;},fill:function(_39,_3a,_3b){var a=arguments;if(a.length==1||(a.length==2&&typeof a[1]=="boolean")){_3a=a[0];_39=0;_3b=a[1];}if(_3b){this.reset();}for(var i=0,len=_3a.length;i<len;i++){this.add(_39,_3a[i]);}return this;},reset:function(){var s=this.subs;for(var i=0;i<this.subCount;i++){s[i].buffer=[];}return this;},applyTemplate:function(_41){var s=this.subs;var _43=-1;this.html=this.originalHtml.replace(this.subTemplateRe,function(m,_45){return s[++_43].buffer.join("");});return Ext.MasterTemplate.superclass.applyTemplate.call(this,_41);},apply:function(){return this.applyTemplate.apply(this,arguments);},compile:function(){return this;}});Ext.MasterTemplate.prototype.addAll=Ext.MasterTemplate.prototype.fill;Ext.MasterTemplate.from=function(el){el=Ext.getDom(el);return new Ext.MasterTemplate(el.value||el.innerHTML);};



Ext.DomQuery=function(){var _1={},_2={},_3={};var _4=/\S/;var _5=/^\s+|\s+$/g;var _6=/\{(\d+)\}/g;var _7=/^(\s?[\/>]\s?|\s|$)/;var _8=/^(#)?([\w-\*]+)/;function child(p,_a){var i=0;var n=p.firstChild;while(n){if(n.nodeType==1){if(++i==_a){return n;}}n=n.nextSibling;}return null;}function next(n){while((n=n.nextSibling)&&n.nodeType!=1){}return n;}function prev(n){while((n=n.previousSibling)&&n.nodeType!=1){}return n;}function clean(d){var n=d.firstChild,ni=-1;while(n){var nx=n.nextSibling;if(n.nodeType==3&&!_4.test(n.nodeValue)){d.removeChild(n);}else{n.nodeIndex=++ni;}n=nx;}return this;}function byClassName(c,a,v,re,cn){if(!v){return c;}var r=[];for(var i=0,ci;ci=c[i];i++){cn=ci.className;if(cn&&(" "+cn+" ").indexOf(v)!=-1){r[r.length]=ci;}}return r;}function attrValue(n,_1c){if(!n.tagName&&typeof n.length!="undefined"){n=n[0];}if(!n){return null;}if(_1c=="for"){return n.htmlFor;}if(_1c=="class"||_1c=="className"){return n.className;}return n.getAttribute(_1c)||n[_1c];}function getNodes(ns,_1e,_1f){var _20=[],cs;if(!ns){return _20;}_1e=_1e?_1e.replace(_5,""):"";_1f=_1f||"*";if(typeof ns.getElementsByTagName!="undefined"){ns=[ns];}if(_1e!="/"&&_1e!=">"){for(var i=0,ni;ni=ns[i];i++){cs=ni.getElementsByTagName(_1f);for(var j=0,ci;ci=cs[j];j++){_20[_20.length]=ci;}}}else{for(var i=0,ni;ni=ns[i];i++){var cn=ni.getElementsByTagName(_1f);for(var j=0,cj;cj=cn[j];j++){if(cj.parentNode==ni){_20[_20.length]=cj;}}}}return _20;}function concat(a,b){if(b.slice){return a.concat(b);}for(var i=0,l=b.length;i<l;i++){a[a.length]=b[i];}return a;}function byTag(cs,_2d){if(cs.tagName||cs==document){cs=[cs];}if(!_2d){return cs;}var r=[];_2d=_2d.toLowerCase();for(var i=0,ci;ci=cs[i];i++){if(ci.nodeType==1&&ci.tagName.toLowerCase()==_2d){r[r.length]=ci;}}return r;}function byId(cs,_32,id){if(cs.tagName||cs==document){cs=[cs];}if(!id){return cs;}var r=[];for(var i=0,ci;ci=cs[i];i++){if(ci&&ci.id==id){r[r.length]=ci;return r;}}return r;}function byAttribute(cs,_38,_39,op,_3b){var r=[],st=_3b=="{";var f=Ext.DomQuery.operators[op];for(var i=0;ci=cs[i];i++){var a;if(st){a=Ext.DomQuery.getStyle(ci,_38);}else{if(_38=="class"||_38=="className"){a=ci.className;}else{if(_38=="for"){a=ci.htmlFor;}else{if(_38=="href"){a=ci.getAttribute("href",2);}else{a=ci.getAttribute(_38);}}}}if((f&&f(a,_39))||(!f&&a)){r[r.length]=ci;}}return r;}function byPseudo(cs,_42,_43){return Ext.DomQuery.pseudos[_42](cs,_43);}var _44=window.ActiveXObject?true:false;var key=30803;function nodupIEXml(cs){var d=++key;cs[0].setAttribute("_nodup",d);var r=[cs[0]];for(var i=1,len=cs.length;i<len;i++){var c=cs[i];if(!c.getAttribute("_nodup")!=d){c.setAttribute("_nodup",d);r[r.length]=c;}}for(var i=0,len=cs.length;i<len;i++){cs[i].removeAttribute("_nodup");}return r;}function nodup(cs){if(!cs){return [];}var len=cs.length,c,i,r=cs,cj;if(!len||typeof cs.nodeType!="undefined"||len==1){return cs;}if(_44&&typeof cs[0].selectSingleNode!="undefined"){return nodupIEXml(cs);}var d=++key;cs[0]._nodup=d;for(i=1;c=cs[i];i++){if(c._nodup!=d){c._nodup=d;}else{r=[];for(var j=0;j<i;j++){r[r.length]=cs[j];}for(j=i+1;cj=cs[j];j++){if(cj._nodup!=d){cj._nodup=d;r[r.length]=cj;}}return r;}}return r;}function quickDiffIEXml(c1,c2){var d=++key;for(var i=0,len=c1.length;i<len;i++){c1[i].setAttribute("_qdiff",d);}var r=[];for(var i=0,len=c2.length;i<len;i++){if(c2[i].getAttribute("_qdiff")!=d){r[r.length]=c2[i];}}for(var i=0,len=c1.length;i<len;i++){c1[i].removeAttribute("_qdiff");}return r;}function quickDiff(c1,c2){var _5c=c1.length;if(!_5c){return c2;}if(_44&&c1[0].selectSingleNode){return quickDiffIEXml(c1,c2);}var d=++key;for(var i=0;i<_5c;i++){c1[i]._qdiff=d;}var r=[];for(var i=0,len=c2.length;i<len;i++){if(c2[i]._qdiff!=d){r[r.length]=c2[i];}}return r;}function quickId(ns,_62,_63,id){if(ns==_63){var d=_63.ownerDocument||_63;return d.getElementById(id);}ns=getNodes(ns,_62,"*");return byId(ns,null,id);}return {getStyle:function(el,_67){return Ext.fly(el).getStyle(_67);},compile:function(_68,_69){while(_68.substr(0,1)=="/"){_68=_68.substr(1);}_69=_69||"select";var fn=["var f = function(root){\n var mode; var n = root || document;\n"];var q=_68,_6c,lq;var tk=Ext.DomQuery.matchers;var _6f=tk.length;var mm;while(q&&lq!=q){lq=q;var tm=q.match(_8);if(_69=="select"){if(tm){if(tm[1]=="#"){fn[fn.length]="n = quickId(n, mode, root, \""+tm[2]+"\");";}else{fn[fn.length]="n = getNodes(n, mode, \""+tm[2]+"\");";}q=q.replace(tm[0],"");}else{if(q.substr(0,1)!="@"){fn[fn.length]="n = getNodes(n, mode, \"*\");";}}}else{if(tm){if(tm[1]=="#"){fn[fn.length]="n = byId(n, null, \""+tm[2]+"\");";}else{fn[fn.length]="n = byTag(n, \""+tm[2]+"\");";}q=q.replace(tm[0],"");}}while(!(mm=q.match(_7))){var _72=false;for(var j=0;j<_6f;j++){var t=tk[j];var m=q.match(t.re);if(m){fn[fn.length]=t.select.replace(_6,function(x,i){return m[i];});q=q.replace(m[0],"");_72=true;break;}}if(!_72){throw "Error parsing selector, parsing failed at \""+q+"\"";}}if(mm[1]){fn[fn.length]="mode=\""+mm[1]+"\";";q=q.replace(mm[1],"");}}fn[fn.length]="return nodup(n);\n}";eval(fn.join(""));return f;},select:function(_78,_79,_7a){if(!_79||_79==document){_79=document;}if(typeof _79=="string"){_79=document.getElementById(_79);}var _7b=_78.split(",");var _7c=[];for(var i=0,len=_7b.length;i<len;i++){var p=_7b[i].replace(_5,"");if(!_1[p]){_1[p]=Ext.DomQuery.compile(p);if(!_1[p]){throw p+" is not a valid selector";}}var _80=_1[p](_79);if(_80&&_80!=document){_7c=_7c.concat(_80);}}return _7c;},selectNode:function(_81,_82){return Ext.DomQuery.select(_81,_82)[0];},selectValue:function(_83,_84,_85){_83=_83.replace(_5,"");if(!_3[_83]){_3[_83]=Ext.DomQuery.compile(_83,"select");}var n=_3[_83](_84);n=n[0]?n[0]:n;var v=(n&&n.firstChild?n.firstChild.nodeValue:null);return (v===null?_85:v);},selectNumber:function(_88,_89,_8a){var v=Ext.DomQuery.selectValue(_88,_89,_8a||0);return parseFloat(v);},is:function(el,ss){if(typeof el=="string"){el=document.getElementById(el);}var _8e=(el instanceof Array);var _8f=Ext.DomQuery.filter(_8e?el:[el],ss);return _8e?(_8f.length==el.length):(_8f.length>0);},filter:function(els,ss,_92){ss=ss.replace(_5,"");if(!_2[ss]){_2[ss]=Ext.DomQuery.compile(ss,"simple");}var _93=_2[ss](els);return _92?quickDiff(_93,els):_93;},matchers:[{re:/^\.([\w-]+)/,select:"n = byClassName(n, null, \" {1} \");"},{re:/^\:([\w-]+)(?:\(((?:[^\s>\/]*|.*?))\))?/,select:"n = byPseudo(n, \"{1}\", \"{2}\");"},{re:/^(?:([\[\{])(?:@)?([\w-]+)\s?(?:(=|.=)\s?['"]?(.*?)["']?)?[\]\}])/,select:"n = byAttribute(n, \"{2}\", \"{4}\", \"{3}\", \"{1}\");"},{re:/^#([\w-]+)/,select:"n = byId(n, null, \"{1}\");"},{re:/^@([\w-]+)/,select:"return {firstChild:{nodeValue:attrValue(n, \"{1}\")}};"}],operators:{"=":function(a,v){return a==v;},"!=":function(a,v){return a!=v;},"^=":function(a,v){return a&&a.substr(0,v.length)==v;},"$=":function(a,v){return a&&a.substr(a.length-v.length)==v;},"*=":function(a,v){return a&&a.indexOf(v)!==-1;},"%=":function(a,v){return (a%v)==0;}},pseudos:{"first-child":function(c){var r=[],n;for(var i=0,ci;ci=n=c[i];i++){while((n=n.previousSibling)&&n.nodeType!=1){}if(!n){r[r.length]=ci;}}return r;},"last-child":function(c){var r=[];for(var i=0,ci;ci=n=c[i];i++){while((n=n.nextSibling)&&n.nodeType!=1){}if(!n){r[r.length]=ci;}}return r;},"nth-child":function(c,a){var r=[];if(a!="odd"&&a!="even"){for(var i=0,ci;ci=c[i];i++){var m=child(ci.parentNode,a);if(m==ci){r[r.length]=m;}}return r;}var p;for(var i=0,l=c.length;i<l;i++){var cp=c[i].parentNode;if(cp!=p){clean(cp);p=cp;}}for(var i=0,ci;ci=c[i];i++){var m=false;if(a=="odd"){m=((ci.nodeIndex+1)%2==1);}else{if(a=="even"){m=((ci.nodeIndex+1)%2==0);}}if(m){r[r.length]=ci;}}return r;},"only-child":function(c){var r=[];for(var i=0,ci;ci=c[i];i++){if(!prev(ci)&&!next(ci)){r[r.length]=ci;}}return r;},"empty":function(c){var r=[];for(var i=0,ci;ci=c[i];i++){var cns=ci.childNodes,j=0,cn,_bd=true;while(cn=cns[j]){++j;if(cn.nodeType==1||cn.nodeType==3){_bd=false;break;}}if(_bd){r[r.length]=ci;}}return r;},"contains":function(c,v){var r=[];for(var i=0,ci;ci=c[i];i++){if(ci.innerHTML.indexOf(v)!==-1){r[r.length]=ci;}}return r;},"nodeValue":function(c,v){var r=[];for(var i=0,ci;ci=c[i];i++){if(ci.firstChild&&ci.firstChild.nodeValue==v){r[r.length]=ci;}}return r;},"checked":function(c){var r=[];for(var i=0,ci;ci=c[i];i++){if(ci.checked==true){r[r.length]=ci;}}return r;},"not":function(c,ss){return Ext.DomQuery.filter(c,ss,true);},"odd":function(c){return this["nth-child"](c,"odd");},"even":function(c){return this["nth-child"](c,"even");},"nth":function(c,a){return c[a-1]||[];},"first":function(c){return c[0]||[];},"last":function(c){return c[c.length-1]||[];},"has":function(c,ss){var s=Ext.DomQuery.select;var r=[];for(var i=0,ci;ci=c[i];i++){if(s(ss,ci).length>0){r[r.length]=ci;}}return r;},"next":function(c,ss){var is=Ext.DomQuery.is;var r=[];for(var i=0,ci;ci=c[i];i++){var n=next(ci);if(n&&is(n,ss)){r[r.length]=ci;}}return r;},"prev":function(c,ss){var is=Ext.DomQuery.is;var r=[];for(var i=0,ci;ci=c[i];i++){var n=prev(ci);if(n&&is(n,ss)){r[r.length]=ci;}}return r;}}};}();Ext.query=Ext.DomQuery.select;



Ext.util.Observable=function(){if(this.listeners){this.on(this.listeners);delete this.listeners;}};Ext.util.Observable.prototype={fireEvent:function(){var ce=this.events[arguments[0].toLowerCase()];if(typeof ce=="object"){return ce.fire.apply(ce,Array.prototype.slice.call(arguments,1));}else{return true;}},filterOptRe:/^(?:scope|delay|buffer|single)$/,addListener:function(_2,fn,_4,o){if(typeof _2=="object"){o=_2;for(var e in o){if(this.filterOptRe.test(e)){continue;}if(typeof o[e]=="function"){this.addListener(e,o[e],o.scope,o);}else{this.addListener(e,o[e].fn,o[e].scope,o[e]);}}return;}o=(!o||typeof o=="boolean")?{}:o;_2=_2.toLowerCase();var ce=this.events[_2]||true;if(typeof ce=="boolean"){ce=new Ext.util.Event(this,_2);this.events[_2]=ce;}ce.addListener(fn,_4,o);},removeListener:function(_8,fn,_a){var ce=this.events[_8.toLowerCase()];if(typeof ce=="object"){ce.removeListener(fn,_a);}},purgeListeners:function(){for(var _c in this.events){if(typeof this.events[_c]=="object"){this.events[_c].clearListeners();}}},relayEvents:function(o,_e){var _f=function(_10){return function(){return this.fireEvent.apply(this,Ext.combine(_10,Array.prototype.slice.call(arguments,0)));};};for(var i=0,len=_e.length;i<len;i++){var _13=_e[i];if(!this.events[_13]){this.events[_13]=true;}o.on(_13,_f(_13),this);}},addEvents:function(o){if(!this.events){this.events={};}Ext.applyIf(this.events,o);},hasListener:function(_15){var e=this.events[_15];return typeof e=="object"&&e.listeners.length>0;}};Ext.util.Observable.prototype.on=Ext.util.Observable.prototype.addListener;Ext.util.Observable.prototype.un=Ext.util.Observable.prototype.removeListener;Ext.util.Observable.capture=function(o,fn,_19){o.fireEvent=o.fireEvent.createInterceptor(fn,_19);};Ext.util.Observable.releaseCapture=function(o){o.fireEvent=Ext.util.Observable.prototype.fireEvent;};(function(){var _1b=function(h,o,_1e){var _1f=new Ext.util.DelayedTask();return function(){_1f.delay(o.buffer,h,_1e,Array.prototype.slice.call(arguments,0));};};var _20=function(h,e,fn,_24){return function(){e.removeListener(fn,_24);return h.apply(_24,arguments);};};var _25=function(h,o,_28){return function(){var _29=Array.prototype.slice.call(arguments,0);setTimeout(function(){h.apply(_28,_29);},o.delay||10);};};Ext.util.Event=function(obj,_2b){this.name=_2b;this.obj=obj;this.listeners=[];};Ext.util.Event.prototype={addListener:function(fn,_2d,_2e){var o=_2e||{};_2d=_2d||this.obj;if(!this.isListening(fn,_2d)){var l={fn:fn,scope:_2d,options:o};var h=fn;if(o.delay){h=_25(h,o,_2d);}if(o.single){h=_20(h,this,fn,_2d);}if(o.buffer){h=_1b(h,o,_2d);}l.fireFn=h;if(!this.firing){this.listeners.push(l);}else{this.listeners=this.listeners.slice(0);this.listeners.push(l);}}},findListener:function(fn,_33){_33=_33||this.obj;var ls=this.listeners;for(var i=0,len=ls.length;i<len;i++){var l=ls[i];if(l.fn==fn&&l.scope==_33){return i;}}return -1;},isListening:function(fn,_39){return this.findListener(fn,_39)!=-1;},removeListener:function(fn,_3b){var _3c;if((_3c=this.findListener(fn,_3b))!=-1){if(!this.firing){this.listeners.splice(_3c,1);}else{this.listeners=this.listeners.slice(0);this.listeners.splice(_3c,1);}return true;}return false;},clearListeners:function(){this.listeners=[];},fire:function(){var ls=this.listeners,_3e,len=ls.length;if(len>0){this.firing=true;var _40=Array.prototype.slice.call(arguments,0);for(var i=0;i<len;i++){var l=ls[i];if(l.fireFn.apply(l.scope,arguments)===false){this.firing=false;return false;}}this.firing=false;}return true;}};})();



Ext.EventManager=function(){var _1,_2,_3=false;var _4,_5,_6,_7;var E=Ext.lib.Event;var D=Ext.lib.Dom;var _a=function(){if(!_3){_3=true;Ext.isReady=true;if(_2){clearInterval(_2);}if(Ext.isGecko||Ext.isOpera){document.removeEventListener("DOMContentLoaded",_a,false);}if(_1){_1.fire();_1.clearListeners();}}};var _b=function(){_1=new Ext.util.Event();if(Ext.isGecko||Ext.isOpera){document.addEventListener("DOMContentLoaded",_a,false);}else{if(Ext.isIE){document.write("<s"+"cript id=\"ie-deferred-loader\" defer=\"defer\" src=\"/"+"/:\"></s"+"cript>");var _c=document.getElementById("ie-deferred-loader");_c.onreadystatechange=function(){if(this.readyState=="complete"){_a();_c.onreadystatechange=null;_c.parentNode.removeChild(_c);}};}else{if(Ext.isSafari){_2=setInterval(function(){var rs=document.readyState;if(rs=="complete"){_a();}},10);}}}E.on(window,"load",_a);};var _e=function(h,o){var _11=new Ext.util.DelayedTask(h);return function(e){e=new Ext.EventObjectImpl(e);_11.delay(o.buffer,h,null,[e]);};};var _13=function(h,el,_16,fn){return function(e){Ext.EventManager.removeListener(el,_16,fn);h(e);};};var _19=function(h,o){return function(e){e=new Ext.EventObjectImpl(e);setTimeout(function(){h(e);},o.delay||10);};};var _1d=function(_1e,_1f,opt,fn,_22){var o=(!opt||typeof opt=="boolean")?{}:opt;fn=fn||o.fn;_22=_22||o.scope;var el=Ext.getDom(_1e);if(!el){throw "Error listening for \""+_1f+"\". Element \""+_1e+"\" doesn't exist.";}var h=function(e){e=Ext.EventObject.setEvent(e);var t;if(o.delegate){t=e.getTarget(o.delegate,el);if(!t){return;}}else{t=e.target;}if(o.stopEvent===true){e.stopEvent();}if(o.preventDefault===true){e.preventDefault();}if(o.stopPropagation===true){e.stopPropagation();}if(o.normalized===false){e=e.browserEvent;}fn.call(_22||el,e,t,o);};if(o.delay){h=_19(h,o);}if(o.single){h=_13(h,el,_1f,fn);}if(o.buffer){h=_e(h,o);}fn._handlers=fn._handlers||[];fn._handlers.push([Ext.id(el),_1f,h]);E.on(el,_1f,h);if(_1f=="mousewheel"&&el.addEventListener){el.addEventListener("DOMMouseScroll",h,false);E.on(window,"unload",function(){el.removeEventListener("DOMMouseScroll",h,false);});}if(_1f=="mousedown"&&el==document){Ext.EventManager.stoppedMouseDownEvent.addListener(h);}return h;};var _28=function(el,_2a,fn){var id=Ext.id(el),hds=fn._handlers,hd=fn;if(hds){for(var i=0,len=hds.length;i<len;i++){var h=hds[i];if(h[0]==id&&h[1]==_2a){hd=h[2];hds.splice(i,1);break;}}}E.un(el,_2a,hd);el=Ext.getDom(el);if(_2a=="mousewheel"&&el.addEventListener){el.removeEventListener("DOMMouseScroll",hd,false);}if(_2a=="mousedown"&&el==document){Ext.EventManager.stoppedMouseDownEvent.removeListener(hd);}};var _32=/^(?:scope|delay|buffer|single|stopEvent|preventDefault|stopPropagation|normalized)$/;var pub={wrap:function(fn,_35,_36){return function(e){Ext.EventObject.setEvent(e);fn.call(_36?_35||window:window,Ext.EventObject,_35);};},addListener:function(_38,_39,fn,_3b,_3c){if(typeof _39=="object"){var o=_39;for(var e in o){if(_32.test(e)){continue;}if(typeof o[e]=="function"){_1d(_38,e,o,o[e],o.scope);}else{_1d(_38,e,o[e]);}}return;}return _1d(_38,_39,_3c,fn,_3b);},removeListener:function(_3f,_40,fn){return _28(_3f,_40,fn);},onDocumentReady:function(fn,_43,_44){if(_3){fn.call(_43||window,_43);return;}if(!_1){_b();}_1.addListener(fn,_43,_44);},onWindowResize:function(fn,_46,_47){if(!_4){_4=new Ext.util.Event();_5=new Ext.util.DelayedTask(function(){_4.fire(D.getViewWidth(),D.getViewHeight());});E.on(window,"resize",function(){if(Ext.isIE){_5.delay(50);}else{_4.fire(D.getViewWidth(),D.getViewHeight());}});}_4.addListener(fn,_46,_47);},onTextResize:function(fn,_49,_4a){if(!_6){_6=new Ext.util.Event();var _4b=new Ext.Element(document.createElement("div"));_4b.dom.className="x-text-resize";_4b.dom.innerHTML="X";_4b.appendTo(document.body);_7=_4b.dom.offsetHeight;setInterval(function(){if(_4b.dom.offsetHeight!=_7){_6.fire(_7,_7=_4b.dom.offsetHeight);}},this.textResizeInterval);}_6.addListener(fn,_49,_4a);},removeResizeListener:function(fn,_4d){if(_4){_4.removeListener(fn,_4d);}},fireResize:function(){if(_4){_4.fire(D.getViewWidth(),D.getViewHeight());}},ieDeferSrc:false,textResizeInterval:50};pub.on=pub.addListener;pub.un=pub.removeListener;pub.stoppedMouseDownEvent=new Ext.util.Event();return pub;}();Ext.onReady=Ext.EventManager.onDocumentReady;Ext.onReady(function(){var bd=Ext.get(document.body);if(!bd){return;}var cls=Ext.isIE?"ext-ie":Ext.isGecko?"ext-gecko":Ext.isOpera?"ext-opera":Ext.isSafari?"ext-safari":"";if(Ext.isBorderBox){cls+=" ext-border-box";}if(Ext.isStrict){cls+=" ext-strict";}bd.addClass(cls);});Ext.EventObject=function(){var E=Ext.lib.Event;var _51={63234:37,63235:39,63232:38,63233:40,63276:33,63277:34,63272:46,63273:36,63275:35};var _52=Ext.isIE?{1:0,4:1,2:2}:(Ext.isSafari?{1:0,2:1,3:2}:{0:0,1:1,2:2});Ext.EventObjectImpl=function(e){if(e){this.setEvent(e.browserEvent||e);}};Ext.EventObjectImpl.prototype={browserEvent:null,button:-1,shiftKey:false,ctrlKey:false,altKey:false,BACKSPACE:8,TAB:9,RETURN:13,ENTER:13,SHIFT:16,CONTROL:17,ESC:27,SPACE:32,PAGEUP:33,PAGEDOWN:34,END:35,HOME:36,LEFT:37,UP:38,RIGHT:39,DOWN:40,DELETE:46,F5:116,setEvent:function(e){if(e==this||(e&&e.browserEvent)){return e;}this.browserEvent=e;if(e){this.button=e.button?_52[e.button]:(e.which?e.which-1:-1);this.shiftKey=e.shiftKey;this.ctrlKey=e.ctrlKey||e.metaKey;this.altKey=e.altKey;this.keyCode=e.keyCode;this.charCode=e.charCode;this.target=E.getTarget(e);this.xy=E.getXY(e);}else{this.button=-1;this.shiftKey=false;this.ctrlKey=false;this.altKey=false;this.keyCode=0;this.charCode=0;this.target=null;this.xy=[0,0];}return this;},stopEvent:function(){if(this.browserEvent){if(this.browserEvent.type=="mousedown"){Ext.EventManager.stoppedMouseDownEvent.fire(this);}E.stopEvent(this.browserEvent);}},preventDefault:function(){if(this.browserEvent){E.preventDefault(this.browserEvent);}},isNavKeyPress:function(){var k=this.keyCode;k=Ext.isSafari?(_51[k]||k):k;return (k>=33&&k<=40)||k==this.RETURN||k==this.TAB||k==this.ESC;},isSpecialKey:function(){var k=this.keyCode;return k==9||k==13||k==40||k==27||(k==16)||(k==17)||(k>=18&&k<=20)||(k>=33&&k<=35)||(k>=36&&k<=39)||(k>=44&&k<=45);},stopPropagation:function(){if(this.browserEvent){if(this.browserEvent.type=="mousedown"){Ext.EventManager.stoppedMouseDownEvent.fire(this);}E.stopPropagation(this.browserEvent);}},getCharCode:function(){return this.charCode||this.keyCode;},getKey:function(){var k=this.keyCode||this.charCode;return Ext.isSafari?(_51[k]||k):k;},getPageX:function(){return this.xy[0];},getPageY:function(){return this.xy[1];},getTime:function(){if(this.browserEvent){return E.getTime(this.browserEvent);}return null;},getXY:function(){return this.xy;},getTarget:function(_58,_59,_5a){return _58?Ext.fly(this.target).findParent(_58,_59,_5a):this.target;},getRelatedTarget:function(){if(this.browserEvent){return E.getRelatedTarget(this.browserEvent);}return null;},getWheelDelta:function(){var e=this.browserEvent;var _5c=0;if(e.wheelDelta){_5c=e.wheelDelta/120;if(window.opera){_5c=-_5c;}}else{if(e.detail){_5c=-e.detail/3;}}return _5c;},hasModifier:function(){return ((this.ctrlKey||this.altKey)||this.shiftKey)?true:false;},within:function(el,_5e){var t=this[_5e?"getRelatedTarget":"getTarget"]();return t&&Ext.fly(el).contains(t);},getPoint:function(){return new Ext.lib.Point(this.xy[0],this.xy[1]);}};return new Ext.EventObjectImpl();}();



(function(){var D=Ext.lib.Dom;var E=Ext.lib.Event;var A=Ext.lib.Anim;var _4={};var _5=/(-[a-z])/gi;var _6=function(m,a){return a.charAt(1).toUpperCase();};var _9=document.defaultView;Ext.Element=function(_a,_b){var _c=typeof _a=="string"?document.getElementById(_a):_a;if(!_c){return null;}if(!_b&&Ext.Element.cache[_c.id]){return Ext.Element.cache[_c.id];}this.dom=_c;this.id=_c.id||Ext.id(_c);};var El=Ext.Element;El.prototype={originalDisplay:"",visibilityMode:1,defaultUnit:"px",setVisibilityMode:function(_e){this.visibilityMode=_e;return this;},enableDisplayMode:function(_f){this.setVisibilityMode(El.DISPLAY);if(typeof _f!="undefined"){this.originalDisplay=_f;}return this;},findParent:function(_10,_11,_12){var p=this.dom,b=document.body,_15=0,dq=Ext.DomQuery,_17;_11=_11||50;if(typeof _11!="number"){_17=Ext.getDom(_11);_11=10;}while(p&&p.nodeType==1&&_15<_11&&p!=b&&p!=_17){if(dq.is(p,_10)){return _12?Ext.get(p):p;}_15++;p=p.parentNode;}return null;},findParentNode:function(_18,_19,_1a){var p=Ext.fly(this.dom.parentNode,"_internal");return p?p.findParent(_18,_19,_1a):null;},up:function(_1c,_1d){return this.findParentNode(_1c,_1d,true);},is:function(_1e){return Ext.DomQuery.is(this.dom,_1e);},animate:function(_1f,_20,_21,_22,_23){this.anim(_1f,{duration:_20,callback:_21,easing:_22},_23);return this;},anim:function(_24,opt,_26,_27,_28,cb){_26=_26||"run";opt=opt||{};var _2a=Ext.lib.Anim[_26](this.dom,_24,(opt.duration||_27)||0.35,(opt.easing||_28)||"easeOut",function(){Ext.callback(cb,this);Ext.callback(opt.callback,opt.scope||this,[this,opt]);},this);opt.anim=_2a;return _2a;},preanim:function(a,i){return !a[i]?false:(typeof a[i]=="object"?a[i]:{duration:a[i+1],callback:a[i+2],easing:a[i+3]});},clean:function(_2d){if(this.isCleaned&&_2d!==true){return this;}var ns=/\S/;var d=this.dom,n=d.firstChild,ni=-1;while(n){var nx=n.nextSibling;if(n.nodeType==3&&!ns.test(n.nodeValue)){d.removeChild(n);}else{n.nodeIndex=++ni;}n=nx;}this.isCleaned=true;return this;},calcOffsetsTo:function(el){el=Ext.get(el),d=el.dom;var _34=false;if(el.getStyle("position")=="static"){el.position("relative");_34=true;}var x=0,y=0;var op=this.dom;while(op&&op!=d&&op.tagName!="HTML"){x+=op.offsetLeft;y+=op.offsetTop;op=op.offsetParent;}if(_34){el.position("static");}return [x,y];},scrollIntoView:function(_38,_39){var c=Ext.getDom(_38)||document.body;var el=this.dom;var o=this.calcOffsetsTo(c),l=o[0],t=o[1],b=t+el.offsetHeight,r=l+el.offsetWidth;var ch=c.clientHeight;var ct=parseInt(c.scrollTop,10);var cl=parseInt(c.scrollLeft,10);var cb=ct+ch;var cr=cl+c.clientWidth;if(t<ct){c.scrollTop=t;}else{if(b>cb){c.scrollTop=b-ch;}}if(_39!==false){if(l<cl){c.scrollLeft=l;}else{if(r>cr){c.scrollLeft=r-c.clientWidth;}}}return this;},scrollChildIntoView:function(_46){Ext.fly(_46,"_scrollChildIntoView").scrollIntoView(this);},autoHeight:function(_47,_48,_49,_4a){var _4b=this.getHeight();this.clip();this.setHeight(1);setTimeout(function(){var _4c=parseInt(this.dom.scrollHeight,10);if(!_47){this.setHeight(_4c);this.unclip();if(typeof _49=="function"){_49();}}else{this.setHeight(_4b);this.setHeight(_4c,_47,_48,function(){this.unclip();if(typeof _49=="function"){_49();}}.createDelegate(this),_4a);}}.createDelegate(this),0);return this;},contains:function(el){if(!el){return false;}return D.isAncestor(this.dom,el.dom?el.dom:el);},isVisible:function(_4e){var vis=!(this.getStyle("visibility")=="hidden"||this.getStyle("display")=="none");if(_4e!==true||!vis){return vis;}var p=this.dom.parentNode;while(p&&p.tagName.toLowerCase()!="body"){if(!Ext.fly(p,"_isVisible").isVisible()){return false;}p=p.parentNode;}return true;},select:function(_51,_52){return El.select("#"+Ext.id(this.dom)+" "+_51,_52);},query:function(_53,_54){return Ext.DomQuery.select("#"+Ext.id(this.dom)+" "+_53);},child:function(_55,_56){var n=Ext.DomQuery.selectNode("#"+Ext.id(this.dom)+" "+_55);return _56?n:Ext.get(n);},down:function(_58,_59){var n=Ext.DomQuery.selectNode("#"+Ext.id(this.dom)+" > "+_58);return _59?n:Ext.get(n);},initDD:function(_5b,_5c,_5d){var dd=new Ext.dd.DD(Ext.id(this.dom),_5b,_5c);return Ext.apply(dd,_5d);},initDDProxy:function(_5f,_60,_61){var dd=new Ext.dd.DDProxy(Ext.id(this.dom),_5f,_60);return Ext.apply(dd,_61);},initDDTarget:function(_63,_64,_65){var dd=new Ext.dd.DDTarget(Ext.id(this.dom),_63,_64);return Ext.apply(dd,_65);},setVisible:function(_67,_68){if(!_68||!A){if(this.visibilityMode==El.DISPLAY){this.setDisplayed(_67);}else{this.fixDisplay();this.dom.style.visibility=_67?"visible":"hidden";}}else{var dom=this.dom;var _6a=this.visibilityMode;if(_67){this.setOpacity(0.01);this.setVisible(true);}this.anim({opacity:{to:(_67?1:0)}},this.preanim(arguments,1),null,0.35,"easeIn",function(){if(!_67){if(_6a==El.DISPLAY){dom.style.display="none";}else{dom.style.visibility="hidden";}Ext.get(dom).setOpacity(1);}});}return this;},isDisplayed:function(){return this.getStyle("display")!="none";},toggle:function(_6b){this.setVisible(!this.isVisible(),this.preanim(arguments,0));return this;},setDisplayed:function(_6c){if(typeof _6c=="boolean"){_6c=_6c?this.originalDisplay:"none";}this.setStyle("display",_6c);return this;},focus:function(){try{this.dom.focus();}catch(e){}return this;},blur:function(){try{this.dom.blur();}catch(e){}return this;},addClass:function(_6d){if(_6d instanceof Array){for(var i=0,len=_6d.length;i<len;i++){this.addClass(_6d[i]);}}else{if(_6d&&!this.hasClass(_6d)){this.dom.className=this.dom.className+" "+_6d;}}return this;},radioClass:function(_70){var _71=this.dom.parentNode.childNodes;for(var i=0;i<_71.length;i++){var s=_71[i];if(s.nodeType==1){Ext.get(s).removeClass(_70);}}this.addClass(_70);return this;},removeClass:function(_74){if(!_74||!this.dom.className){return this;}if(_74 instanceof Array){for(var i=0,len=_74.length;i<len;i++){this.removeClass(_74[i]);}}else{if(this.hasClass(_74)){var re=this.classReCache[_74];if(!re){re=new RegExp("(?:^|\\s+)"+_74+"(?:\\s+|$)","g");this.classReCache[_74]=re;}this.dom.className=this.dom.className.replace(re," ");}}return this;},classReCache:{},toggleClass:function(_78){if(this.hasClass(_78)){this.removeClass(_78);}else{this.addClass(_78);}return this;},hasClass:function(_79){return _79&&(" "+this.dom.className+" ").indexOf(" "+_79+" ")!=-1;},replaceClass:function(_7a,_7b){this.removeClass(_7a);this.addClass(_7b);return this;},getStyles:function(){var a=arguments,len=a.length,r={};for(var i=0;i<len;i++){r[a[i]]=this.getStyle(a[i]);}return r;},getStyle:function(){return _9&&_9.getComputedStyle?function(_80){var el=this.dom,v,cs,_84;if(_80=="float"){_80="cssFloat";}if(v=el.style[_80]){return v;}if(cs=_9.getComputedStyle(el,"")){if(!(_84=_4[_80])){_84=_4[_80]=_80.replace(_5,_6);}return cs[_84];}return null;}:function(_85){var el=this.dom,v,cs,_89;if(_85=="opacity"){if(typeof el.filter=="string"){var fv=parseFloat(el.filter.match(/alpha\(opacity=(.*)\)/i)[1]);if(!isNaN(fv)){return fv?fv/100:0;}}return 1;}else{if(_85=="float"){_85="styleFloat";}}if(!(_89=_4[_85])){_89=_4[_85]=_85.replace(_5,_6);}if(v=el.style[_89]){return v;}if(cs=el.currentStyle){return cs[_89];}return null;};}(),setStyle:function(_8b,_8c){if(typeof _8b=="string"){var _8d;if(!(_8d=_4[_8b])){_8d=_4[_8b]=_8b.replace(_5,_6);}if(_8d=="opacity"){this.setOpacity(_8c);}else{this.dom.style[_8d]=_8c;}}else{for(var _8e in _8b){if(typeof _8b[_8e]!="function"){this.setStyle(_8e,_8b[_8e]);}}}return this;},applyStyles:function(_8f){Ext.DomHelper.applyStyles(this.dom,_8f);return this;},getX:function(){return D.getX(this.dom);},getY:function(){return D.getY(this.dom);},getXY:function(){return D.getXY(this.dom);},setX:function(x,_91){if(!_91||!A){D.setX(this.dom,x);}else{this.setXY([x,this.getY()],this.preanim(arguments,1));}return this;},setY:function(y,_93){if(!_93||!A){D.setY(this.dom,y);}else{this.setXY([this.getX(),y],this.preanim(arguments,1));}return this;},setLeft:function(_94){this.setStyle("left",this.addUnits(_94));return this;},setTop:function(top){this.setStyle("top",this.addUnits(top));return this;},setRight:function(_96){this.setStyle("right",this.addUnits(_96));return this;},setBottom:function(_97){this.setStyle("bottom",this.addUnits(_97));return this;},setXY:function(pos,_99){if(!_99||!A){D.setXY(this.dom,pos);}else{this.anim({points:{to:pos}},this.preanim(arguments,1),"motion");}return this;},setLocation:function(x,y,_9c){this.setXY([x,y],this.preanim(arguments,2));return this;},moveTo:function(x,y,_9f){this.setXY([x,y],this.preanim(arguments,2));return this;},getRegion:function(){return D.getRegion(this.dom);},getHeight:function(_a0){var h=this.dom.offsetHeight||0;return _a0!==true?h:h-this.getBorderWidth("tb")-this.getPadding("tb");},getWidth:function(_a2){var w=this.dom.offsetWidth||0;return _a2!==true?w:w-this.getBorderWidth("lr")-this.getPadding("lr");},getComputedHeight:function(){var h=Math.max(this.dom.offsetHeight,this.dom.clientHeight);if(!h){h=parseInt(this.getStyle("height"),10)||0;if(!this.isBorderBox()){h+=this.getFrameWidth("tb");}}return h;},getComputedWidth:function(){var w=Math.max(this.dom.offsetWidth,this.dom.clientWidth);if(!w){w=parseInt(this.getStyle("width"),10)||0;if(!this.isBorderBox()){w+=this.getFrameWidth("lr");}}return w;},getSize:function(_a6){return {width:this.getWidth(_a6),height:this.getHeight(_a6)};},getViewSize:function(){var d=this.dom,doc=document,aw=0,ah=0;if(d==doc||d==doc.body){return {width:D.getViewWidth(),height:D.getViewHeight()};}else{return {width:d.clientWidth,height:d.clientHeight};}},getValue:function(_ab){return _ab?parseInt(this.dom.value,10):this.dom.value;},adjustWidth:function(_ac){if(typeof _ac=="number"){if(this.autoBoxAdjust&&!this.isBorderBox()){_ac-=(this.getBorderWidth("lr")+this.getPadding("lr"));}if(_ac<0){_ac=0;}}return _ac;},adjustHeight:function(_ad){if(typeof _ad=="number"){if(this.autoBoxAdjust&&!this.isBorderBox()){_ad-=(this.getBorderWidth("tb")+this.getPadding("tb"));}if(_ad<0){_ad=0;}}return _ad;},setWidth:function(_ae,_af){_ae=this.adjustWidth(_ae);if(!_af||!A){this.dom.style.width=this.addUnits(_ae);}else{this.anim({width:{to:_ae}},this.preanim(arguments,1));}return this;},setHeight:function(_b0,_b1){_b0=this.adjustHeight(_b0);if(!_b1||!A){this.dom.style.height=this.addUnits(_b0);}else{this.anim({height:{to:_b0}},this.preanim(arguments,1));}return this;},setSize:function(_b2,_b3,_b4){if(typeof _b2=="object"){_b3=_b2.height;_b2=_b2.width;}_b2=this.adjustWidth(_b2);_b3=this.adjustHeight(_b3);if(!_b4||!A){this.dom.style.width=this.addUnits(_b2);this.dom.style.height=this.addUnits(_b3);}else{this.anim({width:{to:_b2},height:{to:_b3}},this.preanim(arguments,2));}return this;},setBounds:function(x,y,_b7,_b8,_b9){if(!_b9||!A){this.setSize(_b7,_b8);this.setLocation(x,y);}else{_b7=this.adjustWidth(_b7);_b8=this.adjustHeight(_b8);this.anim({points:{to:[x,y]},width:{to:_b7},height:{to:_b8}},this.preanim(arguments,4),"motion");}return this;},setRegion:function(_ba,_bb){this.setBounds(_ba.left,_ba.top,_ba.right-_ba.left,_ba.bottom-_ba.top,this.preanim(arguments,1));return this;},addListener:function(_bc,fn,_be,_bf){Ext.EventManager.on(this.dom,_bc,fn,_be||this,_bf);},removeListener:function(_c0,fn){Ext.EventManager.removeListener(this.dom,_c0,fn);return this;},removeAllListeners:function(){E.purgeElement(this.dom);return this;},relayEvent:function(_c2,_c3){this.on(_c2,function(e){_c3.fireEvent(_c2,e);});},setOpacity:function(_c5,_c6){if(!_c6||!A){var s=this.dom.style;if(Ext.isIE){s.zoom=1;s.filter=(s.filter||"").replace(/alpha\([^\)]*\)/gi,"")+(_c5==1?"":"alpha(opacity="+_c5*100+")");}else{s.opacity=_c5;}}else{this.anim({opacity:{to:_c5}},this.preanim(arguments,1),null,0.35,"easeIn");}return this;},getLeft:function(_c8){if(!_c8){return this.getX();}else{return parseInt(this.getStyle("left"),10)||0;}},getRight:function(_c9){if(!_c9){return this.getX()+this.getWidth();}else{return (this.getLeft(true)+this.getWidth())||0;}},getTop:function(_ca){if(!_ca){return this.getY();}else{return parseInt(this.getStyle("top"),10)||0;}},getBottom:function(_cb){if(!_cb){return this.getY()+this.getHeight();}else{return (this.getTop(true)+this.getHeight())||0;}},position:function(pos,_cd,x,y){if(!pos){if(this.getStyle("position")=="static"){this.setStyle("position","relative");}}else{this.setStyle("position",pos);}if(_cd){this.setStyle("z-index",_cd);}if(x!==undefined&&y!==undefined){this.setXY([x,y]);}else{if(x!==undefined){this.setX(x);}else{if(y!==undefined){this.setY(y);}}}},clearPositioning:function(_d0){_d0=_d0||"";this.setStyle({"left":_d0,"right":_d0,"top":_d0,"bottom":_d0,"z-index":"","position":"static"});return this;},getPositioning:function(){var l=this.getStyle("left");var t=this.getStyle("top");return {"position":this.getStyle("position"),"left":l,"right":l?"":this.getStyle("right"),"top":t,"bottom":t?"":this.getStyle("bottom"),"z-index":this.getStyle("z-index")};},getBorderWidth:function(_d3){return this.addStyles(_d3,El.borders);},getPadding:function(_d4){return this.addStyles(_d4,El.paddings);},setPositioning:function(pc){this.applyStyles(pc);if(pc.right=="auto"){this.dom.style.right="";}if(pc.bottom=="auto"){this.dom.style.bottom="";}return this;},fixDisplay:function(){if(this.getStyle("display")=="none"){this.setStyle("visibility","hidden");this.setStyle("display",this.originalDisplay);if(this.getStyle("display")=="none"){this.setStyle("display","block");}}},setLeftTop:function(_d6,top){this.dom.style.left=this.addUnits(_d6);this.dom.style.top=this.addUnits(top);return this;},move:function(_d8,_d9,_da){var xy=this.getXY();_d8=_d8.toLowerCase();switch(_d8){case "l":case "left":this.moveTo(xy[0]-_d9,xy[1],this.preanim(arguments,2));break;case "r":case "right":this.moveTo(xy[0]+_d9,xy[1],this.preanim(arguments,2));break;case "t":case "top":case "up":this.moveTo(xy[0],xy[1]-_d9,this.preanim(arguments,2));break;case "b":case "bottom":case "down":this.moveTo(xy[0],xy[1]+_d9,this.preanim(arguments,2));break;}return this;},clip:function(){if(!this.isClipped){this.isClipped=true;this.originalClip={"o":this.getStyle("overflow"),"x":this.getStyle("overflow-x"),"y":this.getStyle("overflow-y")};this.setStyle("overflow","hidden");this.setStyle("overflow-x","hidden");this.setStyle("overflow-y","hidden");}return this;},unclip:function(){if(this.isClipped){this.isClipped=false;var o=this.originalClip;if(o.o){this.setStyle("overflow",o.o);}if(o.x){this.setStyle("overflow-x",o.x);}if(o.y){this.setStyle("overflow-y",o.y);}}return this;},getAnchorXY:function(_dd,_de,s){var w,h,vp=false;if(!s){var d=this.dom;if(d==document.body||d==document){vp=true;w=D.getViewWidth();h=D.getViewHeight();}else{w=this.getWidth();h=this.getHeight();}}else{w=s.width;h=s.height;}var x=0,y=0,r=Math.round;switch((_dd||"tl").toLowerCase()){case "c":x=r(w*0.5);y=r(h*0.5);break;case "t":x=r(w*0.5);y=0;break;case "l":x=0;y=r(h*0.5);break;case "r":x=w;y=r(h*0.5);break;case "b":x=r(w*0.5);y=h;break;case "tl":x=0;y=0;break;case "bl":x=0;y=h;break;case "br":x=w;y=h;break;case "tr":x=w;y=0;break;}if(_de===true){return [x,y];}if(vp){var sc=this.getScroll();return [x+sc.left,y+sc.top];}var o=this.getXY();return [x+o[0],y+o[1]];},getAlignToXY:function(el,p,o){el=Ext.get(el),d=this.dom;if(!el.dom){throw "Element.alignTo with an element that doesn't exist";}var c=false;var p1="",p2="";o=o||[0,0];if(!p){p="tl-bl";}else{if(p=="?"){p="tl-bl?";}else{if(p.indexOf("-")==-1){p="tl-"+p;}}}p=p.toLowerCase();var m=p.match(/^([a-z]+)-([a-z]+)(\?)?$/);if(!m){throw "Element.alignTo with an invalid alignment "+p;}p1=m[1],p2=m[2],c=m[3]?true:false;var a1=this.getAnchorXY(p1,true);var a2=el.getAnchorXY(p2,false);var x=a2[0]-a1[0]+o[0];var y=a2[1]-a1[1]+o[1];if(c){var w=this.getWidth(),h=this.getHeight(),r=el.getRegion();var dw=D.getViewWidth()-5,dh=D.getViewHeight()-5;var p1y=p1.charAt(0),p1x=p1.charAt(p1.length-1);var p2y=p2.charAt(0),p2x=p2.charAt(p2.length-1);var _fd=((p1y=="t"&&p2y=="b")||(p1y=="b"&&p2y=="t"));var _fe=((p1x=="r"&&p2x=="l")||(p1x=="l"&&p2x=="r"));var doc=document;var _100=(doc.documentElement.scrollLeft||doc.body.scrollLeft||0)+5;var _101=(doc.documentElement.scrollTop||doc.body.scrollTop||0)+5;if((x+w)>dw){x=_fe?r.left-w:dw-w;}if(x<_100){x=_fe?r.right:_100;}if((y+h)>dh){y=_fd?r.top-h:dh-h;}if(y<_101){y=_fd?r.bottom:_101;}}return [x,y];},getConstrainToXY:function(){var os={top:0,left:0,bottom:0,right:0};return function(el,_104,_105){el=Ext.get(el);_105=_105?Ext.applyIf(_105,os):os;var vw,vh,vx=0,vy=0;if(el.dom==document.body||el.dom==document){vw=Ext.lib.Dom.getViewWidth();vh=Ext.lib.Dom.getViewHeight();}else{vw=el.dom.clientWidth;vh=el.dom.clientHeight;if(!_104){var vxy=el.getXY();vx=vxy[0];vy=vxy[1];}}var s=el.getScroll();vx+=_105.left+s.left;vy+=_105.top+s.top;vw-=_105.right;vh-=_105.bottom;var vr=vx+vw;var vb=vy+vh;var xy=!_104?this.getXY():[this.getLeft(true),this.getTop(true)];var x=xy[0],y=xy[1];var w=this.dom.offsetWidth,h=this.dom.offsetHeight;var _113=false;if((x+w)>vr){x=vr-w;_113=true;}if((y+h)>vb){y=vb-h;_113=true;}if(x<vx){x=vx;_113=true;}if(y<vy){y=vy;_113=true;}return _113?[x,y]:false;};}(),alignTo:function(_114,_115,_116,_117){var xy=this.getAlignToXY(_114,_115,_116);this.setXY(xy,this.preanim(arguments,3));return this;},anchorTo:function(el,_11a,_11b,_11c,_11d,_11e){var _11f=function(){this.alignTo(el,_11a,_11b,_11c);Ext.callback(_11e,this);};Ext.EventManager.onWindowResize(_11f,this);var tm=typeof _11d;if(tm!="undefined"){Ext.EventManager.on(window,"scroll",_11f,this,{buffer:tm=="number"?_11d:50});}_11f.call(this);return this;},clearOpacity:function(){if(window.ActiveXObject){this.dom.style.filter="";}else{this.dom.style.opacity="";this.dom.style["-moz-opacity"]="";this.dom.style["-khtml-opacity"]="";}return this;},hide:function(_121){this.setVisible(false,this.preanim(arguments,0));return this;},show:function(_122){this.setVisible(true,this.preanim(arguments,0));return this;},addUnits:function(size){return Ext.Element.addUnits(size,this.defaultUnit);},beginMeasure:function(){var el=this.dom;if(el.offsetWidth||el.offsetHeight){return this;}var _125=[];var p=this.dom,b=document.body;while((!el.offsetWidth&&!el.offsetHeight)&&p&&p.tagName&&p!=b){var pe=Ext.get(p);if(pe.getStyle("display")=="none"){_125.push({el:p,visibility:pe.getStyle("visibility")});p.style.visibility="hidden";p.style.display="block";}p=p.parentNode;}this._measureChanged=_125;return this;},endMeasure:function(){var _129=this._measureChanged;if(_129){for(var i=0,len=_129.length;i<len;i++){var r=_129[i];r.el.style.visibility=r.visibility;r.el.style.display="none";}this._measureChanged=null;}return this;},update:function(html,_12e,_12f){if(typeof html=="undefined"){html="";}if(_12e!==true){this.dom.innerHTML=html;if(typeof _12f=="function"){_12f();}return this;}var id=Ext.id();var dom=this.dom;html+="<span id=\""+id+"\"></span>";E.onAvailable(id,function(){var hd=document.getElementsByTagName("head")[0];var re=/(?:<script([^>]*)?>)((\n|\r|.)*?)(?:<\/script>)/ig;var _134=/\ssrc=([\'\"])(.*?)\1/i;var _135=/\stype=([\'\"])(.*?)\1/i;var _136;while(_136=re.exec(html)){var _137=_136[1];var _138=_137?_137.match(_134):false;if(_138&&_138[2]){var s=document.createElement("script");s.src=_138[2];var _13a=_137.match(_135);if(_13a&&_13a[2]){s.type=_13a[2];}hd.appendChild(s);}else{if(_136[2]&&_136[2].length>0){eval(_136[2]);}}}var el=document.getElementById(id);if(el){el.parentNode.removeChild(el);}if(typeof _12f=="function"){_12f();}});dom.innerHTML=html.replace(/(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)/ig,"");return this;},load:function(){var um=this.getUpdateManager();um.update.apply(um,arguments);return this;},getUpdateManager:function(){if(!this.updateManager){this.updateManager=new Ext.UpdateManager(this);}return this.updateManager;},unselectable:function(){this.dom.unselectable="on";this.swallowEvent("selectstart",true);this.applyStyles("-moz-user-select:none;-khtml-user-select:none;");this.addClass("x-unselectable");return this;},getCenterXY:function(){return this.getAlignToXY(document,"c-c");},center:function(_13d){this.alignTo(_13d||document,"c-c");return this;},isBorderBox:function(){return _13e[this.dom.tagName.toLowerCase()]||Ext.isBorderBox;},getBox:function(_13f,_140){var xy;if(!_140){xy=this.getXY();}else{var left=parseInt(this.getStyle("left"),10)||0;var top=parseInt(this.getStyle("top"),10)||0;xy=[left,top];}var el=this.dom,w=el.offsetWidth,h=el.offsetHeight,bx;if(!_13f){bx={x:xy[0],y:xy[1],0:xy[0],1:xy[1],width:w,height:h};}else{var l=this.getBorderWidth("l")+this.getPadding("l");var r=this.getBorderWidth("r")+this.getPadding("r");var t=this.getBorderWidth("t")+this.getPadding("t");var b=this.getBorderWidth("b")+this.getPadding("b");bx={x:xy[0]+l,y:xy[1]+t,0:xy[0]+l,1:xy[1]+t,width:w-(l+r),height:h-(t+b)};}bx.right=bx.x+bx.width;bx.bottom=bx.y+bx.height;return bx;},getFrameWidth:function(_14c){return this.getPadding(_14c)+this.getBorderWidth(_14c);},setBox:function(box,_14e,_14f){var w=box.width,h=box.height;if((_14e&&!this.autoBoxAdjust)&&!this.isBorderBox()){w-=(this.getBorderWidth("lr")+this.getPadding("lr"));h-=(this.getBorderWidth("tb")+this.getPadding("tb"));}this.setBounds(box.x,box.y,w,h,this.preanim(arguments,2));return this;},repaint:function(){var dom=this.dom;this.addClass("x-repaint");setTimeout(function(){Ext.get(dom).removeClass("x-repaint");},1);return this;},getMargins:function(side){if(!side){return {top:parseInt(this.getStyle("margin-top"),10)||0,left:parseInt(this.getStyle("margin-left"),10)||0,bottom:parseInt(this.getStyle("margin-bottom"),10)||0,right:parseInt(this.getStyle("margin-right"),10)||0};}else{return this.addStyles(side,El.margins);}},addStyles:function(_154,_155){var val=0;for(var i=0,len=_154.length;i<len;i++){var w=parseInt(this.getStyle(_155[_154.charAt(i)]),10);if(!isNaN(w)){val+=w;}}return val;},createProxy:function(_15a,_15b,_15c){if(_15b){_15b=Ext.getDom(_15b);}else{_15b=document.body;}_15a=typeof _15a=="object"?_15a:{tag:"div",cls:_15a};var _15d=Ext.DomHelper.append(_15b,_15a,true);if(_15c){_15d.setBox(this.getBox());}return _15d;},mask:function(msg,_15f){if(this.getStyle("position")=="static"){this.setStyle("position","relative");}if(!this._mask){this._mask=Ext.DomHelper.append(this.dom,{tag:"div",cls:"ext-el-mask"},true);}this.addClass("x-masked");this._mask.setDisplayed(true);if(typeof msg=="string"){if(!this._maskMsg){this._maskMsg=Ext.DomHelper.append(this.dom,{tag:"div",cls:"ext-el-mask-msg",cn:{tag:"div"}},true);}var mm=this._maskMsg;mm.dom.className=_15f?"ext-el-mask-msg "+_15f:"ext-el-mask-msg";mm.dom.firstChild.innerHTML=msg;mm.setDisplayed(true);mm.center(this);}return this._mask;},unmask:function(_161){if(this._mask){if(_161===true){this._mask.remove();delete this._mask;if(this._maskMsg){this._maskMsg.remove();delete this._maskMsg;}}else{this._mask.setDisplayed(false);if(this._maskMsg){this._maskMsg.setDisplayed(false);}}}this.removeClass("x-masked");},isMasked:function(){return this._mask&&this._mask.isVisible();},createShim:function(){var el=document.createElement("iframe");el.frameBorder="no";el.className="ext-shim";if(Ext.isIE&&Ext.isSecure){el.src=Ext.SSL_SECURE_URL;}var shim=Ext.get(this.dom.parentNode.insertBefore(el,this.dom));shim.autoBoxAdjust=false;return shim;},remove:function(){if(this.dom.parentNode){this.dom.parentNode.removeChild(this.dom);}delete El.cache[this.dom.id];},addClassOnOver:function(_164,_165){this.on("mouseover",function(){Ext.fly(this,"_internal").addClass(_164);},this.dom);var _166=function(e){if(_165!==true||!e.within(this,true)){Ext.fly(this,"_internal").removeClass(_164);}};this.on("mouseout",_166,this.dom);return this;},addClassOnFocus:function(_168){this.on("focus",function(){Ext.fly(this,"_internal").addClass(_168);},this.dom);this.on("blur",function(){Ext.fly(this,"_internal").removeClass(_168);},this.dom);return this;},addClassOnClick:function(_169){var dom=this.dom;this.on("mousedown",function(){Ext.fly(dom,"_internal").addClass(_169);var d=Ext.get(document);var fn=function(){Ext.fly(dom,"_internal").removeClass(_169);d.removeListener("mouseup",fn);};d.on("mouseup",fn);});return this;},swallowEvent:function(_16d,_16e){var fn=function(e){e.stopPropagation();if(_16e){e.preventDefault();}};if(_16d instanceof Array){for(var i=0,len=_16d.length;i<len;i++){this.on(_16d[i],fn);}return this;}this.on(_16d,fn);return this;},fitToParent:function(_173,_174){var p=Ext.get(_174||this.dom.parentNode);this.setSize(p.getComputedWidth()-p.getFrameWidth("lr"),p.getComputedHeight()-p.getFrameWidth("tb"));if(_173===true){Ext.EventManager.onWindowResize(this.fitToParent.createDelegate(this,[]));}return this;},getNextSibling:function(){var n=this.dom.nextSibling;while(n&&n.nodeType!=1){n=n.nextSibling;}return n;},getPrevSibling:function(){var n=this.dom.previousSibling;while(n&&n.nodeType!=1){n=n.previousSibling;}return n;},appendChild:function(el){el=Ext.get(el);el.appendTo(this);return this;},createChild:function(_179,_17a,_17b){_179=_179||{tag:"div"};if(_17a){return Ext.DomHelper.insertBefore(_17a,_179,_17b!==true);}return Ext.DomHelper[!this.dom.firstChild?"overwrite":"append"](this.dom,_179,_17b!==true);},appendTo:function(el){el=Ext.getDom(el);el.appendChild(this.dom);return this;},insertBefore:function(el){el=Ext.getDom(el);el.parentNode.insertBefore(this.dom,el);return this;},insertAfter:function(el){el=Ext.getDom(el);el.parentNode.insertBefore(this.dom,el.nextSibling);return this;},insertFirst:function(el,_180){el=el||{};if(typeof el=="object"&&!el.nodeType){return this.createChild(el,this.dom.firstChild,_180);}else{el=Ext.getDom(el);this.dom.insertBefore(el,this.dom.firstChild);return !_180?Ext.get(el):el;}},insertSibling:function(el,_182,_183){_182=_182?_182.toLowerCase():"before";el=el||{};var rt,_185=_182=="before"?this.dom:this.dom.nextSibling;if(typeof el=="object"&&!el.nodeType){if(_182=="after"&&!this.dom.nextSibling){rt=Ext.DomHelper.append(this.dom.parentNode,el,!_183);}else{rt=Ext.DomHelper[_182=="after"?"insertAfter":"insertBefore"](this.dom,el,!_183);}}else{rt=this.dom.parentNode.insertBefore(Ext.getDom(el),_182=="before"?this.dom:this.dom.nextSibling);if(!_183){rt=Ext.get(rt);}}return rt;},wrap:function(_186,_187){if(!_186){_186={tag:"div"};}var _188=Ext.DomHelper.insertBefore(this.dom,_186,!_187);_188.dom?_188.dom.appendChild(this.dom):_188.appendChild(this.dom);return _188;},replace:function(el){el=Ext.get(el);this.insertBefore(el);el.remove();return this;},insertHtml:function(_18a,html){return Ext.DomHelper.insertHtml(_18a,this.dom,html);},set:function(o,_18d){var el=this.dom;_18d=typeof _18d=="undefined"?(el.setAttribute?true:false):_18d;for(var attr in o){if(attr=="style"||typeof o[attr]=="function"){continue;}if(attr=="cls"){el.className=o["cls"];}else{if(_18d){el.setAttribute(attr,o[attr]);}else{el[attr]=o[attr];}}}Ext.DomHelper.applyStyles(el,o.style);return this;},addKeyListener:function(key,fn,_192){var _193;if(typeof key!="object"||key instanceof Array){_193={key:key,fn:fn,scope:_192};}else{_193={key:key.key,shift:key.shift,ctrl:key.ctrl,alt:key.alt,fn:fn,scope:_192};}return new Ext.KeyMap(this,_193);},addKeyMap:function(_194){return new Ext.KeyMap(this,_194);},isScrollable:function(){var dom=this.dom;return dom.scrollHeight>dom.clientHeight||dom.scrollWidth>dom.clientWidth;},scrollTo:function(side,_197,_198){var prop=side.toLowerCase()=="left"?"scrollLeft":"scrollTop";if(!_198||!A){this.dom[prop]=_197;}else{var to=prop=="scrollLeft"?[_197,this.dom.scrollTop]:[this.dom.scrollLeft,_197];this.anim({scroll:{"to":to}},this.preanim(arguments,2),"scroll");}return this;},scroll:function(_19b,_19c,_19d){if(!this.isScrollable()){return;}var el=this.dom;var l=el.scrollLeft,t=el.scrollTop;var w=el.scrollWidth,h=el.scrollHeight;var cw=el.clientWidth,ch=el.clientHeight;_19b=_19b.toLowerCase();var _1a5=false;var a=this.preanim(arguments,2);switch(_19b){case "l":case "left":if(w-l>cw){var v=Math.min(l+_19c,w-cw);this.scrollTo("left",v,a);_1a5=true;}break;case "r":case "right":if(l>0){var v=Math.max(l-_19c,0);this.scrollTo("left",v,a);_1a5=true;}break;case "t":case "top":case "up":if(t>0){var v=Math.max(t-_19c,0);this.scrollTo("top",v,a);_1a5=true;}break;case "b":case "bottom":case "down":if(h-t>ch){var v=Math.min(t+_19c,h-ch);this.scrollTo("top",v,a);_1a5=true;}break;}return _1a5;},translatePoints:function(x,y){if(typeof x=="object"||x instanceof Array){y=x[1];x=x[0];}var p=this.getStyle("position");var o=this.getXY();var l=parseInt(this.getStyle("left"),10);var t=parseInt(this.getStyle("top"),10);if(isNaN(l)){l=(p=="relative")?0:this.dom.offsetLeft;}if(isNaN(t)){t=(p=="relative")?0:this.dom.offsetTop;}return {left:(x-o[0]+l),top:(y-o[1]+t)};},getScroll:function(){var d=this.dom,doc=document;if(d==doc||d==doc.body){var l=window.pageXOffset||doc.documentElement.scrollLeft||doc.body.scrollLeft||0;var t=window.pageYOffset||doc.documentElement.scrollTop||doc.body.scrollTop||0;return {left:l,top:t};}else{return {left:d.scrollLeft,top:d.scrollTop};}},getColor:function(attr,_1b3,_1b4){var v=this.getStyle(attr);if(!v||v=="transparent"||v=="inherit"){return _1b3;}var _1b6=typeof _1b4=="undefined"?"#":_1b4;if(v.substr(0,4)=="rgb("){var rvs=v.slice(4,v.length-1).split(",");for(var i=0;i<3;i++){var h=parseInt(rvs[i]).toString(16);if(h<16){h="0"+h;}_1b6+=h;}}else{if(v.substr(0,1)=="#"){if(v.length==4){for(var i=1;i<4;i++){var c=v.charAt(i);_1b6+=c+c;}}else{if(v.length==7){_1b6+=v.substr(1);}}}}return (_1b6.length>5?_1b6.toLowerCase():_1b3);},boxWrap:function(cls){cls=cls||"x-box";var el=Ext.get(this.insertHtml("beforeBegin",String.format("<div class=\"{0}\">"+El.boxMarkup+"</div>",cls)));el.child("."+cls+"-mc").dom.appendChild(this.dom);return el;},getAttributeNS:Ext.isIE?function(ns,name){var d=this.dom;var type=typeof d[ns+":"+name];if(type!="undefined"&&type!="unknown"){return d[ns+":"+name];}return d[name];}:function(ns,name){var d=this.dom;return d.getAttributeNS(ns,name)||d.getAttribute(ns+":"+name)||d.getAttribute(name)||d[name];}};var ep=El.prototype;ep.on=ep.addListener;ep.mon=ep.addListener;ep.un=ep.removeListener;ep.autoBoxAdjust=true;ep.autoDisplayMode=true;El.unitPattern=/\d+(px|em|%|en|ex|pt|in|cm|mm|pc)$/i;El.addUnits=function(v,_1c6){if(v===""||v=="auto"){return v;}if(v===undefined){return "";}if(typeof v=="number"||!El.unitPattern.test(v)){return v+(_1c6||"px");}return v;};El.boxMarkup="<div class=\"{0}-tl\"><div class=\"{0}-tr\"><div class=\"{0}-tc\"></div></div></div><div class=\"{0}-ml\"><div class=\"{0}-mr\"><div class=\"{0}-mc\"></div></div></div><div class=\"{0}-bl\"><div class=\"{0}-br\"><div class=\"{0}-bc\"></div></div></div>";El.VISIBILITY=1;El.DISPLAY=2;El.borders={l:"border-left-width",r:"border-right-width",t:"border-top-width",b:"border-bottom-width"};El.paddings={l:"padding-left",r:"padding-right",t:"padding-top",b:"padding-bottom"};El.margins={l:"margin-left",r:"margin-right",t:"margin-top",b:"margin-bottom"};El.cache={};var _1c7;El.get=function(el){var ex,elm,id;if(!el){return null;}if(typeof el=="string"){if(!(elm=document.getElementById(el))){return null;}if(ex=El.cache[el]){ex.dom=elm;}else{ex=El.cache[el]=new El(elm);}return ex;}else{if(el.tagName){if(!(id=el.id)){id=Ext.id(el);}if(ex=El.cache[id]){ex.dom=el;}else{ex=El.cache[id]=new El(el);}return ex;}else{if(el instanceof El){if(el!=_1c7){el.dom=document.getElementById(el.id)||el.dom;El.cache[el.id]=el;}return el;}else{if(el.isComposite){return el;}else{if(el instanceof Array){return El.select(el);}else{if(el==document){if(!_1c7){var f=function(){};f.prototype=El.prototype;_1c7=new f();_1c7.dom=document;}return _1c7;}}}}}}return null;};El.uncache=function(el){for(var i=0,a=arguments,len=a.length;i<len;i++){if(a[i]){delete El.cache[a[i].id||a[i]];}}};El.Flyweight=function(dom){this.dom=dom;};El.Flyweight.prototype=El.prototype;El._flyweights={};El.fly=function(el,_1d3){_1d3=_1d3||"_global";el=Ext.getDom(el);if(!el){return null;}if(!El._flyweights[_1d3]){El._flyweights[_1d3]=new El.Flyweight();}El._flyweights[_1d3].dom=el;return El._flyweights[_1d3];};Ext.get=El.get;Ext.fly=El.fly;var _13e=Ext.isStrict?{select:1}:{input:1,select:1,textarea:1};if(Ext.isIE||Ext.isGecko){_13e["button"]=1;}Ext.EventManager.on(window,"unload",function(){delete El.cache;delete El._flyweights;});})();



Ext.enableFx=true;Ext.Fx={slideIn:function(_1,o){var el=this.getFxEl();o=o||{};el.queueFx(o,function(){_1=_1||"t";this.fixDisplay();var r=this.getFxRestore();var b=this.getBox();this.setSize(b);var _6=this.fxWrap(r.pos,o,"hidden");var st=this.dom.style;st.visibility="visible";st.position="absolute";var _8=function(){el.fxUnwrap(_6,r.pos,o);st.width=r.width;st.height=r.height;el.afterFx(o);};var a,pt={to:[b.x,b.y]},bw={to:b.width},bh={to:b.height};switch(_1.toLowerCase()){case "t":_6.setSize(b.width,0);st.left=st.bottom="0";a={height:bh};break;case "l":_6.setSize(0,b.height);st.right=st.top="0";a={width:bw};break;case "r":_6.setSize(0,b.height);_6.setX(b.right);st.left=st.top="0";a={width:bw,points:pt};break;case "b":_6.setSize(b.width,0);_6.setY(b.bottom);st.left=st.top="0";a={height:bh,points:pt};break;case "tl":_6.setSize(0,0);st.right=st.bottom="0";a={width:bw,height:bh};break;case "bl":_6.setSize(0,0);_6.setY(b.y+b.height);st.right=st.top="0";a={width:bw,height:bh,points:pt};break;case "br":_6.setSize(0,0);_6.setXY([b.right,b.bottom]);st.left=st.top="0";a={width:bw,height:bh,points:pt};break;case "tr":_6.setSize(0,0);_6.setX(b.x+b.width);st.left=st.bottom="0";a={width:bw,height:bh,points:pt};break;}this.dom.style.visibility="visible";_6.show();arguments.callee.anim=_6.fxanim(a,o,"motion",0.5,"easeOut",_8);});return this;},slideOut:function(_d,o){var el=this.getFxEl();o=o||{};el.queueFx(o,function(){_d=_d||"t";var r=this.getFxRestore();var b=this.getBox();this.setSize(b);var _12=this.fxWrap(r.pos,o,"visible");var st=this.dom.style;st.visibility="visible";st.position="absolute";_12.setSize(b);var _14=function(){if(o.useDisplay){el.setDisplayed(false);}else{el.hide();}el.fxUnwrap(_12,r.pos,o);st.width=r.width;st.height=r.height;el.afterFx(o);};var a,_16={to:0};switch(_d.toLowerCase()){case "t":st.left=st.bottom="0";a={height:_16};break;case "l":st.right=st.top="0";a={width:_16};break;case "r":st.left=st.top="0";a={width:_16,points:{to:[b.right,b.y]}};break;case "b":st.left=st.top="0";a={height:_16,points:{to:[b.x,b.bottom]}};break;case "tl":st.right=st.bottom="0";a={width:_16,height:_16};break;case "bl":st.right=st.top="0";a={width:_16,height:_16,points:{to:[b.x,b.bottom]}};break;case "br":st.left=st.top="0";a={width:_16,height:_16,points:{to:[b.x+b.width,b.bottom]}};break;case "tr":st.left=st.bottom="0";a={width:_16,height:_16,points:{to:[b.right,b.y]}};break;}arguments.callee.anim=_12.fxanim(a,o,"motion",0.5,"easeOut",_14);});return this;},puff:function(o){var el=this.getFxEl();o=o||{};el.queueFx(o,function(){this.clearOpacity();this.show();var r=this.getFxRestore();var st=this.dom.style;var _1b=function(){if(o.useDisplay){el.setDisplayed(false);}else{el.hide();}el.clearOpacity();el.setPositioning(r.pos);st.width=r.width;st.height=r.height;st.fontSize="";el.afterFx(o);};var _1c=this.getWidth();var _1d=this.getHeight();arguments.callee.anim=this.fxanim({width:{to:this.adjustWidth(_1c*2)},height:{to:this.adjustHeight(_1d*2)},points:{by:[-(_1c*0.5),-(_1d*0.5)]},opacity:{to:0},fontSize:{to:200,unit:"%"}},o,"motion",0.5,"easeOut",_1b);});return this;},switchOff:function(o){var el=this.getFxEl();o=o||{};el.queueFx(o,function(){this.clearOpacity();this.clip();var r=this.getFxRestore();var st=this.dom.style;var _22=function(){if(o.useDisplay){el.setDisplayed(false);}else{el.hide();}el.clearOpacity();el.setPositioning(r.pos);st.width=r.width;st.height=r.height;el.afterFx(o);};this.fxanim({opacity:{to:0.3}},null,null,0.1,null,function(){this.clearOpacity();(function(){this.fxanim({height:{to:1},points:{by:[0,this.getHeight()*0.5]}},o,"motion",0.3,"easeIn",_22);}).defer(100,this);});});return this;},highlight:function(_23,o){var el=this.getFxEl();o=o||{};el.queueFx(o,function(){_23=_23||"ffff9c";attr=o.attr||"backgroundColor";this.clearOpacity();this.show();var _26=this.getColor(attr);var _27=this.dom.style[attr];endColor=(o.endColor||_26)||"ffffff";var _28=function(){el.dom.style[attr]=_27;el.afterFx(o);};var a={};a[attr]={from:_23,to:endColor};arguments.callee.anim=this.fxanim(a,o,"color",1,"easeIn",_28);});return this;},frame:function(_2a,_2b,o){var el=this.getFxEl();o=o||{};el.queueFx(o,function(){_2a=_2a||"#C3DAF9";if(_2a.length==6){_2a="#"+_2a;}_2b=_2b||1;duration=o.duration||1;this.show();var b=this.getBox();var _2f=function(){var _30=this.createProxy({tag:"div",style:{visbility:"hidden",position:"absolute","z-index":"35000",border:"0px solid "+_2a}});var _31=Ext.isBorderBox?2:1;_30.animate({top:{from:b.y,to:b.y-20},left:{from:b.x,to:b.x-20},borderWidth:{from:0,to:10},opacity:{from:1,to:0},height:{from:b.height,to:(b.height+(20*_31))},width:{from:b.width,to:(b.width+(20*_31))}},duration,function(){_30.remove();});if(--_2b>0){_2f.defer((duration/2)*1000,this);}else{el.afterFx(o);}};_2f.call(this);});return this;},pause:function(_32){var el=this.getFxEl();var o={};el.queueFx(o,function(){setTimeout(function(){el.afterFx(o);},_32*1000);});return this;},fadeIn:function(o){var el=this.getFxEl();o=o||{};el.queueFx(o,function(){this.setOpacity(0);this.fixDisplay();this.dom.style.visibility="visible";var to=o.endOpacity||1;arguments.callee.anim=this.fxanim({opacity:{to:to}},o,null,0.5,"easeOut",function(){if(to==1){this.clearOpacity();}el.afterFx(o);});});return this;},fadeOut:function(o){var el=this.getFxEl();o=o||{};el.queueFx(o,function(){arguments.callee.anim=this.fxanim({opacity:{to:o.endOpacity||0}},o,null,0.5,"easeOut",function(){if(this.visibilityMode==Ext.Element.DISPLAY||o.useDisplay){this.dom.style.display="none";}else{this.dom.style.visibility="hidden";}this.clearOpacity();el.afterFx(o);});});return this;},scale:function(w,h,o){this.shift(Ext.apply({},o,{width:w,height:h}));return this;},shift:function(o){var el=this.getFxEl();o=o||{};el.queueFx(o,function(){var a={},w=o.width,h=o.height,x=o.x,y=o.y,op=o.opacity;if(w!==undefined){a.width={to:this.adjustWidth(w)};}if(h!==undefined){a.height={to:this.adjustHeight(h)};}if(x!==undefined||y!==undefined){a.points={to:[x!==undefined?x:this.getX(),y!==undefined?y:this.getY()]};}if(op!==undefined){a.opacity={to:op};}if(o.xy!==undefined){a.points={to:o.xy};}arguments.callee.anim=this.fxanim(a,o,"motion",0.35,"easeOut",function(){el.afterFx(o);});});return this;},ghost:function(_45,o){var el=this.getFxEl();o=o||{};el.queueFx(o,function(){_45=_45||"b";var r=this.getFxRestore();var w=this.getWidth(),h=this.getHeight();var st=this.dom.style;var _4c=function(){if(o.useDisplay){el.setDisplayed(false);}else{el.hide();}el.clearOpacity();el.setPositioning(r.pos);st.width=r.width;st.height=r.height;el.afterFx(o);};var a={opacity:{to:0},points:{}},pt=a.points;switch(_45.toLowerCase()){case "t":pt.by=[0,-h];break;case "l":pt.by=[-w,0];break;case "r":pt.by=[w,0];break;case "b":pt.by=[0,h];break;case "tl":pt.by=[-w,-h];break;case "bl":pt.by=[-w,h];break;case "br":pt.by=[w,h];break;case "tr":pt.by=[w,-h];break;}arguments.callee.anim=this.fxanim(a,o,"motion",0.5,"easeOut",_4c);});return this;},syncFx:function(){this.fxDefaults=Ext.apply(this.fxDefaults||{},{block:false,concurrent:true,stopFx:false});return this;},sequenceFx:function(){this.fxDefaults=Ext.apply(this.fxDefaults||{},{block:false,concurrent:false,stopFx:false});return this;},nextFx:function(){var ef=this.fxQueue[0];if(ef){ef.call(this);}},hasActiveFx:function(){return this.fxQueue&&this.fxQueue[0];},stopFx:function(){if(this.hasActiveFx()){var cur=this.fxQueue[0];if(cur&&cur.anim&&cur.anim.isAnimated()){this.fxQueue=[cur];cur.anim.stop(true);}}return this;},beforeFx:function(o){if(this.hasActiveFx()&&!o.concurrent){if(o.stopFx){this.stopFx();return true;}return false;}return true;},hasFxBlock:function(){var q=this.fxQueue;return q&&q[0]&&q[0].block;},queueFx:function(o,fn){if(!this.fxQueue){this.fxQueue=[];}if(!this.hasFxBlock()){Ext.applyIf(o,this.fxDefaults);if(!o.concurrent){var run=this.beforeFx(o);fn.block=o.block;this.fxQueue.push(fn);if(run){this.nextFx();}}else{fn.call(this);}}return this;},fxWrap:function(pos,o,vis){var _59;if(!o.wrap||!(_59=Ext.get(o.wrap))){var _5a;if(o.fixPosition){_5a=this.getXY();}var div=document.createElement("div");div.style.visibility=vis;_59=Ext.get(this.dom.parentNode.insertBefore(div,this.dom));_59.setPositioning(pos);if(_59.getStyle("position")=="static"){_59.position("relative");}this.clearPositioning("auto");_59.clip();_59.dom.appendChild(this.dom);if(_5a){_59.setXY(_5a);}}return _59;},fxUnwrap:function(_5c,pos,o){this.clearPositioning();this.setPositioning(pos);if(!o.wrap){_5c.dom.parentNode.insertBefore(this.dom,_5c.dom);_5c.remove();}},getFxRestore:function(){var st=this.dom.style;return {pos:this.getPositioning(),width:st.width,height:st.height};},afterFx:function(o){if(o.afterStyle){this.applyStyles(o.afterStyle);}if(o.afterCls){this.addClass(o.afterCls);}if(o.remove===true){this.remove();}Ext.callback(o.callback,o.scope,[this]);if(!o.concurrent){this.fxQueue.shift();this.nextFx();}},getFxEl:function(){return Ext.get(this.dom);},fxanim:function(_61,opt,_63,_64,_65,cb){_63=_63||"run";opt=opt||{};var _67=Ext.lib.Anim[_63](this.dom,_61,(opt.duration||_64)||0.35,(opt.easing||_65)||"easeOut",function(){Ext.callback(cb,this);},this);opt.anim=_67;return _67;}};Ext.Fx.resize=Ext.Fx.scale;Ext.apply(Ext.Element.prototype,Ext.Fx);



Ext.CompositeElement=function(_1){this.elements=[];this.addElements(_1);};Ext.CompositeElement.prototype={isComposite:true,addElements:function(_2){if(!_2){return this;}if(typeof _2=="string"){_2=Ext.Element.selectorFunction(_2);}var _3=this.elements;var _4=_3.length-1;for(var i=0,_6=_2.length;i<_6;i++){_3[++_4]=Ext.get(_2[i],true);}return this;},invoke:function(fn,_8){var _9=this.elements;for(var i=0,_b=_9.length;i<_b;i++){Ext.Element.prototype[fn].apply(_9[i],_8);}return this;},add:function(_c){if(typeof _c=="string"){this.addElements(Ext.Element.selectorFunction(_c));}else{if(_c.length!==undefined){this.addElements(_c);}else{this.addElements([_c]);}}return this;},each:function(fn,_e){var _f=this.elements;for(var i=0,len=_f.length;i<len;i++){if(fn.call(_e||_f[i],_f[i],this,i)===false){break;}}return this;},item:function(_12){return this.elements[_12];}};(function(){Ext.CompositeElement.createCall=function(_13,_14){if(!_13[_14]){_13[_14]=function(){return this.invoke(_14,arguments);};}};for(var _15 in Ext.Element.prototype){if(typeof Ext.Element.prototype[_15]=="function"){Ext.CompositeElement.createCall(Ext.CompositeElement.prototype,_15);}}})();Ext.CompositeElementLite=function(els){Ext.CompositeElementLite.superclass.constructor.call(this,els);var _17=function(){};_17.prototype=Ext.Element.prototype;this.el=new Ext.Element.Flyweight();};Ext.extend(Ext.CompositeElementLite,Ext.CompositeElement,{addElements:function(els){if(els){if(els instanceof Array){this.elements=this.elements.concat(els);}else{var _19=this.elements;var _1a=_19.length-1;for(var i=0,len=els.length;i<len;i++){_19[++_1a]=els[i];}}}return this;},invoke:function(fn,_1e){var els=this.elements;var el=this.el;for(var i=0,len=els.length;i<len;i++){el.dom=els[i];Ext.Element.prototype[fn].apply(el,_1e);}return this;},item:function(_23){this.el.dom=this.elements[_23];return this.el;},addListener:function(_24,_25,_26,opt){var els=this.elements;for(var i=0,len=els.length;i<len;i++){Ext.EventManager.on(els[i],_24,_25,_26||els[i],opt);}return this;},each:function(fn,_2c){var els=this.elements;var el=this.el;for(var i=0,len=els.length;i<len;i++){el.dom=els[i];if(fn.call(_2c||el,el,this,i)===false){break;}}return this;}});Ext.CompositeElementLite.prototype.on=Ext.CompositeElementLite.prototype.addListener;if(Ext.DomQuery){Ext.Element.selectorFunction=Ext.DomQuery.select;}Ext.Element.select=function(_31,_32){var els;if(typeof _31=="string"){els=Ext.Element.selectorFunction(_31);}else{if(_31.length!==undefined){els=_31;}else{throw "Invalid selector";}}if(_32===true){return new Ext.CompositeElement(els);}else{return new Ext.CompositeElementLite(els);}};Ext.select=Ext.Element.select;



Ext.UpdateManager=function(el,_2){el=Ext.get(el);if(!_2&&el.updateManager){return el.updateManager;}this.el=el;this.defaultUrl=null;this.addEvents({"beforeupdate":true,"update":true,"failure":true});var d=Ext.UpdateManager.defaults;this.sslBlankUrl=d.sslBlankUrl;this.disableCaching=d.disableCaching;this.indicatorText=d.indicatorText;this.showLoadIndicator=d.showLoadIndicator;this.timeout=d.timeout;this.loadScripts=d.loadScripts;this.transaction=null;this.autoRefreshProcId=null;this.refreshDelegate=this.refresh.createDelegate(this);this.updateDelegate=this.update.createDelegate(this);this.formUpdateDelegate=this.formUpdate.createDelegate(this);this.successDelegate=this.processSuccess.createDelegate(this);this.failureDelegate=this.processFailure.createDelegate(this);this.renderer=new Ext.UpdateManager.BasicRenderer();Ext.UpdateManager.superclass.constructor.call(this);};Ext.extend(Ext.UpdateManager,Ext.util.Observable,{getEl:function(){return this.el;},update:function(_4,_5,_6,_7){if(this.fireEvent("beforeupdate",this.el,_4,_5)!==false){var _8=this.method;if(typeof _4=="object"){var _9=_4;_4=_9.url;_5=_5||_9.params;_6=_6||_9.callback;_7=_7||_9.discardUrl;if(_6&&_9.scope){_6=_6.createDelegate(_9.scope);}if(typeof _9.method!="undefined"){_8=_9.method;}if(typeof _9.nocache!="undefined"){this.disableCaching=_9.nocache;}if(typeof _9.text!="undefined"){this.indicatorText="<div class=\"loading-indicator\">"+_9.text+"</div>";}if(typeof _9.scripts!="undefined"){this.loadScripts=_9.scripts;}if(typeof _9.timeout!="undefined"){this.timeout=_9.timeout;}}this.showLoading();if(!_7){this.defaultUrl=_4;}if(typeof _4=="function"){_4=_4.call(this);}if(typeof _5=="function"){_5=_5();}if(_5&&typeof _5!="string"){var _a=[];for(var _b in _5){if(typeof _5[_b]!="function"){_a.push(encodeURIComponent(_b),"=",encodeURIComponent(_5[_b]),"&");}}delete _a[_a.length-1];_5=_a.join("");}var cb={success:this.successDelegate,failure:this.failureDelegate,timeout:(this.timeout*1000),argument:{"url":_4,"form":null,"callback":_6,"params":_5}};_8=_8||(_5?"POST":"GET");if(_8=="GET"){_4=this.prepareUrl(_4);}this.transaction=Ext.lib.Ajax.request(_8,_4,cb,_5);}},formUpdate:function(_d,_e,_f,_10){if(this.fireEvent("beforeupdate",this.el,_d,_e)!==false){formEl=Ext.getDom(_d);if(typeof _e=="function"){_e=_e.call(this);}if(typeof params=="function"){params=params();}_e=_e||formEl.action;var cb={success:this.successDelegate,failure:this.failureDelegate,timeout:(this.timeout*1000),argument:{"url":_e,"form":formEl,"callback":_10,"reset":_f}};var _12=false;var _13=formEl.getAttribute("enctype");if(_13&&_13.toLowerCase()=="multipart/form-data"){_12=true;cb.upload=this.successDelegate;}this.transaction=Ext.lib.Ajax.formRequest(formEl,_e,cb,null,_12,this.sslBlankUrl);this.showLoading.defer(1,this);}},refresh:function(_14){if(this.defaultUrl==null){return;}this.update(this.defaultUrl,null,_14,true);},startAutoRefresh:function(_15,url,_17,_18,_19){if(_19){this.update(url||this.defaultUrl,_17,_18,true);}if(this.autoRefreshProcId){clearInterval(this.autoRefreshProcId);}this.autoRefreshProcId=setInterval(this.update.createDelegate(this,[url||this.defaultUrl,_17,_18,true]),_15*1000);},stopAutoRefresh:function(){if(this.autoRefreshProcId){clearInterval(this.autoRefreshProcId);delete this.autoRefreshProcId;}},isAutoRefreshing:function(){return this.autoRefreshProcId?true:false;},showLoading:function(){if(this.showLoadIndicator){this.el.update(this.indicatorText);}},prepareUrl:function(url){if(this.disableCaching){var _1b="_dc="+(new Date().getTime());if(url.indexOf("?")!==-1){url+="&"+_1b;}else{url+="?"+_1b;}}return url;},processSuccess:function(_1c){this.transaction=null;if(_1c.argument.form&&_1c.argument.reset){try{_1c.argument.form.reset();}catch(e){}}if(this.loadScripts){this.renderer.render(this.el,_1c,this,this.updateComplete.createDelegate(this,[_1c]));}else{this.renderer.render(this.el,_1c,this);this.updateComplete(_1c);}},updateComplete:function(_1d){this.fireEvent("update",this.el,_1d);if(typeof _1d.argument.callback=="function"){_1d.argument.callback(this.el,true,_1d);}},processFailure:function(_1e){this.transaction=null;this.fireEvent("failure",this.el,_1e);if(typeof _1e.argument.callback=="function"){_1e.argument.callback(this.el,false,_1e);}},setRenderer:function(_1f){this.renderer=_1f;},getRenderer:function(){return this.renderer;},setDefaultUrl:function(_20){this.defaultUrl=_20;},abort:function(){if(this.transaction){Ext.lib.Ajax.abort(this.transaction);}},isUpdating:function(){if(this.transaction){return Ext.lib.Ajax.isCallInProgress(this.transaction);}return false;}});Ext.UpdateManager.defaults={timeout:30,loadScripts:false,sslBlankUrl:(Ext.SSL_SECURE_URL||"javascript:false"),disableCaching:false,showLoadIndicator:true,indicatorText:"<div class=\"loading-indicator\">Loading...</div>"};Ext.UpdateManager.updateElement=function(el,url,_23,_24){var um=Ext.get(el,true).getUpdateManager();Ext.apply(um,_24);um.update(url,_23,_24?_24.callback:null);};Ext.UpdateManager.update=Ext.UpdateManager.updateElement;Ext.UpdateManager.BasicRenderer=function(){};Ext.UpdateManager.BasicRenderer.prototype={render:function(el,_27,_28,_29){el.update(_27.responseText,_28.loadScripts,_29);}};



Ext.util.DelayedTask=function(fn,_2,_3){var id=null,d,t;var _7=function(){var _8=new Date().getTime();if(_8-t>=d){clearInterval(id);id=null;fn.apply(_2,_3||[]);}};this.delay=function(_9,_a,_b,_c){if(id&&_9!=d){this.cancel();}d=_9;t=new Date().getTime();fn=_a||fn;_2=_b||_2;_3=_c||_3;if(!id){id=setInterval(_7,d);}};this.cancel=function(){if(id){clearInterval(id);id=null;}};};



Ext.util.TaskRunner=function(_1){_1=_1||10;var _2=[],_3=[];var id=0;var _5=false;var _6=function(){_5=false;clearInterval(id);id=0;};var _7=function(){if(!_5){_5=true;id=setInterval(_8,_1);}};var _9=function(_a){_3.push(_a);if(_a.onStop){_a.onStop();}};var _8=function(){if(_3.length>0){for(var i=0,_c=_3.length;i<_c;i++){_2.remove(_3[i]);}_3=[];if(_2.length<1){_6();return;}}var _d=new Date().getTime();for(var i=0,_c=_2.length;i<_c;++i){var t=_2[i];var _f=_d-t.taskRunTime;if(t.interval<=_f){var rt=t.run.apply(t.scope||t,t.args||[++t.taskRunCount]);t.taskRunTime=_d;if(rt===false||t.taskRunCount===t.repeat){_9(t);return;}}if(t.duration&&t.duration<=(_d-t.taskStartTime)){_9(t);}}};this.start=function(_11){_2.push(_11);_11.taskStartTime=new Date().getTime();_11.taskRunTime=0;_11.taskRunCount=0;_7();return _11;};this.stop=function(_12){_9(_12);return _12;};this.stopAll=function(){_6();for(var i=0,len=_2.length;i<len;i++){if(_2[i].onStop){_2[i].onStop();}}_2=[];_3=[];};};Ext.TaskMgr=new Ext.util.TaskRunner();



Ext.util.MixedCollection=function(_1,_2){this.items=[];this.map={};this.keys=[];this.length=0;this.addEvents({"clear":true,"add":true,"replace":true,"remove":true,"sort":true});this.allowFunctions=_1===true;if(_2){this.getKey=_2;}Ext.util.MixedCollection.superclass.constructor.call(this);};Ext.extend(Ext.util.MixedCollection,Ext.util.Observable,{allowFunctions:false,add:function(_3,o){if(arguments.length==1){o=arguments[0];_3=this.getKey(o);}if(typeof _3=="undefined"||_3===null){this.length++;this.items.push(o);this.keys.push(null);}else{var _5=this.map[_3];if(_5){return this.replace(_3,o);}this.length++;this.items.push(o);this.map[_3]=o;this.keys.push(_3);}this.fireEvent("add",this.length-1,o,_3);return o;},getKey:function(o){return o.id;},replace:function(_7,o){if(arguments.length==1){o=arguments[0];_7=this.getKey(o);}var _9=this.item(_7);if(typeof _7=="undefined"||_7===null||typeof _9=="undefined"){return this.add(_7,o);}var _a=this.indexOfKey(_7);this.items[_a]=o;this.map[_7]=o;this.fireEvent("replace",_7,_9,o);return o;},addAll:function(_b){if(arguments.length>1||_b instanceof Array){var _c=arguments.length>1?arguments:_b;for(var i=0,_e=_c.length;i<_e;i++){this.add(_c[i]);}}else{for(var _f in _b){if(this.allowFunctions||typeof _b[_f]!="function"){this.add(_b[_f],_f);}}}},each:function(fn,_11){var _12=[].concat(this.items);for(var i=0,len=_12.length;i<len;i++){if(fn.call(_11||_12[i],_12[i],i,len)===false){break;}}},eachKey:function(fn,_16){for(var i=0,len=this.keys.length;i<len;i++){fn.call(_16||window,this.keys[i],this.items[i],i,len);}},find:function(fn,_1a){for(var i=0,len=this.items.length;i<len;i++){if(fn.call(_1a||window,this.items[i],this.keys[i])){return this.items[i];}}return null;},insert:function(_1d,key,o){if(arguments.length==2){o=arguments[1];key=this.getKey(o);}if(_1d>=this.length){return this.add(key,o);}this.length++;this.items.splice(_1d,0,o);if(typeof key!="undefined"&&key!=null){this.map[key]=o;}this.keys.splice(_1d,0,key);this.fireEvent("add",_1d,o,key);return o;},remove:function(o){return this.removeAt(this.indexOf(o));},removeAt:function(_21){if(_21<this.length&&_21>=0){this.length--;var o=this.items[_21];this.items.splice(_21,1);var key=this.keys[_21];if(typeof key!="undefined"){delete this.map[key];}this.keys.splice(_21,1);this.fireEvent("remove",o,key);}},removeKey:function(key){return this.removeAt(this.indexOfKey(key));},getCount:function(){return this.length;},indexOf:function(o){if(!this.items.indexOf){for(var i=0,len=this.items.length;i<len;i++){if(this.items[i]==o){return i;}}return -1;}else{return this.items.indexOf(o);}},indexOfKey:function(key){if(!this.keys.indexOf){for(var i=0,len=this.keys.length;i<len;i++){if(this.keys[i]==key){return i;}}return -1;}else{return this.keys.indexOf(key);}},item:function(key){var _2c=typeof this.map[key]!="undefined"?this.map[key]:this.items[key];return typeof _2c!="function"||this.allowFunctions?_2c:null;},itemAt:function(_2d){return this.items[_2d];},key:function(key){return this.map[key];},contains:function(o){return this.indexOf(o)!=-1;},containsKey:function(key){return typeof this.map[key]!="undefined";},clear:function(){this.length=0;this.items=[];this.keys=[];this.map={};this.fireEvent("clear");},first:function(){return this.items[0];},last:function(){return this.items[this.length-1];},_sort:function(_31,dir,fn){var dsc=String(dir).toUpperCase()=="DESC"?-1:1;fn=fn||function(a,b){return a-b;};var c=[],k=this.keys,_39=this.items;for(var i=0,len=_39.length;i<len;i++){c[c.length]={key:k[i],value:_39[i],index:i};}c.sort(function(a,b){var v=fn(a[_31],b[_31])*dsc;if(v==0){v=(a.index<b.index?-1:1);}return v;});for(var i=0,len=c.length;i<len;i++){_39[i]=c[i].value;k[i]=c[i].key;}this.fireEvent("sort",this);},sort:function(dir,fn){this._sort("value",dir,fn);},keySort:function(dir,fn){this._sort("key",dir,fn||function(a,b){return String(a).toUpperCase()-String(b).toUpperCase();});},getRange:function(_45,end){var _47=this.items;if(_47.length<1){return [];}_45=_45||0;end=Math.min(typeof end=="undefined"?this.length-1:end,this.length-1);var r=[];if(_45<=end){for(var i=_45;i<=end;i++){r[r.length]=_47[i];}}else{for(var i=_45;i>=end;i--){r[r.length]=_47[i];}}return r;},filter:function(_4a,_4b){if(!_4b.exec){_4b=String(_4b);if(_4b.length==0){return this.clone();}_4b=new RegExp("^"+Ext.escapeRe(_4b),"i");}return this.filterBy(function(o){return o&&_4b.test(o[_4a]);});},filterBy:function(fn,_4e){var r=new Ext.util.MixedCollection();r.getKey=this.getKey;var k=this.keys,it=this.items;for(var i=0,len=it.length;i<len;i++){if(fn.call(_4e||this,it[i],k[i])){r.add(k[i],it[i]);}}return r;},clone:function(){var r=new Ext.util.MixedCollection();var k=this.keys,it=this.items;for(var i=0,len=it.length;i<len;i++){r.add(k[i],it[i]);}r.getKey=this.getKey;return r;}});Ext.util.MixedCollection.prototype.get=Ext.util.MixedCollection.prototype.item;



Ext.util.JSON=new (function(){var _1={}.hasOwnProperty?true:false;var _2=function(n){return n<10?"0"+n:n;};var m={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r","\"":"\\\"","\\":"\\\\"};var _5=function(s){if(/["\\\x00-\x1f]/.test(s)){return "\""+s.replace(/([\x00-\x1f\\"])/g,function(a,b){var c=m[b];if(c){return c;}c=b.charCodeAt();return "\\u00"+Math.floor(c/16).toString(16)+(c%16).toString(16);})+"\"";}return "\""+s+"\"";};var _a=function(o){var a=["["],b,i,l=o.length,v;for(i=0;i<l;i+=1){v=o[i];switch(typeof v){case "undefined":case "function":case "unknown":break;default:if(b){a.push(",");}a.push(v===null?"null":Ext.util.JSON.encode(v));b=true;}}a.push("]");return a.join("");};var _11=function(o){return "\""+o.getFullYear()+"-"+_2(o.getMonth()+1)+"-"+_2(o.getDate())+"T"+_2(o.getHours())+":"+_2(o.getMinutes())+":"+_2(o.getSeconds())+"\"";};this.encode=function(o){if(typeof o=="undefined"||o===null){return "null";}else{if(o instanceof Array){return _a(o);}else{if(o instanceof Date){return _11(o);}else{if(typeof o=="string"){return _5(o);}else{if(typeof o=="number"){return isFinite(o)?String(o):"null";}else{if(typeof o=="boolean"){return String(o);}else{var a=["{"],b,i,v;for(i in o){if(!_1||o.hasOwnProperty(i)){v=o[i];switch(typeof v){case "undefined":case "function":case "unknown":break;default:if(b){a.push(",");}a.push(this.encode(i),":",v===null?"null":this.encode(v));b=true;}}}a.push("}");return a.join("");}}}}}}};this.decode=function(_18){return eval("("+_18+")");};})();Ext.encode=Ext.util.JSON.encode;Ext.decode=Ext.util.JSON.decode;



Ext.util.Format=function(){var _1=/^\s+|\s+$/g;return {ellipsis:function(_2,_3){if(_2&&_2.length>_3){return _2.substr(0,_3-3)+"...";}return _2;},undef:function(_4){return typeof _4!="undefined"?_4:"";},htmlEncode:function(_5){return !_5?_5:String(_5).replace(/&/g,"&amp;").replace(/>/g,"&gt;").replace(/</g,"&lt;").replace(/"/g,"&quot;");},trim:function(_6){return String(_6).replace(_1,"");},substr:function(_7,_8,_9){return String(_7).substr(_8,_9);},lowercase:function(_a){return String(_a).toLowerCase();},uppercase:function(_b){return String(_b).toUpperCase();},capitalize:function(_c){return !_c?_c:_c.charAt(0).toUpperCase()+_c.substr(1).toLowerCase();},call:function(_d,fn){if(arguments.length>2){var _f=Array.prototype.slice.call(arguments,2);_f.unshift(_d);return eval(fn).apply(window,_f);}else{return eval(fn).call(window,_d);}},usMoney:function(v){v=(Math.round((v-0)*100))/100;v=(v==Math.floor(v))?v+".00":((v*10==Math.floor(v*10))?v+"0":v);return "$"+v;},date:function(v,_12){if(!v){return "";}if(!(v instanceof Date)){v=new Date(Date.parse(v));}return v.dateFormat(_12||"m/d/Y");},dateRenderer:function(_13){return function(v){return Ext.util.Format.date(v,_13);};},stripTagsRE:/<\/?[^>]+>/gi,stripTags:function(v){return !v?v:String(v).replace(this.stripTagsRE,"");}};}();



Ext.util.CSS=function(){var _1=null;var _2=document;var _3=/(-[a-z])/gi;var _4=function(m,a){return a.charAt(1).toUpperCase();};return {createStyleSheet:function(_7){var ss;if(Ext.isIE){ss=_2.createStyleSheet();ss.cssText=_7;}else{var _9=_2.getElementsByTagName("head")[0];var _a=_2.createElement("style");_a.setAttribute("type","text/css");try{_a.appendChild(_2.createTextNode(_7));}catch(e){_a.cssText=_7;}_9.appendChild(_a);ss=_a.styleSheet?_a.styleSheet:(_a.sheet||_2.styleSheets[_2.styleSheets.length-1]);}this.cacheStyleSheet(ss);return ss;},removeStyleSheet:function(id){var _c=_2.getElementById(id);if(_c){_c.parentNode.removeChild(_c);}},swapStyleSheet:function(id,_e){this.removeStyleSheet(id);var ss=_2.createElement("link");ss.setAttribute("rel","stylesheet");ss.setAttribute("type","text/css");ss.setAttribute("id",id);ss.setAttribute("href",_e);_2.getElementsByTagName("head")[0].appendChild(ss);},refreshCache:function(){return this.getRules(true);},cacheStyleSheet:function(ss){if(!_1){_1={};}try{var _11=ss.cssRules||ss.rules;for(var j=_11.length-1;j>=0;--j){_1[_11[j].selectorText]=_11[j];}}catch(e){}},getRules:function(_13){if(_1==null||_13){_1={};var ds=_2.styleSheets;for(var i=0,len=ds.length;i<len;i++){try{this.cacheStyleSheet(ds[i]);}catch(e){}}}return _1;},getRule:function(_17,_18){var rs=this.getRules(_18);if(!(_17 instanceof Array)){return rs[_17];}for(var i=0;i<_17.length;i++){if(rs[_17[i]]){return rs[_17[i]];}}return null;},updateRule:function(_1b,_1c,_1d){if(!(_1b instanceof Array)){var _1e=this.getRule(_1b);if(_1e){_1e.style[_1c.replace(_3,_4)]=_1d;return true;}}else{for(var i=0;i<_1b.length;i++){if(this.updateRule(_1b[i],_1c,_1d)){return true;}}}return false;}};}();



Ext.util.ClickRepeater=function(el,_2){this.el=Ext.get(el);this.el.unselectable();Ext.apply(this,_2);this.addEvents({"mousedown":true,"click":true,"mouseup":true});this.el.on("mousedown",this.handleMouseDown,this);if(this.preventDefault||this.stopDefault){this.el.on("click",function(e){if(this.preventDefault){e.preventDefault();}if(this.stopDefault){e.stopEvent();}},this);}if(this.handler){this.on("click",this.handler,this.scope||this);}Ext.util.ClickRepeater.superclass.constructor.call(this);};Ext.extend(Ext.util.ClickRepeater,Ext.util.Observable,{interval:20,delay:250,preventDefault:true,stopDefault:false,timer:0,docEl:Ext.get(document),handleMouseDown:function(){clearTimeout(this.timer);this.el.blur();if(this.pressClass){this.el.addClass(this.pressClass);}this.mousedownTime=new Date();this.docEl.on("mouseup",this.handleMouseUp,this);this.el.on("mouseout",this.handleMouseOut,this);this.fireEvent("mousedown",this);this.fireEvent("click",this);this.timer=this.click.defer(this.delay||this.interval,this);},click:function(){this.fireEvent("click",this);this.timer=this.click.defer(this.getInterval(),this);},getInterval:function(){if(!this.accelerate){return this.interval;}var _4=this.mousedownTime.getElapsed();if(_4<500){return 400;}else{if(_4<1700){return 320;}else{if(_4<2600){return 250;}else{if(_4<3500){return 180;}else{if(_4<4400){return 140;}else{if(_4<5300){return 80;}else{if(_4<6200){return 50;}else{return 10;}}}}}}}},handleMouseOut:function(){clearTimeout(this.timer);if(this.pressClass){this.el.removeClass(this.pressClass);}this.el.on("mouseover",this.handleMouseReturn,this);},handleMouseReturn:function(){this.el.un("mouseover",this.handleMouseReturn);if(this.pressClass){this.el.addClass(this.pressClass);}this.click();},handleMouseUp:function(){clearTimeout(this.timer);this.el.un("mouseover",this.handleMouseReturn);this.el.un("mouseout",this.handleMouseOut);this.docEl.un("mouseup",this.handleMouseUp);this.el.removeClass(this.pressClass);this.fireEvent("mouseup",this);}});



Ext.KeyNav=function(el,_2){this.el=Ext.get(el);Ext.apply(this,_2);if(!this.disabled){this.disabled=true;this.enable();}};Ext.KeyNav.prototype={disabled:false,defaultEventAction:"stopEvent",prepareEvent:function(e){var k=e.getKey();var h=this.keyToHandler[k];if(Ext.isSafari&&h&&k>=37&&k<=40){e.stopEvent();}},relay:function(e){var k=e.getKey();var h=this.keyToHandler[k];if(h&&this[h]){if(this.doRelay(e,this[h],h)!==true){e[this.defaultEventAction]();}}},doRelay:function(e,h,_b){return h.call(this.scope||this,e);},enter:false,left:false,right:false,up:false,down:false,tab:false,esc:false,pageUp:false,pageDown:false,del:false,home:false,end:false,keyToHandler:{37:"left",39:"right",38:"up",40:"down",33:"pageUp",34:"pageDown",46:"del",36:"home",35:"end",13:"enter",27:"esc",9:"tab"},enable:function(){if(this.disabled){if(Ext.isIE){this.el.on("keydown",this.relay,this);}else{this.el.on("keydown",this.prepareEvent,this);this.el.on("keypress",this.relay,this);}this.disabled=false;}},disable:function(){if(!this.disabled){if(Ext.isIE){this.el.un("keydown",this.relay);}else{this.el.un("keydown",this.prepareEvent);this.el.un("keypress",this.relay);}this.disabled=true;}}};



Ext.KeyMap=function(el,_2,_3){this.el=Ext.get(el);this.eventName=_3||"keydown";this.bindings=[];if(_2 instanceof Array){for(var i=0,_5=_2.length;i<_5;i++){this.addBinding(_2[i]);}}else{this.addBinding(_2);}this.keyDownDelegate=Ext.EventManager.wrap(this.handleKeyDown,this,true);this.enable();};Ext.KeyMap.prototype={stopEvent:false,addBinding:function(_6){var _7=_6.key,_8=_6.shift,_9=_6.ctrl,_a=_6.alt,fn=_6.fn,_c=_6.scope;if(typeof _7=="string"){var ks=[];var _e=_7.toUpperCase();for(var j=0,len=_e.length;j<len;j++){ks.push(_e.charCodeAt(j));}_7=ks;}var _11=_7 instanceof Array;var _12=function(e){if((!_8||e.shiftKey)&&(!_9||e.ctrlKey)&&(!_a||e.altKey)){var k=e.getKey();if(_11){for(var i=0,len=_7.length;i<len;i++){if(_7[i]==k){if(this.stopEvent){e.stopEvent();}fn.call(_c||window,k,e);return;}}}else{if(k==_7){if(this.stopEvent){e.stopEvent();}fn.call(_c||window,k,e);}}}};this.bindings.push(_12);},handleKeyDown:function(e){if(this.enabled){var b=this.bindings;for(var i=0,len=b.length;i<len;i++){b[i].call(this,e);}}},isEnabled:function(){return this.enabled;},enable:function(){if(!this.enabled){this.el.on(this.eventName,this.keyDownDelegate);this.enabled=true;}},disable:function(){if(this.enabled){this.el.removeListener(this.eventName,this.keyDownDelegate);this.enabled=false;}}};



Ext.util.TextMetrics=function(){var _1;return {measure:function(el,_3,_4){if(!_1){_1=Ext.util.TextMetrics.Instance(el,_4);}_1.bind(el);_1.setFixedWidth(_4||"auto");return _1.getSize(_3);},createInstance:function(el,_6){return Ext.util.TextMetrics.Instance(el,_6);}};}();Ext.util.TextMetrics.Instance=function(_7,_8){var ml=new Ext.Element(document.createElement("div"));document.body.appendChild(ml.dom);ml.position("absolute");ml.setLeftTop(-1000,-1000);ml.hide();if(_8){mi.setWidth(_8);}var _a={getSize:function(_b){ml.update(_b);var s=ml.getSize();ml.update("");return s;},bind:function(el){ml.setStyle(Ext.fly(el).getStyles("font-size","font-style","font-weight","font-family","line-height"));},setFixedWidth:function(_e){ml.setWidth(_e);},getWidth:function(_f){ml.dom.style.width="auto";return this.getSize(_f).width;},getHeight:function(_10){return this.getSize(_10).height;}};_a.bind(_7);return _a;};Ext.Element.measureText=Ext.util.TextMetrics.measure;



(function(){var _1=Ext.EventManager;var _2=Ext.lib.Dom;Ext.dd.DragDrop=function(id,_4,_5){if(id){this.init(id,_4,_5);}};Ext.dd.DragDrop.prototype={id:null,config:null,dragElId:null,handleElId:null,invalidHandleTypes:null,invalidHandleIds:null,invalidHandleClasses:null,startPageX:0,startPageY:0,groups:null,locked:false,lock:function(){this.locked=true;},unlock:function(){this.locked=false;},isTarget:true,padding:null,_domRef:null,__ygDragDrop:true,constrainX:false,constrainY:false,minX:0,maxX:0,minY:0,maxY:0,maintainOffset:false,xTicks:null,yTicks:null,primaryButtonOnly:true,available:false,hasOuterHandles:false,b4StartDrag:function(x,y){},startDrag:function(x,y){},b4Drag:function(e){},onDrag:function(e){},onDragEnter:function(e,id){},b4DragOver:function(e){},onDragOver:function(e,id){},b4DragOut:function(e){},onDragOut:function(e,id){},b4DragDrop:function(e){},onDragDrop:function(e,id){},onInvalidDrop:function(e){},b4EndDrag:function(e){},endDrag:function(e){},b4MouseDown:function(e){},onMouseDown:function(e){},onMouseUp:function(e){},onAvailable:function(){},defaultPadding:{left:0,right:0,top:0,bottom:0},constrainTo:function(_1d,pad,_1f){if(typeof pad=="number"){pad={left:pad,right:pad,top:pad,bottom:pad};}pad=pad||this.defaultPadding;var b=Ext.get(this.getEl()).getBox();var ce=Ext.get(_1d);var s=ce.getScroll();var c,cd=ce.dom;if(cd==document.body){c={x:s.left,y:s.top,width:Ext.lib.Dom.getViewWidth(),height:Ext.lib.Dom.getViewHeight()};}else{xy=ce.getXY();c={x:xy[0]+s.left,y:xy[1]+s.top,width:cd.clientWidth,height:cd.clientHeight};}var _25=b.y-c.y;var _26=b.x-c.x;this.resetConstraints();this.setXConstraint(_26-(pad.left||0),c.width-_26-b.width-(pad.right||0));this.setYConstraint(_25-(pad.top||0),c.height-_25-b.height-(pad.bottom||0));},getEl:function(){if(!this._domRef){this._domRef=Ext.getDom(this.id);}return this._domRef;},getDragEl:function(){return Ext.getDom(this.dragElId);},init:function(id,_28,_29){this.initTarget(id,_28,_29);_1.on(this.id,"mousedown",this.handleMouseDown,this);},initTarget:function(id,_2b,_2c){this.config=_2c||{};this.DDM=Ext.dd.DDM;this.groups={};if(typeof id!=="string"){id=Ext.id(id);}this.id=id;this.addToGroup((_2b)?_2b:"default");this.handleElId=id;this.setDragElId(id);this.invalidHandleTypes={A:"A"};this.invalidHandleIds={};this.invalidHandleClasses=[];this.applyConfig();this.handleOnAvailable();},applyConfig:function(){this.padding=this.config.padding||[0,0,0,0];this.isTarget=(this.config.isTarget!==false);this.maintainOffset=(this.config.maintainOffset);this.primaryButtonOnly=(this.config.primaryButtonOnly!==false);},handleOnAvailable:function(){this.available=true;this.resetConstraints();this.onAvailable();},setPadding:function(_2d,_2e,_2f,_30){if(!_2e&&0!==_2e){this.padding=[_2d,_2d,_2d,_2d];}else{if(!_2f&&0!==_2f){this.padding=[_2d,_2e,_2d,_2e];}else{this.padding=[_2d,_2e,_2f,_30];}}},setInitPosition:function(_31,_32){var el=this.getEl();if(!this.DDM.verifyEl(el)){return;}var dx=_31||0;var dy=_32||0;var p=_2.getXY(el);this.initPageX=p[0]-dx;this.initPageY=p[1]-dy;this.lastPageX=p[0];this.lastPageY=p[1];this.setStartPosition(p);},setStartPosition:function(pos){var p=pos||_2.getXY(this.getEl());this.deltaSetXY=null;this.startPageX=p[0];this.startPageY=p[1];},addToGroup:function(_39){this.groups[_39]=true;this.DDM.regDragDrop(this,_39);},removeFromGroup:function(_3a){if(this.groups[_3a]){delete this.groups[_3a];}this.DDM.removeDDFromGroup(this,_3a);},setDragElId:function(id){this.dragElId=id;},setHandleElId:function(id){if(typeof id!=="string"){id=Ext.id(id);}this.handleElId=id;this.DDM.regHandle(this.id,id);},setOuterHandleElId:function(id){if(typeof id!=="string"){id=Ext.id(id);}_1.on(id,"mousedown",this.handleMouseDown,this);this.setHandleElId(id);this.hasOuterHandles=true;},unreg:function(){_1.un(this.id,"mousedown",this.handleMouseDown);this._domRef=null;this.DDM._remove(this);},isLocked:function(){return (this.DDM.isLocked()||this.locked);},handleMouseDown:function(e,oDD){if(this.primaryButtonOnly&&e.button!=0){return;}if(this.isLocked()){return;}this.DDM.refreshCache(this.groups);var pt=new Ext.lib.Point(Ext.lib.Event.getPageX(e),Ext.lib.Event.getPageY(e));if(!this.hasOuterHandles&&!this.DDM.isOverTarget(pt,this)){}else{if(this.clickValidator(e)){this.setStartPosition();this.b4MouseDown(e);this.onMouseDown(e);this.DDM.handleMouseDown(e,this);this.DDM.stopEvent(e);}else{}}},clickValidator:function(e){var _42=Ext.lib.Event.getTarget(e);return (this.isValidHandleChild(_42)&&(this.id==this.handleElId||this.DDM.handleWasClicked(_42,this.id)));},addInvalidHandleType:function(_43){var _44=_43.toUpperCase();this.invalidHandleTypes[_44]=_44;},addInvalidHandleId:function(id){if(typeof id!=="string"){id=Ext.id(id);}this.invalidHandleIds[id]=id;},addInvalidHandleClass:function(_46){this.invalidHandleClasses.push(_46);},removeInvalidHandleType:function(_47){var _48=_47.toUpperCase();delete this.invalidHandleTypes[_48];},removeInvalidHandleId:function(id){if(typeof id!=="string"){id=Ext.id(id);}delete this.invalidHandleIds[id];},removeInvalidHandleClass:function(_4a){for(var i=0,len=this.invalidHandleClasses.length;i<len;++i){if(this.invalidHandleClasses[i]==_4a){delete this.invalidHandleClasses[i];}}},isValidHandleChild:function(_4d){var _4e=true;var _4f;try{_4f=_4d.nodeName.toUpperCase();}catch(e){_4f=_4d.nodeName;}_4e=_4e&&!this.invalidHandleTypes[_4f];_4e=_4e&&!this.invalidHandleIds[_4d.id];for(var i=0,len=this.invalidHandleClasses.length;_4e&&i<len;++i){_4e=!_2.hasClass(_4d,this.invalidHandleClasses[i]);}return _4e;},setXTicks:function(_52,_53){this.xTicks=[];this.xTickSize=_53;var _54={};for(var i=this.initPageX;i>=this.minX;i=i-_53){if(!_54[i]){this.xTicks[this.xTicks.length]=i;_54[i]=true;}}for(i=this.initPageX;i<=this.maxX;i=i+_53){if(!_54[i]){this.xTicks[this.xTicks.length]=i;_54[i]=true;}}this.xTicks.sort(this.DDM.numericSort);},setYTicks:function(_56,_57){this.yTicks=[];this.yTickSize=_57;var _58={};for(var i=this.initPageY;i>=this.minY;i=i-_57){if(!_58[i]){this.yTicks[this.yTicks.length]=i;_58[i]=true;}}for(i=this.initPageY;i<=this.maxY;i=i+_57){if(!_58[i]){this.yTicks[this.yTicks.length]=i;_58[i]=true;}}this.yTicks.sort(this.DDM.numericSort);},setXConstraint:function(_5a,_5b,_5c){this.leftConstraint=_5a;this.rightConstraint=_5b;this.minX=this.initPageX-_5a;this.maxX=this.initPageX+_5b;if(_5c){this.setXTicks(this.initPageX,_5c);}this.constrainX=true;},clearConstraints:function(){this.constrainX=false;this.constrainY=false;this.clearTicks();},clearTicks:function(){this.xTicks=null;this.yTicks=null;this.xTickSize=0;this.yTickSize=0;},setYConstraint:function(iUp,_5e,_5f){this.topConstraint=iUp;this.bottomConstraint=_5e;this.minY=this.initPageY-iUp;this.maxY=this.initPageY+_5e;if(_5f){this.setYTicks(this.initPageY,_5f);}this.constrainY=true;},resetConstraints:function(){if(this.initPageX||this.initPageX===0){var dx=(this.maintainOffset)?this.lastPageX-this.initPageX:0;var dy=(this.maintainOffset)?this.lastPageY-this.initPageY:0;this.setInitPosition(dx,dy);}else{this.setInitPosition();}if(this.constrainX){this.setXConstraint(this.leftConstraint,this.rightConstraint,this.xTickSize);}if(this.constrainY){this.setYConstraint(this.topConstraint,this.bottomConstraint,this.yTickSize);}},getTick:function(val,_63){if(!_63){return val;}else{if(_63[0]>=val){return _63[0];}else{for(var i=0,len=_63.length;i<len;++i){var _66=i+1;if(_63[_66]&&_63[_66]>=val){var _67=val-_63[i];var _68=_63[_66]-val;return (_68>_67)?_63[i]:_63[_66];}}return _63[_63.length-1];}}},toString:function(){return ("DragDrop "+this.id);}};})();if(!Ext.dd.DragDropMgr){Ext.dd.DragDropMgr=function(){var _69=Ext.EventManager;return {ids:{},handleIds:{},dragCurrent:null,dragOvers:{},deltaX:0,deltaY:0,preventDefault:true,stopPropagation:true,initalized:false,locked:false,init:function(){this.initialized=true;},POINT:0,INTERSECT:1,mode:0,_execOnAll:function(_6a,_6b){for(var i in this.ids){for(var j in this.ids[i]){var oDD=this.ids[i][j];if(!this.isTypeOfDD(oDD)){continue;}oDD[_6a].apply(oDD,_6b);}}},_onLoad:function(){this.init();_69.on(document,"mouseup",this.handleMouseUp,this,true);_69.on(window,"unload",this._onUnload,this,true);_69.on(window,"resize",this._onResize,this,true);},_onResize:function(e){this._execOnAll("resetConstraints",[]);},lock:function(){this.locked=true;},unlock:function(){this.locked=false;},isLocked:function(){return this.locked;},locationCache:{},useCache:true,clickPixelThresh:3,clickTimeThresh:350,dragThreshMet:false,clickTimeout:null,startX:0,startY:0,regDragDrop:function(oDD,_71){if(!this.initialized){this.init();}if(!this.ids[_71]){this.ids[_71]={};}this.ids[_71][oDD.id]=oDD;},removeDDFromGroup:function(oDD,_73){if(!this.ids[_73]){this.ids[_73]={};}var obj=this.ids[_73];if(obj&&obj[oDD.id]){delete obj[oDD.id];}},_remove:function(oDD){for(var g in oDD.groups){if(g&&this.ids[g][oDD.id]){delete this.ids[g][oDD.id];}}delete this.handleIds[oDD.id];},regHandle:function(_77,_78){if(!this.handleIds[_77]){this.handleIds[_77]={};}this.handleIds[_77][_78]=_78;},isDragDrop:function(id){return (this.getDDById(id))?true:false;},getRelated:function(_7a,_7b){var _7c=[];for(var i in _7a.groups){for(j in this.ids[i]){var dd=this.ids[i][j];if(!this.isTypeOfDD(dd)){continue;}if(!_7b||dd.isTarget){_7c[_7c.length]=dd;}}}return _7c;},isLegalTarget:function(oDD,_80){var _81=this.getRelated(oDD,true);for(var i=0,len=_81.length;i<len;++i){if(_81[i].id==_80.id){return true;}}return false;},isTypeOfDD:function(oDD){return (oDD&&oDD.__ygDragDrop);},isHandle:function(_85,_86){return (this.handleIds[_85]&&this.handleIds[_85][_86]);},getDDById:function(id){for(var i in this.ids){if(this.ids[i][id]){return this.ids[i][id];}}return null;},handleMouseDown:function(e,oDD){_69.on(document,"mousemove",this.handleMouseMove,this,true);this.currentTarget=Ext.lib.Event.getTarget(e);this.dragCurrent=oDD;var el=oDD.getEl();this.startX=Ext.lib.Event.getPageX(e);this.startY=Ext.lib.Event.getPageY(e);this.deltaX=this.startX-el.offsetLeft;this.deltaY=this.startY-el.offsetTop;this.dragThreshMet=false;this.clickTimeout=setTimeout(function(){var DDM=Ext.dd.DDM;DDM.startDrag(DDM.startX,DDM.startY);},this.clickTimeThresh);},startDrag:function(x,y){clearTimeout(this.clickTimeout);if(this.dragCurrent){this.dragCurrent.b4StartDrag(x,y);this.dragCurrent.startDrag(x,y);}this.dragThreshMet=true;},handleMouseUp:function(e){_69.un(document,"mousemove",this.handleMouseMove,this,true);if(!this.dragCurrent){return true;}clearTimeout(this.clickTimeout);if(this.dragThreshMet){this.fireEvents(e,true);}else{}this.stopDrag(e);this.stopEvent(e);},stopEvent:function(e){if(this.stopPropagation){e.stopPropagation();}if(this.preventDefault){e.preventDefault();}},stopDrag:function(e){if(this.dragCurrent){if(this.dragThreshMet){this.dragCurrent.b4EndDrag(e);this.dragCurrent.endDrag(e);}this.dragCurrent.onMouseUp(e);}this.dragCurrent=null;this.dragOvers={};},handleMouseMove:function(e){if(!this.dragCurrent){return true;}if(Ext.isIE&&(e.button!==0&&e.button!==1&&e.button!==2)){this.stopEvent(e);return this.handleMouseUp(e);}if(!this.dragThreshMet){var _93=Math.abs(this.startX-Ext.lib.Event.getPageX(e));var _94=Math.abs(this.startY-Ext.lib.Event.getPageY(e));if(_93>this.clickPixelThresh||_94>this.clickPixelThresh){this.startDrag(this.startX,this.startY);}}if(this.dragThreshMet){this.dragCurrent.b4Drag(e);this.dragCurrent.onDrag(e);if(!this.dragCurrent.moveOnly){this.fireEvents(e,false);}}this.stopEvent(e);return true;},fireEvents:function(e,_96){var dc=this.dragCurrent;if(!dc||dc.isLocked()){return;}var x=Ext.lib.Event.getPageX(e);var y=Ext.lib.Event.getPageY(e);var pt=new Ext.lib.Point(x,y);var _9b=[];var _9c=[];var _9d=[];var _9e=[];var _9f=[];for(var i in this.dragOvers){var ddo=this.dragOvers[i];if(!this.isTypeOfDD(ddo)){continue;}if(!this.isOverTarget(pt,ddo,this.mode)){_9c.push(ddo);}_9b[i]=true;delete this.dragOvers[i];}for(var _a2 in dc.groups){if("string"!=typeof _a2){continue;}for(i in this.ids[_a2]){var oDD=this.ids[_a2][i];if(!this.isTypeOfDD(oDD)){continue;}if(oDD.isTarget&&!oDD.isLocked()&&oDD!=dc){if(this.isOverTarget(pt,oDD,this.mode)){if(_96){_9e.push(oDD);}else{if(!_9b[oDD.id]){_9f.push(oDD);}else{_9d.push(oDD);}this.dragOvers[oDD.id]=oDD;}}}}}if(this.mode){if(_9c.length){dc.b4DragOut(e,_9c);dc.onDragOut(e,_9c);}if(_9f.length){dc.onDragEnter(e,_9f);}if(_9d.length){dc.b4DragOver(e,_9d);dc.onDragOver(e,_9d);}if(_9e.length){dc.b4DragDrop(e,_9e);dc.onDragDrop(e,_9e);}}else{var len=0;for(i=0,len=_9c.length;i<len;++i){dc.b4DragOut(e,_9c[i].id);dc.onDragOut(e,_9c[i].id);}for(i=0,len=_9f.length;i<len;++i){dc.onDragEnter(e,_9f[i].id);}for(i=0,len=_9d.length;i<len;++i){dc.b4DragOver(e,_9d[i].id);dc.onDragOver(e,_9d[i].id);}for(i=0,len=_9e.length;i<len;++i){dc.b4DragDrop(e,_9e[i].id);dc.onDragDrop(e,_9e[i].id);}}if(_96&&!_9e.length){dc.onInvalidDrop(e);}},getBestMatch:function(dds){var _a6=null;var len=dds.length;if(len==1){_a6=dds[0];}else{for(var i=0;i<len;++i){var dd=dds[i];if(dd.cursorIsOver){_a6=dd;break;}else{if(!_a6||_a6.overlap.getArea()<dd.overlap.getArea()){_a6=dd;}}}}return _a6;},refreshCache:function(_aa){for(var _ab in _aa){if("string"!=typeof _ab){continue;}for(var i in this.ids[_ab]){var oDD=this.ids[_ab][i];if(this.isTypeOfDD(oDD)){var loc=this.getLocation(oDD);if(loc){this.locationCache[oDD.id]=loc;}else{delete this.locationCache[oDD.id];}}}}},verifyEl:function(el){try{if(el){var _b0=el.offsetParent;if(_b0){return true;}}}catch(e){}return false;},getLocation:function(oDD){if(!this.isTypeOfDD(oDD)){return null;}var el=oDD.getEl(),pos,x1,x2,y1,y2,t,r,b,l;try{pos=Ext.lib.Dom.getXY(el);}catch(e){}if(!pos){return null;}x1=pos[0];x2=x1+el.offsetWidth;y1=pos[1];y2=y1+el.offsetHeight;t=y1-oDD.padding[0];r=x2+oDD.padding[1];b=y2+oDD.padding[2];l=x1-oDD.padding[3];return new Ext.lib.Region(t,r,b,l);},isOverTarget:function(pt,_bd,_be){var loc=this.locationCache[_bd.id];if(!loc||!this.useCache){loc=this.getLocation(_bd);this.locationCache[_bd.id]=loc;}if(!loc){return false;}_bd.cursorIsOver=loc.contains(pt);var dc=this.dragCurrent;if(!dc||!dc.getTargetCoord||(!_be&&!dc.constrainX&&!dc.constrainY)){return _bd.cursorIsOver;}_bd.overlap=null;var pos=dc.getTargetCoord(pt.x,pt.y);var el=dc.getDragEl();var _c3=new Ext.lib.Region(pos.y,pos.x+el.offsetWidth,pos.y+el.offsetHeight,pos.x);var _c4=_c3.intersect(loc);if(_c4){_bd.overlap=_c4;return (_be)?true:_bd.cursorIsOver;}else{return false;}},_onUnload:function(e,me){Ext.dd.DragDropMgr.unregAll();},unregAll:function(){if(this.dragCurrent){this.stopDrag();this.dragCurrent=null;}this._execOnAll("unreg",[]);for(i in this.elementCache){delete this.elementCache[i];}this.elementCache={};this.ids={};},elementCache:{},getElWrapper:function(id){var _c8=this.elementCache[id];if(!_c8||!_c8.el){_c8=this.elementCache[id]=new this.ElementWrapper(Ext.getDom(id));}return _c8;},getElement:function(id){return Ext.getDom(id);},getCss:function(id){var el=Ext.getDom(id);return (el)?el.style:null;},ElementWrapper:function(el){this.el=el||null;this.id=this.el&&el.id;this.css=this.el&&el.style;},getPosX:function(el){return Ext.lib.Dom.getX(el);},getPosY:function(el){return Ext.lib.Dom.getY(el);},swapNode:function(n1,n2){if(n1.swapNode){n1.swapNode(n2);}else{var p=n2.parentNode;var s=n2.nextSibling;if(s==n1){p.insertBefore(n1,n2);}else{if(n2==n1.nextSibling){p.insertBefore(n2,n1);}else{n1.parentNode.replaceChild(n2,n1);p.insertBefore(n1,s);}}}},getScroll:function(){var t,l,dde=document.documentElement,db=document.body;if(dde&&(dde.scrollTop||dde.scrollLeft)){t=dde.scrollTop;l=dde.scrollLeft;}else{if(db){t=db.scrollTop;l=db.scrollLeft;}else{}}return {top:t,left:l};},getStyle:function(el,_d8){return Ext.fly(el).getStyle(_d8);},getScrollTop:function(){return this.getScroll().top;},getScrollLeft:function(){return this.getScroll().left;},moveToEl:function(_d9,_da){var _db=Ext.lib.Dom.getXY(_da);Ext.lib.Dom.setXY(_d9,_db);},numericSort:function(a,b){return (a-b);},_timeoutCount:0,_addListeners:function(){var DDM=Ext.dd.DDM;if(Ext.lib.Event&&document){DDM._onLoad();}else{if(DDM._timeoutCount>2000){}else{setTimeout(DDM._addListeners,10);if(document&&document.body){DDM._timeoutCount+=1;}}}},handleWasClicked:function(_df,id){if(this.isHandle(id,_df.id)){return true;}else{var p=_df.parentNode;while(p){if(this.isHandle(id,p.id)){return true;}else{p=p.parentNode;}}}return false;}};}();Ext.dd.DDM=Ext.dd.DragDropMgr;Ext.dd.DDM._addListeners();}Ext.dd.DD=function(id,_e3,_e4){if(id){this.init(id,_e3,_e4);}};Ext.extend(Ext.dd.DD,Ext.dd.DragDrop,{scroll:true,autoOffset:function(_e5,_e6){var x=_e5-this.startPageX;var y=_e6-this.startPageY;this.setDelta(x,y);},setDelta:function(_e9,_ea){this.deltaX=_e9;this.deltaY=_ea;},setDragElPos:function(_eb,_ec){var el=this.getDragEl();this.alignElWithMouse(el,_eb,_ec);},alignElWithMouse:function(el,_ef,_f0){var _f1=this.getTargetCoord(_ef,_f0);var fly=el.dom?el:Ext.fly(el);if(!this.deltaSetXY){var _f3=[_f1.x,_f1.y];fly.setXY(_f3);var _f4=fly.getLeft(true);var _f5=fly.getTop(true);this.deltaSetXY=[_f4-_f1.x,_f5-_f1.y];}else{fly.setLeftTop(_f1.x+this.deltaSetXY[0],_f1.y+this.deltaSetXY[1]);}this.cachePosition(_f1.x,_f1.y);this.autoScroll(_f1.x,_f1.y,el.offsetHeight,el.offsetWidth);return _f1;},cachePosition:function(_f6,_f7){if(_f6){this.lastPageX=_f6;this.lastPageY=_f7;}else{var _f8=Ext.lib.Dom.getXY(this.getEl());this.lastPageX=_f8[0];this.lastPageY=_f8[1];}},autoScroll:function(x,y,h,w){if(this.scroll){var _fd=Ext.lib.Dom.getViewWidth();var _fe=Ext.lib.Dom.getViewHeight();var st=this.DDM.getScrollTop();var sl=this.DDM.getScrollLeft();var bot=h+y;var _102=w+x;var _103=(_fd+st-y-this.deltaY);var _104=(_fe+sl-x-this.deltaX);var _105=40;var _106=(document.all)?80:30;if(bot>_fd&&_103<_105){window.scrollTo(sl,st+_106);}if(y<st&&st>0&&y-st<_105){window.scrollTo(sl,st-_106);}if(_102>_fe&&_104<_105){window.scrollTo(sl+_106,st);}if(x<sl&&sl>0&&x-sl<_105){window.scrollTo(sl-_106,st);}}},getTargetCoord:function(_107,_108){var x=_107-this.deltaX;var y=_108-this.deltaY;if(this.constrainX){if(x<this.minX){x=this.minX;}if(x>this.maxX){x=this.maxX;}}if(this.constrainY){if(y<this.minY){y=this.minY;}if(y>this.maxY){y=this.maxY;}}x=this.getTick(x,this.xTicks);y=this.getTick(y,this.yTicks);return {x:x,y:y};},applyConfig:function(){Ext.dd.DD.superclass.applyConfig.call(this);this.scroll=(this.config.scroll!==false);},b4MouseDown:function(e){this.autoOffset(Ext.lib.Event.getPageX(e),Ext.lib.Event.getPageY(e));},b4Drag:function(e){this.setDragElPos(Ext.lib.Event.getPageX(e),Ext.lib.Event.getPageY(e));},toString:function(){return ("DD "+this.id);}});Ext.dd.DDProxy=function(id,_10e,_10f){if(id){this.init(id,_10e,_10f);this.initFrame();}};Ext.dd.DDProxy.dragElId="ygddfdiv";Ext.extend(Ext.dd.DDProxy,Ext.dd.DD,{resizeFrame:true,centerFrame:false,createFrame:function(){var self=this;var body=document.body;if(!body||!body.firstChild){setTimeout(function(){self.createFrame();},50);return;}var div=this.getDragEl();if(!div){div=document.createElement("div");div.id=this.dragElId;var s=div.style;s.position="absolute";s.visibility="hidden";s.cursor="move";s.border="2px solid #aaa";s.zIndex=999;body.insertBefore(div,body.firstChild);}},initFrame:function(){this.createFrame();},applyConfig:function(){Ext.dd.DDProxy.superclass.applyConfig.call(this);this.resizeFrame=(this.config.resizeFrame!==false);this.centerFrame=(this.config.centerFrame);this.setDragElId(this.config.dragElId||Ext.dd.DDProxy.dragElId);},showFrame:function(_114,_115){var el=this.getEl();var _117=this.getDragEl();var s=_117.style;this._resizeProxy();if(this.centerFrame){this.setDelta(Math.round(parseInt(s.width,10)/2),Math.round(parseInt(s.height,10)/2));}this.setDragElPos(_114,_115);Ext.fly(_117).show();},_resizeProxy:function(){if(this.resizeFrame){var el=this.getEl();Ext.fly(this.getDragEl()).setSize(el.offsetWidth,el.offsetHeight);}},b4MouseDown:function(e){var x=Ext.lib.Event.getPageX(e);var y=Ext.lib.Event.getPageY(e);this.autoOffset(x,y);this.setDragElPos(x,y);},b4StartDrag:function(x,y){this.showFrame(x,y);},b4EndDrag:function(e){Ext.fly(this.getDragEl()).hide();},endDrag:function(e){var lel=this.getEl();var del=this.getDragEl();del.style.visibility="";this.beforeMove();lel.style.visibility="hidden";Ext.dd.DDM.moveToEl(lel,del);del.style.visibility="hidden";lel.style.visibility="";this.afterDrag();},beforeMove:function(){},afterDrag:function(){},toString:function(){return ("DDProxy "+this.id);}});Ext.dd.DDTarget=function(id,_124,_125){if(id){this.initTarget(id,_124,_125);}};Ext.extend(Ext.dd.DDTarget,Ext.dd.DragDrop,{toString:function(){return ("DDTarget "+this.id);}});



Ext.dd.ScrollManager=function(){var _1=Ext.dd.DragDropMgr;var _2={};var _3=null;var _4={};var _5=function(e){_3=null;_7();};var _8=function(){if(_1.dragCurrent){_1.refreshCache(_1.dragCurrent.groups);}};var _9=function(){if(_1.dragCurrent){var _a=Ext.dd.ScrollManager;if(!_a.animate){if(_4.el.scroll(_4.dir,_a.increment)){_8();}}else{_4.el.scroll(_4.dir,_a.increment,true,_a.animDuration,_8);}}};var _7=function(){if(_4.id){clearInterval(_4.id);}_4.id=0;_4.el=null;_4.dir="";};var _b=function(el,_d){_7();_4.el=el;_4.dir=_d;_4.id=setInterval(_9,Ext.dd.ScrollManager.frequency);};var _e=function(e,_10){if(_10||!_1.dragCurrent){return;}var dds=Ext.dd.ScrollManager;if(!_3||_3!=_1.dragCurrent){_3=_1.dragCurrent;dds.refreshCache();}var xy=Ext.lib.Event.getXY(e);var pt=new Ext.lib.Point(xy[0],xy[1]);for(var id in _2){var el=_2[id],r=el._region;if(r.contains(pt)&&el.isScrollable()){if(r.bottom-pt.y<=dds.thresh){if(_4.el!=el){_b(el,"down");}return;}else{if(r.right-pt.x<=dds.thresh){if(_4.el!=el){_b(el,"left");}return;}else{if(pt.y-r.top<=dds.thresh){if(_4.el!=el){_b(el,"up");}return;}else{if(pt.x-r.left<=dds.thresh){if(_4.el!=el){_b(el,"right");}return;}}}}}}_7();};_1.fireEvents=_1.fireEvents.createSequence(_e,_1);_1.stopDrag=_1.stopDrag.createSequence(_5,_1);return {register:function(el){if(el instanceof Array){for(var i=0,len=el.length;i<len;i++){this.register(el[i]);}}else{el=Ext.get(el);_2[el.id]=el;}},unregister:function(el){if(el instanceof Array){for(var i=0,len=el.length;i<len;i++){this.unregister(el[i]);}}else{el=Ext.get(el);delete _2[el.id];}},thresh:25,increment:100,frequency:500,animate:true,animDuration:0.4,refreshCache:function(){for(var id in _2){if(typeof _2[id]=="object"){_2[id]._region=_2[id].getRegion();}}}};}();



Ext.dd.Registry=function(){var _1={};var _2={};var _3=0;var _4=function(el,_6){if(typeof el=="string"){return el;}var id=el.id;if(!id&&_6!==false){id="extdd-"+(++_3);el.id=id;}return id;};return {register:function(el,_9){_9=_9||{};if(typeof el=="string"){el=document.getElementById(el);}_9.ddel=el;_1[_4(el)]=_9;if(_9.isHandle!==false){_2[_9.ddel.id]=_9;}if(_9.handles){var hs=_9.handles;for(var i=0,_c=hs.length;i<_c;i++){_2[_4(hs[i])]=_9;}}},unregister:function(el){var id=_4(el,false);var _f=_1[id];if(_f){delete _1[id];if(_f.handles){var hs=_f.handles;for(var i=0,len=hs.length;i<len;i++){delete _2[_4(hs[i],false)];}}}},getHandle:function(id){if(typeof id!="string"){id=id.id;}return _2[id];},getHandleFromEvent:function(e){var t=Ext.lib.Event.getTarget(e);return t?_2[t.id]:null;},getTarget:function(id){if(typeof id!="string"){id=id.id;}return _1[id];},getTargetFromEvent:function(e){var t=Ext.lib.Event.getTarget(e);return t?_1[t.id]||_2[t.id]:null;}};}();



Ext.dd.StatusProxy=function(_1){Ext.apply(this,_1);this.id=this.id||Ext.id();this.el=new Ext.Layer({dh:{id:this.id,tag:"div",cls:"x-dd-drag-proxy "+this.dropNotAllowed,children:[{tag:"div",cls:"x-dd-drop-icon"},{tag:"div",cls:"x-dd-drag-ghost"}]},shadow:!_1||_1.shadow!==false});this.ghost=Ext.get(this.el.dom.childNodes[1]);this.dropStatus=this.dropNotAllowed;};Ext.dd.StatusProxy.prototype={dropAllowed:"x-dd-drop-ok",dropNotAllowed:"x-dd-drop-nodrop",setStatus:function(_2){_2=_2||this.dropNotAllowed;if(this.dropStatus!=_2){this.el.replaceClass(this.dropStatus,_2);this.dropStatus=_2;}},reset:function(_3){this.el.dom.className="x-dd-drag-proxy "+this.dropNotAllowed;this.dropStatus=this.dropNotAllowed;if(_3){this.ghost.update("");}},update:function(_4){if(typeof _4=="string"){this.ghost.update(_4);}else{this.ghost.update("");_4.style.margin="0";this.ghost.dom.appendChild(_4);}},getEl:function(){return this.el;},getGhost:function(){return this.ghost;},hide:function(_5){this.el.hide();if(_5){this.reset(true);}},stop:function(){if(this.anim&&this.anim.isAnimated&&this.anim.isAnimated()){this.anim.stop();}},show:function(){this.el.show();},sync:function(){this.el.sync();},repair:function(xy,_7,_8){this.callback=_7;this.scope=_8;if(xy&&this.animRepair!==false){this.el.addClass("x-dd-drag-repair");this.el.hideUnders(true);this.anim=this.el.shift({duration:this.repairDuration||0.5,easing:"easeOut",xy:xy,stopFx:true,callback:this.afterRepair,scope:this});}else{this.afterRepair();}},afterRepair:function(){this.hide(true);if(typeof this.callback=="function"){this.callback.call(this.scope||this);}this.callback==null;this.scope==null;}};



Ext.dd.DragSource=function(el,_2){this.el=Ext.get(el);this.dragData={};Ext.apply(this,_2);if(!this.proxy){this.proxy=new Ext.dd.StatusProxy();}this.el.on("mouseup",this.handleMouseUp);Ext.dd.DragSource.superclass.constructor.call(this,this.el.dom,this.ddGroup||this.group,{dragElId:this.proxy.id,resizeFrame:false,isTarget:false,scroll:this.scroll===true});this.dragging=false;};Ext.extend(Ext.dd.DragSource,Ext.dd.DDProxy,{dropAllowed:"x-dd-drop-ok",dropNotAllowed:"x-dd-drop-nodrop",getDragData:function(e){return this.dragData;},onDragEnter:function(e,id){var _6=Ext.dd.DragDropMgr.getDDById(id);this.cachedTarget=_6;if(this.beforeDragEnter(_6,e,id)!==false){if(_6.isNotifyTarget){var _7=_6.notifyEnter(this,e,this.dragData);this.proxy.setStatus(_7);}else{this.proxy.setStatus(this.dropAllowed);}if(this.afterDragEnter){this.afterDragEnter(_6,e,id);}}},beforeDragEnter:function(_8,e,id){return true;},alignElWithMouse:function(){Ext.dd.DragSource.superclass.alignElWithMouse.apply(this,arguments);this.proxy.sync();},onDragOver:function(e,id){var _d=this.cachedTarget||Ext.dd.DragDropMgr.getDDById(id);if(this.beforeDragOver(_d,e,id)!==false){if(_d.isNotifyTarget){var _e=_d.notifyOver(this,e,this.dragData);this.proxy.setStatus(_e);}if(this.afterDragOver){this.afterDragOver(_d,e,id);}}},beforeDragOver:function(_f,e,id){return true;},onDragOut:function(e,id){var _14=this.cachedTarget||Ext.dd.DragDropMgr.getDDById(id);if(this.beforeDragOut(_14,e,id)!==false){if(_14.isNotifyTarget){_14.notifyOut(this,e,this.dragData);}this.proxy.reset();if(this.afterDragOut){this.afterDragOut(_14,e,id);}}this.cachedTarget=null;},beforeDragOut:function(_15,e,id){return true;},onDragDrop:function(e,id){var _1a=this.cachedTarget||Ext.dd.DragDropMgr.getDDById(id);if(this.beforeDragDrop(_1a,e,id)!==false){if(_1a.isNotifyTarget){if(_1a.notifyDrop(this,e,this.dragData)){this.onValidDrop(_1a,e,id);}else{this.onInvalidDrop(_1a,e,id);}}else{this.onValidDrop(_1a,e,id);}if(this.afterDragDrop){this.afterDragDrop(_1a,e,id);}}},beforeDragDrop:function(_1b,e,id){return true;},onValidDrop:function(_1e,e,id){this.hideProxy();},getRepairXY:function(e,_22){return this.el.getXY();},onInvalidDrop:function(_23,e,id){this.beforeInvalidDrop(_23,e,id);if(this.cachedTarget){if(this.cachedTarget.isNotifyTarget){this.cachedTarget.notifyOut(this,e,this.dragData);}this.cacheTarget=null;}this.proxy.repair(this.getRepairXY(e,this.dragData),this.afterRepair,this);if(this.afterInvalidDrop){this.afterInvalidDrop(e,id);}},afterRepair:function(){if(Ext.enableFx){this.el.highlight(this.hlColor||"c3daf9");}this.dragging=false;},beforeInvalidDrop:function(_26,e,id){return true;},handleMouseDown:function(e){if(this.dragging){return;}if(Ext.QuickTips){Ext.QuickTips.disable();}var _2a=this.getDragData(e);if(_2a&&this.onBeforeDrag(_2a,e)!==false){this.dragData=_2a;this.proxy.stop();Ext.dd.DragSource.superclass.handleMouseDown.apply(this,arguments);}},handleMouseUp:function(e){if(Ext.QuickTips){Ext.QuickTips.enable();}},onBeforeDrag:function(_2c,e){return true;},onStartDrag:Ext.emptyFn,startDrag:function(x,y){this.proxy.reset();this.dragging=true;this.proxy.update("");this.onInitDrag(x,y);this.proxy.show();},onInitDrag:function(x,y){var _32=this.el.dom.cloneNode(true);_32.id=Ext.id();this.proxy.update(_32);this.onStartDrag(x,y);return true;},getProxy:function(){return this.proxy;},hideProxy:function(){this.proxy.hide();this.proxy.reset(true);this.dragging=false;},triggerCacheRefresh:function(){Ext.dd.DDM.refreshCache(this.groups);},b4EndDrag:function(e){},endDrag:function(e){this.onEndDrag(this.dragData,e);},onEndDrag:function(_35,e){},autoOffset:function(x,y){this.setDelta(-12,-20);}});



Ext.dd.DropTarget=function(el,_2){this.el=Ext.get(el);Ext.apply(this,_2);if(this.containerScroll){Ext.dd.ScrollManager.register(this.el);}Ext.dd.DropTarget.superclass.constructor.call(this,this.el.dom,this.ddGroup||this.group,{isTarget:true});};Ext.extend(Ext.dd.DropTarget,Ext.dd.DDTarget,{dropAllowed:"x-dd-drop-ok",dropNotAllowed:"x-dd-drop-nodrop",isTarget:true,isNotifyTarget:true,notifyEnter:function(dd,e,_5){if(this.overClass){this.el.addClass(this.overClass);}return this.dropAllowed;},notifyOver:function(dd,e,_8){return this.dropAllowed;},notifyOut:function(dd,e,_b){if(this.overClass){this.el.removeClass(this.overClass);}},notifyDrop:function(dd,e,_e){return false;}});



Ext.dd.DragZone=function(el,_2){Ext.dd.DragZone.superclass.constructor.call(this,el,_2);if(this.containerScroll){Ext.dd.ScrollManager.register(this.el);}};Ext.extend(Ext.dd.DragZone,Ext.dd.DragSource,{getDragData:function(e){return Ext.dd.Registry.getHandleFromEvent(e);},onInitDrag:function(x,y){this.proxy.update(this.dragData.ddel.cloneNode(true));this.onStartDrag(x,y);return true;},afterRepair:function(){if(Ext.enableFx){Ext.Element.fly(this.dragData.ddel).highlight(this.hlColor||"c3daf9");}this.dragging=false;},getRepairXY:function(e){return Ext.Element.fly(this.dragData.ddel).getXY();}});



Ext.dd.DropZone=function(el,_2){Ext.dd.DropZone.superclass.constructor.call(this,el,_2);};Ext.extend(Ext.dd.DropZone,Ext.dd.DropTarget,{getTargetFromEvent:function(e){return Ext.dd.Registry.getTargetFromEvent(e);},onNodeEnter:function(n,dd,e,_7){},onNodeOver:function(n,dd,e,_b){return this.dropAllowed;},onNodeOut:function(n,dd,e,_f){},onNodeDrop:function(n,dd,e,_13){return false;},onContainerOver:function(dd,e,_16){return this.dropNotAllowed;},onContainerDrop:function(dd,e,_19){return false;},notifyEnter:function(dd,e,_1c){return this.dropNotAllowed;},notifyOver:function(dd,e,_1f){var n=this.getTargetFromEvent(e);if(!n){if(this.lastOverNode){this.onNodeOut(this.lastOverNode,dd,e,_1f);this.lastOverNode=null;}return this.onContainerOver(dd,e,_1f);}if(this.lastOverNode!=n){if(this.lastOverNode){this.onNodeOut(this.lastOverNode,dd,e,_1f);}this.onNodeEnter(n,dd,e,_1f);this.lastOverNode=n;}return this.onNodeOver(n,dd,e,_1f);},notifyOut:function(dd,e,_23){if(this.lastOverNode){this.onNodeOut(this.lastOverNode,dd,e,_23);this.lastOverNode=null;}},notifyDrop:function(dd,e,_26){if(this.lastOverNode){this.onNodeOut(this.lastOverNode,dd,e,_26);this.lastOverNode=null;}var n=this.getTargetFromEvent(e);return n?this.onNodeDrop(n,dd,e,_26):this.onContainerDrop(dd,e,_26);},triggerCacheRefresh:function(){Ext.dd.DDM.refreshCache(this.groups);}});



Ext.data.SortTypes={none:function(s){return s;},stripTagsRE:/<\/?[^>]+>/gi,asText:function(s){return String(s).replace(this.stripTagsRE,"");},asUCText:function(s){return String(s).toUpperCase().replace(this.stripTagsRE,"");},asUCString:function(s){return String(s).toUpperCase();},asDate:function(s){if(!s){return 0;}if(s instanceof Date){return s.getTime();}return Date.parse(String(s));},asFloat:function(s){var _7=parseFloat(String(s).replace(/,/g,""));if(isNaN(_7)){_7=0;}return _7;},asInt:function(s){var _9=parseInt(String(s).replace(/,/g,""));if(isNaN(_9)){_9=0;}return _9;}};



Ext.data.Record=function(_1,id){this.id=(id||id===0)?id:++Ext.data.Record.AUTO_ID;this.data=_1;};Ext.data.Record.create=function(o){var f=function(){f.superclass.constructor.apply(this,arguments);};Ext.extend(f,Ext.data.Record);var p=f.prototype;p.fields=new Ext.util.MixedCollection(false,function(_6){return _6.name;});for(var i=0,_8=o.length;i<_8;i++){p.fields.add(new Ext.data.Field(o[i]));}f.getField=function(_9){return p.fields.get(_9);};return f;};Ext.data.Record.AUTO_ID=1000;Ext.data.Record.EDIT="edit";Ext.data.Record.REJECT="reject";Ext.data.Record.COMMIT="commit";Ext.data.Record.prototype={dirty:false,editing:false,error:null,modified:null,join:function(_a){this.store=_a;},set:function(_b,_c){if(this.data[_b]==_c){return;}this.dirty=true;if(!this.modified){this.modified={};}if(typeof this.modified[_b]=="undefined"){this.modified[_b]=this.data[_b];}this.data[_b]=_c;if(!this.editing){this.store.afterEdit(this);}},get:function(_d){return this.data[_d];},beginEdit:function(){this.editing=true;this.modified={};},cancelEdit:function(){this.editing=false;delete this.modified;},endEdit:function(){this.editing=false;if(this.dirty&&this.store){this.store.afterEdit(this);}},reject:function(){var m=this.modified;for(var n in m){if(typeof m[n]!="function"){this.data[n]=m[n];}}this.dirty=false;delete this.modified;this.editing=false;if(this.store){this.store.afterReject(this);}},commit:function(){this.dirty=false;delete this.modified;this.editing=false;if(this.store){this.store.afterCommit(this);}},hasError:function(){return this.error!=null;},clearError:function(){this.error=null;}};



Ext.data.Store=function(_1){this.data=new Ext.util.MixedCollection(false);this.data.getKey=function(o){return o.id;};this.baseParams={};this.paramNames={"start":"start","limit":"limit","sort":"sort","dir":"dir"};Ext.apply(this,_1);if(this.reader&&!this.recordType){this.recordType=this.reader.recordType;}this.fields=this.recordType.prototype.fields;this.modified=[];this.addEvents({datachanged:true,add:true,remove:true,update:true,clear:true,beforeload:true,load:true,loadexception:true});if(this.proxy){this.relayEvents(this.proxy,["loadexception"]);}this.sortToggle={};Ext.data.Store.superclass.constructor.call(this);};Ext.extend(Ext.data.Store,Ext.util.Observable,{remoteSort:false,lastOptions:null,add:function(_3){_3=[].concat(_3);for(var i=0,_5=_3.length;i<_5;i++){_3[i].join(this);}var _6=this.data.length;this.data.addAll(_3);this.fireEvent("add",this,_3,_6);},remove:function(_7){var _8=this.data.indexOf(_7);this.data.removeAt(_8);this.fireEvent("remove",this,_7,_8);},removeAll:function(){this.data.clear();this.fireEvent("clear",this);},insert:function(_9,_a){_a=[].concat(_a);for(var i=0,_c=_a.length;i<_c;i++){this.data.insert(_9,_a[i]);_a[i].join(this);}this.fireEvent("add",this,_a,_9);},indexOf:function(_d){return this.data.indexOf(_d);},indexOfId:function(id){return this.data.indexOfKey(id);},getById:function(id){return this.data.key(id);},getAt:function(_10){return this.data.itemAt(_10);},getRange:function(_11,end){return this.data.getRange(_11,end);},storeOptions:function(o){o=Ext.apply({},o);delete o.callback;delete o.scope;this.lastOptions=o;},load:function(_14){_14=_14||{};if(this.fireEvent("beforeload",this,_14)!==false){this.storeOptions(_14);var p=Ext.apply(_14.params||{},this.baseParams);if(this.sortInfo&&this.remoteSort){var pn=this.paramNames;p[pn["sort"]]=this.sortInfo.field;p[pn["dir"]]=this.sortInfo.direction;}this.proxy.load(p,this.reader,this.loadRecords,this,_14);}},reload:function(_17){this.load(Ext.applyIf(_17||{},this.lastOptions));},loadRecords:function(o,_19,_1a){if(!o||_1a===false){if(_1a!==false){this.fireEvent("load",this,[],_19);}if(_19.callback){_19.callback.call(_19.scope||this,[],_19,false);}return;}var r=o.records,t=o.totalRecords||r.length;for(var i=0,len=r.length;i<len;i++){r[i].join(this);}if(!_19||_19.add!==true){this.data.clear();this.data.addAll(r);this.totalLength=t;this.applySort();this.fireEvent("datachanged",this);}else{this.totalLength=Math.max(t,this.data.length+r.length);this.data.addAll(r);}this.fireEvent("load",this,r,_19);if(_19.callback){_19.callback.call(_19.scope||this,r,_19,true);}},loadData:function(o,_20){var r=this.reader.readRecords(o);this.loadRecords(r,{add:_20},true);},getCount:function(){return this.data.length||0;},getTotalCount:function(){return this.totalLength||0;},getSortState:function(){return this.sortInfo;},applySort:function(){if(this.sortInfo&&!this.remoteSort){var s=this.sortInfo,f=s.field;var st=this.fields.get(f).sortType;var fn=function(r1,r2){var v1=st(r1.data[f]),v2=st(r2.data[f]);return v1>v2?1:(v1<v2?-1:0);};this.data.sort(s.direction,fn);if(this.snapshot&&this.snapshot!=this.data){this.snapshot.sort(s.direction,fn);}}},setDefaultSort:function(_2a,dir){this.sortInfo={field:_2a,direction:dir?dir.toUpperCase():"ASC"};},sort:function(_2c,dir){var f=this.fields.get(_2c);if(!dir){if(this.sortInfo&&this.sortInfo.field==f.name){dir=(this.sortToggle[f.name]||"ASC").toggle("ASC","DESC");}else{dir=f.sortDir;}}this.sortToggle[f.name]=dir;this.sortInfo={field:f.name,direction:dir};if(!this.remoteSort){this.applySort();this.fireEvent("datachanged",this);}else{this.load(this.lastOptions);}},each:function(fn,_30){this.data.each(fn,_30);},getModifiedRecords:function(){return this.modified;},filter:function(_31,_32){if(!_32.exec){_32=String(_32);if(_32.length==0){return this.clearFilter();}_32=new RegExp("^"+Ext.escapeRe(_32),"i");}this.filterBy(function(r){return _32.test(r.data[_31]);});},filterBy:function(fn,_35){var _36=this.snapshot||this.data;this.snapshot=_36;this.data=_36.filterBy(fn,_35);this.fireEvent("datachanged",this);},clearFilter:function(_37){if(this.snapshot&&this.snapshot!=this.data){this.data=this.snapshot;delete this.snapshot;if(_37!==true){this.fireEvent("datachanged",this);}}},afterEdit:function(_38){if(this.modified.indexOf(_38)==-1){this.modified.push(_38);}this.fireEvent("update",this,_38,Ext.data.Record.EDIT);},afterReject:function(_39){this.modified.remove(_39);this.fireEvent("update",this,_39,Ext.data.Record.REJECT);},afterCommit:function(_3a){this.modified.remove(_3a);this.fireEvent("update",this,_3a,Ext.data.Record.COMMIT);},commitChanges:function(){var m=this.modified.slice(0);this.modified=[];for(var i=0,len=m.length;i<len;i++){m[i].commit();}},rejectChanges:function(){var m=this.modified.slice(0);this.modified=[];for(var i=0,len=m.length;i<len;i++){m[i].reject();}}});



Ext.data.Connection=function(_1){Ext.apply(this,_1);this.addEvents({"beforerequest":true,"requestcomplete":true,"requestexception":true});Ext.data.Connection.superclass.constructor.call(this);};Ext.extend(Ext.data.Connection,Ext.util.Observable,{timeout:30000,request:function(_2){if(this.fireEvent("beforerequest",this,_2)!==false){var p=_2.params;if(typeof p=="object"){p=Ext.urlEncode(Ext.apply(_2.params,this.extraParams));}var cb={success:this.handleResponse,failure:this.handleFailure,scope:this,argument:{options:_2},timeout:this.timeout};var _5=_2.method||this.method||(p?"POST":"GET");var _6=_2.url||this.url;if(this.autoAbort!==false){this.abort();}if(_5=="GET"&&p){_6+=(_6.indexOf("?")!=-1?"&":"?")+p;p="";}this.transId=Ext.lib.Ajax.request(_5,_6,cb,p);}else{if(typeof _2.callback=="function"){_2.callback.call(_2.scope||window,_2,null,null);}}},isLoading:function(){return this.transId?true:false;},abort:function(){if(this.isLoading()){Ext.lib.Ajax.abort(this.transId);}},handleResponse:function(_7){this.transId=false;var _8=_7.argument.options;this.fireEvent("requestcomplete",this,_7,_8);if(typeof _8.callback=="function"){_8.callback.call(_8.scope||window,_8,true,_7);}},handleFailure:function(_9,e){this.transId=false;var _b=_9.argument.options;this.fireEvent("requestexception",this,_9,_b,e);if(typeof _b.callback=="function"){_b.callback.call(_b.scope||window,_b,false,_9);}}});



Ext.data.Field=function(_1){if(typeof _1=="string"){_1={name:_1};}Ext.apply(this,_1);if(!this.type){this.type="auto";}var st=Ext.data.SortTypes;if(typeof this.sortType=="string"){this.sortType=st[this.sortType];}if(!this.sortType){switch(this.type){case "string":this.sortType=st.asUCString;break;case "date":this.sortType=st.asDate;break;default:this.sortType=st.none;}}var _3=/[\$,%]/g;if(!this.convert){var cv,_5=this.dateFormat;switch(this.type){case "":case "auto":case undefined:cv=function(v){return v;};break;case "string":cv=function(v){return String(v);};break;case "int":cv=function(v){return v!==undefined&&v!==null&&v!==""?parseInt(String(v).replace(_3,""),10):"";};break;case "float":cv=function(v){return v!==undefined&&v!==null&&v!==""?parseFloat(String(v).replace(_3,""),10):"";};break;case "bool":case "boolean":cv=function(v){return v===true||v==="true"||v==1;};break;case "date":cv=function(v){if(!v){return "";}if(v instanceof Date){return v;}if(_5){if(_5=="timestamp"){return new Date(v*1000);}return Date.parseDate(v,_5);}var _c=Date.parse(v);return _c?new Date(_c):null;};break;}this.convert=cv;}};Ext.data.Field.prototype={dateFormat:null,defaultValue:"",mapping:null,sortType:null,sortDir:"ASC"};



Ext.data.DataReader=function(_1,_2){this.meta=_1;this.recordType=_2 instanceof Array?Ext.data.Record.create(_2):_2;};Ext.data.DataReader.prototype={};



Ext.data.DataProxy=function(){this.addEvents({beforeload:true,load:true,loadexception:true});Ext.data.DataProxy.superclass.constructor.call(this);};Ext.extend(Ext.data.DataProxy,Ext.util.Observable);



Ext.data.MemoryProxy=function(_1){Ext.data.MemoryProxy.superclass.constructor.call(this);this.data=_1;};Ext.extend(Ext.data.MemoryProxy,Ext.data.DataProxy,{load:function(_2,_3,_4,_5,_6){_2=_2||{};var _7;try{_7=_3.readRecords(this.data);}catch(e){this.fireEvent("loadexception",this,_6,null,e);_4.call(_5,null,_6,false);return;}_4.call(_5,_7,_6,true);},update:function(_8,_9){}});



Ext.data.HttpProxy=function(_1){Ext.data.HttpProxy.superclass.constructor.call(this);this.conn=_1.events?_1:new Ext.data.Connection(_1);};Ext.extend(Ext.data.HttpProxy,Ext.data.DataProxy,{getConnection:function(){return this.conn;},load:function(_2,_3,_4,_5,_6){if(this.fireEvent("beforeload",this,_2)!==false){this.conn.request({params:_2||{},request:{callback:_4,scope:_5,arg:_6},reader:_3,callback:this.loadResponse,scope:this});}else{_4.call(_5||this,null,_6,false);}},loadResponse:function(o,_8,_9){if(!_8){this.fireEvent("loadexception",this,o,_9);o.request.callback.call(o.request.scope,null,o.request.arg,false);return;}var _a;try{_a=o.reader.read(_9);}catch(e){this.fireEvent("loadexception",this,o,_9,e);o.request.callback.call(o.request.scope,null,o.request.arg,false);return;}this.fireEvent("load",this,o,o.request.arg);o.request.callback.call(o.request.scope,_a,o.request.arg,true);},update:function(_b){},updateResponse:function(_c){}});



Ext.data.ScriptTagProxy=function(_1){Ext.data.ScriptTagProxy.superclass.constructor.call(this);Ext.apply(this,_1);this.head=document.getElementsByTagName("head")[0];};Ext.data.ScriptTagProxy.TRANS_ID=1000;Ext.extend(Ext.data.ScriptTagProxy,Ext.data.DataProxy,{timeout:30000,callbackParam:"callback",nocache:true,load:function(_2,_3,_4,_5,_6){if(this.fireEvent("beforeload",this,_2)!==false){var p=Ext.urlEncode(Ext.apply(_2,this.extraParams));var _8=this.url;_8+=(_8.indexOf("?")!=-1?"&":"?")+p;if(this.nocache){_8+="&_dc="+(new Date().getTime());}var _9=++Ext.data.ScriptTagProxy.TRANS_ID;var _a={id:_9,cb:"stcCallback"+_9,scriptId:"stcScript"+_9,params:_2,arg:_6,url:_8,callback:_4,scope:_5,reader:_3};var _b=this;window[_a.cb]=function(o){_b.handleResponse(o,_a);};_8+=String.format("&{0}={1}",this.callbackParam,_a.cb);if(this.autoAbort!==false){this.abort();}_a.timeoutId=this.handleFailure.defer(this.timeout,this,[_a]);var _d=document.createElement("script");_d.setAttribute("src",_8);_d.setAttribute("type","text/javascript");_d.setAttribute("id",_a.scriptId);this.head.appendChild(_d);this.trans=_a;}else{_4.call(_5||this,null,_6,false);}},isLoading:function(){return this.trans?true:false;},abort:function(){if(this.isLoading()){this.destroyTrans(this.trans);}},destroyTrans:function(_e,_f){this.head.removeChild(document.getElementById(_e.scriptId));clearTimeout(_e.timeoutId);if(_f){window[_e.cb]=undefined;try{delete window[_e.cb];}catch(e){}}else{window[_e.cb]=function(){window[_e.cb]=undefined;try{delete window[_e.cb];}catch(e){}};}},handleResponse:function(o,_11){this.trans=false;this.destroyTrans(_11,true);var _12;try{_12=_11.reader.readRecords(o);}catch(e){this.fireEvent("loadexception",this,o,_11.arg,e);_11.callback.call(_11.scope||window,null,_11.arg,false);return;}this.fireEvent("load",this,o,_11.arg);_11.callback.call(_11.scope||window,_12,_11.arg,true);},handleFailure:function(_13){this.trans=false;this.destroyTrans(_13,false);this.fireEvent("loadexception",this,null,_13.arg);_13.callback.call(_13.scope||window,null,_13.arg,false);}});



Ext.data.JsonReader=function(_1,_2){Ext.data.JsonReader.superclass.constructor.call(this,_1,_2);};Ext.extend(Ext.data.JsonReader,Ext.data.DataReader,{read:function(_3){var _4=_3.responseText;var o=eval("("+_4+")");if(!o){throw {message:"JsonReader.read: Json object not found"};}return this.readRecords(o);},simpleAccess:function(_6,_7){return _6[_7];},getJsonAccessor:function(){var re=/[\[\.]/;return function(_9){try{return (re.test(_9))?new Function("obj","return obj."+_9):function(_a){return _a[_9];};}catch(e){}return Ext.emptyFn;};}(),readRecords:function(o){this.jsonData=o;var s=this.meta,_d=this.recordType,f=_d.prototype.fields,fi=f.items,fl=f.length;if(!this.ef){if(s.totalProperty){this.getTotal=this.getJsonAccessor(s.totalProperty);}if(s.successProperty){this.getSuccess=this.getJsonAccessor(s.successProperty);}this.getRoot=s.root?this.getJsonAccessor(s.root):function(p){return p;};if(s.id){var g=this.getJsonAccessor(s.id);this.getId=function(rec){var r=g(rec);return (r===undefined||r==="")?null:r;};}else{this.getId=function(){return null;};}this.ef=[];for(var i=0;i<fl;i++){f=fi[i];var map=(f.mapping!==undefined&&f.mapping!==null)?f.mapping:f.name;this.ef[i]=this.getJsonAccessor(map);}}var _17=this.getRoot(o),c=_17.length,_19=c,_1a=true;if(s.totalProperty){var v=parseInt(this.getTotal(o),10);if(!isNaN(v)){_19=v;}}if(s.successProperty){var v=this.getSuccess(o);if(v===false||v==="false"){_1a=false;}}var _1c=[];for(var i=0;i<c;i++){var n=_17[i];var _1e={};var id=this.getId(n);for(var j=0;j<fl;j++){f=fi[j];var v=this.ef[j](n);_1e[f.name]=f.convert((v!==undefined)?v:f.defaultValue);}var _21=new _d(_1e,id);_21.json=n;_1c[i]=_21;}return {success:_1a,records:_1c,totalRecords:_19};}});



Ext.data.ArrayReader=function(_1,_2){Ext.data.ArrayReader.superclass.constructor.call(this,_1,_2);};Ext.extend(Ext.data.ArrayReader,Ext.data.JsonReader,{readRecords:function(o){var _4=this.meta?this.meta.id:null;var _5=this.recordType,_6=_5.prototype.fields;var _7=[];var _8=o;for(var i=0;i<_8.length;i++){var n=_8[i];var _b={};var id=((_4||_4===0)&&n[_4]!==undefined&&n[_4]!==""?n[_4]:null);for(var j=0,_e=_6.length;j<_e;j++){var f=_6.items[j];var k=f.mapping!==undefined&&f.mapping!==null?f.mapping:j;var v=n[k]!==undefined?n[k]:f.defaultValue;v=f.convert(v);_b[f.name]=v;}var _12=new _5(_b,id);_12.json=n;_7[_7.length]=_12;}return {records:_7,totalRecords:_7.length};}});



Ext.data.Tree=function(_1){this.nodeHash={};this.root=null;if(_1){this.setRootNode(_1);}this.addEvents({"append":true,"remove":true,"move":true,"insert":true,"beforeappend":true,"beforeremove":true,"beforemove":true,"beforeinsert":true});Ext.data.Tree.superclass.constructor.call(this);};Ext.extend(Ext.data.Tree,Ext.util.Observable,{pathSeparator:"/",getRootNode:function(){return this.root;},setRootNode:function(_2){this.root=_2;_2.ownerTree=this;_2.isRoot=true;this.registerNode(_2);return _2;},getNodeById:function(id){return this.nodeHash[id];},registerNode:function(_4){this.nodeHash[_4.id]=_4;},unregisterNode:function(_5){delete this.nodeHash[_5.id];},toString:function(){return "[Tree"+(this.id?" "+this.id:"")+"]";}});Ext.data.Node=function(_6){this.attributes=_6||{};this.leaf=this.attributes.leaf;this.id=this.attributes.id;if(!this.id){this.id=Ext.id(null,"ynode-");this.attributes.id=this.id;}this.childNodes=[];if(!this.childNodes.indexOf){this.childNodes.indexOf=function(o){for(var i=0,_9=this.length;i<_9;i++){if(this[i]==o){return i;}}return -1;};}this.parentNode=null;this.firstChild=null;this.lastChild=null;this.previousSibling=null;this.nextSibling=null;this.addEvents({"append":true,"remove":true,"move":true,"insert":true,"beforeappend":true,"beforeremove":true,"beforemove":true,"beforeinsert":true});this.listeners=this.attributes.listeners;Ext.data.Node.superclass.constructor.call(this);};Ext.extend(Ext.data.Node,Ext.util.Observable,{fireEvent:function(_a){if(Ext.data.Node.superclass.fireEvent.apply(this,arguments)===false){return false;}var ot=this.getOwnerTree();if(ot){if(ot.fireEvent.apply(this.ownerTree,arguments)===false){return false;}}return true;},isLeaf:function(){return this.leaf===true;},setFirstChild:function(_c){this.firstChild=_c;},setLastChild:function(_d){this.lastChild=_d;},isLast:function(){return (!this.parentNode?true:this.parentNode.lastChild==this);},isFirst:function(){return (!this.parentNode?true:this.parentNode.firstChild==this);},hasChildNodes:function(){return !this.isLeaf()&&this.childNodes.length>0;},appendChild:function(_e){var _f=false;if(_e instanceof Array){_f=_e;}else{if(arguments.length>1){_f=arguments;}}if(_f){for(var i=0,len=_f.length;i<len;i++){this.appendChild(_f[i]);}}else{if(this.fireEvent("beforeappend",this.ownerTree,this,_e)===false){return false;}var _12=this.childNodes.length;var _13=_e.parentNode;if(_13){if(_e.fireEvent("beforemove",_e.getOwnerTree(),_e,_13,this,_12)===false){return false;}_13.removeChild(_e);}_12=this.childNodes.length;if(_12==0){this.setFirstChild(_e);}this.childNodes.push(_e);_e.parentNode=this;var ps=this.childNodes[_12-1];if(ps){_e.previousSibling=ps;ps.nextSibling=_e;}else{_e.previousSibling=null;}_e.nextSibling=null;this.setLastChild(_e);_e.setOwnerTree(this.getOwnerTree());this.fireEvent("append",this.ownerTree,this,_e,_12);if(_13){_e.fireEvent("move",this.ownerTree,_e,_13,this,_12);}return _e;}},removeChild:function(_15){var _16=this.childNodes.indexOf(_15);if(_16==-1){return false;}if(this.fireEvent("beforeremove",this.ownerTree,this,_15)===false){return false;}this.childNodes.splice(_16,1);if(_15.previousSibling){_15.previousSibling.nextSibling=_15.nextSibling;}if(_15.nextSibling){_15.nextSibling.previousSibling=_15.previousSibling;}if(this.firstChild==_15){this.setFirstChild(_15.nextSibling);}if(this.lastChild==_15){this.setLastChild(_15.previousSibling);}_15.setOwnerTree(null);_15.parentNode=null;_15.previousSibling=null;_15.nextSibling=null;this.fireEvent("remove",this.ownerTree,this,_15);return _15;},insertBefore:function(_17,_18){if(!_18){return this.appendChild(_17);}if(_17==_18){return false;}if(this.fireEvent("beforeinsert",this.ownerTree,this,_17,_18)===false){return false;}var _19=this.childNodes.indexOf(_18);var _1a=_17.parentNode;var _1b=_19;if(_1a==this&&this.childNodes.indexOf(_17)<_19){_1b--;}if(_1a){if(_17.fireEvent("beforemove",_17.getOwnerTree(),_17,_1a,this,_19,_18)===false){return false;}_1a.removeChild(_17);}if(_1b==0){this.setFirstChild(_17);}this.childNodes.splice(_1b,0,_17);_17.parentNode=this;var ps=this.childNodes[_1b-1];if(ps){_17.previousSibling=ps;ps.nextSibling=_17;}else{_17.previousSibling=null;}_17.nextSibling=_18;_18.previousSibling=_17;_17.setOwnerTree(this.getOwnerTree());this.fireEvent("insert",this.ownerTree,this,_17,_18);if(_1a){_17.fireEvent("move",this.ownerTree,_17,_1a,this,_1b,_18);}return _17;},item:function(_1d){return this.childNodes[_1d];},replaceChild:function(_1e,_1f){this.insertBefore(_1e,_1f);this.removeChild(_1f);return _1f;},indexOf:function(_20){return this.childNodes.indexOf(_20);},getOwnerTree:function(){if(!this.ownerTree){var p=this;while(p){if(p.ownerTree){this.ownerTree=p.ownerTree;break;}p=p.parentNode;}}return this.ownerTree;},getDepth:function(){var _22=0;var p=this;while(p.parentNode){++_22;p=p.parentNode;}return _22;},setOwnerTree:function(_24){if(_24!=this.ownerTree){if(this.ownerTree){this.ownerTree.unregisterNode(this);}this.ownerTree=_24;var cs=this.childNodes;for(var i=0,len=cs.length;i<len;i++){cs[i].setOwnerTree(_24);}if(_24){_24.registerNode(this);}}},getPath:function(_28){_28=_28||"id";var p=this.parentNode;var b=[this.attributes[_28]];while(p){b.unshift(p.attributes[_28]);p=p.parentNode;}var sep=this.getOwnerTree().pathSeparator;return sep+b.join(sep);},bubble:function(fn,_2d,_2e){var p=this;while(p){if(fn.call(_2d||p,_2e||p)===false){break;}p=p.parentNode;}},cascade:function(fn,_31,_32){if(fn.call(_31||this,_32||this)!==false){var cs=this.childNodes;for(var i=0,len=cs.length;i<len;i++){cs[i].cascade(fn,_31,_32);}}},eachChild:function(fn,_37,_38){var cs=this.childNodes;for(var i=0,len=cs.length;i<len;i++){if(fn.call(_37||this,_38||cs[i])===false){break;}}},findChild:function(_3c,_3d){var cs=this.childNodes;for(var i=0,len=cs.length;i<len;i++){if(cs[i].attributes[_3c]==_3d){return cs[i];}}return null;},findChildBy:function(fn,_42){var cs=this.childNodes;for(var i=0,len=cs.length;i<len;i++){if(fn.call(_42||cs[i],cs[i])===true){return cs[i];}}return null;},sort:function(fn,_47){var cs=this.childNodes;var len=cs.length;if(len>0){var _4a=_47?function(){fn.apply(_47,arguments);}:fn;cs.sort(_4a);for(var i=0;i<len;i++){var n=cs[i];n.previousSibling=cs[i-1];n.nextSibling=cs[i+1];if(i==0){this.setFirstChild(n);}if(i==len-1){this.setLastChild(n);}}}},contains:function(_4d){return _4d.isAncestor(this);},isAncestor:function(_4e){var p=this.parentNode;while(p){if(p==_4e){return true;}p=p.parentNode;}return false;},toString:function(){return "[Node"+(this.id?" "+this.id:"")+"]";}});



Ext.ComponentMgr=function(){var _1=new Ext.util.MixedCollection();return {register:function(c){_1.add(c);},unregister:function(c){_1.remove(c);},get:function(id){return _1.get(id);},onAvailable:function(id,fn,_7){_1.on("add",function(_8,o){if(o.id==id){fn.call(_7||o,o);_1.un("add",fn,_7);}});}};}();Ext.Component=function(_a){_a=_a||{};if(_a.tagName||_a.dom||typeof _a=="string"){_a={el:_a,id:_a.id||_a};}this.initialConfig=_a;Ext.apply(this,_a);this.addEvents({disable:true,enable:true,beforeshow:true,show:true,beforehide:true,hide:true,beforerender:true,render:true,beforedestroy:true,destroy:true});if(!this.id){this.id="ext-comp-"+(++Ext.Component.AUTO_ID);}Ext.ComponentMgr.register(this);Ext.Component.superclass.constructor.call(this);this.initComponent();};Ext.Component.AUTO_ID=1000;Ext.extend(Ext.Component,Ext.util.Observable,{hidden:false,disabled:false,disabledClass:"x-item-disabled",rendered:false,allowDomMove:true,ctype:"Ext.Component",actionMode:"el",getActionEl:function(){return this[this.actionMode];},initComponent:Ext.emptyFn,render:function(_b,_c){if(!this.rendered&&this.fireEvent("beforerender",this)!==false){if(!_b&&this.el){this.el=Ext.get(this.el);_b=this.el.dom.parentNode;this.allowDomMove=false;}this.container=Ext.get(_b);this.rendered=true;if(_c!==undefined){if(typeof _c=="number"){_c=this.container.dom.childNodes[_c];}else{_c=Ext.getDom(_c);}}this.onRender(this.container,_c||null);if(this.cls){this.el.addClass(this.cls);delete this.cls;}if(this.style){this.el.applyStyles(this.style);delete this.style;}this.fireEvent("render",this);this.afterRender(this.container);if(this.hidden){this.hide();}if(this.disabled){this.disable();}}return this;},onRender:function(ct,_e){if(this.el){this.el=Ext.get(this.el);if(this.allowDomMove!==false){ct.dom.insertBefore(this.el.dom,_e);}}},getAutoCreate:function(){var _f=typeof this.autoCreate=="object"?this.autoCreate:Ext.apply({},this.defaultAutoCreate);if(this.id&&!_f.id){_f.id=this.id;}return _f;},afterRender:Ext.emptyFn,destroy:function(){if(this.fireEvent("beforedestroy",this)!==false){this.purgeListeners();this.beforeDestroy();if(this.rendered){this.el.removeAllListeners();this.el.remove();if(this.actionMode=="container"){this.container.remove();}}this.onDestroy();Ext.ComponentMgr.unregister(this);this.fireEvent("destroy",this);}},beforeDestroy:function(){},onDestroy:function(){},getEl:function(){return this.el;},getId:function(){return this.id;},focus:function(_10){if(this.rendered){this.el.focus();if(_10===true){this.el.dom.select();}}return this;},blur:function(){if(this.rendered){this.el.blur();}return this;},disable:function(){if(this.rendered){this.onDisable();}this.disabled=true;this.fireEvent("disable",this);return this;},onDisable:function(){this.getActionEl().addClass(this.disabledClass);this.el.dom.disabled=true;},enable:function(){if(this.rendered){this.onEnable();}this.disabled=false;this.fireEvent("enable",this);return this;},onEnable:function(){this.getActionEl().removeClass(this.disabledClass);this.el.dom.disabled=false;},setDisabled:function(_11){this[_11?"disable":"enable"]();},show:function(){if(this.fireEvent("beforeshow",this)!==false){this.hidden=false;if(this.rendered){this.onShow();}this.fireEvent("show",this);}return this;},onShow:function(){var st=this.getActionEl().dom.style;st.display="";st.visibility="visible";},hide:function(){if(this.fireEvent("beforehide",this)!==false){this.hidden=true;if(this.rendered){this.onHide();}this.fireEvent("hide",this);}return this;},onHide:function(){this.getActionEl().dom.style.display="none";},setVisible:function(_13){if(_13){this.show();}else{this.hide();}return this;},isVisible:function(){return this.getActionEl().isVisible();},cloneConfig:function(_14){_14=_14||{};var id=_14.id||Ext.id();var cfg=Ext.applyIf(_14,this.initialConfig);cfg.id=id;return new this.__extcls(cfg);}});



(function(){Ext.Layer=function(_1,_2){_1=_1||{};var dh=Ext.DomHelper;var cp=_1.parentEl,_5=cp?Ext.getDom(cp):document.body;if(_2){this.dom=Ext.getDom(_2);}if(!this.dom){var o=_1.dh||{tag:"div",cls:"x-layer"};this.dom=dh.append(_5,o);}if(_1.cls){this.addClass(_1.cls);}this.constrain=_1.constrain!==false;this.visibilityMode=Ext.Element.VISIBILITY;if(_1.id){this.id=this.dom.id=_1.id;}else{this.id=Ext.id(this.dom);}this.zindex=_1.zindex||this.getZIndex();this.position("absolute",this.zindex);if(_1.shadow){this.shadowOffset=_1.shadowOffset||4;this.shadow=new Ext.Shadow({offset:this.shadowOffset,mode:_1.shadow});}else{this.shadowOffset=0;}this.useShim=_1.shim!==false&&Ext.useShims;this.useDisplay=_1.useDisplay;this.hide();};var _7=Ext.Element.prototype;var _8=[];Ext.extend(Ext.Layer,Ext.Element,{getZIndex:function(){return this.zindex||parseInt(this.getStyle("z-index"),10)||11000;},getShim:function(){if(!this.useShim){return null;}if(this.shim){return this.shim;}var _9=_8.shift();if(!_9){_9=this.createShim();_9.enableDisplayMode("block");_9.dom.style.display="none";_9.dom.style.visibility="visible";}var pn=this.dom.parentNode;if(_9.dom.parentNode!=pn){pn.insertBefore(_9.dom,this.dom);}_9.setStyle("z-index",this.getZIndex()-2);this.shim=_9;return _9;},hideShim:function(){if(this.shim){this.shim.setDisplayed(false);_8.push(this.shim);delete this.shim;}},disableShadow:function(){if(this.shadow){this.shadowDisabled=true;this.shadow.hide();this.lastShadowOffset=this.shadowOffset;this.shadowOffset=0;}},enableShadow:function(_b){if(this.shadow){this.shadowDisabled=false;this.shadowOffset=this.lastShadowOffset;delete this.lastShadowOffset;if(_b){this.sync(true);}}},sync:function(_c){var sw=this.shadow;if(!this.updating&&this.isVisible()&&(sw||this.useShim)){var sh=this.getShim();var w=this.getWidth(),h=this.getHeight();var l=this.getLeft(true),t=this.getTop(true);if(sw&&!this.shadowDisabled){if(_c&&!sw.isVisible()){sw.show(this);}else{sw.realign(l,t,w,h);}if(sh){if(_c){sh.show();}var a=sw.adjusts,s=sh.dom.style;s.left=(Math.min(l,l+a.l))+"px";s.top=(Math.min(t,t+a.t))+"px";s.width=(w+a.w)+"px";s.height=(h+a.h)+"px";}}else{if(sh){if(_c){sh.show();}sh.setSize(w,h);sh.setLeftTop(l,t);}}}},destroy:function(){this.hideShim();if(this.shadow){this.shadow.hide();}this.removeAllListeners();var pn=this.dom.parentNode;if(pn){pn.removeChild(this.dom);}Ext.Element.uncache(this.id);},remove:function(){this.destroy();},beginUpdate:function(){this.updating=true;},endUpdate:function(){this.updating=false;this.sync(true);},hideUnders:function(_16){if(this.shadow){this.shadow.hide();}this.hideShim();},constrainXY:function(){if(this.constrain){var vw=Ext.lib.Dom.getViewWidth(),vh=Ext.lib.Dom.getViewHeight();var s=Ext.get(document).getScroll();var xy=this.getXY();var x=xy[0],y=xy[1];var w=this.dom.offsetWidth+this.shadowOffset,h=this.dom.offsetHeight+this.shadowOffset;var _1f=false;if((x+w)>vw+s.left){x=vw-w-this.shadowOffset;_1f=true;}if((y+h)>vh+s.top){y=vh-h-this.shadowOffset;_1f=true;}if(x<s.left){x=s.left;_1f=true;}if(y<s.top){y=s.top;_1f=true;}if(_1f){if(this.avoidY){var ay=this.avoidY;if(y<=ay&&(y+h)>=ay){y=ay-h-5;}}xy=[x,y];this.storeXY(xy);_7.setXY.call(this,xy);this.sync();}}},isVisible:function(){return this.visible;},showAction:function(){this.visible=true;if(this.useDisplay===true){this.setDisplayed("");}else{if(this.lastXY){_7.setXY.call(this,this.lastXY);}else{if(this.lastLT){_7.setLeftTop.call(this,this.lastLT[0],this.lastLT[1]);}}}},hideAction:function(){this.visible=false;if(this.useDisplay===true){this.setDisplayed(false);}else{this.setLeftTop(-10000,-10000);}},setVisible:function(v,a,d,c,e){if(v){this.showAction();}if(a&&v){var cb=function(){this.sync(true);if(c){c();}}.createDelegate(this);_7.setVisible.call(this,true,true,d,cb,e);}else{if(!v){this.hideUnders(true);}var cb=c;if(a){cb=function(){this.hideAction();if(c){c();}}.createDelegate(this);}_7.setVisible.call(this,v,a,d,cb,e);if(v){this.sync(true);}else{if(!a){this.hideAction();}}}},storeXY:function(xy){delete this.lastLT;this.lastXY=xy;},storeLeftTop:function(_28,top){delete this.lastXY;this.lastLT=[_28,top];},beforeFx:function(){this.beforeAction();return Ext.Layer.superclass.beforeFx.apply(this,arguments);},afterFx:function(){Ext.Layer.superclass.afterFx.apply(this,arguments);this.sync(this.isVisible());},beforeAction:function(){if(!this.updating&&this.shadow){this.shadow.hide();}},setLeft:function(_2a){this.storeLeftTop(_2a,this.getTop(true));_7.setLeft.apply(this,arguments);this.sync();},setTop:function(top){this.storeLeftTop(this.getLeft(true),top);_7.setTop.apply(this,arguments);this.sync();},setLeftTop:function(_2c,top){this.storeLeftTop(_2c,top);_7.setLeftTop.apply(this,arguments);this.sync();},setXY:function(xy,a,d,c,e){this.fixDisplay();this.beforeAction();this.storeXY(xy);var cb=this.createCB(c);_7.setXY.call(this,xy,a,d,cb,e);if(!a){cb();}},createCB:function(c){var el=this;return function(){el.constrainXY();el.sync(true);if(c){c();}};},setX:function(x,a,d,c,e){this.setXY([x,this.getY()],a,d,c,e);},setY:function(y,a,d,c,e){this.setXY([this.getX(),y],a,d,c,e);},setSize:function(w,h,a,d,c,e){this.beforeAction();var cb=this.createCB(c);_7.setSize.call(this,w,h,a,d,cb,e);if(!a){cb();}},setWidth:function(w,a,d,c,e){this.beforeAction();var cb=this.createCB(c);_7.setWidth.call(this,w,a,d,cb,e);if(!a){cb();}},setHeight:function(h,a,d,c,e){this.beforeAction();var cb=this.createCB(c);_7.setHeight.call(this,h,a,d,cb,e);if(!a){cb();}},setBounds:function(x,y,w,h,a,d,c,e){this.beforeAction();var cb=this.createCB(c);if(!a){this.storeXY([x,y]);_7.setXY.call(this,[x,y]);_7.setSize.call(this,w,h,a,d,cb,e);cb();}else{_7.setBounds.call(this,x,y,w,h,a,d,cb,e);}return this;},setZIndex:function(_5c){this.zindex=_5c;this.setStyle("z-index",_5c+2);if(this.shadow){this.shadow.setZIndex(_5c+1);}if(this.shim){this.shim.setStyle("z-index",_5c);}}});})();



Ext.Shadow=function(_1){Ext.apply(this,_1);if(typeof this.mode!="string"){this.mode=this.defaultMode;}var o=this.offset,a={h:0};switch(this.mode.toLowerCase()){case "drop":a.w=0;a.l=a.t=o;break;case "sides":a.w=(o*2);a.l=-o;a.t=o;break;case "frame":a.w=a.h=(o*2);a.l=a.t=-o;break;}this.adjusts=a;};Ext.Shadow.prototype={offset:4,defaultMode:"drop",show:function(_4){_4=Ext.get(_4);if(!this.el){this.el=Ext.Shadow.Pool.pull();if(this.el.dom.nextSibling!=_4.dom){this.el.insertBefore(_4);}}this.el.setStyle("z-index",this.zIndex||parseInt(_4.getStyle("z-index"),10)-1);if(Ext.isIE){this.el.dom.style.filter="progid:DXImageTransform.Microsoft.alpha(opacity=50) progid:DXImageTransform.Microsoft.Blur(pixelradius="+this.offset+")";}this.realign(_4.getLeft(true),_4.getTop(true),_4.getWidth(),_4.getHeight());this.el.dom.style.display="block";},isVisible:function(){return this.el?true:false;},realign:function(l,t,w,h){if(!this.el){return;}var a=this.adjusts,d=this.el.dom,s=d.style;var _c=0;if(Ext.isIE){_c=-(this.offset);}s.left=(l+a.l+_c)+"px";s.top=(t+a.t+_c)+"px";var sw=(w+a.w),sh=(h+a.h),_f=sw+"px",shs=sh+"px";if(s.width!=_f||s.height!=shs){s.width=_f;s.height=shs;if(!Ext.isIE){var cn=d.childNodes;var sww=Math.max(0,(sw-12))+"px";cn[0].childNodes[1].style.width=sww;cn[1].childNodes[1].style.width=sww;cn[2].childNodes[1].style.width=sww;cn[1].style.height=Math.max(0,(sh-12))+"px";}}},hide:function(){if(this.el){this.el.dom.style.display="none";Ext.Shadow.Pool.push(this.el);delete this.el;}},setZIndex:function(z){this.zIndex=z;if(this.el){this.el.setStyle("z-index",z);}}};Ext.Shadow.Pool=function(){var p=[];var _15=Ext.isIE?"<div class=\"x-ie-shadow\"></div>":"<div class=\"x-shadow\"><div class=\"xst\"><div class=\"xstl\"></div><div class=\"xstc\"></div><div class=\"xstr\"></div></div><div class=\"xsc\"><div class=\"xsml\"></div><div class=\"xsmc\"></div><div class=\"xsmr\"></div></div><div class=\"xsb\"><div class=\"xsbl\"></div><div class=\"xsbc\"></div><div class=\"xsbr\"></div></div></div>";return {pull:function(){var sh=p.shift();if(!sh){sh=Ext.get(Ext.DomHelper.insertHtml("beforeBegin",document.body.firstChild,_15));sh.autoBoxAdjust=false;}return sh;},push:function(sh){p.push(sh);}};}();



Ext.Editor=function(_1,_2){Ext.Editor.superclass.constructor.call(this,_2);this.field=_1;this.addEvents({"beforestartedit":true,"startedit":true,"beforecomplete":true,"complete":true,"specialkey":true});};Ext.extend(Ext.Editor,Ext.Component,{value:"",alignment:"c-c?",shadow:"frame",updateEl:false,onRender:function(ct,_4){this.el=new Ext.Layer({shadow:this.shadow,cls:"x-editor",parentEl:ct,shim:this.shim,shadowOffset:3,id:this.id});this.el.setStyle("overflow",Ext.isGecko?"auto":"hidden");this.field.render(this.el);if(Ext.isGecko){this.field.el.dom.setAttribute("autocomplete","off");}this.field.show();this.field.on("blur",this.onBlur,this);this.relayEvents(this.field,["specialkey"]);if(this.field.grow){this.field.on("autosize",this.el.sync,this.el,{delay:1});}},startEdit:function(el,_6){if(this.editing){this.completeEdit();}this.boundEl=Ext.get(el);var v=_6!==undefined?_6:this.boundEl.dom.innerHTML;if(!this.rendered){this.render(this.parentEl||document.body);}if(this.fireEvent("beforestartedit",this,this.boundEl,v)===false){return;}this.startValue=v;this.field.setValue(v);if(this.autoSize){var sz=this.boundEl.getSize();switch(this.autoSize){case "width":this.setSize(sz.width,"");break;case "height":this.setSize("",sz.height);break;default:this.setSize(sz.width,sz.height);}}this.el.alignTo(this.boundEl,this.alignment);this.editing=true;if(Ext.QuickTips){Ext.QuickTips.disable();}this.show();},setSize:function(w,h){this.field.setSize(w,h);if(this.el){this.el.sync();}},realign:function(){this.el.alignTo(this.boundEl,this.alignment);},completeEdit:function(_b){if(!this.editing){return;}var v=this.getValue();if(this.revertInvalid!==false&&!this.field.isValid()){v=this.startValue;this.cancelEdit(true);}if(String(v)==String(this.startValue)&&this.ignoreNoChange){this.editing=false;this.hide();return;}if(this.fireEvent("beforecomplete",this,v,this.startValue)!==false){this.editing=false;if(this.updateEl&&this.boundEl){this.boundEl.update(v);}if(_b!==true){this.hide();}this.fireEvent("complete",this,v,this.startValue);}},onShow:function(){this.el.show();if(this.hideEl!==false){this.boundEl.hide();}this.field.show();this.field.focus();this.fireEvent("startedit",this.boundEl,this.startValue);},cancelEdit:function(_d){if(this.editing){this.setValue(this.startValue);if(_d!==true){this.hide();}}},onBlur:function(){if(this.allowBlur!==true&&this.editing){this.completeEdit();}},onHide:function(){if(this.editing){this.completeEdit();return;}this.field.blur();if(this.field.collapse){this.field.collapse();}this.el.hide();if(this.hideEl!==false){this.boundEl.show();}if(Ext.QuickTips){Ext.QuickTips.enable();}},setValue:function(v){this.field.setValue(v);},getValue:function(){return this.field.getValue();}});



Ext.tree.TreePanel=function(el,_2){Ext.tree.TreePanel.superclass.constructor.call(this);this.el=Ext.get(el);this.el.addClass("x-tree");this.id=this.el.id;Ext.apply(this,_2);this.addEvents({"beforeload":true,"load":true,"textchange":true,"beforeexpand":true,"beforecollapse":true,"expand":true,"disabledchange":true,"collapse":true,"beforeclick":true,"click":true,"dblclick":true,"contextmenu":true,"beforechildrenrendered":true,"startdrag":true,"enddrag":true,"dragdrop":true,"beforenodedrop":true,"nodedrop":true,"nodedragover":true});if(this.singleExpand){this.on("beforeexpand",this.restrictExpand,this);}};Ext.extend(Ext.tree.TreePanel,Ext.data.Tree,{rootVisible:true,animate:Ext.enableFx,lines:true,enableDD:false,hlDrop:Ext.enableFx,restrictExpand:function(_3){var p=_3.parentNode;if(p){if(p.expandedChild&&p.expandedChild.parentNode==p){p.expandedChild.collapse();}p.expandedChild=_3;}},setRootNode:function(_5){Ext.tree.TreePanel.superclass.setRootNode.call(this,_5);if(!this.rootVisible){_5.ui=new Ext.tree.RootTreeNodeUI(_5);}return _5;},getEl:function(){return this.el;},getLoader:function(){return this.loader;},expandAll:function(){this.root.expand(true);},collapseAll:function(){this.root.collapse(true);},getSelectionModel:function(){if(!this.selModel){this.selModel=new Ext.tree.DefaultSelectionModel();}return this.selModel;},expandPath:function(_6,_7,_8){_7=_7||"id";var _9=_6.split(this.pathSeparator);var _a=this.root;if(_a.attributes[_7]!=_9[1]){if(_8){_8(false,null);}return;}var _b=1;var f=function(){if(++_b==_9.length){if(_8){_8(true,_a);}return;}var c=_a.findChild(_7,_9[_b]);if(!c){if(_8){_8(false,_a);}return;}_a=c;c.expand(false,false,f);};_a.expand(false,false,f);},selectPath:function(_e,_f,_10){_f=_f||"id";var _11=_e.split(this.pathSeparator);var v=_11.pop();if(_11.length>0){var f=function(_14,_15){if(_14&&_15){var n=_15.findChild(_f,v);if(n){n.select();if(_10){_10(true,n);}}}else{if(_10){_10(false,n);}}};this.expandPath(_11.join(this.pathSeparator),_f,f);}else{this.root.select();if(_10){_10(true,this.root);}}},render:function(){this.container=this.el.createChild({tag:"ul",cls:"x-tree-root-ct "+(this.lines?"x-tree-lines":"x-tree-no-lines")});if(this.containerScroll){Ext.dd.ScrollManager.register(this.el);}if((this.enableDD||this.enableDrop)&&!this.dropZone){this.dropZone=new Ext.tree.TreeDropZone(this,this.dropConfig||{ddGroup:this.ddGroup||"TreeDD",appendOnly:this.ddAppendOnly===true});}if((this.enableDD||this.enableDrag)&&!this.dragZone){this.dragZone=new Ext.tree.TreeDragZone(this,this.dragConfig||{ddGroup:this.ddGroup||"TreeDD",scroll:this.ddScroll});}this.getSelectionModel().init(this);this.root.render();if(!this.rootVisible){this.root.renderChildren();}return this;}});



Ext.tree.DefaultSelectionModel=function(){this.selNode=null;this.addEvents({"selectionchange":true,"beforeselect":true});};Ext.extend(Ext.tree.DefaultSelectionModel,Ext.util.Observable,{init:function(_1){this.tree=_1;_1.el.on("keydown",this.onKeyDown,this);_1.on("click",this.onNodeClick,this);},onNodeClick:function(_2,e){this.select(_2);},select:function(_4){var _5=this.selNode;if(_5!=_4&&this.fireEvent("beforeselect",this,_4,_5)!==false){if(_5){_5.ui.onSelectedChange(false);}this.selNode=_4;_4.ui.onSelectedChange(true);this.fireEvent("selectionchange",this,_4,_5);}return _4;},unselect:function(_6){if(this.selNode==_6){this.clearSelections();}},clearSelections:function(){var n=this.selNode;if(n){n.ui.onSelectedChange(false);this.selNode=null;this.fireEvent("selectionchange",this,null);}return n;},getSelectedNode:function(){return this.selNode;},isSelected:function(_8){return this.selNode==_8;},selectPrevious:function(){var s=this.selNode||this.lastSelNode;if(!s){return null;}var ps=s.previousSibling;if(ps){if(!ps.isExpanded()||ps.childNodes.length<1){return this.select(ps);}else{var lc=ps.lastChild;while(lc&&lc.isExpanded()&&lc.childNodes.length>0){lc=lc.lastChild;}return this.select(lc);}}else{if(s.parentNode&&(this.tree.rootVisible||!s.parentNode.isRoot)){return this.select(s.parentNode);}}return null;},selectNext:function(){var s=this.selNode||this.lastSelNode;if(!s){return null;}if(s.firstChild&&s.isExpanded()){return this.select(s.firstChild);}else{if(s.nextSibling){return this.select(s.nextSibling);}else{if(s.parentNode){var _d=null;s.parentNode.bubble(function(){if(this.nextSibling){_d=this.getOwnerTree().selModel.select(this.nextSibling);return false;}});return _d;}}}return null;},onKeyDown:function(e){var s=this.selNode||this.lastSelNode;var sm=this;if(!s){return;}var k=e.getKey();switch(k){case e.DOWN:e.stopEvent();this.selectNext();break;case e.UP:e.stopEvent();this.selectPrevious();break;case e.RIGHT:e.preventDefault();if(s.hasChildNodes()){if(!s.isExpanded()){s.expand();}else{if(s.firstChild){this.select(s.firstChild,e);}}}break;case e.LEFT:e.preventDefault();if(s.hasChildNodes()&&s.isExpanded()){s.collapse();}else{if(s.parentNode&&(this.tree.rootVisible||s.parentNode!=this.tree.getRootNode())){this.select(s.parentNode,e);}}break;}}});Ext.tree.MultiSelectionModel=function(){this.selNodes=[];this.selMap={};this.addEvents({"selectionchange":true});};Ext.extend(Ext.tree.MultiSelectionModel,Ext.util.Observable,{init:function(_12){this.tree=_12;_12.el.on("keydown",this.onKeyDown,this);_12.on("click",this.onNodeClick,this);},onNodeClick:function(_13,e){this.select(_13,e,e.ctrlKey);},select:function(_15,e,_17){if(_17!==true){this.clearSelections(true);}if(this.isSelected(_15)){this.lastSelNode=_15;return _15;}this.selNodes.push(_15);this.selMap[_15.id]=_15;this.lastSelNode=_15;_15.ui.onSelectedChange(true);this.fireEvent("selectionchange",this,this.selNodes);return _15;},unselect:function(_18){if(this.selMap[_18.id]){_18.ui.onSelectedChange(false);var sn=this.selNodes;var _1a=-1;if(sn.indexOf){_1a=sn.indexOf(_18);}else{for(var i=0,len=sn.length;i<len;i++){if(sn[i]==_18){_1a=i;break;}}}if(_1a!=-1){this.selNodes.splice(_1a,1);}delete this.selMap[_18.id];this.fireEvent("selectionchange",this,this.selNodes);}},clearSelections:function(_1d){var sn=this.selNodes;if(sn.length>0){for(var i=0,len=sn.length;i<len;i++){sn[i].ui.onSelectedChange(false);}this.selNodes=[];this.selMap={};if(_1d!==true){this.fireEvent("selectionchange",this,this.selNodes);}}},isSelected:function(_21){return this.selMap[_21.id]?true:false;},getSelectedNodes:function(){return this.selNodes;},onKeyDown:Ext.tree.DefaultSelectionModel.prototype.onKeyDown,selectNext:Ext.tree.DefaultSelectionModel.prototype.selectNext,selectPrevious:Ext.tree.DefaultSelectionModel.prototype.selectPrevious});



Ext.tree.TreeNode=function(_1){_1=_1||{};if(typeof _1=="string"){_1={text:_1};}this.childrenRendered=false;this.rendered=false;Ext.tree.TreeNode.superclass.constructor.call(this,_1);this.expanded=_1.expanded===true;this.isTarget=_1.isTarget!==false;this.draggable=_1.draggable!==false&&_1.allowDrag!==false;this.allowChildren=_1.allowChildren!==false&&_1.allowDrop!==false;this.text=_1.text;this.disabled=_1.disabled===true;this.addEvents({"textchange":true,"beforeexpand":true,"beforecollapse":true,"expand":true,"disabledchange":true,"collapse":true,"beforeclick":true,"click":true,"dblclick":true,"contextmenu":true,"beforechildrenrendered":true});var _2=this.attributes.uiProvider||Ext.tree.TreeNodeUI;this.ui=new _2(this);};Ext.extend(Ext.tree.TreeNode,Ext.data.Node,{preventHScroll:true,isExpanded:function(){return this.expanded;},getUI:function(){return this.ui;},setFirstChild:function(_3){var of=this.firstChild;Ext.tree.TreeNode.superclass.setFirstChild.call(this,_3);if(this.childrenRendered&&of&&_3!=of){of.renderIndent(true,true);}if(this.rendered){this.renderIndent(true,true);}},setLastChild:function(_5){var ol=this.lastChild;Ext.tree.TreeNode.superclass.setLastChild.call(this,_5);if(this.childrenRendered&&ol&&_5!=ol){ol.renderIndent(true,true);}if(this.rendered){this.renderIndent(true,true);}},appendChild:function(){var _7=Ext.tree.TreeNode.superclass.appendChild.apply(this,arguments);if(_7&&this.childrenRendered){_7.render();}this.ui.updateExpandIcon();return _7;},removeChild:function(_8){this.ownerTree.getSelectionModel().unselect(_8);Ext.tree.TreeNode.superclass.removeChild.apply(this,arguments);if(this.childrenRendered){_8.ui.remove();}if(this.childNodes.length<1){this.collapse(false,false);}else{this.ui.updateExpandIcon();}return _8;},insertBefore:function(_9,_a){var _b=Ext.tree.TreeNode.superclass.insertBefore.apply(this,arguments);if(_b&&_a&&this.childrenRendered){_9.render();}this.ui.updateExpandIcon();return _b;},setText:function(_c){var _d=this.text;this.text=_c;this.attributes.text=_c;if(this.rendered){this.ui.onTextChange(this,_c,_d);}this.fireEvent("textchange",this,_c,_d);},select:function(){this.getOwnerTree().getSelectionModel().select(this);},unselect:function(){this.getOwnerTree().getSelectionModel().unselect(this);},isSelected:function(){return this.getOwnerTree().getSelectionModel().isSelected(this);},expand:function(_e,_f,_10){if(!this.expanded){if(this.fireEvent("beforeexpand",this,_e,_f)===false){return;}if(!this.childrenRendered){this.renderChildren();}this.expanded=true;if(!this.isHiddenRoot()&&(this.getOwnerTree().animate&&_f!==false)||_f){this.ui.animExpand(function(){this.fireEvent("expand",this);if(typeof _10=="function"){_10(this);}if(_e===true){this.expandChildNodes(true);}}.createDelegate(this));return;}else{this.ui.expand();this.fireEvent("expand",this);if(typeof _10=="function"){_10(this);}}}else{if(typeof _10=="function"){_10(this);}}if(_e===true){this.expandChildNodes(true);}},isHiddenRoot:function(){return this.isRoot&&!this.getOwnerTree().rootVisible;},collapse:function(_11,_12){if(this.expanded&&!this.isHiddenRoot()){if(this.fireEvent("beforecollapse",this,_11,_12)===false){return;}this.expanded=false;if((this.getOwnerTree().animate&&_12!==false)||_12){this.ui.animCollapse(function(){this.fireEvent("collapse",this);if(_11===true){this.collapseChildNodes(true);}}.createDelegate(this));return;}else{this.ui.collapse();this.fireEvent("collapse",this);}}if(_11===true){var cs=this.childNodes;for(var i=0,len=cs.length;i<len;i++){cs[i].collapse(true);}}},delayedExpand:function(_16){if(!this.expandProcId){this.expandProcId=this.expand.defer(_16,this);}},cancelExpand:function(){if(this.expandProcId){clearTimeout(this.expandProcId);}this.expandProcId=false;},toggle:function(){if(this.expanded){this.collapse();}else{this.expand();}},ensureVisible:function(_17){var _18=this.getOwnerTree();_18.expandPath(this.getPath(),false,function(){_18.getEl().scrollChildIntoView(this.ui.anchor);Ext.callback(_17);}.createDelegate(this));},expandChildNodes:function(_19){var cs=this.childNodes;for(var i=0,len=cs.length;i<len;i++){cs[i].expand(_19);}},collapseChildNodes:function(_1d){var cs=this.childNodes;for(var i=0,len=cs.length;i<len;i++){cs[i].collapse(_1d);}},disable:function(){this.disabled=true;this.unselect();if(this.rendered&&this.ui.onDisableChange){this.ui.onDisableChange(this,true);}this.fireEvent("disabledchange",this,true);},enable:function(){this.disabled=false;if(this.rendered&&this.ui.onDisableChange){this.ui.onDisableChange(this,false);}this.fireEvent("disabledchange",this,false);},renderChildren:function(_21){if(_21!==false){this.fireEvent("beforechildrenrendered",this);}var cs=this.childNodes;for(var i=0,len=cs.length;i<len;i++){cs[i].render(true);}this.childrenRendered=true;},sort:function(fn,_26){Ext.tree.TreeNode.superclass.sort.apply(this,arguments);if(this.childrenRendered){var cs=this.childNodes;for(var i=0,len=cs.length;i<len;i++){cs[i].render(true);}}},render:function(_2a){this.ui.render(_2a);if(!this.rendered){this.rendered=true;if(this.expanded){this.expanded=false;this.expand(false,false);}}},renderIndent:function(_2b,_2c){if(_2c){this.ui.childIndent=null;}this.ui.renderIndent();if(_2b===true&&this.childrenRendered){var cs=this.childNodes;for(var i=0,len=cs.length;i<len;i++){cs[i].renderIndent(true,_2c);}}}});



Ext.tree.AsyncTreeNode=function(_1){this.loaded=false;this.loading=false;Ext.tree.AsyncTreeNode.superclass.constructor.apply(this,arguments);this.addEvents({"beforeload":true,"load":true});};Ext.extend(Ext.tree.AsyncTreeNode,Ext.tree.TreeNode,{expand:function(_2,_3,_4){if(this.loading){var _5;var f=function(){if(!this.loading){clearInterval(_5);this.expand(_2,_3,_4);}}.createDelegate(this);_5=setInterval(f,200);return;}if(!this.loaded){if(this.fireEvent("beforeload",this)===false){return;}this.loading=true;this.ui.beforeLoad(this);var _7=this.loader||this.attributes.loader||this.getOwnerTree().getLoader();if(_7){_7.load(this,this.loadComplete.createDelegate(this,[_2,_3,_4]));return;}}Ext.tree.AsyncTreeNode.superclass.expand.call(this,_2,_3,_4);},isLoading:function(){return this.loading;},loadComplete:function(_8,_9,_a){this.loading=false;this.loaded=true;this.ui.afterLoad(this);this.fireEvent("load",this);this.expand(_8,_9,_a);},isLoaded:function(){return this.loaded;},hasChildNodes:function(){if(!this.isLeaf()&&!this.loaded){return true;}else{return Ext.tree.AsyncTreeNode.superclass.hasChildNodes.call(this);}},reload:function(_b){this.collapse(false,false);while(this.firstChild){this.removeChild(this.firstChild);}this.childrenRendered=false;this.loaded=false;if(this.isHiddenRoot()){this.expanded=false;}this.expand(false,false,_b);}});



Ext.tree.TreeNodeUI=function(_1){this.node=_1;this.rendered=false;this.animating=false;this.emptyIcon=Ext.BLANK_IMAGE_URL;};Ext.tree.TreeNodeUI.prototype={removeChild:function(_2){if(this.rendered){this.ctNode.removeChild(_2.ui.getEl());}},beforeLoad:function(){this.addClass("x-tree-node-loading");},afterLoad:function(){this.removeClass("x-tree-node-loading");},onTextChange:function(_3,_4,_5){if(this.rendered){this.textNode.innerHTML=_4;}},onDisableChange:function(_6,_7){this.disabled=_7;if(_7){this.addClass("x-tree-node-disabled");}else{this.removeClass("x-tree-node-disabled");}},onSelectedChange:function(_8){if(_8){this.focus();this.addClass("x-tree-selected");}else{this.removeClass("x-tree-selected");}},onMove:function(_9,_a,_b,_c,_d,_e){this.childIndent=null;if(this.rendered){var _f=_c.ui.getContainer();if(!_f){this.holder=document.createElement("div");this.holder.appendChild(this.wrap);return;}var _10=_e?_e.ui.getEl():null;if(_10){_f.insertBefore(this.wrap,_10);}else{_f.appendChild(this.wrap);}this.node.renderIndent(true);}},addClass:function(cls){if(this.elNode){Ext.fly(this.elNode).addClass(cls);}},removeClass:function(cls){if(this.elNode){Ext.fly(this.elNode).removeClass(cls);}},remove:function(){if(this.rendered){this.holder=document.createElement("div");this.holder.appendChild(this.wrap);}},fireEvent:function(){return this.node.fireEvent.apply(this.node,arguments);},initEvents:function(){this.node.on("move",this.onMove,this);var E=Ext.EventManager;var a=this.anchor;var el=Ext.fly(a);if(Ext.isOpera){el.setStyle("text-decoration","none");}el.on("click",this.onClick,this);el.on("dblclick",this.onDblClick,this);el.on("contextmenu",this.onContextMenu,this);var _16=Ext.fly(this.iconNode);_16.on("click",this.onClick,this);_16.on("dblclick",this.onDblClick,this);_16.on("contextmenu",this.onContextMenu,this);E.on(this.ecNode,"click",this.ecClick,this,true);if(this.node.disabled){this.addClass("x-tree-node-disabled");}if(this.node.hidden){this.addClass("x-tree-node-disabled");}var ot=this.node.getOwnerTree();var dd=ot.enableDD||ot.enableDrag||ot.enableDrop;if(dd&&(!this.node.isRoot||ot.rootVisible)){Ext.dd.Registry.register(this.elNode,{node:this.node,handles:[this.iconNode,this.textNode],isHandle:false});}},hide:function(){if(this.rendered){this.wrap.style.display="none";}},show:function(){if(this.rendered){this.wrap.style.display="";}},onContextMenu:function(e){e.preventDefault();this.focus();this.fireEvent("contextmenu",this.node,e);},onClick:function(e){if(this.dropping){return;}if(this.fireEvent("beforeclick",this.node,e)!==false){if(!this.disabled&&this.node.attributes.href){this.fireEvent("click",this.node,e);return;}e.preventDefault();if(this.disabled){return;}if(this.node.attributes.singleClickExpand&&!this.animating&&this.node.hasChildNodes()){this.node.toggle();}this.fireEvent("click",this.node,e);}else{e.stopEvent();}},onDblClick:function(e){e.preventDefault();if(this.disabled){return;}if(!this.animating&&this.node.hasChildNodes()){this.node.toggle();}this.fireEvent("dblclick",this.node,e);},ecClick:function(e){if(!this.animating&&this.node.hasChildNodes()){this.node.toggle();}},startDrop:function(){this.dropping=true;},endDrop:function(){setTimeout(function(){this.dropping=false;}.createDelegate(this),50);},expand:function(){this.updateExpandIcon();this.ctNode.style.display="";},focus:function(){if(!this.node.preventHScroll){try{this.anchor.focus();}catch(e){}}else{if(!Ext.isIE){try{var _1d=this.node.getOwnerTree().el.dom;var l=_1d.scrollLeft;this.anchor.focus();_1d.scrollLeft=l;}catch(e){}}}},blur:function(){try{this.anchor.blur();}catch(e){}},animExpand:function(_1f){var ct=Ext.get(this.ctNode);ct.stopFx();if(!this.node.hasChildNodes()){this.updateExpandIcon();this.ctNode.style.display="";Ext.callback(_1f);return;}this.animating=true;this.updateExpandIcon();ct.slideIn("t",{callback:function(){this.animating=false;Ext.callback(_1f);},scope:this,duration:this.node.ownerTree.duration||0.25});},highlight:function(){var _21=this.node.getOwnerTree();Ext.fly(this.wrap).highlight(_21.hlColor||"C3DAF9",{endColor:_21.hlBaseColor});},collapse:function(){this.updateExpandIcon();this.ctNode.style.display="none";},animCollapse:function(_22){var ct=Ext.get(this.ctNode);ct.enableDisplayMode("block");ct.stopFx();this.animating=true;this.updateExpandIcon();ct.slideOut("t",{callback:function(){this.animating=false;Ext.callback(_22);},scope:this,duration:this.node.ownerTree.duration||0.25});},getContainer:function(){return this.ctNode;},getEl:function(){return this.wrap;},appendDDGhost:function(_24){_24.appendChild(this.elNode.cloneNode(true));},getDDRepairXY:function(){return Ext.lib.Dom.getXY(this.iconNode);},onRender:function(){this.render();},render:function(_25){var n=this.node;var _27=n.parentNode?n.parentNode.ui.getContainer():n.ownerTree.container.dom;if(!this.rendered){this.rendered=true;var a=n.attributes;this.indentMarkup="";if(n.parentNode){this.indentMarkup=n.parentNode.ui.getChildIndent();}var buf=["<li class=\"x-tree-node\"><div class=\"x-tree-node-el ",n.attributes.cls,"\">","<span class=\"x-tree-node-indent\">",this.indentMarkup,"</span>","<img src=\"",this.emptyIcon,"\" class=\"x-tree-ec-icon\">","<img src=\"",a.icon||this.emptyIcon,"\" class=\"x-tree-node-icon",(a.icon?" x-tree-node-inline-icon":""),(a.iconCls?" "+a.iconCls:""),"\" unselectable=\"on\">","<a hidefocus=\"on\" href=\"",a.href?a.href:"#","\" tabIndex=\"1\" ",a.hrefTarget?" target=\""+a.hrefTarget+"\"":"","><span unselectable=\"on\">",n.text,"</span></a></div>","<ul class=\"x-tree-node-ct\" style=\"display:none;\"></ul>","</li>"];if(_25!==true&&n.nextSibling&&n.nextSibling.ui.getEl()){this.wrap=Ext.DomHelper.insertHtml("beforeBegin",n.nextSibling.ui.getEl(),buf.join(""));}else{this.wrap=Ext.DomHelper.insertHtml("beforeEnd",_27,buf.join(""));}this.elNode=this.wrap.childNodes[0];this.ctNode=this.wrap.childNodes[1];var cs=this.elNode.childNodes;this.indentNode=cs[0];this.ecNode=cs[1];this.iconNode=cs[2];this.anchor=cs[3];this.textNode=cs[3].firstChild;if(a.qtip){if(this.textNode.setAttributeNS){this.textNode.setAttributeNS("ext","qtip",a.qtip);if(a.qtipTitle){this.textNode.setAttributeNS("ext","qtitle",a.qtipTitle);}}else{this.textNode.setAttribute("ext:qtip",a.qtip);if(a.qtipTitle){this.textNode.setAttribute("ext:qtitle",a.qtipTitle);}}}this.initEvents();if(!this.node.expanded){this.updateExpandIcon();}}else{if(_25===true){_27.appendChild(this.wrap);}}},getAnchor:function(){return this.anchor;},getTextEl:function(){return this.textNode;},getIconEl:function(){return this.iconNode;},updateExpandIcon:function(){if(this.rendered){var n=this.node,c1,c2;var cls=n.isLast()?"x-tree-elbow-end":"x-tree-elbow";var _2f=n.hasChildNodes();if(_2f){if(n.expanded){cls+="-minus";c1="x-tree-node-collapsed";c2="x-tree-node-expanded";}else{cls+="-plus";c1="x-tree-node-expanded";c2="x-tree-node-collapsed";}if(this.wasLeaf){this.removeClass("x-tree-node-leaf");this.wasLeaf=false;}if(this.c1!=c1||this.c2!=c2){Ext.fly(this.elNode).replaceClass(c1,c2);this.c1=c1;this.c2=c2;}}else{if(!this.wasLeaf){Ext.fly(this.elNode).replaceClass("x-tree-node-expanded","x-tree-node-leaf");this.wasLeaf=true;}}var ecc="x-tree-ec-icon "+cls;if(this.ecc!=ecc){this.ecNode.className=ecc;this.ecc=ecc;}}},getChildIndent:function(){if(!this.childIndent){var buf=[];var p=this.node;while(p){if(!p.isRoot||(p.isRoot&&p.ownerTree.rootVisible)){if(!p.isLast()){buf.unshift("<img src=\""+this.emptyIcon+"\" class=\"x-tree-elbow-line\">");}else{buf.unshift("<img src=\""+this.emptyIcon+"\" class=\"x-tree-icon\">");}}p=p.parentNode;}this.childIndent=buf.join("");}return this.childIndent;},renderIndent:function(){if(this.rendered){var _33="";var p=this.node.parentNode;if(p){_33=p.ui.getChildIndent();}if(this.indentMarkup!=_33){this.indentNode.innerHTML=_33;this.indentMarkup=_33;}this.updateExpandIcon();}}};Ext.tree.RootTreeNodeUI=function(){Ext.tree.RootTreeNodeUI.superclass.constructor.apply(this,arguments);};Ext.extend(Ext.tree.RootTreeNodeUI,Ext.tree.TreeNodeUI,{render:function(){if(!this.rendered){var _35=this.node.ownerTree.container.dom;this.node.expanded=true;_35.innerHTML="<div class=\"x-tree-root-node\"></div>";this.wrap=this.ctNode=_35.firstChild;}},collapse:function(){},expand:function(){}});



Ext.tree.TreeLoader=function(_1){this.baseParams={};this.requestMethod="POST";Ext.apply(this,_1);this.addEvents({"beforeload":true,"load":true,"loadexception":true});};Ext.extend(Ext.tree.TreeLoader,Ext.util.Observable,{uiProviders:{},clearOnLoad:true,load:function(_2,_3){if(this.clearOnLoad){while(_2.firstChild){_2.removeChild(_2.firstChild);}}if(_2.attributes.children){var cs=_2.attributes.children;for(var i=0,_6=cs.length;i<_6;i++){_2.appendChild(this.createNode(cs[i]));}if(typeof _3=="function"){_3();}}else{if(this.dataUrl){this.requestData(_2,_3);}}},getParams:function(_7){var _8=[],bp=this.baseParams;for(var _a in bp){if(typeof bp[_a]!="function"){_8.push(encodeURIComponent(_a),"=",encodeURIComponent(bp[_a]),"&");}}_8.push("node=",encodeURIComponent(_7.id));return _8.join("");},requestData:function(_b,_c){if(this.fireEvent("beforeload",this,_b,_c)!==false){var _d=this.getParams(_b);var cb={success:this.handleResponse,failure:this.handleFailure,scope:this,argument:{callback:_c,node:_b}};this.transId=Ext.lib.Ajax.request(this.requestMethod,this.dataUrl,cb,_d);}else{if(typeof _c=="function"){_c();}}},isLoading:function(){return this.transId?true:false;},abort:function(){if(this.isLoading()){Ext.lib.Ajax.abort(this.transId);}},createNode:function(_f){if(this.applyLoader!==false){_f.loader=this;}if(typeof _f.uiProvider=="string"){_f.uiProvider=this.uiProviders[_f.uiProvider]||eval(_f.uiProvider);}return (_f.leaf?new Ext.tree.TreeNode(_f):new Ext.tree.AsyncTreeNode(_f));},processResponse:function(_10,_11,_12){var _13=_10.responseText;try{var o=eval("("+_13+")");for(var i=0,len=o.length;i<len;i++){var n=this.createNode(o[i]);if(n){_11.appendChild(n);}}if(typeof _12=="function"){_12(this,_11);}}catch(e){this.handleFailure(_10);}},handleResponse:function(_18){this.transId=false;var a=_18.argument;this.processResponse(_18,a.node,a.callback);this.fireEvent("load",this,a.node,_18);},handleFailure:function(_1a){this.transId=false;var a=_1a.argument;this.fireEvent("loadexception",this,a.node,_1a);if(typeof a.callback=="function"){a.callback(this,a.node);}}});



Ext.tree.TreeFilter=function(_1,_2){this.tree=_1;this.filtered={};Ext.apply(this,_2,{clearBlank:false,reverse:false,autoClear:false,remove:false});};Ext.tree.TreeFilter.prototype={filter:function(_3,_4,_5){_4=_4||"text";var f;if(typeof _3=="string"){var _7=_3.length;if(_7==0&&this.clearBlank){this.clearFilter();return;}_3=_3.toLowerCase();f=function(n){return n.attributes[_4].substr(0,_7).toLowerCase()==_3;};}else{if(_3.exec){f=function(n){return _3.test(n.attributes[_4]);};}else{throw "Illegal filter type, must be string or regex";}}this.filterBy(f,null,_5);},filterBy:function(fn,_b,_c){_c=_c||this.tree.root;if(this.autoClear){this.clearFilter();}var af=this.filtered,rv=this.reverse;var f=function(n){if(n==_c){return true;}if(af[n.id]){return false;}var m=fn.call(_b||n,n);if(!m||rv){af[n.id]=n;n.ui.hide();return false;}return true;};_c.cascade(f);if(this.remove){for(var id in af){if(typeof id!="function"){var n=af[id];if(n&&n.parentNode){n.parentNode.removeChild(n);}}}}},clear:function(){var t=this.tree;var af=this.filtered;for(var id in af){if(typeof id!="function"){var n=af[id];if(n){n.ui.show();}}}this.filtered={};}};



Ext.tree.TreeSorter=function(_1,_2){Ext.apply(this,_2);_1.on("beforechildrenrendered",this.doSort,this);_1.on("append",this.updateSort,this);_1.on("insert",this.updateSort,this);var _3=this.dir&&this.dir.toLowerCase()=="desc";var p=this.property||"text";var _5=this.sortType;var fs=this.folderSort;var cs=this.caseSensitive===true;var _8=this.leafAttr||"leaf";this.sortFn=function(n1,n2){if(fs){if(n1.attributes[_8]&&!n2.attributes[_8]){return 1;}if(!n1.attributes[_8]&&n2.attributes[_8]){return -1;}}var v1=_5?_5(n1):(cs?n1[p]:n1[p].toUpperCase());var v2=_5?_5(n2):(cs?n2[p]:n2[p].toUpperCase());if(v1<v2){return _3?+1:-1;}else{if(v1>v2){return _3?-1:+1;}else{return 0;}}};};Ext.tree.TreeSorter.prototype={doSort:function(_d){_d.sort(this.sortFn);},compareNodes:function(n1,n2){return (n1.text.toUpperCase()>n2.text.toUpperCase()?1:-1);},updateSort:function(_10,_11){if(_11.childrenRendered){this.doSort.defer(1,this,[_11]);}}};



if(Ext.dd.DropZone){Ext.tree.TreeDropZone=function(_1,_2){this.allowParentInsert=false;this.allowContainerDrop=false;this.appendOnly=false;Ext.tree.TreeDropZone.superclass.constructor.call(this,_1.container,_2);this.tree=_1;this.lastInsertClass="x-tree-no-status";this.dragOverData={};};Ext.extend(Ext.tree.TreeDropZone,Ext.dd.DropZone,{ddGroup:"TreeDD",expandDelay:1000,expandNode:function(_3){if(_3.hasChildNodes()&&!_3.isExpanded()){_3.expand(false,null,this.triggerCacheRefresh.createDelegate(this));}},queueExpand:function(_4){this.expandProcId=this.expandNode.defer(this.expandDelay,this,[_4]);},cancelExpand:function(){if(this.expandProcId){clearTimeout(this.expandProcId);this.expandProcId=false;}},isValidDropPoint:function(n,pt,dd,e,_9){if(!n||!_9){return false;}var _a=n.node;var _b=_9.node;if(!(_a&&_a.isTarget&&pt)){return false;}if(pt=="append"&&_a.allowChildren===false){return false;}if((pt=="above"||pt=="below")&&(_a.parentNode&&_a.parentNode.allowChildren===false)){return false;}if(_b&&(_a==_b||_b.contains(_a))){return false;}var _c=this.dragOverData;_c.tree=this.tree;_c.target=_a;_c.data=_9;_c.point=pt;_c.source=dd;_c.rawEvent=e;_c.dropNode=_b;_c.cancel=false;var _d=this.tree.fireEvent("nodedragover",_c);return _c.cancel===false&&_d!==false;},getDropPoint:function(e,n,dd){var tn=n.node;if(tn.isRoot){return tn.allowChildren!==false?"append":false;}var _12=n.ddel;var t=Ext.lib.Dom.getY(_12),b=t+_12.offsetHeight;var y=Ext.lib.Event.getPageY(e);var _16=tn.allowChildren===false||tn.isLeaf();if(this.appendOnly||tn.parentNode.allowChildren===false){return _16?false:"append";}var _17=false;if(!this.allowParentInsert){_17=tn.hasChildNodes()&&tn.isExpanded();}var q=(b-t)/(_16?2:3);if(y>=t&&y<(t+q)){return "above";}else{if(!_17&&(_16||y>=b-q&&y<=b)){return "below";}else{return "append";}}},onNodeEnter:function(n,dd,e,_1c){this.cancelExpand();},onNodeOver:function(n,dd,e,_20){var pt=this.getDropPoint(e,n,dd);var _22=n.node;if(!this.expandProcId&&pt=="append"&&_22.hasChildNodes()&&!n.node.isExpanded()){this.queueExpand(_22);}else{if(pt!="append"){this.cancelExpand();}}var _23=this.dropNotAllowed;if(this.isValidDropPoint(n,pt,dd,e,_20)){if(pt){var el=n.ddel;var cls;if(pt=="above"){_23=n.node.isFirst()?"x-tree-drop-ok-above":"x-tree-drop-ok-between";cls="x-tree-drag-insert-above";}else{if(pt=="below"){_23=n.node.isLast()?"x-tree-drop-ok-below":"x-tree-drop-ok-between";cls="x-tree-drag-insert-below";}else{_23="x-tree-drop-ok-append";cls="x-tree-drag-append";}}if(this.lastInsertClass!=cls){Ext.fly(el).replaceClass(this.lastInsertClass,cls);this.lastInsertClass=cls;}}}return _23;},onNodeOut:function(n,dd,e,_29){this.cancelExpand();this.removeDropIndicators(n);},onNodeDrop:function(n,dd,e,_2d){var _2e=this.getDropPoint(e,n,dd);var _2f=n.node;_2f.ui.startDrop();if(!this.isValidDropPoint(n,_2e,dd,e,_2d)){_2f.ui.endDrop();return false;}var _30=_2d.node||(dd.getTreeNode?dd.getTreeNode(_2d,_2f,_2e,e):null);var _31={tree:this.tree,target:_2f,data:_2d,point:_2e,source:dd,rawEvent:e,dropNode:_30,cancel:!_30};var _32=this.tree.fireEvent("beforenodedrop",_31);if(_32===false||_31.cancel===true||!_31.dropNode){_2f.ui.endDrop();return false;}_2f=_31.target;if(_2e=="append"&&!_2f.isExpanded()){_2f.expand(false,null,function(){this.completeDrop(_31);}.createDelegate(this));}else{this.completeDrop(_31);}return true;},completeDrop:function(de){var ns=de.dropNode,p=de.point,t=de.target;if(!(ns instanceof Array)){ns=[ns];}var n;for(var i=0,len=ns.length;i<len;i++){n=ns[i];if(p=="above"){t.parentNode.insertBefore(n,t);}else{if(p=="below"){t.parentNode.insertBefore(n,t.nextSibling);}else{t.appendChild(n);}}}n.ui.focus();if(this.tree.hlDrop){n.ui.highlight();}t.ui.endDrop();this.tree.fireEvent("nodedrop",de);},afterNodeMoved:function(dd,_3b,e,_3d,_3e){if(this.tree.hlDrop){_3e.ui.focus();_3e.ui.highlight();}this.tree.fireEvent("nodedrop",this.tree,_3d,_3b,dd,e);},getTree:function(){return this.tree;},removeDropIndicators:function(n){if(n&&n.ddel){var el=n.ddel;Ext.fly(el).removeClass(["x-tree-drag-insert-above","x-tree-drag-insert-below","x-tree-drag-append"]);this.lastInsertClass="_noclass";}},beforeDragDrop:function(_41,e,id){this.cancelExpand();return true;},afterRepair:function(_44){if(_44&&Ext.enableFx){_44.node.ui.highlight();}this.hideProxy();}});}



if(Ext.dd.DragZone){Ext.tree.TreeDragZone=function(_1,_2){Ext.tree.TreeDragZone.superclass.constructor.call(this,_1.getEl(),_2);this.tree=_1;};Ext.extend(Ext.tree.TreeDragZone,Ext.dd.DragZone,{ddGroup:"TreeDD",onBeforeDrag:function(_3,e){var n=_3.node;return n&&n.draggable&&!n.disabled;},onInitDrag:function(e){var _7=this.dragData;this.tree.getSelectionModel().select(_7.node);this.proxy.update("");_7.node.ui.appendDDGhost(this.proxy.ghost.dom);this.tree.fireEvent("startdrag",this.tree,_7.node,e);},getRepairXY:function(e,_9){return _9.node.ui.getDDRepairXY();},onEndDrag:function(_a,e){this.tree.fireEvent("enddrag",this.tree,_a.node,e);},onValidDrop:function(dd,e,id){this.tree.fireEvent("dragdrop",this.tree,this.dragData.node,dd,e);this.hideProxy();},beforeInvalidDrop:function(e,id){var sm=this.tree.getSelectionModel();sm.clearSelections();sm.select(this.dragData.node);}});}



Ext.tree.TreeEditor=function(_1,_2){_2=_2||{};var _3=_2.events?_2:new Ext.form.TextField(_2);Ext.tree.TreeEditor.superclass.constructor.call(this,_3);this.tree=_1;_1.on("beforeclick",this.beforeNodeClick,this);_1.el.on("mousedown",this.hide,this);this.on("complete",this.updateNode,this);this.on("beforestartedit",this.fitToTree,this);this.on("startedit",this.bindScroll,this,{delay:10});this.on("specialkey",this.onSpecialKey,this);};Ext.extend(Ext.tree.TreeEditor,Ext.Editor,{alignment:"l-l",autoSize:false,hideEl:false,cls:"x-small-editor x-tree-editor",shim:false,shadow:"frame",maxWidth:250,fitToTree:function(ed,el){var td=this.tree.el.dom,nd=el.dom;if(td.scrollLeft>nd.offsetLeft){td.scrollLeft=nd.offsetLeft;}var w=Math.min(this.maxWidth,(td.clientWidth>20?td.clientWidth:td.offsetWidth)-Math.max(0,nd.offsetLeft-td.scrollLeft)-5);this.setSize(w,"");},triggerEdit:function(_9){this.completeEdit();this.editNode=_9;this.startEdit(_9.ui.textNode,_9.text);},bindScroll:function(){this.tree.el.on("scroll",this.cancelEdit,this);},beforeNodeClick:function(_a){if(this.tree.getSelectionModel().isSelected(_a)){this.triggerEdit(_a);return false;}},updateNode:function(ed,_c){this.tree.el.un("scroll",this.cancelEdit,this);this.editNode.setText(_c);},onSpecialKey:function(_d,e){var k=e.getKey();if(k==e.ESC){this.cancelEdit();e.stopEvent();}else{if(k==e.ENTER&&!e.hasModifier()){this.completeEdit();e.stopEvent();}}}});



Ext.form.Field=function(_1){Ext.form.Field.superclass.constructor.call(this,_1);this.addEvents({focus:true,blur:true,specialkey:true,change:true,invalid:true,valid:true});};Ext.extend(Ext.form.Field,Ext.Component,{invalidClass:"x-form-invalid",invalidText:"The value in this field is invalid",focusClass:"x-form-focus",validationEvent:"keyup",validateOnBlur:true,validationDelay:250,defaultAutoCreate:{tag:"input",type:"text",size:"20",autocomplete:"off"},fieldClass:"x-form-field",msgTarget:"qtip",msgFx:"normal",inputType:undefined,isFormField:true,hasFocus:false,value:undefined,getName:function(){return this.rendered&&this.el.dom.name?this.el.dom.name:(this.hiddenName||"");},applyTo:function(_2){this.target=_2;this.el=Ext.get(_2);this.render(this.el.dom.parentNode);return this;},onRender:function(ct,_4){if(this.el){this.el=Ext.get(this.el);if(!this.target){ct.dom.appendChild(this.el.dom);}}else{var _5=this.getAutoCreate();if(!_5.name){_5.name=this.name||this.id;}if(this.inputType){_5.type=this.inputType;}if(this.tabIndex!==undefined){_5.tabIndex=this.tabIndex;}this.el=ct.createChild(_5,_4);}var _6=this.el.dom.type;if(_6){if(_6=="password"){_6="text";}this.el.addClass("x-form-"+_6);}if(!this.customSize&&(this.width||this.height)){this.setSize(this.width||"",this.height||"");}if(this.readOnly){this.el.dom.readOnly=true;}this.el.addClass([this.fieldClass,this.cls]);this.initValue();},initValue:function(){if(this.value!==undefined){this.setValue(this.value);}else{if(this.el.dom.value.length>0){this.setValue(this.el.dom.value);}}},afterRender:function(){Ext.form.Field.superclass.afterRender.call(this);this.initEvents();},fireKey:function(e){if(e.isNavKeyPress()){this.fireEvent("specialkey",this,e);}},reset:function(){this.setValue(this.originalValue);this.clearInvalid();},initEvents:function(){this.el.on(Ext.isIE?"keydown":"keypress",this.fireKey,this);this.el.on("focus",this.onFocus,this);this.el.on("blur",this.onBlur,this);this.originalValue=this.getValue();},onFocus:function(){if(!Ext.isOpera){this.el.addClass(this.focusClass);}this.hasFocus=true;this.startValue=this.getValue();this.fireEvent("focus",this);},onBlur:function(){this.el.removeClass(this.focusClass);this.hasFocus=false;if(this.validationEvent!==false&&this.validateOnBlur&&this.validationEvent!="blur"){this.validate();}var v=this.getValue();if(v!=this.startValue){this.fireEvent("change",this,v,this.startValue);}this.fireEvent("blur",this);},setSize:function(w,h){if(!this.rendered||!this.el){this.width=w;this.height=h;return;}if(w){w=this.adjustWidth(this.el.dom.tagName,w);this.el.setWidth(w);}if(h){this.el.setHeight(h);}var h=this.el.dom.offsetHeight;},isValid:function(_b){if(this.disabled){return true;}var _c=this.preventMark;this.preventMark=_b===true;var v=this.validateValue(this.getRawValue());this.preventMark=_c;return v;},validate:function(){if(this.disabled||this.validateValue(this.getRawValue())){this.clearInvalid();return true;}return false;},validateValue:function(_e){return true;},markInvalid:function(_f){if(!this.rendered||this.preventMark){return;}this.el.addClass(this.invalidClass);_f=_f||this.invalidText;switch(this.msgTarget){case "qtip":this.el.dom.qtip=_f;this.el.dom.qclass="x-form-invalid-tip";break;case "title":this.el.dom.title=_f;break;case "under":if(!this.errorEl){var elp=this.el.findParent(".x-form-element",5,true);this.errorEl=elp.createChild({cls:"x-form-invalid-msg"});this.errorEl.setWidth(elp.getWidth(true)-20);}this.errorEl.update(_f);Ext.form.Field.msgFx[this.msgFx].show(this.errorEl,this);break;case "side":if(!this.errorIcon){var elp=this.el.findParent(".x-form-element",5,true);this.errorIcon=elp.createChild({cls:"x-form-invalid-icon"});}this.alignErrorIcon();this.errorIcon.dom.qtip=_f;this.errorIcon.dom.qclass="x-form-invalid-tip";this.errorIcon.show();break;default:var t=Ext.getDom(this.msgTarget);t.innerHTML=_f;t.style.display=this.msgDisplay;break;}this.fireEvent("invalid",this,_f);},alignErrorIcon:function(){this.errorIcon.alignTo(this.el,"tl-tr",[2,0]);},clearInvalid:function(){if(!this.rendered||this.preventMark){return;}this.el.removeClass(this.invalidClass);switch(this.msgTarget){case "qtip":this.el.dom.qtip="";break;case "title":this.el.dom.title="";break;case "under":if(this.errorEl){Ext.form.Field.msgFx[this.msgFx].hide(this.errorEl,this);}break;case "side":if(this.errorIcon){this.errorIcon.dom.qtip="";this.errorIcon.hide();}break;default:var t=Ext.getDom(this.msgTarget);t.innerHTML="";t.style.display="none";break;}this.fireEvent("valid",this);},getRawValue:function(){return this.el.getValue();},getValue:function(){var v=this.el.getValue();if(v==this.emptyText||v===undefined){v="";}return v;},setRawValue:function(v){return this.el.dom.value=v;},setValue:function(v){this.value=v;if(this.rendered){this.el.dom.value=v;this.validate();}},adjustWidth:function(tag,w){tag=tag.toLowerCase();if(typeof w=="number"&&Ext.isStrict&&!Ext.isSafari){if(Ext.isIE&&(tag=="input"||tag=="textarea")){if(tag=="input"){return w+2;}if(tag="textarea"){return w-2;}}else{if(Ext.isGecko&&tag=="textarea"){return w-6;}else{if(Ext.isOpera){if(tag=="input"){return w+2;}if(tag="textarea"){return w-2;}}}}}return w;}});Ext.form.Field.msgFx={normal:{show:function(_18,f){_18.setDisplayed("block");},hide:function(_1a,f){_1a.setDisplayed(false).update("");}},slide:{show:function(_1c,f){_1c.slideIn("t",{stopFx:true});},hide:function(_1e,f){_1e.slideOut("t",{stopFx:true,useDisplay:true});}},slideRight:{show:function(_20,f){_20.fixDisplay();_20.alignTo(f.el,"tl-tr");_20.slideIn("l",{stopFx:true});},hide:function(_22,f){_22.slideOut("l",{stopFx:true,useDisplay:true});}}};



Ext.form.TextField=function(_1){Ext.form.TextField.superclass.constructor.call(this,_1);this.addEvents({autosize:true});};Ext.extend(Ext.form.TextField,Ext.form.Field,{grow:false,growMin:30,growMax:800,vtype:null,maskRe:null,disableKeyFilter:false,allowBlank:true,minLength:0,maxLength:Number.MAX_VALUE,minLengthText:"The minimum length for this field is {0}",maxLengthText:"The maximum length for this field is {0}",selectOnFocus:false,blankText:"This field is required",validator:null,regex:null,regexText:"",emptyText:null,emptyClass:"x-form-empty-field",initEvents:function(){Ext.form.TextField.superclass.initEvents.call(this);if(this.validationEvent=="keyup"){this.validationTask=new Ext.util.DelayedTask(this.validate,this);this.el.on("keyup",this.filterValidation,this);}else{if(this.validationEvent!==false){this.el.on(this.validationEvent,this.validate,this,{buffer:this.validationDelay});}}if(this.selectOnFocus||this.emptyText){this.on("focus",this.preFocus,this);if(this.emptyText){this.on("blur",this.postBlur,this);this.applyEmptyText();}}if(this.maskRe||(this.vtype&&this.disableKeyFilter!==true&&(this.maskRe=Ext.form.VTypes[this.vtype+"Mask"]))){this.el.on("keypress",this.filterKeys,this);}if(this.grow){this.el.on("keyup",this.onKeyUp,this,{buffer:50});this.el.on("click",this.autoSize,this);}},filterValidation:function(e){if(!e.isNavKeyPress()){this.validationTask.delay(this.validationDelay);}},onKeyUp:function(e){if(!e.isNavKeyPress()){this.autoSize();}},reset:function(){Ext.form.TextField.superclass.reset.call(this);this.applyEmptyText();},applyEmptyText:function(){if(this.rendered&&this.emptyText&&this.getRawValue().length<1){this.setRawValue(this.emptyText);this.el.addClass(this.emptyClass);}},preFocus:function(){if(this.emptyText){if(this.getRawValue()==this.emptyText){this.setRawValue("");}this.el.removeClass(this.emptyClass);}if(this.selectOnFocus){this.el.dom.select();}},postBlur:function(){this.applyEmptyText();},filterKeys:function(e){var k=e.getKey();if(!Ext.isIE&&(e.isNavKeyPress()||k==e.BACKSPACE||(k==e.DELETE&&e.button==-1))){return;}var c=e.getCharCode();if(!this.maskRe.test(String.fromCharCode(c)||"")){e.stopEvent();}},setValue:function(v){if(this.emptyText&&v!==undefined&&v!==null&&v!==""){this.el.removeClass(this.emptyClass);}Ext.form.TextField.superclass.setValue.apply(this,arguments);},validateValue:function(_8){if(_8.length<1||_8===this.emptyText){if(this.allowBlank){this.clearInvalid();return true;}else{this.markInvalid(this.blankText);return false;}}if(_8.length<this.minLength){this.markInvalid(String.format(this.minLengthText,this.minLength));return false;}if(_8.length>this.maxLength){this.markInvalid(String.format(this.maxLengthText,this.maxLength));return false;}if(this.vtype){var vt=Ext.form.VTypes;if(!vt[this.vtype](_8)){this.markInvalid(this.vtypeText||vt[this.vtype+"Text"]);return false;}}if(typeof this.validator=="function"){var _a=this.validator(_8);if(_a!==true){this.markInvalid(_a);return false;}}if(this.regex&&!this.regex.test(_8)){this.markInvalid(this.regexText);return false;}return true;},selectText:function(_b,_c){var v=this.getRawValue();if(v.length>0){_b=_b===undefined?0:_b;_c=_c===undefined?v.length:_c;var d=this.el.dom;if(d.setSelectionRange){d.setSelectionRange(_b,_c);}else{if(d.createTextRange){var _f=d.createTextRange();_f.moveStart("character",_b);_f.moveEnd("character",v.length-_c);_f.select();}}}},autoSize:function(){if(!this.grow||!this.rendered){return;}if(!this.metrics){this.metrics=Ext.util.TextMetrics.createInstance(this.el);}var el=this.el;var v=el.dom.value+"&#160;";var w=Math.min(this.growMax,Math.max(this.metrics.getWidth(v)+10,this.growMin));this.el.setWidth(w);this.fireEvent("autosize",this,w);}});


/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Mage
 * @package     js
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */

(function(){
    var eDefer = Function.prototype.defer;
    Function.prototype.defer = function() {
        var argLen = arguments.length;
        if (argLen==0 || (argLen==1 && arguments[0]==1)) {
            //common for Prototype Ajax requests
            return this.delay.curry(0.01).apply(this, arguments);
        }

        return eDefer.apply(this, arguments);
    }
})();
/**
 * Retrieve an array of ids of checked nodes
 * @return {Array} array of ids of checked nodes
 */
Ext.tree.TreePanel.prototype.getChecked = function(node){
    var checked = [], i;
    if( typeof node == 'undefined' ) {
        //node = this.rootVisible ? this.getRootNode() : this.getRootNode().firstChild;
        node = this.getRootNode();
    }

    if( node.attributes.checked ) {
        checked.push(node.id);
    }
    if( node.childNodes.length ) {
        for( i = 0; i < node.childNodes.length; i++ ) {
            checked = checked.concat( this.getChecked(node.childNodes[i]) );
        }
    }

    return checked;
};

/**
 * @class Ext.tree.CustomUITreeLoader
 * @extends Ext.tree.TreeLoader
 * Overrides createNode to force uiProvider to be an arbitrary TreeNodeUI to save bandwidth
 */
Ext.tree.CustomUITreeLoader = function() {
    Ext.tree.CustomUITreeLoader.superclass.constructor.apply(this, arguments);
};

Ext.extend(Ext.tree.CustomUITreeLoader, Ext.tree.TreeLoader, {
    createNode : function(attr){
        Ext.apply(attr, this.baseAttr || {});

        if(this.applyLoader !== false){
            attr.loader = this;
        }

        if(typeof attr.uiProvider == 'string'){
            attr.uiProvider = this.uiProviders[attr.uiProvider] || eval(attr.uiProvider);
        }

        return(attr.leaf ?
            new Ext.tree.TreeNode(attr) :
                new Ext.tree.AsyncTreeNode(attr));
    }
});


/**
 * @class Ext.tree.CheckboxNodeUI
 * @extends Ext.tree.TreeNodeUI
 * Adds a checkbox to all nodes
 */
Ext.tree.CheckboxNodeUI = function() {
    Ext.tree.CheckboxNodeUI.superclass.constructor.apply(this, arguments);
};

Ext.extend(Ext.tree.CheckboxNodeUI, Ext.tree.TreeNodeUI, {
    /**
     * This is virtually identical to Ext.tree.TreeNodeUI.render, modifications are indicated inline
     */
    render : function(bulkRender){
        var n = this.node;
        var targetNode = n.parentNode ?
            n.parentNode.ui.getContainer() : n.ownerTree.container.dom; /* in later svn builds this changes to n.ownerTree.innerCt.dom */
        if(!this.rendered){
            this.rendered = true;
            var a = n.attributes;

            // add some indent caching, this helps performance when rendering a large tree
            this.indentMarkup = "";
            if(n.parentNode){
                this.indentMarkup = n.parentNode.ui.getChildIndent();
            }

            // modification: added checkbox
            var buf = ['<li class="x-tree-node"><div class="x-tree-node-el ', n.attributes.cls,'">',
                '<span class="x-tree-node-indent">',this.indentMarkup,"</span>",
                '<img src="', this.emptyIcon, '" class="x-tree-ec-icon">',
                '<img src="', a.icon || this.emptyIcon, '" class="x-tree-node-icon',(a.icon ? " x-tree-node-inline-icon" : ""),(a.iconCls ? " "+a.iconCls : ""),'" unselectable="on">',
                '<input class="l-tcb" '+ (n.disabled ? 'disabled="disabled" ' : '') +' type="checkbox" ', (a.checked ? "checked>" : '>'),
                '<a hidefocus="on" href="',a.href ? a.href : "#",'" ',
                 a.hrefTarget ? ' target="'+a.hrefTarget+'"' : "", '>',
                 '<span unselectable="on">',n.text,"</span></a></div>",
                '<ul class="x-tree-node-ct" style="display:none;"></ul>',
                "</li>"];

            if(bulkRender !== true && n.nextSibling && n.nextSibling.ui.getEl()){
                this.wrap = Ext.DomHelper.insertHtml("beforeBegin",
                                                            n.nextSibling.ui.getEl(), buf.join(""));
            }else{
                this.wrap = Ext.DomHelper.insertHtml("beforeEnd", targetNode, buf.join(""));
            }
            this.elNode = this.wrap.childNodes[0];
            this.ctNode = this.wrap.childNodes[1];
            var cs = this.elNode.childNodes;
            this.indentNode = cs[0];
            this.ecNode = cs[1];
            this.iconNode = cs[2];
            this.checkbox = cs[3]; // modification: inserted checkbox
            this.anchor = cs[4];
            this.textNode = cs[4].firstChild;
            if(a.qtip){
             if(this.textNode.setAttributeNS){
                 this.textNode.setAttributeNS("ext", "qtip", a.qtip);
                 if(a.qtipTitle){
                     this.textNode.setAttributeNS("ext", "qtitle", a.qtipTitle);
                 }
             }else{
                 this.textNode.setAttribute("ext:qtip", a.qtip);
                 if(a.qtipTitle){
                     this.textNode.setAttribute("ext:qtitle", a.qtipTitle);
                 }
             }
            } else if(a.qtipCfg) {
                a.qtipCfg.target = Ext.id(this.textNode);
                Ext.QuickTips.register(a.qtipCfg);
            }

            this.initEvents();

            // modification: Add additional handlers here to avoid modifying Ext.tree.TreeNodeUI
            Ext.fly(this.checkbox).on('click', this.check.createDelegate(this, [null]));
            n.on('dblclick', function(e) {
                if( this.isLeaf() ) {
                    this.getUI().toggleCheck();
                }
            });

            if(!this.node.expanded){
                this.updateExpandIcon();
            }
        }else{
            if(bulkRender === true) {
                targetNode.appendChild(this.wrap);
            }
        }
    },

    checked : function() {
        return this.checkbox.checked;
    },

    /**
     * Sets a checkbox appropriately.  By default only walks down through child nodes
     * if called with no arguments (onchange event from the checkbox), otherwise
     * it's assumed the call is being made programatically and the correct arguments are provided.
     * @param {Boolean} state true to check the checkbox, false to clear it. (defaults to the opposite of the checkbox.checked)
     * @param {Boolean} descend true to walk through the nodes children and set their checkbox values. (defaults to false)
     */
    check : function(state, descend, bulk) {
        if (this.node.disabled) {
            return;
        }
        var n = this.node;
        var tree = n.getOwnerTree();
        var parentNode = n.parentNode;n
        if( !n.expanded && !n.childrenRendered ) {
            n.expand(false, false, this.check.createDelegate(this, arguments));
        }

        if( typeof bulk == 'undefined' ) {
            bulk = false;
        }
        if( typeof state == 'undefined' || state === null ) {
            state = this.checkbox.checked;
            descend = !state;
            if( state ) {
                n.expand(false, false);
            }
        } else {
            this.checkbox.checked = state;
        }
        n.attributes.checked = state;

        // do we have parents?
        if( parentNode !== null && state ) {
            // if we're checking the box, check it all the way up
            if( parentNode.getUI().check ) {
                //parentNode.getUI().check(state, false, true);
            }
        }
        if( descend && !n.isLeaf() ) {
            var cs = n.childNodes;
      for(var i = 0; i < cs.length; i++) {
        //cs[i].getUI().check(state, true, true);
      }
        }
        if( !bulk ) {
            tree.fireEvent('check', n, state);
        }
    },

    toggleCheck : function(state) {
        this.check(!this.checkbox.checked, true);
    }

});


/**
 * @class Ext.tree.CheckNodeMultiSelectionModel
 * @extends Ext.tree.MultiSelectionModel
 * Multi selection for a TreePanel containing Ext.tree.CheckboxNodeUI.
 * Adds enhanced selection routines for selecting multiple items
 * and key processing to check/clear checkboxes.
 */
Ext.tree.CheckNodeMultiSelectionModel = function(){
   Ext.tree.CheckNodeMultiSelectionModel.superclass.constructor.call(this);
};

Ext.extend(Ext.tree.CheckNodeMultiSelectionModel, Ext.tree.MultiSelectionModel, {
    init : function(tree){
        this.tree = tree;
        tree.el.on("keydown", this.onKeyDown, this);
        tree.on("click", this.onNodeClick, this);
    },

    /**
     * Handle a node click
     * If ctrl key is down and node is selected will unselect the node.
     * If the shift key is down it will create a contiguous selection
     * (see {@link Ext.tree.CheckNodeMultiSelectionModel#extendSelection} for the limitations)
     */
    onNodeClick : function(node, e){
        if (node.disabled) {
            return;
        }
        if( e.shiftKey && this.extendSelection(node) ) {
            return true;
        }
        if( e.ctrlKey && this.isSelected(node) ) {
            this.unselect(node);
        } else {
            this.select(node, e, e.ctrlKey);
        }
    },

    /**
     * Selects all nodes between the previously selected node and the one that the user has just selected.
     * Will not span multiple depths, so only children of the same parent will be selected.
     */
    extendSelection : function(node) {
        var last = this.lastSelNode;
        if( node == last || !last ) {
            return false; /* same selection, process normally normally */
        }

        if( node.parentNode == last.parentNode ) {
            var cs = node.parentNode.childNodes;
            var i = 0, attr='id', selecting=false, lastSelect=false;
            this.clearSelections(true);
            for( i = 0; i < cs.length; i++ ) {
                // We have to traverse the entire tree b/c don't know of a way to find
                // a numerical representation of a nodes position in a tree.
                if( cs[i].attributes[attr] == last.attributes[attr] || cs[i].attributes[attr] == node.attributes[attr] ) {
                    // lastSelect ensures that we select the final node in the list
                    lastSelect = selecting;
                    selecting = !selecting;
                }
                if( selecting || lastSelect ) {
                    this.select(cs[i], null, true);
                    // if we're selecting the last node break to avoid traversing the entire tree
                    if( lastSelect ) {
                        break;
                    }
                }
            }
            return true;
        } else {
            return false;
        }
    },

    /**
     * Traps the press of the SPACE bar and sets the check state of selected nodes to the opposite state of
     * the selected or last selected node.  Assume you have the following five Ext.tree.CheckboxNodeUIs:
     * [X] One, [X] Two, [X] Three, [ ] Four, [ ] Five
     * If you select them in this order: One, Two, Three, Four, Five and press the space bar they all
     * will be <b>checked</b> (the opposite of the checkbox state of Five).
     * If you select them in this order: Five, Four, Three, Two, One and press the space bar they all
     * will be <b>unchecked</b> which is the opposite of the checkbox state of One.
     */
    onKeyDown : Ext.tree.DefaultSelectionModel.prototype.onKeyDown.createInterceptor(function(e) {
        var s = this.selNode || this.lastSelNode;
        // undesirable, but required
        var sm = this;
        if(!s){
            return;
        }
        var k = e.getKey();
        switch(k){
                case e.SPACE:
                    e.stopEvent();
                    var sel = this.getSelectedNodes();
                    var state = !s.getUI().checked();
                    if( sel.length == 1 ) {
                        s.getUI().check(state, !s.isLeaf());
                    } else {
                        for( var i = 0; i < sel.length; i++ ) {
                            sel[i].getUI().check(state, !sel[i].isLeaf() );
                        }
                    }
            break;
        }

        return true;
    })
});

/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Mage
 * @package     Mage_Adminhtml
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */

var tinyMceWysiwygSetup = Class.create();
tinyMceWysiwygSetup.prototype =
{
    mediaBrowserOpener: null,
    mediaBrowserTargetElementId: null,

    initialize: function(htmlId, config)
    {
        this.id = htmlId;
        this.config = config;
        varienGlobalEvents.attachEventHandler('tinymceChange', this.onChangeContent.bind(this));
        this.notifyFirebug();
        if(typeof tinyMceEditors == 'undefined') {
            tinyMceEditors = $H({});
        }
        tinyMceEditors.set(this.id, this);
    },

    notifyFirebug: function() {
        if (firebugEnabled() && $('fb' + this.id) == undefined) {
            var noticeHtml = '<ul class="messages message-firebug" id="fb' + this.id + '"><li class="notice-msg">';
                noticeHtml+= '<ul><li>';
                noticeHtml+= '<b>' + this.config.firebug_warning_title + ':</b> ';
                noticeHtml+= this.config.firebug_warning_text;
                noticeHtml+= ' <a id="hidefb' + this.id + '" href="">' + this.config.firebug_warning_anchor + '</a>';
                noticeHtml+= '</li></ul>';
                noticeHtml+= '</li></ul>';
            $('buttons' + this.id).insert({before: noticeHtml});
            Event.observe($('hidefb' + this.id), "click", function(e) {
                $('fb' + this.id).remove();
                Event.stop(e);
            }.bind(this));
        }
    },

    setup: function(mode)
    {
        if (this.config.widget_plugin_src) {
            tinymce.PluginManager.load('magentowidget', this.config.widget_plugin_src);
        }

        if (this.config.plugins) {
            (this.config.plugins).each(function(plugin){
                tinymce.PluginManager.load(plugin.name, plugin.src);
            });
        }

        tinyMCE.init(this.getSettings(mode));
    },

    getSettings: function(mode)
    {
        var plugins = 'inlinepopups,safari,pagebreak,style,layer,table,advhr,advimage,emotions,iespell,media,searchreplace,contextmenu,paste,directionality,fullscreen,noneditable,visualchars,nonbreaking,xhtmlxtras';

        if (this.config.widget_plugin_src) {
            plugins = 'magentowidget,' + plugins;
        }

        var magentoPluginsOptions = $H({});
        var magentoPlugins = '';

        if (this.config.plugins) {
            (this.config.plugins).each(function(plugin){
                magentoPlugins = plugin.name + ',' + magentoPlugins;
                magentoPluginsOptions.set(plugin.name, plugin.options);
            });
            if (magentoPlugins) {
                plugins = '-' + magentoPlugins + plugins;
            }
        }

        var settings = {
            schema : 'html5',
            mode : (mode != undefined ? mode : 'none'),
            elements : this.id,
            theme : 'advanced',
            plugins : plugins,
            theme_advanced_buttons1 : magentoPlugins + 'magentowidget,bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,|,styleselect,formatselect,fontselect,fontsizeselect',
            theme_advanced_buttons2 : 'cut,copy,paste,pastetext,pasteword,|,search,replace,|,bullist,numlist,|,outdent,indent,blockquote,|,undo,redo,|,link,unlink,anchor,image,cleanup,help,code,|,forecolor,backcolor',
            theme_advanced_buttons3 : 'tablecontrols,|,hr,removeformat,visualaid,|,sub,sup,|,charmap,iespell,media,advhr,|,ltr,rtl,|,fullscreen',
            theme_advanced_buttons4 : 'insertlayer,moveforward,movebackward,absolute,|,styleprops,|,cite,abbr,acronym,del,ins,attribs,|,visualchars,nonbreaking,pagebreak',
            theme_advanced_toolbar_location : 'top',
            theme_advanced_toolbar_align : 'left',
            theme_advanced_statusbar_location : 'bottom',
            theme_advanced_resizing : true,
            convert_urls : false,
            relative_urls : false,
            content_css: this.config.content_css,
            custom_popup_css: this.config.popup_css,
            magentowidget_url: this.config.widget_window_url,
            magentoPluginsOptions: magentoPluginsOptions,
            doctype : '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">',

            setup : function(ed) {
                ed.onSubmit.add(function(ed, e) {
                    varienGlobalEvents.fireEvent('tinymceSubmit', e);
                });

                ed.onPaste.add(function(ed, e, o) {
                    varienGlobalEvents.fireEvent('tinymcePaste', o);
                });

                ed.onBeforeSetContent.add(function(ed, o) {
                    varienGlobalEvents.fireEvent('tinymceBeforeSetContent', o);
                });

                ed.onSetContent.add(function(ed, o) {
                    varienGlobalEvents.fireEvent('tinymceSetContent', o);
                });

                ed.onSaveContent.add(function(ed, o) {
                    varienGlobalEvents.fireEvent('tinymceSaveContent', o);
                });

                ed.onChange.add(function(ed, l) {
                    varienGlobalEvents.fireEvent('tinymceChange', l);
                });

                ed.onExecCommand.add(function(ed, cmd, ui, val) {
                    varienGlobalEvents.fireEvent('tinymceExecCommand', cmd);
                });
            }
        };

        // Set the document base URL
        if (this.config.document_base_url) {
            settings.document_base_url = this.config.document_base_url;
        }

        if (this.config.files_browser_window_url) {
            settings.file_browser_callback = function(fieldName, url, objectType, w) {
                varienGlobalEvents.fireEvent("open_browser_callback", {win:w, type:objectType, field:fieldName});
            };
        }

        if (this.config.width) {
            settings.width = this.config.width;
        }

        if (this.config.height) {
            settings.height = this.config.height;
        }

        return settings;
    },

    openFileBrowser: function(o) {
        var typeTitle;
        var storeId = this.config.store_id !== null ? this.config.store_id : 0;
        var wUrl = this.config.files_browser_window_url +
                   'target_element_id/' + this.id + '/' +
                   'store/' + storeId + '/';

        this.mediaBrowserOpener = o.win;
        this.mediaBrowserTargetElementId = o.field;

        if (typeof(o.type) != 'undefined' && o.type != "") {
            typeTitle = 'image' == o.type ? this.translate('Insert Image...') : this.translate('Insert Media...');
            wUrl = wUrl + "type/" + o.type + "/";
        } else {
            typeTitle = this.translate('Insert File...');
        }

        MediabrowserUtility.openDialog(wUrl, false, false, typeTitle, {
            onBeforeShow: function(win) {
                win.element.setStyle({zIndex: 300200});
            }
        });
    },

    translate: function(string) {
        return 'undefined' != typeof(Translator) ? Translator.translate(string) : string;
    },

    getMediaBrowserOpener: function() {
        return this.mediaBrowserOpener;
    },

    getMediaBrowserTargetElementId: function() {
        return this.mediaBrowserTargetElementId;
    },

    getToggleButton: function() {
        return $('toggle' + this.id);
    },

    getPluginButtons: function() {
        return $$('#buttons' + this.id + ' > button.plugin');
    },

    turnOn: function() {
        this.closePopups();
        this.setup();
        tinyMCE.execCommand('mceAddControl', false, this.id);
        this.getPluginButtons().each(function(e) {
            e.hide();
        });
    },

    turnOff: function() {
        this.closePopups();
        tinyMCE.execCommand('mceRemoveControl', false, this.id);
        this.getPluginButtons().each(function(e) {
            e.show();
        });
        if (Prototype.Browser.IE) {
            // workaround for IE textarea redraw bug
            window.setTimeout(function() {
                if ($(this.id)) {
                    $(this.id).value = $(this.id).value;
                }
            }.bind(this), 0);
        }
    },

    closePopups: function() {
        // close all popups to avoid problems with updating parent content area
        closeEditorPopup('widget_window' + this.id);
        closeEditorPopup('browser_window' + this.id);
    },

    toggle: function() {
        if (!tinyMCE.get(this.id)) {
            this.turnOn();
            return true;
        } else {
            this.turnOff();
            return false;
        }
    },

    onFormValidation: function() {
        if (tinyMCE.get(this.id)) {
            $(this.id).value = tinyMCE.get(this.id).getContent();
        }
    },

    onChangeContent: function() {
        // Add "changed" to tab class if it exists
        if(this.config.tab_id) {
            var tab = $$('a[id$=' + this.config.tab_id + ']')[0];
            if ($(tab) != undefined && $(tab).hasClassName('tab-item-link')) {
                $(tab).addClassName('changed');
            }
        }
    },

    // retrieve directives URL with substituted directive value
    makeDirectiveUrl: function(directive) {
        return this.config.directives_url.replace('directive', 'directive/___directive/' + directive);
    },

    encodeDirectives: function(content) {
        // collect all HTML tags with attributes that contain directives
        return content.gsub(/<([a-z0-9\-\_]+.+?)([a-z0-9\-\_]+=".*?\{\{.+?\}\}.*?".+?)>/i, function(match) {
            var attributesString = match[2];
            // process tag attributes string
            attributesString = attributesString.gsub(/([a-z0-9\-\_]+)="(.*?)(\{\{.+?\}\})(.*?)"/i, function(m) {
                return m[1] + '="' + m[2] + this.makeDirectiveUrl(Base64.mageEncode(m[3])) + m[4] + '"';
            }.bind(this));

            return '<' + match[1] + attributesString + '>';

        }.bind(this));
    },

    encodeWidgets: function(content) {
        return content.gsub(/\{\{widget(.*?)\}\}/i, function(match){
            var attributes = this.parseAttributesString(match[1]);
            if (attributes.type) {
                var placeholderFilename = attributes.type.replace(/\//g, "__") + ".gif";
                if (!this.widgetPlaceholderExist(placeholderFilename)) {
                    placeholderFilename = 'default.gif';
                }
                var imageSrc = this.config.widget_images_url + placeholderFilename;
                var imageHtml = '<img';
                    imageHtml+= ' id="' + Base64.idEncode(match[0]) + '"';
                    imageHtml+= ' src="' + imageSrc + '"';
                    imageHtml+= ' title="' + match[0].replace(/\{\{/g, '{').replace(/\}\}/g, '}').replace(/\"/g, '&quot;') + '"';
                    imageHtml+= '>';

                return imageHtml;
            }
        }.bind(this));
    },

    decodeDirectives: function(content) {
        // escape special chars in directives url to use it in regular expression
        var url = this.makeDirectiveUrl('%directive%').replace(/([$^.?*!+:=()\[\]{}|\\])/g, '\\$1');
        var reg = new RegExp(url.replace('%directive%', '([a-zA-Z0-9,_-]+)'));
        return content.gsub(reg, function(match) {
            return Base64.mageDecode(match[1]);
        }.bind(this));
    },

    decodeWidgets: function(content) {
        return content.gsub(/<img([^>]+id=\"[^>]+)>/i, function(match) {
            var attributes = this.parseAttributesString(match[1]);
            if(attributes.id) {
                var widgetCode = Base64.idDecode(attributes.id);
                if (widgetCode.indexOf('{{widget') != -1) {
                    return widgetCode;
                }
                return match[0];
            }
            return match[0];
        }.bind(this));
    },

    parseAttributesString: function(attributes) {
        var result = {};
        attributes.gsub(/(\w+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/, function(match){
            result[match[1]] = match[2];
        });
        return result;
    },

    beforeSetContent: function(o) {
        if (this.config.add_widgets) {
            o.content = this.encodeWidgets(o.content);
            o.content = this.encodeDirectives(o.content);
        } else if (this.config.add_directives) {
            o.content = this.encodeDirectives(o.content);
        }
    },

    saveContent: function(o) {
        if (this.config.add_widgets) {
            o.content = this.decodeWidgets(o.content);
            o.content = this.decodeDirectives(o.content);
        } else if (this.config.add_directives) {
            o.content = this.decodeDirectives(o.content);
        }
    },

    widgetPlaceholderExist: function(filename) {
        return this.config.widget_placeholders.indexOf(filename) != -1;
    }
}

/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Mage
 * @package     Mage_Adminhtml
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */

var Variables = {
    textareaElementId: null,
    variablesContent: null,
    dialogWindow: null,
    dialogWindowId: 'variables-chooser',
    overlayShowEffectOptions: null,
    overlayHideEffectOptions: null,
    insertFunction: 'Variables.insertVariable',
    init: function(textareaElementId, insertFunction) {
        if ($(textareaElementId)) {
            this.textareaElementId = textareaElementId;
        }
        if (insertFunction) {
            this.insertFunction = insertFunction;
        }
    },

    resetData: function() {
        this.variablesContent = null;
        this.dialogWindow = null;
    },

    openVariableChooser: function(variables) {
        if (this.variablesContent == null && variables) {
            this.variablesContent = '<ul>';
            variables.each(function(variableGroup) {
                if (variableGroup.label && variableGroup.value) {
                    this.variablesContent += '<li><b>' + variableGroup.label + '</b></li>';
                    (variableGroup.value).each(function(variable){
                        if (variable.value && variable.label) {
                            this.variablesContent += '<li style="padding-left: 20px;">' +
                                this.prepareVariableRow(variable.value, variable.label) + '</li>';
                        }
                    }.bind(this));
                }
            }.bind(this));
            this.variablesContent += '</ul>';
        }
        if (this.variablesContent) {
            this.openDialogWindow(this.variablesContent);
        }
    },
    openDialogWindow: function(variablesContent) {
        if ($(this.dialogWindowId) && typeof(Windows) != 'undefined') {
            Windows.focus(this.dialogWindowId);
            return;
        }

        this.overlayShowEffectOptions = Windows.overlayShowEffectOptions;
        this.overlayHideEffectOptions = Windows.overlayHideEffectOptions;
        Windows.overlayShowEffectOptions = {duration:0};
        Windows.overlayHideEffectOptions = {duration:0};

        this.dialogWindow = Dialog.info(variablesContent, {
            draggable:true,
            resizable:true,
            closable:true,
            className:"magento",
            windowClassName:"popup-window",
            title:'Insert Variable...',
            width:700,
            //height:270,
            zIndex:1000,
            recenterAuto:false,
            hideEffect:Element.hide,
            showEffect:Element.show,
            id:this.dialogWindowId,
            onClose: this.closeDialogWindow.bind(this)
        });
        variablesContent.evalScripts.bind(variablesContent).defer();
    },
    closeDialogWindow: function(window) {
        if (!window) {
            window = this.dialogWindow;
        }
        if (window) {
            window.close();
            Windows.overlayShowEffectOptions = this.overlayShowEffectOptions;
            Windows.overlayHideEffectOptions = this.overlayHideEffectOptions;
        }
    },
    prepareVariableRow: function(varValue, varLabel) {
        var value = (varValue).replace(/"/g, '&quot;').replace(/'/g, '\\&#39;');
        var content = '<a href="#" onclick="'+this.insertFunction+'(\''+ value +'\');return false;">' + varLabel + '</a>';
        return content;
    },
    insertVariable: function(value) {
        this.closeDialogWindow(this.dialogWindow);
        var textareaElm = $(this.textareaElementId);
        if (textareaElm) {
            var scrollPos = textareaElm.scrollTop;
            updateElementAtCursor(textareaElm, value);
            textareaElm.focus();
            textareaElm.scrollTop = scrollPos;
            textareaElm = null;
        }
        return;
    }
};

MagentovariablePlugin = {
    editor: null,
    variables: null,
    textareaId: null,
    setEditor: function(editor) {
        this.editor = editor;
    },
    loadChooser: function(url, textareaId) {
        this.textareaId = textareaId;
        if (this.variables == null) {
            new Ajax.Request(url, {
                parameters: {},
                onComplete: function (transport) {
                    if (transport.responseText.isJSON()) {
                        Variables.init(null, 'MagentovariablePlugin.insertVariable');
                        this.variables = transport.responseText.evalJSON();
                        this.openChooser(this.variables);
                    }
                }.bind(this)
             });
        } else {
            this.openChooser(this.variables);
        }
        return;
    },
    openChooser: function(variables) {
        Variables.openVariableChooser(variables);
    },
    insertVariable : function (value) {
        if (this.textareaId) {
            Variables.init(this.textareaId);
            Variables.insertVariable(value);
        } else {
            Variables.closeDialogWindow();
            this.editor.execCommand('mceInsertContent', false, value);
        }
        return;
    }
};

/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Mage
 * @package     Mage_Adminhtml
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */

var widgetTools = {
    getDivHtml: function(id, html) {
        if (!html) html = '';
        return '<div id="' + id + '">' + html + '</div>';
    },

    onAjaxSuccess: function(transport) {
        if (transport.responseText.isJSON()) {
            var response = transport.responseText.evalJSON()
            if (response.error) {
                throw response;
            } else if (response.ajaxExpired && response.ajaxRedirect) {
                setLocation(response.ajaxRedirect);
            }
        }
    },

    openDialog: function(widgetUrl) {
        if ($('widget_window') && typeof(Windows) != 'undefined') {
            Windows.focus('widget_window');
            return;
        }
        this.dialogWindow = Dialog.info(null, {
            draggable:true,
            resizable:false,
            closable:true,
            className:'magento',
            windowClassName:"popup-window",
            title:Translator.translate('Insert Widget...'),
            top:50,
            width:950,
            //height:450,
            zIndex:1000,
            recenterAuto:false,
            hideEffect:Element.hide,
            showEffect:Element.show,
            id:'widget_window',
            onClose: this.closeDialog.bind(this)
        });
        new Ajax.Updater('modal_dialog_message', widgetUrl, {evalScripts: true});
    },
    closeDialog: function(window) {
        if (!window) {
            window = this.dialogWindow;
        }
        if (window) {
            // IE fix - hidden form select fields after closing dialog
            WindowUtilities._showSelect();
            window.close();
        }
    }
}

var WysiwygWidget = {};
WysiwygWidget.Widget = Class.create();
WysiwygWidget.Widget.prototype = {

    initialize: function(formEl, widgetEl, widgetOptionsEl, optionsSourceUrl, widgetTargetId) {
        $(formEl).insert({bottom: widgetTools.getDivHtml(widgetOptionsEl)});
        this.formEl = formEl;
        this.widgetEl = $(widgetEl);
        this.widgetOptionsEl = $(widgetOptionsEl);
        this.optionsUrl = optionsSourceUrl;
        this.optionValues = new Hash({});
        this.widgetTargetId = widgetTargetId;
        if (typeof(tinyMCE) != "undefined" && tinyMCE.activeEditor) {
            this.bMark = tinyMCE.activeEditor.selection.getBookmark();
        }

        Event.observe(this.widgetEl, "change", this.loadOptions.bind(this));

        this.initOptionValues();
    },

    getOptionsContainerId: function() {
        return this.widgetOptionsEl.id + '_' + this.widgetEl.value.gsub(/\//, '_');
    },

    switchOptionsContainer: function(containerId) {
        $$('#' + this.widgetOptionsEl.id + ' div[id^=' + this.widgetOptionsEl.id + ']').each(function(e) {
            this.disableOptionsContainer(e.id);
        }.bind(this));
        if(containerId != undefined) {
            this.enableOptionsContainer(containerId);
        }
        this._showWidgetDescription();
    },

    enableOptionsContainer: function(containerId) {
        $$('#' + containerId + ' .widget-option').each(function(e) {
            e.removeClassName('skip-submit');
            if (e.hasClassName('obligatory')) {
                e.removeClassName('obligatory');
                e.addClassName('required-entry');
            }
        });
        $(containerId).removeClassName('no-display');
    },

    disableOptionsContainer: function(containerId) {
        if ($(containerId).hasClassName('no-display')) {
            return;
        }
        $$('#' + containerId + ' .widget-option').each(function(e) {
            // Avoid submitting fields of unactive container
            if (!e.hasClassName('skip-submit')) {
                e.addClassName('skip-submit');
            }
            // Form validation workaround for unactive container
            if (e.hasClassName('required-entry')) {
                e.removeClassName('required-entry');
                e.addClassName('obligatory');
            }
        });
        $(containerId).addClassName('no-display');
    },

    // Assign widget options values when existing widget selected in WYSIWYG
    initOptionValues: function() {

        if (!this.wysiwygExists()) {
            return false;
        }

        var e = this.getWysiwygNode();
        if (e != undefined && e.id) {
            var widgetCode = Base64.idDecode(e.id);
            if (widgetCode.indexOf('{{widget') != -1) {
                this.optionValues = new Hash({});
                widgetCode.gsub(/([a-z0-9\_]+)\s*\=\s*[\"]{1}([^\"]+)[\"]{1}/i, function(match){
                    if (match[1] == 'type') {
                        this.widgetEl.value = match[2];
                    } else {
                        this.optionValues.set(match[1], match[2]);
                    }
                }.bind(this));

                this.loadOptions();
            }
        }
    },

    loadOptions: function() {
        if (!this.widgetEl.value) {
            this.switchOptionsContainer();
            return;
        }

        var optionsContainerId = this.getOptionsContainerId();
        if ($(optionsContainerId) != undefined) {
            this.switchOptionsContainer(optionsContainerId);
            return;
        }

        this._showWidgetDescription();

        var params = {widget_type: this.widgetEl.value, values: this.optionValues};
        new Ajax.Request(this.optionsUrl,
            {
                parameters: {widget: Object.toJSON(params)},
                onSuccess: function(transport) {
                    try {
                        widgetTools.onAjaxSuccess(transport);
                        this.switchOptionsContainer();
                        if ($(optionsContainerId) == undefined) {
                            this.widgetOptionsEl.insert({bottom: widgetTools.getDivHtml(optionsContainerId, transport.responseText)});
                        } else {
                            this.switchOptionsContainer(optionsContainerId);
                        }
                    } catch(e) {
                        alert(e.message);
                    }
                }.bind(this)
            }
        );
    },

    _showWidgetDescription: function() {
        var noteCnt = this.widgetEl.next().down('small');
        var descrCnt = $('widget-description-' + this.widgetEl.selectedIndex);
        if(noteCnt != undefined) {
            var description = (descrCnt != undefined ? descrCnt.innerHTML : '');
            noteCnt.update(descrCnt.innerHTML);
        }
    },

    insertWidget: function() {
        widgetOptionsForm = new varienForm(this.formEl);
        if(widgetOptionsForm.validator && widgetOptionsForm.validator.validate() || !widgetOptionsForm.validator){
            var formElements = [];
            var i = 0;
            Form.getElements($(this.formEl)).each(function(e) {
                if(!e.hasClassName('skip-submit')) {
                    formElements[i] = e;
                    i++;
                }
            });

            // Add as_is flag to parameters if wysiwyg editor doesn't exist
            var params = Form.serializeElements(formElements);
            if (!this.wysiwygExists()) {
                params = params + '&as_is=1';
            }

            new Ajax.Request($(this.formEl).action,
            {
                parameters: params,
                onComplete: function(transport) {
                    try {
                        widgetTools.onAjaxSuccess(transport);
                        Windows.close("widget_window");

                        if (typeof(tinyMCE) != "undefined" && tinyMCE.activeEditor) {
                            tinyMCE.activeEditor.focus();
                            if (this.bMark) {
                                tinyMCE.activeEditor.selection.moveToBookmark(this.bMark);
                            }
                        }

                        this.updateContent(transport.responseText);
                    } catch(e) {
                        alert(e.message);
                    }
                }.bind(this)
            });
        }
    },

    updateContent: function(content) {
        if (this.wysiwygExists()) {
            this.getWysiwyg().execCommand("mceInsertContent", false, content);
        } else {
            var textarea = document.getElementById(this.widgetTargetId);
            updateElementAtCursor(textarea, content);
            varienGlobalEvents.fireEvent('tinymceChange');
        }
    },

    wysiwygExists: function() {
        return (typeof tinyMCE != 'undefined') && tinyMCE.get(this.widgetTargetId);
    },

    getWysiwyg: function() {
        return tinyMCE.activeEditor;
    },

    getWysiwygNode: function() {
        return tinyMCE.activeEditor.selection.getNode();
    }
}

WysiwygWidget.chooser = Class.create();
WysiwygWidget.chooser.prototype = {

    // HTML element A, on which click event fired when choose a selection
    chooserId: null,

    // Source URL for Ajax requests
    chooserUrl: null,

    // Chooser config
    config: null,

    // Chooser dialog window
    dialogWindow: null,

    // Chooser content for dialog window
    dialogContent: null,

    overlayShowEffectOptions: null,
    overlayHideEffectOptions: null,

    initialize: function(chooserId, chooserUrl, config) {
        this.chooserId = chooserId;
        this.chooserUrl = chooserUrl;
        this.config = config;
    },

    getResponseContainerId: function() {
        return 'responseCnt' + this.chooserId;
    },

    getChooserControl: function() {
        return $(this.chooserId + 'control');
    },

    getElement: function() {
        return $(this.chooserId + 'value');
    },

    getElementLabel: function() {
        return $(this.chooserId + 'label');
    },

    open: function() {
        $(this.getResponseContainerId()).show();
    },

    close: function() {
        $(this.getResponseContainerId()).hide();
        this.closeDialogWindow();
    },

    choose: function(event) {
        // Open dialog window with previously loaded dialog content
        if (this.dialogContent) {
            this.openDialogWindow(this.dialogContent);
            return;
        }
        // Show or hide chooser content if it was already loaded
        var responseContainerId = this.getResponseContainerId();

        // Otherwise load content from server
        new Ajax.Request(this.chooserUrl,
            {
                parameters: {element_value: this.getElementValue(), element_label: this.getElementLabelText()},
                onSuccess: function(transport) {
                    try {
                        widgetTools.onAjaxSuccess(transport);
                        this.dialogContent = widgetTools.getDivHtml(responseContainerId, transport.responseText);
                        this.openDialogWindow(this.dialogContent);
                    } catch(e) {
                        alert(e.message);
                    }
                }.bind(this)
            }
        );
    },

    openDialogWindow: function(content) {
        this.overlayShowEffectOptions = Windows.overlayShowEffectOptions;
        this.overlayHideEffectOptions = Windows.overlayHideEffectOptions;
        Windows.overlayShowEffectOptions = {duration:0};
        Windows.overlayHideEffectOptions = {duration:0};
        this.dialogWindow = Dialog.info(content, {
            draggable:true,
            resizable:true,
            closable:true,
            className:"magento",
            windowClassName:"popup-window",
            title:this.config.buttons.open,
            top:50,
            width:950,
            height:500,
            zIndex:1000,
            recenterAuto:false,
            hideEffect:Element.hide,
            showEffect:Element.show,
            id:"widget-chooser",
            onClose: this.closeDialogWindow.bind(this)
        });
        content.evalScripts.bind(content).defer();
    },

    closeDialogWindow: function(dialogWindow) {
        if (!dialogWindow) {
            dialogWindow = this.dialogWindow;
        }
        if (dialogWindow) {
            dialogWindow.close();
            Windows.overlayShowEffectOptions = this.overlayShowEffectOptions;
            Windows.overlayHideEffectOptions = this.overlayHideEffectOptions;
        }
        this.dialogWindow = null;
    },

    getElementValue: function(value) {
        return this.getElement().value;
    },

    getElementLabelText: function(value) {
        return this.getElementLabel().innerHTML;
    },

    setElementValue: function(value) {
        this.getElement().value = value;
    },

    setElementLabel: function(value) {
        this.getElementLabel().innerHTML = value;
    }
}

/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Mage
 * @package     js
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */

/**
 * Flex maintance object
 *
 *
 */
Flex = {};
Flex.currentID = 0;
Flex.uniqId = function() {
    return 'flexMovieUID'+( ++Flex.currentID );
};

/**
 * Check flash player version for required version
 *
 * @param Number major
 * @param Number minor
 * @param Number revision
 * @return Boolean
 */
Flex.checkFlashPlayerVersion = function(major, minor, revision) {
    var version = Flex.getFlashPlayerVersion();

    if (version === false) {
        return false;
    }

    var requestedVersion = Flex.transformVersionToFloat([major, minor, revision], 5);
    var currentVersion = Flex.transformVersionToFloat(version, 5);

    return requestedVersion <= currentVersion;
};

/**
 * Get flash player version in internet explorer
 * by creating of test ActiveXObjects
 *
 * @return String|Boolean
 */
Flex._getFlashPlayerVersionAsActiveX = function () {
    var versions = [
        {'default': '7.0.0', 'code':'ShockwaveFlash.ShockwaveFlash.7', 'variable':true},
        {'default': '6.0.0', 'code':'ShockwaveFlash.ShockwaveFlash.6', 'variable':true, 'acceess':true},
        {'default': '3.0.0', 'code':'ShockwaveFlash.ShockwaveFlash.3', 'variable':false},
        {'default': '2.0.0', 'code':'ShockwaveFlash.ShockwaveFlash', 'variable':false},
    ];

    var detector = function (options) {
        var activeXObject = new ActiveXObject(options.code);
        if (options.access && options.variable) {
            activeXObject.AllowScriptAccess = 'always';
        }

        if (options.variable) {
            return activeXObject.GetVariable('$version');
        }

        return options['default'];
    }

    var version = false;

    for (var i = 0, l = versions.length; i < l; i++) {
        try {
            version = detector(versions[i]);
            return version;
        } catch (e) {}
    }

    return false;
};

/**
 * Transforms version string like 1.0.0 to array [1,0,0]
 *
 * @param String|Array version
 * @return Array|Boolean
 */
Flex.transformVersionToArray = function (version) {
    if (!Object.isString(version)) {
        return false;
    }

    var versions = version.match(/[\d]+/g);

    if (versions.length > 3) {
        return versions.slice(0,3);
    } else if (versions.length) {
        return versions;
    }



    return false;
};

/**
 * Transforms version string like 1.1.1 to float 1.00010001
 *
 * @param String|Array version
 * @param Number range - percition range between version digits
 * @return Array
 */
Flex.transformVersionToFloat = function (version, range) {
    if (Object.isString(version)) {
        version = Flex.transformVersionToArray(version)
    }

    if (Object.isArray(version)) {
        var result = 0;
        for (var i =0, l=version.length; i < l; i++) {
            result += parseFloat(version[i]) / Math.pow(10, range*i);
        }

        return result;
    }

    return false;
};

/**
 * Return flash player version as array of 0=major, 1=minor, 2=revision
 *
 * @return Array|Boolean
 */
Flex.getFlashPlayerVersion = function () {
    if (Flex.flashPlayerVersion) {
        return Flex.flashPlayerVersion;
    }

    var version = false;
    if (navigator.plugins != null && navigator.plugins.length > 0) {
       if (navigator.mimeTypes && navigator.mimeTypes.length > 0) {
          if (navigator.mimeTypes['application/x-shockwave-flash'] &&
              !navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin) {
             return false;
          }
       }
       var flashPlugin = navigator.plugins['Shockwave Flash'] || navigator.plugins['Shockwave Flash 2.0'];
       version = Flex.transformVersionToArray(flashPlugin.description);
    } else {
       version = Flex.transformVersionToArray(Flex._getFlashPlayerVersionAsActiveX());
    }

    Flex.flashPlayerVersion = version;
    return version;
};

Flex.Object = Class.create({
    /**
     * Initialize object from configuration, where configuration keys,
     * is set of tag attributes for object or embed
     *
     * @example
     * new Flex.Object({'src':'path/to/flashmovie.swf'});
     *
     * @param Object config
     * @return void
     */
    initialize: function (config) {
        this.isIE  = Prototype.Browser.IE;
        this.isWin = (navigator.appVersion.toLowerCase().indexOf("win") != -1) ? true : false;
        this.attributes = {
             quality:"high",
             pluginspage: "http://www.adobe.com/go/getflashplayer",
             type: "application/x-shockwave-flash",
             allowScriptAccess: "always",
             classid: "clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"
        };
        this.bridgeName = '';
        this.bridge = false;
        this.setAttributes( config );
        this.applied = false;

        var myTemplatesPattern = /(^|.|\r|\n)(\{(.*?)\})/;
        if(this.detectFlashVersion(9, 0, 28)) {
            if(this.isIE) {
                this.template = new Template( '<object {objectAttributes}><param name="allowFullScreen" value="true"/>{objectParameters}</object>', myTemplatesPattern )
            } else {
                this.template = new Template( '<embed {embedAttributes} allowfullscreen="true" />', myTemplatesPattern );
            }
        } else {
            this.template = new Template(  'This content requires the Adobe Flash Player. '
                                               +' <a href=http://www.adobe.com/go/getflash/>Get Flash</a>', myTemplatesPattern );
        }

        this.parametersTemplate = new Template( '<param name="{name}" value="{value}" />', myTemplatesPattern );
        this.attributesTemplate = new Template( ' {name}="{value}" ', myTemplatesPattern );
    },
    /**
     * Set object attribute for generation of html tags
     *
     * @param Sting name
     * @param Object value
     * @return void
     */
    setAttribute : function( name, value ) {
        if(!this.applied) {
            this.attributes[name] = value;
        }
    },
    /**
     * Retrive object attribute value used for generation in html tags
     *
     * @param Sting name
     * @return Object
     */
    getAttribute : function( name ) {
        return this.attributes[name];
    },
    /**
     * Set object attributes in one call
     *
     * @param Object attributesList
     * @return void
     */
    setAttributes : function( attributesList ) {
        $H(attributesList).each(function(pair){
            this.setAttribute(pair.key, pair.value);
        }.bind(this));
    },
    /**
     * Retrieve all object attributes
     *
     * @return Object
     */
    getAttributes : function( ) {
        return this.attributes;
    },
    /**
     * Applies generated HTML content to specified HTML tag
     *
     * @param String|DOMELement container
     * @return void
     */
    apply : function(container) {
        if (!this.applied)    {
            this.setAttribute("id", Flex.uniqId());
            this.preInitBridge();
            var readyHTML = this.template.evaluate(this.generateTemplateValues());
            $(container).update(readyHTML);
        }
        this.applied = true;
    },
    /**
     * Applies generated HTML content to window.document
     *
     * @return void
     */
    applyWrite : function( ) {
        if (!this.applied)    {
            this.setAttribute( "id", Flex.uniqId());
            this.preInitBridge();
            var readyHTML = this.template.evaluate( this.generateTemplateValues() );
            document.write( readyHTML );
        }
        this.applied = true;
    },
    /**
     * Preinitialize FABridge values
     *
     * @return void
     */
    preInitBridge: function () {
        this.bridgeName = this.getAttribute('id') + 'bridge';
        var flashVars = this.getAttribute('flashVars') || this.getAttribute('flashvars') || '';
        if (flashVars != '') {
            flashVars += '&';
        }
        flashVars += 'bridgeName=' + this.bridgeName;
        this.setAttribute('flashVars', flashVars);
        var scopeObj = this;
        FABridge.addInitializationCallback(
             this.bridgeName,
             function () {
                 scopeObj.bridge = this.root();
                 scopeObj.initBridge();
             }
        );
    },
    /**
     * Initialize bridge callback passed to FABridge,
     * calls internal callback if it's presented
     *
     * @return void
     */
    initBridge: function() {
        if(this.onBridgeInit) {
            this.onBridgeInit(this.getBridge());
        }
    },
    /**
     * Retrieve FABridge instance for this object
     *
     * @return Object
     */
    getBridge : function() {
        return this.bridge;
    },
    /**
     * Generate temaplate values object for creation of flash player plugin movie HTML
     *
     * @return Object
     */
    generateTemplateValues : function() {
        var attributesMap = {
            embed: {
                'movie':'src',
                'id':'name',
                'flashvars': 'flashVars',
                'classid':false,
                'codebase':false
            },
            object: {
                'pluginspage':false,
                'src':'movie',
                'flashvars': 'flashVars',
                'type':false,
                'inline': [
                    'type', 'classid', 'codebase', 'id', 'width', 'height',
                    'align', 'vspace', 'hspace', 'class', 'title', 'accesskey', 'name',
                    'tabindex'
                ]
            }
        };
        var embedAttributes = {};
        var objectAttributes = {};
        var parameters = {};
        $H(this.attributes).each(function(pair) {
            var attributeName = pair.key.toLowerCase();
            this.attributes[pair.key] = this.escapeAttributes(pair.value);

            // Retrieve mapped attribute names
            var attributeNameInObject = (attributesMap.object[attributeName] ? attributesMap.object[attributeName] : attributeName);
            var attributeNameInEmbed = (attributesMap.embed[attributeName] ? attributesMap.embed[attributeName] : attributeName);

            if (attributesMap.object[attributeName] !== false) {
                if (attributesMap.object.inline.indexOf(attributeNameInObject) !== -1) { // If it included in default object attribute
                    objectAttributes[attributeNameInObject] = this.attributes[pair.key];
                } else { // otherwise add it to parameters tag list
                    parameters[attributeNameInObject] = this.attributes[pair.key];
                }
            }

            if (attributesMap.embed[attributeName] !== false) { // If this attribute not ignored for flash in Gecko Browsers
                embedAttributes[attributeNameInEmbed] = this.attributes[pair.key];
            }
        }.bind(this));

        var result = {
            objectAttributes: '',
            objectParameters: '',
            embedAttributes : ''
        };


        $H(objectAttributes).each(function(pair){
             result.objectAttributes += this.attributesTemplate.evaluate({
                 name:pair.key,
                 value:pair.value
             });
        }.bind(this));

        $H(embedAttributes).each(function(pair){
             result.embedAttributes += this.attributesTemplate.evaluate({
                 name:pair.key,
                 value:pair.value
             });
        }.bind(this));

        $H(parameters).each(function(pair){
             result.objectParameters += this.parametersTemplate.evaluate({
                 name:pair.key,
                 value:pair.value
             });
        }.bind(this));

        return result;
    },
    /**
     * Escapes attributes for generation of valid HTML
     *
     * @return String
     */
    escapeAttributes: function (value) {
        if(typeof value == 'string') {
            return value.escapeHTML();
        } else {
            return value;
        }
    },
    /**
     * Detects needed flash player version
     *
     * @param Number major
     * @param Number minor
     * @param Number revision
     * @return Boolean
     */
    detectFlashVersion: function (major, minor, revision) {
        return Flex.checkFlashPlayerVersion(major, minor, revision);
    }
});

/*
Copyright 2006 Adobe Systems Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.


THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/


/*
 * The Bridge class, responsible for navigating AS instances
 */
function FABridge(target,bridgeName)
{
    this.target = target;
    this.remoteTypeCache = {};
    this.remoteInstanceCache = {};
    this.remoteFunctionCache = {};
    this.localFunctionCache = {};
    this.bridgeID = FABridge.nextBridgeID++;
    this.name = bridgeName;
    this.nextLocalFuncID = 0;
    FABridge.instances[this.name] = this;
    FABridge.idMap[this.bridgeID] = this;

    return this;
}

// type codes for packed values
FABridge.TYPE_ASINSTANCE =  1;
FABridge.TYPE_ASFUNCTION =  2;

FABridge.TYPE_JSFUNCTION =  3;
FABridge.TYPE_ANONYMOUS =   4;

FABridge.initCallbacks = {};
FABridge.userTypes = {};

FABridge.addToUserTypes = function()
{
    for (var i = 0; i < arguments.length; i++)
    {
        FABridge.userTypes[arguments[i]] = {
            'typeName': arguments[i], 
            'enriched': false
        };
    }
}

FABridge.argsToArray = function(args)
{
    var result = [];
    for (var i = 0; i < args.length; i++)
    {
        result[i] = args[i];
    }
    return result;
}

function instanceFactory(objID)
{
    this.fb_instance_id = objID;
    return this;
}

function FABridge__invokeJSFunction(args)
{  
    var funcID = args[0];
    var throughArgs = args.concat();//FABridge.argsToArray(arguments);
    throughArgs.shift();
   
    var bridge = FABridge.extractBridgeFromID(funcID);
    return bridge.invokeLocalFunction(funcID, throughArgs);
}

FABridge.addInitializationCallback = function(bridgeName, callback)
{
    var inst = FABridge.instances[bridgeName];
    if (inst != undefined)
    {
        callback.call(inst);
        return;
    }

    var callbackList = FABridge.initCallbacks[bridgeName];
    if(callbackList == null)
    {
        FABridge.initCallbacks[bridgeName] = callbackList = [];
    }

    callbackList.push(callback);
}

// updated for changes to SWFObject2
function FABridge__bridgeInitialized(bridgeName) {
    var objects = document.getElementsByTagName("object");
    var ol = objects.length;
    var activeObjects = [];
    if (ol > 0) {
        for (var i = 0; i < ol; i++) {
            if (typeof objects[i].SetVariable != "undefined") {
                activeObjects[activeObjects.length] = objects[i];
            }
        }
    }
    var embeds = document.getElementsByTagName("embed");
    var el = embeds.length;
    var activeEmbeds = [];
    if (el > 0) {
        for (var j = 0; j < el; j++) {
            if (typeof embeds[j].SetVariable != "undefined") {
                activeEmbeds[activeEmbeds.length] = embeds[j];
            }
        }
    }
    var aol = activeObjects.length;
    var ael = activeEmbeds.length;
    var searchStr = "bridgeName="+ bridgeName;
    if ((aol == 1 && !ael) || (aol == 1 && ael == 1)) {
        FABridge.attachBridge(activeObjects[0], bridgeName);     
    }
    else if (ael == 1 && !aol) {
        FABridge.attachBridge(activeEmbeds[0], bridgeName);
        }
    else {
                var flash_found = false;
        if (aol > 1) {
            for (var k = 0; k < aol; k++) {
                 var params = activeObjects[k].childNodes;
                 for (var l = 0; l < params.length; l++) {
                    var param = params[l];
                    if (param.nodeType == 1 && param.tagName.toLowerCase() == "param" && param["name"].toLowerCase() == "flashvars" && param["value"].indexOf(searchStr) >= 0) {
                        FABridge.attachBridge(activeObjects[k], bridgeName);
                            flash_found = true;
                            break;
                        }
                    }
                if (flash_found) {
                    break;
                }
            }
        }
        if (!flash_found && ael > 1) {
            for (var m = 0; m < ael; m++) {
                var flashVars = activeEmbeds[m].attributes.getNamedItem("flashVars").nodeValue;
                if (flashVars.indexOf(searchStr) >= 0) {
                    FABridge.attachBridge(activeEmbeds[m], bridgeName);
                    break;
    }
            }
        }
    }
    return true;
}

// used to track multiple bridge instances, since callbacks from AS are global across the page.

FABridge.nextBridgeID = 0;
FABridge.instances = {};
FABridge.idMap = {};
FABridge.refCount = 0;

FABridge.extractBridgeFromID = function(id)
{
    var bridgeID = (id >> 16);
    return FABridge.idMap[bridgeID];
}

FABridge.attachBridge = function(instance, bridgeName)
{

    // reuse bridge if it exists
//    var newBridgeInstance = new FABridge(instance, bridgeName);

    // reuse bridge if it exists
//    FABridge[bridgeName] = newBridgeInstance;

    if (typeof FABridge[bridgeName] == 'undefined') {
        FABridge[bridgeName] = new FABridge(instance, bridgeName);
    }

/*  FABridge[bridgeName] = function() {
        return newBridgeInstance.root();
    }
*/
    var callbacks = FABridge.initCallbacks[bridgeName];
    if (callbacks == null)
    {
        return;
    }
    for (var i = 0; i < callbacks.length; i++)
    {
//        callbacks[i].call(newBridgeInstance);
        callbacks[i].call(FABridge[bridgeName]);
    }
    
    // reuse bridge if it exists
//    delete FABridge.initCallbacks[bridgeName]
}

// some methods can't be proxied.  You can use the explicit get,set, and call methods if necessary.

FABridge.blockedMethods =
{
    toString: true,
    get: true,
    set: true,
    call: true
};

FABridge.prototype =
{


// bootstrapping

    root: function()
    {
        return this.deserialize(this.target.getRoot());
    },
//clears all of the AS objects in the cache maps
    releaseASObjects: function()
    {
        return this.target.releaseASObjects();
    },
//clears a specific object in AS from the type maps
    releaseNamedASObject: function(value)
    {
        if(typeof(value) != "object")
        {
            return false;
        }
        else
        {
            var ret =  this.target.releaseNamedASObject(value.fb_instance_id);
            return ret;
        }
    },
//create a new AS Object
    create: function(className)
    {
        return this.deserialize(this.target.create(className));
    },


    // utilities

    makeID: function(token)
    {
        return (this.bridgeID << 16) + token;
    },


    // low level access to the flash object

//get a named property from an AS object
    getPropertyFromAS: function(objRef, propName)
    {
        if (FABridge.refCount > 0)
        {
            throw new Error("You are trying to call recursively into the Flash Player which is not allowed. In most cases the JavaScript setTimeout function, can be used as a workaround.");
        }
        else
        {
            FABridge.refCount++;
            retVal = this.target.getPropFromAS(objRef, propName);
            retVal = this.handleError(retVal);
            FABridge.refCount--;
            return retVal;
        }
    },
//set a named property on an AS object
    setPropertyInAS: function(objRef,propName, value)
    {
        if (FABridge.refCount > 0)
        {
            throw new Error("You are trying to call recursively into the Flash Player which is not allowed. In most cases the JavaScript setTimeout function, can be used as a workaround.");
        }
        else
        {
            FABridge.refCount++;
            retVal = this.target.setPropInAS(objRef,propName, this.serialize(value));
            retVal = this.handleError(retVal);
            FABridge.refCount--;
            return retVal;
        }
    },

//call an AS function
    callASFunction: function(funcID, args)
    {
        if (FABridge.refCount > 0)
        {
            throw new Error("You are trying to call recursively into the Flash Player which is not allowed. In most cases the JavaScript setTimeout function, can be used as a workaround.");
        }
        else
        {
            FABridge.refCount++;
            retVal = this.target.invokeASFunction(funcID, this.serialize(args));
            retVal = this.handleError(retVal);
            FABridge.refCount--;
            return retVal;
        }
    },
//call a method on an AS object
    callASMethod: function(objID, funcName, args)
    {
        if (FABridge.refCount > 0)
        {
            throw new Error("You are trying to call recursively into the Flash Player which is not allowed. In most cases the JavaScript setTimeout function, can be used as a workaround.");
        }
        else
        {
            FABridge.refCount++;
            args = this.serialize(args);
            retVal = this.target.invokeASMethod(objID, funcName, args);
            retVal = this.handleError(retVal);
            FABridge.refCount--;
            return retVal;
        }
    },

    // responders to remote calls from flash

    //callback from flash that executes a local JS function
    //used mostly when setting js functions as callbacks on events
    invokeLocalFunction: function(funcID, args)
    {
        var result;
        var func = this.localFunctionCache[funcID];

        if(func != undefined)
        {
            result = this.serialize(func.apply(null, this.deserialize(args)));
        }

        return result;
    },

    // Object Types and Proxies
    
    // accepts an object reference, returns a type object matching the obj reference.
    getTypeFromName: function(objTypeName)
    {
        return this.remoteTypeCache[objTypeName];
    },
    //create an AS proxy for the given object ID and type
    createProxy: function(objID, typeName)
    {
        var objType = this.getTypeFromName(typeName);
            instanceFactory.prototype = objType;
            var instance = new instanceFactory(objID);
        this.remoteInstanceCache[objID] = instance;
        return instance;
    },
    //return the proxy associated with the given object ID
    getProxy: function(objID)
    {
        return this.remoteInstanceCache[objID];
    },

    // accepts a type structure, returns a constructed type
    addTypeDataToCache: function(typeData)
    {
        newType = new ASProxy(this, typeData.name);
        var accessors = typeData.accessors;
        for (var i = 0; i < accessors.length; i++)
        {
            this.addPropertyToType(newType, accessors[i]);
        }

        var methods = typeData.methods;
        for (var i = 0; i < methods.length; i++)
        {
            if (FABridge.blockedMethods[methods[i]] == undefined)
            {
                this.addMethodToType(newType, methods[i]);
            }
        }


        this.remoteTypeCache[newType.typeName] = newType;
        return newType;
    },

    //add a property to a typename; used to define the properties that can be called on an AS proxied object
    addPropertyToType: function(ty, propName)
    {
        var c = propName.charAt(0);
        var setterName;
        var getterName;
        if(c >= "a" && c <= "z")
        {
            getterName = "get" + c.toUpperCase() + propName.substr(1);
            setterName = "set" + c.toUpperCase() + propName.substr(1);
        }
        else
        {
            getterName = "get" + propName;
            setterName = "set" + propName;
        }
        ty[setterName] = function(val)
        {
            this.bridge.setPropertyInAS(this.fb_instance_id, propName, val);
        }
        ty[getterName] = function()
        {
            return this.bridge.deserialize(this.bridge.getPropertyFromAS(this.fb_instance_id, propName));
        }
    },

    //add a method to a typename; used to define the methods that can be callefd on an AS proxied object
    addMethodToType: function(ty, methodName)
    {
        ty[methodName] = function()
        {
            return this.bridge.deserialize(this.bridge.callASMethod(this.fb_instance_id, methodName, FABridge.argsToArray(arguments)));
        }
    },

    // Function Proxies

    //returns the AS proxy for the specified function ID
    getFunctionProxy: function(funcID)
    {
        var bridge = this;
        if (this.remoteFunctionCache[funcID] == null)
        {
            this.remoteFunctionCache[funcID] = function()
            {
                bridge.callASFunction(funcID, FABridge.argsToArray(arguments));
            }
        }
        return this.remoteFunctionCache[funcID];
    },
    
    //reutrns the ID of the given function; if it doesnt exist it is created and added to the local cache
    getFunctionID: function(func)
    {
        if (func.__bridge_id__ == undefined)
        {
            func.__bridge_id__ = this.makeID(this.nextLocalFuncID++);
            this.localFunctionCache[func.__bridge_id__] = func;
        }
        return func.__bridge_id__;
    },

    // serialization / deserialization

    serialize: function(value)
    {
        var result = {};

        var t = typeof(value);
        //primitives are kept as such
        if (t == "number" || t == "string" || t == "boolean" || t == null || t == undefined)
        {
            result = value;
        }
        else if (value instanceof Array)
        {
            //arrays are serializesd recursively
            result = [];
            for (var i = 0; i < value.length; i++)
            {
                result[i] = this.serialize(value[i]);
            }
        }
        else if (t == "function")
        {
            //js functions are assigned an ID and stored in the local cache 
            result.type = FABridge.TYPE_JSFUNCTION;
            result.value = this.getFunctionID(value);
        }
        else if (value instanceof ASProxy)
        {
            result.type = FABridge.TYPE_ASINSTANCE;
            result.value = value.fb_instance_id;
        }
        else
        {
            result.type = FABridge.TYPE_ANONYMOUS;
            result.value = value;
        }

        return result;
    },

    //on deserialization we always check the return for the specific error code that is used to marshall NPE's into JS errors
    // the unpacking is done by returning the value on each pachet for objects/arrays 
    deserialize: function(packedValue)
    {

        var result;

        var t = typeof(packedValue);
        if (t == "number" || t == "string" || t == "boolean" || packedValue == null || packedValue == undefined)
        {
            result = this.handleError(packedValue);
        }
        else if (packedValue instanceof Array)
        {
            result = [];
            for (var i = 0; i < packedValue.length; i++)
            {
                result[i] = this.deserialize(packedValue[i]);
            }
        }
        else if (t == "object")
        {
            for(var i = 0; i < packedValue.newTypes.length; i++)
            {
                this.addTypeDataToCache(packedValue.newTypes[i]);
            }
            for (var aRefID in packedValue.newRefs)
            {
                this.createProxy(aRefID, packedValue.newRefs[aRefID]);
            }
            if (packedValue.type == FABridge.TYPE_PRIMITIVE)
            {
                result = packedValue.value;
            }
            else if (packedValue.type == FABridge.TYPE_ASFUNCTION)
            {
                result = this.getFunctionProxy(packedValue.value);
            }
            else if (packedValue.type == FABridge.TYPE_ASINSTANCE)
            {
                result = this.getProxy(packedValue.value);
            }
            else if (packedValue.type == FABridge.TYPE_ANONYMOUS)
            {
                result = packedValue.value;
            }
        }
        return result;
    },
    //increases the reference count for the given object
    addRef: function(obj)
    {
        this.target.incRef(obj.fb_instance_id);
    },
    //decrease the reference count for the given object and release it if needed
    release:function(obj)
    {
        this.target.releaseRef(obj.fb_instance_id);
    },

    // check the given value for the components of the hard-coded error code : __FLASHERROR
    // used to marshall NPE's into flash
    
    handleError: function(value)
    {
        if (typeof(value)=="string" && value.indexOf("__FLASHERROR")==0)
        {
            var myErrorMessage = value.split("||");
            if(FABridge.refCount > 0 )
            {
                FABridge.refCount--;
            }
            throw new Error(myErrorMessage[1]);
            return value;
        }
        else
        {
            return value;
        }   
    }
};

// The root ASProxy class that facades a flash object

ASProxy = function(bridge, typeName)
{
    this.bridge = bridge;
    this.typeName = typeName;
    return this;
};
//methods available on each ASProxy object
ASProxy.prototype =
{
    get: function(propName)
    {
        return this.bridge.deserialize(this.bridge.getPropertyFromAS(this.fb_instance_id, propName));
    },

    set: function(propName, value)
    {
        this.bridge.setPropertyInAS(this.fb_instance_id, propName, value);
    },

    call: function(funcName, args)
    {
        this.bridge.callASMethod(this.fb_instance_id, funcName, args);
    }, 
    
    addRef: function() {
        this.bridge.addRef(this);
    }, 
    
    release: function() {
        this.bridge.release(this);
    }
};

/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Mage
 * @package     Mage_Adminhtml
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */

if(!window.Flex) {
    alert('Flex library not loaded');
} else {
    Flex.Uploader = Class.create();
    Flex.Uploader.prototype = {
        flex: null,
        uploader:null,
        filters:null,
        containerId:null,
        flexContainerId:null,
        container:null,
        files:null,
        fileRowTemplate:null,
        fileProgressTemplate:null,
        templatesPattern: /(^|.|\r|\n)(\{\{(.*?)\}\})/,
        onFilesComplete: false,
        onFileProgress: true,
        onFileRemove: false,
        onContainerHideBefore:null,
        initialize: function(containerId, uploaderSrc, config) {
            this.containerId = containerId;
            this.container   = $(containerId);

            this.container.controller = this;

            this.config = config;

            this.flexContainerId = this.containerId + '-flash';
            Element.insert(
                // window.document.body,
                this.containerId,
                {'before':'<div id="'+this.flexContainerId+'" class="flex" style="position:relative;float:right;"></div>'}
            );
            flexWidth = 230;
            if (this.config.width) {
                flexWidth = this.config.width;
            }
            this.flex = new Flex.Object({
                left: 100,
                top: 300,
                width:  flexWidth,
                height: 20,
                src:    uploaderSrc,
                wmode: 'transparent'
            });
            // this.getInnerElement('browse').disabled = true;
            // this.getInnerElement('upload').disabled = true;
            this.fileRowTemplate = new Template(
                this.getInnerElement('template').innerHTML,
                this.templatesPattern
            );

            this.fileProgressTemplate = new Template(
                this.getInnerElement('template-progress').innerHTML,
                this.templatesPattern
            );

            this.flex.onBridgeInit = this.handleBridgeInit.bind(this);
            if (this.flex.detectFlashVersion(9, 0, 28)) {
                this.flex.apply(this.flexContainerId);
            } else {
                // this.getInnerElement('browse').hide();
                // this.getInnerElement('upload').hide();
                this.getInnerElement('install-flash').show();
            }
            this.onContainerHideBefore = this.handleContainerHideBefore.bind(this);
        },
        getInnerElement: function(elementName) {
            return $(this.containerId + '-' + elementName);
        },
        getFileId: function(file) {
            var id;
            if(typeof file == 'object') {
                id = file.id;
            } else {
                id = file;
            }
            return this.containerId + '-file-' + id;
        },
        getDeleteButton: function(file) {
            return $(this.getFileId(file) + '-delete');
        },
        handleBridgeInit: function() {
            this.uploader = this.flex.getBridge().getUpload();
            if (this.config.filters) {
                $H(this.config.filters).each(function(pair) {
                    this.uploader.addTypeFilter(pair.key, pair.value.label, pair.value.files);
                }.bind(this));
                delete(this.config.filters);
                this.uploader.setUseTypeFilter(true);
            }

            this.uploader.setConfig(this.config);
            this.uploader.addEventListener('select',    this.handleSelect.bind(this));
            this.uploader.addEventListener('complete',  this.handleComplete.bind(this));
            this.uploader.addEventListener('progress',  this.handleProgress.bind(this));
            this.uploader.addEventListener('error',     this.handleError.bind(this));
            this.uploader.addEventListener('removeall', this.handleRemoveAll.bind(this));
            // this.getInnerElement('browse').disabled = false;
            // this.getInnerElement('upload').disabled = false;
        },
        browse: function() {
            this.uploader.browse();
        },
        upload: function() {
            this.uploader.upload();
            this.files = this.uploader.getFilesInfo();
            this.updateFiles();
        },
        removeFile: function(id) {
            this.uploader.removeFile(id);
            $(this.getFileId(id)).remove();
            if (this.onFileRemove) {
                this.onFileRemove(id);
            }
            this.files = this.uploader.getFilesInfo();
            this.updateFiles();
        },
        removeAllFiles: function() {
            this.files.each(function(file) {
                this.removeFile(file.id);
            }.bind(this));
            this.files = this.uploader.getFilesInfo();
            this.updateFiles();
        },
        handleSelect: function (event) {
            this.files = event.getData().files;
            this.checkFileSize();
            this.updateFiles();
            this.getInnerElement('upload').show();
            if (this.onFileSelect) {
                this.onFileSelect();
            }
        },
        handleProgress: function (event) {
            var file = event.getData().file;
            this.updateFile(file);
            if (this.onFileProgress) {
                this.onFileProgress(file);
            }
        },
        handleError: function (event) {
            this.updateFile(event.getData().file);
        },
        handleComplete: function (event) {
            this.files = event.getData().files;
            this.updateFiles();
            if (this.onFilesComplete) {
                this.onFilesComplete(this.files);
            }
        },
        handleRemoveAll: function (event) {
            this.files.each(function(file) {
                $(this.getFileId(file.id)).remove();
            }.bind(this));
            if (this.onFileRemoveAll) {
                this.onFileRemoveAll();
            }
            this.files = this.uploader.getFilesInfo();
            this.updateFiles();
        },
        handleRemove: function (event) {
            this.files = this.uploader.getFilesInfo();
            this.updateFiles();
        },
        updateFiles: function () {
            this.files.each(function(file) {
                this.updateFile(file);
            }.bind(this));
        },
        updateFile:  function (file) {
            if (!$(this.getFileId(file))) {
                if (this.config.replace_browse_with_remove) {
                    $(this.containerId+'-new').show();
                    $(this.containerId+'-new').innerHTML = this.fileRowTemplate.evaluate(this.getFileVars(file));
                    $(this.containerId+'-old').hide();
                    this.flex.getBridge().hideBrowseButton();
                } else {
                    Element.insert(this.container, {bottom: this.fileRowTemplate.evaluate(this.getFileVars(file))});
                }
            }
            if (file.status == 'full_complete' && file.response.isJSON()) {
                var response = file.response.evalJSON();
                if (typeof response == 'object') {
                    if (typeof response.cookie == 'object') {
                        var date = new Date();
                        date.setTime(date.getTime()+(parseInt(response.cookie.lifetime)*1000));

                        document.cookie = escape(response.cookie.name) + "="
                            + escape(response.cookie.value)
                            + "; expires=" + date.toGMTString()
                            + (response.cookie.path.blank() ? "" : "; path=" + response.cookie.path)
                            + (response.cookie.domain.blank() ? "" : "; domain=" + response.cookie.domain);
                    }
                    if (typeof response.error != 'undefined' && response.error != 0) {
                        file.status = 'error';
                        file.errorText = response.error;
                    }
                }
            }

            if (file.status == 'full_complete' && !file.response.isJSON()) {
                file.status = 'error';
            }

            var progress = $(this.getFileId(file)).getElementsByClassName('progress-text')[0];
            if ((file.status=='progress') || (file.status=='complete')) {
                $(this.getFileId(file)).addClassName('progress');
                $(this.getFileId(file)).removeClassName('new');
                $(this.getFileId(file)).removeClassName('error');
                if (file.progress && file.progress.total) {
                    progress.update(this.fileProgressTemplate.evaluate(this.getFileProgressVars(file)));
                } else {
                    progress.update('');
                }
                if (! this.config.replace_browse_with_remove) {
                    this.getDeleteButton(file).hide();
                }
            } else if (file.status=='error') {
                $(this.getFileId(file)).addClassName('error');
                $(this.getFileId(file)).removeClassName('progress');
                $(this.getFileId(file)).removeClassName('new');
                var errorText = file.errorText ? file.errorText : this.errorText(file);
                if (this.config.replace_browse_with_remove) {
                    this.flex.getBridge().hideBrowseButton();
                } else {
                    this.getDeleteButton(file).show();
                }

                progress.update(errorText);

            } else if (file.status=='full_complete') {
                $(this.getFileId(file)).addClassName('complete');
                $(this.getFileId(file)).removeClassName('progress');
                $(this.getFileId(file)).removeClassName('error');
                if (this.config.replace_browse_with_remove) {
                    this.flex.getBridge().hideRemoveButton();
                }
                progress.update(this.translate('Complete'));
            }
        },
        getDebugStr: function(obj) {
             return Object.toJSON(obj).replace('&', '&amp;').replace('>', '&gt;').replace('<', '&lt;');
        },
        getFileVars: function(file) {
            return {
                id      : this.getFileId(file),
                fileId  : file.id,
                name    : file.name,
                size    : this.formatSize(file.size)
            };
        },
        getFileProgressVars: function(file) {
            return {
                total    : this.formatSize(file.progress.total),
                uploaded : this.formatSize(file.progress.loaded),
                percent  : this.round((file.progress.loaded/file.progress.total)*100)
            };
        },
        formatSize: function(size) {
            if (size > 1024 * 1024 * 1024 * 1024) {
                return this.round(size / (1024 * 1024 * 1024 * 1024)) + ' ' + this.translate('TB');
            } else if (size > 1024 * 1024 * 1024) {
                return this.round(size / (1024 * 1024 * 1024)) + ' ' + this.translate('GB');
            } else if (size > 1024 * 1024) {
                return this.round(size / (1024 * 1024)) + ' ' + this.translate('MB');
            } else if (size > 1024) {
                return this.round(size / (1024)) + ' ' + this.translate('kB');
            }
            return size + ' ' + this.translate('B');
        },
        round: function(number) {
            return Math.round(number*100)/100;
        },
        checkFileSize: function() {
            newFiles = [];
            hasTooBigFiles = false;
            this.files.each(function(file){
                if (file.size > maxUploadFileSizeInBytes) {
                    hasTooBigFiles = true;
                    this.uploader.removeFile(file.id)
                } else {
                    newFiles.push(file)
                }
            }.bind(this));
            this.files = newFiles;
            if (hasTooBigFiles) {
                alert(
                    this.translate('Maximum allowed file size for upload is')+' '+maxUploadFileSize+".\n"+this.translate('Please check your server PHP settings.')
                );
            }
        },
        translate: function(text) {
            try {
                if(Translator){
                   return Translator.translate(text);
                }
            }
            catch(e){}
            return text;
        },
        errorText: function(file) {
            var error = '';

            switch(file.errorCode) {
                case 1: // Size 0
                    error = 'File size should be more than 0 bytes';
                    break;
                case 2: // Http error
                    error = 'Upload HTTP Error';
                    break;
                case 3: // I/O error
                    error = 'Upload I/O Error';
                    break;
                case 4: // Security error
                    error = 'Upload Security Error';
                    break;
                case 5: // SSL self-signed certificate
                    error = 'SSL Error: Invalid or self-signed certificate';
                    break;
            }

            if(error) {
                return this.translate(error);
            }

            return error;
        },
        handleContainerHideBefore: function(container) {
            if (container && Element.descendantOf(this.container, container) && !this.checkAllComplete()) {
                if (! confirm('There are files that were selected but not uploaded yet. After switching to another tab your selections will be lost. Do you wish to continue ?')) {
                    return 'cannotchange';
                } else {
                    this.removeAllFiles();
                }
            }
        },
        checkAllComplete: function() {
            if (this.files) {
                return !this.files.any(function(file) {
                    return (file.status !== 'full_complete')
                });
            }
            return true;
        }
    }
}

/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magento.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magento.com for more information.
 *
 * @category    Mage
 * @package     Mage_Adminhtml
 * @copyright   Copyright (c) 2006-2016 X.commerce, Inc. and affiliates (http://www.magento.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */
MediabrowserUtility = {
    openDialog: function(url, width, height, title, options) {
        if ($('browser_window') && typeof(Windows) != 'undefined') {
            Windows.focus('browser_window');
            return;
        }
        this.dialogWindow = Dialog.info(null, Object.extend({
            closable:     true,
            resizable:    false,
            draggable:    true,
            className:    'magento',
            windowClassName:    'popup-window',
            title:        title || 'Insert File...',
            top:          50,
            width:        width || 950,
            height:       height || 600,
            zIndex:       options && options.zIndex || 1000,
            recenterAuto: false,
            hideEffect:   Element.hide,
            showEffect:   Element.show,
            id:           'browser_window',
            onClose: this.closeDialog.bind(this)
        }, options || {}));
        new Ajax.Updater('modal_dialog_message', url, {evalScripts: true});
    },
    closeDialog: function(window) {
        if (!window) {
            window = this.dialogWindow;
        }
        if (window) {
            // IE fix - hidden form select fields after closing dialog
            WindowUtilities._showSelect();
            window.close();
        }
    }
};

Mediabrowser = Class.create();
Mediabrowser.prototype = {
    targetElementId: null,
    contentsUrl: null,
    onInsertUrl: null,
    newFolderUrl: null,
    deleteFolderUrl: null,
    deleteFilesUrl: null,
    headerText: null,
    tree: null,
    currentNode: null,
    storeId: null,
    initialize: function (setup) {
        this.newFolderPrompt = setup.newFolderPrompt;
        this.deleteFolderConfirmationMessage = setup.deleteFolderConfirmationMessage;
        this.deleteFileConfirmationMessage = setup.deleteFileConfirmationMessage;
        this.targetElementId = setup.targetElementId;
        this.contentsUrl = setup.contentsUrl;
        this.onInsertUrl = setup.onInsertUrl;
        this.newFolderUrl = setup.newFolderUrl;
        this.deleteFolderUrl = setup.deleteFolderUrl;
        this.deleteFilesUrl = setup.deleteFilesUrl;
        this.headerText = setup.headerText;
    },
    setTree: function (tree) {
        this.tree = tree;
        this.currentNode = tree.getRootNode();
    },

    getTree: function (tree) {
        return this.tree;
    },

    selectFolder: function (node, event) {
        this.currentNode = node;
        this.hideFileButtons();
        this.activateBlock('contents');

        if(node.id == 'root') {
            this.hideElement('button_delete_folder');
        } else {
            this.showElement('button_delete_folder');
        }

        this.updateHeader(this.currentNode);
        this.drawBreadcrumbs(this.currentNode);

        this.showElement('loading-mask');
        new Ajax.Request(this.contentsUrl, {
            parameters: {node: this.currentNode.id},
            evalJS: true,
            onSuccess: function(transport) {
                try {
                    this.currentNode.select();
                    this.onAjaxSuccess(transport);
                    this.hideElement('loading-mask');
                    if ($('contents') != undefined) {
                        $('contents').update(transport.responseText);
                        $$('div.filecnt').each(function(s) {
                            Event.observe(s.id, 'click', this.selectFile.bind(this));
                            Event.observe(s.id, 'dblclick', this.insert.bind(this));
                        }.bind(this));
                    }
                } catch(e) {
                    alert(e.message);
                }
            }.bind(this)
        });
    },

    selectFolderById: function (nodeId) {
        var node = this.tree.getNodeById(nodeId);
        if (node.id) {
            this.selectFolder(node);
        }
    },

    selectFile: function (event) {
        var div = Event.findElement(event, 'DIV');
        $$('div.filecnt.selected[id!="' + div.id + '"]').each(function(e) {
            e.removeClassName('selected');
        })
        div.toggleClassName('selected');
        if(div.hasClassName('selected')) {
            this.showFileButtons();
        } else {
            this.hideFileButtons();
        }
    },

    showFileButtons: function () {
        this.showElement('button_delete_files');
        this.showElement('button_insert_files');
    },

    hideFileButtons: function () {
        this.hideElement('button_delete_files');
        this.hideElement('button_insert_files');
    },

    handleUploadComplete: function(files) {
        $$('div[class*="file-row complete"]').each(function(e) {
            $(e.id).remove();
        });
        this.selectFolder(this.currentNode);
    },

    insert: function(event) {
        var div;
        if (event != undefined) {
            div = Event.findElement(event, 'DIV');
        } else {
            $$('div.selected').each(function (e) {
                div = $(e.id);
            });
        }
        if ($(div.id) == undefined) {
            return false;
        }
        var targetEl = this.getTargetElement();
        if (! targetEl) {
            alert("Target element not found for content update");
            Windows.close('browser_window');
            return;
        }

        var params = {filename:div.id, node:this.currentNode.id, store:this.storeId};

        if (targetEl.tagName.toLowerCase() == 'textarea') {
            params.as_is = 1;
        }

        new Ajax.Request(this.onInsertUrl, {
            parameters: params,
            onSuccess: function(transport) {
                try {
                    this.onAjaxSuccess(transport);
                    if (this.getMediaBrowserOpener()) {
                        self.blur();
                    }
                    Windows.close('browser_window');
                    if (targetEl.tagName.toLowerCase() == 'input') {
                        targetEl.value = transport.responseText;
                    } else {
                        updateElementAtCursor(targetEl, transport.responseText);
                        if (varienGlobalEvents) {
                            varienGlobalEvents.fireEvent('tinymceChange');
                        }
                    }
                } catch (e) {
                    alert(e.message);
                }
            }.bind(this)
        });
    },

    /**
     * Find document target element in next order:
     *  in acive file browser opener:
     *  - input field with ID: "src" in opener window
     *  - input field with ID: "href" in opener window
     *  in document:
     *  - element with target ID
     *
     * return HTMLelement | null
     */
    getTargetElement: function() {
        if (typeof(tinyMCE) != 'undefined' && tinyMCE.get(this.targetElementId)) {
            if ((opener = this.getMediaBrowserOpener())) {
                var targetElementId = tinyMceEditors.get(this.targetElementId).getMediaBrowserTargetElementId();
                return opener.document.getElementById(targetElementId);
            } else {
                return null;
            }
        } else {
            return document.getElementById(this.targetElementId);
        }
    },

    /**
     * Return opener Window object if it exists, not closed and editor is active
     *
     * return object | null
     */
    getMediaBrowserOpener: function() {
         if (typeof(tinyMCE) != 'undefined'
             && tinyMCE.get(this.targetElementId)
             && typeof(tinyMceEditors) != 'undefined'
             && ! tinyMceEditors.get(this.targetElementId).getMediaBrowserOpener().closed) {
             return tinyMceEditors.get(this.targetElementId).getMediaBrowserOpener();
         } else {
             return null;
         }
    },

    newFolder: function() {
        var folderName = prompt(this.newFolderPrompt);
        if (!folderName) {
            return false;
        }
        new Ajax.Request(this.newFolderUrl, {
            parameters: {name: folderName},
            onSuccess: function(transport) {
                try {
                    this.onAjaxSuccess(transport);
                    if (transport.responseText.isJSON()) {
                        var response = transport.responseText.evalJSON()
                        var newNode = new Ext.tree.AsyncTreeNode({
                            text: response.short_name,
                            draggable:false,
                            id:response.id,
                            expanded: true
                        });
                        var child = this.currentNode.appendChild(newNode);
                        this.tree.expandPath(child.getPath(), '', function(success, node) {
                            this.selectFolder(node);
                        }.bind(this));
                    }
                } catch (e) {
                    alert(e.message);
                }
            }.bind(this)
        })
    },

    deleteFolder: function() {
        if (!confirm(this.deleteFolderConfirmationMessage)) {
            return false;
        }
        new Ajax.Request(this.deleteFolderUrl, {
            onSuccess: function(transport) {
                try {
                    this.onAjaxSuccess(transport);
                    var parent = this.currentNode.parentNode;
                    parent.removeChild(this.currentNode);
                    this.selectFolder(parent);
                }
                catch (e) {
                    alert(e.message);
                }
            }.bind(this)
        })
    },

    deleteFiles: function() {
        if (!confirm(this.deleteFileConfirmationMessage)) {
            return false;
        }
        var ids = [];
        var i = 0;
        $$('div.selected').each(function (e) {
            ids[i] = e.id;
            i++;
        });
        new Ajax.Request(this.deleteFilesUrl, {
            parameters: {files: Object.toJSON(ids)},
            onSuccess: function(transport) {
                try {
                    this.onAjaxSuccess(transport);
                    this.selectFolder(this.currentNode);
                } catch(e) {
                    alert(e.message);
                }
            }.bind(this)
        });
    },

    drawBreadcrumbs: function(node) {
        if ($('breadcrumbs') != undefined) {
            $('breadcrumbs').remove();
        }
        if (node.id == 'root') {
            return;
        }
        var path = node.getPath().split('/');
        var breadcrumbs = '';
        for(var i = 0, length = path.length; i < length; i++) {
            if (path[i] == '') {
                continue;
            }
            var currNode = this.tree.getNodeById(path[i]);
            if (currNode.id) {
                breadcrumbs += '<li>';
                breadcrumbs += '<a href="#" onclick="MediabrowserInstance.selectFolderById(\'' + currNode.id + '\');">' + currNode.text + '</a>';
                if(i < (length - 1)) {
                    breadcrumbs += ' <span>/</span>';
                }
                breadcrumbs += '</li>';
            }
        }

        if (breadcrumbs != '') {
            breadcrumbs = '<ul class="breadcrumbs" id="breadcrumbs">' + breadcrumbs + '</ul>';
            $('content_header').insert({after: breadcrumbs});
        }
    },

    updateHeader: function(node) {
        var header = (node.id == 'root' ? this.headerText : node.text);
        if ($('content_header_text') != undefined) {
            $('content_header_text').innerHTML = header;
        }
    },

    activateBlock: function(id) {
        //$$('div [id^=contents]').each(this.hideElement);
        this.showElement(id);
    },

    hideElement: function(id) {
        if ($(id) != undefined) {
            $(id).addClassName('no-display');
            $(id).hide();
        }
    },

    showElement: function(id) {
        if ($(id) != undefined) {
            $(id).removeClassName('no-display');
            $(id).show();
        }
    },

    onAjaxSuccess: function(transport) {
        if (transport.responseText.isJSON()) {
            var response = transport.responseText.evalJSON()
            if (response.error) {
                throw response;
            } else if (response.ajaxExpired && response.ajaxRedirect) {
                setLocation(response.ajaxRedirect);
            }
        }
    }
}

jQuery.noConflict();
var CommerceLab = {};
/**
 * Unicode Systems
 * @category   Uni
 * @package    Uni_Fileuploader
 * @copyright  Copyright (c) 2010-2011 Unicode Systems. (http://www.unicodesystems.in)
 * @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */
function playerOpen(soundfiledesc,soundfilepath) {
    var UniqueID = 100; // Make each link open in a new window
    var newWinOffset = 300; // Position of first pop-up
    PlayWin = window.open('',UniqueID,'width=320,height=160,top=' + newWinOffset +',left=500,resizable=1,scrollbars=1,titlebar=0,toolbar=0,menubar=0,status=0,directories=0,personalbar=0');
    PlayWin.focus();

    var winContent = "<HTML><HEAD><TITLE>" + soundfiledesc + "</TITLE><style>.form-button-alt{background-color:#618499; border:1px solid #406A83;color:#FFFFFF; cursor:pointer; font-family:arial,sans-serif !important; font-size:12px !important; font-size-adjust:none !important; font-stretch:normal !important; font-style:normal !important; font-variant:normal !important; font-weight:bold !important; line-height:normal !important; overflow:visible; padding:1px 8px; text-align:center; vertical-align:middle; width:auto;}</style></HEAD><BODY bgcolor='#FAF7EE'>";
    winContent += "<p style='font-weight: bold; font-size:15px; color:#E26703; font-family:Verdana,sans-serif; line-height:1.5; clear: both;'>" + soundfiledesc + "</p>";

    winContent += "<OBJECT width='300' height='42'>";
    winContent += "<param name='SRC' value='" + soundfilepath + "'>";
    winContent += "<param name='AUTOPLAY' VALUE='true'>";
    winContent += "<param name='CONTROLLER' VALUE='true'>";
    winContent += "<param name='BGCOLOR' VALUE='#faf7ee'>";
    winContent += "<EMBED SRC='" + soundfilepath + "' AUTOSTART='TRUE' LOOP='FALSE' WIDTH='300' HEIGHT='42' CONTROLLER='TRUE' BGCOLOR='#faf7ee'></EMBED>";
    winContent += "</OBJECT>";

    winContent += "<DIV align='center' style='margin-top: 3px; clear: both;'><button onclick='javascript:window.close();' class='form-button-alt' type='button'><span>Close</span></button></DIV>";
    winContent += "</BODY></HTML>";

    PlayWin.document.write(winContent);
    PlayWin.document.close(); // "Finalizes" new window
    UniqueID = UniqueID + 0 // set to "1" to make each link open in new window
    newWinOffset = newWinOffset + 0 // subsequent pop-ups will be this many pixels lower
}
function playerAviOpen(soundfiledesc,soundfilepath) {
    var UniqueID = 100; // Make each link open in a new window
    var newWinOffset = 300; // Position of first pop-up
    PlayWin = window.open('',UniqueID,'width=350,height=360,top=' + newWinOffset +',left=500,resizable=1,scrollbars=1,titlebar=0,toolbar=0,menubar=0,status=0,directories=0,personalbar=0');
    PlayWin.focus();

    var winContent = "<HTML><HEAD><TITLE>" + soundfiledesc + "</TITLE><style>.form-button-alt{background-color:#618499; border:1px solid #406A83;color:#FFFFFF; cursor:pointer; font-family:arial,sans-serif !important; font-size:12px !important; font-size-adjust:none !important; font-stretch:normal !important; font-style:normal !important; font-variant:normal !important; font-weight:bold !important; line-height:normal !important; overflow:visible; padding:1px 8px; text-align:center; vertical-align:middle; width:auto;}</style></HEAD><BODY bgcolor='#FAF7EE'>";
    winContent += "<p style='font-weight: bold; font-size:15px; color:#E26703; font-family:Verdana,sans-serif; line-height:1.5; clear: both;'>" + soundfiledesc + "</p>";

    winContent += "<object type='video/quicktime' data='"+soundfilepath+"' width='320' height='280'>";
    winContent += "<param name='pluginurl' value='http://www.apple.com/quicktime/download/' />";
    winContent += "<param name='controller' value='true' />";
    winContent += "<param name='autoplay' value='true' />";
    winContent += "<param name='BGCOLOR' VALUE='#faf7ee'>";
    winContent += "</object>";
    //winContentie += "<object classid='clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B' codebase='http://www.apple.com/qtactivex/qtplugin.cab' width='624' height='352'><param name='src' value='"+soundfilepath+"'/><param name='controller' value='false' /><param name='autoplay' value='true' /></object>";

    winContent += "<DIV align='center' style='margin-top: 3px; clear: both;'><button onclick='javascript:window.close();' class='form-button-alt' type='button'><span>Close</span></button></DIV>";
    winContent += "</BODY></HTML>";

    PlayWin.document.write(winContent);
    PlayWin.document.close(); // "Finalizes" new window
    UniqueID = UniqueID + 0 // set to "1" to make each link open in new window
    newWinOffset = newWinOffset + 0 // subsequent pop-ups will be this many pixels lower
}
function playerFlvOpen(soundfiledesc,soundfilepath,soundPlayerPath) {
    var UniqueID = 100; // Make each link open in a new window
    var newWinOffset = 300; // Position of first pop-up
    PlayWin = window.open('',UniqueID,'width=350,height=360,top=' + newWinOffset +',left=500,resizable=1,scrollbars=1,titlebar=0,toolbar=0,menubar=0,status=0,directories=0,personalbar=0');
    PlayWin.focus();

    var winContent = "<HTML><HEAD><TITLE>" + soundfiledesc + "</TITLE><style>.form-button-alt{background-color:#618499; border:1px solid #406A83;color:#FFFFFF; cursor:pointer; font-family:arial,sans-serif !important; font-size:12px !important; font-size-adjust:none !important; font-stretch:normal !important; font-style:normal !important; font-variant:normal !important; font-weight:bold !important; line-height:normal !important; overflow:visible; padding:1px 8px; text-align:center; vertical-align:middle; width:auto;}</style></HEAD><BODY bgcolor='#FAF7EE'>";
    winContent += "<p style='font-weight: bold; font-size:15px; color:#E26703; font-family:Verdana,sans-serif; line-height:1.5; clear: both;'>" + soundfiledesc + "</p>";

    winContent += '<embed width="320" height="280" flashvars="height=280&width=320&displayheight=280&file='+soundfilepath+'&image='+soundPlayerPath+'bg.jpg&backcolor=0x333333&frontcolor=0xaaaaaa&lightcolor=0xeeeeee&link='+soundfilepath+'&amp;showstop=true&volume=100&callback=analytics" allowfullscreen="true" allowscriptaccess="always" wmode="transparent" quality="high" name="player1" id="player1" src="'+soundPlayerPath+'player.swf" type="application/x-shockwave-flash"></embed>';

    winContent += "<DIV align='center' style='margin-top: 3px; clear: both;'><button onclick='javascript:window.close();' class='form-button-alt' type='button'><span>Close</span></button></DIV>";
    winContent += "</BODY></HTML>";

    PlayWin.document.write(winContent);
    PlayWin.document.close(); // "Finalizes" new window
    UniqueID = UniqueID + 0 // set to "1" to make each link open in new window
    newWinOffset = newWinOffset + 0 // subsequent pop-ups will be this many pixels lower
}
function playerMovOpen(soundfiledesc,soundfilepath) {
    var UniqueID = 100; // Make each link open in a new window
    var newWinOffset = 300; // Position of first pop-up
    PlayWin = window.open('',UniqueID,'width=320,height=360,top=' + newWinOffset +',left=500,resizable=1,scrollbars=1,titlebar=0,toolbar=0,menubar=0,status=0,directories=0,personalbar=0');
    PlayWin.focus();

    var winContent = "<HTML><HEAD><TITLE>" + soundfiledesc + "</TITLE><style>.form-button-alt{background-color:#618499; border:1px solid #406A83;color:#FFFFFF; cursor:pointer; font-family:arial,sans-serif !important; font-size:12px !important; font-size-adjust:none !important; font-stretch:normal !important; font-style:normal !important; font-variant:normal !important; font-weight:bold !important; line-height:normal !important; overflow:visible; padding:1px 8px; text-align:center; vertical-align:middle; width:auto;}</style></HEAD><BODY bgcolor='#FAF7EE'>";
    winContent += "<p style='font-weight: bold; font-size:15px; color:#E26703; font-family:Verdana,sans-serif; line-height:1.5; clear: both;'>" + soundfiledesc + "</p>";

    winContent += "<OBJECT width='320' height='280'>";
    winContent += "<param name='SRC' value='" + soundfilepath + "'>";
    winContent += "<param name='AUTOPLAY' VALUE='true'>";
    winContent += "<param name='CONTROLLER' VALUE='true'>";
    winContent += "<param name='BGCOLOR' VALUE='#faf7ee'>";
    winContent += "<EMBED SRC='" + soundfilepath + "' AUTOSTART='TRUE' LOOP='FALSE' WIDTH='300' HEIGHT='280' CONTROLLER='TRUE' BGCOLOR='#faf7ee'></EMBED>";
    winContent += "</OBJECT>";

    winContent += "<DIV align='center' style='margin-top: 3px; clear: both;'><button onclick='javascript:window.close();' class='form-button-alt' type='button'><span>Close</span></button></DIV>";
    winContent += "</BODY></HTML>";

    PlayWin.document.write(winContent);
    PlayWin.document.close(); // "Finalizes" new window
    UniqueID = UniqueID + 0 // set to "1" to make each link open in new window
    newWinOffset = newWinOffset + 0 // subsequent pop-ups will be this many pixels lower
}

function fileUploaderPopup1(options){
    this.options = {
        title: '_blank',
        url: '#',
        width: 600,
        height: 500
    }
    Object.extend(this.options, options || {});
    window.open(this.options.url, this.options.title, 'width='+this.options.width+',height='+this.options.height);
}


var fileUploaderPopup = {
    open: function(options)
    {
        this.options = {
            url: '#',
            width: 600,
            height: 500,
            name:"_blank",
            location:"no",
            menubar:"no",
            toolbar:"no",
            status:"yes",
            scrollbars:"yes",
            resizable:"yes",
            left:"",
            top:"",
            normal:false
        }
        Object.extend(this.options, options || {});

        if (this.options.normal){
            this.options.menubar = "yes";
            this.options.status = "yes";
            this.options.toolbar = "yes";
            this.options.location = "yes";
        }

        this.options.width = this.options.width < screen.availWidth?this.options.width:screen.availWidth;
        this.options.height=this.options.height < screen.availHeight?this.options.height:screen.availHeight;
        var openoptions = 'width='+this.options.width+',height='+this.options.height+',location='+this.options.location+',menubar='+this.options.menubar+',toolbar='+this.options.toolbar+',scrollbars='+this.options.scrollbars+',resizable='+this.options.resizable+',status='+this.options.status
        if (this.options.top!="")openoptions+=",top="+this.options.top;
        if (this.options.left!="")openoptions+=",left="+this.options.left;
        window.open(this.options.url, this.options.name,openoptions );
        return false;
    }
}


window.boo = window.boo || {};

/**
 * location : {
 *   path: "hello/world",
 *   query_params: {}
 * }
 * 
 * rules: [{rule: "", page: ""}]
 * handler : function(page, params({uri: {}, query: {}}), tail) {
 *  
 * }
 */
boo.route = function(location, rules, handler) {

  function mm (matched) {
    if (!matched) {
      return null;
    }
    if (matched['input']) {
      matched.splice(0, 1);
      delete(matched['input']);
      delete(matched['groups']);
      delete(matched['index']);
    }
    return matched;
  }

  function regexp(rule) {
    let ids = mm(rule.match(/(:\w+)/g));
    rule = rule.replace(/(:\w+)/g, '([^\/]+)');
    return {
      ids: ids,
      regexp: new RegExp('^'+rule.replace(/\//, '\/'))
    }
  };

  function url_params(params, ids)
  {
    let result = {};
    for(var i in params) {
      result[ids[i].replace(":", "")] = params[i];
    }

    return result;
  }

  function match(rule, path) {
    let r = regexp(rule);
    let matched = path.match(r.regexp);
    if (matched == null) {
      return false;
    }
    let res = {};
    res.url_params = url_params(mm(matched), r.ids) 
    res.tail = path.replace(r.regexp, "");

    return res;
  };

  if (location.path == "" || location.path == "/") {
    return handler("__root", {uri: {}, query: location.query}, "");
  }
  for(var i in rules) {
      var r = match(rules[i].rule, location.path);
      if (r !== false) {
        handler(rules[i].page, {
          uri: r.url_params,
          query: location.query
        }, {
          path: r.tail,
          query: location.query
        });
        return;
      }
  }
  handler("__not_found", {uri: {}, query: location.query}, "");
};

boo.location = function(on_changed) {
  boo.location.onchange = on_changed;
  window.addEventListener("location-changed", boo.location.reload);
  window.addEventListener("popstate", boo.location.reload);
  boo.location.reload();
};

boo.location.go = function(url) {
  history.pushState({}, '', boo.location.full_url(url));
  window.dispatchEvent(new CustomEvent("location-changed"));
}

boo.location.full_url = function(url) {
  if (!url || url && url.length == 0) {
    url = '/';
  } else if (url.length > 0 && url[0] != '/') {
    let base = window.location.pathname;
    if (base[base.length - 1] != '/') {
      base += '/';
    }
    url = base + url;
  }

  return url;
}

boo.location.replace = function(url) {
  history.replaceState({}, '', boo.location.full_url(url));
  window.dispatchEvent(new CustomEvent("location-changed"));
}

boo.location.reload = function() {
  var query = boo.location.decode_query_params(window.location.search.substr(1));
  boo.location.onchange(decodeURIComponent(window.location.pathname), query, decodeURIComponent(window.location.hash));
}

boo.location.encode_query_params = function(params)
{
  var encodedParams = [];

  for (var key in params) {
    var value = params[key];
    if (value === '') {
      encodedParams.push(encodeURIComponent(key));
    } else if (value) {
      encodedParams.push(
          encodeURIComponent(key) + '=' +
          encodeURIComponent(value.toString()));
    }
  }
  return encodedParams.join('&');
}

boo.location.decode_query_params = function(query)
{
    var params = {};
    query = (query || '').replace(/\+/g, '%20');
    var paramList = query.split('&');
    for (var i = 0; i < paramList.length; i++) {
      var param = paramList[i].split('=');
      if (param[0]) {
        params[decodeURIComponent(param[0])] =
            decodeURIComponent(param[1] || '');
      }
    }

    return params;
}
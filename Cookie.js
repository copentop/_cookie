/**
 * Cookie get/set 操作 
 *
 */

;(function(root, factory) {
	// 运行环境支持
	if (typeof define === 'function' && define.amd) {
        	// AMD. Register as an anonymous module.
		define([], factory);
	} else if (typeof exports === 'object') {
		// Node.js
		module.exports = factory();
	} else {
		// Browser globals (root is window)
		root._cookie = factory();
	} // end function
}(this, function() {

	var Cookie = {};

 	/**
 	 * 获取 Cookie
 	 * 
 	 * @param key Cookie名或键值对的key
 	 * @parm baseKey Cookie名
 	 * @return string
 	 */
 	Cookie.get = function(key, baseKey) {
 		var val = getRealCookie(key),
 			baseKey = baseKey || null;
 		if(!val && baseKey) {
 			var cookieStr = getRealCookie(baseKey);

 			if(!trim(cookieStr)) {
 				return '';
 			}

 			var cookies = cookieStr.split('&'), item = null;
 			for(var i=0, len = cookies.length; i < len; i++) {
 				item = cookies[i].split('=');
 				if(item.length > 1 && item[0] == key) {
 					return decodeURIComponent(item[1]);
 				}
 			}

 			return '';
 		} else {
 			return trim(val);
 		}
 	};

 	/**
 	 * 设置Cookie
 	 *
 	 * set(name, value, expires, path, domain, secure, baseKey)
 	 * 或者 set(name, value, {expires:0, path: '/', domain: '', secure:'', baseKey:''})
 	 *
 	 * baseKey将name=value保存在该Cookie下
 	 *
 	 */
 	Cookie.set = function() {
 		var argLenth = arguments.length,
 			options = null,
 			name = trim(arguments[0]),
 			value = '' + arguments[1];

 		switch(argLenth) {
 			case 3:
 				if(typeof arguments[2] !== 'object') {
 					options = fixedOptions({expires: arguments[2]});
 				} else {
 					options = fixedOptions(arguments[2]);
 				}
 				break;
 			case 4:
 				options = fixedOptions({expires: arguments[2], path:arguments[3]});
 				break;
 			case 5:
 				options = fixedOptions({expires: arguments[2], path:arguments[3], domain:arguments[4]});
 				break;
 			case 6:
 				options = fixedOptions({expires: arguments[2], path:arguments[3], domain:arguments[4], secure:[5]});
 				break;
 			default:
 				break;
 		}
 		
 		setRealCookie(name,value,options)
 	};

 	/**
 	 * 清除所有Cookie
 	 *
 	 * @param domain 域名，默认是当前域名，可以清除指定域名
 	 */
 	Cookie.clear = function(domain) {
 		var keys = getAllKeys();
 		domain  = domain || '';

 		for(var i = 0, len = keys.length; i < len; i++) {
 			setRealCookie(keys[i], '', {expires: -1, path: '/', domain: domain, baseKey: ''});
 		}
 	};

 	/**
 	 * 清除单个Cookie
 	 *
 	 * @param name Cookie名或key
 	 * @param baseKey Cookie名
 	 * @param domain 域名
 	 *
 	 */
 	Cookie.remove = function(name, baseKey, domain) {
 		domain  = domain || '';
 		setRealCookie(name, '', {expires: -1, path: '/', domain: domain, baseKey: baseKey});
 	};

 	

	/**
	 * 获取所有Cookie名
	 */
	function getAllKeys() {
		if (document.cookie === '') return {};
		var cookies = document.cookie.split(';'),result = [];
		for(var i = 0, l = cookies.length; i < l; i++) {
			var item = cookies[i].split('=');
			result.push(trim(item[0]))
		}

		return result;
	}

	/**
	 * 设置cookie
	 * 使用对象配置cookie的过期时间、路径、域名、是否安全、以及是否压缩
	 *
	 */
	function setRealCookie(name,value,options) {
		var curDomain = location.hostname;

		if(options) {
			var hours = parseInt(options.expires),
				expireDate = new Date(new Date().getTime()+hours*3600000),
				path = options.path,
				domain = options.domain,
				secure = options.secure,
				baseKey = options.baseKey;

			if(!hours) {
				expireDate = 0;
			}

			if(!domain) {
				domain = curDomain;
			}

			// 压缩name=value
			if(baseKey) {
				zipCookie(name, value, baseKey, options);
			}
			
			_setRealCookie(name, value, expireDate, path, domain, secure);
		} else {
			// 当前会话有效
			document.cookie = name + "=" + encodeURIComponent(value) + "; path=/; domain=" + curDomain;
		}
	}

	/**
	 * 设置Cookie
	 * 
	 * @param name Cookie名
	 * @param value 值
	 * @param expires 过期时间
	 * @param path 路径
	 * @param domain 域名
	 * @param secure 是否安全
	 *
	 */
	function _setRealCookie(name, value, expires, path, domain, secure) {
		typeof expires === 'boolean' ? (expires=null) : expires;
		!path ? (path = '/') : null;
		!domain ? (domain = location.hostname) : null;
		!secure ? (secure = ';secure') : null;

		if(expires) {
			document.cookie = name + "=" + encodeURIComponent(value)+"; expires=" + expires.toGMTString() + "; path="+path+"; domain="+domain + secure ;
		} else {
			document.cookie = name + "=" + encodeURIComponent(value) + "; path="+path+"; domain=" + domain;
		}

	}

	/**
	 * 将某个key=>value保存在basekey下
	 * 
	 * @param name Cookie名或key
	 * @param value 值
	 * @param baseKey Cookie名
	 * @param opitons 配置项
	 *
	 */
	function zipCookie(name, value, baseKey, options) {
		var cookieStr = getRealCookie(baseKey);

		// 删除
		if(!trim(value) && cookieStr) {
			var sourceStr = Cookie.get(name, baseKey);
			if(sourceStr) {
				var cookies = sourceStr.split('&'), pairs = null, newCookies = [];
				for(var i = 0, len = cookies.length; i < len; i++) {
					pairs = cookies[i].split('=');
					if(pairs.length > 1 && pairs[0] != name) {
						newCookies.push(cookies[i]);
					}
				}

				cookieStr = newCookies.join('&');
			}
			
		} else {
			// 先删除旧的
			setRealCookie(name, '', {expires: -1});
			
			if(cookieStr == '') {
				cookieStr = name + '=' + encodeURIComponent(value);
			} else {
				var sourceStr = Cookie.get(name, baseKey);
				if(sourceStr) {
					var cookies = sourceStr.split('&'), pairs = null;
					for(var i = 0, len = cookies.length; i < len; i++) {
						pairs = cookies[i].split('=');
						if(pairs.length > 1 && pairs[0] == name) {
							cookies[i] = name+'='+encodeURIComponent(value);
							break;
						}
					}

					cookieStr = cookies.join('&');
				} else {
					cookieStr = cookieStr+'&'+trim(name)+'='+encodeURIComponent(value);
				}
			}
		}

		options.baseKey = '';

		setRealCookie(baseKey,cookieStr, options);
	}

	/**
	 * Cookie 其他选项
	 * 
	 * @param options 格式化配置对象
	 *
	 *	expires/path/domain/secure/baseKey(压缩Cookie)
	 */
	function fixedOptions(options) {
		var _opts = {
			expires: 0,
			path: '/',
			domain: '',
			secure: 0,
			baseKey: ''
		};
		var argLenth = arguments.length;

		// 优先对象
		if(typeof options === 'object' && options) {
			options.expires ? (_opts.expires = options.expires) : null;
			options.path ? (_opts.path = options.path) : null;
			options.domain ? (_opts.domain = options.domain) : (_opts.domain = location.hostname);
			options.secure ? (_opts.secure = '; secure') : null;
			options.baseKey ? (_opts.baseKey = options.baseKey) : null;
			return _opts;
		}

		switch(argLenth) {
			case 1:
				_opts.expires = arguments[0];
			case 2:
				_opts.path = arguments[1];
			case 3:
				_opts.domain = arguments[2];
			case 4:
				_opts.secure = arguments[3];
			case 5:
				_opts.baseKey = arguments[4];
			default:
				break;
		}

		return _opts;
	}

	/**
	 * 获取原始Cookie
	 */
	function getRealCookie(name){
		return (document.cookie.match(new RegExp("(^"+name+"| "+name+")=([^;]*)"))==null)? "":decodeURIComponent(RegExp.$2);
	}

	/**
 	 * 去除空白
 	 */
 	function trim(str) {
		return str.replace(/(^(\s)*|(\s)*$)/g, '');
	}


	// Cookie 实例
	return Cookie;
}));


import { avalon, platform, modern, msie } from '../seed/core'
import { $$skipArray } from './reserved'
import { Directive } from '../renders/Directive'
import './share'
import './ProxyArray'

export { avalon, platform, itemFactory }

//如果浏览器不支持ecma262v5的Object.defineProperties或者存在BUG，比如IE8
//标准浏览器使用__defineGetter__, __defineSetter__实现
var canHideProperty = true
try {
    Object.defineProperty({}, '_', {
        value: 'x'
    })
} catch (e) {
    /* istanbul ignore next*/
    canHideProperty = false
}


var modelAccessor = {
    get: function() {
        return toJson(this)
    },
    set: avalon.noop,
    enumerable: false,
    configurable: true
}

export function toJson(val) {
    var xtype = avalon.type(val)
    if (xtype === 'array') {
        var array = []
        for (var i = 0; i < val.length; i++) {
            array[i] = toJson(val[i])
        }
        return array
    } else if (xtype === 'object') {
        if (typeof val.$track === 'string') {
            var obj = {}
            val.$track.split('Ȣ').forEach(function(i) {
                var value = val[i]
                obj[i] = value && value.$events ? toJson(value) : value
            })
            return obj
        }
    }
    return val
}

/* istanbul ignore next */
export function hideProperty(host, name, value) {
    if (canHideProperty) {
        Object.defineProperty(host, name, {
            value: value,
            writable: true,
            enumerable: false,
            configurable: true
        })
    } else {
        /* istanbul ignore next */
        host[name] = value
    }
}


export function watchFactory(core) {
    return function $watch(expr, callback, deep) {
        var w = new Directive(core.__proxy__, {
            deep: deep,
            type: 'user',
            expr: expr
        }, callback)
        if (!core[expr]) {
            core[expr] = [w]
        } else {
            core[expr].push(w)
        }

        return function() {
            w.destroy()
            avalon.Array.remove(core[expr], w)
            if (core[expr].length === 0) {
                delete core[expr]
            }
        }
    }
}

export function fireFactory(core) {
    return function $fire(expr, a) {
        var list = core[expr]
        if (Array.isArray(list)) {
            for (var i = 0, w; w = list[i++];) {
                w.callback.call(w.vm, a, w.value, w.expr)
            }
        }
    }
}

function wrapIt(str) {
    return 'Ȣ' + str + 'Ȣ'
}

export function afterCreate(vm, core, keys) {
    var $accessors = vm.$accessors
        //隐藏系统属性
    for (var key in $$skipArray) {
        hideProperty(vm, key, vm[key])
    }
    //为不可监听的属性或方法赋值
    for (var i = 0; i < keys.length; i++) {
        key = keys[i]
        if (!(key in $accessors)) {
            vm[key] = core[key]
        }
    }
    vm.$track = keys.join('Ȣ')

    function hasOwnKey(key) {
        return wrapIt(vm.$track).indexOf(wrapIt(key)) > -1
    }
    if (avalon.msie < 9)
        hideProperty(vm, 'hasOwnProperty', hasOwnKey)
    vm.$events.__proxy__ = vm
}

platform.hideProperty = hideProperty
platform.fireFactory = fireFactory
platform.watchFactory = watchFactory
platform.afterCreate = afterCreate
platform.modelAccessor = modelAccessor
platform.toJson = toJson
platform.toModel = function(obj) {
    if (avalon.msie < 9) {
        obj.$model = toJson(obj)
    }
}


var createViewModel = Object.defineProperties
var defineProperty

var timeBucket = new Date() - 0
    /* istanbul ignore if*/
if (!canHideProperty) {
    if ('__defineGetter__' in avalon) {
        defineProperty = function(obj, prop, desc) {
            if ('value' in desc) {
                obj[prop] = desc.value
            }
            if ('get' in desc) {
                obj.__defineGetter__(prop, desc.get)
            }
            if ('set' in desc) {
                obj.__defineSetter__(prop, desc.set)
            }
            return obj
        }
        createViewModel = function(obj, descs) {
            for (var prop in descs) {
                if (descs.hasOwnProperty(prop)) {
                    defineProperty(obj, prop, descs[prop])
                }
            }
            return obj
        }
    }
    /* istanbul ignore if*/
    if (msie < 9) {
        var VBClassPool = {}
        window.execScript([ // jshint ignore:line
            'Function parseVB(code)',
            '\tExecuteGlobal(code)',
            'End Function' //转换一段文本为VB代码
        ].join('\n'), 'VBScript');

        var VBMediator = function(instance, accessors, name, value) { // jshint ignore:line
            var accessor = accessors[name]
            if (arguments.length === 4) {
                accessor.set.call(instance, value)
            } else {
                return accessor.get.call(instance)
            }
        }
        createViewModel = function(name, accessors, properties) {
            // jshint ignore:line
            var buffer = []
            buffer.push(
                    '\r\n\tPrivate [__data__], [__proxy__]',
                    '\tPublic Default Function [__const__](d' + timeBucket + ', p' + timeBucket + ')',
                    '\t\tSet [__data__] = d' + timeBucket + ': set [__proxy__] = p' + timeBucket,
                    '\t\tSet [__const__] = Me', //链式调用
                    '\tEnd Function')
                //添加普通属性,因为VBScript对象不能像JS那样随意增删属性，必须在这里预先定义好
            var uniq = {
                __proxy__: true,
                __data__: true,
                __const__: true
            }
           for (name in $$skipArray) {
                if (!uniq[name]) {
                    buffer.push('\tPublic [' + name + ']')
                    uniq[name] = true
                }
            }
            //添加访问器属性 
            for (name in accessors) {
                if (uniq[name]) {
                    continue
                }
                uniq[name] = true
                buffer.push(
                    //由于不知对方会传入什么,因此set, let都用上
                    '\tPublic Property Let [' + name + '](val' + timeBucket + ')', //setter
                    '\t\tCall [__proxy__](Me, [__data__], "' + name + '", val' + timeBucket + ')',
                    '\tEnd Property',
                    '\tPublic Property Set [' + name + '](val' + timeBucket + ')', //setter
                    '\t\tCall [__proxy__](Me, [__data__], "' + name + '", val' + timeBucket + ')',
                    '\tEnd Property',
                    '\tPublic Property Get [' + name + ']', //getter
                    '\tOn Error Resume Next', //必须优先使用set语句,否则它会误将数组当字符串返回
                    '\t\tSet[' + name + '] = [__proxy__](Me, [__data__],"' + name + '")',
                    '\tIf Err.Number <> 0 Then',
                    '\t\t[' + name + '] = [__proxy__](Me, [__data__],"' + name + '")',
                    '\tEnd If',
                    '\tOn Error Goto 0',
                    '\tEnd Property')

            }
           
            for (name in properties) {
                if (!uniq[name]) {
                    uniq[name] = true
                    buffer.push('\tPublic [' + name + ']')
                }
            }

            buffer.push('\tPublic [' + 'hasOwnProperty' + ']')
            buffer.push('End Class')
            var body = buffer.join('\r\n')
            var className = VBClassPool[body]
            if (!className) {
                className = avalon.makeHashCode('VBClass')
                window.parseVB('Class ' + className + body)
                window.parseVB([
                    'Function ' + className + 'Factory(a, b)', //创建实例并传入两个关键的参数
                    '\tDim o',
                    '\tSet o = (New ' + className + ')(a, b)',
                    '\tSet ' + className + 'Factory = o',
                    'End Function'
                ].join('\r\n'))
                VBClassPool[body] = className
            }
            var ret = window[className + 'Factory'](accessors, VBMediator) //得到其产品
            return ret //得到其产品
        }
    }
}

platform.createViewModel = createViewModel
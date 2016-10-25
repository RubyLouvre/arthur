import {avalon, platform, modern} from '../seed/core'
import './share'
export {avalon, platform}

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

platform.canHideProperty = canHideProperty

export function toJson(val) {
    switch (avalon.type(val)) {
        case 'array':
            var array = []
            for (var i = 0; i < val.length; i++) {
                array[i] = toJson(val[i])
            }
            return array
        case 'object':
            var obj = {}
            for (i in val) {
                if (i === '__proxy__' || i === '__data__' || i === '__const__')
                    continue
                if (val.hasOwnProperty(i)) {
                    var value = val[i]
                    obj[i] = value && value.nodeType ? value : toJson(value)
                }
            }
            return obj
        default:
            return val
    }
}

platform.toJson = toJson
platform.toModel = function (obj) {
    if (!modern) {
        obj.$model = toJson(obj)
    }
}

function hideProperty(host, name, value) {
    if (canHideProperty) {
        Object.defineProperty(host, name, {
            value: value,
            writable: true,
            enumerable: false,
            configurable: true
        })
    } else {
        host[name] = value
    }
}

platform.hideProperty = hideProperty


var defineProperties = Object.defineProperties
var defineProperty

var timeBucket = new Date() - 0
/* istanbul ignore if*/
if (!canHideProperty) {
    if ('__defineGetter__' in avalon) {
        defineProperty = function (obj, prop, desc) {
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
        defineProperties = function (obj, descs) {
            for (var prop in descs) {
                if (descs.hasOwnProperty(prop)) {
                    defineProperty(obj, prop, descs[prop])
                }
            }
            return obj
        }
    }
    /* istanbul ignore if*/
    if (avalon.msie < 9) {
        var VBClassPool = {}
        window.execScript([// jshint ignore:line
            'Function parseVB(code)',
            '\tExecuteGlobal(code)',
            'End Function' //转换一段文本为VB代码
        ].join('\n'), 'VBScript');

        var VBMediator = function (instance, accessors, name, value) {// jshint ignore:line
            var accessor = accessors[name]
            if (arguments.length === 4) {
                accessor.set.call(instance, value)
            } else {
                return accessor.get.call(instance)
            }
        }
        defineProperties = function (name, accessors, properties) {
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

            //添加访问器属性 
            for (name in accessors) {
                if (uniq[name] || $$skipArray[name]) {
                    continue
                }
                uniq[name] = true
                buffer.push(
                    //由于不知对方会传入什么,因此set, let都用上
                    '\tPublic Property Let [' + name + '](val' + timeBucket + ')', //setter
                    '\t\tCall [__proxy__](Me,[__data__], "' + name + '", val' + timeBucket + ')',
                    '\tEnd Property',
                    '\tPublic Property Set [' + name + '](val' + timeBucket + ')', //setter
                    '\t\tCall [__proxy__](Me,[__data__], "' + name + '", val' + timeBucket + ')',
                    '\tEnd Property',
                    '\tPublic Property Get [' + name + ']', //getter
                    '\tOn Error Resume Next', //必须优先使用set语句,否则它会误将数组当字符串返回
                    '\t\tSet[' + name + '] = [__proxy__](Me,[__data__],"' + name + '")',
                    '\tIf Err.Number <> 0 Then',
                    '\t\t[' + name + '] = [__proxy__](Me,[__data__],"' + name + '")',
                    '\tEnd If',
                    '\tOn Error Goto 0',
                    '\tEnd Property')

            }
            for (name in properties) {
                if (uniq[name] || $$skipArray[name]) {
                    continue
                }
                uniq[name] = true
                buffer.push('\tPublic [' + name + ']')
            }
            for (name in $$skipArray) {
                if (!uniq[name]) {
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

platform.createViewModel = defineProperties
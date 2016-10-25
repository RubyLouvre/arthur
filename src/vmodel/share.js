
import { avalon, platform } from '../seed/core'
import { $$skipArray } from './reserved'
import { Depend } from './depend'
import { Watcher } from './watcher'


/**
 * 这里放置ViewModel模块的共用方法
 * modelAccessor: $model属性的访问器定义对象
 * modelFactory: 对象转ViewModel的工厂
 * listFactory: 数组转ViewModel的工厂
 * beforeCreate: modelFactory的内部方法，用于创建之前
 * afterCreate: modelFactory的内部方法，用于创建之后
 * isObservable: 判定此属性能否转换为访问器属性
 * createObserver: ViewModel的适配方法，决定使用哪个工厂转换
 */

var modelAccessor = {
    get: function () {
        return platform.toJson(this)
    },
    set: avalon.noop,
    enumerable: false,
    configurable: true
}


export function modelFactory(object, byUser) {
    var core = {}
    var state = {}
    var props = {}
    for (var key in object) {
        var val = object[key]
        if (isObservable(key, val)) {
            state[key] = createAccessor(key, val, core)
        } else {
            props[key] = val
        }
    }
    beforeCreate(props, object, state, core, byUser)
    var observe = {}
    observe = platform.createViewModel(observe, state, props)
    for (var i in props) {
        observe[i] = props[i]
    }
    afterCreate(core, observe)
    return observe
}

function listFactory(array, rewrite) {
    if (!rewrite) {
        rewriteArrayMethods(array)
        hideProperty(array, '$model', modelAccessor)
        hideProperty(array, '$events', { __dep__: new Depend })
    }
    array.forEach(function (item, i) {
        if (isObject(item)) {
            array[i] = createObserver(item)
        }
    })
    return array
}


export function isObservable(key, val) {
    if ($$skipArray[key])
        return false
    if (key.charAt(0) === '$')
        return false
    if (typeof val == null) {
        avalon.warn('定义vmodel时属性值不能为null undefine')
        return true
    }
    if (/error|date|function/.test(avalon.type(val))) {
        return false
    }
    return !(val && val.nodeName && val.nodeType)
}

function beforeCreate(core, props, object, state, byUser) {
    var hash = avalon.makeHashCode('$')
    state.$model = modelAccessor
    avalon.mix(props, {
        $id: object.$id || hash,
        $events: core,
        $hashcode: hash,
        $accessor: state,
    }, byUser ? {
        $watch: function (expression, callback, deep) {
            var w = new Watcher(core.observe, {
                'deep': deep,
                'expression': expression
            }, callback);
            return function () {
                w.destory()
            }
        },
        $fire: function () {

        }
    } : {})
}

function afterCreate(core, observe) {
    core.observe = observe
}

function createObserver(target) {
    if (target.$events) {
        return target
    }
    if (isArray(target)) {
        vm = listFactory(target)
    } else if (isObject(target)) {
        vm = modelFactory(target)
    }
    if (vm)
        vm.$events.__dep__ = new Depend()
    return vm
}

function createAccessor(key, val, core) {
    var value = val
    var childOb = createObserver(val)
    return {
        get: function Getter() {
            var ret = value
            if (Depend.watcher) {
                core.__dep__.collect()
                if (childOb && childOb.$events) {
                    childOb.$events.__dep__.collect()
                }
            }
            return ret
        },
        set: function Setter(newValue) {
            var oldValue = value
            if (newValue === oldValue) {
                return
            }
            core.__dep__.beforeNotify()
            value = newValue
            childOb = createObserver(newValue)
            core.__dep__.notify()
        },
        enumerable: true,
        configurable: true
    }
}

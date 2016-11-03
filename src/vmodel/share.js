
import { avalon, platform, isObject, modern } from '../seed/core'
import { $$skipArray } from './reserved'
import { Depend } from './depend'
import { rewriteArrayMethods } from './List'


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


avalon.define = function (definition) {
        var $id = definition.$id
        if (!$id) {
                avalon.warn('vm.$id must be specified')
        }
        if (avalon.vmodels[$id]) {
                throw Error('error:[' + $id + '] had defined!')
        }
        var vm = modelFactory(definition, true)
        return avalon.vmodels[$id] = vm
}

export function modelFactory(definition, byUser) {
        var core = {
                __dep__: new Depend
        }
        var state = {}
        var hash = avalon.makeHashCode('$')
        var keys = {
                $id: definition.$id || hash,
                $hashcode: hash
        }
        for (var key in definition) {
                if ($$skipArray[key])
                        continue
                var val = keys[key] = definition[key]
                if (isObservable(key, val)) {
                        state[key] = createAccessor(key, val, core)
                }
        }
        //往keys中添加系统API
        platform.beforeCreate(core, state, keys, byUser)
        var observe = new Observe()
        //将系统API以unenumerable形式加入vm,并在IE6-8中添加hasOwnPropert方法
        observe = platform.createViewModel(observe, state, keys)
        platform.afterCreate(core, observe, keys)
        return observe
}

function Observe() { }
function listFactory(array, rewrite) {
        if (!rewrite) {
                rewriteArrayMethods(array)
                if (modern) {
                        Object.defineProperty(array, '$model', platform.modelAccessor)
                }
                platform.hideProperty(array, '$events', { __dep__: new Depend })
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
        if (/error|date|function|regexp/.test(avalon.type(val))) {
                return false
        }
        return !(val && val.nodeName && val.nodeType)
}

function createObserver(target) {
        if (target.$events) {
                return target
        }
        var vm
        if (Array.isArray(target)) {
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
                        if (Depend.target) {
                                core.__dep__.collect()
                                if (childOb && childOb.$events) {
                                        childOb.$events.__dep__.collect()
                                }
                        }
                        if (childOb)
                                return childOb
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
platform.listFactory = listFactory


export function observeItemObject(before, after) {
        var core = before.$events
        if (!core.__dep__) {
                core.__dep__ = new Depend()
        }
        var state = before.$accessors
        var keys = before.$models || {}
        var more = after.data
        delete after.data
        var props = after
        for (var key in more) {
                keys[key] = more[key]
                state[key] = createAccessor(key, more[key], core)
        }
        platform.beforeCreate(core, state, keys)
        var observe = new Observe()
        //将系统API以unenumerable形式加入vm,并在IE6-8中添加hasOwnPropert方法
        observe = platform.createViewModel(observe, state, keys)
        platform.afterCreate(core, observe, keys)
        return observe
}
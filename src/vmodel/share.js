
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
 * createObservable: ViewModel的适配方法，决定使用哪个工厂转换
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


        var state = {}
        var hash = avalon.makeHashCode('$')
        var keys = {
                $id: definition.$id || hash,
                $hashcode: hash
        }

        var core = {
                __dep__: new Depend(keys.$id)
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
        var vm = new Observable()
        //将系统API以unenumerable形式加入vm,并在IE6-8中添加hasOwnPropert方法
        vm = platform.createViewModel(vm, state, keys)
        platform.afterCreate(core, vm, keys)
        return vm
}

function Observable() { }
function listFactory(array, rewrite) {
        if (!rewrite) {
                rewriteArrayMethods(array)
                if (modern) {
                        Object.defineProperty(array, '$model', platform.modelAccessor)
                }
                platform.hideProperty(array, '$hashcode', avalon.makeHashCode('$'))
                platform.hideProperty(array, '$events', { __dep__: new Depend })
        }
        for (var i = 0, n = array.length; i < n; i++) {
                var item = array[i]
                if (isObject(item)) {
                        array[i] = createObservable(item)
                }
        }
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

function createObservable(target, dd) {
        if (target && target.$events) {
                return target
        }
        var vm
        if (Array.isArray(target)) {
                vm = listFactory(target)
        } else if (isObject(target)) {
                vm = modelFactory(target)
        }
        if (vm) {
                vm.$events.__dep__ = dd || new Depend()
        }
        return vm
}
// 指令需要计算自己的值，来刷新
// 在计算前，将自己放到DepStack中
// 然后开始计算，在Getter方法里，

function createAccessor(key, val, parent) {
        var priVal = val
        var selfDep = new Depend(key) //当前值对象的Depend
        var childOb = createObservable(val, selfDep)
        var hash = childOb && childOb.$hashcode

        return {
                get: function Getter() {
                        var ret = priVal
                        if (Depend.target) {
                                selfDep.collect()
                                parent.__dep__.collect()
                        }
                        Getter.dd = selfDep

                        if (childOb && childOb.$events) {
                                if (Array.isArray(childOb)) {
                                        childOb.forEach(function (item) {
                                                if (item && item.$events) {
                                                        item.$events.__dep__.collect()
                                                }
                                        })
                                } else if( avalon.deepCollect){
                                        for (var i in childOb) {
                                                if (childOb.hasOwnProperty(i))
                                                        var e = childOb[i]
                                        }
                                }
                                return childOb
                        }

                        return ret
                },
                set: function Setter(newValue) {
                        var oldValue = priVal
                        if (newValue === oldValue) {
                                return
                        }
                        selfDep.beforeNotify()
                        parent.__dep__.beforeNotify()
                        priVal = newValue
                        childOb = createObservable(newValue, selfDep)
                        if (childOb && hash) {
                                childOb.$hashcode = hash
                        }
                        selfDep.notify()
                        parent.__dep__.notify()
                },
                enumerable: true,
                configurable: true
        }
}
platform.listFactory = listFactory

export function observeItemObject(before, after) {
        var core = {}
        core.__dep__ = new Depend()
        var state = avalon.shadowCopy({}, before.$accessors)//防止互相污染
        var keys = before.$model || {}
        var more = after.data
        delete after.data
        var props = after

        for (var key in more) {
                keys[key] = more[key]
                if (isObservable(key, keys[key])) {
                        state[key] = createAccessor(key, more[key], core)
                }
        }
        platform.beforeCreate(core, state, keys)
        var vm = new Observable()
        //将系统API以unenumerable形式加入vm,并在IE6-8中添加hasOwnPropert方法
        vm = platform.createViewModel(vm, state, keys)
        platform.afterCreate(core, vm, keys)
        vm.$hashcode = before.$hashcode + String(after.hashcode || Math.random()).slice(6)
        return vm
}
avalon.observeItemObject = observeItemObject
/**
 * 根据RxJS的理论vm.$watch是返回一个叫Subscription的东西，
 * 而$watch返回的东西其实与扫描页面绑定生成的指令对象是同种东西
 * 
 * 什么是Observer？ Observer（观察者）是Observable（可观察对象）推送数据的消费者。
 * 在RxJS中，Observer是一个由回调函数组成的对象，键名分别为next、error 和 complete，
 * 以此接受Observable推送的不同类型的通知，下面的代码段是Observer的一个示例：
 */
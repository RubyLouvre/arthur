import {
    avalon,
    platform,
    isObject,
    modern
} from '../seed/core'
import {
    $$skipArray
} from './reserved'
import {
    Depend
} from './depend'
import {
    IProxy,
    collectDeps,
    canHijack,
    createProxy
} from './share'
if (typeof Proxy === 'function') {

    platform.modelFactory = function modelFactory(definition, dd) {
        var clone = {}
        for (var i in definition) {
            clone[i] = definition[i]
            delete definition[i]
        }
        definition.$id = clone.$id
        var proxy = new IProxy(definition, dd)
        proxy.$track = ''

        var vm = toProxy(proxy)
        for (var i in clone) {
           
            vm[i] = clone[i]
        }
        return vm
    }

    //https://developer.mozilla.org/en-US/docs/Archive/Web/Old_Proxy_API
    function toProxy(definition) {
        return Proxy.create ? Proxy.create(definition, traps) :
            new Proxy(definition, traps)
    }

    function wrapIt(str) {
        return 'Ȣ' + str + 'Ȣ'
    }

    var traps = {
        deleteProperty: function(target, name) {
            if (target.hasOwnProperty(name)) {
                //移除一个属性,分三昌:
                //1. 移除监听器
                //2. 移除真实对象的对应属性
                //3. 移除$track中的键名
                delete target.$accessors[name]
                delete target[name]
                target.$track = wrapIt(target.$track).replace(wrapIt(name), '').slice(1, -1)
            }
            return true 
        },
        get: function(target, name) {
            if (name === '$model') {
                return platform.toJson(target)
            }
            //收集依赖
            var childObj = target[name]
            var selfDep  = target.$accessors[name]
            selfDep && collectDeps(selfDep, childObj)
            return selfDep ? selfDep.value :  childObj
        },
        set: function(target, name, value) {
            if (name === '$model') {
                return true
            }
            var oldValue = target[name]
            if (oldValue !== value) {
                if (canHijack(name, value)) {
                    var ac = target.$accessors
                    //如果是新属性
                    if (!(name in $$skipArray) && !ac[name]) {
                        var arr = target.$track.split('Ȣ')
                        arr.push(name)
                        ac[name] = new Depend(name)
                        target.$track = arr.sort().join('Ȣ')
                    }
                    var selfDep = ac[name]
                    selfDep && selfDep.beforeNotify()
                    //创建子对象
                    var hash = oldValue && oldValue.$hashcode
                    var childObj = createProxy(value, selfDep)
                    if (childObj) {
                        childObj.$hashcode = hash
                        value = childObj
                    }
                    target[name] = selfDep.value = value //必须修改才notify
                    selfDep.notify()
                }else{
                    target[name] = value
                }
            }
            // set方法必须返回true, 告诉Proxy已经成功修改了这个值,否则会抛
            //'set' on proxy: trap returned falsish for property xxx 错误
            return true
        },
        has: function(target, name) {
            return target.hasOwnProperty(name)
        }
    }



    platform.itemFactory = function itemFactory(before, after) {
        var vm = platform.modelFactory(before)
        vm.$hashcode = before.$hashcode +
            String(after.hashcode || Math.random()).slice(6)
        vm.$id = vm.hashcode
        for (var i in after) {
            vm[i] = after.data[i]
        }
        delete vm.$fire
        delete vm.$watch
        return vm
    }

    platform.mediatorFactory = function mediatorFactory(before, after) {
        var definition = avalon.mix(before.$model, after.$model)
        definition.$id = before.$hashcode + after.$hashcode
        definition.$accessors = avalon.mix({},
             before.$accessors,
             after.$accessors)
        return platform.modelFactory(definition)
    }
}
import { avalon, platform, isObject, modern } from '../seed/core'
import { $$skipArray } from './reserved'
import { Depend } from './depend'
import { rewriteArrayMethods } from './List'

 function isProxyfy(key, val){
     return val && typeof val === 'object' && isObservable(key, val) 
 }

 function masterFactory(definition, dd) {
        var byUser = dd === void 0
        var hash = avalon.makeHashCode('$')
        var clone = {}
        for(var i in definition){
            clone[i] = definition[i]
            delete definition[i]
        }
        definition.$id = clone.$id || hash
        definition.$hashcode = hash
        definition.$events = {}
        definition.$events.__dep__ = dd || new Depend( clone.$id )
        if(definition.$accessors){
             definition.$accessors = avalon.mix({},definition.$accessors)
        } else {
           definition.$accessors = {} 
        }
       
        definition.$track = ''
        if(byUser){
            vm.$fire = $fire
            vm.$watch = $watch
        }
        var vm = proxyfy(definition)
        for(var i in clone){
            vm[i] = clone[i]
        }
        return vm
    }
    function proxyfy(definition) {
        return Proxy.create ? Proxy.create(definition, handlers) :
                new Proxy(definition, handlers)
    }
    function toJson(val) {
    var xtype = avalon.type(val)
    if (xtype === 'array') {
        var array = []
        for (var i = 0; i < val.length; i++) {
            array[i] = toJson(val[i])
        }
        return array
    } else if (xtype === 'object') {
        var obj = {}
        val.$track.split(';;').forEach(function (i) {
            var value = val[i]
            obj[i] = value && value.$events ? toJson(value): value
        })
        return obj
    }
    return val
}

var handlers = {
    deleteProperty: function (target, name) {
        if (target.hasOwnProperty(name)) {
            delete target.$accessors[name]
            target.$track = (';;' + target.$track + ';;').
                    replace(';;' + name + ';;', '').slice(2, -2)
        }
    },
    get: function (target, name) {
        if (name === '$model') {
            return toJson(target)
        }
        //收集依赖
        if (Depend.target && target.$hashcode) {
           var selfDep = target.$accessors[name]
           selfDep && selfDep.collect()
        }
        var childObj = target[name]
        //如果子对象也是VM
        if(childObj && childObj.$events){
             //处理数组
             if (Array.isArray(childObj)) {
                      childObj.forEach(function (item) {
                            if (item && item.$events) {
                                    item.$events.__dep__.collect()
                            }
                      })
                //处理对象，但在指令为deep的情况
                } else if (avalon.deepCollect) {
                        for (var i in childObj) {
                                if (childObj.hasOwnProperty(i)){
                                        var e = childObj[i]
                                }
                        }
                }
        }
        return childObj
    },
    set: function (target, name, value) {
        if (name === '$model') {
            return
        }
        var oldValue = target[name]
        if (oldValue !== value ) {
            if(target.$hashcode && isObservable(name, value)){
             
            //如果是新属性
                if (!$$skipArray[name] && oldValue === void 0 &&
                        !target.hasOwnProperty(name)) {
                    var arr = target.$track.split(';;')
                    arr.push(name)
                    if(!target.$accessors[name]){
                        target.$accessors[name] = new Depend(key)
                    }
                    target.$track = arr.sort().join(';;')
                }
                
                var selfDep = target.$accessors[name]
                
                selfDep && selfDep.beforeNotify()
                //创建子对象
                var hash = oldValue && oldValue.$hashcode
                var childObj = createObservable(value, selfDep)
                if( childObj ){
                    childObj.$hashcode = hash
                    value = childObj
                }
                selfDep.notify()
           }
           target[name] = value
                        
        }

    },
    has: function (target, name) {
        return target.hasOwnProperty(name)
    }
}


function $fire(expr, a) {
        var list = this.$events[expr]
        if (Array.isArray(list)) {
                for (var i = 0, w; w = list[i++];) {
                        w.callback.call(w.vm, a, w.value, w.expr)
                }
        }
}

function $watch(expr, callback, deep) {
        var core = this.$events
        var w = new Directive(this, {
                deep: deep,
                type: 'user',
                expr: expr
        }, callback)
        if (!core[expr]) {
                core[expr] = [w]
        } else {
                core[expr].push(w)
        }
        return function () {
                w.destroy()
                avalon.Array.remove(core[expr], w)
                if (core[expr].length === 0) {
                        delete core[expr]
                }
        }
}

export function observeItemObject(before, after) {
    var vm = masterFactory(before)
    vm.$hashcode = before.$hashcode + 
            String(after.hashcode || Math.random()).slice(6)
    vm.$id = vm.hashcode
    for(var i in after){
        vm[i] = after.data[i]
    }
    delete vm.$fire
    delete vm.$watch
    return vm
}

export function mediatorFactory(before, after) {
    var vm = masterFactory(before)
    vm.$id = vm.$hashcode = before.$hashcode + after.$hashcode
    for(var i in after){
        vm[i] = after[i]
    }
    return vm
}
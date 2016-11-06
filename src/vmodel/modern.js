import { avalon, platform, modern } from '../seed/core'
import { $$skipArray } from './reserved'
import { Directive } from '../renders/Directive'
import './share'
export { platform }


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
                                if ($$skipArray[i]) {
                                        continue
                                }
                                if (val.hasOwnProperty(i)) {
                                        var value = val[i]
                                        obj[i] = value && value.$events ? toJson(value) : value
                                }
                        }
                        return obj
                default:
                        return val
        }
}


export function hideProperty(host, name, value) {
        Object.defineProperty(host, name, {
                value: value,
                writable: true,
                enumerable: false,
                configurable: true
        })
}

var modelAccessor = {
        get: function () {
                return toJson(this)
        },
        set: avalon.noop,
        enumerable: false,
        configurable: true
}



function $fire(expr, a) {
        var list = this.$events[expr]
        if (Array(list)) {
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

function beforeCreate(core, state, keys, byUser) {
        state.$model = platform.modelAccessor
        avalon.mix(keys, {
                $events: core,
                $element: 0,
                $accessors: state,
        }, byUser ? {
                $watch: $watch,
                $fire: $fire
        } : {})
}


function afterCreate(core, observe, keys) {
        var $accessors = keys.$accessors
        for (var key in keys) {
                //对普通监控属性或访问器属性进行赋值
                //删除系统属性
                if (key in $$skipArray) {
                        hideProperty(observe, key, keys[key])
                        delete keys[key]
                } else {
                        if (!(key in $accessors)) {
                                observe[key] = keys[key]
                        }
                        keys[key] = true
                }
        }
        core.__proxy__ = observe
}

platform.beforeCreate = beforeCreate
platform.afterCreate = afterCreate
platform.modelAccessor = modelAccessor
platform.hideProperty = hideProperty
platform.toJson = toJson
platform.toModel = function () { }
platform.createViewModel = Object.defineProperties

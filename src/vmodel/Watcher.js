import { avalon } from '../seed/core'
import { Depend } from './depend'
import { createGetter,createSetter } from "../parser/index"
/** 
 * 遍历对象/数组每一个可枚举属性
 * @param  {Object|Array}  target  [遍历值/对象或数组]
 * @param  {Boolean}       root    [是否是根对象/数组]
 */
var walkedObs = []
function walkThrough(target, root) {
    var events = target && target.$events

    var guid = events && events.__dep__.guid

    if (guid) {
        if (walkedObs.indexOf(guid) > -1) {
            return
        } else {
            walkedObs.push(guid)
        }
    }

    avalon.each(target, function (key, value) {
        walkThrough(value, false)
    })
    if (root) {
        walkedObs.length = 0
    }
}
/**
 * 用户watch回调及页面上的指令都会转换它的实例
 * @param {type} vm
 * @param {type} desc
 * @param {type} callback
 * @param {type} context
 * @returns {Watcher}
 */

export function Watcher(vm, desc, callback, context) {
    this.vm = vm
    avalon.mix(this, desc)
    this.callback = callback
    this.context = context || this
    // 依赖 id 缓存
    this.depIds = []
    this.newDepIds = []
    this.shallowIds = []
    // 依赖实例缓存
    this.depends = []
    this.newDepends = []
    var expr = desc.expr
    var preSetFunc = typeof expr === 'function'
    // 缓存取值函数
    this.getter = preSetFunc ? expr : createGetter(expr)
    // 缓存设值函数（双向数据绑定）
    this.setter = this.type === 'duplex' ? createSetter(expr) : null
    // 缓存表达式旧值
    this.oldVal = null
    // 表达式初始值 & 提取依赖
    this.value = this.get()
}

var wp = Watcher.prototype
/**
 * 获取取值域
 * @return  {Object}
 */
wp.getScope = function () {
    return this.context.scope || this.vm
}

wp.getValue = function () {
    var scope = this.getScope()
    try {
        return this.getter.call(scope, scope)
    } catch (e) {
        avalon.log(this.getter + 'exec error')
    }
}

wp.setValue = function (value) {
    var scope = this.getScope()
    if (this.setter) {
        this.setter.call(scope, scope, value)
    }
}
wp.get = function () {
    var value
    this.beforeGet()
    value = this.getValue()
    // 深层依赖获取
    if (this.deep) {
        // 先缓存浅依赖的 ids
        this.shallowIds = avalon.mix(true, {}, this.newDepIds)
        walkThrough(value, true)
    }

    this.afterGet()
    return value
}

wp.beforeGet = function () {
    Depend.watcher = this
}

wp.addDepend = function (depend) {
    var guid = depend.guid
    var newIds = this.newDepIds
    if (newIds.indexOf(guid) < 0) {
        newIds.push(guid)
        this.newDepends.push(depend)
        if (this.depIds.indexOf(guid) < 0) {
            depend.addWatcher(this)
        }
    }
}

wp.removeDepends = function (filter) {
    var self = this
    this.depends.forEach(function (depend) {
        if (filter) {
            if (filter.call(self, depend)) {
                depend.removeWatcher(self)
            }
        } else {
            depend.removeWatcher(self)
        }
    })
}

wp.afterGet = function () {
    Depend.watcher = null
    // 清除无用的依赖
    this.removeDepends(function (depend) {
        return this.newDepIds.indexOf(depend.guid) < 0
    })
    // 重设依赖缓存
    this.depIds =  avalon.mix(true, {}, this.newDepIds)
    this.newDepIds.length = 0
    this.depends =  avalon.mix(true, {}, this.newDepends)
    this.newDepends.length = 0
}

wp.beforeUpdate = function () {
    
    this.oldVal = avalon.mix(true, {}, this.value)
}

wp.update = function (args, guid) {
    var oldVal = this.oldVal
    var newVal = this.value = this.get()
    var callback = this.callback
    if (callback && (oldVal !== newVal)) {
        var fromDeep = this.deep && this.shallowIds.indexOf(guid) < 0
        callback.call(this.context, newVal, oldVal, fromDeep, args)
    }
}

wp.destroy = function () {
    this.value = null
    this.removeDepends()
    if (this._destroy) {
        this._destroy()
    }
    for (var i in this) {
        delete this[i]
    }
}
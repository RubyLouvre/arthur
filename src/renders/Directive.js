import { avalon } from '../seed/core'
import { Depend, pushTarget, popTarget } from '../vmodel/depend'
import { createGetter, createSetter } from "../parser/index"
/** 
 * 遍历对象/数组每一个可枚举属性
 * @param  {Object|Array}  target  [遍历值/对象或数组]
 * @param  {Boolean}       root    [是否是根对象/数组]
 */
var walkedObs = []
function walkThrough(target, root) {
    var events = target && target.$events

    var uuid = events && events.__dep__.uuid

    if (uuid) {
        if (walkedObs.indexOf(uuid) > -1) {
            return
        } else {
            walkedObs.push(uuid)
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
 * @param {type} options
 * @param {type} callback
 * @returns {Watcher}
 */
export var protectedMenbers = {
    vm: 1,
    callback: 1,
    depIds: 1,
    newDepIds: 1,
    depends: 1,
    newDepends: 1,
    oldValue: 1,
    value: 1,
    getValue: 1,
    setValue: 1,
    get: 1,

    addDepend: 1,
    removeDepends: 1,
    beforeUpdate: 1,
    update: 1,
    //diff
    //getter
    //setter
    //expr
    //vdom
    //type: "for"
    //name: "ms-for"
    //attrName: ":for"
    //param: "click"
    //beforeDestroy
    destroy: 1
}
export function Directive(vm, options, callback) {

    for (var i in options) {
        if (protectedMenbers[i] !== 1) {
            this[i] = options[i]
        }
    }
    this.vm = vm
    this.callback = callback
    // 依赖 id 缓存
    this.depIds = []
    this.newDepIds = []
    // 依赖实例缓存
    this.depends = []
    this.newDepends = []
    var expr = this.expr
    // 缓存取值函数
    if (typeof this.getter !== 'function') {
        this.getter = createGetter(expr, this.type)
    }
    // 缓存设值函数（双向数据绑定）
    if (this.type === 'duplex') {
        this.setter = createSetter(expr, this.type)
    }
    // 缓存表达式旧值
    this.oldValue = null
    // 表达式初始值 & 提取依赖

    this.value = this.get()
}

var dp = Directive.prototype

dp.getValue = function () {
    var scope = this.vm
    try {
        return this.getter.call(scope, scope)
    } catch (e) {
       // avalon.log(this.getter + ' exec error')
    }
}

dp.setValue = function (value) {
    var scope = this.vm
    if (this.setter) {
        this.setter.call(scope, scope, value)
    }
}
dp.get = function () {
    var value
    pushTarget(this)
    value = this.getValue()
    // 深层依赖获取
    if (this.deep) {
        // 先缓存浅依赖的 ids
        //  this.shallowIds = avalon.mix(true, {}, this.newDepIds)
        walkThrough(value, true)
    }

    popTarget()
    // 清除无用的依赖
    var deps = this.newDepIds.slice(0)
    this.removeDepends(function (depend) {
        return deps.indexOf(depend.uuid) < 0
    }, this)
    // 重设依赖缓存
    this.depIds = deps
    this.newDepIds.length = 0
    this.depends = this.newDepends.slice(0)
    this.newDepends.length = 0

    return value
}


dp.addDepend = function (depend) {
    var uuid = depend.uuid
    var newIds = this.newDepIds
    if (newIds.indexOf(uuid) < 0) {
        newIds.push(uuid)
        this.newDepends.push(depend)
        if (this.depIds.indexOf(uuid) < 0) {
            depend.addSub(this)
        }
    }
}

dp.removeDepends = function (filter) {
    var self = this
    this.depends.forEach(function (depend) {
        if (filter) {
            if (filter.call(self, depend)) {
                depend.removeSub(self)
            }
        } else {
            depend.removeSub(self)
        }
    })
}


dp.beforeUpdate = function () {
    var v = this.value
    this.oldValue = v && v.$events ? v.$model : v
}

dp.update = function (args, uuid) {
    var oldVal = this.oldValue
    var newVal = this.value = this.get()
    var callback = this.callback
    if (callback && this.diff(newVal, oldVal, args)) {
        callback.call(this.vm, this.value, oldVal, this.node)
    }
}
/**
 * 比较两个计算值是否,一致,在for, class等能复杂数据类型的指令中,它们会重写diff复法
 */
dp.diff = function (a, b) {
    return a !== b
}
/**
 * 销毁指令
 */
dp.destroy = function () {
    this.value = null
    this.removeDepends()
    if (this.beforeDestroy) {
        this.beforeDestroy()
    }
    for (var i in this) {
        delete this[i]
    }
}
// https://swenyang.gitbooks.io/translation/content/react/fiber.html
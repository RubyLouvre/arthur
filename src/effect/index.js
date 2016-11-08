import { avalon, window, Cache } from '../seed/core'
import { cssDiff } from '../directives/css'
import {
    css3,
    animation,
    transition,
    animationEndEvent,
    transitionEndEvent
} from './detect'



var effectDir = avalon.directive('effect', {
    priority: 5,
    diff: function (effect) {
        var vdom = this.node
        if (typeof effect === 'string') {
            this.value = effect = {
                is: effect
            }
            avalon.warn('ms-effect的指令值不再支持字符串,必须是一个对象')
        }
        this.value = vdom.effect = effect
        var ok = cssDiff.call(this, effect, this.oldValue)
        var me = this
        if (ok) {
            setTimeout(function () {
                effectDir.update.call(me, vdom, vdom.effect)
            })
        }
    },

    update: function (vdom, change, opts) {
        console.log(arguments)
        /* istanbul ignore if */
        var dom = this.node.dom
        if (dom && dom.nodeType === 1) {
            var name = 'ms-effect'
            var option = change || opts
            var type = option.is
            /* istanbul ignore if */
            if (!type) {//如果没有指定类型
                return avalon.warn('need is option')
            }
            var effects = avalon.effects
            /* istanbul ignore if */
            if (css3 && !effects[type]) {
                avalon.effect(type)
            }
            var globalOption = effects[type]
            /* istanbul ignore if */
            if (!globalOption) {//如果没有定义特效
                return avalon.warn(type + ' effect is undefined')
            }
            var finalOption = {}
            var action = actionMaps[option.action]

            finalOption.action = action

            var Effect = avalon.Effect
            /* istanbul ignore if */

            var effect = new Effect(dom)
            avalon.mix(finalOption, globalOption, option)
            dom.animating = finalOption.action
            /* istanbul ignore if */
            /* istanbul ignore else */
            if (finalOption.queue) {
                animationQueue.push(function () {
                    effect[action](finalOption)
                })
                callNextAnimation()
            } else {
                setTimeout(function () {
                    effect[action](finalOption)
                }, 4)
            }
        }

    }
})

let move = 'move'
let leave = 'leave'
let enter = 'enter'
var actionMaps = {
    'true': enter,
    'false': leave,
    enter,
    leave,
    move,
    'undefined': enter
}

var animationQueue = []
function callNextAnimation() {
    var fn = animationQueue[0]
    if (fn) {
        fn()
    }
}

avalon.effects = {}
avalon.effect = function (name, opts) {
    var definition = avalon.effects[name] = (opts || {})
    if (css3 && definition.css !== false) {
        patchObject(definition, 'enterClass', name + '-enter')
        patchObject(definition, 'enterActiveClass', definition.enterClass + '-active')
        patchObject(definition, 'leaveClass', name + '-leave')
        patchObject(definition, 'leaveActiveClass', definition.leaveClass + '-active')

    }
    patchObject(definition, 'action', 'enter')

}

function patchObject(obj, name, value) {
    if (!obj[name]) {
        obj[name] = value
    }
}

var Effect = function (dom) {
    this.dom = dom
}

avalon.Effect = Effect

Effect.prototype = {
    enter: createAction('Enter'),
    leave: createAction('Leave'),
    move: createAction('Move')
}


function execHooks(options, name, el) {
    var list = options[name]
    list = Array.isArray(list) ? list : typeof list === 'function' ? [list] : []
    list.forEach(function (fn) {
        fn && fn(el)
    })
}
var staggerCache = new Cache(128)

function createAction(action) {
    var lower = action.toLowerCase()
    return function (option) {
        var dom = this.dom
        var elem = avalon(dom)
        var isAnimateDone
        var staggerTime = isFinite(option.stagger) ? option.stagger * 1000 : 0
        /* istanbul ignore if */
        if (staggerTime) {
            if (option.staggerKey) {
                var stagger = staggerCache.get(option.staggerKey) ||
                    staggerCache.put(option.staggerKey, {
                        count: 0,
                        items: 0
                    })
                stagger.count++
                stagger.items++
            }
        }
        var staggerIndex = stagger && stagger.count || 0
        var animationID
        var animationDone = function (e) {
            var isOk = e !== false
            if (--dom.__ms_effect_ === 0) {
                avalon.unbind(dom, transitionEndEvent)
                avalon.unbind(dom, animationEndEvent)
            }
            dom.animating = void 0
            clearTimeout(animationID)

            var dirWord = isOk ? 'Done' : 'Abort'
            execHooks(option, 'on' + action + dirWord, dom)

            if (stagger) {
                if (--stagger.items === 0) {
                    stagger.count = 0
                }
            }
            if (option.queue) {
                animationQueue.shift()
                callNextAnimation()
            }
        }
        execHooks(option, 'onBefore' + action, dom)
        /* istanbul ignore if */
        /* istanbul ignore else */
        if (option[lower]) {
            option[lower](dom, function (ok) {
                animationDone(ok !== false)
            })
        } else if (css3) {
            elem.addClass(option[lower + 'Class'])
            elem.removeClass(getNeedRemoved(option, lower))

            if (!dom.__ms_effect_) {
                //绑定动画结束事件
                elem.bind(transitionEndEvent, animationDone)
                elem.bind(animationEndEvent, animationDone)
                dom.__ms_effect_ = 1
            } else {
                dom.__ms_effect_++
            }
            setTimeout(function () {
                //下面两行用于触发CSS3动画
                var time = avalon.root.offsetWidth === NaN
                elem.addClass(option[lower + 'ActiveClass'])
                //计算动画时长
                time = getAnimationTime(dom)
                if (!time === 0) {
                    //立即结束动画
                    animationDone(false)
                } else if (!staggerTime) {
                    //如果动画超出时长还没有调用结束事件,这可能是元素被移除了
                    //如果强制结束动画
                    animationID = setTimeout(function () {
                        animationDone(false)
                    }, time + 32)
                }
            }, 17 + staggerTime * staggerIndex)// = 1000/60
        }
    }
}

avalon.applyEffect = function (node, vdom, opts) {
    var cb = opts.cb
    var curEffect = vnode.effect
    if (curEffect && node && node.nodeType === 1) {
        var hook = opts.hook
        var old = curEffect[hook]
        if (cb) {
            if (Array.isArray(old)) {
                old.push(cb)
            } else if (old) {
                curEffect[hook] = [old, cb]
            } else {
                curEffect[hook] = [cb]
            }
        }
        getAction(opts)
        avalon.directives.effect.update(vnode, curEffect, avalon.shadowCopy({}, opts))

    } else if (cb) {
        cb(node)
    }
}
/**
 * 获取方向
 */
export function getAction(opts) {
    if (!opts.action) {
        return opts.action = opts.hook.replace(/^on/, '').replace(/Done$/, '').toLowerCase()
    }
}
/**
 * 需要移除的类名
 */
function getNeedRemoved(options, name) {
    var name = name === 'leave' ? 'enter' : 'leave'
    return Array(name + 'Class', name + 'ActiveClass').map(function (cls) {
        return options[cls]
    }).join(' ')
}
/**
 * 计算动画长度
 */
var transitionDuration = avalon.cssName('transition-duration')
var animationDuration = avalon.cssName('animation-duration')
var rsecond = /\d+s$/
export function toMillisecond(str) {
    var ratio = rsecond.test(str) ? 1000 : 1
    return parseFloat(str) * ratio
}

function getAnimationTime(dom) {
    var computedStyles = window.getComputedStyle(dom)
    var tranDuration = computedStyles[transitionDuration]
    var animDuration = computedStyles[animationDuration]
    var time = toMillisecond(tranDuration) || toMillisecond(animDuration)
    return dom
}

//根据VM的属性值或表达式的值切换类名，ms-class='xxx yyy zzz:flag'
//http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
import { avalon, directives, getLongID as markID } from '../seed/core'

function classNames() {
    var classes = []
    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i]
        var argType = typeof arg
        if (argType === 'string' || argType === 'number' || arg === true) {
            classes.push(arg)
        } else if (Array.isArray(arg)) {
            classes.push(classNames.apply(null, arg))
        } else if (argType === 'object') {
            for (var key in arg) {
                if (arg.hasOwnProperty(key) && arg[key]) {
                    classes.push(key)
                }
            }
        }
    }

    return classes.join(' ')
}



avalon.directive('class', {
    diff: function (newValue, oldValue, name) {
        var type = this
        var vdom = this.node
        var classEvent = this.classEvent || {}
        if (type === 'hover') {//在移出移入时切换类名
            classEvent.mouseenter = activateClass
            classEvent.mouseleave = abandonClass
        } else if (type === 'active') {//在获得焦点时切换类名
            classEvent.tabIndex = vdom.props.tabindex || -1
            classEvent.mousedown = activateClass
            classEvent.mouseup = abandonClass
            classEvent.mouseleave = abandonClass
        }
        this.classEvent = classEvent

        var className = classNames(newValue)

        if (typeof oldValue === void 0 || oldValue !== className) {
            this.value = className

            vdom['change-' + type] = className
            return true
        }
    },
    update: function (vdom, className) {
        var dom = vdom.dom
        if (!dom || dom.nodeType !== 1)
            return
        var change = 'change-' + this.type
        var classEvent = vdom.classEvent
        if (classEvent) {
            for (var i in classEvent) {
                if (i === 'tabIndex') {
                    dom[i] = classEvent[i]
                } else {
                    avalon.bind(dom, i, classEvent[i])
                }
            }
            vdom.classEvent = {}
        }
        var names = ['class', 'hover', 'active']
        names.forEach(function (type) {
            var name = 'change-' + type
            var value = vdom[name]
            if (value === void 0)
                return

            if (type === 'class') {
                dom && setClass(dom, vdom)
            } else {
                var oldClass = dom.getAttribute(change)
                if (change) {
                    avalon(dom).removeClass(change)
                }
                dom.setAttribute(name, value)
            }
        })
    }
})

directives.active = directives.hover = directives['class']


var classMap = {
    mouseenter: 'change-hover',
    mouseleave: 'change-hover',
    mousedown: 'change-active',
    mouseup: 'change-active'
}

function activateClass(e) {
    var elem = e.target
    avalon(elem).addClass(elem.getAttribute(classMap[e.type]) || '')
}

function abandonClass(e) {
    var elem = e.target
    var name = classMap[e.type]
    avalon(elem).removeClass(elem.getAttribute(name) || '')
    if (name !== 'change-active') {
        avalon(elem).removeClass(elem.getAttribute('change-active') || '')
    }
}

function setClass(dom, vdom) {
    var old = dom.getAttribute('old-change-class')
    var neo = vdom['ms-class']
    if (old !== neo) {
        avalon(dom).removeClass(old).addClass(neo)
        dom.setAttribute('old-change-class', neo)
    }

}

markID(activateClass)
markID(abandonClass)


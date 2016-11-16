import { avalon, config, inBrowser, delayCompileNodes, directives } from
        '../seed/core'
import { fromDOM } from '../vtree/fromDOM'
import { fromString } from '../vtree/fromString'

import { VFragment } from '../vdom/VFragment'
import { DirectiveDecorator } from './decorator'

import { orphanTag } from '../vtree/orphanTag'
import { parseAttributes } from '../parser/attributes'
import { parseInterpolate } from '../parser/interpolate'

import { startWith, groupTree, dumpTree, getRange } from './share'



/**
 * 生成一个渲染器,并作为它第一个遇到的ms-controller对应的VM的$render属性
 * @param {String|DOM} node
 * @param {ViewModel|Undefined} vm
 * @param {Function|Undefined} beforeReady
 * @returns {Render}
 */
avalon.scan = function (node, vm, beforeReady) {
        return new Render(node, vm, beforeReady || avalon.noop)
}
/**
 * avalon.scan 的内部实现
 */
function Render(node, vm, beforeReady) {
        this.root = node //如果传入的字符串,确保只有一个标签作为根节点
        this.vm = vm
        this.beforeReady = beforeReady
        this.bindings = [] //收集待加工的绑定属性
        this.callbacks = []
        this.directives = []
        this.init()
}



var cp = Render.prototype
/**
 * 开始扫描指定区域
 * 收集绑定属性
 * 生成指令并建立与VM的关联
 */
cp.init = function () {
        var vnodes
        if (this.root && this.root.nodeType > 0) {
                vnodes = fromDOM(this.root) //转换虚拟DOM
                //将扫描区域的每一个节点与其父节点分离,更少指令对DOM操作时,对首屏输出造成的频繁重绘
                dumpTree(this.root)
        } else if (typeof this.root === 'string') {
                vnodes = fromString(this.root) //转换虚拟DOM
        }

        this.root = vnodes[0]
        this.vnodes = vnodes
        this.scanChildren(vnodes, this.vm, true)
}
cp.scanChildren = function (children, scope, isRoot) {
        for (var i = 0; i < children.length; i++) {
                var vdom = children[i]
                switch (vdom.nodeName) {
                        case '#text':
                                this.scanText(vdom, scope)
                                break
                        case '#comment':
                                this.scanComment(vdom, scope, children)
                                break
                        case '#document-fragment':
                                this.scanChildren(vdom.children, scope, false)
                                break
                        default:
                                this.scanTag(vdom, scope, children, false)
                                break
                }
        }
        if (isRoot) {
                this.complete()
        }
}
/**
 * 从文本节点获取指令
 */
cp.scanText = function (vdom, scope) {
        if (config.rexpr.test(vdom.nodeValue)) {
                this.bindings.push([vdom, scope, {
                        nodeValue: vdom.nodeValue
                }])
        }
}
/**
 * 从注释节点获取指令
 */
cp.scanComment = function (vdom, scope, parentChildren) {
       
    if (startWith(vdom.nodeValue, 'ms-for:')) {
            this.getForBinding(vdom, scope, parentChildren)
    }
       
}
/**
 * 从元素节点的nodeName与属性中获取指令
 */
cp.scanTag = function (vdom, scope, parentChildren, isRoot) {
        var dirs = {}, attrs = vdom.props, hasDir, hasFor
        for (var attr in attrs) {
                var value = attrs[attr]
                var oldName = attr
                if (attr.charAt(0) === ':') {
                        attr = 'ms-' + attr.slice(1)
                }
                if (startWith(attr, 'ms-')) {
                        dirs[attr] = value
                        hasDir = true
                }
                if (attr === 'ms-for') {
                        hasFor = value
                        delete attrs[oldName]
                }
        }
        var expr = dirs['ms-important'] || dirs['ms-controller']
        if (expr) {
                //推算出指令类型
                var type = dirs['ms-important'] === expr ? 'important' : 'controller'
                //推算出用户定义时属性名,是使用ms-属性还是:属性
                var name = ('ms-' + type) in attrs ? 'ms-' + type : ':' + type
                var dir = directives[type]
                var render = this
                scope = dir.getScope.call(this, expr, scope)
                delete dirs['ms-' + type]
                this.callbacks.push(function () {
                        dir.update.call(render, vdom, scope, name)
                })
        }
        if (hasFor) {
                if (vdom.dom) {
                        vdom.dom.removeAttribute(oldName)
                }
                return this.getForBindingByElement(vdom, scope, parentChildren, hasFor)
        }

        if (/^ms\-/.test(vdom.nodeName)) {
                attrs.is = vdom.nodeName
        }

        if (attrs['is']) {
                if (!dirs['ms-widget']) {
                        dirs['ms-widget'] = '{}'
                }
                hasDir = true
        }
        if (hasDir) {
                this.bindings.push([vdom, scope, dirs])
        }
        var children = vdom.children
        //如果存在子节点,并且不是容器元素(script, stype, textarea, xmp...)
        if (!orphanTag[vdom.nodeName]
                && children
                && children.length
                && !delayCompileNodes(dirs)
        ) {
                this.scanChildren(children, scope, false)
        }
}


/**
 * 将绑定属性转换为指令
 * 执行各种回调与优化指令
 * @returns {undefined}
 */

cp.complete = function () {
        this.yieldDirectives()
        this.beforeReady()
        if (inBrowser) {
                var root = this.root
                var rootDom = avalon.vdom(root, 'toDOM')
                groupTree(rootDom, root.children)
        }

        this.mount = true
        for (var i = 0, fn; fn = this.callbacks[i++];) {
                fn()
        }
        this.optimizeDirectives()
}

/**
 * 将收集到的绑定属性进行深加工,最后转换指令
 * @param {tuple} tuple
 * @returns {Array<tuple>}
 */
cp.yieldDirectives = function () {
        var tuple
        while (tuple = this.bindings.shift()) {
                var [vdom, scope, dirs] = tuple
                var bindings = []
                if ('nodeValue' in dirs) {
                        bindings = parseInterpolate(dirs)
                } else if (!('ms-skip' in dirs)) {
                        bindings = parseAttributes(dirs, tuple)
                }
                for (var i = 0, binding; binding = bindings[i++];) {
                        var dir = directives[binding.type]
                        if (dir.beforeInit) {
                                dir.beforeInit.call(binding)
                        }
                        var directive = new DirectiveDecorator(scope, binding, vdom, this)
                        this.directives.push(directive)
                }
        }
}
/**
 * 修改指令的update与callback方法,让它们以后执行时更加高效
 * @returns {undefined}
 */
var viewID
cp.optimizeDirectives = function () {
        for (var i = 0, el; el = this.directives[i++];) {
                el.callback = directives[el.type].update
                el.update = function () {
                        var oldVal = this.oldValue
                        var newVal = this.value = this.get()
                        if (this.callback && this.diff(newVal, oldVal)) {
                                this.callback(this.node, this.value)
                                var vm = this.vm
                                var $render = vm.$render
                                var list = vm.$events['onViewChange']
                                if (list && $render && $render.root && !avalon.viewChanging) {
                                        if (viewID) {
                                                clearTimeout(viewID)
                                                viewID = null
                                        }
                                        /* istanbul ignore next */
                                        viewID = setTimeout(function () {
                                                list.forEach(function (el) {
                                                        el.callback.call(vm, {
                                                                type: 'viewchange',
                                                                target: $render.root,
                                                                vmodel: vm
                                                        })
                                                })
                                        })

                                }

                        }
                }
        }
}
/**
 * 销毁所有指令
 * @returns {undefined}
 */
cp.destroy = function () {
        var list = this.directives || []
        for (var i = 0, el; el = list[i++];) {
                el.destroy()
        }
        for (var i in this) {
                delete this[i]
        }
}
/**
 * 将循环区域转换为for指令
 * @param {type} node
 * @param {type} scope
 * @param {type} parentChildren
 * @returns {undefined}
 */

cp.getForBinding = function (begin, scope, parentChildren, userCb) {
        var expr = begin.nodeValue.replace('ms-for:', '').trim()
        begin.nodeValue = 'msfor:' + expr
        var nodes = getRange(parentChildren, begin)
        var end = nodes.end
        var fragment = avalon.vdom(nodes, 'toHTML')
        parentChildren.splice(nodes.start, nodes.length)
        begin.props = {}
        this.bindings.push([
                begin, scope, {
                        'ms-for': expr
                }, {
                        begin,
                        end,
                        expr,
                        userCb,
                        fragment,
                        parentChildren
                }
        ])
}


/**
 * 在带ms-for元素节点旁添加两个注释节点,组成循环区域
 * @param {type} node
 * @param {type} scope
 * @param {type} parentChildren
 * @param {type} value
 * @returns {undefined}
 */
cp.getForBindingByElement = function (vdom, scope, parentChildren, expr) {
        var index = parentChildren.indexOf(vdom) //原来带ms-for的元素节点
        var props = vdom.props
        var begin = {
                nodeName: '#comment',
                nodeValue: 'ms-for:' + expr
        }
        if (props.slot) {
                begin.slot = props.slot
                delete props.slot
        }
        var end = {
                nodeName: '#comment',
                nodeValue: 'ms-for-end:'
        }
        parentChildren.splice(index, 1, begin, vdom, end)
        this.getForBinding(begin, scope, parentChildren, props['data-for-rendered'])

}

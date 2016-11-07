import { avalon, createFragment, config, inBrowser, delayCompileNodes, directives } from
    '../seed/core'
import { fromDOM } from
    '../vtree/fromDOM'
import { fromString } from
    '../vtree/fromString'

import { VFragment } from
    '../vdom/VFragment'
import { DirectiveDecorator } from
    './decorator'

import { orphanTag } from
    '../vtree/orphanTag'
import { parseAttributes } from
    '../parser/attributes'
import { parseInterpolate } from
    '../parser/interpolate'

import '../directives/compact'


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
    this.getBindings(this.root, true, this.vm, [])
}
/**
 * 
 * @param {DOM} dom
 * @param {type} isRoot
 * @param {type} scope
 * @param {Array} children, dom所在的原数组
 * @returns {undefined}
 */
cp.getBindings = function (dom, isRoot, scope, children) {
    var childNodes = dom.children
    var dirs = this.getBinding(dom, scope, children)
    if (/^\w/.test(dom.nodeName)) {
        var expr = dirs['ms-important'] || dirs['ms-controller']
        if (expr) {
            //推算出指令类型
            var type = dirs['ms-important'] === expr ? 'important' : 'controller'
            //推算出用户定义时属性名,是使用ms-属性还是:属性
            var name = ('ms-' + type) in dom.props ? 'ms-' + type : ':' + type
            var dir = directives[type]
            scope = dir.getScope(expr, scope)
            delete dirs['ms-' + type]
            var render = this
            this.callbacks.push(function () {
                dir.update.call(render, dom, scope, name)
            })
        }

    }
    if (dirs) {
        this.bindings.push([dom, scope, dirs])
    }
    //如果存在子节点,并且不是容器元素(script, stype, textarea, xmp...)
    if (!orphanTag[dom.nodeName]
        && childNodes
        && childNodes.length
        && !delayCompileNodes(dirs || {})
    ) {
        for (var i = 0; i < childNodes.length; i++) {
            this.getBindings(childNodes[i], false, scope, childNodes)
        }
    }
    if (isRoot) {
        this.complete()
    }
}
/**
 * 
 * @param {type} node
 * @param {type} scope
 * @param {type} childNodes
 * @returns {Array|false}
 */
cp.getBinding = function (node, scope, childNodes) {
    switch (node.nodeName) {
        case '#text':
            if (config.rexpr.test(node.nodeValue)) {
                return {
                    nodeValue: node.nodeValue
                }
            }
            break
        case "#comment":
            if (startWith(node.nodeValue, 'ms-for:')) {
                this.getForBinding(node, scope, childNodes)
            }
            break
        default:
            var attrs = node.props
            var dirs = {}, has = false
            for (var name in attrs) {
                var value = attrs[name]
                var oldName = name
                if (name.charAt(0) === ':') {
                    name = 'ms-' + name.slice(1)
                }
                if (startWith(name, 'ms-')) {
                    dirs[name] = value
                    has = true
                }
                if (name === 'ms-for') {
                    delete dirs[name]
                    delete attrs[oldName]
                    if (node.dom) {
                        node.dom.removeAttribute(oldName)
                    }
                    this.getForBindingByElement(node, scope, childNodes, value)
                    break
                }
            }

            if (attrs['is']) {
                if (!dirs['ms-widget']) {
                    dirs['ms-widget'] = '{}'
                }
                has = true
            }
            return has ? dirs : false
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
    let tuple
    while (tuple = this.bindings.shift()) {
        let [node, scope, dirs] = tuple
        let bindings = []
        if ('nodeValue' in dirs) {
            bindings = parseInterpolate(dirs)
        } else if (!('ms-skip' in dirs)) {
            bindings = parseAttributes(dirs, tuple)
        }
        for (let i = 0, binding; binding = bindings[i++];) {
            var dir = directives[binding.type]
            if (dir.beforeInit) {
                dir.beforeInit.call(binding)
            }
            let directive = new DirectiveDecorator(node, binding, scope, this)
            this.directives.push(directive)
        }
    }
}
/**
 * 修改指令的update与callback方法,让它们以后执行时更加高效
 * @returns {undefined}
 */
cp.optimizeDirectives = function () {
    for (var i = 0, el; el = this.directives[i++];) {
        el.callback = directives[el.type].update
        el.update = function () {
            var oldVal = this.oldValue
            var newVal = this.value = this.get()
            if (this.callback && this.diff(newVal, oldVal)) {
                this.callback(this.node, this.value)
            }
        }
    }
}
/**
 * 销毁所有指令
 * @returns {undefined}
 */
cp.destroy = function () {
    for (var i = 0, el; el = this.directives[i++];) {
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
 * @param {type} childNodes
 * @returns {undefined}
 */
cp.getForBinding = function (node, scope, childNodes) {
    var nodes = []
    var deep = 1
    var begin = node, end
    var expr = node.nodeValue.replace('ms-for:', '')
    node.nodeValue = 'msfor:' + expr

    var i = childNodes.indexOf(node) + 1
    var start = i
    while (node = childNodes[i++]) {
        nodes.push(node)

        if (node.nodeName === '#comment') {
            if (startWith(node.nodeValue, 'ms-for:')) {
                deep++
            } else if (node.nodeValue === 'ms-for-end:') {
                deep--
                if (deep === 0) {
                    node.nodeValue = 'msfor-end:'
                    end = node
                    nodes.pop()
                    break
                }
            }
        }

    }

    var f = new VFragment(nodes)
    f.fragment = avalon.vdom(f, 'toHTML')
    f.begin = begin
    f.end = end
    f.userCb = begin.userCb
    delete begin.userCb
    f.parentChildren = childNodes
    f.props = {}//冒充元素节点
    childNodes.splice(start, nodes.length)
    this.bindings.push([
        f, scope, { 'ms-for': expr }
    ])
}
/**
 * 在带ms-for元素节点旁添加两个注释节点,组成循环区域
 * @param {type} node
 * @param {type} scope
 * @param {type} childNodes
 * @param {type} value
 * @returns {undefined}
 */
cp.getForBindingByElement = function (node, scope, childNodes, value) {
    var index = childNodes.indexOf(node) //原来带ms-for的元素节点

    var begin = {
        nodeName: '#comment',
        nodeValue: 'ms-for:' + value,
        userCb: node.props['data-for-rendered']
    }
    var end = {
        nodeName: '#comment',
        nodeValue: 'ms-for-end:'
    }

    childNodes.splice(index, 1, begin, node, end)
    this.getForBinding(begin, scope, childNodes)

}

function startWith(long, short) {
    return long.indexOf(short) === 0
}


var rhasChildren = /1/
function groupTree(parent, children) {
    children.forEach(function (vdom) {
        if (vdom.nodeName === '#document-fragment') {
            var dom = createFragment()
        } else {
            dom = avalon.vdom(vdom, 'toDOM')
        }
        if (rhasChildren.test(dom.nodeType) && vdom.children && vdom.children.length) {
            groupTree(dom, vdom.children)
        }
        //高级版本可以尝试 querySelectorAll
        try {
            if (!appendChildMayThrowError[parent.nodeName.toLowerCase()]) {
                parent.appendChild(dom)
            }
        } catch (e) { }
    })
}
var appendChildMayThrowError = {
    '#text': 1,
    '#comment': 1,
    script: 1,
    style: 1,
    noscript: 1
}
function dumpTree(elem) {
    var firstChild
    while (firstChild = elem.firstChild) {
        if (firstChild.nodeType === 1) {
            dumpTree(firstChild)
        }
        elem.removeChild(firstChild)
    }
}
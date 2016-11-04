import { avalon, createFragment, config, delayCompileNodes ,directives} from
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

function startWith(long, short) {
    return long.indexOf(short) === 0
}


avalon.scan = function (node, vm, beforeReady) {
    return new Render(node, vm, beforeReady || avalon.noop)
}

function Render(node, vm, beforeReady) {
    this.root = node
    this.vm = vm
    this.beforeReady = beforeReady
    this.queue = []
    this.callbacks = []
    this.directives = []
    this.init()
}



var cp = Render.prototype

cp.init = function () {
    var vnodes
    if (this.root && this.root.nodeType > 0) {
        vnodes = fromDOM(this.root) //转换虚拟DOM
        dumpTree(this.root)
    } else if (typeof this.root === 'string') {
        vnodes = fromString(this.root) //转换虚拟DOM
    }

    this.root = vnodes[0]
    this.vnodes = vnodes
    this.getBindings(this.root, true, this.vm, [])
}

cp.getBindings = function (element, isRoot, scope, children) {
    var childNodes = element.children
    var dirs = this.getRawBindings(element, scope, children)
    if (/^\w/.test(element.nodeName)) {
        var ctrlValue = dirs['ms-important'] || dirs['ms-controller']

        if (ctrlValue) {
            var ctrlName = dirs['ms-important'] == ctrlValue ? 'important' : 'controller'
            var prefix = 'ms-' + ctrlName in element.props ? 'ms-' : ':'
            var ctrl = directives[ctrlName]
            scope = ctrl.getScope(ctrlValue, scope)
            delete dirs['ms-' + ctrlName]
            var render = this
            this.callbacks.push(function () {
                ctrl.update.call(render, element, scope, prefix + ctrlName)
            })
        }

    }
    if (dirs) {
        this.queue.push([element, scope, dirs])
    }
    if (!orphanTag[element.nodeName]
        && childNodes
        && childNodes.length
        && !delayCompileNodes(dirs || {})
    ) {
        for (var i = 0; i < childNodes.length; i++) {
            this.getBindings(childNodes[i], false, scope, childNodes)
        }
    }
    if (isRoot) {
        this.compileBindings()
    }
}


cp.getRawBindings = function (node, scope, childNodes) {
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

cp.compileBindings = function () {

    this.queue.forEach(function (tuple) {
        this.parseBindings(tuple)
    }, this)

    this.beforeReady()
    var root = this.root
    var rootDom = avalon.vdom(root, 'toDOM')
    groupTree(rootDom, root.children)
    avalon.log('attach dom tree!')
    this.queue.length = 0
    this.mount = true
    for (var i = 0, fn; fn = this.callbacks[i++];) {
        fn()
    }
    this.directives.forEach(function (el) {
        el.callback = directives[el.type].update
        el.update = function () {
            var oldVal = this.oldValue
            var newVal = this.value = this.get()
            if (this.callback && this.diff(newVal, oldVal)) {
                this.callback(this.node, newVal)
            }
        }
    })
}

/**
 * 将收集到的绑定属性进行深加工,最后转换为watcher
 * @param   {Array}  tuple  [node, scope, dirs]
 */
cp.parseBindings = function (tuple) {
    var node = tuple[0]
    var scope = tuple[1]
    var dirs = tuple[2]
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
        var directive = new DirectiveDecorator(node, binding, scope, this)
        this.directives.push(directive)

    }
}


cp.destroy = function () {
    this.directives.forEach(function (directive) {
        directive.destroy()
    })
    for (var i in this) {
        delete this[i]
    }
}

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
    f.props = {}
    childNodes.splice(start, nodes.length)
    this.queue.push([
        f, scope, { 'ms-for': expr }
    ])
}
cp.getForBindingByElement = function (node, scope, childNodes, value) {
    var si = childNodes.indexOf(node) //原来带ms-for的元素节点

    var begin = {
        nodeName: '#comment',
        nodeValue: 'ms-for:' + value,
        userCb: node.props['data-for-rendered']
    }
    var end = {
        nodeName: '#comment',
        nodeValue: 'ms-for-end:'
    }


    childNodes.splice(si, 1, begin, node, end)

    this.getForBinding(begin, scope, childNodes)

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
        if (rhasChildren.test(parent.nodeType))
            parent.appendChild(dom)
    })
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
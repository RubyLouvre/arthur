import { avalon, createFragment, config, inBrowser, delayCompileNodes } from '../seed/core'
import { fromDOM } from '../vtree/fromDOM'
import { VFragment } from '../vdom/VFragment'
import { Watcher } from '../vmodel/watcher'

import { orphanTag } from '../vtree/orphanTag'
import { parseAttributes } from '../parser/parseAttributes'
import { parseInterpolate } from '../parser/parseInterpolate'

import '../directives/controller'
import '../directives/important'

function startWith(long, short) {
    return long.indexOf(short) === 0
}

function emptyNode(a) {
    var f = createFragment()
    while (a.firstChild) {
        f.appendChild(a.firstChild)
    }
    return f
}

avalon.scan = function (node, vm) {
    return new Render(node, vm)
}

function Render(node, vm) {
    this.node = node
    this.vm = vm
    this.queue = []
    this.callbacks = []
    this.directives = []
    this.init()
}

var cp = Render.prototype
cp.init = function () {
    var vnodes = fromDOM(this.node) //转换虚拟DOM
    var elems = avalon.slice(this.node.getElementsByTagName('*'))
    for (var i = 0, elem; elem = elems[i++];) {
        if (elem.parentNode) {
            elem.parentNode.removeChild(elem)
        }
    }
    this.vnodes = vnodes
    this.getBindings(vnodes[0], true, this.vm)
}

cp.getBindings = function (element, root, scope) {
    var childNodes = element.children
    var dirs = this.getRawBindings(element, childNodes)
    if (/^\w/.test(element.nodeName)) {
        var ctrlValue = dirs['ms-important'] || dirs['ms-controller']

        if (ctrlValue) {
            var ctrlName = dirs['ms-important'] == ctrlValue ? 'important' : 'controller'
            var ctrl = avalon.directives[ctrlName]
            scope = ctrl.getScope(ctrlValue, scope)
            delete dirs['ms-' + ctrlName]
            this.callbacks.push({
                scope: scope,
                node: element,
                callback: ctrl.callback
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
            this.getBindings(childNodes[i], false, scope)
        }
    }
    if (root) {
        this.compileBindings()
    }
}


cp.getRawBindings = function (node, childNodes) {
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
                var nodes = []
                var deep = 1
                var begin = node
                var expr = node.nodeValue.replace('ms-for:', '')
                node.nodeValue = 'msfor:' + expr

                var i = childNodes.indexOf(node) + 1
                var start = i
                while (node = childNodes[i++]) {
                    nodes.push(node)

                    if (node.nodeName === '#comment') {
                        if (startWith(node.nodeValue, 'ms-for:')) {
                            deep++
                        } else if (startWith(node.nodeValue, 'ms-for-end:')) {
                            deep--
                            if (deep === 0) {
                                node.nodeValue = 'msfor-end:'
                                nodes.pop()
                            }
                        }
                    }

                }
                var f = new VFragment(nodes)

                childNodes.splice(start, nodes.length)
                this.queue.push([
                    f, this.vm, { 'ms-for': expr }, begin
                ])
            }
            break
        default:
            var attrs = node.props
            var dirs = {}, has = false
            for (var name in attrs) {
                var value = attrs[name]
                if (name.charAt(0) === ':') {
                    name = name.replace(rcolon, 'ms-')
                }
                if (startWith(name, 'ms-')) {
                    dirs[name] = value
                    has = true
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
function createDOMTree(parent, children) {
    children.forEach(function (vnode) {
        var node = avalon.vdom(vnode, 'toDOM')
        if (node.nodeType === 1 && vnode.children && vnode.children.length) {
            createDOMTree(node, vnode.children)
        }
        if (!avalon.contains(parent, node)) {
            parent.appendChild(node)
        }
    })
}

cp.compileBindings = function () {
    this.queue.forEach(function (tuple) {
        this.parseBindings(tuple)
    }, this)
    var root = this.vnodes[0]
    createDOMTree(root.dom, root.children)

    this.callbacks.forEach(function (el) {
        el.callback()
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
    var d = avalon.directives
    if ('nodeValue' in dirs) {
        bindings = parseInterpolate(dirs)
    } else if (!('ms-skip' in dirs)) {
        bindings = parseAttributes(dirs, tuple)
    }
    for (var i = 0, binding; binding = bindings[i++];) {
        var dir = d[binding.type]
        if (dir.parse) {
            dir.parse(binding)
        }
        this.directives.push(new DirectiveWatcher(node, binding, scope))
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

/**
 * 一个watcher装饰器
 * @returns {watcher}
 */
function DirectiveWatcher(node, binding, scope) {
    var type = binding.type
    var directive = avalon.directives[type]
    if (inBrowser) {
        var dom = avalon.vdom(node, 'toDOM')
        if (dom.nodeType === 1) {
            dom.removeAttribute(binding.attrName)
        }
        node.dom = dom
    }
    var callback = directive.update ? function (value) {
        console.log(dom, value)
        directive.update.call(this, node, value)
    } : avalon.noop
    var watcher = new Watcher(scope, binding, callback)
    if(directive.eq){
       watcher.eq = directive.eq 
    }
    watcher.node = node
    watcher._destory = directive.destory
    if (directive.init)
        directive.init(watcher)
    delete watcher.value
    watcher.update()
    return watcher
}

avalon.directive('nodeValue', {
    update: function (node, value) {
        node.dom.nodeValue = value
    }
})
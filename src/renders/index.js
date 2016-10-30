import { avalon, createFragment, config } from '../seed/core'
import { fromDOM } from '../vtree/fromDOM'
import { VFragment } from '../vdom/VFragment'

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
function delayCompileNodes() { }

function Render(node, vm) {
    this.node = node
    this.vm = vm
    this.queue = []
    this.directives = []
    this.init()
}

var cp = Render.prototype
cp.init = function () {
    var vnodes = fromDOM(this.node) //转换虚拟DOM
    emptyNode(this.node) //移除里面的所有孩子
    this.getBindings(vnodes[0], true)
}

cp.getBindings = function (element, root) {

    var childNodes = element.children
    var scope = this.vm
    var dirs = this.getRawBindings(element, childNodes)
    if (dirs) {
        this.queue.push([element, scope, dirs])
    }
    if (!/style|textarea|xmp|script|template/i.test(element.nodeName)
        && childNodes
        && childNodes.length
        && !delayCompileNodes(dirs || {})
    ) {
        for (var i = 0; i < childNodes.length; i++) {
            this.getBindings(childNodes[i], false)
        }
    }
    if (root) {
        this.compileBindings()
    }
}
function startWith(long, short) {
    return long.indexOf(short) === 0
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
                var value = attrs[i]
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
cp.compileBindings = function () {
    this.queue.forEach(function (tuple) {
        this.parseBindings(tuple)
    }, this)
    //  this.node.appendChild(this.fragment)
}

/**
    * 将收集到的绑定属性进行深加工,最后转换为watcher
    * @param   {Array}  tuple  [node, scope, dirs]
    */
cp.parseBindings = function (tuple) {
    var node = tuple[0]
    var scope = tuple[1]
    var dirs = tuple[2]
    if ('nodeValue' in dirs) {
        this.parseText(node, dirs, scope)
    } else if (!('ms-skip' in dirs)) {
        var uniq = {}, bindings = []
        var directives = avalon.directives
        for (var name in dirs) {
            var value = dirs[name]
            var rbinding = /^(\:|ms\-)\w+/
            var match = name.match(rbinding)
            var arr = name.replace(match[1], '').split('-')

            if (eventMap[arr[0]]) {
                arr.unshift('on')
            }
            if (arr[0] === 'on') {
                arr[2] = parseFloat(arr[2]) || 0
            }
            arr.unshift('ms')
            var type = arr[1]
            if (directives[type]) {

                var binding = {
                    type: type,
                    param: arr[2],
                    name: arr.join('-'),
                    expr: value,
                    priority: directives[type].priority || type.charCodeAt(0) * 100
                }
                if (type === 'on') {
                    binding.priority += arr[3]
                }
                if (!uniq[binding.name]) {
                    uniq[binding.name] = value
                    bindings.push(binding)
                    if (type === 'for') {
                        binding.begin = tuple[3]
                        bindings = [binding]
                        break
                    }
                }

            }

        }

        bindings.forEach(function (binding) {
            this.parse(node, binding, scope)
        }, this)
    }
}

cp.parse = function (node, binding, scope) {
    var dir = avalon.directives[binding.type]
    if (dir) {
        if (dir.parse) {
            dir.parse(binding)
        }
        this.directives.push(new DirectiveWatcher(node, binding, scope))
    }
}

cp.parseText = function (node, dir, scope) {
    var rlineSp = /\n\r?/g
    var text = dir.nodeValue.trim().replace(rlineSp, '')
    var pieces = text.split(/\{\{(.+?)\}\}/g)
    var tokens = []
    pieces.forEach(function (piece) {
        var segment = '{{' + piece + '}}'
        if (text.indexOf(segment) > -1) {
            tokens.push('(' + piece + ')')
            text = text.replace(segment, '')
        } else if (piece) {
            tokens.push(avalon.quote(piece))
            text = text.replace(piece, '')
        }
    })
    var binding = {
        expr: tokens.join('+'),
        name: 'nodeValue',
        type: 'nodeValue'
    }

    this.directives.push(new DirectiveWatcher(node, binding, scope))
}

cp.destroy = function () {
    this.directives.forEach(function (directive) {
        directive.destroy()
    })
    for (var i in this) {
        delete this[i]
    }
}

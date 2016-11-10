import { avalon, isObject, platform } from '../seed/core'
import { cssDiff } from '../directives/css'
import { dumpTree, groupTree } from '../renders/index'
var legalTags = { wbr: 1, xmp: 1, template: 1 }
var events = 'onInit,onReady,onViewChange,onDispose'
var componentEvents = avalon.oneObject(events)
avalon.directive('widget', {
    delay: true,
    priority: 4,
    //  var value = platform.toJson(rules)
    //cssDiff.call(this,vdom, value)
    init: function () {

        var vdom = this.node
        var value = this.value
        //如果是非空元素，比如说xmp, ms-*, template
        var nodesWithSlot = []
        var directives = []
        if (!vdom.isVoidTag) {
            var text = vdom.children[0]
            if (text && text.nodeValue) {
                //用上面的VM处理innerHTML中的元素
                var childBoss = avalon.scan('<div>' + text.nodeValue + '</div>', this.vm, function () {
                    nodesWithSlot = this.root.children
                })
                directives = childBoss.directives
            }
        }
        // ＝＝＝创建组件的VM＝＝BEGIN＝＝＝
        var is = vdom.props.is
        var component = avalon.components[is]


        var vm = this.vm = createComponentVm(component, value, is)

        vm.$fire('onInit', {
            type: 'init',
            target: vdom.dom,
            vmodel: vm
        })

        // ＝＝＝创建组件的VM＝＝END＝＝＝
        var boss = avalon.scan(component.template, vm)
        boss.directives.push.apply(boss.directives, directives)
        var root = boss.root
        for (var i in root) {
            vdom[i] = root[i]
        }
        boss.root = vdom
        boss.vnodes[0] = vdom

        var arraySlot = [], objectSlot = {}
        //从用户写的元素内部 收集要移动到 新创建的组件内部的元素
        if (component.soleSlot) {
            arraySlot = nodesWithSlot
        } else {
            avalon.each(nodesWithSlot, function (el) {//要求带slot属性
                var name = el && el.props && el.props.slot
                if (name) {
                    objectSlot[name] = el
                }
            })
        }

        //将原来元素的所有孩子，全部移动新的元素的第一个slot的位置上
    
        if (component.soleSlot) {
            insertArraySlot(boss.vnodes, arraySlot)
        } else {
            insertObjectSlot(boss.vnodes, objectSlot)
        }
        dumpTree(vdom.dom)

        groupTree(vdom.dom, vdom.children)

        vm.$fire("onReady", {
            type: 'ready',
            target: vdom.dom,
            vmodel: vm
        })
      
        this.beforeDistory = function () {
            this.vm.$fire("onDispose", {
                type: 'dispose',
                target: vdom.dom,
                vmodel: vm
            })
        }
        this.boss = boss


    },
    diff: function (node, value) {
        return true
    },

    destory: function () {
        this.comBoss.destory()
    }
})

export function createComponentVm(component, value, is) {
    var hooks = {
        onReady: [],
        onDispose: [],
        onViewChange: [],
        onInit: []
    }
    var def = avalon.mix({}, component.defaults)
    collectHooks(def, hooks)
    collectHooks(value, hooks)
    def.$id = value.id || value.$id || avalon.makeHashCode(is)
    delete value.id
    delete value.$id
    avalon.mix(def, value)
    var vm = avalon.define(def)
    avalon.mix(vm.$events, hooks)
    return vm
}

function collectHooks(a, hooks) {
    for (var i in a) {
        if (componentEvents[i]) {
            if (typeof a[i] === 'function') {
                hooks[i].unshift(a[i])
            }
            delete a[i]
        }
    }
}

function insertArraySlot(nodes, arr) {
    for (var i = 0, el; el = nodes[i]; i++) {
        if (el.nodeName === 'slot') {
            nodes.splice.apply(nodes, [i, 1].concat(arr))
            break
        } else if (el.children) {
            insertArraySlot(el.children, arr)
        }
    }
}
function insertObjectSlot(nodes, obj) {
    for (var i = 0, el; el = nodes[i]; i++) {
        if (el.nodeName === 'slot') {
            var name = el.props.name
            nodes.splice.apply(nodes, [i, 1].concat(obj[name]))
            break
        } else if (el.children) {
            insertObjectSlot(el.children, inner)
        }
    }
}

avalon.components = {}
avalon.component = function (name, component) {
    /**
     * template: string
     * defaults: object
     * soleSlot: string
     */
    avalon.components[name] = component
}
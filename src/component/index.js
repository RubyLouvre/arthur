import { avalon, isObject, platform } from '../seed/core'
import { cssDiff } from '../directives/css'
import { dumpTree, groupTree } from '../renders/index'

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
        if (!vdom.isVoidTag) {
            var text = vdom.children[0]
            if (text.nodeValue) {
                //用上面的VM处理innerHTML中的元素
                avalon.scan('<div>' + text.nodeValue + '</div>', this.vm, function () {
                    var oldRoot = this.root
                    nodesWithSlot = oldRoot.children
                    vdom.children = oldRoot.children
                    this.root = vdom
                    avalon.clearHTML(vdom.dom)
                })
            }
        }
        // ＝＝＝创建组件的VM＝＝BEGIN＝＝＝
        var is = vdom.props.is
        var component = avalon.components[is]
        var def = avalon.mix({}, component.defaults)
        if (value.id) {
            def.$id = value.id
        }
        for (var i in def) {
            if (i !== 'id' || i !== '$id')
                def[i] = value[i]
        }

        if (!def.$id) {
            def.$id = avalon.makeHashCode(is)
        }

        var vm = avalon.define(def)
        // ＝＝＝创建组件的VM＝＝END＝＝＝
        var boss = avalon.scan(component.template, vm)
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
        console.log(boss.root)
        //将原来元素的所有孩子，全部移动新的元素的第一个slot的位置上

        if (component.soleSlot) {
            insertArraySlot(boss.vnodes, arraySlot)
        } else {
            insertObjectSlot(boss.vnodes, objectSlot)
        }
        dumpTree(vdom.dom)

        groupTree(vdom.dom, vdom.children)

        this.boss = boss


    },
    diff: function (node, value) {
        return true
    },

    destory: function () {
        this.comBoss.destory()
    }
})
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
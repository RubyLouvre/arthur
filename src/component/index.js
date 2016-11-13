import { avalon, isObject, platform } from '../seed/core'
import { cssDiff } from '../directives/css'
import { dumpTree, groupTree, getRange } from '../renders/index'
var legalTags = { wbr: 1, xmp: 1, template: 1 }
var events = 'onInit,onReady,onViewChange,onDispose'
var componentEvents = avalon.oneObject(events)
function toObject(value) {
        var value = platform.toJson(value)
        if (Array.isArray(value)) {
                var v = {}
                value.forEach(function (el) {
                        el && avalon.shadowCopy(v, el)
                })
                return v
        }
        return value
}
avalon.directive('widget', {
        delay: true,
        priority: 4,
        deep: true,
        init: function () {
                var vdom = this.node
                this.cacheVm = !!vdom.props.cached
                var oldValue = this.getValue()
                var value = toObject(oldValue)
                //外部VM与内部VM
                // ＝＝＝创建组件的VM＝＝BEGIN＝＝＝
                var is = vdom.props.is || value.is
                this.is = is
                var component = avalon.components[is]
                //外部传入的总大于内部
                if (!('fragment' in this)) {
                        if (!vdom.isVoidTag) {
                                var text = vdom.children[0]
                                if (text && text.nodeValue) {
                                        this.fragment = text.nodeValue
                                }
                        } else {
                                this.fragment = false
                        }
                }
                //如果组件还没有注册，那么将原元素变成一个占位用的注释节点
                if (!component) {
                        this.readyState = 0
                        vdom.nodeName = '#comment'
                        vdom.nodeValue = 'unresolved component placeholder'
                        var oldDom = vdom.dom
                        if (oldDom) {
                                var p = oldDom.parentNode
                                if (p) {
                                        delete vdom.dom
                                        p.replaceChild(oldDom, avalon.vdom(vdom, 'toDOM'))
                                }
                        }
                        return
                }
                this.readyState = 1
                //如果是非空元素，比如说xmp, ms-*, template
                var id = value.id || value.$id
                var hasCache = avalon.vmodels[id]
                if (hasCache) {
                        comVm = hasCache
                        this.comVm = comVm
                        var boss = this.boss = comVm.$render
                        var root = boss.root
                        for (var i in root) {
                                vdom[i] = root[i]
                        }
                        boss.root = vdom
                        boss.vnodes[0] = vdom
                       
                } else {
                        var comVm = createComponentVm(component, value, is)
                        fireComponentHook(comVm, vdom, 'Init')
                        this.comVm = comVm

                        // ＝＝＝创建组件的VM＝＝END＝＝＝
                        var boss = this.boss =  comVm.$render = avalon.scan(component.template, comVm)
                        var root = boss.root
                        for (var i in root) {
                                vdom[i] = root[i]
                        }
                        boss.root = vdom
                        boss.vnodes[0] = vdom
                        var nodesWithSlot = []
                        var directives = []
                        if (this.fragment || component.soleSlot) {
                                var curVM = this.fragment ? this.vm : comVm
                                var curText = this.fragment || '{{##' + component.soleSlot + '}}'
                                var childBoss = avalon.scan('<div>' + curText + '</div>', curVM, function () {
                                        nodesWithSlot = this.root.children
                                })
                                directives = childBoss.directives
                                for (var i in childBoss) {
                                        delete childBoss[i]
                                }
                        }
                        boss.directives.push.apply(boss.directives, directives)

                        var arraySlot = [], objectSlot = {}
                        //从用户写的元素内部 收集要移动到 新创建的组件内部的元素
                        if (component.soleSlot) {
                                arraySlot = nodesWithSlot
                        } else {
                                nodesWithSlot.forEach(function (el, i) {//要求带slot属性
                                        if (el.props) {
                                                var name = el.props.slot
                                                if (name) {
                                                        delete el.props.slot
                                                        if (Array.isArray(objectSlot[name])) {
                                                                objectSlot[name].push(el)
                                                        } else {
                                                                objectSlot[name] = [el]
                                                        }
                                                }
                                        } else if (el.slot) {
                                                var nodes = getRange(nodesWithSlot, el)
                                                nodes.push(nodes.end)
                                                nodes.unshift(el)
                                                objectSlot[el.slot] = nodes
                                        }
                                })
                        }

                        //将原来元素的所有孩子，全部移动新的元素的第一个slot的位置上
                        if (component.soleSlot) {
                                insertArraySlot(boss.vnodes, arraySlot)
                        } else {
                                insertObjectSlot(boss.vnodes, objectSlot)
                        }
                }


                //处理DOM节点
                dumpTree(vdom.dom)
                groupTree(vdom.dom, vdom.children)

                fireComponentHook(comVm, vdom, 'Ready')
              
                this.beforeDestroy = function () {
                        if (!this.cacheVm) {
                                fireComponentHook(comVm, vdom, 'Dispose')
                                comVm.$hashcode = false
                                delete avalon.vmodels[comVm.$id]
                                this.boss.destroy()

                        }
                       
                }

        },
        diff: function (newVal, oldVal) {
                if (cssDiff.call(this, newVal, oldVal)) {
                        return true
                }
        },
        update: function (vdom, value) {
                this.oldValue = value //★★防止递归
                if (this.readyState > 1) {
                        var comVm = this.comVm
                        if (!this.useWatchOk) {
                                for (var i in value) {
                                        if (comVm.hasOwnProperty(i)) {
                                                comVm[i] = value[i]
                                        }
                                }
                        }
                        //要保证要先触发孩子的ViewChange 然后再到它自己的ViewChange
                        fireComponentHook(comVm, vdom, 'ViewChange')

                } else if (this.readyState === 0) {
                        this.init()
                } else {
                        this.readyState++
                }
        }
})

function fireComponentHook(vm, vdom, name) {
        vm.$fire('on' + name, {
                type: name.toLowerCase(),
                target: vdom.dom,
                vmodel: vm
        })
}
function syncComponentVm(topVm, comVm, object) {
        var _name, name
        for (name in topVm) {
                if (topVm[name] === object) {
                        _name = name
                        break
                }
        }
        if (_name) {
                for (name in object) {
                        topVm.$watch(_name + '.' + name, (function (key) {
                                return function (val) {
                                        comVm[key] = val
                                }
                        })(name))
                }
        }
}


export function createComponentVm(component, value, is) {
        var hooks = []
        var def = avalon.mix({}, component.defaults)
        collectHooks(def, hooks)
        collectHooks(value, hooks)
        def.$id = value.id || value.$id || avalon.makeHashCode(is)
        delete value.id
        delete value.$id
        avalon.mix(def, value)
        var vm = avalon.define(def)
        hooks.forEach(function (el) {
                vm.$watch(el.type, el.cb)
        })
        return vm
}

function collectHooks(a, list) {
        for (var i in a) {
                if (componentEvents[i]) {
                        if (typeof a[i] === 'function') {
                                list.unshift({
                                        type: i,
                                        cb: a[i]
                                })
                        }
                        delete a[i]
                }
        }
}
function resetParentChildren(nodes, arr) {
        var dir = arr[0].forDir
        if (dir) {
                dir.parentChildren = nodes
        }
}
function insertArraySlot(nodes, arr) {
        for (var i = 0, el; el = nodes[i]; i++) {
                if (el.nodeName === 'slot') {
                        resetParentChildren(nodes, arr)
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
                        resetParentChildren(nodes, obj[name])
                        nodes.splice.apply(nodes, [i, 1].concat(obj[name]))
                        break
                } else if (el.children) {
                        insertObjectSlot(el.children, obj)
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
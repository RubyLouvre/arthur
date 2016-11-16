import { avalon, afterCreate, platform, observeItemObject } from
    '../../src/vmodel/modern'
import { Depend } from
    '../../src/vmodel/depend'
import { Directive } from
    '../../src/renders/Directive'
import { isObservable } from
    '../../src/vmodel/share'
describe('vmodel', function () {
    it('isObservable', function () {
        expect(isObservable('aaa', 'ccc')).toBe(true)
        expect(isObservable('$id', 'ccc')).toBe(false)
        expect(isObservable('$render', 'ccc')).toBe(false)
        expect(isObservable('$kkk', 'ccc')).toBe(false)
        expect(isObservable('aaa', function () { })).toBe(false)
        expect(isObservable('aaa', new Date)).toBe(false)
        expect(isObservable('aaa', new Error(111))).toBe(false)
        expect(isObservable('aaa', null)).toBe(true)
        expect(isObservable('aaa', void 0)).toBe(true)
        expect(isObservable('aaa', document.createTextNode('222'))).toBe(false)
    })
    it('vmodel', function () {
        try {
            avalon.define({
                aaa: 1
            })
        } catch (e) {
            expect('error').toBe('error')
        }
        var vm = avalon.define({
            $id: "aaa",
            aaa: 1,
            bbb: null,
            $render: 11
        })

        try {
            vm = avalon.define({
                $id: "aaa",
                aaa: 1
            })
        } catch (e) {
            expect('has defined').toBe('has defined')
        }

        var called = false
        var unwatch = vm.$watch('aaa', function (a) {
            called = a
        })
        var unwatch2 = vm.$watch('aaa', function (a) {

        })
        expect(vm.$id).toBe("aaa")
        expect(vm.$model).toEqual({
            aaa: 1,
            bbb: null
        })
        expect(vm.$hashcode).toMatch(/^\$\d+/)
        expect(vm.$fire).toA('function')
        expect(vm.$watch).toA('function')
        expect(vm.$events).toA('object')
        expect(vm.$events.aaa.length).toBe(2)
        vm.$fire('aaa', '56')
        expect(called).toBe('56')
        unwatch()
        unwatch2()
        expect(vm.$events.aaa).toA('undefined')
        vm.$hashcode = false
        delete avalon.vmodels.aaa
    })
    it('hasSubObject', function () {

        var vm = avalon.define({
            $id: "bbb",
            a: 2,
            aaa: {
                bbb: 1,
                ccc: 2
            },
            arr: [1, 2, 3]
        })
        expect(vm.$model).toEqual({
            a: 2,
            aaa: {
                bbb: 1,
                ccc: 2
            },
            arr: [1, 2, 3]
        })
        vm.a = 3
        var d = vm.aaa
        vm.a = 3
        expect(vm.aaa.$events).toA('object')
        expect(vm.aaa.$fire).toA('undefined')
        expect(vm.aaa.$watch).toA('undefined')
        expect(vm.arr.$events).toA('object')
        expect(vm.arr.remove).toA('function')
        expect(vm.arr.removeAll).toA('function')
        expect(vm.arr.clear).toA('function')
        delete avalon.vmodels.bbb
    })

    it('list', function () {

        var vm = avalon.define({
            $id: 'ccc',
            array: [1]
        })
        var l = vm.array.push({ a: 1 })
        expect(l).toBe(2)
        l = vm.array.pushArray([1, 2, 3])
        expect(l).toBe(5)
        vm.array.unshift(7)
        expect(vm.array[0]).toBe(7)
        var a = vm.array.ensure(8)
        expect(a).toBe(true)
        var b = vm.array.ensure(7)
        expect(b).toBe(false)
        vm.array.removeAll(function (a) {
            return typeof a === 'object'
        })
        expect(vm.array.length).toBe(6)
        var c = vm.array.pop()
        expect(c).toBe(8)
        var d = vm.array.shift()
        expect(d).toBe(7)
        vm.array.removeAll([1, 1, 2])
        expect(vm.array.$model).toEqual([3])
        vm.array.set(0, 2)
        expect(vm.array.$model).toEqual([2])
        vm.array.push(5, 6, 7)
        var a = vm.array.removeAt(0)
        expect(a).toEqual([2])
        vm.array.removeAll()
        expect(vm.array.length).toEqual(0)
        vm.array.splice(0, 0, 4, 5, 6)
        vm.array.clear()
        expect(vm.array.length).toEqual(0)
        a = vm.array.removeAt(8)
        expect(a).toEqual([])
        vm.array.unshift(8, 9, 10)
        vm.array.remove(10)
        expect(vm.array.$model).toEqual([8, 9])
        try {
            vm.array.set(100, 4)
        } catch (e) {
            expect(e).toInstanceOf(Error)
        }
        var arr = vm.array.removeAt('aaa')
        expect(arr).toEqual([])
    })

    it('afterCreate', function () {

        var oldIE = avalon.msie
        avalon.msie = 6
        var core = {}
        var keys = {
            $accessors: {
                a: {
                    get: function () { },
                    set: function () { },
                    enumerable: true,
                    configurable: true
                }
            },
            $id: 'test',
            aaa: 111,
            bbb: 111
        }
        var observer = {}
        afterCreate(core, observer, keys)
        expect(core.__proxy__).toBe(observer)
        expect(keys).toEqual({
            aaa: true,
            bbb: true
        })
        if (!avalon.modern) {
            expect(observer.hasOwnProperty).toMatch(/hasOwnKey/)
        }
        expect(observer.hasOwnProperty('aaa')).toBe(true)
        expect(observer.hasOwnProperty('ccc')).toBe(false)
        var testA = {
            $id: 'aaa',
            arr: [1, 2, 3],
            obj: {
                a: 1,
                b: 2
            },
            c: 88
        }
        var method = avalon.modern ? platform.toJson : platform.toModel
        method(testA)
        var $model = method(testA)
        expect($model).toA('object')
        expect($model.$id).toA('undefined')
        avalon.msie = oldIE

    })


})


describe('observeItemObject', function () {
    it('test', function () {
        var vm = avalon.define({
            $id: 'xcvdsfdsf',
            a: 1,
            b: '2',

            c: new Date,
            d: function () { },
            $e: 33
        })
        var vm2 = observeItemObject(vm, {
            data: {
                dd: 11,
                $cc: 22
            }
        })
        expect(vm2.d).toA('function')
        delete avalon.vmodels.xcvdsfdsf
    })
    it('不会互相干扰', function () {
        var vm = avalon.define({
            $id: 'xxx32',
            kkk: 232
        })
        var vm2 = observeItemObject(vm, {
            data: {
                value: 111
            }
        })
        var vm3 = observeItemObject(vm, {
            data: {
                value: 444
            }
        })
        expect(vm2.value).toBe(111)
        expect(vm3.value).toBe(444)
        vm3.value = 888
        expect(vm2.value).toBe(111)
        expect(vm3.value).toBe(888)
        delete avalon.vmodels.xxx32
    })
})

describe('depend', function () {
    it('test', function () {
        var d = new Depend
        var a = 1
        var b = 1
        d.subs.push({
            update: function () {
                a = 2
            },
            beforeUpdate: function () {
                b = 2
            }
        })
        d.beforeNotify()
        expect(b).toBe(2)
        d.notify()
        expect(a).toBe(2)
    })
})

describe('Directive', function () {
    it('test', function () {
        var vm = avalon.define({
            $id: 'watcher',
            aaa: 11
        })
        var args = []
        var d = new Directive(vm, {
            expr: '@aaa',
            deep: false,
            type: 'user'
        }, function (a, b) {
            args = [a, b]
        })
        expect(d.depends.length >= 1).toBe(true)
        expect(d.value).toBe(11)
        vm.aaa = 333
        expect(args).toEqual([333, 11])
        delete avalon.vmodels.watcher
    })


})
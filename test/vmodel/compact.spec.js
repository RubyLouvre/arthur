import { avalon, afterCreate, platform } from
    '../../src/vmodel/compact'
import { Depend } from
    '../../src/vmodel/depend'
import { Directive } from
    '../../src/renders/Directive'
describe('vmodel', function () {
    it('vmodel', function () {
        var vm = avalon.define({
            $id: "aaa",
            aaa: 1
        })
        var called = false
        var unwatch = vm.$watch('aaa', function (a) {
            called = a
        })
        var unwatch2 = vm.$watch('aaa', function (a) {

        })
        expect(vm.$id).toBe("aaa")
        expect(vm.$model).toEqual({
            aaa: 1
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
        expect(observer.hasOwnProperty).toMatch(/hasOwnKey/)
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
        platform.toModel(testA)
        expect(testA.$model).toA('object')
        expect(testA.$model.$id).toA('undefined')
        avalon.msie = oldIE

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
            type: 'user',
        }, function (a, b) {
            args = [a, b]
        })
        expect(d.depIds.length).toBe(1)
        expect(d.depends.length).toBe(1)
        expect(d.value).toBe(11)
        vm.aaa = 333
        expect(args).toEqual([333, 11])
    })
})
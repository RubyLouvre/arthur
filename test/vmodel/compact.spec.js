import { avalon } from
    '../../src/vmodel/compact'

describe('vmodel', function () {
    it('vmodel', function () {
        var vm = avalon.define({
            $id: "aaa",
            aaa: 1
        })
        var called = false
        vm.$watch('aaa', function (a) {
            called = a
        })
        expect(vm.$id).toBe("aaa")
        expect(vm.$model).toEqual({
            aaa: 1
        })
        expect(vm.$hashcode).toMatch(/^\$\d+/)
        expect(vm.$fire).toA('function')
        expect(vm.$watch).toA('function')
        expect(vm.$events).toA('object')
        vm.$fire('aaa', '56')
        expect(called).toBe('56')
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
        a = vm.array.removeAt(0)
        expect(a).toEqual([])
        vm.array.unshift(8, 9, 10)
        vm.array.remove(10)
        expect(vm.array.$model).toEqual([8, 9])
    })
})
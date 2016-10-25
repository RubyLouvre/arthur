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
    })
})
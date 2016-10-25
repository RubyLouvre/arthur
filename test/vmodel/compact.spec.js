import { avalon} from '../../src/vmodel/compact'

describe('vmodel', function () {
    it('vmodel', function(){
       var vm =  avalon.define({
            $id: "aaa",
            aaa:1
        })
        var called = false
        vm.$watch('aaa', function(a){
            called = a
        })
        expect(vm.$id).toBe("aaa"),
        expect(vm.$model).toEqual({
            aaa: 1
        })
        expect(vm.$hashcode).toMatch(/^\$\d+/)
        expect(vm.$fire).toA('function')
        expect(vm.$watch).toA('function')
        expect(vm.$events).toA('object')
        vm.$fire('aaa','56')
        expect(called).toBe('56')
    })
})
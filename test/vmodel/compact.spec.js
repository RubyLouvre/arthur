import { avalon} from '../../src/vmodel/compact'

describe('vmodel', function () {
    it('vmodel', function(){
       var vm =  avalon.define({
            $id: "aaa",
            aaa:1
        })
        vm.$watch('aaa', function(){

        })
        expect(vm.$id).toBe("aaa"),
        expect(vm.$model).toEqual({
            aaa: 1
        })
    })
})
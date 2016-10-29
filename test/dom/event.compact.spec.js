import { avalon } from '../../src/seed/core'
import { avEvent } from '../../src/dom/event/compact'
import '../../src/dom/ready/compact'

describe('event', function () {
    it('avEvent', function (done) {
        var event = {
            srcElement: {},
            type: 'click',
            keyCode: 12,
            clientX: 11,
            clientY: 118,
            wheelDelta: 0
        }
        var e = new avEvent(event)

        console.log('========01==========')
        expect(e.target).toBe(event.srcElement)
        expect(e.originalEvent).toBe(event)
        expect(e.type).toBe('click')
        expect(e.pageX).toBe(11)
        expect(e.pageY).toBe(118)
        expect(e.wheelDelta).toBe(0)
        console.log('========02==========')
        expect(e.preventDefault).toA('function')
        expect(e.stopPropagation).toA('function')
        expect(e.stopImmediatePropagation).toA('function')
        e.preventDefault()
        expect(e.returnValue).toBe(false)
        e.stopPropagation()
        expect(e.cancelBubble).toBe(true)
        e.cancelBubble = 2
        e.stopImmediatePropagation()
        console.log('========03==========')
        expect(e.cancelBubble).toBe(true)
        expect(e.stopImmediate).toBe(true)
        expect(e + "").toMatch(/object\s+Event/)
        var e2 = new avEvent(e)
        expect(e2).toBe(e)
        console.log('========04==========')
        avalon.ready(function () {
            var div = document.createElement('div')
            document.body.appendChild(div)
            var changed = false
            avalon(div).bind('click', function () {
                changed = true
                return false
            })
            console.log('========05==========')
            avalon.fireDom(div, 'click')
            console.log('========06==========')
            fireClick(div)
            expect(changed).toBe(true)
            avalon(div).unbind('click')
            console.log('========07==========')
            done()
        })


    })

})

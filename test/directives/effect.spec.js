import { avalon } from '../../src/seed/core'
import '../../src/renders/index'
import {
    css3,
    animation,
    transition,
    animationEndEvent,
    transitionEndEvent
} from '../../src/effect/detect'
import {
    getAction,
    getAnimationTime
} from '../../src/effect/index'

describe('effect', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm && vm.$id]
    })
    it('type', function () {
        console.log({
            css3,
            animation,
            transition,
            animationEndEvent,
            transitionEndEvent
        })
        expect(css3).toA('boolean')
        expect(animation).toA('boolean')
        expect(transition).toA('boolean')
        expect(typeof animationEndEvent).toMatch(/undefined|string/)
        expect(typeof transitionEndEvent).toMatch(/undefined|string/)
    })
    it('getAction', function () {
        expect(getAction({ hook: 'onEnterDone' })).toBe('enter')
        expect(getAction({ hook: 'onLeaveDone' })).toBe('leave')
    })
    it('diff', function () {
        var diff = avalon.directives.effect.diff
        expect(diff.call({
            node: {
                props: {}
            }
        }, { color: 'green' })).toBe(true)
        expect(diff.call({
            oldValue: {
                color: 'green'
            },
            node: {
                props: {}
            }
        }, {
                color: 'green'
            }
        )).toBe(false)
    })
    it('avalon.effect', function () {
        avalon.effect('fade')
        var fade = avalon.effects.fade
        if (avalon.modern)
            expect(fade).toEqual({
                enterClass: 'fade-enter',
                enterActiveClass: 'fade-enter-active',
                leaveClass: 'fade-leave',
                leaveActiveClass: 'fade-leave-active'
            })
        delete avalon.effects.fade
    })


    it('avalon.effect#update', function (done) {
        avalon.effect('fade')
        var update = avalon.directives.effect.update
        var vdom = {
            dom: document.createElement('div')
        }
        expect(update(vdom, {})).toBe(void 0)
        expect(update(vdom, { is: 'xxx' })).toBe(void 0)

        expect(update(vdom, { is: 'fade', action: 'xxx' })).toBe(void 0)
        var effectProto = avalon.Effect.prototype
        var old = effectProto.enter
        var called = false
        effectProto.enter = function () {
            called = true
        }
        expect(update(vdom, { is: 'fade', action: true })).toBe(true)
        expect(update(vdom, { is: 'fade', action: true, queue: true })).toBe(true)
        setTimeout(function () {
            expect(called).toBe(true)
            effectProto.enter = old
            delete avalon.effects.fade
            done()
        }, 100)
    })

    it('getAnimationTime', function () {
        var el = document.createElement('div')
        el.style.cssText = 'color:red;transition:all 2s; -moz-transition: all 2s; -webkit-transition: all 2s; -o-transition:all 2s;'
        var el2 = document.createElement('div')
        el2.style.cssText = 'color:red; transition:all 300ms; -moz-transition: all 300ms; -webkit-transition: all 300ms; -o-transition:all 300ms;'
        document.body.appendChild(el)
        document.body.appendChild(el2)
        if (avalon.modern) {
            expect(getAnimationTime(el)).toBe(2000)
            expect(getAnimationTime(el2)).toBe(300)
            document.body.removeChild(el)
            document.body.removeChild(el2)
        }

    })
})

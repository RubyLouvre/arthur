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
    getAction
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
            oldValue:{
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
        expect(fade).toEqual({
            enterClass: 'fade-enter',
            enterActiveClass: 'fade-enter-active',
            leaveClass: 'fade-leave',
            leaveActiveClass: 'fade-leave-active',
            action: 'enter'
        })
    })



})
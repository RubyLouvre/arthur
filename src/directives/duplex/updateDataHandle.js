import { updateModelActions } from './updateModelActions'

export function updateDataHandle(event) {
    var elem = this
    var field = this.__ms_duplex__
    if (elem.composing) {
        //防止onpropertychange引发爆栈
        return
    }
    if (elem.value === field.value) {
        return
    }
    if (elem.caret) {
        try {
            var pos = field.getCaret(elem)
            field.pos = pos
        } catch (e) {
        }
    }

    if (field.debounceTime > 4) {
        var timestamp = new Date()
        var left = timestamp - field.time || 0
        field.time = timestamp
        if (left >= field.debounceTime) {
            updateModelActions[field.dtype].call(field)
        } else {
            clearTimeout(field.debounceID)
            field.debounceID = setTimeout(function () {
                updateModelActions[field.dtype].call(field)
            }, left)
        }
    } else {
        updateModelActions[field.dtype].call(field)
    }
}

export {
    updateModelHandle as updateModel
}
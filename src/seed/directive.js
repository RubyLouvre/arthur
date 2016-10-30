
var delayCompile = {}

export var directives = {}

export function directive(name, opts) {
    directives[name] = opts
    if (opts.delay) {
        delayCompile[name] = 1
    }
}

export function delayCompileNodes(dirs) {
    for (var i in delayCompile) {
        if (('ms-' + i) in dirs) {
            return true
        }
    }
}

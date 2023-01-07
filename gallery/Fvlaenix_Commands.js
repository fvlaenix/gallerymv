//=============================================================================
/*:
* @plugindesc Fvlaenix Plugins - Commands Core. For including commands
* @author Fvlaenix
*/
//=============================================================================

Imported = Imported || {}
Imported.Fvlaenix = Imported.Fvlaenix || new Set()
Imported.Fvlaenix.add("Commands")

Fvlaenix.Commands = new Map()

const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function (command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (Fvlaenix.Commands[command] != null) {
        Fvlaenix.Commands[command](this, args)
    }
};

Fvlaenix.Commands.Logger = Fvlaenix.Commands.Logger || {}
Fvlaenix.Commands.Logger.log = Fvlaenix.Commands.Logger.log || []

Fvlaenix.Commands.Logger.push = function (s) {
    Fvlaenix.Commands.Logger.log.push(s)
}

Fvlaenix.Commands.Logger.stop = function () {
    throw JsonEx.stringify(Fvlaenix.Commands.Logger.log)
}

Fvlaenix.Commands.addToEnd = function (game_interpreter, list, mapId, eventId) {
    while (game_interpreter._parentInterpreter != null) {
        game_interpreter = game_interpreter._parentInterpreter
    }
    list.unshift({"code": 108, "indent": 0, "parameters": ["=== This is start comment of Fvlaenix code generator ==="]})
    list.push({"code": 0, "indent": 0, "parameters": []})
    mapId = mapId || 0
    eventId = eventId || 0
    const child = new Game_Interpreter(game_interpreter._depth);
    child.setup(list, eventId);
    child._mapId = mapId
    child._childInterpreter = game_interpreter
    game_interpreter._parentInterpreter = child
    let depthRecurseI = game_interpreter
    depthRecurseI._depth = depthRecurseI._depth + 1
    while (depthRecurseI._childInterpreter != null) {
        depthRecurseI = depthRecurseI._childInterpreter
        depthRecurseI._depth = depthRecurseI._depth + 1
    }
}

Fvlaenix.Commands.addToEndEvent = function (parent, event) {
    this.count = this.count + 1 || 0
    while (parent._parentInterpreter != null) {
        parent = parent._parentInterpreter
    }
    let child = new Game_Interpreter(parent._depth)
    child.setup([{"code": 108, "indent": 0, "parameters": ["=== This is start comment of Fvlaenix code generator ==="]}], 0)
    event.call(child)
    child._list.push({"code": 0, "indent": 0, "parameters": []})
    let recurseCount = 1
    while (child._childInterpreter != null) {
        child = child._childInterpreter
        recurseCount += 1
    }
    child._childInterpreter = parent
    parent._parentInterpreter = child
    let depthRecurseI = parent
    depthRecurseI._depth = depthRecurseI._depth + recurseCount
    while (depthRecurseI._childInterpreter != null) {
        depthRecurseI = depthRecurseI._childInterpreter
        depthRecurseI._depth = depthRecurseI._depth + recurseCount
    }
}

// TODO remove
Fvlaenix.Commands.recursiveGetInterpreter = function (game_interpreter) {
    if (game_interpreter == null) return "null"
    return `code=${JSON.stringify(game_interpreter._list)}
    depth=${game_interpreter._depth}
    child={${Fvlaenix.Commands.recursiveGetInterpreter(game_interpreter._childInterpreter)}}
    `
}

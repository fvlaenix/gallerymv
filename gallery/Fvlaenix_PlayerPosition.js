//=============================================================================
/*:
* @plugindesc Fvlaenix Plugins - Player Position Core. For including player positions
* @author Fvlaenix
*/
//=============================================================================
// v1.0

Imported = Imported || {}
Imported.Fvlaenix = Imported.Fvlaenix || new Set()
Imported.Fvlaenix.add("PlayerPosition")

Fvlaenix.PlayerPosition = class PlayerPosition {
    constructor(map_id, x, y, direction) {
        this.map_id = map_id
        this.x = x
        this.y = y
        this.direction = direction
    }

    teleportPlayer(game_interpreter) {
        Fvlaenix.Commands.addToEnd(game_interpreter, [{"code": 201, "indent": 0, "parameters": [0, this.map_id, this.x, this.y, this.direction, 2]}])
        /*game_interpreter._list.push(
            {"code": 201, "indent": 0, "parameters": [0, this.map_id, this.x, this.y, this.direction, 2]}
        )*/
    }
}

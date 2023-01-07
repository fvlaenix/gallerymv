//=============================================================================
/*:
* @plugindesc Fvlaenix Plugins - Scenes Core. For including scenes
* @author Fvlaenix
*/
//=============================================================================

Imported = Imported || {}
Imported.Fvlaenix = Imported.Fvlaenix || new Set()

Fvlaenix.require("PlayerPosition")
Fvlaenix.require("Callables")

Imported.Fvlaenix.add("Scenes")

Fvlaenix.Scenes = {}

Fvlaenix.Scenes.FunctionalLayer = class FunctionalLayer {
    constructor(owner) {
        this.owner = owner
    }

    before(game_interpreter) {
        throw "Not implemented"
    }

    after(game_interpreter) {
        throw "Not implemented"
    }
}

Fvlaenix.Scenes.CallableScene = class CallableScene {
    constructor(id, name, description) {
        this.id = id
        this.name = name
        this.description = description
        this.layers = []
    }

    add_layer(layer) {
        this.layers.push(layer)
    }

    before(game_interpreter) {
        Fvlaenix.Commands.addToEnd(
            game_interpreter,
            [
                {"code": 221, "indent": 0, "parameters": []},
                {"code": 230, "indent": 0, "parameters": [30]}
            ]
        )
        this.layers.forEach(item => {
            item.before(game_interpreter)
        })
        Fvlaenix.Commands.addToEnd(
            game_interpreter,
            [
                {"code": 222, "indent": 0, "parameters": []},
                {"code": 230, "indent": 0, "parameters": [30]}
            ]
        )
    }

    after(game_interpreter) {
        Fvlaenix.Commands.addToEnd(
            game_interpreter,
            [
                {"code": 221, "indent": 0, "parameters": []},
                {"code": 230, "indent": 0, "parameters": [30]}
            ]
        )
        this.layers.forEach(item => {
            item.after(game_interpreter)
        })
        Fvlaenix.Commands.addToEnd(
            game_interpreter,
            [
                {"code": 222, "indent": 0, "parameters": []},
                {"code": 230, "indent": 0, "parameters": [30]},
                {"code": 0, "indent": 0, "parameters": []},
            ]
        )
    }

    run(game_interpreter) {
        this.before(game_interpreter)
        this._run(game_interpreter)
        this.after(game_interpreter)
    }

    _run(game_interpreter) {
        throw "Not implemented"
    }
}

Fvlaenix.Scenes.RecoverStateScene = class RecoverStateScene extends Fvlaenix.Scenes.CallableScene {
    constructor(id, name, description) {
        super(id, name, description);
        this.add_layer(new Fvlaenix.Scenes.RecoverStateScene.RecoverStateLayer(this))
    }
}

Fvlaenix.Scenes.RecoverStateScene.RecoverStateLayer = class RecoverStateLayer extends Fvlaenix.Scenes.FunctionalLayer {

    before(game_interpreter) {
        Fvlaenix.Scenes.SaveAction = this
        Fvlaenix.Scenes.SaveJson = new Map()
        Fvlaenix.Scenes.SaveJson['switches'] = JsonEx.stringify($gameSwitches)
        Fvlaenix.Scenes.SaveJson['variables'] = JsonEx.stringify($gameVariables)
        Fvlaenix.Scenes.SaveJson['self_switches'] = JsonEx.stringify($gameSelfSwitches)
    }

    after(game_interpreter) {
        Fvlaenix.Commands.addToEnd(game_interpreter, [{
            "code": 355,
            "indent": 0,
            "parameters": ["Fvlaenix.Scenes.SaveAction.restore()"]
        }])
    }

    restore() {
        $gameSwitches = JsonEx.parse(Fvlaenix.Scenes.SaveJson['switches'])
        $gameVariables = JsonEx.parse(Fvlaenix.Scenes.SaveJson['variables'])
        $gameSelfSwitches = JsonEx.parse(Fvlaenix.Scenes.SaveJson['self_switches'])
    }
}

Fvlaenix.Scenes.TeleportRecoveryCallableScene = class TeleportRecoveryCallableScene extends Fvlaenix.Scenes.RecoverStateScene {
    constructor(id, name, description, player_position) {
        super(id, name, description);
        this.add_layer(new Fvlaenix.Scenes.TeleportRecoveryCallableScene.TeleportLayer(this, player_position))
    }
}

Fvlaenix.Scenes.TeleportRecoveryCallableScene.TeleportLayer = class TeleportLayer extends Fvlaenix.Scenes.FunctionalLayer {

    constructor(owner, player_position) {
        super(owner);
        this.player_position = player_position
    }

    before(game_interpreter) {
        this.map_id = $gameMap._interpreter._mapId
        this.player_x = $gamePlayer.x
        this.player_y = $gamePlayer.y
        this.player_direction = $gamePlayer._direction
        this.player_position.teleportPlayer(game_interpreter)
    }

    after(game_interpreter) {
        new Fvlaenix.PlayerPosition(this.map_id, this.player_x, this.player_y, this.player_direction).teleportPlayer(game_interpreter)
    }
}

Fvlaenix.Scenes.MapEventScene = class MapEventScene extends Fvlaenix.Scenes.TeleportRecoveryCallableScene {

    constructor(id, name, description, player_position, event) {
        super(id, name, description, player_position);
        this.event = event
    }

    _run(game_interpreter) {
        this.event.call(game_interpreter)
    }
}

Fvlaenix.Scenes.BattleScene = class BattleScene extends Fvlaenix.Scenes.TeleportRecoveryCallableScene {

    constructor(id, name, description, player_position, troop_id, callable) {
        super(id, name, description, player_position);
        this.troopId = troop_id
        this.callable = callable
    }

    call_battle(game_interpreter) {
        Fvlaenix.Commands.addToEnd(
            game_interpreter,
            [
                {"code": 313, "indent": 0, "parameters": [0, 0, 0, 3]}
            ]
        )
        Fvlaenix.Commands.addToEndEvent(game_interpreter, this.callable)
        Fvlaenix.Commands.addToEnd(
            game_interpreter,
            [
                {"code": 313, "indent": 0, "parameters": [0, 0, 1, 3]},
                {"code": 340, "indent": 0, "parameters": []}

            ]
        )
    }

    _run(game_interpreter) {
        $gameSwitches.setValue(Fvlaenix.Gallery.IS_SCENE_RUN, true)
        const original = $dataTroops[this.troopId]
        const newTroop = {
            "id": $dataTroops.length,
            "members": original.members,
            "name": original.name,
            "pages": [
                {
                    "conditions": {
                        "actorHP": 50,
                        "actorId": 1,
                        "actorValid": false,
                        "enemyHP": 50,
                        "enemyIndex": 1,
                        "enemyValid": false,
                        "switchId": 1,
                        "switchValid": false,
                        "turnA": 0,
                        "turnB": 0,
                        "turnEnding": false,
                        "turnValid": true
                    },
                    "list": [
                        {"code": 356, "indent": 0, "parameters": ["fvlaenix_launch_battle_scene"]},
                        {"code": 0, "indent": 0, "parameters": []}
                    ]
                }
            ]
        }
        $dataTroops.push(newTroop)
        Fvlaenix.Commands.addToEnd(
            game_interpreter,
            [
                {"code": 301, "indent": 0, "parameters": [0, $dataTroops.length - 1, false, false]}
            ]
        )
        Fvlaenix.Scenes.Battle = this
    }
}

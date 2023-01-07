//=============================================================================
/*:
* @plugindesc Fvlaenix Plugins - Callables Core. For including callables
* @author Fvlaenix
*/
//=============================================================================

Imported = Imported || {}
Imported.Fvlaenix = Imported.Fvlaenix || new Set()
Imported.Fvlaenix.add("Callables")

Fvlaenix.require("Commands")
Fvlaenix.Callables = {}

Fvlaenix.Callables.Event = class Event {
    call(game_interpreter) {
        throw "NotImplemented"
    }
}

Fvlaenix.Callables.ListEvent = class ListEvent extends Fvlaenix.Callables.Event {
    get_list(game_interpreter) {
        throw "NotImplemented"
    }

    call(game_interpreter) {
        const list = this.get_list(game_interpreter)
        Fvlaenix.Commands.addToEnd(game_interpreter, list, this.mapId || 0, this.eventId || 0)
    }
}

Fvlaenix.Callables.MapEvent = class MapEvent extends Fvlaenix.Callables.ListEvent {
    get_map(game_interpreter, map_id) {
        let mapId = map_id
        if (map_id == null) {
            mapId = $gameMap.mapId
        }
        var xhr = new XMLHttpRequest();
        var url = 'data/' + 'Map%1.json'.format(mapId.padZero(3));
        xhr.open('GET', url, false);
        xhr.overrideMimeType('application/json');
        xhr.send(null);
        return JSON.parse(xhr.responseText)
    }

    get_events_from_map(game_interpreter, map_id) {
        return this.get_map(game_interpreter, map_id).events
    }
}

Fvlaenix.Callables.MapEventById = class MapEventById extends Fvlaenix.Callables.MapEvent {
    constructor(map_id, event_id, page_id) {
        super();
        this.mapId = map_id
        this.eventId = event_id
        this.pageId = page_id
    }

    get_list(game_interpreter) {
        return this.get_events_from_map(game_interpreter, this.mapId)[this.eventId].pages[this.pageId - 1].list
    }
}

Fvlaenix.Callables.MapEventByName = class MapEventByName extends Fvlaenix.Callables.MapEvent {
    constructor(map_id, event_name, page_id) {
        super();
        this.mapId = map_id
        this.eventName = event_name
        this.pageId = page_id
    }

    get_list(game_interpreter) {
        const events = this.get_events_from_map(game_interpreter, this.mapId)
        let callable = null
        events.forEach( event => {
            if (event[1].name === this.eventName) {
                if (callable !== null) {
                    throw "Two or more events with name #{event_name}"
                }
                callable = event[1]
            }
        })
        if (callable == null) {
            throw "Can't find event with name #{event_name}"
        }
        return callable.pages[this.pageId - 1].list
    }
}

Fvlaenix.Callables.CommonEvent = class CommonEvent extends Fvlaenix.Callables.ListEvent {
    constructor(event_id) {
        super();
        this.event_id = event_id
    }

    get_list(game_interpreter) {
        return $dataCommonEvents[this.event_id].list
    }
}

Fvlaenix.Callables.TroopPageEvent = class TroopPageEvent extends Fvlaenix.Callables.ListEvent {
    constructor(troop_id, page_id) {
        super();
        this.troopId = troop_id
        this.pageId = page_id
    }

    get_list(game_interpreter) {
        return $dataTroops[this.troopId].pages[this.pageId - 1].list
    }
}

Fvlaenix.Callables.VariableChange = class VariableChange extends Fvlaenix.Callables.ListEvent {
    constructor(id, value) {
        super();
        this.id = id
        this.value = value
    }

    get_list(game_interpreter) {
        return [
            {"code": 122, "indent": 0, "parameters": [this.id, this.id, 0, 0, this.value]}
        ]
    }
}

Fvlaenix.Callables.SwitchChange = class SwitchChange extends Fvlaenix.Callables.ListEvent {
    constructor(id, value) {
        super();
        this.id = id
        this.value = value
    }

    get_list(game_interpreter) {
        return [
            {"code": 121, "indent": 0, "parameters": [this.id, this.id, 1 - this.value]}
        ]
    }
}

Fvlaenix.Callables.StateChange = class StateChange extends Fvlaenix.Callables.ListEvent {
    constructor(id, add) {
        super();
        this.id = id
        this.add = add
    }


    get_list(game_interpreter) {
        return [
            {"code": 313, "indent": 0, "parameters": [0, 0, 1 - this.add, this.id]}
        ]
    }
}

Fvlaenix.Callables.ChainEvent = class ChainEvent extends Fvlaenix.Callables.Event {
    constructor(array) {
        super();
        this.array_chain = array
    }

    call(game_interpreter) {
        this.array_chain.forEach(element => {
            Fvlaenix.Commands.addToEndEvent(game_interpreter, element)
        })
    }
}

Fvlaenix.Callables.Executable = class Executable extends Fvlaenix.Callables.ListEvent {
    constructor(list) {
        super();
        this.list = list
    }

    get_list(game_interpreter) {
        return this.list
    }
}

Fvlaenix.Callables.ForEachMethods = class ForEachMethods extends Fvlaenix.Callables.Event {

    constructor(count, nested) {
        super();
        this.count = count
        this.nested = nested
    }

    call(game_interpreter) {
        for (let i = 0; i < this.count; i++) {
            this.nested.call(game_interpreter)
        }
    }
}

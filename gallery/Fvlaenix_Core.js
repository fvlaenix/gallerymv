//=============================================================================
/*:
* @plugindesc Fvlaenix Plugins - Core Engine for all Fvlaenix Plugins
* @author Fvlaenix
*/
//=============================================================================

Imported = Imported || {}
Imported.Fvlaenix = new Set()
Imported.Fvlaenix.add("core")

const Fvlaenix = {};

Fvlaenix.require = function(name) {
    if (!Imported.Fvlaenix.has(name)) {
        throw `Requirement failed: ${name}`
    }
}

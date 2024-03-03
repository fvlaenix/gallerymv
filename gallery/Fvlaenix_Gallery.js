//=============================================================================
/*:
* @plugindesc Fvlaenix Plugins - Gallery Core. For including gallery
* @author Fvlaenix
*/
//=============================================================================
// v1.0

Imported = Imported || {}
Imported.Fvlaenix = Imported.Fvlaenix || new Set()

Fvlaenix.require("Callables")

Imported.Fvlaenix.add("Gallery")

Fvlaenix.Gallery = {}

Fvlaenix.Gallery.PART_LIST = 3.0 / 7
Fvlaenix.Gallery.EMPTY_TOP = 1.0 / 8

Fvlaenix.Gallery.IS_GALLERY_ACTIVE_SWITCH = 638
Fvlaenix.Gallery.IS_SCENE_ENDED_SWITCH = 639
Fvlaenix.Gallery.IS_SCENE_RUN = 640

Fvlaenix.Gallery.GALLERY_SCENE_ID = 100

Fvlaenix.Gallery.TreeItem = class TreeItem {
    constructor(name, description) {
        this.name = name
        this.description = description
        this._is_shown = true
        this._is_activable = true
        this.condition = new Fvlaenix.Gallery.Condition()
    }

    run() {
        throw "Not implemented"
    }
}

Fvlaenix.Gallery.Node = class Node extends Fvlaenix.Gallery.TreeItem {

    constructor(name, description) {
        super(name, description);
        this.activites = []
    }

    run() {
        SceneManager._nextScene = new Fvlaenix.Gallery.Window(this)
    }

    add_node(node) {
        this.activites.push(node)
    }

    add_scene(scene, condition) {
        const node = new Fvlaenix.Gallery.Leaf(scene.name, scene.description, scene)
        if (condition != null) {
            node.condition = condition
        }
        this.activites.push(node)

    }
}

Fvlaenix.Gallery.Leaf = class Leaf extends Fvlaenix.Gallery.TreeItem {

    constructor(name, description, runnable) {
        super(name, description);
        this.runnable = runnable
    }

    run() {
        SceneManager.goto(Scene_Map)
        $gameSwitches.setValue(Fvlaenix.Gallery.IS_GALLERY_ACTIVE_SWITCH, true)
        $gameVariables.setValue(Fvlaenix.Gallery.GALLERY_SCENE_ID, this.runnable)
    }
}

Fvlaenix.Gallery.Window = class Window extends Scene_MenuBase {

    constructor(parent) {
        super();
        Fvlaenix.Gallery.dfs(Fvlaenix.Gallery.MAIN_GALLERY)
        this._fvlaparent = parent
    }

    create() {
        super.create()
        this.create_all_windows()
    }

    create_all_windows() {
        this.list = new Fvlaenix.Gallery.WindowItemList(this._fvlaparent)
        this.addWindow(this.list)
        this.list.setHandler('ok', this.on_ok.bind(this))
        this.list.setHandler('cancel', this.popScene.bind(this))
        this.description = new Fvlaenix.Gallery.Window_Gallery_Description(this._fvlaparent, this.list)
        this.addWindow(this.description)
        this.refreshWindows()
    }

    on_ok() {
        this._fvlaparent.activites[this.list.index()].run()
    }

    refreshWindows() {
        this.list.refresh()
        this.description.refresh()
    }
}

Fvlaenix.Gallery.WindowItemList = class WindowItemList extends Window_Selectable {

    constructor(parent) {
        super(
            0,
            Graphics.height * Fvlaenix.Gallery.EMPTY_TOP,
            Graphics.width * Fvlaenix.Gallery.PART_LIST,
            Graphics.height * (1 - Fvlaenix.Gallery.EMPTY_TOP)
        )
        this._fvlaparent = parent
        this.refresh()
        this.activate()
        this.select(0)
    }

    maxItems() {
        if (this._fvlaparent == null) {
            return 1
        }
        return this._fvlaparent.activites.filter(item => {
            return item._is_shown
        }).length
    }

    isCurrentItemEnabled() {
        return this._fvlaparent.activites[this.index()]._is_activable
    }

    refresh() {
        this.createContents()
        this.drawAllItems()
    }

    drawItem(index) {
        const rect = this.itemRect(index)
        rect.width -= 4
        const current_item = this._fvlaparent.activites[index]
        this.drawText(current_item.name, rect.x + 1, rect.y, rect.width - 2, 'left')
    }
}

Fvlaenix.Gallery.Window_Gallery_Description = class Window_Gallery_Description extends Window_Base {

    constructor(parent, list) {
        super(
            Graphics.width * Fvlaenix.Gallery.PART_LIST + 5,
            Graphics.height * Fvlaenix.Gallery.EMPTY_TOP,
            Graphics.width * (1 - Fvlaenix.Gallery.PART_LIST) - 5,
            Graphics.height * (1 - Fvlaenix.Gallery.EMPTY_TOP)
        )
        this._fvlaparent = parent
        this.list = list
        this.current_index = list._index
        this.current_item = parent.activites[this.current_index]
        this.reloadData()
        this.update()
    }

    reloadData() {
        const width = Graphics.width * (1 - Fvlaenix.Gallery.PART_LIST) - 25
        this.resetFontSettings()
        if (this.current_item == null) {
            this.name = ""
            this.description = []
        } else {
            const futureDescription = [""]
            let accumulator = ""
            const words = this.current_item.description.split(" ")
            words.forEach(word => {
                if (this.textWidth(word) > width) {
                    throw `Too long ${word}`
                }
                if (this.textWidth(accumulator + " " + word) >= width) {
                    futureDescription.push(accumulator)
                    accumulator = word
                } else {
                    accumulator += " " + word
                }
            })
            futureDescription.push(accumulator)
            this.name = this.current_item.name
            this.description = futureDescription
            this.resetFontSettings()
        }
    }

    update() {
        Window_Base.prototype.update.call(this)
        if (this.list._index < 0) return
        if (this.list._index === this.current_index) return
        this.current_index = this.list._index
        this.current_item = this._fvlaparent.activites[this.current_index]
        this.reloadData()
        this.refresh()
    }

    refresh() {
        this.contents.clear()
        this.resetFontSettings()
        this.drawContent()
    }

    drawName() {
        this.resetFontSettings()
        this.makeFontBigger()
        this.drawText(this.name, 0, 0, Graphics.width * (1 - Fvlaenix.Gallery.PART_LIST) * (0.9), 'left')
    }

    drawDescription() {
        this.resetFontSettings()
        let current_height = 2 * this.lineHeight()
        this.description.forEach(text => {
            this.drawText(text, 0, current_height, Graphics.width * (1 - Fvlaenix.Gallery.PART_LIST) - 5, 'left')
            current_height += this.lineHeight()
        })
    }

    drawContent() {
        if (this.current_item._is_activable === false) {
            this.textColor(17)
            this.drawText("LOCKED", 0, 2 * this.lineHeight(), Graphics.width * (1 - Fvlaenix.Gallery.PART_LIST) - 5, 'left')
        } else {
            this.drawName()
            this.drawDescription()
        }
    }
}

Fvlaenix.Gallery.Condition = class Condition {
    constructor() {
        this.onSwitch = false
        this.switch = 0
    }

    setSwitch(id) {
        this.onSwitch = true
        this.switch = id
        return this
    }

    isComplete() {
        if (this.onSwitch === true) {
            return $gameSwitches.value(this.switch) === true
        }
        return true
    }
}

Fvlaenix.Gallery.dfs = function (node) {
    if (node.condition.isComplete()) {
        node._is_activable = true
        if (node instanceof Fvlaenix.Gallery.Node) {
            node.activites.forEach(treeItem => {
                Fvlaenix.Gallery.dfs(treeItem)
            })
        }
    } else {
        node._is_activable = false
    }
}

Fvlaenix.Gallery.MAIN_GALLERY = new Fvlaenix.Gallery.Node(null, null)

Fvlaenix.Commands["fvlaenix_launch_gallery"] = function (game_interpreter, args) {
    $gameSwitches.setValue(Fvlaenix.Gallery.IS_GALLERY_ACTIVE_SWITCH, false)
    let child = new Game_Interpreter(game_interpreter.depth + 1)
    child.setup([{
        "code": 108,
        "indent": 0,
        "parameters": ["=== This is start comment of Fvlaenix code generator ==="]
    }], 0)
    child.setup([{"code": 0, "indent": 0, "parameters": []}], 0)
    $gameVariables.value(Fvlaenix.Gallery.GALLERY_SCENE_ID).run(child)
    while (child._parentInterpreter != null) {
        child = child._parentInterpreter
    }
    game_interpreter._childInterpreter = child
}

Fvlaenix.Commands["fvlaenix_launch_battle_scene"] = function (game_interpreter, args) {
    let child = new Game_Interpreter(game_interpreter.depth + 1)
    child.setup([{
        "code": 108,
        "indent": 0,
        "parameters": ["=== This is start comment of Fvlaenix code generator ==="]
    }], 0)
    child.setup([{"code": 0, "indent": 0, "parameters": []}], 0)
    Fvlaenix.Scenes.Battle.call_battle(child)
    while (child._parentInterpreter != null) {
        child = child._parentInterpreter
    }
    game_interpreter._childInterpreter = child
}

Window_MenuCommand.prototype.addGalleryCommand = function () {
    this.addCommand("Gallery", "gallery")
}

Scene_Menu.prototype.commandGallery = function () {
    Fvlaenix.Gallery.MAIN_GALLERY.run()
}

TextManager.gallery = "Gallery"

Fvlaenix.Gallery.Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;

Scene_Menu.prototype.createCommandWindow = function () {
    Fvlaenix.Gallery.Scene_Menu_createCommandWindow.call(this);
    this._commandWindow.setHandler('gallery', this.commandGallery.bind(this));
};

Fvlaenix.Gallery.Window_MenuCommand_addGalleryCommands =
    Window_MenuCommand.prototype.addOriginalCommands;
Window_MenuCommand.prototype.addOriginalCommands = function () {
    Fvlaenix.Gallery.Window_MenuCommand_addGalleryCommands.call(this);
    this.addGalleryCommand();
};

Window_MenuCommand.prototype.addGalleryCommand = function () {
    this.addCommand(TextManager.gallery, 'gallery', true);
};

rose = function () {
    const rose = new Fvlaenix.Gallery.Node("Rose", "TODO")

    Fvlaenix.Gallery.MAIN_GALLERY.add_node(rose)
}

rose()
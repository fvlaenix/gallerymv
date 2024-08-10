//=============================================================================
/*:
* @plugindesc Fvlaenix Plugins - Rich Gallery Core. For including gallery
* @author Fvlaenix
*/
//=============================================================================

Imported = Imported || {}
Imported.Fvlaenix = Imported.Fvlaenix || new Set()

Fvlaenix.require("Callables")
Fvlaenix.require("Gallery")

Imported.Fvlaenix.add("RichGallery")

Fvlaenix.RichGallery = {}

// === Gallery data

Fvlaenix.RichGallery.RICH_GALLERY_CONFIG = {}
if (Fvlaenix.RichGallery.RICH_GALLERY_CONFIG.sceneLocking === null || Fvlaenix.RichGallery.RICH_GALLERY_CONFIG.sceneLocking === undefined) {
  Fvlaenix.RichGallery.RICH_GALLERY_CONFIG.sceneLocking = {}
}

Fvlaenix.RichGallery.isDataUnlocked = function(id) {
  return Fvlaenix.RichGallery.RICH_GALLERY_CONFIG.sceneLocking[id] === true
}

Fvlaenix.RichGallery.unlockData = function(id) {
  Fvlaenix.RichGallery.RICH_GALLERY_CONFIG.sceneLocking[id] = true
}

Fvlaenix.RichGallery.lockData = function(id) {
  Fvlaenix.RichGallery.RICH_GALLERY_CONFIG.sceneLocking[id] = false
}

Fvlaenix.RichGallery.fvlaenixConfigDataMakeData_09847589045 = ConfigManager.makeData
ConfigManager.makeData = function () {
  let config = Fvlaenix.RichGallery.fvlaenixConfigDataMakeData_09847589045.call(this)
  config.richGallery = Fvlaenix.RichGallery.RICH_GALLERY_CONFIG
}

Fvlaenix.RichGallery.fvlaenixConfigManagerApplyData_20348574545 = ConfigManager.applyData
ConfigManager.applyData = function(config) {
  Fvlaenix.RichGallery.fvlaenixConfigManagerApplyData_20348574545.call(this, config)
  Fvlaenix.RichGallery.RICH_GALLERY_CONFIG = config['richGallery']
  if (Fvlaenix.RichGallery.RICH_GALLERY_CONFIG === null || Fvlaenix.RichGallery.RICH_GALLERY_CONFIG === undefined) {
    Fvlaenix.RichGallery.RICH_GALLERY_CONFIG = {}
  }
  if (Fvlaenix.RichGallery.RICH_GALLERY_CONFIG.sceneLocking === null || Fvlaenix.RichGallery.RICH_GALLERY_CONFIG.sceneLocking === undefined) {
    Fvlaenix.RichGallery.RICH_GALLERY_CONFIG.sceneLocking = {}
  }
}

// === Data

Fvlaenix.RichGallery.FolderData = class FolderData {
  constructor(id, background, person_picture, person_disable, scenes) {
    this.id = id
    this.scenes = scenes
    this.background = background
    this.person_picture = person_picture
    this.person_disable_picture = person_disable
  }
}

Fvlaenix.RichGallery.SceneData = class SceneData {
  constructor(id, name, picture, scene) {
    this.id = id
    this.name = name
    this.picture = picture
    this.scene = scene
  }
}

// === UI

ImageManager.loadGalleryPicture = function(filename, hue) {
  return this.loadBitmap('img/pictures/gallery/', filename, hue)
}

Fvlaenix.RichGallery.ChangeFolderListener = class ChangeFolderListener {
  constructor(scene, folders) {
    this.scene = scene
    this.index = 0
    this.folders = folders
  }

  isPreviousFolderExists() {
    return this.index > 0
  }

  isNextFolderExists() {
    return this.index < this.folders.length - 1
  }

  onPreviousFolder() {
    if (!this.isPreviousFolderExists()) throw "Can't go to previous folder"
    this.index -= 1
    this.scene.set_folder(this.index)
  }

  onNextFolder() {
    if (!this.isNextFolderExists()) throw "Can't go to next folder"
    this.index += 1
    this.scene.set_folder(this.index)
  }
}

Fvlaenix.RichGallery.Scene = class Scene extends Scene_MenuBase {
  constructor(parent, isFromMenu) {
    super();
    let folders = Fvlaenix.RichGallery.FOLDERS
    this._parent = parent
    this.folders = folders
    this.isFromMenu = isFromMenu
    if (folders.length === 0) {
      throw new Error(`No folders found in Rich Gallery.`)
    }
    this.currentFolder = folders[0]
  }

  create() {
    super.create()

    this.listener = new Fvlaenix.RichGallery.ChangeFolderListener(this, this.folders)
    this.background = new Fvlaenix.RichGallery.Background(this._parent, this.folders, this.folders.length)
    this.list = new Fvlaenix.RichGallery.FolderList(this._parent, this.currentFolder, this.listener, this.isFromMenu)

    this.list.setHandler('cancel', this.on_cancel.bind(this))

    this.addChild(this.background)
    this.addChild(this.list)

    this.background.refresh()
    this.list.refresh()
  }

  on_cancel() {
    if (SceneManager._stack.length === 0) {
      SceneManager.goto(Scene_Title)
    } else {
      SceneManager.pop()
    }
  }

  set_folder(index) {
    this.currentFolder = this.folders[index]
    this.background.set_folder(index)
    this.list.set_folder(this.currentFolder)
    this.list.select(0)
  }
}

Fvlaenix.RichGallery.Background = class Background extends Window_Base {
  constructor(parent, folders, count_folders) {
    super(
      0,
      0,
      Graphics.width,
      Graphics.height
    );
    this._parent = parent
    this.count_folders = count_folders
    this.folders = folders
    this.set_folder(0)
    this.refresh()
  }

  set_folder(index_folder) {
    this.currentFolderIndex = index_folder
    this.currentFolder = this.folders[index_folder]
    const id = this.currentFolder.id
    this.set_background_image(this.currentFolder.background)
    if (Fvlaenix.RichGallery.isDataUnlocked(id)) {
      this.set_person_image(this.currentFolder.person_picture)
    } else {
      this.set_person_image(this.currentFolder.person_disable_picture)
    }
    this.refresh()
  }

  update_gallery_title() {
    this.galleryModeImage = ImageManager.loadGalleryPicture('gallery_title')
    this.galleryModeImage.addLoadListener(() => { this.refresh() })
  }

  update_background_image() {
    this.set_background_image(this.currentFolder.background)
  }

  set_background_image(filename) {
    this.backgroundImage = ImageManager.loadGalleryPicture(filename)
    this.backgroundImage.addLoadListener(() => { this.refresh() })
  }

  update_person_image() {
    this.set_person_image(this.currentFolder.person_picture)
  }

  set_person_image(filename) {
    this.personImage = ImageManager.loadGalleryPicture(filename)
    this.personImage.addLoadListener(() => { this.refresh() })
  }

  _refreshFrame() {}
  _refreshBack() {}

  standardPadding() { return 0; }

  refresh() {
    this.contents.clear();
    if (this.backgroundImage === undefined) {
      this.update_background_image()
    }
    if (this.personImage === undefined) {
      this.update_person_image()
    }
    if (this.galleryModeImage === undefined) {
      this.update_gallery_title()
    }
    this.contents.blt(
      this.backgroundImage,
      0, 0,
      this.backgroundImage.width,
      this.backgroundImage.height,
      0,
      0,
      Graphics.width,
      Graphics.height
    )
    this.contents.blt(
      this.personImage,
      0, 0,
      this.personImage.width,
      this.personImage.height,
      Graphics.width - this.personImage.width,
      Graphics.height - this.personImage.height,
      this.personImage.width,
      this.personImage.height
    )
    this.contents.blt(
      this.galleryModeImage,
      0, 0,
      this.galleryModeImage.width,
      this.galleryModeImage.height,
      0, 0,
      Graphics.width,
      Graphics.height / 10
    )
    let text = `0${this.currentFolderIndex + 1}/0${this.count_folders}`
    this.contents.fontSize = 50
    this.contents.drawText(text, 0, Graphics.height - 80, Graphics.width - 40, 50, 'right')
  }
}

Fvlaenix.RichGallery.FolderList = class FolderList extends Window_Selectable {
  constructor(parent, current_folder, listener, isFromMenu) {
    super(
      0.10 * Graphics.width,
      0.10 * Graphics.height,
      0.7 * Graphics.width,
      0.8 * Graphics.height
    );
    this._parent = parent;
    this.listener = listener
    this.isFromMenu = isFromMenu
    this.backgroundImage = ImageManager.loadGalleryPicture('scene_folder_background')
    this.paperImage = ImageManager.loadGalleryPicture('scene_folder_paper')
    this.reportNotFound = ImageManager.loadGalleryPicture('scene_folder_report_not_found')
    this.reportDisabled = ImageManager.loadGalleryPicture('scene_folder_disabled')

    this.activate()
    this.select(0)

    this.set_folder(current_folder);
    this.backgroundImage.addLoadListener(() => { this.refresh() })
    this.paperImage.addLoadListener(() => { this.refresh() })
    this.reportNotFound.addLoadListener(() => { this.refresh() })
    this.reportDisabled.addLoadListener(() => { this.refresh() })
  }

  maxItems() { return 4 }
  maxCols() { return 2 }
  _refreshFrame() {}
  _refreshBack() {}
  standardPadding() { return 0; }

  itemHeight() { return this.height / (this.maxItems() / this.maxCols()) - 5 }

  spacing() { return 15; }

  set_folder(current_folder) {
    this.currentFolder = current_folder;
    this.currentImages = []
    for (let i = 0; i < this.maxItems(); i++) {
      if (current_folder.scenes[i] == null) {
        this.currentImages.push(null)
      } else {
        const id = current_folder.scenes[i].id
        if (Fvlaenix.RichGallery.isDataUnlocked(id)) {
          let image = ImageManager.loadGalleryPicture(current_folder.scenes[i].picture)
          this.currentImages.push(image)
        } else {
          this.currentImages.push(this.reportDisabled)
        }
      }
    }
    this.currentImages.forEach((image) => {
      if (image === null) return
      image.addLoadListener(() => { this.refresh() })
    })
    this.refresh()
  }

  isCurrentItemEnabled() {
    return Fvlaenix.RichGallery.isDataUnlocked(this.currentFolder.scenes[this.index()].id)
  }

  drawItem(index) {
    let scene = this.currentFolder.scenes[index]
    let rect = this.itemRect(index)

    this.contents.blt(
      this.backgroundImage,
      0, 0,
      this.backgroundImage.width,
      this.backgroundImage.height,
      rect.x + 20,
      rect.y + 20,
      rect.width - 40,
      rect.height - 40
    )
    let startX = rect.x + 30
    let startY = rect.y + 30
    let sizeX = rect.width - 60
    let sizeY = rect.height - 100
    let image
    if (scene === null || scene === undefined) {
      image = this.reportNotFound
    } else {
      if (this.currentImages[index] === null) {
        image = this.reportDisabled
      } else {
        image = this.currentImages[index]
      }
    }
    this.contents.blt(
      image,
      0, 0,
      image.width, image.height,
      startX, startY,
      sizeX, sizeY
    )
    this.contents.blt(
      this.paperImage,
      0, 0,
      this.paperImage.width,
      this.paperImage.height,
      rect.x + 20,
      rect.y + 20,
      rect.width - 40,
      rect.height - 40
    )
    let numberInFolder = "0" + (index + 1).toString()
    let text
    if (scene === null) {
      text = "???"
    } else {
      const id = scene.id
      if (Fvlaenix.RichGallery.isDataUnlocked(id)) {
        text = scene.name
      } else {
        text = "???"
      }
    }
    let oldBold = this.contents.fontBold

    this.contents.fontSize = 18
    this.drawText(text, rect.x + 35, rect.y + Math.round(rect.height * 0.67), rect.width - 10, 'left')
    this.contents.fontBold = true
    this.contents.fontSize = 40
    this.drawText(numberInFolder, rect.x + Math.round(rect.width * 0.739), rect.y + Math.round(rect.height * 0.705), 'left')

    this.contents.fontBold = oldBold
  }

  cursorLeft() {
    const index = this.index();
    const maxItems = this.maxItems();
    const maxCols = this.maxCols();
    if (index % maxCols === 0) {
      if (this.listener.isPreviousFolderExists()) {
        this.listener.onPreviousFolder()
      }
    } else {
      if (maxCols >= 2 && (index > 0 || (wrap && this.isHorizontal()))) {
        this.select((index - 1 + maxItems) % maxItems);
      }
    }
  }

  cursorRight() {
    const index = this.index();
    const maxItems = this.maxItems();
    const maxCols = this.maxCols();
    if ((index - 1 + maxCols) % maxCols === 0) {
      if (this.listener.isNextFolderExists()) {
        this.listener.onNextFolder()
      }
    } else {
      if (maxCols >= 2 && (index < maxItems - 1 || (wrap && this.isHorizontal()))) {
        this.select((index + 1) % maxItems);
      }
    }
  }

  isOkEnabled() { return true }

  callOkHandler() {
    const scene = this.currentFolder.scenes[this.index()]
    if (scene == null || scene.scene == null) {
      this.activate()
      return
    }
    Fvlaenix.RichGallery.IS_FROM_MENU = this.isFromMenu
    console.log(Fvlaenix.RichGallery.IS_FROM_MENU)
    SceneManager.goto(Scene_Map)

    $gameVariables.setValue(Fvlaenix.Gallery.GALLERY_SCENE_ID, scene.scene)
    $gameSwitches.setValue(Fvlaenix.Gallery.IS_GALLERY_ACTIVE_SWITCH, true)
  }
}

// === Commands

Scene_Menu.prototype.commandRichGallery = function() {
  SceneManager._nextScene = new Fvlaenix.RichGallery.Scene(this, false);
}

TextManager.richGallery = "RGallery"

Fvlaenix.RichGallery.Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;

Scene_Menu.prototype.createCommandWindow = function () {
  Fvlaenix.RichGallery.Scene_Menu_createCommandWindow.call(this);
  this._commandWindow.setHandler('rich_gallery', this.commandRichGallery.bind(this));
};

Fvlaenix.RichGallery.Window_MenuCommand_addGalleryCommands =
  Window_MenuCommand.prototype.addOriginalCommands;
Window_MenuCommand.prototype.addOriginalCommands = function () {
  Fvlaenix.RichGallery.Window_MenuCommand_addGalleryCommands.call(this);
  this.addRichGalleryCommand();
};

Window_MenuCommand.prototype.addRichGalleryCommand = function () {
  this.addCommand(TextManager.richGallery, 'rich_gallery', true);
};

// === Add to main menu

Fvlaenix.RichGallery.SceneTitleCreateCommandWindow_90348756495 = Scene_Title.prototype.createCommandWindow
Scene_Title.prototype.createCommandWindow = function() {
  Fvlaenix.RichGallery.SceneTitleCreateCommandWindow_90348756495.call(this)
  this._commandWindow.setHandler('rich_gallery', this.commandRichGallery.bind(this));
}

Scene_Title.prototype.commandRichGallery = function() {
  TouchInput.clear();
  Input.clear();
  SceneManager._nextScene = new Fvlaenix.RichGallery.Scene(this, true);
}

Window_TitleCommand.prototype.addRichGalleryCommand = function() {
  this.addCommand(TextManager.richGallery, 'rich_gallery', true);
}

Fvlaenix.RichGallery.WindowTitleCommandMakeCommandList_804754035480 = Window_TitleCommand.prototype.makeCommandList
Window_TitleCommand.prototype.makeCommandList = function() {
  Fvlaenix.RichGallery.WindowTitleCommandMakeCommandList_804754035480.call(this)
  this.addRichGalleryCommand()
}
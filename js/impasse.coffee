#
# jQuery throttle / debounce - v1.1 - 3/7/2010
# http://benalman.com/projects/jquery-throttle-debounce-plugin/
#
# Copyright (c) 2010 "Cowboy" Ben Alman
# Dual licensed under the MIT and GPL licenses.
# http://benalman.com/about/license/
#
`(function(b,c){var $=b.Zepto,a;$.throttle=a=function(e,f,j,i){var h,d=0;if(typeof f!=="boolean"){i=j;j=f;f=c}function g(){var o=this,m=+new Date()-d,n=arguments;function l(){d=+new Date();j.apply(o,n)}function k(){h=c}if(i&&!h){l()}h&&clearTimeout(h);if(i===c&&m>e){l()}else{if(f!==true){h=setTimeout(i?k:l,i===c?e-m:e)}}}if($.guid){g.guid=j.guid=j.guid||$.guid++}return g};$.debounce=function(d,e,f){return f===c?a(d,e,false):a(d,f,e!==false)}})(this);`


# Helper for defining getters/setters in CoffeeScript - https://gist.github.com/1599437
Function::define = (prop, desc) ->
  Object.defineProperty this.prototype, prop, desc


# Hack for localStorage in Mobile Safari private browsing mode
storage = window.localStorage
try
  storage.setItem("testPrivateBrowsingMode", "1")
  storage.removeItem("testPrivateBrowsingMode")
catch error
  if error.code is DOMException.QUOTA_EXCEEDED_ERR and storage.length is 0
    storage = {}
  else
    throw error


window.ig =
  game: null

  KEY:
    LEFT: 37
    UP: 38
    RIGHT: 39
    DOWN: 40
    PLUS: 187
    MINUS: 189

  DIRECTION:
    LEFT: 37
    UP: 38
    RIGHT: 39
    DOWN: 40

class ig.Game
  @entitiesMapping: {
    "1": "Player"
    "2": "StaticBlock"
    "3": "OrangeUpBlock"
    "4": "PurpleDownBlock"
    "5": "YellowUpBlock"
    "6": "BlueDownBlock"
    "7": "BlueMinusBlock"
    "8": "WinBlock"
    "9": "PinkMinusBlock"
    "a": "RedXBlock"
    "b": "GreenOBlock"
  }

  @levels: [
    { name: "motion", data: "002000000010200002080000000200" }
    { name: "pathway", data: "222200022210200202082000220002" }
    { name: "wrap", data: "002000020010222222080000220000" }
    { name: "surprise", data: "000033030010300003080030330000" }
    { name: "going up", data: "020002000212323002380032322232" }
    { name: "phase", data: "000032000010323003280230003322" }
    { name: "weave", data: "004040204013424323480302030300" }
    { name: "lock", data: "240032400210343442382224000332" }
    { name: "bridge", data: "040322403014333444380020000200" }
    { name: "flash", data: "002020700210702027780020702002" }
    { name: "deception", data: "020703020217324327480207427742" }
    { name: "sidestep", data: "237237320217007070480372370242" }
    { name: "offbeat", data: "000970790010790970080070790900" }
    { name: "hurdle", data: "090702000212473243280242909270" }
    { name: "backdoor", data: "027702030712329342280992939307" }
    { name: "axis", data: "000205200212504500080200402552" }
    { name: "sweep", data: "025555555210000003080207040302" }
    { name: "gate", data: "000220570012520453580207040352" }
    { name: "unzip", data: "005634560010000000080056345600" }
    { name: "twins", data: "076049503212654256380905070602" }
    { name: "machine", data: "304030403012452245283670367036" }
    { name: "reduction", data: "00ba039200100a0b66a800ba030b20" }
    { name: "lure", data: "009630b2201256356ba8005ba50220" }
    { name: "final dance", data: "05ba052222106079bba80560602222" }
  ]
  @board:
    height: 3
    width: 10

  @define 'currentLevelIndex',
    get: ->
      Number(@_currentLevelIndex or storage["currentLevel"] or 0)
    set: (value) ->
      index = Number(value)
      if index < 0
        @_currentLevelIndex = 0
      else if index >= ig.Game.levels.length
        @_currentLevelIndex = ig.Game.levels.length - 1
      else
        @_currentLevelIndex = index
      storage["currentLevel"] = @_currentLevelIndex

  currentLevel: undefined
  isLevelOver: false
  isGameOver: false

  constructor: (options={}) ->
    ig.game = @

    storage["completedLevels"] ||= JSON.stringify([])

    # Create required DOM elements and draw the initial state of the game
    # (without title, tiles etc.) before a level is loaded
    @_createLayout()

    # Load the initial level without fade-in
    @loadLevel(@currentLevelIndex, false)

    if options.fullscreen
      orientationEvent = if "onorientationchange" of window
        "orientationchange"
      else
        "resize"
      window.addEventListener orientationEvent, (event) =>
        @_rescaleLayout()

      @_rescaleLayout()


    # Handle player input
    isCurrentlyPressed = {}
    document.addEventListener "keydown", (event) =>
      @_onKeyDown(event) unless isCurrentlyPressed[event.which]
      isCurrentlyPressed[event.which] = true

    document.addEventListener "keyup", (event) ->
      isCurrentlyPressed[event.which] = false

    if options.touch
      # Disable scrolling on iOS. It also disables zooming.
      document.ontouchmove = (event) ->
        event.preventDefault()

      ["swipeLeft", "swipeRight", "swipeUp", "swipeDown"].forEach (eventName) =>
        $(@dom.overlay).on eventName, (event) =>
          @_onSwipe(event)
          event.preventDefault()

      # Use Array#filter because of lack of Array#find
      fullscreenFn = ["requestFullscreen", "mozRequestFullScreen", "webkitRequestFullscreen"].filter((fnName) =>
        @dom.game[fnName]
      )[0]

      if fullscreenFn
        $(@dom.game).on "doubleTap", (event) => @dom.game[fullscreenFn]()

    # Hackish way to ensure that @_afterPlayerMoved is called just once
    debouncedAfterPlayerMoved = $.debounce(100, true, (event) => @_afterPlayerMoved())
    ["transitionend", "webkitTransitionEnd", "oTransitionEnd"].forEach (eventName) =>
      @dom.board.addEventListener eventName, (event) =>
        entity = event.target
        debouncedAfterPlayerMoved(event) if entity.classList.contains("player")

  update: (direction) ->
    level = @currentLevel
    player = level.player
    blocks = level.blocks

    if (playerHasMoved = player.update(direction))
      blocks.forEach (block) ->
        block.uncover() # TODO move into Entity#update method
        block.update(direction)

      blocks.forEach (block) ->
        block.cover() if block.isCovered(blocks)

      if (collidingBlock = @_checkPlayerCollision())
        @_onPlayerCollision(collidingBlock)

    playerHasMoved

  draw: ->
    level = @currentLevel
    level.blocks.forEach (block) -> block.draw()
    level.player.draw()

  loadLevel: (levelNumber, fadeIn = true) ->
    # Reset game state
    @isLevelOver = false
    @isGameOver = false
    @isPlayerMoving = false

    mapping = ig.Game.entitiesMapping
    level = ig.Game.levels[levelNumber]
    board = ig.Game.board
    player = null
    blocks = []

    @_resetLayout(levelNumber)

    # Initialize all blocks and append them to the DOM
    level.data.split("").forEach (id, i) ->
      # Skip empty cells
      if id isnt "0"
        x = i % board.width       # e.g. 12 % 10 = 2
        y = (i - x) / board.width # e.g. (12 - 2) / 10 = 1
        klass = mapping[id]
        entity = new ig[klass](x, y)
        if id is "1"
          player = entity
        else
          blocks.push(entity)

    @currentLevel =
      number: levelNumber
      name: level.name
      player: player
      blocks: blocks

    # Set the initial position of DOM elements on the board
    @draw()

    @currentLevel

  _createLayout: ->
    game = document.getElementById("impasse")
    overlay = document.createElement("div")
    overlay.className = "overlay"
    title = document.createElement("div")
    title.className = "row title"
    board = document.createElement("div")
    board.className = "row board"
    levelProgress = document.createElement("div")
    levelProgress.className = "row level_progress"

    @dom =
      document: document
      game: game
      overlay: game.appendChild(overlay)
      title: game.appendChild(title)
      board: game.appendChild(board)
      levelProgress: game.appendChild(levelProgress)

    # Create level progress markers
    ig.Game.levels.forEach (level, index) =>
      el = document.createElement("div")
      el.dataset.levelIndex = index
      el.className = "point"
      @dom.levelProgress.appendChild(el)

  _resetLayout: (levelNumber) ->
    level = ig.Game.levels[levelNumber]

    @dom.game.classList.remove("game_over")

    # Remove all existing blocks from DOM
    @dom.board.innerHTML = ""

    # Update level title in DOM
    @dom.title.innerHTML = level.name

    # Update level progress markers in DOM
    completedLevels = JSON.parse(storage["completedLevels"])
    points = @dom.levelProgress.getElementsByClassName("point")
    for el in points
      el.classList.remove("active")
      el.classList.add("completed") if Number(el.dataset.levelIndex) in completedLevels
    point = @dom.levelProgress.querySelector(".point[data-level-index='#{levelNumber}']")
    point.classList.add("active")

  _rescaleLayout: ->
    scale = window.innerWidth / $(@dom.game).width()
    $("body").css("#{$.fx.cssPrefix}transform", "scale(#{scale#})");

  _onKeyDown: (event) ->
    unless @isPlayerMoving or @isLevelOver or @isGameOver
      switch key = event.which
        when ig.KEY.PLUS
          @currentLevelIndex += 1
          @_onLevelOver()
          event.preventDefault()
        when ig.KEY.MINUS
          @currentLevelIndex -= 1
          @_onLevelOver()
          event.preventDefault()
        when ig.KEY.LEFT, ig.KEY.UP, ig.KEY.RIGHT, ig.KEY.DOWN
          direction = key
          @isPlayerMoving = @update(direction)
          @draw() if @isPlayerMoving
          event.preventDefault()

  _onSwipe: (event) ->
    unless @isPlayerMoving or @isLevelOver or @isGameOver
      direction = switch event.type
        when "swipeLeft" then ig.DIRECTION.LEFT
        when "swipeUp" then ig.DIRECTION.UP
        when "swipeRight" then ig.DIRECTION.RIGHT
        when "swipeDown" then ig.DIRECTION.DOWN

      @isPlayerMoving = @update(direction)
      @draw() if @isPlayerMoving

  _afterPlayerMoved: (event) ->
    # Enable entity animation that may have been disabled by its update method
    Array.prototype.slice.call(@dom.board.children).forEach (el) ->
      el.classList.remove("no_transition")

    if @isGameOver
      @_onGameOver()
    else if @isLevelOver
      @_onLevelOver()

    @isPlayerMoving = false

  _checkPlayerCollision: ->
    level = @currentLevel

    collidingBlock = null
    level.blocks.some (block) =>
      (collidingBlock = block) and true if level.player.doesCollideWith(block)
    collidingBlock

  _onPlayerCollision: (block) ->
    switch block.constructor
      when ig.GreenOBlock
        @_onGreenOBlockCollision(block)
      when ig.WinBlock
        @_onWinBlockCollision(block)
        @isLevelOver = true
      else
        @isLevelOver = true

  _onGreenOBlockCollision: (block) ->
    block.isPresent = false

    # Toggle presence of all red x block on the level
    @currentLevel.blocks.forEach (el) ->
      el.isPresent = !el.isPresent if el instanceof ig.RedXBlock

  _onWinBlockCollision: (block) ->
    if @currentLevelIndex is ig.Game.levels.length - 1
      @isGameOver = true
    else
      completedLevels = JSON.parse(storage["completedLevels"])
      if completedLevels.indexOf(@currentLevelIndex) == -1
        completedLevels.push(@currentLevelIndex)
        storage["completedLevels"] = JSON.stringify(completedLevels)

      @currentLevelIndex += 1

  _onLevelOver: ->
    self = @
    onTransitionEnd = (event) ->
      # Restart the current level or load the next one
      self.loadLevel(self.currentLevelIndex)

      # Hide faded-in overlay without transition
      overlay = self.dom.overlay
      overlay.classList.add("no_transition")
      overlay.style.opacity = 0
      overlay.classList.remove("no_transition")

      # Remove this listener to make sure it's executed just once per #_onLevelOver call
      overlay.removeEventListener event.type, onTransitionEnd

    ["transitionend", "webkitTransitionEnd", "oTransitionEnd"].forEach (eventName) =>
      @dom.overlay.addEventListener eventName, onTransitionEnd

    # Fade in the overlay
    @dom.overlay.style.opacity = 1

  _onGameOver: ->
    @dom.game.classList.add("game_over")
    @dom.board.innerHTML = """
      You've reached the end of this puzzling journey.
      <br>
      Looking forward to travelling with you again!
      <br><br>
      Regards, Wanderlands
      """

class ig.Entity
  @id: "0"
  @zIndex: 0
  @className: ""
  @showBorderWhenHidden: false

  @define 'isPresent',
    get: ->
      return @_present
    set: (value) ->
      @_present = Boolean(value)
      method = if @_present then "remove" else "add"
      @el.forEach (el) -> el.classList[method]("hidden")
      @

  constructor: (x, y) ->
    dom = ig.game.dom

    @pos = x: x, y: y
    @el = [1..3].map (item) =>
      el = dom.document.createElement("div")
      el.className = "entity #{@constructor.className}"
      el.style.zIndex = @constructor.zIndex
      dom.board.appendChild(el)
      el
    @isPresent = true

  update: (direction) ->
    false

  # Change position of DOM elements - animation is handled by CSS transitions.
  draw: () ->
    margin = 8
    blockDiameter = 44
    totalDiameter  = 2 * margin + blockDiameter

    @el.forEach (el, index) =>
      index -= 1 # map [0, 1, 2] to [-1, 0, +1]
      offset = index * ig.Game.board.height * totalDiameter
      el.style.top = (margin + @pos.y * (totalDiameter)) + offset + "px"
      el.style.left = (margin + @pos.x * (totalDiameter)) + "px"

  doesCollideWith: (other) ->
    other.isPresent and @pos.x is other.pos.x and @pos.y is other.pos.y

  isCovered: (blocks) ->
    others = blocks.filter (block) =>
      true if @ isnt block and @doesCollideWith(block)

    # Sorting is not really needed, as it's probably not possible to
    # have more than 2 blocks at the same position
    if others.length
      others.sort (a, b) ->
        a.constructor.zIndex - b.constructor.zIndex
      @constructor.zIndex < others[0].constructor.zIndex
    else
      false

  cover: ->
    @el.forEach (el) ->
      el.classList.add("covered")

  uncover: ->
    @el.forEach (el) ->
      el.classList.remove("covered")

  _up: ->
    @pos.y -= 1
    if @pos.y is -1
      @pos.y = ig.Game.board.height - 1
      el = @el.shift(); @el.push(el)
      el.classList.add("no_transition")

  _down: ->
    @pos.y += 1
    if @pos.y is ig.Game.board.height
      @pos.y = 0
      el = @el.pop(); @el.unshift(el)
      el.classList.add("no_transition")

class ig.Player extends ig.Entity
  @id: "1"
  @zIndex: 5
  @className: "player"

  update: (direction) ->
    switch direction
      when ig.KEY.LEFT
        return false if @pos.x is 0
        @pos.x -= 1
        true
      when ig.KEY.RIGHT
        return false if @pos.x is ig.Game.board.width - 1
        @pos.x += 1
        true
      when ig.KEY.UP
        @_up()
        true
      when ig.KEY.DOWN
        @_down()
        true

class ig.StaticBlock extends ig.Entity
  @id: "2"
  @className: "static"

class ig.OrangeUpBlock extends ig.Entity
  @id: "3"
  @zIndex: 2
  @className: "orange_up_block"

  update: (direction) ->
    switch direction
      when ig.KEY.LEFT, ig.KEY.RIGHT
        false
      when ig.KEY.UP, ig.KEY.DOWN
        @_up()
        true

class ig.PurpleDownBlock extends ig.Entity
  @id: "4"
  @zIndex: 2
  @className: "purple_down_block"

  update: (direction) ->
    switch direction
      when ig.KEY.LEFT, ig.KEY.RIGHT
        false
      when ig.KEY.UP, ig.KEY.DOWN
        @_down()
        true

class ig.YellowUpBlock extends ig.Entity
  @id: "5"
  @zIndex: 3
  @className: "yellow_up_block"

  update: (direction) ->
    switch direction
      when ig.KEY.LEFT, ig.KEY.RIGHT
        @_up()
        true
      when ig.KEY.UP, ig.KEY.DOWN
        false

class ig.BlueDownBlock extends ig.Entity
  @id: "6"
  @zIndex: 3
  @className: "blue_down_block"

  update: (direction) ->
    switch direction
      when ig.KEY.LEFT, ig.KEY.RIGHT
        @_down()
        true
      when ig.KEY.UP, ig.KEY.DOWN
        false

class ig.BlueMinusBlock extends ig.Entity
  @id: "7"
  @zIndex: 4
  @className: "blue_minus_block hideable"

  update: (direction) ->
    switch direction
      when ig.KEY.LEFT, ig.KEY.RIGHT
        false
      when ig.KEY.UP, ig.KEY.DOWN
        @isPresent = !@isPresent
        true

class ig.WinBlock extends ig.Entity
  @id: "8"
  @className: "win_block"

class ig.PinkMinusBlock extends ig.Entity
  @id: "9"
  @zIndex: 4
  @className: "pink_minus_block hideable"

  constructor: (x, y) ->
    super
    @isPresent = false

  update: (direction) ->
    switch direction
      when ig.KEY.LEFT, ig.KEY.RIGHT
        false
      when ig.KEY.UP, ig.KEY.DOWN
        @isPresent = !@isPresent
        true

class ig.RedXBlock extends ig.Entity
  @id: "a"
  @zIndex: 4
  @className: "red_x_block hideable"
  @showBorderWhenHidden: true

class ig.GreenOBlock extends ig.Entity
  @id: "b"
  @zIndex: 4
  @className: "green_o_block"

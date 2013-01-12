// Generated by CoffeeScript 1.4.0
(function() {
  (function(b,c){var $=b.Zepto,a;$.throttle=a=function(e,f,j,i){var h,d=0;if(typeof f!=="boolean"){i=j;j=f;f=c}function g(){var o=this,m=+new Date()-d,n=arguments;function l(){d=+new Date();j.apply(o,n)}function k(){h=c}if(i&&!h){l()}h&&clearTimeout(h);if(i===c&&m>e){l()}else{if(f!==true){h=setTimeout(i?k:l,i===c?e-m:e)}}}if($.guid){g.guid=j.guid=j.guid||$.guid++}return g};$.debounce=function(d,e,f){return f===c?a(d,e,false):a(d,f,e!==false)}})(this);;

  var storage,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Function.prototype.define = function(prop, desc) {
    return Object.defineProperty(this.prototype, prop, desc);
  };

  storage = window.localStorage;

  try {
    storage.setItem("testPrivateBrowsingMode", "1");
    storage.removeItem("testPrivateBrowsingMode");
  } catch (error) {
    if (error.code === DOMException.QUOTA_EXCEEDED_ERR && storage.length === 0) {
      storage = {};
    } else {
      throw error;
    }
  }

  window.ig = {
    game: null,
    KEY: {
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
      PLUS: 187,
      MINUS: 189
    },
    DIRECTION: {
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40
    }
  };

  ig.Game = (function() {

    Game.entitiesMapping = {
      "1": "Player",
      "2": "StaticBlock",
      "3": "OrangeUpBlock",
      "4": "PurpleDownBlock",
      "5": "YellowUpBlock",
      "6": "BlueDownBlock",
      "7": "BlueMinusBlock",
      "8": "WinBlock",
      "9": "PinkMinusBlock",
      "a": "RedXBlock",
      "b": "GreenOBlock"
    };

    Game.levels = [
      {
        name: "motion",
        data: "002000000010200002080000000200"
      }, {
        name: "pathway",
        data: "222200022210200202082000220002"
      }, {
        name: "wrap",
        data: "002000020010222222080000220000"
      }, {
        name: "surprise",
        data: "000033030010300003080030330000"
      }, {
        name: "going up",
        data: "020002000212323002380032322232"
      }, {
        name: "phase",
        data: "000032000010323003280230003322"
      }, {
        name: "weave",
        data: "004040204013424323480302030300"
      }, {
        name: "lock",
        data: "240032400210343442382224000332"
      }, {
        name: "bridge",
        data: "040322403014333444380020000200"
      }, {
        name: "flash",
        data: "002020700210702027780020702002"
      }, {
        name: "deception",
        data: "020703020217324327480207427742"
      }, {
        name: "sidestep",
        data: "237237320217007070480372370242"
      }, {
        name: "offbeat",
        data: "000970790010790970080070790900"
      }, {
        name: "hurdle",
        data: "090702000212473243280242909270"
      }, {
        name: "backdoor",
        data: "027702030712329342280992939307"
      }, {
        name: "axis",
        data: "000205200212504500080200402552"
      }, {
        name: "sweep",
        data: "025555555210000003080207040302"
      }, {
        name: "gate",
        data: "000220570012520453580207040352"
      }, {
        name: "unzip",
        data: "005634560010000000080056345600"
      }, {
        name: "twins",
        data: "076049503212654256380905070602"
      }, {
        name: "machine",
        data: "304030403012452245283670367036"
      }, {
        name: "reduction",
        data: "00ba039200100a0b66a800ba030b20"
      }, {
        name: "lure",
        data: "009630b2201256356ba8005ba50220"
      }, {
        name: "final dance",
        data: "05ba052222106079bba80560602222"
      }
    ];

    Game.board = {
      height: 3,
      width: 10
    };

    Game.define('currentLevelIndex', {
      get: function() {
        return Number(this._currentLevelIndex || storage["currentLevel"] || 0);
      },
      set: function(value) {
        var index;
        index = Number(value);
        if (index < 0) {
          this._currentLevelIndex = 0;
        } else if (index >= ig.Game.levels.length) {
          this._currentLevelIndex = ig.Game.levels.length - 1;
        } else {
          this._currentLevelIndex = index;
        }
        return storage["currentLevel"] = this._currentLevelIndex;
      }
    });

    Game.prototype.currentLevel = void 0;

    Game.prototype.isLevelOver = false;

    Game.prototype.isGameOver = false;

    function Game(options) {
      var debouncedAfterPlayerMoved, fullscreenFn, isCurrentlyPressed, orientationEvent,
        _this = this;
      if (options == null) {
        options = {};
      }
      ig.game = this;
      storage["completedLevels"] || (storage["completedLevels"] = JSON.stringify([]));
      this._createLayout();
      this.loadLevel(this.currentLevelIndex, false);
      if (options.fullscreen) {
        orientationEvent = "onorientationchange" in window ? "orientationchange" : "resize";
        window.addEventListener(orientationEvent, function(event) {
          return _this._rescaleLayout();
        });
        this._rescaleLayout();
      }
      isCurrentlyPressed = {};
      document.addEventListener("keydown", function(event) {
        if (!isCurrentlyPressed[event.which]) {
          _this._onKeyDown(event);
        }
        return isCurrentlyPressed[event.which] = true;
      });
      document.addEventListener("keyup", function(event) {
        return isCurrentlyPressed[event.which] = false;
      });
      if (options.touch) {
        document.ontouchmove = function(event) {
          return event.preventDefault();
        };
        ["swipeLeft", "swipeRight", "swipeUp", "swipeDown"].forEach(function(eventName) {
          return $(_this.dom.overlay).on(eventName, function(event) {
            _this._onSwipe(event);
            return event.preventDefault();
          });
        });
        fullscreenFn = ["requestFullscreen", "mozRequestFullScreen", "webkitRequestFullscreen"].filter(function(fnName) {
          return _this.dom.game[fnName];
        })[0];
        if (fullscreenFn) {
          $(this.dom.game).on("doubleTap", function(event) {
            return _this.dom.game[fullscreenFn]();
          });
        }
      }
      debouncedAfterPlayerMoved = $.debounce(100, true, function(event) {
        return _this._afterPlayerMoved();
      });
      ["transitionend", "webkitTransitionEnd", "oTransitionEnd"].forEach(function(eventName) {
        return _this.dom.board.addEventListener(eventName, function(event) {
          var entity;
          entity = event.target;
          if (entity.classList.contains("player")) {
            return debouncedAfterPlayerMoved(event);
          }
        });
      });
    }

    Game.prototype.update = function(direction) {
      var blocks, collidingBlock, level, player, playerHasMoved;
      level = this.currentLevel;
      player = level.player;
      blocks = level.blocks;
      if ((playerHasMoved = player.update(direction))) {
        blocks.forEach(function(block) {
          block.uncover();
          return block.update(direction);
        });
        blocks.forEach(function(block) {
          if (block.isCovered(blocks)) {
            return block.cover();
          }
        });
        if ((collidingBlock = this._checkPlayerCollision())) {
          this._onPlayerCollision(collidingBlock);
        }
      }
      return playerHasMoved;
    };

    Game.prototype.draw = function() {
      var level;
      level = this.currentLevel;
      level.blocks.forEach(function(block) {
        return block.draw();
      });
      return level.player.draw();
    };

    Game.prototype.loadLevel = function(levelNumber, fadeIn) {
      var blocks, board, level, mapping, player;
      if (fadeIn == null) {
        fadeIn = true;
      }
      this.isLevelOver = false;
      this.isGameOver = false;
      this.isPlayerMoving = false;
      mapping = ig.Game.entitiesMapping;
      level = ig.Game.levels[levelNumber];
      board = ig.Game.board;
      player = null;
      blocks = [];
      this._resetLayout(levelNumber);
      level.data.split("").forEach(function(id, i) {
        var entity, klass, x, y;
        if (id !== "0") {
          x = i % board.width;
          y = (i - x) / board.width;
          klass = mapping[id];
          entity = new ig[klass](x, y);
          if (id === "1") {
            return player = entity;
          } else {
            return blocks.push(entity);
          }
        }
      });
      this.currentLevel = {
        number: levelNumber,
        name: level.name,
        player: player,
        blocks: blocks
      };
      this.draw();
      return this.currentLevel;
    };

    Game.prototype._createLayout = function() {
      var board, game, levelProgress, overlay, title,
        _this = this;
      game = document.getElementById("impasse");
      overlay = document.createElement("div");
      overlay.className = "overlay";
      title = document.createElement("div");
      title.className = "row title";
      board = document.createElement("div");
      board.className = "row board";
      levelProgress = document.createElement("div");
      levelProgress.className = "row level_progress";
      this.dom = {
        document: document,
        game: game,
        overlay: game.appendChild(overlay),
        title: game.appendChild(title),
        board: game.appendChild(board),
        levelProgress: game.appendChild(levelProgress)
      };
      return ig.Game.levels.forEach(function(level, index) {
        var el;
        el = document.createElement("div");
        el.dataset.levelIndex = index;
        el.className = "point";
        return _this.dom.levelProgress.appendChild(el);
      });
    };

    Game.prototype._resetLayout = function(levelNumber) {
      var completedLevels, el, level, point, points, _i, _len, _ref;
      level = ig.Game.levels[levelNumber];
      this.dom.game.classList.remove("game_over");
      this.dom.board.innerHTML = "";
      this.dom.title.innerHTML = level.name;
      completedLevels = JSON.parse(storage["completedLevels"]);
      points = this.dom.levelProgress.getElementsByClassName("point");
      for (_i = 0, _len = points.length; _i < _len; _i++) {
        el = points[_i];
        el.classList.remove("active");
        if (_ref = Number(el.dataset.levelIndex), __indexOf.call(completedLevels, _ref) >= 0) {
          el.classList.add("completed");
        }
      }
      point = this.dom.levelProgress.querySelector(".point[data-level-index='" + levelNumber + "']");
      return point.classList.add("active");
    };

    Game.prototype._rescaleLayout = function() {
      var scale;
      scale = window.innerWidth / $(this.dom.game).width();
      return $("body").css("zoom", scale);
    };

    Game.prototype._onKeyDown = function(event) {
      var direction, key;
      if (!(this.isPlayerMoving || this.isLevelOver || this.isGameOver)) {
        switch (key = event.which) {
          case ig.KEY.PLUS:
            this.currentLevelIndex += 1;
            this._onLevelOver();
            return event.preventDefault();
          case ig.KEY.MINUS:
            this.currentLevelIndex -= 1;
            this._onLevelOver();
            return event.preventDefault();
          case ig.KEY.LEFT:
          case ig.KEY.UP:
          case ig.KEY.RIGHT:
          case ig.KEY.DOWN:
            direction = key;
            this.isPlayerMoving = this.update(direction);
            if (this.isPlayerMoving) {
              this.draw();
            }
            return event.preventDefault();
        }
      }
    };

    Game.prototype._onSwipe = function(event) {
      var direction;
      if (!(this.isPlayerMoving || this.isLevelOver || this.isGameOver)) {
        direction = (function() {
          switch (event.type) {
            case "swipeLeft":
              return ig.DIRECTION.LEFT;
            case "swipeUp":
              return ig.DIRECTION.UP;
            case "swipeRight":
              return ig.DIRECTION.RIGHT;
            case "swipeDown":
              return ig.DIRECTION.DOWN;
          }
        })();
        this.isPlayerMoving = this.update(direction);
        if (this.isPlayerMoving) {
          return this.draw();
        }
      }
    };

    Game.prototype._afterPlayerMoved = function(event) {
      Array.prototype.slice.call(this.dom.board.children).forEach(function(el) {
        return el.classList.remove("no_transition");
      });
      if (this.isGameOver) {
        this._onGameOver();
      } else if (this.isLevelOver) {
        this._onLevelOver();
      }
      return this.isPlayerMoving = false;
    };

    Game.prototype._checkPlayerCollision = function() {
      var collidingBlock, level,
        _this = this;
      level = this.currentLevel;
      collidingBlock = null;
      level.blocks.some(function(block) {
        if (level.player.doesCollideWith(block)) {
          return (collidingBlock = block) && true;
        }
      });
      return collidingBlock;
    };

    Game.prototype._onPlayerCollision = function(block) {
      switch (block.constructor) {
        case ig.GreenOBlock:
          return this._onGreenOBlockCollision(block);
        case ig.WinBlock:
          this._onWinBlockCollision(block);
          return this.isLevelOver = true;
        default:
          return this.isLevelOver = true;
      }
    };

    Game.prototype._onGreenOBlockCollision = function(block) {
      block.isPresent = false;
      return this.currentLevel.blocks.forEach(function(el) {
        if (el instanceof ig.RedXBlock) {
          return el.isPresent = !el.isPresent;
        }
      });
    };

    Game.prototype._onWinBlockCollision = function(block) {
      var completedLevels;
      if (this.currentLevelIndex === ig.Game.levels.length - 1) {
        return this.isGameOver = true;
      } else {
        completedLevels = JSON.parse(storage["completedLevels"]);
        if (completedLevels.indexOf(this.currentLevelIndex) === -1) {
          completedLevels.push(this.currentLevelIndex);
          storage["completedLevels"] = JSON.stringify(completedLevels);
        }
        return this.currentLevelIndex += 1;
      }
    };

    Game.prototype._onLevelOver = function() {
      var onTransitionEnd, self,
        _this = this;
      self = this;
      onTransitionEnd = function(event) {
        var overlay;
        self.loadLevel(self.currentLevelIndex);
        overlay = self.dom.overlay;
        overlay.classList.add("no_transition");
        overlay.style.opacity = 0;
        overlay.classList.remove("no_transition");
        return overlay.removeEventListener(event.type, onTransitionEnd);
      };
      ["transitionend", "webkitTransitionEnd", "oTransitionEnd"].forEach(function(eventName) {
        return _this.dom.overlay.addEventListener(eventName, onTransitionEnd);
      });
      return this.dom.overlay.style.opacity = 1;
    };

    Game.prototype._onGameOver = function() {
      this.dom.game.classList.add("game_over");
      return this.dom.board.innerHTML = "You've reached the end of this puzzling journey.\n<br>\nLooking forward to travelling with you again!\n<br><br>\nRegards, Wanderlands";
    };

    return Game;

  })();

  ig.Entity = (function() {

    Entity.id = "0";

    Entity.zIndex = 0;

    Entity.className = "";

    Entity.showBorderWhenHidden = false;

    Entity.define('isPresent', {
      get: function() {
        return this._present;
      },
      set: function(value) {
        var method;
        this._present = Boolean(value);
        method = this._present ? "remove" : "add";
        this.el.forEach(function(el) {
          return el.classList[method]("hidden");
        });
        return this;
      }
    });

    function Entity(x, y) {
      var dom,
        _this = this;
      dom = ig.game.dom;
      this.pos = {
        x: x,
        y: y
      };
      this.el = [1, 2, 3].map(function(item) {
        var el;
        el = dom.document.createElement("div");
        el.className = "entity " + _this.constructor.className;
        el.style.zIndex = _this.constructor.zIndex;
        dom.board.appendChild(el);
        return el;
      });
      this.isPresent = true;
    }

    Entity.prototype.update = function(direction) {
      return false;
    };

    Entity.prototype.draw = function() {
      var blockDiameter, margin, totalDiameter,
        _this = this;
      margin = 8;
      blockDiameter = 44;
      totalDiameter = 2 * margin + blockDiameter;
      return this.el.forEach(function(el, index) {
        var offset;
        index -= 1;
        offset = index * ig.Game.board.height * totalDiameter;
        el.style.top = (margin + _this.pos.y * totalDiameter) + offset + "px";
        return el.style.left = (margin + _this.pos.x * totalDiameter) + "px";
      });
    };

    Entity.prototype.doesCollideWith = function(other) {
      return other.isPresent && this.pos.x === other.pos.x && this.pos.y === other.pos.y;
    };

    Entity.prototype.isCovered = function(blocks) {
      var others,
        _this = this;
      others = blocks.filter(function(block) {
        if (_this !== block && _this.doesCollideWith(block)) {
          return true;
        }
      });
      if (others.length) {
        others.sort(function(a, b) {
          return a.constructor.zIndex - b.constructor.zIndex;
        });
        return this.constructor.zIndex < others[0].constructor.zIndex;
      } else {
        return false;
      }
    };

    Entity.prototype.cover = function() {
      return this.el.forEach(function(el) {
        return el.classList.add("covered");
      });
    };

    Entity.prototype.uncover = function() {
      return this.el.forEach(function(el) {
        return el.classList.remove("covered");
      });
    };

    Entity.prototype._up = function() {
      var el;
      this.pos.y -= 1;
      if (this.pos.y === -1) {
        this.pos.y = ig.Game.board.height - 1;
        el = this.el.shift();
        this.el.push(el);
        return el.classList.add("no_transition");
      }
    };

    Entity.prototype._down = function() {
      var el;
      this.pos.y += 1;
      if (this.pos.y === ig.Game.board.height) {
        this.pos.y = 0;
        el = this.el.pop();
        this.el.unshift(el);
        return el.classList.add("no_transition");
      }
    };

    return Entity;

  })();

  ig.Player = (function(_super) {

    __extends(Player, _super);

    function Player() {
      return Player.__super__.constructor.apply(this, arguments);
    }

    Player.id = "1";

    Player.zIndex = 5;

    Player.className = "player";

    Player.prototype.update = function(direction) {
      switch (direction) {
        case ig.KEY.LEFT:
          if (this.pos.x === 0) {
            return false;
          }
          this.pos.x -= 1;
          return true;
        case ig.KEY.RIGHT:
          if (this.pos.x === ig.Game.board.width - 1) {
            return false;
          }
          this.pos.x += 1;
          return true;
        case ig.KEY.UP:
          this._up();
          return true;
        case ig.KEY.DOWN:
          this._down();
          return true;
      }
    };

    return Player;

  })(ig.Entity);

  ig.StaticBlock = (function(_super) {

    __extends(StaticBlock, _super);

    function StaticBlock() {
      return StaticBlock.__super__.constructor.apply(this, arguments);
    }

    StaticBlock.id = "2";

    StaticBlock.className = "static";

    return StaticBlock;

  })(ig.Entity);

  ig.OrangeUpBlock = (function(_super) {

    __extends(OrangeUpBlock, _super);

    function OrangeUpBlock() {
      return OrangeUpBlock.__super__.constructor.apply(this, arguments);
    }

    OrangeUpBlock.id = "3";

    OrangeUpBlock.zIndex = 2;

    OrangeUpBlock.className = "orange_up_block";

    OrangeUpBlock.prototype.update = function(direction) {
      switch (direction) {
        case ig.KEY.LEFT:
        case ig.KEY.RIGHT:
          return false;
        case ig.KEY.UP:
        case ig.KEY.DOWN:
          this._up();
          return true;
      }
    };

    return OrangeUpBlock;

  })(ig.Entity);

  ig.PurpleDownBlock = (function(_super) {

    __extends(PurpleDownBlock, _super);

    function PurpleDownBlock() {
      return PurpleDownBlock.__super__.constructor.apply(this, arguments);
    }

    PurpleDownBlock.id = "4";

    PurpleDownBlock.zIndex = 2;

    PurpleDownBlock.className = "purple_down_block";

    PurpleDownBlock.prototype.update = function(direction) {
      switch (direction) {
        case ig.KEY.LEFT:
        case ig.KEY.RIGHT:
          return false;
        case ig.KEY.UP:
        case ig.KEY.DOWN:
          this._down();
          return true;
      }
    };

    return PurpleDownBlock;

  })(ig.Entity);

  ig.YellowUpBlock = (function(_super) {

    __extends(YellowUpBlock, _super);

    function YellowUpBlock() {
      return YellowUpBlock.__super__.constructor.apply(this, arguments);
    }

    YellowUpBlock.id = "5";

    YellowUpBlock.zIndex = 3;

    YellowUpBlock.className = "yellow_up_block";

    YellowUpBlock.prototype.update = function(direction) {
      switch (direction) {
        case ig.KEY.LEFT:
        case ig.KEY.RIGHT:
          this._up();
          return true;
        case ig.KEY.UP:
        case ig.KEY.DOWN:
          return false;
      }
    };

    return YellowUpBlock;

  })(ig.Entity);

  ig.BlueDownBlock = (function(_super) {

    __extends(BlueDownBlock, _super);

    function BlueDownBlock() {
      return BlueDownBlock.__super__.constructor.apply(this, arguments);
    }

    BlueDownBlock.id = "6";

    BlueDownBlock.zIndex = 3;

    BlueDownBlock.className = "blue_down_block";

    BlueDownBlock.prototype.update = function(direction) {
      switch (direction) {
        case ig.KEY.LEFT:
        case ig.KEY.RIGHT:
          this._down();
          return true;
        case ig.KEY.UP:
        case ig.KEY.DOWN:
          return false;
      }
    };

    return BlueDownBlock;

  })(ig.Entity);

  ig.BlueMinusBlock = (function(_super) {

    __extends(BlueMinusBlock, _super);

    function BlueMinusBlock() {
      return BlueMinusBlock.__super__.constructor.apply(this, arguments);
    }

    BlueMinusBlock.id = "7";

    BlueMinusBlock.zIndex = 4;

    BlueMinusBlock.className = "blue_minus_block hideable";

    BlueMinusBlock.prototype.update = function(direction) {
      switch (direction) {
        case ig.KEY.LEFT:
        case ig.KEY.RIGHT:
          return false;
        case ig.KEY.UP:
        case ig.KEY.DOWN:
          this.isPresent = !this.isPresent;
          return true;
      }
    };

    return BlueMinusBlock;

  })(ig.Entity);

  ig.WinBlock = (function(_super) {

    __extends(WinBlock, _super);

    function WinBlock() {
      return WinBlock.__super__.constructor.apply(this, arguments);
    }

    WinBlock.id = "8";

    WinBlock.className = "win_block";

    return WinBlock;

  })(ig.Entity);

  ig.PinkMinusBlock = (function(_super) {

    __extends(PinkMinusBlock, _super);

    PinkMinusBlock.id = "9";

    PinkMinusBlock.zIndex = 4;

    PinkMinusBlock.className = "pink_minus_block hideable";

    function PinkMinusBlock(x, y) {
      PinkMinusBlock.__super__.constructor.apply(this, arguments);
      this.isPresent = false;
    }

    PinkMinusBlock.prototype.update = function(direction) {
      switch (direction) {
        case ig.KEY.LEFT:
        case ig.KEY.RIGHT:
          return false;
        case ig.KEY.UP:
        case ig.KEY.DOWN:
          this.isPresent = !this.isPresent;
          return true;
      }
    };

    return PinkMinusBlock;

  })(ig.Entity);

  ig.RedXBlock = (function(_super) {

    __extends(RedXBlock, _super);

    function RedXBlock() {
      return RedXBlock.__super__.constructor.apply(this, arguments);
    }

    RedXBlock.id = "a";

    RedXBlock.zIndex = 4;

    RedXBlock.className = "red_x_block hideable";

    RedXBlock.showBorderWhenHidden = true;

    return RedXBlock;

  })(ig.Entity);

  ig.GreenOBlock = (function(_super) {

    __extends(GreenOBlock, _super);

    function GreenOBlock() {
      return GreenOBlock.__super__.constructor.apply(this, arguments);
    }

    GreenOBlock.id = "b";

    GreenOBlock.zIndex = 4;

    GreenOBlock.className = "green_o_block";

    return GreenOBlock;

  })(ig.Entity);

}).call(this);

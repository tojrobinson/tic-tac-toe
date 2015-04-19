var views = (function($) {
   'use strict';

   // My standard view pattern
   // from: https://github.com/tojrobinson/linkwrapper.com/blob/master/public/js/player/views/view.js
   var View = function() {
      this.init.apply(this, arguments);

      if (this.events && typeof this.events === 'object') {
         var that = this;
         Object.keys(this.events).forEach(function(key) {
            var type = key.substr(0, key.indexOf(' '));
            var target = key.substr(key.indexOf(' ') + 1);
            var action = this.events[key];

            if (target === 'window') {
               $(window).on(type, function(e) {
                  that[action].call(that, e, $(this));
               });
            } else {
               $(that.el).on(type, target, function(e) {
                  that[action].call(that, e, $(this));
               });
            }
         }, this);
      }
   }

   View.prototype = {
      init: function() {

      }
   };

   View.extend = function extend(members) {
      var Parent = this;
      var Child = function() {
         Parent.apply(this, arguments);
      }

      Child.prototype = Object.create(Parent.prototype);

      for (var m in members) {
         if (m === 'events') {
            Child.prototype.events = Child.prototype.events || {};
            for (var e in members.events) {
               Child.prototype.events[e] = members.events[e];
            }
         } else {
            Child.prototype[m] = members[m];
         }
      }

      Child.extend = extend;

      return Child;
   }

   var NewGameMenu = View.extend({
      el: 'body',
      cover: $('<div class="cover">'),

      init: function(context) {
         $('body').undelegate('#start-game', 'click');
         this.context = context;
         this.render();
      },

      events: {
         'click .close-modal': 'closeMenu',
         'click .single-player': 'singlePlayer',
         'click .multi-player': 'multiPlayer',
         'click .single-settings span': 'selectDifficulty',
         'click #start-game': 'startGame'
      },

      render: function() {
         $(this.el).append(this.cover);
         $(this.el).append($('#menu-template').html());
      },

      unrender: function() {
         this.cover.remove();
         $('#start-game').undelegate();
         $('#new-game-modal').empty().unbind().remove();
      },

      closeMenu: function() {
         this.unrender();
      },

      singlePlayer: function() {
         $('.multi-settings', this.el).hide();
         $('.single-settings', this.el).show();
         $('.partition', this.el).show();
         $('#settings', this.el).slideDown(200);
         this.singlePlayerMode = true;
      },

      multiPlayer: function() {
         $('.single-settings', this.el).hide();
         $('.multi-settings', this.el).show();
         $('.partition', this.el).show();
         $('#settings', this.el).slideDown(200);
         this.singlePlayerMode = false;
      },

      selectDifficulty: function(e, trigger) {
         $('span', this.el).removeClass('selected');
         $(trigger).addClass('selected');

         this.difficulty = $(trigger).text();
      },

      startGame: function() {
         var difficulty = this.difficulty || 'Medium';
         var players = $('#num-players option:selected', this.el).val();
         var game;
         
         if (this.singlePlayerMode) {
            game = new TicTacToe({
               difficulty: difficulty,
               players: 2
            });
         } else {
            game = new TicTacToe({
               players: players
            });
         }

         this.unrender();
         this.context.game = game;
      }
   });

   var Board = View.extend({
      el: '#board',

      init: function(model) {
         $(this.el).unbind();
         this.model = model;
         this.render();
      },

      events: {
         'mouseover .cell': 'canPlace',
         'mouseout .cell': 'clearPlace'
      },

      render: function() {
         $(this.el).empty().html('');

         for (var i = 0; i < this.model.size; ++i) {
            var row = $('<div class="row">');
            for (var j = 0; j < this.model.size; ++j) {
               var cell = $('<div class="cell" data-row="' + i + '" data-col="' + j +'">');
               if (this.model.board[i][j] === -1) {
                  cell.addClass('vacant');
               } else {
                  cell.addClass('player-' + this.model.board[i][j]);
               }

               row.append(cell);
            }
            $(this.el).append(row);
         }
      },

      canPlace: function(e, trigger) {
         var r = trigger.data('row');
         var c = trigger.data('col');

         if (this.model.board[r][c] === -1) {
            trigger.addClass('player-' + this.model.currPlayer);
         }
      },

      clearPlace: function(e, trigger) {
         var r = trigger.data('row');
         var c = trigger.data('col');

         if (this.model.board[r][c] === -1) {
            trigger.attr('class', 'cell');
         }
      }
   });

   var GameOver = View.extend({
      el: 'body',
      cover: $('<div class="cover">'),

      init: function(text) {
         this.text = text;
         this.render();
      },

      events: {
         'click .close-modal': 'unrender'
      },

      render: function() {
         $(this.el).append(this.cover)
                   .append($('#game-over-template').html());
         $('.content', this.el).text(this.text);
      },

      unrender: function() {
         $(this.cover).remove();
         $('#game-over-modal', this.el).remove();
      }
   });

   var GameStatus = View.extend({
      el: '#game-status',

      init: function(model) {
         this.model = model;
         this.render();
      },

      render: function() {
         var symbols = ['cross.png', 'circle.png', 'triangle.png'];
         $(this.el).html('To move: <img src="img/' + symbols[this.model.currPlayer] + '">');
      }
   });

   var GameView = View.extend({
      el: '#game-view',

      init: function() {
         // cache images
         var images = ['circle', 'cross', 'multi', 'single', 'triangle'];
         images.forEach(function(img) {
            new Image().src = 'img/' + img + '.png';
         });
         $(this.el).unbind();
         this.noMove = false;
      },

      events: {
         'click #new-game': 'newGame',
         'click .hint': 'getHint',
         'click .reset': 'resetBoard',
         'click .cell': 'makeMove'
      },

      newGame: function() {
         new NewGameMenu(this);
      },

      resetBoard: function() {
         if (this.game.started) {
            var g = this.game;
            this.game = new TicTacToe({
               size: g.size,
               players: g.players,
               difficulty: g.difficulty
            });
         }
      },

      makeMove: function(e, trigger) {
         if (this.noMove) return false;

         var that = this;
         this.noMove = true;

         setTimeout(function() {
            that.noMove = false;
         }, 500);

         var r = $(trigger).data('row');
         var c = $(trigger).data('col');

         this.game.makeMove(r, c);
      },

      getHint: function() {
         // TODO this.game.optMove()
      }
   });

   return {
      GameView: GameView,
      NewGameMenu: NewGameMenu,
      GameOver: GameOver,
      Board: Board,
      GameStatus: GameStatus
   };
}(jQuery));

new views.GameView();

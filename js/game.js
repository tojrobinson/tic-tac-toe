var TicTacToe = (function() {
   'use strict';

   function Game(opt) {
      this.size = opt.size || 3;
      this.players = opt.players || 2;
      this.difficulty = opt.difficulty || false;
      this.board = [];
      this.movesMade = 0;
      this.currPlayer = 0;
      this.started = true;

      for (var i = 0; i < this.size; ++i) {
         this.board[i] = [];
         for (var j = 0; j < this.size; ++j) {
            this.board[i][j] = -1;
         }
      }

      this.boardView = new views.Board(this);
      this.statusView = new views.GameStatus(this);
   }

   Game.prototype.makeMove = function(r, c) {
      if (this.board[r][c] != -1) return false;

      this.board[r][c] = this.currPlayer;
      this.movesMade++;
      this.boardView.render();

      var gameOver = hasWon(this.currPlayer, this.board, this.size);
      var playerTitles = ['Crosses', 'Naughts', 'Triangles'];

      // end game disable board
      if (gameOver) {
         var shape = playerTitles[this.currPlayer];
         new views.GameOver(shape + ' win!');
         this.makeMove = function() {}
      } else if (this.movesMade >= this.size*this.size) {
         this.makeMove = function() {}
         new views.GameOver('Game drawn...');
      }

      this.currPlayer = (this.currPlayer + 1) % this.players;
      this.statusView.render();

      if (this.difficulty && this.currPlayer === 1) {
         var move = this.optMove();
         var game = this;

         setTimeout(function() {
            game.makeMove(move.r, move.c);
         }, 500);
      }
   }

   Game.prototype.copyBoard = function() {
      var copy = [];
      
      for (var i = 0; i < this.size; ++i) {
         copy[i] = [];
         for (var j = 0; j < this.size; ++j) {
            copy[i][j] = this.board[i][j];
         }
      }

      return copy;
   }

   // minimax only on standard board size since no pruning == N!
   Game.prototype.optMove = function() {
      var game = this;
      var maxPlayer = this.currPlayer;

      (function minimax(board, player, depth) {
         var minScore = 2;
         var maxScore = -2;
         var currScore = -2;

         if (hasWon((maxPlayer) ? 0 : 1, board, game.size)) return -1;
         if (hasWon(maxPlayer, board, game.size)) return 1;

         for (var i = 0; i < game.size; ++i) {
            for (var j = 0; j < game.size; ++j) {
               if (board[i][j] === -1) {
                  board[i][j] = player;
                  currScore = minimax(board, (player) ? 0 : 1, depth + 1);
                  board[i][j] = -1;

                  if (player === maxPlayer && currScore > maxScore) {
                     maxScore = currScore;
                     if (depth === 0) {
                        game.nextOptMove = {r: i, c: j};
                     }
                  } else if (player !== maxPlayer && currScore < minScore) {
                     minScore = currScore;
                  }
               }
            }
         }

         if (currScore === -2) {
            return 0;
         }

         if (player !== maxPlayer) {
            return minScore;
         }

         return maxScore;
      }(game.copyBoard(), maxPlayer, 0));

      return game.nextOptMove;
   }

   // utils
   function inBound(r, c, size) {
      return r >= 0 && c >= 0 && r < size && c < size;
   }

   function hasWon(player, board, size) {
      var leftDiagonal = [];
      var rightDiagonal = [];

      for (var i = 0; i < size; ++i) {
         var horizontal = [];
         var vertical = [];

         if (board[i][i] === player) {
            leftDiagonal.push({r: i, c: i});
         } else {
            leftDiagonal = [];
         }

         if (board[i][size-i-1] === player) {
            rightDiagonal.push({r: i, c: size-i-1});
         } else {
            rightDiagonal = [];
         }

         if (leftDiagonal.length === 3) {
            return leftDiagonal;
         } else if (rightDiagonal.length === 3) {
            return rightDiagonal;
         }

         for (var j = 0; j < size; ++j) {
            if (board[i][j] === player) {
               horizontal.push({r: i, c: j});
            } else {
               horizontal = [];
            }

            if (board[j][i] === player) {
               vertical.push({r: j, c: i});
            } else {
               vertical = [];
            }

            if (horizontal.length === 3) {
               return horizontal;
            } else if (vertical.length === 3) {
               return vertical;
            }
         }
      }

      return false;
   }

   return Game;
}());

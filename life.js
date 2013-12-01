function startLife(board) {
  var life = new Life(board);
  showGenerations(life);
}

function showGenerations(life, generationsToCompute) {
  life.render();

  generation = 0;
  setInterval(function() {
    if (!generationsToCompute || generation++ < generationsToCompute) {
      life.nextGeneration();
      life.drawDiff();
    } else {
      if (life.reverseDiffHistory) {
        life.diff = life.reverseDiffHistory.pop();
        life.drawDiff();
      }
    }
  }, 10);
}

Life = function(board) {
  /**
     *  This dictionary is stored as
     *  [x,y] => true
     *  if !([x,y] in board) then that cell is off.
     */
  if (!board) {
    // We default to an r-pentomino if no board is given.
    this.board = {};
    this.addCoordinateToBoard([15,16]);
    this.addCoordinateToBoard([16,16]);
    this.addCoordinateToBoard([17,16]);
    this.addCoordinateToBoard([16,17]);
    this.addCoordinateToBoard([15,15]);
  } else {
    this.board = board;
  }

  this.oldboard = {};

  this.dimensions = [0,0,0,0];
  this.size = 32;
  this.liveCellColor = 'grey';
  this.shouldAutoScale = true;
  this.shouldRememberHistory = false;
  this.diffHistory = [];
  this.reverseDiffHistory = [];
};

Life.prototype.rememberHistory = function(shouldRememberHistory) {
  this.shouldRememberHistory = shouldRememberHistory;
  return this;
};

Life.prototype.setScale = function(scale) {
  this.scale = scale;
  return this;
};

Life.prototype.autoScale = function(shouldAutoScale) {
  this.shouldAutoScale = shouldAutoScale;
  return this;
};

Life.prototype.setLiveCellColor = function(liveCellColor) {
  this.liveCellColor = liveCellColor;
  return this;
};

Life.prototype.setTemplate = function(template) {
  this.template = template;
  return this;
};

Life.prototype.addCoordinateToBoard = function(coord) {
  this.board[JSON.stringify(coord)] = true;
};

Life.prototype.render = function() {
  var canvas = $('#board').get(0);
  var ctx = canvas.getContext('2d');

  var changedScale = false;
  if (this.shouldAutoScale) {
    // First, determine the scale.
    for (var coord in this.board) {
      coord = JSON.parse(coord);
      this.dimensions[0] = Math.min(this.dimensions[0], coord[0]);
      this.dimensions[2] = Math.max(this.dimensions[2], coord[0]);
      this.dimensions[1] = Math.min(this.dimensions[1], coord[1]);
      this.dimensions[3] = Math.max(this.dimensions[3], coord[1]);
    }

    // Round dimensions to power of 2
    var xSize = this.dimensions[2] - this.dimensions[0];
    var ySize = this.dimensions[3] - this.dimensions[1];

    var minsize = Math.max(xSize, ySize);

    if (minsize > this.size) {
      while (this.size < minsize) {
        this.size *= 2;
      }
      ctx.clearRect(0,0,1024,1024);
      changedScale = true;
    }
    this.scale = 1024 / this.size;
  }

  if (!changedScale) {
    this.drawBoard(this.oldboard, this.scale, ctx, true);
  }
  this.drawBoard(this.board, this.scale, ctx, false);    
};

Life.prototype.drawBoard = function(board, scale, ctx, clear) {
  for (var coord in board) {
    var origcoord = coord;
    coord = JSON.parse(coord);
    coord[0] += this.size / 2;
    coord[1] += this.size / 2;
    var cellSize;
    if (scale > 8) {
      cellSize = scale - 4;
    } else {
      cellSize = scale;
    }
    if (clear) {
      ctx.clearRect(coord[0] * scale,
                    coord[1] * scale,
                    cellSize,
                    cellSize);
    } else {
      var color;
      if (this.template && this.template[origcoord]) {
        color = this.template[origcoord];
      } else {
        color = this.liveCellColor;
      }
      ctx.fillStyle = color;
      ctx.fillRect(coord[0] * scale,
                   coord[1] * scale,
                   cellSize,
                   cellSize);
    }
  }
}

Life.prototype.drawDiff = function() {
  var canvas = $('#board').get(0);
  var ctx = canvas.getContext('2d');

  for (var coord in this.diff) {
    var origcoord = coord;
    coord = JSON.parse(coord);
    coord[0] += this.size / 2;
    coord[1] += this.size / 2;
    var cellSize;
    if (this.scale > 8) {
      cellSize = this.scale - 4;
    } else {
      cellSize = this.scale;
    }
    if (this.diff[origcoord] == true) {
      var color;
      if (this.template && this.template[origcoord]) {
        debugger;
        color = this.template[origcoord];
      } else {
        color = this.liveCellColor;
      }
      ctx.fillStyle = color;
      ctx.fillRect(coord[0] * this.scale,
                   coord[1] * this.scale,
                   cellSize,
                   cellSize);
    } else {
      ctx.clearRect(coord[0] * this.scale,
                    coord[1] * this.scale,
                    cellSize,
                    cellSize);
    }
  }
}


Life.prototype.nextGeneration = function() {
  var cellsToEval = {};
  for (var coord in this.board) {
    coord = JSON.parse(coord);
    for (var i = -1; i <= 1; i++) {
      for (var j = -1; j <= 1; j++) {
        if (!(i == 0 && j == 0)) {
          var key = JSON.stringify([coord[0] + i, coord[1] + j]);
          if (key in cellsToEval) {
            cellsToEval[key] += 1;
          } else {
            cellsToEval[key] = 1;
          }
        }
      }
    }
  }

  var newboard = {};
  for (var coord in cellsToEval) {
    if (cellsToEval[coord] == 2) {
      if (coord in this.board) {
        newboard[coord] = true;
      }
    } else if (cellsToEval[coord] == 3) {
      newboard[coord] = true;
    }
  }

  this.diff = this.computeDiff(this.board, newboard);

  if (this.shouldRememberHistory) {
    this.diffHistory.push(this.diff);
    this.reverseDiffHistory.push(this.computeDiff(newboard, this.board));
  }

  this.oldboard = this.board;
  this.board = newboard;
}

Life.prototype.computeDiff = function(board1, board2) {
  var diff = {};
  for (var coord in board2) {
    if (board1[coord]) {
      diff[coord] = true;
    }
  }
  
  for (var coord in board1) {
    if (!board2[coord]) {
      diff[coord] = false;
    }
  }

  return diff;
};

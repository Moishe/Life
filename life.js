function startLife(board) {
    var life = new Life(board);
    life.render();

    setInterval(function() {
        life.nextGeneration();
        life.render();
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
};

Life.prototype.addCoordinateToBoard = function(coord) {
    this.board[JSON.stringify(coord)] = true;
};

Life.prototype.render = function() {
    var canvas = $('#board').get(0);
    var ctx = canvas.getContext('2d');

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
        console.log('Size: ' + this.size);
        ctx.clearRect(0,0,1024,1024);
    }

    var scale = 1024 / this.size;

    this.drawBoard(this.oldboard, scale, ctx, true);
    this.drawBoard(this.board, scale, ctx, false);
};

Life.prototype.drawBoard = function(board, scale, ctx, clear) {
    for (var coord in board) {
        coord = JSON.parse(coord);
        coord[0] += this.size / 2;
        coord[1] += this.size / 2;
        if (clear) {
            ctx.clearRect(coord[0] * scale,
                          coord[1] * scale,
                          scale - 4,
                          scale - 4);
        } else {
            ctx.fillStyle = 'grey';
            ctx.fillRect(coord[0] * scale,
                         coord[1] * scale,
                         scale - 4,
                         scale - 4);
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

    this.oldboard = this.board;
    this.board = newboard;
}

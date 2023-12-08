// Développé avec amour par Bugbusters 

// - Context de Canvas-
function setBodyBackground( Ligne ) {
    var body = document.body;
    LigneStr=Ligne.toString();
        str="url(images/"+LigneStr+".png)"
    // Arriere plan
    body.style.backgroundImage =str;
    body.style.backgroundSize = 'cover';
    body.style.backgroundRepeat = 'no-repeat';
}


var cnv = document.getElementById('cnv'),
    ctx = cnv.getContext('2d');
ctx.scale(20, 20);

// Palette des couleurs des blocs
var palettes = {
    standard: ['#ffeb3b','#9c27b0','#ff9800','#3f51b5','#03a9f4','#4caf50','#f44336'],
    experiment: ['#607d8b','#8bc34a','#009688','#e91e63','#ffc107','#00bcd4','#673ab7'],
}
var palette = palettes.standard;

// Information de jeu 
var level = 0;
var linesCleared = 0;
var paused = false;
var won = false;

var pieceArray = ['T','O','I','L','J','S','Z'];

// Arène
var arena = {
    // Props
    pos: {x: 10, y: 2},
    matrix: createMatrix(10,20),
    // Méthodes
    draw: function() {
        drawMatrix(this.matrix, this.pos);
        this.drawOutline();
    },
    drawOutline: function() {
        ctx.lineWidth = 0.1;
        ctx.strokeStyle="#FFF";
        ctx.strokeRect(this.pos.x,this.pos.y,this.matrix[0].length,this.matrix.length);
    },
};

// Joueur
var player = {
    // Props
    matrix: [],
    nextPiece: [],
    heldPiece: randomPiece(),
    pos: {x: 0, y: 0},
    score: 0,
    highscore: 0,
    // Méthodes
    collisionCheck: function(pos) {
        var m = this.matrix, o = pos||this.pos;
        for(var y = 0; y < m.length; ++y) {
            for(var x = 0; x < m[y].length; ++x) {
                if(m[y][x] !== 0 && (arena.matrix[y + o.y] && arena.matrix[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    },
    draw: function() {
        drawMatrix(this.matrix, {x: this.pos.x + arena.pos.x, y: this.pos.y + arena.pos.y});
        // Piéce invisible
        for(var y = 0; y < 20; y++) {
            if(this.collisionCheck({x:this.pos.x, y: y}) && y >= this.pos.y){
                drawMatrix(this.matrix, {x:this.pos.x + arena.pos.x, y: y + arena.pos.y - 1}, 'rgba(255,255,255,0.15)');
                return false;
            }
        }
    },
    drop: function() {
        this.pos.y++;
        if(this.collisionCheck()) {
            this.pos.y--;
            this.merge();
            lineCheck();
            this.reset();
        }
        dropCount = 0;
    },
    hardDrop: function() {
        var count = 0;
        while((!this.collisionCheck()) && count < 20) {
            this.pos.y++;
            count++;
        }
        this.pos.y--;
        this.score += Math.max(count-1,0) * 2;
        this.highscore = Math.max(this.highscore,this.score);
        this.drop();
    },
    merge: function() {
        this.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if(value !== 0) {
                    arena.matrix[y + this.pos.y][x + this.pos.x] = value;
                }
            });
        });
    },
    reset: function() {
        this.matrix = this.nextPiece;
        this.nextPiece = randomPiece();
        this.pos.y = 0;
        this.pos.x = Math.floor(arena.matrix[0].length/2) - Math.floor(this.matrix[0].length/2);

        // Vérification de jeu terminer
        if(this.collisionCheck()) {


            reset();


        }

    },
    rotate: function(dir) {
        for(var y = 0; y < this.matrix.length; ++y) {
            for(var x = 0; x < y; ++x) {
                [
                    this.matrix[x][y],
                    this.matrix[y][x],
                ] = [
                    this.matrix[y][x],
                    this.matrix[x][y],
                ];
            }
        }

        if(dir > 0) { this.matrix.forEach(row => row.reverse()); }
        else { matrix.reverse(); }

        // Contrôle de collision dans l'arène
        var pos = this.pos.x;
        var offset = 1;
        while(this.collisionCheck()) {
            this.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if(offset > this.matrix[0].length) {
                this.rotate(-dir);
                this.pos.x = pos;
                return;
            }
        }
    },
    shift: function(dir) {
        this.pos.x += dir;
        if(this.collisionCheck()) { this.pos.x -= dir; }
    },
    switchPiece: function() {
        [this.heldPiece, this.matrix] = [this.matrix, this.heldPiece];

        // Contrôle de collision dans l'arène
        var pos = this.pos.x;
        var offset = 1;
        while(this.collisionCheck()) {
            this.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if(offset > this.matrix[0].length) {
                player.switchPiece();
                this.pos.x = pos;
                return;
            }
        }
    },
};

// Minuterie de chute des pièces du joueur
var lastTime = 0;
var dropCount = 0;
var dropInterval = 1000;

// --- Gestion des entrées --------------------------------------
document.addEventListener('keydown', function(e){

    switch(e.keyCode) {
        case 80: paused = !paused; break; // P - Pause
        case 82: reset(); break;          // R - Reset
    }
    if( won) {
        e.preventDefault();
        switch(e.keyCode) {
            default: reset();
        }
    }

    if(!paused) {
        e.preventDefault();
        switch(e.keyCode) {
            case 37: player.shift(-1); break;     // Gauche
            case 38: player.rotate(1); break;     // Haut
            case 39: player.shift(1); break;      // Droit
            case 40: player.drop(); break;        // Bas
            case 32: player.hardDrop(); break;    // Espace
            case 16: player.switchPiece(); break; // Shift
            // default: console.log(e.keyCode);
        }
    }
});
// ---------------------------------------------------------

// --- Fonctions -------------------------------------------
function init() {
    reset();
    frameFunction();
}
function reset() {

    setBodyBackground(0);
    won = false;
    player.nextPiece = randomPiece();
    arena.matrix.forEach(row => row.fill(0));
    player.reset();
    player.score = 0;
    player.heldPiece = randomPiece();
    dropCount = 0;
    linesCleared = 0;
    level = 0;
}

function frameFunction(time = 0) {
    // Couvrir l'image précédente
    coverFrame();

    // Minuterie pour la chute des pièces du joueur et si vous êtes en pause ou si vous avez gagné, arrêtez le jeu
    if(!paused && !won) {
        if(player.score>=1000){
            won=true;

        }
        var deltaTime = time - lastTime;
        lastTime = time;
        dropCount += deltaTime;
        if(dropCount > Math.max((dropInterval - (level*60)),60)) { player.drop(); }
    }

    // Dessiner
    draw();

    // Frame suivante
    requestAnimationFrame(frameFunction);
}

function coverFrame() {
    ctx.fillStyle = 'rgba(0,10,30,0.3)';
    ctx.fillRect(0,0,cnv.width, cnv.height);
}

function createMatrix(w,h) {
    var matrix = [];
    while(h--) { matrix.push(new Array(w).fill(0)); }
    return matrix;
}

function createPiece(type) {
    switch(type) {
        case 'O':
            return [
                [1,1],
                [1,1],
            ]; break;
        case 'T':
            return [
                [0,0,0],
                [2,2,2],
                [0,2,0],
            ]; break;
        case 'L':
            return [
                [0,3,0],
                [0,3,0],
                [0,3,3],
            ]; break;
        case 'J':
            return [
                [0,4,0],
                [0,4,0],
                [4,4,0],
            ]; break;
        case 'I':
            return [
                [0,5,0,0],
                [0,5,0,0],
                [0,5,0,0],
                [0,5,0,0],
            ]; break;
        case 'S':
            return [
                [0,6,6],
                [6,6,0],
                [0,0,0],
            ]; break;
        case 'Z':
            return [
                [7,7,0],
                [0,7,7],
                [0,0,0],
            ]; break;
    }
}

//Si vous êtes en pause ou si vous avez gagné, l'arrière-plan change de couleur
function drawMatrix(matrix, offset, color) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value !== 0) {
                if(color) {
                    ctx.fillStyle = (paused || won)?'rgba(0,0,0,0)':color;
                } else {
                    ctx.fillStyle = (paused || won)?'rgba(255,255,255,0.2)':(palette[value - 1]||'white');
                };
                ctx.strokeStyle = 'rgba(0,10,30,1)';
                ctx.fillRect(x + offset.x,y + offset.y,1,1);
                ctx.strokeRect(x + offset.x,y + offset.y,1,1);
            }
        });
    });
}

function draw() {
    player.draw();
    arena.draw();
    drawUI();
}

function drawUI() {
    ctx.fillStyle = '#FFF';
    ctx.font = '1px monospace';
    ctx.textAlign = 'left';
    // Titre ou quelque chose comme ça
    ctx.fillText('Tetris',3,3);
    ctx.fillText('Score a atteindre ',0.5,6);
    ctx.fillText('    "1000" ',1,7);

    // Instructions
    ctx.fillText('← / → = se déplacer horizontalement',6,25);
    ctx.fillText('↑ = Tourner    // SHIFT = Changer',6,26);
    ctx.fillText('↓ = Bas // SPACE = Shute de bloc',6,27);
    ctx.fillText('P = Pause     // R = réinitialiser',6,28);
    // Score élevé
    ctx.fillText('Meilleur score',21,3);
    ctx.fillText(player.highscore,21,4);
    // Score de joueur
    ctx.fillText('Votre Score',21,6);
    ctx.fillText(player.score,21,7);
    // Niveau
    ctx.fillText('Niveau',21,9);
    ctx.fillText(level,21,10);
    // Lignes
    ctx.fillText('Lignes Vidées',21,12);
    ctx.fillText(linesCleared,21,13);
    // Pièce tenue
    ctx.fillText('Pièce à ',3,14);
    ctx.fillText('Remplacer',3,15);
    ctx.lineWidth = 0.1;
    ctx.strokeStyle="#FFF";
    ctx.strokeRect(3,16,6,6);
    drawMatrix(player.heldPiece,{x:4,y:17})
    // Pièce suivante
    ctx.fillStyle = '#FFF';
    ctx.fillText('Pièce suivante',21,15);
    ctx.lineWidth = 0.1;
    ctx.strokeStyle="#FFF";
    ctx.strokeRect(21,16,6,6);
    drawMatrix(player.nextPiece,{x:22,y:17})
    // Suspendre le texte
    if(paused) {
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center';
        ctx.fillText('Jeu en Pause',5 + arena.pos.x,8 + arena.pos.y);
    }
    //Tu gagnes le jeu
    if(won){

        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText('Vous aver Gagner!',5 + arena.pos.x,8 + arena.pos.y);
        ctx.fillText('Appuyez sur une touche pour réinitialiser',5 + arena.pos.x,12 + arena.pos.y);


    }
}

function lineCheck() {
    var rowMultiplier = 1;
    for(var y = arena.matrix.length - 1; y > 0; y--) {
        if(arena.matrix[y].every(function(x) {return x > 0;})) {
            linesCleared++;
            setBodyBackground(linesCleared);
            //Son de ligne effacé
            var clear = new Audio("sons/clear.mp3");
            clear.play();

            var row = arena.matrix.splice(y,1)[0];
            arena.matrix.unshift(row.fill(0));
            player.score += rowMultiplier*50;
            player.highscore = Math.max(player.highscore,player.score);
            rowMultiplier *= 2;
            y++; // En raison du décalage d'épissage
            // Niveau
            level = Math.floor(linesCleared/10);
        }
    }
}

function randomPiece() {
    return (createPiece( pieceArray[Math.floor(Math.random() * pieceArray.length)] ));
}
// ---------------------------------------------------------

init();
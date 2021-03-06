/**
 * The guid function is used to assign a client a unique 
 * string identifier
 */
var guid = (function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  };
})();

// heros collection
var heros = {};

// Canvas configuration
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.getElementById("game").appendChild(canvas);

ctx.font="14px Georgia";
ctx.fillStyle = "white";

// Background image
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function () {
    bgReady = true;
};
bgImage.src = "images/background.png";

var spritePaths = {
    hero: 'images/hero.png',
    monster: 'images/monster.png',
    jazzie: 'http://static-resource.np.community.playstation.net/avatar/3RD/UP01021103020_39FEB53B64B4BCA51971_L.png',
    alucard: 'http://i305.photobucket.com/albums/nn214/jhoke13/Avatars/Alucard_avatar.png',
    richter: 'http://i305.photobucket.com/albums/nn214/jhoke13/Avatars/Richter_avatar.png',
    unicorn: 'images/unicorn.png'
}

var sprite = function(name, path) {
    var that = this;
    this._name = name;
    this._path = path;
    this._image = new Image();
    this._ready = false;
    this._image.onload = function(img) {
        that._ready = true;
    }
    this._image.src = path;
}
sprite.prototype = {
    width: function() {
        return this._image.width;
    },
    height: function() {
        return this._image.height;
    },
    image: function() {
        return this._image;
    },
    ready: function() {
        return this._ready;
    }
}

var spriteCollection = {};
for(var i in spritePaths) {
    var oSprite = new sprite(i, spritePaths[i]);
    spriteCollection[i] = oSprite;
}

var hero = function(heroType) {
    this._type = heroType || "hero";
    this.heroId ;
    this._ready = false;
    this._x = this._y = 0;
    this._speed = 256 //in pixels per second
    this._msg = '';
    this._timer = false;
};

hero.prototype = {
    id: function() {
        return this.heroId;
    },
    setId: function(id) {
        this.heroId = id;
    },
    type: function() {
        return this._type;
    },
    setType: function(heroType) {
        if(spriteCollection[heroType] !== undefined) {
            this._type = heroType;
        }
    },
    y: function() {
        return this._y;
    },
    x: function() {
        return this._x;
    },
    centerX: function() {
                var sprite = this.sprite();
        return this._x + (sprite.width()/2);
    },
    centerY: function() {
                var sprite = this.sprite();
        return this._y + (sprite.width()/2);
    },  
    speed: function() {
        return this._speed;
    },
    sprite: function() {
        return spriteCollection[this._type];
    },
    ready: function() {
        return this.sprite().ready();
    },
    reset: function(width, height) {
        var sprite = this.sprite()
        // Throw the monster somewhere on the screen randomly
        this._x = sprite.width() + (Math.random() * (width - (sprite.width()*2)));
        this._y = sprite.height() + (Math.random() * (height - (sprite.height()*2)));
    },
    move: function(x, y) {
        this._x = x;
        this._y = y;
    },
    moveX: function(x) {
        this._x = x;
    },
    moveY: function(y) {
        this._y = y;
    },
    say: function(msg) {
        var that = this;
        if(this._timer !== false) {
            clearTimeout(this._timer);
        }

        setTimeout(function() {
            that._msg = '';
        }, 10 * 1000);
        this._msg = msg;
    },
    said: function() {
        return this._msg;
    },
    serialize: function() {
        return { id: this.heroId, y: this._y, x: this._x, heroType: this._type };
    }
};

var myHero = new hero();

// Handle keyboard controls
var keysDown = {};
var moveToPoint = null;

addEventListener("keydown", function (e) {
    keysDown[e.keyCode] = true;
    if(e.keyCode == 13) {
        sendMessage();
    }
}, false);

addEventListener("keyup", function (e) {
    delete keysDown[e.keyCode];
}, false);

var ua = navigator.userAgent,
event = (ua.match(/iPad/i)) ? "touchstart" : "click";

canvas.addEventListener(event, function(e){
    var x = 0, y = 0;
    if(event == "touchstart") {
        x = e.pageX - canvas.offsetLeft;
        y = e.pageY - canvas.offsetTop;
    } else {
         var rect = canvas.getBoundingClientRect();
               
         x = e.clientX - rect.left,
         y = e.clientY - rect.top
    }


    moveToPoint = {
        x: x, 
        y: y
    };    
});

// Update game objects
var update = function (modifier) {
    var x, y = 0;
    var domove = false;
    if (38 in keysDown) { // Player holding up      
        y = myHero.y() - myHero.speed() * modifier;
        if(y <= 0) {
            return;
        }

        myHero.moveY(y)
        domove = true;
    }
    if (40 in keysDown) { // Player holding down
        y = myHero.y() + myHero.speed() * modifier;
        if(y+myHero.sprite().height() >= canvas.height) {
            return;
        }       
        myHero.moveY(y)
        domove = true;
    }
    if (37 in keysDown) { // Player holding left
        x = myHero.x() - myHero.speed() * modifier;
        if(x <= 0) {
            return;
        }       
        myHero.moveX(x)
        domove = true;
    }
    if (39 in keysDown) { // Player holding right
        x = myHero.x() + myHero.speed() * modifier;
        if(x+myHero.sprite().width() >= canvas.width ) {
            return;
        }       

        myHero.moveX(x)
        domove = true;
    }

    if(moveToPoint !== null) {
        var dx = moveToPoint.x - myHero.centerX();
        var dy = moveToPoint.y - myHero.centerY();
        var distance = Math.sqrt(dx*dx + dy*dy);    
        var moves = distance / (myHero.speed() * modifier);
        if(Math.floor(moves) > 0) {
            console.log(moves);
            var tmpX = myHero.x() + dx/moves;
            if(tmpX <= 0 || tmpX + myHero.sprite().width() >= canvas.width) {
                return;
            }
            myHero.moveX(tmpX)
            
            var tmpY = myHero.y() + dy/moves;
            if(tmpY <= 0 || tmpY + myHero.sprite().height() >= canvas.height) {
                return;
            }            
            myHero.moveY(tmpY)
            domove = true;
        } else {
            moveToPoint = null;
        }
    }

    if(domove) {
        conn.publish('char_move', myHero.serialize(), true);
    }
};

// Draw everything
var render = function () {
    if (bgReady) {
        ctx.drawImage(bgImage, 0, 0);
    }

    for(var i in heros) {
        if (heros[i].ready()) {
            if(heros[i] === myHero) {
                continue;
            }
            ctx.drawImage(heros[i].sprite().image(), heros[i].x(), heros[i].y(), heros[i].sprite().width(), heros[i].sprite().height());
            if(heros[i].said() != '') {
                ctx.fillText(heros[i].said(), heros[i].x() + (heros[i].sprite().width() / 2), heros[i].y() - 10);
            }
        }       
    }
    // little hack to make sure we stay on top of everyone else

    ctx.drawImage(myHero.sprite().image(), myHero.x(), myHero.y(), myHero.sprite().width(), myHero.sprite().height());
    if(myHero.said() != '') {
        ctx.fillText(myHero.said(), myHero.x() + (myHero.sprite().width() / 2), myHero.y() - 10);
    }
};

// The main game loop
var main = function () {
    var now = Date.now();
    var delta = now - then;

    update(delta / 1000);
    render();

    then = now;

    // Request to do this again ASAP
    requestAnimationFrame(main);
};

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// Let's play this game!
var then = Date.now();

var connected = false;
var conn = null;
var connectToServer = function() {
    conn = new ab.Session('ws://devfun.sedonami.com',
    function() {
        connected = true;
        conn.subscribe('char_move', function(topic, data){
            if(heros[data.id] !== undefined) {
                heros[data.id].moveX(parseFloat(data.x));
                heros[data.id].moveY(parseFloat(data.y));
            }
        });

        conn.subscribe('char_msg', function(topic, data){
            if(heros[data.id] !== undefined) {              
                heros[data.id].say(data.msg);
                if(data['heroType'] !== undefined) {
                    heros[data.id].setType(data['heroType']);
                }
            }
        });

        conn.subscribe('char_add', function(topic, data){

            var newHero = new hero();
            newHero.moveX(parseFloat(data.x));
            newHero.moveY(parseFloat(data.y));
            newHero.setId(data.id);
            heros[data.id] = newHero;
        });

        conn.subscribe('char_remove', function(topic, data){
            if(heros[data.id] !== undefined) {
                delete heros[data.id];
            }
        });

        myHero.reset(canvas.width, canvas.height);
        myHero.setId(guid());
        heros[myHero.id()] = myHero;

        main();
        
        conn.publish('char_add', myHero.serialize(), true);
        conn.call('synchronize').then(function(data) {
            for(var i in data) {
                if(data[i].id === myHero.id()) {
                    continue;
                }

                var newHero = new hero();
                newHero.moveX(parseFloat(data[i].x));
                newHero.moveY(parseFloat(data[i].y));
                newHero.setId(data[i].id);
                newHero.setType(data[i].heroType);
                heros[data[i].id] = newHero;
            }
        });
    },
    function() {
        connected = false;
        console.warn('WebSocket connection closed');
    },
    {'skipSubprotocolCheck': true}
);
};
window.onbeforeunload = function(){
    conn.publish('char_remove', myHero.serialize(), true);
};

function sendMessage() {
    var message = document.getElementById("message").value;
    if(conn && message) {

        conn.publish('char_msg', { id: myHero.id(), msg: message });
        
        myHero.setType(message.substring(1));
        if(message[0] != "/") {
            myHero.say(message);
        }
        document.getElementById("message").value = '';
    }
}

window.addEventListener('pagehide', function() {
        conn.publish('char_remove', myHero.serialize(), true);
});

window.addEventListener('pageshow', function() {
    if(connected) {
        conn.publish('char_add', myHero.serialize(), true);
    } else {
        connectToServer();
    }
});

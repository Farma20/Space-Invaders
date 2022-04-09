// основная функция с игрой
;(function(){

    //создаем объект Game
    var Game = function(canvasID){

        // создаем конвас и сединяем его с html (document)
        var canvas = document.getElementById(canvasID);
        
        // настраиваем экран на 2d составляющие конваса
        var screen = canvas.getContext("2d");

        //переменная хранящая размер конваса(экрана игры)
        var gameSize = {
            x: canvas.width,
            y: canvas.height 
        };


        //создаем массив всех объектов игры (объединяем массив с врагами и массив объектов)
        this.bodies = createInvaders(this).concat([new Player(this, gameSize)])

        // создаем переменную, хранящую ссылку на объект Game (this), чтобы можно было обращаться к его функциям
        var self = this;

        loadSound('msc/shoot.wav', function(shootSound){

            self.shootSound = shootSound;

            // основной цикл
            var tick = function(){
                self.update(gameSize);
                self.draw(screen, gameSize);

                // рекурсивный вызов функции tick c определенной частотой кадров
                requestAnimationFrame(tick);
            }
            tick();
        });

    }

    //создаем прототип игры
    Game.prototype = {
        
        // функция обновления контента
        update: function(gameSize){


            var bodies = this.bodies;

            if(this.bodies.length == 1){
                console.log("you win");
            }

            var j = 0;
            for(var i = 0; i < this.bodies.length; i++){
                if(this.bodies instanceof Player){
                    j = 1;
                }
            }

            if(j == 0){
                console.log("you lox");
            }
            
            

            //функция, проверяющая столкновение объектов
            //filter - фильтр элементов в массиве и возвращает нужные элементы
            var notCollidingWithAnything = function(b1) {
                return bodies.filter(function(b2) {
                    return colliding(b1, b2);
                } ).length == 0;
            }

            //с помощью filter берем 2 элемента из массива объектов и сравниваем их на коллизию
            this.bodies = this.bodies.filter(notCollidingWithAnything);

            //создадим цикл, проходящий по всему массиву объектов игры и удаляет элементы
            for(var i = 0; i < this.bodies.length; i++) {
                if(this.bodies[i].position.y < 0 || this.bodies[i].position.y > 720)
                    this.bodies.splice(i, 1);
            }

            //создадим цикл, проходящий по всему массиву объектов игры
            for(var i = 0; i < this.bodies.length; i++) {
                this.bodies[i].update();
            }
        },

        // функция отрисовки контента
        draw: function (screen, gameSize){

            //отчищаем канвас
            clearCanvas(screen, gameSize);

            //создадим цикл, проходящий по всему массиву объектов игры
            for(var i = 0; i < this.bodies.length; i++) {

                //вызываем функцию отрисовки для каждого объекта
                drawRect(screen, this.bodies[i]);
            }
        },

        //добавляем объекты в игру
        addBody: function(body){
            this.bodies.push(body);
        },

        //Функция, проверяющая, может ли враг стрелять (нужна для того, чтобы враги не убивали своих)
        invadersBelow: function(invader){
            return this.bodies.filter(function(b) {
                //instanceof - принадлежность к классу (отслеживаем, чтобы отфильтрованный элемент b не был игроком)
                return b instanceof Invader && 
                b.position.y > invader.position.y &&
                b.position.x - invader.position.x < invader.size.width;
            }).length > 0;
        } 
    }


    // создаем врагов
    var Invader = function(game, position){
        this.game = game;
        this.size = {width: 16, height: 16};
        this.position = position;
        
        //границa перемещения
        this.patrolX = 0;
        this.speedX = 2;
    }

    Invader.prototype = {
        update: function(){
            //меняем направление движения при касании границ
            if(this.patrolX < 0 || this.patrolX > 800){
                this.speedX = -this.speedX;
                this.position.y += 20;
            }

            this.position.x += this.speedX;
            this.patrolX += this.speedX;

            //стрельба врагов
            if(Math.random() < 0.01 && !this.game.invadersBelow(this)){
                var bullet = new Bullet({x: this.position.x + this.size.width/2 - 3/2, y: this.position.y + this.size.height/2 + 20},
                    {x: Math.random() - 0.5 , y: 2});
                    this.game.addBody(bullet);
                }
        }
    }

    //Создаем класс Player
    let Player = function(game, gameSize){
        this.game = game;

        //кол-во пуль на сцене
        this.bullets = 0;

        this.timer = 0;

        this.size = {width: 16, height: 16};

        this.position = {
            x: gameSize.x/2 - this.size.width/2,
            y: gameSize.y/2 - this.size.height/2
        };

        //задаем управление
        this.keyboarder = new Keyboarder();
    }

    Player.prototype = {
        update: function(){

            //отслеживаем нажатие клавиш, если нажата определенная клавшиша, то выполняем действие
            if(this.keyboarder.isDown(this.keyboarder.KEYS.LEFT)) {
                this.position.x -= 4;
            }

            if(this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT)) {
                this.position.x += 4;
            }

            if(this.keyboarder.isDown(this.keyboarder.KEYS.SPACE)) {
               if(this.bullets < 1){
                    var bullet = new Bullet({x: this.position.x + this.size.width/2 - 3/2, y: this.position.y - 4},
                    {x: 0, y: -10});
                    this.game.addBody(bullet);
                    this.bullets++;

                    //проигрывание звука
                    // this.game.shootSound.load();
                    // this.game.shootSound.paly();
                }
            }

            if(this.keyboarder.isDown(this.keyboarder.KEYS.UP)) {
                this.position.y -= 2;
            }

            if(this.keyboarder.isDown(this.keyboarder.KEYS.DOWN)) {
                this.position.y += 2;
            }

            //при заполнении таймера, кол-во пуль обнуляется
            this.timer++;
            if(this.timer % 60 == 0){
                this.bullets = 0;
            }
        }
    }

    //Создаем класс Bullet
    var Bullet = function(position, velocity){
        this.size = {width: 3, height: 3};

        this.position = position;

        this.velocity = velocity;
    }

    Bullet.prototype = {
        update: function(){

            //Меняем расположение пули, прибавляя к текущему положению скорость
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
        }
    }

    //Управление игроком
    var Keyboarder = function(){

        //состояние клавиши
        var KeyState = {};

        //отслеживание нажатия на клавишу
        window.onkeydown = function(e) {

            //меняем состояние KeyState на true
            KeyState[e.keyCode] = true;
        }

        // отслеживаем отжатие кнопки
        window.onkeyup = function(e){

            //меняем состояние KeyState на false
            KeyState[e.keyCode] = false;
        }

        // если клавиша нажата, то вернет true иначе false
        this.isDown = function(keyCode){
            return KeyState[keyCode] === true;
        }

        //словарь с кодами клавиш
        this.KEYS = {LEFT: 37, RIGHT: 39, SPACE: 32, UP: 38, DOWN: 40};
    }

    //функция для создания противников
    var createInvaders = function(game){
        //массив врагов
        var invaders = [];

        //добавление врагов в массив с заданными координатами
        for(var i = 0; i < 48; i++){
            var x = 30 + (i%16) * 30; // (i%8) кол-во врагов в строке, 30+ отступ от границы, *30 расстояние между врагами
            var y = 30 + (i%3) * 30; // (i%3) кол-во строк
            invaders.push(new Invader(game, {x:x, y:y}));
        }
        return invaders;
    }

    //функция обрабатывающая столкновения
    var colliding = function(b1, b2){
        return !(b1 == b2 ||
            b1.position.x + b1.size.width/2 < b2.position.x - b2.size.width/2 ||
            b1.position.y + b1.size.height/2 < b2.position.y - b2.size.height/2 ||
            b1.position.x - b1.size.width/2 > b2.position.x + b2.size.width/2 ||
            b1.position.y - b1.size.height/2 > b2.position.y + b2.size.height/2);
    }


    //Добавляем звуки игре
    var loadSound = function(url, callback){
        var loaded = function(){
            callback(sound);
            sound.removeEventListener("canplaythrough", loaded);
        }
        var sound = new Audio(url);
        sound.addEventListener("canplaythrough", loaded);
        sound.load();
    }

    //создаем функцию для отрисовки объектов
    var drawRect = function(screen, body){
        //создаем примитив на экране
        screen.fillStyle = 'red';
        screen.fillRect(body.position.x, body.position.y, body.size.width, body.size.height);
    }

    //функция для отчистки экрана
    var clearCanvas = function(screen, gameSize){
        screen.clearRect(0, 0, gameSize.x, gameSize.y);
    }


    // функция, запускающаяся при старте страницы
    window.onload = function(){
        //создаем новый объект game и передаем в него id convas
        new Game("screen")
    }

})(); //вызываем эту функцию
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var math;
(function (math) {
    var RNG = (function () {
        function RNG(seed) {
            if (seed === void 0) { seed = 123456789; }
            this.m_w = 123456789;
            this.m_z = 987654321;
            this.mask = 0xffffffff;
            this.m_w = seed;
        }
        RNG.prototype.random = function () {
            this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & this.mask;
            this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & this.mask;
            var result = ((this.m_z << 16) + this.m_w) & this.mask;
            result /= 4294967296;
            return result + 0.5;
        };
        return RNG;
    })();
    math.RNG = RNG;
    var Point2D = (function () {
        function Point2D(x, y) {
            this.x = x;
            this.y = y;
        }
        Point2D.prototype.add = function (other) {
            return new Point2D(this.x + other.x, this.y + other.y);
        };
        Point2D.prototype.min = function (other) {
            return new Point2D(this.x - other.x, this.y - other.y);
        };
        Point2D.prototype.rotate = function (angle, origin) {
            if (origin === void 0) { origin = null; }
            var b = origin == null ? this : this.min(origin), s = Math.sin(angle), c = Math.cos(angle), p = new Point2D(b.x * c - b.y * s, b.x * s + b.y * c);
            return origin == null ? p : origin.add(p);
        };
        Point2D.prototype.size = function () {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        };
        Point2D.prototype.times = function (mult) {
            return new Point2D(this.x * mult, this.y * mult);
        };
        Point2D.prototype.toString = function () {
            return "(" + this.x + "," + this.y + ")";
        };
        Point2D.prototype.map = function (fx, fy) {
            return new Point2D(fx(this.x), fy(this.y));
        };
        Point2D.prototype.equals = function (other) {
            return this.x === other.x && this.y === other.y;
        };
        return Point2D;
    })();
    math.Point2D = Point2D;
    var Line2D = (function () {
        function Line2D(_0, _1) {
            this._0 = _0;
            this._1 = _1;
            this.a = 0;
            this.b = 0;
            this.a = (_1.y - _0.y) / (_1.x - _0.x);
            this.b = _0.y - (this.a * _0.x);
        }
        Line2D.prototype.intersects = function (other) {
            if (this.a === other.a) {
                return [];
            }
            else if (!isFinite(this.a) || !isFinite(other.a)) {
                var inf = [[this, other], [other, this]].filter(function (ls) { return !isFinite(ls[0].a); }).reduce(function (thruth, ls) {
                    var oy = ls[1].a * ls[0]._0.x + ls[1].b;
                    return thruth.length && thruth || Line2D.surround(ls[0]._0.x, ls[1]._0.x, ls[1]._1.x) && Line2D.surround(oy, ls[0]._0.y, ls[0]._1.y) && [new Point2D(ls[0]._0.x, oy)];
                }, []);
                return inf;
            }
            else {
                var x = (this.b - other.b) / (other.a - this.a);
                var i = Line2D.getLineIntersection(this._0.x, this._0.y, this._1.x, this._1.y, other._0.x, other._0.y, other._1.x, other._1.y);
                return i && [new Point2D(x, x * this.a + this.b)] || [];
            }
        };
        Line2D.surround = function (val, a, b) {
            return val < Math.max(a, b) && val > Math.min(a, b);
        };
        Line2D.prototype.draw = function (ctx, debug) {
            if (debug === void 0) { debug = false; }
            ctx.beginPath();
            ctx.moveTo(this._0.x, ctx.canvas.height - this._0.y);
            ctx.lineTo(this._1.x, ctx.canvas.height - this._1.y);
            ctx.stroke();
        };
        Line2D.prototype.extended = function (x1, x2) {
            return new Line2D(new Point2D(x1, this.a * x1 + this.b), new Point2D(x2, this.a * x2 + this.b));
        };
        Line2D.getLineIntersection = function (p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y) {
            var s1_x, s1_y, s2_x, s2_y;
            s1_x = p1_x - p0_x;
            s1_y = p1_y - p0_y;
            s2_x = p3_x - p2_x;
            s2_y = p3_y - p2_y;
            var s, t;
            s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
            t = (s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);
            if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
                var intX = p0_x + (t * s1_x);
                var intY = p0_y + (t * s1_y);
                return [intX, intY];
            }
            return null;
        };
        Line2D.prototype.size = function () {
            return Math.sqrt(Math.pow(this._1.x - this._0.x, 2) + Math.pow(this._1.y - this._0.y, 2));
        };
        return Line2D;
    })();
    math.Line2D = Line2D;
    var Form = (function () {
        function Form(centre, points) {
            this.centre = centre;
            this.points = points;
        }
        Form.prototype.rotate = function (angle) {
            var _this = this;
            return new Form(this.centre, this.points.map(function (p) { return p.rotate(angle, _this.centre); }));
        };
        Form.prototype.move = function (dist) {
            return new Form(this.centre.add(dist), this.points.map(function (p) { return p.add(dist); }));
        };
        return Form;
    })();
    var Box = (function (_super) {
        __extends(Box, _super);
        function Box(centre, width, height, points) {
            if (points === void 0) { points = []; }
            _super.call(this, centre, points);
            this.centre = centre;
            this.width = width;
            this.height = height;
            this.points = points;
            this.rotation = 0;
            this.points = points.length && points || [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]].map(function (c) { return centre.add(new Point2D(c[0] * width, c[1] * height)); });
        }
        Box.prototype.move = function (dist) {
            return new Box(this.centre.add(dist), this.width, this.height, this.points.map(function (p) { return p.add(dist); }));
        };
        Box.prototype.rotate = function (angle) {
            var b = new Box(this.centre, this.width, this.height);
            b.rotation = this.rotation + angle;
            b.points = _super.prototype.rotate.call(this, angle).points;
            return b;
        };
        Box.prototype.draw = function (ctx, debug, flip) {
            if (debug === void 0) { debug = false; }
            if (flip === void 0) { flip = true; }
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, flip ? ctx.canvas.height - this.points[0].y : this.points[0].y);
            for (var i = 1; i < this.points.length; i++) {
                ctx.lineTo(this.points[i].x, flip ? ctx.canvas.height - this.points[i].y : this.points[i].y);
            }
            ctx.closePath();
            ctx.fill();
            if (debug) {
                var c = ctx.strokeStyle;
                ctx.strokeStyle = "red";
                this.lines().forEach(function (l) { return l.draw(ctx); });
                ctx.strokeStyle = c;
            }
        };
        Box.prototype.map = function (fx, fy) {
            var b = new Box(this.centre.map(fx, fy), 0, 0);
            b.points = this.points.map(function (p) { return p.map(fx, fy); });
            return b;
        };
        Box.prototype.clearRadius = function () {
            return Math.max(this.width, this.height);
        };
        Box.prototype.lines = function () {
            var _this = this;
            return this.points.map(function (p, i) { return new Line2D(p, _this.points[(i + 1) % _this.points.length]); });
        };
        Box.prototype.intersects = function (other) {
            return this.centre.min(other.centre).size() < Math.min(this.clearRadius(), other.clearRadius());
        };
        return Box;
    })(Form);
    math.Box = Box;
})(math || (math = {}));
function revealEvent(name) {
    return Rx.Observable.fromEventPattern(function (h) { return Reveal.addEventListener(name, h); }, function (h) { return Reveal.removeEventListener(name, h); });
}
Reveal.onSlideChanged = revealEvent("slidechanged");
Reveal.onReady = revealEvent("ready");
Reveal.forSlide = function (selector, generator) {
    return Rx.Observable.merge(Reveal.onReady, Reveal.onSlideChanged).distinctUntilChanged(function (e) { return selector(e); }).filter(selector).flatMap(function (e) { return generator(e).takeUntil(Reveal.onSlideChanged.filter(function (e2) { return !selector(e2); })); });
};
Reveal.addEventListener('ready', function (event) {
});
Rx.Observable['prototype']['flatScan'] = function (iterator, produce) {
    var source = this;
    return Rx.Observable.create(function (observer) {
        var ret = new Rx.CompositeDisposable();
        function compl(d) {
            ret.remove(d);
            if (ret.length == 0)
                observer.onCompleted();
        }
        function ssub(o, n) {
            var disp = new Rx.SingleAssignmentDisposable();
            ret.add(disp);
            disp.current = o.subscribe(n, observer.onError, function () { return compl(disp); });
        }
        function rsub(o, n) {
            var disp = new Rx.SingleAssignmentDisposable();
            ret.add(disp);
            disp.current = o.subscribe(n, observer.onError, function () { return compl(disp); });
        }
        function recurse(s) {
            ssub(iterator(s), function (r) {
                observer.onNext(r);
                rsub(produce(r), recurse);
            });
        }
        ssub(source, recurse);
        return ret;
    });
};
var Rx;
(function (Rx) {
    var Observable = Rx.Observable, observerCreate = Rx.Observer.create, disposableCreate = Rx.Disposable.create, CompositeDisposable = Rx.CompositeDisposable, SingleAssignmentDisposable = Rx.SingleAssignmentDisposable, AsyncSubject = Rx.AsyncSubject, Subject = Rx.Subject, Scheduler = Rx.Scheduler, defaultNow = (function () {
        return !!Date.now ? Date.now : function () {
            return +new Date;
        };
    }());
    (function (root) {
        var requestAnimFrame, cancelAnimFrame;
        if (root.requestAnimationFrame) {
            requestAnimFrame = root.requestAnimationFrame;
            cancelAnimFrame = root.cancelAnimationFrame;
        }
        else if (root.mozRequestAnimationFrame) {
            requestAnimFrame = root.mozRequestAnimationFrame;
            cancelAnimFrame = root.mozCancelAnimationFrame;
        }
        else if (root.webkitRequestAnimationFrame) {
            requestAnimFrame = root.webkitRequestAnimationFrame;
            cancelAnimFrame = root.webkitCancelAnimationFrame;
        }
        else if (root.msRequestAnimationFrame) {
            requestAnimFrame = root.msRequestAnimationFrame;
            cancelAnimFrame = root.msCancelAnimationFrame;
        }
        else if (root.oRequestAnimationFrame) {
            requestAnimFrame = root.oRequestAnimationFrame;
            cancelAnimFrame = root.oCancelAnimationFrame;
        }
        else {
            requestAnimFrame = function (cb) {
                root.setTimeout(cb, 1000 / 60);
            };
            cancelAnimFrame = root.clearTimeout;
        }
        Rx.Scheduler.requestAnimationFrame = (function () {
            function scheduleNow(state, action) {
                var scheduler = this, disposable = new Rx.SingleAssignmentDisposable();
                var id = requestAnimFrame(function () {
                    !disposable.isDisposed && (disposable.setDisposable(action(scheduler, state)));
                });
                return new CompositeDisposable(disposable, disposableCreate(function () {
                    cancelAnimFrame(id);
                }));
            }
            function scheduleRelative(state, dueTime, action) {
                var scheduler = this, dt = Scheduler.normalize(dueTime);
                if (dt === 0) {
                    return scheduler.scheduleWithState(state, action);
                }
                var disposable = new SingleAssignmentDisposable(), id;
                var scheduleFunc = function () {
                    if (id) {
                        cancelAnimFrame(id);
                    }
                    if (dt - scheduler.now() <= 0) {
                        !disposable.isDisposed && (disposable.setDisposable(action(scheduler, state)));
                    }
                    else {
                        id = requestAnimFrame(scheduleFunc);
                    }
                };
                id = requestAnimFrame(scheduleFunc);
                return new CompositeDisposable(disposable, disposableCreate(function () {
                    cancelAnimFrame(id);
                }));
            }
            function scheduleAbsolute(state, dueTime, action) {
                return this.scheduleWithRelativeAndState(state, dueTime - this.now(), action);
            }
            return new Scheduler(defaultNow, scheduleNow, scheduleRelative, scheduleAbsolute);
        }());
    })(window);
})(Rx || (Rx = {}));
function toArray() {
    return Array.prototype.slice.call(arguments[0]);
}
Function.prototype['curry'] = function () {
    if (arguments.length < 1) {
        return this;
    }
    var __method = this;
    var args = toArray.call(this, arguments);
    return function () {
        return __method.apply(this, args.concat(toArray.call(this, arguments)));
    };
};
var AnonymousObservable = Rx['AnonymousObservable'];
Rx.Observable['prototype']['sliding'] = function (size, skip) {
    var source = this;
    return new AnonymousObservable(function (observer) {
        var window = [];
        return source.subscribe(function (value) {
            window.push(value);
            if (window.length == size) {
                observer.onNext(window);
                window = window.slice(skip);
            }
        }, function (e) { return observer.onError(e); }, function () { return observer.onCompleted(); });
    });
};
Rx.Observable['prototype']['tupled'] = Rx['Observable']['prototype']['sliding']['curry'](2, 1);
var levels = [
    [new math.Box(new math.Point2D(300, 15), 30, 30)],
    [new math.Box(new math.Point2D(170, 15), 30, 30), new math.Box(new math.Point2D(340, 15), 30, 30), new math.Box(new math.Point2D(510, 15), 30, 30)],
    [
        new math.Box(new math.Point2D(100, 15), 30, 30),
        new math.Box(new math.Point2D(220, 35), 30, 30),
        new math.Box(new math.Point2D(340, 15), 30, 30),
        new math.Box(new math.Point2D(460, 35), 30, 30),
        new math.Box(new math.Point2D(580, 15), 30, 30),
        new math.Box(new math.Point2D(700, 35), 30, 30)
    ],
];
var BoxJump;
(function (BoxJump) {
    var Game = (function () {
        function Game(ctx) {
            this.ctx = ctx;
            this.level = 0;
            this.spaces = $(window).onAsObservable("keydown keyup").filter(function (e) { return e['keyCode'] === 32; }).map(function (e) { return e.type === 'keydown'; });
            this.singlespace = this.spaces.take(1);
        }
        Game.prototype.run = function () {
            var _this = this;
            this.level = 0;
            var l = Rx.Observable.interval(1000 / 30, Rx.Scheduler.requestAnimationFrame).startWith(0).map(function (_) { return new Date().getTime(); }).tupled().map(function (p) { return p[1] - p[0]; }).withLatestFrom(this.spaces.startWith(false), function (t, s) {
                return { time: t, space: s };
            }).scan(new BoxJump.Player(new math.Box(new math.Point2D(0, 0), 20, 20), null), function (s, t) { return s.update(t.time, t.space); }).takeWhile(function (p) { return p.box.centre.x < _this.ctx.canvas.width; }).doWhile(function () { return ++_this.level < levels.length; }).takeWhile(function (_) { return _this.level >= 0; }).tap(function (p) {
                try {
                    _this.ctx.clearRect(0, 0, _this.ctx.canvas.width, _this.ctx.canvas.height);
                    _this.ctx.fillStyle = "rgba(255,0,0,1)";
                    p.box.draw(_this.ctx);
                    var dead = false;
                    if (levels[_this.level])
                        for (var bi in levels[_this.level]) {
                            levels[_this.level][bi].draw(_this.ctx);
                            dead = dead || p.box.intersects(levels[_this.level][bi]);
                        }
                    if (dead) {
                        _this.level = -1;
                    }
                    var txt = "Level: " + _this.level;
                    _this.ctx.font = "12px Arial";
                    _this.ctx.fillText(txt, _this.ctx.canvas.width - _this.ctx.measureText(txt).width - 10, 15);
                }
                catch (e) {
                    console.error("Subscribe error! %s", e);
                }
            }, function (e) { return console.error(e); }, function () {
                var txt = _this.level > 0 ? "You WON!" : "You LOST!";
                _this.ctx.font = "30px Arial";
                _this.ctx.fillText(txt, _this.ctx.canvas.width / 2 - _this.ctx.measureText(txt).width / 2, _this.ctx.canvas.height / 2);
            });
            return l.map(function (_) { return 1; }).concat(this.singlespace.map(function (_) {
                _this.level = 0;
                return 1;
            })).repeat();
        };
        return Game;
    })();
    BoxJump.Game = Game;
    var Player = (function () {
        function Player(box, velocity) {
            this.box = box;
            this.velocity = velocity;
            if (this.velocity == null)
                this.velocity = new math.Point2D(170, 0);
        }
        Player.prototype.jump = function () {
            if (this.box.centre.y == this.box.height / 2) {
                return new Player(this.box, new math.Point2D(this.velocity.x, 340));
            }
            return this;
        };
        Player.prototype.rotate = function () {
            if (this.box.centre.y > this.box.height / 2) {
                var a = Math.max(this.velocity.y, -340) / 340;
                return new Player((new math.Box(this.box.centre, this.box.width, this.box.height)).rotate(Math.PI / 2 * a), this.velocity);
            }
            return this;
        };
        Player.prototype.update = function (millis, jump) {
            var _this = this;
            var v = new math.Point2D(this.velocity.x, this.box.centre.y <= 0 ? 0 : this.velocity.y - 30);
            var m = this.velocity.times(millis / 1000);
            m = this.box.centre.add(m).map(function (x) { return x; }, function (y) { return Math.max(y, _this.box.height / 2); }).min(this.box.centre);
            var p = new Player(this.box.move(m), v);
            jump && (p = p.jump());
            return p.rotate();
        };
        return Player;
    })();
    BoxJump.Player = Player;
})(BoxJump || (BoxJump = {}));
Reveal.forSlide(function (s) { return $(s.currentSlide).closest('#g-boxjump').get().length > 0; }, function (s) {
    console.log("BoxJump");
    var canvas = $("#boxjump").get(0);
    return new BoxJump.Game(canvas.getContext("2d")).run();
}).subscribe(function (e) {
});
var Breakout;
(function (Breakout) {
    var Paddle = (function () {
        function Paddle(x, y) {
            this.x = x;
            this.y = y;
            this.speed = 120;
        }
        Paddle.prototype.box = function () {
            return new math.Box(new math.Point2D(this.x, this.y), 80, 10);
        };
        Paddle.prototype.update = function (deltaT, direction) {
            return new Paddle(this.x + deltaT * direction * this.speed, this.y);
        };
        Paddle.prototype.draw = function (ctx) {
            this.box().draw(ctx);
        };
        Paddle.prototype.lines = function () {
            return this.box().lines();
        };
        Paddle.initial = function () {
            return new Paddle(400, 55);
        };
        return Paddle;
    })();
    Breakout.Paddle = Paddle;
    var Obstacle = (function () {
        function Obstacle(x, y, width, height, color, health) {
            if (color === void 0) { color = null; }
            if (health === void 0) { health = 1; }
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.color = color;
            this.health = health;
            if (this.color == null)
                this.color = "rgb(" + Math.floor(Math.random() * 255) + ", " + Math.floor(Math.random() * 255) + ", " + Math.floor(Math.random() * 255) + ")";
        }
        Obstacle.prototype.box = function () {
            return new math.Box(new math.Point2D(this.x, this.y), this.width, this.height);
        };
        Obstacle.prototype.draw = function (ctx) {
            ctx.save();
            ctx.fillStyle = this.color;
            this.box().draw(ctx);
            ctx.restore();
        };
        Obstacle.prototype.lines = function () {
            return this.box().lines();
        };
        Obstacle.prototype.decreaseHealth = function (decrease) {
            if (decrease === void 0) { decrease = true; }
            if (decrease)
                return new Obstacle(this.x, this.y, this.width, this.height, this.color, this.health - 1);
            else
                return new Obstacle(this.x, this.y, this.width, this.height, this.color, this.health);
        };
        Obstacle.initial = function () {
            var obstacles = [];
            for (var x = 0; x < 10; x++)
                for (var y = 0; y < 5; y++)
                    obstacles.push(new Obstacle(40 + x * 80, 550 - y * 20, 80, 20));
            return obstacles;
        };
        return Obstacle;
    })();
    Breakout.Obstacle = Obstacle;
    var Died = (function () {
        function Died(name, message) {
            this.name = name;
            this.message = message;
        }
        return Died;
    })();
    Breakout.Died = Died;
    var GameOver = (function () {
        function GameOver(name, message) {
            this.name = name;
            this.message = message;
        }
        return GameOver;
    })();
    Breakout.GameOver = GameOver;
    var Ball = (function () {
        function Ball(x, y, velocityX, velocityY) {
            this.x = x;
            this.y = y;
            this.velocityX = velocityX;
            this.velocityY = velocityY;
        }
        Ball.prototype.box = function () {
            return new math.Box(new math.Point2D(this.x, this.y), 10, 10);
        };
        Ball.anyIntersection = function (a, b) {
            return a.lines().reduce(function (p, al) { return p || b.lines().reduce(function (h, bl) {
                if (h)
                    return h;
                var i = bl.intersects(al);
                return i && i.length && i;
            }, false); }, false);
        };
        Ball.prototype.update = function (deltaT, paddle, paddleDir, obstacles) {
            var box = this.box();
            if (this.y < 0)
                throw new Died(":(");
            if (this.x - 5 < 0 || this.x + 5 > 800)
                this.velocityX = -this.velocityX;
            if (this.y + 5 > 600)
                this.velocityY = -this.velocityY;
            if (obstacles.reduce(function (x, o) { return x || Ball.anyIntersection(box, o.box()); }, false))
                this.velocityY = -this.velocityY;
            if (Ball.anyIntersection(box, paddle.box())) {
                this.velocityX += 3 * (this.x - paddle.x) / 80;
                this.velocityY *= -1;
            }
            return new Ball(this.x + this.velocityX, this.y + this.velocityY, this.velocityX, this.velocityY);
        };
        Ball.prototype.draw = function (ctx) {
            this.box().draw(ctx);
        };
        Ball.prototype.lines = function () {
            return this.box().lines();
        };
        Ball.initial = function () {
            return new Ball(400, 400, -1, -5);
        };
        return Ball;
    })();
    Breakout.Ball = Ball;
    var Game = (function () {
        function Game(ctx) {
            var _this = this;
            this.ctx = ctx;
            this.paddleKeys = [
                39,
                37
            ];
            this.paddleObservable = $(document.body).onAsObservable("keyup keydown").filter(function (ke) { return _this.paddleKeys.indexOf(ke['keyCode']) != -1; }).map(function (ke) {
                if (ke.type == 'keyup')
                    return 0;
                if (ke['keyCode'] == _this.paddleKeys[0])
                    return 1;
                if (ke['keyCode'] == _this.paddleKeys[1])
                    return -1;
            });
            var state = { paddle: Paddle.initial(), ball: Ball.initial(), obstacles: Obstacle.initial() };
            var t = Rx.Observable.interval(1000 / 30, Rx.Scheduler.requestAnimationFrame);
            var events = t.map(function (_) { return ({ t: new Date().getTime() }); }).scan({ date: new Date().getTime(), dt: 0, event: null }, function (prev, e) {
                return { dt: (e.t - prev.date) / 1000, date: e.t, event: e };
            }).skip(1).withLatestFrom(this.paddleObservable.startWith(0), function (t, dir) { return ({ dt: t.dt, dir: dir }); });
            events.scan({ paddle: Paddle.initial(), ball: Ball.initial(), obstacles: Obstacle.initial(), lives: 3 }, function (state, e) {
                var ball = null, lives = 0;
                try {
                    ball = state.ball.update(e.dt, state.paddle, e.dir, state.obstacles);
                }
                catch (e) {
                    ball = Ball.initial();
                    if (state.lives - 1 == 0)
                        throw new GameOver(":(");
                    lives = -1;
                }
                return {
                    paddle: state.paddle.update(e.dt, e.dir),
                    ball: ball,
                    obstacles: state.obstacles.map(function (o) { return o.decreaseHealth(Ball.anyIntersection(state.ball.box(), o.box())); }).filter(function (o) { return o.health != 0; }),
                    lives: state.lives + lives
                };
            }).subscribe(function (state) {
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.fillStyle = "white";
                state.paddle.draw(ctx);
                state.ball.draw(ctx);
                state.obstacles.forEach(function (o) { return o.draw(ctx); });
            });
        }
        return Game;
    })();
    Breakout.Game = Game;
})(Breakout || (Breakout = {}));
$("#breakout").clickAsObservable().take(1).map(function (e) { return e.target; }).subscribe(function (c) {
    var ctx = c.getContext("2d");
    var game = new Breakout.Game(ctx);
});
var games;
(function (games) {
    var Utils = (function () {
        function Utils() {
        }
        Utils.getMousePos = function (canvas, evt) {
            var rect = canvas.getBoundingClientRect();
            return {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top
            };
        };
        Utils.indexOf = function (list, selector) {
            return list.reduce(function (b, item, i) { return typeof b === 'number' ? b : selector(item) && i; }, false);
        };
        return Utils;
    })();
    games.Utils = Utils;
    var GridMapping = (function () {
        function GridMapping(rows, cols, canvas_wh, margins_tl) {
            if (margins_tl === void 0) { margins_tl = [0, 0]; }
            this.rows = rows;
            this.cols = cols;
            this.canvas_wh = canvas_wh;
            this.margins_tl = margins_tl;
            this.gridW = (canvas_wh[0] - margins_tl[1] * 2) / cols;
            this.gridH = (canvas_wh[1] - margins_tl[0] * 2) / rows;
            console.log("Grid", this.gridW, this.gridH);
        }
        GridMapping.prototype.canvasToGrid = function (x, y) {
            if (y === void 0) { y = null; }
            if (typeof x === 'object' && x.x && x.y) {
                y = x.y;
                x = x.x;
            }
            x -= this.margins_tl[1];
            y -= this.margins_tl[0];
            x /= this.gridW;
            y /= this.gridH;
            return { x: x, y: y };
        };
        GridMapping.prototype.gridToCanvas = function (x, y) {
            if (y === void 0) { y = null; }
            if (typeof x === 'object' && typeof x.x === 'number' && typeof x.y === 'number') {
                y = x.y;
                x = x.x;
            }
            return {
                x: this.gridW * x + this.margins_tl[1],
                y: this.gridH * y + this.margins_tl[0]
            };
        };
        GridMapping.prototype.gridToCanvasPoint = function (gx, gy) {
            if (gy === void 0) { gy = null; }
            var c = this.gridToCanvas(gx, gy);
            return new math.Point2D(c.x, c.y);
        };
        return GridMapping;
    })();
    games.GridMapping = GridMapping;
    var BorderSnapGridMapping = (function (_super) {
        __extends(BorderSnapGridMapping, _super);
        function BorderSnapGridMapping(rows, cols, canvas_wh, border_width, margins_tl) {
            if (border_width === void 0) { border_width = 0.125; }
            if (margins_tl === void 0) { margins_tl = [0, 0]; }
            _super.call(this, rows, cols, canvas_wh, margins_tl);
            this.border_width = border_width;
        }
        BorderSnapGridMapping.prototype.canvasToGrid = function (x, y) {
            if (y === void 0) { y = null; }
            var p = _super.prototype.canvasToGrid.call(this, x, y);
            var border = [
                { o: Math.abs(p.x - Math.round(p.x)), b: 'left' },
                { o: Math.abs(p.y - Math.round(p.y)), b: 'top' }
            ].sort(function (a, b) { return a.o - b.o; })[0];
            if (border.o < this.border_width) {
                return {
                    x: Math.floor(p.x + this.border_width),
                    y: Math.floor(p.y + this.border_width),
                    border: border.b
                };
            }
            else {
                return {
                    x: ~~p.x,
                    y: ~~p.y,
                    inGrid: true
                };
            }
        };
        return BorderSnapGridMapping;
    })(GridMapping);
    games.BorderSnapGridMapping = BorderSnapGridMapping;
    var Grid = (function () {
        function Grid(generate) {
            this.generate = generate;
            this.store = [];
        }
        Grid.prototype.get = function (x, y) {
            if (!this.store[x])
                this.store[x] = [];
            if (!this.store[x][y])
                this.store[x][y] = this.generate(x, y);
            return this.store[x][y];
        };
        return Grid;
    })();
    games.Grid = Grid;
})(games || (games = {}));
var Connected;
(function (Connected) {
    var colors = ["#629E60", "#E9C03A", "#B74133", "#5374ED"];
    var rounds = 20;
    var Sprite = (function () {
        function Sprite(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.p = null;
        }
        Sprite.prototype.down = function (y) {
            if (y === void 0) { y = 1; }
            return new Sprite(this.x, this.y + y, this.color);
        };
        Sprite.prototype.downWithTween = function (y) {
            if (y === void 0) { y = 1; }
            var t = this.down(y);
            t.tween = { from: this.tween && this.tween.from || this, to: t };
            return t;
        };
        Sprite.prototype.draw = function (ctx, game, selected, yoffset, opacity) {
            if (selected === void 0) { selected = false; }
            if (yoffset === void 0) { yoffset = 0; }
            if (opacity === void 0) { opacity = 1; }
            this.p = this.p || game.gridXYtoCanvas(this.x, this.y);
            ctx.beginPath();
            var r = game.gridSize / 2;
            ctx.arc(this.p.x + r, this.p.y + r + yoffset, r, 0, 2 * Math.PI, false);
            ctx.lineWidth = 5;
            ctx.strokeStyle = colors[this.color];
            ctx.stroke();
            if (selected) {
                ctx.beginPath();
                ctx.arc(this.p.x + r, this.p.y + r + yoffset, game.gridSize / 10, 0, 2 * Math.PI, false);
                ctx.lineWidth = 5;
                ctx.strokeStyle = colors[this.color];
                ctx.stroke();
            }
        };
        return Sprite;
    })();
    var NormalStage = (function () {
        function NormalStage(points, turnsRemaining, dots) {
            this.points = points;
            this.turnsRemaining = turnsRemaining;
            this.dots = dots;
            this.time = 0;
            if (this.dots.length == 0) {
                for (var i = 0; i < 36; i++) {
                    this.dots.push(this.randomSprite(~~(i / 6), i % 6));
                }
            }
        }
        NormalStage.prototype.randomSprite = function (x, y) {
            return new Sprite(x, y, ~~(Math.random() * 4));
        };
        NormalStage.prototype.draw = function (ctx, game) {
            var t = this.time;
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = "18px Arial";
            ctx.fillText("" + this.points, 25, 30);
            var txt = "" + (rounds - this.turnsRemaining) + "/" + rounds;
            ctx.fillText(txt, ctx.canvas.width - ctx.measureText(txt).width - 25, 30);
            this.dots.forEach(function (s) {
                s.draw(ctx, game, false, s.tween && s.tween.from ? (s.tween.from.y - s.y) * (1 - Math.min(1, t)) * game.gridSize * 2 : 0, 1);
            });
        };
        NormalStage.prototype.atTime = function (t) {
            this.time = t;
            return this;
        };
        NormalStage.prototype.clearedAnimations = function () {
            return new NormalStage(this.points, this.turnsRemaining, this.dots.map(function (d) { return d.down(0); }));
        };
        NormalStage.prototype.addPoints = function (p) {
            return new NormalStage(this.points + (p * Math.max(1, ~~(p / 5) * 5)), this.turnsRemaining - 1, this.dots);
        };
        NormalStage.bar = function (x) {
            $("#connected-game .multiplier .bg").width(Math.min(100, (x / 5) * 33.3) + "%");
        };
        NormalStage.prototype.run = function (game) {
            var _this = this;
            var ss = game.down.take(1).flatMap(function (_) { return game.dots; }).takeUntil(game.up).flatMap(function (dot) {
                return Rx.Observable.from(_this.dots.filter(function (d) { return d.x == dot.x && d.y == dot.y; }));
            }).scan([], function (list, dot) {
                var contains = list.filter(function (d) { return d.x == dot.x && d.y == dot.y; }).length > 0;
                if (contains)
                    return list;
                var ok = list.length == 0 || (list[0].x == dot.x || list[0].y == dot.y) && Math.abs(list[0].x - dot.x + list[0].y - dot.y) <= 1;
                var color = list.length == 0 || list[0].color == dot.color;
                if (!ok || !color)
                    return [];
                list.unshift(dot);
                return list;
            }).tap(function (dots) { return dots.length && dots[0].draw(game.ctx, game, true); }).tap(function (dots) { return dots.length && NormalStage.bar(dots.length); }).skipWhile(function (dots) { return dots.length == 1; });
            var inclusive = ss.publish(function (ob) { return ob.takeUntil(ob.skipWhile(function (l) { return l.length > 0; })); });
            return inclusive.lastOrDefault(null, []).tapOnCompleted(function () { return NormalStage.bar(0); }).flatMap(function (list) {
                return list.length ? _this.next(list) : Rx.Observable.just(_this);
            });
        };
        NormalStage.prototype.next = function (removedDots) {
            var _this = this;
            removedDots.forEach(function (d) {
                _this.dots.splice(_this.dots.indexOf(d), 1);
            });
            this.dots = this.dots.map(function (o) {
                var below = removedDots.filter(function (_) { return _.x == o.x && _.y > o.y; }).length;
                return below ? o.downWithTween(below) : o;
            });
            removedDots.reduce(function (p, d) {
                p[d.x] = (p[d.x] + 1 || 1);
                return p;
            }, []).forEach(function (below, x) {
                for (var i = 1; i <= below; i++)
                    _this.dots.push(_this.randomSprite(x, -i).downWithTween(below));
            });
            var duration = 500;
            var t = Rx.Observable.interval(duration / 30, Rx.Scheduler.requestAnimationFrame).map(function (i) { return i / duration * 1000 / 30; });
            return t.takeWhile(function (t) { return t < 1; }).map(function (t) { return _this.atTime(t); }).concat((function () {
                var then = this.clearedAnimations().addPoints(removedDots.length);
                return then.turnsRemaining > 0 ? Rx.Observable.just(then) : Rx.Observable.just(new ScoreStage(then.points)).delay(500).startWith(then);
            }).call(this));
        };
        return NormalStage;
    })();
    var Start = (function (_super) {
        __extends(Start, _super);
        function Start() {
            _super.call(this, 0, 0, [new Sprite(2, 3, 0), new Sprite(3, 3, 0)]);
        }
        Start.prototype.draw = function (ctx, game) {
            _super.prototype.draw.call(this, ctx, game);
            var txt = "connect the two dots to start";
            ctx.font = "18px Arial";
            ctx.fillText(txt, ctx.canvas.width / 2 - ctx.measureText(txt).width / 2, ctx.canvas.height / 2 + 100);
        };
        Start.prototype.next = function (removedDots) {
            console.log(removedDots.length == this.dots.length ? "Advancing to normal stage" : "Failed tutorial :-(");
            var r = removedDots.length == this.dots.length ? new NormalStage(0, rounds, []) : this;
            return Rx.Observable.just(r);
        };
        return Start;
    })(NormalStage);
    var ScoreStage = (function () {
        function ScoreStage(points) {
            this.points = points;
        }
        ScoreStage.prototype.draw = function (ctx, game) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            var txt = "You scored " + this.points + " points!";
            ctx.font = "24px Arial";
            ctx.fillText(txt, ctx.canvas.width / 2 - ctx.measureText(txt).width / 2, ctx.canvas.height / 2);
            txt = "Click to restart";
            ctx.font = "18px Arial";
            ctx.fillText(txt, ctx.canvas.width / 2 - ctx.measureText(txt).width / 2, ctx.canvas.height / 2 + 100);
        };
        ScoreStage.prototype.run = function (game) {
            return game.up.take(1).map(function (_) { return new Start(); });
        };
        return ScoreStage;
    })();
    var Game = (function () {
        function Game(ctx) {
            var _this = this;
            this.ctx = ctx;
            this.level = 0;
            this.cols = 0;
            this.rows = 0;
            this.gridSize = 0;
            this.marginTop = 30;
            this.down = $(this.ctx.canvas).onAsObservable("mousedown");
            this.up = $(window).onAsObservable("mouseup");
            this.dots = $(this.ctx.canvas).onAsObservable("mousemove").filter(function (e) { return e.which === 1; }).map(function (e) {
                var p = games.Utils.getMousePos(e.target, e);
                return _this.canvasXYtoGridXY(p.x, p.y);
            }).distinctUntilChanged().filter(function (p) { return p.inGrid && p.x >= 0 && p.x < _this.cols && p.y >= 0 && p.y < _this.rows; });
            this.cols = 6;
            this.rows = 6;
            this.gridSize = 400 / (this.rows * 2 + 1);
            Rx.Observable.just(new Start()).flatScan(function (s) {
                s.draw(_this.ctx, _this);
                return s.run(_this).doAction(function (_) { return _.draw(_this.ctx, _this); }).last();
            }, function (s) { return Rx.Observable.just(s); }).subscribe(function (s) { return s.draw(_this.ctx, _this); }, function (e) { return console.error(e); }, function () { return console.log("Completed game"); });
        }
        Game.prototype.canvasXYtoGridXY = function (cx, cy) {
            cx -= this.gridSize;
            cy -= this.gridSize + this.marginTop;
            cx /= this.gridSize;
            cy /= this.gridSize;
            return {
                x: ~~(cx / 2),
                y: ~~(cy / 2),
                inGrid: ~~cx % 2 == 0 && ~~cy % 2 == 0
            };
        };
        Game.prototype.gridXYtoCanvas = function (gx, gy) {
            return {
                x: this.gridSize + 2 * this.gridSize * gx,
                y: this.gridSize + 2 * this.gridSize * gy + this.marginTop
            };
        };
        return Game;
    })();
    Connected.Game = Game;
})(Connected || (Connected = {}));
Rx.Observable.just($("#connected").get(0)).take(1).subscribe(function (c) {
    var ctx = c.getContext("2d");
    var game = new Connected.Game(ctx);
});
var DotsAndBoxes;
(function (DotsAndBoxes) {
    var User = (function () {
        function User(id, color) {
            this.id = id;
            this.color = color;
        }
        return User;
    })();
    var Box = (function (_super) {
        __extends(Box, _super);
        function Box(centre, size, lines, ctx) {
            _super.call(this, centre, size, size);
            this.Owner = Rx.Observable.merge(lines.map(function (_) { return _.Owner; })).skip(3).take(1);
            this.Owner.subscribe(this.draw.bind(this, ctx));
        }
        Box.prototype.draw = function (ctx, user) {
            if (user instanceof User) {
                ctx.fillStyle = user && user.color || "blue";
                _super.prototype.draw.call(this, ctx, false, false);
            }
        };
        return Box;
    })(math.Box);
    var Line = (function (_super) {
        __extends(Line, _super);
        function Line(a, b, events, game) {
            var _this = this;
            _super.call(this, a, b);
            this.disposed = false;
            this.resources = [];
            this.owned = false;
            this.owner = new Rx.BehaviorSubject(null);
            this.Owner = this.owner.filter(function (_) { return _ != null; }).take(1);
            this.gridSize = this.size();
            var r = events.map(function (e) {
                if (e.evt.type == 'mousemove')
                    _this.draw(game.ctx, e.user);
                if (e.evt.type == 'mouseout')
                    _this.draw(game.ctx, false);
                return e.evt.type == 'mousedown' ? e.user : null;
            }).filter(function (_) { return _ != null; }).subscribe(function (u) {
                _this.owned = true;
                _this.owner.onNext(u);
            });
            this.resources.push(r);
        }
        Line.prototype.dispose = function () {
            this.resources = this.resources.filter(function (r) { return r.dispose() && false; });
            this.owner.dispose();
        };
        Line.prototype.draw = function (ctx, user) {
            if (this.owned || user instanceof User)
                ctx.fillStyle = "gray";
            else
                ctx.globalCompositeOperation = "destination-out";
            this.path(ctx);
            ctx.fill();
            ctx.globalCompositeOperation = "source-over";
            this.path(ctx);
            ctx.strokeStyle = "gray";
            ctx.stroke();
        };
        Line.prototype.path = function (ctx) {
            var c = this.gridSize / 10;
            ctx.beginPath();
            ctx.moveTo(this._0.x, this._0.y);
            if (this._0.y == this._1.y) {
                ctx.lineTo(this._0.x + c, this._0.y + c);
                ctx.lineTo(this._1.x - c, this._1.y + c);
                ctx.lineTo(this._1.x, this._1.y);
                ctx.lineTo(this._1.x - c, this._1.y - c);
                ctx.lineTo(this._0.x + c, this._0.y - c);
            }
            else {
                ctx.lineTo(this._0.x + c, this._0.y - c);
                ctx.lineTo(this._1.x + c, this._1.y + c);
                ctx.lineTo(this._1.x, this._1.y);
                ctx.lineTo(this._1.x - c, this._1.y + c);
                ctx.lineTo(this._0.x - c, this._0.y - c);
            }
            ctx.lineTo(this._0.x, this._0.y);
        };
        return Line;
    })(math.Line2D);
    var NormalStage = (function () {
        function NormalStage(points, lines, boxes, game) {
            this.points = points;
            this.lines = lines;
            this.boxes = boxes;
            this.resources = [];
            if (!lines.length || !boxes.length) {
                var top = new games.Grid(function (x, y) {
                    var b = game.gridToCanvasPoint(x, y), c = game.gridToCanvasPoint(x + 1, y);
                    var l = new Line(b, c, game.eventsFor('top', x, y), game);
                    lines.push(l);
                    return l;
                });
                var left = new games.Grid(function (x, y) {
                    var a = game.gridToCanvasPoint(x, y + 1), b = game.gridToCanvasPoint(x, y);
                    var l = new Line(a, b, game.eventsFor('left', x, y), game);
                    lines.push(l);
                    return l;
                });
                for (var i = 0, x = 0, y = 0; y < game.rows; i++, x = (x + 1) % game.cols, y = x == 0 ? y + 1 : y) {
                    boxes.push(new Box(game.gridToCanvasPoint(x + 0.5, y + 0.5), game.gridSize * 8 / 10, [
                        top.get(x, y),
                        top.get(x, y + 1),
                        left.get(x, y),
                        left.get(x + 1, y)
                    ], game.ctx));
                }
            }
            this.boxOwner = Rx.Observable.merge(boxes.map(function (b) { return b.Owner.map(function (u) { return ({
                box: b,
                owner: u
            }); }); }));
            this.lineOwner = Rx.Observable.merge(lines.map(function (b) { return b.Owner.map(function (u) { return ({
                line: b,
                owner: u
            }); }); }));
            this.resources.push(this.boxOwner.subscribe(function (bo) { return game.score(bo.owner, bo.box); }));
            this.resources.push(this.lineOwner.subscribe(function (bo) { return game.linePlaced(bo.owner, bo.line); }));
        }
        NormalStage.prototype.draw = function (ctx, game) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            this.lines.forEach(function (l) { return l.draw(ctx, true); });
            this.boxes.forEach(function (b) { return b.draw(ctx, true); });
        };
        NormalStage.prototype.run = function (game) {
            var _this = this;
            return Rx.Observable.using(function () { return _this; }, function (resources) {
                return Rx.Observable.never();
            });
        };
        NormalStage.prototype.dispose = function () {
            this.resources.forEach(function (r) { return r.dispose(); });
            this.lines.forEach(function (l) { return l.dispose(); });
        };
        NormalStage.start = function (game) {
            return new NormalStage(0, [], [], game);
        };
        return NormalStage;
    })();
    var Game = (function (_super) {
        __extends(Game, _super);
        function Game(ctx, players) {
            var _this = this;
            _super.call(this, 4, 4, [ctx.canvas.width, ctx.canvas.height], 1 / 8, [5, 5]);
            this.ctx = ctx;
            this.players = players;
            this.level = 0;
            this.user = new User("id", "red");
            this.users = [this.user, new User("id", "blue")];
            this.onBox = new Rx.Subject();
            this.onLine = new Rx.Subject();
            this.initialTurn = Math.floor(Math.random() + .5);
            this.turns = Rx.Observable.merge(this.onLine.map(function (_) { return 1; }), this.onBox.window(this.onLine).flatMap(function (l) { return l.count(); }).filter(function (a) { return a > 0; }).map(function (_) { return 1; })).scan(this.initialTurn, function (p, u) { return 1 - p; }).startWith(this.initialTurn).tap(function (ui) {
                _this.players[1 - ui].style.opacity = "1";
                _this.players[ui].style.opacity = "0";
            });
            this.mouse = $(this.ctx.canvas).onAsObservable("mousemove mousedown mouseup").map(function (e) {
                var p = games.Utils.getMousePos(e.target, e);
                return {
                    position: _this.canvasToGrid(p.x, p.y),
                    originalEvent: null,
                    type: e.type
                };
            });
            this.hoovers = this.mouse.distinctUntilChanged(function (e) { return e.position; });
            this.hooverInOut = this.hoovers.filter(function (e) { return e.type == 'mousemove'; }).flatMap(function (h) {
                return Rx.Observable.just(h).concat(_this.hoovers.filter(function (h2) {
                    return h.position.x != h2.position.x || h.position.y != h2.position.y || h.position['border'] != h2.position['border'];
                }).take(1).map(function (_) { return ({
                    position: h.position,
                    type: "mouseout",
                    originalEvent: _.originalEvent
                }); }));
            });
            this.dots = Rx.Observable.merge(this.mouse.filter(function (m) { return m.type == 'mousedown' || m.type == 'mouseup'; }), this.hooverInOut);
            this.gridSize = this.gridW;
        }
        Game.prototype.score = function (user, box) {
            this.onBox.onNext(user);
        };
        Game.prototype.linePlaced = function (user, line) {
            this.onLine.onNext(user);
        };
        Game.prototype.eventsFor = function (type, x, y) {
            var _this = this;
            return this.turns.map(function (ui) {
                return _this.dots.filter(function (e) {
                    return e.position['border'] && e.position['border'] == type && e.position.x == x && e.position.y == y;
                }).map(function (e) { return ({
                    evt: e,
                    user: _this.users[ui]
                }); });
            }).switch();
        };
        Game.prototype.run = function () {
            var _this = this;
            return Rx.Observable.just(NormalStage.start(this)).flatScan(function (s) {
                s.draw(_this.ctx, _this);
                return s.run(_this).doAction(function (_) { return _.draw(_this.ctx, _this); }).last();
            }, function (s) { return Rx.Observable.just(s); }).tap(function (s) { return s.draw(_this.ctx, _this); }, function (e) { return console.error(e); }, function () { return console.log("Completed game"); });
        };
        return Game;
    })(games.BorderSnapGridMapping);
    DotsAndBoxes.Game = Game;
})(DotsAndBoxes || (DotsAndBoxes = {}));
Reveal.forSlide(function (s) { return s.currentSlide.id == 'g-dotsandboxes'; }, function (s) {
    var canvas = $("#dotsandboxes", s.currentSlide).get(0);
    var players = $(".dots-player", s.currentSlide).get();
    return new DotsAndBoxes.Game(canvas.getContext("2d"), players).run();
}).subscribe(function (e) {
    console.log("Loaded Dots & Boxes");
});
var Flappy;
(function (_Flappy) {
    var colors = ["#629E60", "#E9C03A", "#B74133", "#5374ED"];
    var graphics = {
        trees: ["FlappyBird/tree.png", "FlappyBird/tree-high.png", "FlappyBird/Junglewood_Tree.png", "FlappyBird/Pearlwood_Tree.png"],
        clouds: ["FlappyBird/cloud.png", "FlappyBird/actual-cloud.png"],
        flappy: "FlappyBird/sprites.png",
        aula: "FlappyBird/aula.png",
        ewi: "FlappyBird/ewi-blur.png",
        coin: "FlappyBird/spinning_coin_gold.png"
    };
    var images = {};
    var rounds = 2;
    var flapSpeed = 300;
    var gravity = 500;
    var roll = Math.PI / 100;
    var canvas_height = 0;
    var speed = 100;
    var default_speed = 100;
    var debug = false;
    var Img = (function () {
        function Img(src) {
            var _this = this;
            this.src = src;
            this.observable = new Rx.Subject();
            this.img = null;
            this.img = new Image();
            Rx.Observable.fromEvent(this.img, "load").select(function (_) { return _this; }).multicast(this.observable).connect();
            this.img.src = src;
        }
        return Img;
    })();
    var SheetSprite = (function () {
        function SheetSprite(sheet, sheet_offset, frame_width, frame_height, frame_count) {
            if (frame_count === void 0) { frame_count = 1; }
            this.sheet = sheet;
            this.sheet_offset = sheet_offset;
            this.frame_width = frame_width;
            this.frame_height = frame_height;
            this.frame_count = frame_count;
            this.f = 0;
            this.frame_offset_x = 0;
            this.frame_offset_y = 0;
        }
        SheetSprite.prototype.draw = function (ctx) {
            this.drawT(ctx, ~~(new Date().getTime() / 30));
        };
        SheetSprite.prototype.drawT = function (ctx, frame_number) {
            ctx.drawImage(this.sheet, this.sheet_offset.x + this.frame_width * (frame_number % this.frame_count), this.sheet_offset.y, this.frame_width, this.frame_height, this.frame_offset_x, this.frame_offset_y, this.frame_width, this.frame_height);
        };
        SheetSprite.prototype.lines = function () {
            return [];
        };
        return SheetSprite;
    })();
    var Flappy = (function (_super) {
        __extends(Flappy, _super);
        function Flappy(y, rotation, velocity) {
            _super.call(this, images[graphics.flappy], Flappy.offset, 28, 14, 3);
            this.y = y;
            this.rotation = rotation;
            this.velocity = velocity;
            if (y <= 0)
                throw new Error("Flappy died :(");
        }
        Flappy.prototype.flap = function () {
            return new Flappy(this.y, this.rotation, flapSpeed);
        };
        Flappy.prototype.delta = function (deltaT) {
            return new Flappy(this.y + this.velocity * deltaT, Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.rotation + this.velocity * roll * deltaT)), this.velocity - gravity * deltaT);
        };
        Flappy.prototype.box = function () {
            return new math.Box(new math.Point2D(Flappy.x, this.y), 28, 14).rotate(this.rotation);
        };
        Flappy.prototype.draw = function (ctx) {
            if (debug) {
                this.box().draw(ctx, debug);
            }
            ctx.save();
            ctx.translate(Flappy.x, ctx.canvas.height - this.y);
            ctx.rotate(-this.rotation);
            ctx.translate(-this.frame_width / 2, -this.frame_height / 2);
            _super.prototype.draw.call(this, ctx);
            ctx.restore();
        };
        Flappy.initial = function () {
            return new Flappy(200, 0, 0);
        };
        Flappy.prototype.lines = function () {
            return this.box().lines();
        };
        Flappy.offset = new math.Point2D(-3, 490);
        Flappy.x = 60;
        return Flappy;
    })(SheetSprite);
    var BasicObstacle = (function (_super) {
        __extends(BasicObstacle, _super);
        function BasicObstacle() {
            _super.apply(this, arguments);
            this.x = 400;
            this.y = 0;
            this.fatal = true;
        }
        BasicObstacle.prototype.boost = function () {
            return 0;
        };
        BasicObstacle.prototype.draw = function (ctx) {
            var b = this.box();
            if (debug)
                b.draw(ctx, debug);
            if (this.x - this.width / 2 > ctx.canvas.width || this.x + this.width / 2 < 0)
                return;
            ctx.save();
            ctx.translate(this.x - this.frame_width / 2, ctx.canvas.height - b.centre.y - this.height / 2);
            _super.prototype.draw.call(this, ctx);
            ctx.restore();
        };
        BasicObstacle.prototype.at = function (x) {
            this.x = x;
            return this;
        };
        BasicObstacle.prototype.box = function () {
            return new math.Box(new math.Point2D(this.x, this.height / 2 + this.y), this.width, this.height);
        };
        BasicObstacle.prototype.lines = function () {
            return this.box().lines();
        };
        BasicObstacle.prototype.delta = function (deltaT) {
            this.x -= speed * deltaT;
            return this;
        };
        return BasicObstacle;
    })(SheetSprite);
    var Coin = (function (_super) {
        __extends(Coin, _super);
        function Coin() {
            _super.call(this, images[graphics.coin], new math.Point2D(0, 0), 32, 32, 8);
            this.x = 400;
            this.width = 32;
            this.height = 32;
            this.y = 20;
        }
        Coin.offset = new math.Point2D(0, 0);
        return Coin;
    })(BasicObstacle);
    var StaticObstacle = (function (_super) {
        __extends(StaticObstacle, _super);
        function StaticObstacle(height) {
            _super.call(this, null, new math.Point2D(0, 0), 0, 0, 1);
            this.height = height;
            this.width = 60;
            this.sheet = images[graphics.trees[~~(Math.random() * graphics.trees.length)]];
            this.width = this.frame_width = this.sheet.width;
            this.height = this.frame_height = this.sheet.height;
        }
        return StaticObstacle;
    })(BasicObstacle);
    var Aula = (function (_super) {
        __extends(Aula, _super);
        function Aula() {
            _super.call(this, images[graphics.aula], new math.Point2D(0, 0), 400, 300, 1);
            this.width = this.frame_width = this.sheet.width;
            this.height = 128;
            this.frame_height = this.sheet.height;
        }
        Aula.prototype.box = function () {
            return new math.Box(new math.Point2D(this.x, 236), this.width, 128);
        };
        return Aula;
    })(BasicObstacle);
    var TopDownObstacle = (function (_super) {
        __extends(TopDownObstacle, _super);
        function TopDownObstacle(height) {
            _super.call(this, null, new math.Point2D(0, 0), 0, 0, 1);
            this.height = height;
            this.width = 60;
            this.sheet = images[graphics.trees[~~(Math.random() * graphics.trees.length)]];
            this.width = this.frame_width = this.sheet.width;
            this.height = this.frame_height = this.sheet.height;
            this.y = canvas_height - this.height;
        }
        return TopDownObstacle;
    })(BasicObstacle);
    var Cloud = (function (_super) {
        __extends(Cloud, _super);
        function Cloud() {
            _super.call(this, null, new math.Point2D(0, 0), 0, 0, 1);
            this.sheet = images[graphics.clouds[~~(Math.random() * graphics.clouds.length)]];
            this.width = this.frame_width = this.sheet.width;
            this.height = this.frame_height = this.sheet.height;
            this.y = canvas_height - this.height - Math.random() * 200;
        }
        return Cloud;
    })(BasicObstacle);
    var EWI = (function (_super) {
        __extends(EWI, _super);
        function EWI() {
            _super.call(this, images[graphics.ewi], new math.Point2D(0, 0), 300, 500, 1);
            this.speed = 200;
            this.fatal = false;
            this.y = 0;
            this.width = this.frame_width;
            this.height = this.frame_height;
        }
        EWI.prototype.boost = function () {
            return 100;
        };
        return EWI;
    })(BasicObstacle);
    var NormalStage = (function () {
        function NormalStage(points, flappy, obstacles, coins) {
            this.points = points;
            this.flappy = flappy;
            this.obstacles = obstacles;
            this.coins = coins;
            this.time = 0;
            if (this.obstacles.length == 0) {
                this.obstacles.push(new EWI().delta(-4));
                this.obstacles.push(new Aula().delta(-8));
                this.obstacles.push(new StaticObstacle(100).delta(-1));
                this.obstacles.push(new Cloud().delta(-3));
                this.obstacles.push(new Cloud().delta(-5.5));
                this.obstacles.push(new StaticObstacle(300).delta(-11));
                this.obstacles.push(new Cloud().delta(-14));
                this.obstacles.push(new StaticObstacle(100).delta(-11));
                this.obstacles.push(new StaticObstacle(300).delta(-13));
            }
            if (this.coins.length == 0) {
                this.coins.push(new Coin().at(160));
            }
        }
        NormalStage.prototype.draw = function (ctx) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            this.obstacles.forEach(function (o) { return o.draw(ctx); });
            this.coins.forEach(function (c) { return c.draw(ctx); });
            this.flappy.draw(ctx);
            ctx.font = "18px Arial";
            ctx.fillText("" + this.points, 25, 30);
        };
        NormalStage.anyIntersection = function (as, bs) {
            return as.reduce(function (p, a) { return p || bs.reduce(function (h, b) {
                if (h)
                    return h;
                var i = b.intersects(a);
                return i && i.length && i;
            }, false); }, false);
        };
        NormalStage.prototype.delta = function (deltaT, flap) {
            var f = this.flappy.delta(deltaT);
            if (flap)
                f = f.flap();
            var fl = this.flappy.lines();
            var collision = this.obstacles.reduce(function (p, o) { return p || o.fatal && NormalStage.anyIntersection(o.lines(), fl); }, false);
            if (collision) {
                console.log("Collision!", collision);
                throw new Error("Dead by collision!");
            }
            var boost = this.obstacles.reduce(function (p, o) { return p + (!o.fatal && NormalStage.anyIntersection(o.lines(), [NormalStage.flappyXline]) && o.boost() || 0); }, 0);
            if (boost) {
                speed = default_speed + boost;
            }
            else {
                speed = default_speed;
            }
            var win = 0;
            var cs_all = this.coins.map(function (c) { return c.delta(deltaT); });
            var cs = this.coins.filter(function (c) { return !NormalStage.anyIntersection(c.lines(), fl); });
            win += (cs_all.length - cs.length) * 1000;
            var os = this.obstacles.map(function (o) {
                var ox = o.x;
                var n = o.delta(deltaT);
                if (n.x < Flappy.x && ox >= Flappy.x) {
                    win += o.height;
                }
                return n;
            });
            os = os.filter(function (o) { return o.x + o.width / 2 > 0; });
            while (this.obstacles.length > os.length) {
                var last = this.obstacles[this.obstacles.length - 1];
                var x = Math.max(last.x + last.width + 100, 400) + Math.random() * 200;
                if (Math.random() > 0.8)
                    os.push(new Cloud().at(x));
                else
                    os.push(new StaticObstacle(300 * Math.random() + 100).at(x));
            }
            return new NormalStage(this.points + win, f, os, cs);
        };
        NormalStage.prototype.run = function (game) {
            var duration = 1000;
            var t = Rx.Observable.interval(duration / 30, Rx.Scheduler.requestAnimationFrame);
            var events = Rx.Observable.merge(t.map(function (_) {
                return { t: new Date().getTime(), key: false };
            }), game.ups.map(function (k) {
                return { t: k, key: true };
            })).scan({ date: new Date().getTime(), dt: 0, event: null }, function (prev, e) {
                return { dt: (e.t - prev.date) / 1000, date: e.t, event: e };
            }).skip(1);
            return events.scan(this, function (g, _) { return g.delta(_.dt, _.event.key); }).catch(Rx.Observable.just(new Start()));
        };
        NormalStage.flappyXline = new math.Line2D(new math.Point2D(Flappy.x, -10), new math.Point2D(Flappy.x, canvas_height + 10));
        return NormalStage;
    })();
    var Start = (function (_super) {
        __extends(Start, _super);
        function Start() {
            _super.call(this, 0, Flappy.initial(), [], []);
        }
        Start.prototype.draw = function (ctx) {
            _super.prototype.draw.call(this, ctx);
            var txt = "press space to start";
            ctx.font = "18px Arial";
            ctx.fillText(txt, ctx.canvas.width / 2 - ctx.measureText(txt).width / 2, ctx.canvas.height / 2 + 100);
        };
        Start.prototype.run = function (game) {
            return Rx.Observable.merge($(game.ctx.canvas).onAsObservable("click").map(function (_) { return 1; }), $(window).onAsObservable("keyup").filter(function (e) { return e['keyCode'] == 32; }).map(function (_) { return 1; })).take(1).map(function (_) { return new NormalStage(0, Flappy.initial(), [], []); });
        };
        return Start;
    })(NormalStage);
    var ScoreStage = (function () {
        function ScoreStage(points) {
            this.points = points;
        }
        ScoreStage.prototype.draw = function (ctx) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            var txt = "You scored " + this.points + " points!";
            ctx.font = "24px Arial";
            ctx.fillText(txt, ctx.canvas.width / 2 - ctx.measureText(txt).width / 2, ctx.canvas.height / 2);
            txt = "Click to restart";
            ctx.font = "18px Arial";
            ctx.fillText(txt, ctx.canvas.width / 2 - ctx.measureText(txt).width / 2, ctx.canvas.height / 2 + 100);
        };
        ScoreStage.prototype.run = function (game) {
            return game.up.take(1).map(function (_) { return new Start(); });
        };
        return ScoreStage;
    })();
    var Game = (function () {
        function Game(ctx) {
            var _this = this;
            this.ctx = ctx;
            this.level = 0;
            this.ups = $(window).onAsObservable("keyup").filter(function (e) { return (e['keyCode'] == 38); }).map(function (_) { return new Date().getTime(); });
            this.down = $(this.ctx.canvas).onAsObservable("mousedown");
            this.up = $(window).onAsObservable("mouseup");
            var imageLoaded = Rx.Observable.merge(Rx.Observable.from(graphics.trees).flatMap(function (t) { return new Img(t).observable.take(1); }), Rx.Observable.from(graphics.clouds).flatMap(function (t) { return new Img(t).observable.take(1); }), new Img(graphics.coin).observable.take(1), new Img(graphics.flappy).observable.take(1), new Img(graphics.ewi).observable.take(1), new Img(graphics.aula).observable.take(1)).scan({}, function (registry, img) {
                registry[img.src] = img.img;
                return registry;
            }).last().tap(function (registry) {
                images = registry;
            });
            canvas_height = ctx.canvas.height;
            imageLoaded.select(function (_) { return new Start(); }).flatScan(function (s) {
                s.draw(_this.ctx);
                return s.run(_this).doAction(function (_) { return _.draw(_this.ctx); }).last();
            }, function (s) { return Rx.Observable.just(s); }).subscribe(function (s) { return s.draw(_this.ctx); }, function (e) { return console.error(e); }, function () { return console.log("Completed game"); });
        }
        return Game;
    })();
    _Flappy.Game = Game;
})(Flappy || (Flappy = {}));
Rx.Observable.just($("#flappy").get(0)).take(1).subscribe(function (c) {
    var ctx = c.getContext("2d");
    var game = new Flappy.Game(ctx);
});
var Flow;
(function (Flow) {
    var Instance = (function () {
        function Instance(flows) {
            this.flows = flows;
        }
        Instance.simple = function (w, h, n_flows) {
            var perflow = (w * h / n_flows);
            var flow = [];
            var flows = [flow];
            var totalflows = 1;
            for (var i = 0, x = 0, y = 0; i < w * h; i++) {
                if (i >= flows.length * perflow) {
                    flow = [];
                    flows.push(flow);
                }
                flow.push(new math.Point2D(x, y));
                x += y % 2 == 0 ? 1 : -1;
                if (x < 0 || x >= w) {
                    y += 1;
                    x = Math.min(w - 1, Math.max(0, x));
                }
            }
            return new Instance(flows);
        };
        Instance.prototype.contains = function (p) {
            return typeof this.flowIndex(p) == 'number';
        };
        Instance.prototype.rowIndex = function (flow, p) {
            var f = typeof flow == 'number' ? this.flows[flow] : flow;
            return f.reduce(function (b, fp, i) { return typeof b === 'number' ? b : fp.x == p.x && fp.y == p.y && i; }, false);
        };
        Instance.prototype.flowIndex = function (p) {
            var _this = this;
            return this.flows.reduce(function (b, flow, f_index) { return typeof b === 'number' ? b : typeof _this.rowIndex(flow, p) === 'number' ? f_index : false; }, false);
        };
        Instance.prototype.isStartOrEnd = function (p) {
            var i = this.flowIndex(p);
            return typeof i === 'number' && i >= 0 && (Instance.equals(p, this.flows[i][0]) || Instance.equals(p, this.flows[i][this.flows[i].length - 1]));
        };
        Instance.equals = function (a, b) {
            return a.x === b.x && a.y === b.y;
        };
        Instance.prototype.with = function (flow) {
            if (flow == null || typeof flow != 'object')
                return this;
            var fs = this.flows.slice(0);
            while (fs.length <= flow.index) {
                fs.push([]);
            }
            fs = fs.map(function (ps, i) { return i == flow.index ? flow.ps : ps; });
            return new Instance(fs);
        };
        Instance.prototype.permutate = function (seed) {
            if (seed == 0)
                return this;
            var rng = new math.RNG(seed);
            var fs = this.flows;
            for (var n = 100; n--;) {
                var i = rng.random() * fs.length % fs.length;
                if (fs[i].length < 3)
                    break;
            }
            return this;
        };
        return Instance;
    })();
    Flow.Instance = Instance;
})(Flow || (Flow = {}));
var Flow;
(function (Flow) {
    var originalColors = ["#629E60", "#E9C03A", "#B74133", "#5374ED"];
    var colors = ["#1F00FF", "#D10000", "#EDEF00", "#4F8000", "#9FFFFF", "#D57C00", "#D200FF", "#87302A", "#65007A"];
    function drawCircle(ctx, r, p) {
        ctx.beginPath();
        ctx.arc(p.x + r, p.y + r, r, 0, 2 * Math.PI, false);
        ctx.fill();
    }
    function drawLine(ctx, l) {
        ctx.beginPath();
        ctx.moveTo(l._0.x, l._0.y);
        ctx.lineTo(l._1.x, l._1.y);
        ctx.stroke();
    }
    var NormalStage = (function () {
        function NormalStage(game, i) {
            if (i === void 0) { i = 0; }
            this.game = game;
            this.i = i;
            this.resources = [];
            console.debug("Instantiated Stage", i);
            this.instance = game.instance(game.cols);
            this.userFlows = new Flow.Instance([]);
        }
        NormalStage.prototype.draw = function (ctx, game, inProgress) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            for (var x = 0; x <= game.cols; x++) {
                ctx.beginPath();
                var a = game.gridToCanvasPoint(x, 0), b = game.gridToCanvasPoint(x, game.rows);
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
            for (var y = 0; y <= game.rows; y++) {
                ctx.beginPath();
                var a = game.gridToCanvasPoint(0, y), b = game.gridToCanvasPoint(game.cols, y);
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
            ctx.save();
            ctx.translate(game.gridW * .1, game.gridH * .1);
            this.instance.flows.forEach(function (f, i) {
                ctx.fillStyle = colors[i % colors.length];
                var p_a = game.gridToCanvasPoint(f[0]), p_b = game.gridToCanvasPoint(f[f.length - 1]);
                drawCircle(ctx, game.gridH / 2 * .8, p_a);
                drawCircle(ctx, game.gridH / 2 * .8, p_b);
            });
            ctx.restore();
            ctx.save();
            ctx.translate(game.gridW * .5, game.gridH * .5);
            this.userFlows.with(inProgress).flows.forEach(function (f, i) {
                ctx.strokeStyle = colors[i % colors.length];
                ctx.fillStyle = colors[i % colors.length];
                ctx.lineWidth = game.gridH / 3;
                for (var j = 1; j < f.length; j++) {
                    var p_a = game.gridToCanvasPoint(f[j - 1]), p_b = game.gridToCanvasPoint(f[j]);
                    drawLine(ctx, new math.Line2D(p_a, p_b));
                    ctx.translate(-game.gridW / 6, -game.gridH / 6);
                    drawCircle(ctx, game.gridH / 2 / 3, p_b);
                    ctx.translate(game.gridW / 6, game.gridH / 6);
                }
            });
            ctx.restore();
            if (false) {
                this.instance.flows.forEach(function (f, i) {
                    var l = String.fromCharCode("a".charCodeAt(0) + i);
                    f.forEach(function (p, i) {
                        var c = game.gridToCanvas(p.x + 0.5, p.y + 0.5);
                        var txt = "" + l + i;
                        ctx.fillText(txt, c.x - ctx.measureText(txt).width / 2, c.y);
                    });
                });
            }
        };
        NormalStage.prototype.dragSequence = function (game, start) {
            var _this = this;
            var uf = this.userFlows;
            var flow = { index: this.instance.flowIndex(start), ps: [start] };
            uf = this.userFlows.with(flow);
            var subsequent = game.tiles.takeWhile(function (e) { return e.type == "mousemove"; }).distinctUntilChanged().takeUntil(game.tiles.filter(function (e) { return e.type == "mouseup"; }));
            return subsequent.scan({ good: false, flow: flow, uf: uf }, function (acc, box) {
                var ps = acc.flow.ps;
                var dup = games.Utils.indexOf(ps, Flow.Instance.equals.bind(Flow.Instance, box));
                if (typeof dup === 'number') {
                    var flow = {
                        ps: ps.slice(0, dup + 1),
                        index: acc.flow.index
                    };
                    return { good: false, flow: flow, uf: acc.uf.with(flow) };
                }
                if (!acc.good && _this.adjacent(ps[ps.length - 1], box) && !acc.uf.contains(box) && (!_this.instance.isStartOrEnd(box) || _this.instance.flowIndex(box) === acc.flow.index)) {
                    var flow = {
                        ps: ps.concat(box),
                        index: acc.flow.index
                    };
                    var isFinalised = _this.instance.isStartOrEnd(box) && _this.instance.flowIndex(box) === acc.flow.index;
                    return { good: isFinalised, flow: flow, uf: acc.uf.with(flow) };
                }
                return { good: acc.good, flow: acc.flow, uf: acc.uf };
            });
        };
        NormalStage.prototype.run = function (game) {
            var _this = this;
            var states = game.tiles.filter(function (e) { return e.type == "mousedown"; }).filter(function (start) { return _this.instance.isStartOrEnd(start); }).flatMap(function (start) {
                var messingWith = _this.instance.flowIndex(start);
                var onFail = _this.with(_this.userFlows.with({ ps: [], index: messingWith }));
                return _this.dragSequence(game, start).tap(function (s) { return _this.draw(game.ctx, game, s.flow); }).skipWhile(function (s) { return !s.good; }).last().map(function (state) { return _this.with(state.uf); }).catch(Rx.Observable.just(onFail));
            }).take(1);
            return states;
        };
        NormalStage.prototype.with = function (userFlows) {
            var s = new NormalStage(this.game, this.i + 1);
            s.instance = this.instance;
            s.userFlows = userFlows;
            return s;
        };
        NormalStage.prototype.adjacent = function (p1, p2) {
            return p1.x == p2.x && Math.abs(p1.y - p2.y) == 1 || p1.y == p2.y && Math.abs(p1.x - p2.x) == 1;
        };
        return NormalStage;
    })();
    var Start = (function (_super) {
        __extends(Start, _super);
        function Start(game) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            _super.call(this, game, args[0]);
            this.args = args;
        }
        Start.prototype.draw = function (ctx, game) {
        };
        Start.prototype.run = function (game) {
            return Rx.Observable.just(new NormalStage(game, this.args[0]));
        };
        return Start;
    })(NormalStage);
    Flow.Start = Start;
    var ScoreStage = (function () {
        function ScoreStage(points) {
            this.points = points;
        }
        ScoreStage.prototype.draw = function (ctx, game) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            var txt = "You scored " + this.points + " points!";
            ctx.font = "24px Arial";
            ctx.fillText(txt, ctx.canvas.width / 2 - ctx.measureText(txt).width / 2, ctx.canvas.height / 2);
            txt = "Click to restart";
            ctx.font = "18px Arial";
            ctx.fillText(txt, ctx.canvas.width / 2 - ctx.measureText(txt).width / 2, ctx.canvas.height / 2 + 100);
        };
        ScoreStage.prototype.run = function (game) {
            return Rx.Observable.just(new Start(game));
        };
        return ScoreStage;
    })();
})(Flow || (Flow = {}));
var data = $.getAsObservable("Flow/flows.txt", null, 'text').map(function (l) { return l.data; }).shareReplay(1);
Reveal.forSlide(function (s) { return s.currentSlide.id == 'g-flow'; }, function (s) {
    var canvas = $("#flow", s.currentSlide).get(0);
    var strField = function (key) { return $(key).onAsObservable("change").map(function (e) { return e.target['value']; }).startWith($(key).val()); };
    var numField = function (key) { return strField(key).map(function (v) { return parseInt(v); }); };
    return Rx.Observable.combineLatest(data, numField("#flow-n"), function (d, n) { return ({ n: n, data: d }); }).flatMap(function (o) {
        console.log(o);
        canvas.height = 40 * o.n;
        canvas.width = 40 * o.n;
        var g = new Flow.Game(canvas.getContext("2d"), o.n);
        g.data = o.data;
        return g.run(new Flow.Start(g));
    });
}).subscribe(function (e) {
});
var Flow;
(function (Flow) {
    var Game = (function (_super) {
        __extends(Game, _super);
        function Game(ctx, n) {
            var _this = this;
            if (n === void 0) { n = 5; }
            _super.call(this, n, n, [ctx.canvas.width, ctx.canvas.height]);
            this.ctx = ctx;
            this.level = 0;
            this.data = '';
            this.gridSize = 0;
            this.mouse = $(this.ctx.canvas).onAsObservable("mousemove mousedown mouseup").map(function (e) {
                var p = games.Utils.getMousePos(e.target, e);
                return {
                    position: _this.canvasToGrid(p.x, p.y),
                    originalEvent: null,
                    type: e.type
                };
            });
            this.tiles = this.mouse.map(function (e) { return ({
                x: ~~e.position.x,
                y: ~~e.position.y,
                type: e.type
            }); });
            this.gridSize = this.gridH;
        }
        Game.prototype.run = function (initial) {
            var _this = this;
            return Rx.Observable.just(initial).flatScan(function (s) {
                s.draw(_this.ctx, _this);
                return s.run(_this).doAction(function (_) { return _.draw(_this.ctx, _this); }).last();
            }, function (s) { return Rx.Observable.just(s); }).tap(function (s) { return s.draw(_this.ctx, _this); }, function (e) { return console.error(e); }, function () { return console.log("Completed game"); });
        };
        Game.prototype.instance = function (n) {
            if (n === void 0) { n = 4; }
            if (!this.data)
                throw new Error("Load data first");
            var cs = this.data.split(/[\s\n]/);
            var frames = [];
            for (var i = 0; i < cs.length; i++) {
                var size = parseInt(cs[i]);
                if (isNaN(size))
                    continue;
                i += 2;
                frames[size] = cs.slice(i, i + size).join("\n");
                i += size - 1;
            }
            var flows = [];
            frames[n].split(/\n/g).forEach(function (l, y) {
                l.split("").forEach(function (t, x) {
                    if (t != ".") {
                        flows[t] = flows[t] || [];
                        flows[t].push(new math.Point2D(x, y));
                    }
                });
            });
            return new Flow.Instance(Object.keys(flows).map(function (k) { return flows[k]; }));
        };
        return Game;
    })(games.GridMapping);
    Flow.Game = Game;
})(Flow || (Flow = {}));
var LookAndSay;
(function (LookAndSay) {
    var State = (function () {
        function State(value, count) {
            this.value = value;
            this.count = count;
        }
        State.prototype.increase = function () {
            return new State(this.value, this.count + 1);
        };
        return State;
    })();
    function iteration(source) {
        return source.concat(Rx.Observable.just(-1)).scan([], function (state, value) {
            if (state.length === 0) {
                return [new State(value, 1)];
            }
            else if ((state[0]).value === value) {
                return [(state[0]).increase()];
            }
            else {
                return [new State(value, 1), state[0]];
            }
        }).filter(function (s) { return s.length > 1; }).flatMap(function (s) { return Rx.Observable.just(s[1].count).concat(Rx.Observable.just(s[1].value)); });
    }
    LookAndSay.iteration = iteration;
    function run() {
        return Rx.Observable.interval(100).scan(Rx.Observable.just(1), function (seq, _) { return iteration(seq).zip(Rx.Observable.interval(100), function (a, _) { return a; }); }).startWith(Rx.Observable.just(1));
    }
    LookAndSay.run = run;
    $("<div class='overlay' style='text-align:center; line-height: 400px'>Click to start Look and Say sequence</div>").insertAfter($("#lookandsay")).css({
        left: $("#lookandsay").position().left,
        top: $("#lookandsay").position().top,
        position: "absolute",
        zIndex: 10,
        width: $("#lookandsay").parent().width(),
        height: $("#lookandsay").parent().height()
    });
    $("#lookandsay + .overlay").one('click', function () {
        $(this).remove();
        run().take(40).subscribe(function (seq) {
            var i = 0, list = $("<li></li>");
            list.appendTo($("#lookandsay"));
            seq.subscribe(function (n) {
                list.append($("<span>" + (i !== 0 ? ", " : "") + n + "</span>"));
                i++;
            });
        });
    });
    function id(a) {
        return a;
    }
})(LookAndSay || (LookAndSay = {}));
var Minesweeper;
(function (Minesweeper) {
    var Box = (function (_super) {
        __extends(Box, _super);
        function Box(centre, size, events, ctx) {
            var _this = this;
            _super.call(this, centre, size, size);
            this.ctx = ctx;
            this.neighbors = [];
            this.revealed = false;
            this.flagged = false;
            this.revealer = new Rx.BehaviorSubject(null);
            this.Reveal = this.revealer.filter(function (_) { return _ != null; }).take(1);
            this.is_bomb = false;
            this.events = null;
            this.events = events;
            events.subscribe(function (ev) {
                if (ev.originalEvent.which === 3)
                    _this.toggleFlag();
                else
                    _this.reveal();
                _this.draw(ctx);
            });
        }
        Box.prototype.toggleFlag = function () {
            if (!this.revealed)
                this.flagged = !this.flagged;
        };
        Box.prototype.reveal = function () {
            if (this.flagged)
                return true;
            if (!this.revealed) {
                this.revealed = true;
                if (!this.is_bomb)
                    this.revealer.onNext(this.neighbors.filter(function (n) { return n.is_bomb; }).length == 0);
            }
            return true;
        };
        Box.prototype.initialize = function () {
            var _this = this;
            this.is_bomb = Math.random() < .05;
            Rx.Observable.merge(this.neighbors.map(function (_) { return _.Reveal; })).filter(function (x) { return x; }).subscribe(function (_) { return _this.reveal() && _this.draw(_this.ctx); });
        };
        Box.prototype.addNeighbour = function (neighbor) {
            this.neighbors.push(neighbor);
            neighbor.neighbors.push(this);
        };
        Box.prototype.draw = function (ctx) {
            if (this.revealed) {
                if (this.is_bomb)
                    ctx.fillStyle = "red";
                else
                    ctx.fillStyle = "#ccc";
                _super.prototype.draw.call(this, ctx, false, false);
                if (this.is_bomb) {
                    this.fillText(ctx, String.fromCharCode(0xf1e2), "black", "FontAwesome");
                }
                if (!this.is_bomb) {
                    var neighbor_bombs = this.neighbors.filter(function (n) { return n.is_bomb; }).length;
                    if (neighbor_bombs > 0) {
                        this.fillText(ctx, neighbor_bombs.toString(), "blue", "Arial");
                    }
                }
            }
            else {
                ctx.fillStyle = "white";
                _super.prototype.draw.call(this, ctx, false, false);
                if (this.flagged) {
                    this.fillText(ctx, String.fromCharCode(0xf024), "green", "FontAwesome");
                }
            }
            ctx.save();
            ctx.strokeStyle = "black";
            this.lines().forEach(function (l) {
                ctx.beginPath();
                ctx.moveTo(l._0.x, l._0.y);
                ctx.lineTo(l._1.x, l._1.y);
                ctx.stroke();
            });
            ctx.restore();
        };
        Box.prototype.fillText = function (ctx, text, color, font) {
            ctx.font = this.height - 4 + "px " + font;
            ctx.fillStyle = color;
            ctx.fillText(text, this.centre.x - ctx.measureText(text).width / 2, this.centre.y + this.height / 2 - 4);
        };
        return Box;
    })(math.Box);
    var NormalStage = (function () {
        function NormalStage(points, boxes, game) {
            this.points = points;
            this.boxes = boxes;
            this.resources = [];
            if (!boxes.length) {
                var boxGrid = new games.Grid(function (x, y) {
                    var b = new Box(game.gridToCanvasPoint(x + .5, y + .5), game.gridSize, game.eventsFor('box', x, y), game.ctx);
                    boxes.push(b);
                    return b;
                });
                for (var i = 0, x = 0, y = 0; y < game.rows; i++, x = (x + 1) % game.cols, y = x == 0 ? y + 1 : y) {
                    var b = boxGrid.get(x, y);
                    if (x > 0)
                        b.addNeighbour(boxGrid.get(x - 1, y));
                    if (y > 0)
                        b.addNeighbour(boxGrid.get(x, y - 1));
                    if (x > 0 && y > 0)
                        b.addNeighbour(boxGrid.get(x - 1, y - 1));
                    if (x > 0 && y < game.rows - 1)
                        b.addNeighbour(boxGrid.get(x - 1, y + 1));
                }
                for (var i = 0, x = 0, y = 0; y < game.rows; i++, x = (x + 1) % game.cols, y = x == 0 ? y + 1 : y) {
                    boxGrid.get(x, y).initialize();
                }
            }
            this.resources.push(Rx.Observable.merge(boxes.map(function (_) { return _.events; })).subscribe(function (e) { return e; }));
        }
        NormalStage.prototype.draw = function (ctx, game) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            this.boxes.forEach(function (b) { return b.draw(ctx); });
        };
        NormalStage.prototype.run = function (game) {
            var _this = this;
            return Rx.Observable.using(function () { return _this; }, function (resources) {
                return Rx.Observable.never();
            });
        };
        NormalStage.prototype.dispose = function () {
            this.resources.forEach(function (r) { return r.dispose(); });
        };
        return NormalStage;
    })();
    var Start = (function (_super) {
        __extends(Start, _super);
        function Start(game) {
            _super.call(this, 0, [], game);
        }
        Start.prototype.draw = function (ctx, game) {
            _super.prototype.draw.call(this, ctx, game);
        };
        return Start;
    })(NormalStage);
    var Game = (function (_super) {
        __extends(Game, _super);
        function Game(ctx) {
            var _this = this;
            _super.call(this, 12, 12, [ctx.canvas.width, ctx.canvas.height]);
            this.ctx = ctx;
            this.level = 0;
            this.mouse = $(this.ctx.canvas).onAsObservable("mousemove mousedown mouseup").map(function (e) {
                var p = Game.getMousePos(e.target, e);
                return {
                    position: _this.canvasToGrid(p.x, p.y),
                    originalEvent: e,
                    type: e.type
                };
            });
            this.dots = this.mouse.filter(function (m) { return m.type == 'mousedown'; });
            this.gridSize = this.gridW;
        }
        Game.prototype.eventsFor = function (type, x, y) {
            return this.dots.filter(function (e) {
                return Math.floor(e.position.x) == x && Math.floor(e.position.y) == y;
            });
        };
        Game.prototype.run = function () {
            var _this = this;
            return Rx.Observable.just(new Start(this)).flatScan(function (s) {
                s.draw(_this.ctx, _this);
                return s.run(_this).doAction(function (_) { return _.draw(_this.ctx, _this); }).last();
            }, function (s) { return Rx.Observable.just(s); }).tap(function (s) { return s.draw(_this.ctx, _this); }, function (e) { return console.error(e); }, function () { return console.log("Completed game"); });
        };
        Game.getMousePos = function (canvas, evt) {
            var rect = canvas.getBoundingClientRect();
            return {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top
            };
        };
        return Game;
    })(games.GridMapping);
    Minesweeper.Game = Game;
})(Minesweeper || (Minesweeper = {}));
Reveal.forSlide(function (s) { return s.currentSlide.id == 'g-minesweeper'; }, function (s) {
    var canvas = $("#minesweeper", s.currentSlide).get(0);
    return new Minesweeper.Game(canvas.getContext("2d")).run();
}).subscribe(function (e) {
    console.log("Loaded Minesweeper");
});
var Pong;
(function (Pong) {
    var Paddle = (function () {
        function Paddle(x, y, direction) {
            this.x = x;
            this.y = y;
            this.direction = direction;
            this.speed = 90;
        }
        Paddle.prototype.box = function () {
            return new math.Box(new math.Point2D(this.x, this.y), 20, 60);
        };
        Paddle.prototype.update = function (deltaT, direction) {
            return new Paddle(this.x, this.y += deltaT * direction * this.speed, 0);
        };
        Paddle.prototype.draw = function (ctx) {
            this.box().draw(ctx);
        };
        Paddle.prototype.lines = function () {
            return this.box().lines();
        };
        Paddle.initialLeft = function () {
            return new Paddle(30, 200, 0);
        };
        Paddle.initialRight = function () {
            return new Paddle(770, 200, 0);
        };
        return Paddle;
    })();
    Pong.Paddle = Paddle;
    var LeftScore = (function () {
        function LeftScore(name, message) {
            this.name = name;
            this.message = message;
        }
        return LeftScore;
    })();
    Pong.LeftScore = LeftScore;
    var RightScore = (function () {
        function RightScore(name, message) {
            this.name = name;
            this.message = message;
        }
        return RightScore;
    })();
    Pong.RightScore = RightScore;
    var Ball = (function () {
        function Ball(x, y, velocityX, velocityY) {
            this.x = x;
            this.y = y;
            this.velocityX = velocityX;
            this.velocityY = velocityY;
        }
        Ball.prototype.box = function () {
            return new math.Box(new math.Point2D(this.x, this.y), 20, 20);
        };
        Ball.anyIntersection = function (a, b) {
            return a.lines().reduce(function (p, al) { return p || b.lines().reduce(function (h, bl) {
                if (h)
                    return h;
                var i = bl.intersects(al);
                return i && i.length && i;
            }, false); }, false);
        };
        Ball.prototype.update = function (deltaT, leftPaddle, rightPaddle) {
            var box = this.box();
            if (this.x < 0)
                throw new RightScore('Score right');
            if (this.x > 800)
                throw new LeftScore('Score left');
            if (this.y < box.height / 2 || this.y > 400 - box.height / 2)
                this.velocityY = -this.velocityY;
            if (Ball.anyIntersection(box, leftPaddle.box()))
                this.velocityX = -this.velocityX * 1.1;
            if (Ball.anyIntersection(box, rightPaddle.box()))
                this.velocityX = -this.velocityX * 1.1;
            return new Ball(this.x + this.velocityX, this.y + this.velocityY, this.velocityX, this.velocityY);
        };
        Ball.prototype.draw = function (ctx) {
            this.box().draw(ctx);
        };
        Ball.prototype.lines = function () {
            return this.box().lines();
        };
        Ball.initial = function (direction) {
            if (direction === void 0) { direction = 1; }
            return new Ball(400, 200, 5 * direction, 5 - (Math.random() * 10));
        };
        return Ball;
    })();
    Pong.Ball = Ball;
    var Game = (function () {
        function Game(ctx) {
            var _this = this;
            this.ctx = ctx;
            this.leftPaddleKeys = [
                "W".charCodeAt(0),
                "S".charCodeAt(0)
            ];
            this.rightPaddleKeys = [
                38,
                40
            ];
            this.leftPaddleObservable = $(document.body).onAsObservable("keyup keydown").filter(function (ke) { return _this.leftPaddleKeys.indexOf(ke['keyCode']) != -1; }).map(function (ke) {
                if (ke.type == 'keyup')
                    return 0;
                if (ke['keyCode'] == _this.leftPaddleKeys[0])
                    return 1;
                if (ke['keyCode'] == _this.leftPaddleKeys[1])
                    return -1;
            });
            this.rightPaddleObservable = $(document.body).onAsObservable("keyup keydown").filter(function (ke) { return _this.rightPaddleKeys.indexOf(ke['keyCode']) != -1; }).map(function (ke) {
                if (ke.type == 'keyup')
                    return 0;
                if (ke['keyCode'] == _this.rightPaddleKeys[0])
                    return 1;
                if (ke['keyCode'] == _this.rightPaddleKeys[1])
                    return -1;
            });
            ctx.fillStyle = 'white';
            var t = Rx.Observable.interval(1000 / 30, Rx.Scheduler.requestAnimationFrame);
            var timeEvents = t.map(function (_) { return ({ t: new Date().getTime() }); }).scan({ date: new Date().getTime(), dt: 0, event: null }, function (prev, e) {
                return { dt: (e.t - prev.date) / 1000, date: e.t, event: e };
            }).skip(1);
            var paddleEvents = timeEvents.withLatestFrom(this.leftPaddleObservable.startWith(0), function (t, dir) { return ({ dt: t.dt, left: dir }); }).withLatestFrom(this.rightPaddleObservable.startWith(0), function (e, dir) { return ({ dt: e.dt, left: e.left, right: dir }); });
            var scanned = paddleEvents.scan({ scoreLeft: 0, left: Paddle.initialLeft(), scoreRight: 0, right: Paddle.initialRight(), ball: Ball.initial() }, function (state, e) {
                var left = 0, right = 0;
                try {
                    var ball = state.ball.update(e.dt, state.left, state.right);
                }
                catch (e) {
                    if (e instanceof RightScore) {
                        var ball = Ball.initial(-1);
                        right = 1;
                    }
                    if (e instanceof LeftScore) {
                        var ball = Ball.initial(1);
                        left = 1;
                    }
                }
                return {
                    scoreLeft: state.scoreLeft + left,
                    left: state.left.update(e.dt, e.left),
                    scoreRight: state.scoreRight + right,
                    right: state.right.update(e.dt, e.right),
                    ball: ball
                };
            });
            $(ctx.canvas).onAsObservable("click").take(1).flatMap(function (_) { return scanned; }).subscribe(function (state) {
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                state.left.draw(ctx);
                state.right.draw(ctx);
                state.ball.draw(ctx);
                ctx.font = "50px silkscreennormal";
                var leftText = state.scoreLeft.toString();
                var rightText = state.scoreRight.toString();
                ctx.fillText(leftText, ctx.canvas.width / 2 - 40 - ctx.measureText(leftText).width, 65);
                ctx.fillText(rightText, ctx.canvas.width / 2 + 40, 65);
            });
            Ball.initial().draw(ctx);
        }
        return Game;
    })();
    Pong.Game = Game;
})(Pong || (Pong = {}));
Rx.Observable.just($("#pong").get(0)).take(1).subscribe(function (c) {
    var ctx = c.getContext("2d");
    var game = new Pong.Game(ctx);
});
var diameter = 15, screenW = 600, screenH = 450;
var Point2D = (function () {
    function Point2D(x, y) {
        this.x = x;
        this.y = y;
        this.size = 1;
    }
    Point2D.prototype.move = function (dir) {
        return new Point2D(this.x + dir[0], this.y + dir[1]);
    };
    Point2D.prototype.loopRound = function (w, h) {
        return new Point2D((this.x + w) % w, (this.y + h) % h);
    };
    Point2D.prototype.equals = function (other) {
        return this.x == other.x && this.y == other.y;
    };
    Point2D.random = function () {
        return new Point2D(~~(Math.random() * screenW / diameter), ~~(Math.random() * screenH / diameter));
    };
    Point2D.prototype.belly = function () {
        var p = new Point2D(this.x, this.y);
        p.size = 1.4;
        return p;
    };
    return Point2D;
})();
var State = (function () {
    function State(snake, candy, status) {
        if (candy === void 0) { candy = null; }
        if (status === void 0) { status = 0 /* loaded */; }
        this.snake = snake;
        this.candy = candy;
        this.status = status;
    }
    State.initial = function () {
        return new State(snakelet(~~(screenW / diameter / 2), ~~(screenH / diameter / 2), 5), [Point2D.random()]);
    };
    return State;
})();
var GameState;
(function (GameState) {
    GameState[GameState["loaded"] = 0] = "loaded";
    GameState[GameState["running"] = 1] = "running";
    GameState[GameState["gameover"] = 2] = "gameover";
})(GameState || (GameState = {}));
var KeyCodes;
(function (KeyCodes) {
    KeyCodes[KeyCodes["up"] = 38] = "up";
    KeyCodes[KeyCodes["down"] = 40] = "down";
    KeyCodes[KeyCodes["left"] = 37] = "left";
    KeyCodes[KeyCodes["right"] = 39] = "right";
    KeyCodes[KeyCodes["w"] = "W".charCodeAt(0)] = "w";
    KeyCodes[KeyCodes["s"] = "S".charCodeAt(0)] = "s";
    KeyCodes[KeyCodes["a"] = "A".charCodeAt(0)] = "a";
    KeyCodes[KeyCodes["d"] = "D".charCodeAt(0)] = "d";
})(KeyCodes || (KeyCodes = {}));
var Snake = (function () {
    function Snake() {
        this.keyEvent = $(document.body).keydownAsObservable();
    }
    Snake.prototype.start = function (canvas) {
        var ctx = canvas.getContext("2d");
        var disposables = [];
        var d = $(document.body).keydownAsObservable().filter(function (ke) { return ke.keyCode === 38 /* up */ || ke.keyCode === 40 /* down */ || ke.keyCode === 32; }).subscribe(function (e) {
            e.preventDefault();
            e.stopPropagation();
        });
        disposables.push(d);
        var directions = this.keyEvent.filter(function (ke) { return !!KeyCodes[ke.keyCode]; }).do(function (e) {
            e.preventDefault();
            e.stopPropagation();
        }).map(function (ke) { return toDirection(ke.keyCode); }).distinctUntilChanged(null, function (a, b) { return a[0] == b[0] || a[1] == b[1]; }).filter(function (d) { return d.length == 2; }).startWith([]);
        var restart = this.keyEvent.filter(function (ke) { return ke.keyCode == 13; }).select(function (_) { return true; });
        var candySource = new Rx.Subject();
        var candy = candySource.startWith(0).select(function (_) { return ~~(Math.pow(Math.random(), 6) * 4) + 1; }).select(Monster).select(function (ps) {
            var origin = Point2D.random();
            return ps.map(function (p) { return p.move([origin.x, origin.y]); });
        }).select(function (m) {
            if (m.length == 1)
                return Rx.Observable.just(m);
            return Rx.Observable.just(m).merge(Rx.Observable.just([]).delay(4000).selectMany(function (_) { return Rx.Observable.throw(new Error("Timeout")); }));
        }).switch().retry().replay(function (_) { return _; }, 1);
        var windowState = $(window).onAsObservable("focus blur").select(function (e) { return e.type; }).startWith("focus").replay(function (_) { return _; }, 1);
        var game = Rx.Observable.interval(100).withLatestFrom(windowState, function (t, w) { return [t, w]; }).filter(function (l) { return l[1] == 'focus'; }).select(function (l) { return l[0]; }).withLatestFrom(directions, function (t, d) { return d; }).withLatestFrom(candy, function (d, c) { return [d, c]; }).scan(State.initial(), function (s, tuple) { return eat(move(s, tuple[0]), tuple[1], candySource); });
        disposables.push(candySource);
        return Rx.Observable.using(function () {
            return new Rx.CompositeDisposable(disposables);
        }, function (resource) {
            return restart.startWith(true).select(function (_) { return game; }).switch().tap(draw.bind(this, ctx));
        });
    };
    return Snake;
})();
function snakelet(x, y, length) {
    if (length === void 0) { length = 5; }
    return Array.apply(null, { length: length }).map(function (_) { return new Point2D(x, y); });
}
function draw(ctx, state) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    state.snake.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(p.x * diameter + diameter / 2, p.y * diameter + diameter / 2, diameter * p.size / 2, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'green';
        ctx.fill();
    });
    state.candy.forEach(function (p) {
        ctx.beginPath();
        if (state.candy.length == 1)
            ctx.arc(p.x * diameter + diameter / 2, p.y * diameter + diameter / 2, diameter / 2, 0, 2 * Math.PI, false);
        else
            ctx.rect(p.x * diameter, p.y * diameter, diameter, diameter);
        ctx.fillStyle = 'orange';
        ctx.fill();
    });
    if (state.status == 0 /* loaded */) {
        var help, m;
        ctx.font = "40px Arial";
        help = "Press any arrow/wasd key";
        m = ctx.measureText(help);
        ctx.fillText(help, screenW / 2 - m.width / 2, screenH / 2);
        help = "to move";
        m = ctx.measureText(help);
        ctx.fillText(help, screenW / 2 - m.width / 2, screenH / 2 + 60);
    }
    if (state.status == 2 /* gameover */) {
        ctx.font = "60px Arial";
        var m = ctx.measureText("GAME OVER");
        ctx.fillText("GAME OVER", screenW / 2 - m.width / 2, screenH / 2 - 30);
        ctx.font = "40px Arial";
        var m = ctx.measureText("Press enter to restart");
        ctx.fillText("Press enter to restart", screenW / 2 - m.width / 2, screenH / 2 + 20);
    }
}
function eat(state, candy, subject) {
    if (candy.map(function (p) { return state.snake[0].equals(p); }).filter(function (_) { return _; }).length) {
        subject.onNext(0);
        return new State([state.snake[0].belly()].concat(state.snake.slice(1).concat(afill(candy.length, function (_) { return state.snake[state.snake.length - 1]; }))), [], state.status);
    }
    return new State(state.snake, candy, state.status);
}
function move(state, direction) {
    if (state.status == 1 /* running */ || state.status == 0 /* loaded */ && direction.length != 0) {
        var newPos = state.snake[0].move(direction).loopRound(screenW / diameter, screenH / diameter);
        if (state.snake.slice(0, -1).reduce(function (p, c) { return p || newPos.equals(c); }, false)) {
            return new State(state.snake, state.candy, 2 /* gameover */);
        }
        return new State([newPos].concat(state.snake.slice(0, -1)), state.candy, 1 /* running */);
    }
    return state;
}
function toDirection(keyCode) {
    switch (keyCode) {
        case KeyCodes.w:
        case 38 /* up */: return [0, -1];
        case KeyCodes.s:
        case 40 /* down */: return [0, 1];
        case KeyCodes.a:
        case 37 /* left */: return [-1, 0];
        case KeyCodes.d:
        case 39 /* right */: return [1, 0];
        default: return [];
    }
}
function Monster(size) {
    var d = Math.ceil(Math.sqrt(size));
    return afill(size, function (_) { return 1; }).concat(afill(d * d - size, function (_) { return 0; })).sort(function (_) { return Math.random() - 0.5 > 0; }).map(function (v, i) { return v ? new Point2D(~~(i / d), i % d) : null; }).filter(function (_) { return !!_; });
}
function afill(n, v) {
    return Array.apply(null, new Array(n)).map(function (_, i) { return v(i); });
}
Reveal.forSlide(function (s) { return $(s.currentSlide).closest('#g-snake').get().length > 0; }, function (s) {
    console.log("Snake");
    var canvas = $("#snake").get(0);
    return new Snake().start(canvas);
}).subscribe(function (e) {
});
var Typer;
(function (Typer) {
    var Game = (function () {
        function Game(ctx) {
            this.ctx = ctx;
            this.story = [
                "Hello",
                "Welcome to Typeria",
                "a peaceful planet",
                "in the Keymeria universe",
                "Or at least",
                "It WAS peaceful",
                "We are under attack",
                "and we need your help"
            ];
        }
        Game.prototype.run = function () {
            var _this = this;
            var gameEvents = $(document.body).keydownAsObservable().filter(function (ke) { return "A".charCodeAt(0) <= ke.keyCode && ke.keyCode <= "Z".charCodeAt(0) || ke.keyCode === 32; }).do(function (e) { return e.stopPropagation(); }).scan({ sentence: this.story.shift(), level: 1, shoot: false }, function (state, ke) {
                var sentence = state.sentence;
                var level = state.level;
                var shoot = false;
                if (String.fromCharCode(ke.keyCode) === sentence.substring(0, 1).toUpperCase()) {
                    sentence = sentence.substring(1);
                    shoot = true;
                    if (sentence.charCodeAt(0) === 32)
                        sentence = sentence.substring(1);
                }
                if (sentence.length == 0) {
                    sentence = _this.story.shift();
                    level += 1;
                }
                return {
                    sentence: sentence,
                    level: level,
                    shoot: shoot
                };
            }).share();
            var bullet = gameEvents.filter(function (state) { return state.shoot; }).map(function (_) { return 1; });
            var t = Rx.Observable.interval(1000 / 30, Rx.Scheduler.requestAnimationFrame);
            var timeEvents = t.map(function (_) { return ({ t: new Date().getTime() }); }).scan({ date: new Date().getTime(), dt: 0, event: null }, function (prev, e) {
                return { dt: (e.t - prev.date) / 1000, date: e.t, event: e };
            }).skip(1).share();
            function bullet_sequence(id) {
                return timeEvents.scan(300, function (p, e) { return p - e.dt * Game.bulletSpeed; }).takeWhile(function (p) { return p > 0; }).map(function (p) { return [id, p]; });
            }
            var bullets = bullet.map(function (_, i) { return bullet_sequence(i); }).mergeAll();
            var shipAndBullets = timeEvents.withLatestFrom(bullets.buffer(timeEvents), function (x, y) { return ({ dt: x.dt, bullets: y }); }).scan({ shipPostion: 0, bullets: [], lastHit: -1 }, function (prev, e) {
                var noBulletsHitting = e.bullets.filter(function (b) { return b[1] < prev.shipPostion && prev.lastHit < b[0]; }).length;
                var bulletsRemaining = e.bullets.filter(function (b) { return b[1] > prev.shipPostion; });
                return {
                    shipPostion: prev.shipPostion + e.dt * Game.shipSpeed - noBulletsHitting * Game.shootBack,
                    bullets: bulletsRemaining,
                    lastHit: prev.lastHit + noBulletsHitting
                };
            }).takeWhile(function (e) { return e.shipPostion < 300; });
            return shipAndBullets.withLatestFrom(gameEvents, function (shipBullets, state) { return ({ state: state, shipBullets: shipBullets }); }).tap(function (x) {
                var state = x.state;
                var ctx = _this.ctx;
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.fillStyle = 'black';
                var ship = new math.Box(new math.Point2D(150, x.shipBullets.shipPostion - 30), 20, 60);
                ship.draw(ctx, false, false);
                x.shipBullets.bullets.forEach(function (b) {
                    var bullet = new math.Box(new math.Point2D(150, b[1]), 5, 5);
                    bullet.draw(ctx, false, false);
                });
                ctx.beginPath();
                ctx.moveTo(0, 300);
                ctx.lineTo(ctx.canvas.width, 300);
                ctx.stroke();
                ctx.font = "20px silkscreennormal";
                var text = state.sentence;
                _this.ctx.fillText(text, _this.ctx.canvas.width / 2 - _this.ctx.measureText(text).width / 2, 355);
            });
        };
        Game.shipSpeed = 37;
        Game.bulletSpeed = 100;
        Game.shootBack = 6;
        return Game;
    })();
    Typer.Game = Game;
})(Typer || (Typer = {}));
Reveal.forSlide(function (s) { return s.currentSlide.id == 'g-typer'; }, function (s) {
    var canvas = $("#typer", s.currentSlide).get(0);
    return new Typer.Game(canvas.getContext("2d")).run();
}).subscribe(function (e) {
    console.log("Loaded Typer");
});
//# sourceMappingURL=build.js.map
/// <reference path="../ts/jquery/jquery.d.ts" />
/// <reference path="../ts/rx/rx.all.d.ts" />
/// <reference path="../ts/rx-jquery/rx.jquery.d.ts" />
/// <reference path="../ts/pullrequestmaterial.d.ts" />

// Physics inspiration: http://www.ibm.com/developerworks/library/wa-build2dphysicsengine/

var diameter = 20,
    screenW = 800,
    screenH = 600;

interface Game {
    start(canvas: HTMLCanvasElement): void
}

enum KeyCodes {
    up = 38,
    down = 40,
    left = 37,
    right = 39,
    w = "W".charCodeAt(0),
    s = "S".charCodeAt(0),
    a = "A".charCodeAt(0),
    d = "D".charCodeAt(0)
}

class Platformer implements Game {
    keyEvent = $(document.body).keyupAsObservable()

    start(canvas:HTMLCanvasElement):void {
        var ctx = canvas.getContext("2d");
    }
}

function toDirection(keyCode: number){
    switch(keyCode){
        case KeyCodes.w:
        case KeyCodes.up: return [0,-1];
        case KeyCodes.s:
        case KeyCodes.down: return [0,1];
        case KeyCodes.a:
        case KeyCodes.left: return [-1,0];
        case KeyCodes.d:
        case KeyCodes.right: return [1,0];
        default: return [];
    }
}

new Platformer().start(<HTMLCanvasElement>document.getElementsByTagName("canvas")[0])
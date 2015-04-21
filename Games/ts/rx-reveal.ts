/// <reference path="rx/rx.all.d.ts" />

declare module reveal {
    export interface Slide {
        indexh: number;
        indexv: number;
        previousSlide: HTMLElement;
        currentSlide: HTMLElement;
    }

    interface RevealStatic {
        onReady: Rx.Observable<Slide>;
        onSlideChanged: Rx.Observable<Slide>;
        addEventListener: (eventName: string, handler: (e: Event) => void) => void;
        removeEventListener: (eventName: string, handler: (e: Event) => void) => void;

        forSlide<T>(selector: (s: Slide) => boolean, generator: (s: Slide) => Rx.Observable<T>): Rx.Observable<void>;
    }
}

declare var Reveal: reveal.RevealStatic;

function revealEvent(name: string) {
    return Rx.Observable.fromEventPattern<reveal.Slide>(
        (h: (e: Event) => void) => Reveal.addEventListener(name, h),
        (h: (e: Event) => void) => Reveal.removeEventListener(name, h)
    );
}

Reveal.onSlideChanged = revealEvent("slidechanged");
Reveal.onReady = revealEvent("ready");

Reveal.forSlide = function <T>(selector: (e: reveal.Slide) => boolean, generator: (s: reveal.Slide) => Rx.Observable<T>) {
    return Rx.Observable.merge(Reveal.onReady, Reveal.onSlideChanged)
        .filter(selector)
        .flatMap(e => generator(e).takeUntil(
            Reveal.onSlideChanged.filter(e2 => e2.indexh != e.indexh)
        ));
}

Reveal.addEventListener('ready', function(event) {
    // event.currentSlide, event.indexh, event.indexv
});
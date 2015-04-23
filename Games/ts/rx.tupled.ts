/// <reference path="rx/rx.all.d.ts" />

function toArray(){
	return Array.prototype.slice.call(arguments[0]);
}

Function.prototype['curry'] = function() {
    if (arguments.length<1) {
        return this; //nothing to curry with - return function
    }
    var __method = this;
    var args = toArray.call(this, arguments);
    return function() {
        return __method.apply(this, args.concat(toArray.call(this, arguments)));
    }
}

var AnonymousObservable = Rx['AnonymousObservable'];
Rx.Observable['prototype']['sliding'] = function(size: number, skip: number){
	var source = this;
	return new AnonymousObservable(observer => {
		var window = [];
    	return source.subscribe(value => {
    		window.push(value);
    		if(window.length == size){
    			observer.onNext(window);
    			window = window.slice(skip);
    		} 
    	},
        (e) => observer.onError(e),
        () => observer.onCompleted());
	});
};

Rx.Observable['prototype']['tupled'] = Rx['Observable']['prototype']['sliding']['curry'](2,1);

declare module Rx {
     
	export interface Observable<T> {		
		sliding<T>(size: number, skip: number): Observable<T[]>;
		tupled<T>(): Observable<T[]>;
	}

}
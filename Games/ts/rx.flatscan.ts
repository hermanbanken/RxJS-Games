///<reference path="rx/rx.d.ts"/>

// @see: http://stackoverflow.com/questions/15297977/recursive-fan-out-in-reactive-extensions

declare module Rx {
    
    export interface Observable<T> {		
		flatScan<T,R>(iterator: (prev: T) => Observable<R>, resultSelector: (val: R) => Observable<T>): Observable<T>;
	}

}

Rx.Observable['prototype']['flatScan'] = function<T,R>(iterator: (seed: T) => Rx.Observable<R>, produce: (val: R) => Rx.Observable<T>){
  var source = this;
  return Rx.Observable.create(function(observer){
  	console.log("Outer");
    var ret = new Rx.CompositeDisposable();
  
  	function compl(d){
  		ret.remove(d);
  		if(ret.length == 0) observer.onCompleted();
  	}

  	function ssub(o, n){
  		var disp = new Rx.SingleAssignmentDisposable();
  		ret.add(disp);
  		disp.current = o.subscribe(n, observer.onError, () => compl(disp));
  	}

  	function rsub(o, n){
  		var disp = new Rx.SingleAssignmentDisposable();
  		ret.add(disp);
  		disp.current = o.subscribe(n, observer.onError, () => compl(disp));
  	}

  	function recurse(s){
	  	console.log("Recurse");
	  	ssub(iterator(s), r => {
	  		observer.onNext(r);
	  		rsub(produce(r), recurse);
  		})
	}

  	ssub(source, recurse);
  	return ret;
  });
};
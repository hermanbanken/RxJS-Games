///<reference path="rx/rx.d.ts"/>

declare module Rx {
    
    export interface Observable<T> {		
		withLatestFrom<T2, TResult>(second: Observable<T2>, resultSelector: (v1: T, v2: T2) => TResult): Observable<TResult>;
		withLatestFrom<T2, T3, TResult>(second: Observable<T2>, third: Observable<T3>, resultSelector: (v1: T, v2: T2, v3: T3) => TResult): Observable<TResult>;
		retryWhen<T2>(notifier: (errors: Observable<Error>) => Observable<T2>): Observable<T>;
	
//		flatScan<TResult>(seed: TResult, resultSelector: (value: T, acc: TResult) => Observable<TResult>): Observable<TResult>;
	}
}
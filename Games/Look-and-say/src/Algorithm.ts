/// <reference path="../../ts/rx/rx.all.d.ts" />
/// <reference path="../../ts/rx-jquery/rx.jquery.d.ts" />

module LookAndSay {

class State {
	constructor(public value: number, public count: number){}
	increase(){ return new State(this.value, this.count+1); }
}

export function iteration(source: Rx.Observable<number>){
	var it = source.concat(Rx.Observable.just(-1)).scan<State[]>([], (state, value) => {
		if(state.length === 0){
			return [new State(value, 1)];
		} else if((state[0]).value === value) {
			return [(state[0]).increase()];
		} else {
			return [new State(value, 1), state[0]];
		}
	}).filter(s => s.length > 1).flatMap(s => Rx.Observable.of(s[1].count, s[1].value));
	return it;
}

export function run() {
	return Rx.Observable.interval(1000).scan(
		Rx.Observable.just(1),
		(seq, _) => iteration(seq)
	).startWith(Rx.Observable.just(1));
}

run().take(10).subscribe(seq => seq.toArray().subscribe(list => console.log(list)));

iteration(Rx.Observable.fromArray([1, 1, 1, 3, 2, 1, 3, 2, 1, 1])).toArray().subscribe(list => {
	console.log("Should be equal", list, [3, 1, 1, 3, 1, 2, 1, 1, 1, 3, 1, 2, 2, 1])
})

iteration(iteration(iteration(iteration(iteration(iteration(iteration(iteration(Rx.Observable.just(1))))))))).toArray().subscribe(l => console.log("Was", l));

function id<A>(a: A): A {
	return a;
}
// var LookAndSay = Rx.Observable.just(1).flatMap()
}
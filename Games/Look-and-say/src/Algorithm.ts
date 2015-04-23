/// <reference path="../../ts/rx/rx.all.d.ts" />
/// <reference path="../../ts/rx-jquery/rx.jquery.d.ts" />

module LookAndSay {

class State {
	constructor(public value: number, public count: number){}
	increase(){ return new State(this.value, this.count+1); }
}

export function iteration(source: Rx.Observable<number>){
	return source.concat(Rx.Observable.just(-1))
	.scan<State[]>([], (state, value) => {
		if(state.length === 0){
			return [new State(value, 1)];
		} else if((state[0]).value === value) {
			return [(state[0]).increase()];
		} else {
			return [new State(value, 1), state[0]];
		}
	}).filter(s => s.length > 1)
	.flatMap(s => Rx.Observable.just(s[1].count).concat(Rx.Observable.just(s[1].value)));
}

export function run() {
	return Rx.Observable.interval(100).scan(
		Rx.Observable.just(1),
		(seq, _) => iteration(seq).zip(Rx.Observable.interval(100), (a,_) => a)
	).startWith(Rx.Observable.just(1));
}

$("<div class='overlay' style='text-align:center; line-height: 400px'>Click to start Look and Say sequence</div>")
	.insertAfter($("#lookandsay"))
	.css({
		left: $("#lookandsay").position().left,
		top: $("#lookandsay").position().top,
		position: "absolute",
		zIndex: 10,
		width: $("#lookandsay").parent().width(),
		height: $("#lookandsay").parent().height()
	});

$("#lookandsay + .overlay").one('click', function(){
	$(this).remove();
	run().take(40).subscribe(seq => {
		var i = 0, list = $("<li></li>");
		list.appendTo($("#lookandsay"));
		seq.subscribe(n => { list.append($("<span>"+(i !== 0 ? ", " : "") + n+"</span>")); i++; });
	});
});

function id<A>(a: A): A { 
	return a;
}

}
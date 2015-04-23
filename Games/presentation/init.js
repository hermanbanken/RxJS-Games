// Full list of configuration options available at:
// https://github.com/hakimel/reveal.js#configuration
Reveal.initialize({
	controls: true,
	progress: true,
	history: true,
	center: true,
	touch: false,
	overview: false,
	transition: 'slide', // none/fade/slide/convex/concave/zoom
	// keyboardCondition: function(){
	// 	console.log("keyboardCondition");
	// 	if(window.event.keyCode == 219 || window.event.keyCode == 221)
	// 		return true;
	// 	if(window.event.shiftKey){
	// 		return true;
	// 	}
	// 	return false;
	// },
	minScale: 0.1,
    maxScale: 1,
	keyboard: {
		219: 'prev',
		221: 'next',
		83: null,
		37: null, // left/right for games
		38: null,
		39: null, // left/right for games
		40: null,
		32: null, // SPACE for games
		//13: 'next', // go to the next slide when the ENTER key is pressed
		//27: function() {}, // do something custom when ESC is pressed
		//32: null // don't do anything when SPACE is pressed (i.e. disable a reveal.js default binding)
	},
	// Optional reveal.js plugins
	dependencies: [
		{ src: 'node_modules/reveal.js/lib/js/classList.js', condition: function() { return !document.body.classList; } },
		{ src: 'node_modules/reveal.js/plugin/markdown/marked.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
		{ src: 'node_modules/reveal.js/plugin/markdown/markdown.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
		{ src: 'plugin/highlight/highlight.js', async: true, condition: function() { return !!document.querySelector( 'pre code' ); }, callback: function() { hljs.initHighlightingOnLoad(); } },
		//{ src: 'node_modules/reveal.js/plugin/zoom-js/zoom.js', async: true },
		{ src: 'node_modules/reveal.js/plugin/notes/notes.js', async: true }
	]
});
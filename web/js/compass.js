var current_document;

function updateConf() {
	UV.DEFAULT_MIME_TYPES = [
		"text/plain",
		"application/pdf"
	];
}

function loadDocument(_id) {
	current_document = new CompassDocument({ _id : _id });
	
	try {
		current_document.updateInfo();
	} catch(err) {
		console.warn("COULD NOT LOAD WHOLE DOCUMENT AT THIS TIME");
		console.warn(err);
	}
}

(function($) {
	$(function() {
		var css_stub = $(document.createElement('link'))
			.attr({
				'rel' : "stylesheet",
				'type' : "text/css",
				'media' : "screen"
			});

		_.each(['bootstrap.min', 'compass', 'visualsearch-datauri', 'visualsearch'],
			function(c) {
				var css = $(css_stub).clone();
				css.attr('href', "/web/css/" + c + ".css");
				document.getElementsByTagName("head")[0].appendChild(css.get(0));
			}
		);
		
		var conf = $(document.createElement('script'))
			.attr({
				'type' : "text/javascript",
				'src' : "/web/js/conf.js?t=" + new Date().getTime()
			});
		
		document.getElementsByTagName("head")[0].appendChild(conf.get(0));
	});
})(jQuery);
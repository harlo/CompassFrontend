var cp_user;

(function($) {
	$(function() {
		var css = $(document.createElement('link'))
			.attr({
				'rel' : "stylesheet",
				'type' : "text/css",
				'href' : "/web/css/compass.css"
			});
		
		document.getElementsByTagName("head")[0].appendChild(css.get(0));
		setTimeout(function() {
			cp_user = new CompassUser();
		}, 1000);
	});
})(jQuery);
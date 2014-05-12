var document_browser, visual_search;

function initDocumentBrowser() {
	doInnerAjax("documents", "post", null, function(json) {
		json = JSON.parse(json.responseText);

		if(json.result == 200) {
			document_browser = new CompassDocumentBrowser({
				root_el : "#cp_document_browser_holder",
				data: json.data.documents
			});
		}
	});
}

(function($) {
	$(function() {
		var css_stub = $(document.createElement('link'))
			.attr({
				'rel' : "stylesheet",
				'type' : "text/css",
				'media' : "screen"
			});
		
		_.each(['visualsearch-datauri', 'visualsearch'], function(c) {
			var css = $(css_stub).clone();
			css.attr('href', "/web/css/" + c + ".css");
			document.getElementsByTagName("head")[0].appendChild(css.get(0));
		});
		
		visual_search = VS.init({
			container : $("#cp_document_search"),
			query : '',
			callbacks: {
				search: function(query, search_collection) {},
				facetMatches: function(callback) {
					callback(['facet_1', 'facet_2', { label : "facet_3" , category : 'loc'}]);
				},
				valueMatches: function(facet, search_term, callback) {}
			}
		});
		window.setTimeout(initDocumentBrowser, 300);
	});
})(jQuery);
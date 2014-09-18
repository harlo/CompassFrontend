var doc_search, result_browser;

function initKeywordSearch() {
	doc_search = new CompassKeywordSearch();
	
	if(window.location.search == "") { return; }

	displaySearchResults(doc_search.perform(window.location.search));
}

function displaySearchResults(search_result) {
	if(search_result == null || search_result.result != 200) {
		failOut($("#cp_keyword_results"), "No search results.");
		return;
	}

	// TODO: search_term from searchable_text

	search_results = search_result.data;

	var search_docs = _.unique(_.pluck(search_results.documents, "media_id"));
	var result_data = {
		search_terms : "",
		mention_count : search_results.count,
		doc_count : _.size(search_docs),
		data : _.sortBy(search_results.documents, function(res) { return res.index_in_page; }).reverse()
	};

	result_browser = new CompassResultBrowser(result_data);

	var callback = function() {
		var max_pages = Math.ceil(search_results.count/UV.DEFAULT_PAGINATION);
		result_browser.set('max_pages', max_pages);
		result_browser.set('result_holder', $($("#cp_results_browser").children('ul')[0]));

		// TODO: threaded!
		result_browser.showWordStats();

		if(search_results.count > UV.DEFAULT_PAGINATION) {
			insertTemplate("result_pagination.html", { max_pages : max_pages },
				$("#cp_results_browser_pagination"), function() {
					result_browser.setResultPage(0);
				});
		} else {
			result_browser.setResultPage(0);
		}
	}
	
	insertTemplate("results_match.html", result_data, 
		$("#cp_keyword_results"), callback, "/web/layout/views/search/");

}

function onConfLoaded() {
	console.info("CONF LOADED...");

	window.setTimeout(function() {
		initKeywordSearch();
	}, 200);
}

(function($) {
	try {
		updateConf();
	} catch(err) {
		console.warn(err);
		console.warn("no updateConf()");
	}

	try {
		onConfLoaded();
	} catch(err) {
		console.warn(err);
		console.warn("no onConfLoaded");
	}
})(jQuery);
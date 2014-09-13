var doc_search, result_browser;

function initKeywordSearch() {
	doc_search = new CompassKeywordSearch();
}

function displaySearchResults(search_results, search_term) {
	var search_docs = _.unique(_.pluck(search_results.documents, "media_id"));

	var result_data = {
		search_terms : search_term,
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
		$("#cp_keyword_results"), callback, "/web/layout/views/keyword/");
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
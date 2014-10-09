var doc_search, result_browser, search_terms;

function onSearchTermsDetected(search_terms) {
	window.search_terms = search_terms.substr(1, search_terms.length - 2);
}

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

	search_results = search_result.data;
	var result_data = {
		mention_count : search_results.count,
		data : _.sortBy(search_results.documents, function(res) { return res.index_in_page; }).reverse()
	};

	if(search_terms) {
		result_data = _.extend(result_data, {
			search_terms : search_terms,
			doc_count : _.size(_.unique(_.pluck(search_results.documents, "media_id"))) 
		}); 
	}

	result_browser = new CompassResultBrowser(result_data);

	var callback = function() {
		var max_pages = Math.ceil(search_results.count/UV.DEFAULT_PAGINATION);
		result_browser.set('max_pages', max_pages);
		result_browser.set('result_holder', $($("#cp_results_browser").children('ul')[0]));

		// TODO: threaded!
		if(search_results.count > UV.DEFAULT_PAGINATION) {
			insertTemplate("result_pagination.html", { max_pages : max_pages },
				$("#cp_results_browser_pagination"), function() {
					result_browser.setResultPage(0);
				});
		} else {
			result_browser.setResultPage(0);
		}

		if(result_browser.has('search_terms') && !(_.isEmpty(result_browser.get('search_terms')))) {
			var request_cluster = $(getTemplate("result_cluster.html"));
			$(request_cluster.find('#cp_result_cluster_ctrl')[0])
				.click(_.bind(result_browser.requestCluster, result_browser));
			
			$("#cp_results_browser").before(request_cluster);
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
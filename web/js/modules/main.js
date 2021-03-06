var doc_search, result_browser, search_terms, task_pipe;

function onSearchTermsDetected(search_terms) {
	window.search_terms = search_terms.substr(1, search_terms.length - 2);
}

function buildMultiDocPipe() {
	var el = search_terms ? $("#cp_result_unique_documents") : $("#cp_results_browser");

	var with_docs = _.map($(el).find('input:checked'), function(i) {
		var doc_id = $($(i).parent('li')[0]).attr('id')
			.replace("cp_in_batch_", "");
				
		return _.findWhere(result_browser.get(search_terms ? 'unique_documents' : 'data'),
			{ _id : doc_id });
	});

	if(!with_docs || _.size(with_docs) == 0) {
		return;
	}

	if(annex_channel) {
		_.each(with_docs, function(d) {
			annex_channel.get('message_map').push(
				_.bind(function(message) {
					if(this._id == message.doc_id) {
						sendToNotificationTray(message);
					}
				}, d));
		});
	}

	task_pipe.buildTaskPipeFrom($("#uv_reindex_custom"), with_docs);

}

function initKeywordSearch() {
	hideAnnex();
	
	doc_search = new CompassKeywordSearch();
	if(window.location.search == "") {
		showAnnex();
		try {
			annex_channel.get('message_map').push(
				_.bind(sendToNotificationTray, this));
		} catch(err) {
			console.warn(err);
		}

		return;
	}
	
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
		data : _.sortBy(search_results.documents, function(res) { return res.index_in_page; }).reverse(),
		unique_documents: _.map(_.unique(_.pluck(search_results.documents, "media_id")), function(d) {
			doc = doInnerAjax("documents", "post", { _id : d }, null, false);
			return doc.data;
		}, this)
	};

	if(search_terms) {
		result_data = _.extend(result_data, {
			search_terms : search_terms,
			doc_count : _.size(result_data.unique_documents) 
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
			var request_cluster = $(Mustache.to_html(
				getTemplate("result_cluster.html"), result_browser.get('unique_documents')));

			$('#cp_result_cluster_clear')
				.click(function() {
					$($("#cp_result_unique_documents").find('input'))
						.prop('checked', false);

				});

			var batch_ctrl = $(document.createElement('a'))
				.addClass('uv_button')
				.html("Batch Documents")
				.click(_.bind(result_browser.requestCluster, result_browser));
			
			$("#cp_results_browser").before(request_cluster);
			$($("#cp_results_ctrl").children('p')[0]).append(batch_ctrl);
		} else {
			$('#cp_result_cluster_clear')
				.click(function() {
					$($("#cp_results_browser").find('input'))
						.prop('checked', false);

				});
		}

		$('#cp_pipe_builder')
			.html(getTemplate("pipe_builder.html"))
			.css('display', 'none');

		task_pipe = new UnveillanceTaskPipe({'task_extras' : $("#uv_reindex_custom_extras")});
		window.onTaskPipeRequested = _.bind(buildMultiDocPipe, this);
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
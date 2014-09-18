function onConfLoaded() {
	console.info("CONF LOADED...");	
}

function onTagsRefreshed() {
	$("#cp_document_tags").html(
		_.map(document_browser.get('tags'), function(tag) {
			
			return $(document.createElement('a'))
				.html(tag.label)
				.click(function() {
					document_browser.removeTag(tag.label)
				});
		})
	);
}

function onReindexRequested(el, task_path) {
	var req = { _id : document_browser.get('data')._id };
	var waiter_span = $($(el).siblings('.uv_waiter')[0]);
	
	$(waiter_span)
		.html("(indexing...)")
		.css('display', 'block');
	
	var extra_data;
	try {
		extra_data = _.find(UV.MIME_TYPE_TASK_REQUIREMENTS, function(task_req) {
			return _.contains(_.keys(task_req), task_path);
		});
		_.extend(req, extra_data[task_path]);
	} catch(err) { console.info(err); }
	
	console.info(req);
	document_browser.reindex(function(json) {
		var result = "Could not reindex."

		json = JSON.parse(json.responseText);		
		if(json.result == 200) { result = "Document reindexed."; }
		
		$(waiter_span).html(result);
		window.setTimeout(function() { $(waiter_span).css('display', 'none'); }, 5000);
	}, req, task_path);
}

function onAssetRequested(file_name) {
	$("#uv_document_asset_viewer").append(
		$(document.createElement('textarea'))
			.html(getFileContent(this, 
				[".data", document_browser.get('data')._id, file_name].join("/")))
	);
}

(function($) {
	var content_sammy = $.sammy("#content", function() {
		this.get(/\/unveil\/[a-z0-9]{32}\/#(info|assets|reindexer)/, function() {
			document_browser.setInPanel(this.params.splat[0], $("#cp_document_viewer_panel"));
		});
	});

	$(function() {
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

		if(initDocumentBrowser()) {
			content_sammy.run();

			$("#cp_document_header").append(
				$(document.createElement('a'))
					.html(document_browser.get('data').file_alias)
					.click(function() {
						toggleElement("#cp_document_opts");
					}));
			
			$("#cp_document_opts").append(
				$(document.createElement('a'))
					.prop('href', "/document/" + document_browser.get('data')._id + "/")
					.html("Pretty Stuff..."));

			document_browser.refreshTags();
		} else {
			failOut($("#cp_document_header"), "Sorry, could not find this document.");
		}
	});
})(jQuery);
var document_viewer, entity_browser, initial_query;

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

function initDocumentViewer() {
	var search_terms = _.flatten(_.map(_.filter(window.location.search.substring(1).split("&"), function(s) {
			return s.split("=")[0] == "search_terms";
		}), function(s) {
			return s.split("=")[1].split(",");
		})
	);

	try {
		document_viewer = new CompassDocumentViewer({ highlight_terms : search_terms });

		$("#cp_document_header").append(
			$(document.createElement('a'))
				.html(document_browser.get('data').file_alias)
				.click(function() {
					toggleElement("#cp_document_opts");
				}));
		$("#cp_document_opts").append(
			$(document.createElement('a'))
				.prop('href', "/unveil/" + document_browser.get('data')._id + "/")
				.html("Under the hood..."));
	} catch(err) {
		console.warn(err);
		failOut($("#cp_document_header"), "Sorry, could not find this document.");
	}
}

function onConfLoaded() {
	console.info("CONF LOADED...");
}

(function($) {
	doc_id = _.filter(window.location.pathname.split("/"), function(segment) {
		return !_.contains(["", "document"], segment)})[0];
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
		window.setTimeout(function() {
			initDocumentViewer();	
		}, 200);
	}
})(jQuery);
var document_viewer, entity_browser, doc_id, initial_query;

function failOut() {
	$("#cp_document_header").html("Sorry, could not find this document.");
}

function initDocumentViewer() {
	var search_terms = _.flatten(_.map(_.filter(window.location.search.substring(1).split("&"), function(s) {
			return s.split("=")[0] == "search_terms";
		}), function(s) {
			return s.split("=")[1].split(",");
		})
	);

	try {
		document_viewer = new CompassDocumentViewer(_.extend(doInnerAjax("documents", "post", 
			{ _id : doc_id }, null, false), { highlight_terms : search_terms }));

		if(document_viewer.get('result') != 200) {
			failOut();
			return;
		}

		document_viewer.unset('result');
		$("#cp_document_header").html(document_viewer.get('data').file_alias);
	} catch(err) {
		console.warn(err);
		failOut();
	}
}

function onConfLoaded() {
	console.info("CONF LOADED...");

	window.setTimeout(function() {
		initDocumentViewer();
		
	}, 200);
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
})(jQuery);
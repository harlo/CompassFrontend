var doc_search, doc_batch;

function initDocumentBatch() {
	var batch_id = _.filter(window.location.pathname.split("/"), function(segment) {
		return !_.contains(["", "documents"], segment)})[0];

	console.info(batch_id);
	doc_batch = new CompassBatch({'_id' : batch_id});

	return false;
}

function initKeywordSearch() {
	hideAnnex();
	doc_search = new CompassKeywordSearch();
}

function onConfLoaded() {
	console.info("CONF LOADED...");

	window.setTimeout(function() {
		initKeywordSearch();
	}, 200);

	if(initDocumentBatch()) {
		/*
		if(annex_channel) {
			annex_channel.get('message_map').push(_.bind());
		}
		*/
	}
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
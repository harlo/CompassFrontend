var document_header, doc_search;

function onConfLoaded() {
	console.info("CONF LOADED...");	
}

function initDocumentViewer() {
	document_header = new CompassDocumentHeader();
	document_header.addOption({
		href: "/document/" + document_browser.get('data')._id + "/",
		html: "Pretty Stuff..."
	});
}

function initAnnexChannel() {
	if(!annex_channel) {
		return;
	}

	annex_channel.get('message_map').push(
		_.bind(updateTaskMessage, document_browser));
}

function updateTaskMessage(message) {
	console.info(message);

	if(message.doc_id && message.doc_id == this.get('data')._id) {
		sendToNotificationTray(message);
	}
}

function initKeywordSearch() {
	doc_search = new CompassKeywordSearch();
}

function onCustomTaskRequested(el) {
	var req = {
		_id : document_browser.get('data')._id,
		task_queue : "[" + $("#uv_reindex_custom").val().replace(/\s/g, '').split('\n').join(",") + "]"
	}

	try {
		var task_extras = JSON.parse($("#uv_reindex_custom_extras").val());
		if(task_extras) {
			req.task_extras = task_extras;
		}
	} catch(err) {
		console.warn(err);
	}
	
	console.info(req);
	var request = doInnerAjax("reindex", "post", req, null, false);

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
		if(json.result == 200) { result = "Reindex requested."; }
		
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
			initDocumentViewer();
			initAnnexChannel();
		} else {
			failOut($("#content"), "Sorry, could not find this document.");
		}

		hideAnnex();
		initKeywordSearch();
	});
})(jQuery);
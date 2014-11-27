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

function initTaskPipe() {
	
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
			initTaskPipe();
			initAnnexChannel();
		} else {
			failOut($("#content"), "Sorry, could not find this document.");
		}

		hideAnnex();
		initKeywordSearch();
	});
})(jQuery);
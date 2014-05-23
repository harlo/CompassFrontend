var document_browser, visual_search, current_batch;
var current_mode = "document";

function initDocumentBrowser() {	
	doInnerAjax("documents", "post", null, function(json) {
		try {
			json = JSON.parse(json.responseText);
			if(json.result == 200) {
				document_browser = new CompassDocumentBrowser({
					root_el : "#cp_document_browser_holder",
					data: json.data.documents
				});
			}
		} catch(err) { console.warn(err); }
	});
}

function initVisualSearch() {
	visual_search = new CompassVisualSearch();
}

function buildDocumentBatch(batch) {
	current_batch = new CompassBatch(batch);
	
	try {
		document_browser.applyBatch();
	} catch(err) {
		console.warn("COULD NOT APPLY BATCH AT THIS TIME");
		console.warn(err);
	}
}

function onViewerModeChanged(mode) {
	if(mode == current_mode) { return; }
	
	current_mode = mode;
	
	var data = null;
	var callback = null;
	
	if(current_mode == "batch" && current_batch) {
		data = { batch_size : current_batch.get('batch').length };
		callback = function(res) {
			try {
				current_batch.update();
			} catch(err) { 
				console.warn("COULD NOT UPDATE BATCH AT THIS TIME");
				console.warn(err);
			}
		};
	}
	
	insertTemplate(mode + "_status.html", data, 
		$("#cp_viewer_panel"), callback, "/web/layout/views/main/");
}

(function($) {
	var batch_sammy = $.sammy("#content", function() {
		this.get('#batch=:batch', function() {
			
			try {
				var batch = JSON.parse(
					"{ \"batch\" : " + 
					decodeURIComponent(this.params['batch']).replace(/\'/g, '"') + 
					"}");
				buildDocumentBatch(batch);
			} catch(err) { 
				console.warn(err);
				console.warn("COULD NOT BUILD DOC BATCH AT THIS TIME");
			}
			
		});
	});
	
	$(function() {
		var css_stub = $(document.createElement('link'))
			.attr({
				'rel' : "stylesheet",
				'type' : "text/css",
				'media' : "screen"
			});
		
		_.each(['visualsearch-datauri', 'visualsearch'], function(c) {
			var css = $(css_stub).clone();
			css.attr('href', "/web/css/" + c + ".css");
			document.getElementsByTagName("head")[0].appendChild(css.get(0));
		});
		
		batch_sammy.run();
		
		$.ajax({
			url: "/auth/drive",
			dataType: "json",
			method: "post",
			complete: function(json) {
				try {
					json = JSON.parse(json.responseText);
					if(json.result == 200) {
						if(json.data != true) { window.location = "/auth/drive"; }
					}
				} catch(err) {
					console.info(err);
				}
			}
		});
		
		window.setTimeout(function() {
			initDocumentBrowser();
			initVisualSearch();
		}, 2000);
	});
})(jQuery);
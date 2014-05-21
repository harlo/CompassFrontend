var document_browser, visual_search;

function initDocumentBrowser() {
	var documents = [];
	
	doInnerAjax("drive_client", "post", { action : "list_all" }, function(json) {
		try {
			json = JSON.parse(json.responseText);
			if(json.result == 200) {
				documents = _.map(json.data, function(file) {
					return {
						file_name: file.title,
						is_in_annex: false,
						_id : file.id,
						gd_info: file,
						mime_type: file.mimeType,
						date_created: moment(file.createdDate).valueOf()
					};
				});
				
				document_browser = new CompassDocumentBrowser({
					root_el : "#cp_document_browser_holder",
					data: documents
				});
				
				/*
				doInnerAjax("documents", "post", null, function(json) {
					try {
						json = JSON.parse(json.responseText);
						if(json.result == 200) {
							documents = _.union(
								documents, 
								_.map(json.data.documents, function(file) {
									return {
										file_name : file.file_name,
										is_in_annex: true,
										_id : file._id,
										an_info: file,
										mime_type: file.mime_type,
										date_created: file.date_added
									}
								})
							);
						}
					} catch(err) {}
					
					console.info(documents);
					document_browser = new CompassDocumentBrowser({
						root_el : "#cp_document_browser_holder",
						data: documents
					});
				});
				*/
				
			}
		} catch(err) {}
		
		
	});
}

(function($) {
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
		
		visual_search = VS.init({
			container : $("#cp_document_search"),
			query : '',
			callbacks: {
				search: function(query, search_collection) {},
				facetMatches: function(callback) {
					callback(['facet_1', 'facet_2', { label : "facet_3" , category : 'loc'}]);
				},
				valueMatches: function(facet, search_term, callback) {}
			}
		});
		
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
		
		window.setTimeout(initDocumentBrowser, 2000);
	});
})(jQuery);
var document_browser, visual_search, current_batch, current_mode, current_viz;

function initDocumentBrowser() {
	doInnerAjax("documents", "post",
		{ mime_type: "[" +  UV.DEFAULT_MIME_TYPES.join() + "]" },
		function(json) {
			if(json.status == 500) {
				console.info("No Annex Connection...");
				alert("Cannot connect to Annex...");
				return;
			}
		
			try {
				json = JSON.parse(json.responseText);
				if(json.result == 200) {
					document_browser = new CompassDocumentBrowser({
						root_el : "#cp_document_browser_holder",
						data: json.data.documents
					});
				
					if(current_document) { current_document.updateInfo(); }
				}
			} catch(err) { 
				console.warn("COULD NOT UPDATE DOCUMENT BROWSER AT THIS TIME");
				console.warn(err); 
			}
		}
	);
}

function initVisualSearch() {
	visual_search = new CompassVisualSearch();
}

function loadModule(module_name) {
	var module = _.findWhere(
		current_batch.get('modules'), { name : module_name });
	
	if(!module) { return; }
		
	var data = {};
	var data_handled = 0;
	var on_data_handled;
	
	var onDataHandled = function() {		
		getTemplate(module_name + ".html", function(res) {
			if(res.status != 200) { return; }
			
			$("#cp_module_output_holder").append(
				Mustache.to_html(res.responseText, data));
				
			if(on_data_handled) { on_data_handled.call(); }
			current_batch.set({ data : data });

			if(current_viz) {
				var viz = _.findWhere(current_viz, { id : module_name });
				
				try {
					if(viz && viz.build(data)) {
						_.each($("#cp_batch_common_funcs_list").children('li'),
							function(li) {
								var ctrl = $(li).find('a')[0];
								if(!ctrl) { return; }
								
								if(ctrl.onclick.toString().match(module_name)) {
									$(li).remove();
								}
							}
						);
					}
				} catch(err) {
					console.warn(err);
				}
				
				if(viz.invalid) { $(viz.root_el).remove(); }			
			}
			
		}, "/web/layout/views/module/", this);
	};
	
	if(_.contains(['text_locations'], module_name)) {
		on_data_handled = function() {
			_.each(_.keys(data), function(id) {
				data[id] = JSON.parse(data[id][0]);
			});
		};
	} else if(_.contains(['word_stats'], module_name)) {
		on_data_handled = function() {
			_.each(_.keys(data), function(id) {				
				data[id] = _.map(data[id], function(entity) {
					return JSON.parse(entity);
				});
			});
		};
	}
	
	_.each(module._ids, function(_id) {
		var doc = new UnveillanceDocument(
			_.findWhere(document_browser.get('data'), { _id : _id }));
		
		if(!doc) { return; }
		
		_.each(module.asset_tags, function(tag) {
			_.each(doc.getAssetsByTagName(tag), function(a) {
				try {
					var md_file = a.file_name;
					md_file = doc.get('base_path') + "/" + md_file;
				} catch(err) {
					console.warn("can't find asset for tag " + tag);
					console.warn(err);
					return;
				}

				try {
					getFileContent(data, md_file, function(res) {
						console.info("DATA FOR " + md_file);
						try {
							// if we can't get the file, we'll throw a 404 and nothing else.
							var uv_res = JSON.parse(res.responseText);
							if(_.keys(uv_res).length == 1 && uv_res.result) {
								console.error(res.responseText);
								delete uv_res;
								return;
							}
						} catch(err) {}
						
						if(uv_res) { delete uv_res; }
					
						try {
							if(!this[doc.get('_id')]) {
								this[doc.get('_id')] = [];
							}
							
							this[doc.get('_id')].push(res.responseText);
						} catch(err) {
							console.error(err);
							return;
						}
					
					}, data);
				} catch(err) {
					console.error(err);
					return;
				}
			});			
		});
		
		data_handled++;
		if(data_handled == module._ids.length) {
			onDataHandled();
		}
	});
}

function buildDocumentBatch(batch) {
	current_batch = new CompassBatch(batch);
	
	try {
		document_browser.applyBatch();
		console.info("OK APPLYING BATCH");
	} catch(err) {
		console.warn("COULD NOT APPLY BATCH AT THIS TIME");
		console.warn(err);
	}
}

function onViewerModeChanged(mode, force_reload) {
	if(!force_reload && mode == current_mode) { return; }
	
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
				return;
			}

			var load_mod = _.filter(current_batch.get('modules'), function(mod) { 
				return mod.default === true;
			});

			try {
				if(current_batch.has('initial_query')) {
					// get modules that should be loaded based off of the 'category' param
					_.each(current_batch.get('initial_query'), function(iq) {
						var asset_tag;
	
						if(_.contains(["text"], iq.category)) {
							asset_tag = UV.ASSET_TAGS.TXT_JSON;
						}
	
						if(!asset_tag) { return; }
	
						load_mod = _.union(load_mod, _.filter(current_batch.get('modules'),
							function(mod) {
								return mod.dependent == "initial_query" && _.contains(mod.asset_tags, asset_tag);
							}
						));
					});
				}
			} catch(err) {}

			_.each(load_mod, function(mod) { loadModule(mod.name); });
		};
	} else if(current_mode == "document" && current_document) {
		data = current_document.toJSON();
		callback = function(res) {
			try {
				current_document.initViewer();
				current_document.setInPanel('info');
				$("#cp_doc_batch_toggle").prop('checked', false);
			} catch(err) {
				console.warn("COULD NOT INIT DOCUMENT VIEWER AT THIS TIME");
				console.warn(err);
			}
		}
	}
	
	insertTemplate(mode + "_status.html", data, 
		$("#cp_viewer_panel"), callback, "/web/layout/views/main/");
}

function onConfLoaded() {
	initDocumentBrowser();
	
	window.setTimeout(function() {	
		initVisualSearch();
	}, 200);
}

(function($) {
	var content_sammy = $.sammy("#content", function() {
		this.get('/#analyze=:analyze', function() {
			try {
				var batch = JSON.parse(
					"{ \"batch\" : " + 
					decodeURIComponent(this.params['analyze']).replace(/\'/g, '"') + 
					"}"
				);
				buildDocumentBatch(batch);
			} catch(err) { 
				console.warn(err);
				console.warn("COULD NOT BUILD DOC BATCH AT THIS TIME");
			}
			
		});
		
		this.get('/#document/:_id', function() {
			loadDocument(this.params['_id']);
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
			console.warn("no onConfLoaded()");
		}
		
		content_sammy.run();
	});
})(jQuery);
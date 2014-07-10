var CompassDocument = UnveillanceDocument.extend({
	constructor: function() {
		UnveillanceDocument.prototype.constructor.apply(this, arguments);
	},
	updateInfo: function() {
		var updated_info = _.findWhere(
			document_browser.get('data'), { _id : this.get('_id') });
		
		if(updated_info) {
			this.set(updated_info);
			this.updateModules();
			onViewerModeChanged("document", force_reload=true);
		}
	},
	initViewer: function() {
		if(!this.has('available_views')) {
			this.set('available_views', []);
		}
	},
	requestReindex: function(el, task_path) {
		var req = { doc_id : this.get('_id') };
		var waiter_span = $($(el).siblings('.cp_waiter')[0]);
		
		$(waiter_span)
			.html("(indexing...)")
			.css('display', 'block');
		
		var extra_data;
		try {
			extra_data = _.find(UV.MIME_TYPE_TASK_REQUIREMENTS, function(task_req) {
				return _.contains(_.keys(task_req), task_path);
			});
			_.extend(req, extra_data[task_path]);
		} catch(err) {
			console.info(err);
		}
		
		console.info(req);
		UnveillanceDocument.prototype.requestReindex(function(json) {
			json = JSON.parse(json.responseText);
			var result = "Could not reindex."
			if(json.result == 200) {
				result = "Document reindexed.";
			}
			
			$(waiter_span).html(result);
			window.setTimeout(function() {
				$(waiter_span).css('display', 'none');
			}, 5000);
		}, req, task_path);
	},
	saveAsset: function() {
	
	},
	addMetadata: function(el) {
		if(!window.CompassUserAdmin || !current_user) { return; }
		
		var key = $("#cp_metadata_stub_" + el).find('input[name=cp_metadata_key]')[0];
		var value = $("#cp_metadata_stub_" + el).find('input[name=cp_metadata_value]')[0];
				
		if(!key || $(key).val() == "") { return; }
		if(!value || $(value).val() == "") { return; }
		
		var k = $(key).val();
		var v = $(value).val();

		var metadata = current_user.getDirective("metadata");

		var kvp = _.findWhere(metadata, {
			key : k,
			media_id : current_document.get('_id')
		});
		
		if(!kvp) {
			kvp = { key : k, id: randomString(), media_id: current_document.get('_id') };
			try {
				metadata.push(kvp);
			} catch(err) {}
		}
		
		kvp.value = v;
		current_user.save();
		
		if(el == "stub") {
			var viewer_el = $(document.createElement('li'));
			insertTemplate("edit_metadata.html", kvp, viewer_el, function() {
				$("#cp_document_metadata_list").prepend(viewer_el);
				$(key).val("");
				$(value).val("");
			});
		} else {
			var viewer_el = $("#cp_metadata_view_" + el).find('.cp_metadata_value')[0];
			$(viewer_el).html(v);
		}
		
		toggleElement("#cp_metadata_stub_" + el);	
	},
	
	updateModules: function() {
		var ctx = this;

		this.modules = _.map(
			_.filter(UV.ASSET_MODULES, function(mod) {			
				var doc_tags = _.flatten(_.pluck(ctx.get('assets'), 'tags'));			
				var common_tags = _.intersection(doc_tags, mod.asset_tags);
			
				return common_tags.length > 0;
			}), function(mod) {
				return _.extend(_.clone(mod), {
					_ids : [ctx.get('_id')]
				});
			}
		);
		
		_.each(this.modules, function(mod) {
			var build_func;
			var root_el_id = mod.name + "_" + ctx.get('_id');
			
			var root_el = $(document.createElement('div'))
				.attr('_id', root_el_id)
				.addClass('cp_pod');
			
			switch(mod.name) {
				case "word_stats":
					mod.viz = new CompassWordStats({
						'data' : _.map(
							ctx.getAssetDataForModule(mod.asset_tags), 
							function(asset) {
								return JSON.parse(asset);
							}
						),
						'root_el' : "#" + root_el_id
					});
					break;
			}
			
			console.info(mod);
		});
	},
	
	getAssetDataForModule: function(asset_tags) {
		var assets = [];
		var ctx = this;
		
		_.each(asset_tags, function(tag) {
			try {
				var asset_path = ctx.getAssetsByTagName(tag)[0].file_name;
			} catch(err) {
				console.warn(err);
				return;
			}
			
			getFileContent(this, ctx.get('base_path') + "/" + asset_path, function(res) {
				try {
					var check_res = JSON.parse(res.responseText);
					if(check_res.result && _.keys(check_res).length == 1) {
						return;
					}
					
					check_res = null;
					delete check_res;
				} catch(err) {}
				
				assets.push(res.responseText);
			});
		});
		
		
		if(assets.length > 0) {
			return assets;
		}
		
		return undefined;
	},
	
	setInPanel: function(asset, panel) {
		var callback = null;
		var asset_tmpl;
		var ctx = this;
		
		if(!panel) { panel = "#cp_document_view_panel"; }
		
		switch(asset) {
			case "info":
				if(window.UnveillanceUser && current_user) {
					callback = function() {
						var md_holders = [];
						var tmpl = "view_metadata.html";
						
						try {
							md_holders = _.map(
								current_user.getDirective("metadata"), 
								function(md) {
									return {
										key: md.key,
										value: md.value,
										id: randomString(),
										media_id: md.media_id
									}
								}
							);
						} catch(err) {
							console.info("NO COULD NOT FIND METADATA");
							console.warn(err);
						}
						
						if(window.CompassUserAdmin) {
							tmpl = "edit_metadata.html";
							md_holders.push({ id : "stub" });
						}
						
						_.each(md_holders, function(md) {
							var add_li = $(document.createElement('li'));
							insertTemplate(tmpl, md, add_li, function() {
								$("#cp_document_metadata_list").append(add_li);
							});
						});
						
						_.each(ctx.modules, function(mod) {
							//$("#cp_document_module_holder").append(mod.viz);
						});
					}
				}
				
				break;
			case "reindex":
				callback = function() {
					var tmpl = _.template('<% _.each(tasks, function(task) { %> <li><a onclick="current_document.requestReindex(this, \'<%= task.path %>\');"><%= task.desc %></a><span style="display:none;" class="cp_waiter"></span></li> <% }) %>');
					var tasks = _.map(UV.MIME_TYPE_TASKS[ctx.get('mime_type')], function(task) {
						return {
							path : task,
							doc_id : ctx.get('_id'),
							desc: task
						}
					});
					
					$("#cp_reindex_list").html(tmpl({ tasks : tasks }));
				};
				break;
			case "console":
				if(window.CompassConsole) {
					callback = function() {
						window.cp_console = new CompassConsole({
							documents : [current_document.toJSON()]
						});
					};
				}

				break;
		}
		
		if(asset_tmpl === undefined) { asset_tmpl = asset; }
		insertTemplate(
			asset_tmpl + ".html", this.toJSON(), 
			panel, callback, "/web/layout/views/document/");
		
		$.each($("#cp_document_main_ctrl").children('li'), function() {
			if($(this).attr('id') == "cp_d_" + asset) {
				$(this).addClass("cp_active");
			} else {
				$(this).removeClass("cp_active");
			}
		});		
	}
});
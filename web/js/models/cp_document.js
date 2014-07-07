var CompassDocument = UnveillanceDocument.extend({
	constructor: function() {
		UnveillanceDocument.prototype.constructor.apply(this, arguments);
	},
	updateInfo: function() {
		var updated_info = _.findWhere(
			document_browser.get('data'), { _id : this.get('_id') });
		
		if(updated_info) {
			this.set(updated_info);
			onViewerModeChanged("document", force_reload=true);
		}
	},
	initViewer: function() {
		if(!this.has('available_views')) {
			this.set('available_views', []);
		}
	},
	requestReindex: function(el, task_path) {
		var req = { _id : this.get('_id') }
		var waiter_span = $($(el).siblings('.cp_waiter')[0]);
		if(task_path) { _.extend(req, { task_path : task_path })}				
		
		$(waiter_span)
			.html("(indexing...)")
			.css('display', 'block');
		
		doInnerAjax("reindex", "post", req, function(json) {
			json = JSON.parse(json.responseText);
			var result = "Could not reindex."
			if(json.result == 200) {
				result = "Document reindexed.";
			}
			
			$(waiter_span).html(result);
			window.setTimeout(function() {
				$(waiter_span).css('display', 'none');
			}, 5000);
		});
	},
	setInPanel: function(asset, panel) {
		var callback = null;
		var asset_tmpl;
		var ctx = this;
		
		if(!panel) { panel = "#cp_document_view_panel"; }
		
		switch(asset) {
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
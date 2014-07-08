var CompassDocumentBrowser = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);
		
		this.root_el = this.get("root_el");
		this.unset("root_el");
		
		if(!this.has('data') || !this.get('data')) {
			$(this.root_el)
				.css('height', 'auto')
				.html("No files here");
			
			this.invalid = true;
			return;
		}
		
		var ctx = this;
		
		$("#cp_doc_batch_toggle").change(function() {
			if($(this).prop('checked')) {
				window.location = "#analyze=" + ctx.buildBatch()
			} else { 
				ctx.clearBatch();
				window.location = "#";
			}
		});

		getTemplate("browser_dir.html", function(res) {
			return (function(ctx) {
				if(res.status == 200) {
					ctx.dir_tmpl = res.responseText;
					getTemplate("browser_item.html", function(res) {
						if(res.status == 200) {
							ctx.item_tmpl = res.responseText;
							ctx.buildDocumentTree();
							ctx.applyBatch();
						}
					});
				}
			})(ctx);
		});
		
	},
	
	clearSelected: function() {
		var ctx = this;
		
		$.each($(this.root_el).find("input:checkbox"), function() {
			$(this).prop('checked', false);
			var _id = $($(this).parent()).attr('id').replace("cp_db_", "");
			ctx.get('batch').removeItem(_id);
		});
	},
	
	selectAllVisible: function() {
		var ctx = this;
		
		$.each($(this.root_el).find("input:checkbox"), function() {
			$(this).prop('checked', true);
		});
	},
	
	buildBatch: function() {
		var selected = [];
		$.each($(this.root_el).find(":checked"), function() {
			selected.push({ _id : $($(this)).parent().attr('id').replace("cp_db_", "")});
		});
		
		return JSON.stringify(selected);
	},
	
	clearBatch: function() {
		$.each($(this.root_el).find("input:checkbox"), function(cb) {
			$(cb).prop('checked', false);
			$(cb).unbind();
		});
		
		onViewerModeChanged("document");
		$("#cp_doc_batch_toggle").prop('checked', false);
	},
	
	applyBatch: function() {		
		if(!this.has('batch')) {
			if(current_batch) { this.set('batch', current_batch); }
		}
		
		if(!this.has('batch')) { return; }
		
		var batch = this.get('batch');
		var is_real_batch = false;
		
		_.each(batch.get('batch'), function(item) {
			if(item._id) {
				if(!is_real_batch) { is_real_batch = true; }				
				var el = $("#cp_db_" + item._id).children("input:checkbox")[0];
				$(el).prop('checked', true);				
			}
		});
		
		if(is_real_batch) {
			onViewerModeChanged("batch");
			
			$("#cp_doc_batch_toggle").prop('checked', true);
			$($(this.root_el).find("input:checkbox")).change(function() {
				var _id = $($(this).parent()).attr('id').replace("cp_db_", "");
				if($(this).prop('checked')) {
					batch.addItem(_id);
				} else {
					batch.removeItem(_id);
				}
			});
		}
	},
	
	buildDocumentTree: function(dir) {
		$(this.root_el).empty();
		this.clearBatch();
		
		if(!dir) { dir = this.get('data'); }
		
		
		var ctx = this;
		_.each(dir, function(doc) {
			var dir_name = "root";
			var path_segments = doc.file_name.split("/");
			
			if(path_segments.length > 1) {
				_.each(path_segments, function(segment) {
					// drill into segment to create path (TODO, maybe...)
				});
			}
			
			var dir_id = dir_name.replace(/W+/g, "_");
			var dir_el = $(ctx.root_el).find("#" + dir_id + "_list")[0];
			
			var dir_data = {
				dir_id : dir_id,
				dir_name : dir_name
			};
			
			if(!dir_el) {
				dir_el = Mustache.to_html(ctx.dir_tmpl, dir_data);
				$(ctx.root_el).append(dir_el);
				dir_el = $(ctx.root_el).find("#" + dir_id + "_list")[0];
			}
			
			$($(dir_el).children('ul.cp_dir_list')[0])
				.append(Mustache.to_html(ctx.item_tmpl, doc));
		});
	}
});
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
		getTemplate("browser_dir.html", function(res) {
			return (function(ctx) {
				if(res.status == 200) {
					ctx.dir_tmpl = res.responseText;
					getTemplate("browser_item.html", function(res) {
						if(res.status == 200) {
							ctx.item_tmpl = res.responseText;
							ctx.buildDocumentTree();
						}
					});
				}
			})(ctx);
		});
		
	},

	buildDocumentTree: function(dir) {
		console.info(this);
		if(!dir) { dir = this.get('data'); }
		
		var ctx = this;
		_.each(dir, function(doc) {
			var dir_name = "root";
			var path_segments = doc.file_name.split("/");
			
			if(path_segments.length > 1) {
				_.each(path_segments, function(segment) {
					// drill into segment to create path
				});
			}
			
			var dir_id = dir_name.replace(/W+/g, "_");
			var dir_el = $(ctx.root_el).find("#" + dir_id + "_list")[0];
			if(!dir_el) {
				dir_el = Mustache.to_html(ctx.dir_tmpl, {
					dir_id : dir_id,
					dir_name : dir_name
				});
				
				$(ctx.root_el).append(dir_el);
			}
						
			$($(dir_el).children('ul.cp_dir_list')[0])
				.append(Mustache.to_html(ctx.item_tmpl, doc));
		});
	}
});
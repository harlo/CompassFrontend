var CompassWordStats = UnveillanceViz.extend({
	constructor: function() {
		UnveillanceViz.prototype.constructor.apply(this, arguments);
		
		try {
			delete this.invalid;
		} catch(err) {}
	},
	build: function(data) {
		if(data) { this.set('data', data); }
		if(!this.has('data') || !this.get('data') || this.get('data').length == 0) {
			this.invalid = true;
			return false;
		}

		this.set('max_pages', _.max(
			_.map(this.get('data'), function(doc) {
				return doc[0].length;
			})
		));

		if(this.get('data').length > 1) {
			this.set('global_keywords', _.intersection(
				_.map(this.get('data'), function(vals, key) {
					return vals[0];
				})
			));
		}

		_.each(this.get('data'), function(vals, key) {
			// add a crossfilter object for quicker parsing
			vals[2] = vals[1].uv_page_map;
			delete vals[1].uv_page_map;

			vals[1] = crossfilter(_.map(vals[1], function(v, k) {
				return { word : k, count: v};
			}));

			$(this.root_el).append(
				$(document.createElement('div'))
					.attr('id', "cp_word_graph_" + key)
					.addClass("cp_word_graph")
			);

			// split into max_pages slices

			// bubble up any globally common words

			//this.setDimension(null, true);

		}, this);

		this.setDimension(null, true);


		// for all the docs, sort by the most prominent words unless we have an initial query
		
		return true;
	},
	setDimension: function(words, redraw) {
		var d_func;

		if(!words) {
			d_func = function(d) { return d.count; };
		} else {
			d_func = function(d) { return d.word; };
		}

		_.each(this.get('data'), function(vals, key) {
			var dimension = vals[1].dimension(d_func);
			console.info(dimension.top(10));

			if(redraw) {
				console.info("redraw");
			}
		}, this);
		

		
	}
});
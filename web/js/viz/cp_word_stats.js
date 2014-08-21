var CompassWordStats = UnveillanceViz.extend({
	constructor: function() {
		UnveillanceViz.prototype.constructor.apply(this, arguments);
		
		try {
			delete this.invalid;
		} catch(err) {
			console.warn(err);
		}
	},
	build: function(data) {
		if(data) { this.set('data', data); }
		if(!this.has('data') || !this.get('data') || this.get('data').length == 0) {
			this.invalid = true;
			return false;
		}

		var first_mode = null;

		getTemplate("entity_li.html", function(html) {
			this.set('entity_li_tmpl', html.responseText);
		}, null, this);

		this.set({
			max_pages : _.max(_.map(this.get('data'), function(doc) { return doc[0].length; }))
		});

		if(_.size(this.get('data')) > 1) { this.set('global_keywords', []); }

		if(current_batch && current_batch.has('initial_query')) {
			var iq = _.findWhere(current_batch.get('initial_query'),
				{ category : "text" });
			
			if(iq) {
				if(!this.has('global_keywords')) { this.set('global_keywords', []); }
				
				var iq_words = iq.value.toLowerCase().replace(/\s/g, ',').replace(/,,/g, ',').split(',');

				this.get('global_keywords').concat(iq_words);
				first_mode = iq_words;
			}
		}

		var word_browser = $(document.createElement('div'))
			.attr('id', "cp_word_browser")
			.append($(document.createElement('ul')));

		_.each(this.get('data'), function(vals, key) {
			// add a crossfilter object for quicker parsing			
			vals.splice(2, 0, vals[1].uv_page_map);
			delete vals[1].uv_page_map;

			vals[1] = crossfilter(_.map(vals[1], function(v, k) {
				var hash = MD5(k);
				var entity = { label : k, count: v, color: getRandomColor(), hash: hash };

				if(v >= 10) {
					var wb_el = $(word_browser).find("li[rel='" + hash + "']")[0];

					if(!wb_el) {						
						$($(word_browser).children('ul')[0]).append(
							$(document.createElement('li'))
								.html(Mustache.to_html(this.get('entity_li_tmpl'), entity))
								.attr('rel', hash)
						);
					} else {
						if(this.has('global_keywords')) {
							this.get('global_keywords').push(k);
							var wb_count = $(wb_el).children('span.wb_count')[0];

							try {
								$(wb_count).html(Number($(wb_count).html()) + v);
							} catch(err) {
								console.warn(err);
							}
						}
					}
				}

				return entity;
			}, this)).dimension(function(d) { return d.count; });

			// the most amounts of words on a page, ever
			var frequency_max = crossfilter(vals[2])
				.dimension(function(d) { return d.frequency_max})
				.top(1)[0].frequency_max;

			vals[2] = crossfilter(vals[2]).dimension(function(d) { return d.index });

			var wg_id = "cp_word_graph_" + key;
			var word_graph = $(document.createElement('div'))
				.attr('id', wg_id)
				.addClass("cp_word_graph");

			$(this.root_el).append(word_graph);

			var width = $("#" + wg_id).width();
			var height = $("#" + wg_id).height();

			var wg_d3 = {
				root_el : "#" + wg_id,
				x : d3.scale.linear()
					.domain([0, this.get('max_pages')])
					.range([0, width]),
				y : d3.scale.linear()
					.domain([0, frequency_max])
					.range([0, height]),
				width : width,
				height : height,
				bar_width : width/this.get('max_pages')
			};

			var wg = d3.select(wg_d3.root_el)
				.append("svg")
				.attr({
					"width": width,
					"height": height,
					"class" : "cp_word_graph_" + key + "_svg"
				});

			
			vals.push(wg_d3);

			var bar = wg.selectAll("g")
				.data(vals[2].bottom(Infinity))
				.enter().append("g").attr({
					"transform" : function(d, i) {
						return "translate(" + (i * wg_d3.bar_width) + ", 0)";
					}
				});

			bar.append("rect")
				.attr({
					"width" : wg_d3.bar_width,
					"y" : function(d) { return height - wg_d3.y(d.frequency_max); },
					"height" : function(d) { return wg_d3.y(d.frequency_max); }
				});				
		}, this);

		sorted_li = $($(word_browser).children('ul')[0]).children('li').sort(function(a, b) {
			return Number($($(b).find('span.wb_count')[0]).html()) - Number($($(a).find('span.wb_count')[0]).html());
		});

		if(this.has('global_keywords')) {
			// if we're privileging the iq words, push them to the top of the list
			_.each(this.get('global_keywords'), function(gk) {
				var gk_el = $(sorted_li).find("li[rel='" + MD5(gk) + "']")[0];
				if(gk_el) {
					sorted_li.prepend(gk_el);
				}
			});

			first_mode = this.get('global_keywords');
		}
		
		$($($(word_browser).children('ul')[0]).children('li')).remove();
		$($(word_browser).children('ul')[0]).append(sorted_li);

		$(this.root_el).prepend(word_browser);
		this.setWordDimension(first_mode, true);		
		return true;
	},
	setWordDimension: function(mode, redraw) {
		var max_default_words = 10;
		var data_len = _.size(this.get('data'));

		if(data_len > max_default_words) {
			max_default_words = data_len;
		}

		var dim_data = [];
		if(!mode) {
			var words_per_doc = Math.ceil(max_default_words/data_len);			
			_.each(this.get('data'), function(vals, key) {
				dim_data = _.union(dim_data, vals[1].top(words_per_doc));
			}, this);

		} else {
			_.each(mode, function(m) {
				_.each(this.get('data'), function(vals, key) {
					dim_data.push(vals[1].filterExact(m))
				}, this);
			}, this);
		}

		_.each(dim_data, function(entity) {
			// highlight on the display
			$("#cp_wb_toggle_" + entity.hash).attr('checked', true);
			_.each(this.get('data'), function(vals, key) {
				var indexes = _.map(
					_.filter(vals[2].bottom(Infinity), function(e) {
						return _.findWhere(e.map, { word : entity.label }) ? true : false;
					}), function(e) {
						return { index : e.index, count: _.findWhere(e.map, { word : entity.label }).count };
					}, this);

				if(indexes.length == 0) { return; }

				try {
					var wg_d3 = _.last(vals);
					if(!wg_d3) { return; }

					var wg = d3.select(wg_d3.root_el)
						.append("svg")
						.attr({
							"width": wg_d3.width,
							"height": wg_d3.height,
							"class" : "cp_word_graph_" + entity.hash + "_svg"
						});
				} catch(err) { return; }

				var bar = wg.selectAll("g")
					.data(indexes)
					.enter().append("g").attr({
						"class" :  entity.hash,
						"transform" : function(d) {
							return "translate(" + (d.index * wg_d3.bar_width) + ", 0)";
						}
					});

				bar.append("rect")
					.style({
						"fill" : entity.color
					})
					.attr({
						"width" : wg_d3.bar_width,
						"y" : function(d) { return wg_d3.height - wg_d3.y(d.count); },
						"height" : function(d) { return wg_d3.y(d.count); }
					});
			}, this);

		}, this);
	}
});
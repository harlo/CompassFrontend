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

		var wb_label = $(document.createElement('h3')).html("words");
		var word_browser = $(document.createElement('div'))
			.attr('id', "cp_word_browser")
			.append([wb_label, $(document.createElement('ul'))]);

		var entity_browser;

		_.each(this.get('data'), function(vals, key) {
			// add a crossfilter object for quicker parsing			
			vals.splice(2, 0, vals[1].uv_page_map);
			delete vals[1].uv_page_map;

			vals[1] = crossfilter(_.map(vals[1], function(v, k) {
				var hash = MD5(String(k));
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

			// the rest are entities...
			// while has next, add to the entity browser (initing it if non-existent)
			var entity_data = _.initial(_.rest(vals, 3));
			if(_.size(entity_data) != 0) {
				entity_browser = $("#cp_entity_browser");
				var entity_browser_ul;

				if(!(_.size(entity_browser))) {
					entity_browser_ul = $(document.createElement('ul'));
					entity_browser = $(document.createElement('div'))
						.attr('id', "cp_entity_browser")
						.append(entity_browser_ul);
				} else { entity_browser_ul = $(entity_browser).children('ul')[0]; }
			}

			_.each(entity_data, function(val) {
				if(!val.uv_page_map) { return; }

				var uv_page_map = val.uv_page_map;
				delete val.uv_page_map;

				_.each(val, function(vals_, key_) {
					var ctx = this;
					
					var eb_label = $(document.createElement('h3')).html(key_);
					var eb_list = $(document.createElement('ul')).append(
						_.map(vals_, function(val_) {
							var hash = MD5(val_);
							var count = _.findWhere(uv_page_map, { entity : val_ }).count;
							var entity = { label : val_, count: count, color: getRandomColor(), hash: hash };

							var eb_el = $(entity_browser).find("li[rel='" + hash + "']")[0];
							if(!eb_el) {
								return $(document.createElement('li')).html(
									Mustache.to_html(ctx.get('entity_li_tmpl'), entity));
							} else {
								if(!ctx.has('global_entities')) {
									ctx.set('global_entities', []);
								}
								
								ctx.get('global_entities').push(val_);
								var eb_count = $(eb_el).children('span.wb_count')[0];

								try {
									$(eb_count).html(Number($(eb_count).html()) + count);
								} catch(err) {
									console.warn(err);
								}
							}

							return;
							
						})
					);

					$(entity_browser_ul).append($(document.createElement('li')).append([eb_label, eb_list]));
				}, this);

			}, this);
			

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

		var lists_to_sort = [word_browser];
		if(entity_browser) {
			var eb_lists = $($($(entity_browser).children('ul')[0]).children('li'));
			lists_to_sort = _.union(lists_to_sort, _.flatten(eb_lists));
		}

		_.each(lists_to_sort, function(el) {
			var sorted_li = $($(el).children('ul')[0]).children('li').sort(function(a, b) {
				return Number($($(b).find('span.wb_count')[0]).html()) - Number($($(a).find('span.wb_count')[0]).html()); 
			});

			$($($(el).children('ul')[0]).children('li')).remove();
			$($(el).children('ul')[0]).append(sorted_li);
		}, this);

		if(entity_browser) {
			$(this.root_el).prepend(entity_browser);
			this.setEntityDimension(this.has('global_entities') ? this.get('global_entities') : null, true);
		}
		
		$(this.root_el).prepend(word_browser);
		this.setWordDimension(this.has('global_keywords') ? this.get('global_keywords') : null, true);		
		return true;
	},
	highlightWord: function(hash) {
		$.each($("div.cp_word_graph").children('svg'), function(idx, item) {
			if($(item).hasClass("cp_word_stuck")) { return; }

			var z_index = 1;
			var opacity = 0.2;

			if($(item).attr('class') == "cp_word_graph_" + hash + "_svg") {
				z_index = 200;
				opacity = 1;
			}
			
			$(item).css({
				'z-index' : z_index,
				'opacity' : opacity
			})
		});
	},
	removeWord: function(word) {
		var hash = MD5(word);
		console.info("REMOVING WORD " + word);
		// unbind mouse events, add onchecked event
		// put its entry to the bottom of word browser
		// remove its svgs
	},
	toggleWord: function(el, word) {
		if($(el).is(':checked')) {
			this.addWord(word);
		} else {
			this.removeWord(word);
		}
	},
	stickWord: function(hash) {
		console.info("STICKING WORD AT " + hash);
		$(".cp_word_graph_" + hash + "_svg").addClass("cp_word_stuck");
		$("li[rel='" + hash + '"]').addClass("cp_word_stuck");
	},
	unstickWord: function(hash) {
		console.info("STICKING WORD AT " + hash);
		$(".cp_word_graph_" + hash + "_svg").removeClass("cp_word_stuck");
		$("li[rel='" + hash + '"]').removeClass("cp_word_stuck");
	},
	addWord: function(word) { 
		console.info("ADDING WORD: " + word);
		this.setWordDimension([word], false);
	},
	restoreWordHighlightDefaults: function() {
		console.info("RESTORING");
	},
	setEntityDimension: function(entities, redraw) {

	},
	setWordDimension: function(words, redraw) {
		var max_default_words = 10;
		var data_len = _.size(this.get('data'));

		if(data_len > max_default_words) {
			max_default_words = data_len;
		}

		var dim_data = [];
		if(!words) {
			var words_per_doc = Math.ceil(max_default_words/data_len);			
			_.each(this.get('data'), function(vals, key) {
				dim_data = _.union(dim_data, vals[1].top(words_per_doc));
			}, this);
		} else {
			// HERE IS WHERE WE START AGAIN TOMORROW...
			_.each(words, function(m) {
				_.each(this.get('data'), function(vals, key) {
					dim_data.push(vals[1].filterExact(m))
				}, this);
			}, this);


			console.info(dim_data);
		}

		var ctx = this;
		_.each(dim_data.sort(function(a, b) { return b.count + a.count; }), function(entity) {
			// highlight on the display
			
			var entity_li = $($("li[rel='" + entity.hash + "']")[0]);
			var entity_toggle = $("#cp_wb_toggle_" + entity.hash);

			$(entity_toggle).attr('checked', true);
			$(entity_toggle).on()

			$(entity_li)
				.mouseenter(function() {
					ctx.highlightWord(entity.hash);
				});

			$($("#cp_word_browser").children('ul')[0]).prepend(entity_li);

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
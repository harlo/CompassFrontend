var CompassDocumentViewer = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);

		this.set('sort_tmpl', getTemplate("document_viewer_sort.html"));

		if(this.loadPageMap()) {
			this.loadWordViz();

			if(this.loadEntities()) {
				this.loadEntityViz();
			}

			if(this.get('highlight_terms')) {
				window.setTimeout(_.bind(this.setHighlightTerms, this), 300);
			}
		}
	},
	setHighlightTerms: function() {
		_.each(this.get('highlight_terms'), function(term) {
			_.each(["keyword", "entity"], function(type) {					
				var el = $("#cp_" + type + "_handle_" + MD5(String(term)));
				if(el) {
					var i = $(el.find('input')[0]);

					i.prop('checked', true);
					this.sendToViz(i, term, type);
					$(el.parent()).prepend($(el));
				}

				delete el;
			}, this);
		}, this);
	},
	getAssetByTagName: function(tag_name) {
		try {
			return _.filter(this.get('data').assets, function(asset) {
				return _.contains(asset.tags, tag_name);
			}, this)[0];
		} catch(err) {console.warn(err); }

		return null;
	},
	addTag: function() {

	},
	removeTag: function() {

	},
	sortList: function(list, facet) {
		var sort_func;

		switch(facet) {
			case "checked":
				sort_func = function(a, b) {
					var b_ = $($(b).find('input')[0]).prop('checked');
					var a_ = $($(a).find('input')[0]).prop('checked');

					return b_ - a_;
				}
				break;
			case "word":
				sort_func = function(a, b) {
					var b_ = $($(b).find('span.cp_label')[0]).html();
					var a_ = $($(a).find('span.cp_label')[0]).html();

					if(a_ < b_) { return -1; }
					else if(a_ > b_) { return 1; }
					else { return 0; }
				}
				break;
			case "frequency_max":
				sort_func = function(a, b) {
					var b_ = Number($($(b).find('span.frequency_max')[0]).html());
					var a_ = Number($($(a).find('span.frequency_max')[0]).html());

					return b_ - a_;
				}
				break;
		}

		if(sort_func) {
			var sorted_li = $(list).children('li').sort(sort_func);
			$(list).html(sorted_li);
		}
	},
	clearAllSVGS: function() {
		_.each($("#cp_entity_browser").find('input'), function(el) { $(el).prop('checked', false); });
		_.each($("svg[class^='uv_svg_']"), function(svg) { this.hideSVG(svg); }, this);
	},
	revealSVG: function(svg) {
		$("svg[class^='uv_svg_']").css('z-index', 3);
		$(svg).css({
			'opacity' : 0.7,
			'z-index' : 100
		});
	},
	hideSVG: function(svg) {
		$(svg).css({
			'opacity' : 0,
			'z-index' : 3
		});
	},
	sendToViz: function(el, words, type, color) {
		if(_.isString(words)) { words = [words]; }
		var show_svg = $(el).prop('checked');

		_.each(words, function(word) {
			var data;
			
			var hash = "uv_svg_" + type + "_" + MD5(word);
			var has_svg = $("svg." + hash)[0];

			if(has_svg) {
				if(show_svg) { this.revealSVG(has_svg); }
				else { this.hideSVG(has_svg); }
				return;
			}

			if(!show_svg) { return; }

			if(!color) {
				try {
					color = $($(el).parent()).css('background-color');
				} catch(err) { console.warn(err); }
			}

			if(type == "keyword") {
				data = _.map(this.get('page_map').uv_page_map, function(d) {
					var word_match = _.findWhere(d.map, { word : word });
					var frequency_max = word_match ? word_match.count : 0;

					return { frequency_max: frequency_max };
				}, this);

				if(data) { this.setWordViz(hash, data, { "fill" : color }); }
			} else if(type == "entity") {
				data = _.findWhere(this.get('entities').uv_page_map, { entity : word } );
				if(data) { this.setEntityViz(hash, data, { "fill" : color }); }
			}
		}, this);
	},
	setEntityViz: function(class_name, data, style) {
		var ctx = this.get('entity_viz');
		var frequency_max = _.size($(ctx.root_el).children("svg")) + 1;		
		var viz = d3.select(ctx.root_el)
			.append("svg:svg")
			.attr({
				"width" : ctx.dims.width,
				"height" : ctx.dims.height,
				"class" : class_name
			});

		var bar = viz.selectAll("g")
			.data(ctx.data)
			.enter().append("g").attr({
				"transform" : function(d, i) {
					return "translate(" + (i * ctx.dims.bar_width) + ", 0)";
				}
			});

		bar.append("rect")
			.style(style)
			.attr({
				"width" : ctx.dims.bar_width,
				"y" : 0,
				"height" : function(d) {
					return ctx.dims.y(_.contains(data.pages, d.index) ? frequency_max * ctx.dims.bar_height : 0);
				}
			});
	},
	setWordViz: function(class_name, data, style) {
		var ctx = this.get('word_viz');
		var setPageWindow = _.bind(this.setPageWindow, this);
		
		var viz = d3.select(ctx.root_el)
				.append("svg:svg")
				.attr({
					width : ctx.dims.width,
					height : ctx.dims.height,
					class : class_name
				})
				.on({
					"mousedown" : function() {
						var m = d3.mouse(this);

						viz.append("rect")
							.attr({
								rx : 6,
								ry : 6,
								class : "page_window",
								x : m[0],
								y : m[1],
								width : 0,
								height : 0
							});
					},
					"mousemove" : function() {
						var s = d3.select("rect.page_window");
						if(!s.empty()) {
							var m = d3.mouse(this);
							var d = {
								x : parseInt(s.attr('x'), 10),
								y : parseInt(s.attr('y'), 10),
								width : parseInt(s.attr('width'), 10),
								height : parseInt(s.attr('height'), 10)
							};
							var move = {
								x : m[0] - d.x,
								y : m[1] - d.y
							};

							if(move.x < 1 || (move.x * 2 < d.width)) {
								d.x = m[0];
								d.width -= move.x;
							} else { d.width = move.x; }

							if(move.y < 1 || (move.y * 2 < d.height)) {
								d.y = m[1];
								d.height -= move.y;
							} else { d.height = move.y; }

							s.attr(d);
						}
					},
					"mouseup" : function() {
						d3.selectAll("rect.page_window").remove();

						var in_page_window = d3.selectAll(".in_page_window");
						if(!in_page_window.empty()) {
							setPageWindow(
								_.map(_.flatten(in_page_window), function(s) {
									return $($(s).parent()).index();
								})
							);
							in_page_window.classed("in_page_window", false);
						}						
					}
				});

		var bar = viz.selectAll("g")
			.data(data)
			.enter().append("g").attr({
				"transform" : function(d, i) {
					return "translate(" + (i * ctx.dims.bar_width) + ", 0)";
				}
			});

		bar.append("rect")
			.style(style ? style : {
				"fill" : "#cccccc",
				"opacity" : 0.25
			})
			.attr({
				"width" : ctx.dims.bar_width,
				"y" : function(d) {
					return ctx.dims.height - ctx.dims.y(d.frequency_max); 
				},
				"height" : function(d) {
					return ctx.dims.y(d.frequency_max);
				}
			})
			.on({
				"mouseover": function() {
					if(!viz.selectAll("rect.page_window").empty()) {
						d3.select(this).classed("in_page_window", true);
					}
				}
			});

	},
	setPageWindow: function(pages) {
		if(_.isNumber(pages)) {
			pages = [pages];
		} else if (_.size(pages) > 1) {
			pages = _.range(_.min(pages), _.max(pages));
		}

		window.page_window = new CompassPageWindow({
			pages : pages,
			highlight_terms : _.unique(_.map($('input:checked'), 
				function(i) {
					console.info(i);
					return {
						term : $($($(i).parent()).siblings('.cp_label')[0]).html(),
						color : $($(i).parent()).css('background-color')
					};
				}))
			}
		);
	},
	loadEntityViz: function() {
		var viz_div = $("#cp_entity_stats");
		var frequency_max = _.reduce(
			_.map(this.get('entities').words, function(e) {
				return _.size(e);
			}), function(m, n) { return m + n; }
		);

		this.set('entity_viz', {
			root_el : "#cp_entity_stats",
			dims : {
				width : viz_div.width(),
				height : viz_div.height(),
				frequency_max : frequency_max,
				x : d3.scale.linear()
					.domain([0, this.get('data').total_pages])
					.range([0, viz_div.width()]),
				y : d3.scale.linear()
					.domain([0, frequency_max])
					.range([0, viz_div.height()]),
				bar_width: viz_div.width()/this.get('data').total_pages,
				bar_height: viz_div.height() * 0.15
			},
			data : crossfilter(
				_.map(
					_.range(this.get('data').total_pages),
					function(num) {
						return { index : num };
					}, this
				)
			).dimension(function(d) { return d.index; }).bottom(Infinity)
		});
	},
	loadWordViz: function() {
		var viz_div = $("#cp_word_stats");
		var frequency_max = crossfilter(this.get('page_map').uv_page_map)
			.dimension(function(d) { return d.frequency_max})
			.top(1)[0].frequency_max;

		this.set('word_viz', {
			root_el : "#cp_word_stats",
			dims : {
				width : viz_div.width(),
				height : viz_div.height(),
				frequency_max : frequency_max,
				x : d3.scale.linear()
					.domain([0, this.get('data').total_pages])
					.range([0, viz_div.width()]),
				y : d3.scale.linear()
					.domain([0, frequency_max])
					.range([0, viz_div.height()]),
				bar_width : viz_div.width()/this.get('data').total_pages
			}
		});
		
		this.setWordViz("uv_viz_main", this.get('page_map').uv_page_map);
	},
	loadPageMap: function() {
		var page_map_asset = this.getAssetByTagName(UV.ASSET_TAGS.PAGE_MAP);
		if(!page_map_asset) { return false; }

		try {
			var page_map = JSON.parse(getFileContent(this, [".data", this.get('data')._id, page_map_asset.file_name].join("/")));

			this.set('page_map', {
				'uv_page_map' : crossfilter(page_map.uv_page_map)
					.dimension(function(d) { return d.index; }).bottom(Infinity)
			 	}
			 );
			delete page_map.uv_page_map;

			page_map = _.map(_.pairs(page_map), function(p) { return _.object([p]); });
			page_map = crossfilter(page_map)
				.dimension(function(d) { return _.values(d)[0]; })
				.top(Infinity);

			page_map = _.reduce(page_map, function(m, n) { return _.extend(m, n); });

			this.get('page_map').words = page_map;
		} catch(err) { console.warn(err); }
		if(!this.has('page_map') || !this.get('page_map')) { return false; }

		var word_tmpl = getTemplate("word_li.html");
		var keyword_holder = $(document.createElement('ul')).attr('id', "cp_sortable_list_keywords");

		$("#cp_entity_browser")
			.append($(document.createElement('h4')).html("Keywords <a>+</a>"))
			.append($(document.createElement('div'))
				.html(Mustache.to_html(this.get('sort_tmpl'), { list_id : "#cp_sortable_list_keywords"})))
			.append($(document.createElement('div'))
				.addClass("cp_entity_browser_sublist")
				.append(keyword_holder));

		_.each(_.keys(this.get('page_map').words), function(word) {
			var word = {
				label : word,
				color: getRandomColor(),
				id: MD5(String(word)),
				frequency_max: this.get('page_map').words[word]
			};

			$(keyword_holder).append(Mustache.to_html(word_tmpl, word));
		}, this);

		return true;
	},
	loadEntities: function() {
		var entity_asset = this.getAssetByTagName(UV.ASSET_TAGS.CP_ENTITIES);
		if(!entity_asset) { return false; }

		try {
			var entities = JSON.parse(getFileContent(this, [".data", this.get('data')._id, entity_asset.file_name].join("/")));
			this.set('entities', { uv_page_map : entities.uv_page_map });
			delete entities.uv_page_map;
			
			this.get('entities').words = entities;
		} catch(err) { console.warn(err); }
		if(!this.has('entities') || !this.get('entities')) { return false; }

		var entity_group_tmpl = getTemplate("entity_group.html");
		var entity_holder = $(document.createElement('ul'));

		$("#cp_entity_browser").append(entity_holder);
		
		_.each(_.keys(this.get('entities').words), function(key) {
			var entities = {
				entities: crossfilter(_.map(this.get('entities').words[key],
					function(entity) {
						return {
							label : entity,
							color: getRandomColor(),
							id : MD5(String(entity)),
							frequency_max : _.findWhere(this.get('entities').uv_page_map, { entity : entity}).count
						}
					}, this)).dimension(function(d) {
						return d.frequency_max;
					}).top(Infinity),
				group_name : key,
				group_hash : MD5(String(key))
			};

			$(entity_holder)
				.append($(document.createElement('li'))
					.html(Mustache.to_html(entity_group_tmpl, entities)));

			$("#" + entities.group_hash).before($(document.createElement('div'))
				.html(Mustache.to_html(this.get('sort_tmpl'), 
					{ list_id : "#cp_sortable_list_" + entities.group_hash})));

		}, this);

		return true;
	}
});
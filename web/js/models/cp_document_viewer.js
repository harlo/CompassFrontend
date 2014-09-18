var CompassDocumentViewer = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);

		this.set('sort_tmpl', getTemplate("document_viewer_sort.html"));

		if(this.loadPageMap()) {
			this.loadWordViz();

			if(this.loadEntities()) {
				this.loadEntityViz();
			}

			if(this.get('highlight_terms')) { this.setHighlightTerms(); }

			window.setTimeout(_.bind(this.setLegend, this), 300);
			$("#cp_document_viewer_control").css('display', 'block');
		}
	},
	setLegend: function() {
		var ctx = this.get('word_viz');
		var legend = $(document.createElement('div'))
			.attr('id', "cp_legend")
			.html(Mustache.to_html(getTemplate("word_viz_legend.html"), {
				frequency_max : ctx.dims.frequency_max,
				total_pages : document_browser.get('data').total_pages
			}))
			.css({
				left: $(ctx.root_el).position().left + ctx.dims.width + $("#cp_entity_browser").width(),
				height: ctx.dims.height
			});
		$("#cp_word_stats").append(legend);
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
			return _.filter(document_browser.get('data').assets, function(asset) {
				return _.contains(asset.tags, tag_name);
			}, this)[0];
		} catch(err) {console.warn(err); }

		return null;
	},
	getCurrentHighlightTerms: function() {
		return _.map($('input:checked'), 
			function(i) {
				return {
					term : $($($(i).parent()).siblings('.cp_label')[0]).html().toLowerCase(),
					color : this.getColorForInput(i)
				};
			}, this);
	},
	getColorForEntity: function(entity) {
		var li;
		
		try { li = $("li[class$='_handle_" + MD5(entity) + "']")[0];}
		catch(err) { console.warn(err); }

		if(li) { return $($(li).children("span")[0]).css('background-color'); }

		return "#cccccc";
	},
	getColorForInput: function(input) { return $($(input).parent()).css('background-color'); },
	getWordNeighbors: function(page) {

		var w_neighbors = _.findWhere(document_viewer.get('page_map').uv_page_map, { 'index' : page });
		
		if(w_neighbors) {
			var threshold = Math.floor(w_neighbors.frequency_max * 0.33);

			w_neighbors = _.pluck(_.reject(w_neighbors.map, function(map) {
				return map.count <= threshold;
			}), "word");
		}

		var e_neighbors = _.pluck(_.filter(document_viewer.get('entities').uv_page_map, function(item) {
			return _.contains(item.pages, page);
		}), "entity");

		var word_neighbors = [];
		_.each([w_neighbors, e_neighbors], function(neighbors) {
			neighbors = _.reject(neighbors, function(n) {
				return _.contains(_.pluck(word_neighbors, 'term'), n);
			}, this);

			word_neighbors = _.union(word_neighbors, _.map(neighbors, function(n) {
				return {
					term : n,
					color : this.getColorForEntity(n),
					suggested : true
				};
			}, this));
		}, this);

		return word_neighbors;
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
		$("rect[class^='uv_svg_']").remove();
	},
	revealSVG: function(svg) {
		$("svg[class^='uv_svg_']").css('z-index', 3);
		$(svg).css({
			'opacity' : 0.7,
			'z-index' : 4
		});
	},
	hideSVG: function(svg) {
		$(svg).css({
			'opacity' : 0,
			'z-index' : 3
		});
	},
	removeEntityDot: function(rects) { $(rects).remove(); },
	toggleEntityList: function(el) {
		var status = _.unique(_.map($($(el).parent()).siblings('div'), function(div) {
			return toggleElement($(div));
		}));

		$(el).html(status[0] ? "-" : "+");
	},
	sendToViz: function(el, words, type, color) {
		if(_.isString(words)) { words = [words]; }
		var show_svg = $(el).prop('checked');

		_.each(words, function(word) {
			var data;
			var hash = "uv_svg_" + type + "_" + MD5(word);

			if(type == "keyword") {
				var has_svg = $("svg." + hash)[0];

				if(has_svg) {
					if(show_svg) { this.revealSVG(has_svg); }
					else { this.hideSVG(has_svg); }
					return;
				}
			} else if(type == "entity") {
				var has_svg = $("rect." + hash);

				if(!(_.isEmpty(has_svg)) && !show_svg) {
					this.removeEntityDot(has_svg);
					return;
				}
			}

			if(!show_svg) { return; }

			if(!color) {
				try {
					color = this.getColorForInput($(el));
				} catch(err) { console.warn(err); }
			}

			if(type == "keyword") {
				data = _.map(this.get('page_map').uv_page_map, function(d) {
					var word_match = _.findWhere(d.map, { word : word });
					var frequency_max = word_match ? word_match.count : 0;

					return { frequency_max: frequency_max, index :  d.index };
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
		var viz = d3.select(ctx.root_el);

		if(class_name == "uv_viz_entity_holder") {
			viz = viz.append("svg:svg")
				.attr({
					width : ctx.dims.width,
					height: ctx.dims.height,
					class : class_name
				});
		} else { viz = viz.selectAll("svg"); }

		viz = viz.selectAll("g").data(ctx.data);

		if(class_name == "uv_viz_entity_holder") {
			var g = viz.enter().append("g")
				.attr({
					"transform" : function(d, i) {
						return "translate(" + (i * ctx.dims.bar_width) + ", 0)";
					}
				});

			var bar = g.append("rect")
				.style({ fill : "#999999", opacity : 0 })
				.attr({
					width : ctx.dims.bar_width,
					y : 0,
					height : 0
				});
		} else {
			var frequency_max = _.size($("li[id^='cp_entity_handle_'] input:checked"));
			
			var bar = viz.filter(function(d) { return _.contains(data.pages, d.index); });
			
			var rect = bar.append("rect")
				.attr({
					width : ctx.dims.bar_width * 3,
					y : (frequency_max - 1) * (ctx.dims.bar_width * 3),
					height: ctx.dims.bar_width * 3,
					class: class_name
				})
				.style(style);
		}
	},
	setWordViz: function(class_name, data, style) {
		var ctx = this.get('word_viz');
		var setPageWindow = _.bind(this.setPageWindow, this);
		var getWordNeighbors = _.bind(this.getWordNeighbors, this);
		var getCurrentHighlightTerms = _.bind(this.getCurrentHighlightTerms, this);
		
		var viz = d3.select(ctx.root_el)
				.append("svg:svg")
				.attr({
					width : ctx.dims.width,
					height : ctx.dims.height,
					class : class_name
				});

		if(class_name == "uv_viz_selector") {
			$("svg.uv_viz_selector").css('z-index', 5);
			$('body').append(ctx.tooltip);
			ctx.tooltip.drags();

			viz.on({
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
					var in_page_window = d3.selectAll(".in_page_window");
					var page_window_stub = d3.selectAll("rect.page_window");

					if(!in_page_window.empty()) {
						if(window.page_window) { page_window.destroy(); }

						var m = d3.mouse(this);

						setPageWindow(
							_.map(_.flatten(in_page_window), function(s) {
								return $($(s).parent()).index();
							}),
							{
								x : m[0] + $("#cp_entity_browser").width(),
								y : m[1] + $(ctx.root_el).position().top
							}
						);
						in_page_window.classed("in_page_window", false);
					}

					page_window_stub.remove();				
				}
			});
		} else if(class_name == "uv_viz_main") {
			$("svg.uv_viz_main").css('z-index', 2);
		}

		var bar = viz.selectAll("g")
			.data(data)
			.enter().append("g").attr({
				"transform" : function(d, i) {
					return "translate(" + (d.index * ctx.dims.bar_width) + ", 0)";
				}
			});

		bar.append("rect")
			.style(style ? style : {
				"fill" : "#cccccc",
				"opacity" : 0.33
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
				mouseover: function(d, i) {
					if(!viz.selectAll("rect.page_window").empty()) {
						d3.select(this).classed("in_page_window", true);	
					}
				},
				click: function(d, i) {
					if(!viz.selectAll("rect.page_window").empty()) { return; }

					var word_neighbors = getWordNeighbors(i);
					console.info("CLICK!");

					if(!(_.isEmpty(word_neighbors))) {
						$(ctx.tooltip)
							.css({
								left : d3.event.pageX,
								top : d3.event.pageY,
								display: "block"
							})
							.html(Mustache.to_html(ctx.tooltip_tmpl, word_neighbors))
							.css('display', 'block');
					}
				}
			});
	},
	setPageWindow: function(pages, position) {
		if(_.isNumber(pages)) {
			pages = [pages];
		} else if (_.size(pages) > 1) {
			pages = _.range(_.min(pages), _.max(pages));
		}

		var highlight_terms = this.getCurrentHighlightTerms();

		window.page_window = new CompassPageWindow({
			pages : pages,
			highlight_terms : _.map(_.unique(_.values(_.pluck(highlight_terms, 'term'))), function(term) {
				return _.findWhere(highlight_terms, { term : term });
			}),
			initial_position: position
		});
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
					.domain([0, document_browser.get('data').total_pages])
					.range([0, viz_div.width()]),
				y : d3.scale.linear()
					.domain([0, frequency_max])
					.range([0, viz_div.height()]),
				bar_width: viz_div.width()/document_browser.get('data').total_pages,
				bar_height: viz_div.height() * 0.3
			},
			data : crossfilter(
				_.map(
					_.range(document_browser.get('data').total_pages),
					function(num) {
						return { index : num };
					}, this
				)
			).dimension(function(d) { return d.index; }).bottom(Infinity)
		});

		this.setEntityViz("uv_viz_entity_holder");
	},
	loadWordViz: function() {
		var viz_div = $("#cp_word_stats");
		var frequency_max = crossfilter(this.get('page_map').uv_page_map)
			.dimension(function(d) { return d.frequency_max})
			.top(1)[0].frequency_max;

		var tooltip = $(document.createElement('div'))
			.addClass("uv_toggle_none")
			.attr('id', "cp_word_stats_tooltip");

		this.set('word_viz', {
			root_el : "#cp_word_stats",
			dims : {
				width : viz_div.width(),
				height : viz_div.height(),
				frequency_max : frequency_max,
				x : d3.scale.linear()
					.domain([0, document_browser.get('data').total_pages])
					.range([0, viz_div.width()]),
				y : d3.scale.linear()
					.domain([0, frequency_max])
					.range([0, viz_div.height()]),
				bar_width : viz_div.width()/document_browser.get('data').total_pages
			},
			tooltip : tooltip,
			tooltip_tmpl : getTemplate("tooltip_tmpl.html")
		});
		
		this.setWordViz("uv_viz_main", this.get('page_map').uv_page_map);
		this.setWordViz("uv_viz_selector", 
			_.map(_.range(document_browser.get('data').total_pages), function(index) {
				return { frequency_max : frequency_max, index : index };
			}),
			{ fill : "transparent", opacity: 0 }
		);
	},
	loadPageMap: function() {
		var page_map_asset = this.getAssetByTagName(UV.ASSET_TAGS.PAGE_MAP);
		if(!page_map_asset) { return false; }

		try {
			var page_map = JSON.parse(getFileContent(this, [".data", document_browser.get('data')._id, page_map_asset.file_name].join("/")));

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
			.append($(document.createElement('h4')).html("Keywords <a onclick='document_viewer.toggleEntityList(this);'>-</a>"))
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
			var entities = JSON.parse(getFileContent(this, [".data", document_browser.get('data')._id, entity_asset.file_name].join("/")));
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
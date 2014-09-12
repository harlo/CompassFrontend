var CompassDocumentViewer = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);

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
					$($(el.parent()).parent()).prepend($(el));
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
	clearAllSVGS: function() {
		_.each($("#cp_entity_browser").find('input'), function(el) { $(el).prop('checked', false); });
		_.each($("svg[class^='uv_svg_']"), function(svg) { this.hideSVG(svg); }, this);
	},
	revealSVG: function(svg) {
		$("svg[class^='uv_svg_']").css('z-index', 3);
		$(svg).css({
			'opacity' : 1,
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

			if(!show_svg) { return;}

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
		var viz = d3.select(ctx.root_el)
				.append("svg:svg")
				.attr({
					"width" : ctx.dims.width,
					"height" : ctx.dims.height,
					"class" : class_name
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
				"fill" : "#000000",
				"opacity" : 0.2
			})
			.attr({
				"width" : ctx.dims.bar_width,
				"y" : function(d) {
					return ctx.dims.height - ctx.dims.y(d.frequency_max); 
				},
				"height" : function(d) {
					return ctx.dims.y(d.frequency_max);
				}
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
		var keyword_holder = $(document.createElement('ul'));

		$("#cp_entity_browser")
			.append($(document.createElement('h3')).html("Keywords <a>+</a>"))
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

			$(keyword_holder).append($(document.createElement('li')).html(Mustache.to_html(word_tmpl, word)));
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

		$("#cp_entity_browser")
			.append($(document.createElement('h3')).html("Entities"))
			.append(entity_holder);
		
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
				.append($(document.createElement('li')).html(
					Mustache.to_html(entity_group_tmpl, entities)));
		}, this);

		return true;
	}
});
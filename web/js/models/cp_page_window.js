var CompassPageWindow = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);

		if(!document_viewer) { return; }

		var pos = this.get('initial_position');
		var root_el = $(document.createElement('div'))
			.attr({'id' : "cp_page_window" })
			.css({
				top : pos.y,
				left : pos.x
			})
			.html(Mustache.to_html(getTemplate("page_window.html", null, "/web/layout/views/popup/"), {
				min : _.first(this.get('pages')) + 1,
				max : _.last(this.get('pages')) + 1
			}));
		$(root_el).drags();

		$('#content').append($(root_el));
		this.set('root_el', root_el);

		this.set('page_window_repl_tmpl', getTemplate("page_window_repl.html"));

		this.setPageSlider();
	},
	setPageSlider: function() {
		var pages = this.get('pages');
		var setPage = _.bind(this.setPage, this);

		var width = 640;
		var height = 16;
		
		this.set('slider', {
			dims : {
				x : d3.scale.linear()
					.domain([0, _.size(this.get('pages'))])
					.range([0, width])
					.clamp(true),
				width : width,
				height : height,
				tick_width : width * (1/_.size(this.get('pages'))),
				tick_height : height * 0.4
			}
		});

		var ctx = this.get('slider');

		var slider = d3.select("#cp_page_window_slider").append("svg:svg")
			.attr({
				width : ctx.dims.width,
				height : ctx.dims.height
			});

		var s = slider.selectAll('g')
			.data(_.range(_.size(this.get('pages'))))
			.enter()
				.append('g')
				.attr({
					height : ctx.dims.height,
					width: ctx.dims.tick_width,
					transform : function(d, i) {
						return "translate(" + (i * ctx.dims.tick_width) + ", 0)";
					}
				});

		var terms = _.values(_.pluck(this.get('highlight_terms'), 'term'));
		var ticks = s.append('rect')
			.attr({
				y : ctx.dims.height - ctx.dims.tick_height,
				height: ctx.dims.tick_height,
				width: ctx.dims.tick_width,
				class: "cp_page_window_slider_tick",
			})
			.style('opacity', function(d) {
				if(_.isEmpty(terms)) { return 0.5; }

				var has_words;

				var page_map = _.findWhere(document_viewer.get('page_map').uv_page_map, { index : pages[d] });
				if(page_map) {
					has_words = _.intersection(terms,  _.pluck(page_map.map, 'word'));
				}

				if(!has_words) {
					has_words = _.filter(document_viewer.get('entities').uv_page_map, function(p) {
						return (_.contains(terms, p.entity) && _.contains(p.pages, pages[d]));
					});
				}

				if(has_words && !(_.isEmpty(has_words))) { return 1; }

				return 0.5;
			})
			.on({
				mouseenter : function() {
					try {
						$($(d3.select(this).node())
							.siblings('text')[0]).css('opacity', 1);
					} catch(err) { console.warn(err); }
				},
				mouseout: function() {
					try {
						$($(d3.select(this).node())
							.siblings('text')[0]).css('opacity', 0);
					} catch(err) { console.warn(err); }
				},
				click: function(d) { setPage(pages[d]); }
			});

		var labels = s.append('text')
			.attr({
				y : 2,
				dy : "0.5em",
				class : "cp_page_window_slider_tick_label"
			})
			.text(function(d) { return pages[d + 1]; });
	},
	onHandleUp: function(d) {
		console.info(arguments);
		console.info(this);
	},
	setPage: function(page) {
		$("#cp_page_window_anchors").empty();
		this.set('current_page', page);

		var page_data;
		try {
			page_data = doInnerAjax("documents", "post", {
				media_id : document_viewer.get('data')._id,
				index_in_parent : page,
				get_all : true,
				doc_type : "cp_page_text"
			}, null, false).data.documents[0].searchable_text;
		} catch(err) { console.warn(err); }

		if(!page_data) { page_data = "Could not find page..."; }
		else {
			page_data = unescape(page_data.escape());
			
			if(this.get('highlight_terms')) {
				_.each(this.get('highlight_terms'), function(term) {
					var rx = new RegExp(term.term, 'gi');

					if(page_data.match(rx)) {
						$("#cp_page_window_anchors").append(
							$(document.createElement('a'))
								.html(term.term)
								.click(function() {
									console.info("NEXT TERM...");
								})
								.css({
									"background-color" : term.color,
									"color" : "#ffffff"
								}));
					}

					var repl = Mustache.to_html(
						this.get('page_window_repl_tmpl'), 
						_.extend(term, { hash : MD5(String(term.term)) })
					);
					
					page_data = page_data.replace(rx, repl);
				}, this);
			}
		}

		if($("#cp_page_window_expanded").css('display', 'none')) {
			$("#cp_page_window_expanded").css('display', 'block');
		}

		$($(this.get('root_el')).find('.cp_page_index')[0]).html(page + 1);
		$($(this.get('root_el')).find('.cp_searchable_text')[0]).html(page_data);
	},
	nextPage: function() {
		var page = _.indexOf(this.get('pages'), this.get('current_page'));
		try {
			var next_page = this.get('pages')[page + 1];
		} catch(err) { console.warn(err); }

		if(next_page) { this.setPage(next_page); }
	},
	previousPage: function() {
		var page = _.indexOf(this.get('pages'), this.get('current_page'));
		try {
			var previous_page = this.get('pages')[page - 1];
		} catch(err) { console.warn(err); }

		if(previous_page) { this.setPage(previous_page); }
	},
	destroy: function() {
		$("#cp_page_window").remove();
		delete window.page_window;
	}
});
var CompassBatch = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);
			
		if(annex_channel) {
			annex_channel.get('message_map').push(
				_.bind(this.parseTaskMessage, this));
		}

		var colors = _.map(_.range(10), function(c) { return getRandomColor(); });
		window.reserved_colors = _.union(window.reserved_colors || [], colors);
		this.set('topic_colors', colors);
		this.update();
	},
	sendToViz: function(el, hash, type) {
		console.info($(el).prop('checked'));
		if(!$(el).prop('checked')) { return; }

		var data_idx = 0;
		var topic_li = $("#cp_topic_handle_" + hash)[0];
		var topic_idx = _.indexOf($($(topic_li).parent()).children('li'), topic_li);
		var topic_set = _.sortBy(this.get('batch_result').topics[topic_idx], function(t) {
			return t[0];
		});

		var viz = this.get('viz').viz;
		var ctx = this.get('viz').ctx;

		// set legend by topic_set
		var y = _.map(topic_set, function(t) { return t[0]});
		
		console.info(ctx);



		// for each document, plot pages[topic_idx]

	},
	build: function() {
		var topic_li_tmpl = getTemplate("topic_li.html");
		var document_li_tmpl = getTemplate("result_no_page_item.html");

		$("#cp_batch_term_holder")
			.html("<h4>Topic modeling around term(s): " + this.get('data').query.join(", ") + "</h4>");

		this.get('data').documents = _.map(this.get('data').documents, function(d) {
			return doInnerAjax("documents", "post", { _id : d }, null, false).data;
		});

		$($("#cp_batch_documents_holder").children('ul')[0])
			.empty()
			.append(
				_.map(this.get('data').documents, function(d) {
					return $(Mustache.to_html(document_li_tmpl, d))
						.addClass('cp_white_a')
						.css('background-color', getRandomColor());
				})
			);

		if(!(this.get('batch_result').topics)) {
			return;
		}

		$($("#cp_batch_topics_holder").children('ul')[0]).append(
			_.map(this.get('batch_result').topics, function(topic) {
				var l_count = 0;
				var labels = _.map(topic, function(t) {
					var label = {
						label : t[1],
						color: this.get('topic_colors')[l_count]
					};

					l_count++;
					return label;
				}, this);

				topic = {
					topic: labels,
					id : MD5(String(_.pluck(labels, 'label').join(''))),
					ctx : "doc_batch"
				};

				return Mustache.to_html(topic_li_tmpl, topic);

			}, this));

		this.loadViz();
	},
	loadViz: function() {
		var ctx = { 
			root_el : "#cp_topic_visualizer_holder",
			dims : { margin_left : 0.15 }
		};
		
		_.extend(ctx.dims, {
			width : $(ctx.root_el).width() * (1 - ctx.dims.margin_left),
			height: $(ctx.root_el).height(),
			left : $(ctx.root_el).width() * ctx.dims.margin_left,
			max_x : _.max(_.pluck(this.get('data').documents, 'total_pages'))
		});

		_.extend(ctx.dims, {
			x : d3.scale.linear()
				.domain([0, ctx.dims.max_x])
				.range([0, ctx.dims.width]),
			y : d3.scale.linear()
				.domain([-1, 1])
				.range([0, ctx.dims.height]),
			spacer : ctx.dims.width/ctx.dims.max_x
		});

		$(ctx.root_el).empty();

		var viz = d3.select(ctx.root_el);

		viz.append("svg:svg")
			.attr({
				width: ctx.dims.width,
				height: ctx.dims.height,
				style: "margin-left:" + ctx.dims.left + "px;"
			})

		this.set('viz', { ctx : ctx, viz : viz });
	},
	parseTaskMessage: function(message) {
		console.info(message);

		if(message._id && message._id == this.get('_id')) {
			sendToNotificationTray(message);
			if(message.message) {
				$("#cp_topic_visualizer_holder")
					.html("<h5>" + message.message + "</h5>");
			}
			if(message.status == 200 && message.result_assets) {
				if(!this.has('has_results')) {
					this.set('has_results', true);
					console.info("AND DONE!");
					window.setTimeout(_.bind(this.update, this), 1000);
				}
			}
		}
	},
	update: function() {
		console.info("UPDATING!");
		var batch_header = doInnerAjax("documents", "post", { _id : this.get('_id'), uv_doc_type : "UV_TASK" }, null, false);
		if(batch_header.result != 200) {
			return;
		}

		this.set('data', batch_header.data);
		console.info(this);

		if(!this.has('batch_result') || !(this.get('batch_result'))) {
			try {
				this.set('batch_result', this.getResult());
				this.build();
			} catch(err) {
				console.warn(err);
			}
		}
	},
	getResult: function() {
		if(!this.get('data').assets) {
			return;
		}

		var res_file;

		try {
			res_file = _.find(this.get('data').assets, function(a) {
				return _.contains(a.tags, UV.ASSET_TAGS['C_RES']);
			}).file_name;
		} catch(err) {
			console.warn(err);
			return;
		}

		if(res_file) {
			try {
				return JSON.parse(
					getFileContent(this, [this.get('data').base_path, res_file].join("/")));
			} catch(err) {
				console.error(err);
			}
		}
	}

});
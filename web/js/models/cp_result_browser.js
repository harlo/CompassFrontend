var CompassResultBrowser = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);

		if(this.has('search_terms')) {
			this.set('search_terms', _.map(this.get('search_terms').split(','), function(term) {
				return {
					label : term,
					color: getRandomColor(),
					id: MD5(String(term))
				}
			}));
		}
	},
	requestCluster: function() {
		if(!this.has('search_terms') || (_.isEmpty(this.get('search_terms')))) {
			return;
		}

		var cluster = doInnerAjax("cluster", "post", {
			query : "[" + _.pluck(this.get('search_terms'), 'label').join() + "]",
			documents : "[" + this.get('unique_documents').join() + "]",
			task_path : UV.AVAILABLE_CLUSTERS.map_similarities_gensim
		}, null, false);

		console.info(cluster);

	},
	setResultPage: function(page_num) {
		this.set('current_page', page_num);

		$("#cp_result_browser_pagination_current_page").html(page_num + 1);
		$(this.get('result_holder')).empty();

		var min = page_num * UV.DEFAULT_PAGINATION;
		var max = _.min([min + UV.DEFAULT_PAGINATION, _.size(this.get('data'))]);

		var stub_length = 6;

		this.set('current_results', {
			range : [min, max],
			data : this.get('data').slice(min, max)
		});

		if(this.has('search_terms') && !(_.isEmpty(this.get('search_terms')))) {
			try {
				this.get('current_results').data = doInnerAjax("documents", "post", {
					_ids : "[" + _.pluck(this.get('current_results').data, "_id").join() + "]",
					doc_type : "cp_page_text"
				}, null, false).data.documents.reverse();
			} catch(err) {
				console.warn(err);
				return;
			}

			_.each(this.get('current_results').data, function(result) {
				var highlights = _.map(
					_.filter(result.searchable_text.split(/[\!\?\.]/), function(sentence) {
						var has_words = _.intersection(
							sentence.toLowerCase().split(' '), 
							_.pluck(this.get('search_terms'), "label"));

						return _.size(has_words) > 0;
					}, this), function(sentence) {
						var words = _.pluck(this.get('search_terms'), "label");
						var sentence = _.map(sentence.toLowerCase().split(' '), function(fragment) {
							if(_.contains(words, fragment)) {
								var word_match = _.findWhere(this.get('search_terms'), { label : fragment });
								if(word_match) {
									return '<span style="color:#fff;background-color:' + word_match.color + ';">' + fragment + "</span>";
								}
							}

							return fragment;
						}, this);

						return $(document.createElement('li'))
							.append($(document.createElement('a'))
								.attr('href', "/document/" + result.media_id + "/?search_terms=" + words.join(","))
								.html(sentence.join(' ')));
					}, this);

				if(_.size(highlights) > 0) {
					var result_li = $(document.createElement('li'))
						.append($(document.createElement('span'))
							.html(result.media_id + ", page " + (result.index_in_parent + 1))
							.addClass("cp_page_text_info"))
						.append($(document.createElement('ul')).append(highlights));
					
					$(this.get('result_holder')).append(result_li);
				}
			}, this);
		} else {
			_.each(this.get('current_results').data, function(result) {
				console.info(result);
				var result_li = $(document.createElement('li'))
					.append($(document.createElement('a'))
						.attr({
							'href': "/document/" + result._id + "/",
							'rel' : result.file_alias
						})
						.html(result.file_name)
						.addClass('uv_translate')
						.addClass('uv_from_rel'));

				$(this.get('result_holder')).append(result_li);

			}, this);
		}

	},
	nextResultPage: function() {
		if(!this.has('max_pages')) { return; }
		if(this.get('current_page') == this.get('max_pages') - 1) { return; }

		this.setResultPage(this.get('current_page') + 1);
	},
	previousResultPage: function() {
		if(!this.has('max_pages')) { return; }
		if(this.get('current_page') <= 0) { return; }

		this.setResultPage(this.get('current_page') - 1);
	}
});
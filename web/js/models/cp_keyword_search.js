var CompassKeywordSearch = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);

		if(current_user) {
			var tags;
			try {
				tags = current_user.getDirective('tags', false).tags;
			} catch(err) { console.warn(err); }

			if(tags) {
				UV.SEARCH_FACETS.push("Tags");
				_.findWhere(UV.FACET_VALUES, { category : "Tags" }).values = _.pluck(tags, 'label');
			}
		}

		window.addSearchParams = _.bind(this.addSearchParams, this);
		window.setSearchType = _.bind(this.setSearchType, this);
		window.buildAndPerform = _.bind(this.buildAndPerform, this);

		this.set('searchBar', VS.init({
			container: $("#cp_keyword_search"),
			query: '',
			callbacks: {
				search : this.setParams,
				facetMatches: this.facetMatches,
				valueMatches: this.valueMatches
			}
		}));
	},
	buildAndPerform: function() {
		window.location = "/search/?" + this.build()[1];
	},
	build: function() {
		var params = this.get('params') || [];
		var doc_type = this.has('search_type') ? this.get('search_type') : "uv_document"

		params = _.union(params, [
			{
				key : "doc_type",
				value : doc_type
			}
		]);

		var search_uri = _.map(params, function(p) {
			return p.key + "=" + JSON.stringify(p.value);
		}).join("&").replace(/\"/g, "");

		return [params, search_uri];
	},
	perform: function(query) {
		if(_.isString(query)) {
			if(query[0] == "?") { query = query.substr(1); }

			query = _.map(query.split("&"), function(kvp) {
				return _.object([kvp.split("=")]);
			});

			return this.perform(_.reduce(query, function(m, n) {
				return _.extend(m, n);
			}, {}));
		}


		try {
			onSearchTermsDetected(query.searchable_text);
		} catch(err) { console.warn(err); }

		if(!(_.isObject(query))) { return null; }
		return doInnerAjax("documents", "post", query, null, false);
	},
	addSearchParams: function(params) {
		this.set('params', params);
	},
	setSearchType: function(search_type) {
		this.set('search_type', search_type);
	},
	setParams: function(query, search_collection) {
		var params = [];
		_.each(search_collection.models, function(term) {
			var t = term.get('value');

			switch(term.get('category')) {
				case "text":
					t = "[" + t.toLowerCase().replace(/\s/g, ",").replace(/,,/g, ",") + "]";
					setSearchType("cp_page_text");
					break;
				case "Tags":
					if(!current_user) { return; }

					var tagged_documents;
					try {
						tagged_documents = _.findWhere(current_user.getDirective('tags', false).tags,
							{ label : t });
					} catch(err) {
						console.warn(err);
						return;
					}

					if(!tagged_documents) { return; }

					t = "[" + tagged_documents.documents.join(',') + "]";
					break;
			}

			params.push({
				key : _.findWhere(UV.FACET_VALUES, { category : term.get('category') }).uri_label,
				value: t
			})
		});

		addSearchParams(params);
	},
	facetMatches: function(callback) { callback(UV.SEARCH_FACETS); },
	valueMatches: function(facet, search_term, callback) {
		var values = _.findWhere(UV.FACET_VALUES, { category : facet });
		if(values) {
			callback(values.values);
		}				
	}

});
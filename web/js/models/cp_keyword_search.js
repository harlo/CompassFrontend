var CompassKeywordSearch = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);

		this.in_root = true;
		this.searchBar = VS.init({
			container: $("#cp_keyword_search"),
			query: '',
			callbacks: {
				search : this.search,
				facetMatches: this.facetMatches,
				valueMatches: this.valueMatches
			}
		});
	},
	search: function(query, search_collection) {
		_.each(search_collection.models, function(term) {
			var search_term = term.get('value');

			switch(term.get('category')) {
				case "text":
					search_term = search_term.toLowerCase().replace(/\s/g, ",").replace(/,,/g, ",");
					console.info("searching for " + search_term);

					var search_matches = doInnerAjax("documents", "post", {
						searchable_text : "[" + search_term + "]",
						doc_type : "cp_page_text"
					}, null, false);

					if(search_matches.result == 200) {
						displaySearchResults(search_matches.data, search_term);
					} else {
						insertTemplate("results_none.html", { search_term : search_term }, 
							$("#cp_keyword_results"), null, "/web/layout/views/keyword/");
					}
			}
		});

	},
	facetMatches: function(callback) { callback(UV.SEARCH_FACETS); },
	valueMatches: function(facet, search_term, callback) {
		var values = _.findWhere(UV.FACET_VALUES, { category : facet });
		if(values) {
			callback(values.values);
		}				
	}

});
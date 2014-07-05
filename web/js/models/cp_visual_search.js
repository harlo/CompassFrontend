var CompassVisualSearch = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);
		
		this.in_root = true;
		this.searchBar = VS.init({
			container : $("#cp_document_search"),
			query : '',
			callbacks: {
				search: this.search,
				facetMatches: this.facetMatches,
				valueMatches: this.valueMatches
			}
		});
		
	},
	search: function(query, search_collection) {
		console.info(search_collection);

		if(search_collection.length == 0) {
			document_browser.buildDocumentTree();
			return;
		}
		
		var filter_result;
		try {
			_.each(search_collection.models, function(term) {
				var value = term.get('value');
				var filter_func;
				
				switch(term.get('category')) {	
					case "Mime Type":
						filter_func = function(doc) {
							return doc.mime_type == value;
						};
						break;
					case "With Asset":
						filter_func = function(doc) {
							console.info(_.flatten(_.pluck(doc.assets, "tags")));
							console.info(value);
							return _.contains(
								_.flatten(_.pluck(doc.assets, "tags")), value);
						};
						break;
					case "text":
						console.info(value);
						var ids = doInnerAjax("documents", "post", 
							{
								cast_as : "media_id",
								searchable_text : value.toLowerCase() 
							},
						null, false);
						
						try {
							var json = JSON.parse(ids.responseText);
							if(json.result == 200) {
								console.info(json.data);
								ids = json.data.documents;
							}
						} catch(err) {
							console.warn(err);
						}
												
						filter_func = function(doc) {
							return _.findWhere(ids, { _id : doc._id });
						};
						break;
				}
				
				if(!filter_func) { return; }
				
				if(!filter_result) { filter_result = document_browser.get('data'); }
				filter_result = _.filter(filter_result, filter_func);
			});
				
			console.info(filter_result);
		} catch(err) {
			console.warn("COULD NOT PERFORM SEARCH ON DOC BROWSER");
			console.warn(err);
		}
		
		if(filter_result && filter_result.length != document_browser.get('data').length) { 
			document_browser.buildDocumentTree(filter_result);
		}
	},
	facetMatches: function(callback) { callback(UV.SEARCH_FACETS); },
	valueMatches: function(facet, search_term, callback) {
		var values = _.findWhere(UV.FACET_VALUES, { category : facet });
		if(values) {
			callback(values.values);
		}				
	}
});
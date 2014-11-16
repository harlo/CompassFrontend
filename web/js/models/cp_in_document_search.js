var CompassInDocumentSearch = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);

		this.set('searchBar', VS.init({
			container: $("#cp_searchbar_holder"),
			query: '',
			callbacks: {
				search : this.setParams,
				facetMatches: this.facetMatches,
				valueMatches: this.valueMatches
			}
		}));
	}
});
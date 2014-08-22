var CompassWordCloud = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);
		this.set('data', this.buildDataTree());
	},
	buildDataTree: function() {
		if(!this.has('data')) { return; }

	}

})
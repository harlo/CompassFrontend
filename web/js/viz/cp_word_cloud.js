var CompassWordCloud = UnveillanceViz.extend({
	constructor: function() {
		UnveillanceDocument.prototype.constructor.apply(this, arguments);
		this.set('data', this.buildDataTree());
	},
	buildDataTree: function() {
		if(!this.has('data')) { return; }

		var data_tree = [];
		_.each(this.get('data'), function(word) {
			console.info(word);
			// IS CROSSFILTER...
		});
		
		return data_tree;
	}

})
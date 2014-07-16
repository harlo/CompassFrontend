var CompassWordStats = UnveillanceViz.extend({
	constructor: function() {
		UnveillanceViz.prototype.constructor.apply(this, arguments);
		
		try {
			delete this.invalid;
		} catch(err) {}
	},
	build: function(data) {
		if(data) { this.set('data', data); }
		if(!this.has('data') || !this.get('data') || this.get('data').length == 0) {
			this.invalid = true;
			return false;
		}
		
		// word frequency
		return true;
	},
	buildData: function() {
		// first, calculate word frequency
		// data is corpus btw
		var langs = _.keys(UV.DEFAULT_STOPWORDS);
		var lang = langs[0];
		
		this.set({
			words : _.map(this.get('data'), function(corpus) {
				corpus = _.map(
					_.reject(corpus, 
						function(line) {
							return line.match(/^\s*$/) != null;
						}
					),
					function(line) {
						return _.reject(line.split(" "), function(word) {
							return _.contains(UV.DEFAULT_STOPWORDS[lang], word);
						});
					}
				);
				
				corpus = _.flatten(corpus);
				//console.info(corpus);
				return { corpus : corpus };
			})
		});
		
		//console.info(this.get('words'));
		
	}
});
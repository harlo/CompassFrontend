var CompassEntityBrowser = UnveillanceViz.extend({
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


		
		if(current_batch && current_batch.has('initial_query')) {
			var iq = _.findWhere(current_batch.get('initial_query'), 
				{ category : "text" });
			
			// each highlight word should be given a color, 
			// although, this might be best in the batch object 
			// (for reuse in other modules...)
			if(iq) {
				this.set('highlight_words', _.map(
					iq.value.toLowerCase()
						.replace(/\s/g, ',').replace(/,,/g, ',').split(','),
					function(word) {
						return {
							word: word,
							color: getRandomColor()
						}
					}
				));
			}
		}
	}
});
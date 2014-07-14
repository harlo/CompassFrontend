var CompassTextLocations = UnveillanceViz.extend({
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
			
			if(iq) {
				this.set('highlight_words', 
					iq.value.replace(/\s/g, ',').replace(/,,/g, ',').split(','));
			}
		}
		
		if(!this.has('highlight_words') || 
			!this.get('highlight_words') || this.get('highlight_words').length == 0) {
			this.invalid = true;
			return true;
		}
		
		// for each "page", if words are found in page, show position
		
		return true;
	}
});
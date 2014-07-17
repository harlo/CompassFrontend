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
							color: getRandomColor(),
							count: 0,
							pages: []
						}
					}
				));
			}
		}
				
		if(!this.has('highlight_words') || 
			!this.get('highlight_words') || this.get('highlight_words').length == 0) {
			this.invalid = true;
			return true;
		}
		
		// for each "page", if words are found in page, show position
		var pages = [];
		_.each(this.get('data'), function(p) { pages = pages.concat(p); });
		
		var i = 0;
		var matched_pages = _.filter(pages, function(page) {
			var words_on_page = _.intersection(
				_.pluck(this.get('highlight_words'), 'word'), 
				page.toLowerCase().split(' ')
			);
						
			_.each(words_on_page, function(word) {
				try {
					var word = _.findWhere(this.get('highlight_words'), { word : word });
					if(word) {
						word.count += 1;
						if(!_.contains(word.pages, i)) {
							word.pages.push(i);
						}
					}
				} catch(err) { console.warn(err); }
			}, this);
			
			
			i+=1;
			return words_on_page.length > 0;
		}, this);
		
		$(this.root_el).html($(document.createElement('ul')));
		_.each(matched_pages, function(page) {
			// find where on the page the words are
			// take about 7 words before and after that
			var words = page.split(' ');
			var trimmed_highlights = _.map(this.get('highlight_words'), function(word) {
				var word_idx = _.indexOf(
					_.map(words, function(w) { return w.toLowerCase(); }), word.word);
				
				var highlighted_sentence = $(document.createElement('li')).html('...');
				
				_.each(
					_.first(_.rest(words, 
						_.max([word_idx - 7, 0])), 
						_.min(word_idx + 7, words.length)
					), 
					function(segment) {
						if(segment.toLowerCase() == word.word) {
							segment = $(document.createElement('span'))
								.addClass('cp_text_highlight')
								.html(segment)
								.css({
									'background-color' : word.color
								});
						}
						
						highlighted_sentence
							.append(" ")
							.append(segment)
							.append(" ");
					}
				);
				
				highlighted_sentence.append("...");
				return highlighted_sentence;
			});
			
			$($(this.root_el).find('ul')[0]).append(trimmed_highlights);
			
		}, this);
		
		return true;
	}
});
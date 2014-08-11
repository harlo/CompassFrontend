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

		var stopwords = UV.DEFAULT_STOPWORDS[_.keys(UV.DEFAULT_STOPWORDS)[0]];
		var page_map = _.map(this.get('data'), function(item) {
			
			var keywords = _.reject(_.uniq(item[1]), function(word) {
				return word.length == 1 || _.contains(stopwords, word);
			});
			console.info(keywords.length);

			return {
				pages : item[0].length,
				map : _.map(_.range(item[0].length), function(num) {
					var match = _.intersection(keywords, item[0][num].toLowerCase().split(" "));

					return {
						index : num
					};
				})
			};
		});

		console.info("DONE");
		console.info(page_map);

		// word frequency

		// for each key, first is pages, second is b-o-w

		// unique bow, sort by frequency

		// graph 
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
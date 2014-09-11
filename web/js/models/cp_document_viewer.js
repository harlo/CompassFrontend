var CompassDocumentViewer = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);

		// load up entities
		this.loadPageMap();
		this.loadEntities();

		if(this.has('entities') || this.has('page_map')) {
			this.loadWordStats();
		}
	},
	getAssetByTagName: function(tag_name) {
		try {
			return _.filter(this.get('data').assets, function(asset) {
				return _.contains(asset.tags, tag_name);
			}, this)[0];
		} catch(err) {console.warn(err); }

		return null;
	},
	addTag: function() {

	},
	loadWordStats: function() {
		// consolidate entities and pagemap for frequencies

		//$("#cp_document_viewer").prepend($(document.createElement('h3')).html("Word Stats"));

		// create the svg element that shows top frequencies
	},
	loadPageMap: function() {
		var page_map_asset = this.getAssetByTagName(UV.ASSET_TAGS.PAGE_MAP);
		if(!page_map_asset) { return; }

		try {
			this.set('page_map', 
				JSON.parse(getFileContent(this, [".data", this.get('data')._id, page_map_asset.file_name].join("/"))));
		} catch(err) { console.warn(err); }
		if(!this.has('page_map') || !this.get('page_map')) { return; }

		var word_tmpl = getTemplate("word_li.html");
		var keyword_holder = $(document.createElement('ul'));

		$("#cp_entity_browser")
			.append($(document.createElement('h3')).html("Keywords"))
			.append($(document.createElement('div'))
				.addClass("cp_entity_browser_sublist")
				.append(keyword_holder));

		_.each(_.without(_.keys(this.get('page_map')), "uv_page_map"), function(word) {
			var word = {
				label : word,
				color: getRandomColor(),
				id: MD5(String(word))
			};

			$(keyword_holder).append($(document.createElement('li')).html(
				Mustache.to_html(word_tmpl, word)));
		});
	},
	loadEntities: function() {
		var entity_asset = this.getAssetByTagName(UV.ASSET_TAGS.CP_ENTITIES);
		if(!entity_asset) { return; }

		try {
			this.set('entities', JSON.parse(getFileContent(this, [".data", this.get('data')._id, entity_asset.file_name].join("/"))));
		} catch(err) { console.warn(err); }
		if(!this.has('entities') || !this.get('entities')) { return; }

		var entity_group_tmpl = getTemplate("entity_group.html");
		var entity_holder = $(document.createElement('ul'));

		$("#cp_entity_browser")
			.append($(document.createElement('h3')).html("Entities"))
			.append(entity_holder);
		
		_.each(_.without(_.keys(this.get('entities')), "uv_page_map"), function(key) {
			var entities = {
				entities: _.map(this.get('entities')[key],
					function(entity) {
						return {
							label : entity,
							color: getRandomColor(),
							id : MD5(String(entity))
						}
					}, this),
				group_name : key,
				group_hash : MD5(String(key))
			};

			$(entity_holder)
				.append($(document.createElement('li')).html(
					Mustache.to_html(entity_group_tmpl, entities)));
		}, this);
		
	}
});
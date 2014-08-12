var current_document;

function updateConf() {
	UV.DEFAULT_MIME_TYPES = [
		"text/plain",
		"application/pdf"
	];
	
	UV.ASSET_MODULES = [
		{
			name : "word_stats",
			label : "View word stats",
			asset_tags : [UV.ASSET_TAGS.TXT_JSON, UV.ASSET_TAGS.PAGE_MAP],
			_ids : [],
			default : true
		},
		{
			name : "forensic_metadata",
			label : "Compare metadata",
			asset_tags : [UV.ASSET_TAGS.F_MD],
			_ids : []
		},
		{
			name : "entity_browser",
			label : "View entities",
			asset_tags : [UV.ASSET_TAGS.DOC_CLOUD_ENTITIES, UV.ASSET_TAGS.ADDRESSES_NLP],
			_ids : [],
			default : true
		},
		{
			name : "text_locations",
			label : "Text locations",
			asset_tags : [UV.ASSET_TAGS.TXT_JSON],
			dependent: "initial_query",
			_ids : []
		}
	];
}

function loadDocument(_id) {
	current_document = new CompassDocument({ _id : _id });
	
	try {
		current_document.updateInfo();
	} catch(err) {
		console.warn("COULD NOT LOAD WHOLE DOCUMENT AT THIS TIME");
		console.warn(err);
	}
}

(function($) {
	$(function() {
		var css_stub = $(document.createElement('link'))
			.attr({
				'rel' : "stylesheet",
				'type' : "text/css",
				'media' : "screen"
			});

		_.each(['bootstrap.min', 'compass', 'visualsearch-datauri', 'visualsearch'],
			function(c) {
				var css = $(css_stub).clone();
				css.attr('href', "/web/css/" + c + ".css");
				document.getElementsByTagName("head")[0].appendChild(css.get(0));
			}
		);
	});
})(jQuery);
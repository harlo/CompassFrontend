var annex_channel;

var CompassGlobalKeyword = UnveillanceDirectiveItem.extend({
	constructor: function() {
		UnveillanceDirectiveItem.prototype.constructor.apply(this, arguments);
		
		this.set('d_name', "global_keywords");
		this.update();
	}
});

function getFileContentOboe(ctx, path) {
	oboe("/files/" + path)
		.done(function(json) {
			console.info("HOORAY WE HAVE IT");
			console.info(json);
		})
		.fail(function() {
			console.error("NO JSON PARSED BY OBOE");
			console.error(arguments)
		});
}

function updateConf() {
	UV.DEFAULT_MIME_TYPES = [
		"text/plain",
		"application/pdf"
	];

	UV.FACET_VALUES = _.union(UV.FACET_VALUES, [
		{
			category: "text",
			uri_label : "searchable_text"
		}
	]);
	
	UV.ASSET_MODULES = [
		{
			name : "word_stats",
			label : "View word stats",
			asset_tags : [UV.ASSET_TAGS.TXT_JSON, UV.ASSET_TAGS.PAGE_MAP, UV.ASSET_TAGS.CP_ENTITIES],
			_ids : [],
			default : true
		},
		{
			name : "forensic_metadata",
			label : "Compare metadata",
			asset_tags : [UV.ASSET_TAGS.F_MD],
			_ids : []
		}
	];

	UV.DEFAULT_PAGINATION = 16;
	annex_channel = new CompassNotifier();
}

function showAnnex() {
	$("#cp_annex_holder").css('display', 'block');

	var annex_button = $("#cp_annex_button").children('a')[0];
	$(annex_button).unbind("click");
	$(annex_button).bind("click", hideAnnex);
	
	var annex_documents = doInnerAjax("documents", "post", null, null, false);
	
	if(annex_documents.result != 200) {
		$("#cp_annex_holder").html("No documents yet...");
		return;
	}

	var annex_tmpl = getTemplate("annex_document_tr.html");

	_.each(annex_documents.data.documents, function(doc) {
		$($("#cp_annex_holder").children('table')[0])
			.append(Mustache.to_html(annex_tmpl, doc));
	});

	
}

function hideAnnex() {
	$("#cp_annex_holder").css('display', 'none');

	$($($("#cp_annex_holder").children('table')[0]).find('tr')).each(function() {
		if($(this).attr('id')) {
			$(this).remove();
		}
	});

	var annex_button = $("#cp_annex_button").children('a')[0];

	$(annex_button).unbind("click");
	$(annex_button).bind("click", showAnnex);

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
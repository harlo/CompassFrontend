var CompassDocumentHeader = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);

		if(!this.has('root_el')) {
			this.set('root_el', $("#content"));
		}

		this.set('tag_tmpl', getTemplate("tag_tmpl.html"));

		$(this.get('root_el')).prepend(translate(Mustache.to_html(
			getTemplate("cp_document_header_holder_tmpl.html"), 
			document_browser.get('data'))));

		$($("#cp_document_tag_editor").children('input'))
			.keypress(function(key) {
				if(key.which == 13 && $(this).val() != '') {
					document_browser.addTag($(this).val());
					$(this).val('');
				}
			});

		window.onTagsRefreshed = _.bind(this.onTagsRefreshed, this);
		window.onTagEditorRequested = _.bind(this.onTagEditorRequested, this);
		window.onTagRemoveRequested = _.bind(this.onTagRemoveRequested, this);
		document_browser.refreshTags();
	},
	addOption: function(options) {
		if(!(_.isArray(options))) { options = [options]; }
		_.each(options, function(option) {
			$("#cp_document_opts").append(
				$(document.createElement('a'))
					.prop('href', option.href)
					.html(option.html));
		});
	},
	onTagsRefreshed: function() {
		var mode = $("#cp_document_tags")
			.hasClass("cp_region_editing") ? "" : "uv_toggle_none";

		$("#cp_document_tags").html(
			_.map(document_browser.get('tags'), function(tag) {
				return $(document.createElement('span'))
					.html(Mustache.to_html(this.get('tag_tmpl'), _.extend(tag, { uv_toggle_none : mode })));
			}, this)
		);
	},
	onTagEditorRequested: function() {
		if(toggleElement('#cp_document_tag_editor')) {
			$("#cp_document_tags").addClass('cp_region_editing');
			$(".cp_tag_handle").css('display', 'unset');
		} else {
			$("#cp_document_tags").removeClass('cp_region_editing');
			$(".cp_tag_handle").css('display', 'none');
		}
	},
	onTagRemoveRequested: function(tag_name) {
		document_browser.removeTag(tag_name);
	}
});
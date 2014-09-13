var CompassPageWindow = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);

		if(!document_viewer) { return; }

		var root_el = $(document.createElement('div'))
			.attr({'id' : "cp_page_window" })
			.html(Mustache.to_html(getTemplate("page_window.html", null, "/web/layout/views/popup/"), {
				min : _.first(this.get('pages')) + 1,
				max : _.last(this.get('pages')) + 1
			}));

		$('body').append($(root_el));
		this.set('root_el', root_el);

		this.setPage(this.get('pages')[0]);
	},
	setPage: function(page) {
		this.set('current_page', page);

		var page_data;
		try {
			page_data = doInnerAjax("documents", "post", {
				media_id : document_viewer.get('data')._id,
				index_in_parent : page,
				get_all : true,
				doc_type : "cp_page_text"
			}, null, false).data.documents[0].searchable_text;
		} catch(err) { console.warn(err); }

		if(!page_data) { page_data = "Could not find page..."; }
		else {
			page_data = unescape(page_data.escape());
			
			if(this.get('highlight_terms')) {
				_.each(this.get('highlight_terms'), function(term) {
					var rx = new RegExp(term.term, 'gi');
					var repl = "<span style='background-color:" + term.color + "; color:#fff;'>" + term.term + "</span>"
				
					page_data = page_data.replace(rx, repl);
				}, this);
			}
		}

		$($(this.get('root_el')).find('.cp_page_index')[0]).html(page + 1);
		$($(this.get('root_el')).find('.cp_searchable_text')[0]).html(page_data);
	},
	nextPage: function() {
		var page = _.indexOf(this.get('pages'), this.get('current_page'));
		try {
			var next_page = this.get('pages')[page + 1];
		} catch(err) { console.warn(err); }

		if(next_page) { this.setPage(next_page); }
	},
	previousPage: function() {
		var page = _.indexOf(this.get('pages'), this.get('current_page'));
		try {
			var previous_page = this.get('pages')[page - 1];
		} catch(err) { console.warn(err); }

		if(previous_page) { this.setPage(previous_page); }
	},
	destroy: function() {
		$("#cp_page_window").remove();
		delete window.page_window;
	}
});
var CompassDocument = UnveillanceDocument.extend({
	constructor: function() {
		UnveillanceDocument.prototype.constructor.apply(this, arguments);
	},
	updateInfo: function() {
		var updated_info = _.findWhere(
			document_browser.get('data'), { _id : this.get('_id') });
		
		if(updated_info) {
			this.set(updated_info);
			onViewerModeChanged("document", force_reload=true);
		}
	},
	initViewer: function() {
		if(!this.has('available_views')) {
			this.set('available_views', []);
		}
	},
	requestReindex: function() {
	
	},
	setInPanel: function(asset) {
		var callback = null;
		
		insertTemplate(
			asset + ".html", 
			this.toJSON(), 
			"#cp_document_view_panel", 
			callback, 
			"/web/layout/views/document/");
		
		$.each($("#cp_document_main_ctrl").children('li'), function() {
			if($(this).attr('id') == "cp_d_" + asset) {
				$(this).addClass("cp_active");
			} else {
				$(this).removeClass("cp_active");
			}
		});
	}
});
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
		
		
	}
});
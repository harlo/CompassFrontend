var CompassDocument = UnveillanceDocument.extend({
	constructor: function() {
		UnveillanceDocument.prototype.constructor.apply(this, arguments);
		
		this.available_views = [];

		switch(this.get("mime_type")) {
			case "text/plain":
				this.available_views.push("nlp_tools");
				break;
			case "application/pdf":
				this.available_views.push("nlp_tools", "pdf_editor");
				break;
		}
	}
});
var CompassUser = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);
		
		
	},
	resendPublicKey: function() {
		doInnerAjax("send_public_key", "post", null, function(json) {
			console.info(json);
			
			json = JSON.parse(json.responseText);
			
			if(json.result == 200) {
			
			}
		});
	}
});
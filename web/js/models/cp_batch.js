var CompassBatch = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);
	},
	addItem: function(_id) {
		if(!_.findWhere(this.get('batch'), { _id : _id })) {
			this.get('batch').push({ _id : _id });
		}
	},
	removeItem: function(_id) {
		var item = _.findWhere(this.get('batch'), { _id : _id });
		if(item) {
			this.set('batch', _.reject(this.get('batch'), function(_item) {
				return _item._id == _id;
			}));
		}
	}
});
var CompassBatch = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);
		this.update();
		
		if(annex_channel) {
			annex_channel.get('message_map').push(
				_.bind(this.parseTaskMessage, this));
		}

		console.info(this);
	},
	parseTaskMessage: function(message) {
		if(message.doc_id && message.doc_id == this.get('_id')) {
			sendToNotificationTray(message);
			if(message.status == 410) {
				console.info("AND DONE!");
				this.update();
			}
		}
	},
	update: function() {
		console.info("UPDATING!");
		var batch_header = doInnerAjax("documents", "post", { _id : this.get('_id'), uv_doc_type : "UV_TASK" }, null, false);
		if(batch_header.result != 200) {
			return;
		}

		this.set('data', batch_header.data);
		if(!this.has('batch_result') || !(this.get('batch_result'))) {
			this.set('batch_result', this.getResult());
		}
	},
	getResult: function() {
		if(!this.get('data').assets) {
			return;
		}

		var res_file;

		try {
			res_file = _.find(this.get('data').assets, function(a) {
				return _.contains(a.tags, UV.ASSET_TAGS['C_RES']);
			}).file_name;
		} catch(err) {
			console.warn(err);
			return;
		}

		if(res_file) {
			try {
				return JSON.parse(
					getFileContent(this, [this.get('data').base_path, res_file].join("/")));
			} catch(err) {
				console.error(err);
			}
		}
	}

});
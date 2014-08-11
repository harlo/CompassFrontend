var CompassBatch = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);
		
		if(visual_search && visual_search.searchBar.searchQuery.models.length > 0) {
			this.set({
				initial_query : _.map(visual_search.searchBar.searchQuery.models,
					function(mod) {
						return _.omit(mod.toJSON(), 'app');
					}
				)
			});
		}
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
	},
	save: function() {
		if(!window.UnveillanceUser || !current_user) { return false; }
		
		var batches;
		try {
			batches = _.pluck(current_user.get('session_log'), "batches")[0];
		} catch(err) {
			console.warn(err);
		}
		
		if(!batches) {
			current_user.get('session_log').push({ batches : [] });
			return this.save();
		}
		
		batches.push(this.get('batch'));
		current_user.save();
		return true;
	},
	update: function() {
		this.updateCommonModules();
		this.updateViews();
	},
	updateViews: function() {
		$("#cp_batch_num").html(this.get('batch').length);
		
		var _ids = _.flatten(_.pluck(this.get('batch'), "_id"));
		var file_names = _.pluck(_.filter(document_browser.get('data'), function(doc) {
			return _.indexOf(_ids, doc._id) >= 0;
		}), "file_name");
		
		_.each(file_names, function(name) {
			$("#cp_batch_doc_list").append($(document.createElement('span'))
				.addClass('cp_file_name cp_inactive')
				.html(name)
			);
		});
		
		getTemplate("module_ctrl.html", function(res) {
			if(res.status != 200) { return; }

			_.each(this.get('modules'), function(module) {
				if(module._ids.length == 0) { return; }
				
				$("#cp_batch_common_funcs_list").append(
					$(document.createElement('li'))
						.html(Mustache.to_html(res.responseText, module)));
			});
		}, null, this);
		
	},
	updateCommonModules: function() {
		this.set('modules', _.clone(UV.ASSET_MODULES));
		
		var ctx = this;
		
		_.each(this.get('batch'), function(item) {
			var document = _.findWhere(document_browser.get('data'), { _id : item._id });
			if(!document) { return; }

			var document_modules = _.filter(ctx.get('modules'), function(mod) {
				var doc_tags = _.flatten(_.pluck(document.assets, 'tags'));
				var common_tags = _.intersection(doc_tags, mod.asset_tags);
				
				return common_tags.length > 0;
			});
			
			_.each(document_modules, function(mod) {
				var module = _.findWhere(ctx.get('modules'), { name : mod.name });
				if(module) {
					var idx = _.indexOf(
						_.flatten(_.pluck(ctx.get('modules'), "name")),
						module.name);
					
					if(!ctx.get('modules')[idx]._ids) {
						ctx.get('modules')[idx]._ids = [];
					}
					
					if(idx >= 0) { ctx.get('modules')[idx]._ids.push(document._id); }
				}
			});			
		});
	}
});
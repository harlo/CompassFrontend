var CompassConsole = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);
		
		this.set({
			code_el : $($("#cp_console_script_holder").find('textarea')[0]),
			output_el: $("#cp_console_output_holder")
		});
		
		Sk.configure({ output : this.get('output_el').get(0) });
		
		if(this.has('documents')) {
			_.each(_.pluck(this.get('documents'), 'assets'), function(doc) {
				_.each(doc, function(asset) {
					var obj = new CompassConsoleObject(asset);
				
					$($("#cp_console_obj_holder").find('ul')[0]).append(
						$(document.createElement('li')).append($(obj.get('el')))
					);
				})
			});
		}
	},
	run: function() {
		Sk.importMainWithBody("<stdin>", false, $(this.get('code_el')).val());
	},
	save: function() {
	
	}
});

var CompassConsoleObject = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);

		this.set({
			el : $(document.createElement('a'))
				.attr({'id' : this.cid })
				.addClass("cp_console_obj uv_button")
				.html(this.get('tags'))
				.click(this.addToEditor())
		});
	},
	addToEditor: function() {
		
	}
});
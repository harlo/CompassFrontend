var CompassConsole = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);
		
		this.set({
			code_el : $($("#cp_console_script_holder").find('textarea')[0]),
			output_el: $("#cp_console_output_holder")
		});
		
		Sk.configure({ output : this.doOutput, read: this.doRead });
		
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
		$(this.get('output_el')).empty();
		Sk.importMainWithBody("<stdin>", false, $(this.get('code_el')).val());
	},
	save: function() {
	
	},
	doOutput: function(outp) {
		$(cp_console.get('output_el')).html(
			$(cp_console.get('output_el')).html() + "\n" + outp);
	},
	doRead: function(x) {
		console.info("CONSOLE: " + x);
		if(Sk.builtinFiles === undefined || Sk.builtinFiles['files'][x] === undefined) {
			throw "File not found: '" + x + "'";
		}
		
		return Sk.builtinFiles['files'][x]
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
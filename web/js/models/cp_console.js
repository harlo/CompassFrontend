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
		$("#cp_console_output_holder").get(0).scrollIntoView();
	},
	save: function() {
		if(!window.CompassUserAdmin || !current_user) { return false; }
		
		var scripts;
		try {
			scripts = _.pluck(current_user.get('session_log'), "scripts")[0];
		} catch(err) {
			console.warn(err);
		}
		
		if(!scripts) {
			current_user.get('session_log').push({ scripts: [] });
			return this.save();
		}
		
		// AND DO WHAT?
		
		current_user.save();
		return true;
	},
	doOutput: function(outp) {
		if(outp.length <= 1) { return; }
		
		$(cp_console.get('output_el')).html(
			$(cp_console.get('output_el')).html() + "<br />" + outp);
	},
	doRead: function(x) {
		if(Sk.builtinFiles === undefined || Sk.builtinFiles['files'][x] === undefined) {
			console.error("Could not find " + x);
			throw "File not found: '" + x + "'";
		}
		
		return Sk.builtinFiles['files'][x];
	},
	pushObjectToEditor: function(obj) {
	
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
				.click(this.addToEditor)
		});
	},
	addToEditor: function() {
		cp_console.pushObjectToEditor(this);
	}
});
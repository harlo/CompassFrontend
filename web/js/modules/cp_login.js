function login() {
	var user = {
		username: $($("#cp_login").find("input[name=username]")[0]).val(),
		password: $($("#cp_login").find("input[name=password]")[0]).val()
	};
	
	doInnerAjax("login", "post", user, function(json) {
		console.info(json);
	});
}

(function($) {
	var login_sammy = $.sammy("#header", function() {
		this.get("#login", function() {
			insertTemplate("login.html", null, $("#cp_popup_content"), function() {
				toggleElement("#cp_popup_holder");
			});
		});
	});
	
	$(function() {
		login_sammy.run();
		$("#cp_nav_options").append($(document.createElement('li'))
			.html('<a href="#login">log in</a>'));
	});
})(jQuery);
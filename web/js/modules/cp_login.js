var current_user;

function init() {
	current_user = new UnveillanceUser();
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
		init();
		$("#cp_nav_options").append($(document.createElement('li'))
			.html('<a href="#login">log in</a>'));
	});
})(jQuery);
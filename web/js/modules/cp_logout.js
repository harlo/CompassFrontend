var current_user;

function init() {
	current_user = new CompassUser();
}

(function($) {
	var logout_sammy = $.sammy("#header", function() {
		this.get("#logout", function() {
			insertTemplate("logout.html", current_user.toJSON(), $("#cp_popup_content"),
				function() {
					toggleElement("#cp_popup_holder");
				}
			);
		});
	});
	
	$(function() {
		logout_sammy.run();
		init();
		$("#cp_nav_options")
			.append($(document.createElement('li'))
				.html('<a href="#me">' + current_user.get('username') + '</a>'))
			.append($(document.createElement('li'))
				.html('<a href="#logout">log out</a>'));
	});
})(jQuery);
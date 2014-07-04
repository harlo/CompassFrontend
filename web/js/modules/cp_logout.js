var current_user;

function initUser() {
	current_user = new CompassUser();
}

function logout() {
	var user = {};
	
	if($("#cp_logout_with_data").css('display') != "none") {
		user = current_user.toJSON();
		user.password = $($("#cp_logout_with_data")
			.find("input[name=password]")[0]).val();
	}
	
	doInnerAjax("logout", "post", user, function(json) {
		console.info(json);
	});
}

(function($) {
	var logout_sammy = $.sammy("#header", function() {
		this.get("#logout", function() {
			insertTemplate("logout.html", null, $("#cp_popup_content"), function() {
				toggleElement("#cp_popup_holder");
			});
		});
	});
	
	$(function() {
		logout_sammy.run();
		$("#cp_nav_options").append($(document.createElement('li'))
			.html('<a href="#logout">log out</a>'));
		initUser();
	});
})(jQuery);
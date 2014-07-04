function login() {
	var user = {
		username: $($("#").find("input[name=]")[0]).val(),
		password: $($("#").find("input[name=]")[0]).val()
	};
	
	doInnerAjax("login", "post", user, function(json) {
		console.info(json);
	});
}
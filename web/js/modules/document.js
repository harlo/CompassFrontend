var cp_doc = null;

(function($) {
	$(function() {
		initDocument();
	});
})(jQuery);

function initDocument() {
	var _id = location.search.split('_id=')[1];
	doInnerAjax("documents", "post", { _id : _id }, function(json) {
		json = JSON.parse(json.responseText);

		if(json.result == 200) {
			cp_doc = new CompassDocument(json.data);

			insertTemplate("document_single.html", cp_doc.toJSON(),
				"#cp_document_info_holder", function() {
					// load document into viewer depending on mime type
					_.each(cp_doc.available_views, function(item) {
						var module_shell = $(document.createElement("div"))
							.attr({
								'class' : "cp_module_shell",
								'id' : "cp_module_" + item
							});
						var module_script = $(document.createElement("script"))
							.attr({
								'src' : "/web/js/modules/cp_doc/" + item + ".js",
								'type' : 'text/javascript'
							});

						insertTemplate(item + ".html", null,
							module_shell, function() {
								$("#cp_document_view_holder").append(module_shell);
								document.getElementsByTagName("head")[0].appendChild(module_script.get(0));

							}, "/web/layout/views/document/");
					});
				}
			);
		}
	})
}
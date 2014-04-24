var nlp_viz = null;

(function($) {
	$(function() {
		_.each(["cp_word_cloud.js"], function(src) {
			var viz_script = $(document.createElement("script"))
				.attr({
					'type' : "text/javascript",
					'src' : "/web/js/viz/" + src
				});
			document.getElementsByTagName("head")[0].appendChild(viz_script.get(0));
		});

		$("#cp_nlp_tools_selector").change(function(e) {
			var selected_tool = $("#cp_nlp_tools_selector").children("option:selected")[0];
			if($(selected_tool).val() != "null") { loadViz($(selected_tool).attr('name')); }
		})
	});
})(jQuery);

function loadViz(selected_tool) {
	var data_set, callback;

	switch(selected_tool) {
		case "cp_word_cloud":
			data_set = cp_doc.getAssetsByTagName("bag_of_words")[0];
			callback = function(data) {
				if(data.status != 200) { return; }

				nlp_viz = new CompassWordCloud({
					data : JSON.parse(data.responseText),
					root_el : "#cp_nlp_tools_viz"
				});
			}
			break;
	}

	if(data_set && callback) {
		getFileContent(null, ".data/" + cp_doc.get('_id') + "/" + data_set.file_name, callback);
	}
}
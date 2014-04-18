$(document).ready(function() {
	doInnerAjax("documents", "post", null, function(json) {
		json = JSON.parse(json.responseText);
		if(json.result == 200) {
			console.info(json);

			var docs = json.data.documents;
			var tmpl = "document_list.html";

			if(!docs) {
				docs = json.data;
				tmpl = "document_single.html";
			}

			insertTemplate(tmpl, docs, "#c_doc_list", null);
		}
	});
});
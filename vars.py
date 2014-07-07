from lib.Frontend.vars import *

compass_mime_types = {
	'pdf' : "application/pdf"
}

compass_mime_type_map = {
	'application/pdf' : "pdf"
}

compass_mime_type_tasks = {
	"application/pdf" : [
		"PDF.process_metadata.processPDFMetadata", 
		"PDF.split_pdf_pages.splitPDFPages",
		"PDF.ocr_pdf.OCRPDF", 
		"PDF.extract_pdf_text.extractPDFText", 
		"Text.preprocess_nlp.preprocessNLP",
		"NLP.tokenizer.basicTokenizer"
	]
}

document_cloud_tasks = [
	"DocumentCloud.upload_doc.uploadDocument",
	"DocumentCloud.get_assets.getAssets"
]

MIME_TYPES.update(compass_mime_types)
MIME_TYPE_MAP.update(compass_mime_type_map)

MIME_TYPE_TASKS.update(compass_mime_type_tasks)
MIME_TYPE_TASKS["application/pdf"].extend(document_cloud_tasks)
MIME_TYPE_TASKS["text/plain"].extend(document_cloud_tasks)
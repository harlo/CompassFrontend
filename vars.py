from copy import deepcopy
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
		"NLP.tokenizer.basicTokenizer",
		"NLP.address_parser.addressParser"
	]
}

authenticated_tasks = [
	"DocumentCloud.upload_doc.uploadDocument",
	"DocumentCloud.get_assets.getAssets"
]

text_plain_tasks = deepcopy(authenticated_tasks)
text_plain_tasks.extend([
	"NLP.tokenizer.basicTokenizer",
	"NLP.address_parser.addressParser"
])

compass_asset_tags = {
	"TOKENS_NLP" : "stanford_core_nlp_tokenizer",
	"DOC_CLOUD_ENTITIES" : "document_cloud_entities",
	"DOC_CLOUD_MANIFEST" : "document_cloud_manifest",
	"DOC_CLOUD_DOC" : "document_cloud_document",
	"ADDRESSES_NLP" : "addresses_nlp"
}

MIME_TYPES.update(compass_mime_types)
MIME_TYPE_MAP.update(compass_mime_type_map)

MIME_TYPE_TASKS.update(compass_mime_type_tasks)
MIME_TYPE_TASKS["application/pdf"].extend(text_plain_tasks)
MIME_TYPE_TASKS["text/plain"].extend(text_plain_tasks)

ASSET_TAGS.update(compass_asset_tags)

MIME_TYPE_TASK_REQUIREMENTS.extend([{ tp : { "auth_string" : "documentcloud_auth_str"}} for tp in authenticated_tasks])
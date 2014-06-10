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

MIME_TYPES.update(compass_mime_types)
MIME_TYPE_MAP.update(compass_mime_type_map)
MIME_TYPE_TASKS.update(compass_mime_type_tasks)
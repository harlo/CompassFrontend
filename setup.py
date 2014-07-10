import os, json
from sys import exit
from farbic.operations import prompt

from lib.Frontend.lib.Core.Utils.funcs import generateNonce
from conf import CONF_ROOT

if __name__ == "__main__":
	try:
		with open(os.path.join(CONF_ROOT, "unveillance.secrets.json", 'rb') as CONF:
			config = json.loads(CONF.read())
	except Exception as e:
		print "NO CONF?"
		exit(1)
	
	dc_ask = True
	if 'documentcloud_no_ask' in config.keys() and config['documentcloud_no_ask']:
		dc_ask = False
	
	if dc_ask and 'documentcloud_auth_str' not in config.keys():
		print "****************************"
		print "Link DocumentCloud account?  y or n?"
		use_dc = prompt("[DEFAULT: n]")
		
		if use_dc == "y":
			dc_user = prompt("Username: ")
			dc_pwd = prompt("Password: ")
			config['documentcloud_auth_str'] = "%s:%s@" % (dc_user.replace("@", "%40"),
				dc_pwd)
	
	with open(os.path.join(COMPASS_CONF_ROOT, "compass.init.json"), 'wb+') as WEB:
		WEB.write(json.dumps({
			'web' : {
				'BATCH_SALT' : generateNonce(),
				"DEFAULT_STOPWORDS" : {
					"english" : [
						"a", "about", "above", "above", "across", "after", 
						"afterwards", "again", "against", "all", "almost", 
						"alone", "along", "already", "also","although","always","am",
						"among", "amongst", "amoungst", "amount", "an", 
						"and", "another", "any","anyhow","anyone","anything",
						"anyway", "anywhere", "are", "around", "as", "at",
						"back","be","became", "because","become","becomes",
						"becoming", "been", "before", "beforehand", "behind", 
						"being", "below", "beside", "besides", "between", 
						"beyond", "bill", "both", "bottom","but", "by", "call", 
						"can", "cannot", "cant", "co", "con", "could", "couldnt", 
						"cry", "de", "describe", "detail", "do", "done", "down", 
						"due", "during", "each", "eg", "eight", "either", "eleven",
						"else", "elsewhere", "empty", "enough", "etc", "even", 
						"ever", "every", "everyone", "everything", "everywhere", 
						"except", "few", "fifteen", "fify", "fill", "find", 
						"fire", "first", "five", "for", "former", "formerly", 
						"forty", "found", "four", "from", "front", "full", 
						"further", "get", "give", "go", "had", "has", 
						"hasnt", "have", "he", "hence", "her", "here", 
						"hereafter", "hereby", "herein", "hereupon", "hers", 
						"herself", "him", "himself", "his", "how", "however", 
						"hundred", "ie", "if", "in", "inc", "indeed", "interest", 
						"into", "is", "it", "its", "itself", "keep", "last", 
						"latter", "latterly", "least", "less", "ltd", "made", 
						"many", "may", "me", "meanwhile", "might", "mill", "mine", 
						"more", "moreover", "most", "mostly", "move", "much", 
						"must", "my", "myself", "name", "namely", "neither", 
						"never", "nevertheless", "next", "nine", "no", "nobody", 
						"none", "noone", "nor", "not", "nothing", "now", 
						"nowhere", "of", "off", "often", "on", "once", "one", 
						"only", "onto", "or", "other", "others", "otherwise", 
						"our", "ours", "ourselves", "out", "over", "own","part", 
						"per", "perhaps", "please", "put", "rather", "re", "same", 
						"see", "seem", "seemed", "seeming", "seems", "serious", 
						"several", "she", "should", "show", "side", "since", 
						"sincere", "six", "sixty", "so", "some", "somehow", 
						"someone", "something", "sometime", "sometimes", 
						"somewhere", "still", "such", "system", "take", "ten", 
						"than", "that", "the", "their", "them", "themselves", 
						"then", "thence", "there", "thereafter", "thereby", 
						"therefore", "therein", "thereupon", "these", "they", 
						"thickv", "thin", "third", "this", "those", "though", 
						"three", "through", "throughout", "thru", "thus", "to",
						"together", "too", "top", "toward", "towards", "twelve", 
						"twenty", "two", "un", "under", "until", "up", "upon", 
						"us", "very", "via", "was", "we", "well", "were", "what", 
						"whatever", "when", "whence", "whenever", "where", "whereafter", 
						"whereas", "whereby", "wherein", "whereupon", "wherever", 
						"whether", "which", "while", "whither", "who", "whoever", 
						"whole", "whom", "whose", "why", "will", "with", "within",
						"without", "would", "yet", "you", "your", "yours", 
						"yourself", "yourselves", "the"
					]
				}
			}
		})
	
	with open(os.path.join(CONF_ROOT, "unveillance.secrets.json", 'wb+') as CONF:
		CONF.write(json.dumps(config))
	
	exit(0)
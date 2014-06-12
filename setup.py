import os
from sys import exit
from json import loads
from fabric.api import local
from fabric.operations import prompt

if __name__ == "__main__":
	base_dir = os.getcwd()
	secrets_config = os.path.join(base_dir, "lib", "Frontend", "conf",
		"unveillance.secrets.json")
	cp_step = local("cp conf/compass.secrets.json.example %s" % secrets_config)
	
	with open(secrets_config, 'rb') as s_conf:
		secrets = loads(s_conf.read())['unveillance.local_remote']
		try:
			annex_host = secrets['hostname']
		except KeyError as e:
			print "[ ERROR ] could not find a hostname for remote"
			exit(1)
		
		try:
			annex_port = secrets['api_port']
		except KeyError as e:
			annex_port = 8888
	 
	ssh_root = prompt("Type the full path to your .ssh folder and press ENTER\n[DEFAULT ~/.ssh]:")
	
	if len(ssh_root) == 0: ssh_root = "~/.ssh"

	os.chdir("lib/Frontend")
	setup_cmd = "python setup.py '%s' '%s' '%s' %d True" % (base_dir, 
		ssh_root, annex_host, annex_port)
	setup_step = local(setup_cms)
	
	os.chdir("web")
	ln_step = local("ln -s ../../../web/ extras")
	
	os.chdir(base_dir)
	local("pip install --upgrade -r requirements.txt")
	local("python compass_frontend.py -firstuse -webapp")
	
	exit(0)
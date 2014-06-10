import os
from sys import exit
from json import loads
from fabric.api import local
from fabric.operations import prompt

if __name__ == "__main__":
	base_dir = os.getcwd()
	cp_step = local("cp conf/compass.secrets.json.example conf/compass.secrets.json")
	
	with open("conf/compass.secrets.json", 'rb') as s_conf:
		try:
			annex_host = loads(s_conf.read())['unveillance.local_remote']['hostname']
		except KeyError as e:
			print "[ ERROR ] could not find a hostname for remote"
			exit(1)
	 
	ssh_root = prompt("Type the full path to your .ssh folder and press ENTER\n[DEFAULT ~/.ssh]:")
	
	if len(ssh_root) == 0: ssh_root = "~/.ssh"

	os.chdir("lib/Frontend")
	setup_cmd = "./setup.sh %s %s %s 8888 false" % (base_dir, ssh_root, annex_host)
	setup_step = local(setup_cms)
	
	os.chdir("web")
	ln_step = local("ln -s ../../../web/ extras")
	print ln_step
	
	os.chdir(base_dir)
	local("pip install --upgrade -r requirements.txt")
	local("python compass_frontend.py -firstuse -webapp")
	
	exit(0)
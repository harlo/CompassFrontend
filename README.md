# Compass-UnveillanceFrontend

## Setup

1.	After cloning this repo, `cd /path/to/CompassFrontend` and pull down the necessary submodules with
	
	`git submodule update --init --recursive`

1.	Run `./setup.sh` or pre-configure the Frontend with a .json config file (see **Configure** for more info) with `./setup.sh /path/to/config.json`.
1.	Follow the prompts.

## Configure

If you have access to the corresponding Annex, create a config file like so:

1.	`cd /path/to/CompassAnnex/lib/Annex`
1.	`python unveillance_annex.py -config`
1.	copy the output json object into a file of your choosing.

If you don't have access, ask your administrator.

You may edit any of the directives to suit your needs, or add others that might help with your specific setup using the following directives as your guide.

#### Configuration Directives

###### Local Directives

*	**ssh_root (str)**
	The full path to your SSH config

*	**api.port (int)**
	The port the Frontend should run on

*	**annex_local (str)**
	The full path to your local folder (which should not exist beforehand!)

*	**web_home_mime_types (list str)**
	Home page will automatically query for documents matching these mime types

###### Annex-specific Directives

*	**annex_admin_email (str)**
	Email address for the Annex's administrator.

*	**server_host (str)**
	The Annex server's hostname

*	**server_port (int)**
	The Annex server's port

*	**server_user (str)**
	The user to invoke via SSH when communicating to the server

*	**uv_uuid (str)**
	The shortcode for the server

*	**annex_remote (str)**
	The remote folder on the Annex server that holds submissions

*	**annex_remote_port (int)**
	The port the Annex uses SSH over (most likely 22, but some installations via Docker will necessarily be on other ports)

*	**server_use_ssl (bool)**
	Whether or not the server uses SSL

*	**server_message_port (int)**
	The port the Annex Channel broadcast's on.  (It is assumed that the annex channel is on the same host as the Annex.)

*	**server_message_use_ssl (bool)**
	Whether or not the Annex Channel broadcasts over SSL.  (If server_message_port is 443, this will default to True)

###### Google Drive-specific Directives

*	**gdrive_auth_no_ask (bool)**
	Asks whether or not the Frontend should import documents from Google Drive.  Experimental.  Set it to True unless you know what you're doing.

## Messaging

The Annex will broadcast the status of all tasks to connected web Frontend clients via websocket.

#### Format

Messages from the annex channel will have the following format:

	{
		"_id" : "c895e95034a4a37eb73b3e691e176d0b",
		"status" : 302,
		"doc_id" : "b721079641a39621e08741c815467115",
		"task_path" : "NLP.gensim.get_topics",
		"task_type" : "UnveillanceTask"
	}

The annex channel will also send messages acknowledging the status of the connection.  Developers can do with that what they will.  The `_id` field is the task's ID in our database, the `doc_id` field represents the document in question (where available).

#### Status Codes

*	**201 (Created)** Task has been registered.
*	**302 (Found)** Task is valid, and can start.
*	**404 (Not Found)** Task is not valid; cannot start.
*	**200 (OK)** Task completed; finishing.
*	**412 (Precondition Failed)** Task failed; will finish in failed state.
*	**205 (Reset Content)** Task persists, and will run again after the designated period.
*	**410 (Gone)** Task deleted from task queue.

#! /bin/bash
THIS_DIR=`pwd`
mkdir conf

if [ $# -eq 0 ]
then
	WITH_CONFIG=$THIS_DIR/conf/compass.secrets.json
else
	WITH_CONFIG=$1
fi

cd lib/Frontend
./setup.sh $WITH_CONFIG

cd $THIS_DIR
python setup.py

cd $THIS_DIR/lib/Frontend/web
ln -s $THIS_DIR/web/ extras

cd $THIS_DIR
chmod 0400 conf/compass.init.json
chmod 0400 lib/Frontend/conf/unveillance.secrets.json
chmod 0400 lib/Frontend/conf/local.config.yaml
python compass_frontend.py -firstuse
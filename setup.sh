#! /bin/bash
THIS_DIR=`pwd`

#pip install --upgrade fabric

cd lib/Frontend
./setup.sh $THIS_DIR/conf/compass.secrets.json

cd web
ln -s $THIS_DIR/web/ extras

cd $THIS_DIR
chmod 0400 lib/Frontend/conf/*
python compass_frontend.py -firstuse -webapp
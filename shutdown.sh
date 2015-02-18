#! /bin/bash
THIS_DIR=`pwd`
source venv/bin/activate

cd lib/Frontend
./shutdown.sh $THIS_DIR/compass_frontend.py

deactivate venv
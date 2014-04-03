#! /bin/bash
OLD_DIR=`pwd`
LOCAL_CONFIG=$OLD_DIR/conf/local.config.yaml

echo "**************************************************"
echo "************** COMPASS SETUP **************"

cd lib/Frontend
./setup.sh $OLD_DIR
cd web
ln -s ../../../web/ extras
cd $OLD_DIR

pip install --upgrade -r requirements.txt

echo "**************************************************"
echo "Launching frontend..."
cd $OLD_DIR
python compass_frontend.py -firstuse
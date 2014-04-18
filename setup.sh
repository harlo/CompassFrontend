#! /bin/bash
OLD_DIR=`pwd`

echo "**************************************************"
echo "************** COMPASS SETUP **************"

cd lib/Frontend
./setup.sh $OLD_DIR
cd web
ln -s ../../../web/ extras

echo "**************************************************"
echo "Launching frontend..."
cd $OLD_DIR
python compass_frontend.py -firstuse
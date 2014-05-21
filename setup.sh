#! /bin/bash
OLD_DIR=`pwd`

echo "**************************************************"
echo "************** COMPASS SETUP **************"

cp conf/compass.secrets.json.example conf/compass.secrets.json

cd lib/Frontend
./setup.sh $OLD_DIR ~/.ssh "10.51.118.238" 8888 false
cd web
ln -s ../../../web/ extras

cd $OLD_DIR
#pip install --upgrade -r requirements.txt
python compass_frontend.py -firstuse
#!/bin/bash
source /data/fs_bds_ai/fs_bds_ai/script/venv/bin/activate
/data/fs_bds_ai/fs_bds_ai/script/venv/bin/python /data/fs_bds_ai/fs_bds_ai/script/youtube_list.py & 
PID1=$!
/data/fs_bds_ai/fs_bds_ai/script/venv/bin/python /data/fs_bds_ai/fs_bds_ai/script/bds_list.py & 
PID2=$!

wait $PID1
wait $PID2

deactivate
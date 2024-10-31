#!/bin/bash

cat << EOF
Welcome to

 ######    ######    #### ###  ###   #### #########   ######   #########
 ### ###  ###  ###  ###   ### ###  ###       ###     ###  ###     ###
 ###  ### ###  ### ###    ######   ####      ###    ###    ###    ###
 ###  ### ###  ### ###    ### ###   ####     ###   ############   ###
 ### ###  ###  ###  ###   ### ###     ####   ###   ###      ###   ###
 ######    ######    #### ###  ###  ####     ###   ###      ###   ###     (API)

Useful links:

- Documentation:     https://outline.itsnik.de/s/dockstat
- GitHub (Frontend): https://github.com/its4nik/dockstat
- GitHub (Backend):  https://github.com/its4nik/dockstatapi
- API Documentation: http://localhost:7000/api-docs

Summary:

DockStat and DockStatAPI are 2 fully OpenSource projects, DockStatAPI is a simple but extensible API which allows queries via a REST endpoint.

The Backend (DockStatAPI) is fully written in JavaScript
EOF

npm run start

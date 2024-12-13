#!/bin/bash

echo -e "
\033[1;32mWelcome to\033[0m

\033[1;34m######    ######    #### ###  ###   #### #########   ######   #########\033[0m
\033[1;34m### ###  ###  ###  ###   ### ###  ###       ###     ###  ###     ###\033[0m
\033[1;34m###  ### ###  ### ###    ######   ####      ###    ###    ###    ###\033[0m
\033[1;34m###  ### ###  ### ###    ### ###   ####     ###   ############   ###\033[0m
\033[1;34m### ###  ###  ###  ###   ### ###     ####   ###   ###      ###   ###\033[0m
\033[1;34m######    ######    #### ###  ###  ####     ###   ###      ###   ###     \033[0m(\033[1;33mAPI\033[0m)

\033[1;36mUseful links:\033[0m

- Documentation:     \033[1;32mhttps://outline.itsnik.de/s/dockstat\033[0m
- GitHub (Frontend): \033[1;32mhttps://github.com/its4nik/dockstat\033[0m
- GitHub (Backend):  \033[1;32mhttps://github.com/its4nik/dockstatapi\033[0m
- API Documentation: \033[1;32mhttp://localhost:7000/api-docs\033[0m

\033[1;35mSummary:\033[0m

DockStat and DockStatAPI are 2 fully OpenSource projects, DockStatAPI is a simple but extensible API which allows queries via a REST endpoint.

"

export VERSION="2.0.0"

exec node src/server.js

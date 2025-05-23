## DORA user interface

# Purpose
Front-end for the SDR Noise DataCollector

# Development Stack
- TypeScript
- Node.js
- yarn
- React.js
- vite
- Tailwind CSS
- Font-Awesome Free

# Dependencies

Install Node.js (>=20) (https://nodejs.org/en)
Install yarn (https://classic.yarnpkg.com/)

To install the node dependencies
- Fetch the code to a local folder
- Fetch the node dependencies: run the `yarn` command in the /ui folder in the command prompt

# Set the API URL
To run the UI you will need to set the `VITE_API_URL_BASE` variable in the `ui/e.env` file to point to the URL where you published the API.

# Development Server
To run the SDR Data COllector locally using the Development Server:
In the `/ui` folder run the following command in the command prompt `yarn dev`.

# Production
In the `/ui` folder run the following command in the command prompt `yarn build`.
This will build production site that can be found in the `/dist` folder.
Copy the files inteh `/dist` folder to your production server (nginx / Apache etc) and configure your web server to serve `index.hml`

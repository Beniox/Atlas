# Leaflet Map Integration with Airtable

This project integrates Airtable with Leaflet using openstreetmap.

![screenshot](media/airtable.png)

## Features
- Displays a map using Leaflet.js
- Fetches data from Airtable, including latitude, longitude, name, color, icon type, and icon size
- Custom description on click
- Settings panel for easy configuration within the Airtable block interface

## Technologies Used
- [Leaflet.js](https://leafletjs.com/) - A leading JavaScript library for interactive maps
- [Airtable Blocks](https://airtable.com/developers/blocks) - A platform for creating custom apps and integrations inside Airtable
- [React](https://react.dev/) - A JavaScript library for building user interfaces
- [Boxicons](https://boxicons.com/) - Icon library



## How to add this extension to your base

![How to add this block to your base](media/installing.png)

### Requirenments
- [Node.js](https://nodejs.org/en/download) - You need to have it installed

### Install

1. Click `Add an extension`
2. Choose `Build a custom extension`
3. Choose `Remix from GitHub'in the 'Start from an example` section
4. Paste `https://github.com/Beniox/leaflet-airtable` as the GitHub repository
5. Click `Create Extension`
6. Install the CLI: `npm install -g @airtable/blocks-cli`
7. In the folder where it should be installed to (only temporarily) open a terminal
8. Copy the given command starting with `block init ...`
9. Create an [API token](https://airtable.com/create/tokens) `scope:manage, Access:name` of your base
10. Move in the created folder with the terminal
11. Enter `npm run build`
12. It should now ba available in your base. If an error happens, check the api token

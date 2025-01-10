# Leaflet Map Integration with Airtable

This project integrates Airtable with Leaflet using openstreetmap.

![](media\airtable.png)

## Features
- Displays a map using Leaflet.js
- Fetches data from Airtable, including latitude, longitude, name, color, icon type, and icon size
- Customizes the map markers with various properties
- Allows configuration of the Airtable fields to customize the map's content
- Settings panel for easy configuration within the Airtable block interface

## Technologies Used
- [Leaflet.js](https://leafletjs.com/) - A leading JavaScript library for interactive maps
- [Airtable Blocks](https://airtable.com/developers/blocks) - A platform for creating custom apps and integrations inside Airtable
- [React](https://react.dev/) - A JavaScript library for building user interfaces
- [Boxicons](https://boxicons.com/) - Icon library



## How to add this extension to your base

![How to add this block to your base](media/installing.png)

1. Click 'Add an extension'
2. Choose 'Build a custom extension'
3. Choose 'Remix from GitHub'in the 'Start from an example' section
4. Paste `https://github.com/Beniox/leaflet-airtable` as the GitHub repository
5. Click 'Create Extension'
6. From there, follow [Airtable's SDK instructions](https://airtable.com/developers/blocks/guides/getting-started) to release the Block into your base

# Leaflet Map Integration with Airtable

This project integrates Airtable with Leaflet.js using OpenStreetMap to create interactive, customizable maps.

![screenshot](media/airtable.png)

# Features
- Displays an interactive map using Leaflet.js.
- Fetches data from Airtable, including:
  - Latitude and longitude coordinates.
  - Name, color, icon type, and icon size.
- Customizable marker descriptions shown on click.
- Settings panel for seamless configuration within the Airtable block interface.



## Technologies Used
- [Leaflet.js](https://leafletjs.com/): A powerful JavaScript library for building interactive maps.
- [Airtable Blocks](https://airtable.com/developers/blocks): A platform for creating custom apps and integrations inside Airtable.
- [React](https://react.dev/): A JavaScript library for building dynamic user interfaces.
- [Boxicons](https://boxicons.com/): A versatile icon library.
- [Leaflet.Fullscreen](https://github.com/Leaflet/Leaflet.fullscreen): A plugin to enable fullscreen functionality for Leaflet maps.



## How to add this extension to your base

![How to add this block to your base](media/installing.png)

## Requirenments
- [Node.js](https://nodejs.org/en/download): Ensure it is installed on your system.
- [git](https://git-scm.com/): Required for cloning and updating the extension.

## Install

1. Click `Add an extension` in your Airtable base.
2. Select `Build a custom extension`
3. Under the `Start from an example section`, click `Remix from GitHub'in the 'Start from an example`
4. Paste `https://github.com/Beniox/leaflet-airtable` as the GitHub repository
5. Click `Create Extension`
6. Install the CLI: `npm install -g @airtable/blocks-cli`
7. Open a terminal in your desired folder and run the command provided by Airtable, starting with `block init ...`
8. Create an [API token](https://airtable.com/create/tokens) with the following scope: `scope:manage, Access:name` of your base
9. Navigate to the created folder using the terminal and run: `npm run init`
10. The extension should now be available in your Airtable base. If errors occur, ensure the API token and configuration are correct.

## Update

To update the extension, open a terminal in the folder and run:
```npm
npm run update
```
This will fetch the latest version from the repository, override your local version, and upload it to your Airtable base.


## TODO:
- [ ] select which items should be display
- [ ] print map
- [x] if icon size is 0 dont display it
- [ ] colors not working as intended


# Settings

## Marker
### Colors
You can configure marker colors in two ways:
#### Static Colors
All markers will share the same color. Click the color field in the settings panel to open a color picker.

#### Dynamic Colors
Markers can have dynamic colors based on Airtable table data:
- Single Line Text: Use valid CSS color names (e.g., red, blue) or hex codes (e.g., #00ff00 for green).
- Single Select: Enable color-code options in the formatting section of your Airtable table and select a color.

This allows you to customize the map markers based on your data attributes

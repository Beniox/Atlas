import {initializeBlock} from '@airtable/blocks/ui';
import React from 'react';

function HelloWorldApp() {
    // YOUR CODE GOES HERE
    return (<div>
        <h1>Hello world</h1>
        <div id="map"></div>
    </div>);
}

initializeBlock(() => <HelloWorldApp />);

import {
    Box,
    FormField,
    TablePickerSynced,
    FieldPickerSynced,
    Switch,
    Input
} from '@airtable/blocks/ui';
import {FieldType} from "@airtable/blocks/models";
import React from 'react';
import {useGlobalConfig, useBase} from '@airtable/blocks/ui';

// Global Config Keys
export const GlobalConfigKeys = {
    TABLE_ID: 'tableId',
    LATITUDE_FIELD: 'latitudeFieldId',
    LONGITUDE_FIELD: 'longitudeFieldId',
    NAME_FIELD: 'nameFieldId',
    COLOR_FIELD: 'colorFieldId',
    BOX_ICON_FIELD: 'boxIconFieldId',
    ICON_SIZE_FIELD: 'iconSizeFieldId',
    USE_CLUSTERING: 'useClustering',
    ALLOW_FULL_SCREEN: 'allowFullScreen',
    SINGLE_ICON_NAME: 'singleIconName', // New key for single icon value
    USE_SINGLE_ICON: 'useSingleIcon',  // New key for toggle stat
};

function Settings() {
    const base = useBase();
    const globalConfig = useGlobalConfig();
    const tableId = globalConfig.get(GlobalConfigKeys.TABLE_ID);
    const table = tableId ? base.getTableByIdIfExists(tableId) : null;

    // Helper function to validate the field selection
    const validateFieldSelection = (fieldKey, fieldLabel) => {
        const selectedField = globalConfig.get(fieldKey);
        if (!selectedField) {
            return <p style={{color: 'red'}}>{`${fieldLabel} is required`}</p>;
        }
        return null;
    };

    return (
        <Box padding={3}>
            <h1>Settings</h1>
            <details>
                <summary>Database config</summary>
                <Box marginTop={2}>
                    <FormField label="Table" description="Select the table containing your data">
                        <TablePickerSynced globalConfigKey={GlobalConfigKeys.TABLE_ID}/>
                    </FormField>

                    {table && (
                        <>
                            <FormField
                                label="Latitude Field"
                                // description="Choose the field with latitude values for marker placement"
                            >
                                <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.LATITUDE_FIELD}
                                                   allowedTypes={[FieldType.NUMBER, FieldType.FORMULA]}/>
                            </FormField>
                            {validateFieldSelection(GlobalConfigKeys.LATITUDE_FIELD, 'Latitude Field')}

                            <FormField
                                label="Longitude Field"
                                // description="Choose the field with longitude values for marker placement"
                            >
                                <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.LONGITUDE_FIELD}
                                                   allowedTypes={[FieldType.NUMBER, FieldType.FORMULA]}/>
                            </FormField>
                            {validateFieldSelection(GlobalConfigKeys.LONGITUDE_FIELD, 'Longitude Field')}

                        </>
                    )}

                    {!table && (
                        <p style={{color: 'red'}}>
                            Please select a table to configure the settings.
                        </p>
                    )}
                </Box>
            </details>

            <details>
                <summary>Marker config</summary>
                <Box marginTop={3}>
                    <FormField
                        label="Name Field"
                        // description="Select the field used to display names for the markers"
                    >
                        <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.NAME_FIELD}/>
                    </FormField>
                    {validateFieldSelection(GlobalConfigKeys.NAME_FIELD, 'Name Field')}

                    <FormField
                        label="Color Field"
                        // description="Choose a field (single select or text) to define marker colors"
                    >
                        <FieldPickerSynced
                            table={table}
                            globalConfigKey={GlobalConfigKeys.COLOR_FIELD}
                            allowedTypes={[
                                FieldType.SINGLE_SELECT,
                                FieldType.SINGLE_LINE_TEXT,
                                FieldType.FORMULA,
                            ]}
                        />
                    </FormField>
                    {validateFieldSelection(GlobalConfigKeys.COLOR_FIELD, 'Color Field')}


                    <FormField label="Marker Icon">
                        <Switch
                            value={globalConfig.get(GlobalConfigKeys.USE_SINGLE_ICON) || false}
                            onChange={(value) => globalConfig.setAsync(GlobalConfigKeys.USE_SINGLE_ICON, value)}
                            label="Use a single icon for all markers"
                            size="large"
                        />
                        {globalConfig.get(GlobalConfigKeys.USE_SINGLE_ICON) ? (
                            // Input for single icon value
                            <FormField label="Single Icon Name">
                                <Input
                                    value={globalConfig.get(GlobalConfigKeys.SINGLE_ICON_NAME) || ''}
                                    onChange={(e) =>
                                        globalConfig.setAsync(GlobalConfigKeys.SINGLE_ICON_NAME, e.target.value)
                                    }
                                    placeholder="Enter an icon name (e.g., bx-map)"
                                />
                            </FormField>
                        ) : (
                            // Field picker for icon names
                            <FormField label="Icon Field">
                                <FieldPickerSynced
                                    table={table}
                                    globalConfigKey={GlobalConfigKeys.BOX_ICON_FIELD}
                                    allowedTypes={[FieldType.SINGLE_LINE_TEXT, FieldType.FORMULA]}
                                />
                            </FormField>
                        )}
                    </FormField>
                    {validateFieldSelection(GlobalConfigKeys.BOX_ICON_FIELD, 'Icon Field')}

                    <p>
                        Go to <a href="https://boxicons.com/" target="_blank"
                                 rel="noopener noreferrer">boxicons.com</a> to browse icon names.
                    </p>

                    <FormField
                        label="Icon Size Field"
                        description="Choose a numeric field to set the size of the icons"
                    >
                        <FieldPickerSynced
                            table={table}
                            globalConfigKey={GlobalConfigKeys.ICON_SIZE_FIELD}
                            allowedTypes={[FieldType.NUMBER, FieldType.FORMULA]}
                        />
                    </FormField>
                    {validateFieldSelection(GlobalConfigKeys.ICON_SIZE_FIELD, 'Icon Size Field')}
                </Box>
            </details>


            <details>
                <summary>Map config</summary>
                <Box marginTop={2}>
                    <Switch
                        value={globalConfig.get(GlobalConfigKeys.USE_CLUSTERING) || false}
                        onChange={(value) => globalConfig.setAsync(GlobalConfigKeys.USE_CLUSTERING, value)}
                        label="Use Clustering"
                        size="large"
                    />

                    <Switch
                        value={globalConfig.get(GlobalConfigKeys.ALLOW_FULL_SCREEN) || false}
                        onChange={(value) => globalConfig.setAsync(GlobalConfigKeys.ALLOW_FULL_SCREEN, value)}
                        label="Allow Fullscreen"
                        size="large"
                    />


                </Box>
            </details>


            <Box marginTop={3}>
                <h2>About</h2>
                <p>
                    Made by Benjamin Stieler.
                    <br/>
                    <br/>

                    For more information, feature requests, or bug reports, please visit my <a
                    href="https://github.com/Beniox/leaflet-airtable" target="_blank"
                    rel="noopener noreferrer">GitHub</a>.

                    <br/>
                    <br/>

                    <a href="https://boxicons.com/" target="_blank" rel="noopener noreferrer">
                        BoxIcons
                    </a>{' '}
                    are used for icon rendering.
                </p>
            </Box>
        </Box>
    );
}

export default Settings;

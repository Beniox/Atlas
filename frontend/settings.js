import {
    Box,
    FormField,
    TablePickerSynced,
    FieldPickerSynced,
} from '@airtable/blocks/ui';
import {FieldType} from "@airtable/blocks/models";
import React from 'react';
import { useGlobalConfig, useBase } from '@airtable/blocks/ui';

// Global Config Keys
export const GlobalConfigKeys = {
    TABLE_ID: 'tableId',
    LATITUDE_FIELD: 'latitudeFieldId',
    LONGITUDE_FIELD: 'longitudeFieldId',
    NAME_FIELD: 'nameFieldId',
    COLOR_FIELD: 'colorFieldId',
    BOX_ICON_FIELD: 'boxIconFieldId',
    ICON_SIZE_FIELD: 'iconSizeFieldId',
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
            return <p style={{ color: 'red' }}>{`${fieldLabel} is required`}</p>;
        }
        return null;
    };

    return (
        <Box padding={3}>
            <h1>Settings</h1>
            <FormField label="Table" description="Select the table containing your data">
                <TablePickerSynced globalConfigKey={GlobalConfigKeys.TABLE_ID} />
            </FormField>

            {table && (
                <>
                    <FormField
                        label="Latitude Field"
                        description="Choose the field with latitude values for marker placement"
                    >
                        <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.LATITUDE_FIELD} />
                    </FormField>
                    {validateFieldSelection(GlobalConfigKeys.LATITUDE_FIELD, 'Latitude Field')}

                    <FormField
                        label="Longitude Field"
                        description="Choose the field with longitude values for marker placement"
                    >
                        <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.LONGITUDE_FIELD} />
                    </FormField>
                    {validateFieldSelection(GlobalConfigKeys.LONGITUDE_FIELD, 'Longitude Field')}

                    <FormField
                        label="Name Field"
                        description="Select the field used to display names for the markers"
                    >
                        <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.NAME_FIELD} />
                    </FormField>
                    {validateFieldSelection(GlobalConfigKeys.NAME_FIELD, 'Name Field')}

                    <FormField
                        label="Color Field"
                        description="Choose a field (single select or text) to define marker colors"
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

                    <FormField
                        label="Box Icon Field"
                        description="Select a field that contains BoxIcon names"
                    >
                        <FieldPickerSynced
                            table={table}
                            globalConfigKey={GlobalConfigKeys.BOX_ICON_FIELD}
                            allowedTypes={[FieldType.SINGLE_LINE_TEXT, FieldType.FORMULA]}
                        />
                    </FormField>
                    {validateFieldSelection(GlobalConfigKeys.BOX_ICON_FIELD, 'Box Icon Field')}

                    <p>
                        Go to <a href="https://boxicons.com/" target="_blank" rel="noopener noreferrer">boxicons.com</a> to browse icon names.
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
                </>
            )}

            {!table && (
                <p style={{ color: 'red' }}>
                    Please select a table to configure the settings.
                </p>
            )}

            <Box marginTop={3}>
                <h2>About</h2>
                <p>
                    Made by Benjamin Stieler. This app uses{' '}
                    <a href="https://boxicons.com/" target="_blank" rel="noopener noreferrer">
                        BoxIcons
                    </a>{' '}
                    for icon rendering.
                </p>
            </Box>
        </Box>
    );
}

export default Settings;

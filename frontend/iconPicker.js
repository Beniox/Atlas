import {
    Dialog,
    Heading,
    Input,
    SelectButtons,
    Text,
} from '@airtable/blocks/ui';
import React from 'react';
import {getAllBoxiconNames} from './iconUtils';
import './style.css';

const STYLE_OPTIONS = [
    {value: '', label: 'All'},
    {value: 'bx-', label: 'Regular'},
    {value: 'bxs-', label: 'Solid'},
    {value: 'bxl-', label: 'Logos'},
];

// How many icons to render at once; searching narrows the list down
const MAX_SHOWN = 300;

/**
 * Searchable dialog with every Boxicons icon.
 * @param {(name: string) => void} onPick - called with e.g. "bxs-map"
 * @param {() => void} onClose
 */
function IconPickerDialog({onPick, onClose}) {
    const [query, setQuery] = React.useState('');
    const [stylePrefix, setStylePrefix] = React.useState('');
    const [allIcons, setAllIcons] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);

    // The icon list comes from the (possibly still loading) stylesheet
    React.useEffect(() => {
        let cancelled = false;
        getAllBoxiconNames().then((names) => {
            if (!cancelled) {
                setAllIcons(names);
                setIsLoading(false);
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    // Lock the page scroll behind the dialog; the icon grid scrolls on its own
    React.useEffect(() => {
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, []);

    const q = query.trim().toLowerCase().replace(/\s+/g, '-');
    const filtered = allIcons.filter((name) =>
        (!stylePrefix || name.startsWith(stylePrefix)) &&
        (!q || name.includes(q))
    );
    const shown = filtered.slice(0, MAX_SHOWN);

    return (
        <Dialog onClose={onClose} width="480px" maxWidth="90vw">
            <Dialog.CloseButton/>
            <Heading size="small">Choose an icon</Heading>

            <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search icons, e.g. home, star, coffee…"
                autoFocus={true}
                width="100%"
                marginTop={2}
                marginBottom={2}
            />
            <SelectButtons
                value={stylePrefix}
                onChange={(v) => setStylePrefix(v)}
                options={STYLE_OPTIONS}
                size="small"
                width="100%"
            />

            {isLoading && (
                <Text marginTop={2}>Loading icons…</Text>
            )}
            {!isLoading && allIcons.length === 0 && (
                <Text marginTop={2}>The icon list could not be loaded — please try again.</Text>
            )}
            {allIcons.length > 0 && filtered.length === 0 && (
                <Text marginTop={2}>No icons match &ldquo;{query}&rdquo;.</Text>
            )}

            <div className="icon-picker-grid">
                {shown.map((name) => (
                    <button
                        key={name}
                        type="button"
                        className="icon-picker-item"
                        title={name}
                        onClick={() => onPick(name)}
                    >
                        <i className={`bx ${name}`} aria-hidden="true"/>
                        <span className="icon-picker-name">{name.replace(/^(bxs|bxl|bx)-/, '')}</span>
                    </button>
                ))}
            </div>

            {filtered.length > MAX_SHOWN && (
                <Text marginTop={2} textColor="light">
                    Showing {MAX_SHOWN} of {filtered.length} icons — type to narrow the list down.
                </Text>
            )}
        </Dialog>
    );
}

export default IconPickerDialog;

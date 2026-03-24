import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('TabBar Accessibility Enhancements', () => {
    const tabbarContent = fs.readFileSync(path.resolve(__dirname, '../src/components/TabBar.jsx'), 'utf-8');

    // Verify role="tablist" on the container
    assert.ok(tabbarContent.includes('role="tablist"'), 'TabBar should have a container with role="tablist"');
    assert.ok(tabbarContent.includes('aria-label="Open events"'), 'TabBar container should have an aria-label');

    // Verify individual tabs have correct roles and aria attributes
    assert.ok(tabbarContent.includes('role="tab"'), 'Individual tabs should have role="tab"');
    assert.ok(tabbarContent.includes('tabIndex={0}'), 'Tabs should be focusable via keyboard with tabIndex={0}');
    assert.ok(tabbarContent.includes('aria-selected={activeTabId === tab.eventId}'), 'Tabs should have aria-selected tied to the active state');
    assert.ok(tabbarContent.includes('aria-label={getEventName(tab.eventId)}'), 'Tabs should have dynamic aria-labels using the event name');

    // Verify keyboard handlers
    assert.ok(tabbarContent.includes('onKeyDown={(e) => handleKeyDown(e, tab.eventId)}'), 'Tabs should handle onKeyDown for keyboard activation');
    assert.ok(tabbarContent.includes("e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')"), 'Key handler should trigger only on Enter/Space and only when the tab itself is the target');

    // Verify descriptive aria-labels on buttons
    assert.ok(tabbarContent.includes('aria-label={`Close ${getEventName(tab.eventId)} tab`}'), 'Close button should have a dynamic, descriptive aria-label');
    assert.ok(tabbarContent.includes('aria-label="Create new event tab"'), 'New tab button should have a descriptive aria-label');
});

import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert';

test('TabBar Accessibility Properties in JSX', () => {
    const fileContent = fs.readFileSync('src/components/TabBar.jsx', 'utf8');

    // Test for the roles and aria attributes we added
    assert.ok(fileContent.includes('role="tablist"'), 'TabBar should contain role="tablist"');
    assert.ok(fileContent.includes('aria-label="Open events"'), 'TabBar should contain aria-label="Open events"');
    assert.ok(fileContent.includes('role="tab"'), 'Tab elements should contain role="tab"');
    assert.ok(fileContent.includes('tabIndex={0}'), 'Tab elements should contain tabIndex={0}');
    assert.ok(fileContent.includes('aria-selected={activeTabId === tab.eventId}'), 'Active tab should have aria-selected={activeTabId === tab.eventId}');
    assert.ok(fileContent.includes('aria-hidden="true"'), 'Decorative icon should have aria-hidden="true"');
    assert.ok(fileContent.includes('aria-label={`Close ${getEventName(tab.eventId)} tab`}'), 'Close button should have specific aria-label');
    assert.ok(fileContent.includes('aria-label="New tab"'), 'New tab button should have aria-label="New tab"');

    // Test for keyboard navigation
    assert.ok(fileContent.includes('onKeyDown={(e) => handleKeyDown(e, tab.eventId)}'), 'Tabs should have an onKeyDown handler');
    assert.ok(fileContent.includes('const handleKeyDown = (e, eventId) => {'), 'handleKeyDown function should exist');
    assert.ok(fileContent.includes("e.target === e.currentTarget"), 'handleKeyDown should check e.target === e.currentTarget to prevent bubbling');
    assert.ok(fileContent.includes("e.key === 'Enter' || e.key === ' '"), 'handleKeyDown should listen for Enter and Space');
});

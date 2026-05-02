import asyncio
import os
import glob
from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:5173")
    page.wait_for_timeout(1000)
    page.wait_for_selector(".sidebar", timeout=10000)

    # Open Event Library
    page.locator('button[title="Event Library"]').click()
    page.wait_for_timeout(500)

    # Create event to show tab bar
    page.locator('.add-event-btn').click()
    page.wait_for_timeout(500)
    page.locator('input[placeholder="Event name..."]').fill("Test A11y Event")
    page.wait_for_timeout(500)
    page.locator('button:text("Create")').click()
    page.wait_for_timeout(1000)

    # Verify Tab Close Button Focus
    page.wait_for_selector(".tab-close", timeout=5000)
    page.locator(".tab-close").focus()
    page.wait_for_timeout(1000)
    page.screenshot(path="/app/verification/screenshots/tab-focus.png")
    page.wait_for_timeout(500)

    # Open Bulk Export modal to check modal close button
    page.locator('button:text("📤 Bulk Export")').click()
    page.wait_for_timeout(1000)
    page.wait_for_selector(".modal-close", timeout=5000)
    page.locator(".modal-close").focus()
    page.wait_for_timeout(1000)
    page.screenshot(path="/app/verification/screenshots/modal-focus.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/app/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()

    # Find the video file
    videos = glob.glob("/app/verification/videos/*.webm")
    if videos:
        print(f"Video saved to {videos[0]}")
    else:
        print("No video found!")

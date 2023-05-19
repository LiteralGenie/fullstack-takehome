import { expect, test } from '@playwright/test';

// This file was renamed to get tests to run

test('user list is scrollable', async ({ page }) => {
	await page.goto('/');

	const scrollContainer = page.locator('.overflow-scroll');
	const children = scrollContainer.locator('> *');
	const lastChild = children.last();
	const spinner = scrollContainer.locator('.loader');

	const getScrollHeight = async () =>
		await scrollContainer.evaluate((element) => element.scrollHeight);
	const getChildCount = async () => {
		return await children.count();
	};
	const waitForLoaders = async () => {
		await new Promise((r) => setTimeout(r, 50)); // Hack to wait for loaders that haven't appeared yet
		await expect(spinner).toHaveCount(0);
	};

	// Get initial state
	await waitForLoaders();
	let prevHeight = await getScrollHeight();
	let prevChildCount = await getChildCount();

	// Scroll to bottom and check that elements are appended
	await lastChild.scrollIntoViewIfNeeded();
	await waitForLoaders();
	expect(await getScrollHeight()).toBeGreaterThan(prevHeight);
	expect(await getChildCount()).toBeGreaterThan(prevChildCount);
	prevHeight = await getScrollHeight();
	prevChildCount = await getChildCount();

	await lastChild.scrollIntoViewIfNeeded();
	await waitForLoaders();
	expect(await getScrollHeight()).toBeGreaterThan(prevHeight);
	expect(await getChildCount()).toBeGreaterThan(prevChildCount);
	prevHeight = await getScrollHeight();
	prevChildCount = await getChildCount();

	await lastChild.scrollIntoViewIfNeeded();
	await waitForLoaders();
	expect(await getScrollHeight()).toBeGreaterThan(prevHeight);
	expect(await getChildCount()).toBeGreaterThan(prevChildCount);
	prevHeight = await getScrollHeight();
	prevChildCount = await getChildCount();
});

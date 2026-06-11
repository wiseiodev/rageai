import { expect, test } from '@playwright/test'

test('homepage renders the leaderboard surface', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: "Today's AI frustration weather" })).toBeVisible()
  await expect(page.getByText('Daily leaderboard')).toBeVisible()
})

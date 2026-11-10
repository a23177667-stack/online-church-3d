import {test,expect} from '@playwright/test';
test('sanctuary renders, candles light, and private prayer clears without network transmission',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('#fallback')).toBeHidden();
 await expect(page.locator('#enter')).toBeVisible();
 await page.screenshot({path:`test-results/${testInfo.project.name}-welcome.png`});
 await page.locator('#enter').click();await expect(page.locator('#welcome')).toBeHidden();
 if(testInfo.project.name==='mobile')await expect(page.locator('#touch-controls')).toBeVisible();
 await page.locator('#candle').click();await expect(page.locator('#toast')).toHaveText('A little light. A quiet prayer.');
 await page.locator('#pray').click();await expect(page.locator('#prayer')).toBeVisible();
 const requests=[];page.on('request',request=>requests.push(request.url()));
 await page.locator('#prayer-text').fill('Private test prayer 123');
 await page.locator('#exit-prayer').click();await expect(page.locator('#prayer-text')).toHaveValue('');
 await page.locator('#pray').click();await expect(page.locator('#prayer-text')).toHaveValue('');await page.keyboard.press('Escape');await expect(page.locator('#prayer')).toBeHidden();
 expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}))).toEqual({local:0,session:0});
 expect(requests).toEqual([]);
 await page.locator('#sound').click();await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','true');await page.locator('#sound').click();await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','false');
 await page.locator('#help').click();await expect(page.locator('#help-dialog')).toBeVisible();await page.getByRole('button',{name:'Close help',exact:true}).click();
 expect(errors).toEqual([]);
});
test('scene supports look, movement and direct pew selection',async({page},testInfo)=>{
 await page.goto('/');await page.locator('#enter').click();
 // A drag changes the camera view; walking remains responsive afterwards.
 await page.mouse.move(240,360);await page.mouse.down();await page.mouse.move(270,365,{steps:5});await page.mouse.up();
 await page.keyboard.down('KeyW');await page.waitForTimeout(300);await page.keyboard.up('KeyW');
 // Near right-hand pew, projected from the starting perspective.
 const view=page.viewportSize();await page.mouse.click(view.width*.74,view.height*.62);
 await expect(page.locator('#prayer')).toBeVisible();
 await page.locator('#exit-prayer').click();
 await page.screenshot({path:`test-results/${testInfo.project.name}-sanctuary.png`});
});

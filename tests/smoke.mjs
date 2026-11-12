import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:5173');
for(const width of [320,375,390,768,1024,1440]){await page.setViewportSize({width,height:950});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`home overflow ${width}`);}
await page.setViewportSize({width:1440,height:1000});
await page.getByRole('button',{name:'Свой топ',exact:true}).click();
await page.getByRole('button',{name:'Составить топ',exact:true}).click();await expect(page.getByText('Укажите название топа')).toBeVisible();
await page.getByLabel('Название топа',{exact:true}).fill('Лучшие фильмы - мой личный рейтинг');
await page.getByRole('textbox',{name:'Название позиции 1',exact:true}).fill('Очень длинное русское название фильма о путешествии сквозь время и пространство '.repeat(3));
await page.getByRole('textbox',{name:'Название позиции 2',exact:true}).fill('Второй фильм');
await page.getByRole('textbox',{name:'Название позиции 3',exact:true}).fill('Третий фильм');
await page.getByRole('button',{name:'Поднять позицию 3',exact:true}).click();
await expect(page.getByRole('textbox',{name:'Название позиции 2',exact:true})).toHaveValue('Третий фильм');
// Real mouse drag via handle.
const handles=page.getByRole('button',{name:/Перетащить позицию/});
let a=await handles.nth(0).boundingBox(),b=await handles.nth(1).boundingBox();
await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:20});await page.mouse.up();
await expect(page.getByRole('textbox',{name:'Название позиции 1',exact:true})).toHaveValue('Третий фильм');
// Keyboard sorting.
await handles.nth(0).focus();await page.keyboard.press('Space');await page.keyboard.press('ArrowDown');await page.keyboard.press('Space');
// Local image-only, and image + text.
const image=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=120;c.height=90;const x=c.getContext('2d');x.fillStyle='#00d1b0';x.fillRect(0,0,120,90);return c.toDataURL('image/png').split(',')[1];});
await page.locator('input[type=file]').nth(1).setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});
await expect(page.locator('.upload-preview')).toHaveCount(1);await page.getByRole('textbox',{name:'Название позиции 2',exact:true}).fill('');
await page.locator('input[type=file]').nth(2).setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});await expect(page.locator('.upload-preview')).toHaveCount(2);
for(const width of [320,375,390,768,1024,1440]){await page.setViewportSize({width,height:950});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`editor overflow ${width}`);}
await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'reference/editor-desktop.png',fullPage:true});
for(let i=3;i<20;i++)await page.getByRole('button',{name:'Добавить позицию',exact:true}).click();await expect(page.locator('.edit-row')).toHaveCount(20);await expect(page.getByRole('button',{name:'Добавить позицию',exact:true})).toBeDisabled();
for(let i=20;i>3;i--)await page.getByRole('button',{name:`Удалить позицию ${i}`,exact:true}).click();await expect(page.locator('.edit-row')).toHaveCount(3);
await page.getByRole('button',{name:'Уменьшить количество',exact:true}).isDisabled().then(v=>assert(v));
await page.getByRole('button',{name:'Составить топ',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Вернуться к редактированию',exact:true}).click();await page.getByRole('button',{name:'Составить топ',exact:true}).click();await page.getByRole('button',{name:'Создать топ',exact:true}).click();await expect(page.locator('.final-row')).toHaveCount(3);
await page.goBack();await expect(page.locator('.final-row')).toHaveCount(3);assert.equal(await page.locator('input').count(),0);
await page.getByRole('button',{name:'Выгрузить фото топа',exact:true}).click();await expect(page.locator('.export-previews img')).toHaveCount(1);await expect(page.getByText('Готово 1 изображение с 3 позициями.',{exact:true})).toBeVisible();await expect(page.locator('.export-previews img')).toBeVisible();
const png=await page.locator('.export-previews img').getAttribute('src');const info=await page.evaluate(async url=>{const b=await(await fetch(url)).blob();const bytes=new Uint8Array(await b.arrayBuffer());const img=await createImageBitmap(b);return {signature:Array.from(bytes.slice(0,8)),width:img.width,height:img.height};},png);assert.deepEqual(info.signature,[137,80,78,71,13,10,26,10]);assert.equal(info.width,1080);assert.equal(info.height,1350);
const data=await page.evaluate(async url=>Array.from(new Uint8Array(await(await fetch(url)).arrayBuffer())),png);await fs.writeFile('reference/export-sample.png',Buffer.from(data));
const dl=page.waitForEvent('download');await page.getByRole('button',{name:'Скачать 1 фото',exact:true}).click();await (await dl).saveAs('reference/downloaded-top.png');await page.getByRole('button',{name:'Закрыть',exact:true}).click();
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'reference/result-mobile.png',fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.getByRole('button',{name:'Создать новый топ',exact:true}).click();await page.getByRole('button',{name:'Музыкальный топ',exact:true}).click();await expect(page.getByRole('button',{name:'Добавить композицию',exact:true})).toBeVisible();await page.route('https://www.youtube.com/oembed**',route=>route.abort());await page.getByLabel('Ссылка 1',{exact:true}).fill('https://youtu.be/M7lc1UVf-VE');await expect(page.getByText('Метаданные недоступны. Укажите название и автора вручную.')).toBeVisible();
await page.getByLabel('Название позиции 1',{exact:true}).fill('Ручное название');await page.getByLabel('Ссылка 2',{exact:true}).fill('https://evil.com/test');await page.getByRole('button',{name:'Составить топ',exact:true}).click();await expect(page.getByText('Вставьте корректную HTTPS-ссылку YouTube').first()).toBeVisible();
await page.screenshot({path:'reference/youtube-mobile.png',fullPage:true});
assert.deepEqual(errors,[]);console.log('PASS: responsive widths, validation, mouse/keyboard sorting, image-only/mixed, 3-20 limit, immutable finalization, PNG preview/download, YouTube metadata fallback. No page errors.');
await browser.close();

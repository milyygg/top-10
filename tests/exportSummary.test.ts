import {describe,it,expect} from 'vitest';
import {exportSummary} from '../src/utils/exportSummary';
describe('Понятная подпись экспорта',()=>{
 it('сообщает о подготовке',()=>expect(exportSummary([])).toBe('Готовим изображения…'));
 for(const n of [3,4,5])it(`одно изображение с ${n} позициями`,()=>expect(exportSummary([n])).toBe(`Готово 1 изображение с ${n} позициями.`));
 it('два изображения и неравные группы',()=>expect(exportSummary([4,3])).toBe('Готово 2 изображения. Распределение позиций по изображениям: 4 + 3.'));
 it('три изображения',()=>expect(exportSummary([4,4,3])).toBe('Готово 3 изображения. Распределение позиций по изображениям: 4 + 4 + 3.'));
 it('четыре изображения',()=>expect(exportSummary([5,5,5,5])).toBe('Готово 4 изображения. Распределение позиций по изображениям: 5 + 5 + 5 + 5.'));
});

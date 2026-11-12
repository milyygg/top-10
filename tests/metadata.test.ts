import {describe,it,expect,vi,afterEach} from 'vitest';
import {metadata} from '../src/utils/model';
afterEach(()=>vi.unstubAllGlobals());
describe('oEmbed controlled responses, not live integration',()=>{
 it('reads only title and author, ignores external HTML',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({title:'Название',author_name:'Автор',html:'<script>bad</script>'}))));expect(await metadata('M7lc1UVf-VE',new AbortController().signal)).toEqual({title:'Название',author:'Автор'});});
 for(const body of [{title:'',author_name:'a'},{title:'   ',author_name:'a'},{title:42,author_name:'a'},{title:'a'},null])it('rejects missing or malformed fields: '+JSON.stringify(body),async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));await expect(metadata('M7lc1UVf-VE',new AbortController().signal)).rejects.toThrow();});
 it('rejects HTTP error',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('',{status:404})));await expect(metadata('M7lc1UVf-VE',new AbortController().signal)).rejects.toThrow();});
 it('passes cancellation to fetch',async()=>{const controller=new AbortController();controller.abort();const f=vi.fn().mockRejectedValue(new DOMException('aborted','AbortError'));vi.stubGlobal('fetch',f);await expect(metadata('M7lc1UVf-VE',controller.signal)).rejects.toThrow();expect(f.mock.calls[0][1].signal).toBe(controller.signal);});
});

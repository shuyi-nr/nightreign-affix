import {describe,expect,it} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AtlasMap} from '../components/AtlasMap';
import {calibrateMapImage,landmarkError,mapBackgrounds,undergroundBackgrounds} from './mapBackgrounds';
import imageFile from '../data/map-images.json';
import {readFileSync,existsSync} from 'node:fs';

describe('permission-documented map image overlays',()=>{
 it('aligns a cropped screenshot while preserving source map coordinates',()=>{
  const bounds=calibrateMapImage(1200,900,{mapX:100,mapY:200,imageX:100,imageY:100},{mapX:900,mapY:800,imageX:1100,imageY:850});
  expect(bounds).toEqual({x:20,y:120,width:960,height:720});
  expect(landmarkError(bounds,1200,900,{mapX:500,mapY:500,imageX:600,imageY:475})).toBeLessThan(.001);
  expect(landmarkError(bounds,1200,900,{mapX:500,mapY:500,imageX:630,imageY:475})).toBeCloseTo(30);
 });
 it('rejects flipped, degenerate or invalid calibration inputs',()=>{
  const a={mapX:100,mapY:100,imageX:0,imageY:0};
  expect(()=>calibrateMapImage(0,100,a,{...a,mapX:200,mapY:200})).toThrow();
  expect(()=>calibrateMapImage(100,100,a,{...a,mapX:100,mapY:200,imageX:50,imageY:50})).toThrow();
  expect(()=>calibrateMapImage(100,100,a,{mapX:200,mapY:200,imageX:-50,imageY:50})).toThrow();
  expect(()=>calibrateMapImage(100,100,a,{mapX:200,mapY:NaN,imageX:50,imageY:50})).toThrow();
 });
 it('renders optional imagery below markers, without changing marker positions',()=>{
  const points=[{id:'T1',x:250,y:400,kind:'boss' as const,title:'test',detail:'test'}];
  const html=renderToStaticMarkup(createElement(AtlasMap,{title:'original test fixture',points,note:'test only',background:{image:'data:image/svg+xml,%3Csvg/%3E',credit:'original test fixture',permissionReference:'#fixture',bounds:{x:20,y:120,width:960,height:720}}}));
  expect(html.indexOf('atlas-game-background')).toBeLessThan(html.indexOf('atlas-pin'));
  expect(html).toContain('cx="250" cy="400"');
  expect(html).toContain('底图明暗');
  expect(html).toContain('viewBox="20 120 960 720"');
 });
 it('has local screenshot coverage and offline pre-cache entries for all five terrains and both extra views',()=>{
  const all=[...Object.values(mapBackgrounds),...Object.values(undergroundBackgrounds)];
  expect(all).toHaveLength(7);
  const worker=readFileSync('public/sw.js','utf8');
  for(const bg of all){expect(bg).toBeDefined();expect(bg!.image.startsWith('./maps/')).toBe(true);expect(existsSync('public/'+bg!.image.slice(2))).toBe(true);expect(worker).toContain(bg!.image);}
 });
 it('uses a separate Great Hollow underground projection and verifies its held-out terrain landmarks',()=>{
  const record=imageFile.images['great-hollow-underground.jpg'];
  expect(record.bounds.x).toBeGreaterThan(300);
  expect(record.bounds.x).not.toBeCloseTo(imageFile.images['great-hollow-surface.jpg'].bounds.x,0);
  for(const point of record.validation){const error=landmarkError(record.bounds,734,734,{...point,imageX:point.imageX-4,imageY:point.imageY-6});expect(error).toBeLessThan(1.5);}
 });
});

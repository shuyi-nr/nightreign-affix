import type { TerrainId } from './atlas';
import calibrationFile from '../data/map-images.json';

export interface MapBounds { x:number; y:number; width:number; height:number }
export interface MapBackground {
  /** A bundled, permission-documented image. Do not point at external map sites. */
  image:string;
  credit:string;
  permissionReference:string;
  bounds:MapBounds;
}
export interface MapAnchor { mapX:number; mapY:number; imageX:number; imageY:number }

const imageRecords=calibrationFile.images as Record<string,{bounds:MapBounds}>;
export function screenshotBackground(file:string,label:string):MapBackground|undefined {
  const record=imageRecords[file];
  return record?{image:`./maps/${file}`,credit:`站长游戏内截图 · ${label} · ©Bandai Namco Entertainment Inc. / ©FromSoftware, Inc.`,permissionReference:'./maps/SOURCES.txt',bounds:record.bounds}:undefined;
}
export const mapBackgrounds:Partial<Record<TerrainId,MapBackground>> = {
  crater:screenshotBackground('crater-surface.jpg','火山地表'),
  mountaintop:screenshotBackground('mountaintop-surface.jpg','山顶'),
  rotted_woods:screenshotBackground('rotted-woods-surface.jpg','腐败森林'),
  noklateo:screenshotBackground('noklateo-surface.jpg','隐城'),
  great_hollow:screenshotBackground('great-hollow-surface.jpg','大空洞地表'),
};
export const undergroundBackgrounds:Partial<Record<TerrainId,MapBackground>> = {
  crater:screenshotBackground('crater-underground.jpg','火山地下'),
  great_hollow:screenshotBackground('great-hollow-underground.jpg','大空洞地下'),
};

/** Locate a north-up screenshot in the existing map plane using two landmarks.
 * Both axes need independent separation; verify a third landmark before use.
 * This adjusts the image only, never the recorded boss/reward coordinates.
 */
export function calibrateMapImage(width:number,height:number,a:MapAnchor,b:MapAnchor):MapBounds {
  const values=[width,height,...Object.values(a),...Object.values(b)];
  if(!values.every(Number.isFinite)||width<=0||height<=0)throw new Error('地图尺寸或地标坐标无效');
  if(Math.abs(b.mapX-a.mapX)<1||Math.abs(b.mapY-a.mapY)<1)throw new Error('请选择横向和纵向都有间距的两个地标');
  const sx=(b.imageX-a.imageX)/(b.mapX-a.mapX);
  const sy=(b.imageY-a.imageY)/(b.mapY-a.mapY);
  if(sx<=0||sy<=0)throw new Error('需要上北下南、没有旋转或镜像的地图截图');
  return {x:a.mapX-a.imageX/sx,y:a.mapY-a.imageY/sy,width:width/sx,height:height/sy};
}

export function landmarkError(bounds:MapBounds,width:number,height:number,anchor:MapAnchor):number {
  const x=(anchor.mapX-bounds.x)/bounds.width*width;
  const y=(anchor.mapY-bounds.y)/bounds.height*height;
  return Math.hypot(x-anchor.imageX,y-anchor.imageY);
}

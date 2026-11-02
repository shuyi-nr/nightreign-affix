# 地图截图处理与校准记录

2026-11-02，用户完成本地验收后已授权随本批更新发布。

用户亲自在游戏内截取七张地图并提供给本站，明确要求去除蓝色角色图标、可裁剪多余边缘。游戏美术权利仍属于 Bandai Namco / FromSoftware，本站不声称拥有其版权。公开素材来源说明为 `public/maps/SOURCES.txt`。

## 最终文件

| 用户原图 | 网站文件 |
|---|---|
| 大空洞1.png | public/maps/great-hollow-surface.jpg |
| 大空洞2.png | public/maps/great-hollow-underground.jpg |
| 腐败森林.png | public/maps/rotted-woods-surface.jpg |
| 火山地形1.png | public/maps/crater-surface.jpg |
| 火山地形2.png | public/maps/crater-underground.jpg |
| 雪山地形.png | public/maps/mountaintop-surface.jpg |
| 隐城.png | public/maps/noklateo-surface.jpg |

## 处理方法与保真验证

使用内置 image_gen（imagegen 技能，非 CLI/API）清除角色圆标与方向箭头。为避免模型重绘影响真实地图，把编辑结果缩放回原尺寸后，仅在角色标记周围的小范围合入修补，并以窄过渡融合；其余像素使用用户原图。保留正常地图上的小型蓝色强敌符号、营地、道路等。桌面七张原图未覆盖。

每张图片裁去左 4、右 4、上 6、下 6 像素的窄边，避免裁掉边缘地图点。最终 JPEG 质量 92，总计约 1.46MB，独立文件载入，不内联到主脚本。原截图已较紧，因此没有为移除角落图标而切掉地图区域。

七张图在 JPEG 压缩前执行像素比对：角色标记包围范围外的像素均与原截图完全一致，差异数均为 0。工具输出与原截图的不同尺寸只用于获取局部修补，不把整张重绘图当作底图。局部被角色图标遮住的纹理属于修补推断，不拿它新增游戏事实。

## 坐标与视图

- 原始 Boss、水晶和奖励数值未挪动，以底图位置和尺寸适配原始投影。
- 四种普通地形按共同地标校准。读图坐标有人工误差，标记是定位参考，不是游戏角色实时坐标。
- 火山保留地表及地下视图；地下按共有外轮廓对齐，只显示地下土龙候选，不宣称新增独立精确 NPC 校验。
- 大空洞地表与地下分别校准，地下不沿用主岛比例。地下使用不同区域图块进行独立留出验证；匹配残差约 1.1 像素以内，只表示图像对齐一致性，不代表所有游戏地点具有该绝对精度。主岛部分地标被图标遮挡，保留数像素容差。
- 21 个结晶候选分为地表 15、地下 6；23 个 Boss 候选分为地表 15、地下 8。需要总览时同时展示两层，不把地下点压到地表。
- `src/data/map-images.json` 保存数字校准记录；截图中的营地、夜雨与图标来自一次示例出击。第三方原始坐标投影参考只在忽略的研究目录中用于对齐，没有进入本站素材或发布包。

## 编辑提示词

以下为实际内置工具提示词，逐张独立编辑。输入图即表中的用户原图；项目最终只采用上述局部修补。

### 大空洞1.png

```text
Use case: precise-object-edit. Edit the supplied ELDEN RING NIGHTREIGN game MAP screenshot (大空洞1.png) for a fan map overlay. Remove ONLY the large bright cyan BLUE PLAYER LOCATION ICON: the circular cyan ring with a small pointing direction arrow, located in the lower left quadrant. Seamlessly reconstruct the small map texture directly underneath that player circle and arrow using its immediate surroundings. Do NOT remove the small blue flame/spire icons; those are legitimate map landmarks and must remain exactly as they are. Preserve ALL existing map geometry, roads, contour lines, terrain textures, buildings, camp symbols, yellow markers, outer circle, and the round boss portrait at bottom left. Preserve the exact canvas framing and north-up orientation. Do not crop, rotate, re-center, zoom, warp, stylize, label, or redraw the map. This is a precision localized cleanup, not a map redesign. No changes outside the small player marker neighborhood.
```

### 大空洞2.png

```text
Use case: precise-object-edit. Edit the supplied ELDEN RING NIGHTREIGN game MAP screenshot (大空洞2.png) for a fan map overlay. Remove ONLY the large bright cyan BLUE PLAYER LOCATION ICON: the circular cyan ring with a small pointing direction arrow, located in the lower left quadrant. Seamlessly reconstruct the small map texture directly underneath that player circle and arrow using its immediate surroundings. Do NOT remove the small blue flame/spire icons; those are legitimate map landmarks and must remain exactly as they are. Preserve ALL existing map geometry, roads, contour lines, terrain textures, buildings, camp symbols, yellow markers, outer circle, and the round boss portrait at bottom left. Preserve the exact canvas framing and north-up orientation. Do not crop, rotate, re-center, zoom, warp, stylize, label, or redraw the map. This is a precision localized cleanup, not a map redesign. No changes outside the small player marker neighborhood.
```

### 腐败森林.png

```text
Use case: precise-object-edit. Edit the supplied ELDEN RING NIGHTREIGN game MAP screenshot (腐败森林.png) for a fan map overlay. Remove ONLY the large bright cyan BLUE PLAYER LOCATION ICON: the circular cyan ring with a small pointing direction arrow, located in the upper right quadrant. Seamlessly reconstruct the small map texture directly underneath that player circle and arrow using its immediate surroundings. Do NOT remove the small blue flame/spire icons; those are legitimate map landmarks and must remain exactly as they are. Preserve ALL existing map geometry, roads, contour lines, terrain textures, buildings, camp symbols, yellow markers, outer circle, and the round boss portrait at bottom left. Preserve the exact canvas framing and north-up orientation. Do not crop, rotate, re-center, zoom, warp, stylize, label, or redraw the map. This is a precision localized cleanup, not a map redesign. No changes outside the small player marker neighborhood.
```

### 火山地形1.png

```text
Use case: precise-object-edit. Edit the supplied ELDEN RING NIGHTREIGN game MAP screenshot (火山地形1.png) for a fan map overlay. Remove ONLY the large bright cyan BLUE PLAYER LOCATION ICON: the circular cyan ring with a small pointing direction arrow, located in the lower left quadrant. Seamlessly reconstruct the small map texture directly underneath that player circle and arrow using its immediate surroundings. Do NOT remove the small blue flame/spire icons; those are legitimate map landmarks and must remain exactly as they are. Preserve ALL existing map geometry, roads, contour lines, terrain textures, buildings, camp symbols, yellow markers, outer circle, and the round boss portrait at bottom left. Preserve the exact canvas framing and north-up orientation. Do not crop, rotate, re-center, zoom, warp, stylize, label, or redraw the map. This is a precision localized cleanup, not a map redesign. No changes outside the small player marker neighborhood.
```

### 火山地形2.png

```text
Use case: precise-object-edit. Edit the supplied ELDEN RING NIGHTREIGN game MAP screenshot (火山地形2.png) for a fan map overlay. Remove ONLY the large bright cyan BLUE PLAYER LOCATION ICON: the circular cyan ring with a small pointing direction arrow, located in the lower left quadrant. Seamlessly reconstruct the small map texture directly underneath that player circle and arrow using its immediate surroundings. Do NOT remove the small blue flame/spire icons; those are legitimate map landmarks and must remain exactly as they are. Preserve ALL existing map geometry, roads, contour lines, terrain textures, buildings, camp symbols, yellow markers, outer circle, and the round boss portrait at bottom left. Preserve the exact canvas framing and north-up orientation. Do not crop, rotate, re-center, zoom, warp, stylize, label, or redraw the map. This is a precision localized cleanup, not a map redesign. No changes outside the small player marker neighborhood.
```

### 雪山地形.png

```text
Use case: precise-object-edit. Edit the supplied ELDEN RING NIGHTREIGN game MAP screenshot (雪山地形.png) for a fan map overlay. Remove ONLY the large bright cyan BLUE PLAYER LOCATION ICON: the circular cyan ring with a small pointing direction arrow, located near the middle of the left edge. Seamlessly reconstruct the small map texture directly underneath that player circle and arrow using its immediate surroundings. Do NOT remove the small blue flame/spire icons; those are legitimate map landmarks and must remain exactly as they are. Preserve ALL existing map geometry, roads, contour lines, terrain textures, buildings, camp symbols, yellow markers, outer circle, and the round boss portrait at bottom left. Preserve the exact canvas framing and north-up orientation. Do not crop, rotate, re-center, zoom, warp, stylize, label, or redraw the map. This is a precision localized cleanup, not a map redesign. No changes outside the small player marker neighborhood.
```

### 隐城.png

```text
Use case: precise-object-edit. Edit the supplied ELDEN RING NIGHTREIGN game MAP screenshot (隐城.png) for a fan map overlay. Remove ONLY the large bright cyan BLUE PLAYER LOCATION ICON: the circular cyan ring with a small pointing direction arrow, located slightly right of center in the lower half. Seamlessly reconstruct the small map texture directly underneath that player circle and arrow using its immediate surroundings. Do NOT remove the small blue flame/spire icons; those are legitimate map landmarks and must remain exactly as they are. Preserve ALL existing map geometry, roads, contour lines, terrain textures, buildings, camp symbols, yellow markers, outer circle, and the round boss portrait at bottom left. Preserve the exact canvas framing and north-up orientation. Do not crop, rotate, re-center, zoom, warp, stylize, label, or redraw the map. This is a precision localized cleanup, not a map redesign. No changes outside the small player marker neighborhood.
```

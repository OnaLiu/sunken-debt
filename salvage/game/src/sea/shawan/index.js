// 第一段·归潮沙湾这一片海：几段共用的系统要用到的「这片海的」都在这一个文件夹里。
//   layout.js       摆放：出港点、航路浮标、浅滩、线索船板、礁脊、沉船、深槽、第一趟海底的东西、网位、船开不过去的、捞得到的东西长什么样
//   seabed.js       海底多高、什么颜色和底质、铺多大
//   decor.js        海底的石头、海草、海带、碎壳摆在哪；浅滩标杆
//   wreck.js        这条沉船（侧卧的中世纪木帆商船）：船体、断舱、舱底淤泥面、碰撞
//   wreckExtras.js  沉船旁的散件：断桅横桁、舱盖、埋着的船材、尾楼
//   tide.js         第二趟起每一潮铺什么
//   story.js        事件和路线：到了哪、第一眼看见沉船、箭头往哪指、这里叫什么、这件从哪儿捞的
export * from './layout.js';
export * from './seabed.js';
export { buildDecor, buildMarks } from './decor.js';
export { buildWreck, buildWreckCollider, floorPoint, deckY, hullPt, keelY, sheerY, algaeTint } from './wreck.js';
export { buildWreckExtras } from './wreckExtras.js';
export { tideLayout, lampSpot, timberCorner, SHARDS_AT } from './tide.js';
export { story, placeOf } from './story.js';

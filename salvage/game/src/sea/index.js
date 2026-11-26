// 当前这片海。几段共用的系统（开船、下网和吊臂、打捞点、开冲揭晓、收获单、一局的钱和债、船坞、债本、
// 镜头、活物、演示的手和按键、界面、效果、声音）整个游戏一份，要用到「这片海的」东西都从这里拿，
// 不直接认哪一片海的文件。
//
// 每片海交一份同样名字的东西（归潮沙湾的在 sea/shawan/，index.js 开头列着每个文件放什么）：
//   摆放   START、LANE_BUOYS、OBSTACLES、WRECK、wreckToWorld、trenchZ、LEVIATHAN_PATH、HIDDEN_TIMBER、NET_SPOTS、SPOTS_TO_END、
//          ITEM_SHAPES、seabedItems(tide)、GULL_AREAS、DECOR_AVOID（还有活物、效果页要的那几处：SHOAL、SHOAL_CRABS、CRAB_HOME……）
//   海底   seabedY、seabedColor、TERRAIN_BOUNDS、GROUND_SITE、buildDecor、buildMarks
//   沉船   buildWreck、buildWreckCollider、buildWreckExtras、floorPoint
//   一潮   tideLayout(n)
//   事件   story（update、lead、leadNext、placeName、nearTrench、known）、placeOf
// 共用的系统还在认的归潮沙湾专有的名字（SHOAL、SHOAL_CRABS、CRAB_STOPS 这些）列在 共用的系统.md「还认着归潮沙湾的」。
//
// 现在只有第一段·归潮沙湾。接第二段·锈钟峡那一格：在 sea/ 下加它的一份，在这里照一局走到哪一段挑哪一片海。
export * from './shawan/index.js';

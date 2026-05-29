var builder = require('electron-builder');
var Platform = builder.Platform;

builder.build({
  targets: Platform.WINDOWS.createTarget(),
  config: {
    appId: 'com.weekly-planner.app',
    productName: '每周计划表',
    win: {
      target: 'portable',
      icon: 'icon.ico',
      artifactName: '每周计划表-便携版.exe',
      certificateFile: null,
      certificatePassword: null
    },
    extraResources: [],
    asar: false,
    compression: 'store'
  }
}).then(function() {
  console.log('✅ 打包成功！');
}).catch(function(e) {
  console.error('❌ 打包失败:', e.message || e);
});

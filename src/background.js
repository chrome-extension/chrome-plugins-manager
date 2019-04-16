import getI18n from './lib/i18n'
import { getAll as getAllExtension, addIconBadge as addIconBadgeExtension } from './lib/extension'
import * as Storage from './lib/storage'

// 窗口大小尺寸
const _WindowSizeByColum = {
  6: 496,
  7: 572,
  8: 648,
  9: 724
}

// 实时运行数据
window.data = {
  i18n: getI18n(),
  language: chrome.i18n.getUILanguage(),
  chromeStore: `https://chrome.google.com/webstore/category/extensions?hl=${chrome.i18n.getUILanguage()}`,
  storage: {},
  ext: {
    extList: [],
    enbledExtList: [],
    disabledExtList: [],
    allEmpty: false,
    iconBadgeAnim: false
  }
}

// 初始化延迟管理器
let initTimer = null

function init() {

  if (initTimer) {
    clearTimeout(initTimer)
    initTimer = null
  }

  initTimer = setTimeout(async () => {
    /**
     * 获取 Storage 存储数据
     */
    data.storage = await Storage.getAll()

    
    /**
     * 界面显示初始化：图标大小、宽度等
     */
    let _showColumn = Storage.get('_showColumn_') || 7
    data.showWindowSize = _WindowSizeByColum[_showColumn]
    data.showIconSize = Storage.get('_showIconSize_') || 2

    /**
     * 分组处理
     */
    let _oldLockObj = Storage.get('_lockList_')
    let _group = Storage.get('_group_')
    if (!_group) {
      _group = {
        list: [
          {
            'name': data.i18n.defaultGroupName,
            'lock': _oldLockObj || {}
          }
        ]
      }
      Storage.set('_group_', _group)
      Storage.remove('_lockList_')
    }
    data.group = _group
    data.groupIndex = Number.parseInt(localStorage.getItem("_groupIndex_")) || 0

    
    /**
     * 扩展排序方法初始化
     */
    // let _orderHandleByExtension = Extension.orderHandle(data.storage)


    /**
     * 扩展数据处理
     */
    data.ext.extList = await getAllExtension({ needColor: true })
    if (data.ext.extList && data.ext.extList.length === 0) {
      data.ext.allEmpty = true
    } else {
      // 启用&禁用，排序处理
      // data.ext.extList.forEach(item => {
        // if (data.group.list[data.groupIndex].lock[item.id]) {
        //   item.isLocked = true
        // } else {
        //   item.isLocked = false
        // }
        // if (item.enabled) {
        //   data.ext.enbledExtList.push(item)
        // } else {
        //   data.ext.disabledExtList.push(item)
        // }
      // })
      // data.ext.enbledExtList = data.ext.enbledExtList.sort(_orderHandleByExtension)
      // data.ext.disabledExtList = data.ext.disabledExtList.sort(_orderHandleByExtension)
    }

    // 判断角标显示
    data.ext.iconBadgeAnim = addIconBadgeExtension()
  }, 300)
}
init()


/**
 * 数据传输监听
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command == 'getBackgroundData'){
    sendResponse(data)
  }
})


/**
 * 初始化监控
 */
// 存储状态
chrome.storage.onChanged.addListener(init)
// 扩展状态
chrome.management.onInstalled.addListener(init)
chrome.management.onUninstalled.addListener(init)
chrome.management.onEnabled.addListener(init)
chrome.management.onDisabled.addListener(init)
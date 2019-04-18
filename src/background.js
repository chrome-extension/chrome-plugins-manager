import getI18n from './lib/i18n'
import { getAll as getAllExtension, addIconBadge as addIconBadgeExtension } from './lib/extension'
import * as Common from './lib/common'
import * as Storage from './lib/storage'

// 实时运行数据
window.backgroundData = {
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
    backgroundData.storage = await Storage.getAll()

    
    /**
     * 界面显示初始化：图标大小、宽度等
     */
    backgroundData.showWindowSize = Common.WindowSizeByColum[Storage.get('_showColumn_') || Common.WindowSizeDefaultColum]
    backgroundData.showIconSize = Storage.get('_showIconSize_') || Common.ShowIconSize
    backgroundData.sortType = Storage.get('_radio_ext_sort_') || Common.SortDefaultType

    /**
     * 分组处理
     */
    let _oldLockObj = Storage.get('_lockList_')
    let _group = Storage.get('_group_')
    if (!_group) {
      _group = {
        list: [
          {
            'name': backgroundData.i18n.defaultGroupName,
            'lock': _oldLockObj || {}
          }
        ]
      }
      Storage.set('_group_', _group)
      Storage.remove('_lockList_')
    }
    backgroundData.group = _group
    backgroundData.groupIndex = Number.parseInt(localStorage.getItem("_groupIndex_")) || 0

    
    /**
     * 扩展排序方法初始化
     */
    // let _orderHandleByExtension = Extension.orderHandle(backgroundData.storage)


    /**
     * 扩展数据处理
     */
    backgroundData.ext.extList = await getAllExtension({ needColor: true })
    if (backgroundData.ext.extList && backgroundData.ext.extList.length === 0) {
      backgroundData.ext.allEmpty = true
    } else {
      // 启用&禁用，排序处理
      backgroundData.ext.extList.forEach(item => {
        if (backgroundData.group.list[backgroundData.groupIndex].lock[item.id]) {
          item.isLocked = true
        } else {
          item.isLocked = false
        }
        // if (item.enabled) {
        //   backgroundData.ext.enbledExtList.push(item)
        // } else {
        //   backgroundData.ext.disabledExtList.push(item)
        // }
      })
      // backgroundData.ext.enbledExtList = backgroundData.ext.enbledExtList.sort(_orderHandleByExtension)
      // backgroundData.ext.disabledExtList = backgroundData.ext.disabledExtList.sort(_orderHandleByExtension)
    }

    // 判断角标显示
    backgroundData.ext.iconBadgeAnim = addIconBadgeExtension()
  }, 300)
}
init()


/**
 * 数据传输监听
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command == 'getBackgroundData'){
    sendResponse(backgroundData)
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
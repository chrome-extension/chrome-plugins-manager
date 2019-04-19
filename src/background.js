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


    // 初始化分组
    Storage.initGroup(backgroundData)

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
let heartDetectorHandle = (() => {
  let timer = null
  let counter = null
  return (newCounter) => {
    counter = newCounter
    if (!timer) {
      timer = setInterval(() => {
        console.log('== Background 动态检测 ==')
        if (new Date * 1 > (counter + 5000)) {
          console.log('== Background 动态检测：超过 3000 ==')
          clearInterval(timer)
          counter = null
          timer = null
          chrome.runtime.reload()
        }
      }, 1000)
    }
  }
})()
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command == 'getBackgroundData'){
    sendResponse(backgroundData)
  } else if(request.command == 'heartDetector') {
    sendResponse('HeartDetector Over')
    console.log('== 收到 HeartDetector Info ==')
    heartDetectorHandle(new Date * 1)
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
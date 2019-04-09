const Promise = require('bluebird')
const Storage = require('./../lib/storage')
const Rank = require('./rank')

const LockKey = '_group_'
const ExtDefaultIcon = './../assets/default-icon.png'
const ExtDefaultColor = '#5c5e6f'

// 储存扩展列表
let allExtList = []


/**
 * [getColor 获取扩展图标的平均色值，用于扩展名称显示的底色]
 */
export function getExtColor(item) {

  function getImageColor(img) {
    var canvas = document.getElementById('getColorByCanvas')
    canvas.width = img.width
    canvas.height = img.height

    var context = canvas.getContext('2d')

    context.drawImage(img, 0, 0)

    // 获取像素数据
    var data = context.getImageData(0, 0, img.width, img.height).data

    var r = 0
    var g = 0
    var b = 0

    // 浅色阀值
    var lightColor = 180

    var substantialColor = 1000

    // 取所有像素的平均值
    for (var row = 0; row < img.height; row++) {
      for (var col = 0; col < img.width; col++) {
        var r1 = data[((img.width * row) + col) * 4]
        var g1 = data[((img.width * row) + col) * 4 + 1]
        var b1 = data[((img.width * row) + col) * 4 + 2]

        // 获取图片有效色值位置
        if (!(r1 == 255 && g1 == 255 && b1 == 255)) {
          if (col < substantialColor) {
            substantialColor = col
          }
        }

        if (!(r1 > lightColor && g1 > lightColor && b1 > lightColor)) {
          r += r1
          g += g1
          b += b1
        }
      }
    }

    // 求取平均值
    r /= (img.width * img.height)
    g /= (img.width * img.height)
    b /= (img.width * img.height)

    // 将最终的值取整
    r = Math.round(r)
    g = Math.round(g)
    b = Math.round(b)

    var newColor = 'rgb(' + r + ',' + g + ',' + b + ')'
    if (r > lightColor && g > lightColor && b > lightColor) {
      newColor = ExtDefaultColor
    }

    // 判断出是否为白色空图
    if (substantialColor === 1000) {
      setTimeout(function () {
        item.showIcon = ExtDefaultIcon
        item.showIconBg = `background-image:url('${ExtDefaultIcon}'); background-color:#fff;`
      }, 0)
      newColor = ExtDefaultColor
    }

    return {
      color: newColor,
      substantial: substantialColor
    }
  }

  let img = new Image()
  img.crossOrigin = 'Anonymous'
  img.src = item.showIcon

  img.onload = function () {
    var obj = getImageColor(img)
    item['showColor'] = obj.color
    item['showSubstantial'] = obj.substantial
  }
}


/**
 * 扩展排序方法
 */
function orderHandle(storage) {
  if (Storage.get('_radio_ext_sort_') === 'rank') {
    // 根据点击rank进行排序
    return function(b, a){
      return Rank.get(a.id, storage) - Rank.get(b.id, storage)
    }
  } else {
    // 根据名称排序
    return function(a, b){
      var _a = a.shortName.charAt(0)
      var _b = b.shortName.charAt(0)
      return _a.localeCompare(_b, 'zh-Hans-CN', {
        'sensitivity': 'accent',
        'usage': 'search'
      })
    }
  }
}


/**
 * 排除扩展，管理器本身以及主题、皮肤等
 * @param {*} all
 */
function processHandle(all, option) {
  let res = new Promise((resolve, reject) => {
    Storage.getAll().then(storage => {

      // 区分生产及开发环境
      let details = chrome.app.getDetails() || {id: ''}

      all.forEach(item => {
        if (item.id !== details.id && item.type !== 'theme') {

          // 处理显示图标
          if (item.icons && item.icons.length > 0) {
            item.showIcon = item.icons[item.icons.length - 1].url
          }else{
            item.showIcon = ExtDefaultIcon
          }
          item.showIconBg = ''
          item.showColor = ExtDefaultColor

          // 判断是否为锁定图标
          item.isLocked = false

          // 判断是否为应用或开发版本
          if (item.isApp) {
            item.showType = 'APP'
          } else if (item.installType === 'development') {
            item.showType = 'DEV'
          }

          // 是否处于hover状态
          item.isHover = false

          // 是否被搜索关键词命中
          item.isSearched = false

          allExtList.push(item)
        }
      })
      resolve(allExtList)
      allExtList.forEach(item => {
        item.showIconBg = `background-image:url('${item.showIcon}'); background-color: #fff;`
        if (option.needColor) {
          setTimeout(() => {
            getExtColor(item)
          }, 100)
        }
      })
    })
  })
  return res
}


/**
 * [addIconBadge 给扩展图标添加角标，针对未加锁需要平时关闭的]
 */
function addIconBadge(){
  if(Storage.get('_switch_show_badge_') !== 'close'){
    // ChromeAPI的调用需要处理时间，并且是异步的
    setTimeout(() => {
      let badgeList = allExtList.filter(item => {
        if (item.isLocked !== item.enabled) {
          return true
        }
      })

      if(badgeList.length === 0){
        // 关闭清理动画
        if (window.vm) {
          window.vm.$data.ext.iconBadgeAnim = false
        }
        chrome.browserAction.setBadgeText({text: ''})
      }else{
        // 显示清理动画
        if (window.vm) {
          window.vm.$data.ext.iconBadgeAnim = true
        }
        chrome.browserAction.setBadgeBackgroundColor({color: '#f44336'})
        chrome.browserAction.setBadgeText({text: badgeList.length.toString()})
      }
    }, 300)
  } else {
    chrome.browserAction.setBadgeText({text: ''})
  }
}


/**
 * 获取所有安装的扩展
 * 异步操作，支持Promise
 */
function getAll(option = {}) {
  let res = new Promise((resolve, reject) => {
    allExtList = []
    chrome.management.getAll(function(obj){
      resolve(processHandle(obj, option))
    })
  })
  return res
}


/**
 * 启用或禁用扩展
 */
function onoff(item) {
  // 更新对象状态属性
  item.enabled = !item.enabled
  // 重置Hover
  item.isHover = false
  // 同步至浏览器
  chrome.management.setEnabled(item.id, item.enabled)
  addIconBadge()
}


/**
 * 加锁、解锁扩展操作
 */
function lock(item) {
  item.isLocked = true
  addIconBadge()

  let group = Storage.get(LockKey)
  group.list[vm.$data.groupIndex].lock[item.id] = 1
  Storage.set(LockKey, group)
}
// 解锁
function unlock(item) {
  item.isLocked = false
  addIconBadge()

  let group = Storage.get(LockKey)
  delete group.list[vm.$data.groupIndex].lock[item.id]
  Storage.set(LockKey, group)
}


/**
 * 卸载应用或扩展
 */
function uninstall(item) {
  chrome.management.uninstall(item.id, () => {
    chrome.management.get(item.id, (res) => {
      if (!res) {
        let index = allExtList.indexOf(item)
        allExtList.splice(index, 1)
        addIconBadge()
      }
    })
  })
}


/**
 * 根据锁定状态，进行清理
 */
function clear() {
  allExtList.forEach(item => {
    if (item.isLocked === !item.enabled) {
      onoff(item)
    }
  })
}


export {
  addIconBadge,
  getAll,
  onoff,
  lock,
  unlock,
  uninstall,
  clear,
  orderHandle
}
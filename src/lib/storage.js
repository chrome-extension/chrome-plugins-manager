const Promise = require('bluebird')
let storage = null

/**
 * 获取所有配置项【异步】
 */
function getAll() {
  let res = new Promise((resolve, reject) => {
    if (storage) {
      resolve(storage)
    } else {
      chrome.storage.sync.get(function(obj) {
        storage = obj
        resolve(storage)
      })
    }
  })
  return res
}

/**
 * 获取某个键值对
 */
function get(key) {
  return storage[key]
}

/**
 * 删除某个键值对
 */
function remove(key) {
  delete storage[key]
  chrome.storage.sync.remove(key, function(){})
}

/**
 * 增加或修改某个键值对
 */
function set(key, value) {
  storage[key] = value
  chrome.storage.sync.set(storage, function(){})
}


/**
 * 分组初始化处理
 */
function initGroup(vm) {
  let _oldLockObj = this.get('_lockList_')
  let _group = this.get('_group_')
  if (!_group) {
    _group = {
      list: [
        {
          'name': vm.i18n.defaultGroupName,
          'lock': _oldLockObj || {}
        }
      ]
    }
    this.set('_group_', _group)
    this.remove('_lockList_')
  }
  vm.group = _group
  vm.groupIndex = Number.parseInt(localStorage.getItem('_groupIndex_')) || 0
}


export {
  getAll,
  remove,
  set,
  get,
  initGroup
}
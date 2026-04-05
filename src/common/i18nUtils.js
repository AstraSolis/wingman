// i18n 工具函数
// 主进程和渲染进程共用的翻译辅助函数

/**
 * 通过点分隔的 key 获取嵌套对象中的值
 * @param {object} obj - 目标对象
 * @param {string} key - 点分隔的键路径 (如 'tray.quit')
 * @returns {string|undefined}
 */
function getNestedValue(obj, key) {
  return key.split('.').reduce((current, part) => {
    return current && current[part] !== undefined ? current[part] : undefined;
  }, obj);
}

/**
 * 创建翻译函数
 * @param {function} getTranslations - 返回当前翻译数据的函数
 * @param {function} getFallback - 返回回退翻译数据的函数
 * @returns {function} t(key, params) 翻译函数
 */
function createTranslator(getTranslations, getFallback) {
  return function t(key, params) {
    let text = getNestedValue(getTranslations(), key);

    // 回退
    if (text === undefined) {
      text = getNestedValue(getFallback(), key);
    }

    // 找不到翻译，返回 key
    if (text === undefined) {
      return key;
    }

    // 参数插值: 替换 {param} 占位符
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramValue);
      }
    }

    return text;
  };
}

// 兼容 CommonJS (主进程) 和浏览器环境 (渲染进程)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getNestedValue, createTranslator };
} else {
  window.I18nUtils = { getNestedValue, createTranslator };
}

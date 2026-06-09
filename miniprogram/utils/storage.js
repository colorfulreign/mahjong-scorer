/**
 * 本地存储封装
 * 用于保存/恢复对局状态，支持断点续玩
 */

const STORAGE_KEY = 'mahjong_game_state';

/**
 * 保存对局状态
 * @param {Object} gameState - 完整对局状态
 */
function saveGame(gameState) {
  try {
    wx.setStorageSync(STORAGE_KEY, JSON.stringify(gameState));
  } catch (e) {
    console.error('保存对局失败:', e);
  }
}

/**
 * 读取对局状态
 * @returns {Object|null} - 对局状态，无存档时返回 null
 */
function loadGame() {
  try {
    const data = wx.getStorageSync(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('读取对局失败:', e);
    return null;
  }
}

/**
 * 清除对局存档
 */
function clearGame() {
  try {
    wx.removeStorageSync(STORAGE_KEY);
  } catch (e) {
    console.error('清除存档失败:', e);
  }
}

/**
 * 判断是否有未完成的对局
 * @returns {boolean}
 */
function hasSavedGame() {
  return loadGame() !== null;
}

module.exports = {
  saveGame,
  loadGame,
  clearGame,
  hasSavedGame
};

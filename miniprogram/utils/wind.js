/**
 * 风位轮转引擎
 * 
 * 国标麻将风位规则：
 * - 庄家和牌 → 继续坐庄，风位不变
 * - 别人和牌 → 风位轮转（东→南→西→北，每人顺时针移一格）
 *                   新庄家 = 原庄家的下家
 * - 场风：初始东，庄家轮完一圈时自动推进 东→南→西→北
 */

const WINDS = ['东', '南', '西', '北'];
const WIND_EMOJI = { '东': '🀀', '南': '🀁', '西': '🀂', '北': '🀃' };

/**
 * 获取当前风位下每个人的自风
 * @param {number} dealerIdx - 庄家在 players 数组中的索引 (0-3)
 * @returns {string[]} - 4人各自的自风 ['东','南','西','北']
 */
function getSeatWinds(dealerIdx) {
  const winds = [];
  for (let i = 0; i < 4; i++) {
    // dealerIdx 的人永远是「东」
    const windIdx = (i - dealerIdx + 4) % 4;
    winds.push(WINDS[windIdx]);
  }
  return winds;
}

/**
 * 计算下一局的庄家
 * @param {number} currentDealer - 当前庄家索引 (0-3)
 * @param {number} winnerIdx - 和牌者索引 (0-3)
 * @returns {number} - 新庄家索引
 */
function getNextDealer(currentDealer, winnerIdx) {
  if (winnerIdx === currentDealer) {
    // 庄家连庄
    return currentDealer;
  }
  // 别人和牌 → 庄家移到下家
  return (currentDealer + 1) % 4;
}

/**
 * 计算下一局的场风
 * 规则：场风起始为东，每4局（一圈）推进一次
 * 简化：当庄家索引转回0时（一轮结束），场风前进
 * @param {string} currentFieldWind - 当前场风
 * @param {number} currentDealer - 当前庄家（轮转前）
 * @param {number} nextDealer - 新庄家（轮转后）
 * @returns {string} - 新场风
 */
function getNextFieldWind(currentFieldWind, currentDealer, nextDealer) {
  // 当庄家从3→0（转完一圈）时，场风推进
  if (currentDealer === 3 && nextDealer === 0) {
    const currentIdx = WINDS.indexOf(currentFieldWind);
    if (currentIdx < 3) {
      return WINDS[currentIdx + 1];
    }
    // 北风圈结束，游戏结束
    return '终';
  }
  return currentFieldWind;
}

/**
 * 确定和牌者：得分 > 0 的人（有多个时取最大得分）
 * @param {number[]} scores - 4人得分数组
 * @returns {number} - 和牌者索引
 */
function findWinner(scores) {
  let maxScore = -Infinity;
  let winnerIdx = 0;
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] > maxScore) {
      maxScore = scores[i];
      winnerIdx = i;
    }
  }
  return winnerIdx;
}

/**
 * 对得分数组排序，使得分 > 0 的（和牌者）永远在前
 * 用于展示：和牌者显示在最上面
 * @param {number[]} scores - 原始得分
 * @returns {{order: number[], winner: number}} - 排序索引 + 和牌者索引
 */
function sortByWinner(scores) {
  const winner = findWinner(scores);
  const order = [winner];
  for (let i = 1; i < 4; i++) {
    order.push((winner + i) % 4);
  }
  return { order, winner };
}

/**
 * 获取风名对应的 Emoji
 */
function getWindEmoji(wind) {
  return WIND_EMOJI[wind] || '🀄';
}

module.exports = {
  WINDS,
  WIND_EMOJI,
  getSeatWinds,
  getNextDealer,
  getNextFieldWind,
  findWinner,
  sortByWinner,
  getWindEmoji
};

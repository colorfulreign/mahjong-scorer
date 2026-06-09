/**
 * 计分板核心逻辑
 * 
 * 数据结构：
 *   game = {
 *     players: ['爸爸', '妈妈', '爷爷', '奶奶'],
 *     dealer: 0,           // 当前庄家索引
 *     fieldWind: '东',      // 场风
 *     roundNum: 1,         // 局数
 *     totalScores: [0,0,0,0], // 累计总分
 *     rounds: [...]        // 每局记录
 *   }
 */

const wind = require('../../utils/wind');
const storage = require('../../utils/storage');

Page({
  data: {
    // 局状态
    roundNum: 1,
    fieldWind: '东',
    windEmoji: { field: '🀀' },
    dealer: 0,

    // 玩家
    players: ['玩家1', '玩家2', '玩家3', '玩家4'],
    totalScores: [0, 0, 0, 0],

    // 展示数据（含自风信息）
    displayPlayers: [],

    // 当前局输入
    scoreInputs: [
      { idx: 0, name: '玩家1', windEmoji: '🀀', value: '', autoValue: null },
      { idx: 1, name: '玩家2', windEmoji: '🀁', value: '', autoValue: null },
      { idx: 2, name: '玩家3', windEmoji: '🀂', value: '', autoValue: null },
      { idx: 3, name: '玩家4', windEmoji: '🀃', value: '', autoValue: null }
    ],

    // 校验
    validationMsg: '',
    validationOk: false,
    canNextRound: false,

    // 当前局和牌者（临时高亮）
    currentWinner: -1,

    // 历史
    rounds: []
  },

  onLoad() {
    // 尝试恢复存档
    const saved = storage.loadGame();
    if (saved) {
      this.restoreGame(saved);
    } else {
      this.refreshDisplay();
    }
  },

  /**
   * 恢复存档对局
   */
  restoreGame(saved) {
    this.gameState = {
      players: saved.players || ['玩家1', '玩家2', '玩家3', '玩家4'],
      dealer: saved.dealer || 0,
      fieldWind: saved.fieldWind || '东',
      roundNum: saved.roundNum || 1,
      totalScores: saved.totalScores || [0, 0, 0, 0]
    };

    const rounds = saved.rounds || [];

    this.setData({
      players: this.gameState.players,
      dealer: this.gameState.dealer,
      fieldWind: this.gameState.fieldWind,
      windEmoji: { field: wind.getWindEmoji(this.gameState.fieldWind) },
      roundNum: this.gameState.roundNum,
      totalScores: [...this.gameState.totalScores],
      rounds: rounds,
      currentWinner: -1,
      canNextRound: false
    });

    this.refreshDisplay();
    this.refreshInputs();
  },

  /**
   * 刷新展示数据
   */
  refreshDisplay() {
    const g = this.gameState || this.getDefaultState();
    const seatWinds = wind.getSeatWinds(g.dealer);

    const displayPlayers = g.players.map((name, i) => ({
      name,
      wind: seatWinds[i],
      windEmoji: wind.getWindEmoji(seatWinds[i]),
      isDealer: i === g.dealer,
      isWinner: i === this.data.currentWinner,
      totalScore: g.totalScores[i]
    }));

    // 和牌者排第一
    if (this.data.currentWinner >= 0) {
      const w = this.data.currentWinner;
      displayPlayers.sort((a, b) => {
        if (displayPlayers.indexOf(a) === w) return -1;
        return 0;
      });
    }

    this.setData({ displayPlayers });
  },

  /**
   * 刷新输入框（跟随风位变化）
   */
  refreshInputs() {
    const g = this.gameState || this.getDefaultState();
    const seatWinds = wind.getSeatWinds(g.dealer);

    const scoreInputs = g.players.map((name, i) => ({
      idx: i,
      name,
      windEmoji: wind.getWindEmoji(seatWinds[i]),
      value: '',
      autoValue: null
    }));

    this.setData({ scoreInputs });
  },

  /**
   * 获取默认游戏状态
   */
  getDefaultState() {
    if (!this.gameState) {
      this.gameState = {
        players: ['玩家1', '玩家2', '玩家3', '玩家4'],
        dealer: 0,
        fieldWind: '东',
        roundNum: 1,
        totalScores: [0, 0, 0, 0]
      };
    }
    return this.gameState;
  },

  /**
   * 输入得分
   */
  onScoreInput(e) {
    const idx = parseInt(e.currentTarget.dataset.idx);
    const val = e.detail.value;
    const inputs = this.data.scoreInputs.map((item, i) => {
      if (i === idx) return { ...item, value: val };
      return item;
    });
    this.setData({ scoreInputs: inputs });
    this.validateScores();
  },

  /**
   * 输入聚焦
   */
  onScoreFocus(e) {
    // 预留
  },

  /**
   * 输入失焦
   */
  onScoreBlur(e) {
    this.validateScores();
  },

  /**
   * 快速填分模板
   */
  quickFill(e) {
    const type = e.currentTarget.dataset.type;
    const g = this.getDefaultState();
    const inputs = [...this.data.scoreInputs];

    // 重置
    inputs.forEach(inp => { inp.value = ''; inp.autoValue = null; });

    // 和牌者 = 当前庄家索引对应的人
    const winner = g.dealer;

    if (type === 'selfDraw') {
      // 自摸：和牌者 +24，其他各 -8
      inputs[winner].value = '24';
      inputs.forEach((inp, i) => {
        if (i !== winner) inp.value = '-8';
      });
    } else if (type === 'ronDealer') {
      // 庄点炮：庄 -24，和牌者 +24，其他 0（简化）
      inputs[winner].value = '-24';
      const next = (winner + 1) % 4;
      inputs[next].value = '24';
    } else if (type === 'ronOther') {
      // 闲点炮：点炮者 -12，和牌者 +12（简化），其他 0
      const next = (winner + 1) % 4;
      inputs[winner].value = '-12';
      inputs[next].value = '12';
    }

    this.setData({ scoreInputs: inputs });
    this.validateScores();
  },

  /**
   * 校验得分（4家之和须为0）
   */
  validateScores() {
    const inputs = this.data.scoreInputs;
    let sum = 0;
    let allFilled = true;

    const vals = inputs.map(inp => {
      const v = parseInt(inp.value);
      if (isNaN(v)) {
        allFilled = false;
        return 0;
      }
      return v;
    });

    sum = vals.reduce((a, b) => a + b, 0);

    if (!allFilled) {
      this.setData({
        validationMsg: '请填写所有得分',
        validationOk: false,
        canNextRound: false,
        currentWinner: -1
      });
      return;
    }

    if (sum !== 0) {
      this.setData({
        validationMsg: `得分和不等于0 (当前和: ${sum >= 0 ? '+' : ''}${sum})`,
        validationOk: false,
        canNextRound: false,
        currentWinner: -1
      });
      return;
    }

    // 校验通过，显示和牌者
    const winner = wind.findWinner(vals);
    this.setData({
      validationMsg: `✓ 校验通过 — 和牌者：${inputs[winner].name}`,
      validationOk: true,
      canNextRound: true,
      currentWinner: winner
    });

    this.refreshDisplay();
  },

  /**
   * 下一局
   */
  nextRound() {
    if (!this.data.canNextRound) return;

    const g = this.getDefaultState();
    const inputs = this.data.scoreInputs;

    // 解析得分
    const scores = inputs.map(inp => parseInt(inp.value) || 0);
    const winnerIdx = wind.findWinner(scores);

    // 保存本局记录
    const record = {
      roundNum: g.roundNum,
      fieldWind: g.fieldWind,
      dealer: g.dealer,
      winner: winnerIdx,
      winnerName: g.players[winnerIdx],
      scores: [...scores],
      displayScores: g.players.map((name, i) => ({
        name,
        score: scores[i]
      }))
    };

    const rounds = [...this.data.rounds, record];

    // 更新累计得分
    const totalScores = g.totalScores.map((t, i) => t + scores[i]);

    // 计算下一局的庄家和场风
    const nextDealer = wind.getNextDealer(g.dealer, winnerIdx);
    const nextFieldWind = wind.getNextFieldWind(g.fieldWind, g.dealer, nextDealer);

    // 更新状态
    g.dealer = nextDealer;
    g.fieldWind = nextFieldWind;
    g.roundNum += 1;
    g.totalScores = totalScores;

    this.setData({
      roundNum: g.roundNum,
      fieldWind: g.fieldWind,
      windEmoji: { field: wind.getWindEmoji(g.fieldWind) },
      dealer: g.dealer,
      totalScores: [...totalScores],
      rounds,
      currentWinner: -1,
      canNextRound: false,
      validationMsg: '',
      validationOk: false
    });

    // 保存
    storage.saveGame({
      players: g.players,
      dealer: g.dealer,
      fieldWind: g.fieldWind,
      roundNum: g.roundNum,
      totalScores: g.totalScores,
      rounds
    });

    this.refreshDisplay();
    this.refreshInputs();

    // 检查对局是否结束
    if (nextFieldWind === '终') {
      wx.showModal({
        title: '对局结束',
        content: '已打完北风圈，本场对局结束！',
        showCancel: false,
        confirmText: '好的'
      });
    }
  },

  /**
   * 手动推进场风
   */
  manualAdvanceWind() {
    const g = this.getDefaultState();
    const winds = ['东', '南', '西', '北'];
    const currentIdx = winds.indexOf(g.fieldWind);
    if (currentIdx < 3) {
      g.fieldWind = winds[currentIdx + 1];
      this.setData({
        fieldWind: g.fieldWind,
        windEmoji: { field: wind.getWindEmoji(g.fieldWind) }
      });
      storage.saveGame({
        players: g.players,
        dealer: g.dealer,
        fieldWind: g.fieldWind,
        roundNum: g.roundNum,
        totalScores: g.totalScores,
        rounds: this.data.rounds
      });
      wx.showToast({ title: `场风已切换为${g.fieldWind}`, icon: 'none' });
    }
  },

  /**
   * 结束对局
   */
  endGame() {
    const g = this.getDefaultState();
    wx.showModal({
      title: '结束对局',
      content: `确定结束吗？当前打到第${g.roundNum}局。结束后数据将被清除。`,
      confirmText: '确定结束',
      cancelText: '继续',
      success: (res) => {
        if (res.confirm) {
          storage.clearGame();
          this.gameState = null;
          this.setData({
            roundNum: 1,
            fieldWind: '东',
            windEmoji: { field: '🀀' },
            dealer: 0,
            players: ['玩家1', '玩家2', '玩家3', '玩家4'],
            totalScores: [0, 0, 0, 0],
            rounds: [],
            currentWinner: -1,
            canNextRound: false,
            validationMsg: ''
          });
          this.refreshDisplay();
          this.refreshInputs();
          wx.showToast({ title: '对局已结束', icon: 'success' });
        }
      }
    });
  }
});

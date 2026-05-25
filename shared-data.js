// ===== 长白山金融化平台 — 共享数据引擎 =====
// 三个工作台页面通过 BroadcastChannel 实时同步状态

const FLOW_STEPS = [
  { id:'rights',      label:'确权',        icon:'1', role:'资产方' },
  { id:'iot',         label:'IoT部署',     icon:'2', role:'资产方' },
  { id:'data_verify', label:'数据验证',     icon:'3', role:'资产方' },
  { id:'ai_val',      label:'AI价值参考',  icon:'4', role:'系统' },
  { id:'appraiser',   label:'评估师签章',   icon:'5', role:'评估师' },
  { id:'bank_review', label:'银行审批',     icon:'6', role:'银行' },
  { id:'mortgage',    label:'抵押登记',     icon:'7', role:'银行' },
  { id:'disburse',    label:'放款',         icon:'8', role:'银行' },
  { id:'monitor',     label:'贷后监控',     icon:'9', role:'银行' },
];

// 核心共享状态
var $S = {
  _version: 2,            // 状态版本号（升级时清除旧缓存）
  flowStep: 4,           // 当前所在步骤索引 (0-8), 4=评估师签章
  category: 'ginseng',   // 当前品类: 'ginseng'=林下参 | 'fungi'=桑黄/灵芝
  asset: {
    id: 'CBS-2024-A03',
    name: 'A地块·12年参龄',
    category: '林下参',
    area: 18.5,
    age: 12,
    certNo: '吉林林权证字[2024]第CBS001号',
    lat: 41.90, lon: 126.50,
  },
  sensors: { total: 14, online: 14, soil3: 7, geo: 3, par: 2, cam: 2 },
  valuation: {
    id: 'VAL-2026-0518',
    // AI价值参考输出（非最终估值，仅供评估师参考）
    aiSv: 88.5, aiQa: 42, aiQb: 35, aiQc: 23, aiPrice: 5800,
    svCI: [85.0, 92.0],  // 存活率置信区间
    // 三重折扣体系
    dQuality: 0.08,     // 品质不确定性折扣（基于置信区间宽度）
    dLiquidity: 0.15,   // 流动性折扣（品类/参龄决定）
    hPledge: 0.60,      // 金融机构最高质押率上限
    // 三层输出价值
    fairValue: 1062,    // 公允价值参考值 V_t（万元）
    afterLiquidity: 903, // 流动性折扣后价值（万元）
    collateralRange: [530, 540], // 建议担保价值区间（万元）
    // 评估师确认值
    confirmedSv: null, confirmedQa: null, confirmedQb: null, confirmedQc: null, confirmedPrice: null,
    discountRate: 8.0, period: 10, ageFactor: 1.00,
    signed: false, signer: null, signTime: null,
    estimatedValue: 1062,
    confirmedValue: null,
  },
  // 底稿数据（一键生成底稿所需四类底层数据）
  draftReport: {
    generated: false,
    draftId: null,
    qrCodeUrl: null,      // 扫码进入证据链浏览器
    envSummary: null,     // 环境监测统计
    inspectionRecords: [], // 巡检/检测记录
    alertEvents: [],      // 告警事件列表
    dataCompleteness: null, // 数据完整性声明
  },
  application: {
    id: 'LA-20260518-0037',
    applicant: '长白山参业有限公司',
    bank: '吉林银行长白山支行',
    amount: 637,
    ltv: 60,
    term: 3,
    status: 'pending',
    date: '2026-05-18',
    hash: '0xa3f2b8c1d4e5f6a7b8c9d0e1f2a3b4c5',
  },
  postLoan: {
    ltvCurrent: 60.0,
    ltvLimit: 60,
    status: 'normal',
    alerts: 0,
  },
  // ===== 真菌板块数据 =====
  fungi: {
    asset: {
      id: 'GH-2025-SH07',
      name: '大棚1号·桑黄批次7',
      category: '桑黄',
      area: 2.8,
      batchDays: 185,
      certNo: '吉林林权证字[2025]第CBS-GH01号',
    },
    sensors: { total: 22, online: 21, microclimate: 8, spawn: 6, nir: 4, cam: 4 },
    valuation: {
      id: 'VAL-2026-0510',
      aiYield: 92.0, aiQa: 55, aiQb: 30, aiQc: 12, aiPrice: 3200,
      yieldCI: [88.0, 96.0],
      dQuality: 0.06,
      dLiquidity: 0.10,
      hPledge: 0.55,
      fairValue: 1650,
      afterLiquidity: 1485,
      collateralRange: [810, 820],
      confirmedYield: null, confirmedQa: null, confirmedQb: null, confirmedQc: null, confirmedPrice: null,
      discountRate: 9.0, period: 3, batchFactor: 1.05,
      signed: false, signer: null, signTime: null,
      estimatedValue: 1650,
      confirmedValue: null,
    },
    draftReport: {
      generated: false,
      draftId: null,
      qrCodeUrl: null,
      envSummary: null,
      inspectionRecords: [],
      alertEvents: [],
      dataCompleteness: null,
    },
    application: {
      id: 'LA-20260510-0026',
      applicant: '通化参业合作社',
      bank: '吉林银行通化支行',
      amount: 990,
      ltv: 60,
      term: 2,
      status: 'pending',
      date: '2026-05-10',
      hash: '0xb7d3e5f2a1c4d6e8f9a0b1c2d3e4f5a6',
    },
  },
};

// 当前品类下的便捷访问
function assetForCategory() {
  return $S.category === 'fungi' ? $S.fungi.asset : $S.asset;
}
function sensorsForCategory() {
  return $S.category === 'fungi' ? $S.fungi.sensors : $S.sensors;
}
function valuationForCategory() {
  return $S.category === 'fungi' ? $S.fungi.valuation : $S.valuation;
}
function applicationForCategory() {
  return $S.category === 'fungi' ? $S.fungi.application : $S.application;
}
function draftReportForCategory() {
  return $S.category === 'fungi' ? $S.fungi.draftReport : $S.draftReport;
}

function switchCategory(cat) {
  $S.category = cat;
  broadcastState();
  if (typeof onCategorySwitch === 'function') onCategorySwitch(cat);
  if (typeof onStateSync === 'function') onStateSync($S);
}

// ===== localStorage 持久化 + BroadcastChannel 跨标签同步 =====
var _channel = null;

(function(){
  try {
    var saved = localStorage.getItem('changbai-demo-state');
    if (saved) {
      var parsed = JSON.parse(saved);
      // Skip restoring if saved state is from an older version
      if (parsed._version !== $S._version) {
        console.log('State version mismatch (' + (parsed._version||0) + ' vs ' + $S._version + '), clearing old cache');
        localStorage.removeItem('changbai-demo-state');
      } else {
        for (var key in parsed) {
          if (parsed.hasOwnProperty(key) && typeof parsed[key] === 'object' && !Array.isArray(parsed[key]) && $S[key]) {
            for (var sub in parsed[key]) {
              if (parsed[key].hasOwnProperty(sub)) { $S[key][sub] = parsed[key][sub]; }
            }
          } else {
            $S[key] = parsed[key];
          }
        }
      }
    }
  } catch(e) {}
})();

try {
  _channel = new BroadcastChannel('changbai-demo');
  _channel.onmessage = function(e) {
    if (e.data && e.data.type === 'sync') {
      var state = e.data.state;
      for (var key in state) {
        if (state.hasOwnProperty(key) && typeof state[key] === 'object' && !Array.isArray(state[key]) && $S[key]) {
          for (var sub in state[key]) {
            if (state[key].hasOwnProperty(sub)) { $S[key][sub] = state[key][sub]; }
          }
        } else {
          $S[key] = state[key];
        }
      }
      if (typeof onStateSync === 'function') onStateSync($S);
    }
  };
} catch(e) {}

function persistState() {
  try { localStorage.setItem('changbai-demo-state', JSON.stringify($S)); } catch(e) {}
}

function broadcastState() {
  persistState();
  if (_channel) {
    try { _channel.postMessage({ type: 'sync', state: $S }); } catch(e) {}
  }
}

// ===== 状态流转 =====
function advanceFlow(targetStepId) {
  var idx = -1;
  for (var i = 0; i < FLOW_STEPS.length; i++) {
    if (FLOW_STEPS[i].id === targetStepId) { idx = i; break; }
  }
  if (idx < 0) return;
  $S.flowStep = idx;
  broadcastState();
  if (typeof onStateSync === 'function') onStateSync($S);
}

// 评估师签章完成 → 流程推进到银行审批
function completeAppraiserSign(sv, price) {
  var v = valuationForCategory();
  v.signed = true;
  v.signer = '张xx · 吉评字[2026]018号';
  v.signTime = new Date().toLocaleString('zh-CN');
  v.confirmedSv = parseFloat(sv);
  v.confirmedPrice = parseFloat(price);
  v.confirmedValue = Math.floor(v.estimatedValue * (parseFloat(sv) / ($S.category==='fungi'?v.aiYield:v.aiSv)));
  advanceFlow('bank_review');
}

function completeBankApproval() {
  applicationForCategory().status = 'approved';
  advanceFlow('mortgage');
}

function completeMortgage() {
  advanceFlow('disburse');
}

function completeDisburse() {
  applicationForCategory().status = 'disbursed';
  advanceFlow('monitor');
}

// ===== 流程进度条渲染 =====
function renderFlowBar(highlightRole) {
  var html = '<div style="display:flex;align-items:center;gap:0;overflow-x:auto;padding:4px 0;flex-shrink:0">';
  for (var i = 0; i < FLOW_STEPS.length; i++) {
    var s = FLOW_STEPS[i];
    var isDone = i < $S.flowStep;
    var isActive = i === $S.flowStep;
    var isCurrentRole = s.role === highlightRole;
    var dotStyle = '';
    var labelStyle = '';
    var connectorStyle = '';
    if (isDone) {
      dotStyle = 'background:var(--success);color:#fff;border-color:var(--success)';
      labelStyle = 'color:var(--success)';
      connectorStyle = 'background:var(--success)';
    } else if (isActive) {
      dotStyle = 'background:var(--primary);color:#fff;border-color:var(--primary)';
      labelStyle = 'color:var(--primary);font-weight:700';
      connectorStyle = 'background:var(--border)';
    } else {
      dotStyle = 'background:var(--bg-white);color:var(--text-muted);border-color:var(--border)';
      labelStyle = 'color:var(--text-muted)';
      connectorStyle = 'background:var(--border)';
    }
    html += '<div style="display:flex;align-items:center;gap:0;flex-shrink:0">';
    html += '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer" title="' + s.label + ' (' + s.role + ')' + '">';
    html += '<div style="width:28px;height:28px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;transition:all .2s;' + dotStyle + '">' + (isDone ? '&#10003;' : s.icon) + '</div>';
    html += '<span style="font-size:11px;white-space:nowrap;' + labelStyle + '">' + s.label + '</span>';
    if (isCurrentRole) {
      html += '<span style="font-size:9px;color:var(--primary);background:var(--primary-light);padding:1px 6px;border-radius:8px">当前角色</span>';
    }
    html += '</div>';
    if (i < FLOW_STEPS.length - 1) {
      html += '<div style="width:32px;height:2px;margin:0 2px;margin-bottom:24px;transition:background .3s;' + connectorStyle + '"></div>';
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

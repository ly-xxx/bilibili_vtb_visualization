const fs = require('fs');
const readline = require('readline');
const axios = require('axios');
const path = require('path');
const ColorThief = require('colorthief');

const RAW_DATA_FILE = 'data.csv'; 
const VUP_LIST_FILE = 'vup_list.csv'; 
const BAKED_DATA_FILE = 'baked_data.csv';
const AVATAR_DIR = path.join(__dirname, 'avatars');
const FALLBACK_AVATAR = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOM8J/xHwAFJgI+qD2BqQAAAABJRU5ErkJggg==", 'base64');

const AXIOS_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://space.bilibili.com/'
};

const COLOR_OVERRIDES = {
    '阿萨Aza': '#B8E994',
    '永雏塔菲': '#ff85c8' 
};

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function drawProgress(current, total, text) {
    const width = 30;
    const percent = current / total;
    const filled = Math.round(width * percent);
    const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
    process.stdout.write(`\r[${bar}] ${Math.round(percent * 100)}% | ${current}/${total} | ${text}`.padEnd(80));
}

// 带完整性校验的下载机制
async function downloadWithRetry(url, dest, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await axios({ url, responseType: 'stream', timeout: 5000, headers: AXIOS_HEADERS });
            const writer = fs.createWriteStream(dest);
            response.data.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            
            // 校验完整性 (如果小于 200b 说明被拦截或者是坏图)
            const stats = fs.statSync(dest);
            if (stats.size > 200) return true;
            
            fs.unlinkSync(dest); // 太小了，删掉准备下一轮重试
        } catch (err) {
            if (fs.existsSync(dest)) fs.unlinkSync(dest);
        }
    }
    return false;
}

async function bakeData() {
    if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR);

    console.log("1. 正在载入 vup_list.csv 白名单...");
    if (!fs.existsSync(VUP_LIST_FILE)) {
        console.error(`❌ 找不到 ${VUP_LIST_FILE}，请先配置白名单！`);
        return;
    }
    
    const whitelist = new Set();
    const faceMap = {};
    const listLines = fs.readFileSync(VUP_LIST_FILE, 'utf-8').split(/\r?\n/);
    for (let i = 1; i < listLines.length; i++) {
        const line = listLines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        const name = parts[1];
        const face = parts[3];
        if (name) {
            whitelist.add(name);
            if (face) faceMap[name] = face;
        }
    }
    console.log(`✅ 成功载入 ${whitelist.size} 位白名单主播。`);

    console.log("2. 读取原始数据...");
    const history = {};
    const fileStream = fs.createReadStream(RAW_DATA_FILE);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
        if (!line || line.startsWith('date')) continue;
        const [date, name, value] = line.split(',');
        
        // 第一重过滤：必须在白名单内
        if (!whitelist.has(name)) continue; 
        
        if (!history[date]) history[date] = {};
        history[date][name] = parseInt(value, 10);
    }

    const dates = Object.keys(history).sort();
    
    console.log("3. 智能过滤：提取曾杀入前 150 名的 VIP 选手...");
    const finalTargets = new Set();
    for (const d of dates) {
        // 先按当天的粉丝数从大到小排序
        const sorted = Object.entries(history[d]).sort((a, b) => b[1] - a[1]);
        // 第二重过滤：只取每天的前 150 名
        sorted.slice(0, 150).forEach(x => finalTargets.add(x[0]));
    }
    console.log(`✅ 双重过滤完毕：在白名单中且曾露脸前150名的共计 ${finalTargets.size} 位，将只处理他们！`);

    console.log("4. 对目标数据进行平滑填充...");
    let lastValues = {};
    for (const d of dates) {
        const today = history[d];
        for (const name of finalTargets) {
            if (!(name in today) && (name in lastValues)) {
                today[name] = lastValues[name];
            }
        }
        lastValues = { ...today };
    }

    console.log(`\n5. 校验头像完整性并补充下载这 ${finalTargets.size} 位主播的资源...`);
    const colorMap = {};
    const vupArray = Array.from(finalTargets);
    
    for (let i = 0; i < vupArray.length; i++) {
        const name = vupArray[i];
        const avatarPath = path.join(AVATAR_DIR, `${name}.jpg`);
        drawProgress(i + 1, vupArray.length, `处理: ${name.slice(0, 10)}`);

        // 如果存在残缺图 (低于200b)，直接删了重下
        if (fs.existsSync(avatarPath) && fs.statSync(avatarPath).size < 200) {
            fs.unlinkSync(avatarPath);
        }

        if (!fs.existsSync(avatarPath)) {
            const url = faceMap[name];
            if (url) {
                const success = await downloadWithRetry(url, avatarPath, 3);
                if (!success) fs.writeFileSync(avatarPath, FALLBACK_AVATAR); // 重试3次都不行才用灰图
            } else {
                fs.writeFileSync(avatarPath, FALLBACK_AVATAR);
            }
        }

        if (COLOR_OVERRIDES[name]) {
            colorMap[name] = COLOR_OVERRIDES[name];
        } else {
            try {
                const rgb = await ColorThief.getColor(avatarPath);
                colorMap[name] = rgbToHex(rgb[0], rgb[1], rgb[2]);
            } catch (err) {
                colorMap[name] = "#777777"; 
            }
        }
    }

    console.log("\n\n6. 写入最终烘焙数据 (含增量计算)...");
    const outStream = fs.createWriteStream(BAKED_DATA_FILE);
    outStream.write("date,name,value,inc,color\n");
    
    let previousDay = {};
    for (const d of dates) {
        for (const name of finalTargets) {
            const val = history[d][name];
            if (val !== undefined) {
                const inc = val - (previousDay[name] || val); 
                outStream.write(`${d},${name},${val},${inc},${colorMap[name]}\n`);
                previousDay[name] = val;
            }
        }
    }
    outStream.end();
    console.log("🎉 烘焙完毕！");
}

bakeData();
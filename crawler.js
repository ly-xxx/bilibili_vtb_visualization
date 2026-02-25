const axios = require('axios');
const fs = require('fs');

const START_TIME = new Date('2021-06-01T00:00:00Z').getTime();
const DELAY_MS = 250; // 基础延迟，稍微调高一点保护服务器
const MAX_RETRIES = 3; // 最大重试次数
const DATA_FILE = 'data.csv';
const ERROR_FILE = 'error_log.txt';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 将毫秒格式化为 HH:MM:SS
function formatTime(ms) {
    if (ms <= 0) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 封装带有重试和超时机制的请求
async function fetchWithRetry(url, vtbName, retries = MAX_RETRIES) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // 设置 15 秒超时，防止请求假死挂起
            const res = await axios.get(url, { timeout: 15000 });
            return res.data;
        } catch (error) {
            if (attempt === retries) {
                throw error; // 达到最大重试次数，抛出最终错误
            }
            const backoffDelay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s...
            // 清除当前行进度条，打印重试提示
            process.stdout.write('\x1b[2K\r'); 
            console.log(`[重试 ${attempt}/${MAX_RETRIES}] ${vtbName} 请求超时，${backoffDelay/1000}秒后重试...`);
            await sleep(backoffDelay);
        }
    }
}

// 绘制单行进度条
function drawProgressBar(current, total, etaMs, vtbName) {
    const percent = total === 0 ? 1 : (current / total);
    const barLength = 25; 
    const filledLength = Math.round(barLength * percent);
    const bar = '█'.repeat(filledLength) + '-'.repeat(barLength - filledLength);
    
    const percentageStr = (percent * 100).toFixed(1).padStart(5, ' ');
    const namePad = vtbName.substring(0, 12).padEnd(12, ' ');
    
    // \x1b[2K\r 用于彻底清空当前行，防止残留字符
    process.stdout.write(`\x1b[2K\r[${bar}] ${current}/${total} (${percentageStr}%) | ETA: ${formatTime(etaMs)} | 当前: ${namePad}`);
}

async function fetchVtuberData() {
    console.log("正在获取 Vup 列表...");
    let vtbs = [];
    try {
        vtbs = await fetchWithRetry('https://api.vtbs.moe/v1/short', "Vup列表获取");
        console.log(`共获取到 ${vtbs.length} 位主播\n`);
    } catch (err) {
        console.error("致命错误: 无法获取主播列表！请检查网络或稍后重试。");
        return;
    }

    const processedNames = new Set();
    const isNewFile = !fs.existsSync(DATA_FILE);
    
    // --- 断点续传：读取进度 ---
    if (!isNewFile) {
        console.log("检测到本地 data.csv，正在分析断点进度...");
        const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
        const lines = fileData.split('\n');
        
        for (const line of lines) {
            if (!line || line.startsWith('date')) continue;
            const cols = line.split(',');
            if (cols.length >= 2) {
                processedNames.add(cols[1]); // 获取已存入的 name
            }
        }
        console.log(`已读取断点，发现 ${processedNames.size} 位主播已抓取，将自动跳过。`);
    }

    // 文件流初始化 (追加模式)
    const outStream = fs.createWriteStream(DATA_FILE, { flags: 'a' });
    const errStream = fs.createWriteStream(ERROR_FILE, { flags: 'a' });
    if (isNewFile) {
        outStream.write("date,name,value\n");
    }
    if (!fs.existsSync(ERROR_FILE)) {
        errStream.write("mid,name,error_time,error_message\n");
    }

    // 过滤出未处理的主播
    const remainingVtbs = vtbs.filter(v => !processedNames.has(v.uname.replace(/,/g, '，')));
    const totalToProcess = remainingVtbs.length;
    
    if (totalToProcess === 0) {
        console.log("所有数据均已抓取完毕！");
        outStream.end();
        errStream.end();
        return;
    }

    console.log(`\n========================================`);
    console.log(`开始抓取剩余 ${totalToProcess} 位主播数据`);
    console.log(`========================================\n`);

    let failedCount = 0;
    
    // ETA 滑动窗口：记录最近 20 次请求的耗时
    const recentSpeeds = [];
    const MAX_SPEED_SAMPLES = 20;

    // --- 主循环：遍历抓取 ---
    for (let i = 0; i < totalToProcess; i++) {
        const itemStartTime = Date.now();
        const vtb = remainingVtbs[i];
        const safeName = vtb.uname.replace(/,/g, '，');
        
        try {
            // 计算基于滑动窗口的 ETA
            let etaMs = 0;
            if (recentSpeeds.length > 0) {
                const avgSpeed = recentSpeeds.reduce((a, b) => a + b, 0) / recentSpeeds.length;
                etaMs = avgSpeed * (totalToProcess - i);
            }
            
            drawProgressBar(i, totalToProcess, etaMs, safeName);

            // 核心抓取调用
            const history = await fetchWithRetry(`https://api.vtbs.moe/v2/bulkActive/${vtb.mid}`, safeName);

            const dailyData = {};
            for (const record of history) {
                if (record.time >= START_TIME) {
                    const dateStr = new Date(record.time).toISOString().split('T')[0];
                    dailyData[dateStr] = record.follower; 
                }
            }

            // 拼接并写入文件
            let outputText = "";
            for (const [date, follower] of Object.entries(dailyData)) {
                outputText += `${date},${safeName},${follower}\n`;
            }
            if (outputText) {
                outStream.write(outputText);
            }

            await sleep(DELAY_MS); 
            
            // 记录当前项的真实耗时到滑动窗口
            const itemElapsed = Date.now() - itemStartTime;
            recentSpeeds.push(itemElapsed);
            if (recentSpeeds.length > MAX_SPEED_SAMPLES) {
                recentSpeeds.shift(); // 维持窗口大小为 20
            }
            
        } catch (error) {
            // 彻底失败的处理逻辑
            process.stdout.write('\x1b[2K\r'); // 清空行
            console.log(`[彻底失败] 无法获取 ${safeName} (mid: ${vtb.mid}) 的数据: ${error.message}`);
            
            const errTime = new Date().toISOString();
            errStream.write(`${vtb.mid},${safeName},${errTime},${error.message.replace(/,/g, ' ')}\n`);
            
            failedCount++;
            
            // 即使失败，也塞入一个基础耗时，防止测速失真
            recentSpeeds.push(Date.now() - itemStartTime);
            if (recentSpeeds.length > MAX_SPEED_SAMPLES) recentSpeeds.shift();
        }
    }
    
    drawProgressBar(totalToProcess, totalToProcess, 0, "全部完成");
    
    outStream.end();
    errStream.end();
    console.log(`\n\n数据拉取结束！`);
    console.log(`成功: ${totalToProcess - failedCount} 个，失败: ${failedCount} 个。`);
    if (failedCount > 0) {
        console.log(`失败名单已保存在当前目录下的 error_log.txt 中，可以稍后尝试单独修补这些数据。`);
    } else {
        console.log(`完美！所有数据均已保存至 data.csv。`);
    }
}

fetchVtuberData();
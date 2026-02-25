const axios = require('axios');
const fs = require('fs');
const readline = require('readline');

const BAKED_DATA_FILE = 'baked_data.csv';
const TARGET_DATE = '2026-02-25';
const NEW_DATE = '2026-02-26';
const DELAY_MS = 250;
const MAX_RETRIES = 3;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, vtbName, retries = MAX_RETRIES) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await axios.get(url, { timeout: 15000 });
            return res.data;
        } catch (error) {
            if (attempt === MAX_RETRIES) throw error;
            const backoffDelay = 1000 * Math.pow(2, attempt - 1);
            process.stdout.write('\x1b[2K\r');
            console.log(`[重试 ${attempt}/${MAX_RETRIES}] ${vtbName} 请求超时...`);
            await sleep(backoffDelay);
        }
    }
}

function drawProgressBar(current, total, vtbName) {
    const percent = total === 0 ? 1 : (current / total);
    const barLength = 25;
    const filledLength = Math.round(barLength * percent);
    const bar = '█'.repeat(filledLength) + '-'.repeat(barLength - filledLength);
    const percentageStr = (percent * 100).toFixed(1).padStart(5, ' ');
    const namePad = vtbName.substring(0, 15).padEnd(15, ' ');
    process.stdout.write(`\x1b[2K\r[${bar}] ${current}/${total} (${percentageStr}%) | 当前: ${namePad}`);
}

async function updateToday() {
    console.log(`1. 正在读取 ${BAKED_DATA_FILE}，查找 ${TARGET_DATE} 的 up 主列表...\n`);

    const vtbsOnTargetDate = new Set();
    const fileStream = fs.createReadStream(BAKED_DATA_FILE);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
        if (!line || line.startsWith('date')) continue;
        const cols = line.split(',');
        if (cols.length < 2) continue;
        
        const date = cols[0];
        const name = cols[1];
        
        if (date === TARGET_DATE) {
            vtbsOnTargetDate.add(name);
        }
    }

    console.log(`找到 ${vtbsOnTargetDate.size} 位 up 主\n`);

    if (vtbsOnTargetDate.size === 0) {
        console.log(`❌ 在 ${BAKED_DATA_FILE} 中找不到 ${TARGET_DATE} 的数据！`);
        return;
    }

    // 获取 vup_list.csv 中的 mid 映射
    console.log(`2. 正在加载 vup_list.csv 获取 mid 映射...\n`);
    const vupMap = {};
    const vupList = [];

    if (fs.existsSync('vup_list.csv')) {
        const vupStream = fs.createReadStream('vup_list.csv');
        const vupRl = readline.createInterface({ input: vupStream, crlfDelay: Infinity });

        for await (const line of vupRl) {
            if (!line || line.startsWith('mid')) continue;
            const [mid, name] = line.split(',');
            // 存储所有 vup，以便后续匹配
            vupList.push({ mid, name });
            if (vtbsOnTargetDate.has(name)) {
                vupMap[name] = mid;
            }
        }
    }

    // 如果某些 vup 在 vup_list.csv 中找不到，从完整名单中查找
    if (Object.keys(vupMap).length < vtbsOnTargetDate.size && vupList.length > 0) {
        console.log(`一些 up 主找不到 mid，尝试从完整名单中模糊匹配...`);
        for (const name of vtbsOnTargetDate) {
            if (!vupMap[name]) {
                const match = vupList.find(v => v.name.includes(name) || name.includes(v.name));
                if (match) {
                    vupMap[name] = match.mid;
                }
            }
        }
    }

    const toFetch = Array.from(vtbsOnTargetDate);
    console.log(`3. 开始爬取当前粉丝数 (共 ${toFetch.length} 位)...\n`);

    const newData = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < toFetch.length; i++) {
        const name = toFetch[i];
        const mid = vupMap[name];

        if (!mid) {
            drawProgressBar(i + 1, toFetch.length, name);
            console.log(`\n[跳过] ${name} 找不到 mid，无法爬取`);
            failCount++;
            continue;
        }

        try {
            drawProgressBar(i + 1, toFetch.length, name);
            const activeData = await fetchWithRetry(`https://api.vtbs.moe/v2/bulkActive/${mid}`, name);
            
            if (activeData && activeData.length > 0) {
                // 获取最新的粉丝数
                const latestRecord = activeData[activeData.length - 1];
                const currentFollower = latestRecord.follower;
                
                newData.push({
                    name,
                    follower: currentFollower
                });
                successCount++;
            }

            await sleep(DELAY_MS);
        } catch (error) {
            process.stdout.write('\x1b[2K\r');
            console.log(`\n[失败] ${name}: ${error.message}`);
            failCount++;
        }
    }

    // ==========================================
    // 核心修改区：同时记录昨天的粉丝数和“颜色”
    // ==========================================
    console.log(`\n\n4. 从 baked_data.csv 查找昨日粉丝数和颜色以继承...\n`);

    const yesterdayData = {};
    const fileStream2 = fs.createReadStream(BAKED_DATA_FILE);
    const rl2 = readline.createInterface({ input: fileStream2, crlfDelay: Infinity });

    for await (const line of rl2) {
        if (!line || line.startsWith('date')) continue;
        const cols = line.split(',');
        if (cols.length < 3) continue;
        
        const date = cols[0];
        const name = cols[1];
        const value = parseInt(cols[2], 10);
        // 如果有第5列颜色就提取，如果没有给个默认灰
        const color = cols.length >= 5 ? cols[4].trim() : '#777777'; 
        
        if (date === TARGET_DATE) {
            yesterdayData[name] = { value, color };
        }
    }

    // ==========================================
    // 核心修改区：拼接时补上第五列的颜色
    // ==========================================
    console.log(`5. 计算增量并携带颜色追加到 baked_data.csv...\n`);
    const appendStream = fs.createWriteStream(BAKED_DATA_FILE, { flags: 'a' });

    for (const data of newData) {
        // 取出昨天的对象（包含 value 和 color）
        const yesterdayInfo = yesterdayData[data.name] || { value: 0, color: '#777777' };
        
        const increment = data.follower - yesterdayInfo.value;
        const colorToInherit = yesterdayInfo.color;

        // 严格按照5列格式追加：日期,名字,粉丝量,增量,颜色
        appendStream.write(`${NEW_DATE},${data.name},${data.follower},${increment},${colorToInherit}\n`);
    }

    await new Promise((res, rej) => {
        appendStream.end();
        appendStream.on('finish', res);
        appendStream.on('error', rej);
    });

    console.log(`\n🎉 更新完成！`);
    console.log(`成功: ${successCount} 位，失败: ${failCount} 位`);
    console.log(`新数据(含颜色)已追加到 ${BAKED_DATA_FILE} (日期: ${NEW_DATE})`);
}

updateToday();   
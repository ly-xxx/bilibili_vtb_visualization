const fs = require('fs');
const path = require('path');
const axios = require('axios');

const AVATAR_DIR = path.join(__dirname, 'avatars');

// 辅助函数：休眠
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 绘制单行进度条
function drawProgressBar(current, total, title) {
    const percent = total === 0 ? 1 : (current / total);
    const barLength = 25; 
    const filledLength = Math.round(barLength * percent);
    const bar = '█'.repeat(filledLength) + '-'.repeat(barLength - filledLength);
    
    const percentageStr = (percent * 100).toFixed(1).padStart(5, ' ');
    process.stdout.write(`\x1b[2K\r[${bar}] ${current}/${total} (${percentageStr}%) | ${title}`);
}

async function retryFailedAvatars() {
    if (!fs.existsSync(AVATAR_DIR)) {
        console.log("未找到 avatars 文件夹，请先运行 bake.js");
        return;
    }

    console.log("1. 正在扫描下载失败的头像 (检测 70 字节的占位符)...");
    const files = fs.readdirSync(AVATAR_DIR);
    const failedNames = [];

    for (const file of files) {
        if (file.endsWith('.jpg')) {
            const filePath = path.join(AVATAR_DIR, file);
            const stats = fs.statSync(filePath);
            // 兜底的 base64 图像正好是 70 bytes，保险起见设定小于 500 bytes 均视为失败
            if (stats.size < 500) {
                // 去除 .jpg 后缀，恢复主播名字
                failedNames.push(file.replace('.jpg', ''));
            }
        }
    }

    if (failedNames.length === 0) {
        console.log("🎉 太棒了，扫描完毕，没有发现任何损坏或失败的头像！");
        return;
    }

    console.log(`发现 ${failedNames.length} 个头像下载失败，准备启动修补程序...\n`);

    console.log("2. 正在获取最新的主播 ID 映射表...");
    let nameToMid = {};
    try {
        const shortRes = await axios.get('https://api.vtbs.moe/v1/short', { timeout: 15000 });
        for (const vtb of shortRes.data) {
            const safeName = vtb.uname.replace(/,/g, '，');
            nameToMid[safeName] = vtb.mid;
        }
    } catch (e) {
        console.error("获取基础列表失败，无法继续修补: ", e.message);
        return;
    }

    console.log("3. 开始逐个突破重新下载...\n");
    let fixedCount = 0;
    let finalFailedCount = 0;

    for (let i = 0; i < failedNames.length; i++) {
        const name = failedNames[i];
        const avatarPath = path.join(AVATAR_DIR, `${name}.jpg`);
        const mid = nameToMid[name];
        
        let success = false;

        if (mid) {
            // 对每个失败的头像最多重试 3 次
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const safeDisplay = name.substring(0, 10).padEnd(10, ' ');
                    drawProgressBar(i, failedNames.length, `正在修补: ${safeDisplay} (尝试 ${attempt}/3)`);

                    // 获取详细信息中的头像链接
                    const detailRes = await axios.get(`https://api.vtbs.moe/v1/detail/${mid}`, { timeout: 10000 });
                    let url = detailRes.data.face;

                    if (!url) throw new Error("API未返回头像地址");

                    // 【核心修复】：B站有时返回 http，会导致 axios 或后续跨域问题，强制换成 https
                    if (url.startsWith('http://')) {
                        url = url.replace('http://', 'https://');
                    }

                    // 【核心修复】：加上极其逼真的请求头，彻底绕过 B 站图片服务器的 403 拦截
                    const response = await axios({ 
                        url, 
                        responseType: 'stream', 
                        timeout: 10000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                            'Referer': 'https://www.bilibili.com/',
                            'Origin': 'https://www.bilibili.com/'
                        }
                    });

                    const writer = fs.createWriteStream(avatarPath);
                    response.data.pipe(writer);
                    
                    await new Promise((resolve, reject) => {
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });

                    // 检查下载下来的是否还是小于 500 字节的假图
                    const newStats = fs.statSync(avatarPath);
                    if (newStats.size > 500) {
                        success = true;
                        fixedCount++;
                        break; // 成功则跳出重试循环
                    } else {
                        throw new Error("下载到的图片依然无效");
                    }
                } catch (err) {
                    await sleep(1000 * attempt); // 失败退避 1s, 2s, 3s
                }
            }
        }

        if (!success) {
            finalFailedCount++;
            // 这里就不覆盖了，保留原来的 70 字节兜底灰图
        }
    }

    drawProgressBar(failedNames.length, failedNames.length, "全部修补流程结束");
    console.log(`\n\n✅ 修补报告：`);
    console.log(`成功修复：${fixedCount} 个头像`);
    console.log(`依然失败：${finalFailedCount} 个头像`);
    
    if (finalFailedCount > 0) {
        console.log(`\n注：依然失败的头像可能是因为该主播已经注销B站账号、被封禁，或由于系统历史遗留问题导致其头像在 B 站图片库中彻底丢失（返回 404）。保留灰色透明占位符是最佳方案。`);
    }
}

retryFailedAvatars();
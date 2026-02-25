const axios = require('axios');
const fs = require('fs');

async function generateList() {
    console.log("正在请求全站 Vup 完整信息...");
    try {
        const res = await axios.get('https://api.vtbs.moe/v1/info', { timeout: 30000 });
        const vtbs = res.data;

        // 按照当前粉丝量进行降序排序
        vtbs.sort((a, b) => b.follower - a.follower);

        console.log(`获取成功！当前全站共收录 ${vtbs.length} 位主播。正在生成 vup_list.csv...`);
        
        const outStream = fs.createWriteStream('vup_list.csv');
        outStream.write("mid,name,follower,face\n");
        
        for (const vtb of vtbs) {
            const safeName = vtb.uname.replace(/,/g, '，');
            outStream.write(`${vtb.mid},${safeName},${vtb.follower},${vtb.face || ''}\n`);
        }
        
        outStream.end();
        console.log("✅ vup_list.csv 生成完毕！请在表格中删减/编辑，留下你想展示的白名单。");
    } catch (e) {
        console.error("生成名单失败，请检查网络: ", e.message);
    }
}

generateList();
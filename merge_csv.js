const fs = require('fs');

console.log("开始合并 data_b.csv 到 data.csv...");

try {
    // 读取两个文件
    const data = fs.readFileSync('data.csv', 'utf-8').split('\n');
    const data_b = fs.readFileSync('data_b.csv', 'utf-8').split('\n');

    // 提取 data.csv 的表头
    const header = data[0];
    const dataLines = data.slice(1).filter(line => line.trim() !== '');

    // 提取 data_b.csv 的数据行（跳过表头）
    const data_b_lines = data_b.slice(1).filter(line => line.trim() !== '');

    console.log(`data.csv: ${dataLines.length} 条记录`);
    console.log(`data_b.csv: ${data_b_lines.length} 条记录`);

    // 合并数据
    const mergedLines = [...dataLines, ...data_b_lines];

    // 去重：使用 Set 去除重复行
    const uniqueLines = Array.from(new Set(mergedLines));

    console.log(`合并后: ${uniqueLines.length} 条记录（已去重）`);

    // 对数据进行排序（按日期和名称）
    uniqueLines.sort((a, b) => {
        const [dateA, nameA] = a.split(',');
        const [dateB, nameB] = b.split(',');
        const dateCompare = dateA.localeCompare(dateB);
        return dateCompare !== 0 ? dateCompare : nameA.localeCompare(nameB);
    });

    // 写入合并后的文件
    const output = [header, ...uniqueLines].join('\n') + '\n';
    fs.writeFileSync('data.csv', output, 'utf-8');

    console.log("✓ 合并完成！data.csv 已更新");

} catch (error) {
    console.error("合并失败:", error.message);
    process.exit(1);
}

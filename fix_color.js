const fs = require('fs');

// 1. 读取你残缺的表格
const csvData = fs.readFileSync('baked_data.csv', 'utf-8');
const lines = csvData.split(/\r?\n/);

let colorDict = {};
let output = [];

// 2. 第一遍扫描：把所有人的颜色都记进脑子里
for (let line of lines) {
    if (!line.trim() || line.startsWith('date')) continue;
    let parts = line.split(',');
    if (parts.length >= 5) {
        let name = parts[1];
        let color = parts[4];
        if (color && color.startsWith('#')) {
            colorDict[name] = color;
        }
    }
}

// 3. 第二遍扫描：填补空白
output.push("date,name,value,inc,color"); // 写入表头
for (let i = 1; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    
    let parts = line.split(',');
    
    // 如果发现这行缺少颜色 (只有4列)
    if (parts.length < 5) {
        let name = parts[1];
        // 查字典继承颜色，实在查不到就给个默认灰
        let fallbackColor = colorDict[name] || '#777777';
        parts.push(fallbackColor);
        output.push(parts.join(','));
    } else {
        // 本来就完整的行，直接照抄
        output.push(line);
    }
}

// 4. 覆盖保存
fs.writeFileSync('baked_data_fixed.csv', output.join('\n'), 'utf-8');
console.log('✅ 颜色继承修复完成！生成了完美的 baked_data_fixed.csv，赶紧去前端试试吧！');
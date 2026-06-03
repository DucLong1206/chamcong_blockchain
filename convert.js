const fs = require('fs');
const marked = require('marked');
const HTMLtoDOCX = require('html-to-docx');

async function createDocx() {
    console.log("Đang gộp các tệp markdown...");
    const part1 = fs.readFileSync('bao_cao_bai_tap_lon.md', 'utf8');
    const part2 = fs.readFileSync('append.md', 'utf8');
    const fullMarkdown = part1 + '\n\n' + part2;
    
    console.log("Đang chuyển đổi sang HTML...");
    // Convert Markdown to HTML
    const htmlContent = marked.parse(fullMarkdown);
    
    // Add some inline styles to make it look like a standard report
    const styledHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; text-align: justify;">
            <div style="text-align: center; margin-bottom: 50px;">
                <h1>BÁO CÁO BÀI TẬP LỚN</h1>
                <h2>ĐỀ TÀI: XÂY DỰNG HỆ THỐNG CHẤM CÔNG ỨNG DỤNG CÔNG NGHỆ BLOCKCHAIN</h2>
            </div>
            ${htmlContent}
        </body>
        </html>
    `;

    console.log("Đang tạo file DOCX. Quá trình này có thể mất vài giây...");
    
    try {
        const fileBuffer = await HTMLtoDOCX(styledHtml, null, {
            table: { row: { cantSplit: true } },
            footer: true,
            pageNumber: true,
            font: 'Times New Roman',
            fontSize: 26, // 13pt
            margins: {
                top: 1440, // 1 inch
                right: 1440,
                bottom: 1440,
                left: 1440
            }
        });

        fs.writeFileSync('Bao_Cao_BTL_Cham_Cong_Blockchain.docx', fileBuffer);
        console.log("✔️ Thành công! Đã tạo file: Bao_Cao_BTL_Cham_Cong_Blockchain.docx");
        
        // Save full markdown too
        fs.writeFileSync('bao_cao_full.md', fullMarkdown);
        
    } catch (error) {
        console.error("❌ Lỗi khi tạo file DOCX:", error);
    }
}

createDocx();

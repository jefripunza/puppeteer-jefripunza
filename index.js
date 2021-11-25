const express = require('express')
const app = express()
const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
    console.log('Listening on port ', PORT);
});

const puppeteer = require('puppeteer')
const cheerio = require("cheerio")

const generateScreenshot = async (url) => {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ]
        })
        const page = await browser.newPage()
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en'
        });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36');
        await page.goto(url);
        await page.setViewport({ width: 1920, height: 1080 })
        const image = await page.screenshot({ encoding: 'base64' })
        browser.close()
        return image
    } catch (err) {
        console.error(err.response)
    }
}
const getHTML = async (url) => {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ]
        })
        const page = await browser.newPage()
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en'
        });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36');
        await page.goto(url, { waitUntil: 'networkidle0' });
        const html = await page.evaluate(() => document.querySelector('*').outerHTML);
        browser.close()
        return html
    } catch (err) {
        console.error(err.response)
    }
}



app.get('/screenshot', async (req, res, next) => {
    const { url } = req.query;
    if (url !== undefined) {
        let screenshot = await generateScreenshot(url);
        let img = Buffer.from(screenshot, 'base64');
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': img.length
        });
        return res.end(img);
    } else {
        return res.status(409).send({
            success: false,
            message: 'URL require!',
        })
    }
});

app.get('/html', async (req, res, next) => {
    const { url } = req.query;
    if (url !== undefined) {
        const html = await getHTML(url);
        return res.status(200).json({
            html,
        });
    } else {
        return res.status(409).send({
            success: false,
            message: 'URL require!',
        })
    }
});

app.get('/hargaemas', async (req, res, next) => {
    console.log("Request...");
    const html = await getHTML("https://www.logammulia.com/id/harga-emas-hari-ini");
    const $ = await cheerio.load(html)
    const result = [];
    let tentang = ""
    $('body > section.section-padding.n-no-padding-top > div > div:nth-child(3) > table:nth-child(3) > tbody > tr')
        .each(function (i, b) {
            if (i > 0) {
                const check_tentang = $(b).find('th').text()
                if (String(check_tentang).length > 0) {
                    tentang = check_tentang
                } else {
                    const berat = $(b).find('td:nth-child(1)').text()
                    const harga_dasar = $(b).find('td:nth-child(2)').text()
                    const harga_npwp = $(b).find('td:nth-child(3)').text()
                    const harga_non_npwp = $(b).find('td:nth-child(4)').text()
                    result.push({
                        tentang,
                        berat,
                        harga_dasar,
                        harga_npwp,
                        harga_non_npwp,
                    })
                }
            }
        })
    return res.status(200).json({
        result,
    });
});

app.get('*', async (req, res, next) => {
    return res.status(200).json({
        message: "Welcome cox",
    });
});
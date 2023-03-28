const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const unidecode = require('unidecode');
const path = require('path');

async function genres() {
    const url = 'https://nettruyenco.vn/';
    const response = await axios.get(url);
    const html = response.data;

    // Sử dụng cheerio để phân tích cú pháp HTML
    const $ = cheerio.load(html);

    // Tìm các title của truyện và lưu chúng vào một mảng
    const titles = [];
    $('ul.megamenu li div.clearfix li a').each((i, el) => {
        const title = $(el).text().trim();
        const slug = unidecode(title).toLowerCase().split(" ").join("-")
        titles.push({
            name: title,
            slug: slug
        });
    });

    saveToJSON(titles, "genre.json")
}

const saveToJSON = (data, filename) => {
    fs.writeFile(filename, JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`Data written to ${filename}`);
    });
}

const downloadImage = async (imageUrl, fileName) => {
    const response = await axios.get(imageUrl, { responseType: 'stream' });
    const folderPath = path.join(__dirname, 'image');
    const filePath = path.join(folderPath, fileName);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }
    response.data.pipe(fs.createWriteStream(filePath));
}

const comics = async () => {
    const url = 'https://nettruyenco.vn/';
    const response = await axios.get(url);
    const html = response.data;

    const $ = cheerio.load(html);
    let comicUrls = []
    let comicData = []

    $('div.item div.image a').each((i, el) => {
        const link = $(el).attr('href');
        comicUrls.push(link);
    });

    for (const link of comicUrls) {
        const response = await axios.get(link);
        const html = response.data;
        const $ = cheerio.load(html);
        const name = $('.title-detail').text().trim();
        let author = $('.author p.col-xs-8').text().trim();
        if (author == "Đang Cập Nhật") author = null
        const summary = $('p.shortened').text().trim()
        let status = $('.status p.col-xs-8').text().trim()
        let other_name = $('.other-name p.col-xs-8').text().trim()
        if (status == "Đang Cập Nhật") status = 'updating'
        genres = []
        $('.kind a').each((i, el) => {
            const genre = $(el).text();
            genres.push(unidecode(genre).toLowerCase().split(" ").join("-"))
        });

        const imageUrl = $('.detail-info .col-image').find('img').attr('src');
        const imageName = imageUrl.split('/').pop();
        downloadImage(imageUrl, imageName)

        let comic = {
            name: name,
            other_name,
            author,
            status,
            summary,
            image: imageName,
        }

        comicData.push(comic);
    }

    saveToJSON(comicData, "comic.json")

}

comics()
genres()

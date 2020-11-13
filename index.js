const fetch = require('node-fetch');
const cheerio = require('cheerio');
const config = require('./config.json')
const fs = require('fs')
const request = require('request');
const FormData = require('form-data');
const Canvas = require('canvas');
const { resolve } = require('path');
const convertapi = require('convertapi')('Ta1PCAJOcqXH03M4');

async function addPhoto(name, type, group, album) {
    return new Promise((resolve, reject) => {
        let headers = new URLSearchParams();
        headers.append("group_id", group)
        headers.append("album_id", album)
        fetch("https://api.vk.com/method/photos.getUploadServer?"+headers+"&access_token="+config.access_token+"&v=5.124").then(async data => {
            const result = await data.json()
            const url = result["response"]["upload_url"]
    
            const file = fs.createReadStream(name);
            const form = new FormData();
            form.append('file', file);
    
            fetch(url, {method:'POST', body: form}).then(async res => {
                const response = await res.json()
    
                let headers = new URLSearchParams();
                headers.append("group_id", response["gid"])
                headers.append("album_id", response["aid"])
                headers.append("photos_list", response["photos_list"])
                headers.append("server", response["server"])
                headers.append("hash", response["hash"])
        
                fetch("https://api.vk.com/method/photos.save?"+headers+"&access_token="+config.access_token+"&v=5.124").then(async res => {
                    const data = await res.json()
                    console.log(name+' успешно сохранено! '+data.response[0].id)
                    resolve(data.response[0].id)
                })
            })
        })
    })
}

function addPost(photo_id, group_id) {
    const headers = new URLSearchParams();
    console.log(`photo${group_id}_${photo_id}`)

    headers.append("owner_id", "-197035550")
    headers.append("message", "dfadfs")
    headers.append("from_group", 1)
    headers.append("attachments", `photo-${group_id}_${photo_id}`)

    fetch("https://api.vk.com/method/wall.post?"+headers+"&access_token="+config.access_token+"&v=5.124").then(async data => {
        console.log(await data.text())
    })
}

function getAttach(url, file_name) {
    return new Promise((resolve) => {
        fetch(url).then(async response => {
            var type = ''
            switch(response.headers['content-type']) {
                case "image/webp":
                    type = "webp"
                break;
                case "image/png":
                    type = "png"
                break;
                default:
                    type = "jpg"
                break;
            }

            let name = file_name + "." + type
            let file = fs.createWriteStream(name);
            response.body.pipe(file)
            console.log('CHANGE')
            await changeImage(name, type)
            resolve(name, response.headers['content-type'])
        })
    })
}

function getImages(id) {
    const headers = new URLSearchParams();

    headers.append("owner_id", id)
    headers.append("count", "10")

    fetch("https://api.vk.com/method/wall.get?"+headers+"&access_token="+config.access_token+"&v=5.124").then(async data => {
        const response = await data.json()
        response.response.items.forEach(async item => {
            item.attachments.forEach(async gallery => {
                var image = gallery.photo.sizes
                image = image[image.length - 1]
                let width = image.width
                let height = image.height
                let url = image.url
                console.log(url)
                getAttach(url, config.name).then((name, type) => {
                    addPhoto(name, type, config.group, config.album).then((photo_id) => {
                        //addPost(photo_id, config.group)
                    })
                })

            })
            console.log("=======================");
        })
    })
}

getImages("-82847658")

function changeImage(name, type) {
    return new Promise(async resolve => {
        const canvas = Canvas.createCanvas(500, 600);
        const ctx = canvas.getContext('2d');

        convertapi.convert('jpg', {
            File: 'photo.jpg'
        }, 'jpg').then(async function(result) {
            result.saveFiles('./');

            const background = await Canvas.loadImage('photo.jpg');
            ctx.scale(1.3, 1.3);
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    
            fs.writeFileSync('photo.jpg', canvas.toBuffer())
            resolve()
        });
    })
}
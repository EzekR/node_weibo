const crawler = require('./user_crawler');
const db = require('./db');
const moment = require('moment');

async function one_loop(ids) {
    let _crawler = new crawler();
    let cookie = await db.get_random_cookie_from_redis();
    let agent = await db.get_random_agent_from_redis();
    console.log('current cookie:', cookie);
    console.log('current agent:', agent);
    ids.forEach((item) => {
        console.log(item);
        _crawler.get_html(item.url+'?filter=1', cookie, agent).then((html) => {
            let time_stamp = moment().unix();
            db.save_data_to_redis('pages', item.url+'_page1'+'_'+time_stamp, html.toString());
            _crawler.crawl_to_date(item.url, item.url+'?filter=1', '2019-12-20', cookie);
        }).catch((err) => {
            console.log(err);
            db.record_failed_uris(item.url+'?filter=1');
        })
    })
}

function sleeper(duration) {
    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    })
}

(async () => {
    // test 1000 users
    let ids = await db.get_user_id_from_db(100, 0);
    for(let i=0; i<10; i++) {
        let chunk = ids.slice(i*10, (i+1)*10);
        await one_loop(chunk);
        await sleeper(3000);
        console.log('run again')
    }
})();

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
    let ids = await db.get_user_id_from_db(100, 100);
    // set concurrency
    let concurrency = 10;
    let start = 0;
    let event_loop = setInterval(() => {
        db.get_net_lock().then((lock) => {
            if (lock == '0') {
                let chunk = ids.slice(start, start+concurrency);
                one_loop(chunk);
                start = start+concurrency;
                if (start > 100) {
                    clearInterval(event_loop);
                    console.log('stop crawling');
                }
            } else {
                console.log('still requesting, wait...');
            }
        })
    }, 1000);
})();

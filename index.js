const crawler = require('./user_crawler');
const db = require('./db');
const moment = require('moment');

async function one_loop(ids) {
    let _crawler = new crawler();
    //let cookie = await db.get_random_cookie_from_redis();
    let cookie = 'SSOLoginState=1583344638; SUHB=0ebdodgHdNw-mn; _T_WM=82306323567; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9W5fX6lDTH2lIH6F84L5R1pg5JpX5KzhUgL.FoM0eoM01h.4SKe2dJLoIpHKUbH8SFHFBEHFBEH8SbHFeFHFSh2t; SUB=_2A25zW5uuDeRhGeFN6VUS-CfFzj-IHXVQpyXmrDV6PUJbktAKLRjckW1NQFrC1hHNGJR26358P8FrFEjLonyxYEUR; MLOGIN=1';
    //let agent = await db.get_random_agent_from_redis();
    let agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:73.0) Gecko/20100101 Firefox/73.0';
    console.log('current cookie:', cookie);
    console.log('current agent:', agent);
    ids.forEach((item) => {
        console.log(item);
        _crawler.get_html(item.url+'?filter=1', cookie, agent).then((html) => {
            let time_stamp = moment().unix();
            db.save_data_to_redis('pages', item.url+'_page1'+'_'+time_stamp, html.toString());
            _crawler.crawl_to_date(item.url, item.url+'?filter=1', '2019-12-20', cookie, agent);
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

function genarate_random_int() {
    let random_list = [];
    for(let i=0; i<1000; i++) {
        let _rand = Math.floor(Math.random()*280000);
        random_list.push(_rand);
    }
    return random_list;
}

(async () => {
    // get sample
    let random_ids = await db.get_random_users_from_db(200);
    console.log(random_ids);
    // test 1000 users
    //let ids = await db.get_user_id_from_db(100, 100);
    //// set concurrency
    let concurrency = 10;
    let start = 0;
    let event_loop = setInterval(() => {
        db.get_net_lock().then((lock) => {
            if (lock == '0') {
                let chunk = random_ids.slice(start, start+concurrency);
                one_loop(chunk);
                start = start+concurrency;
                if (start > 200) {
                    clearInterval(event_loop);
                    console.log('stop crawling');
                }
            } else {
                console.log('still requesting, wait...');
            }
        })
    }, 2000);
})();

const crawler = require('./user_crawler');
const db = require('./db');
const moment = require('moment');

(async () => {
    let _crawler = new crawler();
    let ids = await db.get_user_id_from_db(100, 0);
    let cookie = await db.get_random_cookie_from_redis();
    let agent = await db.get_random_agent_from_redis();
    ids.forEach((item) => {
        console.log(item);
        _crawler.get_html(item.url+'?filter=1', cookie, agent).then((html) => {
            let time_stamp = moment().unix();
            db.save_data_to_redis('pages', item.url+'_page1'+'_'+time_stamp);
            _crawler.crawl_to_date(item.url, item.url+'?filter=1', '2019-12-20');
        }).catch((err) => {
            console.log(err);
        })
    })
})();
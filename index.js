const rp = require('request-promise');

function isReadable(item) {
    if (item == undefined || typeof item == 'undefined' || item == null) {
        return false
    } else {
        return true
    }
}

(() => {
    rp('https://m.weibo.cn/api/container/getIndex?containerid=100103type%3D1%26q%3D%E5%86%A0%E7%8A%B6%E7%97%85%E6%AF%92&page_type=searchall').then((result) => {
        let data = JSON.parse(result);
        let contents = data.data.cards;
        let extract = contents.map((item, index) => {
            return item.card_type==9?{
                'wb_id': item.mblog.id,
                'create_time': item.mblog.created_at,
                'user_name': item.mblog.user.screen_name,
                'wb_content': item.mblog.text,
                'reposts_count': item.mblog.reposts_count,
                'comments_count': item.mblog.comments_count,
                'attitudes_count': item.mblog.attitudes_count
            }:null;
        });
        console.log(extract);
    }).catch((err) => {
        console.log(err);
    })
})();
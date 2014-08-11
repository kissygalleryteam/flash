/**
 * @fileOverview Flash 鍏ㄥ眬闈欐€佺被
 * @author kingfo<oicuicu@gmail.com>
 */
KISSY.add('kg/flash/2.0.0/base', function(S) {

    return {
        /**
         * flash 瀹炰緥 map { '#id': elem, ... }
         * @static
         */
        swfs: { },
        length: 0,
        version:"1.3"
    };

});
/**
 * @fileOverview 灏� swf 宓屽叆鍒伴〉闈腑
 * @author kingfo<oicuicu@gmail.com>, 灏勯洉<lifesinger@gmail.com>
 */
KISSY.add('kg/flash/2.0.0/embed', function(S,UA,DOM,Flash,JSON) {

    var
        SWF_SUCCESS = 1,
        FP_LOW = 0,
        FP_UNINSTALL = -1,
    //TARGET_NOT_FOUND = -2,  // 鎸囧畾 ID 鐨勫璞℃湭鎵惧埌
        SWF_SRC_UNDEFINED = -3, // swf 鐨勫湴鍧€鏈寚瀹�

        RE_FLASH_TAGS = /^(?:object|embed)/i,
        CID = 'clsid:d27cdb6e-ae6d-11cf-96b8-444553540000',
        TYPE = 'application/x-shockwave-flash',
        FLASHVARS = 'flashvars', EMPTY = '', SPACE =' ',
        PREFIX = 'ks-flash-', ID_PRE = '#', EQUAL = '=', DQUOTA ='"',
    //SQUOTA  = "'",
        LT ='<', GT='>',
        CONTAINER_PRE = 'ks-flash-container-',
        OBJECT_TAG = 'object',
        EMBED_TAG = 'embed',
        OP = Object.prototype,
        encode = encodeURIComponent,


    // flash player 鐨勫弬鏁拌寖鍥�
        PARAMS = {
            ////////////////////////// 楂橀鐜囦娇鐢ㄧ殑鍙傛暟
            //flashvars: EMPTY,     // swf 浼犲叆鐨勭涓夋柟鏁版嵁銆傛敮鎸佸鏉傜殑 Object / XML 鏁版嵁 / JSON 瀛楃涓�
            wmode: EMPTY,
            allowscriptaccess: EMPTY,
            allownetworking: EMPTY,
            allowfullscreen: EMPTY,
            ///////////////////////// 鏄剧ず 鎺у埗 鍒犻櫎
            play: 'false',
            loop: EMPTY,
            menu: EMPTY,
            quality: EMPTY,
            scale: EMPTY,
            salign: EMPTY,
            bgcolor: EMPTY,
            devicefont: EMPTY,
            hasPriority:EMPTY,
            /////////////////////////	鍏朵粬鎺у埗鍙傛暟
            base: EMPTY,
            swliveconnect: EMPTY,
            seamlesstabbing: EMPTY
        },



        defaultConifg = {
            //src: '',       // swf 璺緞
            params: { },     // Flash Player 鐨勯厤缃弬鏁�
            attrs: {         // swf 瀵瑰簲 DOM 鍏冪礌鐨勫睘鎬�
                width: 215,	 // 鏈€灏忔帶鍒堕潰鏉垮搴�,灏忎簬姝ゆ暟瀛楀皢鏃犳硶鏀寔鍦ㄧ嚎蹇€熷畨瑁�
                height: 138  // 鏈€灏忔帶鍒堕潰鏉块珮搴�,灏忎簬姝ゆ暟瀛楀皢鏃犳硶鏀寔鍦ㄧ嚎蹇€熷畨瑁�
            },
            //xi: '',	     //	蹇€熷畨瑁呭湴鍧€銆傚叏绉� express install  // ? 榛樿璺緞
            version: 9       //	瑕佹眰鐨� Flash Player 鏈€浣庣増鏈�
        };


    S.mix(Flash, {

        fpv: UA.fpv,

        fpvGEQ: UA.fpvGEQ,


        /**
         * 娣诲姞 SWF 瀵硅薄
         * @param target {String|HTMLElement}  #id or element
         */
        add: function(target, config, callback) {
            var xi, id , isDynamic, nodeName;
            // 鏍囧噯鍖栭厤缃俊鎭�
            config = Flash._normalize(config);

            // 鍚堝苟閰嶇疆淇℃伅
            config = S.merge(defaultConifg, config);
            config.attrs = S.merge(defaultConifg.attrs, config.attrs);

            // 杩囨护 ID 鍓嶇紑
            id = pureId(target);

            // 1. target 鍏冪礌鏈壘鍒� 鍒欒嚜琛屽垱寤轰竴涓鍣�
            if (!(target = DOM.get(target))) {
                target = DOM.create('<div id='+ id +'/>');
                DOM.prepend(target,S.Env.host.document.body); // 鍦ㄥ彲瑙嗗尯鍩� 鎵嶈兘鏈夋縺娲� flash 榛樿琛屼负鏇存敼鑷崇洿鎺ユ縺娲�
                //document.body.appendChild(target);
            }

            nodeName = target.nodeName.toLowerCase();

            // 鍔ㄦ€佹爣璁�   渚涘悗缁墿灞曚娇鐢�
            // 鍦� callback(config) 鐨�  config.dynamic 搴旂敤
            isDynamic = !RE_FLASH_TAGS.test(nodeName);

            // 淇濆瓨 瀹瑰櫒id, 娌℃湁鍒欒嚜鍔ㄧ敓鎴�
            if (!target.id) target.id = S.guid(CONTAINER_PRE);
            id = target.id;

            // 淇濆瓨 Flash id , 娌℃湁鍒欒嚜鍔ㄧ敓鎴�
            if (!config.id) config.id = S.guid(PREFIX);
            config.attrs.id = config.id;

            // 2. flash 鎻掍欢娌℃湁瀹夎
            if (!UA.fpv()) {
                Flash._callback(callback, FP_UNINSTALL, id, target,isDynamic);
                return;
            }

            // 3. 宸插畨瑁咃紝浣嗗綋鍓嶅鎴风鐗堟湰浣庝簬鎸囧畾鐗堟湰鏃�
            if (!UA.fpvGEQ(config.version)) {
                Flash._callback(callback, FP_LOW, id, target,isDynamic);

                // 鏈� xi 鏃讹紝灏� src 鏇挎崲涓哄揩閫熷畨瑁�
                if (!((xi = config.xi) && S.isString(xi))) return;
                config.src = xi;
            }



            // 瀵瑰凡鏈� HTML 缁撴瀯鐨� SWF 杩涜娉ㄥ唽浣跨敤
            if(!isDynamic){
                // bugfix: 闈欐€佸弻 object 鑾峰彇闂銆傚弻 Object 澶栧眰鏈� id 浣嗗唴閮ㄦ墠鏈夋晥銆�  longzang 2010/8/9
                if (nodeName == OBJECT_TAG) {
                    // bugfix: 闈欐€佸弻 object 鍦� chrome 7浠ヤ笅瀛樺湪闂锛屽浣跨敤 chrome 鍐呰儐鐨� sogou銆�2010/12/23
                    if (UA['gecko'] || UA['opera'] || UA['chrome'] > 7) {
                        target = DOM.query('object', target)[0] || target;
                    }
                }

                config.attrs.id = id;

                Flash._register(target, config, callback,isDynamic);
                return;
            }



            // src 鏈寚瀹�
            if (!config.src) {
                Flash._callback(callback, SWF_SRC_UNDEFINED, id, target,isDynamic);
                return;
            }

            // 鏇挎崲 target 涓� SWF 宓屽叆瀵硅薄
            Flash._embed(target, config, callback);

        },

        /**
         * 鑾峰緱宸叉敞鍐屽埌 S.Flash 鐨� SWF
         * 娉ㄦ剰锛岃涓嶈娣锋穯 DOM.get() 鍜� Flash.get()
         * 鍙湁鎴愬姛鎵ц杩� S.Flash.add() 鐨� SWF 鎵嶅彲浠ヨ鑾峰彇
         * @return {HTMLElement}  杩斿洖 SWF 鐨� HTML 鍏冪礌(object/embed). 鏈敞鍐屾椂锛岃繑鍥� undefined
         */
        get: function(id) {
            id = pureId(id);
            return Flash.swfs[id];
        },

        /**
         * 绉婚櫎宸叉敞鍐屽埌 S.Flash 鐨� SWF 鍜� DOM 涓搴旂殑 HTML 鍏冪礌
         */
        remove: function(id) {
            var swf = Flash.get(id);
            if (swf) {
                DOM.remove(swf);
                delete Flash.swfs[swf.id];
                Flash.length -= 1;
            }
        },

        /**
         * 妫€娴嬫槸鍚﹀瓨鍦ㄥ凡娉ㄥ唽鐨� swf
         * 鍙湁鎴愬姛鎵ц杩� S.Flash.add() 鐨� SWF 鎵嶅彲浠ヨ鑾峰彇鍒�
         * @return {Boolean}
         */
        contains: function(target) {
            var swfs = Flash.swfs,
                id, ret = false;

            if (S.isString(target)) {
                ret = (target in swfs);
            } else {
                for (id in swfs)
                    if (swfs[id] === target) {
                        ret = true;
                        break;
                    }
            }
            return ret;
        },

        _register: function(swf, config, callback,isDynamic) {
            var id = config.attrs.id;

            Flash._addSWF(id, swf);
            Flash._callback(callback, SWF_SUCCESS, id, swf,isDynamic);
        },

        _embed: function (target, config, callback) {

            target.innerHTML = Flash._stringSWF(config);

            // bugfix: 閲嶆柊鑾峰彇瀵硅薄,鍚﹀垯杩樻槸鑰佸璞�. 濡� 鍏ュ彛涓� div 濡傛灉涓嶉噸鏂拌幏鍙栧垯浠嶇劧鏄� div	longzang | 2010/8/9
            target = DOM.get(ID_PRE + config.id);

            Flash._register(target, config, callback,true);
        },

        _callback: function(callback, type, id, swf,isDynamic) {
            if (type && S.isFunction(callback)) {
                callback({
                    status: type,
                    id: id,
                    swf: swf,
                    dynamic:!!isDynamic
                });
            }
        },

        _addSWF: function(id, swf) {
            if (id && swf) {
                Flash.swfs[id] = swf;
                Flash.length += 1;
            }
        },
        _stringSWF:function (config){
            var res,
                attr = EMPTY,
                par = EMPTY,
                src = config.src,
                attrs = config.attrs,
                params = config.params,
            //id,
                k,
            //v,
                tag;



            if(UA['ie']){
                // 鍒涘缓 object

                tag = OBJECT_TAG;

                // 鏅€氬睘鎬�
                for (k in attrs){
                    if(attrs[k] != OP[k]){ // 杩囨护鍘熷瀷灞炴€�
                        if(k != "classid" && k != "data") attr += stringAttr(k,attrs[k]);
                    }
                }

                // 鐗规畩灞炴€�
                attr += stringAttr('classid',CID);

                // 鏅€氬弬鏁�
                for (k in params){
                    if(k in PARAMS) par += stringParam(k,params[k]);
                }

                par += stringParam('movie',src);

                // 鐗规畩鍙傛暟
                if(params[FLASHVARS]) par += stringParam(FLASHVARS,Flash.toFlashVars(params[FLASHVARS]));

                res = LT + tag + attr + GT + par + LT + '/' + tag + GT;
            }else{
                // 鍒涘缓 embed
                tag = EMBED_TAG;

                // 婧�
                attr += stringAttr('src',src);

                // 鏅€氬睘鎬�
                for (k in attrs){
                    if(attrs[k] != OP[k]){
                        if(k != "classid" && k != "data") attr += stringAttr(k,attrs[k]);
                    }
                }

                // 鐗规畩灞炴€�
                attr += stringAttr('type',TYPE);

                // 鍙傛暟灞炴€�
                for (k in params){
                    if(k in PARAMS) par += stringAttr(k,params[k]);
                }

                // 鐗规畩鍙傛暟
                if(params[FLASHVARS]) par += stringAttr(FLASHVARS,Flash.toFlashVars(params[FLASHVARS]));

                res = LT + tag + attr + par  + '/'  + GT;
            }
            return res
        },

        /**
         * 灏嗗璞＄殑 key 鍏ㄩ儴杞负灏忓啓
         * 涓€鑸敤浜庨厤缃€夐」 key 鐨勬爣鍑嗗寲
         */
        _normalize: function(obj) {
            var key, val, prop, ret = obj || { };

            if (S.isPlainObject(obj)) {
                ret = {};

                for (prop in obj) {
                    key = prop.toLowerCase();
                    val = obj[prop];

                    // 蹇界暐鑷畾涔変紶鍙傚唴瀹规爣鍑嗗寲
                    if (key !== FLASHVARS) val = Flash._normalize(val);

                    ret[key] = val;
                }
            }
            return ret;
        },

        /**
         * 灏嗘櫘閫氬璞¤浆鎹负 flashvars
         * eg: {a: 1, b: { x: 2, z: 's=1&c=2' }} => a=1&b={"x":2,"z":"s%3D1%26c%3D2"}
         */
        toFlashVars: function(obj) {
            if (!S.isPlainObject(obj)) return EMPTY; // 浠呮敮鎸� PlainOject
            var prop, data, arr = [],ret;

            for (prop in obj) {
                data = obj[prop];

                // 瀛楃涓诧紝鐢ㄥ弻寮曞彿鎷捣鏉� 		 [bug]涓嶉渶瑕�	longzang
                if (S.isString(data)) {
                    //data = '"' + encode(data) + '"';
                    data = encode(data);  	//bugfix:	鏈変簺鍊间簨瀹炰笂涓嶉渶瑕佸弻寮曞彿   longzang 2010/8/4
                }
                // 鍏跺畠鍊硷紝鐢� stringify 杞崲鍚庯紝鍐嶈浆涔夋帀瀛楃涓插€�
                else {
                    data = (JSON.stringify(data));
                    if (!data) continue; // 蹇界暐鎺� undefined, fn 绛夊€�

                    data = data.replace(/:"([^"]+)/g, function(m, val) {
                        return ':"' + encode(val);
                    });
                }

                arr.push(prop + '=' + data);
            }
            ret = arr.join('&');
            return ret.replace(/"/g,"'"); //bugfix: 灏� " 鏇挎崲涓� ',浠ュ厤鍙栧€间骇鐢熼棶棰樸€�  浣嗘敞鎰忚嚜杞崲涓篔SON鏃讹紝闇€瑕佽繘琛岃繕鍘熷鐞嗐€�
        }
    });

    function stringAttr(key,value){
        return SPACE + key + EQUAL + DQUOTA + value + DQUOTA;
    }

    function stringParam(key,value){
        return '<param name="' + key + '" value="' + value + '" />';
    }

    function pureId(o){
        return S.isString(o) ? o.replace(ID_PRE, '') : o;
    }

    return Flash;


}, { requires:["ua","dom","./base","json","./ua"] });

/**
 * @fileOverview flash
 */
KISSY.add("kg/flash/2.0.0/index", function (S, F) {
    S.Flash = F;
    return F;
}, {
    requires: ["./base", "./embed"]
});/**
 * @fileOverview Flash UA 鎺㈡祴
 * @author kingfo<oicuicu@gmail.com>
 */
KISSY.add('kg/flash/2.0.0/ua', function(S, UA) {

    var fpv, fpvF, firstRun = true,win=S.Env.host;

    /**
     * 鑾峰彇 Flash 鐗堟湰鍙�
     * 杩斿洖鏁版嵁 [M, S, R] 鑻ユ湭瀹夎锛屽垯杩斿洖 undefined
     */
    function getFlashVersion() {
        var ver, SF = 'ShockwaveFlash';

        // for NPAPI see: http://en.wikipedia.org/wiki/NPAPI
        if (navigator.plugins && navigator.mimeTypes.length) {
            ver = (navigator.plugins['Shockwave Flash'] || 0).description;
        }
        // for ActiveX see:	http://en.wikipedia.org/wiki/ActiveX
        else if (win.ActiveXObject) {
            try {
                ver = new ActiveXObject(SF + '.' + SF)['GetVariable']('$version');
            } catch(ex) {
                //S.log('getFlashVersion failed via ActiveXObject');
                // nothing to do, just return undefined
            }
        }

        // 鎻掍欢娌″畨瑁呮垨鏈夐棶棰樻椂锛寁er 涓� undefined
        if (!ver) return undefined;

        // 鎻掍欢瀹夎姝ｅ父鏃讹紝ver 涓� "Shockwave Flash 10.1 r53" or "WIN 10,1,53,64"
        return arrify(ver);
    }

    /**
     * arrify("10.1.r53") => ["10", "1", "53"]
     */
    function arrify(ver) {
        return ver.match(/(\d)+/g).splice(0, 3);
    }

    /**
     * 鏍煎紡锛氫富鐗堟湰鍙稭ajor.娆＄増鏈彿Minor(灏忔暟鐐瑰悗3浣嶏紝鍗�3浣�)淇鐗堟湰鍙稲evision(灏忔暟鐐瑰悗绗�4鑷崇8浣嶏紝鍗�5浣�)
     * ver 鍙傛暟涓嶇鍚堥鏈熸椂锛岃繑鍥� 0
     * numerify("10.1 r53") => 10.00100053
     * numerify(["10", "1", "53"]) => 10.00100053
     * numerify(12.2) => 12.2
     */
    function numerify(ver) {
        var arr = S.isString(ver) ? arrify(ver) : ver, ret = ver;
        if (S.isArray(arr)) {
            ret = parseFloat(arr[0] + '.' + pad(arr[1], 3) + pad(arr[2], 5));
        }
        return ret || 0;
    }

    /**
     * pad(12, 5) => "00012"
     * ref: http://lifesinger.org/blog/2009/08/the-harm-of-tricky-code/
     */
    function pad(num, n) {
        var len = (num + '').length;
        while (len++ < n) {
            num = '0' + num;
        }
        return num;
    }

    /**
     * 杩斿洖鏁版嵁 [M, S, R] 鑻ユ湭瀹夎锛屽垯杩斿洖 undefined
     * fpv 鍏ㄧО鏄� flash player version
     */
    UA.fpv = function(force) {
        // 鑰冭檻 new ActiveX 鍜� try catch 鐨� 鎬ц兘鎹熻€楋紝寤惰繜鍒濆鍖栧埌绗竴娆¤皟鐢ㄦ椂
        if (force || firstRun) {
            firstRun = false;
            fpv = getFlashVersion();
            fpvF = numerify(fpv);
        }
        return fpv;
    };

    /**
     * Checks fpv is greater than or equal the specific version.
     * 鏅€氱殑 flash 鐗堟湰妫€娴嬫帹鑽愪娇鐢ㄨ鏂规硶
     * @param ver eg. "10.1.53"
     * <code>
     *    if(S.UA.fpvGEQ('9.9.2')) { ... }
     * </code>
     */
    UA.fpvGEQ = function(ver, force) {
        if (firstRun) UA.fpv(force);
        return !!fpvF && (fpvF >= numerify(ver));
    };

}, { requires:["ua"] });

/**
 * NOTES:
 *
 -  ActiveXObject JS 灏忚
 -    newObj = new ActiveXObject(ProgID:String[, location:String])
 -    newObj      蹇呴渶    鐢ㄤ簬閮ㄧ讲 ActiveXObject  鐨勫彉閲�
 -    ProgID      蹇呴€�    褰㈠紡涓� "serverName.typeName" 鐨勫瓧绗︿覆
 -    serverName  蹇呴渶    鎻愪緵璇ュ璞＄殑搴旂敤绋嬪簭鐨勫悕绉�
 -    typeName    蹇呴渶    鍒涘缓瀵硅薄鐨勭被鍨嬫垨鑰呯被
 -    location    鍙€�    鍒涘缓璇ュ璞＄殑缃戠粶鏈嶅姟鍣ㄧ殑鍚嶇О

 -  Google Chrome 姣旇緝鐗瑰埆锛�
 -    鍗充娇瀵规柟鏈畨瑁� flashplay 鎻掍欢 涔熷惈鏈€鏂扮殑 Flashplayer
 -    ref: http://googlechromereleases.blogspot.com/2010/03/dev-channel-update_30.html
 *
 */
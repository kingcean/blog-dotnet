// Simple blog engine.
var site = {};
(function(site) {

    var rootContext;
    var info = {};

    function clearArray(arr) {
        while (arr.length > 0) arr.pop();
    }

    function genHeadItem(ele) {
        return {
            text: ele.innerText,
            scroll() {
                ele.scrollIntoView({ behavior: "smooth" });
            }
        };
    }

    function genHeadModel(item, sub) {
        var text = item.text;
        if (sub) text = "·　" + text;
        return {
            tagName: "li",
            children: [{
                tagName: "a",
                props: { href: "javascript:void(0)" },
                on: {
                    click(ev) {
                        if (typeof item.scroll === 'function') item.scroll();
                    }
                },
                children: item.text
            }]
        }
    }

    function getHeadings(ele) {
        var col = [];
        var names = ["h1", "h2", "h3", "h4", "h5", "h6"];
        var offset = 0;
        var eles = ele.getElementsByTagName(names[offset]);
        if (!eles || eles.length < 1) {
            offset++;
            eles = ele.getElementsByTagName(names[offset]);
            if (!eles || eles.length < 1) {
                offset++;
                eles = ele.getElementsByTagName(names[offset]);
                if (!eles || eles.length < 1) {
                    offset++;
                    eles = ele.getElementsByTagName(names[offset]);
                }

                if (!eles || eles.length < 1) {
                    offset++;
                    eles = ele.getElementsByTagName(names[offset]);
                }
            }
        }

        if (!eles || eles.length < 1) return col;
        offset++;
        for (var i = 0; i < eles.length; i++) {
            var item = eles[i];
            if (!item) continue;
            var v = genHeadItem(item);
            col.push(v);
            var sub = item.getElementsByTagName(names[offset]);
            if (!sub || sub.length < 1) {
                var offset2 = offset + 1;
                if (offset2 <= names.lenght) sub = item.getElementsByTagName(names[offset2]);
                if (!sub || sub.length < 1) continue;
            }

            v.items = [];
            for (var j = 0; j < sub.length; j++) {
                var subItem = sub[j];
                if (!subItem) continue;
                v.items.push(genHeadItem(subItem));
            }
        }

        return col;
    }

    function getChildModel(key) {
        try {
            return rootContext.childContext(key).model();
        } catch (ex) { }
        return undefined;
    }

    function setChildChildren(key, children) {
        var m = getChildModel(key);
        if (m) m.children = children;
        return m;
    }

    function refreshChild(key) {
        try {
            return rootContext.childContext(key).refresh();
        } catch (ex) { }
    }

    function genNotification(value) {
        return setChildChildren("content", [
            { tagName: "em", children: value }
        ]);
    }

    function resetContentMenu() {
        var m = getChildModel("cntMenu");
        if (!m) return undefined;
        m.children = [];
        m.style = { display: "none" };
        delete m.data;
        return m
    }

    function renderArticle(id) {
        var context = rootContext;
        if (!context) return;
        resetContentMenu();
        setChildChildren("note", undefined);
        var item;
        if (id) {
            var list = info.list;
            for (var i in list) {
                var ele = list[i];
                if (!ele || ele.id !== id) continue;
                item = ele;
                break;
            }
        }

        if (!item || item.invalid) {
            setChildChildren("title", info.name);
            var cnt = getChildModel("content");
            if (cnt) {
                delete cnt.data;
                cnt.styleRefs = "x-part-blog-menu";
                cnt.children = [{
                    tagName: "ul",
                    styleRefs: "link-tile-compact",
                    children: genMenu()
                }];
            }

            context.refresh();
            return;
        }

        setChildChildren("title", item.name);
        genNotification("Loading…");
        context.refresh();
        var relaPath = "/blog";
        try {
            if (location.pathname.endsWith("/blog/")) relaPath = ".";
        } catch (ex) {}
        $.get(relaPath + item.url).then(function (r2) {
            r2 = r2.replace(/\(.\//g, "(" + relaPath + item.dir + "/");
            var noteEles = [];
            if (typeof item.date === "string" && item.date.length > 7 && item.date.indexOf("-") < 0) {
                var time = new Date(parseInt(item.date.substring(0, 4)), parseInt(item.date.substring(4, 6)) - 1, parseInt(item.date.substring(6, 8)));
                if (!isNaN(time)) noteEles.push({
                    tagName: "time",
                    props: {
                        datetime: time.getFullYear().toString(10) + "-" + (time.getMonth() + 1).toString(10) + "-" + time.getDate().toString(10)
                    },
                    children: time.toLocaleDateString()
                });
                else noteEles.push({
                    tagName: "time",
                    props: {
                        datetime: item.date.substring(0, 4)
                    },
                    children: "'" + item.date.substring(0, 4)
                })
            }

            if (item.categories && item.categories instanceof Array && item.categories.length > 0) {
                for (var i in item.categories) {
                    var category = item.categories[i];
                    if (category) noteEles.push({
                        tagName: "span",
                        children: category
                    });
                }
            }

            setChildChildren("note", noteEles);
            var cnt = getChildModel("content");
            if (cnt) {
                cnt.data = r2;
                delete cnt.styleRefs;
                delete cnt.children;
            }

            context.refresh();
        }, function (r) {
            clearArray(model);
            genNotification("Load failed.");
            context.refresh();
        });
    }

    function genMenu() {
        var col = [];
        if (!info.list) return col;
        var year = null;
        info.list.forEach(function (item) {
            if (!item || item.invalid) return;
            if (typeof item.date === "string" && item.date.length > 3) {
                var y = item.date.substring(0, 4);
                if (y !== year) col.push({
                    tagName: "li",
                    styleRefs: "grouping-header",
                    children: y
                });
                year = y;
            }

            col.push({
                tagName: "li",
                children: [{
                    tagName: "a",
                    props: { href: "?" + item.id },
                    on: {
                        click(ev) {
                            if (ev.preventDefault) ev.preventDefault();
                            else ev.returnValue = false;
                            renderArticle(item.id);
                            history.pushState({ id: item.id }, "", "?" + item.id);
                        }
                    },
                    children: item.name
                }]
            });
        });
        return col;
    }

    function render() {
        if (!rootContext) return;
        var model = rootContext.model();
        if (!model) return;
        var id = site.firstQuery();
        var lang = navigator.language || navigator.userLanguage || navigator.browserLanguage || navigator.systemLanguage;
        $.get(lang.indexOf("zh") === 0 ? "zh-Hans.json" : "en.json").then(function (r) {
            if (!r || !r.list || !(r.list instanceof Array)) return;
            setChildChildren("blogTitle", r.name || "Blogs");
            r.list.reverse().forEach(function (item) {
                if (!item) return;
                if (!item.url || item.url.length < 17) {
                    item.invalid = true;
                    return;
                }

                var fileName = item.url.substring(6);
                var fileDate = item.url.substring(1, 5).replace("/", "").replace("/", "");
                var fileExtPos = fileName.indexOf(".");
                var fileExt = fileExtPos >= 0 ? fileName.substring(fileExtPos + 1) : "";
                fileName = fileExtPos > 0 ? fileName.substring(0, fileExtPos) : "";
                if (!fileName) {
                    item.invalid = true;
                    return;
                }

                if (!item.id) item.id = fileName;
                if (!item.date) item.date = fileDate;
                if (!item.type) item.type = fileExt;
                item.dir = item.url.substring(0, 5);
                if (id === fileName) curItem = item;
            });
            info.name = r.name;
            info.list = r.list;
            setChildChildren("articles", genMenu());
            renderArticle(id);
        }, function (r) {
            genNotification("Load failed.");
            rootContext.refresh();
        });
    }

    site.headings = function (ele) {
        if (!ele) return null;
        return getHeadings(ele);
    }

    site.query = function (name) {
        url = location.search;
        if (name == null)
            return null;
        try {
            if (typeof name === "string") {
                var result = url.match(new RegExp("[\?\&]" + name + "=([^\&]+)", "i"));
                if (result == null || result.length < 1) return "";
                return notToDecode ? result[1] : decodeURIComponent(result[1]);
            } else if (typeof name === "number") {
                var result = url.match(new RegExp("[\?\&][^\?\&]+=[^\?\&]+", "g"));
                if (result == null) return "";
                return notToDecode ? result[name].substring(1) : decodeURIComponent(result[name].substring(1));
            }
        }
        catch (ex) { }
        return null;
    };

    site.firstQuery = function () {
        var id = location.search;
        if (!!id && id.length > 1) {
            id = id.substring(1);
            var idEndPos = id.indexOf("?");
            if (idEndPos >= 0) id = id.substring(0, idEndPos);
            idEndPos = id.indexOf("&");
            if (idEndPos >= 0) id = id.substring(0, idEndPos);
        }

        return id;
    };

    site.head = function (ext, menu, needInsert) {
        var cntEle = document.createElement("header");
        cntEle.id = "page_head";
        cntEle.innerHTML = "<section><h1><a href=\"https://kingcean." + ext + "\"><strong>Kingcean</strong><span>." + ext + "</span></a></h1><ul>"
            + menu.map(ele => "<li><a href=\"" + ele.url + "\">" + ele.name + "</a></li>").join("")
            + "</ul></section>";
        if (needInsert) document.body.insertBefore(cntEle, document.body.children[0]);
        else document.body.appendChild(cntEle);
    };

    site.blogs = function () {
        var cntEle = document.getElementById("blog_content");
        if (!cntEle) {
            cntEle = document.createElement("section");
            cntEle.id = "blog_content";
            document.body.appendChild(cntEle);
        }

        var hasInit = rootContext != null;
        rootContext = Hje.render(cntEle, {
            children: [{
                tagName: "article",
                children: [{
                    key: "title",
                    tagName: "h1"
                }, {
                    key: "note",
                    tagName: "section",
                    styleRefs: "x-part-blog-note"
                }, {
                    key: "content",
                    tagName: "main",
                    children: [{
                        tagName: "em",
                        children: "Loading…"
                    }],
                    onInit(c) {
                        var mdEle = c.element();
                        var mdModel = c.model();
                        if (!mdEle || !mdModel || !mdModel.data) return;
                        mdEle.innerHTML = marked.parse(mdModel.data);
                        var contentMenu = getChildModel("cntMenu");
                        if (!contentMenu) return;
                        var headers = getHeadings(mdEle);
                        if (!headers || headers.length < 1) {
                            resetContentMenu();
                            return;
                        }

                        if (headers.length == 1) {
                            headers = headers[0] ? headers[0].items : undefined;
                            if (!headers || headers.length < 2) {
                                resetContentMenu();
                                return;
                            }
                        }

                        delete contentMenu.style;
                        contentMenu.children = [];
                        contentMenu.children.push({
                            tagName: "li",
                            children: [{
                                tagName: "a",
                                props: { href: "javascript:void(0)" },
                                on: {
                                    click(ev) {
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                    }
                                },
                                children: "⇮ Top"
                            }]
                        });
                        for (var i = 0; i < headers.length; i++) {
                            var menu = headers[i];
                            if (!menu || !menu.text) continue;
                            contentMenu.children.push(genHeadModel(menu));
                            if (menu.items && menu.items.length > 0) {
                                for (var j = 0; j < menu.items.length; j++) {
                                    var subMenu = menu.items[j];
                                    if (!subMenu || !subMenu.text) continue;
                                    contentMenu.children.push(genHeadModel(subMenu, true));
                                }
                            }
                        }

                        refreshChild("cntMenu");
                    }
                }]
            }, {
                tagName: "aside",
                children: [{
                    tagName: "nav",
                    children: [{
                        key: "cntMenu",
                        tagName: "ul",
                        styleRefs: "link-tile-compact",
                        children: [],
                        style: { display: "none" }
                    }, {
                        tagName: "h1",
                        children: [{
                            key: "blogTitle",
                            tagName: "a",
                            props: { href: "./" },
                            on: {
                                click(ev) {
                                    if (ev.preventDefault) ev.preventDefault();
                                    else ev.returnValue = false;
                                    renderArticle(undefined);
                                    history.pushState({}, "", "./");
                                }
                            }
                        }]
                    }, {
                        key: "articles",
                        tagName: "ul",
                        styleRefs: "link-tile-compact",
                        children: []
                    }]
                }]
            }]
        });
        render();
        if (hasInit) return;
        window.addEventListener("popstate", function (ev) {
            renderArticle(ev.state ? ev.state.id : undefined);
        });
    };
    
})(site || (site = {}));

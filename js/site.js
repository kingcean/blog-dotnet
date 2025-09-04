// Simple blog engine.
var site = {};
(function(site) {

    var rootContext;
    var info = {};

    function pushMenu(context, arr, title, list) {
        arr.push({
            tagName: "h1",
            children: title
        });
        var col = [];
        var year = null;
        list.forEach(function (item) {
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
        if (col.length > 0) arr.push({
            tagName: "ul",
            styleRefs: "link-tile-compact",
            children: col
        });
    }

    function clearArray(arr) {
        while (arr.length > 0) arr.pop();
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
            var v = {
                text: item.innerText
            };
            var sub = item.getElementsByTagName(names[offset]);
            col.push(v);
            if (!sub || sub.length < 1) continue;
            v.items = [];
            for (var j = 0; j < sub.length; j++) {
                var subItem = sub[j];
                if (!subItem) continue;
                v.items.push(subItem.innerText);
            }
        }

        return col;
    }

    function genNotification(type, children) {
        return {
            tagName: "section",
            styleRefs: "x-part-blog-" + type,
            children: [
                { tagName: "em", children: children }
            ]
        };
    }

    function renderArticle(id) {
        var context = rootContext;
        if (!context) return;
        var name = info.name;
        var list = info.list;
        var item;
        if (id) {
            for (var i in list) {
                var ele = list[i];
                if (!ele || ele.id !== id) continue;
                item = ele;
                break;
            }
        }

        var model = context.model().children;
        clearArray(model);
        if (!item || item.invalid) {
            pushMenu(context, model, name, list);
            context.refresh();
            return;
        }

        model.push({
            tagName: "h1",
            children: item.name
        });
        model.push(genNotification("note", "Loading…"));
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
                if (!isNaN(time))
                    noteEles.push({
                        tagName: "time",
                        props: {
                            datetime: time.getFullYear().toString(10) + "-" + (time.getMonth() + 1).toString(10) + "-" + time.getDate().toString(10)
                        },
                        children: time.toLocaleDateString()
                    });
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

            model.pop();
            if (noteEles.length > 0) model.push({
                tagName: "section",
                styleRefs: "x-part-blog-note",
                children: noteEles
            });
            model.push({
                tagName: "section",
                onInit(c) {
                    var mdEle = c.element();
                    if (!mdEle) return;
                    mdEle.innerHTML = marked.parse(r2);
                    var headers = getHeadings(mdEle);
                }
            });
            pushMenu(context, model, name, list);
            context.refresh();
        }, function (r) {
            clearArray(model);
            model.push({ tagName: "h1", children: item.name });
            model.push(genNotification("error", "Load failed."));
            pushMenu(context, model, name, list);
            context.refresh();
        });
    }

    function render() {
        if (!rootContext) return;
        var id = site.firstQuery();
        var lang = navigator.language || navigator.userLanguage || navigator.browserLanguage || navigator.systemLanguage;
        $.get(lang.indexOf("zh") === 0 ? "zh-Hans.json" : "en.json").then(function (r) {
            if (!r || !r.list || !(r.list instanceof Array)) return;
            var curItem;
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
            renderArticle(id);
        }, function (r) {
            var model = rootContext.model();
            if (!model) return;
            clearArray(model.children);
            model.push(genNotification("error", "Load failed."));
            rootContext.refresh();
            cntEle.innerHTML = "<section class=\"x-part-blog-error\"><em>Load failed.</em></section>";
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
        var cntEle = document.createElement("section");
        cntEle.id = "blog_content";
        document.body.appendChild(cntEle);
        var hasInit = rootContext != null;
        rootContext = Hje.render(cntEle, {
            children: [genNotification("note", "Loading…")]
        });
        render();
        if (hasInit) return;
        window.addEventListener("popstate", function (ev) {
            renderArticle(ev.state ? ev.state.id : undefined);
        });
    };
    
})(site || (site = {}));

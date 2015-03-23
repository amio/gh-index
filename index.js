/**
 * User: Amio
 * Date: 5/16/13
 */
$(function () {
    'use strict';

    String.prototype.replaceWith = function (obj) {
        return this.replace(/\{\$(\w+)\}/g, function (match, key) {
            return obj.hasOwnProperty(key) ? obj[key] : match;
        });
    };

    // Get "owner" and "repo" info
    var loc = window.location,
        repoinfo = document.body.getAttribute('data-repoinfo');
    var owner = repoinfo ? repoinfo.split('/')[0] : loc.hostname.replace(/(\w+)\.\S+/, '$1'),
        repo = repoinfo ? repoinfo.split('/')[1] :
            loc.pathname === '/' ? loc.hostname : loc.pathname.replace(/^\/([^/]+)\S+/, '$1');

    // Prepare the Github API and the Wrapper Element
    var apiSchema = 'https://api.github.com/repos/OWNER/REPO/git/trees/HEAD?recursive=1',
        wrapper = document.getElementById('gh-index');

    /**
     * Global gh-index object
     */
    var index = {

        // api url
        url: apiSchema.replace('OWNER', owner).replace('REPO', repo),

        // RegExp for files to exclude
        excludes: new RegExp(document.body.getAttribute('data-excludes')),

        /**
         * Init gh-index
         */
        init: function () {

            var cachedData = sessionStorage && sessionStorage.getItem(owner + '/' + repo);
            var treeData = cachedData && JSON.parse(cachedData);

            // Only fetch new data every 60 sec
            // to avoid github api restriction.
            if (treeData && (Date.now() - treeData.timestamp < 60000)) {
                this.onload(JSON.parse(cachedData));
            } else {
                $.ajax({
                    url: this.url,
                    success: this.onload
                });
            }

            $(window).on('hashchange', this.hashRoute);
        },

        /**
         * Everything after data loaded.
         * @param resp
         */
        onload: function (resp) {
            // build tree
            index.tree = index.genTree(resp['tree']);

            // cache request data
            resp.timestamp = Date.now();
            sessionStorage && sessionStorage.setItem(owner + '/' + repo, JSON.stringify(resp));

            // build html
            index.hashRoute();
        },

        /**
         * Route task depends on current hash
         */
        hashRoute: function () {
            var path = window.location.hash.substr(1).split('/');
            var sub = index.tree;

            while (sub && path.length && path[0]) {
                sub = sub[path.shift()];
            }

            index.updateIndexies(sub);
        },

        /**
         * Generate entire tree base on node list array return by Github API.
         * @param {Array} treeArr
         * @returns {Object}
         */
        genTree: function (treeArr) {
            var root = {};
            for (var i = treeArr.length; i--;) {
                if (!this.excludes.test(treeArr[i].path)) {
                    this.addItem(root, treeArr[i]);
                }
            }

            return root;
        },

        /**
         * Add an item into tree.
         * @param tree
         * @param item
         * @returns {*}
         */
        addItem: function (tree, item) {
            var target = 'blank', parent = tree;
            item.path.replace(/[^/]+/g, function (seg, idx) {
                parent[seg] || (parent[seg] = {});
                parent = parent[seg];
                target = seg;
                return idx;
            });

            parent['/NODE/'] = item;

            return item;
        },

        /**
         * Update list base on tree
         * @param tree
         */
        updateIndexies: function (tree) {
            // generate header html
            var path = window.location.hash.replace('#', ''),
                header = '<div class="header"><span>•_•</span></div>';
            if (path) {
                header = '<div class="header"><a class="uplink" href="{$uplink}">{$path}<span>←_←</span></a></div>'.replaceWith({
                    path: path,
                    uplink: '#' + path.replace(/[^/]+\/$/, '')
                });
            }

            // generate list html
            var tmpl = '<li class="{$type}"><a href="{$link}">{$name}</a></li>',
                list = '<ul>',
                home = 'http://' + owner + '.github.io/' + repo + '/',
                node;
            for (var item in tree) {
                if (item !== '/NODE/' && tree.hasOwnProperty(item)) {
                    node = tree[item]['/NODE/'];

                    list += tmpl.replaceWith({
                        type: node.type,
                        link: node.type === 'blob' ? (home + node.path) : '#' + node.path + '/',
                        name: node.path + (node.type === 'tree' ? '/' : '')
                    });
                }
            }
            list += '</ul>';

            // Generate footer html
            var footer = '<div class="footer"><a href="http://github.com/amio/gh-index" target="_blank">gh-index</a> ' +
                'by <a href="http://github.com/amio" target="_blank">amio</a></div>';

            // insert html
            wrapper.innerHTML = header + list + footer;
        }
    };

    // Expose gh-index
    window.index = index;

    // Init
    index.init();
});

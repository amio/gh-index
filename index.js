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

    var raf = (function(){
      return  window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              function( callback ){
                window.setTimeout(callback, 1000 / 60);
              }
    })()

    function insertStylesheet (url) {
      var link = document.createElement('link')
      link.rel = 'stylesheet'
      link.type = 'text/css'
      link.href = url
      document.head.appendChild(link)
    }

    function insertStylesheetAsync (url) {
      raf(function(){
        insertStylesheet(url)
      })
    }

    // Get "owner" and "repo" info
    var wrapper = document.getElementById('gh-index');
    var repoconfig = wrapper.getAttribute('data-repo'),
        owner, repo, branch = 'gh-pages';
    if (repoconfig) {
        owner = repoconfig.split('/')[0];
        repo = repoconfig.split('/')[1];
    } else {
        owner = window.location.hostname.replace(/(\w+)\.\S+/, '$1');
        repo = window.location.pathname.replace(/^\/([^/]+)\S+/, '$1');
    }

    // Prepare the Github API
    var apiSchema = 'https://api.github.com/repos/{$OWNER}/{$REPO}'
                  + '/git/trees/{$BRANCH}?recursive=1';

    /**
     * Global gh-index object
     */
    var index = {

        // api url
        url: apiSchema.replaceWith({
            'OWNER': owner,
            'REPO': repo,
            'BRANCH': branch
        }),

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
            var tmpl = '<li class="{$type}">'
                        + '<a href="{$link}"><span class="{$icon}"></span> {$name}</a></li>',
                list = '<ul>',
                home = 'http://' + owner + '.github.io/' + repo + '/',
                node;
            for (var item in tree) {
                if (item !== '/NODE/' && tree.hasOwnProperty(item)) {
                    node = tree[item]['/NODE/'];

                    list += tmpl.replaceWith({
                        type: node.type,
                        link: node.type === 'blob' ? (home + node.path) : '#' + node.path + '/',
                        name: node.path + (node.type === 'tree' ? '/' : ''),
                        icon: 'octicon octicon-file-' + (node.type === 'tree' ? 'directory' : 'text')
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
    insertStylesheet('http://amio.github.io/gh-index/index.css')
    insertStylesheetAsync(
      'https://octicons.github.com/components/octicons/octicons/octicons.css'
    )
    index.init();
});
